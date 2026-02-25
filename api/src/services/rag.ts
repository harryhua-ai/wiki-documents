import {
  generateEmbedding,
  generateEmbeddings,
  buildRAGPrompt,
  analyzeQueryIntent,
  generateSubQuery,
  streamChatCompletion,
  rerank,
  shouldUseAgentToolsForEmptyRAG,
  generateFollowUpSuggestions,
} from './llm.js';
import { hydeExpansion } from './hyde.js';  // HyDE 查询扩展
import { agentConfig, dbConfig, rerankerConfig } from '../config/index.js';
import { featureFlags } from '../config/feature-flags.js';  // 特性开关
// import { vectorOps } from '../lib/db.js';  // 暂时注释，未使用
import { cache } from '../lib/cache.js';
import { getCachedQueryResult, setCachedQueryResult } from '../lib/query-cache.js';
// import { QdrantVectorStore } from '../lib/vector-store/qdrant.js';  // 未使用，暂时注释
import type { VectorDocument } from '../lib/vector-store/types.js';  // 仅导入类型
import { VectorStore } from '../lib/vector.js';
import {
  planToolExecution,
  executeTool,
  formatToolResultsForLLM,
} from './agent-tools.js';
import {
  pathSelectionTotal,
  queryIntentTotal,
  rerankerSkipTotal,
} from '../lib/metrics.js';
import type {
  DocumentChunk,
  RetrievalResult,
  SourceReference,
  ChatMessage,
  QueryAnalysis,
  ToolContext,
  ToolCallSummary,
} from '../types/index.js';

// ============================================================================
// Constants
// ============================================================================

const MAX_TOOL_CALLS = 2;  // P1: 最多调用 2 次 Agent 工具（从 3 降低到 2）
const AGENT_TIMEOUT_MS = 15000;  // Agent 路径总超时 15s

// Minimum score threshold for a source to be shown
// Sources with lower scores are considered irrelevant and filtered out
// Restored to production value after debugging completed
const MIN_SOURCE_SCORE = 0.55;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Filter sources by minimum relevance score
 * Only returns sources that meet the quality threshold
 *
 * Two-stage filtering:
 * 1. Remove sources below MIN_SOURCE_SCORE (0.55)
 * 2. If 3+ sources remain, apply dynamic filtering: keep only sources within 80% of top score
 *    This ensures we only show the most relevant sources when there's a clear quality gap
 *    But avoids over-filtering when there are only 2 sources
 */
export const filterRelevantSources = (sources: SourceReference[]): SourceReference[] => {
  // Stage 1: Filter by absolute threshold
  const filtered = sources.filter(source => (source.score ?? 0) >= MIN_SOURCE_SCORE);

  // Stage 2: Dynamic filtering - only apply when we have 3+ sources
  // This prevents over-filtering when there are only 1-2 relevant sources
  if (filtered.length >= 3) {
    const topScore = Math.max(...filtered.map(s => s.score ?? 0));
    const threshold = topScore * 0.8;
    // Add small epsilon for floating-point comparison (handles 0.72 vs 0.720000001)
    const epsilon = 0.0001;
    return filtered.filter(s => (s.score ?? 0) + epsilon >= threshold);
  }

  return filtered;
};

/**
 * Detect if the AI response indicates no information was found
 * Checks for common "not found" phrases in multiple languages
 */
export const isNotFoundResponse = (content: string, language: string): boolean => {
  const lowerContent = content.toLowerCase();

  if (language === 'zh-Hans') {
    const notFoundPhrases = [
      '我在文档中找不到',
      '无法找到相关信息',
      '文档中未找到',
      '没有找到相关信息',
      '文档中没有',
      '无法在文档中找到',
    ];
    return notFoundPhrases.some(phrase => lowerContent.includes(phrase));
  } else {
    const notFoundPhrases = [
      'cannot find this information',
      'cannot find',
      'can not find',
      'cannot be found',
      'not found in the documentation',
      'i cannot find',
      'unable to find',
      'no information found',
      'documentation does not contain',
    ];
    return notFoundPhrases.some(phrase => lowerContent.includes(phrase));
  }
};

// ============================================================================
// Vector Store Factory
// ============================================================================

// Legacy SQLite store implementation for fallback/local use
// 暂时注释，未使用
/*
class SqliteVectorStore implements IVectorStore {
  private documents: Map<string, VectorDocument> = new Map();
  private loaded: boolean = false;

  async init(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    if (this.loaded) return;
    console.log(`[SQLiteVectorStore.load] Loading from DB...`);
    const rows = vectorOps.getAll();
    console.log(`[SQLiteVectorStore.load] DB returned ${rows.length} rows`);

    for (const row of rows) {
      // row.embedding 已经是 number[] 类型（由 vectorOps.getAll() 转换）
      // 不需要再次转换
      this.documents.set(row.id, {
        id: row.id,
        content: row.content,
        embedding: row.embedding,
        metadata: row.metadata,
      });
    }
    this.loaded = true;
    console.log(`Loaded ${this.documents.size} document chunks from SQLite`);
  }

  async upsert(doc: VectorDocument): Promise<void> {
    this.documents.set(doc.id, doc);
    vectorOps.upsert(
      doc.id,
      doc.content,
      doc.embedding,
      { ...doc.metadata, product_line: doc.metadata.product_line || '' },
      ''
    );
  }

  async upsertBatch(docs: VectorDocument[]): Promise<void> {
    const records = docs.map((doc) => ({
      id: doc.id,
      content: doc.content,
      embedding: doc.embedding,
      metadata: { ...doc.metadata, product_line: doc.metadata.product_line || '' },
      contentHash: '',
    }));
    for (const doc of docs) {
      this.documents.set(doc.id, doc);
    }
    vectorOps.upsertBatch(records);
  }

  async search(
    queryEmbedding: number[] | Buffer,
    _queryText: string,
    options: any = {}
  ): Promise<VectorDocument[]> {
    const { topK = 5, minScore = 0, filter } = options;
    const results: Array<{ doc: VectorDocument; score: number }> = [];

    console.log(`[SQLiteVectorStore.search] Called with topK=${topK}, minScore=${minScore}, hasFilter=${!!filter}`);
    console.log(`[SQLiteVectorStore.search] Documents in memory: ${this.documents.size}`);

    // Simple cosine similarity implementation
    const dot = (a: number[], b: number[]) => a.reduce((acc, v, i) => acc + v * b[i], 0);
    const norm = (a: number[]) => Math.sqrt(a.reduce((acc, v) => acc + v * v, 0));
    const cosineSimilarity = (a: number[], b: number[]) => dot(a, b) / (norm(a) * norm(b));

    let checkedCount = 0;
    let passedFilterCount = 0;
    let skippedShortContent = 0;

    for (const doc of this.documents.values()) {
      checkedCount++;

      // Skip chunks with very short content (likely just headings/titles)
      // 降低限制从 50 到 20 字符，保留更多英文短 chunks（如标题、规格参数）
      if (doc.content.length < 20) {
        skippedShortContent++;
        continue;
      }

      if (filter && !filter(doc)) {
        continue;
      }
      passedFilterCount++;
      const score = cosineSimilarity(queryEmbedding as number[], doc.embedding);
      if (score >= minScore) {
        results.push({ doc, score });
      }
    }

    console.log(`[SQLiteVectorStore.search] Skipped ${skippedShortContent} short chunks (<20 chars)`);
    console.log(`[SQLiteVectorStore.search] Results: ${results.length}/${passedFilterCount} docs above threshold ${minScore}`);

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(r => ({ ...r.doc, score: r.score }));
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.documents.delete(id);
    if (deleted) vectorOps.deleteById(id);
    return deleted;
  }

  async deleteByMetadata(field: string, value: string): Promise<number> {
    // Basic implementation for doc_path only as per legacy
    if (field === 'doc_path') {
      let count = 0;
      for (const [id, doc] of this.documents) {
        if (doc.metadata.doc_path === value) {
          this.documents.delete(id);
          count++;
        }
      }
      vectorOps.deleteByDocPath(value);
      return count;
    }
    return 0;
  }

  async count(): Promise<number> { return this.documents.size; }
  async clear(): Promise<void> {
    this.documents.clear();
    vectorOps.clear();
  }
}
*/

// Select vector store based on config
const storeType = dbConfig.vectorStoreType;
console.log(`[RAG INIT] Vector store type: ${storeType}`);

// 声明为 VectorStore 类型以支持 searchHybrid() 方法
export const vectorStore = new VectorStore(storeType) as VectorStore;
console.log(`[RAG INIT] Vector store instance created`);

// Initialize on import (async)
vectorStore.initialize().catch(err => console.error('Vector store init failed:', err));

// ============================================================================
// Product Detection Utilities
// ============================================================================

const PRODUCT_KEYWORDS: Record<string, string[]> = {
  ne101: ['ne101', 'neoeyes ne101', 'neoeyes-ne101'],
  ne301: ['ne301', 'neoeyes ne301', 'neoeyes-ne301'],
  neoedge: ['neoedge', 'ng4500', 'neoedge-ng'],
  neoeyes: ['neoeyes'],
};

const detectProductFromQuery = (query: string): string | undefined => {
  const lowerQuery = query.toLowerCase();
  for (const [product, keywords] of Object.entries(PRODUCT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) return product;
    }
  }
  return undefined;
};

// ============================================================================
// RAG Pipeline
// ============================================================================

/**
 * Normalize URL by removing fragment/anchor for deduplication
 * Handles both /path#anchor and /path#anchor formats
 */
const normalizeUrl = (url: string): string => {
  if (!url) return '';
  return url.split('#')[0];
};

/**
 * Truncate text to a maximum length, ending at word boundary
 */
const truncateText = (text: string, maxLength: number = 60): string => {
  if (!text || text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  // Find last word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  const lastNewline = truncated.lastIndexOf('\n');
  const boundary = Math.max(lastSpace, lastNewline);
  return (boundary > 0 ? truncated.substring(0, boundary) : truncated) + '...';
};

export const toSourceReferences = (docs: VectorDocument[]): SourceReference[] => {
  // Use a two-level deduplication strategy:
  // 1. Primary key: docPath + section (semantic deduplication)
  // 2. Secondary key: normalized URL (exact URL deduplication)
  const uniqueByKey = new Map<string, SourceReference>();
  const uniqueByUrl = new Map<string, { source: SourceReference; score: number }>();

  for (const doc of docs) {
    if (!doc.metadata.doc_url?.trim()) continue;

    // Improved deduplication key: use doc_path (unique per file) + section_title
    // This ensures same section from same doc isn't duplicated
    const docPath = doc.metadata.doc_path || doc.metadata.doc_url;
    const section = doc.metadata.section_title || '';

    // Create a more robust key that handles null/undefined sections
    const key = `${docPath}:::${section}`;
    const normalizedUrl = normalizeUrl(doc.metadata.doc_url);

    // Check if we already have this URL with a higher score
    const existingByUrl = uniqueByUrl.get(normalizedUrl);
    if (existingByUrl && (doc.score ?? 0) <= existingByUrl.score) {
      // Skip: we already have a better source for this URL
      continue;
    }

    // Determine the best title: prefer section title, fall back to doc title, truncate if too long
    const rawTitle = (doc.metadata.section_title && doc.metadata.section_title !== 'Main Content')
      ? doc.metadata.section_title
      : (doc.metadata.doc_title || 'Untitled');
    const title = truncateText(rawTitle, 80);

    if (!uniqueByKey.has(key)) {
      const newSource: SourceReference = {
        title,
        url: doc.metadata.doc_url,
        section: truncateText(doc.metadata.section_title || '', 60),
        excerpt: doc.content.substring(0, 200) + (doc.content.length > 200 ? '...' : ''),
        score: doc.score,
      };
      uniqueByKey.set(key, newSource);
      uniqueByUrl.set(normalizedUrl, { source: newSource, score: doc.score ?? 0 });
    } else {
      // If duplicate found by key, keep the one with higher score
      const existing = uniqueByKey.get(key)!;
      if ((doc.score ?? 0) > (existing.score ?? 0)) {
        const updatedSource: SourceReference = {
          title,
          url: doc.metadata.doc_url,
          section: truncateText(doc.metadata.section_title || '', 60),
          excerpt: doc.content.substring(0, 200) + (doc.content.length > 200 ? '...' : ''),
          score: doc.score,
        };
        uniqueByKey.set(key, updatedSource);
        uniqueByUrl.set(normalizedUrl, { source: updatedSource, score: doc.score ?? 0 });
      }
    }
  }

  // Final pass: ensure no duplicate URLs remain
  // This handles edge cases where different sections point to same URL
  const finalSources = new Map<string, SourceReference>();
  for (const source of uniqueByKey.values()) {
    if (!source.url?.trim()) continue;
    const normalized = normalizeUrl(source.url);
    const existing = finalSources.get(normalized);
    if (!existing || (source.score ?? 0) > (existing.score ?? 0)) {
      finalSources.set(normalized, source);
    }
  }

  return Array.from(finalSources.values())
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
};

export const retrieve = async (
  query: string,
  options: {
    topK?: number;
    minScore?: number;
    language?: 'en' | 'zh-Hans';
    productLine?: string;
  } = {}
): Promise<RetrievalResult> => {
  // 准确率优化: 使用配置的 topK（默认 10）
  const defaultTopK = agentConfig.retrieval_top_k || 10;
  const { topK = defaultTopK, minScore = 0.05, language = 'en', productLine } = options;

  console.log(`[RETRIEVE START] Query: "${query}", Lang: ${language}, Product: ${productLine || 'all'}`);
  console.log(`[RETRIEVE START] vectorStore.search type: ${typeof vectorStore.search}`);

  // Auto-detect query language if not explicitly provided
  // We use this internal helper, but we also rely on the caller to handle intent
  const detectQueryLanguage = (q: string): 'en' | 'zh-Hans' => {
    const chineseChars = (q.match(/[\u4e00-\u9fa5]/g) || []).length;
    // Strict detection: Any Chinese char makes it Chinese
    return chineseChars > 0 ? 'zh-Hans' : 'en';
  };

  const detectedLanguage: 'en' | 'zh-Hans' = language === 'en' ? detectQueryLanguage(query) : language;
  console.log(`[RETRIEVE] Detected language: ${detectedLanguage}`);

  // 1. 尝试从查询缓存获取
  const cachedResult = await getCachedQueryResult(query, detectedLanguage, productLine);
  if (cachedResult) {
    console.log(`[RETRIEVE] ✅ QUERY CACHE HIT - returning cached result`);
    return cachedResult;
  }
  console.log(`[RETRIEVE] ❌ QUERY CACHE MISS - proceeding to vector search`);

  // 2. 尝试从 RAG 缓存获取（旧缓存层）
  const cacheKey = `rag:retrieve:${query}:${detectedLanguage}:${productLine || 'all'}`;
  console.log(`[RETRIEVE] Cache key: ${cacheKey}`);
  const cached = await cache.get<RetrievalResult>(cacheKey);
  if (cached && cached.chunks.length > 0) {
    console.log(`[RETRIEVE] ✅ RAG CACHE HIT - returning cached result`);
    console.log(`[RETRIEVE] Cached chunks: ${cached.chunks.length}`);
    return cached;
  }
  console.log(`[RETRIEVE] ❌ RAG CACHE MISS or empty cache - proceeding to search`);

  // 1. Initial Retrieval using Hybrid Search (if enabled)
  const initialTopK = topK * 3;

  // 检测查询类型用于混合检索
  const detectQueryType = (q: string): 'specification' | 'general' | 'comparison' => {
    const lowerQuery = q.toLowerCase();

    // 技术规格查询关键词
    const specKeywords = [
      '功耗', '功率', '电压', '电流', '频率', '尺寸', '重量', '规格',
      'power', 'voltage', 'current', 'frequency', 'dimension', 'weight', 'spec',
      '参数', '配置', '型号', '版本', '接口', 'port', 'interface',
      'tops', 'battery', 'capacity', 'mAh', 'kg', 'mm',
    ];

    // 对比查询关键词
    const comparisonKeywords = [
      '对比', '比较', '区别', '差异', 'vs', 'versus',
      'difference', 'compare', 'comparison', 'versus',
    ];

    if (comparisonKeywords.some(kw => lowerQuery.includes(kw))) {
      return 'comparison';
    }

    if (specKeywords.some(kw => lowerQuery.includes(kw))) {
      return 'specification';
    }

    return 'general';
  };

  const queryType = detectQueryType(query);
  console.log(`[RETRIEVE] Detected query type: ${queryType}`);

  // HyDE 查询扩展（如果启用）
  let searchQuery = query;
  if (featureFlags.enableHyDE) {
    console.log(`[RETRIEVE] HyDE enabled - expanding query...`);
    try {
      const hydeResult = await hydeExpansion(query, detectedLanguage);
      if (hydeResult && hydeResult.length > 0) {
        searchQuery = hydeResult[0]; // 使用 HyDE 生成的假设查询
        console.log(`[RETRIEVE] HyDE expanded query: "${searchQuery}"`);
      }
    } catch (error: any) {
      console.log(`[RETRIEVE] HyDE expansion failed: ${error?.message || error}`);
      // 继续使用原始查询
    }
  }

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(searchQuery);
  console.log(`[RETRIEVE] Query embedding generated for: "${searchQuery}", size: ${queryEmbedding.length}`);

  // 使用混合检索（暂时禁用 filter 以返回更多结果）
  console.log(`[RETRIEVE] Starting hybrid search with topK=${initialTopK}`);
  const hybridResults = await vectorStore.searchHybrid(
    query,
    queryEmbedding,
    queryType,
    {
      limit: initialTopK,
      scoreThreshold: 0.05,
      // 暂时禁用 filter，让混合检索返回更多结果
      // filter: {
      //   language: detectedLanguage !== 'en' ? [detectedLanguage] : undefined,
      //   product: productLine ? [productLine] : undefined,
      // },
    }
  );

  console.log(`[RETRIEVE] Hybrid search returned ${hybridResults.length} docs`);

  // 转换为 initialDocs 格式
  const initialDocs = hybridResults.map((result) => ({
    id: result.id,
    score: result.score,
    metadata: {
      doc_title: result.metadata.title,
      doc_url: result.metadata.url,
      section_title: result.metadata.section,
      product_line: result.metadata.product,
      language: result.metadata.language,
      score: result.score,
    },
    content: result.content,
  }));
  if (initialDocs.length > 0) {
    console.log(`[RETRIEVE] Top 3 scores: ${initialDocs.slice(0, 3).map(d => (d.score ?? 0).toFixed(4)).join(', ')}`);
  } else {
    console.log(`[RETRIEVE] ❌ No docs found! Checking vector store...`);
    // Debug: check if vector store has docs
    const stats = await vectorStore.getStats();
    console.log(`[RETRIEVE] Total docs in vector store: ${stats.count}`);
  }

  let finalDocs = initialDocs;

  // 2. If no results found with strict language filter, try relaxed filter
  if (finalDocs.length === 0) {
    console.log(`No results found for language=${detectedLanguage}, trying relaxed filter...`);
    const relaxedDocs = await vectorStore.search(queryEmbedding, {
      limit: initialTopK,
      scoreThreshold: 0.05, // Lower threshold for relaxed search
    });

    if (relaxedDocs.length > 0) {
      // 检查是否高置信度（快速路径）
      const preliminaryMaxScore = relaxedDocs.length > 0 ? (relaxedDocs[0].score ?? 0) : 0;
      const isHighConfidence = preliminaryMaxScore >= agentConfig.fast_path_threshold;

      // Transform VectorSearchResult to the expected format
      const transformedRelaxedDocs = relaxedDocs.map((result) => ({
        id: result.id,
        score: result.score,
        metadata: {
          doc_title: result.metadata.title,
          doc_url: result.metadata.url,
          section_title: result.metadata.section,
          product_line: result.metadata.product,
          language: result.metadata.language,
          score: result.score,
        },
        content: result.content,
      }));

      // 条件性Reranker优化: 在高置信度时跳过Reranker以减少延迟
      if (!rerankerConfig.enabled) {
        rerankerSkipTotal.inc({ reason: 'config_disabled' });
        finalDocs = transformedRelaxedDocs.slice(0, topK);
        console.log(`Found ${finalDocs.length} results with relaxed filter (reranker disabled)`);
      } else if (isHighConfidence) {
        // 快速路径: 高置信度时跳过 Reranker
        rerankerSkipTotal.inc({ reason: 'high_confidence' });
        finalDocs = transformedRelaxedDocs.slice(0, topK);
        console.log(`[FAST PATH] Skipping reranker (score=${preliminaryMaxScore.toFixed(4)} >= ${agentConfig.fast_path_threshold})`);
        console.log(`Found ${finalDocs.length} results with relaxed filter (high confidence, no rerank)`);
      } else {
        // 智能路径: 低置信度时仍使用 Reranker
        finalDocs = transformedRelaxedDocs.slice(0, topK * 2);
        console.log(`Found ${relaxedDocs.length} results with relaxed filter, will rerank`);
      }
    }
  }

  // 3. Reranking (if we have results and reranker is enabled)
  if (finalDocs.length > 0 && rerankerConfig.enabled) {
    // 检查是否需要跳过 reranker（高置信度已处理）
    const maxScore = finalDocs.length > 0 ? (finalDocs[0].score ?? 0) : 0;
    const shouldSkipReranker = maxScore >= agentConfig.fast_path_threshold;

    if (!shouldSkipReranker) {
      console.log(`[RERANK] Reranking ${finalDocs.length} documents...`);
      const documentsToRerank = finalDocs.map(d => d.content);
      const rerankResults = await rerank(query, documentsToRerank, topK);

      // Reorder and slice based on rerank scores
      finalDocs = rerankResults.map(r => {
        const doc = finalDocs[r.index];
        return { ...doc, score: r.score };
      }).filter(d => d.score !== undefined && d.score >= minScore);
      console.log(`[RERANK] After reranking: ${finalDocs.length} documents`);
    }
  }

  const maxScore = finalDocs.length > 0 ? (finalDocs[0].score ?? 0) : 0;
  const isSufficient = maxScore >= agentConfig.fast_path_threshold;

  const result: RetrievalResult = {
    chunks: finalDocs.map((doc) => ({
      id: doc.id,
      content: doc.content,
      metadata: {
        doc_path: doc.metadata.doc_url || '', // Use doc_url as doc_path
        doc_title: doc.metadata.doc_title,
        doc_url: doc.metadata.doc_url,
        section_title: doc.metadata.section_title || undefined,
        product_line: doc.metadata.product_line,
        language: doc.metadata.language,
        score: doc.score,
      },
    })),
    max_score: maxScore,
    is_sufficient: isSufficient,
    query_used: query,
  };

  // 缓存到查询缓存（新缓存层）
  await setCachedQueryResult(query, detectedLanguage, productLine, result);

  // 缓存到 RAG 缓存（旧缓存层，保持向后兼容）
  await cache.set(cacheKey, result, 3600);

  return result;
};

export const analyzeQuery = async (
  query: string,
  initialRetrieval: RetrievalResult
): Promise<QueryAnalysis> => {
  const contextSummary = initialRetrieval.chunks
    .map((c) => `- ${c.metadata.doc_title}: ${c.content.substring(0, 100)}...`)
    .join('\n');
  return analyzeQueryIntent(query, contextSummary);
};

export const orchestrateRetrieval = async (
  query: string,
  language: 'en' | 'zh-Hans',
  _history: ChatMessage[] = [],
  _productLine?: string
): Promise<{
  path: 'fast' | 'agent';
  chunks: DocumentChunk[];
  sources: SourceReference[];
  steps: string[];
  max_score: number;
  thinkAnalysis?: {
    intent: string;
    reasoning: string;
    search_language: 'en' | 'zh-Hans' | 'both';
  };
}> => {
  const startTime = Date.now();
  const steps: string[] = [];
  const detectedProduct = _productLine || detectProductFromQuery(query);
  console.log(`[ORCHESTRATE RETRIEVAL] Product: ${detectedProduct || 'none'}`);
  console.log(`[ORCHESTRATE RETRIEVAL] Query: "${query.substring(0, 100)}..."`);

  // Detect query language for prioritization
  const detectQueryLanguage = (q: string): 'en' | 'zh-Hans' => {
    const chineseChars = (q.match(/[\u4e00-\u9fa5]/g) || []).length;
    // Strict detection: Any Chinese char makes it Chinese
    return chineseChars > 0 ? 'zh-Hans' : 'en';
  };

  const queryLanguage = detectQueryLanguage(query);

  // ========================================================================
  // THINK MODE: Pre-retrieval reasoning for better query understanding
  // ========================================================================
  let thinkAnalysis: {
    intent: string;
    reasoning: string;
    search_language: 'en' | 'zh-Hans' | 'both';
  } | undefined;

  // Use detected query language for search prioritization
  // Use detected query language for search prioritization
  // Changed from 'both' to queryLanguage to fix language priority bug

  // Step 1: Initial retrieval
  let retrieval: RetrievalResult;

  // OPTIMIZATION: Only search Chinese documents if query contains Chinese characters
  // This reduces unnecessary vector searches and embedding generations by ~50%
  const hasChineseChars = /[\u4e00-\u9fa5]/.test(query);

  // OPTIMIZATION: 统一使用 topK=5
  // - 减少 Embedding API 调用量
  // - 减少 Reranker 处理量
  // - 高置信度查询不需要更多候选
  const enTopK = 5; // 统一使用 5
  const zhTopK = 5; // 统一使用 5

  steps.push(language === 'zh-Hans' ? '📚 搜索全局知识库...' : '📚 Searching global knowledge base...');

  // Build search promises based on query language
  const searchPromises = [
    retrieve(query, { language: 'en', productLine: detectedProduct, topK: enTopK, minScore: 0.05 })
  ];

  // Only search Chinese if query contains Chinese characters
  if (hasChineseChars) {
    searchPromises.push(
      retrieve(query, { language: 'zh-Hans', productLine: detectedProduct, topK: zhTopK, minScore: 0.05 })
    );
  }

  const retrievalResults = await Promise.all(searchPromises);
  const enRetrieval = retrievalResults[0];
  const zhRetrieval = hasChineseChars ? retrievalResults[1] : { chunks: [], max_score: 0, is_sufficient: false, query_used: query };

  // Merge and deduplicate results
  const uniqueChunks = new Map<string, DocumentChunk>();
  // Prioritize chunks that match the query language by putting them first in the merge list?
  // Actually, Reranker will handle the relevance best.
  // We just merge everything.
  const allChunks = [...zhRetrieval.chunks, ...enRetrieval.chunks];

  for (const chunk of allChunks) {
    if (!uniqueChunks.has(chunk.id)) {
      uniqueChunks.set(chunk.id, chunk);
    }
  }

  // Language-aware sorting: Group by language match, then sort within groups
  // This ensures query language documents always appear first regardless of score
  const mergedChunks = Array.from(uniqueChunks.values())
    .sort((a, b) => {
      const aLang = a.metadata.language || 'en';
      const bLang = b.metadata.language || 'en';
      const aMatches = aLang === queryLanguage;
      const bMatches = bLang === queryLanguage;

      // Priority 1: Query language documents ALWAYS come first
      // No matter the score, matching language wins over non-matching
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;

      // Priority 2: Within same language group, sort by score
      return (b.metadata.score || 0) - (a.metadata.score || 0);
    })
    .slice(0, 10);

  retrieval = {
    chunks: mergedChunks,
    max_score: Math.max(zhRetrieval.max_score, enRetrieval.max_score),
    is_sufficient: zhRetrieval.is_sufficient || enRetrieval.is_sufficient,
    query_used: query,
  };

  // ========================================================================
  // FAST PATH: Based on retrieval confidence (max_score)
  // ========================================================================
  // 快速路径判断：基于检索置信度，跳过意图分析
  // 符合 PRD 设计：高置信度查询直接生成，不调用 LLM 分析
  if (retrieval.max_score >= agentConfig.fast_path_threshold) {
    const pathStartTime = Date.now();
    console.log(`[FAST PATH] High confidence (${retrieval.max_score.toFixed(4)} >= ${agentConfig.fast_path_threshold})`);
    console.log(`[FAST PATH] Query: "${query.substring(0, 50)}..."`);
    console.log(`[FAST PATH] Chunks: ${retrieval.chunks.length}`);

    pathSelectionTotal.inc({ path: 'fast' });

    // 直接从检索结果提取 sources，不调用 LLM
    const sources = toSourceReferences(
      retrieval.chunks.map((c) => ({
        id: c.id,
        content: c.content,
        embedding: [],
        metadata: c.metadata,
        score: c.metadata.score || retrieval.max_score,
      }))
    );

    const pathDuration = Date.now() - pathStartTime;
    const totalDuration = Date.now() - startTime;

    console.log(`[FAST PATH] Sources: ${sources.length}`);
    console.log(`[FAST PATH] Path duration: ${pathDuration}ms`);
    console.log(`[FAST PATH] Total duration: ${totalDuration}ms`);

    return {
      path: 'fast',
      chunks: retrieval.chunks,
      sources,
      max_score: retrieval.max_score,
      steps: [language === 'zh-Hans' ? '📚 检索完成' : '📚 Retrieval complete'],
      thinkAnalysis: undefined, // 跳过 Think Mode
    };
  }

  console.log(`[AGENT PATH] Low confidence (${retrieval.max_score.toFixed(4)} < ${agentConfig.fast_path_threshold})`);
  console.log(`[AGENT PATH] Query: "${query.substring(0, 50)}..."`);

  // ========================================================================
  // AGENT PATH: Intelligent retrieval with LLM analysis
  // ========================================================================
  const analysis = await analyzeQuery(query, retrieval);

  // 跟踪查询意图分布
  if (analysis.intent) {
    queryIntentTotal.inc({ intent: analysis.intent });
  }

  // Agent path
  pathSelectionTotal.inc({ path: 'agent' });
  if (steps.length === 0) {
    steps.push('Retrieving relevant documents...');
  }
  steps.push('Analyzing requirements...');

  if (analysis.needs_comparison && analysis.sub_query) {
    steps.push('Retrieving comparison data...');
    // Use query language for comparison search
    const comparisonRetrieval = await retrieve(analysis.sub_query, { language: queryLanguage, productLine: detectedProduct });
    const existingIds = new Set(retrieval.chunks.map((c) => c.id));
    for (const chunk of comparisonRetrieval.chunks) {
      if (!existingIds.has(chunk.id)) {
        retrieval.chunks.push(chunk);
        existingIds.add(chunk.id);
      }
    }
  }

  if (retrieval.max_score < agentConfig.fast_path_threshold && analysis.intent !== 'SIMPLE_FACT') {
    steps.push('Searching with alternative query...');
    const subQuery = await generateSubQuery(query, analysis.intent);
    // Use query language for sub-query search
    const subRetrieval = await retrieve(subQuery, { language: queryLanguage, productLine: detectedProduct });
    const existingIds = new Set(retrieval.chunks.map((c) => c.id));
    for (const chunk of subRetrieval.chunks) {
      if (!existingIds.has(chunk.id)) {
        retrieval.chunks.push(chunk);
        existingIds.add(chunk.id);
      }
    }
  }

  steps.push('Synthesizing answer...');

  // 智能路径: 对多次检索的合并结果进行Rerank以保证质量
  if (rerankerConfig.enabled && retrieval.chunks.length > 0) {
    try {
      console.log(`[AGENT PATH] Reranking ${retrieval.chunks.length} chunks...`);
      const documentsToRerank = retrieval.chunks.map(c => c.content);
      const rerankResults = await rerank(query, documentsToRerank, 10);
      
      // 根据rerank结果重新排序chunks
      retrieval.chunks = rerankResults.map(r => {
        const chunk = retrieval.chunks[r.index];
        return {
          ...chunk,
          metadata: { ...chunk.metadata, score: r.score },
        };
      });
      console.log(`[AGENT PATH] Reranking completed, top score: ${retrieval.chunks[0]?.metadata?.score?.toFixed(4) || 'N/A'}`);
    } catch (error) {
      console.warn('[AGENT PATH] Reranking failed, using original order:', error);
      rerankerSkipTotal.inc({ reason: 'error' });
    }
  }

  // 确保 sources 正确提取，使用 chunk 的实际 score
  const sources = toSourceReferences(
    retrieval.chunks.map((c) => ({
      id: c.id,
      content: c.content,
      embedding: [],
      metadata: c.metadata,
      score: c.metadata.score || 0, // 使用 chunk 的 score，而不是硬编码 0
    }))
  );

  const totalDuration = Date.now() - startTime;

  console.log(`[AGENT PATH] Returning ${sources.length} sources`);
  console.log(`[AGENT PATH] Max score: ${retrieval.max_score.toFixed(4)}`);
  console.log(`[AGENT PATH] Chunks: ${retrieval.chunks.length}`);
  console.log(`[AGENT PATH] Steps: ${steps.length}`);
  console.log(`[AGENT PATH] Total duration: ${totalDuration}ms`);

  return {
    path: 'agent',
    chunks: retrieval.chunks,
    sources,
    max_score: retrieval.max_score,
    steps,
    thinkAnalysis,
  };
};

export const generateAnswer = async function* (
  query: string,
  language: 'en' | 'zh-Hans',
  history: ChatMessage[] = [],
  sessionId?: string
): AsyncGenerator<{
  type: 'routing' | 'progress' | 'chunk' | 'sources' | 'tool_call' | 'tool_result' | 'suggestions';
  data: any;
}> {
  // Detect product from query at the start
  const detectedProduct = detectProductFromQuery(query);
  console.log(`[GENERATE ANSWER] Detected product: ${detectedProduct || 'none'}`);

  // Step 1: Agent Tools Check
  const toolPlan = await planToolExecution(query, language);

  if (!toolPlan.requiresRAG && toolPlan.tools.length > 0) {
    yield { type: 'routing', data: { path: 'agent_tools' } };
    const toolContext: ToolContext = { sessionId: sessionId || 'unknown', language, history };
    const toolSummaries: ToolCallSummary[] = [];

    // P0: 限制工具调用次数和总超时
    const agentStartTime = Date.now();
    const toolsToExecute = toolPlan.tools.slice(0, MAX_TOOL_CALLS);  // 最多调用 2 次

    for (const toolDef of toolsToExecute) {
      // 检查超时
      if (Date.now() - agentStartTime > AGENT_TIMEOUT_MS) {
        console.warn(`[AGENT TOOLS] Timeout after ${Date.now() - agentStartTime}ms, skipping remaining tools`);
        break;
      }

      yield {
        type: 'tool_call',
        data: {
          tool: toolDef.name,
          status: 'running',
          message: language === 'zh-Hans' ? `正在调用 ${toolDef.name}...` : `Calling ${toolDef.name}...`,
        },
      };
      const startTime = Date.now();
      const result = await executeTool(toolDef.name, toolDef.params, toolContext);
      toolSummaries.push({
        tool: toolDef.name,
        status: result.success ? 'success' : 'error',
        result,
        latency_ms: Date.now() - startTime,
      });
      yield {
        type: 'tool_result',
        data: { tool: toolDef.name, data: result.data, status: result.success ? 'success' : 'error' },
      };
    }

    const toolContextStr = formatToolResultsForLLM(new Map(toolSummaries.map(t => [t.tool, t.result!])), language);
    const toolPrompt = language === 'zh-Hans'
      ? `你是 CamThink AI 助手。根据以下工具调用的结果回答用户问题。\n\n用户问题: ${query}\n\n工具调用结果:\n${toolContextStr}\n\n请用中文简洁地回答用户问题。`
      : `You are the CamThink AI assistant. Answer based on tool results.\n\nQuestion: ${query}\n\nResults:\n${toolContextStr}\n\nAnswer concisely.`;

    const messages = [
      { role: 'system' as const, content: toolPrompt },
      { role: 'user' as const, content: query }
    ];
    for await (const chunk of streamChatCompletion({ messages })) {
      yield { type: 'chunk', data: { content: chunk } };
    }

    const toolSources: SourceReference[] = toolSummaries
      .filter(t => t.result?.metadata?.source)
      .map(t => ({
        title: `${t.tool} result`,
        url: t.result!.metadata?.source || '',
        section: t.result!.metadata?.source?.replace('https://www.', '').replace('https://', ''),
        excerpt: '',
      }));
    yield { type: 'sources', data: { sources: toolSources } };
    return;
  }

  // Step 2: RAG Flow
  const result = await orchestrateRetrieval(query, language, history, detectedProduct);
  yield { type: 'routing', data: { path: result.path, thinkAnalysis: result.thinkAnalysis } };

  if (result.path === 'agent') {
    for (const step of result.steps) {
      yield { type: 'progress', data: { step } };
    }
  }

  // ========================================================================
  // EMPTY OR POOR QUALITY RAG RESULTS HANDLING WITH INTELLIGENT FALLBACK
  // ========================================================================
  console.log(`[DEBUG] result.chunks.length = ${result.chunks.length}`);
  console.log(`[DEBUG] result.max_score = ${result.max_score}`);
  console.log(`[DEBUG] result.sources =`, JSON.stringify(result.sources, null, 2));

  // 添加 chunks 内容调试
  if (result.chunks.length > 0) {
    console.log(`[DEBUG CHUNKS] Top 3 chunks content preview:`);
    result.chunks.slice(0, 3).forEach((chunk, i) => {
      console.log(`[DEBUG CHUNK ${i + 1}] Score: ${chunk.metadata?.score?.toFixed(4) || 'N/A'}`);
      console.log(`[DEBUG CHUNK ${i + 1}] Title: ${chunk.metadata?.doc_title}`);
      console.log(`[DEBUG CHUNK ${i + 1}] Content: ${chunk.content.substring(0, 200)}...`);
    });
  }

  // Check if RAG results are empty OR very poor quality
  // Poor quality is defined as:
  // 1. No chunks found, OR
  // 2. Max similarity score is very low (< 0.08), indicating chunks are not actually relevant
  const isEmptyOrPoorQuality = result.chunks.length === 0 || result.max_score < 0.08;
  console.log(`[DEBUG] isEmptyOrPoorQuality = ${isEmptyOrPoorQuality} (chunks=${result.chunks.length}, score=${result.max_score})`);

  if (isEmptyOrPoorQuality) {
    console.log('[DEBUG] Entering empty/poor quality RAG handling path');
    console.log('[DEBUG] result.chunks.length =', result.chunks.length);
    console.log('[DEBUG] result.max_score =', result.max_score);
    console.log('[DEBUG] isEmptyOrPoorQuality =', isEmptyOrPoorQuality);
    yield {
      type: 'progress',
      data: { step: language === 'zh-Hans' ? '📋 文档中未找到，正在分析是否需要外部数据...' : '📋 Not found in docs, analyzing if external data needed...' },
    };

    // Ask LLM if we should use agent tools as fallback
    console.log('[DEBUG] Calling shouldUseAgentToolsForEmptyRAG...');
    const toolDecision = await shouldUseAgentToolsForEmptyRAG(query, language, result.thinkAnalysis);
    console.log('[DEBUG] toolDecision =', JSON.stringify(toolDecision, null, 2));

    if (toolDecision.shouldUseTools && toolDecision.suggestedTools.length > 0) {
      yield {
        type: 'progress',
        data: { step: language === 'zh-Hans' ? `🔧 尝试外部数据源: ${toolDecision.suggestedTools.join(', ')}` : `🔧 Trying external sources: ${toolDecision.suggestedTools.join(', ')}` },
      };

      const toolContext: ToolContext = { sessionId: sessionId || 'unknown', language, history };
      const toolSummaries: ToolCallSummary[] = [];

      // P0: 添加 Agent 超时控制
      const agentStartTime = Date.now();
      const toolsToExecute = toolDecision.suggestedTools.slice(0, MAX_TOOL_CALLS);  // 最多调用 2 次

      // Execute suggested tools
      for (const toolName of toolsToExecute) {
        // 检查超时
        if (Date.now() - agentStartTime > AGENT_TIMEOUT_MS) {
          console.warn(`[AGENT FALLBACK] Timeout after ${Date.now() - agentStartTime}ms, skipping remaining tools`);
          break;
        }

        yield {
          type: 'tool_call',
          data: {
            tool: toolName,
            status: 'running',
            message: language === 'zh-Hans' ? `正在调用 ${toolName}...` : `Calling ${toolName}...`,
          },
        };

        const startTime = Date.now();
        const toolResult = await executeTool(toolName, {}, toolContext);

        toolSummaries.push({
          tool: toolName,
          status: toolResult.success ? 'success' : 'error',
          result: toolResult,
          latency_ms: Date.now() - startTime,
        });

        yield {
          type: 'tool_result',
          data: { tool: toolName, data: toolResult.data, status: toolResult.success ? 'success' : 'error' },
        };

        // If we got successful results, use them to answer
        if (toolResult.success && toolResult.data) {
          const toolContextStr = formatToolResultsForLLM(new Map([[toolName, toolResult]]), language);
          const toolPrompt = language === 'zh-Hans'
            ? `你是 CamThink AI 助手。文档库中没有找到相关信息，但你刚刚通过外部工具获取了数据。\n\n用户问题: ${query}\n\n工具调用结果:\n${toolContextStr}\n\n请用中文简洁地回答用户问题。`
            : `You are the CamThink AI assistant. The documentation had no relevant info, but you just fetched data via external tools.\n\nQuestion: ${query}\n\nResults:\n${toolContextStr}\n\nAnswer concisely.`;

          const messages = [
            { role: 'system' as const, content: toolPrompt },
            { role: 'user' as const, content: query }
          ];
          for await (const chunk of streamChatCompletion({ messages })) {
            yield { type: 'chunk', data: { content: chunk } };
          }

          const toolSources: SourceReference[] = toolResult.metadata?.source
            ? [{
                title: `${toolName} result`,
                url: toolResult.metadata.source,
                section: toolResult.metadata.source.replace('https://www.', '').replace('https://', ''),
                excerpt: '',
              }]
            : [];

          yield { type: 'sources', data: { sources: toolSources } };
          return;
        }
      }
    }

    // If no tools were used or tools failed, return not found message
    yield {
      type: 'chunk',
      data: {
        content: language === 'zh-Hans'
          ? '抱歉，我在文档中找不到相关信息。'
          : "I cannot find this information in the documentation.",
      },
    };
    yield { type: 'sources', data: { sources: [] } };
    return;
  }

  // Enhance context with think analysis reasoning if available
  let contextEnhancement = '';
  if (result.thinkAnalysis?.reasoning) {
    contextEnhancement = `\n\n[Query Understanding: ${result.thinkAnalysis.reasoning}]`;
  }

  // ========================================================================
  // LANGUAGE DETECTION: Auto-detect from query content for best UX
  // ========================================================================
  // Detect language from actual query content, not from UI parameter
  // This ensures Chinese queries get Chinese responses, English gets English
  const detectResponseLanguage = (q: string, uiLang: 'en' | 'zh-Hans'): 'en' | 'zh-Hans' => {
    const chineseChars = (q.match(/[\u4e00-\u9fa5]/g) || []).length;
    const totalChars = q.replace(/\s/g, '').length; // Exclude whitespace

    // If query has significant Chinese content (>20% Chinese characters), respond in Chinese
    // This handles mixed Chinese-English queries correctly
    if (totalChars > 0 && (chineseChars / totalChars) > 0.2) {
      console.log(`[LANGUAGE DETECTION] Chinese query (${chineseChars}/${totalChars} = ${((chineseChars/totalChars)*100).toFixed(1)}%) -> Responding in Chinese`);
      return 'zh-Hans';
    }

    // Otherwise, use UI language preference (default to English for mixed/ambiguous)
    console.log(`[LANGUAGE DETECTION] English query (${chineseChars}/${totalChars} = ${totalChars > 0 ? ((chineseChars/totalChars)*100).toFixed(1) : '0'}%) -> Responding in ${uiLang}`);
    return uiLang;
  };

  const targetResponseLanguage = detectResponseLanguage(query, language);

  // 添加更详细的 chunks 调试
  console.log(`[DEBUG CHUNKS CONTENT] Total chunks: ${result.chunks.length}`);
  result.chunks.slice(0, 3).forEach((chunk, i) => {
    console.log(`[DEBUG CHUNK ${i + 1} FULL] ID: ${chunk.id}`);
    console.log(`[DEBUG CHUNK ${i + 1} FULL] Title: ${chunk.metadata?.doc_title}`);
    console.log(`[DEBUG CHUNK ${i + 1} FULL] Language: ${chunk.metadata?.language}`);
    console.log(`[DEBUG CHUNK ${i + 1} FULL] Content length: ${chunk.content?.length}`);
    console.log(`[DEBUG CHUNK ${i + 1} FULL] Content full: ${chunk.content}`);
    console.log(`---`);
  });

  const contextString = result.chunks
    .map((c, i) => `[Doc ${i + 1}] (${c.metadata.language === 'zh-Hans' ? '中文' : 'English'}) ${c.metadata.doc_title}\n${c.content}`)
    .join('\n\n---\n\n') + contextEnhancement;

  console.log(`[DEBUG LLM] Context string length: ${contextString.length}`);
  console.log(`[DEBUG LLM] Context preview (first 500 chars):\n${contextString.substring(0, 500)}...`);

  // 快速路径使用简化的 prompt
  const messages = buildRAGPrompt(query, [contextString], targetResponseLanguage, history, { fastPath: result.path === 'fast' });

  console.log(`[DEBUG LLM] Messages count: ${messages.length}`);
  console.log(`[DEBUG LLM] System prompt length: ${messages[0]?.content?.length || 0}`);
  console.log(`[DEBUG LLM] System prompt preview:\n${messages[0]?.content?.substring(0, 300)}...`);

  // Collect the full response to check if it indicates "not found"
  let fullResponseContent = '';
  for await (const chunk of streamChatCompletion({
    messages,
    fastPath: result.path === 'fast',  // P0: 快速路径使用更小的 max_tokens
  })) {
    fullResponseContent += chunk;
    yield { type: 'chunk', data: { content: chunk } };
  }

  // Check if the response indicates no information was found
  // But ONLY hide sources if we ALSO have low retrieval confidence
  // If we found relevant documents (max_score >= 0.5), show them even if LLM says "not found"
  const isNotFound = isNotFoundResponse(fullResponseContent, targetResponseLanguage);
  const hasRelevantDocuments = result.max_score >= 0.5;

  if (isNotFound && !hasRelevantDocuments) {
    // Send empty sources only when BOTH LLM says "not found" AND retrieval confidence is low
    console.log(`[SOURCES] Not found response with low confidence (${result.max_score.toFixed(3)}), hiding sources`);
    yield { type: 'sources', data: { sources: [] } };
  } else {
    // Always show sources if we found relevant documents, regardless of LLM response
    // Filter sources by relevance score before sending
    const relevantSources = filterRelevantSources(result.sources);

    // 添加调试日志
    console.log(`[SOURCES] Before filter: ${result.sources.length}, scores: ${result.sources.map(s => s.score?.toFixed(3)).join(', ')}`);

    // 如果过滤后为空，返回 top 3 未过滤的 sources（降级逻辑）
    if (relevantSources.length === 0 && result.sources.length > 0) {
      console.log(`[SOURCES] All filtered, returning top 3 unfiltered`);
      yield { type: 'sources', data: { sources: result.sources.slice(0, 3) } };
    } else {
      console.log(`[SOURCES] After filter: ${relevantSources.length}`);
      yield { type: 'sources', data: { sources: relevantSources } };
    }
  }

  // Collect full response for follow-up suggestions
  const fullResponse = result.chunks
    .map((c) => c.content)
    .join('');

  // Generate follow-up suggestions
  try {
    const suggestions = await generateFollowUpSuggestions(query, fullResponse, language);
    if (suggestions.length > 0) {
      yield { type: 'suggestions', data: { items: suggestions } };
    }
  } catch (error) {
    console.warn('Failed to generate follow-up suggestions:', error);
    // Don't fail the entire flow if suggestions fail
  }
};

export const indexDocuments = async (docs: DocumentChunk[]): Promise<void> => {
  const texts = docs.map((d) => d.content);
  const embeddings = await generateEmbeddings(texts);

  // Transform to match the internal DocumentChunk format expected by vectorStore.upsert
  const vectorDocs: Array<{ docId: string; chunkIndex: number; url: string; title: string; section: string | null; content: string; product: string; language: string; tags: string[]; embedding: number[] }> = docs.map((doc, i) => ({
    docId: doc.id,
    chunkIndex: i,
    url: doc.metadata.doc_url,
    title: doc.metadata.doc_title,
    section: doc.metadata.section_title || null,
    content: doc.content,
    product: doc.metadata.product_line || 'unknown',
    language: doc.metadata.language,
    tags: doc.metadata.tags || [],
    embedding: embeddings[i],
  }));

  await vectorStore.upsert(vectorDocs);
};

export const getVectorStoreStats = async (): Promise<{ documentCount: number; dimension: number; }> => {
  const stats = await vectorStore.getStats();
  return {
    documentCount: stats.count,
    dimension: 1024,
  };
};

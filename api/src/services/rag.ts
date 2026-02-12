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
import { agentConfig, dbConfig } from '../config/index.js';
import { vectorOps } from '../lib/db.js';
import { cache } from '../lib/cache.js';
import { QdrantVectorStore } from '../lib/vector-store/qdrant.js';
import { IVectorStore, VectorDocument } from '../lib/vector-store/types.js';
import {
  planToolExecution,
  executeTool,
  formatToolResultsForLLM,
} from './agent-tools.js';
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
      // Convert Buffer embedding to number[] for cosine similarity calculation
      const embeddingBuffer = row.embedding as unknown as Buffer;
      const embedding = Array.from(new Float32Array(embeddingBuffer.buffer, embeddingBuffer.byteOffset, embeddingBuffer.byteLength / 4));
      this.documents.set(row.id, {
        id: row.id,
        content: row.content,
        embedding,
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
    console.log(`[SQLiteVectorStore.search] Total docs in memory: ${this.documents.size}`);

    // Simple cosine similarity implementation
    const dot = (a: number[], b: number[]) => a.reduce((acc, v, i) => acc + v * b[i], 0);
    const norm = (a: number[]) => Math.sqrt(a.reduce((acc, v) => acc + v * v, 0));
    const cosineSimilarity = (a: number[], b: number[]) => dot(a, b) / (norm(a) * norm(b));

    let checkedCount = 0;
    for (const doc of this.documents.values()) {
      checkedCount++;
      if (filter && !filter(doc)) {
        continue;
      }
      const score = cosineSimilarity(queryEmbedding as number[], doc.embedding);
      if (score >= minScore) {
        results.push({ doc, score });
      }
    }

    console.log(`[SQLiteVectorStore.search] Checked ${checkedCount} docs, found ${results.length} results above threshold`);

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

// Select vector store based on config
const storeType = dbConfig.vectorStoreType;
console.log(`[RAG INIT] Vector store type: ${storeType}`);
export const vectorStore: IVectorStore =
  storeType === 'qdrant'
    ? new QdrantVectorStore()
    : new SqliteVectorStore();
console.log(`[RAG INIT] Vector store instance created`);

// Initialize on import (async)
vectorStore.init().catch(err => console.error('Vector store init failed:', err));

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
    language?: string;
    productLine?: string;
  } = {}
): Promise<RetrievalResult> => {
  const { topK = 5, minScore = 0.05, language = 'en', productLine } = options;

  console.log(`[RETRIEVE START] Query: "${query}", Lang: ${language}, Product: ${productLine || 'all'}`);
  console.log(`[RETRIEVE START] vectorStore.search type: ${typeof vectorStore.search}`);

  // Auto-detect query language if not explicitly provided
  // We use this internal helper, but we also rely on the caller to handle intent
  const detectQueryLanguage = (q: string): 'en' | 'zh-Hans' => {
    const chineseChars = (q.match(/[\u4e00-\u9fa5]/g) || []).length;
    // Strict detection: Any Chinese char makes it Chinese
    return chineseChars > 0 ? 'zh-Hans' : 'en';
  };

  const detectedLanguage = language === 'en' ? detectQueryLanguage(query) : language;
  console.log(`[RETRIEVE] Detected language: ${detectedLanguage}`);

  // Cache key
  const cacheKey = `rag:retrieve:${query}:${detectedLanguage}:${productLine || 'all'}`;
  console.log(`[RETRIEVE] Cache key: ${cacheKey}`);
  const cached = await cache.get<RetrievalResult>(cacheKey);
  if (cached && cached.chunks.length > 0) {
    console.log(`[RETRIEVE] ✅ CACHE HIT - returning cached result`);
    console.log(`[RETRIEVE] Cached chunks: ${cached.chunks.length}`);
    return cached;
  }
  console.log(`[RETRIEVE] ❌ CACHE MISS or empty cache - proceeding to vector search`);

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  console.log(`[RETRIEVE] Query embedding generated, size: ${queryEmbedding.length}`);
  console.log(`[RETRIEVE] Query embedding first 5: [${queryEmbedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);

  // 1. Initial Retrieval (Fetch more candidates for reranking)
  const initialTopK = topK * 3;
  console.log(`[RETRIEVE] Starting search with minScore=0.05, topK=${initialTopK}`);
  const initialDocs = await vectorStore.search(queryEmbedding, query, {
    topK: initialTopK,
    minScore: 0.05, // Very low threshold for initial retrieval to catch more candidates
    alpha: 0.7,
    // Database-level filtering (Qdrant)
    filterObj: {
      ...(detectedLanguage !== 'en' ? { language: detectedLanguage } : {}),
      ...(productLine ? { product_line: productLine } : {}),
    },
    // In-memory filtering (SQLite) - Strict language matching
    filter: (doc) => {
      // Direct product matching using lowercase product code from detectProductFromQuery
      const targetProduct = productLine?.toLowerCase();

      // We check if the doc's product line matches the target
      // If doc has specific product line, it must match.
      // If target is specific, doc must match.
      const docProduct = doc.metadata.product_line;
      let productMatch = true;

      if (productLine) {
         // If we are looking for a specific product, the doc must match it
         // Allow partial match for safety (e.g. "NeoEyes NE101" includes "ne101" if we didn't map correctly)
         const docProductLower = (docProduct || '').toLowerCase();
         const targetProductLower = (targetProduct || '').toLowerCase();
         const productLineLower = productLine.toLowerCase();
         productMatch = docProduct === targetProduct ||
                        docProductLower.includes(productLineLower) ||
                        Boolean(targetProduct && docProductLower.includes(targetProductLower));

         // Debug logging
         console.log(`[FILTER DEBUG] docProduct="${docProduct}" targetProduct="${targetProduct}" productLine="${productLine}"`);
         console.log(`[FILTER DEBUG] docProductLower="${docProductLower}" targetProductLower="${targetProductLower}" productLineLower="${productLineLower}"`);
         console.log(`[FILTER DEBUG] match1=${docProduct === targetProduct} match2=${docProductLower.includes(productLineLower)} match3=${Boolean(targetProduct && docProductLower.includes(targetProductLower))}`);
         console.log(`[FILTER DEBUG] Final productMatch=${productMatch}`);
      }

      console.log(`[FILTER] Doc: ${doc.metadata.doc_title?.substring(0,30)} Lang=${doc.metadata.language} Product=${docProduct} (Target: ${targetProduct || productLine || 'any'}) -> ${productMatch ? 'PASS' : 'FILTER OUT'}`);

      // Strict language filtering: only match documents with the detected language
      if (detectedLanguage && doc.metadata.language !== detectedLanguage) return false;
      if (!productMatch) return false;
      return true;
    },
  });

  console.log(`[RETRIEVE] Initial search returned ${initialDocs.length} docs`);
  if (initialDocs.length > 0) {
    console.log(`[RETRIEVE] Top 3 scores: ${initialDocs.slice(0, 3).map(d => (d.score ?? 0).toFixed(4)).join(', ')}`);
  } else {
    console.log(`[RETRIEVE] ❌ No docs found! Checking vector store...`);
    // Debug: check if vector store has docs
    const allDocs = await vectorStore.count();
    console.log(`[RETRIEVE] Total docs in vector store: ${allDocs}`);
  }

  let finalDocs = initialDocs;

  // 2. If no results found with strict language filter, try relaxed filter
  if (finalDocs.length === 0) {
    console.log(`No results found for language=${detectedLanguage}, trying relaxed filter...`);
    const relaxedDocs = await vectorStore.search(queryEmbedding, query, {
      topK: initialTopK,
      minScore: 0.05, // Lower threshold for relaxed search
      alpha: 0.7,
      filter: (doc) => {
        // Allow any language if strict filtering yielded no results

        // Product logic must match the strict filter above
        const targetProduct = productLine?.toLowerCase();
        const docProduct = doc.metadata.product_line;

        if (productLine) {
           const docProductLower = (docProduct || '').toLowerCase();
           const targetProductLower = (targetProduct || '').toLowerCase();
           const productLineLower = productLine.toLowerCase();
           const productMatch = docProduct === targetProduct ||
                                  docProductLower.includes(productLineLower) ||
                                  (targetProduct && docProductLower.includes(targetProductLower));
           if (!productMatch) return false;
        }

        return true;
      },
    });

    if (relaxedDocs.length > 0) {
      const documentsToRerank = relaxedDocs.map(d => d.content);
      const rerankResults = await rerank(query, documentsToRerank, topK);

      finalDocs = rerankResults.map(r => {
        const doc = relaxedDocs[r.index];
        return { ...doc, score: r.score };
      }).filter(d => d.score !== undefined && d.score >= minScore);

      console.log(`Found ${finalDocs.length} results with relaxed filter`);
    }
  }

  // 3. Reranking (if we have results)
  if (initialDocs.length > 0 && finalDocs.length === 0) {
    const documentsToRerank = initialDocs.map(d => d.content);
    const rerankResults = await rerank(query, documentsToRerank, topK);

    // Reorder and slice based on rerank scores
    finalDocs = rerankResults.map(r => {
      const doc = initialDocs[r.index];
      return { ...doc, score: r.score };
    }).filter(d => d.score !== undefined && d.score >= minScore);
  }

  const maxScore = finalDocs.length > 0 ? (finalDocs[0].score ?? 0) : 0;
  const isSufficient = maxScore >= agentConfig.fast_path_threshold;

  const result: RetrievalResult = {
    chunks: finalDocs.map((doc) => ({
      id: doc.id,
      content: doc.content,
      metadata: {
        ...doc.metadata,
        score: doc.score,
      },
    })),
    max_score: maxScore,
    is_sufficient: isSufficient,
    query_used: query,
  };

  // Cache results (TTL 1 hour)
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
  const steps: string[] = [];
  const detectedProduct = _productLine || detectProductFromQuery(query);
  console.log(`[ORCHESTRATE RETRIEVAL] Product: ${detectedProduct || 'none'}`);

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

  steps.push(language === 'zh-Hans' ? '📚 搜索全局知识库...' : '📚 Searching global knowledge base...');

  // Build search promises based on query language
  const searchPromises = [
    retrieve(query, { language: 'en', productLine: detectedProduct, topK: 5, minScore: 0.05 })
  ];

  // Only search Chinese if query contains Chinese characters
  if (hasChineseChars) {
    searchPromises.push(
      retrieve(query, { language: 'zh-Hans', productLine: detectedProduct, topK: 5, minScore: 0.05 })
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

  const analysis = await analyzeQuery(query, retrieval);

  // Fast path
  if (analysis.is_sufficient && analysis.confidence >= agentConfig.fast_path_threshold) {
    return {
      path: 'fast',
      chunks: retrieval.chunks,
      sources: toSourceReferences(
        retrieval.chunks.map((c) => ({
          id: c.id,
          content: c.content,
          embedding: [],
          metadata: c.metadata,
          score: retrieval.max_score,
        }))
      ),
      max_score: retrieval.max_score,
      steps,
      thinkAnalysis,
    };
  }

  // Agent path
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

  return {
    path: 'agent',
    chunks: retrieval.chunks,
    sources: toSourceReferences(
      retrieval.chunks.map((c) => ({
        id: c.id,
        content: c.content,
        embedding: [],
        metadata: c.metadata,
        score: 0,
      }))
    ),
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

    for (const toolDef of toolPlan.tools) {
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

  // Check if RAG results are empty OR very poor quality
  // Poor quality is defined as:
  // 1. No chunks found, OR
  // 2. Max similarity score is very low (< 0.08), indicating chunks are not actually relevant
  const isEmptyOrPoorQuality = result.chunks.length === 0 || result.max_score < 0.08;

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

      // Execute suggested tools
      for (const toolName of toolDecision.suggestedTools) {
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

  const contextString = result.chunks
    .map((c, i) => `[Doc ${i + 1}] (${c.metadata.language === 'zh-Hans' ? '中文' : 'English'}) ${c.metadata.doc_title}\n${c.content}`)
    .join('\n\n---\n\n') + contextEnhancement;

  const messages = buildRAGPrompt(query, [contextString], targetResponseLanguage, history);

  // Collect the full response to check if it indicates "not found"
  let fullResponseContent = '';
  for await (const chunk of streamChatCompletion({ messages })) {
    fullResponseContent += chunk;
    yield { type: 'chunk', data: { content: chunk } };
  }

  // Check if the response indicates no information was found
  // If so, don't show sources (they would be irrelevant)
  const isNotFound = isNotFoundResponse(fullResponseContent, targetResponseLanguage);

  if (isNotFound) {
    // Send empty sources for "not found" responses
    yield { type: 'sources', data: { sources: [] } };
  } else {
    // Filter sources by relevance score before sending
    const relevantSources = filterRelevantSources(result.sources);
    yield { type: 'sources', data: { sources: relevantSources } };
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
  const vectorDocs: VectorDocument[] = docs.map((doc, i) => ({
    id: doc.id,
    content: doc.content,
    embedding: embeddings[i],
    metadata: doc.metadata,
  }));
  await vectorStore.upsertBatch(vectorDocs);
};

export const getVectorStoreStats = async (): Promise<{ documentCount: number; dimension: number; }> => {
  return {
    documentCount: await vectorStore.count(),
    dimension: 1024,
  };
};

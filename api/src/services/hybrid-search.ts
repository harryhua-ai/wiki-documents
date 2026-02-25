/**
 * 混合检索服务
 *
 * 实现 BM25 + 向量检索的混合策略
 */

import { VectorStore } from '../lib/vector.js';
import { generateEmbedding } from './llm.js';
import { featureFlags, getHybridSearchAlpha } from '../config/feature-flags.js';
import type { VectorSearchResult, VectorSearchOptions } from '../lib/vector.js';

/**
 * 查询类型
 */
export type QueryType = 'specification' | 'general' | 'comparison';

/**
 * 混合检索结果
 */
export interface HybridSearchResult extends VectorSearchResult {
  /** 检索方法 */
  method: 'vector' | 'bm25' | 'hybrid';

  /** 查询类型 */
  queryType: QueryType;

  /** Alpha 值（语义检索权重） */
  alpha: number;

  /** 向量检索结果数量 */
  vectorCount?: number;

  /** BM25 检索结果数量 */
  bm25Count?: number;
}

/**
 * 识别查询类型
 *
 * 根据查询内容自动识别查询类型
 */
export function detectQueryType(query: string): QueryType {
  const lowerQuery = query.toLowerCase();

  // 技术规格查询关键词
  const specKeywords = [
    '功耗', '功率', '电压', '电流', '频率', '尺寸', '重量', '规格',
    'power', 'voltage', 'current', 'frequency', 'dimension', 'weight', 'spec',
    '参数', '配置', '型号', '版本', '接口', 'port', 'interface',
  ];

  // 对比查询关键词
  const comparisonKeywords = [
    '对比', '比较', '区别', '差异', '哪个', '选择', 'vs', 'versus',
    'compare', 'difference', 'which', 'better', 'choose',
    '优缺点', '优势', '劣势', 'pro', 'con',
  ];

  // 检查是否包含技术规格关键词
  if (specKeywords.some((keyword) => lowerQuery.includes(keyword))) {
    return 'specification';
  }

  // 检查是否包含对比关键词
  if (comparisonKeywords.some((keyword) => lowerQuery.includes(keyword))) {
    return 'comparison';
  }

  // 默认为通用查询
  return 'general';
}

/**
 * 执行混合检索
 *
 * @param vectorStore 向量存储实例
 * @param query 用户查询
 * @param options 检索选项
 * @returns 混合检索结果
 */
export async function hybridSearch(
  vectorStore: VectorStore,
  query: string,
  options: VectorSearchOptions = {}
): Promise<HybridSearchResult[]> {
  // 1. 检查是否启用混合检索
  if (!featureFlags.enableHybridSearch) {
    console.log('[Hybrid Search] Disabled, using vector search only');

    // 降级为纯向量检索
    const queryEmbedding = await generateEmbedding(query);
    const results = await vectorStore.search(queryEmbedding, options);

    return results.map((result) => ({
      ...result,
      method: 'vector' as const,
      queryType: 'general' as QueryType,
      alpha: 1.0,
    }));
  }

  // 2. 识别查询类型
  const queryType = detectQueryType(query);
  console.log(`[Hybrid Search] Query type detected: ${queryType}`);

  // 3. 生成查询 embedding
  const queryEmbedding = await generateEmbedding(query);

  // 4. 执行混合检索
  const alpha = getHybridSearchAlpha(queryType);
  const results = await vectorStore.searchHybrid(query, queryEmbedding, queryType, options);

  // 5. 添加元数据
  return results.map((result) => ({
    ...result,
    method: 'hybrid' as const,
    queryType,
    alpha,
  }));
}

/**
 * 批量混合检索
 *
 * @param vectorStore 向量存储实例
 * @param queries 用户查询列表
 * @param options 检索选项
 * @returns 批量检索结果
 */
export async function batchHybridSearch(
  vectorStore: VectorStore,
  queries: string[],
  options: VectorSearchOptions = {}
): Promise<HybridSearchResult[][]> {
  const results = await Promise.all(
    queries.map((query) => hybridSearch(vectorStore, query, options))
  );

  return results;
}

/**
 * 记录检索指标
 *
 * @param sessionId 会话 ID
 * @param messageId 消息 ID
 * @param results 检索结果
 * @param latency 检索延迟
 */
export function logRetrievalMetrics(
  sessionId: string,
  messageId: string,
  results: HybridSearchResult[],
  latency: number
): void {
  if (!featureFlags.enableQualityMetrics) {
    return;
  }

  // 计算平均相似度
  const avgSimilarity =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length
      : 0;

  console.log('[Retrieval Metrics]', {
    sessionId,
    messageId,
    method: results.length > 0 ? results[0].method : 'unknown',
    queryType: results.length > 0 ? results[0].queryType : 'general',
    alpha: results.length > 0 ? results[0].alpha : 0,
    vectorCount: results.length > 0 ? results[0].vectorCount : 0,
    bm25Count: results.length > 0 ? results[0].bm25Count : 0,
    finalCount: results.length,
    avgSimilarity,
    latency,
  });
}

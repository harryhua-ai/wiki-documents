/**
 * 父文档检索服务
 *
 * 实现小粒度索引（子 chunks），大粒度返回（父文档）的检索策略
 */

import { VectorStore, VectorSearchResult, VectorSearchOptions } from '../lib/vector.js';
import { featureFlags } from '../config/feature-flags.js';

/**
 * 父文档检索结果
 */
export interface ParentChildSearchResult extends VectorSearchResult {
  /** 父文档内容 */
  parentContent?: string;

  /** 父文档 ID */
  parentId?: string;

  /** 块层级 */
  level: 'parent' | 'child';
}

/**
 * 执行父文档检索
 *
 * @param vectorStore 向量存储实例
 * @param queryEmbedding 查询 embedding
 * @param options 检索选项
 * @returns 父文档检索结果
 */
export async function parentChildRetrieval(
  vectorStore: VectorStore,
  queryEmbedding: number[],
  options: VectorSearchOptions = {}
): Promise<ParentChildSearchResult[]> {
  // 1. 检查是否启用父文档检索
  if (!featureFlags.enableParentDocRetrieval) {
    console.log('[Parent-Child Retrieval] Disabled, using standard search');

    // 降级为标准检索
    const results = await vectorStore.search(queryEmbedding, options);

    return results.map((result) => ({
      ...result,
      level: 'child' as const,
    }));
  }

  // 2. 执行向量检索（匹配子 chunks）
  const childResults = await vectorStore.search(queryEmbedding, {
    ...options,
    limit: (options.limit || 5) * 2, // 检索更多子 chunks
  });

  console.log(`[Parent-Child Retrieval] Found ${childResults.length} child chunks`);

  // 3. 获取对应的父文档
  const parentResults = await getParentDocuments(vectorStore, childResults);

  // 4. 去重（多个子 chunks 可能指向同一个父文档）
  const uniqueParents = deduplicateByParentId(parentResults);

  console.log(`[Parent-Child Retrieval] Returning ${uniqueParents.length} unique parent documents`);

  // 5. 返回 top-k 结果
  const limit = options.limit || 5;
  return uniqueParents.slice(0, limit);
}

/**
 * 获取父文档
 *
 * @param vectorStore 向量存储实例
 * @param childResults 子 chunks 检索结果
 * @returns 包含父文档内容的结果
 */
async function getParentDocuments(
  _vectorStore: VectorStore,
  childResults: VectorSearchResult[]
): Promise<ParentChildSearchResult[]> {
  // 简化实现：假设父文档内容已经存储在子 chunk 的 metadata 中
  // 实际实现中应该从数据库查询父文档

  return childResults.map((result) => ({
    ...result,
    parentContent: result.content, // 简化：使用当前内容
    parentId: result.id,
    level: 'child' as const,
  }));
}

/**
 * 按父文档 ID 去重
 *
 * @param results 检索结果
 * @returns 去重后的结果
 */
function deduplicateByParentId(results: ParentChildSearchResult[]): ParentChildSearchResult[] {
  const seen = new Set<string>();
  const unique: ParentChildSearchResult[] = [];

  for (const result of results) {
    const parentId = result.parentId || result.id;
    if (!seen.has(parentId)) {
      seen.add(parentId);
      unique.push(result);
    }
  }

  return unique;
}

/**
 * 批量父文档检索
 *
 * @param vectorStore 向量存储实例
 * @param queries 查询 embedding 列表
 * @param options 检索选项
 * @returns 批量检索结果
 */
export async function batchParentChildRetrieval(
  vectorStore: VectorStore,
  queries: number[][],
  options: VectorSearchOptions = {}
): Promise<ParentChildSearchResult[][]> {
  const results = await Promise.all(
    queries.map((query) => parentChildRetrieval(vectorStore, query, options))
  );

  return results;
}

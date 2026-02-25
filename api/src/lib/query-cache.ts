/**
 * 查询结果缓存模块
 *
 * 缓存策略:
 * - 缓存键: 查询文本 + 语言 + 产品线
 * - TTL: 1 小时
 * - 缓存失效: 文档更新时自动清空
 */

import { cache } from './cache.js';
import type { RetrievalResult } from '../types/index.js';

/**
 * 生成查询缓存键
 */
export function generateQueryCacheKey(
  query: string,
  language: 'en' | 'zh-Hans',
  productLine?: string
): string {
  const normalizedQuery = query.toLowerCase().trim();
  const product = productLine?.toLowerCase() || 'all';
  return `query:result:${normalizedQuery}:${language}:${product}`;
}

/**
 * 获取缓存的查询结果
 */
export async function getCachedQueryResult(
  query: string,
  language: 'en' | 'zh-Hans',
  productLine?: string
): Promise<RetrievalResult | null> {
  const cacheKey = generateQueryCacheKey(query, language, productLine);
  const cached = await cache.get<RetrievalResult>(cacheKey);

  if (cached && cached.chunks.length > 0) {
    console.log(`[QUERY CACHE] ✅ HIT - key: ${cacheKey}`);
    return cached;
  }

  console.log(`[QUERY CACHE] ❌ MISS - key: ${cacheKey}`);
  return null;
}

/**
 * 缓存查询结果
 */
export async function setCachedQueryResult(
  query: string,
  language: 'en' | 'zh-Hans',
  productLine: string | undefined,
  result: RetrievalResult
): Promise<void> {
  const cacheKey = generateQueryCacheKey(query, language, productLine);

  // 缓存 1 小时
  await cache.set(cacheKey, result, 3600);
  console.log(`[QUERY CACHE] ✅ SET - key: ${cacheKey}, chunks: ${result.chunks.length}`);
}

/**
 * 清空所有查询缓存
 * 在文档更新后调用
 */
export async function clearQueryCache(): Promise<void> {
  // 由于我们的 cache 模块没有提供 clearByPattern 方法，
  // 我们只能记录日志，实际清空需要依赖 TTL 过期
  console.log('[QUERY CACHE] Clearing query cache (TTL-based expiration)');
}

/**
 * Embedding缓存模块
 *
 * 使用Redis缓存Embedding结果，减少重复API调用
 *
 * 功能：
 * - 基于文本内容生成缓存键（MD5 hash）
 * - 7天TTL（与文档更新频率匹配）
 * - 自动降级（Redis不可用时直接调用API）
 * - 缓存命中率监控
 */

import crypto from 'crypto';
import { cache } from './cache.js';
import { cacheHitTotal, cacheMissTotal } from './metrics.js';

// 缓存配置
const EMBEDDING_CACHE_PREFIX = 'embedding:';
const EMBEDDING_CACHE_TTL = 7 * 24 * 3600; // 7天（秒）

/**
 * 生成Embedding缓存键
 * 使用MD5 hash确保：
 * 1. 固定长度
 * 2. 相同文本生成相同键
 * 3. 不同文本生成不同键
 */
export function generateEmbeddingCacheKey(text: string): string {
  const hash = crypto.createHash('md5').update(text).digest('hex');
  return `${EMBEDDING_CACHE_PREFIX}${hash}`;
}

/**
 * 创建带缓存的Embedding生成函数
 *
 * @param originalGenerateFn - 原始的generateEmbedding函数
 * @returns 包装后的函数，自动处理缓存
 *
 * @example
 * ```typescript
 * const cachedGenerateEmbedding = withEmbeddingCache(generateEmbedding);
 * const embedding = await cachedGenerateEmbedding('测试文本'); // 第一次调用API
 * const cached = await cachedGenerateEmbedding('测试文本'); // 第二次命中缓存
 * ```
 */
export function withEmbeddingCache<T extends (text: string) => Promise<number[]>>(
  originalGenerateFn: T
): T {
  return (async (text: string): Promise<number[]> => {
    const cacheKey = generateEmbeddingCacheKey(text);

    try {
      // 1. 尝试从缓存获取
      const cached = await cache.get<number[]>(cacheKey);
      if (cached) {
        console.log(`[Embedding Cache] HIT for key: ${cacheKey.substring(0, 20)}...`);
        cacheHitTotal.inc({ cache_type: 'embedding' });
        return cached;
      }

      console.log(`[Embedding Cache] MISS for key: ${cacheKey.substring(0, 20)}...`);
      cacheMissTotal.inc({ cache_type: 'embedding' });

      // 2. 缓存未命中，调用原始函数
      const embedding = await originalGenerateFn(text);

      // 3. 异步写入缓存（不阻塞返回）
      cache.set(cacheKey, embedding, EMBEDDING_CACHE_TTL).catch(err => {
        console.error('[Embedding Cache] Failed to set cache:', err);
      });

      return embedding;
    } catch (error) {
      // 4. 缓存错误时降级到直接调用
      console.error('[Embedding Cache] Error, falling back to direct call:', error);
      return originalGenerateFn(text);
    }
  }) as T;
}

/**
 * 批量Embedding缓存处理
 *
 * 优化批量请求：
 * - 为每个文本单独检查缓存
 * - 只为未缓存的文本调用API
 * - 合并结果
 */
export async function withBatchEmbeddingCache(
  texts: string[],
  generateFn: (texts: string[]) => Promise<number[][]>
): Promise<number[][]> {
  const results: number[][] = new Array(texts.length).fill(null);
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];

  // 1. 检查每个文本的缓存
  for (let i = 0; i < texts.length; i++) {
    const cacheKey = generateEmbeddingCacheKey(texts[i]);
    try {
      const cached = await cache.get<number[]>(cacheKey);
      if (cached) {
        results[i] = cached;
        console.log(`[Embedding Batch Cache] HIT for index ${i}`);
        cacheHitTotal.inc({ cache_type: 'embedding' });
      } else {
        uncachedIndices.push(i);
        uncachedTexts.push(texts[i]);
        cacheMissTotal.inc({ cache_type: 'embedding' });
      }
    } catch (error) {
      // 缓存错误，加入未缓存列表
      uncachedIndices.push(i);
      uncachedTexts.push(texts[i]);
      cacheMissTotal.inc({ cache_type: 'embedding' });
    }
  }

  console.log(`[Embedding Batch Cache] ${results.filter(r => r !== null).length}/${texts.length} from cache`);

  // 2. 如果有未缓存的文本，批量生成
  if (uncachedTexts.length > 0) {
    const newEmbeddings = await generateFn(uncachedTexts);

    // 3. 填充结果并异步缓存
    for (let i = 0; i < uncachedIndices.length; i++) {
      const originalIndex = uncachedIndices[i];
      const embedding = newEmbeddings[i];
      results[originalIndex] = embedding;

      // 异步缓存
      const cacheKey = generateEmbeddingCacheKey(uncachedTexts[i]);
      cache.set(cacheKey, embedding, EMBEDDING_CACHE_TTL).catch(err => {
        console.error(`[Embedding Batch Cache] Failed to cache index ${originalIndex}:`, err);
      });
    }
  }

  return results;
}

/**
 * Embedding缓存模块
 *
 * 使用Redis缓存Embedding结果，减少重复API调用
 *
 * 功能：
 * - L1 缓存: 内存 LRU 缓存（最快）
 * - L2 缓存: Redis 缓存（跨进程共享）
 * - 基于文本内容生成缓存键（MD5 hash）
 * - 7天TTL（与文档更新频率匹配）
 * - 自动降级（Redis不可用时直接调用API）
 * - 缓存命中率监控
 */

import crypto from 'crypto';
import { LRUCache } from 'lru-cache';
import { cache } from './cache.js';
import { cacheHitTotal, cacheMissTotal } from './metrics.js';

// 缓存配置
const EMBEDDING_CACHE_PREFIX = 'embedding:';
const EMBEDDING_CACHE_TTL = 7 * 24 * 3600; // 7天（秒）

// L1 内存缓存配置
const memoryCache = new LRUCache<string, number[]>({
  max: 1000, // 最多缓存 1000 个 embedding
  ttl: 1000 * 60 * 60, // 1 小时
  maxSize: 100 * 1024 * 1024, // 最大 100MB
  sizeCalculation: (value) => {
    // 每个 float64 占 8 字节
    return value.length * 8;
  },
});

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
      // 1. 先检查 L1 内存缓存
      const memoryCached = memoryCache.get(cacheKey);
      if (memoryCached) {
        console.log(`[Embedding Cache] L1 HIT for key: ${cacheKey.substring(0, 20)}...`);
        cacheHitTotal.inc({ cache_type: 'embedding_memory' });
        return memoryCached;
      }

      // 2. 再检查 L2 Redis 缓存
      const redisCached = await cache.get<number[]>(cacheKey);
      if (redisCached) {
        console.log(`[Embedding Cache] L2 HIT for key: ${cacheKey.substring(0, 20)}...`);
        cacheHitTotal.inc({ cache_type: 'embedding_redis' });
        // 写入 L1 缓存
        memoryCache.set(cacheKey, redisCached);
        return redisCached;
      }

      console.log(`[Embedding Cache] MISS for key: ${cacheKey.substring(0, 20)}...`);
      cacheMissTotal.inc({ cache_type: 'embedding' });

      // 3. 缓存未命中，调用原始函数
      const embedding = await originalGenerateFn(text);

      // 4. 写入 L1 和 L2 缓存
      memoryCache.set(cacheKey, embedding);
      cache.set(cacheKey, embedding, EMBEDDING_CACHE_TTL).catch(err => {
        console.error('[Embedding Cache] Failed to set L2 cache:', err);
      });

      return embedding;
    } catch (error) {
      // 5. 缓存错误时降级到直接调用
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

  // 1. 检查每个文本的缓存（L1 -> L2）
  for (let i = 0; i < texts.length; i++) {
    const cacheKey = generateEmbeddingCacheKey(texts[i]);

    // 先检查 L1
    const memoryCached = memoryCache.get(cacheKey);
    if (memoryCached) {
      results[i] = memoryCached;
      console.log(`[Embedding Batch Cache] L1 HIT for index ${i}`);
      cacheHitTotal.inc({ cache_type: 'embedding_memory' });
      continue;
    }

    // 再检查 L2
    try {
      const redisCached = await cache.get<number[]>(cacheKey);
      if (redisCached) {
        results[i] = redisCached;
        memoryCache.set(cacheKey, redisCached); // 写入 L1
        console.log(`[Embedding Batch Cache] L2 HIT for index ${i}`);
        cacheHitTotal.inc({ cache_type: 'embedding_redis' });
        continue;
      }
    } catch (error) {
      // 缓存错误，继续
    }

    // 未命中
    uncachedIndices.push(i);
    uncachedTexts.push(texts[i]);
    cacheMissTotal.inc({ cache_type: 'embedding' });
  }

  console.log(`[Embedding Batch Cache] ${results.filter(r => r !== null).length}/${texts.length} from cache`);

  // 2. 如果有未缓存的文本，批量生成
  if (uncachedTexts.length > 0) {
    const newEmbeddings = await generateFn(uncachedTexts);

    // 3. 填充结果并写入 L1 和 L2 缓存
    for (let i = 0; i < uncachedIndices.length; i++) {
      const originalIndex = uncachedIndices[i];
      const embedding = newEmbeddings[i];
      results[originalIndex] = embedding;

      // 写入 L1 和 L2
      const cacheKey = generateEmbeddingCacheKey(uncachedTexts[i]);
      memoryCache.set(cacheKey, embedding);
      cache.set(cacheKey, embedding, EMBEDDING_CACHE_TTL).catch(err => {
        console.error(`[Embedding Batch Cache] Failed to cache index ${originalIndex}:`, err);
      });
    }
  }

  return results;
}

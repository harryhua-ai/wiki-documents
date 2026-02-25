/**
 * Ragas 评估服务 TypeScript 集成层
 *
 * 提供 TypeScript 接口调用 Ragas Python 服务
 */

import fetch from 'node-fetch';
import type { RagasEvaluationRequest, RagasEvaluationResponse, RagasServiceConfig } from './types';

/**
 * 默认配置
 */
const DEFAULT_CONFIG: RagasServiceConfig = {
  endpoint: process.env.RAGAS_ENDPOINT || 'http://localhost:8000',
  timeout: 30000, // 30 seconds
  enableCache: true,
  cacheTTL: 3600, // 1 hour
};

/**
 * 简单的内存缓存
 */
const cache = new Map<string, { response: RagasEvaluationResponse; timestamp: number }>();

/**
 * 生成缓存键
 */
function generateCacheKey(request: RagasEvaluationRequest): string {
  const hash = require('crypto')
    .createHash('md5')
    .update(JSON.stringify(request))
    .digest('hex');
  return hash;
}

/**
 * 从缓存获取
 */
function getFromCache(key: string, ttl: number): RagasEvaluationResponse | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const age = (Date.now() - cached.timestamp) / 1000;
  if (age > ttl) {
    cache.delete(key);
    return null;
  }

  return cached.response;
}

/**
 * 保存到缓存
 */
function saveToCache(key: string, response: RagasEvaluationResponse): void {
  cache.set(key, {
    response,
    timestamp: Date.now(),
  });
}

/**
 * 调用 Ragas Python 服务进行评估
 */
export async function evaluateRAG(
  request: RagasEvaluationRequest,
  config: Partial<RagasServiceConfig> = {}
): Promise<RagasEvaluationResponse> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // 检查缓存
  if (finalConfig.enableCache) {
    const cacheKey = generateCacheKey(request);
    const cachedResponse = getFromCache(cacheKey, finalConfig.cacheTTL);
    if (cachedResponse) {
      console.log('[Ragas] Using cached evaluation');
      return cachedResponse;
    }
  }

  // 调用 Python 服务
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

    const response = await fetch(`${finalConfig.endpoint}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ragas service error: ${response.status} ${response.statusText}`);
    }

    const result = (await response.json()) as RagasEvaluationResponse;

    // 保存到缓存
    if (finalConfig.enableCache && result.success) {
      const cacheKey = generateCacheKey(request);
      saveToCache(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error('[Ragas] Evaluation failed:', error);

    return {
      metrics: {
        faithfulness: 0,
        answer_relevancy: 0,
        context_recall: 0,
        context_precision: 0,
      },
      latency_ms: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 检查 Ragas 服务健康状态
 */
export async function checkRagasHealth(
  config: Partial<RagasServiceConfig> = {}
): Promise<boolean> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const response = await fetch(`${finalConfig.endpoint}/health`, {
      method: 'GET',
      timeout: 5000,
    });

    return response.ok;
  } catch (error) {
    console.error('[Ragas] Health check failed:', error);
    return false;
  }
}

/**
 * 批量评估
 */
export async function batchEvaluate(
  requests: RagasEvaluationRequest[],
  config: Partial<RagasServiceConfig> = {}
): Promise<RagasEvaluationResponse[]> {
  const results = await Promise.all(
    requests.map((request) => evaluateRAG(request, config))
  );

  return results;
}

/**
 * 清除缓存
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * 获取缓存统计
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

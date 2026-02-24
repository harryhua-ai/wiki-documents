/**
 * 工具缓存模块
 *
 * 为 Agent 工具提供 Redis 持久化缓存，减少外部 API 调用。
 * 使用装饰器模式包装工具函数，自动处理缓存命中/未命中。
 *
 * @module lib/tool-cache
 */

import crypto from 'crypto';
import { cache } from './cache.js';
import { cacheHitTotal, cacheMissTotal } from './metrics.js';

/**
 * 工具缓存配置
 */
const TOOL_CACHE_PREFIX = 'tool:';
const TOOL_TTL: Record<string, number> = {
  // 官网爬虫缓存 1 小时（产品信息变化较慢）
  get_product_info: 3600,
  check_stock: 1800, // 库存状态缓存 30 分钟
  search_code: 1800, // GitHub 代码搜索缓存 30 分钟
  get_repo_info: 7200, // 仓库信息缓存 2 小时（很少变化）
};

/**
 * 生成工具缓存键
 *
 * 使用 MD5 哈希工具参数，确保键长度可控且唯一。
 *
 * @param toolName - 工具名称
 * @param params - 工具参数
 * @returns Redis 缓存键
 */
export function generateToolCacheKey(
  toolName: string,
  params: Record<string, unknown>
): string {
  // 排序参数键以确保相同参数生成相同键
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        // 跳过 undefined 和 null 值
        if (params[key] !== undefined && params[key] !== null) {
          acc[key] = params[key];
        }
        return acc;
      },
      {} as Record<string, unknown>
    );

  const paramsHash = crypto
    .createHash('md5')
    .update(JSON.stringify(sortedParams))
    .digest('hex');

  return `${TOOL_CACHE_PREFIX}${toolName}:${paramsHash}`;
}

/**
 * 工具缓存装饰器
 *
 * 包装工具函数，自动处理：
 * 1. 缓存命中 → 直接返回缓存结果
 * 2. 缓存未命中 → 调用工具，缓存结果，返回
 * 3. 缓存错误 → 降级到直接调用工具
 *
 * @param toolName - 工具名称（用于配置 TTL 和监控）
 * @param originalFn - 原始工具函数
 * @returns 包装后的工具函数
 *
 * @example
 * ```typescript
 * const cachedTool = withToolCache('get_product_info', getProductInfo);
 * const result = await cachedTool({ product: 'ne301' });
 * ```
 */
export function withToolCache<T extends (...args: any[]) => Promise<any>>(
  toolName: string,
  originalFn: T
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // 提取第一个参数作为缓存键（工具函数通常接受单个参数对象）
    const params = args[0] || {};
    const cacheKey = generateToolCacheKey(toolName, params);
    const ttl = TOOL_TTL[toolName] || 1800; // 默认 30 分钟

    try {
      // 1. 尝试从 Redis 缓存获取
      const cached = await cache.get<ReturnType<T>>(cacheKey);
      if (cached !== null) {
        console.log(`[ToolCache] HIT ${toolName} (TTL: ${ttl}s)`);
        cacheHitTotal.labels({ cache_type: 'tool' }).inc();
        return cached;
      }

      // 2. 缓存未命中，调用原始工具
      console.log(`[ToolCache] MISS ${toolName}, calling tool...`);
      cacheMissTotal.labels({ cache_type: 'tool' }).inc();

      const startTime = Date.now();
      const result = await originalFn(...args);
      const duration = Date.now() - startTime;

      console.log(`[ToolCache] Tool ${toolName} executed in ${duration}ms`);

      // 3. 异步缓存结果（不阻塞返回）
      cache.set(cacheKey, result, ttl).catch((err) => {
        console.error(`[ToolCache] Failed to cache ${toolName}:`, err);
      });

      return result;
    } catch (error) {
      // 4. 缓存错误，降级到直接调用工具
      console.error(`[ToolCache] Cache error for ${toolName}, falling back:`, error);
      cacheMissTotal.labels({ cache_type: 'tool' }).inc();
      return originalFn(...args);
    }
  }) as T;
}

/**
 * 手动清除工具缓存
 *
 * 用于特定场景下强制刷新缓存（例如管理员更新产品信息）。
 *
 * @param toolName - 工具名称（可选，不传则清除所有工具缓存）
 * @param params - 工具参数（可选，不传则清除该工具所有缓存）
 */
export async function invalidateToolCache(
  toolName?: string,
  params?: Record<string, unknown>
): Promise<void> {
  // 注意：当前 Redis 客户端不支持 SCAN 命令，
  // 完整实现需要扩展 cache.ts 添加 keys() 或 scan() 方法
  console.warn(
    '[ToolCache] invalidateToolCache() is not fully implemented - requires Redis SCAN support'
  );

  // 如果提供了完整的 toolName 和 params，可以删除特定键
  if (toolName && params) {
    const cacheKey = generateToolCacheKey(toolName, params);
    await cache.del(cacheKey);
    console.log(`[ToolCache] Invalidated cache key: ${cacheKey}`);
  }
}

/**
 * 获取工具缓存统计信息
 *
 * 用于监控和调试。
 */
export function getToolCacheStats(): {
  configuredTools: string[];
  ttlSettings: Record<string, number>;
} {
  return {
    configuredTools: Object.keys(TOOL_TTL),
    ttlSettings: TOOL_TTL,
  };
}

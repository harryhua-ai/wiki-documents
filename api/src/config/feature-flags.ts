/**
 * 特性开关配置模块
 *
 * 用于渐进式上线 RAG 优化功能，支持 A/B 测试和快速回滚
 *
 * 环境变量配置:
 * - ENABLE_HYBRID_SEARCH: 启用混合检索 (语义 + BM25)
 * - ENABLE_HYDE: 启用 HyDE 查询扩展
 * - ENABLE_QUALITY_METRICS: 启用质量评估指标
 * - ENABLE_PARENT_DOC_RETRIEVAL: 启用父文档检索
 * - ENABLE_QUERY_DECOMPOSITION: 启用查询分解
 * - ENABLE_CACHE_OPTIMIZATION: 启用缓存优化
 * - ENABLE_GRAPH_RAG: 启用 GraphRAG 知识图谱检索
 * - ENABLE_RAGAS_EVALUATION: 启用 Ragas 评估框架
 */

export interface FeatureFlags {
  // 阶段 1 优化项 (高优先级)
  enableHybridSearch: boolean;
  enableHyDE: boolean;
  enableQualityMetrics: boolean;
  enableCacheOptimization: boolean;

  // 阶段 2 优化项 (中优先级)
  enableParentDocRetrieval: boolean;
  enableQueryDecomposition: boolean;
  enableABTesting: boolean;

  // 阶段 3 优化项 (高级特性)
  enableGraphRAG: boolean;
  enableRagasEvaluation: boolean;

  // 高级配置
  hybridSearchAlpha: number; // 混合检索权重: 0=纯BM25, 1=纯语义
  hydeConfidenceThreshold: number; // HyDE 触发阈值
  cacheResultTTL: number; // 查询结果缓存 TTL (秒)
}

/**
 * 从环境变量加载特性开关配置
 */
function loadFeatureFlags(): FeatureFlags {
  return {
    // 阶段 1 优化项
    enableHybridSearch: process.env.ENABLE_HYBRID_SEARCH === 'true',
    enableHyDE: process.env.ENABLE_HYDE === 'true',
    enableQualityMetrics: process.env.ENABLE_QUALITY_METRICS === 'true',
    enableCacheOptimization: process.env.ENABLE_CACHE_OPTIMIZATION !== 'false', // 默认启用

    // 阶段 2 优化项
    enableParentDocRetrieval: process.env.ENABLE_PARENT_DOC === 'true',
    enableQueryDecomposition: process.env.ENABLE_QUERY_DECOMP === 'true',
    enableABTesting: process.env.ENABLE_AB_TESTING === 'true',

    // 阶段 3 优化项（高级特性）
    enableGraphRAG: process.env.ENABLE_GRAPH_RAG === 'true',
    enableRagasEvaluation: process.env.ENABLE_RAGAS === 'true',

    // 高级配置
    hybridSearchAlpha: parseFloat(process.env.HYBRID_SEARCH_ALPHA || '0.7'), // 默认 70% 语义 + 30% BM25
    hydeConfidenceThreshold: parseFloat(process.env.HYDE_CONFIDENCE_THRESHOLD || '0.6'), // 默认 0.6
    cacheResultTTL: parseInt(process.env.CACHE_RESULT_TTL || '3600', 10), // 默认 1 小时
  };
}

export const featureFlags = loadFeatureFlags();

/**
 * A/B 测试变体分配
 * 基于用户会话 ID 的一致性哈希分配
 */
export function getUserVariant(sessionId: string, variants: string[]): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(sessionId).digest('hex');
  const index = parseInt(hash.substring(0, 8), 16) % variants.length;
  return variants[index];
}

/**
 * 检查是否为快速路径 (高置信度)
 * 用于条件性启用优化
 */
export function isFastPath(confidence: number): boolean {
  return confidence >= 0.7;
}

/**
 * 获取混合检索权重
 * 根据查询类型动态调整语义和关键词搜索的权重
 */
export function getHybridSearchAlpha(queryType: string): number {
  // 技术规格查询更依赖关键词匹配
  if (queryType === 'specification') {
    return 0.3; // 30% 语义 + 70% BM25
  }
  // 常规问答更依赖语义理解
  return featureFlags.hybridSearchAlpha; // 默认 70% 语义 + 30% BM25
}

/**
 * 记录特性使用情况
 * 用于监控和评估
 */
export function logFeatureUsage(feature: string, variant: string, metadata?: Record<string, any>): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Feature Flag] ${feature} = ${variant}`, metadata || '');
  }
  // TODO: 集成到 Prometheus 指标或 Langfuse
}

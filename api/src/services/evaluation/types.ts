/**
 * Ragas 评估相关类型定义
 */

/**
 * Ragas 评估指标
 */
export interface RagasMetrics {
  /** 忠实度（答案是否基于上下文）目标: ≥ 0.85 */
  faithfulness: number;

  /** 答案相关性 目标: ≥ 0.90 */
  answer_relevancy: number;

  /** 上下文召回率 目标: ≥ 0.80 */
  context_recall: number;

  /** 上下文精确度 目标: ≥ 0.85 */
  context_precision: number;
}

/**
 * Ragas 评估请求
 */
export interface RagasEvaluationRequest {
  /** 用户查询 */
  query: string;

  /** 生成的答案 */
  answer: string;

  /** 检索到的上下文（文档块列表） */
  context: string[];
}

/**
 * Ragas 评估响应
 */
export interface RagasEvaluationResponse {
  /** 评估指标 */
  metrics: RagasMetrics;

  /** 评估耗时（毫秒） */
  latency_ms: number;

  /** 是否成功 */
  success: boolean;

  /** 错误信息（如果失败） */
  error?: string;
}

/**
 * Ragas 服务配置
 */
export interface RagasServiceConfig {
  /** Ragas Python 服务地址 */
  endpoint: string;

  /** 请求超时（毫秒） */
  timeout: number;

  /** 是否启用缓存 */
  enableCache: boolean;

  /** 缓存 TTL（秒） */
  cacheTTL: number;
}

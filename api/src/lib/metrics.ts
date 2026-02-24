/**
 * Metrics Module
 *
 * Defines Prometheus metrics for monitoring the application.
 */

import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics (CPU, Memory, Event Loop, etc.)
client.collectDefaultMetrics({ register, prefix: 'wiki_api_' });

// ============================================================================
// HTTP Metrics
// ============================================================================

export const httpRequestDuration = new client.Histogram({
  name: 'wiki_api_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10], // Buckets for latency
});

export const httpRequestsTotal = new client.Counter({
  name: 'wiki_api_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// ============================================================================
// LLM Metrics
// ============================================================================

export const llmTokenUsage = new client.Counter({
  name: 'wiki_api_llm_token_usage_total',
  help: 'Total number of LLM tokens used',
  labelNames: ['model', 'type'], // type: 'prompt' or 'completion'
});

export const llmRequestDuration = new client.Histogram({
  name: 'wiki_api_llm_request_duration_seconds',
  help: 'Duration of LLM requests in seconds',
  labelNames: ['model', 'provider'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30, 60],
});

export const llmErrorsTotal = new client.Counter({
  name: 'wiki_api_llm_errors_total',
  help: 'Total number of LLM errors',
  labelNames: ['model', 'provider', 'error_type'],
});

// ============================================================================
// RAG Metrics
// ============================================================================

export const ragRetrievalDuration = new client.Histogram({
  name: 'wiki_api_rag_retrieval_duration_seconds',
  help: 'Duration of RAG retrieval operations in seconds',
  labelNames: ['status'], // 'success' or 'empty'
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
});

export const vectorStoreOperations = new client.Counter({
  name: 'wiki_api_vector_store_operations_total',
  help: 'Total number of vector store operations',
  labelNames: ['operation', 'status'], // op: 'search', 'upsert', 'delete'
});

// ============================================================================
// Ask AI Performance Metrics (PRD §9.3)
// ============================================================================

/**
 * 路径选择统计
 * 跟踪快速路径 vs 智能路径(Agent/Agent Tools)的选择分布
 */
export const pathSelectionTotal = new client.Counter({
  name: 'wiki_api_askai_path_selection_total',
  help: 'Total count of Ask AI path selections',
  labelNames: ['path'], // 'fast' | 'agent' | 'agent_tools'
});

/**
 * 端到端响应时间直方图
 * 监控从用户提问到完整响应的整个流程耗时
 */
export const e2eDurationHistogram = new client.Histogram({
  name: 'wiki_api_askai_e2e_duration_seconds',
  help: 'End-to-end Ask AI response duration in seconds',
  labelNames: ['path', 'status'], // path: 'fast'|'agent'|'agent_tools', status: 'success'|'error'
  buckets: [0.5, 1, 2, 3, 5, 8, 10, 15, 20, 30], // 覆盖从快速响应到慢速查询的全范围
});

/**
 * 缓存命中率
 * 跟踪各类缓存(Embedding/Tool/RAG)的命中效率
 */
export const cacheHitTotal = new client.Counter({
  name: 'wiki_api_cache_hit_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'], // 'embedding' | 'tool' | 'rag'
});

export const cacheMissTotal = new client.Counter({
  name: 'wiki_api_cache_miss_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'], // 'embedding' | 'tool' | 'rag'
});

/**
 * Reranker跳过统计
 * 记录Reranker被跳过的原因（用于性能优化分析）
 */
export const rerankerSkipTotal = new client.Counter({
  name: 'wiki_api_reranker_skip_total',
  help: 'Total times reranker was skipped',
  labelNames: ['reason'], // 'no_results' | 'low_score' | 'config_disabled'
});

/**
 * Agent工具调用统计
 * 跟踪各类工具的使用频率和成功率
 */
export const toolCallsTotal = new client.Counter({
  name: 'wiki_api_tool_calls_total',
  help: 'Total number of tool calls',
  labelNames: ['tool_name', 'status'], // status: 'success' | 'error'
});

export const toolCallDuration = new client.Histogram({
  name: 'wiki_api_tool_call_duration_seconds',
  help: 'Duration of tool calls in seconds',
  labelNames: ['tool_name'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 20],
});

/**
 * 查询意图分析统计
 * 跟踪不同查询意图的分布
 */
export const queryIntentTotal = new client.Counter({
  name: 'wiki_api_query_intent_total',
  help: 'Total count of query intents detected',
  labelNames: ['intent'], // 'SIMPLE_FACT' | 'COMPARISON' | 'TROUBLESHOOTING' | etc.
});

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(llmTokenUsage);
register.registerMetric(llmRequestDuration);
register.registerMetric(llmErrorsTotal);
register.registerMetric(ragRetrievalDuration);
register.registerMetric(vectorStoreOperations);
register.registerMetric(pathSelectionTotal);
register.registerMetric(e2eDurationHistogram);
register.registerMetric(cacheHitTotal);
register.registerMetric(cacheMissTotal);
register.registerMetric(rerankerSkipTotal);
register.registerMetric(toolCallsTotal);
register.registerMetric(toolCallDuration);
register.registerMetric(queryIntentTotal);

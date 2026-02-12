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

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(llmTokenUsage);
register.registerMetric(llmRequestDuration);
register.registerMetric(llmErrorsTotal);
register.registerMetric(ragRetrievalDuration);
register.registerMetric(vectorStoreOperations);

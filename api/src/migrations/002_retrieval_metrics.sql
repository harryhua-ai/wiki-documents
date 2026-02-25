-- Migration: 002_retrieval_metrics.sql
-- Description: 创建检索性能追踪表
-- Created: 2026-02-24

-- 检索性能追踪表
CREATE TABLE IF NOT EXISTS retrieval_metrics (
    id TEXT PRIMARY KEY, -- UUID as TEXT for SQLite compatibility
    session_id TEXT,
    message_id TEXT,

    -- 检索方法
    retrieval_method TEXT,            -- 'vector', 'hybrid', 'graph'
    query_type TEXT,                  -- 'specification', 'general', 'comparison'

    -- 性能指标
    vector_search_latency_ms INTEGER,
    bm25_search_latency_ms INTEGER,
    graph_search_latency_ms INTEGER,
    rerank_latency_ms INTEGER,
    total_latency_ms INTEGER,

    -- 结果质量
    vector_results_count INTEGER,
    bm25_results_count INTEGER,
    final_results_count INTEGER,
    avg_similarity_score REAL,

    -- 配置信息
    alpha_value REAL,         -- 混合检索权重
    rerank_enabled INTEGER,   -- SQLite doesn't have BOOLEAN, use INTEGER (0/1)
    hyde_enabled INTEGER,

    created_at TEXT DEFAULT (datetime('now'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_retrieval_metrics_session ON retrieval_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_retrieval_metrics_message ON retrieval_metrics(message_id);
CREATE INDEX IF NOT EXISTS idx_retrieval_metrics_created ON retrieval_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_retrieval_metrics_method ON retrieval_metrics(retrieval_method);

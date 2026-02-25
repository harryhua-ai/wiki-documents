-- Migration: 001_ragas_evaluation.sql
-- Description: 创建 Ragas 评估数据表
-- Created: 2026-02-24

-- Ragas 评估指标记录表
CREATE TABLE IF NOT EXISTS rag_evaluations (
    id TEXT PRIMARY KEY, -- UUID as TEXT for SQLite compatibility
    session_id TEXT,
    message_id TEXT,

    -- Ragas 核心指标
    faithfulness REAL,        -- 忠实度 (目标: ≥ 0.85)
    answer_relevancy REAL,    -- 答案相关性 (目标: ≥ 0.90)
    context_recall REAL,      -- 上下文召回率 (目标: ≥ 0.80)
    context_precision REAL,   -- 上下文精确度 (目标: ≥ 0.85)

    -- 检索质量指标
    retrieval_latency_ms INTEGER,
    retrieval_count INTEGER,          -- 检索次数
    retrieval_path TEXT,              -- 'fast', 'agent', 'agent_tools'

    -- 上下文信息
    query TEXT,
    generated_answer TEXT,
    retrieved_context TEXT,           -- JSON string

    created_at TEXT DEFAULT (datetime('now'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_evaluations_session ON rag_evaluations(session_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_message ON rag_evaluations(message_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_created ON rag_evaluations(created_at);

-- 每日汇总统计表
CREATE TABLE IF NOT EXISTS rag_evaluation_daily_stats (
    date TEXT PRIMARY KEY,
    total_evaluations INTEGER,
    avg_faithfulness REAL,
    avg_answer_relevancy REAL,
    avg_context_recall REAL,
    avg_context_precision REAL,
    retrieval_path_distribution TEXT -- JSON string
);

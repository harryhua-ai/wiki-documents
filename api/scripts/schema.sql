-- -----------------------------------------------------------------------------
-- PostgreSQL Schema for CamThink Wiki Ask AI Feature
-- -----------------------------------------------------------------------------

-- Enable UUID extension (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS "vector";

-- -----------------------------------------------------------------------------
-- Session tracking
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_ip_hash TEXT NOT NULL,        -- Anonymized daily hash for privacy
    language TEXT DEFAULT 'en',         -- 'en' or 'zh-Hans'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for session lookup by user
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_ip_hash ON chat_sessions(user_ip_hash);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);

-- -----------------------------------------------------------------------------
-- Message history
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB,                      -- Array of source references
    metadata JSONB,                     -- { model, latency_ms, tokens, path }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for message queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);

-- -----------------------------------------------------------------------------
-- User feedback
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_feedback (
    id SERIAL PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for feedback analytics
CREATE INDEX IF NOT EXISTS idx_chat_feedback_message_id ON chat_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_feedback_rating ON chat_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_chat_feedback_created_at ON chat_feedback(created_at DESC);

-- -----------------------------------------------------------------------------
-- Document indexing state management
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_index_status (
    file_path TEXT PRIMARY KEY,         -- e.g. "docs/1-neoedge/intro.md"
    content_hash TEXT NOT NULL,         -- MD5/SHA256 of file content
    last_indexed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL CHECK (status IN ('pending', 'indexed', 'failed', 'deleted')),
    error_message TEXT,                 -- Error details if failed
    chunk_count INTEGER DEFAULT 0,      -- Number of chunks created
    language TEXT DEFAULT 'en'          -- 'en' or 'zh-Hans'
);

-- Indexes for index management
CREATE INDEX IF NOT EXISTS idx_document_index_status_status ON document_index_status(status);
CREATE INDEX IF NOT EXISTS idx_document_index_status_last_indexed_at ON document_index_status(last_indexed_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_index_status_language ON document_index_status(language);

-- -----------------------------------------------------------------------------
-- Vector store table (optional, for pgvector)
-- If using Qdrant, this table is not needed.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_id TEXT NOT NULL,               -- File path hash
    url TEXT NOT NULL,                  -- e.g. "/docs/neoedge/install"
    title TEXT NOT NULL,                -- Document title
    section TEXT,                       -- H2/H3 heading
    content TEXT NOT NULL,              -- Chunk text
    embedding vector(1024),             -- BAAI/bge-m3 embedding
    product TEXT,                       -- "neoedge", "ne101", "ne301"
    language TEXT NOT NULL,             -- 'en' or 'zh-Hans'
    tags TEXT[],                        -- Array of tags
    chunk_index INTEGER NOT NULL,       -- Chunk order within document
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Indexes for metadata filtering
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id ON document_chunks(doc_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_product ON document_chunks(product);
CREATE INDEX IF NOT EXISTS idx_document_chunks_language ON document_chunks(language);
CREATE INDEX IF NOT EXISTS idx_document_chunks_tags ON document_chunks USING GIN (tags);

-- -----------------------------------------------------------------------------
-- Cleanup policy (optional)
-- -----------------------------------------------------------------------------
-- Function to delete old sessions (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM chat_sessions
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Statistics view
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW chat_statistics AS
SELECT
    DATE(cs.created_at) as date,
    COUNT(DISTINCT cs.id) as total_sessions,
    COUNT(DISTINCT cs.user_ip_hash) as unique_users,
    COUNT(cm.id) as total_messages,
    AVG(EXTRACT(EPOCH FROM (MAX(cm.created_at) - MIN(cm.created_at)))) as avg_session_duration_seconds
FROM chat_sessions cs
LEFT JOIN chat_messages cm ON cm.session_id = cs.id
GROUP BY DATE(cs.created_at)
ORDER BY date DESC;

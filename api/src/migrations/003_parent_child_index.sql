-- Migration: 003_parent_child_index.sql
-- Description: 更新索引状态表以支持父文档检索
-- Created: 2026-02-24

-- 添加父文档索引追踪字段
ALTER TABLE document_index_status ADD COLUMN parent_chunks_count INTEGER DEFAULT 0;
ALTER TABLE document_index_status ADD COLUMN child_chunks_count INTEGER DEFAULT 0;
ALTER TABLE document_index_status ADD COLUMN indexing_method TEXT DEFAULT 'standard';
ALTER TABLE document_index_status ADD COLUMN last_indexing_strategy TEXT; -- JSON string

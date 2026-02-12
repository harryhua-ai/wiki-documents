# API and Database Specification (API_DB_SPEC.md)

This document defines the REST API endpoints, database schemas (PostgreSQL), and vector database configuration (Qdrant/pgvector) for the CamThink Wiki **Ask AI** feature.

## 1. API Endpoints

### 1.1 Chat Interaction (`POST /api/chat`)
*   **Description**: Handles RAG-based chat interactions with SSE streaming.
*   **Request Body (JSON)**:
    ```json
    {
      "session_id": "uuid-v4", // Optional, generated if missing
      "message": "How do I configure NeoEdge?",
      "language": "en", // "en" | "zh-Hans"
      "history": [
        {"role": "user", "content": "..."},
        {"role": "assistant", "content": "..."}
      ]
    }
    ```
*   **Response Format (Server-Sent Events)**:
    *   `data: {"type": "routing", "path": "fast"}` (or "agent")
    *   `data: {"type": "progress", "step": "Retrieving docs..."}` (Agent path only)
    *   `data: {"type": "chunk", "content": "The"}`
    *   `data: {"type": "chunk", "content": " NeoEdge..."}`
    *   `data: {"type": "sources", "sources": [{"title": "Setup", "url": "/docs/setup", "excerpt": "..."}]}`
    *   `data: {"type": "done"}`
*   **Error Codes**:
    *   `429`: `RATE_LIMIT` - Too many requests (10/min per IP).
    *   `503`: `SERVER_BUSY` - LLM or Vector DB overloaded.
    *   `400`: `INVALID_REQUEST` - Message too long (>500 chars).

### 1.2 Feedback (`POST /api/feedback`)
*   **Description**: Records user rating for a specific AI message.
*   **Request Body (JSON)**:
    ```json
    {
      "conversation_id": "uuid-v4",
      "message_id": "uuid-v4",
      "rating": "positive", // "positive" | "negative"
      "comment": "Very helpful!" // Optional
    }
    ```
*   **Response**: `{"success": true}`

### 1.3 Configuration (`GET /api/config`)
*   **Description**: Returns public config and suggested questions.
*   **Response**:
    ```json
    {
      "suggested_questions": ["What is NeoEyes?", "How to install NeoEdge?"],
      "model_info": "DeepSeek-V3",
      "features": { "agent_enabled": true }
    }
    ```

---

## 2. Database Schema (PostgreSQL / SQLite)

### 2.1 Chat History & Analytics
```sql
-- Session tracking
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_ip_hash TEXT NOT NULL, -- Anonymized daily hash
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message history
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id),
    role TEXT CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB, -- Array of source references
    metadata JSONB, -- { "model": "deepseek-v3", "latency_ms": 1200, "tokens": 150 }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User feedback
CREATE TABLE chat_feedback (
    id SERIAL PRIMARY KEY,
    message_id UUID REFERENCES chat_messages(id),
    rating TEXT CHECK (rating IN ('positive', 'negative')),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Vector Database Schema (Qdrant / SQLite-vss)

*   **Collection Name**: `wiki_docs`
*   **Vector Configuration**:
    *   **Dimension**: 1024 (Optimized for `BAAI/bge-m3`).
    *   **Distance Metric**: `Cosine`.
*   **Storage**: SQLite + sqlite-vss（首选，纯进程内，No-Docker）或 Qdrant Cloud（备选）。
*   **Payload Schema**:
    *   `doc_path`: string (relative file path, e.g., `1-neoedge-ng4500-series/0-quick-start.md`)
    *   `doc_title`: string (Document title from frontmatter)
    *   `doc_url`: string (e.g., `/docs/neoedge-ng4500-series/quick-start` or `/en/docs/...`)
    *   `section_title`: string (H2/H3 heading)
    *   `heading_hierarchy`: array of strings (e.g., `["NE301 概述", "核心规格"]`)
    *   `content`: string (Chunk text, 200-800 tokens)
    *   `product_line`: string (`"neoedge"`, `"ne101"`, `"ne301"`, `"ai-application"`, `"general"`)
    *   `language`: string (`"en"` or `"zh-Hans"`)
    *   `tags`: array of strings
    *   `keywords`: array of strings
    *   `content_hash`: string (MD5 hash for incremental update detection)

---

## 4. Indexing State Management

To support incremental updates, the ingestion script (`api/src/scripts/ingest.ts`) uses a SQLite table to track MD5 content hashes:

```sql
CREATE TABLE document_index_status (
    file_path TEXT PRIMARY KEY, -- Source-prefixed key, e.g. "default:1-neoedge/intro.md" or "i18n:1-neoedge/intro.md"
    content_hash TEXT NOT NULL, -- MD5 of file content (used for incremental detection)
    last_indexed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK (status IN ('pending', 'indexed', 'failed', 'deleted'))
);
```

**Key format**: `{source_type}:{relative_path}` — `default:` for Chinese docs (`docs/`), `i18n:` for English docs (`i18n/en/...`).

**Incremental detection logic**:
1. Scan `docs/` and `i18n/en/...` directories for `.md` files
2. Calculate MD5 hash for each file
3. Compare with `content_hash` in `document_index_status`
4. Hash matches + status=indexed → skip (no change)
5. Hash differs or new file → re-chunk + re-vectorize + upsert
6. File deleted → remove corresponding chunks from vector store

**Build pipeline integration** (root `package.json`):
```json
{
  "build": "docusaurus build && cd api && npx tsx src/scripts/ingest.ts",
  "serve": "cd api && npx tsx src/scripts/ingest.ts && cd .. && docusaurus serve",
  "ingest": "cd api && npx tsx src/scripts/ingest.ts",
  "ingest:force": "cd api && npx tsx src/scripts/ingest.ts --force"
}
```

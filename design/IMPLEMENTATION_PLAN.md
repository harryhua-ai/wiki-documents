# Implementation Plan (IMPLEMENTATION_PLAN.md)

This document outlines the step-by-step plan to implement the Ask AI feature (MVP phase).

## Phase 1: Foundation (Days 1-3)

### 1.1 Backend Setup
- [ ] Initialize `api/` Node.js project (TypeScript, Express).
- [ ] Implement `POST /api/chat` skeleton with SSE streaming support.
- [ ] Set up `config/llm.yaml` and Provider abstraction (DeepSeek + GLM fallback).
- [ ] Implement simple in-memory session storage (MVP) or SQLite connection.

### 1.2 Database & Vector Store
- [ ] Set up SQLite + sqlite-vss (首选，纯进程内，No-Docker) 或连接 Qdrant Cloud (备选).
- [ ] Define schemas for `chat_sessions`, `chat_messages`, `chat_feedback` and `document_index_status`.

### 1.3 Ingestion Script
- [ ] Create `api/src/scripts/ingest.ts`.
- [ ] Implement Markdown parsing (frontmatter + heading split).
- [ ] Implement Chunking logic (500 tokens, 50 overlap).
- [ ] Connect Embedding API (SiliconFlow / BAAI bge-m3).
- [ ] Implement MD5 content hash incremental detection (`document_index_status` table).
- [ ] Support `--force` flag to skip hash check and force full rebuild.
- [ ] Support `--dry-run` flag to preview without indexing.
- [ ] Run initial index on all docs (Chinese + English sources).

## Phase 2: Core Logic (Days 4-7)

### 2.1 RAG Pipeline
- [ ] Implement Retrieval logic (Vector search).
- [ ] Implement Prompt construction (System prompt + Context injection).
- [ ] Connect LLM generation stream to API response.

### 2.2 Agent Orchestration (Lite)
- [ ] Implement basic "Intent Classifier" (LLM call).
- [ ] Implement routing logic (Fast vs. Agent).
- [ ] Add "Progress" events to SSE stream for Agent path.

### 2.3 Frontend Widget
- [ ] Create `src/components/AskAI/ChatWidget.tsx` (UI skeleton).
- [ ] Implement `useChat` hook (SSE connection handling).
- [ ] Build `MessageList` and `MarkdownRenderer`.
- [ ] Add `SourceReference` component to display citations.

## Phase 3: Integration & Polish (Days 8-10)

### 3.1 Docusaurus Integration
- [ ] Create `src/theme/Root.tsx` wrapper.
- [ ] Mount ChatWidget globally.
- [ ] Implement CSS Modules styling (`ask-ai.module.css`).
- [ ] Verify Mobile responsiveness.

### 3.2 Testing & tuning
- [ ] Test RAG retrieval accuracy on key questions ("NE301 specs", "NG4500 install").
- [ ] Tune Chunk size and Top-K parameters.
- [ ] Verify Rate Limiting and Error Handling (API down, Network fail).
- [ ] Check i18n support (English vs Chinese queries).

### 3.3 Deployment
- [ ] Configure Nginx reverse proxy on production server.
- [ ] Set up CI/CD workflow for API deployment.
- [ ] Integrate ingest into root `yarn build` (auto-trigger after Docusaurus build).
- [ ] Integrate ingest into root `yarn serve` (auto-trigger before preview).
- [ ] Add `yarn ingest` and `yarn ingest:force` convenience scripts to root `package.json`.
- [ ] Verify incremental detection: second `yarn build` should skip unchanged files.

## Dependencies

### Backend (`api/package.json`)
*   `express`: Web server
*   `cors`, `dotenv`: Middleware
*   `openai`: SDK for compatible APIs (DeepSeek, GLM)
*   `qdrant-client` / `pg`: Database drivers
*   `unified`, `remark-parse`: Markdown processing
*   `zod`: Validation

### Frontend (`package.json`)
*   `react-markdown`: Rendering bot responses
*   `remark-gfm`: Table support in markdown
*   `clsx`: Class toggling
*   `lucide-react`: Icons (optional, or use SVGs)

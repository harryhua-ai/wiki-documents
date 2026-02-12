# Backend and Agent Workflow Specification (BACKEND_SPEC.md)

This document details the backend logic, Agent orchestration, and RAG pipeline for the Ask AI feature.

## 1. Directory Structure

The API service will be a standalone Node.js (TypeScript) app deployed on the same server, proxy-ed via Nginx.

```
api/
├── src/
│   ├── index.ts               # Entry point (Express/Fastify)
│   ├── config/                # YAML/Env config
│   ├── routes/
│   │   ├── chat.ts            # SSE streaming endpoint
│   │   └── feedback.ts        # Feedback logging
│   ├── services/
│   │   ├── agent.ts           # Orchestrator (Coordinator)
│   │   ├── rag.ts             # Retrieval & Re-ranking logic
│   │   ├── llm.ts             # Model Provider abstraction
│   │   └── history.ts         # Session storage
│   ├── lib/
│   │   ├── vector.ts          # Qdrant client
│   │   └── db.ts              # PostgreSQL/SQLite client
│   └── scripts/
│       └── ingest.ts          # Indexing CLI tool (incremental, MD5 hash detection)
├── package.json
└── tsconfig.json
```

## 2. Agent Orchestration Logic

The `Coordinator` determines the execution path based on query intent and retrieval quality.

### 2.1 Pseudo-Code

```typescript
async function handleChat(query, history) {
    // 1. Initial Retrieval (Fast)
    const docs = await vectorStore.search(query, { top: 5 });

    // 2. Intent Classification & Quality Check
    const { intent, isSufficient } = await llm.analyze({ query, docs });

    // 3. Routing
    if (isSufficient || intent === 'SIMPLE_FACT') {
        // --- Fast Path (80%) ---
        emit({ type: 'routing', path: 'fast' });
        const answer = await llm.generate(query, docs, history);
        return stream(answer);
    } else {
        // --- Agent Path (20%) ---
        emit({ type: 'routing', path: 'agent' });

        // Plan: Needs more info?
        emit({ type: 'progress', step: 'Analyzing requirements...' });
        const plan = await llm.plan(query, docs);

        // Execute: Additional retrieval
        if (plan.needsComparison) {
             emit({ type: 'progress', step: 'Retrieving comparison data...' });
             const extraDocs = await vectorStore.search(plan.subQuery);
             docs.push(...extraDocs);
        }

        // Generate final answer
        const answer = await llm.generate(query, dedupe(docs), history);
        return stream(answer);
    }
}
```

## 3. RAG Pipeline Details

### 3.1 Ingestion (Indexing)

**脚本路径**: `api/src/scripts/ingest.ts`

**触发方式**:

| 方式 | 命令 | 说明 |
|------|------|------|
| 构建时自动触发 | `yarn build` | Docusaurus 构建后自动执行增量索引 |
| 预览前自动触发 | `yarn serve` | 启动预览前先执行增量索引 |
| 手动增量 | `yarn ingest` | 仅处理变更文件 |
| 手动全量重建 | `yarn ingest:force` | 跳过 hash 检查，强制重建 |

**增量检测机制**:

脚本通过 SQLite `document_index_status` 表追踪 MD5 内容哈希，实现智能增量更新：
1. 扫描 `docs/` (中文) 和 `i18n/en/...` (英文) 两个 source 目录
2. 对每个文件计算 MD5 content hash
3. 与 `document_index_status` 表中 `content_hash` 对比（key 格式：`{source_type}:{filePath}`，如 `default:1-neoedge/intro.md`）
4. Hash 相同且 status=indexed → 跳过
5. Hash 不同或文件新增 → 重新分块 + 向量化 + upsert
6. 文件被删除 → 从向量库中删除对应 chunks

**处理流程**:
1.  **Parsing**: Use `remark` / `unified` to parse Markdown.
2.  **Chunking**:
    *   Split by Headings (H2, H3).
    *   **Max Size**: 500 tokens.
    *   **Overlap**: 50 tokens.
    *   **Preserve**: Code blocks and tables (do not split).
3.  **Embedding**:
    *   Model: `BAAI/bge-m3` (via SiliconFlow API).
    *   Dimension: 1024.
4.  **Storage**:
    *   首选: SQLite + sqlite-vss（纯进程内，No-Docker）。
    *   备选: Qdrant Cloud（数据量极大时）。
    *   Metadata: `{ doc_path, doc_title, doc_url, section_title, heading_hierarchy, product_line, language, tags, keywords, content_hash }`.

### 3.2 Retrieval Strategy
*   **Hybrid Search**:
    *   **Semantic**: Cosine similarity on vectors.
    *   **Keyword**: BM25 (if using Qdrant) or simple SQL `LIKE` fallback.
*   **Re-ranking** (Optional for MVP):
    *   If simple retrieval precision is low, add a Re-ranker step (e.g., `bge-reranker`).

## 4. Prompt Engineering

### 4.1 System Prompt (Generation)
```text
You are the CamThink Wiki AI assistant.
Context: {context}

Instructions:
1. Answer the user's question using ONLY the provided context.
2. If the answer is not in the context, state "I cannot find this information in the documentation."
3. Cite sources in format [Title § Section].
4. Use the user's language ({language}).
5. For "How-to" questions, provide step-by-step instructions.
```

### 4.2 LLM Provider Configuration (`config/llm.yaml`)

```yaml
providers:
  deepseek:
    base_url: https://api.deepseek.com/v1
    api_key: ${DEEPSEEK_API_KEY}
    model: deepseek-chat

  fallback_zhipu:
    base_url: https://open.bigmodel.cn/api/paas/v4
    api_key: ${ZHIPU_API_KEY}
    model: glm-4-flash
```

## 5. Deployment & Security

*   **API Key Management**: Keys stored in `.env` on the server, never exposed to client.
*   **Rate Limiting**: `express-rate-limit` middleware (10 req/min per IP).
*   **CORS**: Restrict to `https://wiki.camthink.ai`.

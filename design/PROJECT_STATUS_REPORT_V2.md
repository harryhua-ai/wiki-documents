# Ask AI 工程状态深度分析报告 (v2.0)

**报告日期**: 2026-02-12
**当前阶段**: Phase 6 - Quality Assurance & Tuning (质量保证与调优)
**整体状态**: 🟢 **Feature Complete** (功能开发完成) | 🟡 **Needs Tuning** (需调优)

---

## 1. 核心架构与代码质量分析

后端代码 (`api/src/`) 展现了成熟的 RAG 架构设计，逻辑清晰，模块化程度高。

*   **RAG 检索引擎 (`services/rag.ts`)**:
    *   **混合检索策略**: 采用了 **多语言并行检索** (En + Zh) + **重排序 (Rerank)** 的高级策略。
        *   *亮点*: 实现了 `thinkModeAnalyze` (思考模式)，在检索前先通过 LLM 分析用户意图和语言偏好，这比传统的关键词匹配更智能。
    *   **智能回退**: 具备完善的 "Not Found" 处理逻辑。如果文档检索失败，会尝试调用外部工具 (Agent Tools) 或返回标准拒答话术。
    *   **去重逻辑**: `toSourceReferences` 函数中实现了基于 `docPath + section` 的去重机制，理论上能合并同一章节的多个切片。

*   **向量存储 (`lib/vector.ts`)**:
    *   **多后端支持**: 优雅地抽象了 `VectorStore` 类，同时支持 Qdrant (生产)、pgvector 和 SQLite (本地/MVP)，便于环境迁移。
    *   **当前配置**: 代码显示 MVP 阶段主要使用 SQLite 本地向量库，这符合 `No-Docker` 的轻量化部署要求。

*   **安全性 (`routes/chat.ts`)**:
    *   **隐私保护**: IP 地址已通过 SHA-256 + Salt 进行哈希脱敏，未明文存储用户 IP。
    *   **防护**: 使用了 Zod Schema 严格验证请求体，防止注入攻击。

## 2. 已知问题根本原因分析 (Root Cause Analysis)

针对 `issues.md` 中反馈的两个核心体验问题，结合代码分析如下：

| 问题 | 现象 | 代码根源 (`src/services/rag.ts`) | 修复方案建议 |
| :--- | :--- | :--- | :--- |
| **1. 无关引用源** | LLM 拒答或回答通用知识时，仍列出不想干的文档来源。 | 1. `MIN_SOURCE_SCORE` 设置为 **0.3** (Line 38)，阈值过低。<br>2. `isNotFoundResponse` 虽然能检测拒答，但如果 LLM 回答了部分内容（如通用建议），则不会触发清空 Sources 的逻辑。 | **提高阈值**: 将 `MIN_SOURCE_SCORE` 提升至 **0.55** 或 **0.6**。<br>**动态过滤**: 仅保留分数在 Top 1 分数 **80%** 以上的文档。 |
| **2. 重复引用源** | Source 列表中出现多个指向同一文档甚至同一段落的链接。 | `toSourceReferences` (Line 226) 的去重 Key 是 `${docPath}:::${section}`。<br>**漏洞**: 如果某些文档切片没有解析出 `section_title` (为 null/empty)，或者同一页面的不同片段被视为不同来源，去重就会失效。 | **加强去重**: 增加基于 `url` 的二级去重。如果两个 Source 的 URL 完全相同（忽略锚点），应合并显示。 |

## 3. 详细实施与验收情况 (Implementation Status)

| 模块 | 组件/功能 | 状态 | 说明 |
| :--- | :--- | :--- | :--- |
| **Backend API** | SSE Stream `/chat` | ✅ 完成 | 支持流式输出、工具调用状态回传 |
| | Feedback `/feedback` | ✅ 完成 | 数据库存储已就绪 |
| | Vector Search | ✅ 完成 | 支持中英混合检索、元数据过滤 |
| | **Unit Tests** | ❌ 缺失 | `api/src/lib/__tests__` 存在但未覆盖核心业务逻辑 |
| **Frontend** | Chat Interface | ✅ 完成 | 悬浮窗、消息气泡、Markdown渲染 |
| | Citation UI | ✅ 完成 | 点击跳转、悬浮显示预览 |
| **Data** | Ingestion Script | ✅ 完成 | 增量更新 (MD5 Check) 已实现 |

## 4. 下一步行动计划 (Action Items)

为了达到最终交付标准，建议立即执行以下 **Tuning & Fix** 任务：

1.  **调优 RAG 参数 (优先级: High)**
    *   修改 `api/src/services/rag.ts`:
        *   将 `MIN_SOURCE_SCORE` 从 `0.3` 调整为 `0.55`。
        *   在 `toSourceReferences` 中增加 URL 归一化去重逻辑。
2.  **完善测试 (优先级: Medium)**
    *   为 `rag.ts` 编写单元测试，模拟 "低相关性" 和 "重复文档" 的场景，验证去重和过滤逻辑是否生效。
3.  **最终验收 (优先级: High)**
    *   使用 `issues.md` 中的截图案例（如 "NE301 specs"）进行回归测试。

## 5. 结论

工程代码质量很高，架构设计具有前瞻性（支持 Agent 和 Think Mode）。目前的体验问题属于典型的 **RAG 调优阶段** 问题，不需要重构代码，只需调整参数和优化过滤逻辑即可解决。

建议批准进入 **Phase 6.1: Parameter Tuning** 阶段。

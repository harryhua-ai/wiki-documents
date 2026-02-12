# Ask AI — 产品需求文档 (PRD)

> **项目**: CamThink Wiki · Ask AI 智能问答功能
> **版本**: v1.1
> **日期**: 2026-02-12
> **状态**: Approved

---

## 1. 背景与目标

### 1.1 项目背景

**CamThink Wiki** 是一个基于 Docusaurus 3 构建的知识库系统，旨在为开发者提供 NeoEdge/NeoEyes 系列产品的技术支持。

**项目结构特点：**
- **中文文档（核心）**：存放于 `docs/` 目录（作为默认语言内容）。
- **英文文档**：存放于 `i18n/en/` 目录。
- **构建机制**：基于 `docusaurus.config.js` 自动处理国际化构建，无需创建 `i18n/zh-Hans` 文件夹。
- **部署环境**：生产环境为非容器化环境（No Docker），直接运行在 Linux/Node.js 环境下。

当前搜索仅支持关键词匹配，无法处理自然语言提问或跨文档的复杂逻辑查询。

### 1.2 目标

构建 **Ask AI** 功能，采用 **Agent + RAG（检索增强生成）** 的混合架构：

1.  **优先 RAG**：优先从 `docs/` 和 `i18n/en/` 的本地 Markdown 知识库中检索答案。
2.  **Agent 兜底**：如果 RAG 无法找到答案，自动触发 Agent 工作流，联网检索 **官网 (www.camthink.ai)** 和 **GitHub (github.com/camthink-ai)**。
3.  **准确回复**：确保回答准确并附带来源链接（Wiki 链接或外部 URL）。

**核心指标：**

| 指标 | 目标值 |
|------|--------|
| 回答准确率（基于知识库内容） | ≥ 85% |
| 首次回答时间（P95） | ≤ 5 秒 |
| 回答附带来源引用比例 | 100% |
| 用户满意度（点赞率） | ≥ 70% |

---

## 2. 用户画像与使用场景

### 2.1 用户画像

| 角色 | 描述 | 典型问题 |
|------|------|----------|
| **硬件工程师** | 使用 CamThink 开发板进行产品原型开发 | "NG4500 的 GPIO 引脚定义是什么？" |
| **AI 开发者** | 在边缘设备上部署推理模型 | "如何在 NG4500 上用 DeepStream 跑 YOLOv8？" |
| **系统集成商** | 评估和集成 CamThink 产品到方案中 | "NE301 和 NE101 在功耗上有什么区别？" |
| **新用户/决策者** | 初次了解 CamThink 产品 | "哪款产品适合做室外垃圾分类检测？" |

### 2.2 核心使用场景

**场景 1：精确技术查询**
```
用户: "NE301 的摄像头模块支持哪些分辨率？"
AI: 根据文档，NE301 支持以下摄像头配置：... [引用自: NE301 硬件指南 §摄像头模块]
```

**场景 2：操作指导**
```
用户: "如何给 NG4500 刷系统？"
AI: 请按以下步骤操作：1. 准备 SD 卡... 2. 下载镜像... [引用自: NG4500 快速入门]
```

**场景 3：跨文档对比**
```
用户: "NE101 和 NE301 分别适合什么场景？"
AI: NE101 基于 ESP32-S3，适合低功耗间歇拍照场景... NE301 基于 STM32N6，适合实时视觉推理...
    [引用自: NE101 概述, NE301 概述]
```

**场景 4：问题排查**
```
用户: "NG4500 的 WiFi 连不上怎么办？"
AI: 常见原因及解决方法：1. 检查驱动是否安装... [引用自: NG4500 WiFi 驱动安装, NG4500 FAQ]
```

---

## 3. 功能设计

### 3.1 功能概览

```
┌──────────────────────────────────────────────────────────────┐
│                        Ask AI 系统                            │
│                                                               │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────────────┐ │
│  │  前端     │──▶│  后端     │──▶│  Agent 编排器              │ │
│  │  Chat UI  │◀──│  API      │◀──│  (意图分析 → 路径决策)     │ │
│  └──────────┘   └──────────┘   └──────────┬───────────────┘ │
│       │                          ┌─────────┴─────────┐       │
│       │                          ▼                   ▼       │
│       │                   ┌────────────┐    ┌─────────────┐  │
│       │                   │ 快速路径    │    │ 升级路径     │  │
│       │                   │ RAG 检索    │    │ 多次检索 +   │  │
│       │                   │ → LLM 生成  │    │ Agent 推理   │  │
│       │                   └────────────┘    └─────────────┘  │
│       │         ┌──────────────┐                              │
│       └────────▶│  数据管线     │                              │
│                 │  (索引构建)   │                              │
│                 └──────────────┘                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 前端功能

#### 3.2.1 入口方式

**浮动按钮（Primary Entry）**

- 页面右下角固定位置的圆形按钮
- 图标：AI/聊天气泡图标
- 点击展开聊天面板
- 适配移动端（底部全屏展开）

**搜索栏增强（Secondary Entry）**

- 在现有搜索栏旁添加 "Ask AI" 切换按钮
- 用户可在关键词搜索和 AI 问答之间切换

#### 3.2.2 聊天面板

```
┌─────────────────────────────────┐
│  🤖 Ask CamThink AI        ✕   │  ← 标题栏 + 关闭按钮
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │ 👋 你好！我是 CamThink    │  │  ← 欢迎消息
│  │ AI 助手，可以帮你查询     │  │
│  │ Wiki 文档中的任何信息。   │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌──────────┐ ┌──────────┐     │
│  │ 如何快速  │ │ NE301 和 │     │  ← 推荐问题（Quick Prompts）
│  │ 上手 NG4500│ │ NE101    │     │
│  └──────────┘ │ 有什么区别│     │
│               └──────────┘     │
│                                 │
│  [User] NE301 支持哪些 AI 模型？│  ← 用户消息
│                                 │
│  [AI] 根据文档，NE301 支持...  │  ← AI 回答
│  📎 参考来源:                  │  ← 来源引用
│  • NE301 AI 工具链 §模型部署   │
│  • NE301 模型训练与部署指南     │
│                                 │
│  👍 👎                         │  ← 反馈按钮
│                                 │
├─────────────────────────────────┤
│  [输入你的问题...]    [发送 ▶]  │  ← 输入区域
└─────────────────────────────────┘
```

#### 3.2.3 回答格式

每条 AI 回答包含：

| 元素 | 说明 |
|------|------|
| **回答正文** | Markdown 格式，支持代码块、列表、表格 |
| **参考来源** | 引用的文档标题 + 链接（可点击跳转） |
| **引用段落** | 可展开查看被引用的原文段落（折叠态） |
| **反馈按钮** | 👍 有帮助 / 👎 没帮助 |
| **追问建议** | 基于当前对话推荐 2-3 个相关问题 |

#### 3.2.4 多语言智能处理（Language Agnostic RAG）

系统需彻底解耦“页面语言”与“问答语言”，实现**全库检索 + 提问语言自适应**。

**核心逻辑：**

1.  **输入与页面解耦**
    *   用户在英文页面 (`/en/docs/...`) 提问中文 → **用中文回答**。
    *   用户在中文页面 (`/docs/...`) 提问英文 → **用英文回答**。
    *   混合语言提问（如 "NE301 的 NPU performance 怎么样？"） → **检测主语言（中文）回答**。

2.  **全库检索 (Global Retrieval)**
    *   **强制双语检索**：无论用户语言如何，Agent **默认同时检索** 中文 (`docs/`) 和 英文 (`i18n/en/`) 两个命名空间的文档。
    *   **混合排序**：将中英文检索结果合并，基于相关性（Re-ranking score）统一排序。
    *   **消除语言壁垒**：如果中文文档中没有答案，但英文文档中有（或反之），AI 需阅读异构语言文档，并**翻译**成用户提问的语言进行回答。

3.  **引用透明化**
    *   引用来源显示原始文档的标题和语言（例如：`[English] NE301 Overview`）。
    *   点击链接跳转到对应语言的文档页面。

**技术实现约束：**
*   `retrieve` 函数默认不应过滤 `language`，除非 intent 明确指定。
*   System Prompt 中必须包含动态指令：`Answer strictly in the detected language of the user's query ("${detectedLang}"), regardless of the document language.`

#### 3.2.5 交互细节

| 交互 | 行为 |
|------|------|
| 打开聊天 | 面板从右下角滑入，背景不遮罩（不打断阅读） |
| 关闭聊天 | 点击 ✕ 或 Esc 键关闭，对话历史保留在 Session 中 |
| 发送消息 | Enter 发送，Shift+Enter 换行 |
| 等待回答 | 显示打字动画（streaming 逐字输出） |
| Agent 深入分析 | 升级路径时显示"正在深入分析..."进度提示（基于 SSE `progress` 事件） |
| 点击来源 | 在新标签页打开对应文档（带锚点定位到相关段落） |
| 移动端 | 全屏面板，底部输入框固定 |
| 暗色模式 | 自动跟随站点主题切换 |
| 历史记录 | 单次 Session 内保留对话上下文（刷新后清空） |

### 3.3 后端功能

#### 3.3.1 系统架构

```
                     ┌───────────────┐
                     │   Docusaurus   │
                     │   Static Site  │
                     └───────┬───────┘
                             │ HTTPS
                             ▼
                     ┌───────────────┐
                     │    Nginx       │
                     │  (反向代理)    │
                     │  同服务器部署  │
                     └───────┬───────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌──────────────┐ ┌──────────┐ ┌──────────────┐
     │  Chat API     │ │ Feedback │ │  Analytics   │
     │  /api/chat    │ │ API      │ │  API         │
     └──────┬───────┘ └──────────┘ └──────────────┘
            │
            ▼
     ┌──────────────────────────────────────────────┐
     │         Agent 编排器 (Orchestrator)            │
     │                                               │
     │  1. 接收查询，检测 Query 语言                    │
     │  2. 强制双语 RAG 检索 (docs/ + i18n/en/)        │
     │  3. 评估检索结果质量（相关性 + 覆盖度）           │
     │  4. 决策分支：                                  │
     │     ├─ 充分 → 直接生成回答（快速路径 ~3s）       │
     │     ├─ 不充分 → 多次检索 + 推理（升级路径 ~5-8s） │
     │     └─ 无结果 → Agent 兜底（官网 + GitHub）      │
     │  5. 用 Query 语言生成回答 + 来源标注             │
     └─────────┬────────────────┬───────────────────┘
               │                │
               ▼                ▼
     ┌──────────────┐  ┌──────────────┐
     │  RAG Engine   │  │  LLM API     │
     │  向量检索     │  │  生成回答     │
     │  (SQLite-vss  │  │  (DeepSeek /  │
     │  / Qdrant     │  │   GLM / etc.) │
     │    Cloud)     │  │              │
     └──────────────┘  └──────────────┘
```

#### 3.3.2 Agent-first 工作流（混合检索策略）

系统采用 **Agent + RAG** 双层检索架构，确保回答的覆盖率和准确性。

```mermaid
graph TD
    User[用户提问] --> Agent[Agent 编排器]
    Agent --> Intent{意图分析}

    Intent -->|技术/文档问题| RAG[本地 RAG 检索]
    Intent -->|产品/代码问题| Web[外部源检索]

    subgraph Local_Knowledge [本地知识库 (Priority 1)]
        RAG -->|检索 docs & i18n| VectorDB[(SQLite/Qdrant)]
        VectorDB --> Check{结果充分?}
        Check -->|是| GenLocal[生成回答 + Wiki 链接]
        Check -->|否| Web
    end

    subgraph External_Sources [外部扩展源 (Priority 2)]
        Web -->|检索| Official[官网 www.camthink.ai]
        Web -->|检索| Github[GitHub camthink-ai]
        Official & Github --> GenExt[生成回答 + 外部链接]
    end

    GenLocal & GenExt --> Final[最终回复]
```

**执行流程详情：**

1.  **Level 1: 本地 RAG (Wiki)**
    *   **源数据**：`docs/` (中文) + `i18n/en/` (英文)。
    *   **行为**：向量检索 + 关键词重排序。
    *   **判定**：如果检索结果相关度 > 0.7 且内容足以回答问题，直接生成回复。

2.  **Level 2: Agent 扩展检索 (Fallback)**
    *   **触发条件**：本地 RAG 无结果，或相关度低，或用户明确询问 Wiki 之外的内容（如"最新价格"、"具体代码实现"）。
    *   **工具集**：
        *   `OfficialSiteSearch`: 检索 `www.camthink.ai`（获取最新产品参数、价格、Store 信息）。
        *   `GithubSearch`: 检索 `https://github.com/camthink-ai`（获取 SDK 源码、Issues、Readme）。
    *   **行为**：实时抓取相关页面内容作为上下文。

3.  **回复生成**
    *   必须包含 **来源链接**。
    *   若来自 Wiki，链接到 `/docs/...`。
    *   若来自官网/GitHub，链接到原始 URL。

#### 3.3.3 数据管线（索引构建）

**触发时机：**

| 触发方式 | 命令 | 说明 |
|---------|------|------|
| **构建时自动触发** | `yarn build` | Docusaurus 构建完成后自动执行增量索引重建 |
| **预览前自动触发** | `yarn serve` | 启动预览服务前先执行增量索引，确保向量库是最新的 |
| **手动增量触发** | `yarn ingest` | 仅处理变更文件（基于 MD5 内容哈希检测） |
| **手动全量重建** | `yarn ingest:force` | 跳过哈希检查，强制重建所有文档索引 |
| **CI/CD 触发** | GitHub Actions 部署流程中自动执行 | 与现有部署流程集成 |

**增量检测机制（已实现）：**

`ingest.ts` 脚本通过 SQLite `document_index_status` 表追踪每个文件的 MD5 内容哈希，实现智能增量更新：

1. 扫描 `docs/` (中文) 和 `i18n/en/...` (英文) 目录下所有 `.md` 文件
2. 对每个文件计算 MD5 content hash
3. 与 `document_index_status` 表中的 `content_hash` 对比
4. Hash 相同且 status=indexed → **跳过**（无变更）
5. Hash 不同或文件新增 → **重新分块 + 向量化 + upsert**
6. 文件被删除 → **从向量库中删除对应 chunks**

**构建集成方案（根目录 `package.json`）：**

```json
{
  "scripts": {
    "build": "docusaurus build && cd api && npx tsx src/scripts/ingest.ts",
    "serve": "cd api && npx tsx src/scripts/ingest.ts && cd .. && docusaurus serve",
    "ingest": "cd api && npx tsx src/scripts/ingest.ts",
    "ingest:force": "cd api && npx tsx src/scripts/ingest.ts --force"
  }
}
```

- `build`：Docusaurus 构建完成后自动触发增量索引（使用 `&&` 链接，build 失败则不执行 ingest）
- `serve`：预览前先运行一次 ingest 确保向量库最新，再启动 docusaurus serve
- `ingest`：独立增量索引命令（仅处理变更文件）
- `ingest:force`：强制全量重建（支持 `--force` 参数跳过 hash 检查）

**处理流程：**

```
输入源:
  ├── 中文: docs/**/*.md
  └── 英文: i18n/en/**/*.md
       │
       ▼
  [MD5 哈希对比] ← document_index_status (SQLite)
       │
  ┌────┴────┐
  │ 无变更   │ 有变更/新增
  │ (跳过)  │     │
  └─────────┘     ▼
            [文本分块 & 向量化]
                  │
                  ▼
            [存储] -> SQLite (vector) / Qdrant Cloud
                  │
                  ▼
            [更新 document_index_status]
```

**No-Docker 适配：**
由于项目无 Docker 环境，数据管线应设计为纯 Node.js 脚本 (`tsx src/scripts/ingest.ts`)，直接读取文件系统并在本地进程中处理。增量检测逻辑确保重复构建时不会重复处理未变更文件。

**Chunk 数据结构：**

```json
{
  "id": "ne301-overview-section2-chunk1",
  "content": "NE301 基于 STM32N6 处理器，集成 NPU...",
  "metadata": {
    "doc_path": "docs/5-neoeyes-ne301-series/1-overview.md",
    "doc_title": "NeoEyes NE301 概述",
    "doc_url": "/docs/neoeyes-ne301-series/overview",
    "section_title": "核心规格",
    "heading_hierarchy": ["NeoEyes NE301 概述", "核心规格"],
    "product_line": "neoeyes-ne301",
    "language": "zh-Hans",
    "tags": ["产品概述", "NE301"],
    "keywords": ["STM32N6", "NPU", "Cortex-M55"]
  },
  "embedding": [0.012, -0.034, ...],  // 1536-dim vector
  "content_hash": "a3f2c8..."         // 用于增量更新检测
}
```

#### 3.3.4 API 设计

**POST /api/chat**

Request:
```json
{
  "message": "NE301 支持哪些 AI 模型？",
  "conversation_id": "conv_abc123",
  "language": "zh-Hans",   // 可选，仅作为 UI 语言提示；实际回答语言由 Query 内容自动检测
  "history": [
    { "role": "user", "content": "之前的问题" },
    { "role": "assistant", "content": "之前的回答" }
  ]
}
```

Response (SSE streaming):
```
data: {"type": "routing", "path": "fast"}
data: {"type": "chunk", "content": "根据"}
data: {"type": "chunk", "content": "文档，"}
data: {"type": "chunk", "content": "NE301 支持..."}
data: {"type": "sources", "sources": [
  {
    "title": "NE301 AI 工具链",
    "url": "/docs/neoeyes-ne301-series/application-guide/ai-tool-stack",
    "section": "模型部署",
    "excerpt": "NE301 支持 STM32Cube.AI 工具链，可将 TensorFlow Lite..."
  }
]}
data: {"type": "suggestions", "items": [
  "NE301 模型训练流程是什么？",
  "如何将 ONNX 模型部署到 NE301？"
]}
data: {"type": "done"}
```

**Agent 升级路径时的 SSE 事件序列：**
```
data: {"type": "routing", "path": "agent"}
data: {"type": "progress", "step": "正在检索相关文档..."}
data: {"type": "progress", "step": "正在深入分析，检索更多文档..."}
data: {"type": "progress", "step": "正在综合多篇文档生成回答..."}
data: {"type": "chunk", "content": "根据多篇文档综合分析，"}
data: {"type": "chunk", "content": "NE101 和 NE301 的区别..."}
data: {"type": "sources", "sources": [...]}
data: {"type": "suggestions", "items": [...]}
data: {"type": "done"}
```

**SSE 事件类型说明：**

| 事件类型 | 字段 | 说明 |
|---------|------|------|
| `routing` | `path`: `"fast"` \| `"agent"` | 告知前端当前走哪条路径，用于 UI 状态展示 |
| `progress` | `step`: string | Agent 升级路径时的进度提示（仅 `path=agent` 时发送） |
| `chunk` | `content`: string | 回答内容片段（streaming 逐字输出） |
| `sources` | `sources`: array | 参考来源列表 |
| `suggestions` | `items`: array | 追问建议 |
| `done` | — | 回答结束 |

**POST /api/feedback**

```json
{
  "conversation_id": "conv_abc123",
  "message_id": "msg_xyz789",
  "rating": "positive",
  "comment": ""
}
```

#### 3.3.5 Prompt 工程

**System Prompt：**

```
你是 CamThink Wiki 的 AI 助手。你的任务是根据提供的文档内容回答用户关于
CamThink 产品（NeoEdge NG4500、NeoEyes NE101、NeoEyes NE301）的技术问题。

规则：
1. 仅基于提供的文档内容回答，不要编造信息
2. 如果文档中没有相关信息，明确告知用户 "当前文档中未找到相关信息"
3. 回答时标注引用来源，格式为 [来源: 文档标题 §章节名]
4. 保持技术准确性，使用与文档一致的术语
5. **语言规则（关键）**：
   - 检测用户 Query 的主语言（中文/英文），严格使用该语言回答
   - 忽略当前页面语言设置，仅以用户实际提问的语言为准
   - 如果参考文档与用户语言不同，将文档内容翻译为用户语言后呈现
   - 混合语言提问时（如 "NE301 的 NPU performance"），按中文字符是否存在判定主语言
6. 对于操作类问题，按步骤列出操作流程
7. 对于对比类问题，使用表格呈现关键差异
```

---

## 4. 技术选型

### 4.1 方案对比

| 方案 | 描述 | 优势 | 劣势 |
|------|------|------|------|
| **A: 全托管 SaaS** | 使用 Mendable / Inkeep 等文档 AI 服务 | 零开发，即插即用 | 定制性低，持续费用高，数据外泄风险 |
| **B: 自建 RAG** | 自建向量数据库 + LLM API | 完全可控，可深度定制 | 需要开发和维护 |
| **C: 纯前端方案** | 浏览器内运行小模型 + 本地搜索 | 无后端成本 | 模型能力有限，首次加载大 |
| **D: Agent 工作流** | LLM Agent 自主规划 + 多工具调用 + 迭代推理 | 复杂问题处理能力强，可自我纠错 | 延迟高，成本高，开发复杂 |
| **B+D: 混合架构 (推荐)** | Agent 编排 + RAG 检索，双路径自动切换 | 兼顾速度和质量，成本可控 | 需要设计评估逻辑和路径切换 |

**推荐方案 B+D（Agent-first + RAG 混合架构）**：Agent 作为顶层编排器，每次查询都经过 Agent；快速路径走 RAG 单次检索（~80% 查询），升级路径走 Agent 多次检索（~20% 查询），月成本控制在 ~$50 内。

#### 4.1.1 混合架构（B+D）设计说明

**为什么 MVP 就采用混合架构？**

| 考量 | 说明 |
|------|------|
| **Agent 编排开销可控** | 使用单 Agent 多次检索策略（非多 Agent 协作），额外成本仅 ~$18/月 |
| **复杂问题质量显著提升** | 跨文档对比、多步骤排查等场景准确率从 ~75% 提升至 ~85-90% |
| **架构统一** | 所有查询走同一 Agent 入口，避免后续重构；快速路径本质是 Agent 只调用一次工具 |
| **渐进式体验** | 快速路径 ~3s，升级路径 ~5-8s（配合进度提示），用户体验可接受 |

**架构流程：**

```
用户问题 → Agent 编排器（每次查询都经过）
  │
  ├─ 调用 RAG 工具进行向量检索
  │
  ├─ 评估检索结果质量
  │   ├─ 充分（score ≥ 0.7，覆盖完整）→ 直接生成回答（快速路径 ~3s）
  │   └─ 不充分 → 进入升级路径
  │       ├─ 换 query 重新检索（改写问题表述）
  │       ├─ 按产品线定向搜索（metadata 过滤）
  │       └─ 关键词补充（全文搜索兜底）
  │
  └─ 综合结果 → 生成回答 + 来源标注
```

**按使用场景效果对比：**

| 场景 | 纯 RAG | 混合架构（Agent + RAG） |
|------|--------|----------------------|
| **精确技术查询** "NE301 摄像头支持哪些分辨率？" | 一次检索命中，足够 ✅ | Agent 快速路径，等效于 RAG ✅ |
| **操作指导** "如何给 NG4500 刷系统？" | 检索到快速入门文档，足够 ✅ | Agent 快速路径，等效于 RAG ✅ |
| **跨文档对比** "NE101 和 NE301 分别适合什么场景？" | 单次检索可能只命中一个产品 ⚠️ | Agent 分两次检索，分别查 NE101 和 NE301 ✅ |
| **问题排查** "NG4500 WiFi 连不上？" | 可能遗漏多文档信息 ⚠️ | Agent 逐步排查，检索多个知识源 ✅ |

**关键指标对比（基于 5,000 次/月问答量）：**

| 维度 | 纯 RAG | 混合架构（Agent + RAG） |
|------|--------|----------------------|
| 首次回答时间（P95） | 2-3s | 快速路径 ~3s / 升级路径 ~5-8s |
| 月度 LLM 成本 | ~$24 | ~$42（符合 $50 预算） |
| 回答准确率（简单问题） | ≥ 90% | ≥ 90% |
| 回答准确率（复杂问题） | ~75% | ~85-90% |
| 开发复杂度 | 中等 | 中等偏上（增加 Agent 编排 + 质量评估） |
| 行为可预测性 | 高（固定流程） | 高（单 Agent + 规则评估，行为确定） |
| MVP 适合度 | 适合 | 适合（Agent 编排开销可控） |

### 4.2 推荐技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| **前端组件** | React (Docusaurus 内置) | 复用现有组件模式，新增 ChatWidget |
| **API 层** | 自有云服务器（见 §4.4 部署分析） | 与现有 Wiki 部署架构一致 |
| **Agent 框架** | 自定义 ReAct loop / LangChain | 单 Agent 多次检索，轻量编排 |
| **质量评估** | 基于规则（相似度阈值）+ LLM 判断 | 决定快速路径 / 升级路径 |
| **向量数据库** | SQLite + sqlite-vss (首选) 或 Qdrant Cloud | 详见 §4.4，No-Docker 环境 |
| **Embedding 模型** | 多选，见 §4.2.1 | 支持切换和 fallback |
| **LLM** | 多选，见 §4.2.2 | Provider 抽象层，支持热切换 |
| **索引构建** | GitHub Actions (CI/CD 内) | 与现有部署流程集成 |
| **数据存储** | PostgreSQL / SQLite | 存储问答日志、反馈、命中率统计 |
| **监控** | Langfuse (开源) | LLM 调用追踪、质量监控 |

#### 4.2.1 Embedding 模型选型（多选）

系统通过 Provider 抽象层支持多个 Embedding 模型，可在配置文件中切换：

| 模型 | 提供商 | 维度 | 免费额度 | 定价 | 中英双语 | API 兼容 |
|------|--------|------|---------|------|---------|---------|
| **BAAI/bge-m3** | SiliconFlow 托管 | 1024 | **完全免费** | ¥0 | 优秀 | OpenAI 兼容 |
| **text-embedding-v3** | 阿里云 DashScope | 1024/768 | 100 万 tokens 免费 | ¥0.7/百万 tokens | 优秀 | OpenAI 兼容 |
| Embedding-3 | 智谱 AI | 2048 | 免费 | ¥0.5/百万 tokens | 优秀 | OpenAI 兼容 |
| text-embedding-3-small | OpenAI | 1536 | 无 | $0.02/百万 tokens | 良好 | 原生 |

**推荐：**
- **首选**：`BAAI/bge-m3` via SiliconFlow — 完全免费，中英双语效果优秀，开源模型
- **备选**：阿里云 `text-embedding-v3` — 免费额度充足，大厂稳定性保障

#### 4.2.2 LLM 生成模型选型（多选）

系统设计为 **Provider 抽象层**，所有模型通过统一接口调用（OpenAI-compatible），支持：
- 配置文件切换主模型
- 自动 fallback（主模型超时/报错时切换备用模型）
- A/B 测试（按比例分流到不同模型，对比回答质量）

**国产免费/低成本模型：**

| 模型 | 提供商 | 免费额度 | 超出定价 (输入/输出) | Streaming | API 兼容 | 适合场景 |
|------|--------|---------|---------------------|-----------|---------|---------|
| **DeepSeek-V3** | DeepSeek | 新用户 500 万 tokens | ¥1 / ¥2 每百万 tokens | 支持 | OpenAI 兼容 | RAG 问答（性价比极高） |
| **DeepSeek-R1** | DeepSeek | 同上共享额度 | ¥4 / ¥16 每百万 tokens | 支持 | OpenAI 兼容 | 复杂推理（Agent 阶段） |
| **Qwen-Turbo** | 阿里云 DashScope | **100 万 tokens 免费** | ¥2 / ¥6 每百万 tokens | 支持 | OpenAI 兼容 | RAG 问答（免费额度大） |
| **Qwen-Plus** | 阿里云 DashScope | 100 万 tokens 免费 | ¥4 / ¥12 每百万 tokens | 支持 | OpenAI 兼容 | 高质量回答 |
| **GLM-4-Flash** | 智谱 AI | **完全免费** | ¥0 | 支持 | OpenAI 兼容 | 零成本兜底方案 |
| **GLM-4-Air** | 智谱 AI | 免费 | ¥1 / ¥1 每百万 tokens | 支持 | OpenAI 兼容 | 成本极低 |
| **ERNIE-Speed-128K** | 百度千帆 | **完全免费** | ¥0 | 支持 | 自有 SDK | 零成本备选 |
| **Doubao-lite-128k** | 字节火山引擎 | 50 万 tokens 免费 | ¥0.3 / ¥0.6 每百万 tokens | 支持 | OpenAI 兼容 | 极低成本 |

**海外模型（作为高质量备选）：**

| 模型 | 提供商 | 定价 (输入/输出) | 说明 |
|------|--------|-----------------|------|
| GPT-4o-mini | OpenAI | $0.15 / $0.60 每百万 tokens | 海外访问，质量稳定 |
| Claude 3.5 Haiku | Anthropic | $0.25 / $1.25 每百万 tokens | 推理质量高 |

**推荐配置：**

```yaml
# config/llm.yaml — 模型配置（支持热切换，无需重新部署）

# 主模型：性价比最优
primary:
  provider: deepseek
  model: deepseek-chat          # DeepSeek-V3
  api_base: https://api.deepseek.com/v1
  max_tokens: 2048
  temperature: 0.3

# 备用模型 1：免费兜底
fallback_1:
  provider: zhipu
  model: glm-4-flash            # 完全免费
  api_base: https://open.bigmodel.cn/api/paas/v4
  max_tokens: 2048

# 备用模型 2：高质量
fallback_2:
  provider: alibaba
  model: qwen-plus
  api_base: https://dashscope.aliyuncs.com/compatible-mode/v1
  max_tokens: 2048

# Embedding 模型
embedding:
  provider: siliconflow
  model: BAAI/bge-m3            # 完全免费
  api_base: https://api.siliconflow.cn/v1

# 模型切换不需要改代码，只需修改此配置文件
```

**Provider 抽象层设计：**

```
所有模型统一走 OpenAI-compatible 接口：
POST {api_base}/chat/completions
POST {api_base}/embeddings

后端 llm.ts 代码只需：
1. 读取 config/llm.yaml
2. 构造 OpenAI SDK client（传入不同 api_base + api_key）
3. 调用统一的 chat.completions.create() 方法
4. 主模型失败 → 自动切到 fallback_1 → fallback_2
```

这意味着：
- 切换模型 = 改配置文件，无需改代码
- 新增模型 = 只要支持 OpenAI 格式即可接入
- A/B 测试 = 配置按百分比分流

### 4.3 成本估算（月度）

基于预估 **5,000 次/月** 问答量，按 Agent-first 混合架构估算：

**方案 A：全免费（零成本启动）**

| 项目 | 模型 | 月费用 |
|------|------|--------|
| Embedding | BAAI/bge-m3 (SiliconFlow) | ¥0 |
| LLM 生成 | GLM-4-Flash (智谱) | ¥0 |
| **合计** | | **¥0/月** |

> 适合 MVP 验证阶段。GLM-4-Flash 质量可接受但非最优，Agent 推理能力有限。

**方案 B：混合架构推荐方案（Agent + RAG，~$42/月）**

| 项目 | 计算方式 | 月费用 |
|------|---------|--------|
| Embedding | BAAI/bge-m3 (SiliconFlow) | ¥0 |
| 快速路径 LLM（80%，4000 次） | 4000 次 × ~2K tokens × DeepSeek-V3 | ~$24 |
| 升级路径 LLM（20%，1000 次） | 1000 次 × (2-3 次检索 + Agent 推理 + 生成) × ~4K tokens | ~$18 |
| 数据存储 | PostgreSQL (自有服务器) | ¥0（复用） |
| **合计** | | **~$42/月（约 ¥300）** |

> 推荐方案。快速路径（80% 查询）开销与纯 RAG 相同；升级路径（20% 查询）多 2-3 次 LLM 调用，但显著提升复杂问题质量。总计 ~$42/月，符合 $50 预算。

**方案 C：海外模型（高质量但贵）**

| 项目 | 模型 | 月费用 |
|------|------|--------|
| Embedding | OpenAI text-embedding-3-small | ~$0.10 |
| LLM 生成（含 Agent 推理） | GPT-4o-mini | ~$8 |
| **合计** | | **~$8/月（约 ¥60）** |

### 4.4 部署方案（No-Docker 环境）

由于项目明确 **不需要 Docker** 且无 Docker 环境，所有服务必须以原生进程方式运行。

#### 4.4.1 推荐架构：Node.js 原生部署

```
服务器 (Linux)
│
├── Nginx (反向代理)
│   ├── /          → 静态文件 (Docusaurus build output)
│   └── /api/      →本地 Node.js 服务 (localhost:3001)
│
├── 进程管理 (PM2)
│   └── wiki-api   → node dist/index.js
│
└── 数据存储 (本地文件/云服务)
    ├── 向量库: SQLite + sqlite-vss (推荐，无外部依赖) 或 Qdrant Cloud
    └── 业务库: SQLite (存储在 ./data 目录)
```

**关键配置：**
1.  **Process Manager**: 使用 `pm2` 管理 API 进程，支持开机自启和日志轮转。
2.  **Vector DB**:
    *   **首选**: `better-sqlite3` + `sqlite-vss`。这是纯进程内向量搜索方案，无需安装额外服务，完全符合 No-Docker 限制。
    *   **备选**: 连接外部 Qdrant Cloud 实例（如果数据量极大）。
3.  **Environment**: 依赖 Node.js v18+ 环境。

**CI/CD 调整：**
*   移除所有 `docker build` / `docker-compose` 步骤。
*   构建产物直接为 `dist/` 文件夹。
*   部署命令：`rsync` 同步文件 -> `npm install --production` -> `pm2 reload`。

---

## 5. 数据安全与隐私

### 5.1 安全策略

| 项目 | 策略 |
|------|------|
| **文档数据** | Wiki 内容为公开文档，索引数据不含敏感信息 |
| **LLM 调用** | 使用 API 模式（非训练模式），数据不被用于模型训练 |
| **API Key** | 存储在服务器环境变量中，前端通过同域 /api/ 调用，不暴露 Key |
| **请求限流** | 单 IP 每分钟 10 次，每日每 IP 上限 100 次，防止滥用 |
| **费用上限** | LLM API 每日费用硬上限（如 ¥50/天），超出自动降级为"服务繁忙" |
| **Prompt 注入** | System Prompt 限制只回答 Wiki 内容，过滤恶意输入模式 |
| **XSS 防护** | AI 回答渲染使用安全 Markdown 渲染器（sanitize HTML） |
| **CORS** | 仅允许 `https://wiki.camthink.ai` 域名调用 API |

### 5.2 问答日志采集（用于 Wiki 内容优化）

**目标：** 记录用户提问和检索命中情况，发现文档盲区，指导 Wiki 内容迭代。

**采集的数据：**

```json
{
  "id": "qa_20250211_001",
  "timestamp": "2025-02-11T14:30:00Z",
  "question": "NG4500 能不能跑 Llama 3？",
  "language": "zh-Hans",
  "retrieval": {
    "hit_count": 3,
    "top_chunks": [
      { "doc_url": "/docs/neoedge-ng4500-series/application-guide/deepseek-r1", "score": 0.82 },
      { "doc_url": "/docs/neoedge-ng4500-series/overview", "score": 0.71 },
      { "doc_url": "/docs/ai-application/cinfer-quick-start", "score": 0.65 }
    ],
    "max_similarity_score": 0.82,
    "hit_quality": "partial"
  },
  "response": {
    "answered": true,
    "tokens_used": 1847,
    "model": "deepseek-chat",
    "latency_ms": 2340
  },
  "feedback": {
    "rating": "negative",
    "timestamp": "2025-02-11T14:30:15Z"
  },
  "session_id": "sess_abc123",
  "ip_hash": "a3f2c8..."
}
```

**数据不采集：** 用户 IP 原文（仅存 hash）、浏览器指纹、Cookies、登录信息。

**命中率统计维度：**

| 维度 | 说明 | 用途 |
|------|------|------|
| **问题分类命中率** | 按产品线/主题分类的检索成功率 | 发现哪个产品文档覆盖不足 |
| **零命中问题 (miss)** | 相似度 < 0.5 的问题列表 | 直接暴露文档盲区，最高优先级补充 |
| **低命中问题 (partial)** | 相似度 0.5-0.7，回答质量可能不佳 | 需要丰富现有文档内容 |
| **高频问题 Top-N** | 被问最多的问题排行 | 指导首页推荐问题 + 优先优化 |
| **负面反馈问题** | 被 👎 的问题及对应检索结果 | 直接定位回答质量问题 |

**输出报告（定期生成）：**

```
📊 Ask AI 周报 — 2025.02.10~02.16

总问答次数: 847
命中率: 78% (高命中) / 15% (部分命中) / 7% (零命中)
正面反馈率: 72%

🔴 零命中热门问题（建议补充文档）:
1. "NG4500 如何连接 LoRa 模块？" — 23 次
2. "NE301 支持 MicroPython 吗？" — 15 次
3. "如何批量部署固件到多台设备？" — 11 次

🟡 低命中问题（建议丰富文档内容）:
1. "NG4500 和 Jetson Orin Nano 的区别" — 命中了 overview 但缺少对比表
2. "NE101 电池续航多久" — 命中了概述但缺少功耗测试数据

📈 高频问题 Top 5:
1. "如何给 NG4500 刷系统" — 67 次 (命中率 95% ✅)
2. "NE301 支持哪些 AI 模型" — 45 次 (命中率 88% ✅)
3. "NE101 和 NE301 的区别" — 38 次 (命中率 82% ✅)
...
```

**数据保留策略：**
- 问答日志保留 90 天（定期归档）
- 聚合统计数据永久保留
- 用户可在聊天面板查看隐私说明

### 5.3 生产环境安全约束

| 约束 | 说明 |
|------|------|
| **渐进增强** | Ask AI 为增强功能，任何故障不影响 Wiki 正常浏览 |
| **异步加载** | ChatWidget JS 异步加载，不阻塞页面渲染 |
| **优雅降级** | API 不可用时显示"服务暂时不可用"，不影响页面 |
| **费用硬上限** | 每日 LLM 调用费用上限，超出自动降级 |
| **索引与部署解耦** | 索引构建失败不阻塞网站发布（`continue-on-error: true`） |

---

## 6. 实施计划

### Phase 1：MVP（2 周）

**目标：** 核心问答功能上线（Agent-first + RAG 混合架构），验证可行性。

| 任务 | 说明 |
|------|------|
| 文档解析 & 分块脚本 | 解析 75 篇 Markdown，生成 chunks |
| 向量化 & 入库 | 调用 Embedding API，写入向量数据库 |
| Agent 编排器框架搭建 | 实现单 Agent 多工具调用的 ReAct loop |
| 查询意图分析逻辑 | Agent 识别问题类型（精确查询 / 跨文档对比等） |
| 检索结果质量评估 | 基于规则（相似度阈值 ≥ 0.7）+ LLM 判断 |
| 快速路径实现 | RAG 检索 → 结果充分 → 直接生成回答 |
| 升级路径实现 | 换 query 重新检索 / 产品线定向搜索 / 关键词补充 |
| Chat API 端点 | 实现 /api/chat（Agent 编排 + 双路径 + streaming） |
| 跨语言检索 + 语言自适应回答 | 强制双语检索 (docs/ + i18n/en/)，根据 Query 语言自动决定回答语言 |
| ChatWidget 前端组件 | 浮动按钮 + 聊天面板 + 消息列表 |
| Streaming 输出 | SSE 逐字输出回答 + 路径/进度事件 |
| 来源引用展示 | 可点击的文档链接 + 引用段落 |

**MVP 交付物：**
- 用户可在 Wiki 任意页面打开 Ask AI
- 输入问题后，Agent 自动选择快速/升级路径获取最佳回答
- 回答附带参考来源链接
- 升级路径时显示"正在深入分析..."进度提示

### Phase 2：体验优化（2 周）

| 任务 | 说明 |
|------|------|
| 推荐问题 | 欢迎页显示热门/推荐问题 |
| 追问建议 | 每次回答后推荐相关问题 |
| 反馈系统 | 👍/👎 反馈收集 |
| ~~多语言自动检测~~ | ~~已在 MVP 中实现（见 §3.2.4），无需单独排期~~ |
| 移动端适配 | 全屏聊天面板 + 底部固定输入 |
| 暗色模式 | 跟随站点主题自动切换 |
| Agent 路径优化 | 基于反馈数据调优升级触发阈值和检索策略 |

### Phase 3：持续改进（持续）

| 任务 | 说明 |
|------|------|
| 索引自动更新 | 已集成到 `yarn build` / `yarn serve` 流程中（增量模式），CI/CD 部署时自动执行；支持 `yarn ingest` 手动触发和 `yarn ingest:force` 全量重建 |
| 回答质量监控 | 接入 Langfuse 追踪 LLM 调用及 Agent 路径分布 |
| 基于反馈优化 | 分析 negative 反馈，改进检索策略和 Agent 评估逻辑 |
| 对话历史 | 支持多轮对话（当前 Session 内） |
| 搜索栏集成 | 在现有搜索栏中添加 AI 模式切换 |
| Agent 策略迭代 | 根据数据优化多次检索策略和产品线路由逻辑 |

---

## 7. 前端组件规格

### 7.1 文件结构

```
src/
├── components/
│   ├── AskAI/
│   │   ├── ChatWidget.tsx        # 主组件：浮动按钮 + 面板容器
│   │   ├── ChatPanel.tsx         # 聊天面板：消息列表 + 输入框
│   │   ├── ChatMessage.tsx       # 单条消息：支持 Markdown 渲染 + 来源
│   │   ├── SourceReference.tsx   # 来源引用：可展开的文档引用块
│   │   ├── QuickPrompts.tsx      # 推荐问题：预设问题卡片
│   │   └── index.ts              # 导出入口
│   └── ...existing components
├── hooks/
│   └── useChat.ts                # 聊天状态管理 Hook
├── utils/
│   └── chatApi.ts                # API 调用封装
└── css/
    └── ask-ai.css                # Ask AI 专属样式
```

### 7.2 样式规范

遵循现有设计系统：

| 属性 | 值 | 说明 |
|------|-----|------|
| 主色调 | `var(--ifm-color-primary)` (#EB5C01) | 按钮、链接高亮 |
| 面板背景 | `var(--ifm-card-background-color)` | 自动适配暗色模式 |
| 圆角 | `12px` | 与现有 Modal 一致 |
| 阴影 | `0 25px 50px -12px rgba(0,0,0,0.25)` | 与 VideoModal 一致 |
| 面板宽度 | `420px`（桌面）/ `100vw`（移动端） | |
| 面板高度 | `min(600px, 80vh)` | |
| Z-index | 按钮 `1000`，面板 `1001` | 低于现有 overlay (9999) |
| 动画 | `slideUp 0.3s ease-out` | 面板展开动画 |

### 7.3 响应式断点

| 断点 | 行为 |
|------|------|
| `> 768px` | 面板浮动在右下角 420×600px |
| `≤ 768px` | 全屏面板，底部输入框固定 |
| `≤ 480px` | 同上，字号适当缩小 |

---

## 8. 后端 API 规格

### 8.1 项目结构（实际代码）

```
api/
├── src/
│   ├── index.ts               # Express 服务入口
│   ├── routes/
│   │   ├── chat.ts            # POST /api/chat — 核心问答端点
│   │   └── feedback.ts        # POST /api/feedback — 反馈收集
│   ├── services/
│   │   ├── rag.ts             # RAG 编排器 + 向量检索 + 双语合并
│   │   ├── llm.ts             # LLM 调用封装（streaming + fallback）
│   │   ├── agent-tools.ts     # Agent 工具集（官网/GitHub 检索）
│   │   └── github-scraper.ts  # GitHub API 抓取封装
│   ├── lib/
│   │   ├── vector-store/      # 向量数据库抽象层（SQLite / Qdrant）
│   │   ├── db.ts              # SQLite 数据库操作
│   │   ├── cache.ts           # 缓存层
│   │   ├── sse.ts             # SSE 事件推送工具
│   │   └── errors.ts          # 统一错误处理
│   ├── config/
│   │   └── index.ts           # 环境变量 + Zod 校验
│   ├── types/
│   │   └── index.ts           # TypeScript 类型定义
│   └── scripts/
│       └── ingest.ts          # 文档解析 + 分块 + 向量化脚本
├── vitest.config.ts           # 测试配置
├── tsconfig.json              # TypeScript 配置
└── package.json               # 依赖管理
```

### 8.2 错误处理

| 错误场景 | 前端表现 |
|---------|---------|
| API 请求失败 | "网络连接异常，请稍后重试" |
| LLM 返回空结果 | "抱歉，我暂时无法回答这个问题，请尝试换个方式提问" |
| 未检索到相关文档 | "当前文档中未找到相关信息。建议查看 [文档首页](/docs) 或联系我们。" |
| 请求频率超限 | "提问太频繁了，请稍等片刻再试" |
| 用户输入过长 | 限制 500 字符，超出时提示截断 |
| Agent 升级路径超时（>15s） | 降级返回已有部分检索结果生成的回答，标注"部分回答" |
| Agent 循环检测（同一 query 检索 >3 次） | 终止循环，基于已有结果生成回答，提示用户"建议拆分为更具体的问题" |

---

## 9. 衡量与迭代

### 9.1 核心指标

| 指标 | 采集方式 | 目标 |
|------|---------|------|
| **功能使用率** | 打开 ChatWidget 的 UV/PV | 日均 > 50 次 |
| **问答完成率** | 发送问题 / 打开面板 | > 60% |
| **正面反馈率** | 👍 / (👍+👎) | > 70% |
| **来源点击率** | 点击参考链接 / 总回答数 | > 30% |
| **平均对话轮数** | 单次 Session 平均消息数 | 2-4 轮 |

### 9.2 迭代方向

- **短期**：基于负面反馈优化检索质量和 prompt
- **中期**：增加对图片/表格内容的理解能力
- **长期**：支持多模态问答（上传截图问问题）

---

## 10. 开放问题

| # | 问题 | 状态 | 决策/说明 |
|---|------|------|----------|
| 1 | API 部署平台选择 | ✅ 已决 | 同服务器部署（见 §4.4），通过 Nginx 反代 /api/ |
| 2 | LLM 供应商选择 | ✅ 已决 | 多选 Provider 抽象层（见 §4.2.2），首选 DeepSeek-V3 + GLM-4-Flash 兜底 |
| 3 | 是否存储用户问题 | ✅ 已决 | 存储问答日志用于 Wiki 内容优化（见 §5.2），IP 仅存 hash |
| 4 | RAG vs Agent 架构 | ✅ 已决 | MVP 即采用 Agent-first + RAG 混合架构（见 §4.1.1），月成本 ~$42 符合 $50 预算 |
| 5 | 是否需要用户登录 | ✅ 已决 | MVP 不需要登录，使用 IP 限流（每分钟 10 次，每日 100 次） |
| 6 | 免费额度策略 | ✅ 已决 | 未登录用户每日 IP 上限 100 次，超出显示"服务繁忙" |
| 7 | 索引更新策略 | ✅ 已决 | 已实现 MD5 内容哈希增量检测，集成到 `yarn build` / `yarn serve` 流程中自动触发；支持 `yarn ingest`（增量）和 `yarn ingest:force`（全量重建）；CI/CD 部署时自动执行 |
| 8 | API 代码仓库位置 | ✅ 已决 | wiki-documents 仓库下 `api/` 目录（Monorepo 模式） |
| 9 | 向量数据库选型 | ✅ 已决 | 采用 **SQLite + sqlite-vss** 或 **Qdrant Cloud**，放弃 Docker 部署方案，满足 No-Docker 环境要求 |
| 10 | 服务器配置确认 | ✅ 已确认 | 生产服务器满足 2 核 4G 最低要求，可同时运行静态站 + API 服务 |
| 11 | Agent 升级触发阈值 | ✅ 已决 | 相似度 < 0.7 触发升级路径（代码中 `agentConfig.fast_path_threshold = 0.7`） |
| 12 | Agent 最大步数限制 | ✅ 已决 | 升级路径最多 3 次检索（代码中 `agentConfig.max_retrieval_steps = 3`），超出降级返回已有结果 |
| 13 | Agent 框架选型 | ✅ 已决 | 采用**自定义 ReAct loop**（轻量可控），不引入 LangChain 等重依赖 |

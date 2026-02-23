# CLAUDE.md

> 本文件为 Claude Code 提供项目指导。详细设计文档请参阅 `design/` 目录。

## 项目概述

CamThink Wiki 是基于 Docusaurus 3 的双语文档站点，包含 Ask AI 智能问答功能（Agent + RAG 混合架构）。

**技术栈**: Docusaurus 3 + React (前端) | Express + TypeScript (后端 API)

**设计文档**:
- `design/PRD.md` - 产品需求文档（完整功能规格）
- `design/BACKEND_SPEC.md` - 后端和 Agent 工作流
- `design/FRONTEND_ARCH.md` - 前端组件架构
- `design/API_DB_SPEC.md` - API 和数据库规范

## 开发命令速查

### 前端 (Docusaurus)

```bash
yarn install          # 安装依赖
yarn start            # 开发服务器 (localhost:3000)
yarn build            # 构建静态站点 + 文档索引
yarn serve            # 预览构建结果
yarn test             # 单元测试
yarn test:e2e         # E2E 测试 (Playwright)
```

### 后端 API (`api/`)

```bash
cd api
npm install           # 安装依赖
npm run dev           # 开发服务器 (localhost:3001)
npm run build         # 编译 TypeScript
npm start             # 生产服务器

# 文档索引
npm run ingest        # 增量索引
npm run ingest:force  # 强制全量重建
```

## 项目结构

```
docs/                    # 中文文档（默认语言）
i18n/en/docusaurus-plugin-content-docs/current/  # 英文翻译
api/src/                 # 后端 API
  ├── routes/chat.ts     # SSE 聊天端点
  ├── services/rag.ts    # RAG 管道
  ├── services/llm.ts    # LLM 多提供商
  └── config/index.ts    # 环境配置
src/components/AskAI/    # 前端聊天组件
design/                  # 设计文档
```

## 环境配置

复制 `api/.env.example` 到 `api/.env`：

**必需**:
- `EMBEDDING_API_KEY` - SiliconFlow 嵌入 API 密钥
- `ZHIPU_API_KEY` 或 `DEEPSEEK_API_KEY` - LLM 密钥（至少一个）

**可选**:
- `VECTOR_STORE_TYPE` - `sqlite`（默认）或 `qdrant`
- `REDIS_HOST` - Redis 缓存
- `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` - 可观测性

## 国际化 (关键约束)

- **中文**: `docs/` 目录（默认语言）
- **英文**: `i18n/en/docusaurus-plugin-content-docs/current/`
- **禁止**: 不要创建 `i18n/zh-Hans/` 目录
- **同步**: 两个目录必须保持结构一致

## Ask AI 架构

双路径架构（详见 `design/PRD.md` §3.3.2）：
- **快速路径** (置信度 > 0.7): 单次 RAG 检索 → LLM 生成
- **智能路径** (置信度 ≤ 0.7): 多步检索 + Agent 工具（官网/GitHub）

关键文件:
- `api/src/services/rag.ts` - 检索编排
- `api/src/services/agent-tools.ts` - 工具调用
- `src/components/AskAI/ChatWidget.tsx` - 前端组件

## 常见工作流

### 添加文档
1. 中文: `docs/<category>/<file>.md`
2. 英文: `i18n/en/.../current/<category>/<file>.md`
3. 预览: `yarn start`

### 更新系统提示
编辑 `api/src/config/index.ts`:
- `BASE_SYSTEM_PROMPT`
- `prompts.getIntentAnalysis()`

### 重建索引
```bash
cd api && npm run ingest:force
```

## 重要约束

1. **No Docker** - 非容器化部署
2. **SSE 流式** - 使用 Server-Sent Events（非 WebSocket）
3. **同步索引** - `yarn build` 自动触发文档索引
4. **语言偏好** - 所有对话和代码注释使用中文

## Agent 工作流规范

### 报告输出目录

所有临时报告、执行记录、测试结果**必须**放在：
```
.reports/<功能模块>/
```

### 文件命名规范
- `implementation-summary.md` - 实现总结
- `test-results.md` - 测试结果
- `execution-report.md` - 执行报告
- `final-summary.md` - 最终汇总

### 禁止事项
- ❌ 在 `api/`、`design/`、`docs/` 创建临时报告文件
- ❌ 在项目根目录创建 `IMPLEMENTATION_*.md` 或 `*_REPORT.md`
- ❌ 跳过 `.reports/` 目录直接输出到代码目录

### 功能模块目录

```
.reports/
├── prd-development/           # PRD 相关报告
├── deployment/                # 部署相关
├── testing-verification/      # 测试验收
├── workflow-analysis/         # 工作流分析
├── ask-ai-fix/               # Ask AI 修复
├── monitoring/               # 监控系统
└── api-general/              # API 通用

# 未来新增任务按功能模块创建目录
.reports/performance-optimization/    # 性能优化
.reports/rag-refactoring/             # RAG 重构
.reports/agent-tools/                 # Agent 工具
```

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| API 无法启动 | 检查 `api/.env` 是否存在且包含必需密钥 |
| 翻译缺失 | 验证英文文件存在于 `i18n/en/.../current/` |
| 向量存储问题 | 运行 `npm run ingest:force` 重建索引 |
| 构建失败 | 删除 `.docusaurus` 缓存目录，重试 `yarn install` |

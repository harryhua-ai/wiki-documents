# CLAUDE.md

> **Claude Code 项目指导文件** - 本文件定义项目规范、约束和工作流程

---

## 🚨 关键约束（必须遵守）

### ⛔ 禁止事项
- ❌ **No Docker** - 不使用容器化部署
- ❌ **禁止创建** `i18n/zh-Hans/` 目录
- ❌ **禁止在代码目录** 创建临时报告文件
- ❌ **禁止使用 WebSocket** - 必须使用 SSE (Server-Sent Events)

### ✅ 必须遵守
- ✅ **语言偏好** - 所有对话和代码注释使用中文
- ✅ **智能索引** - `yarn build` 自动检测文档变化，仅在变化时执行索引
- ✅ **交付物** - 每个任务完成后必须提供验证证明（见 Agent 工作流）
- ✅ **报告位置** - 所有报告放在 `.reports/<功能模块>/`
- ✅ **任务组织** - 每个任务必须使用独立目录，计划(`plan.md`)和报告(`final-summary.md`)放在一起，使用中文命名

### ⚠️ 关键架构决策
- **双路径 RAG**: 快速路径（置信度>0.7）| 智能路径（置信度≤0.7）
- **向量存储**: SQLite（默认）| Qdrant（可选）
- **LLM 多提供商**: 智谱 | DeepSeek | 通义千问

---

## 🏗️ 项目架构

### 技术栈
- **前端**: Docusaurus 3 + React
- **后端**: Express + TypeScript
- **测试**: Vitest (单元) + Playwright (E2E)
- **AI**: RAG + Agent 混合架构

### 目录结构
```
docs/                                # 中文文档（默认语言）
i18n/en/.../current/                 # 英文翻译
api/src/                             # 后端 API
  ├── routes/chat.ts                 # SSE 聊天端点
  ├── services/
  │   ├── rag.ts                     # RAG 检索编排
  │   ├── llm.ts                     # LLM 多提供商
  │   └── agent-tools.ts             # Agent 工具调用
  └── config/index.ts                # 环境配置
src/components/AskAI/                # 前端聊天组件
design/                              # 设计文档
  ├── PRD.md                         # 产品需求文档
  ├── BACKEND_SPEC.md                # 后端规范
  ├── FRONTEND_ARCH.md               # 前端架构
  └── API_DB_SPEC.md                 # API 和数据库规范
```

### 关键文件映射
| 功能 | 文件路径 |
|------|----------|
| RAG 检索 | `api/src/services/rag.ts` |
| Agent 工具 | `api/src/services/agent-tools.ts` |
| 聊天组件 | `src/components/AskAI/ChatWidget.tsx` |
| 系统提示 | `api/src/config/index.ts` |

---

## ⚙️ 开发指南

### 环境配置

**必需环境变量** (`api/.env`):
```bash
EMBEDDING_API_KEY=xxx          # SiliconFlow 嵌入 API
ZHIPU_API_KEY=xxx             # 智谱 AI（至少一个）
DEEPSEEK_API_KEY=xxx          # DeepSeek（至少一个）
```

**可选环境变量**:
```bash
VECTOR_STORE_TYPE=sqlite      # sqlite 或 qdrant
REDIS_HOST=localhost          # Redis 缓存
LANGFUSE_PUBLIC_KEY=xxx       # 可观测性
LANGFUSE_SECRET_KEY=xxx
```

### 命令速查

**前端开发**:
```bash
yarn install                   # 安装依赖
yarn start                     # 开发服务器 (localhost:3000)
yarn build                     # 构建静态站点到 build/ 目录（智能检测文档变化）
yarn serve                     # 启动静态文件服务器 (localhost:3000)，用于预览和测试
yarn build:force-index         # 构建并强制更新索引
yarn test                      # 单元测试
yarn test:e2e                  # E2E 测试 (Playwright)
```

**后端开发**:
```bash
cd api
npm install                    # 安装依赖
npm run dev                    # 开发服务器 (localhost:3001)
npm run build                  # 编译 TypeScript
npm test                       # 运行测试（命令行）
vitest --ui                    # 运行测试（UI 界面）需全局安装: npm install -g vitest
npm run ingest                 # 增量索引
npm run ingest:force           # 强制全量重建
```

**测试 UI 界面**:
- 运行 `vitest --ui` 启动可视化测试界面
- 访问 `http://localhost:51204/__vitest__/` 查看测试结果
- 支持实时监控、单独运行测试、查看覆盖率等功能

### 常见工作流

**测试前准备**（E2E 测试需要）:
```bash
# 1. 构建前端（会自动检测文档变化并更新索引）
yarn build

# 2. 启动静态文件服务器（在 3000 端口）
yarn serve

# 3. 在另一个终端启动后端 API（在 3001 端口）
cd api && npm run dev

# 4. 运行 E2E 测试
yarn test:e2e
```

**添加文档**:
1. 中文: `docs/<category>/<file>.md`
2. 英文: `i18n/en/.../current/<category>/<file>.md`
3. 预览: `yarn start`
4. 构建时自动检测文档变化并更新索引

**手动更新索引**:
```bash
yarn ingest               # 增量索引
yarn ingest:force         # 强制全量重建
yarn build:force-index    # 构建并强制索引
```

**更新系统提示**:
编辑 `api/src/config/index.ts`:
- `BASE_SYSTEM_PROMPT`
- `prompts.getIntentAnalysis()`

**重建索引**:
编辑 `api/src/config/index.ts`:
- `BASE_SYSTEM_PROMPT`
- `prompts.getIntentAnalysis()`

**重建索引**:
```bash
cd api && npm run ingest:force
```

---

## 🤖 Agent 工作流

### 任务执行规范（重要）

每个任务都必须遵循以下流程：

1. **任务启动时**：
   - ✅ 在 `.reports/<中文功能名>/` 创建独立目录
   - ✅ 生成 `plan.md` - 任务计划（包含目标、步骤、风险评估）
   - ✅ 记录任务开始时间

2. **任务执行中**：
   - ✅ 所有计划文件和生成物都放在同一目录
   - ✅ 使用中文命名目录和文件
   - ✅ 发现偏差时记录在 `plan.md` 的 "执行记录" 章节

3. **任务完成后**：
   - ✅ 在同一目录生成 `final-summary.md`
   - ✅ 在 `final-summary.md` 中引用 `plan.md`
   - ✅ 确保计划和报告在同一目录，便于追溯

**关键原则**：一个任务 = 一个目录，计划+报告在一起

### 任务完成交付物

每个任务完成后必须在 `.reports/<功能模块>/final-summary.md` 提供：

1. **任务信息和完成情况**：✅ 已完成 / ⚠️ 部分 / ❌ 未完成
2. **验证结果**：测试输出、功能截图、性能对比
3. **代码变更**：git diff --stat
4. **已知问题和后续建议**
5. **关联文件**：原始计划链接 `相关计划: [plan.md](./plan.md)`

### 报告目录规范

**目录结构**:
```
.reports/
├── prd-development/              # PRD 相关
│   └── 2026-02-25-第9段迭代更新/   # ✅ 中文任务名
│       ├── plan.md               # 原始计划
│       └── final-summary.md      # 完成报告
├── rag优化/                     # ✅ 中文命名
│   └── 2026-02-25-准确率修复/
│       ├── plan.md
│       ├── final-summary.md
│       └── debug-rag.ts          # 相关调试脚本
└── 部署问题修复/                  # ✅ 中文命名
    └── 2026-02-20-nginx配置/
        ├── plan.md
        └── final-summary.md
```

**命名规则**：
- ✅ **目录**：`<中文功能名>/<日期>-<中文任务名>/`
  - 示例：`rag优化/2026-02-25-准确率修复/`
  - 示例：`prd-development/2026-02-25-第9段更新/`
- ✅ **必需文件**：
  - `plan.md` - 任务计划（必需）
  - `final-summary.md` - 完成报告（必需）
- ✅ **可选文件**：
  - `test-results.md` - 测试详细结果
  - `implementation-summary.md` - 实现细节
  - `debug-*.ts` - 相关调试脚本

**关键要求**：
- ✅ **中文命名** - 所有目录和文件名使用中文（除了代码文件）
- ✅ **独立目录** - 每个任务一个独立目录
- ✅ **计划报告在一起** - `plan.md` 和 `final-summary.md` 必须在同一目录

---

## 📁 文件存放约定

### 测试文件

```
# 单元测试
src/**/__tests__/          # 前端单元测试（与源码同目录）
api/src/**/__tests__/      # 后端单元测试（与源码同目录）

# E2E 测试
tests/                     # E2E 测试根目录
tests/*.spec.ts           # E2E 测试文件
tests/README.md           # E2E 测试指南

# 测试辅助
src/test/                 # 前端测试辅助（mocks, setup）
api/test/                 # 后端测试辅助（mocks, setup）

# 测试配置
vitest.config.ts          # 前端 Vitest 配置
api/vitest.config.ts      # 后端 Vitest 配置
playwright.config.ts      # Playwright 配置

# 测试备份（本地使用，不提交）
project-tests/            # 测试文件备份目录
├── unit-tests/           # 单元测试备份
├── e2e-tests/            # E2E 测试备份
└── test-config/          # 测试配置备份
```

### 报告文件

```
.reports/                         # 所有报告根目录
├── <中文功能名>/                 # ✅ 按中文功能模块组织
│   └── <日期>-<中文任务名>/     # ✅ 中文任务目录
│       ├── plan.md              # ✅ 必需：原始计划
│       ├── final-summary.md     # ✅ 必需：最终总结
│       ├── test-results.md      # 可选：测试结果
│       ├── implementation-summary.md # 可选：实现细节
│       ├── debug-*.ts           # 可选：相关调试脚本
│       └── diagnose-*.ts        # 可选：诊断脚本
├── project-status-report-YYYY-MM-DD.md  # 项目状态报告
└── README.md                    # 报告目录说明
```

**示例目录结构**：
```
.reports/
├── prd-development/                    # PRD 开发
│   └── 2026-02-25-第9段迭代更新/        # 中文任务名
│       ├── plan.md
│       └── final-summary.md
├── rag优化/                           # ✅ 中文命名
│   ├── 2026-02-23-核心修复/
│   │   ├── plan.md
│   │   ├── final-summary.md
│   │   └── debug-rag.ts
│   └── 2026-02-25-性能优化/
│       ├── plan.md
│       └── final-summary.md
└── 部署问题修复/                        # ✅ 中文命名
    └── 2026-02-20-nginx配置/
        ├── plan.md
        └── final-summary.md
```

**命名规则**：
- ✅ **功能模块**：使用中文，如 `prd-development/`, `rag优化/`, `部署问题修复/`
- ✅ **任务目录**：`<日期>-<中文任务名>/`，如 `2026-02-25-准确率修复/`
- ✅ **文件名**：使用中文或标准英文（`plan.md`, `final-summary.md`）

**关键要求**：
- ✅ **一个任务一个目录** - 计划和报告必须在同一目录
- ✅ **中文命名优先** - 便于理解和查找
- ✅ **计划文件必需** - 每个任务必须有 `plan.md`
- ✅ **报告引用计划** - `final-summary.md` 必须链接到 `plan.md`

**调试脚本存放规则**：
- ✅ 调试脚本可以与相关报告放在同一目录
- ✅ 命名格式：`debug-<功能>.ts`, `diagnose-<问题>.ts`
- ❌ 不应在源码目录创建调试文件

### 临时调试文件

```
.reports/<功能模块>/              # ✅ 调试脚本与相关报告放在一起
├── debug-<功能>.ts              # 调试脚本
├── diagnose-<问题>.ts           # 诊断脚本
└── final-summary.md             # 功能报告

# 示例：
.reports/rag-optimization/
├── debug-embedding.ts           # Embedding 调试脚本
├── debug-orchestrate.ts         # 编排调试脚本
└── rag-fix-summary.md           # RAG 修复报告

# 禁止在以下位置创建调试文件：
❌ api/src/debug-*.ts           # 源码目录不应包含调试脚本
❌ test-*.ts, quick-test.ts     # 根目录不应有临时测试
```

### 开发文档

```
design/                          # 设计文档
├── PRD.md                      # 产品需求文档
├── BACKEND_SPEC.md             # 后端规范
├── FRONTEND_ARCH.md            # 前端架构
└── API_DB_SPEC.md              # API 和数据库规范

# 测试文档（与测试同目录）
tests/README.md                 # E2E 测试指南
api/test/README.md              # 测试配置指南

# 监控文档
api/PM2_MONITORING_GUIDE.md     # PM2 监控指南
```

---

## 🎯 Git 提交规范

### 应该提交的内容

```
✅ 源代码：
   - src/                    # 前端源码
   - api/src/                # 后端源码

✅ 配置文件：
   - package.json, yarn.lock  # 依赖管理
   - tsconfig.json            # TypeScript 配置
   - eslint.config.js         # 代码规范
   - .prettierrc              # 格式化配置
   - .env.example             # 环境变量示例

✅ CI/CD：
   - .github/workflows/       # GitHub Actions
   - .husky/                  # Git hooks

✅ 用户文档：
   - docs/                    # 中文文档
   - i18n/en/                 # 英文翻译
```

### 不应该提交的内容

```
❌ 测试代码（保存到 project-tests/ 或不提交）：
   - **/__tests__/           # 单元测试
   - tests/*.spec.ts         # E2E 测试
   - vitest.config.ts        # 测试配置
   - playwright.config.ts

❌ 开发文档（保存到 project-docs/）：
   - api/README.md           # API 开发文档
   - api/PM2_MONITORING_GUIDE.md

❌ 项目配置（本地使用）：
   - CLAUDE.md               # 已添加到 .gitignore
   - .claude/                # Claude Code 配置

❌ 临时文件：
   - *.bak, *.backup        # 备份文件
   - debug-*.ts             # 调试脚本
   - test-*.ts              # 临时测试
   - package-lock.json      # 使用 yarn.lock
```

### 提交前检查清单

```bash
# 1. 确认没有测试文件
git diff --cached --name-only | grep -E "(__tests__|\.test\.|\.spec\.)"

# 2. 确认没有开发文档
git diff --cached --name-only | grep -E "(api/README\.md|api/PM2_MONITORING_GUIDE\.md)"

# 3. 确认没有 CLAUDE.md
git diff --cached --name-only | grep "CLAUDE.md"

# 4. 确认没有临时文件
git diff --cached --name-only | grep -E "(\.bak|\.backup|debug-|test-)"
```

---

## 🔧 常见问题

| 问题 | 快速解决方案 | 详细文档 |
|------|-------------|----------|
| API 无法启动 | 检查 `api/.env` 是否包含必需密钥 | - |
| 向量检索无结果 | 运行 `cd api && npm run ingest:force` | `design/BACKEND_SPEC.md` |
| LLM 响应超时 | 检查 API 密钥，查看服务日志 | `.reports/rag-optimization/` |
| Embedding API 失败 | 验证 `EMBEDDING_API_KEY` 配置 | `api/README.md` |
| 测试失败 | 检查 `.env.test` 配置 | `tests/README.md` |
| vitest 命令未找到 | 运行 `npm install -g vitest` | - |
| 构建失败 | 删除 `.docusaurus` 缓存目录 | - |
| API 响应慢 | 检查缓存配置，查看性能日志 | `.reports/api-general/` |

**注意**：详细的调试步骤和诊断指南请参考相关文档或报告目录。

---

## 📚 相关文档

- **设计文档**: `design/` 目录
- **测试规范**: `api/test/README.md`
- **Git 工作流**: `~/.claude/rules/common/git-workflow.md`
- **编码规范**: `~/.claude/rules/typescript/coding-style.md`

---

*最后更新: 2026-02-24*

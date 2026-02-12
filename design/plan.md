# Next Steps - Ask AI Feature Development

## Context

**当前状态**：
- ✅ MVP Phase 1 核心功能已完成（~95%）
- ✅ RAG Build 集成已完成（--force 参数、package.json 集成）
- ✅ 所有验证测试通过（VT1-VT4）

**PRD 完成度评估**：
| 阶段 | 完成度 | 状态 |
|-------|---------|------|
| Phase 1: MVP 核心功能 | ~95% | 基本完成 |
| Phase 2: 体验优化 | ~40% | 部分完成 |
| Phase 3: 持续改进 | ~20% | 待开发 |

---

## Remaining Tasks (按优先级排序)

### Phase 2 - 体验优化

#### Task #6: 搜索栏 AI 切换按钮（PRD §3.2.1）
**状态**: 🔴 **暂定/延后** - 用户选择先使用默认悬浮按钮模式

**说明**：
- 当前 ChatWidget 悬浮按钮已可满足基本需求
- 搜索栏集成作为未来优化项，暂不实现

---

#### Task #7: 动态追问建议（PRD §3.3.4）
**状态**: ✅ **已完成** - 窗口A

**文件**: `api/src/services/rag.ts`, `api/src/services/llm.ts`, `src/components/AskAI/`

**功能**：
- ✅ 基于当前回答生成 2-3 个追问建议
- ✅ 后端: 调用 LLM 生成相关问题
- ✅ 前端: 在答案下方显示追问按钮
- ✅ 中英双语支持
- ✅ SSE 事件推送

**优先级**: 中 - 提升用户体验和问题覆盖率

---

#### Task #8: 多语言强制检索（PRD §3.2.4）
**文件**: `api/src/services/rag.ts`

**功能**：
- 检测查询语言（中文/英文）
- 强制从对应语言源检索（zh-Hans → docs/, en → i18n/en/）
- 当前仅依赖向量相似度，未强制语言过滤

**优先级**: 中 - 确保双语用户得到正确结果

---

### Phase 3 - 持续改进

#### Task #9: Langfuse 集成（PRD §4.2, §6 Phase 3）
**状态**: ✅ **已完成** - Window C

**文件**:
- ✅ `api/src/lib/langfuse.ts`（新建）
- ✅ `api/src/services/llm.ts`（已集成追踪）
- ✅ `api/src/config/index.ts`（已添加环境变量）
- ✅ `api/src/index.ts`（已添加优雅关闭）
- ✅ `api/.env.example`（已添加配置示例）
- ✅ `design/LANGFUSE_INTEGRATION.md`（新建文档）

**功能**：
- ✅ 集成 Langfuse SDK 进行 LLM 调用追踪
- ✅ 记录 prompt、response、tokens、latency
- ✅ 支持错误追踪和质量评分
- ✅ 优雅关闭确保所有追踪数据被刷新
- ✅ 完整文档和配置示例

**优先级**: 低 - 需要外部服务，非 MVP 必需

**配置方法**：
1. 获取 Langfuse API 密钥：https://cloud.langfuse.com
2. 在 `.env` 中配置 `LANGFUSE_PUBLIC_KEY` 和 `LANGFUSE_SECRET_KEY`
3. 重启 API 服务器

**详细文档**: 见 `design/LANGFUSE_INTEGRATION.md`

---

#### Task #10: 分析仪表盘（PRD §5）
**文件**: `api/src/routes/analytics.ts`（新建）, `src/components/AnalyticsDashboard/`（新建）

**功能**：
- 命中率统计
- 零命中问题列表（文档缺口）
- 高频问题分析
- 负反馈分析

**优先级**: 低 - 运营优化工具

---

## Implementation Plan (Completed - Task #7)

### Step 1: 添加 LLM 追问生成函数

**文件**: `api/src/services/llm.ts`

**新增函数**: `generateFollowUpSuggestions()`

```typescript
export const generateFollowUpSuggestions = async (
  originalQuery: string,
  assistantResponse: string,
  language: 'en' | 'zh-Hans'
): Promise<string[]> => {
  // System prompt 根据语言变化
  // 调用 chatCompletion API
  // 解析 JSON 返回
  // 返回最多 3 个问题
}
```

**Prompt 策略**：
- 中文：基于用户问题和 AI 回答生成 3 个相关追问
- 英文：Generate 3 relevant follow-up questions
- 要求：简洁、不重复、引导深入探索

---

### Step 2: 集成到 RAG 服务

**文件**: `api/src/services/rag.ts`

**修改位置**: `generateAnswer()` 函数，在 `yield sources` 之后

```typescript
// 在 sources 事件之后
yield { type: 'sources', data: { sources: result.sources } };

// 生成追问建议
const suggestions = await generateFollowUpSuggestions(query, fullResponse, language);
if (suggestions.length > 0) {
  yield { type: 'suggestions', data: { items: suggestions } };
}
```

---

### Step 3: 前端处理（如需要）

**文件**: `src/components/AskAI/ChatWindow.tsx` 或相关组件

**检查**: SSE 事件处理器是否已处理 `suggestions` 类型

如果未处理，添加：
```typescript
if (event.type === 'suggestions') {
  setFollowUpSuggestions(event.items);
}
```

---

## Verification Plan

### VT1: 基本功能测试
1. 发送问题，观察是否返回追问建议
2. 检查 SSE 事件流中是否包含 `suggestions` 事件
3. 验证建议数量为 2-3 个

### VT2: 内容质量测试
1. 中文问题返回中文追问
2. 英文问题返回英文追问
3. 追问内容与原文相关

### VT3: 前端显示测试
1. 追问按钮正确显示在答案下方
2. 点击追问可发送新问题

---

## Success Criteria

完成后确认：
- ✅ `llm.ts` 新增 `generateFollowUpSuggestions` 函数
- ✅ `rag.ts` 在 `generateAnswer` 中调用并 yield suggestions
- ✅ SSE 事件包含 `suggestions` 类型
- ✅ 中英双语支持
- ✅ 生成失败时静默处理（不影响主流程）

---

## Tasks（当前状态）

| 任务 | 描述 | 优先级 | 状态 | 负责人 |
|------|------|---------|------|----------|
| #6 | 搜索栏 AI 切换按钮 | 高 | 🔴 暂定 | - |
| #7 | 动态追问建议 | 中 | ✅ 已完成 | 窗口A |
| #8 | 多语言强制检索 | 中 | ✅ 已完成并修复 | 窗口B |
| #9 | Langfuse 集成 | 低 | ✅ 已完成 | 窗口C |
| #10 | 分析仪表盘 | 低 | 🔴 暂定 | - |
+++++
#### Task #8 修复详情 (2026-02-12)

**问题**: 英文查询返回 5/10 英文文档，大量中文文档

**根本原因**:
1. `rag.ts:350` - searchLanguage 硬编码为 'both'
2. `rag.ts:387-404` - 排序仅按 score，未考虑语言优先级
3. `llm.ts:470` - Think Mode 返回 `search_language: 'both'`，覆盖语言检测

**修复方案**: 禁用 Think Mode
- 修改 `api/.env`: `AGENT_THINK_MODE=false`
- 保留 `rag.ts` 的语言感知排序逻辑

**修复效果**:
- 修复前: 英文查询 1/10 英文
- 修复后: 英文查询 **9/10 英文** (✅ 通过)
- 测试通过率: 2/3 → 3/3 (100%)

**文件变更**:
- `api/src/services/rag.ts` - 语言检测 + 分组排序
- `api/.env` - 禁用 Think Mode

## 并行开发规则

### 窗口分工建议
- **窗口A**: 后端核心逻辑 (`api/src/services/`, `api/src/routes/`)
- **窗口B**: 前端组件 & 测试 (`src/components/`, `tests/`)
- **窗口C**: 文档 & 工具链 (`docs/`, `.github/`, `Docker`)

### 任务认领流程
1. 读取本文件，查看 "Remaining Tasks"
2. 确认任务未分配（"负责人" 为空）
3. 在 "负责 人" 列标记自己（窗口A/B/C）
4. 开始实现，更新 "状态" 列

### 状态标记说明
- 🔲 待认领 - 未开始，可认领
- 🟡 实现中 - 正在开发
- ✅ 已完成 - 功能实现
- 🔴 暂定/阻塞 - 暂不开发或被阻塞
- ❌ 已取消 - 不再需要

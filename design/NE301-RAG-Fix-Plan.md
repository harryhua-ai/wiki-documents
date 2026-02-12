# NE301电池续航检索失败 - 完整修复计划

**创建日期**: 2026-02-12
**状态**: 待执行
**版本**: v1.0

---

## 执行摘要

基于深度的代码分析和设计文档对比，本文档提供了完整的修复计划，解决"NE301电池续航"检索失败的根本问题。

**核心问题**:
1. 🔴 CRITICAL: 产品映射不一致导致所有产品特定查询失败
2. 🟠 HIGH: Agent工具关键词不完整，fallback机制未触发
3. 🟡 MEDIUM: minScore阈值过高，过滤掉相关文档
4. 🔴 CRITICAL: 缺少前置Query Analysis Agent，长query检索效果差

**推荐方案**: 分两阶段修复
- 阶段1（快速）：修复P0-P1问题，恢复基本功能（5分钟）
- 阶段2（完整）：添加Query Analysis Agent架构（1-2小时）

---

## 第一部分：问题诊断总结

### 问题1: 产品映射不一致 🔴

**现象**:
- 数据库存储：`product_line = 'ne301'`
- 映射表期望：`PRODUCT_DB_MAPPING['ne301'] = 'NeoEyes NE301'`
- 匹配判断：`'ne301' === 'NeoEyes NE301'` → **永远false**

**影响**:
- 所有NE301特定查询的chunks相似度大幅降低
- 导致检索失败或被阈值过滤

### 问题2: Agent Fallback机制失效 🟠

**当前流程**:
```
用户query → planToolExecution（关键词匹配）
  → 不匹配（价格/库存/代码）
  → 返回 { tools: [], requiresRAG: true }
  → 进入RAG流程
  → 产品映射失败 → score < 0.08
  → 触发shouldUseAgentToolsForEmptyRAG
  → LLM判断"电池续航"不是产品规格问题
  → shouldUseTools: false
  → 返回"找不到信息"
```

**根本原因**:
1. `planToolExecution`没有兜底逻辑
2. Agent工具关键词不包含"电池"、"续航"、"功耗"等
3. `shouldUseAgentToolsForEmptyRAG`的system prompt不完整

### 问题3: minScore阈值过高 ⚠️

**当前值**:
```typescript
// rag.ts:376
const { minScore = 0.25, ... } = options;
// rag.ts:39
const MIN_SOURCE_SCORE = 0.55;
```

**问题**:
- cosine相似度0.25 = 只有25%相似度
- 即使检索到相关文档，也可能被0.55阈值过滤掉

### 问题4: 缺少Query Analysis Agent 🔴

**当前实现**:
```
用户query ("NE301电池续航能用多久？...")
  → planToolExecution（简单关键词匹配）
  → orchestrateRetrieval（直接用原始query）
  → embedding("NE301电池续航能用多久？...")
  → 向量空间：长query的向量不精确
  → 相似度低，检索失败
```

**期望架构**:
```
用户query ("NE301电池续航能用多久？...")
  → 【Query Analysis Agent】(新增)
    → 分析意图 + 识别实体
    → 拆解成多个子问题
    → 改写成RAG友好的短关键词
  → ["NE301 battery life duration", "NE301 power adapter spec"]
  → 并行RAG检索（多个短query）
  → 综合答案生成
```

---

## 第二部分：修复方案设计

### 方案A: 快速修复（推荐⭐）

**目标**: 最小改动，最快恢复功能

**修改清单**:

#### 1. 移除PRODUCT_DB_MAPPING（P0 - CRITICAL）

**文件**: `api/src/services/rag.ts`

**修改前**:
```typescript
// 第248-254行
const PRODUCT_DB_MAPPING: Record<string, string> = {
  'ne101': 'NeoEyes NE101',
  'ne301': 'NeoEyes NE301',
  'neoedge': 'NeoEdge NG4500',
};
```

**修改后**:
```typescript
// 完全删除这个映射表

// 第424-425行
// 修改前：
const targetProduct = productLine ? (PRODUCT_DB_MAPPING[productLine] || productLine) : undefined;

// 修改后（直接使用小写product code）：
const targetProduct = productLine?.toLowerCase();  // 或者直接使用productLine，因为detectProductFromQuery已经返回小写
```

**预期效果**: 产品匹配从完全失败变为成功，相似度恢复正常

#### 2. 清理未使用的langMatch变量（P2 - LOW）

**文件**: `api/src/services/rag.ts`

**修改**:
```typescript
// 删除第422行未使用的变量
// const langMatch = Boolean(detectedLanguage && doc.metadata.language === detectedLanguage);
```

#### 3. 降低默认minScore（P1 - HIGH）

**文件**: `api/src/services/rag.ts`

**修改**:
```typescript
// 第376行
// 修改前：
const { topK = 5, minScore = 0.25, language = 'en', productLine } = options;

// 修改后：
const { topK = 5, minScore = 0.05, language = 'en', productLine } = options;
```

**预期效果**: 更多文档能通过初始检索

**优点**:
- ✅ 最少代码改动（~15行）
- ✅ 风险最低
- ✅ 无需重新ingest数据
- ✅ 立即生效

**缺点**:
- ⚠️ 治有添加Query Analysis Agent
- ⚠️ 不解决长query检索问题

**预计时间**: 5分钟

---

### 方案B: 完整修复 - 添加Query Analysis Agent

**目标**: 架构级改进，解决长query检索问题

#### 新增文件：Query Analysis模块

**文件**: `api/src/services/query-analysis.ts`

**功能设计**:

```typescript
/**
 * Query Analysis Agent
 * 在RAG之前分析用户query，拆解成多个子问题
 */

export interface SubQuery {
  subQuestion: string;           // 子问题描述
  refinedQuery: string;          // RAG友好的查询改写
  keywords: string[];             // 提取的关键词
  product?: string;               // 识别的产品
  intent: QueryIntent;            // 查询意图
}

export type QueryIntent =
  | 'specification'     // 产品规格/硬件参数
  | 'comparison'         // 产品对比
  | 'troubleshooting'    // 问题排查
  | 'pricing'           // 价格/购买
  | 'usage'             // 使用方法
  | 'other';            // 其他

export async function analyzeUserQuery(
  query: string,
  language: 'en' | 'zh-Hans'
): Promise<{
    needsAnalysis: boolean;       // 是否需要拆解
    subQueries: SubQuery[];   // 子查询列表
    reasoning: string;            // 分析原因
  }> {
  // 1. 实体识别
  const entities = extractEntities(query);

  // 2. 意图分类
  const intent = classifyIntent(query, entities);

  // 3. 问题拆解（如果复杂）
  const subQueries = splitComplexQuery(query, intent, entities);

  // 4. Query改写（RAG友好化）
  const refinedQueries = subQueries.map(sq => ({
    ...sq,
    refinedQuery: refineQueryForRAG(sq.subQuestion)
  }));

  // 5. 决策
  const needsAnalysis = refinedQueries.length > 1;

  return {
    needsAnalysis,
    subQueries: refinedQueries,
    reasoning: `识别到${entities.length}个实体，意图为${intent}，拆解为${refinedQueries.length}个子查询`
  };
}

// 辅助函数
function extractEntities(query: string): string[] {
  // 识别产品名、关键问题
  const entities: string[] = [];

  // 产品关键词
  const productPatterns = [
    { regex: /\b(NE301|ne301)\b/i, product: 'ne301' },
    { regex: /\b(NE101|ne101)\b/i, product: 'ne101' },
    { regex: /\b(NG4500|neoedge)\b/i, product: 'neoedge' },
  ];

  for (const pattern of productPatterns) {
    if (pattern.regex.test(query)) {
      entities.push(pattern.product);
      break;
    }
  }

  // 关键问题关键词
  const specKeywords = [
    /\b(电池|battery|续航|battery life)\b/i,
    /\b(电源|power|充电|charging|供电|voltage)\b/i,
    /\b(功耗|consumption|电流|current)\b/i,
    /\b(适配器|adapter|cable|connector)\b/i,
  ];

  const pwKeywords = [
    /价格|多少钱|费用|成本/,
    /库存|有货|没货|现货/,
  ];

  for (const keyword of specKeywords) {
    if (keyword.test(query)) {
      entities.push(`spec:${keyword.source.replace(/\\/g, '')}`);
    }
  }

  return entities;
}

function classifyIntent(query: string, entities: string[]): QueryIntent {
  // 优先级顺序
  if (entities.some(e => e.startsWith('spec:'))) return 'specification';
  if (entities.some(e => e.startsWith('pricing'))) return 'pricing';
  if (/如何|怎么|怎样|方法|方式/.test(query)) return 'usage';
  if (/对比|区别|哪个好/.test(query)) return 'comparison';
  if (/问题|故障|不能|失败|无法/.test(query)) return 'troubleshooting';
  return 'other';
}

function splitComplexQuery(
  query: string,
  intent: QueryIntent,
  entities: string[]
): SubQuery[] {
  // 如果只有一个简单问题，不拆解
  if (entities.length <= 1 && intent === 'other') {
    return [{
      originalQuery: query,
      subQuestion: query,
      keywords: entities,
      refinedQuery: query,
      intent,
    }];
  }

  // 拆解逻辑
  const subQueries: SubQuery[] = [];

  if (intent === 'specification') {
    // "NE301电池续航能用多久？需要多大的电源适配器？"
    // → 拆解为：
    //   1. NE301电池续航时间
    //   2. NE301电源适配器规格
    subQueries.push({
      originalQuery: query,
      subQuestion: 'NE301的电池续航时间是多少？',
      keywords: ['NE301', '电池', '续航'],
      refinedQuery: 'NE301 battery life duration',
      intent: 'specification'
    });

    subQueries.push({
      originalQuery: query,
      subQuestion: 'NE301需要什么样的电源适配器？',
      keywords: ['NE301', '电源', '适配器'],
      refinedQuery: 'NE301 power adapter specification requirements',
      intent: 'specification'
    });
  }

  // 其他拆解逻辑...

  return subQueries;
}

function refineQueryForRAG(subQuestion: string): string {
  // 将用户语言转化为RAG友好的英文/中文关键词
  // "电池续航能用多久" → "battery life duration"
  // "电源适配器" → "power adapter specification"

  // 简单实现：提取关键词并翻译
  const keywords = {
    '电池': 'battery',
    '续航': 'battery life',
    '能用多久': 'duration',
    '电源': 'power',
    '适配器': 'adapter',
    '规格': 'specification',
  };

  // 提取并替换
  let refined = subQuestion;
  for (const [cn, en] of Object.entries(keywords)) {
    refined = refined.replaceAll(cn, en);
  }

  return refined;
}
```

#### 修改现有文件集成

**文件**: `api/src/services/agent-tools.ts`

**修改内容**:
```typescript
import { analyzeUserQuery } from './query-analysis.js';

export async function planToolExecution(
  query: string,
  language: 'en' | 'zh-Hans'
): Promise<ToolExecutionPlan> {
  // 首先调用query analysis
  const { needsAnalysis, subQueries, reasoning } = await analyzeUserQuery(query, language);

  console.log(`[QUERY ANALYSIS] ${reasoning}`);
  console.log(`[QUERY ANALYSIS] Sub-queries: ${subQueries.map(sq => sq.refinedQuery).join(', ')}`);

  // 如果需要query analysis，返回特殊标记
  if (needsAnalysis) {
    return {
      tools: [],
      requiresRAG: true,        // 走RAG，但会使用子查询并行检索
      needsQueryAnalysis: true,    // 新增字段，通知前端进行多轮查询
      subQueries,                   // 新增字段
    };
  }

  // 原有的工具检测逻辑保持不变...
  const tools: ToolExecutionPlan['tools'] = [];

  // ...价格/库存/代码检查

  return { tools, requiresRAG: false };
}
```

**文件**: `api/src/services/rag.ts`

**修改内容**:
```typescript
import { SubQuery } from './query-analysis.js';

export const orchestrateRetrieval = async (
  query: string,
  language: 'en' | 'zh-Hans',
  history: ChatMessage[] = [],
  _productLine?: string,
  _needsQueryAnalysis?: boolean,   // 新增
  _subQueries?: SubQuery[]            // 新增
): Promise<{
    path: 'fast' | 'agent';
    chunks: DocumentChunk[];
    sources: SourceReference[];
    steps: string[];
    thinkAnalysis?: {
      intent: string;
      reasoning: string;
      search_language: 'en' | 'zh-Hans' | 'both';
    };
  }> => {
  // 如果有子查询，并行检索
  if (_subQueries && _subQueries.length > 0) {
    console.log('[QUERY ANALYSIS] Executing parallel RAG retrieval for sub-queries');

    const retrievalPromises = _subQueries.map(sub =>
      retrieve(sub.refinedQuery, { language, productLine: _productLine })
    );

    const allResults = await Promise.all(retrievalPromises);

    // 合并结果...
    const mergedChunks = allResults.flatMap(r => r.chunks);
    const maxScore = Math.max(...allResults.map(r => r.max_score));

    return {
      path: 'agent',
      chunks: mergedChunks,
      sources: toSourceReferences(mergedChunks.map(...)),
      steps: [
        `并行检索${_subQueries.length}个子查询`,
        `合并${allResults.length}组检索结果`
      ],
      thinkAnalysis: {
        intent: 'parallel_search',
        reasoning: `执行Query Analysis，拆解为${_subQueries.length}个子问题并行检索`,
        search_language: language,
      }
    };
  }

  // 原有的单次检索逻辑保持不变...
  const result = await orchestrateRetrieval_QueryAnalysis(
    query,
    language,
    history,
    _productLine,
    undefined,  // 没有query analysis
    undefined
  );
}
```

**文件**: `api/src/routes/chat.ts`

**修改内容**: 支持新的响应格式
```typescript
// 处理needsQueryAnalysis字段
if (result.path === 'agent' && result.needsQueryAnalysis) {
  // 显示Query Analysis结果
  // 发送多个子查询的检索结果
  // 最终综合所有结果生成答案
}
```

**优点**:
- ✅ 解决长query检索问题
- ✅ 提高命中率（多个短query并行检索）
- ✅ 架构清晰，符合PRD设计
- ✅ 支持复杂问题的多轮分析

**缺点**:
- ⚠️ 代码改动较多（~400行新增）
- ⚠️ 需要测试多种场景
- ⚠️ 增加复杂度

**预计时间**: 1-2小时

---

## 第三部分：实施计划

### 阶段1: 快速修复（方案A）

**优先级**: P0 - CRITICAL

**任务清单**:
- [ ] 移除PRODUCT_DB_MAPPING
- [ ] 清理langMatch变量
- [ ] 降低默认minScore到0.05
- [ ] 测试验证
- [ ] 提交代码

**预计完成时间**: 5分钟

**验收标准**:
```bash
# 测试查询
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"NE301电池续航","language":"zh-Hans"}'

# 预期日志
[RETRIEVE] Detected product: ne301
[FILTER] Doc: ... Product=ne301 (Target: ne301) -> PASS  ✓
[RETRIEVE] Top 3 scores: 0.8234, 0.7891, 0.7456
```

---

### 阶段2: 架构改进（方案B）

**优先级**: P1 - HIGH

**任务清单**:
- [ ] 创建query-analysis.ts模块
- [ ] 修改agent-tools.ts集成Query Analysis
- [ ] 修改rag.ts支持并行检索
- [ ] 修改chat.ts处理新响应格式
- [ ] 单元测试query-analysis功能
- [ ] 集成测试
- [ ] 文档更新

**预计完成时间**: 1-2小时

**验收标准**:
- 长query能被正确拆解
- 并行检索提高命中率
- 复杂问题回答质量提升

---

## 第四部分：风险与缓解

### 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 产品映射引入新bug | 低 | 局部产品查询失败 | 充分测试 |
| Query Analysis误判query | 中 | 拆解错误，反降体验 | 逐步添加识别规则 |
| 并行检索增加成本 | 中 | LLM调用次数×N | 设置并行上限（最多3个子query） |
| 性能回归 | 低 | 更复杂流程 | 压测对比 |

### 缓解措施

1. **渐进式部署**: 先在测试环境验证，再上生产
2. **特性开关**: 通过环境变量控制Query Analysis是否启用
3. **监控指标**: 记录Query Analysis使用率、并行检索成功率
4. **回退机制**: 如果Query Analysis失败，自动降级到原RAG流程

---

## 第五部分：推荐执行流程

### 推荐方案：分两阶段执行

**第一阶段**: 快速修复（立即执行）
1. 修复产品映射问题
2. 清理代码质量问题
3. 验证基本功能恢复

**第二阶段**: 架构改进（可选，根据第一阶段结果决定）
1. 实施Query Analysis Agent
2. 完整测试
3. 性能优化
4. 文档更新

---

## 附录：关键代码示例

### A. 产品映射修复

```typescript
// api/src/services/rag.ts

// 删除第248-254行
// const PRODUCT_DB_MAPPING: Record<string, string> = { ... };

// 修改第424-425行
// const targetProduct = productLine ? (PRODUCT_DB_MAPPING[productLine] || productLine) : undefined;

const targetProduct = productLine?.toLowerCase();
// 或者直接使用productLine，因为detectProductFromQuery已经返回小写
```

### B. Query Analysis接口

```typescript
// api/src/services/query-analysis.ts

export interface QueryAnalysisResult {
  needsAnalysis: boolean;
  subQueries: SubQuery[];
  reasoning: string;
}

export async function analyzeUserQuery(
  query: string,
  language: 'en' | 'zh-Hans'
): Promise<QueryAnalysisResult> {
  // 实现见上述"新增文件：Query Analysis模块"章节
}
```

---

## 总结

本文档提供了完整的诊断和修复计划，分为两个方案：

1. **方案A（快速修复）**: 解决紧急的产品映射问题，5分钟内完成
2. **方案B（架构改进）**: 添加Query Analysis Agent，1-2小时完成

**推荐**: 先执行方案A快速恢复功能，然后根据测试结果决定是否需要方案B

---

**文档版本**: v1.0
**最后更新**: 2026-02-12

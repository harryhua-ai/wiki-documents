# 产品设计 vs 当前实现 - 深度对比分析

**分析日期**: 2026-02-12
**分析范围**: PRD & BACKEND_SPEC vs 当前代码实现
**核心问题**: "NE301电池续航"检索失败

---

## 执行摘要

| 分析项 | 状态 | 严重性 |
|--------|------|--------|
| 产品映射错误 | 🔴 CRITICAL | 导致所有产品特定查询失败 |
| Agent关键词缺失 | 🟠 MEDIUM | RAG空结果后无法触发Agent工具 |
| minScore阈值过高 | 🟠 MEDIUM | 过滤掉相关文档 |
| 语言过滤逻辑混乱 | 🟡 LOW | 代码质量问题 |

---

## 1. 产品映射错误分析 🔴

### 设计规范（PRD.md §3.3.4）

**Metadata规范**:
```yaml
product_line: "neoeyes-ne301"  # 完整产品名
```

**ingest实现**（ingest.ts:334-354）:
```typescript
function extractProduct(filePath: string): string {
  const lowerPath = filePath.toLowerCase();

  if (lowerPath.includes('ng4500') || lowerPath.includes('neoedge')) {
    return 'neoedge';
  }
  if (lowerPath.includes('ne101')) {
    return 'ne101';
  }
  if (lowerPath.includes('ne301')) {
    return 'ne301';  // ✅ 返回小写代码
  }
  // ...
  return 'general';
}
```

**数据库实际存储**:
```
product_line值: 'ne301' (小写)
文档总数: 489条
```

### 当前RAG实现（rag.ts:248-254, 424-441）

**产品映射表**:
```typescript
const PRODUCT_DB_MAPPING: Record<string, string> = {
  'ne101': 'NeoEyes NE101',
  'ne301': 'NeoEyes NE301',  // ❌ 映射到完整名称
  'neoedge': 'NeoEdge NG4500',
};
```

**产品匹配逻辑**:
```typescript
// 第424-425行
const targetProduct = productLine ? (PRODUCT_DB_MAPPING[productLine] || productLine) : undefined;
// 当productLine='ne301'时:
// targetProduct = 'NeoEyes NE301'

// 第441行
productMatch = docProduct === targetProduct ||  // ❌ 'ne301' !== 'NeoEyes NE301'
               docProductLower.includes(productLineLower) ||  // ✅ 'ne301'.includes('ne301') = true
               Boolean(targetProduct && docProductLower.includes(targetProductLower));
```

### ❌ 问题根因

**不匹配的值对比**:
```typescript
// 检索时:
productLine (from detectProductFromQuery) = 'ne301'
targetProduct (from PRODUCT_DB_MAPPING) = 'NeoEyes NE301'
docProduct (from DB) = 'ne301'

// 匹配判断:
docProduct === targetProduct  // 'ne301' === 'NeoEyes NE301' = false ❌

// includes虽然匹配，但降低了置信度:
docProductLower.includes(productLineLower)  // true，但这是fallback匹配
```

**结果**:
1. 精确匹配失败 → 大幅降低相似度分数
2. 依赖includes匹配 → 文档被检索到但分数很低
3. 最终可能被0.25/0.55阈值过滤掉

---

## 2. Agent工具关键词缺失分析 🟠

### 设计规范（PRD.md §3.3.2）

**Level 2: Agent扩展检索触发条件**:
> 本地RAG无结果，或相关度低，或用户明确询问Wiki之外的内容（如"最新价格"、"具体代码实现"）

**工具集**（PRD.md §3.3.2）:
```yaml
- OfficialSiteSearch: 检索 www.camthink.ai
  * 获取最新产品参数、价格、库存信息
- GithubSearch: 检索 GitHub camthink-ai
  * 获取SDK源码、Issues、Readme
```

### 当前实现（agent-tools.ts）

**planToolExecution函数**（agent-tools.ts:417-499）:

```typescript
// 当前支持的关键词:
const pricingKeywords = /\b(price|cost|how much|pricing|buy|order|purchase|cheap|expensive|affordable)\b/i;
const pricingKeywordsZh = /价格|多少钱|费用|成本|购买|便宜|贵|优惠/;

const stockKeywords = /\b(stock|available|inventory|in stock|out of stock|shipment|shipping)\b/i;
const stockKeywordsZh = /库存|现货|有货|没货|发货|配送|到货/;

const codeKeywords = /\b(code|example|sdk|api|github|sample|tutorial|how to use|programming|firmware)\b/i;
const codeKeywordsZh = /代码|示例|sdk|github|教程|编程|固件/;

// ❌ 缺失的关键词类别:
// - 产品规格（电池、续航、功耗、电源等）
// - 硬件参数（处理器、内存、接口等）
// - 技术细节（分辨率、帧率、NPU等）
```

**当前触发条件**（agent-tools.ts:432-455）:
```typescript
const hasPricing = pricingKeywords.test(query) || pricingKeywordsZh.test(query);
const hasStock = stockKeywords.test(query) || stockKeywordsZh.test(query);

if (hasPricing || hasStock) {
  // 触发 get_product_info 或 check_stock
  return { tools, requiresRAG: false };
}
```

**用户查询分析**:
```
"NE301电池续航"
  ↓
不匹配：价格/库存/代码关键词
  ↓
planToolExecution 返回: { tools: [], requiresRAG: true }
  ↓
进入RAG流程，但由于产品映射错误导致检索失败
```

---

## 3. minScore阈值分析 ⚠️

### 设计规范（BACKEND_SPEC.md §2.1）

```typescript
// §2.1: Initial Retrieval (Fast)
const docs = await vectorStore.search(query, { top: 5 });
// §2.1: Intent Classification & Quality Check
const { intent, isSufficient } = await llm.analyze({ query, docs });
```

**设计意图**:
- 初始检索应该宽松，返回更多候选文档
- 质量评估通过LLM判断，而非硬编码阈值

### 当前实现（rag.ts:376）

```typescript
export const retrieve = async (
  query: string,
  options: {
    topK?: number;
    minScore?: number;    // ❌ 默认0.25过高
    language?: 'en' | 'zh-Hans';
    productLine?: string;
  } = {}
): Promise<RetrievalResult> => {
  const { topK = 5, minScore = 0.25, language = 'en', productLine } = options;
  //                     ^^^^^
  //                   默认值太高！
```

**问题**:
- cosine相似度0.25意味着只有25%的相似度
- 电池相关文档可能因为关键词不匹配导致embedding分数低于0.25
- 虽然初始检索使用0.05，但最终结果仍被过滤

**当前阈值**:
```typescript
// 初始检索（第413行）:
minScore: 0.05  // ✅ 低阈值，好

// 默认参数（第376行）:
minScore: 0.25  // ❌ 高阈值，可能过滤掉相关结果

// 源过滤（第39行）:
const MIN_SOURCE_SCORE = 0.55;  // ❌ 更高！
```

---

## 4. 设计vs实现对比矩阵

| 功能 | PRD设计 | 当前实现 | 状态 | 问题 |
|------|----------|----------|------|------|
| **双语检索** | 强制检索docs/ + i18n/en/ | ✅ 已实现 | ✅ | 无 |
| **产品映射** | ingest时设置product_line | ⚠️ 使用映射表匹配 | ❌ | 映射值与DB不一致 |
| **Agent触发** | 价格/库存/代码/规格 | ✅ 仅价格/库存/代码 | ❌ | 缺少规格/硬件关键词 |
| **质量评估** | LLM动态判断 | ⚠️ 规则阈值+LLM兜底 | ⚠️ 阈值设置可能不当 |
| **Fallback机制** | RAG失败→Agent工具 | ✅ 已实现 | ⚠️ 关键词缺失导致不触发 |
| **产品检测** | detectProductFromQuery | ✅ 已实现 | ✅ | 基本正常 |
| **语言自适应** | 检测Query语言→回答语言 | ✅ 已实现 | ✅ | 基本正常 |

---

## 5. 根因总结

### "NE301电池续航"检索失败的完整因果链

```
用户输入: "NE301电池续航"
    ↓
1. detectProductFromQuery()
   - 检测到: productLine = 'ne301'
    ↓
2. planToolExecution()
   - 检查Agent关键词
   - "电池续航" 不匹配（价格/库存/代码）
   - 返回: { tools: [], requiresRAG: true }
    ↓
3. generateAnswer() → RAG流程
   - orchestrateRetrieval(query, 'zh-Hans', 'ne301')
    ↓
4. 产品过滤（rag.ts:424-441）
   - targetProduct = PRODUCT_DB_MAPPING['ne301'] = 'NeoEyes NE301'
   - docProduct = 'ne301' (from DB)
   - 匹配判断: 'ne301' !== 'NeoEyes NE301' = false
   - includes匹配: true（但降低了分数）
    ↓
5. 相似度评分
   - 产品不精确匹配 → embedding相似度低
   - 可能 < 0.25阈值
   - 或者 < MIN_SOURCE_SCORE (0.55)
    ↓
6. 最终结果
   - chunks.length = 0 或 分数太低
   - isEmptyOrPoorQuality = true
    ↓
7. shouldUseAgentToolsForEmptyRAG()
   - LLM判断是否使用工具
   - 但关键词缺失，可能不触发get_product_info
    ↓
8. 返回"找不到信息"或生成不准确的回答
```

---

## 6. 修复优先级矩阵

| 问题 | 影响 | 修复难度 | 预计时间 | 优先级 |
|------|------|----------|----------|--------|
| **产品映射错误** | 所有产品查询失败 | 简单 | 5分钟 | **P0 - CRITICAL** |
| **Agent关键词缺失** | Fallback不触发 | 中等 | 15分钟 | **P1 - HIGH** |
| **minScore过高** | 部分查询失败 | 简单 | 5分钟 | **P1 - HIGH** |
| **语言过滤混乱** | 代码质量 | 简单 | 5分钟 | **P2 - MEDIUM** |

**总修复时间**: 约30分钟

---

## 7. 推荐修复方案

### 方案A: 快速修复（推荐⭐）

**目标**: 最小改动，最快恢复功能

**修改清单**:

1. **移除PRODUCT_DB_MAPPING**（rag.ts:248-254）
   ```typescript
   // 删除这个映射表
   - const PRODUCT_DB_MAPPING: Record<string, string> = {
   -   'ne101': 'NeoEyes NE101',
   -   'ne301': 'NeoEyes NE301',
   -   'neoedge': 'NeoEdge NG4500',
   - };
   ```

2. **直接使用小写product code**（rag.ts:424-425）
   ```typescript
   // 修改前:
   const targetProduct = productLine ? (PRODUCT_DB_MAPPING[productLine] || productLine) : undefined;

   // 修改后:
   const targetProduct = productLine?.toLowerCase();  // 直接使用小写
   ```

3. **降低默认minScore**（rag.ts:376）
   ```typescript
   // 修改前:
   const { topK = 5, minScore = 0.25, ... }

   // 修改后:
   const { topK = 5, minScore = 0.05, ... }
   ```

4. **清理未使用的langMatch变量**（rag.ts:422）
   ```typescript
   // 删除第422行未使用的变量
   - const langMatch = Boolean(detectedLanguage && doc.metadata.language === detectedLanguage);
   ```

**优点**:
- ✅ 最少代码改动（~10行）
- ✅ 无需重新ingest数据
- ✅ 立即生效
- ✅ 风险最低

**缺点**:
- ⚠️ 产品名在metadata中仍是小写（但只要匹配一致即可）

---

### 方案B: 完整修复

**目标**: 彻底解决问题，提升整体质量

**包含方案A的所有修改**，加上：

5. **增强Agent工具关键词**（agent-tools.ts:424-430）
   ```typescript
   // 在现有关键词检查之后添加:
   const specsKeywords = /\b(specifications?|specs|hardware|parameters|features|capabilities|technical)\b/i;
   const specsKeywordsZh = /规格|硬件|参数|特性|功能|技术/;
   const powerKeywords = /\b(battery|power|consumption|voltage|current|charging|续航|battery life|power supply|供电|电源)\b/i;
   const powerKeywordsZh = /电池|续航|功耗|电源|充电|电压|电流|供电/;

   const hasSpecs = specsKeywords.test(query) || specsKeywordsZh.test(query);
   const hasPower = powerKeywords.test(query) || powerKeywordsZh.test(query);

   if (hasSpecs || hasPower) {
     const product = detectProduct(query);
     tools.push({
       name: 'get_product_info',
       params: product ? { product } : {},
       reason: 'User asking about product specifications'
     });
     return { tools, requiresRAG: false };
   }
   ```

6. **增强shouldUseAgentToolsForEmptyRAG的system prompt**（llm.ts:819-843）
   ```typescript
   // 在system prompt中添加:
   - 产品规格/硬件参数/特性问题 → 使用 get_product_info
   - 电池/电源/功耗问题 → 使用 get_product_info
   ```

**优点**:
- ✅ 覆盖更多查询场景
- ✅ Fallback机制更可靠
- ✅ 遵循PRD设计意图

**缺点**:
- ⚠️ 需要测试各种场景
- ⚠️ 代码改动较多（~50行）

---

## 8. 验证测试用例

修复后需要验证的场景：

| 场景 | 查询 | 预期结果 | 当前状态 |
|------|------|----------|----------|
| 产品规格查询 | "NE301电池续航" | 返回电池相关文档 | ❌ 失败 |
| 产品规格查询 | "NE301功耗" | 返回功耗相关文档 | ❌ 失败 |
| 产品规格查询 | "NE301电源要求" | 返回电源相关文档 | ❌ 失败 |
| 价格查询 | "NE301多少钱" | 触发get_product_info | ✅ 正常 |
| 库存查询 | "NE301有货吗" | 触发check_stock | ✅ 正常 |
| 代码查询 | "NE301 SDK使用" | 触发search_code | ✅ 正常 |
| 英文查询 | "NE301 battery life" | 返回英文电池文档 | ⚠️ 取决于实现 |
| 混合查询 | "NE301和NE101区别" | 返回对比信息 | ⚠️ 取决于实现 |

---

## 9. 相关文件清单

需要修改的文件：
1. `api/src/services/rag.ts` - RAG检索主逻辑
2. `api/src/services/agent-tools.ts` - Agent工具定义
3. `api/src/services/llm.ts` - LLM相关函数

设计文档：
- `design/PRD.md` - 产品需求文档
- `design/BACKEND_SPEC.md` - 后端技术规范

---

## 10. 下一步行动

**推荐执行方案A（快速修复）**:

```bash
# 1. 备份当前代码
git add -A
git commit -m "backup: before NE301 product mapping fix"

# 2. 应用修复
# 修改rag.ts
# 修改agent-tools.ts (可选)

# 3. 测试
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"NE301电池续航","language":"zh-Hans"}'

# 4. 验证
# 检查日志中的产品匹配是否成功
# 确认返回相关文档
```

---

**报告生成时间**: 2026-02-12
**分析者**: Claude Code (Sonnet 4.5)
**状态**: 待用户确认修复方案

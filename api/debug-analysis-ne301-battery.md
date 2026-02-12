# NE301电池续航检索失败 - 根因分析报告

**问题**: 查询"NE301电池续航"返回空结果，且agent工具未被触发

**分析时间**: 2026-02-12

---

## 问题现象

1. ✅ 数据库中**确实有NE301电池相关数据**
   - 227条NE301中文文档
   - 包含"电池"、"续航"等关键词

2. ❌ RAG检索返回空结果或低分结果（max_score < 0.08）

3. ❌ Agent工具未在初始阶段触发
   - "电池续航"不匹配价格/库存/代码关键词
   - 因此没有走`get_product_info`路径

4. ❌ Agent工具也未在RAG空结果后触发
   - 即使RAG返回空结果，fallback逻辑也未能正确调用agent工具

---

## 根本原因

### 问题1: 产品映射错误 ❌ **CRITICAL**

**位置**: `api/src/services/rag.ts:424-425`

```typescript
const targetProduct = productLine ? (PRODUCT_DB_MAPPING[productLine] || productLine) : undefined;
```

**问题**:
- 用户查询: "NE301电池续航"
- `detectProductFromQuery()` 返回: `'ne301'`
- `PRODUCT_DB_MAPPING['ne301']` 返回: `'NeoEyes NE301'`
- 数据库中的 `product_line` 值: `'ne301'` (小写！)

**结果**:
```typescript
docProduct = 'ne301'
targetProduct = 'NeoEyes NE301'
docProduct === targetProduct  // false!
docProductLower.includes('ne301')  // true ✓ (但这不够精准)
```

虽然第440行的`includes`匹配会通过，但这种不精准匹配可能导致：

1. **置信度评分降低** - 因为不是完全匹配
2. **排序问题** - 匹配度降低导致排序靠后

### 问题2: 语言过滤逻辑混乱 ⚠️

**位置**: `api/src/services/rag.ts:422-453`

```typescript
// 第422行
const langMatch = Boolean(detectedLanguage && doc.metadata.language === detectedLanguage);

// ... 产品匹配逻辑 ...

// 第450-453行 (langMatch变量从未被使用!)
console.log(`[FILTER] ... -> ${langMatch && productMatch ? 'PASS' : 'FILTER OUT'}`);

// Strict language filtering: only match documents with the detected language
if (detectedLanguage && doc.metadata.language !== detectedLanguage) return false;
```

**问题**:
- `langMatch` 变量被计算但从未真正使用
- 第453行又重复检查语言匹配
- 代码冗余且逻辑混乱

### 问题3: minScore阈值过高 📊

**位置**: `api/src/services/rag.ts:376`

```typescript
const { topK = 5, minScore = 0.25, ... } = options;
```

**问题**:
- 默认 `minScore = 0.25` 非常高
- cosine相似度0.25意味着向量只有25%的相似度
- 电池续航相关内容可能因为关键词不匹配导致embedding分数低于0.25

虽然初始检索使用0.05阈值，但最终过滤逻辑可能仍然产生负面影响。

### 问题4: Agent工具fallback未触发 🤖

**位置**: `api/src/services/rag.ts:822-844`

```typescript
const isEmptyOrPoorQuality = result.chunks.length === 0 || result.max_score < 0.08;

if (isEmptyOrPoorQuality) {
  const toolDecision = await shouldUseAgentToolsForEmptyRAG(query, language, result.thinkAnalysis);

  if (toolDecision.shouldUseTools && toolDecision.suggestedTools.length > 0) {
    // 执行agent工具...
  }
}
```

**问题**:
- `shouldUseAgentToolsForEmptyRAG` 依赖LLM判断
- LLM需要理解"电池续航"需要调用 `get_product_info`
- 但system prompt中没有明确说明"电池/规格"相关查询应该调用工具
- agent-tools.ts的`detectProduct`能识别"ne301"，但planToolExecution的关键词不包含"电池"/"续航"

---

## 数据验证

### 数据库查询结果

```sql
-- NE301文档总数
SELECT COUNT(*) FROM vector_embeddings WHERE product_line = 'ne301';
-- 结果: 489

-- NE301中文文档数
SELECT COUNT(*) FROM vector_embeddings WHERE product_line = 'ne301' AND language = 'zh-Hans';
-- 结果: 227

-- 电池相关文档
SELECT COUNT(*) FROM vector_embeddings
WHERE product_line = 'ne301'
  AND language = 'zh-Hans'
  AND (content LIKE '%电池%' OR content LIKE '%续航%');
-- 结果: >50条

-- 示例文档
SELECT doc_title, section_title FROM vector_embeddings
WHERE product_line = 'ne301'
  AND content LIKE '%电池%'
LIMIT 5;

/*
产品准备
设备开机
蓝牙管理
导入与导出
技术规格
*/
```

### 产品检测逻辑

**agent-tools.ts:39-56**
```typescript
const PRODUCT_KEYWORDS: Record<string, string[]> = {
  ne301: ['ne301', 'neoeyes ne301', 'neoeyes-ne301', 'stm32n6'],
};

function detectProduct(query: string): string | null {
  if (/\b(price|cost|how much|pricing|buy|order|purchase)\b/i.test(query)) {
    return 'general';
  }
  // 关键词匹配
  for (const [product, keywords] of Object.entries(PRODUCT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        return product;  // 'ne301'
      }
    }
  }
  return null;
}
```

**planToolExecution关键词不包含**:
- ❌ "电池" (battery)
- ❌ "续航" (battery life)
- ❌ "功耗" (power consumption)
- ❌ "电源" (power)

---

## 建议修复方案

### 修复1: 修正产品映射逻辑 🔧

**选项A**: 移除映射，直接使用小写product code
```typescript
// 修改前
const targetProduct = productLine ? (PRODUCT_DB_MAPPING[productLine] || productLine) : undefined;

// 修改后
const targetProduct = productLine?.toLowerCase();  // 直接使用小写
```

**选项B**: 修改数据库ingest逻辑，存储完整产品名
```typescript
// 在ingest.ts中统一product_line的格式
// 'ne301' -> 'NeoEyes NE301' 或保持 'ne301' 但统一映射
```

**推荐**: 选项A - 更简单，不需要重新ingest

### 修复2: 清理语言过滤逻辑 🧹

```typescript
// 删除未使用的langMatch变量
// 保留453行的严格语言匹配
if (detectedLanguage && doc.metadata.language !== detectedLanguage) {
  return false;
}
```

### 修复3: 降低默认minScore阈值 ⬇️

```typescript
// 修改前
const { topK = 5, minScore = 0.25, ... } = options;

// 修改后
const { topK = 5, minScore = 0.05, ... } = options;
```

**理由**: 0.25阈值过高，会过滤掉很多相关但不是完全匹配的结果

### 修复4: 增强Agent工具关键词 🛠️

**agent-tools.ts的planToolExecution函数**

添加电池/电源相关关键词：

```typescript
// 添加到现有的pricing/stock检查之后
const powerKeywords = /\b(battery|power|consumption|voltage|current|charging|续航|battery life|power supply)\b/i;
const powerKeywordsZh = /电池|续航|功耗|电源|充电|电压|电流|供电/;

const hasPower = powerKeywords.test(query) || powerKeywordsZh.test(query);

if (hasPower) {
  const product = detectProduct(query);

  tools.push({
    name: 'get_product_info',
    params: product ? { product } : {},
    reason: 'User asking about battery/power specifications'
  });

  return { tools, requiresRAG: false };
}
```

**或者**: 增强`shouldUseAgentToolsForEmptyRAG`的system prompt

```typescript
// 在llm.ts的shouldUseAgentToolsForEmptyRAG system prompt中添加：
- 产品规格/硬件参数问题 → 使用 get_product_info
- 电池/电源/功耗问题 → 使用 get_product_info
```

---

## 验证步骤

修复后，应该验证以下场景：

1. ✅ "NE301电池续航" → 应返回电池相关文档
2. ✅ "NE301电池能用多久" → 应返回电池相关文档
3. ✅ "NE301功耗" → 应返回电源管理相关文档
4. ✅ "NE301价格" → 应触发agent工具调用`get_product_info`
5. ✅ "NE301有货吗" → 应触发agent工具调用`check_stock`

---

## 优先级

| 问题 | 严重性 | 影响 | 修复难度 | 优先级 |
|------|--------|------|----------|--------|
| 产品映射错误 | 🔴 高 | 所有NE301查询失败 | 低 | P0 |
| 语言过滤混乱 | 🟡 中 | 代码可读性 | 低 | P2 |
| minScore过高 | 🟡 中 | 部分查询失败 | 低 | P1 |
| Agent关键词缺失 | 🟡 中 | Fallback未触发 | 中 | P1 |

---

## 测试命令

```bash
# 1. 修改代码后重新构建
cd api
npm run build

# 2. 测试检索
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "NE301电池续航",
    "language": "zh-Hans",
    "sessionId": "test-battery-001"
  }'

# 3. 检查日志
tail -f api-server.log | grep -E "\[FILTER\]|\[RETRIEVE\]|product"
```

---

## 相关文件

- `api/src/services/rag.ts` - RAG检索主逻辑
- `api/src/services/agent-tools.ts` - Agent工具定义
- `api/src/services/llm.ts` - LLM相关函数
- `api/scripts/ingest.ts` - 数据库ingestion逻辑

---

**下一步**: 实施修复方案，并进行端到端测试

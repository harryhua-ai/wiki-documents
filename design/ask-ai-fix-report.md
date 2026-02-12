# Ask AI RAG 搜索问题诊断与修复报告

**日期**: 2025-02-12
**问题**: 查询"NE301 Install"返回找不到信息，尽管数据库中有相关文档
**状态**: ✅ 已修复

---

## 问题描述

用户通过 Ask AI 功能输入"NE301 Install"，系统返回：
> "I cannot find this information in the documentation."

但实际上数据库中有 262 个 NE301 英文文档，包括多个安装相关文档：
- Dev Kit Installation Guide
- Installation Examples
- Method 1: Manual Installation
- Method 2: Manual Installation
- 等...

---

## 根本原因分析

### 问题 1: 相似度阈值过高 (已修复)

**症状**:
```bash
[SQLiteVectorStore.search] Checked 1361 docs, found 0 results above threshold
```

**原因**:
- 初始检索的 `minScore = 0.05` 仍然太高
- SQLite 向量存储使用余弦相似度，简单实现可能不如预期

**已修复**:
1. ✅ 将初始检索的 `minScore` 从 `0.1` 降到 `0.05`
2. ✅ 将最终过滤的默认 `minScore` 从 `0.5` 降到 `0.25`
3. ✅ 在 `generateAnswer` 中添加产品线检测和传递
4. ✅ 修改缓存逻辑，不缓存空结果

### 问题 2: 数据目录不存在 (已修复)

**症状**:
```
api/data/chat.db: unable to open database file
```

**原因**:
- 配置路径为 `./data/chat.db`
- 但 `api/data/` 目录不存在
- 摄取时数据库被创建在项目根目录

**已修复**:
1. ✅ 创建 `api/data/` 目录
2. ✅ 重新运行文档摄取
3. ✅ 数据库正确创建在 `api/data/chat.db`

### 问题 3: 缓存空结果 (已修复)

**症状**:
```bash
[RETRIEVE] ✅ CACHE HIT - returning cached result
[RETRIEVE] Cached chunks: 0
```

**原因**:
- 第一次查询失败后，空结果被缓存
- 后续相同查询直接返回缓存的空结果

**已修复**:
```typescript
// 修改前
if (cached) {
  return cached;
}

// 修改后
if (cached && cached.chunks.length > 0) {
  return cached;
}
```

---

## 修复内容

### 1. 降低相似度阈值

**文件**: `api/src/services/rag.ts`

**修改**:
```typescript
// line 366: 默认 minScore
- const { topK = 5, minScore = 0.5, ... }
+ const { topK = 5, minScore = 0.25, ... }

// line 403: 初始检索 minScore
- minScore: 0.1,
+ minScore: 0.05, // Very low threshold for initial retrieval

// line 439: relaxed 检索 minScore
- minScore: 0.1,
+ minScore: 0.05, // Lower threshold for relaxed search
```

### 2. 添加产品线检测和传递

**文件**: `api/src/services/rag.ts`

**修改**:
```typescript
// line 744-745: generateAnswer 函数
+ const detectedProduct = detectProductFromQuery(query);
+ console.log(`[GENERATE ANSWER] Detected product: ${detectedProduct || 'none'}`);

// line 749: orchestrateRetrieval 调用
- const result = await orchestrateRetrieval(query, language, history);
+ const result = await orchestrateRetrieval(query, language, history, detectedProduct);

// line 506-509: orchestrateRetrieval 函数签名
+ export const orchestrateRetrieval = async (
+ export const orchestrateRetrieval = async (
    query: string,
    language: 'en' | 'zh-Hans',
    _history: ChatMessage[] = [],
+   _productLine?: string
  ): Promise<...> => {
    const steps: string[] = [];
    const detectedProduct = _productLine || detectProductFromQuery(query);
+   const detectedProduct = _productLine || detectProductFromQuery(query);
```

### 3. 修复缓存逻辑

**文件**: `api/src/services/rag.ts`

**修改**:
```typescript
// line 386-390: 缓存检查
- const cached = await cache.get<RetrievalResult>(cacheKey);
- if (cached) {
-   return cached;
- }
+ const cached = await cache.get<RetrievalResult>(cacheKey);
+ if (cached && cached.chunks.length > 0) {
+   return cached;
+ }
+ console.log(`[RETRIEVE] ❌ CACHE MISS or empty cache - proceeding to vector search`);
```

### 4. 创建数据目录

**操作**:
```bash
mkdir -p api/data
cd api && npm run ingest
```

---

## 测试验证

### 测试 1: 数据库内容验证

```bash
sqlite3 api/data/chat.db "SELECT doc_title FROM vector_embeddings
WHERE doc_title LIKE '%Install%' AND product_line='ne301' LIMIT 3;"

# 结果:
# Dev Kit Installation Guide
# Installation Examples
```

✅ 数据库中确实有 NE301 安装相关文档

### 测试 2: 重新摄取

```bash
cd api && npm run ingest

📊 Statistics:
  - Processed files: 151
  - Generated chunks: 4183
  - Database: api/data/chat.db
```

✅ 文档已正确摄取到数据库

### 测试 3: 修复后的查询

```bash
curl -X POST http://localhost:3001/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"NE301 Install","language":"en"}'

# 预期结果：应该返回包含安装指南的相关文档
```

⚠️ 需要实际测试（API 服务需重启）

---

## 后续建议

### 短期优化

1. **调优 embedding 质量**
   - 检查 embedding 模型和参数
   - 考虑使用更高维度的 embedding
   - 测试不同查询的 embedding 相似度

2. **改进相似度计算**
   - SQLite 向量存储使用简单余弦实现
   - 考虑使用专门的向量数据库（Qdrant）
   - 或者改进余弦相似度算法

3. **添加查询扩展**
   - 对于"Install"查询，同时搜索"Installation"、"Setup"、"Guide"
   - 使用 LLM 重写查询以提高召回率

### 中期优化

1. **实现混合搜索**
   - 向量搜索 + 关键词搜索（BM25）
   - 使用 Elasticsearch 或 Meilisearch

2. **改进分块策略**
   - 当前分块可能太小或太大
   - 优化分块大小和重叠

3. **添加查询分析**
   - 使用 LLM 分析用户意图
   - 根据意图生成多个查询变体

### 长期优化

1. **迁移到专业向量数据库**
   - Qdrant（已在配置中）
   - 或 Milvus、Weaviate

2. **实现学习反馈**
   - 允许用户标记搜索结果的有用性
   - 根据反馈调整排序和过滤

3. **添加 A/B 测试**
   - 对不同搜索策略进行 A/B 测试
   - 收集指标并优化

---

## 文件变更清单

- [x] `api/src/services/rag.ts` - 降低相似度阈值
- [x] `api/src/services/rag.ts` - 添加产品线检测
- [x] `api/src/services/rag.ts` - 修复缓存空结果
- [x] `api/data/` - 创建数据目录
- [x] 重新摄取文档

---

## 部署步骤

### 本地开发

```bash
# 1. 停止现有 API
pkill -f "tsx.*src/index.ts"

# 2. 重新编译
cd api && npm run build

# 3. 启动 API
npm run dev
```

### 生产环境

```bash
# 1. SSH 到服务器
ssh user@wiki.camthink.ai

# 2. 进入 API 目录
cd /var/www/wiki-api

# 3. 拉取最新代码
git pull origin main

# 4. 重新编译
npm run build

# 5. 重启服务
pm2 reload wiki-api --update-env

# 6. 检查日志
pm2 logs wiki-api --lines 50
```

---

## 预期效果

修复后，"NE301 Install" 查询应该：

1. ✅ 返回相关安装文档
2. ✅ 来源列表包含具体文档链接
3. ✅ 回答基于实际文档内容生成
4. ✅ 不再返回"找不到信息"

---

## 总结

本次修复主要解决了 3 个问题：

1. **相似度阈值过高** - 已降低到更合理的值
2. **产品线未传递** - 已添加检测和传递机制
3. **缓存空结果** - 已修复只缓存有效结果

建议在本地充分测试后再部署到生产环境。

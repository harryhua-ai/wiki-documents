# NE301 RAG Bug修复 - 执行计划

**创建日期**: 2026-02-12
**状态**: 执行中
**工作流**: 6阶段多模型协作

---

## 执行摘要

基于三个分析文档的深度诊断，本计划采用**分阶段修复策略**：
- **阶段1（快速修复）**: 5分钟，修复P0-P1问题，恢复基本功能
- **阶段2（架构改进）**: 可选，添加Query Analysis Agent

---

## Phase 1: Research & Analysis ✅

### 已完成的分析文档

1. **根因分析** (`debug-analysis-ne301-battery.md`)
   - 产品映射错误：`'ne301' !== 'NeoEyes NE301'`
   - Agent关键词缺失：无"电池"/"续航"相关关键词
   - minScore阈值：0.25过高
   - Fallback机制：未正确触发

2. **设计vs实现对比** (`design-vs-implementation-analysis.md`)
   - PRD期望：产品规格查询应触发Agent工具
   - 实际实现：仅支持价格/库存/代码
   - 对比矩阵：4项关键差异

3. **完整修复计划** (`NE301-RAG-Fix-Plan.md`)
   - 方案A：快速修复（~15行代码）
   - 方案B：完整Query Analysis Agent（~400行新增）

### 需求完整性评分

**评分**: 9/10

**理由**:
- ✅ 问题现象清晰
- ✅ 根因已定位
- ✅ 设计文档已对比
- ✅ 修复方案已设计
- ⚠️ 测试用例需补充

---

## Phase 2: Solution Ideation

### 方案对比

| 维度 | 方案A: 快速修复 | 方案B: 完整修复 |
|------|----------------|----------------|
| **代码改动** | ~15行 | ~400行 |
| **实施时间** | 5分钟 | 1-2小时 |
| **风险** | 低 | 中 |
| **测试成本** | 低 | 高 |
| **效果** | 恢复基本功能 | 架构级改进 |
| **兼容性** | 完全向后兼容 | 需要新参数 |

### 推荐方案：先A后B

**Phase 4执行方案A**：
1. 移除PRODUCT_DB_MAPPING
2. 清理langMatch变量
3. 降低默认minScore到0.05

**验证后再决定方案B**：
- 如果基本查询恢复正常 → 可选实施B
- 如果仍有问题 → 必须实施B

---

## Phase 3: Detailed Planning

### 任务清单

#### Task 1: 修复产品映射错误（P0 - CRITICAL）

**文件**: `api/src/services/rag.ts`

**修改位置**: 第248-254行、第424-425行

**修改前**:
```typescript
// 第248-254行
const PRODUCT_DB_MAPPING: Record<string, string> = {
  'ne101': 'NeoEyes NE101',
  'ne301': 'NeoEyes NE301',
  'neoedge': 'NeoEdge NG4500',
};

// 第424-425行
const targetProduct = productLine ? (PRODUCT_DB_MAPPING[productLine] || productLine) : undefined;
```

**修改后**:
```typescript
// 删除PRODUCT_DB_MAPPING映射表

// 修改为：
const targetProduct = productLine?.toLowerCase();
```

**预期效果**: 产品匹配从失败变为成功，相似度恢复正常

---

#### Task 2: 清理未使用的langMatch变量（P2 - LOW）

**文件**: `api/src/services/rag.ts`

**修改位置**: 第422行

**修改前**:
```typescript
const langMatch = Boolean(detectedLanguage && doc.metadata.language === detectedLanguage);
```

**修改后**:
```typescript
// 完全删除这行
```

**预期效果**: 代码更清晰，逻辑不混乱

---

#### Task 3: 降低默认minScore（P1 - HIGH）

**文件**: `api/src/services/rag.ts`

**修改位置**: 第376行

**修改前**:
```typescript
const { topK = 5, minScore = 0.25, language = 'en', productLine } = options;
```

**修改后**:
```typescript
const { topK = 5, minScore = 0.05, language = 'en', productLine } = options;
```

**预期效果**: 更多文档能通过初始检索

---

#### Task 4: 验证测试

**测试用例**:

| 场景 | 查询 | 预期结果 | 验证方法 |
|------|------|----------|----------|
| 产品规格 | "NE301电池续航" | 返回电池文档 | curl测试 |
| 产品规格 | "NE301功耗" | 返回电源文档 | curl测试 |
| 产品规格 | "NE301电源要求" | 返回电源文档 | curl测试 |
| 价格查询 | "NE301多少钱" | 触发Agent | 已正常 |
| 库存查询 | "NE301有货吗" | 触发Agent | 已正常 |

**验收标准**:
```bash
# 预期日志输出
[RETRIEVE] Detected product: ne301
[FILTER] Doc: ... Product=ne301 (Target: ne301) -> PASS  ✓
[RETRIEVE] Top 3 scores: >0.5
```

---

## Phase 4: Implementation

### 执行步骤

1. **备份当前状态**
   ```bash
   git add -A
   git commit -m "backup: before NE301 product mapping fix"
   ```

2. **应用修复**
   - 编辑 `api/src/services/rag.ts`
   - 删除PRODUCT_DB_MAPPING
   - 修改targetProduct计算逻辑
   - 删除langMatch变量
   - 修改默认minScore

3. **重新构建**
   ```bash
   cd api
   npm run build
   ```

4. **测试验证**
   ```bash
   curl -X POST http://localhost:3001/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"NE301电池续航","language":"zh-Hans","sessionId":"test-battery-001"}'
   ```

---

## Phase 5: Code Optimization

### 优化项

1. **代码审查检查点**
   - [ ] 没有引入新bug
   - [ ] 逻辑保持一致
   - [ ] 类型安全（TypeScript）

2. **性能检查**
   - [ ] 没有增加不必要的计算
   - [ ] 数据库查询效率正常

3. **向后兼容性**
   - [ ] API接口不变
   - [ ] 响应格式不变

---

## Phase 6: Quality Review

### 检查清单

**功能验证**:
- [ ] "NE301电池续航"返回相关文档
- [ ] "NE301功耗"返回相关文档
- [ ] "NE301价格"仍触发Agent
- [ ] 英文查询正常工作

**代码质量**:
- [ ] 符合TypeScript编码规范
- [ ] 没有console.log残留
- [ ] 错误处理完整

**文档更新**:
- [ ] 更新CHANGELOG.md
- [ ] 更新测试文档

---

## 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 产品映射引入新bug | 低 | 局部产品查询失败 | 充分测试所有产品 |
| minScore过低返回无关结果 | 低 | 用户体验下降 | 可调整回0.1-0.15 |
| 代码格式问题 | 低 | 构建失败 | 使用prettier格式化 |

---

## 后续优化（可选）

### 方案B: Query Analysis Agent

如果方案A修复后仍有问题，考虑实施：

1. **创建** `api/src/services/query-analysis.ts`
2. **修改** `api/src/services/agent-tools.ts` 集成Query Analysis
3. **修改** `api/src/services/rag.ts` 支持并行检索
4. **添加** 单元测试和集成测试

**预计时间**: 1-2小时

---

## 执行时间线

| 阶段 | 预计时间 | 状态 |
|------|----------|------|
| Phase 1: Research | 已完成 | ✅ |
| Phase 2: Ideation | 已完成 | ✅ |
| Phase 3: Planning | 已完成 | ✅ |
| Phase 4: Implementation | 5-10分钟 | 🔄 进行中 |
| Phase 5: Optimization | 5分钟 | ⏳ 待开始 |
| Phase 6: Review | 10分钟 | ⏳ 待开始 |

**总计**: 20-30分钟

---

## 参考文档

- `design/NE301-RAG-Fix-Plan.md` - 完整修复计划
- `design/design-vs-implementation-analysis.md` - 设计vs实现对比
- `api/debug-analysis-ne301-battery.md` - 根因分析报告

---

**文档版本**: v1.0
**最后更新**: 2026-02-12
**执行者**: Claude Code (Sonnet 4.5)

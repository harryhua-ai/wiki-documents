# 监控系统文档

## 概述

Ask AI 监控系统基于 Prometheus + Grafana 构建，提供全面的性能可观测性，支持数据驱动的性能优化。

## 架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Ask AI API    │───▶│   Prometheus     │───▶│    Grafana      │
│  (express)      │    │  (metrics scrape)│    │  (visualization)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
  /metrics 端点
  (port 3001)
```

## 指标类型

### 1. 路径选择统计 (`wiki_api_askai_path_selection_total`)

**标签**: `path` (fast | agent | agent_tools)

**用途**: 跟踪快速路径 vs 智能路径(Agent/Agent Tools)的选择分布

**查询示例**:
```promql
# 各路径请求总数
sum by (path) (wiki_api_askai_path_selection_total)

# 路径选择占比（百分比）
sum by (path) (wiki_api_askai_path_selection_total) / sum(wiki_api_askai_path_selection_total) * 100
```

### 2. 端到端响应时间 (`wiki_api_askai_e2e_duration_seconds`)

**标签**: `path` (fast | agent | agent_tools), `status` (success | error)

**用途**: 监控从用户提问到完整响应的整个流程耗时

**Bucket范围**: 0.5s, 1s, 2s, 3s, 5s, 8s, 10s, 15s, 20s, 30s

**查询示例**:
```promql
# P95 响应时间（目标: < 5秒）
histogram_quantile(0.95, sum(rate(wiki_api_askai_e2e_duration_seconds_bucket[5m])) by (le, path))

# P50 中位数响应时间
histogram_quantile(0.50, sum(rate(wiki_api_askai_e2e_duration_seconds_bucket[5m])) by (le, path))

# 平均响应时间
rate(wiki_api_askai_e2e_duration_seconds_sum[5m]) / rate(wiki_api_askai_e2e_duration_seconds_count[5m])
```

### 3. 缓存命中率

**指标**:
- `wiki_api_cache_hit_total` - 缓存命中次数
- `wiki_api_cache_miss_total` - 缓存未命中次数

**标签**: `cache_type` (embedding | tool | rag)

**查询示例**:
```promql
# Embedding 缓存命中率（目标: > 70%）
wiki_api_cache_hit_total{cache_type="embedding"} / (wiki_api_cache_hit_total{cache_type="embedding"} + wiki_api_cache_miss_total{cache_type="embedding"})

# RAG 缓存命中率
wiki_api_cache_hit_total{cache_type="rag"} / (wiki_api_cache_hit_total{cache_type="rag"} + wiki_api_cache_miss_total{cache_type="rag"})
```

### 4. Reranker跳过统计 (`wiki_api_reranker_skip_total`)

**标签**: `reason` (no_results | low_score | config_disabled | error)

**用途**: 记录Reranker被跳过的原因（用于性能优化分析）

**查询示例**:
```promql
# 各原因跳过次数
sum by (reason) (wiki_api_reranker_skip_total)
```

### 5. Agent工具调用统计

**指标**:
- `wiki_api_tool_calls_total` - 工具调用总数
- `wiki_api_tool_call_duration_seconds` - 工具调用耗时

**标签**: `tool_name`, `status` (success | error)

**查询示例**:
```promql
# 各工具调用成功率
sum by (tool_name) (wiki_api_tool_calls_total{status="success"}) / sum by (tool_name) (wiki_api_tool_calls_total) * 100

# 工具调用 P95 耗时
histogram_quantile(0.95, sum(rate(wiki_api_tool_call_duration_seconds_bucket[5m])) by (le, tool_name))
```

### 6. 查询意图分析 (`wiki_api_query_intent_total`)

**标签**: `intent` (SIMPLE_FACT | COMPARISON | TROUBLESHOOTING | etc.)

**用途**: 跟踪不同查询意图的分布

**查询示例**:
```promql
# 各意图查询总数
sum by (intent) (wiki_api_query_intent_total)
```

### 7. LLM 性能指标

**指标**:
- `wiki_api_llm_token_usage_total` - Token使用量
- `wiki_api_llm_request_duration_seconds` - LLM请求耗时
- `wiki_api_llm_errors_total` - LLM错误次数

**查询示例**:
```promql
# Token 使用率（每秒）
rate(wiki_api_llm_token_usage_total[5m])

# LLM 请求 P95 耗时
histogram_quantile(0.95, sum(rate(wiki_api_llm_request_duration_seconds_bucket[5m])) by (le, model))

# LLM 错误率
rate(wiki_api_llm_errors_total[5m]) / rate(wiki_api_llm_request_duration_seconds_count[5m])
```

## Grafana 仪表盘

### 导入仪表盘

1. 登录 Grafana
2. 导航到 **Dashboards** > **Import**
3. 上传 `monitoring/grafana-dashboard.json` 文件
4. 选择 Prometheus 数据源
5. 点击 **Import**

### 仪表盘面板

#### Ask AI 性能总览
- **路径选择分布** - 饼图显示快速路径/智能路径/工具路径的占比
- **端到端响应时间 (P95/P50)** - 时间序列图，目标 < 5秒

#### 缓存性能
- **缓存命中率** - 仪表盘，目标 > 70%
- **缓存命中/未命中趋势 (QPS)** - 时间序列图

#### Agent 工具性能
- **工具调用状态分布** - 饼图显示各工具的成功/失败比例
- **工具调用响应时间 (P95)** - 时间序列图

#### 查询分析
- **查询意图分布** - 饼图显示不同查询意图的占比
- **Reranker跳过原因** - 饼图显示跳过原因分布

#### LLM 性能
- **LLM Token 使用率** - 时间序列图
- **LLM 请求响应时间 (P95)** - 时间序列图

## 告警规则

### 告警配置

在 Prometheus 配置文件中添加告警规则：

```yaml
groups:
  - name: askai_performance
    interval: 30s
    rules:
      # 高响应时间告警
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95, sum(rate(wiki_api_askai_e2e_duration_seconds_bucket[5m])) by (le, path)) > 8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Ask AI 高响应时间"
          description: "P95 响应时间 > 8s 持续 5 分钟 (路径: {{ $labels.path }})"

      # 低缓存命中率告警
      - alert: LowCacheHitRate
        expr: |
          wiki_api_cache_hit_total{cache_type="embedding"} / (wiki_api_cache_hit_total{cache_type="embedding"} + wiki_api_cache_miss_total{cache_type="embedding"}) < 0.3
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "低缓存命中率"
          description: "Embedding 缓存命中率 < 30% 持续 10 分钟"

      # 工具调用失败率告警
      - alert: HighToolFailureRate
        expr: |
          sum(rate(wiki_api_tool_calls_total{status="error"}[5m])) / sum(rate(wiki_api_tool_calls_total[5m])) > 0.2
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "工具调用失败率过高"
          description: "工具 {{ $labels.tool_name }} 失败率 > 20% 持续 5 分钟"

      # LLM 错误率告警
      - alert: HighLLMErrorRate
        expr: |
          sum(rate(wiki_api_llm_errors_total[5m])) / sum(rate(wiki_api_llm_request_duration_seconds_count[5m])) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "LLM 错误率过高"
          description: "模型 {{ $labels.model }} 错误率 > 10% 持续 5 分钟"
```

### 验证指标采集

访问 `/metrics` 端点验证指标是否正常采集：

```bash
curl http://localhost:3001/metrics | grep wiki_api_askai
```

预期输出：
```
wiki_api_askai_path_selection_total{path="fast"} 123
wiki_api_askai_path_selection_total{path="agent"} 45
wiki_api_askai_path_selection_total{path="agent_tools"} 12
wiki_api_askai_e2e_duration_seconds_bucket{path="fast",status="success",le="0.5"} 10
wiki_api_askai_e2e_duration_seconds_bucket{path="fast",status="success",le="1"} 45
...
```

## 性能优化指南

### 使用监控数据进行优化

1. **响应时间优化**
   - 查看 P95 响应时间趋势
   - 识别慢速路径（通常是 agent 路径）
   - 分析是否需要优化 Reranker 或 LLM 调用

2. **缓存优化**
   - 监控缓存命中率
   - 如果命中率 < 70%，考虑：
     - 增加缓存容量
     - 调整 TTL 时间
     - 分析缓存未命中的查询模式

3. **工具调用优化**
   - 识别高延迟工具
   - 检查工具错误率
   - 考虑添加工具结果缓存

4. **容量规划**
   - 基于 QPS 和响应时间趋势
   - 预测峰值负载
   - 规划资源扩容

## 故障排查

### 常见问题

1. **指标未采集**
   - 检查 `/metrics` 端点是否可访问
   - 验证 Prometheus scrape 配置
   - 查看 API 服务日志

2. **Grafana 无数据**
   - 确认 Prometheus 数据源配置正确
   - 检查时间范围选择器
   - 验证 PromQL 查询语法

3. **告警未触发**
   - 检查 Prometheus 告警规则加载状态
   - 验证 Alertmanager 配置
   - 查看 Prometheus 目标状态

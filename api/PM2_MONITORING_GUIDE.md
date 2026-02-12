# PM2 Monitoring Guide for Wiki API

**适用环境**: 生产服务器（No-Docker 环境）
**部署方式**: PM2 进程管理
**文档版本**: v1.0

---

## 一、监控命令速查

### 1.1 基础监控命令

```bash
# 查看所有进程状态
pm2 status

# 查看 API 服务状态
pm2 status wiki-api

# 实时查看日志（流式）
pm2 logs wiki-api

# 查看最近 100 行日志
pm2 logs wiki-api --lines 100

# 仅查看错误日志
pm2 logs wiki-api --err

# 查看日志并清空历史
pm2 logs wiki-api --lines 100 --raw
```

### 1.2 进程管理命令

```bash
# 启动服务
pm2 start pm2.config.js

# 零停机重载（推荐，用户无感知）
pm2 reload wiki-api

# 重启服务（会断开当前连接）
pm2 restart wiki-api

# 停止服务
pm2 stop wiki-api

# 删除服务
pm2 delete wiki-api

# 重启所有服务
pm2 reload all
```

### 1.3 监控面板命令

```bash
# 实时监控（命令行交互式）
pm2 monit

# 输出详情
pm2 show wiki-api

# 重置重启计数器
pm2 reset wiki-api
```

---

## 二、日志详解

### 2.1 日志文件位置

```
api/
├── logs/
│   ├── error.log       # 错误日志（PM2 自动轮转）
│   ├── access.log      # 访问日志（PM2 自动轮转）
│   └── combined.log    # 合并日志（所有输出）
└── pm2.config.js
```

### 2.2 日志轮转配置

在 `api/pm2.config.js` 中已配置：

```javascript
{
  // 日志轮转（保留 7 天）
  rotate_log: true,
  log_rotate_interval: '0 0 * *',  // 每天午夜执行
  rotate_log_higher: 7,             // 保留 7 个备份文件
  rotate_log_lower: 0,
}
```

### 2.3 手动查看日志文件

```bash
# 实时跟踪错误日志
tail -f api/logs/error.log

# 查看最近错误
tail -100 api/logs/error.log

# 搜索特定错误
grep -i "EADDRINUSE" api/logs/error.log
grep -i "DEEPSEEK" api/logs/error.log

# 统计错误类型
grep -o "Error:.*" api/logs/error.log | sort | uniq -c
```

---

## 三、性能监控

### 3.1 资源使用监控

```bash
# 实时监控（交互式 TUI）
pm2 monit

# 或者使用 htop 配合过滤
htop -p $(pm2 jlist | jq '.[].pid' | tr '\n' ' ')

# 查看 Node.js 进程内存使用
pm2 describe wiki-api | grep -A5 "memory"
```

### 3.2 自定义监控指标

在 `api/pm2.config.js` 中配置：

```javascript
{
  // 内存限制（1GB，超过自动重启）
  max_memory_restart: '1G',

  // 重启限制（15 次/分钟则停止重启）
  max_restarts: 15,
  min_uptime: '30s',  // 启动 30 秒后才开始计数

  // CPU 监控（PM2 Plus 功能）
  watch: false,  // 不监听文件变化（生产环境）
}
```

### 3.3 健康检查端点

API 内置健康检查端点：

```bash
# 基础健康检查
curl https://wiki.camthink.ai/api/health

# 详细健康状态（可选，需要实现）
curl https://wiki.camthink.ai/api/health/detailed

# 响应示例
{
  "status": "healthy",
  "uptime": 3600,
  "memory": {
    "used": "256MB",
    "limit": "1GB"
  },
  "database": {
    "type": "sqlite",
    "status": "connected"
  }
}
```

---

## 四、告警配置

### 4.1 PM2 内置告警

```bash
# 安装 PM2 Plus（可选，提供更多监控功能）
pm2 plus register

# 配置告警（需要 PM2 Plus）
pm2 set pm2:alert-option:cpu-overload 95
pm2 set pm2:alert-option:memory 1024
pm2 set pm2:alert-option:restart 10
```

### 4.2 系统级告警脚本

创建 `api/scripts/alert.sh`：

```bash
#!/bin/bash
# Simple alert script for PM2 process monitoring

ALERT_EMAIL="admin@camthink.ai"
ALERT_THRESHOLD=90  # CPU/Memory percentage

while true; do
    # Check if API is running
    if ! pm2 status wiki-api | grep -q "online"; then
        echo "[$(date)] ❌ wiki-api is down!" | mail -s "Alert: API Down" $ALERT_EMAIL
        # Try to restart
        pm2 start pm2.config.js
    fi

    # Check CPU/Memory (requires pm2 list)
    STATS=$(pm2 describe wiki-api --json | jq '.[0].monit')
    CPU=$(echo $STATS | jq '.cpu')
    MEMORY=$(echo $STATS | jq '.memory')

    if [ $(echo "$CPU > $ALERT_THRESHOLD" | bc) -eq 1 ]; then
        echo "[$(date)] ⚠️  High CPU: $CPU%" | mail -s "Alert: High CPU" $ALERT_EMAIL
    fi

    sleep 60  # Check every minute
done
```

### 4.3 日志聚合（推荐）

生产环境推荐使用 ELK/Loki：

```bash
# 安装 Loki + Promtail（轻量级）
# 1. 安装 Loki
docker run -d \
  --name loki \
  -p 3100:3100 \
  grafana/loki

# 2. 配置 Promtail 读取 PM2 日志
# promtail config.yml
server:
  logfile: /var/log/wiki-api/combined.log

loki:
  url: http://localhost:3100/loki/api/v1/push

# 3. 启动 Promtail
promtail --config.file=promtail-config.yml
```

---

## 五、故障排查流程

### 5.1 服务无法启动

**症状**: `pm2 status` 显示 `errored`

**排查步骤**:

```bash
# 1. 查看详细错误日志
pm2 logs wiki-api --err --lines 50

# 2. 手动运行测试
cd api
npm run build
node dist/index.js

# 3. 检查环境变量
cat api/.env.production | grep -E "DEEPSEEK|SILICONFLOW|QDRANT|PORT"

# 4. 验证端口占用
netstat -tlnp | grep 3001
# 或
lsof -i :3001

# 5. 检查 Node.js 版本
node --version  # 需要 18+

# 6. 验证依赖安装
cd api
npm list --depth=0
```

**常见问题**:

| 错误信息 | 原因 | 解决方法 |
|---------|-------|----------|
| `EADDRINUSE :3001` | 端口被占用 | `sudo kill $(lsof -t -i :3001 | tail -1 | awk '{print $2}')` |
| `Cannot find module '@types/...'` | TypeScript 类型缺失 | `npm install --save-dev @types/...` |
| `Invalid API key` | 环境变量错误 | 检查 `.env.production` 配置 |
| ` SQLITE_CANTOPEN` | 数据库权限/路径 | `mkdir -p data && chmod 755 data` |
| `Error: connect ECONNREFUSED` | LLM API 连接失败 | 检查防火墙/代理配置 |

### 5.2 内存泄漏检测

**症状**: API 频繁重启（PM2 显示 many restarts）

**排查**:

```bash
# 1. 查看重启历史
pm2 describe wiki-api | grep -A2 "restart time"

# 2. 内存趋势分析
pm2 describe wiki-api --json | jq '.[0].monit.memory' > /tmp/memory.log

# 3. 使用 heapdump（生产环境慎用）
# 在代码中添加：
# if (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal > 0.9) {
#   const v8 = require('v8');
#   v8.writeHeapSnapshot();
# }

# 4. 启用 --inspect 模式（仅开发）
pm2 start pm2.config.js --node-args="--inspect=0.0.0.0:9229"
```

### 5.3 SSE 连接中断

**症状**: 前端显示"连接断开"，无流式输出

**排查**:

```bash
# 1. 检查 Nginx 配置
cat /etc/nginx/sites-available/wiki-api.conf | grep -A10 "location /api/"

# 确认以下配置存在：
# proxy_buffering off;
# proxy_cache off;
# proxy_read_timeout 300s;
# proxy_send_timeout 300s;

# 2. 测试 SSE 端点
curl -N https://wiki.camthink.ai/api/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}' \
  --no-buffer

# 3. 检查 PM2 日志中的超时错误
pm2 logs wiki-api | grep -i "timeout"

# 4. 验证客户端重连逻辑
# 前端应实现 SSE 自动重连
```

---

## 六、日常运维

### 6.1 每日检查清单

```bash
#!/bin/bash
# daily-check.sh

echo "=== Daily PM2 Health Check ==="

# 1. 服务状态
pm2 status wiki-api | grep -q "online" && echo "✅ API Online" || echo "❌ API Down"

# 2. 重启次数（过去 24 小时）
RESTARTS=$(pm2 describe wiki-api | grep "restart time:" | wc -l)
echo "Restarts in 24h: $RESTARTS"
if [ $RESTARTS -gt 5 ]; then
    echo "⚠️  WARNING: Too many restarts!"
fi

# 3. 磁盘空间
DISK=$(df -h api/logs | tail -1 | awk '{print $5}' | sed 's/%//')
echo "Log disk usage: ${DISK}%"
if [ $DISK -gt 80 ]; then
    echo "⚠️  WARNING: Log disk almost full!"
    pm2 flush wiki-api  # 清空日志
fi

# 4. 内存使用
MEMORY=$(pm2 describe wiki-api --json | jq '.[0].monit.memory')
echo "Memory usage: $MEMORY"
```

### 6.2 日志清理

```bash
#!/bin/bash
# clean-logs.sh

echo "Flushing PM2 logs..."
pm2 flush wiki-api

# 或手动清理超过 7 天的日志
find api/logs -name "*.log" -mtime +7 -delete

# 压缩归档
tar -czf logs-$(date +%Y%m%d).tar.gz api/logs/*.log
rm -f api/logs/*.log
```

### 6.3 配置备份

```bash
#!/bin/bash
# backup-config.sh

BACKUP_DIR="/var/backups/wiki-api"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

# 备份 PM2 配置
cp api/pm2.config.js $BACKUP_DIR/pm2.config.$DATE.js

# 备份环境变量
cp api/.env.production $BACKUP_DIR/.env.production.$DATE

# 备份 Nginx 配置
cp /etc/nginx/sites-available/wiki-api.conf $BACKUP_DIR/nginx.conf.$DATE

# 保留最近 30 天的备份
find $BACKUP_DIR -name "*.$DATE.*" -mtime +30 -delete
```

---

## 七、监控集成（高级）

### 7.1 Prometheus + Grafana

创建 `api/scripts/prometheus-exporter.js`：

```javascript
const express = require('express');
const pm2 = require('pm2');

const app = express();
const PORT = 9100;

app.get('/metrics', async (req, res) => {
  const list = await pm2.list();
  const process = list[0].pm2_env;

  const metrics = [
    `wiki_api_up{process="wiki-api"} ${process.pm_id ? 1 : 0}`,
    `wiki_api_memory_bytes{process="wiki-api"} ${process.memory || 0}`,
    `wiki_api_cpu_percent{process="wiki-api"} ${process.cpu || 0}`,
    `wiki_api_restart_count{process="wiki-api"} ${process.restart_time || 0}`,
  ].join('\n');

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

app.listen(PORT, () => {
  console.log(`Prometheus exporter listening on :${PORT}`);
});
```

Prometheus 配置 (`prometheus.yml`):

```yaml
scrape_configs:
  - job_name: 'wiki-api'
    static_configs:
      - targets: ['localhost:9100']
    scrape_interval: 15s
```

### 7.2 Grafana Dashboard

导入 Dashboard JSON（创建 `api/grafana-dashboard.json`）：

```json
{
  "dashboard": {
    "title": "Wiki API Metrics",
    "panels": [
      {
        "title": "API Memory Usage",
        "targets": [{
          "expr": "wiki_api_memory_bytes"
        }],
        "type": "graph"
      },
      {
        "title": "API CPU Usage",
        "targets": [{
          "expr": "wiki_api_cpu_percent"
        }],
        "type": "graph"
      },
      {
        "title": "API Uptime",
        "targets": [{
          "expr": "wiki_api_up"
        }],
        "type": "stat"
      }
    ]
  }
}
```

---

## 八、快速参考

### 8.1 常用命令清单

```bash
# === 状态查看 ===
pm2 status                     # 所有服务状态
pm2 status wiki-api            # API 服务状态
pm2 describe wiki-api           # 详细信息
pm2 list                      # 列表格式

# === 日志查看 ===
pm2 logs wiki-api              # 实时日志
pm2 logs wiki-api --lines 100  # 最近 100 行
pm2 logs wiki-api --err        # 仅错误
pm2 flush wiki-api            # 清空日志

# === 进程管理 ===
pm2 start pm2.config.js        # 启动
pm2 reload wiki-api            # 零停机重载
pm2 restart wiki-api           # 重启
pm2 stop wiki-api              # 停止
pm2 delete wiki-api            # 删除

# === 高级操作 ===
pm2 save                      # 保存当前进程列表
pm2 resurrect                 # 恢复已保存的进程
pm2 rollback wiki-api          # 回滚到上一版本
pm2 reset wiki-api            # 重置重启计数器
pm2 monit                    # 实时监控 TUI

# === 开机自启 ===
pm2 startup                   # 生成开机启动脚本
pm2 unstartup                 # 移除开机启动
```

### 8.2 日志关键词搜索

```bash
# 搜索错误
pm2 logs wiki-api | grep -i "error"

# 搜索 LLM 调用
pm2 logs wiki-api | grep "DEEPSEEK"

# 搜索数据库操作
pm2 logs wiki-api | grep "SQLite"

# 搜索 API 请求
pm2 logs wiki-api | grep "POST /api/chat"

# 统计请求量（过去 1 小时）
pm2 logs wiki-api --lines 10000 | grep "POST /api/chat" | wc -l

# 查找慢请求（>5s）
pm2 logs wiki-api | grep -E "latency.*[5-9][0-9]{3}|latency.*[1-9][0-9]{4}"
```

### 8.3 性能基准

**预期性能指标**：

| 指标 | 目标值 | 监控命令 |
|------|--------|----------|
| **响应时间 (P95)** | < 5s | `pm2 logs \| grep latency` |
| **内存使用** | < 1GB | `pm2 describe wiki-api --json \| jq '.[0].monit.memory'` |
| **CPU 使用率** | < 50% | `pm2 monit` 或 `top -p $(pid)` |
| **重启频率** | < 1次/天 | `pm2 describe wiki-api \| grep 'restart time'` |
| **错误率** | < 5% | `pm2 logs --err \| wc -l / $(pm2 logs \| wc -l)` |

---

## 附录：故障排查决策树

```
API 无法访问
    │
    ├─ Nginx 返回 502 → PM2 进程未启动
    │                              → pm2 start pm2.config.js
    │
    ├─ Nginx 返回 504 → API 超时
    │                              → 检查 LLM API 响应
    │                              → 查看 pm2 logs 中的慢请求
    │
    ├─ curl: Connection refused → 端口 3001 未监听
    │                              → pm2 status wiki-api
    │                              → netstat -tlnp \| grep 3001
    │
    └─ 浏览器 CORS 错误   → Nginx 配置错误
                                   → 检查 Access-Control-Allow-Origin
                                   → 验证 add_header CORS 配置

API 响应慢
    │
    ├─ 初次请求慢         → 向量库冷启动
    │                              → 正常，后续请求会快
    │
    ├─ 所有请求慢         → LLM API 延迟
    │                              → 检查 DeepSeek/SiliconFlow 状态
    │                              → 考虑切换模型
    │
    └─ 偶尔请求慢        → SQLite 查询优化
                                   → 考虑迁移到 Qdrant Cloud

日志中出现大量错误
    │
    ├─ ECONNREFUSED        → 外部 API 连接失败
    │                              → 检查防火墙
    │                              → 验证 API Keys
    │
    ├─ Error: Cannot find module → 依赖缺失
    │                              → npm install --production
    │
    └─ SQLITE_CANTOPEN    → 数据库文件权限
                                   → chmod 755 api/data
                                   → chown www-data:www-data api/data
```

---

**文档维护**: 本文档应随部署环境变化同步更新
**最后更新**: 2026-02-12
**责任人**: DevOps Team

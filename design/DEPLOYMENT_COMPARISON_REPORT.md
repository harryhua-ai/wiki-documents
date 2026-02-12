# 部署架构对比分析报告

**分析日期**: 2026-02-12
**对比分支**: `main` vs `feat/ask-ai-mvp`
**分析范围**: 部署相关文件、CI/CD 流程、服务器配置

---

## 执行摘要

**关键发现**：
- `main` 分支：仅支持静态网站部署
- `feat/ask-ai-mvp` 分支：静态网站 + API 服务完整部署体系
- **新增 5 个关键部署文件**，支持 Ask AI API 服务独立部署

---

## 一、文件清单对比

### 1.1 新增文件（feat/ask-ai-mvp 专属）

| 文件 | 用途 | 关键功能 |
|------|------|----------|
| `.github/workflows/deploy-api.yml` | API 专用 CI/CD 流程 | 检测 `api/` 变化，自动部署 API 服务 |
| `api/nginx.conf` | Nginx 反向代理配置 | SSE 支持、安全头、缓存策略 |
| `api/pm2.config.js` | PM2 进程管理配置 | 自动重启、日志轮转、内存限制 |
| `api/scripts/deploy.sh` | 手动部署脚本 | 本地构建 + SSH 部署 |
| `api/src/services/github-scraper.ts` | GitHub 数据抓取 | Agent 工具数据源 |

### 1.2 修改文件

| 文件 | 主要变更 |
|------|----------|
| `.github/workflows/deploy.yml` | 添加 API 部署注释，集成文档索引触发 |
| `package.json` | 添加 `yarn ingest` 和 `yarn ingest:force` 脚本 |

---

## 二、CI/CD 工作流对比

### 2.1 Main 分支（静态网站部署）

**流程图**：
```
push to main
  ↓
GitHub Actions (deploy.yml)
  ↓
[yarn install] → [yarn build] → [rsync to server]
  ↓
静态文件部署完成 ✅
```

**特点**：
- ✅ 简单直接
- ✅ 仅部署静态文件（Docusaurus build）
- ❌ 无 API 服务支持
- ❌ 无文档索引触发

### 2.2 Feat/ask-ai-mvp 分支（双服务部署）

**流程图**：
```
push to main
  ↓
┌─────────────────────────────────────────┐
│ GitHub Actions (2 workflows)       │
├─────────────────────────────────────────┤
│                                   │
│  deploy.yml                       │  deploy-api.yml
│  (静态网站)                       │  (API 服务)
│                                   │
│  1. yarn install                  │  检测 api/ 变化
│  2. yarn build                   │  ↓
│  3. yarn ingest (触发索引)        │  1. cd api
│  4. rsync build/ → server        │  2. npm ci
│                                   │  3. npm run build
│  ✅ 静态文件部署完成            │  4. tar 打包
│                                   │  5. SSH 上传
└─────────────────────────────────────────┘  6. npm ci --production
                                      7. pm2 reload (zero-downtime)
                                      8. health check
                                      ✅ API 部署完成
```

**特点**：
- ✅ **双 workflow 独立触发**：API 代码变化才部署 API
- ✅ **零停机部署**：PM2 `reload` 而非 `restart`
- ✅ **健康检查**：自动验证 API 可用性
- ✅ **环境变量验证**：检测占位符配置，拒绝不安全部署
- ✅ **增量索引**：集成到 `yarn build`，MD5 哈希检测

---

## 三、服务器架构对比

### 3.1 Main 分支架构

```
┌──────────────────────────────────────┐
│         Production Server           │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Nginx                    │  │
│  │                           │  │
│  │  /  → 静态文件            │  │
│  │  (build/ 目录)             │  │
│  │                           │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────────┘

特点：
- 静态文件直接由 Nginx 提供服务
- 无需 Node.js 运行时
- 无 API 端点
```

### 3.2 Feat/ask-ai-mvp 分支架构

```
┌───────────────────────────────────────────┐
│         Production Server              │
│                                    │
│  ┌──────────────────────────────┐   │
│  │  Nginx (反向代理)          │   │
│  │                              │   │
│  │  /  → 静态文件              │   │
│  │  /api/  → localhost:3001     │   │
│  └──────────┬───────────────────┘   │
│             │                        │
│  ┌──────────▼────────────────┐     │
│  │  PM2                      │     │
│  │  (进程管理器)              │     │
│  │                            │     │
│  │  ┌──────────────────┐    │     │
│  │  │  Node.js API    │    │     │
│  │  │  (PORT: 3001)   │    │     │
│  │  │                 │    │     │
│  │  │  • /api/chat   │    │     │
│  │  │  • /api/feedback│   │     │
│  │  │  • SSE 支持     │    │     │
│  │  └──────────────────┘    │     │
│  └────────────────────────┘     │
│                                  │
└───────────────────────────────────┘

特点：
- 双服务：静态文件 + Node.js API
- Nginx 反向代理 API 请求
- PM2 管理 Node.js 进程（自动重启）
- SSE 长连接支持（proxy_buffering off）
```

---

## 四、关键配置详解

### 4.1 Nginx 配置变更

**新增功能** (`api/nginx.conf`):

```nginx
# API endpoint with SSE support
location /api/ {
    # ✅ SSE 支持 - 禁用缓冲
    proxy_buffering off;
    proxy_cache off;

    # ✅ 长连接超时（5 分钟）
    proxy_connect_timeout 60s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

    # ✅ 代理到本地 API
    proxy_pass http://api_backend/;
}
```

**安全头**：
- `Strict-Transport-Security` - 强制 HTTPS
- `X-Frame-Options: SAMEORIGIN` - 防止点击劫持
- `X-Content-Type-Options: nosniff` - 防止 MIME 嗅探
- `X-XSS-Protection: 1; mode=block` - XSS 防护

**缓存策略**：
- 静态资源（JS/CSS/图片）：1 年
- HTML 文件：1 小时
- API 响应：不缓存（实时数据）

### 4.2 PM2 配置亮点

**进程管理** (`api/pm2.config.js`):

```javascript
{
  name: 'wiki-api',
  script: './dist/index.js',

  // ✅ 零停机重载
  exec_mode: 'fork',
  autorestart: true,

  // ✅ 内存限制（1G，防止内存泄漏）
  max_memory_restart: '1G',

  // ✅ 优雅关闭（5 秒超时）
  kill_timeout: 5000,

  // ✅ 日志轮转（保留 7 天）
  rotate_log_higher: 7,
  log_rotate_interval: '0 0 * *',  // 每天午夜
}
```

**环境变量**：
- `NODE_ENV: production`
- `PORT: 3001`
- `TZ: Asia/Shanghai`（统一日志时区）

### 4.3 CI/CD 环境变量

**新增 Secrets**（需配置）：

| Secret | 用途 | 示例值 |
|--------|------|----------|
| `SERVER_HOST` | 服务器地址 | `wiki.camthink.ai` |
| `SERVER_USER` | SSH 用户 | `root` 或 `ubuntu` |
| `SSH_PRIVATE_KEY` | SSH 私钥 | `-----BEGIN RSA...` |
| `TARGET_PATH` | 静态文件路径 | `/var/www/wiki` |
| `API_DEPLOY_PATH` | API 部署路径 | `/var/www/wiki-api` |
| `API_HEALTH_URL` | 健康检查端点 | `https://wiki.camthink.ai/api/health` |

---

## 五、部署流程对比

### 5.1 静态网站部署（基本不变）

| 步骤 | Main 分支 | Feat/ask-ai-mvp |
|------|-----------|------------------|
| 1. 安装依赖 | `yarn install` | `yarn install` |
| 2. 构建网站 | `yarn build` | `yarn build` |
| 3. **索引文档** | ❌ 无此步骤 | ✅ `cd api && npx tsx src/scripts/ingest.ts` |
| 4. 部署文件 | `rsync build/` | `rsync build/` |
| 5. 清理旧文件 | `--delete` 标志 | `--delete` 标志 |

**差异**：新分支在构建后自动触发文档索引，确保向量库最新。

### 5.2 API 服务部署（全新）

| 步骤 | 命令 | 说明 |
|------|--------|------|
| 1. 构建 | `cd api && npm run build` | TypeScript → JavaScript |
| 2. 打包 | `tar -czf wiki-api-deploy.tar.gz` | 排除测试文件、日志 |
| 3. 上传 | `scp wiki-api-deploy.tar.gz` | SSH 传输到服务器 |
| 4. 解压 | `tar -xzf wiki-api-deploy.tar.gz` | 释放到部署目录 |
| 5. 安装依赖 | `npm ci --production` | 仅安装生产依赖 |
| 6. 重启服务 | `pm2 reload wiki-api` | **零停机**（老进程处理完请求后退出） |
| 7. 健康检查 | `curl /health` | 验证 API 可用 |
| 8. 保存状态 | `pm2 save` | PM2 重启后自动恢复 |

---

## 六、部署前置要求对比

### 6.1 Main 分支要求

- ✅ Node.js 18+ （本地构建用）
- ✅ Nginx 配置（静态文件托管）
- ✅ SSH 访问权限
- ✅ GitHub Secrets 配置

### 6.2 Feat/ask-ai-mvp 分支要求

**新增要求**：

| 组件 | 要求 | 验证命令 |
|------|-------|----------|
| **Node.js 18+** | 服务器运行时 | `node --version` |
| **PM2** | 进程管理器 | `pm2 --version` |
| **SQLite / Qdrant** | 向量数据库 | 验证连接 |
| **API Keys** | LLM 服务 | `DEEPSEEK_API_KEY`, `SILICONFLOW_API_KEY` |
| **端口开放** | 3001 端口（可选，内网通信） | `netstat -tlnp \| grep 3001` |
| **磁盘空间** | +500MB （依赖 + 日志） | `df -h` |

---

## 七、回滚策略对比

### 7.1 Main 分支回滚

```bash
# 简单：重新部署旧版本
git checkout <previous-commit>
yarn build
rsync -avz --delete build/ $SERVER:$TARGET_PATH
```

**特点**：
- ✅ 简单快速
- ✅ 无状态依赖
- ❌ 无法快速回滚（需重新构建）

### 7.2 Feat/ask-ai-mvp 分支回滚

**静态网站**（同 Main）：
```bash
git checkout <previous-commit>
yarn build
rsync -avz --delete build/ $SERVER:$TARGET_PATH
```

**API 服务**（零停机回滚）：
```bash
# 方案 A：PM2 版本切换（推荐）
pm2 rollback wiki-api  # PM2 会回退到上一个版本

# 方案 B：重新部署旧版本
git checkout <previous-commit>
cd api && npm run build
tar -czf ../wiki-api-deploy.tar.gz dist/ ... # 打包
scp ... # 上传
ssh server "cd $API_DEPLOY_PATH && pm2 reload pm2.config.js"
```

**特点**：
- ✅ PM2 支持版本快照
- ✅ `pm2 rollback` 秒级回滚
- ✅ 不影响用户请求（reload 模式）
- ⚠️ 需要提前 `pm2 save` 保存状态

---

## 八、监控与日志对比

### 8.1 Main 分支监控

- **Nginx 访问日志**：`/var/log/nginx/access.log`
- **Nginx 错误日志**：`/var/log/nginx/error.log`
- **无应用层监控**：仅能检测静态文件访问

### 8.2 Feat/ask-ai-mvp 分支监控

**新增监控**：

| 监控项 | 位置 | 说明 |
|---------|-------|------|
| **API 访问日志** | `api/logs/access.log` | PM2 自动轮转（7 天） |
| **API 错误日志** | `api/logs/error.log` | PM2 自动轮转 |
| **PM2 进程状态** | `pm2 status` | 实时监控 |
| **PM2 日志** | `pm2 logs wiki-api` | 实时流式查看 |
| **健康检查** | `/health` 端点 | CI/CD 自动验证 |

**日志查看命令**：
```bash
# 实时查看日志
pm2 logs wiki-api

# 查看最近 100 行
pm2 logs wiki-api --lines 100

# 查看错误日志
tail -f api/logs/error.log

# PM2 监控面板（可选）
pm2 plus monitor
```

---

## 九、成本与资源对比

### 9.1 服务器资源

**Main 分支**：
- 内存：~100MB（Nginx 进程）
- CPU：<1%（静态文件服务）
- 磁盘：~500MB（静态文件）

**Feat/ask-ai-mvp 分支**：
- 内存：~300MB（Nginx + Node.js + 向量库）
- CPU：1-5%（API 请求时峰值）
- 磁盘：~1GB（静态文件 + API 代码 + 日志 + SQLite）

### 9.2 LLM API 成本

**新增成本**（按 PRD 预估）：

| 项目 | 月费用 | 说明 |
|------|--------|------|
| Embedding (SiliconFlow) | ¥0 | 免费额度充足 |
| LLM 生成 (DeepSeek-V3) | ~$24 | 快速路径（80% 查询） |
| Agent 推理 (DeepSeek-R1) | ~$18 | 升级路径（20% 查询） |
| **合计** | **~$42/月** | 约 ¥300 |

---

## 十、部署检查清单

### 10.1 首次部署（从 Main 迁移）

**前置检查**：

- [ ] 服务器配置确认
  - [ ] Node.js 18+ 已安装
  - [ ] PM2 已全局安装 (`npm install -g pm2`)
  - [ ] 端口 3001 未被占用
  - [ ] 磁盘空间 > 2GB

- [ ] 环境变量配置
  - [ ] `DEEPSEEK_API_KEY` 已获取
  - [ ] `SILICONFLOW_API_KEY` 已获取（或使用其他 Embedding provider）
  - [ ] `QDRANT_URL` 或 `VECTOR_DB_PATH` 已配置
  - [ ] GitHub Secrets 已配置（6 个变量）

- [ ] Nginx 配置更新
  - [ ] `api/nginx.conf` 已复制到服务器 `/etc/nginx/sites-available/wiki.conf`
  - [ ] 软链接已创建：`ln -s /etc/nginx/sites-available/wiki.conf /etc/nginx/sites-enabled/`
  - [ ] 配置测试通过：`nginx -t`
  - [ ] Nginx 已重载：`systemctl reload nginx`

**部署步骤**：

1. **静态网站部署**（同 Main）：
   ```bash
   yarn build
   USE_SSH=true yarn deploy
   ```

2. **API 服务首次部署**：
   ```bash
   # 手动部署（首次推荐）
   cd api
   npm ci --production
   npm run build
   scp -r ./* server:$API_DEPLOY_PATH/
   ssh server "cd $API_DEPLOY_PATH && pm2 start pm2.config.js"
   ```

3. **文档索引**：
   ```bash
   cd api
   npx tsx src/scripts/ingest.ts --force
   ```

4. **验证部署**：
   ```bash
   # 检查静态网站
   curl https://wiki.camthink.ai/

   # 检查 API 健康状态
   curl https://wiki.camthink.ai/api/health

   # 检查 PM2 状态
   ssh server "pm2 status wiki-api"

   # 测试 API 端点
   curl -X POST https://wiki.camthink.ai/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "test"}'
   ```

### 10.2 日常部署（已迁移后）

**自动触发**：
- 静态文件：`git push main`
- API 服务：`git push main` （当 `api/` 变化时）

**手动触发**：
```bash
# GitHub Actions 页面
1. 访问：https://github.com/camthink-ai/wiki-documents/actions
2. 选择 "Deploy wiki" 或 "Deploy API" workflow
3. 点击 "Run workflow" 按钮
4. 选择分支（main）
```

---

## 十一、故障排查指南

### 11.1 API 服务无法启动

**症状**：`pm2 status` 显示 `errored` 或 `stopped`

**排查步骤**：
```bash
# 1. 查看错误日志
pm2 logs wiki-api --err --lines 50

# 2. 检查环境变量
cat api/.env.production | grep -E "DEEPSEEK|SILICONFLOW|QDRANT"

# 3. 手动运行测试
cd api
npm run build
node dist/index.js

# 4. 检查端口占用
netstat -tlnp | grep 3001
# 或
lsof -i :3001

# 常见问题
# - Error: Cannot find module '@types/...'  → npm ci 失败，重新安装
# - Error: EADDRINUSE  → 端口被占用，kill 占用进程
# - Error: Invalid API key  → 环境变量配置错误
```

### 11.2 SSE 连接中断

**症状**：前端显示"连接断开"，无流式输出

**排查步骤**：
```bash
# 1. 检查 Nginx 配置
cat /etc/nginx/sites-available/wiki.conf | grep -A5 "location /api/"

# 确保：
# proxy_buffering off;
# proxy_cache off;
# proxy_read_timeout 300s;

# 2. 测试 SSE 端点
curl -N https://wiki.camthink.ai/api/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'

# 3. 检查 PM2 日志
pm2 logs wiki-api --lines 100

# 常见问题
# - SSE 超时  → 增加 proxy_read_timeout
# - 缓存干扰  → 确认 proxy_buffering off
# - CORS 错误  → 检查 Access-Control-Allow-Origin
```

### 11.3 部署失败

**症状**：GitHub Actions 显示红色 ❌

**排查步骤**：
```bash
# 1. 查看 Actions 日志
# GitHub → Actions → 选择失败 run → 展开步骤

# 2. 检查健康检查阶段
# 最后一步会显示 curl 命令和返回值

# 3. 手动验证健康检查
curl -o /dev/null -w "%{http_code}" \
  https://wiki.camthink.ai/api/health

# 4. 服务器直接检查
ssh server "pm2 status wiki-api"

# 常见问题
# - 环境变量未配置  → 检查 GitHub Secrets
# - SSH 连接失败  → 验证 SSH_PRIVATE_KEY
# - 健康检查超时  → API 启动慢或失败，查看 PM2 日志
```

---

## 十二、总结与建议

### 12.1 关键差异总结

| 维度 | Main 分支 | Feat/ask-ai-mvp |
|------|-----------|------------------|
| **部署内容** | 静态网站 | 静态网站 + API 服务 |
| **CI/CD** | 1 个 workflow | 2 个独立 workflow |
| **服务器组件** | Nginx | Nginx + PM2 + Node.js |
| **进程管理** | 无需 | PM2（自动重启、日志轮转） |
| **监控** | Nginx 日志 | PM2 日志 + 健康检查 |
| **回滚** | 重新部署 | PM2 rollback（秒级） |
| **文档索引** | 手动触发 | 自动触发（构建时） |
| **成本** | ¥0 | ~$42/月（LLM API） |

### 12.2 迁移建议

**Phase 1：准备阶段（1 天）**
1. 在测试环境验证完整部署流程
2. 配置所有 GitHub Secrets
3. 准备 API Keys

**Phase 2：生产部署（半天）**
1. 更新 Nginx 配置（添加 API 反向代理）
2. 安装 PM2：`npm install -g pm2`
3. 首次部署 API 服务（使用 `deploy-api.yml`）
4. 验证静态网站 + API 均正常

**Phase 3：监控优化（持续）**
1. 配置日志收集（如 ELK、Loki）
2. 设置告警规则（API 错误率、LLM 成本）
3. 根据真实流量调整资源配额

### 12.3 风险提示

| 风险 | 影响 | 缓解措施 |
|------|-------|----------|
| **LLM API 成本超预算** | 月费用 > $50 | 设置每日告警（¥50/天） |
| **API 服务内存泄漏** | 服务器内存耗尽 | PM2 max_memory_restart: 1G |
| **向量库损坏** | 检索失败 | 定期备份 SQLite/Qdrant |
| **Nginx 配置错误** | API 无法访问 | 配置测试：`nginx -t` |
| **GitHub Secrets 泄露** | 安全漏洞 | 定期轮换 API Keys |

---

## 附录：快速参考命令

```bash
# === 部署相关 ===
# 部署静态网站
USE_SSH=true yarn deploy

# 部署 API 服务（手动）
cd api && npm run build && \
tar -czf ../wiki-api-deploy.tar.gz dist/ && \
scp ../wiki-api-deploy.tar.gz $SERVER:$API_DEPLOY_PATH/

# === 文档索引 ===
# 增量索引（仅处理变更文件）
yarn ingest

# 强制全量重建
yarn ingest:force

# === PM2 管理 ===
# 查看状态
pm2 status

# 查看日志
pm2 logs wiki-api

# 重启服务（零停机）
pm2 reload wiki-api

# 停止服务
pm2 stop wiki-api

# 回滚到上一版本
pm2 rollback wiki-api

# === Nginx 管理 ===
# 测试配置
nginx -t

# 重载配置（不中断连接）
systemctl reload nginx

# 重启 Nginx
systemctl restart nginx

# === 健康检查 ===
# 静态网站
curl -I https://wiki.camthink.ai/

# API 服务
curl https://wiki.camthink.ai/api/health

# 完整 API 测试
curl -X POST https://wiki.camthink.ai/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "NE301 支持哪些 AI 模型？"}'
```

---

**报告生成时间**: 2026-02-12
**下次更新**: 生产部署后

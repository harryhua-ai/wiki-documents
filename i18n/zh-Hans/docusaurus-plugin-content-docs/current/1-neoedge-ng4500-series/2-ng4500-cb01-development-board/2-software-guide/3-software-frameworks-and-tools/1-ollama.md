

# Ollama

---

本指南讲解如何在 NVIDIA **Jetson Orin** 设备上安装、更新、配置和卸载 **Ollama**。Ollama 支持在本地运行大语言模型（LLMs）推理，具备 CUDA 加速能力，并针对 Jetson 硬件进行了优化。

---

## 1. 概览

- 快速的本地推理
- CUDA 加速支持
- 模型版本管理
- 简洁的命令行工具与可选 WebUI

本文件涵盖：

- 使用脚本或 Docker 安装
- 模型运行
- 版本更新
- 可选的远程访问配置
- 完整卸载方法

![overview](/img/NG45XX_ollama_overview.png)

---

## 2. 系统要求

### 硬件要求

| 组件  | 最低要求                        |
| --- | --------------------------- |
| 设备  | Jetson Orin Nano / NX / AGX |
| 内存  | 运行小/中型模型需 ≥ 8GB             |
| 存储  | 模型与缓存存储需 ≥ 10GB             |

### 软件要求

- Ubuntu 20.04 或 22.04（基于 JetPack）
- JetPack 5.1.1+（预装 CUDA、cuDNN、TensorRT）
- Python 3.8+（可选）
- Docker（可选，用于容器化模式）

---

## 3. 安装 Ollama

### 方法 A：脚本安装（推荐）

运行官方安装脚本：

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

- 会安装 CLI 二进制文件及后台服务
- 在 Jetson 上默认启用 CUDA 支持

### 方法 B：基于 Docker 的安装（可选）

```bash
sudo docker run --runtime nvidia --rm --network=host \
  -v ~/ollama:/ollama \
  -e OLLAMA_MODELS=/ollama \
  dustynv/ollama:r36.4.0
```

> 🧩 由 Jetson 社区维护者（dustynv）发布，专为 JetPack 环境优化

---

## 4. 基本用法

### 常用命令

```bash
ollama serve         # 启动 Ollama 后台服务
ollama run           # 运行模型
ollama pull          # 从仓库拉取模型
ollama list          # 列出已安装模型
ollama show          # 显示模型信息
ollama rm            # 删除模型
ollama help          # 查看命令帮助
```

### 检查版本

```bash
ollama -v
# 示例：ollama version 0.5.7
```

### 启动服务（若未自动启动）

```bash
ollama serve &
```

---

## 5. 可选：启用远程访问

若需允许外部设备访问 Ollama 服务：

1. 编辑 systemd 服务文件：
   
   ```bash
   sudo nano /etc/systemd/system/ollama.service
   ```

2. 在 `[Service]` 段添加以下内容：
   
   ```ini
   Environment="OLLAMA_HOST=0.0.0.0"
   Environment="OLLAMA_ORIGINS=*"
   ```

3. 重新加载并重启服务：
   
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart ollama
   ```

---

## 6. 运行模型

使用 `ollama run` 命令启动模型推理：

```bash
ollama run deepseek-r1:7b
```

- 更多模型可访问：[https://ollama.com/search](https://ollama.com/search)
- 首次运行会下载模型，后续运行使用本地缓存

---

## 7. 更新 Ollama

更新到最新版：

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 可选：安装指定版本

通过指定版本号安装：

```bash
curl -fsSL https://ollama.com/install.sh | OLLAMA_VERSION=0.1.32 sh
```

---

## 8. 卸载 Ollama

### 移除服务

```bash
sudo systemctl stop ollama
sudo systemctl disable ollama
sudo rm /etc/systemd/system/ollama.service
```

### 删除执行文件

```bash
sudo rm $(which ollama)
```

（Ollama 通常安装在 `/usr/local/bin`、`/usr/bin` 或 `/bin`）

### 删除模型文件与用户账户

```bash
sudo rm -r /usr/share/ollama
sudo userdel ollama
sudo groupdel ollama
```

---

## 9. 故障排查

| 问题          | 解决方案                             |
| ----------- | -------------------------------- |
| 11434 端口无响应 | 重启 `ollama serve` 或重载 systemd 服务 |
| 安装失败        | 确保已安装 curl 且联网；可尝试加 `sudo` 重试    |
| 无法卸载 ollama | 使用 `which ollama` 查找实际路径后删除      |
| 内存不足（OOM）   | 尝试使用较小模型（如 `1.5b`, `7b`），或添加交换空间 |

---

## 10. 附录

### 路径参考

| 用途           | 路径                                   |
| ------------ | ------------------------------------ |
| Ollama 可执行文件 | `/usr/local/bin/ollama`              |
| 模型缓存         | `~/ollama/` 或 `/usr/share/ollama`    |
| 服务配置         | `/etc/systemd/system/ollama.service` |

### 参考资料

- [Ollama 官方网站](https://ollama.com/)
- [GitHub 仓库](https://github.com/ollama/ollama)
- [Jetson 社区论坛](https://forums.developer.nvidia.com/)

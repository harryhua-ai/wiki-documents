# JupyterLab  
---

**JupyterLab** 是一个基于 Web 的下一代交互式开发环境，支持 Python、数据可视化与 AI 应用开发，非常适合 Jetson 平台使用。

![overview](/img/jupyter_overview.png)

---

## 1. 概览

- 可交互执行 Python / C++ / CUDA 等代码  
- 支持 Markdown 文本与可视化图表  
- 多标签页界面，支持终端、文本编辑、图形并行操作  
- 兼容 ARM64 架构，适用于 Jetson 平台  
- 可通过浏览器远程访问  

本指南内容包括：

- 基于 pip 的安装方法  
- 配置文件及远程访问设置  
- 自启动服务设置  
- 卸载与故障排查  

---

## 2. 系统要求

### 硬件要求

| 组件 | 最低要求 |
|------|----------|
| 设备 | Jetson Orin Nano / NX / AGX |
| 内存 | ≥ 4GB（推荐 8GB） |
| 存储空间 | ≥ 1GB 可用空间 |

### 软件要求

- JetPack 5.x（基于 Ubuntu 20.04 或 22.04）  
- Python 3.8 或更高版本  
- pip / venv 工具  
- 可选：conda / virtualenv  

---

## 3. 安装 JupyterLab

### 方法 A：使用 pip 安装（推荐）

```bash
sudo apt update

# 安装 jupyterlab
pip install --upgrade pip
pip install jupyterlab

# 验证安装
jupyter-lab --version  # 应输出版本号
```

✅ pip 安装方式最灵活，兼容 Jetson 系统。

---

## 4. 启动与访问

### 启动 JupyterLab

```bash
jupyter-lab --ip=0.0.0.0 --port=8888 --no-browser
```

默认会输出带 token 的访问链接。

### 通过浏览器访问：

```
http://<Jetson-IP>:8888/lab
```

![jupyter_lab](/img/jupyter_lab.png)

---

## 5. 创建配置文件（可选）

自动化配置：

```bash
jupyter lab --generate-config
```

编辑配置文件：

```bash
nano ~/.jupyter/jupyter_lab_config.py
```

推荐配置项：

```python
c.ServerApp.ip = '0.0.0.0'          # 允许远程访问
c.ServerApp.port = 8888             # 端口设置
c.ServerApp.open_browser = False    # 不自动打开浏览器
c.ServerApp.root_dir = '/home/your_username/notebooks'  # 可自定义路径
```

---

## 6. 设置自启动服务（可选）

创建 systemd 服务文件：

```bash
sudo nano /etc/systemd/system/jupyter.service
```

内容如下：

```ini
[Unit]
Description=JupyterLab

[Service]
Type=simple
User=your_username
ExecStart=/home/your_username/.local/bin/jupyter-lab --config=/home/your_username/.jupyter/jupyter_lab_config.py
WorkingDirectory=/home/your_username
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl daemon-reexec
sudo systemctl enable jupyter
sudo systemctl start jupyter
```

---

## 7. 常用命令

| 操作       | 命令 |
|------------|------|
| 启动服务   | `sudo systemctl start jupyter` |
| 停止服务   | `sudo systemctl stop jupyter` |
| 查看状态   | `systemctl status jupyter` |
| 查看日志   | `journalctl -u jupyter -f` |

---

## 8. 故障排查

| 问题                 | 解决方案 |
|----------------------|----------|
| 无法访问页面         | 检查 Jetson 是否开放 8888 端口 |
| Token 丢失或未知     | 使用 `jupyter lab list` 查看 |
| 无法保存文件         | 检查 notebooks 目录是否具有写权限 |
| 页面加载异常         | 清除浏览器缓存或重启服务 |

---

## 9. 附录

### 默认文件路径

| 用途        | 路径 |
|-------------|------|
| 笔记本默认目录 | `/home/jetson/notebooks` |
| 配置文件     | `~/.jupyter/jupyter_lab_config.py` |
| Web UI 地址 | `http://<Jetson-IP>:8888/lab` |

### 推荐资源

- [JupyterLab 官方文档](https://jupyterlab.readthedocs.io/)
- [Jetson 开发者论坛](https://forums.developer.nvidia.com/)
- [Jupyter GitHub 仓库](https://github.com/jupyterlab/jupyterlab)

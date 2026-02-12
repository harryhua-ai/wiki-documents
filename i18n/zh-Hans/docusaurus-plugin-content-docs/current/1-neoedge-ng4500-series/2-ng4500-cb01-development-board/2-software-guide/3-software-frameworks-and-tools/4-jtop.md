# jtop
---
## 1. 概览

**jtop** 是由 Raffaello Bonghi 开发的 Jetson 专用命令行监控工具，基于 Python 编写，提供类似 `htop` 的交互式界面，实时显示 Jetson 系统的 CPU、GPU、内存、风扇、功耗等状态信息。

主要功能包括：

- 实时监控 CPU、GPU、内存、风扇、功耗等系统资源
- 控制 NVPModel、电源模式、风扇速度、`jetson_clocks` 等
- 支持 Python API 接入，便于集成到自定义应用中
- 支持 Docker 环境运行
- 无需超级用户权限即可运行

---

## 2. 系统要求

| 组件             | 要求                                 |
|------------------|--------------------------------------|
| Jetson 硬件      | Orin Nano / NX / AGX                 |
| 操作系统         | Ubuntu 20.04 或 22.04（基于 JetPack） |
| JetPack 版本     | 建议 JetPack ≥ 5.1.1                  |
| Python 版本      | Python 3.x                            |
| pip              | 已安装                                |
| 网络连接         | 用于安装 jetson-stats                  |

---

## 3. 安装 jtop

### A. 安装前准备

确保系统已更新，并安装了 pip：

```bash
sudo apt update
sudo apt install python3-pip -y
```

### B. 安装 jetson-stats（包含 jtop）

使用 pip 安装 jetson-stats：

```bash
sudo pip3 install -U jetson-stats
```

安装完成后，建议重启系统或重新登录以使配置生效：

```bash
sudo reboot
```

---

## 4. 运行 jtop

在终端中输入以下命令启动 jtop：

```bash
jtop
```

![jtop](/img/jtop.gif)

jtop 提供多个页面，使用方向键或 Tab 键切换：

- **ALL**：显示所有系统信息
- **GPU**：GPU 使用情况
- **CPU**：CPU 使用情况
- **MEM**：内存和交换空间
- **ENG**：各引擎状态
- **CTRL**：控制 jetson_clocks、nvpmodel、风扇等
- **INFO**：系统和库信息

---

## 5. 高级用法

### A. 检查 jtop 状态

如果遇到问题，可使用以下命令检查并修复 jtop 状态：

```bash
sudo jtop --health
```

### B. 恢复默认配置

重置 Jetson 配置（包括 jetson_clocks、风扇、nvpmodel 等）：

```bash
jtop --restore
```

### C. 更改颜色主题

更改 jtop 的颜色主题：

```bash
jtop --color-filter
```

或在 `.bashrc` 中添加：

```bash
export JTOP_COLOR_FILTER=True
```

---

## 6. Python API 使用示例

jtop 提供 Python API，便于在自定义应用中集成：

```python
from jtop import jtop

with jtop() as jetson:
    if jetson.ok():
        print(jetson.stats)
```

---

## 7. Docker 中使用 jtop

在 Docker 容器中运行 jtop：

1. 在主机和容器中都安装 jetson-stats。
2. 运行容器时挂载 `/run/jtop.sock`：

```bash
docker run --rm -it -v /run/jtop.sock:/run/jtop.sock rbonghi/jetson_stats:latest
```

---

## 8. 故障排查

| 问题                 | 解决方法                                         |
|----------------------|--------------------------------------------------|
| jtop 无法启动         | 确保已安装 jetson-stats，并重启系统               |
| 权限错误             | 使用 `sudo` 运行 jtop，或检查用户权限             |
| 无法获取 GPU 信息     | 确认已安装 NVIDIA 驱动，并正确配置环境             |
| Docker 中无法运行 jtop | 确保正确挂载 `/run/jtop.sock`，并在容器中安装 jetson-stats |

---

## 9. 参考链接

- 官方文档：[https://rnext.it/jetson_stats](https://rnext.it/jetson_stats)
- GitHub 仓库：[https://github.com/rbonghi/jetson_stats](https://github.com/rbonghi/jetson_stats)
- NVIDIA 开发者论坛：[https://forums.developer.nvidia.com](https://forums.developer.nvidia.com)

---
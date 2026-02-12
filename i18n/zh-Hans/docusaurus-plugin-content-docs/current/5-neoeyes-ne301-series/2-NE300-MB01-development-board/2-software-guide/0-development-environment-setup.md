---
title: Development Environment Setup
---

## 快速开始
### 克隆 NE301 仓库

```bash
git clone https://github.com/camthink-ai/ne301.git
cd ne301
```
### 开发环境设置

#### 方法 1：Docker（推荐）

**前置要求：** Docker 20.10+  磁盘空间 > 10GB+

```bash
# 1. 构建（或拉取）Docker 镜像
docker build -t ne301-dev:latest .

# 或拉取（更快）
docker pull camthink/ne301-dev:latest

# 2. 运行容器
docker run -it --rm --privileged \
  -v $(pwd):/workspace \
  -v /dev/bus/usb:/dev/bus/usb \
  camthink/ne301-dev:latest
  
# 3. 在容器内
make                        # 构建所有
```

#### 方法 2：手动安装

**前置要求：**
- ARM GCC 13.3+
- GNU Make 3.81+ 
- Python 3.8+
- Node.js 20+
- pnpm 9+
- STM32CubeProgrammer(v2.19.0)
- STM32_SigningTool_CLI(v2.19.0)
- stedgeai(v2.2,stedgeai0202.stneuralart)

```bash
# 1. 检查环境
./check_env.sh

# 2. 按提示安装
./setup.sh                  # Linux/macOS
setup.bat                   # Windows

# 3. 验证
./check_env.sh
# 成功输出：
  =========================================
  NE301 Required Tools Check
  =========================================

  Essential Tools:
  ----------------
  [OK] ARM GCC Compiler
  arm-none-eabi-gcc.exe (GNU Tools for STM32 13.3.rel1.20240926-1715) 13.3.1 20240614
  [OK] ARM Objcopy
  GNU objcopy (GNU Tools for STM32 13.3.rel1.20240926-1715) 2.42.0.20240614
  [OK] GNU Make
  GNU Make 4.2.1

  Build Tools:
  ------------
  [OK] Python 3
  Python 3.11.3
  [OK] Node.js
  v22.17.0
  [OK] pnpm
  10.16.1

  STM32 Tools:
  ------------
  [OK] STM32 Programmer
  -------------
  [OK] STM32 Signing Tool
        -------------------------------------------------------------------

  AI Model Tools:
  ---------------
  [OK] ST Edge AI
  ST Edge AI Core v2.2.0-20266 2adc00962
  [OK] STEDGEAI_CORE_DIR = H:\stm32\STEdgeAI\2.2

  =========================================
  Result: Essential tools complete! ✓

  You can now run:
    make              # Build firmware
    make web          # Build web
    make model        # Build AI model
    make flash        # Flash to device
  =========================================
```
如果所有工具都显示 **[OK]**，你就可以开始为 NE301 构建了 🎉

---
title: Development Environment Setup
---

## Development Environment

### 1. 检查环境

```bash
./check_env.sh        # 检查缺少哪些工具
```

### 2. 自动安装（推荐）

**Linux/macOS/Git Bash：**

```bash
./setup.sh
```

**Windows：**

```cmd
setup.bat
```

## 手动安装

### 1. ARM GCC 工具链

#### Windows

**方式 1：使用 STM32CubeCLT（推荐）**

1. 下载：[https://www.st.com/stm32cubeclt](https://www.st.com/stm32cubeclt)
2. 运行安装程序
3. 默认路径：`C:\ST\STM32CubeCLT\GNU-tools-for-STM32\bin`

**方式 2：ARM 官方工具链**

1. 下载：[https://developer.arm.com/downloads/-/arm-gnu-toolchain-downloads](https://developer.arm.com/downloads/-/arm-gnu-toolchain-downloads)
2. 选择：`arm-gnu-toolchain-*-mingw-w64-i686-arm-none-eabi.exe`
3. 安装并记录路径

#### Linux（Ubuntu/Debian）

```bash
# 方法1：包管理器（简单）
sudo apt update
sudo apt install gcc-arm-none-eabi make

# 方法2：最新版本
wget https://developer.arm.com/-/media/Files/downloads/gnu/13.3.rel1/binrel/arm-gnu-toolchain-13.3.rel1-x86_64-arm-none-eabi.tar.xz
tar xf arm-gnu-toolchain-13.3.rel1-x86_64-arm-none-eabi.tar.xz
sudo mv arm-gnu-toolchain-13.3.rel1-x86_64-arm-none-eabi /opt/
sudo ln -s /opt/arm-gnu-toolchain-13.3.rel1-x86_64-arm-none-eabi/bin/* /usr/local/bin/
```

#### macOS

```bash
# 使用 Homebrew
brew install --cask gcc-arm-embedded
```

---

### 2. 其他依赖项

#### Make

**Windows：**

* 安装 Git for Windows（包含 make）：[https://git-scm.com/](https://git-scm.com/)

**Linux：**

```bash
sudo apt install build-essential
```

**macOS：**

```bash
xcode-select --install
```

---

#### Python 3（用于模型打包）

**所有平台：**

* 下载：[https://www.python.org/](https://www.python.org/)
* 或使用系统包管理器安装

---

#### Node.js & pnpm（用于 Web 构建）

**所有平台：**

```bash
# 安装 Node.js
# 下载：https://nodejs.org/ （选择 LTS 版本）

# 安装 pnpm
npm install -g pnpm
```

---

#### STM32_Programmer_CLI（用于烧录）

**所有平台：**

1. 下载 **STM32CubeProgrammer**

   * 官方：[https://www.st.com/stm32cubeprog](https://www.st.com/stm32cubeprog)
   * 版本：2.19.0 或更新

2. 默认安装位置：

   * **Windows：** `C:\Program Files\STMicroelectronics\STM32Cube\STM32CubeProgrammer\bin`
   * **Linux：** `/usr/local/STMicroelectronics/STM32Cube/STM32CubeProgrammer/bin`
   * **macOS：** `/Applications/STMicroelectronics/STM32Cube/STM32CubeProgrammer/STM32CubeProgrammer.app/Contents/MacOs/bin`

3. 添加到 PATH：

**Windows（PowerShell）：**

```powershell
$env:PATH += ";C:\Program Files\STMicroelectronics\STM32Cube\STM32CubeProgrammer\bin"

# 或永久设置
[System.Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\STMicroelectronics\STM32Cube\STM32CubeProgrammer\bin", [System.EnvironmentVariableTarget]::User)
```

**Linux/macOS：**

```bash
# 添加到 ~/.bashrc 或 ~/.zshrc
export PATH="/usr/local/STMicroelectronics/STM32Cube/STM32CubeProgrammer/bin:$PATH"
```

4. 验证安装：

```bash
STM32_Programmer_CLI --version
```

---

#### STM32_SigningTool_CLI（用于固件签名）

**所有平台：**

1. 通常包含在 **STM32CubeCLT** 或 **STM32CubeProgrammer** 中

2. 默认路径：

   * **Windows：** `C:\ST\STM32CubeCLT\STM32_SigningTool_CLI\bin`
   * **Linux：** `/opt/st/stm32cubeclt_*/STM32_SigningTool_CLI/bin`

3. 添加到 PATH（与 Programmer 类似）

4. 验证：

```bash
STM32_SigningTool_CLI --version
```

---

#### stedgeai（用于 AI 模型生成）

**所有平台：**

1. 下载 **ST Edge AI Core**

   * [https://www.st.com/en/development-tools/stedgeai-core.html](https://www.st.com/en/development-tools/stedgeai-core.html)
   * 或通过 **STM32Cube.AI** [https://www.st.com/stm32cubeai](https://www.st.com/stm32cubeai)

2. 默认路径：

   * **Windows：**

     ```
     C:\Users\<username>\STM32Cube\Repository\Packs\STMicroelectronics\X-CUBE-AI\<version>\Utilities\windows
     ```
   * **Linux：**

     ```
     ~/STM32Cube/Repository/Packs/STMicroelectronics/X-CUBE-AI/<version>/Utilities/linux
     ```
   * **macOS：**

     ```
     ~/STM32Cube/Repository/Packs/STMicroelectronics/X-CUBE-AI/<version>/Utilities/mac
     ```

3. 添加到 PATH：

   * Windows：在系统变量中设置
   * Linux/macOS：

     ```bash
     export PATH="$HOME/STM32Cube/Repository/Packs/STMicroelectronics/X-CUBE-AI/<version>/Utilities/linux:$PATH"
     export STEDGEAI_CORE_DIR="$HOME/STM32Cube/Repository/Packs/STMicroelectronics/X-CUBE-AI/<version>"
     ```

4. 配置环境变量：

   ```bash
   # Windows PowerShell
   $env:STEDGEAI_CORE_DIR = "C:\Users\<username>\STM32Cube\Repository\Packs\STMicroelectronics\X-CUBE-AI\<version>"

   # Linux/macOS
   export STEDGEAI_CORE_DIR="$HOME/STM32Cube/Repository/Packs/STMicroelectronics/X-CUBE-AI/<version>"
   ```

5. 验证：

```bash
stedgeai --version
echo $STEDGEAI_CORE_DIR
```

**注意：**

* `stedgeai` 是 **可选的**，仅用于重新生成 AI 模型
* 如果只构建固件或 Web，不需要此工具
* 项目已提供预编译模型文件（在 `bin/`）

---

### 3. 验证安装

**推荐使用检查脚本：**

```bash
./check_env.sh
```

**手动检查：**

```bash
# 基础工具
arm-none-eabi-gcc --version
arm-none-eabi-objcopy --version
make --version
python --version
node --version
pnpm --version

# 可选工具（烧录/签名）
STM32_Programmer_CLI --version
STM32_SigningTool_CLI --version

# 可选工具（AI 模型）
stedgeai --version
echo $STEDGEAI_CORE_DIR

# 项目命令
make info
```

**预期输出示例：**

```
arm-none-eabi-gcc (GNU Tools for STM32) 13.3.1
GNU Make 4.x
Python 3.x.x
v20.x.x (Node.js)
9.x.x (pnpm)
STM32_Programmer_CLI v2.19.0     # 可选
STM32_SigningTool_CLI v2.19.0    # 可选
stedgeai v2.2.0-20266 2adc00962  # 可选
```

---

## 配置方式

### 方法 1：环境变量

**Windows（PowerShell）：**

```powershell
$env:PATH += ";C:/ST/STM32CubeCLT/GNU-tools-for-STM32/bin"
```

**Linux/macOS：**

```bash
export PATH="/opt/arm-gnu-toolchain/bin:$PATH"
```

---

### 方法 2：.make.env 文件（推荐）

在项目根目录创建 `.make.env`：

```makefile
# NE301 Makefile 配置

# ARM GCC 工具链路径
GCC_PATH = C:/ST/STM32CubeCLT/GNU-tools-for-STM32/bin

# 并行构建任务数
MAKEFLAGS += -j20

# 编译优化等级
OPT = -Os -g3

# Flash 地址
FLASH_ADDR_FSBL = 0x34000000
FLASH_ADDR_APP = 0x70100000
FLASH_ADDR_WEB = 0x90400000
FLASH_ADDR_MODEL = 0x90700000

# ST Edge AI Core（用于模型生成）
export STEDGEAI_CORE_DIR=/path/to/STEdgeAI
```

> setup 脚本会自动生成此文件。

---

### 方法 3：Makefile 命令行指定

```bash
make GCC_PATH=/path/to/toolchain/bin
make -j20
```

---

## 故障排查

### 问题 1：arm-none-eabi-gcc 找不到

解决方案：

```bash
which arm-none-eabi-gcc
# 安装 STM32CubeCLT 或官方 ARM GCC
# 添加到 PATH 或设置 GCC_PATH
```

---

### 问题 2：Windows 找不到 make

解决方案：

安装 **Git for Windows**：

* [https://git-scm.com/](https://git-scm.com/)

或单独安装：

```bash
# Chocolatey
choco install make

# Scoop
scoop install make
```

---

### 问题 3：STM32_Programmer_CLI 找不到

解决方案：

```bash
# 1. 去 https://www.st.com/stm32cubeprog 下载
# 2. 添加路径：
#    Windows：C:\Program Files\STMicroelectronics\STM32Cube\STM32CubeProgrammer\bin
#    Linux：/usr/local/STMicroelectronics/STM32Cube/STM32CubeProgrammer/bin
STM32_Programmer_CLI --version
```

---

### 问题 4：STM32_SigningTool_CLI 找不到

解决方案：

```bash
# 一般包含在 STM32CubeCLT 中
# Windows：C:\ST\STM32CubeCLT\STM32_SigningTool_CLI\bin
# Linux：/opt/st/stm32cubeclt*/STM32_SigningTool_CLI/bin
set PATH=%PATH%;C:\ST\STM32CubeCLT\STM32_SigningTool_CLI\bin
```

---

### 问题 5：Windows USB 驱动问题

解决方案：

* 安装 ST-Link 驱动
  [https://www.st.com/stsw-link009.html](https://www.st.com/stsw-link009.html)
* 或通过 STM32CubeProgrammer 自动安装

---

### 问题 6：stedgeai 找不到

解决方案：

```bash
# 1. 下载 ST Edge AI Core
# 2. 设置 STEDGEAI_CORE_DIR
# 3. 添加到 PATH
stedgeai --version
```

---

### 问题 7：STEDGEAI_CORE_DIR 未设置

解决方案：

```bash
# Windows
[System.Environment]::SetEnvironmentVariable("STEDGEAI_CORE_DIR", "C:\path\to\X-CUBE-AI\version", [System.EnvironmentVariableTarget]::User)

# Linux/macOS
export STEDGEAI_CORE_DIR="$HOME/STM32Cube/Repository/Packs/STMicroelectronics/X-CUBE-AI/<version>"
```

---

## 推荐开发环境

* **IDE：** VS Code / STM32CubeIDE / 任意文本编辑器
* **终端：**

  * Windows：PowerShell、Git Bash、Windows Terminal
  * Linux/macOS：系统默认终端
* **调试器：** STM32CubeIDE + ST-Link

---

## 快速测试

完成安装后，验证构建系统：

```bash
# 检查环境
./check_env.sh

# 显示构建设定
make info

# 测试构建（不执行）
make -n

# 完整构建
make

# 单独构建特定目标
make app
make web
make model
```

**如果所有工具都显示 [OK] —— 恭喜，你的 NE301 开发环境已准备完毕！🎉**

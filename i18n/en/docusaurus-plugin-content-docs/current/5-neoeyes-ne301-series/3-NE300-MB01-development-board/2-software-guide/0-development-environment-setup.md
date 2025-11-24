---
title: Development Environment Setup
---

## Quick Start

### 1. Check Your Environment

```bash
./check_env.sh        # Print which tools are missing
```

### 2. Automated Setup (Recommended)

**Linux / macOS / Git Bash**

```bash
./setup.sh
```

**Windows**

```cmd
setup.bat
```

## Manual Setup

### 1. ARM GCC Toolchain

#### Windows

**Option 1: STM32CubeCLT (recommended)**

1. Download: [https://www.st.com/stm32cubeclt](https://www.st.com/stm32cubeclt)
2. Run the installer
3. Default path: `C:\ST\STM32CubeCLT\GNU-tools-for-STM32\bin`

**Option 2: Official Arm GNU Toolchain**

1. Download: [https://developer.arm.com/downloads/-/arm-gnu-toolchain-downloads](https://developer.arm.com/downloads/-/arm-gnu-toolchain-downloads)
2. Pick `arm-gnu-toolchain-*-mingw-w64-i686-arm-none-eabi.exe`
3. Install and note the path

#### Linux (Ubuntu/Debian)

```bash
# Option 1: Packages (easy)
sudo apt update
sudo apt install gcc-arm-none-eabi make

# Option 2: Latest release
wget https://developer.arm.com/-/media/Files/downloads/gnu/13.3.rel1/binrel/arm-gnu-toolchain-13.3.rel1-x86_64-arm-none-eabi.tar.xz
tar xf arm-gnu-toolchain-13.3.rel1-x86_64-arm-none-eabi.tar.xz
sudo mv arm-gnu-toolchain-13.3.rel1-x86_64-arm-none-eabi /opt/
sudo ln -s /opt/arm-gnu-toolchain-13.3.rel1-x86_64-arm-none-eabi/bin/* /usr/local/bin/
```

#### macOS

```bash
# Using Homebrew
brew install --cask gcc-arm-embedded
```

---

### 2. Additional Dependencies

#### Make

**Windows**

- Install Git for Windows (includes `make`): [https://git-scm.com/](https://git-scm.com/)

**Linux**

```bash
sudo apt install build-essential
```

**macOS**

```bash
xcode-select --install
```

#### Python 3 (model packaging)

- Install from [https://www.python.org/](https://www.python.org/) or your OS package manager

#### Node.js & pnpm (web UI build)

```bash
# Install Node.js (LTS) from https://nodejs.org/

# Install pnpm
npm install -g pnpm
```

#### STM32_Programmer_CLI (flashing)

1. Download **STM32CubeProgrammer** — [https://www.st.com/stm32cubeprog](https://www.st.com/stm32cubeprog) (v2.19.0+)
2. Default locations:
   - Windows: `C:\Program Files\STMicroelectronics\STM32Cube\STM32CubeProgrammer\bin`
   - Linux: `/usr/local/STMicroelectronics/STM32Cube/STM32CubeProgrammer/bin`
   - macOS: `/Applications/STMicroelectronics/STM32Cube/STM32CubeProgrammer/STM32CubeProgrammer.app/Contents/MacOs/bin`
3. Add to `PATH` and verify:

```bash
STM32_Programmer_CLI --version
```

Windows PowerShell example:

```powershell
$env:PATH += ";C:\Program Files\STMicroelectronics\STM32Cube\STM32CubeProgrammer\bin"
[System.Environment]::SetEnvironmentVariable(
  "Path",
  $env:Path + ";C:\Program Files\STMicroelectronics\STM32Cube\STM32CubeProgrammer\bin",
  [System.EnvironmentVariableTarget]::User)
```

Linux/macOS shell example:

```bash
export PATH="/usr/local/STMicroelectronics/STM32Cube/STM32CubeProgrammer/bin:$PATH"
```

#### STM32_SigningTool_CLI (firmware signing)

Usually installed with STM32CubeCLT or CubeProgrammer.

- Windows: `C:\ST\STM32CubeCLT\STM32_SigningTool_CLI\bin`
- Linux: `/opt/st/stm32cubeclt_*/STM32_SigningTool_CLI/bin`

Verify:

```bash
STM32_SigningTool_CLI --version
```

#### stedgeai (AI model generation)

1. Download **ST Edge AI Core** — [https://www.st.com/en/development-tools/stedgeai-core.html](https://www.st.com/en/development-tools/stedgeai-core.html) or via **STM32Cube.AI** ([https://www.st.com/stm32cubeai](https://www.st.com/stm32cubeai))
2. Default paths:
   - Windows: `C:\Users\<username>\STM32Cube\Repository\Packs\STMicroelectronics\X-CUBE-AI\<version>\Utilities\windows`
   - Linux: `~/STM32Cube/Repository/Packs/STMicroelectronics/X-CUBE-AI/<version>/Utilities/linux`
   - macOS: `~/STM32Cube/Repository/Packs/STMicroelectronics/X-CUBE-AI/<version>/Utilities/mac`
3. Add to `PATH` and set `STEDGEAI_CORE_DIR`:

```bash
# Windows PowerShell
$env:STEDGEAI_CORE_DIR = "C:\Users\<username>\STM32Cube\Repository\Packs\STMicroelectronics\X-CUBE-AI\<version>"
# Linux/macOS
export PATH="$HOME/STM32Cube/Repository/Packs/STMicroelectronics/X-CUBE-AI/<version>/Utilities/linux:$PATH"
export STEDGEAI_CORE_DIR="$HOME/STM32Cube/Repository/Packs/STMicroelectronics/X-CUBE-AI/<version>"
```

4. Validate:

```bash
stedgeai --version
echo $STEDGEAI_CORE_DIR
```

> `stedgeai` is optional—required only when regenerating AI models. Prebuilt binaries already live under `bin/`.

---

### 3. Validate the Toolchain

Use the helper script:

```bash
./check_env.sh
```

Manual spot check:

```bash
arm-none-eabi-gcc --version
arm-none-eabi-objcopy --version
make --version
python --version
node --version
pnpm --version
STM32_Programmer_CLI --version      # optional
STM32_SigningTool_CLI --version     # optional
stedgeai --version                  # optional
echo $STEDGEAI_CORE_DIR             # optional
make info
```

Expected output sample:

```
arm-none-eabi-gcc (GNU Tools for STM32) 13.3.1
GNU Make 4.x
Python 3.x.x
v20.x (Node.js)
9.x (pnpm)
STM32_Programmer_CLI v2.19.0
STM32_SigningTool_CLI v2.19.0
stedgeai v2.2.0-20266 2adc00962
```

---

## Configuration Options

### Method 1: Environment Variables

```powershell
# Windows
your-shell> $env:PATH += ";C:/ST/STM32CubeCLT/GNU-tools-for-STM32/bin"
```

```bash
# Linux/macOS
export PATH="/opt/arm-gnu-toolchain/bin:$PATH"
```

### Method 2: `.make.env` (recommended)

Create `.make.env` at the repo root:

```makefile
# NE301 Makefile settings
GCC_PATH = C:/ST/STM32CubeCLT/GNU-tools-for-STM32/bin
MAKEFLAGS += -j20
OPT = -Os -g3

FLASH_ADDR_FSBL = 0x34000000
FLASH_ADDR_APP = 0x70100000
FLASH_ADDR_WEB = 0x90400000
FLASH_ADDR_MODEL = 0x90700000

export STEDGEAI_CORE_DIR=/path/to/STEdgeAI
```

> The setup script auto-generates this file.

### Method 3: Command-line Overrides

```bash
make GCC_PATH=/path/to/toolchain/bin
make -j20
```

---

## Troubleshooting

### arm-none-eabi-gcc Not Found

```bash
which arm-none-eabi-gcc
# Install STM32CubeCLT or Arm GNU Toolchain, then add to PATH or set GCC_PATH
```

### make Missing on Windows

Install Git for Windows or use a package manager:

```bash
choco install make      # Chocolatey
scoop install make      # Scoop
```

### STM32_Programmer_CLI Missing

Download from [https://www.st.com/stm32cubeprog](https://www.st.com/stm32cubeprog) and add the `/bin` path:

- Windows: `C:\Program Files\STMicroelectronics\STM32Cube\STM32CubeProgrammer\bin`
- Linux: `/usr/local/STMicroelectronics/STM32Cube/STM32CubeProgrammer/bin`

### STM32_SigningTool_CLI Missing

Usually bundled with STM32CubeCLT:

- Windows: `C:\ST\STM32CubeCLT\STM32_SigningTool_CLI\bin`
- Linux: `/opt/st/stm32cubeclt*/STM32_SigningTool_CLI/bin`

### Windows USB Driver Issues

- Install ST-Link driver: [https://www.st.com/stsw-link009.html](https://www.st.com/stsw-link009.html)
- Or let STM32CubeProgrammer install it automatically

### stedgeai Missing

```bash
# Download ST Edge AI Core, set STEDGEAI_CORE_DIR, add Utilities/* to PATH
stedgeai --version
```

### STEDGEAI_CORE_DIR Not Set

```powershell
[System.Environment]::SetEnvironmentVariable(
  "STEDGEAI_CORE_DIR",
  "C:\\Users\\<username>\\STM32Cube\\Repository\\Packs\\STMicroelectronics\\X-CUBE-AI\\<version>",
  [System.EnvironmentVariableTarget]::User)
```

```bash
export STEDGEAI_CORE_DIR="$HOME/STM32Cube/Repository/Packs/STMicroelectronics/X-CUBE-AI/<version>"
```

---

## Recommended Dev Setup

- **IDE**: VS Code, STM32CubeIDE, or your preferred editor
- **Terminal**: PowerShell / Git Bash / Windows Terminal on Windows; default terminal on Linux/macOS
- **Debugger**: STM32CubeIDE + ST-Link

## Quick Smoke Test

```bash
./check_env.sh     # Verify dependencies
make info          # Print current config
make -n            # Dry run
make               # Full build
make app           # Individual targets
make web
make model
```

If every tool reports **[OK]**, you're ready to build for NE301 🎉

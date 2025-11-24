---
title: System Flashing and Initialization
---

## 硬件连接

### 前置要求

- NE301 主板 × 1
- ST-Link V2 × 1
- **4 针 1.25 mm JST（公头）→ 2.54 mm 杜邦（母头）** 线缆，用于 STM32N6 烧录
- **3 针 2.54 mm 杜邦（母-母）** 线缆，用于 STM32U0 烧录
- 与电脑 USB 端口兼容的 USB Type-C 数据线（Type-A 主机需要 C→A 转接线）

---
主板包含两个MCU：**stm32n6** 和 **stm32u0**
#### 准备烧录 `apps`、`web` 或 `models`到 **stm32n6**

1. 将拨码开关 **#2** 拨到 ON 位置以进入烧录模式。烧录完成后，将其拨回并重新上电（或按 **Reset**）以进入运行模式。

   <p align="center">
     <img src="/img/ne301/development-board/software-guide/sys-flash/flash-mode.png" alt="DIP switch for flashing" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
   </p>
2. 使用 **4 针适配线**将 **ST-Link** 连接到开发板的 **DEBUG** 接口，然后将 ST-Link 插入电脑。

   <p align="center">
     <img src="/img/ne301/development-board/software-guide/sys-flash/st-link.png" alt="ST-Link wiring" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
   </p>
3. 通过 USB Type-C 将开发板连接到电脑或电源适配器。

   <p align="center">
     <img src="/img/ne301/development-board/software-guide/sys-flash/type-c.png" alt="Type-C power" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
   </p>

   板载 **DEBUG LED 常亮** 表示已进入烧录模式。

---

#### 准备烧录 `wakecore` 到 **stm32u0**

1. 使用 **3 针杜邦线**将 **ST-Link** 直接连接到 **STM32U0** 接口，然后将 ST-Link 连接到电脑。

   <p align="center">
     <img src="/img/ne301/development-board/software-guide/sys-flash/u0.png" alt="STM32U0 wiring" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
   </p>
2. 通过 USB Type-C 将开发板连接到电脑或电源适配器。

   <p align="center">
     <img src="/img/ne301/development-board/software-guide/sys-flash/connect.png" alt="Power connection" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
   </p>

### 下载固件

1. 从 [Github](https://github.com/camthink-ai/ne301/tree/main/bin) 获取固件

2. 文件列表
```bash
  ne301_FSBL_signed.bin       --> 用于 stm32n6 FSBL        --> 烧录地址 0x70000000
  ne301_App_signed_pkg.bin    --> 用于 stm32n6 App         --> 烧录地址 0x70100000
  ne301_Web_pkg.bin           --> 用于 web gui             --> 烧录地址 0x70400000
  ne301_Model_pkg.bin         --> 用于 AI model            --> 烧录地址 0x70900000
  ne301_WakeCore.bin          --> 用于 stm32u0 wakecore    --> 烧录地址 0x08000000 
```

### 烧录
**支持的烧录工具**
- STM32CubeProgrammer
![GUI](https://www.st.com/content/ccc/fragment/product_related/rpn_information/product_circuit_diagram/group3/0c/26/bb/21/a5/eb/4a/c7/stm32cubeprog_image/files/stm32cubeprog_image.jpg/jcr:content/translations/en.stm32cubeprog_image.jpg) 

或 CLI
```bash
export DKEL="<STM32CubeProgrammer_N6 Install Folder>/bin/ExternalLoader/MX66UW1G45G_STM32N6570-DK.stldr"
STM32_Programmer_CLI -c port=SWD mode=HOTPLUG -el $DKEL -hardRst -w <bin-name>  <flash-addr>
```

- Script/maker.sh

```bash
Script/maker.sh flash <bin-name> <flash-addr>
```
- make 

```bash
# 烧录所有组件
make flash
# 烧录特定组件
make flash-fsbl
make flash-app
make flash-web
make flash-model
make flash-wakecore
```

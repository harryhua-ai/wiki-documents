---
title: System Flashing and Initialization
---

## System Flashing And Initialization

### 前置条件（Prerequisites）

* NE301 主板 × 1
* ST-Link V2 × 1
* **4P 1.25mm 间距 公头 → 2.54mm 杜邦母头适配线**（用于烧录 N6 芯片）
* **3P 2.54mm 双母头杜邦线**（用于烧录 U0 芯片）
* 与电脑 USB 端口兼容的 Type-C 数据线
  （例如：电脑是 Type-A 口，则需要 Type-C → Type-A 的线）

---

### 烧录 apps、web、models 时

1. 将开发板上的 **拨码开关 2 打开**，进入烧录模式。
   （烧录完成后，请关闭拨码开关并重新上电或按 Reset 进入运行模式）

   <p align="center">
     <img src="/img/ne301/development-board/software-guide/sys-flash/flash-mode.png" alt="NE301 烧录模式拨码示意" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
   </p>
2. 使用 **4P 适配线**将 **ST-Link** 连接到开发板的 **DEBUG 接口**，并将 ST-Link 接入电脑。
   <p align="center">
     <img src="/img/ne301/development-board/software-guide/sys-flash/st-link.png" alt="st-link" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
   </p>
3. 使用 Type-C 数据线将开发板连接至电脑或电源适配器。
    <p align="center">
     <img src="/img/ne301/development-board/software-guide/sys-flash/type-c.png" alt="type-c" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
   </p>
   板载 **DEBUG 指示灯常亮** 表示已进入烧录模式。

---

### 烧录 wakecore 时

1. 使用 **3P 杜邦线**将 **ST-Link** 连接到 **STM32U0 芯片**，并将 ST-Link 接入电脑。
     <p align="center">
     <img src="/img/ne301/development-board/software-guide/sys-flash/u0.png" alt="u0" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
   </p>
2. 使用 Type-C 数据线将开发板连接到电脑或电源适配器。
    <p align="center">
     <img src="/img/ne301/development-board/software-guide/sys-flash/connect.png" alt="connect" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
   </p>

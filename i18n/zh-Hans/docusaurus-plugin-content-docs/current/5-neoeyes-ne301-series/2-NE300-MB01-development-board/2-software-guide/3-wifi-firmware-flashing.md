---
title: Wi-Fi Firmware Flashing
---
# NE301 WiFi 固件烧录指南

如果你是 DIY 爱好者，拿到了 NE301 开发板，因为是裸板，可能会遇到无法搜索到 NE301 WiFi AP 的情况。这通常是因为开发板缺少 WiFi 固件导致的。本文将指导你如何检查并烧录 WiFi 固件。

## 准备工作

1.  **下载 WiFi 固件**：
    访问以下链接下载 `siwg917` 固件文件：
    [WiFi 固件下载地址](https://resources.camthink.ai/wiki/dev-demo/siwg917)

2.  **准备 SD 卡**：
    准备一张格式化好的 MicroSD 卡。

## 烧录步骤

### 1. 放入固件
将下载好的 `siwg917` 固件文件复制到 SD 卡的**根目录**。

### 2. 插入 SD 卡并检查
将 SD 卡插入 NE301 开发板的卡槽中。
连接串口工具（波特率 115200），在控制台输入 `ls` 命令，确认系统已经识别到 SD 卡，并且能看到 `siwg917` 文件。

![检查固件](/img/ne301/development-board/software-guide/wifi/ls.png)

### 3. 执行烧录指令
在串口控制台中输入以下指令开始升级：
```bash
wifiup
```

![执行烧录](/img/ne301/development-board/software-guide/wifi/wifiup.png)

### 4. 等待烧录完成
系统会自动重启并进入 WiFi 固件升级模式。
**注意：烧录过程大约需要几分钟，请耐心等待，切勿断电或中断操作。**

当看到类似下图的提示“wifi_update ok”，并且系统自动重启进入工作模式时，说明烧录成功。

![烧录完成](/img/ne301/development-board/software-guide/wifi/wait.png)

烧录完成后，你应该就能搜索到 NE301 的 WiFi 热点了。

# usb video streaming

## 概述

本示例展示如何通过UVC协议实现视频流实时传输，基于ESP32-S3开发平台。

### 技术背景

**UVC(USB Video Class)**是USB-IF制定的标准协议，主要特点包括：

- 支持高分辨率图像采集
- 即插即用兼容性
- 标准化控制接口
- 简化硬件设计

## 准备工作

### 硬件需求

- NE100-MB01开发板
- 兼容UVC协议的摄像头模组

### 软件资源

#### 1. 快速体验固件

- 预编译生产固件下载：[lowpower_camera/bin/NE_101_UVC](https://github.com/camthink-ai/lowpower_camera/tree/main/bin)

#### 2. 开发环境配置

- **IDE工具**：Visual Studio Code（v1.99.2+）
- **开发框架**：ESP-IDF插件（v5.1.6）
- **示例代码库**： [lowpower_camera](https://github.com/camthink-ai/lowpower_camera.git)

## 功能验证

### 使用预编译固件

1. **设备连接**：
   
   - 开发板连接UVC摄像头模组
   - 参考[硬件连接说明](../1-hardware-guide/1-hardware-connection.md)

2. **固件烧录**：
   遵循标准烧录流程：
   
    [系统烧录与初始化指南](./../2-software-guide/1-system-flashing-and-initialization.md)

3. **功能测试**：
   
   - 长按功能键进入配置模式
   - 访问设备Web管理界面 http://192.168.1.1
   - 验证视频流显示
   
   ![设备WiFi连接示意图](/img/NE101_wifi_connect.png)
   ![设备管理界面概览](/img/NE101_web.png)
   ![UVC视频流](/img/NE101_web_cam.png)

### 源码开发验证流程

#### 1. 获取代码库

```bash
git clone https://github.com/camthink-ai/lowpower_camera.git
```

#### 2. 工程配置

使用VS Code打开项目目录：

![工程目录结构示意图](/img/NE101_code_dir.png)

#### 3. 关键配置项

打开/main/camera.h文件，使能uvc。

![灵敏度参数配置](/img/NE101_example_uvc1.png)

#### 4. 编译与部署

1. 选择ESP32-S3目标芯片：

![芯片选择界面](/img/NE101_idf_IC.png)

2. 执行工程编译：

![编译过程界面](/img/NE101_idf_build.png)

3. 烧录生成固件：

![固件烧录界面](/img/NE101_idf_flash.png)

#### 5. 功能验证

测试方法与预编译固件相同。

## 注意事项

**协议限制**：

- ESP32-S3仅支持USB 1.1
- 确保摄像头兼容USB 1.1标准

> 提示：开发过程中建议保持串口监控，及时捕获异常信息。

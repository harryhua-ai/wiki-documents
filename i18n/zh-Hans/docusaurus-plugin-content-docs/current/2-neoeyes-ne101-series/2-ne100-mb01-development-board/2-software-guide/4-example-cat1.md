# Low-power capture based on cellular

## 概述

本方案展示了如何利用**LTE Cat 1**技术实现户外环境下的低功耗图像抓拍与传输，特别适用于无WiFi覆盖且缺乏网关设备的应用场景。

### 技术背景

**LTE Cat 1**作为3GPP专为物联网设计的通信标准，具有以下核心优势：

- **高效传输**：支持最大10Mbps下行速率和5Mbps上行速率
- **全功能支持**：具备移动性管理和VoLTE语音通信能力
- **节能设计**：优化的功耗表现，适合电池供电的长期工作设备
- **广泛覆盖**：可直接接入现有4G网络基础设施，部署便捷

## 开发准备

### 硬件需求

- NE100-MB01开发板
- LTE Cat 1无线模组
- 已激活的4G SIM卡

![Cat1模组硬件连接示意图](/img/Overview/NE101/cat1PCBA.png)

### 软件资源

#### 1. 快速体验固件

- 预编译生产固件下载：[lowpower_camera/bin/NE_101_FCC.zip](https://github.com/camthink-ai/lowpower_camera/tree/main/bin)

#### 2. 开发环境配置

- **IDE工具**：Visual Studio Code（v1.99.2+）
- **开发框架**：ESP-IDF插件（v5.1.6）
- **示例代码库**：
  [lowpower_camera](https://github.com/camthink-ai/lowpower_camera.git)

## 功能验证

### 预编译固件使用指南

#### 1. 硬件准备

1. 正确安装Cat1通信模组
2. 插入已激活的4G SIM卡

> 详细连接说明参考：
> [硬件连接指南](../1-hardware-guide/1-hardware-connection.md)

#### 2. 固件烧录

遵循标准烧录流程：
[系统烧录与初始化指南](../2-software-guide/1-system-flashing-and-initialization.md)

#### 3. 网络状态验证

1. 长按功能键进入配置模式
2. 访问设备Web管理界面 http://192.168.1.1
3. 查看"蜂窝网络"状态信息

![网络状态显示界面1](/img/NE101_example_cat1_1.png)
![网络状态显示界面2](/img/NE101_example_cat1_2.png)

#### 4. 数据传输测试

1. 配置MQTT服务器连接参数
2. 执行测试抓拍及图片上传功能

> 完整操作指引详见：
> [快速入门手册](../../1-quick-start.md)

### 源码开发验证流程

#### 1. 获取代码库

```bash
git clone https://github.com/camthink-ai/lowpower_camera.git
```

#### 2. 工程配置

使用VS Code打开项目目录：

![工程目录结构示意图](/img/NE101_code_dir.png)

#### 3. 编译与部署

1. 执行工程编译：

![编译过程界面](/img/NE101_idf_build.png)

2. 烧录生成固件：

![固件烧录界面](/img/NE101_idf_flash.png)

#### 4. 功能验证

网络状态检查与数据传输测试方法同预编译固件章节。

## 注意事项

### SIM卡管理

- 确认SIM卡已开通4G数据服务

### 信号质量评估

- **优良信号**：RSSI > -85dBm
- **一般信号**：-85dBm > RSSI > -95dBm  
- **弱信号**：RSSI < -95dBm

> **开发建议**：
> 
> 1. 使用串口工具监控AT指令交互，便于快速排查通信问题
> 2. 网络注册过程通常需要30-60秒，属正常现象
> 3. 在弱信号环境下调整设备位置
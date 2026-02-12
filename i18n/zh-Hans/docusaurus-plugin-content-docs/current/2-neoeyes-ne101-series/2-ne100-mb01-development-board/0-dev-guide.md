import Link from "@docusaurus/Link";
import useBaseUrl from '@docusaurus/useBaseUrl';

# Dev Guide
## 开发板概述

NE100-CM01 是为 NeoEyes NE101 系列事件相机设计的高性能开发板。该开发板基于 ESP32-S3 模组，具有超低功耗设计，支持多种触发方式的事件图像采集。此主板能够快速实现物联网相机应用的原型设计和定制化，非常适合智慧农业、环境监测、安防监控和野生动物观察等应用场景。

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
  <img src={useBaseUrl('/img/Board/NE100-MB01_1.png')} alt="主板正面" style={{ height: '300px', objectFit: 'contain', margin: '0 auto' }} />
  <img src={useBaseUrl('/img/Board/NE100-MB01_2.png')} alt="主板背面" style={{ height: '300px', objectFit: 'contain', margin: '0 auto' }} />
</div>

## 核心特性

- **超低功耗设计**：基于 ESP32-S3 MCU，支持深度睡眠模式和传感器触发唤醒机制
- **灵活的摄像头模块支持**：
  - OV5640 模块，可选 120°/60° 视场角
  - 支持 CPI 或 USB 摄像头接入
  - 可更换镜头模块以适应不同焦距需求
- **多样化通信选项**：
  - 内置 Wi-Fi 支持
  - 可选 Cat.1 LTE 模块
  - 可选 Wi-Fi Halow 模块，适用于远距离低功耗应用
- **丰富的接口资源**：
  - 16 针 GPIO 扩展接口
  - USB Type-C 用于供电和调试
  - TF 卡槽用于本地存储
  - 报警输入接口
- **模块化设计**：支持可更换的通信、摄像头和电源模块
- **开放硬件架构**：便于根据特定应用需求进行定制和扩展

## 技术规格

| 参数类别 | 规格 |
|--------------------|---------------|
| 微控制器    | ESP32-S3      |
| RAM                | 8MB           |
| Flash              | 16MB          |
| 摄像头支持     | OV5640 (CPI 接口)，可选 USB 摄像头 |
| 视场角      | 60° 或 120° 可选 |
| 对焦距离     | 近焦 (8cm/15cm) 或远焦 (3m/4m) 可选 |
| 通信      | Wi-Fi (标准)，Cat.1 LTE 或 Wi-Fi Halow (可选) |
| 蓝牙          | 支持     |
| 电源供应       | USB-C (5V/1A) 或电池 (4×AA, 6V) |
| GPIO 扩展     | 16 针扩展接口 |
| 工作温度 | -10°C 至 50°C |
| 存储            | Micro TF 卡 |
| 补光灯         | 支持     |
| 尺寸         | 100mm × 80mm × 30mm (仅 PCB) |

## 开发资源

NE100-CM01 开发板提供了全面的开发资源和文档支持。以下是相关开发资源的链接：

### 硬件资源
- [硬件组件概览](./1-hardware-guide/0-components-overview.md) - 详细介绍开发板组件和规格
- [硬件连接指南](./1-hardware-guide/1-hardware-connection.md) - 开发板接口使用和连接方法说明

### 软件资源
- [系统烧录与初始化](./2-software-guide/1-system-flashing-and-initialization.md) - 固件烧录的详细步骤
- [开发环境搭建](./2-software-guide/0-development-environment-setup.md) - ESP-IDF 开发环境设置指导

### 应用示例
- [PIR 传感器示例](./2-software-guide/3-example-pir.md) - 使用 PIR 传感器实现运动检测的示例
- [低功耗图像采集](../3-application-guide/0-low-power-image-acquisition.md) - 低功耗场景下的图像采集示例

## 快速入门

对于新用户，请参考[快速入门指南](../1-quick-start.md)快速了解并开始使用 NE101 设备。该指南将帮助您完成初始设置和系统配置。

## 开发工作流程

1. **硬件设置**
   - 通过 USB-C 或电池连接电源
   - 将可选传感器连接到 GPIO 引脚
   - 通过 USB 连接计算机进行开发

2. **软件开发**
   - 安装 ESP-IDF 开发环境
   - 使用示例项目作为起点
   - 编译和烧录固件

3. **测试和调试**
   - 监控串口输出（波特率 115200）
   - 使用 Web 界面进行配置（http://192.168.1.1）
   - 验证睡眠模式下的功耗

4. **部署**
   - 配置网络设置
   - 设置拍摄计划
   - 测试远程数据传输

## 技术支持与资源

- [ESP32-S3 技术参考](https://www.espressif.com/en/products/socs/esp32-s3) - ESP32-S3 官方文档
- [ESP-IDF 编程指南](https://docs.espressif.com/projects/esp-idf/en/latest/) - Espressif IoT 开发框架文档
- [GitHub 仓库](https://github.com/camthink-ai/lowpower_camera/tree/main/bin) - 开源固件仓库

如需进一步的技术支持，请联系我们的技术支持团队。

---

完整的产品信息请参阅 [NE101 系列产品概述](../0-overview.md)。

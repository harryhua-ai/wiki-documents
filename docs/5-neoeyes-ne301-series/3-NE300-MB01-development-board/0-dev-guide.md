import useBaseUrl from '@docusaurus/useBaseUrl';

# Dev Guide
## 开发板概述

NE300-MB01是为NeoEyes NE300系列AI相机的高性能开发板。该方案基于STM32U0+STM32N6芯片，具有超低功耗设计，可实现视频推理和图像推理功能，支持各种传感器触发实现图像采集和推理。该主板能够快速实现物联网相机应用的原型设计和定制化，非常适合智慧农业、环境监测、安防监控和野生动物观察等应用场景。

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
  <img src={useBaseUrl('/img/ne301/development-board/dev-guide/board1.jpg')} alt="主板正面" style={{ height: '300px', objectFit: 'contain', margin: '0 auto' }} />
  <img src={useBaseUrl('/img/ne301/development-board/dev-guide/board2.jpg')} alt="主板背面" style={{ height: '300px', objectFit: 'contain', margin: '0 auto' }} />
</div>


## 核心特点

**超低功耗设计**：

STM32U0作为电源管理控制，通过检测各个传感器，负责在深度睡眠模式下唤醒系统。

**支持多种摄像头模块**：

1、OS04C10摄像头
2、支持USB 摄像头
3、可更换不同焦距和角度的镜头模块，适配不同应用场景

**通信方式**：

1、板载wifi6
2、可选配CAT1模组

**丰富的接口资源**：
1、16 +12PIN GPIO 扩展接口
2、USB Type-C 用于供电和调试
3、TF 卡槽用于本地存储
4、报警输入接口

**模块化设计**：

支持可更换的通信、摄像头和电源模块

**开放硬件架构**：

便于根据特定应用需求进行定制和扩展

## 技术规格

| **参数类别**      | **规格**                       |
| ------------- | ---------------------------- |
| MCU           | STM32N657L0H3                |
| Low_Power-MCU | STM32U073KBU6                |
| 外置PSRAM       | APS512XX-OBR-BG，64MB         |
| 外置Flash       | MX66UM1G45G，128MB            |
| 摄像头           | OS04C10，可选USB摄像头             |
| 镜头角度(DFOV)    | 59、97、165                    |
| 对焦距离          | 2m、3m、4m（可调）                 |
| 通信            | Wi-Fi (标准)，Cat-1 LTE（可选）     |
| 蓝牙            | 待开发                          |
| 供电电源          | USB-C (5V/2A) 或电池 (4×AA, 6V) |
| GPIO扩展        | 16 PIN GPIO 扩展接口             |
| 模组GPIO扩展      | 16 +12PIN GPIO 扩展接口          |
| 工作温度          | -10°C 至 50°C                 |
| 存储            | Mirco SD卡                          |
| 补光灯           | 支持                           |
| 尺寸            | 60mm*60mm                    |

## 开发资源

NE300-MB01 开发板提供了全面的开发资源和文档支持。以下是相关开发资源的链接：

### 硬件资源

- [硬件组件概览](./1-hardware-guide/0-components-overview.md) - 详细介绍开发板组件和规格
- [硬件连接指南](./1-hardware-guide/1-hardware-connection.md) - 开发板接口使用和连接方法说明

### 软件资源

- [NE301 GitHub 仓库](https://github.com/camthink-ai/ne301) - 获取固件、Web前端与示例工程


### 应用示例

Coming soon!!

## 快速入门

- [开发板快速入门](./1-qucik-start.md) - 开发板使用说明


## 技术支持与资源

Coming soon!!


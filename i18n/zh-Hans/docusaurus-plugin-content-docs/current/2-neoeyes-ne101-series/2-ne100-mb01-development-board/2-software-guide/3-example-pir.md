# Capture moving objects

## 概述

本方案展示了如何利用**PIR传感器**实现智能运动检测与自动抓拍功能，为安防监控、智能家居等场景提供低功耗解决方案。

### 技术背景

**被动红外传感器(PIR)**通过检测红外辐射变化实现运动感知，具有以下技术特性：

- **检测范围**：3-7米（视具体型号而定）
- **检测角度**：水平110°×垂直90°广角覆盖
- **电源特性**：3.3V-5V宽电压工作
- **节能优势**：μA级待机功耗，极适合电池供电设备

## 开发准备

### 硬件需求

- NE100-MB01开发板
- PIR运动检测传感器

### 软件资源

#### 1. 快速部署固件

- 预编译生产固件下载：[lowpower_camera/bin/NE_101_PIR.zip](https://github.com/camthink-ai/lowpower_camera/tree/main/bin)

#### 2. 开发环境配置

- **开发工具**：Visual Studio Code（v1.99.2+）
- **开发框架**：ESP-IDF插件（v5.1.6）
- **示例代码库**：
  [lowpower_camera](https://github.com/camthink-ai/lowpower_camera.git)

## 功能验证

### 预编译固件使用指南

#### 1. 硬件连接

1. 将PIR传感器接入开发板指定接口
2. 确保供电稳定

> 详细接线说明参考：
> [硬件连接指南](../1-hardware-guide/1-hardware-connection.md)

#### 2. 固件烧录

遵循标准烧录流程：
[系统烧录与初始化指南](../2-software-guide/1-system-flashing-and-initialization.md)

#### 3. 功能测试

1. 设备上电完成初始化
2. 进入低功耗待机模式
3. 触发PIR传感器：
   - 观察状态指示灯响应
   - 验证自动抓拍及上传功能

> 完整测试流程详见：
> [快速入门手册](../../1-quick-start.md)

### 源码开发验证流程

#### 1. 获取代码库

```bash
git clone https://github.com/camthink-ai/lowpower_camera.git
```

#### 2. 工程配置

使用VS Code打开项目目录：

![工程目录结构示意图](/img/NE101_code_dir.png)

#### 3. 关键配置项

1. **GPIO设置**：
   - 使用RTC GPIO支持唤醒功能
   - 避免外部上拉干扰

![GPIO配置示意图](/img/NE101_example_6.png)

2. **灵敏度调节**：
   - 根据应用场景调整检测参数

![灵敏度参数配置](/img/NE101_example_5.png)

#### 4. 编译与部署

1. 选择ESP32-S3目标芯片：

![芯片选择界面](/img/NE101_idf_IC.png)

2. 执行工程编译：

![编译过程界面](/img/NE101_idf_build.png)

3. 烧录生成固件：

![固件烧录界面](/img/NE101_idf_flash.png)

#### 5. 功能验证

测试方法与预编译固件相同。

## 优化建议

### 抗干扰措施

- 增加PULSE_C参数值（建议2-3秒）
- 远离电机、变频器等干扰源

### 环境适配建议

- 安装高度建议1.5-2米
- 避免阳光直射传感器窗口
- 定期清洁传感器透镜
- 根据场景调整检测角度

> **调试技巧**：
> 
> 1. 使用逻辑分析仪监测GPIO信号
> 2. 通过串口日志分析误触发原因
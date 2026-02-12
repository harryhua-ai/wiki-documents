# Human Face Detect

## 概述

本示例实现基于深度学习的人脸检测功能，为开发者提供了一个可扩展的基础框架，可用于开发各种人脸识别相关应用。

本项目基于[ESP-DL](https://github.com/espressif/esp-dl)深度学习库开发，该库为ESP-WHO提供了强大的深度学习接口，结合各类外设可实现丰富的AIoT应用场景。

## 准备工作

### 硬件需求

- NE100-CM01开发板

### 软件准备

#### 1. 预编译固件

可直接下载最新预编译固件进行快速体验：

- [human_face_detect.zip](https://github.com/camthink-ai/esp-who/blob/master/bin)

#### 2. 源码开发环境

如需进行二次开发，需准备以下环境：

- **开发工具**：Visual Studio Code（1.99.2或更高版本）
- **开发框架**：ESP-IDF插件（v5.4.0或更高版本）
- **示例代码**：[camthink-ai/esp-who](https://github.com/camthink-ai/esp-who)

> **重要提示**：请务必按照[开发环境配置指南](../2-ne100-mb01-development-board/2-software-guide/0-development-environment-setup.md)完成环境配置。

## 功能验证

### 预编译固件测试流程

#### 1. 设备连接

使用Type-C数据线将开发板连接至PC

![NE101主板接口示意图](/img/NE101_Main_Board2.png)

#### 2. 固件烧录

参考详细烧录指南：

- [系统烧录与初始化](../2-ne100-mb01-development-board/2-software-guide/1-system-flashing-and-initialization.md)

#### 3. 串口输出解析

设备将通过串口输出人脸检测结果（波特率：115200）：

示例输出：

```
WhoDetect: 0, bbox: [0.826712, 47, 40, 169, 195], left_eye: [80, 105], left_mouth: [90, 151], nose: [101, 125], right_eye: [123, 99], right_mouth: [126, 146]
```

**数据字段说明**：

- **bbox**：人脸边界框信息
  - 格式：[置信度, 左上角x坐标, 左上角y坐标, 宽度, 高度]
- **left_eye**：左眼坐标(x,y)
- **right_eye**：右眼坐标(x,y) 
- **nose**：鼻子坐标(x,y)
- **left_mouth**：左嘴角坐标(x,y)
- **right_mouth**：右嘴角坐标(x,y)

#### 4. 功能验证

1. 将摄像头对准人脸或人脸照片
2. 观察串口输出的人脸特征点数据
3. 可尝试移动摄像头，验证动态检测效果

![人脸检测静态示意图](/img/NE101_example_human_detect_1.png)

![人脸检测动态效果图](/img/NE101_example_human_detect.gif)

### 源码开发验证流程

#### 1. 获取源码

```bash
git clone https://github.com/camthink-ai/esp-who
```

#### 2. 工程配置

1. 使用VS Code打开工程：`examples/human_face_detect`
   
   ![工程目录结构](/img/NE101_human_face_detect_dir.png)

2. 设置目标芯片为ESP32-S3
   
   ![芯片选择界面](/img/NE101_idf_IC.png)

#### 3. 编译与烧录

1. 编译工程
   
   ![编译界面](/img/NE101_idf_build.png)

2. 烧录固件
   
   ![烧录界面](/img/NE101_idf_flash.png)

#### 4. 功能验证

验证方法与预编译固件相同，参考前述步骤。

## 参考资源

1. ESP-DL模型量化文档：
   
   - [GitHub - espressif/esp-dl](https://github.com/espressif/esp-dl?tab=readme-ov-file)

2. 官方示例仓库：
   
   - [GitHub - espressif/esp-who](https://github.com/espressif/esp-who/tree/master)
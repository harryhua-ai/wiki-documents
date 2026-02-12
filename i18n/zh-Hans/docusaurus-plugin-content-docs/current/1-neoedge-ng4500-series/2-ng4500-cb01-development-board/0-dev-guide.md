import Link from "@docusaurus/Link";
import useBaseUrl from '@docusaurus/useBaseUrl';

# Dev Guide
## 开发板概述

NG4500-CB01 是为 NeoEdge NG4500 系列 AI 边缘计算设备设计的高性能开发载板。该载板适用于 NVIDIA Jetson Orin 系列模块（Orin Nano/NX），适用于机器视觉、工业自动化、机器人和 AIoT 等应用场景。

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
  <img src={useBaseUrl('/img/Board/NG4500-CB01_1.png')} alt="主板正面" style={{ height: '300px', objectFit: 'contain', margin: '0 auto' }} />
  <img src={useBaseUrl('/img/Board/NG4500-CB01_2.png')} alt="主板背面" style={{ height: '300px', objectFit: 'contain', margin: '0 auto' }} />
</div>

## 核心特性

- **兼容NVIDIA Jetson Orin系列模块**：支持Jetson Orin Nano 4GB/8GB和Orin NX 8GB/16GB
- **丰富的接口资源**：
  - 双千兆以太网接口
  - 4×Type-A (USB 3.1)  和  1×Type-C (USB 3.2)
  - RS232、RS485、CAN总线接口
  - 数字量输入/输出接口(DI/DO)
  - HDMI 4K视频输出
  - 音频输入输出接口
- **扩展能力**：
  - M.2 Key M PCIe 4.0 NVMe SSD接口（2280规格）
  - M.2 Key M PCIe 1.0扩展接口
  - M.2 Key B接口支持4G/5G/Wi-Fi Halow（2242/2252规格）
  - M.2 Key E接口支持Wi-Fi 6/蓝牙5.0（2230规格）
  - 4lanes MIPI×2摄像头接口
- **工业级设计**：宽压输入（12V-36V DC），无风扇被动散热设计，工作温度-25°C至60°C

## 技术规格

| 参数类别 | 规格 |
|---------|------|
| 模块支持 | Jetson Orin Nano 4GB/8GB，Jetson Orin NX 8GB/16GB |
| 处理器 | 6/8核Arm® Cortex® A78AE v8.2 (64-bit) |
| GPU | 512/1024 NVIDIA® CUDA® cores，16/32 Tensor核心 |
| AI性能 | 最高157 INT8 TOPS（SUPER模式） |
| 内存 | 4GB/8GB/16GB LPDDR5 |
| 存储扩展 | 支持NVMe SSD（2280），预装128GB-1TB |
| 网络接口 | 2×RJ45千兆以太网 |
| 无线扩展 | Wi-Fi 6/蓝牙5.0，4G/5G/Wi-Fi Halow |
| 视频接口 | HDMI输出，2×MIPI CSI摄像头接口 |
| 串行接口 | RS232，RS485，CAN |
| 电源输入 | DC 12V-36V，峰值功率120W |
| 尺寸 | 160mm × 125mm × 75mm（整机尺寸） |
| 操作系统 | Ubuntu Linux（JetPack 6.0+） |

## 开发资源

NG4500-CB01开发板提供了全面的开发资源和文档支持，以下是相关开发资源的链接：

### 硬件资源
- [硬件组件说明](./1-hardware-guide/0-components-overview.md) - 详细介绍开发板各组件功能和规格
- [硬件连接指南](./1-hardware-guide/1-hardware-connection.md) - 提供开发板接口使用和连接方法

### 软件资源
- [系统烧录指南](./2-software-guide/0-system-flashing-and-initialization.md) - 提供Jetson模块系统烧录的详细步骤
- [开发环境搭建](./2-software-guide/1-development-environment-setup.md) - 指导如何配置开发环境和开发工具
- [驱动安装与更新](./2-software-guide/1-driver-installation-and-updates/0-interface-and-modules-configure.md) - 包含各类硬件接口的驱动安装说明
- [软件框架与工具](./2-software-guide/3-software-frameworks-and-tools/0-docker.md) - 支持的开发框架和工具列表

### 应用开发
- [DeepSeek大语言模型部署](../3-application-guide/1-deepseek-r1.md) - 在NG4500上部署大语言模型的教程
- [MediaPipe框架应用](../3-application-guide/2-mediapipe.md) - 使用MediaPipe开发视觉应用的示例
- [目标检测应用实现](../3-application-guide/3-object-detection.md) - 基于TensorRT的目标检测应用开发

## 开发工作流程

1. **硬件准备**
   - 安装Jetson Orin模块到开发板
   - 连接电源和外设（显示器、键盘、鼠标）
   - 根据需要安装扩展模块（存储、通信模块等）

2. **系统初始化**
   - 烧录JetPack操作系统
   - 完成系统初始设置
   - 安装必要的驱动和更新

3. **开发环境配置**
   - 安装CUDA、cuDNN、TensorRT等开发工具
   - 配置开发框架（PyTorch、TensorFlow等）
   - 设置IDE和开发工具链

4. **应用开发与测试**
   - 开发AI应用程序
   - 使用JetsonStats监控系统资源
   - 优化性能和功耗

5. **部署与优化**
   - 应用程序打包和系统集成
   - 性能调优和稳定性测试
   - 工业环境适配和测试

## 快速入门

新用户可以参考[快速入门指南](../1-quick-start.md)，快速了解并上手NG4500设备。这份指南将帮助您完成初始设置，并指导您进行系统初始配置。

## 技术支持与资源

- [NVIDIA Jetson开发者论坛](https://forums.developer.nvidia.com/c/agx-autonomous-machines/jetson-embedded-systems/70) - NVIDIA官方技术支持论坛
- [Jetson Linux API参考](https://docs.nvidia.com/jetson/l4t/) - Jetson Linux开发参考文档
- [Jetson Orin开发者套件文档](https://developer.nvidia.com/embedded/jetson-orin-nano-devkit) - NVIDIA官方开发者套件文档
- [NVIDIA NGC目录](https://catalog.ngc.nvidia.com/) - NVIDIA预训练模型和容器仓库
- [Jetson社区项目](https://github.com/dusty-nv/jetson-inference) - Jetson平台开源项目和示例

如需进一步的技术支持，请联系我们的技术支持团队。

---

完整的产品信息请参阅[NG4500系列产品概述](../0-overview.md)。

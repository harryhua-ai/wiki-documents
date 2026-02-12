# Nx Meta Platfrom

---

本文详细说明如何在 NVIDIA Jetson Orin 平台部署Nx Meta Platfrom的详细部署与配置步骤，涵盖服务端和客户端的安装，RSTP本地摄像头推流方法以及客户端启用五种检测事件和监控方法。

---

## 1.概述

Nx Meta Platform 是由Network Optix开发的**核心视频管理系统（VMS）**，提供完整的视频管理、AI分析和云服务解决方案。该平台采用模块化架构，支持从边缘计算设备到云端的一体化部署。

**Nx Meta Platform: 核心视频管理系统（VMS）**，包括：

● Nx Meta Server (AIBOX): 安装在Jetson上的服务端，负责设备管理、视频录制、用户权限、以及通过插件集成AI功能。

● Nx AI Manager Plugin: 核心AI插件，充当AI模型推理引擎，支持CPU/GPU，并提供规则引擎。

● Nx Meta Client: 用户交互界面，用于远程访问、配置Server和查看AI分析结果。

● Meta Cloud: 用于账户管理、设备发现和License分发

支持的设备如下：

![](/img/NG45XX_SOFTWARE/Application/NxMeta_support_devices.png)

## 2.环境准备

### 硬件需求

| 组件    | 要求                           |
| ----- | ---------------------------- |
| 设备    | Jetson Orin（Nano / NX / AGX） |
| 内存    | ≥ 8GB                        |
| 存储空间  | ≥ 64GB                       |
| GPU   | 支持 CUDA 的 NVIDIA GPU         |
| 外设摄像头 | IMX219                       |

### 软件需求

- Ubuntu 22.04
- NVIDIA CUDA 工具包和驱动（JetPack 5.x/6.x 已预装）
- Docker（可选，用于容器化部署）

## 3. 软件部署

### 3.1 AIBOX服务端配置

- 连接IMX219摄像头，上电启动AIBOX设备

- 安装系统环境依赖

```shell
sudo apt update
sudo apt upgrade -y
sudo apt-get install -y libgomp1 gdebi wget
```

- 下载&安装Nx Meta Server工具（ARM64架构）

```shell
# 下载
wget https://updates.networkoptix.com/metavms/41290/arm/metavms-server-6.0.5.41290-linux_arm64.deb

# 安装
sudo apt install -y ./metavms-server*.deb
```

- 安装AI Manage Plugin

```shell
sudo bash -c "$(wget -q -O - https://artifactory.nxvms.dev/artifactory/nxai_open/NXAIPlugin/install.sh)"
```

- 确认是否mediaserver完成，指令如下

```shell
$sudo netstat -tlnp | grep 7001
tcp        0      0 0.0.0.0:7001            0.0.0.0:*               LISTEN      12566/mediaserver
tcp6       0      0 :::7001                 :::*                    LISTEN      12566/mediaserver
```

- 配置&启动本地摄像头RTSP推流

```shell
# 安装环境
sudo apt-get install python3-gi python3-gst-1.0 gir1.2-gst-rtsp-server-1.0

# 创建推流脚本
sudo vim  rtsp-server.py
sudo chmod +x rtsp-server.py

# 运行脚本（输出的RTSP流，需更换为您实际使用的IP：rtsp://192.168.231.66:8554/cam）
python rtsp-server.py
```

rtsp-server.py内容如下：

```python
import gi
gi.require_version('Gst', '1.0')
gi.require_version('GstRtspServer', '1.0')
from gi.repository import Gst, GstRtspServer, GLib

Gst.init(None)

class RTSPServer:
    def __init__(self):
        self.server = GstRtspServer.RTSPServer()
        factory = GstRtspServer.RTSPMediaFactory()
        factory.set_launch(
            'nvarguscamerasrc ! video/x-raw(memory:NVMM),width=1280,height=720,framerate=30/1 ! nvv4l2h264enc ! rtph264pay name=pay0 pt=96'
        )
        factory.set_shared(True)
        self.server.get_mount_points().add_factory("/cam", factory)
        self.server.attach(None)

if __name__ == '__main__':
    RTSPServer()
    loop = GLib.MainLoop()
    loop.run()
```

### 3.2 Windows客户端

- 下载[Nx Meta Client]([https://meta.nxvms.com/download/releases/windows]](https://meta.nxvms.com/download/releases/windows%5D)，根据安装环境选择合适的版本，如下X64，版本号6.0.5.41290）

- 安装完成后，双击启动Nx Meta Client

- AIBOX安装完成Nx Meta Server后，Client会自动检测同网段下的Server设备，如下图（首次登入时，需要设置账号密码，账号默认admin）

![](/img/NG45XX_SOFTWARE/Application/NxMeta_Login.png)

- 给AIBOX服务端启动免费的Licenses

![](/img/NG45XX_SOFTWARE/Application/NxMeta_Licenses.png)

- 注册一个Meta Cloud账户，并登入

![](/img/NG45XX_SOFTWARE/Application/NxMeta_Cloud.png)

- 添加摄像头设备，输入上面AIBOX导出的RTSP流：rtsp://192.168.231.66:8554/cam

![](/img/NG45XX_SOFTWARE/Application/NxMeta_Add_Camera.png)

-  配置摄像头，选择启用NX AI Plugins(存在CPU和GPU的两种方式，[3. Configure the Nx AI Manager plugin | Nx AI Manager Documentation](https://nx.docs.scailable.net/nx-ai-manager/3.-configure-the-nx-ai-manager-plugin))

![](/img/NG45XX_SOFTWARE/Application/NxMeta_AI_Manager_Plugins.png)

- 启用检测包含目标检测、人脸检测、过线检测、目标计数、徘徊检测。以下以目标计数为例（左边会将摄像头中的物品进行识别，并统计次数，抓拍出来进行闪缩提示）：

![](/img/NG45XX_SOFTWARE/Application/NxMeta_count.png)

- 登入[cloud](List sites - NxAI Platform](https://admin.sclbl.nxvms.com/sites))，可以监视当前设备的性能参数以及运行状态

![](/img/NG45XX_SOFTWARE/Application/NxMeta_data.png)

- 如需切换检测类型，在camera配置中选择Manager Device，进入Nx AI Manager中切换Model（选择对应的event，如Illegal Dumping\Line Crossing\Loitering Detection\Object Counting）

![](/img/NG45XX_SOFTWARE/Application/NxMeta_events.png)

- 配置rules事件，右键摄像头，选择“Add Rules”,配置Analytics Event,然后选择具体检测事件

![](/img/NG45XX_SOFTWARE/Application/NxMeta_add_rules.png)

## 4. Teachable Machine（构建模型平台）

**Teachable Machine** 是 Google 推出的零代码机器学习平台，支持图像、音频、姿态等多种类型的模型训练，核心特点是简单易用、可视化，支持导出**TensorFlow Lite**（TFLite）、TensorFlow、Keras、ONNX 等多种格式，便于在不同硬件和平台部署。支持Teachable Machine平台训练模型，快速构建模型，上传部署到到NxMeta平台。（参考链接：[Teachable Machine Tutorial 1: Gather](https://www.youtube.com/watch?v=DFBbSTvtpy4)）

- 进入Teachable Machine 官网（https://teachablemachine.withgoogle.com/）击New Project开始创建模型

- 导入足够多的图片或视频，然后选择Model Trained

![](/img/NG45XX_SOFTWARE/Application/NxMeta_Teachable_Machine1.png)

- 选择导出模型，选择TensorFlow lite tab -> Floating point -> Download , 下载完成后会获得一个zip的文件

![](/img/NG45XX_SOFTWARE/Application/NxMeta_Teachable_Machine2.png)

- 登入[NxMeta cloud端](List sites - NxAI Platform](https://admin.sclbl.nxvms.com/sites)，上传模型，直接将压缩包拖入

![](/img/NG45XX_SOFTWARE/Application/NxMeta_Teachable_Machine3.png)

- 导入成功后，可以从Client端中的摄像头配置Plugins中，从Manager Device看到上传的模型，通过add pipline应用上传的模型

![](/img/NG45XX_SOFTWARE/Application/NxMeta_Teachable_Machine4.png)

## 5. Nx AI Manager Plugins 性能验证

确保平台可以稳定运行Nx AI Manager Plugins后，可以通过以下步骤测试&验证目标设备运行的性能情况。

- 下载测试工具

```shell
mkdir nxai_test && cd nxai_test
wget https://artifactory.nxvms.dev/artifactory/nxai_open/NXAITest/nxai_test.tgz
tar -xvf nxai_test.tgz
```

- 创建&使能测试的虚拟环境

```shell
sudo apt install python3-venv
python3 -m venv ./
source ./bin/activate
```

- 安装启用依赖库&加速库

```shell
# 安装依赖库
pip3 install -r requirements.txt

# 安装加速库
python3 Utilities/install_acceleration_library.py
```

- 下载测试模型

```shell
python3 Utilities/download_models.py
```

- 测试&验证

```shell
# 完整测试
python3 all_suites.py

# 硬件信息
python3 Utilities/gather_hwinfo.py

# 结果上传到云端
python3 Utilities/upload_results.py
```

以下是个模型的输出结果：

| 模型名称                        | 帧率 (FPS)        | 适用场景            |
| --------------------------- | --------------- | --------------- |
| Empty-Small / Empty-Large   | 663.50 / 131.59 | 性能基准参考，无实际推理    |
| Model-Emotion-Recognizer    | 594.71          | 表情识别、情绪分析       |
| Pipeline-Conditional        | 330.19          | 条件推理流程，适合多模型组合  |
| Pipeline-Feature-Extraction | 187.74          | 特征提取任务，如人脸识别前处理 |
| Model-ViT-Tiny              | 55.15           | 图像分类、轻量视觉任务     |
| Model-Face-Locator          | 92.52           | 人脸定位，适合安防或考勤系统  |
| Model-Regnet-Y              | 76.22           | 图像分类，兼顾精度与速度    |

![](/img/NG45XX_SOFTWARE/Application/NxMeta_model.png)

稳定性测试结果：

● 消息处理速率：17.12 条/秒

● 数据传输速率：428.87 MB/s

![](/img/NG45XX_SOFTWARE/Application/NxMeta_test_suite.png)

## 6. 参考

[Nx AI Manager plugin v4.4 | Nx AI Manager Documentation](https://nx.docs.scailable.net/)

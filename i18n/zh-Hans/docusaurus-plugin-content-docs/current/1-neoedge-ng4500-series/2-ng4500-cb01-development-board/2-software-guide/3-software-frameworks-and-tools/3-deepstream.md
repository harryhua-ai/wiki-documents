# DeepStream

---

本指南介绍如何在 **Jetson Orin** 设备上安装并运行 **NVIDIA DeepStream SDK**。DeepStream 支持使用 GPU 加速的 AI 视频分析流水线，针对 Jetson 的 CUDA/NvMedia 平台高度优化。

---

## 1. 概览

- NVIDIA 提供的实时视频分析 SDK  
- 基于 TensorRT 和 CUDA 加速  
- 支持多路 AI 推理与目标追踪  
- 输入支持 RTSP、USB、CSI 摄像头及本地视频文件  
- 内置目标检测、分类、追踪功能

本指南包括：

- 安装方法（.deb 包和 Docker）
- 示例流水线运行
- 自定义模型集成
- Docker 使用（含 jetson-containers）
- 常见问题与技巧

![overview](/img/NG45XX_deepstream_overview.png)

---

## 2. 系统要求

### 硬件

| 组件   | 最低要求                        |
| ---- | --------------------------- |
| 设备   | Jetson Orin Nano / NX / AGX |
| 内存   | ≥ 8GB                       |
| 存储空间 | ≥ 10GB                      |

### 软件

- JetPack 6.1 GA 或更高版本（L4T ≥ R36.4）  
- Ubuntu 20.04 / 22.04  
- CUDA、TensorRT、cuDNN（已包含在 JetPack 中）  
- Docker（可选，用于容器化部署）

---

## 3. 安装 DeepStream
- glib 迁移
为了迁移到较新的 glib 版本（例如 2.76.6），请按照以下步骤操作：
先决条件：安装以下软件包:
  ```bash
  sudo pip3 install meson
  sudo pip3 install ninja
  ```
  编译安装步骤：
  ```bash
  git clone https://github.com/GNOME/glib.git
  cd glib
  git checkout <glib-version-branch>
  # e.g. 2.76.6
  meson build --prefix=/usr
  ninja -C build/
  cd build/
  sudo ninja install
  ```
  检查并确认新安装的glib版本：
  ```bash
  pkg-config --modversion glib-2.0
  ```

- 依赖库安装：

  ```bash
  sudo apt update
  sudo apt install -y \
    libssl1.1 \
    libgstreamer1.0-0 \
    gstreamer1.0-tools \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav \
    libgstrtspserver-1.0-0 \
    libjansson4 \
    libyaml-cpp-dev
    ```
安装 librdkafka（为消息代理启用 Kafka 协议适配器）

1. 从 GitHub克隆librdkafka存储库：
```bash
git clone https://github.com/confluentinc/librdkafka.git
```
2. 配置并构建库
```bash
cd librdkafka
git checkout tags/v2.2.0
./configure --enable-ssl
make
sudo make install
```
3. 将生成的库复制到deepstream目录：
```bash
sudo mkdir -p /opt/nvidia/deepstream/deepstream/lib
sudo cp /usr/local/lib/librdkafka* /opt/nvidia/deepstream/deepstream/lib
sudo ldconfig
```
### 方式一：通过 SDK Manager 安装

1. 下载并安装 SDK Manager：从 [NVIDIA 官方网站](https://developer.nvidia.com/nvidia-sdk-manager) 下载并安装 SDK Manager

2. 连接设备：使用 USB-C 数据线将 Jetson Orin 设备连接到主机电脑

3. 启动 SDK Manager：在主机上运行 `sdkmanager` 命令，登录 NVIDIA 开发者账号

4. 选择目标硬件和 JetPack 版本：在 SDK Manager 中选择对应的 Jetson Orin 设备和合适的 JetPack 版本

5. 勾选 DeepStream SDK：在“附加 SDK”选项中勾选 DeepStream SDK

6. 开始安装：按照提示完成安装过程

---

### 方式二：使用 DeepStream tar 包

1. 下载 DeepStream SDK：访问 [NVIDIA DeepStream 下载页面](https://catalog.ngc.nvidia.com/orgs/nvidia/resources/deepstream)，下载适用于 Jetson 的 DeepStream SDK tar包（例如 `deepstream_sdk_v7.1.0_jetson.tbz2`)

2. 解压并安装：

```bash
sudo tar -xvf deepstream_sdk_v7.1.0_jetson.tbz2 -C /
cd /opt/nvidia/deepstream/deepstream-7.1
sudo ./install.sh
sudo ldconfig
```

---

### 方式三：使用 DeepStream Debian 软件包

1. 下载 DeepStream Debian：访问 [DeepStream Debian下载页面](https://catalog.ngc.nvidia.com/orgs/nvidia/resources/deepstream)，下载适用于 Jetson 的 DeepStream SDK tar包（例如 `deepstream-7.1_7.1.0-1_arm64.deb`)

2. 安装
```bash
sudo apt-get install ./deepstream-7.1_7.1.0-1_arm64.deb
```

### 方式四： 使用 DeepStream Docker 镜像

1. 安装 Docker 和 NVIDIA Container Toolkit*：确保系统已安装 Docker 和 NVIDIA Container Toolkt。

2. 拉取 DeepStream Docker 镜像：

```bash
docker pull nvcr.io/nvidia/deepstream-l4t:6.1-samples
```

3. 运行容器：

```bash
docker run -it --rm --runtime=nvidia \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -e DISPLAY=$DISPLAY \
  nvcr.io/nvidia/deepstream-l4t:6.1-samples
```
你也可以使用社区维护的 [jetson-containers](https://github.com/dusty-nv/jetson-containers)：

```bash
jetson-containers run dusty-nv/deepstream
```
---

### 安装验证

检查版本信息：

   ```bash
   deepstream-app --version-all
   ```
   正常输出：
   ```bash
    deepstream-app version 7.1.0
    DeepStreamSDK 7.1.0
    CUDA Driver Version: 12.6
    CUDA Runtime Version: 12.6
    TensorRT Version: 10.3
    cuDNN Version: 9.0
    libNVWarp360 Version: 2.0.1d3
  ```
---

## 4. 运行示例

### 步骤 1：运行默认示例

1. 导航到开发套件上的 configs/deepstream-app 目录。
```bash
cd /opt/nvidia/deepstream/deepstream-7.1/samples/configs/deepstream-app
```
2. 输入以下命令来运行参考应用程序
```bash
# deepstream-app -c <path_to_config_file>
deepstream-app -c source30_1080p_dec_infer-resnet_tiled_display_int8.txt
```
该命令将弹出视频窗口，实时显示检测结果:

![deepstream_app_5x8](/img/deepstream_app_1.png)
---

### 步骤 2：使用 USB 或 CSI 摄像头

修改配置文件中的输入部分：

```ini
[source0]
enable=1
type=1
camera-width=1280
camera-height=720
camera-fps-n=30
```

然后运行：

```bash
deepstream-app -c <your_camera_config>.txt
```

> 🎥 USB 摄像头对应 `type=1`，CSI 摄像头使用 `nvarguscamerasrc`

---

### 步骤 3：使用 RTSP 流

使用以下配置片段：

```ini
[source0]
enable=1
type=4
uri=rtsp://<your-camera-stream>
```
### 步骤 4：视频检测
进入示例所在的文件夹：
```bash
cd /opt/nvidia/deepstream/deepstream-7.1/sources/apps/sample_apps/deepstream-test1
```
编译源代码:
```bash
sudo make CUDA_VER=12.6
```
运行：
```bash
./deepstream-test1-app dstest1_config.yml
```
![deepstream_od](/img/deepstream_od.png)


更多源码示例，详见 /opt/nvidia/deepstream/deepstream/sources

---

## 5. 集成自定义模型

DeepStream 支持通过 TensorRT 或 ONNX 集成自定义模型。

### 步骤 1：模型转换

使用 `trtexec` 或 `tao-converter` 工具：

```bash
trtexec --onnx=model.onnx --saveEngine=model.engine
```

### 步骤 2：更新配置文件

```ini
[primary-gie]
enable=1
model-engine-file=model.engine
network-type=0
```

更多deepstream使用tao示例，请参考 https://github.com/NVIDIA-AI-IOT/deepstream_tao_apps

---

## 6. 更多其他示例

[deepstream_python_apps](https://github.com/NVIDIA-AI-IOT/deepstream_python_apps/tree/master)
![deepstream_python](/img/deepstream_python.png)

## 7. 小贴士与故障排查

| 问题            | 解决方法                                       |
| ------------- | ------------------------------------------ |
| Docker 中无图像显示 | 挂载 X11 socket 并设置 `DISPLAY` 变量             |
| 帧率低           | 使用 INT8 引擎或降低输入分辨率                         |
| USB 摄像头无法识别   | 使用 `v4l2-ctl --list-devices` 检查设备          |
| GStreamer 报错  | 检查插件是否安装，必要时重刷 JetPack                     |
| RTSP 延迟/丢帧    | 设置 `drop-frame-interval=0` 和 `latency=200` |

---

## 8. 附录

### 关键路径

| 用途               | 路径                                                   |
| ---------------- | ---------------------------------------------------- |
| 示例配置文件           | `/opt/nvidia/deepstream/deepstream/samples/configs/` |
| 模型引擎文件           | `/opt/nvidia/deepstream/deepstream/models/`          |
| 日志目录             | `/opt/nvidia/deepstream/logs/`                       |
| DeepStream 命令行工具 | `/usr/bin/deepstream-app`                            |

### 参考资源

- [DeepStream 官方页面](https://developer.nvidia.com/deepstream-sdk)  
- [NGC 镜像仓库 - DeepStream](https://catalog.ngc.nvidia.com/orgs/nvidia/containers/deepstream)  
- [GitHub - dusty-nv/jetson-containers](https://github.com/dusty-nv/jetson-containers)

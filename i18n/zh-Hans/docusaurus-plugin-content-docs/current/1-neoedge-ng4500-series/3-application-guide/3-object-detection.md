# Object Detection

---

## 1. 概览

YOLO11 是 Ultralytics 推出的全新一代目标检测模型，具备出色的速度与精度。在 NVIDIA Jetson 设备（如 Orin Nano / NX / AGX）上本地部署 YOLO11，可实现高效、低延迟的 AI 推理。

![yolo_overview](/img/yolo_overview.png)

本指南将介绍：

- 环境准备与 JetPack 安装  
- 通过 Docker 快速运行 YOLO11  
- 本地安装 YOLO11 与依赖项  
- 使用 TensorRT 加速模型推理  
- DLA 加速与性能基准测试  

> YOLO11 可在 Jetson Orin Nano 等设备上以超高性能运行，特别适合边缘 AI 应用场景。

---

## 2. 环境准备

### 硬件支持

| 设备                     | 支持 JetPack 版本 | AI 性能   |
|------------------------|------------------|-----------|
| Jetson Nano            | JetPack 4.6.x    | 472 GFLOPS |
| Jetson Xavier NX       | JetPack 5.1.x    | 21 TOPS   |
| Jetson Orin NX 16GB    | JetPack 6.x      | 100 TOPS  |
| Jetson Orin Nano Super | JetPack 6.x      | 67 TOPS   |

> 推荐使用 JetPack ≥ 5.1 版本，建议开启最大性能模式：

```bash
sudo nvpmodel -m 0
sudo jetson_clocks
```

---

## 3. Docker 快速启动 YOLO11（推荐）

最快方式：使用 Ultralytics 提供的预构建镜像。

```bash
sudo docker pull ultralytics/ultralytics:latest-jetson-jetpack6
sudo docker run -it --ipc=host --runtime=nvidia ultralytics/ultralytics:latest-jetson-jetpack6
```

>  内含 YOLO11、PyTorch、Torchvision、TensorRT 等依赖。

---

## 4. 本地安装 YOLO11（可选）

适合需要自定义环境的用户。

### 步骤一：准备 Python 环境

```bash
sudo apt update
sudo apt install python3-pip -y
pip install -U pip
```

### 步骤二：安装 YOLO11 软件包

```bash
pip install ultralytics[export]
```

### 步骤三：安装兼容的 PyTorch 与 Torchvision

上述ultralytics 安装程序将安装Torch 和 Torchvision。但是，通过 pip 安装的这两个软件包无法兼容在基于 ARM64 架构的 Jetson 平台上运行。因此，我们需要手动安装预编译的PyTorch pip wheel，并从源代码编译/安装 Torchvision。
以 JetPack 6.1 + Python 3.10 为例：

```bash
pip install https://github.com/ultralytics/assets/releases/download/v0.0.0/torch-2.5.0a0+872d972e41.nv24.08-cp310-cp310-linux_aarch64.whl
pip install https://github.com/ultralytics/assets/releases/download/v0.0.0/torchvision-0.20.0a0+afc54f7-cp310-cp310-linux_aarch64.whl
```

安装 cuSPARSELt 以解决torch 2.5.0依赖问题：
```bash
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/arm64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
sudo apt-get update
sudo apt-get -y install libcusparselt0 libcusparselt-dev
```
---

检查torch版本及GPU支持
```bash
python3 -c "import torch; print(torch.__version__)" # 2.5.0a0+872d972e41.nv24.08
python3 -c "import torch; print(torch.cuda.is_available())" # True
```

### 步骤四：安装 onnxruntime-gpu

您可以找到所有可用的 onnxruntime-gpu 包--按 JetPack 版本、Python 版本和其他兼容性细节组织--在 Jetson ZooONNX 运行时兼容性矩阵.在此，我们将下载并安装 onnxruntime-gpu 1.20.0 与 Python3.10 支持。

```bash
pip install https://github.com/ultralytics/assets/releases/download/v0.0.0/onnxruntime_gpu-1.20.0-cp310-cp310-linux_aarch64.whl
```

## 5. 使用 TensorRT 加速 YOLO11 推理

Ultralytics 支持将模型导出为 TensorRT 引擎文件（`.engine`），以提升推理性能。

### Python 示例

```bash
from ultralytics import YOLO

model = YOLO("yolo11n.pt")
model.export(format="engine")  # 生成 yolo11n.engine

trt_model = YOLO("yolo11n.engine")
results = trt_model("https://ultralytics.com/images/bus.jpg")
```
### CLI 示例
```bash
# Export a YOLO11n PyTorch model to TensorRT format
yolo export model=yolo11n.pt format=engine # creates 'yolo11n.engine'
# Run inference with the exported model
yolo predict model=yolo11n.engine source='https://ultralytics.com/images/bus.jpg'
```
---

## 6. 使用 DLA（深度学习加速器）

Jetson 部分设备内建 DLA，可进一步降低功耗并提高并发推理效率。
### Python 示例
```python
model.export(format="engine", device="dla:0", half=True)
```
### CLI 示例
```bash
# Export a YOLO11n PyTorch model to TensorRT format with DLA enabled (only works with FP16 or INT8)
# Once DLA core number is specified at export, it will use the same core at inference
yolo export model=yolo11n.pt format=engine device="dla:0" half=True # dla:0 or dla:1 corresponds to the DLA cores
# Run inference with the exported model on the DLA
yolo predict model=yolo11n.engine source='https://ultralytics.com/images/bus.jpg'
```

>  部分模型层可能无法全部在 DLA 上运行，会回退至 GPU。

## 7、object detection 示例

```python
import cv2
import time
from ultralytics import YOLO

# Load the TensorRT engine model (exported from YOLO11)
model = YOLO("yolo11n.engine")  # Replace with the path to your .engine model

# Open the USB camera (usually /dev/video0)
cap = cv2.VideoCapture(0)

# Set camera resolution (match model input size for best performance)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# Initialize FPS calculation variables
fps = 0.0
frame_count = 0
start_time = time.time()
# Check if the camera opened successfully
if not cap.isOpened():
    print("❌ Cannot open camera")
    exit()
print("📸 Real-time detection started. Press 'q' to quit.")
while True:
    # Read a frame from the camera
    ret, frame = cap.read()
    if not ret:
        break
    # Start time for inference
    t0 = time.time()
    # Run inference
    results = model(frame)
    # Plot the results (draw bounding boxes, labels, etc.)
    annotated = results[0].plot()
    # Calculate FPS
    frame_count += 1
    t1 = time.time()
    fps = 1. / (t1 - t0)
    # Draw FPS on the frame
    cv2.putText(annotated, f"FPS: {fps:.2f}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    # Show the annotated frame
    cv2.imshow("YOLO11 - TensorRT Real-time Detection", annotated)
    # Exit on 'q' key press
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break
# Release camera and close display window
cap.release()
cv2.destroyAllWindows()
```

![yolo_od](/img/yolo_od.png)
---

## 7. 基准测试性能对比

| 模型格式         | Orin Nano（ms） | mAP50-95 | Orin NX（ms） |
|------------------|----------------|----------|----------------|
| PyTorch          | 21.3           | 0.6176   | 19.5           |
| TorchScript      | 13.4           | 0.6100   | 13.03          |
| TensorRT (FP16)  | **4.91**       | 0.6096   | **4.85**       |
| TensorRT (INT8)  | **3.91**       | 0.3180   | 4.37           |

> 💡 TensorRT INT8 模式速度最快，FP16 精度更优。

---

## 8. 性能调优建议

| 优化项       | 建议命令或方法                |
|------------|---------------------------|
| 电源模式     | `sudo nvpmodel -m 0`       |
| CPU/GPU频率 | `sudo jetson_clocks`       |
| 系统监控     | `sudo pip install jetson-stats` → `jtop` |
| 内存管理     | 合理分配 swap、释放缓存         |

---

## 9. 常见问题

| 问题                           | 解决方法                                 |
|--------------------------------|------------------------------------------|
| 安装 PyTorch 后无法导入       | 确保使用为 Jetson 提供的 `.whl` 包           |
| TensorRT 模型推理速度不如预期 | 检查是否开启 `jetson_clocks` + 使用 FP16 模式 |
| 无法拉取 Docker 镜像           | 确保 Docker 正确安装并使用 `--runtime=nvidia` |
|虚拟环境下No module named 'tensorrt'|拷贝主机tensorrt到虚拟环境cp -r /usr/lib/python3.10/dist-packages/tensorrt your_venv/lib/python3.10/site-packages/

---

## 附录与参考资源

- [Ultralytics YOLO11 文档](https://docs.ultralytics.com/)
- [Jetson 开发者论坛](https://forums.developer.nvidia.com/)
- [PyTorch for Jetson 支持](https://forums.developer.nvidia.com/t/pytorch-for-jetson-version-1-14-now-available/72048)

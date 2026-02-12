# Pose Estimation

---

## 1. 概览

本文介绍如何在 **Jetson Orin** 平台（Nano / NX / AGX）上使用 **MediaPipe Python API** 实现实时 **姿态估计（Pose Estimation）**，同时启用 GPU 加速（如支持）。

姿态估计广泛应用于手势识别、健身追踪、人机交互等领域。

![mediapipe-series-solutions](/img/mediapipe-series-solutions.gif)

---

## 2. 系统要求

### 硬件

- Jetson Orin 系列（Nano、NX、AGX）  
- USB / CSI 摄像头（可选但推荐）

### 软件

- **操作系统**：Ubuntu 20.04 / 22.04 LTS（基于 JetPack）  
- **JetPack**：官方镜像（包含 CUDA、cuDNN、TensorRT）  
- **Python**：建议 3.8+  
- **MediaPipe（Python 版本）**：通过 pip 安装  
- **依赖项**：OpenCV、FFmpeg、GStreamer（用于摄像头/视频支持）

---

## 3. 环境配置

### 步骤 1：更新系统并安装依赖

```bash
sudo apt update && sudo apt upgrade
sudo apt install -y \
    python3-dev python3-pip python3-opencv \
    libopencv-dev \
    libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev \
    libavcodec-dev libavformat-dev libswscale-dev
```

### 步骤 2：安装 Python 包

```bash
python3 -m pip install --upgrade pip
pip3 install mediapipe opencv-python
```

如需使用 Jetson 的 GPU 进行加速，可启用 JetPack 附带的 TensorRT、CUDA，并确保系统资源配置最大性能：

```bash
sudo nvpmodel -m 0
sudo jetson_clocks
```

---

## 4. 运行姿态估计

![pose](/img/mediapipe_pose_0.png)

```python
import cv2
import mediapipe as mp

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

cap = cv2.VideoCapture(0)
while True:
    ret, frame = cap.read()
    if not ret:
        break
    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(image)

    if results.pose_landmarks:
        mp.solutions.drawing_utils.draw_landmarks(
            frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
    
    cv2.imshow("Pose Estimation", frame)
    if cv2.waitKey(5) & 0xFF == 27:
        break
cap.release()
cv2.destroyAllWindows()
```
![mediapipe_pose_1](/img/mediapipe_pose_1.png)
---

## 5. 手部追踪

![hand](/img/mediapipe_hand_0.png)

```python
import cv2
import mediapipe as mp
import time

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5)
mp_drawing = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        continue
    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(image)
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_drawing.draw_landmarks(image, hand_landmarks, mp_hands.HAND_CONNECTIONS)

    cv2.imshow("Hand Tracking", image)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```
![hand](/img/mediapipe_hand_1.png)

---

## 6. 性能与优化建议

| 模式       | FPS（AGX Orin） | GPU 使用率 | 是否加速   |
| ---------- | --------------- | ----------- | -------- |
| 默认 CPU   | ~5–10 FPS       | 低           | ❌        |
| JetPack GPU | ~25–40 FPS      | 中等         | ✅        |

### 优化建议

- 启动 `jetson_clocks` 和设置 `nvpmodel` 为最大性能  
- 使用 OpenCV 多线程读取摄像头帧  
- 减小图像尺寸以提升帧率（如 640x480）

---

## 7. 故障排查

| 问题           | 建议                                  |
| -------------- | ----------------------------------- |
| 导入错误         | 确保 `mediapipe` 已通过 pip 安装         |
| 摄像头无法打开     | 使用 `cv2.VideoCapture(0)` 手动测试摄像头 |
| 低 FPS         | 启用 GPU、降低图像分辨率、关闭图像绘制        |
| 无法显示窗口     | SSH 使用需加 `export DISPLAY=:0` 或使用 VNC |

---

## 8. 附录

### 参考资源
 
- [MediaPipe GitHub](https://github.com/google/mediapipe)
- [MediaPipe Samples](https://github.com/google-ai-edge/mediapipe-samples)

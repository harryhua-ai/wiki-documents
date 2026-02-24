---
sidebar_label: Model Training and Deployment
slug: /neoeyes-ne301-series/application-guide/model-training-and-deployment/model-training-and-deployment
description: 本文档详细介绍了NE301系列AI智能相机中的模型训练与部署流程，涵盖了YOLO训练环境搭建、模型训练、导出为TFLite格式、模型量化及评估，最后指导如何将量化后的模型文件部署到NE301设备，包括Makefile构建和Web UI上传两种方法，旨在帮助开发者实现高效的边缘AI模型部署。
keywords: [NE301, 模型训练, 模型部署, YOLO, TFLite, 模型量化, 边缘AI, AI相机, 固件上传, 深度学习]
tags: [NE301, 深度学习, 模型部署, AI应用, 教程]
---

# 模型训练与部署

## 1. 环境设置

### 1.1 安装 YOLO 训练环境

参考官方 [ultralytics](https://github.com/ultralytics/ultralytics) 安装指南。通过 Docker 安装：

```sh
sudo docker pull ultralytics/ultralytics:latest-export
```

### 1.2 进入 Docker 容器（使用 GPU）

```sh
sudo docker run -it --ipc=host --runtime=nvidia --gpus all -v ./your/host/path:/ultralytics/output ultralytics/ultralytics:latest-export /bin/bash
```

### 1.3 验证 YOLO 环境

```sh
yolo detect predict model=yolov8n.pt source='https://ultralytics.com/images/bus.jpg' device=0
```

```output
Downloading https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8n.pt to 'yolov8n.pt': 100% ━━━━━━━━━━━━ 6.2MB 1.6MB/s 4.0s
Ultralytics 8.3.213 🚀 Python-3.11.13 torch-2.8.0+cu128 CUDA:0 (NVIDIA A800 80GB PCIe, 81051MiB)
YOLOv8n summary (fused): 72 layers, 3,151,904 parameters, 0 gradients, 8.7 GFLOPs

Downloading https://ultralytics.com/images/bus.jpg to 'bus.jpg': 100% ━━━━━━━━━━━━ 134.2KB 1.2MB/s 0.1s
image 1/1 /ultralytics/bus.jpg: 640x480 4 persons, 1 bus, 1 stop sign, 64.5ms
Speed: 4.9ms preprocess, 64.5ms inference, 117.6ms postprocess per image at shape (1, 3, 640, 480)
Results saved to /ultralytics/runs/detect/predict
💡 Learn more at https://docs.ultralytics.com/modes/predict
```

### 1.4 安装 NE301 项目部署环境




要将模型部署到 NE301 设备，需要设置项目开发环境。请参考项目根目录中的[开发环境设置](../../2-NE300-MB01-development-board/2-software-guide/0-development-environment-setup.md)文档进行环境设置。

> 目前，Camthink NeoEyes NE301 AI Camera 固件已全部开源，想了解更多可查看——[NE 301开源地址](https://github.com/camthink-ai/ne301)。

## 2. 训练和导出模型

### 2.1 训练模型（可选）

```sh
# 基于 COCO 预训练模型
yolo detect train data=data.yaml model=yolov8n.pt epochs=100 imgsz=256 device=0

# 或从头开始训练
yolo detect train data=data.yaml model=yolov8n.yaml epochs=100 imgsz=256 device=0
```

### 2.2 导出为 TFLite 格式

```sh
yolo export model=yolov8n.pt format=tflite imgsz=256 int8=True data=data.yaml fraction=0.2
```

**示例输出：**
```output
TensorFlow SavedModel: export success ✅ 35.3s, saved as 'yolov8n_saved_model' (40.1 MB)

TensorFlow Lite: starting export with tensorflow 2.19.0...
TensorFlow Lite: export success ✅ 0.0s, saved as 'yolov8n_saved_model/yolov8n_int8.tflite' (3.2 MB)

Export complete (35.4s)
Results saved to /ultralytics
Predict:         yolo predict task=detect model=yolov8n_saved_model/yolov8n_int8.tflite imgsz=256 int8 
Validate:        yolo val task=detect model=yolov8n_saved_model/yolov8n_int8.tflite imgsz=256 data=coco.yaml int8 
Visualize:       https://netron.app
💡 Learn more at https://docs.ultralytics.com/modes/export
```

## 3. 模型量化

### 3.1 下载量化工具和数据集

- 下载量化脚本和配置文件：
  - [tflite_quant.py](https://github.com/STMicroelectronics/stm32ai-modelzoo-services/blob/main/tutorials/scripts/yolov8_quantization/tflite_quant.py)
  - [user_config_quant.yaml](https://github.com/STMicroelectronics/stm32ai-modelzoo-services/blob/main/tutorials/scripts/yolov8_quantization/user_config_quant.yaml)

- 下载量化验证数据集：[coco8](https://github.com/ultralytics/assets/releases/download/v0.0.0/coco8.zip)

### 3.2 配置量化参数

修改配置文件 `user_config_quant.yaml`：

```yaml
model:
    name: yolov8n_256
    uc: od_coco
    model_path: ./yolov8n_saved_model
    input_shape: [256, 256, 3]
quantization:
    fake: False
    quantization_type: per_channel
    quantization_input_type: uint8 # float
    quantization_output_type: int8 # float
    calib_dataset_path: ./coco8/images/val # 校准数据集，重要！可使用部分训练集
    export_path: ./quantized_models
pre_processing:
    rescaling: {scale : 255, offset : 0}
```

### 3.3 执行量化

```sh
# 安装依赖
pip install hydra-core munch

# 开始量化
python tflite_quant.py --config-name user_config_quant.yaml
```

**示例输出：**
```output
WARNING: All log messages before absl::InitializeLog() is called are written to STDERR
W0000 00:00:1760435045.538259     834 tf_tfl_flatbuffer_helpers.cc:365] Ignored output_format.
W0000 00:00:1760435045.538286     834 tf_tfl_flatbuffer_helpers.cc:368] Ignored drop_control_dependency.
I0000 00:00:1760435045.567572     834 mlir_graph_optimization_pass.cc:425] MLIR V1 optimization pass is not enabled
100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 32/32 [00:05<00:00,  5.46it/s]
fully_quantize: 0, inference_type: 6, input_inference_type: UINT8, output_inference_type: INT8
Quantized model generated: yolov8n_256_quant_pc_ui_od_coco.tflite
```

### 3.4 评估量化模型（可选）

```sh
yolo val model=./quantized_models/yolov8n_256_quant_pc_ui_od_coco.tflite data=coco.yaml imgsz=256
```

## 4. 部署模型到 NE301 设备

### 4.1 准备模型文件

将量化后的模型文件复制到项目的 `Model/weights/` 目录，并创建或修改相应的 JSON 配置文件（模型元数据）：

```sh
# 进入项目根目录
cd /path/to/ne301

# 复制模型文件
cp /your/path/quantized_models/yolov8n_256_quant_pc_ui_od_coco.tflite Model/weights/

# 创建相应的 JSON 配置文件
# 参考 Model/weights/ 目录中的示例文件
```

**创建 JSON 配置文件**

JSON 配置文件需要根据实际模型进行配置。关键配置项如下：

**关键配置项：**

1. **input_spec**: 输入规范
   - `width/height`: 模型输入尺寸（例如，256）
   - `data_type`: 输入数据类型（`uint8` 或 `float32`）
   - `normalization`: 归一化参数（uint8 通常使用 `mean: [0,0,0]`，`std: [255,255,255]`）

2. **output_spec**: 输出规范
   - `height/width`: 输出尺寸（检查实际模型输出，YOLOv8 通常使用 `height: 84`，`width: 1344`）
   - `data_type`: 输出数据类型（`int8` 或 `float32`）
   - `scale/zero_point`: 量化参数（必须与模型量化参数匹配）

3. **postprocess_type**: 后处理类型
   - `pp_od_yolo_v8_uf`: uint8 输入，float32 输出
   - `pp_od_yolo_v8_ui`: uint8 输入，int8 输出（推荐）

4. **postprocess_params**: 后处理参数
   - `num_classes`: 类别数量（COCO=80）
   - `class_names`: 类别名称列表（必须与训练顺序匹配）
   - `confidence_threshold`: 置信度阈值（0.0-1.0）
   - `iou_threshold`: NMS 的 IoU 阈值（0.0-1.0）
   - `max_detections`: 最大检测框数量
   - `total_boxes`: 总框数（YOLOv8 256x256 通常使用 1344）
   - `raw_output_scale/zero_point`: 必须与 `output_spec` 中的量化参数匹配

**参考示例：** 参考 `Model/weights/` 目录中现有的 JSON 文件作为模板。使用工具（如 Netron）查看模型输出尺寸。

### 4.2 使用 Makefile 构建和部署

项目提供了 Makefile 来简化构建和部署过程：

**步骤 1：配置模型**

修改 `Model/Makefile` 中的模型配置：

```makefile
MODEL_NAME = yolov8n_256_quant_pc_ui_od_coco
MODEL_TFLITE = $(WEIGHTS_DIR)/$(MODEL_NAME).tflite
MODEL_JSON = $(WEIGHTS_DIR)/$(MODEL_NAME).json
```

**步骤 2：构建模型**

```sh
# 在项目根目录
make model

# 构建结果在 build/ne301_Model.bin
```

**步骤 3：将模型导入设备**

方法1：直接烧录到设备

```sh
# 在项目根目录
make flash-model
```

方法2：Web UI（推荐）

通过这种方式更新模型可快速预览模型效果。

> 如果你对Web功能配置还不了解，可以查阅[NE301快速开始](../../1-quick-start.md)

<div style={{display: 'grid', gap: '12px', maxWidth: '520px', margin: '0 auto'}}>
  <figure style={{margin: 0, textAlign: 'center'}}>
    <img src="/img/ne301/quick-start/ne301-dep.png" alt="NE301 模型部署入口" style={{width: '100%', border: '1px solid #eee', borderRadius: '8px'}} />
    <figcaption>模型部署入口</figcaption>
  </figure>
  <figure style={{margin: 0, textAlign: 'center'}}>
    <img src="/img/ne301/quick-start/model-uploading.png" alt="模型上传区域" style={{width: '100%', border: '1px solid #eee', borderRadius: '8px'}} />
    <figcaption>模型上传区域</figcaption>
  </figure>
</div>

设备开启WiFi AP后，访问WebUI，可通过首页`功能调试（Feature Debugging）`点击 **upload** 进行模型升级和替换

<div style={{textAlign: 'center'}}>
  <figure style={{display: 'inline-block', margin: 0, textAlign: 'center'}}>
    <img src="/img/ne301/quick-start/change-model.gif" alt="模型替换演示" style={{maxWidth: '640px', width: '100%', border: '1px solid #eee', borderRadius: '8px'}} />
    <figcaption>模型替换操作演示</figcaption>
  </figure>
</div>

或者也可以通过`系统设置（System Setting）-固件升级（Firmware Upgrate）` 上传刚才构建好的模型，等待加载即可

<div style={{textAlign: 'center'}}>
  <figure style={{display: 'inline-block', margin: 0, textAlign: 'center'}}>
    <img src="/img/ne301/quick-start/ne301-ai-model-import.png" alt="模型固件升级入口" style={{maxWidth: '640px', width: '100%', border: '1px solid #eee', borderRadius: '8px'}} />
    <figcaption>固件升级上传页面</figcaption>
  </figure>
</div>

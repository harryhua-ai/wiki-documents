## stm32n6上训练和部署yolov8n

1、安装yolo运行环境，参考[ultralytics](https://github.com/ultralytics/ultralytics)官方安装说明，以下通过docker安装：

```sh
sudo docker pull ultralytics/ultralytics:latest-export
```

2、进入docker 容器（使用GPU）

```sh
sudo docker run -it --ipc=host --runtime=nvidia --gpus all -v ./your/host/path:/ultralytics/output ultralytics/ultralytics:latest-export /bin/bash
```

3、验证环境

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

4、训练&导出模型

a、训练(可选)

```sh
# 基于coco预训练模型
yolo detect train data=data.yaml model=yolov8n.pt epochs=100 imgsz=256 device=0
# 或原始模型
yolo detect train data=data.yaml model=yolov8n.yaml epochs=100 imgsz=256 device=0
```

b、导出tflite格式

```sh
yolo export  model=yolov8n.pt format=tflite imgsz=256 int8=True data=data.yaml fraction=0.2
```

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

5、量化模型

a、下载量化脚本及配置文件[tflite_quant.py](https://github.com/STMicroelectronics/stm32ai-modelzoo-services/blob/main/tutorials/scripts/yolov8_quantization/tflite_quant.py "tflite_quant.py")、[user_config_quant.yaml](https://github.com/STMicroelectronics/stm32ai-modelzoo-services/blob/main/tutorials/scripts/yolov8_quantization/user_config_quant.yaml "user_config_quant.yaml")

b、下载量化校验数据集[coco8](https://github.com/ultralytics/assets/releases/download/v0.0.0/coco8.zip)

c、修改配置文件user_config_quant.yaml：

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
    calib_dataset_path: ./coco8/images/val # 校准数据集，重要！可用部分训练集
    export_path: ./quantized_models
pre_processing:
  	rescaling: {scale : 255, offset : 0}
```

d、开始量化

```python
#安装依赖
pip install hydra-core munch
#量化
python tflite_quant.py --config-name user_config_quant.yaml
```

```output
WARNING: All log messages before absl::InitializeLog() is called are written to STDERR
W0000 00:00:1760435045.538259     834 tf_tfl_flatbuffer_helpers.cc:365] Ignored output_format.
W0000 00:00:1760435045.538286     834 tf_tfl_flatbuffer_helpers.cc:368] Ignored drop_control_dependency.
I0000 00:00:1760435045.567572     834 mlir_graph_optimization_pass.cc:425] MLIR V1 optimization pass is not enabled
100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 32/32 [00:05<00:00,  5.46it/s]
fully_quantize: 0, inference_type: 6, input_inference_type: UINT8, output_inference_type: INT8
Quantized model generated: yolov8n_256_quant_pc_ui_od_coco.tflite

```

e、评估模型(可选)

```sh
yolo val model=./quantized_models/yolov8n_256_quant_pt_ui_od_coco.tflite data=coco.yaml imgsz=256
```

6、部署模型

a、git clone aicam

```git
git clone https://github/camthink/aicam
```

b、生成模型固件包（先安装[stedgeai.exe](https://www.st.com.cn/zh/development-tools/stedgeai-core.html)）

```sh
cd aicam/Model
cp /your/path/quantized_models/yolov8n_256_quant_pt_ui_od_coco.tflite weights/

# 生成reloc model
./generate-reloc-model.sh -m weights/yolov8n_256_quant_pc_ui_od_coco.tflite -f yolov8_od@neural_art_reloc.json -o network_rel_yolov8_od.bin

# 制作package
python model_packager.py create --model network_rel_yolov8_od.bin --config weights/yolov8n_256_quant_pc_ui_od_coco.json --output ../bin/model_yolov8_od_coco.bin

```

c、部署（二选一）

a、stlink烧录

```sh
../Script/maker.sh flash ../bin/model_yolov8_od_coco.bin 0x70900000
```

b、web 升级 OTA

stm32n6上训练和部署yolov8n

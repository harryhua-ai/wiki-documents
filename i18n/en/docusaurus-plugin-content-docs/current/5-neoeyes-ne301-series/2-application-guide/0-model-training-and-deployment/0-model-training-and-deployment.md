## Train and Deploy YOLOv8n on STM32N6

1. **Install the Ultralytics environment**  
   Follow the [official instructions](https://github.com/ultralytics/ultralytics). The example below uses Docker:

   ```sh
   sudo docker pull ultralytics/ultralytics:latest-export
   ```

2. **Launch the container (GPU mode)**

   ```sh
   sudo docker run -it --ipc=host --runtime=nvidia --gpus all \
     -v ./your/host/path:/ultralytics/output \
     ultralytics/ultralytics:latest-export /bin/bash
   ```

3. **Verify the environment**

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

4. **Train and export**

   a. *Train (optional)*

   ```sh
   # Fine-tune from the Coco-pretrained weights
   yolo detect train data=data.yaml model=yolov8n.pt epochs=100 imgsz=256 device=0
   # Or train from scratch
   yolo detect train data=data.yaml model=yolov8n.yaml epochs=100 imgsz=256 device=0
   ```

   b. *Export to TFLite*

   ```sh
   yolo export model=yolov8n.pt format=tflite imgsz=256 int8=True data=data.yaml fraction=0.2
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

5. **Quantize the model**

   a. Download the quantization script and config file: [tflite_quant.py](https://github.com/STMicroelectronics/stm32ai-modelzoo-services/blob/main/tutorials/scripts/yolov8_quantization/tflite_quant.py "tflite_quant.py") and [user_config_quant.yaml](https://github.com/STMicroelectronics/stm32ai-modelzoo-services/blob/main/tutorials/scripts/yolov8_quantization/user_config_quant.yaml "user_config_quant.yaml").

   b. Download the calibration dataset [coco8](https://github.com/ultralytics/assets/releases/download/v0.0.0/coco8.zip).

   c. Edit `user_config_quant.yaml`:

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
       calib_dataset_path: ./coco8/images/val # Calibration set (can reuse part of the training set)
       export_path: ./quantized_models
   pre_processing:
        rescaling: {scale : 255, offset : 0}
   ```

   d. Run quantization

   ```python
   # Install dependencies
   pip install hydra-core munch
   # Quantize
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

   e. *Optional*: Evaluate the quantized model

   ```sh
   yolo val model=./quantized_models/yolov8n_256_quant_pt_ui_od_coco.tflite data=coco.yaml imgsz=256
   ```

6. **Deploy the model**

   a. Clone the AICam project

   ```git
   git clone https://github/camthink/aicam
   ```

   b. Generate the model firmware package (install [stedgeai.exe](https://www.st.com.cn/zh/development-tools/stedgeai-core.html) first)

   ```sh
   cd aicam/Model
   cp /your/path/quantized_models/yolov8n_256_quant_pc_ui_od_coco.tflite weights/

   # Create the relocatable model
   ./generate-reloc-model.sh -m weights/yolov8n_256_quant_pc_ui_od_coco.tflite \
     -f yolov8_od@neural_art_reloc.json \
     -o network_rel_yolov8_od.bin

   # Build the package
   python model_packager.py create \
     --model network_rel_yolov8_od.bin \
     --config weights/yolov8n_256_quant_pc_ui_od_coco.json \
     --output ../bin/model_yolov8_od_coco.bin
   ```

   c. Deploy to the device (choose one)

   - **ST-LINK flashing**

     ```sh
     ../Script/maker.sh flash ../bin/model_yolov8_od_coco.bin 0x70900000
     ```

   - **Web OTA**

     Upload `model_yolov8_od_coco.bin` through the NE301 Web UI to update the model in place.

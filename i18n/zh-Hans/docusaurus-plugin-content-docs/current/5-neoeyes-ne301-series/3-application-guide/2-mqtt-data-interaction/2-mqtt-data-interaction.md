# MQTT 数据交互与上报

本文档主要介绍如何配置 NeoEyes NE301 的 MQTT/MQTTS 功能，使用 MQTTX 客户端接收设备上报的数据，并详细解析设备上报的数据协议格式，以此来帮助你更好地理解设备发送的数据，从而来做上层应用。

## 简介

NeoEyes NE301 支持通过 MQTT 协议将 AI 推理结果和设备相关信息上报到指定的 MQTT Broker。开发者可以通过订阅相应的主题（Topic）来获取实时数据，进而进行二次开发或系统集成。

## 准备工作

在开始之前，请确保完成以下准备：

1.  **NE301 设备**：已开机并连接到网络（确保设备与 MQTT Broker 网络互通）。
2.  **MQTT Broker**：已部署 MQTT 服务器（如 EMQX, Mosquitto 等），或使用公共测试服务器。
3.  **MQTT 客户端工具**：推荐使用 [MQTTX](https://mqttx.app/) 进行调试和数据查看。

> 如果你还不了解 MQTT 协议的知识，可以参考 [MQTT 协议](https://mqtt.org/)进行学习。

## 1. 配置 NE301 MQTT 参数

登录 NE301 的 Web 管理界面，进入 **"应用管理" (Application Management)-> "MQTT/MQTTS"** 页面，配置以下参数：

*   **Broker Address**: MQTT 服务器 IP 地址或域名。
*   **Port**: 服务器端口（默认为 1883）。
*   **Client ID**: 设备唯一标识（可选，默认通常为设备序列号，请注意不要与客户端ID重复防止造成冲突）。
*   **Username / Password**: 如果服务器需要认证，请输入用户名和密码。
*   **Data Receiving Topic**: 数据下发的主题（例如 `ne301/2A207D/down/control`），用于设备接受控制指令的主题，设备会默认生成一个，如果需要自定义，可以修改。
*   **Data Reporting Topic**: 数据上报的主题（例如 `ne301/2A207D/upload/report`），用于设备上报数据的主题，设备会默认生成一个，如果需要自定义，可以修改。


配置完成后，点击 **"保存" (Save)**，设备将尝试连接 MQTT 服务器。

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '8px 0 16px' }}>
  <img src="/img/ne301/application-guide/mqtt-data-interaction/mqtt.png" alt="MQTT 配置" style={{ flex: '1 1 280px', maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/application-guide/mqtt-data-interaction/communication.png" alt="MQTTS 配置" style={{ flex: '1 1 280px', maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

> 如需加密，切换为MQTTS进行配置。

## 2. 配置 MQTTX 客户端

打开 MQTTX 软件，点击 **"+"** 新建连接：

1.  **Name**: 自定义连接名称（例如 `NE301_Monitor`）。
2.  **Host**: 输入与设备配置相同的 MQTT Broker 地址。
3.  **Port**: 输入端口（如 1883）。
4.  点击 **"Connect"** 按钮连接服务器。

<div style={{ textAlign: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/application-guide/mqtt-data-interaction/emqx-new-connection.png" alt="MQTTX 新建连接" style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

连接成功后，添加订阅：

1.  点击 **"New Subscription"**。
2.  **Topic**: 输入设备配置的上报 Topic（例如 `ne301/device/data`）。
3.  点击 **"Confirm"**。

<div style={{ textAlign: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/application-guide/mqtt-data-interaction/emqx-sub.png" alt="MQTTX 订阅主题" style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

## 3. 触发抓拍与数据接收

### 触发方式
您可以通过以下方式触发设备抓拍和推理：

*   **Web UI**: 在 "Live" 页面点击抓拍按钮。
*   **物理按键**: 按下设备侧面上的相机按键。
*   **传感器/IO 触发**: 通过 IO 接口触发抓拍。
*   **定时触发**: 设置定时任务。
*   **远程控制**: 通过 MQTT控制指令远程触发抓拍。


### 接收数据
当设备完成推理后，MQTTX 客户端将收到一条 JSON 格式的消息。如下图所示：

<div style={{ textAlign: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/application-guide/mqtt-data-interaction/mqtts-ex.png" alt="数据接收示例" style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

## 4. 数据协议格式解析

设备上报的数据采用标准的 JSON 格式，包含了设备信息、时间戳以及 AI 推理结果等信息。

### 示例数据

```json
{
  "metadata": {
    "image_id": "cam01_1766132582",
    "timestamp": 1766132582,
    "format": "jpeg",
    "width": 1280,
    "height": 720,
    "size": 61880,
    "quality": 60
  },
  "device_info": {
    "device_name": "NE301-2A207D",
    "mac_address": "44:9f:da:2a:20:7d",
    "serial_number": "SN202500001",
    "hardware_version": "V1.1",
    "software_version": "1.0.1.1064",
    "power_supply_type": "battery",
    "battery_percent": 41,
    "communication_type": "wifi"
  },
  "ai_result": {
    "model_name": "YOLOv8 Nano Object Detection Model - COCO 80 Classes (Int8)",
    "model_version": "1.0.0",
    "inference_time_ms": 50,
    "confidence_threshold": 0.5,
    "nms_threshold": 0.5,
    "ai_result": {
      "type": 1,
      "detections": [
        {
          "index": 0,
          "class_name": "bottle",
          "confidence": 0.57646054029464722,
          "x": 0.11801555752754211,
          "y": 0.052199184894561768,
          "width": 0.27234357595443726,
          "height": 0.93958532810211182
        }
      ],
      "detection_count": 1,
      "poses": [],
      "pose_count": 0,
      "type_name": "object_detection"
    }
  },
  "image_data": "data:image/jpeg;base64,...",
  "encoding": "base64"
}
```

### 字段说明

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| **metadata** | Object | 图片元数据 |
| `metadata.image_id` | String | 图片唯一ID |
| `metadata.timestamp` | Number | 抓拍时间戳（Unix 时间戳） |
| `metadata.format` | String | 图片格式 |
| `metadata.width` | Number | 图片宽度 |
| `metadata.height` | Number | 图片高度 |
| `metadata.size` | Number | 图片大小（字节） |
| `metadata.quality` | Number | 图片质量压缩比 |
| **device_info** | Object | 设备信息 |
| `device_info.device_name` | String | 设备名称 |
| `device_info.mac_address` | String | MAC 地址 |
| `device_info.serial_number` | String | 设备序列号 |
| `device_info.hardware_version` | String | 硬件版本 |
| `device_info.software_version` | String | 软件版本 |
| `device_info.power_supply_type` | String | 供电类型 |
| `device_info.battery_percent` | Number | 电池电量百分比 |
| `device_info.communication_type` | String | 通讯类型 |
| **ai_result** | Object | AI 推理结果信息 |
| `ai_result.model_name` | String | 模型名称，包含量化类型等信息 |
| `ai_result.model_version` | String | 模型版本号 |
| `ai_result.inference_time_ms` | Number | 推理耗时（毫秒） |
| `ai_result.confidence_threshold` | Number | 置信度阈值 |
| `ai_result.nms_threshold` | Number | NMS 阈值 |
| `ai_result.ai_result` | Object | 具体的推理结果数据 |
| `ai_result.ai_result.type` | Number | 结果类型标识 |
| `ai_result.ai_result.type_name` | String | 任务类型名称 |
| `ai_result.ai_result.detection_count` | Number | 检测到的目标数量 |
| `ai_result.ai_result.detections` | Array | 检测目标列表 |
| `detections[].index` | Number | 目标索引 |
| `detections[].class_name` | String | 目标类别名称 |
| `detections[].confidence` | Number | 置信度（0-1） |
| `detections[].x` | Number | 归一化中心点 X 坐标 |
| `detections[].y` | Number | 归一化中心点 Y 坐标 |
| `detections[].width` | Number | 归一化宽度 |
| `detections[].height` | Number | 归一化高度 |
| **image_data** | String | Base64 编码的图片数据 |
| **encoding** | String | 编码方式 |

通过解析该 JSON 数据，你可以轻松获取画面中出现的目标信息及设备当前的运行状态。


## 5. FAQ

### 1. NE301设备上报的数据不是我想要的，怎么办？

目前NE301设备不支持数据格式的修改，如果您需要自定义上报的数据格式或者相关应用逻辑，可以考虑自行二次开发或许联系我们进行定制开发。

### 2. 配置了MQTT，但是设备没有连接到MQTT服务器，怎么办？

请检查设备是否配置了正确的MQTT参数，包括Broker地址、端口、用户名和密码等。如果配置正确，但是设备仍然无法连接到MQTT服务器，请检查MQTT服务器是否正常运行，同时确认设备是否能正常访问网络。

### 3. MQTT已连接，但是没有数据上报，怎么办？

请排查设备当前的网络是否稳定，设备是否能正常访问网，同时需要检查MQTT服务端是否正常运行，确认后断开MQTT连接重新尝试。





---
title: AI 加速 QSC 合规：智能捕虫监测
description: 本案例展示了如何通过边缘 AI 方案管理捕虫箱状态，将“定时清理”转变为“按需驱动”，提升连锁快餐店的 QSC 管理水平。
tags: [Camthink, NeoEye 301, AI, QSC, 智能监测, Home Assistant]
sidebar_label: AI-Driven QSC For Chain Restaurant
sidebar_position: 6
---

# 案例 - **AI加速QSC合规：智能捕虫监测**

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_1.jpg)

## 1. 前言

**[CamThink](https://www.camthink.ai/?utm_source=wiki&utm_medium=social&utm_campaign=use_case&utm_content=trapbox-monitor-20260203)** 是 **[Milesight](https://www.milesight.com)** 推出的全新开发者品牌，旨在让边缘 AI 对每个人都变得更简单。我们为社区建设者和企业工程师构建开放、开发者友好的边缘 AI 硬件，并帮助他们从早期原型过渡到可靠的实际部署——加速您在边缘 AI 领域的战略实施。

**Camthink** **[NeoEye 301](https://www.camthink.ai/product/neoeyes-301/?utm_source=wiki&utm_medium=social&utm_campaign=use_case&utm_content=trapbox-monitor-20260203)** 搭载了带有 Neural-ART NPU 的 STM32N6 (Cortex-M55) 处理器，能够以极低功耗提供实时 AI 推理和专业级图像处理。

**[Home Assistant](https://www.home-assistant.io/integrations/)** 是一个免费、开源的家庭自动化平台，旨在成为智能应用的中央“大脑”。它优先考虑**本地控制**和**隐私**。截至 2026 年初，通过“语音之年”和“集体智慧”倡议，Home Assistant 已变得显著更加易用。

在全球连锁快餐世界中，**QSC（质量、服务、清洁)** 不仅是一个指标，更是品牌信任的基石。在“清洁”支柱中，昆虫管理是最关键但又最耗费人力的任务之一。

在本案例中，我们将向您展示如何通过边缘 AI 方案管理捕虫箱状态，将“**定时清理**”转变为“**按需驱动**”。

## 2. 需求

**硬件：**

- Camthink [NeoEye 301](https://www.camthink.ai/product/neoeyes-301/?utm_source=wiki&utm_medium=social&utm_campaign=use_case&utm_content=trapbox-monitor-20260203)，超低功耗视觉 AI 相机。建议s使用蜂窝（Cellular）版本。

**软件平台：**

- **Camthink** **[AI Tool Stack](https://github.com/camthink-ai/AIToolStack?utm_source=wiki&utm_medium=social&utm_campaign=use_case&utm_content=trapbox-monitor-20260203)**：端到端 AI 工具集，涵盖从数据采集、标注、训练、量化到部署的完整工作流程。
- **HomeAssistant [平台**](https://www.home-assistant.io/installation/)：您需要提前在服务器中安装。

## 3. 配置

在这一部分，我们将逐步向您展示如何实现这个完整的用例。

### 3.1 正确安装 NE301

首先，确保已正确安装插有 SIM 卡的 **Camthink NE301**，长按按钮 2-3 秒以激活 WiFi。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_3.jpg)

### 3.2 配置网络与 MQTT 数据转发

连接以 `NE301_<MAC 后 6 位>` 开头的 WiFi 热点，输入默认 IP 地址：`192.168.10.10`

- **默认用户名**：`admin`
- **默认密码**：`hicamthink`


| ![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_4.jpg) | ![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_5.jpg) |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |


点击 **Login** 查看带有详细设置的实时视图。导航至 **System settings** 连接网络访问。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_6.jpg)

Camthink NE301 支持 WiFi 和蜂窝模块。选择合适的方法确保网络畅通。

导航至 **Application Management** 配置数据和图片的转发位置。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_7.jpg)

输入您自己的 MQTT 代理或 AI Tool Stack 服务器的详细信息：

- **Server address**：MQTT 代理的 IP 地址。
- **Port**：MQTT 服务器端口，默认值：1883。
- **Data Receiving Topic**：用于控制和触发图像捕捉的下行命令主题。
- **Data Sending Topic**：用于传输数据和图片的带上行命令主题。
- **Client id**：MQTT 客户端 ID，部分服务器会验证此值。
- **Username**：加入 MQTT 服务器的用户名。
- **Password**：加入 MQTT 服务器的密码。

### 3.3 采集图像、训练并量化模型

登录您自己的 AI Tool Stack 服务器以创建新项目。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_8.jpg)

点击 **Create New AI Model Project**，输入名称和描述：

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_9.jpg)![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_10.jpg)

打开此项目并绑定用于图像采集的设备。您需要先创建此设备。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_11.jpg)![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_12.jpg)

NE301 拍摄的图片将按配置上传。

如果您已准备好图像，直接上传到此平台进行模型训练即可。

在开始训练模型之前，在此处创建类别（Class）。在本例中，我们创建两个类别来识别**捕虫箱**内的**粘纸**是“**有效（Effective）**”还是“**严重-需更换（Critical-Replacement）**”。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_13.jpg)

选择合适的类型来标记对象。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_14.jpg)

逐一标记，确保所有对象都标记正确。

如果您已有数据集，直接在此处上传。

点击“**Train Model**”开始训练。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_15.jpg)

点击“**New Training**”创建新任务，保持所有默认设置。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_16.jpg)

开始训练。这需要一些时间。


| ![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_17.jpg) | ![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_18.jpg) |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |


要将模型部署到 NE301，我们需要在将其上传到设备之前对其进行量化。

点击 **Quantize** 按钮。


| ![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_19.jpg) | ![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_20.jpg) |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |


点击开始，保持默认设置。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_21.jpg)

量化完成后，**NE301 模型包** (*.bin) 即为精确量化的模型。

点击下载。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_22.jpg)

您也可以在此处测试模型以确认一切正常。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_23.jpg)

### 3.4 验证并部署新模型

让我们回到设备上传新模型。

点击上传按钮进行安装。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_24.jpg)


| ![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_25.jpg) | ![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_26.jpg) |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |


完成后，货架上的芯片组被正确标记。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_27.jpg)

您可以上传更多图片来验证性能。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_28.jpg)

### 3.5 配置 HomeAssistant 应用

为了让数据对客户更有价值，我们选择 HomeAssistant 进行集成和可视化。您也可以连接到其他第三方平台。

打开“配置” -> “设备与服务”以安装 MQTT 集成。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_29.jpg)

点击 **添加集成** 按钮，搜索并安装 MQTT。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_30.jpg)

直接输入 MQTT 进行搜索。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_31.jpg)![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_32.jpg)

选择第二个，并输入在 NE301 中配置的 MQTT 代理信息。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_33.jpg)![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_34.jpg)

提交保存。MQTT 连接已就绪。

在本指南中，我们将尝试通过直接编辑配置文件 **/homeassistant/configuration.yaml** 来创建 MQTT 设备。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_35.jpg)

以下是本指南中的配置详情：

```yaml
# Loads default set of integrations. Do not remove.
default_config:

# Load frontend themes from the themes folder
frontend:
  themes: !include_dir_merge_named themes

automation: !include automations.yaml
script: !include scripts.yaml
scene: !include scenes.yaml

mqtt:
  sensor:
    # 1. 监测状态 (来自 class_name)
    - name: "Monitoring Status"
      unique_id: "ne301_monitoring_status"
      state_topic: "device/76b2fc32/uplink"
      value_template: >-
        {% if value_json.ai_result.ai_result.detections | length > 0 %}
          {{ value_json.ai_result.ai_result.detections[0].class_name }}
        {% else %}
          None
        {% endif %}
      icon: "mdi:image-filter-center-focus"
    # 2. 电池电量 (来自 battery_percent)
    - name: "Battery"
      unique_id: "ne301_battery"
      state_topic: "device/76b2fc32/uplink"
      value_template: "{{ value_json.device_info.battery_percent }}"
      device_class: battery
      unit_of_measurement: "%"
      state_class: measurement
    # 3. 最后事件时间 (来自 timestamp)
    - name: "Last Event"
      unique_id: "ne301_last_event"
      state_topic: "device/76b2fc32/uplink"
      value_template: "{{ (value_json.metadata.timestamp | int) | timestamp_local }}"
      device_class: timestamp
    # 4. 传感器名称 (来自 device_name)
    - name: "Sensor Name"
      unique_id: "ne301_device_name_info"
      state_topic: "device/76b2fc32/uplink"
      value_template: "{{ value_json.device_info.device_name }}"
      icon: "mdi:id-card"
```

您需要将 **name**、**state_topic** 以及对应的类别值修改为您自己的。

通过在 **开发者工具** 页面点击“**重新加载手动配置的 MQTT 实体**”来应用更改。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_36.jpg)![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_37.jpg)

您会发现传感器已正确创建。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_38.jpg)

## 4. 快速测试

让我们开始监控垃圾箱的状态。状态值将正确显示：

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_39.jpg)![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_40.jpg)![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_41.jpg)

您还可以在历史记录中查看更多详情：

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_42.jpg)

HomeAssistant 平台支持其他应用触发告警，您可以对其进行配置以实现全面管理。

## 常见问题 (Q&A)

- **问：我可以使用相同的 MQTT 代理和 [Camthink AI Tool Stack](https://github.com/camthink-ai/AIToolStack) 进行模型训练和量化吗？**  
答：本指南中的服务器仅供内部使用。您需要自行安装自己的 AI Tool Stack。
- **问：由于芯片比货架小，如何提高模型的性能？**  
答：您可以尝试在量化过程中将 **Input Size** 设置为 **320**。

![](/img/ne301/application-guide/6-chain-restaurant-qsc-compliance/image_43.jpg)

- **问：如何在 HomeAssistant 中设置值模板？**  
答：您可以访问 HomeAssistant [官网](https://www.home-assistant.io/docs/configuration/templating/#using-value-templates-with-mqtt) 获取详细信息。以下是 NE301 上报数据的示例：

```json
{
  "metadata": {
    "image_id": "cam01_1767603614",
    "timestamp": 1770084900,
    "format": "jpeg",
    "width": 1280,
    "height": 720,
    "size": 38692,
    "quality": 60
  },
  "device_info": {
    "device_name": "NE301-2A38A5",
    "mac_address": "44:9f:da:2a:38:a5",
    "serial_number": "SN202500001",
    "hardware_version": "V1.1",
    "software_version": "1.0.1.1146",
    "power_supply_type": "full-power",
    "battery_percent": 100,
    "communication_type": "wifi"
  },
  "ai_result": {
    "model_name": "YOLOv8 Nano Object Detection Model",
    "model_version": "1.0.0",
    "inference_time_ms": 50,
    "confidence_threshold": 0.23999999463558197,
    "nms_threshold": 0.55000001192092896,
    "ai_result": {
      "type": 1,
      "detections": [
        {
          "index": 0,
          "class_name": "Effective",
          "confidence": 0.20715469121932983,
          "x": 0.0040618181228637695,
          "y": 0.052804142236709595,
          "width": 0.9992167949676514,
          "height": 0.8042476177215576
        }
      ],
      "detection_count": 1,
      "poses": [],
      "pose_count": 0,
      "type_name": "object_detection"
    },
    "encoding": "base64"
  }
}
```
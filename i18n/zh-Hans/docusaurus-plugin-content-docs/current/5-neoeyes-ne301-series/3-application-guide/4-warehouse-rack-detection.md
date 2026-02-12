---
sidebar_label: Warehouse Rack Detection
---

# 案例 - 仓库货架监测

## 1. 前言

**CamThink** 是迈视科技（Milesight）推出的一个全新的以开发者为中心的品牌，旨在让边缘 AI 对每个人来说都更加简单。我们为社区建设者和企业工程师打造开放、对开发者友好的边缘 AI 硬件，并帮助他们从早期原型过渡到可靠的实际部署——加速您在边缘 AI 领域的战略实施。

**Camthink NeoEye 301** 由搭载 Neural-ART™ NPU 的 STM32N6 (Cortex-M55) 处理器提供支持，可实现实时 AI 推理和专业级图像处理，且功耗极低。

**Home Assistant** 是一个免费的开源家庭自动化平台，旨在成为您智能应用的中央“大脑”，它优先考虑本地控制和隐私。截至 2026 年初，Home Assistant 通过其“语音之年”和“集体智慧”倡议，变得更加用户友好。

在这个用例中，我们将向您展示如何管理**仓库货架状态**，适用于智能零售和仓储行业。

## 2. 需求

**硬件：**
- **Camthink NeoEye 301**，超低功耗视觉 AI 相机。

**软件平台：**
- **Camthink AI 工具栈**，一个端到端的 AI 工具集，涵盖从数据收集、标注、训练、量化到部署的整个工作流程。
- **HomeAssistant 平台**，您需要提前在服务器中安装它。

## 3. 配置

在这一部分，我们将逐步向您展示如何实现这个完整的用例。

### 3.1 正确安装 NE301

首先，正确安装 Camthink NE301，长按按钮 2 至 3 秒以激活 WiFi。


<div style={{display: "flex", gap: "10px", justifyContent: "center", margin: "20px 0"}}>
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image1.jpeg" alt="image1" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image2.png" alt="image2" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
</div>
### 3.2 配置网络和 MQTT 数据转发

连接以 `NE301_<MAC后6位>` 开头的 WiFi 热点，输入默认 IP 地址：`192.168.10.10`


<img src="/img/ne301/application-guide/warehouse-rack-detection/image3.png" alt="image3" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
<img src="/img/ne301/application-guide/warehouse-rack-detection/image4.png" alt="image4" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
- 默认用户名：`admin`
- 默认密码：`hicamthink`

点击登录以查看带有详细设置的实时视图。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image5.png" alt="image5" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
导航到 **系统 (Systems)** 设置以连接网络。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image6.png" alt="image6" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
> Camthink NE301 支持 WiFi 和蜂窝模块。选择相应的方法以确网络连接正常。

导航到 **应用管理 (Application Management)** 以配置数据和图片的转发位置。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image7.png" alt="image7" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
输入您自己的 MQTT 代理或 AI 工具栈服务器的详细信息：

- **服务器地址 (Server address)**：MQTT 代理的 IP 地址。
- **端口 (Port)**：MQTT 服务器的端口，默认值：`1883`
- **数据接收主题 (Data Receiving Topic)**：用于控制和触发图像捕获的下行链路命令主题。
- **数据上报主题 (Data Reporting Topic)**：用于传输数据和图片的上行命令主题。
- **客户端 ID (Client id)**：MQTT 客户端 ID，部分服务器会验证该值。
- **用户名 (Username)**：连接 MQTT 服务器的用户名，请根据服务器的需求输入。
- **密码 (Password)**：连接 MQTT 服务器的密码，请根据服务器的需求输入。

### 3.3 收集图像，训练并量化模型

登录您自己的 AI 工具栈服务器以创建新项目。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image8.png" alt="image8" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
点击 **创建新 AI 模型项目 (Create New AI Model Project)**，输入名称和描述：


<div style={{display: "flex", gap: "10px", justifyContent: "center", margin: "20px 0"}}>
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image9.png" alt="image9" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image10.png" alt="image10" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
</div>
打开此项目并绑定用于图像采集的设备，您需要先创建此设备。


<div style={{display: "flex", gap: "10px", justifyContent: "center", margin: "20px 0"}}>
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image11.png" alt="image11" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image12.png" alt="image12" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
</div>
NE301 拍摄的冰箱（货架）图片将按配置进行上行传输。
如果您已经准备好图像，直接上传到本平台即可进行模型训练。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image13.png" alt="image13" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
在开始训练模型之前，在这里创建一个类 (Class)，我们将其命名为 'Chipset'。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image14.png" alt="image14" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
选择合适的类型来标记对象。


<div style={{display: "flex", gap: "10px", justifyContent: "center", margin: "20px 0"}}>
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image15.png" alt="image15" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image16.png" alt="image16" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
</div>
逐个进行操作，以确保所有对象都被正确标记。
如果您已经有数据集，直接在这里上传即可。

点击 **训练模型 (Train Model)** 开始训练。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image17.png" alt="image17" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
点击 **新训练 (New Training)** 以创建新任务，保持所有默认设置。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image18.png" alt="image18" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
然后开始训练。这需要一点时间。


<div style={{display: "flex", gap: "10px", justifyContent: "center", margin: "20px 0"}}>
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image19.png" alt="image19" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image20.png" alt="image20" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
</div>
要将模型部署到 NE301 中，我们需要在将其上传到设备之前对其进行量化。
点击 **量化 (Quantize)** 按钮。


<div style={{display: "flex", gap: "10px", justifyContent: "center", margin: "20px 0"}}>
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image21.png" alt="image21" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image22.png" alt="image22" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
</div>
点击它开始，这里保持默认设置即可。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image23.png" alt="image23" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
完成它需要一点时间。
NE301 模型包 (*.bin) 是精确量化的模型。点击下载。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image24.png" alt="image24" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
您也可以在这里测试模型，以确认是否一切正常。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image25.png" alt="image25" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
### 3.4 验证并部署新模型

让我们回到设备上上传新模型。
点击 **上传 (Upload)** 按钮进行安装。


<div style={{display: "flex", gap: "10px", justifyContent: "center", margin: "20px 0"}}>
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image26.png" alt="image26" style={{width: "32%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image27.png" alt="image27" style={{width: "32%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image28.png" alt="image28" style={{width: "32%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
</div>
完成后，货架上的芯片组 (Chipset) 将被正确标记。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image29.png" alt="image29" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
您可以上传更多图片来验证性能。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image30.png" alt="image30" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
### 3.5 配置 HomeAssistant 应用程序

为了让数据对客户更有价值，我们选择 HomeAssistant 进行集成和可视化。您也可以将其连接到其他第三方平台。

打开 **设备与服务 (Devices & Services)** 以安装 MQTT 集成。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image31.png" alt="image31" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
点击 **添加集成 (Add Integration)** 按钮以安装 MQTT 插件。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image32.png" alt="image32" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
只需输入 MQTT 即可搜索到它。


<div style={{display: "flex", gap: "10px", justifyContent: "center", margin: "20px 0"}}>
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image33.png" alt="image33" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image34.png" alt="image34" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
</div>
选择第二个，并输入在 NE301 中配置的 MQTT 代理。


<div style={{display: "flex", gap: "10px", justifyContent: "center", margin: "20px 0"}}>
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image35.png" alt="image35" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image36.png" alt="image36" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
</div>
提交以保存。MQTT 连接已就绪。

创建 MQTT 设备，以确保数据能够被正确订阅。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image37.png" alt="image37" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
其他设置保持默认。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image38.png" alt="image38" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
选择类型 'Number' 并在此处输入实体名称。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image39.png" alt="image39" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
保持这些设置为空。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image40.png" alt="image40" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
请在此正确输入 MQTT 的具体细节，尤其是下行和上行主题，以及值模板 (value template)。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image41.png" alt="image41" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
```jinja2
{{ value_json.ai_result.ai_result.detection_count }}
```

有关如何设置值模板的更多详细信息，您可以访问 HomeAssist 网站或联系我们。
点击 **下一步 (Next)** 并保存。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image42.png" alt="image42" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
关于 Chipset 数量的第一个实体已创建完成。
让我们创建第二个实体来识别名称。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image43.png" alt="image43" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
输入 'name' 的值模板。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image44.png" alt="image44" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
这里的 Value Name 模板有所不同。

```jinja2
{{ value_json.ai_result.ai_result.detections[0].class_name }}
```

点击 **保存更改 (Save Changes)** 以保存它。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image45.png" alt="image45" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
刷新页面以查看数值正确的活动状态。


<div style={{display: "flex", gap: "10px", justifyContent: "center", margin: "20px 0"}}>
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image46.png" alt="image46" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
  <img src="/img/ne301/application-guide/warehouse-rack-detection/image47.png" alt="image47" style={{width: "48%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
</div>
HomeAssistant 支持在仪表盘上查看，包括历史记录。

## 4. 快速测试

让我们拿些饮料来测试一下。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image48.png" alt="image48" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
饮料 (Baverage) 的数量立即改变。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image49.png" alt="image49" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
这些数值也会在 HomeAssistant 平台上更新，客户可以查看所有历史数据。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image50.png" alt="image50" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
HomeAssistant 平台支持其他应用程序触发警报，您可以对其进行配置以实现全面管理。

## 5. Q&A

**问：我可以使用相同的 MQTT 代理和 Camthink AI 工具栈进行模型训练和量化吗？**

答：本指南中的服务器仅供内部使用。您需要自行安装自己的 AI 工具栈。

**问：由于 Chipset 较小，如何提高模型的性能？**

答：您可以在量化过程中尝试将输入大小 (Input Size) 选项设置为 320。


<img src="/img/ne301/application-guide/warehouse-rack-detection/image51.png" alt="image51" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />
**问：如何在 HomeAssistant 中设置值模板？**
答：您可以访问 HomeAssistant 的网站以获取有关如何使用它的详细信息。以下是 NE301 报告数据的示例：

```json
{
    "metadata": {
        "image_id": "cam01_1767513409",
        "timestamp": 1767513409,
        "format": "jpeg",
        "width": 1280,
        "height": 720,
        "size": 51464,
        "quality": 60
    },
    "device_info": {
        "device_name": "NE301-2A3E75",
        "mac_address": "44:9f:da:2a:3e:75",
        "serial_number": "SN202500001",
        "hardware_version": "V1.1",
        "software_version": "1.0.1.1146",
        "power_supply_type": "full-power",
        "battery_percent": 0,
        "communication_type": "wifi"
    },
    "ai_result": {
        "model_name": "YOLOv8 Nano Object Detection Model",
        "model_version": "1.0.0",
        "inference_time_ms": 50,
        "confidence_threshold": 0.5,
        "nms_threshold": 0.5,
        "ai_result": {
            "type": 1,
            "detections": [{
                "index": 0,
                "class_name": "Chipset",
                "confidence": 0.9015386700630188,
                "x": 0.0039368569850921631,
                "y": 0.17518982291221619,
                "width": 0.53541159629821777,
                "height": 0.82280164957046509
            }],
            "detection_count": 1,
            "poses": [],
            "pose_count": 0,
            "type_name": "object_detection"
        }
    },
    "image_data": "data:image/jpeg;base64,/9j/2wBDAA0J",
    "encoding": "base64"
}
```

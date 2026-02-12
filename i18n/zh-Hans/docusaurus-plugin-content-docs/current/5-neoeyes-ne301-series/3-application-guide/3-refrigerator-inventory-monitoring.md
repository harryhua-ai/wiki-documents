---
sidebar_label: Refrigerator Inventory Monitoring
---

# 冰箱库存监控应用指南

## 应用简介

CamThink是迈视科技推出的一个全新的以开发者为中心的品牌，旨在让边缘AI对每个人来说都更加简单。我们为社区建设者和企业工程师打造开放、对开发者友好的边缘AI硬件，并帮助他们从早期原型过渡到可靠的实际部署——加速您在边缘AI领域的战略实施。

CamthinkNeoEye 301由搭载Neural-ART NPU的STM32N6（Cortex-M55）处理器提供支持，可实现实时AI推理和专业级图像处理，且功耗极低。

Home Assistant是一个免费的开源家庭自动化平台，旨在成为您智能应用的中央“大脑”，它优先考虑本地控制和隐私。截至2026年初，Home Assistant通过其“语音之年”和“集体智慧”倡议，变得更加用户友好。

在这个用例中，我们将向您展示如何管理智能零售和仓储行业的冰箱饮料状态。

## 硬件与软件需求

**硬件：**
- CamthinkNeoEye 301，超低功耗视觉AI相机。

**软件平台：**
- **Camthink AI工具栈**：一个端到端的AI工具集，涵盖从数据收集、标注、训练、量化到部署的整个工作流程。
- **HomeAssistant平台**：你需要提前在服务器中安装它。

## 操作指南

在这部分，我们将逐步向您展示如何实现这个完整的用例。

### 正确安装NE301

首先，正确安装camthink NE301，长按按钮2至3秒以激活WiFi。

<div style={{display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0'}}>
  <img src="/img/ne301/application-guide/monitoring/refrigerator1.png" alt="refrigerator1" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
  <img src="/img/ne301/application-guide/monitoring/refrigerator2.png" alt="refrigerator2" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
</div>

### 配置网络和MQTT数据转发

连接以 `NE301_<最后6位MAC数字>` 开头的WiFi端点，输入默认IP地址：192.168.10.10

<img src="/img/ne301/application-guide/monitoring/connect.png" alt="connect" style={{display: 'block', margin: '20px auto', maxWidth: '40%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
<img src="/img/ne301/application-guide/monitoring/login.png" alt="login" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

- **默认用户名**：`admin`
- **默认密码**：`hicamthink`

点击登录查看带有详细设置的实时视图。

<img src="/img/ne301/application-guide/monitoring/live.png" alt="live" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

导航到系统设置以连接网络访问。

<img src="/img/ne301/application-guide/monitoring/system.png" alt="system" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

> Camthink NE301支持WiFi和蜂窝模块。选择相应方法以确保网络连接正常。

导航到应用管理以配置数据和图片的转发位置。

<img src="/img/ne301/application-guide/monitoring/application-management.png" alt="application-management" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

输入您自己的MQTT代理或AI工具栈服务器的详细信息：
- **服务器地址**： MQTT代理的IP地址。
- **端口**：MQTT服务器的端口，默认值：1883
- **数据接收主题**：用于控制和触发图像捕获的下行链路命令主题。
- **数据发送主题**：用于传输数据和图片的上行命令主题。
- **客户端ID**：MQTT客户端ID，部分服务器会验证该值。
- **用户名**：连接mqtt服务器的用户名，请根据服务器的需求输入。
- **密码**：连接mqtt服务器的密码，请根据服务器的需求进行输入。

### 收集图像，训练并量化模型

登录您自己的AI工具栈服务器以创建新项目。

<img src="/img/ne301/application-guide/monitoring/AI-tool-stack.png" alt="AI-tool-stack" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

点击创建新的AI模型项目，输入名称和描述：

<div style={{display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0'}}>
  <img src="/img/ne301/application-guide/monitoring/stack1.png" alt="stack1" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
  <img src="/img/ne301/application-guide/monitoring/stack2.png" alt="stack2" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
</div>

打开此项目并绑定用于图像采集的设备，您需要先创建此设备。

<div style={{display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0'}}>
  <img src="/img/ne301/application-guide/monitoring/stack3.png" alt="stack3" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
  <img src="/img/ne301/application-guide/monitoring/stack4.png" alt="stack4" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
</div>

NE301拍摄的冰箱图片将按配置进行上行传输。
如果您已经准备好图像，直接上传到本平台即可进行模型训练。

<img src="/img/ne301/application-guide/monitoring/stack5.png" alt="stack5" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

在开始训练模型之前，在这里创建一个类，我们将其命名为 `Beverage`

<img src="/img/ne301/application-guide/monitoring/stack6.png" alt="stack6" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

选择合适的类型来标记对象。

<div style={{display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0'}}>
  <img src="/img/ne301/application-guide/monitoring/stack7.png" alt="stack7" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
  <img src="/img/ne301/application-guide/monitoring/stack8.png" alt="stack8" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
</div>

逐个进行操作，以确保所有对象都被正确标记。
如果您已经有数据集，直接在这里上传即可。

点击“训练模型”开始训练。

<img src="/img/ne301/application-guide/monitoring/stack9.png" alt="stack9" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

点击“新建训练”以创建新任务，保持所有默认设置。

<img src="/img/ne301/application-guide/monitoring/stack10.png" alt="stack10" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

然后开始训练。这需要一点时间。

<div style={{display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0'}}>
  <img src="/img/ne301/application-guide/monitoring/stack11.png" alt="stack11" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
  <img src="/img/ne301/application-guide/monitoring/stack12.png" alt="stack12" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
</div>

要将模型部署到NE301中，我们需要在将其上传到设备之前对其进行量化。点击量化按钮。

<div style={{display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0'}}>
  <img src="/img/ne301/application-guide/monitoring/stack13.png" alt="stack13" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
  <img src="/img/ne301/application-guide/monitoring/stack14.png" alt="stack14" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
</div>

点击它开始，这里保持默认设置即可。

<img src="/img/ne301/application-guide/monitoring/stack15.png" alt="stack15" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

完成它需要一点时间。NE301模型包（*.bin）是精确量化的模型。点击下载。

<img src="/img/ne301/application-guide/monitoring/stack16.png" alt="stack16" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

您也可以在这里测试模型，以确认是否一切正常。

<img src="/img/ne301/application-guide/monitoring/stack17.png" alt="stack17" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />


### 验证并部署新模型

让我们回到设备上上传新模型。点击上传按钮进行安装。

<div style={{display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0'}}>
  <img src="/img/ne301/application-guide/monitoring/stack18.png" alt="stack18" style={{width: '32%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
  <img src="/img/ne301/application-guide/monitoring/stack19.png" alt="stack19" style={{width: '32%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
  <img src="/img/ne301/application-guide/monitoring/stack20.png" alt="stack20" style={{width: '32%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
</div>

完成后，饮料罐标记正确。

<img src="/img/ne301/application-guide/monitoring/stack21.png" alt="stack21" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

您可以上传更多图片来验证性能。

<div style={{display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0'}}>
  <img src="/img/ne301/application-guide/monitoring/stack22.png" alt="stack22" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
  <img src="/img/ne301/application-guide/monitoring/stack23.png" alt="stack23" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
</div>

### 配置 HomeAssistant 应用程序

为了让数据对客户更有价值，我们选择 HomeAssistant 进行集成和可视化。你也可以将其连接到其他第三方平台。

打开“设备与服务”以安装MQTT集成。

<img src="/img/ne301/application-guide/monitoring/stack24.png" alt="stack24" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

点击添加集成按钮以安装MQTT插件。

<img src="/img/ne301/application-guide/monitoring/stack25.png" alt="stack25" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

只需输入MQTT即可搜索到它。

<div style={{display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0'}}>
  <img src="/img/ne301/application-guide/monitoring/stack26.png" alt="stack26" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
  <img src="/img/ne301/application-guide/monitoring/stack27.png" alt="stack27" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
</div>

选择第二个，并输入在NE301中配置的MQTT代理

<img src="/img/ne301/application-guide/monitoring/stack28.png" alt="stack28" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

<img src="/img/ne301/application-guide/monitoring/stack29.png" alt="stack29" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

提交以保存。MQTT连接已就绪。

创建MQTT设备，以确保数据能够被正确订阅。

<img src="/img/ne301/application-guide/monitoring/stack30.png" alt="stack30" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

其他设置保持默认。

<img src="/img/ne301/application-guide/monitoring/stack31.png" alt="stack31" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

选择类型`数字`并在此处输入实体名称。

<img src="/img/ne301/application-guide/monitoring/stack32.png" alt="stack32" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

保持这些设置为空。

<img src="/img/ne301/application-guide/monitoring/stack33.png" alt="stack33" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

请在此正确输入MQTT的具体细节，尤其是下行和上行主题，以及模板。

<img src="/img/ne301/application-guide/monitoring/stack34.png" alt="stack34" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

```jinja2
{{ value_json.ai_result.ai_result.detection_count }}
```
有关如何设置值模板的更多详细信息，您可以访问HomeAssist网站或联系我们。
点击“下一步”并保存。

<img src="/img/ne301/application-guide/monitoring/stack35.png" alt="stack35" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

关于饮料编号的第一个实体创建良好。

让我们创建第二个实体来识别名称。

<img src="/img/ne301/application-guide/monitoring/stack36.png" alt="stack36" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

输入`name`的值模板。

<img src="/img/ne301/application-guide/monitoring/stack37.png" alt="stack37" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

值的模板名称在这里不同。
```jinja2
{{ value_json.ai_result.ai_result.detections[0].class_name }}
```
点击保存更改以保存它。
<img src="/img/ne301/application-guide/monitoring/stack38.png" alt="stack38" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

刷新页面以正确查看带有值的活动。
<img src="/img/ne301/application-guide/monitoring/stack39.png" alt="stack39" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

HomeAssistant支持在仪表盘上查看，包括历史记录
<img src="/img/ne301/application-guide/monitoring/stack40.png" alt="stack40" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

## 快速测试

咱们拿些饮料来测试一下。

<img src="/img/ne301/application-guide/monitoring/stack41.png" alt="stack41" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

饮料的数量立即改变。

<img src="/img/ne301/application-guide/monitoring/stack42.png" alt="stack42" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

这些数值也会在HomeAssistant平台上更新，客户可以查看所有历史数据。

<img src="/img/ne301/application-guide/monitoring/stack43.png" alt="stack43" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />

HomeAssistant平台支持其他应用程序触发警报，你可以对其进行配置以实现全面管理。

## 常见问题 (FAQ)

**1. 问：我可以使用相同的MQTT代理和Camthink AI工具栈进行模型训练和量化吗？**

答：本指南中的服务器仅供内部使用。你需要自行安装自己的AI工具栈。

**2. 问：如何使用NE301更轻松地拍摄完整图像？**

答：我们建议将平板电脑/手机连接到NE301的WiFi，通过此处的按钮进行拍摄。

<img src="/img/ne301/application-guide/monitoring/stack44.png" alt="stack44" style={{display: 'block', margin: '20px auto', maxWidth: '80%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
 
**3. 问：如何在HomeAssistant中设置值模板？**

答：您可以访问HomeAssistant的网站以获取有关如何使用它的详细信息。以下是NE301报告数据的示例：

```json
{
    "metadata": {
        "image_id": "cam01_1767513409",
        "timestamp": 1767513409,
        "format": "jpeg",
        "width": 1280,
        "height": 720,
        "size": 51464,
        "quality": 60},
    "device_info": {
        "device_name": "NE301-2A3E75",
        "mac_address": "44:9f:da:2a:3e:75",
        "serial_number": "SN202500001",
        "hardware_version": "V1.1",
        "software_version": "1.0.1.1146",
        "power_supply_type": "full-power",
        "battery_percent": 0,
        "communication_type": "wifi"},
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
                "class_name": "Baverage",
                "confidence": 0.9015386700630188,
                "x": 0.0039368569850921631,
                "y": 0.17518982291221619,
                "width": 0.53541159629821777,
                "height": 0.82280164957046509}],
            "detection_count": 1,
            "poses": [],
            "pose_count": 0,
            "type_name": "object_detection"}},
        "image_data": "data:image/jpeg;base64,/9j/2wBDAA0J",
        "encoding": "base64"
}
```


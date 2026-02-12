---
sidebar_label: Urban Waste Bin Overflow Monitoring
---

# 案例-城市垃圾桶满溢监测

<div style={{display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0'}}>
  <img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/header.png" alt="header1" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
  <img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/header2.png" alt="header2" style={{width: '48%', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}} />
</div>

## 1. 简介

CamThink 是迈视科技推出的一个全新的以开发者为中心的品牌，旨在让边缘AI对每个人来说都更加简单。我们为社区建设者和企业工程师打造开放、对开发者友好的边缘AI硬件，并帮助他们从早期原型过渡到可靠的实际部署——加速您在边缘AI领域的战略实施。

Camthink NeoEye 301 (NE301) 由搭载 Neural-ART NPU 的 STM32N6 (Cortex-M55) 处理器提供支持，可实现实时 AI 推理和专业级图像处理，且功耗极低。

Home Assistant 是一个免费的开源家庭自动化平台，旨在成为您智能应用的中央“大脑”，它优先考虑本地控制和隐私。截至 2026 年初，Home Assistant 通过其“语音之年”和“集体智慧”倡议，变得更加用户友好。

城市管理的效率往往隐藏在显眼之处，被我们习惯的“低效”所掩盖。如今大多数环卫车辆仍遵循固定路线，即使垃圾桶是空的也会停下来。

在这个用例中，我们将向您展示如何利用 Edge AI 解决方案管理垃圾桶状态，将智慧城市行业的“定时清洁”转变为“按需清洁”。

## 2. 需求

**硬件：**

*   Camthink NeoEye 301，超低功耗视觉 AI 相机。建议使用蜂窝版本。

**软件平台：**

*   **Camthink AI 工具栈**：一个端到端的 AI 工具集，涵盖从数据收集、标注、训练、量化到部署的整个工作流程。
*   **HomeAssistant**：您需要提前在服务器中安装它。

## 3. 配置指南

在这部分，我们将逐步向您展示如何实现这个完整的用例。

### 3.1 正确安装 NE301

首先，正确安装插入了 SIM 卡的 Camthink NE301，长按按钮 2 至 3 秒以激活 WiFi。

### 3.2 配置网络和 MQTT 数据转发

连接以 `NE301_<MAC最后6位>` 开头的 WiFi 热点，输入默认 IP 地址：192.168.10.10

*   **默认用户名**：admin
*   **默认密码**：hicamthink

点击登录查看带有详细设置的实时视图。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image1.png" alt="image1" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

导航到系统设置 (System settings) 以连接网络。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image2.png" alt="image2" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

Camthink NE301 支持 WiFi 和蜂窝模块。选择相应方法以确保网络连接正常。

导航到应用管理 (Application Management) 以配置数据和图片的转发位置。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image3.png" alt="image3" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

输入您自己的 MQTT 代理或 AI 工具栈服务器的详细信息：

*   **Server address (服务器地址)**：MQTT 代理的 IP 地址。
*   **Port (端口)**：MQTT 服务器的端口，默认值：1883
*   **Data Receiving Topic (数据接收主题)**：用于控制和触发图像捕获的下行链路命令主题。
*   **Data Sending Topic (数据发送主题)**：用于传输数据和图片的上行命令主题。
*   **Client id (客户端 ID)**：MQTT 客户端 ID，部分服务器会验证该值。
*   **Username (用户名)**：连接 MQTT 服务器的用户名，请根据服务器的需求输入。
*   **Password (密码)**：连接 MQTT 服务器的密码，请根据服务器的需求输入。

### 3.3 收集图像，训练并量化模型

登录您自己的 AI 工具栈服务器以创建新项目。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image4.png" alt="image4" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

点击创建新的 AI 模型项目 (Create New AI Model Project)，输入名称和描述。

打开此项目并绑定用于图像采集的设备。您需要先创建此设备。

NE301 拍摄的图片将按配置进行上行传输。

如果您已经准备好图像，直接上传到本平台即可进行模型训练。

在开始训练模型之前，在这里创建一个类 (Class)。在本例中，我们创建两个类来识别垃圾桶是“满溢 (Full)”还是“部分满 (Partial)”。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image5.png" alt="image5" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

选择合适的类型来标记对象。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image6.png" alt="image6" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

逐个进行操作，以确保所有对象都被正确标记。

如果您已经有数据集，直接在这里上传即可。

点击“训练模型 (Train Model)”开始训练。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image7.png" alt="image7" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

点击“新建训练 (New Training)”以创建新任务，保持所有默认设置。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image8.png" alt="image8" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

然后开始训练。这需要一点时间。

要将模型部署到 NE301 中，我们需要在将其上传到设备之前对其进行量化。

点击量化 (Quantize) 按钮。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image9.png" alt="image9" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image10.png" alt="image10" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

点击开始，这里保持默认设置即可。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image11.png" alt="image11" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

完成它需要一点时间。

NE301 模型包 (*.bin) 是精确量化的模型。点击下载。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image12.png" alt="image12" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

您也可以在这里测试模型，以确认是否一切正常。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image13.png" alt="image13" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

### 3.4 验证并部署新模型

让我们回到设备上上传新模型。

点击上传 (Upload) 按钮进行安装。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image14.png" alt="image14" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

完成部署后，垃圾桶的状态被正确标记。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image15.png" alt="image15" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

您可以上传更多图片来验证性能。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image16.png" alt="image16" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

### 3.5 配置 HomeAssistant 应用程序

为了让数据对客户更有价值，我们选择 HomeAssistant 进行集成和可视化。您也可以将其连接到其他第三方平台。

打开“设备与服务 (Devices & Services)”以安装 MQTT 集成。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image17.png" alt="image17" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

点击添加集成按钮以安装 MQTT 插件。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image18.png" alt="image18" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

只需输入 MQTT 即可搜索到它。

选择第二个，并输入在 NE301 中配置的 MQTT 代理。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image19.png" alt="image19" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image20.png" alt="image20" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

提交以保存。MQTT 连接已就绪。

在本指南中，我们将尝试一种新方法，通过直接编辑配置文件 `/homeassistant/configuration.yaml` 来创建 MQTT 设备。

以下是本指南中的配置详细信息：

您需要将 name、state_topic 和 class 值更新为您自己的值。

然后通过点击开发者工具 (Developer tools) 页面中的“手动配置的 MQTT 实体 (Manually configured MQTT entities)”来应用更改。

您将发现传感器已正确创建。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image21.png" alt="image21" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

## 4. 快速测试

让我们开始监控垃圾桶的液位状态。状态将正确显示数值。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image22.png" alt="image22" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image23.png" alt="image23" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image24.png" alt="image24" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

您还可以在历史记录中查看更详细的信息。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image25.png" alt="image25" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

HomeAssistant 平台支持其他应用程序触发警报，您可以对其进行配置以实现全面管理。

## 5. 常见问题 (Q&A)

**Q: 我可以使用相同的 MQTT 代理和 AI 工具栈进行模型训练和量化吗？**

A: 本指南中的服务器仅供内部使用。您需要自行安装自己的 AI 工具栈。

**Q: 由于芯片组较小，如何提高模型的性能？**

A: 您可以在量化过程中尝试将输入大小 (Input Size) 选项设置为 320。

<img src="/img/ne301/application-guide/urban-waste-bin-overflow-monitoring/image26.png" alt="image26" style={{display: "block", margin: "20px auto", maxWidth: "80%", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"}} />

**Q: 如何在 HomeAssistant 中设置值模板？**

A: 您可以访问 HomeAssistant 网站以获取有关如何使用它的详细信息。以下是 NE301 报告数据的示例：

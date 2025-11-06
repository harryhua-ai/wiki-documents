# Quick Start

## 概述

本教程将详细说明NeoEyes NE301如何从0开始上手使用，涵盖内容有：设备安装教程、基本使用、配置功能以及部署应用等。

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', alignItems: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/quick-start/ne301-2.png" alt="ne301" style={{ flex: '0 0 auto', maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/ne301.png" alt="ne301" style={{ flex: '0 0 auto', maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

## 产品准备

- NE301 主机一套（含主板、电池仓、外壳）
- AA 电池 4 节，或直流/太阳能等替代供电方案
- 十字螺丝刀、安装支架及固定件
- 可选扩展：Cat-1 模块、不同规格的镜头模组
- 可连接 WiFi 的电脑或手机，用于访问设备 Web 页面

> 提示：整机版本已预装核心固件与出厂模型。仅需装入电池即可进入调试。若使用开发板版本，请确认各扩展板连接牢固，再完成装配。

## 产品使用

### 设备开机

使用螺丝刀拆卸NE301后盖，按照电池仓分布安装电池，等待相机前部的蓝色灯光亮起后，表示相机系统已经成功启动，确定好开机顺利后，即可将后盖重新安装回设备，到这里你便完成了设备的基本启动，完成后我们可以进行下一步，对设备进行配置。

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '8px 0 16px' }}>
  <img src="/img/ne301/quick-start/wakeup1.jpg" alt="开机示例" style={{ flex: '1 1 280px', maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/wakeup2.jpg" alt="电池安装" style={{ flex: '1 1 280px', maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

### 设备连接与登录


在组装好设备后，NE301内置WIFI AP 提供有Web UI 交互的方式供用户对设备的模型推理、参数和功能进行调试与修改等功能，NE301设备WIFI AP的SSID名称规则为NE301`{Mac后六位字母}` 
，请保证身边有手机或电脑可以连接NE101提供的WiFi AP来访问Web网页进行配置修改，若成功连接WiFi AP可通过在浏览器中输入 `192.168.10.10`来访问Web界面，接下来将详细说明相关操作步骤。

1、保证NE301处于开机状态
你可以手指轻按一下相机右侧的拍照按钮，查看指示灯是否亮起，如果亮起说明当前机器处于开机状态，如果你是在调试设备，点击拍照按键NE301将会抓取当前页面图像，并通过你配置的MQTT/MQTTS地址上传图像，如果一切配置正常的话，详细配置修改见下方说明。

2、开启NE301 WiFi AP 并在手机或电脑上寻找到它并连接。NE301系统正常启动后，你可以在电脑或手机的WiFi AP列表寻找对应SSID规则为设备名称为 NE301`{Mac后六位字母}` 
的WiFi AP，点击连接它，你无需输入密码，当你正常连接后，即可通过192.168.10.10地址在浏览器中访问到NE301的配置Web页，如果你成功了将看到浏览器上的Web页面。

> 短按按键触发短按拍照;长按按键2秒唤醒WIFI AP，同时设备前部的蓝色系统指示灯亮起。
> WiFi AP 默认空闲 10 分钟后进入休眠。若页面断开，可再次短按拍照键唤醒或者调整休眠时间。

3、登入并进行配置
如果你成功并访问到了设备的Web页面，那么便可进入登录界面,默认用户名为系统内置用户名，不可修改，密码初始化默认为"hicamthink"，可在 `主页菜单栏-系统设置-设备密码`中修改，在输入正确的密码后即可进入主界面。

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '8px 0 16px' }}>
  <img src="/img/ne301/quick-start/login-en.png" alt="登录页面" style={{ flex: '1 1 280px', maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/login-hicamthink.png" alt="默认密码提示" style={{ flex: '1 1 280px', maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

进入到Web界面后，我们来看看如何修改配置和调试，下方将会根据配置类别和主要作用来详细进行说明。


## AI 功能配置与调试

### 功能引导

NeoEyes NE301 AI Camera凭借强大的板载 AI 算力，提供了高性能、高灵活度的智能视觉解决方案。
手机/PC初次连接设备会进行关键功能的引导步骤，引导之后便是功能主界面——功能调试，在功能调试界面可以调整模型、替换模型、实时AI预览等功能。

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '8px 0 16px' }}>
  <img src="/img/ne301/quick-start/guidance.png" alt="功能引导" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/AI-off.png" alt="AI 关闭" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/AI.png" alt="AI 开启" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

### 低延迟推理

设备支持毫秒级（ms）的视频流实时推理，确保 AI 功能的即时响应。您可以通过设备开启的 WiFi AP，在本地 Web 端实时预览视频流，并同步验证设备端 AI 推理结果(默认AI推理自动开启，可选择关闭)，无需依赖外部云服务，实现极速响应和状态监控。

<div style={{ textAlign: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/quick-start/inference-setting.png" alt="推理设置" style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

### 灵活的模型部署与替换

Web UI提供AI模型的一键部署和替换，让 AI 模型应用变得轻而易举。

- 开箱即用： 设备出厂预置了一款 YOLOv8 模型，可快速预览设备本地的AI效果。

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '8px 0 16px' }}>
  <img src="/img/ne301/quick-start/model-list.png" alt="模型列表" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/model-upload.png" alt="模型上传" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/model-uploading.png" alt="模型写入" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

- AI模型快速部署： 如果你不想要设备的默认模型，你可以通过 Web 交互界面，以零基础、零代码地上传和部署新的 AI 模型，甚至可以通过设备抓拍的图片持续积累数据集再训练适合场景的专用模型。为此，我们提供了详细的指南，您可以参考——[在STM32N6上训练与部署yolov8](./3-application-guide/0-model-training-and-deployment.md "可选的标题")。


<div style={{ textAlign: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/quick-start/change-model.gif" alt="模型替换" style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

### 推理参数热加载

我们的系统支持推理参数的热加载。这意味着您可以根据不同模型的特性，通过 Web 界面调整滑动条实时改变推理参数（置信度阈值、NMS 阈值），并立即预览画面推理结果的变化，实现AI模型即时调整和验证。

<div style={{ textAlign: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/quick-start/inference-setting.png" alt="推理参数" style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

### 模型图像即时验证

除了实时视频流，我们还提供了便捷的图像模型验证工具。无需到现场抓拍调试，您可以直接从手机或 PC 上传本地图片到设备的Web页面，并使用当前设备上部署的模型对图像进行推理验证。这让您能够快速、准确地测试不同场景下的设备终端的模型性能，无需等待实时抓拍，大大提升了调试效率。

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '8px 0 16px' }}>
  <img src="/img/ne301/quick-start/model-pic1.png" alt="模型验证" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/model-pic2.png" alt="模型验证" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/model-pic3.png" alt="模型验证" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

具体效果展示如下：

<div style={{ textAlign: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/quick-start/model-validation.gif" alt="图片验证" style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>


## 其它功能

除了AI功能部分，我们也提供了丰富的常规固件功能，详细的说明和配置如下

### 排程采集

> 用于设置NE301设备的定时抓图功能，用户可以根据硬件执行扩展PIR传感器等硬件触发设备抓图

- 启用排程抓图：开启功能后支持设置设备周期性进行图像抓拍的相关功能设置。
- 定时抓图模式：支持设置每天定时抓图或周一至周日具体时间点抓图，时间可以设置00:00 - 23:59，最多支持设置8个抓拍时间用于定时图像抓取。
- 间隔抓图模式：支持设置抓图的时间间隔，用于按照时间间隔进行图像抓取，支持按照分钟、小时、天的时间纬度进行设置，最多仅支持1个规则设置
  

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '8px 0 16px' }}>
  <img src="/img/ne301/quick-start/scheduled-capture.png" alt="间隔抓拍" style={{ flex: '1 1 280px', maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/scheduled-capture2.png" alt="定时抓拍" style={{ flex: '1 1 280px', maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>


### IO触发

> 用于设置NE301设备的IO触发功能，用户可以根据硬件执行扩展IO设备等硬件触发设备抓图

- 启用IO触发：开启功能后支持设置设备根据扩展IO设备的状态变化来触发图像抓拍的相关功能设置。
- IO触发模式：支持设置根据扩展IO设备的高电平或低电平状态来触发图像抓拍，用户可以根据实际场景需求来设置。


## 应用管理

> 用于设置NE301设备的MQTT/MQTTS通信功能，用户可以根据实际场景需求来配置MQTT/MQTTS服务器地址、端口、用户名、密码等参数，实现设备与服务器的通信。

用于设置NE301的数据上报的协议，可选择MQTT/MQTTS协议，完善下方信息后，点击保存并连接按钮即可。

- Host：用于填写MQTT服务端的域名或IP。
- MQTT Port：用于填写MQTT订阅端口号，默认为1883。当时开启SSL时默认端口为8883。
- Topic：用于设置此设备上报数据的Topic。
- Client ID：用于明确此在MQTT服务中的客户端唯一标识。
- QoS：MQTT QoS设置，支持QoS 0、QoS 1、QoS 2可选。
- Username：用于设置连接MQTT服务所需校验的用户名。
- Password：用于设置连接MQTT服务所需校验的用户名对应的密码，需要与上方相同。
- SSL：开启后支持MQTTS协议，显示证书配置相关选项，用于实现加密通信。
- CA Certificate：将MQTTS服务器的CA证书进行上传，用于验证服务器身份。
- Client Certificate：将MQTTS客户端的证书进行上传，用于验证客户端身份。
- Client Key：将MQTTS客户端的私钥进行上传，用于加密通信。

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '8px 0 16px' }}>
  <img src="/img/ne301/quick-start/MQTT.png" alt="MQTT" style={{ flex: '1 1 280px', maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/MQTTS.png" alt="MQTTS" style={{ flex: '1 1 280px', maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

### 硬件管理

**图像设置：你可以根据实际的场景需求来调整硬件参数，同时观察相机画面效果的变化。**

**图像管理**

自动按钮（Auto）：点击开启后OS04C10相机模组会依据画面效果自动调整画面参数以此来优化图像效果，无法通过手动拖动来调整画面的明亮度与对比度，或者直接在右侧输入目标数值。

- 明亮度：0-100可调节
- 对比度：0-100可调节
- 水平翻转：画面水平翻转，用于设备实际安装后成像需要水平翻转时使用
- 垂直翻转：画面垂直翻转，用于设备实际安装后成像需要垂直翻转时使用

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '8px 0 16px' }}>
  <img src="/img/ne301/quick-start/image-management-auto.png" alt="灯光自动" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/image-management1.png" alt="灯光管理" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/image-management2.png" alt="灯光管理" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

**灯光管理**

补光灯模式：支持自定义时间、工作时自动补光、常关三种模式，请根据你的实际使用场景设置此配置。

- 自定义时间：为定义时间范围内开启（如20:00-6:00），时间范围内常开
- 工作时自动补光：默认即为工作时自动补光，依据设备是否被唤醒进行工作（图像、视频流）来启动补光灯，其余时间关闭
- 常关模式：补光灯常关，无论什么时候，补光灯均不开启

> Tips：补光灯效果仅限于近距离场景会比较好，对功耗十分敏感的场景可选择不启用

<div style={{ textAlign: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/quick-start/lightgif1.gif" alt="灯光变化gif" style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>


<div style={{ textAlign: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/quick-start/lighting-management.png" alt="自动控制" style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

### 系统设置：通信、设备、导入导出

> 依据不同通讯模块载入对应的通信管理功能，此外还包括蓝牙功能、设备功能、导入导出等

#### 通信管理

> NE301的网络连接设置，根据所选的通讯方案设置内容有所差异，主要有WiFi、Cat-1 两种通讯方案可设置，下方详细说明这些通讯方案的设置与使用。

- WiFi设置：NeoEyes NE301标准版本自带WiFi，WiFi版本下，可在配置界面中查看当前范围内可检索到的WiFi信号，你可以根据所需连接的WiFi进行选择设置，设备会自动记录WiFi的SSID和密码，如果重复设置NE301连接的WiFi则设备存储的SSID和密码始终是最近一次的。

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '8px 0 16px' }}>
  <img src="/img/ne301/quick-start/communications.png" alt="通信设置" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/wifi-pwd.png" alt="Wi-Fi 密码" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/wifi-connected.png" alt="Wi-Fi 连接" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

- Cat-1网络设置：NE301 Cat-1版本支持进行网络的设置，你需要有所在地区可用的sim卡，当前NE301 Cat-1版本支持除北美地区以外的其他地区使用，下方将会说明如何进行Cat-1网络设置。
- 使用螺丝刀打开NE301的设备前盖。
- 拆卸完成后可以看到设备前面的sim卡槽，在sim卡槽内插入sim卡。
- 重新安装设备前盖。
- 打开浏览器，进入设备的配置Web页，在浏览器内输入192.168.10.10。
- 到下方的Cellular配置，按照运营商提供的sim卡信息按照需求输入APN、Username、Password、PIN Code、Authentication Type、AT Commands，你可以点击「Send」按钮测试蜂窝网络，如果正常Cellular Status 会变为connect状态，说明网络正常，然后点击save保存信息。
- 你可以通过Details按钮来查看网络的详细信息，显示信息可以参考下方图像。


<!--
#### 蓝牙管理

- 功能概述：用于管理设备的蓝牙（BLE）功能，包括启用/关闭、设备信息、扫描配对、唤醒策略与重置等。

- 开关与基本信息
  - 启用蓝牙：开启/关闭蓝牙广播与连接能力。
  - 设备名称：默认为“NE301`{Mac后六位字母}`”，可在此修改并保存，重启后保持。
  - 可发现与广播：可设置是否对外可见；支持调整广播间隔（ms），在功耗与发现速度之间取得平衡。

- 扫描与配对
  - 扫描附近设备：点击“扫描”获取周边 BLE 设备列表，显示设备名称、MAC 与信号强度（RSSI）。
  - 配对/解绑：在列表中选择目标设备进行配对；已配对设备支持“解绑/删除”。
  - 已配对列表：展示所有已建立信任的 BLE 设备，支持逐项管理或一键清空。

- 蓝牙唤醒
  - 蓝牙远程唤醒：在设备深度休眠下，支持通过已配对主机发送指定指令唤醒设备，用于低功耗远程控制场景。
  - 唤醒策略：可配置是否允许蓝牙唤醒、允许的时间段或条件（与排程/低功耗策略协同）。

- 安全与维护
  - 清空配对：支持清空所有已配对设备，快速恢复到未配对状态。
  - 恢复默认：一键恢复蓝牙相关设置至默认值（名称、可见性、广播参数与配对信息）。
!-->


#### 设备密码管理

- 本机WiFi设置

  - WiFi名称：为设备名称，名称命名规则为：NE301`{Mac后六位字母}` ，MAC信息可见设备外壳处标签。
  - WiFi密码：默认为“hicamthink”。首次登录后可立即修改，修改后WiFi-AP将重新启动，依据不同终端设备可能需要手动重新连接设备。
  - 休眠时间：为设备WiFi AP开启后的自动关闭的时间，初始化默认为10分钟，期间的Web操作会重置此时间，考虑到对电池功耗的影响不建议长时间开启。
- 登录密码

  - 用户名：登录的用户名为系统内置，固定不可修改。
  - 输入当前密码、新密码与确认新密码后保存即生效。
  - 密码规则建议：8–20 位，建议包含字母、数字与符号，避免使用与设备信息相关的弱口令。
- 忘记密码/重置

  - 若遗忘密码，可通过“设备重置”流程恢复出厂设置，密码将恢复为默认值“hicamthink”。
  - 重置会清除设备上的所有自定义配置（含模型/网络/参数等），请在重置前通过“导出”备份重要信息。
- 其他

  - 支持切换显示/隐藏密码，避免误输。
  - 保存：改动配置后通过点击保存即可生效。

<div style={{ textAlign: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/quick-start/device-pwd.png" alt="密码配置" style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

### 导入与导出

导入导出包含固件、模型、设备配置文件三类内容，适用于升级、迁移与批量部署等场景。

- 固件导入/升级（本地 OTA）
  - 此部分的固件分为三个文件，包含APP文件、Web文件以及FSBL文件，可选择任意板块进行升级。
  - 选择好后，可本地上传或拖动到区域内，上传后系统自动完成校验与写入，完成后设备将自动重启，此期间请勿进行操作。
  - 可选“保留当前配置”，勾选后升级不覆盖现有参数；不勾选则恢复为出厂配置。
  - 若升级失败将保留旧版本，避免设备不可用。
- 模型导入
  - 选择模型包（包含模型文件与相关参数说明的文件），上传后自动部署到设备。
  - 部署成功后可在“功能调试”中应用并验证当前模型。
  - 建议与“推理参数热加载”配合，按场景微调置信度/NMS 等参数。
  - 支持回滚至出厂预置模型，可通过重置设备实现。
- 配置导入
  - 选择配置文件（.json）并上传，系统支持导入前预览覆盖项，确认后应用到对应模块。
  - 部分配置即时生效；网络/通信等底层配置可能需要重启设备生效。
- 配置导出
  - 一键导出当前设备配置（.json），可用于备份与跨设备批量下发。
  - 建议在固件升级或重置前先导出配置，避免参数丢失。
- 注意事项
  - 导入/导出过程中请保持供电稳定，勿断电或关闭页面。
  - 不同固件版本间导入配置可能存在不兼容项，若导入失败请参考版本发布说明或先升级至兼容版本。
    <!-- **具体版本与相关文件可参考——《NeoEyes NE301 文件迭代》** -->

> 升级或导入配置时请保持供电稳定，操作完成前不要断电或刷新页面。

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '8px 0 16px' }}>
  <img src="/img/ne301/quick-start/import-firmware.png" alt="固件导入" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/import-firmware2.png" alt="上传固件" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/import-firmware3.png" alt="固件烧录" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>


<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '8px 0 16px' }}>
  <img src="/img/ne301/quick-start/export-firmware.png" alt="固件导出" style={{ flex: '1 1 280px', maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/export-firmware2.png" alt="固件导出加载" style={{ flex: '1 1 280px', maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>


## 设备信息

用于展示设备信息的页面，字段示例如下：

- 设备名称：默认为NE301`{Mac后六位字母}` ，支持手动修改，此名称在设备采集图像数据后跟随图像上报数据进行上传，在JSON数据中的devName信息种显示此名称。
- MAC地址：展示设备MAC地址信息。
- SN：设备的唯一标识，通常用于唯一身份判断以及售后服务时提供。
- 硬件版本：当前硬件版本。
- 软件版本：挡圈硬件装载的固件版本。
- 相机模组：显示模组型号。
- 功能模块：暂无或显示扩展PCBA型号。
- 存储卡：显示存储卡型号和存储空间。
- 供电：电池/常供电。
  - 电池显示电量显示为高中低，对应绿橙红三种颜色标识，以此来展示电池电量使用情况
  - 如果是外接供电（如太阳能、USB、POE）显示常供电，通过“-”来进行显示常供电状态，不显示电池电量
- 通讯：WiFi/Cat-1/POE ，显示设备的通信方式。

<!--<div style={{ textAlign: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/quick-start/device-information.png" alt="设备信息" style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div> -->
<div style={{ textAlign: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/quick-start/device-information1.png" alt="硬件状态" style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

## 设备重置

快速按两次拍照键并长按约 10 秒，可将设备恢复出厂设置。重置会清除自定义模型、网络与参数，请在操作前导出配置。

> 在固件升级或批量部署前建议做好配置备份，方便出现异常后迅速恢复。

# Quick Start

## 产品概述

NE100系列是专为物联网应用设计的高性能智能相机产品线，其中NE101标准固件提供了定时抓拍与数据上报等核心功能。本指南将帮助您快速掌握产品使用方法。

## 硬件准备

### 硬件组件

- NE100-CM01开发板
- 具体模组板（可选），详细参考[硬件组件说明](./1-hardware-guide/0-components-overview.md)

## 操作指南

### 设备连接

![NE101主板正面图](/img/NE101_Main_Board.png)  
![NE101主板接口图](/img/NE101_Main_Board2.png)  

**使用要点**：

1. 通过Type-C接口供电（5V/1A以上）
2. 接口采用防呆设计
3. 预留调试串口（115200bps）

详细硬件连接请参阅：[硬件连接指南](./1-hardware-guide/1-hardware-connection.md)

### 快速启动流程

1. **设备上电**
   
   - 连接USB电源

2. **状态确认**
   
   - 电源指示灯亮起1秒表示启动成功
   - 系统初始化约需1分钟

3. **进入配置模式**
   
   - 长按功能键，等到灯亮后松开（约3-4秒）。

4. **连接管理界面**
   
   - 设备热点名称显示为NE101_XXXXXX
   - 手机/电脑连接设备WiFi
   - 访问 http://192.168.1.1

![设备WiFi连接示意图](/img/NE101_wifi_connect.png)
![设备管理界面概览](/img/NE101_web.png)

### 核心功能配置

#### 图像采集设置

![实时画面预览](/img/NE101_web_cam.png)

**关键参数**：

- **闪光模式**：
  
  - 智能自动（默认）
  - 定时开启
  - 强制关闭

- **图像调节**：
  
  - 亮度分级调节：0-90级
  - 图像调节：亮度/对比度/饱和度（使用USB模组时无该选项）
  - 画面镜像功能（使用USB模组时无该选项）

![图像调节界面](/img/NE101_web_ImageAdjustment.png)

#### 拍摄计划配置

![拍摄设置界面](/img/NE101_web_cap_setting.png)

**工作模式**：

1. **定时抓拍**：设置具体时间点
2. **间隔拍摄**：设置循环周期（5分钟-24小时）
3. **外触发模式**：通过PIR触发
4. **手动模式**：按键触发拍摄

#### 网络与数据

![网络连接界面](/img/NE101_web_WLANConnection.png)

**网络测试(串口连接)**：

```bash
# 通过串口执行ping测试示例
ping www.example.com -c 4
```

![网络测试示意图](/img/NE101_ping.png)

**数据上报**：

1. 配置MQTT服务器参数
2. 使用MQTTX工具验证数据流
3. 查看上报状态

![数据上报配置界面](/img/NE101_web_DataReport.png)
![MQTT数据流示例](/img/NE101_MQTT.png)

**MQTTX使用说明：**

1. 打开 MQTTX，点击 `新建连接`。

2. 设置连接参数：
   
   - **Host**：服务器地址`xxx.xxx.xxx.xxx`
   - **Port**：服务器端口`xxx`
   - **Client ID**：任意字符串，例如 `mqttx-client-01`
   - **Topic**：例如`camera1`
   - **Username / Password**：根据服务器配置

3. 点击连接后，订阅 Topic `camera1`。

**数据格式说明：**

设备发送的 MQTT 消息 payload 内容为 JSON 格式，如下所示：

```json
{
  "ts": 1740640441620,
  "values": {
    "devName": "NE101 Sensing Camera",
    "devMac": "D8:3B:DA:4D:10:2C",
    "battery": 84,
    "snapType": "Button",
    "localtime": "2025-02-27 15:14:01",
    "imageSize": 74371,
    "image": "data:image/jpeg;base64,..."
  }
}
```

**字段说明：**

- `ts`：时间戳（毫秒）
- `devName`：设备名称
- `devMac`：设备 MAC 地址
- `battery`：电池电量（百分比）
- `snapType`：图像采集类型（如 `Button`, `Timer`, `Alarm in` 等）
- `localtime`：本地时间（字符串格式）
- `imageSize`：图像大小（单位：字节）
- `image`：Base64 编码的 JPEG 图像数据，前缀为 `data:image/jpeg;base64,`

**可视化建议：**

使用 Base64 图像数据可在网页或工具中快速预览图像：

```html
<img src="data:image/jpeg;base64,...">
```

也可以将 Base64 数据粘贴至 [Base64图像查看器](https://base64.guru/converter/decode/image) 进行在线预览。

### 功能验证流程

1. 进入休眠模式（等待5分钟自动唤醒）
2. 触发拍摄任务（定时/手动/外触发）
3. 确认图像质量（分辨率/曝光/对焦）
4. 验证数据上传（服务器接收确认，确认接收图像是否正常）

![抓拍成功提示](/img/NE101_cap_success.png)

## 设备工作模式详解

| 模式  | 触发条件 | 持续时间  | 主要功能      |
| --- | ---- | ----- | --------- |
| 初始化 | 上电自动 | 约1分钟  | 系统自检、时间同步 |
| 配置  | 按键触发 | 1-5分钟 | 参数设置、状态查看 |
| 工作  | 计划触发 | 按需启动  | 图像采集、数据上报 |
| 休眠  | 自动进入 | 按计划   | 低功耗待机     |

## 高级功能

### 设备维护

- **硬件复位**：短按重启键复位
- **硬件重置**：长按功能键10-11S后重置所有配置信息
- **设备信息**：在管理界面上可以查看MAC地址/固件版本
- **无线升级**：管理界面上支持OTA固件更新

![OTA升级界面](/img/NE101_ota.png)

> **技术支持**：首次使用建议完成全功能测试。
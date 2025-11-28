# Quick Start

## 产品概述

NE300系列是专为物联网应用设计的高性能AI智能相机产品线，其中NE301标准固件提供了AI功能预览与调试、数据上报、系统配置等核心功能。本指南将帮助您快速从开发板角度理解并掌握产品使用方法。

本开发板是一款低功耗无线电池版本抓拍/视频流，甚至是录像，并可以实现对其进行识别和推理的相机方案。产品核心搭载了意法半导体基于**Arm® Cortex®-M33内核的**STM32N657L0H3芯片，产品支持wifi6和BLE等无线通信。可搭配OS04C10和USB摄像头作为图像采集，可拓展Cat-1通信模组。产品适用于无线部署图像抓拍并进行边缘计算的低功耗相关场景，并有灵活安装的支架可选。

> Tips：相比较于整机产品形态下的功能介绍和使用，本篇更倾向于开发者调试角度，或者说是对功能细节的说明。

## 硬件准备

### 硬件组件

- NE300-MB01开发板
- 具体模组板（可选），详细参考[硬件组件说明](./1-hardware-guide/0-components-overview.md)

## 操作指南

### 设备认知

常规下默认有刷入标准版固件，你无需手动烧录固件，若遇到样机无法启动情况，可以参考固件烧录篇。


### 设备连接

<div style={{display:'flex', gap:'16px', flexWrap:'wrap', justifyContent:'center'}}>
  <img src="/img/ne301/development-board/quick-start/ne301-board.png" alt="NE301主板正面图" style={{width:'100%', maxWidth:'360px', borderRadius:'8px'}} />
  <img src="/img/ne301/development-board/quick-start/ne301-board-2.png" alt="NE301主板接口图" style={{width:'100%', maxWidth:'360px', borderRadius:'8px'}} />
</div>


**使用要点**：

1. 通过Type-C接口供电（5V/1A以上）
2. 接口采用防呆设计
3. 预留调试串口（115200bps）

详细硬件连接请参阅：[硬件连接指南](./1-hardware-guide/1-hardware-connection.md)


### 快速启动流程

1. **设备上电**
   
   - 连接USB电源（板子状态下也可以接电池仓使用电池供电）

2. **状态确认**
   
   - 板子左下方蓝色电源指示灯亮表示系统启动成功（如果是带外壳的话是看不到这此处的）
   - 系统初始化约需1分钟

3. **进入配置模式**
   
   - 按侧方按键键两秒，唤醒WiFi AP,此时CV灯板上的蓝色灯亮起(即使带壳也可见)

4. **连接管理界面**
   
   - 设备热点名称显示为NE301_XXXXXX
   - 手机/电脑连接设备的WiFi
   - 通过浏览器访问 http://192.168.10.10

> Tips：手机/电脑连接设备的WiFi时可能会影响此设备原本的网络状态，导致无法联网。



### 板级核心功能

#### 镜头模组的连接

注意连接线有J1-J2端的区别，避免接错。镜头可自行调焦，手握镜头两侧（避免指纹印到摄像头导致模糊），正反旋转进行调焦。调焦效果在登入web界面中，进入`功能调试`或者`硬件管理->图像管理`即可实时查看。

<p align="center">
  <img src="/img/ne301/development-board/quick-start/imagebackg.png" alt="NE301 镜头模组连接示意" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
</p>

#### CV灯板

直插式灯板，左边为ap指示灯，上电初始化完成呈现蓝色；右边为补光灯，在登入web界面中，进入`硬件管理->灯光管理`可以设置补光灯亮度、亮度开关、亮度有效时间段，设置完成后，设备触发抓图时补光灯生效。

<p align="center">
  <img src="/img/ne301/development-board/quick-start/cv-board.png" alt="NE301 CV灯板" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
</p>


#### SD卡槽

支持热插拔。登录web界面中，进入`存储管理`即可查看SD卡连接状态。备注：上电后接入SD卡，web需要刷新或者切换顶级功能栏，SD连接状态才会更新。支持SD卡的格式类型可以参考硬件手册篇。


#### 供电方式

支持正面USB供电，背面电池盒供电，直插式POE供电模块。


#### 灯光状态

<p align="center">
  <img src="/img/ne301/development-board/quick-start/light.png" alt="NE301 灯光状态示意" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
</p>


红色-power指示灯，USB长供电时power指示灯常亮。
蓝色-AP状态指示灯，系统初始化完成后同步灯板蓝色状态灯常亮。
绿色-DEBUG指示灯，在调试过程中会处于闪烁状态。

#### 串口使用

<p align="center">
  <img src="/img/ne301/development-board/quick-start/uart.png" alt="调试串口接口位置" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
</p>

串口线束接入口（防呆设计接入，参考硬件设计手册）

可以使用串口调试助手，设置波特率为115200，配置完毕后进入后台调试页面。


<div style={{display:'flex', gap:'16px', flexWrap:'wrap', justifyContent:'center'}}>
  <img src="/img/ne301/development-board/quick-start/ass.png" alt="串口调试助手界面" style={{width:'100%', maxWidth:'360px', borderRadius:'8px'}} />
  <img src="/img/ne301/development-board/quick-start/ass2.png" alt="串口调试输出示例" style={{width:'100%', maxWidth:'360px', borderRadius:'8px'}} />
</div>


#### Web端配置

找到设备对应的WIFI AP，命名为 `NE301_${MAC后六位}`
可以通过串口后台输入`ifconfig ap info`进行查看WiFi AP，在你的电脑网络中找到对应的SSID连接。

<p align="center">
  <img src="/img/ne301/development-board/quick-start/ssid.png" alt="NE301 SSID 搜索示意" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
</p>


连接成功后，进入浏览器，输入地址：`192.168.10.10`登入页面。
首次登入页面拥有固定账户admin，对应的初始密码为hicamthink，登入成功后可以通过`系统设置->设备密码管理->登录密码`进行密码修改

#### 功耗模式

如果你是开发者模式，默认你使用USB供电。
进入web页面后，需要你将`功能调试->功耗模式`先修改为全速模式。

若处于低功耗模式，默认你希望设备省电，无页面操作计时到一分半，设备将会进入休眠状态，此时灯板的蓝色指示灯与蓝色AP状态指示灯将熄灭，设备仅有power红色指示灯常亮着。
在这个状态下需要长按2s设备侧面的按键进行样机唤醒。

`系统设置->设备密码管理->休眠时间`同理修改为永不休眠。


### 功能验证流程

1. 进入休眠模式（确认处于低功耗模式下）
2. 触发拍摄任务（定时/按键/远程/IO触发）
3. 确认图像质量（分辨率/曝光/对焦无误）
4. 验证数据上传（服务器接收确认，确认接收图像是否正常）


## FAQ

### 画面模糊问题

Web页面上预览画面模糊，大概率是镜头焦距问题，可以手动旋转镜头来进行调节，同时还以可以将镜头模组正反旋转进行尝试。

接线细节：
<p align="center">
  <img src="/img/ne301/development-board/quick-start/wiring.png" alt="NE301 接线细节" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
</p>

### 异常断电

使用电池盒供电时，若拨码开关从1拨到NO（可能会误触到），会断开电池盒子的供电，设备处于下电状态，导致设备无法启动，此时重新拨回即可使用。

<p align="center">
  <img src="/img/ne301/development-board/quick-start/power-down.png" alt="电池盒拨码开关示意" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
</p>

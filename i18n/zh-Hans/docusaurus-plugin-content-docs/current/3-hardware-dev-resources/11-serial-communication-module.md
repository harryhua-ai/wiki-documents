import useBaseUrl from '@docusaurus/useBaseUrl';

# Serial Communication Module

Camthink Type-C/Type-A 转UART（TTL）通用串口通讯模块。
采用CP2101芯片，支持3.3V逻辑电平，支持NE301、NE101开发板串口数据调试。

> 如果你想对一些开发版进行二次开发或深入程序调试，如 NE301、NE101等，你可以使用这个工具来尝试。

## 产品特性
- 支持 Mac OS、Linux、Android、WinCE、Windows 7/8/10/11...
- 支持对外供电：5V 或 3.3V
- 带 USB 保护器件：ESD5V0L3
- 带 3 个 LED：TXD LED、RXD LED、POWER LED
- TXD、RXD、RTS、CTS：采用弯排针引出
- 通用串口调试器，也可用于调试NE101、NE301串口数据	

## 采用 CP2102 方案

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src={useBaseUrl('/img/Hardware_Dev_Resources/Serial_Communication_Module/2102.png')} alt="2102" style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

- 单芯片 Type C（A） 转 UART 数据转换器
    -无需外部电阻或外部振荡器；片内上电复位电路，片内电压调节器
-   集成 1024 字节 EEPROM (可用于存储各类信息)
- Type C 功能
    -符合 USB2.0 规范，全速 (12Mbps)
- UART 功能
    -所有握手和调制解调器接口信号
    -支持的数据格式：
        -数据位——5，6，7，8
        -停止位——1，1.5，2
        -校验位——奇校验，偶校验，无校验
    -波特率 300bps 至3Mbps
    -576 字节接收缓冲器；640 字节发送缓冲器
    -支持硬件或 X-On / X-Off 握手
    -支持事件状态
- 虚拟 COM 口器件驱动支持
    -Windows 8/7/Vista/Server 2003/XP/2000
    -Mac OS-X/OS-9
    -Linux 2.40或更高版本
- USBXpress 驱动支持
    -Windows 7/Vista/Server 2003/XP/2000
    -Windows CE
- 温度范围：-40 ~ +85°C

## 接线说明

- VCC_OUT：默认输出 3.3V (模块由 Type C 供电，须输出5V，要将跳线帽Vout短接)
- GND：GND
- TXD：TXD
- RXD：RXD
- RTS：RTS
- CTS：CTS
- 该模块为 Type C（A） 转 TTL 电平，切勿直连 RS232 电平，以免烧坏模块。

## 调试NE301开发板

可通过USB接口连接电脑，通过UART调试NE301开发板，连接示例图如下：

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src={useBaseUrl('/img/Hardware_Dev_Resources/Serial_Communication_Module/serial-communication-moudule.png')} alt="connection" style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

> 需注意接线顺序，GND 接 GND，TXD 接 RXD，RXD 接 TXD这种思路。

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src={useBaseUrl('/img/Hardware_Dev_Resources/Serial_Communication_Module/pin.jpg')} alt="pin" style={{ flex: '1 1 300px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src={useBaseUrl('/img/Hardware_Dev_Resources/Serial_Communication_Module/connection.jpg')} alt="connection" style={{ flex: '1 1 300px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

连接电脑后，需要安装驱动（如已有驱动，可跳过），驱动下载地址：https://www.silabs.com/software-and-tools/usb-to-uart-bridge-vcp-drivers

打开上述页面后，在下载区域选择你的系统（Windows / macOS / Linux）对应的 VCP 驱动包下载安装即可。
Windows 上如果插上设备后设备管理器仍显示未知设备/感叹号，安装完成后通常会变成可用的 COM 口（Virtual COM Port）。

连接成功后，可以使用串口调试软件（如：Putty、SecureCRT、Tera Term、SecureCRT 等）连接调试，串口调试软件可自行搜索下载。
连接参数如下：
- 端口：COMx(查看当前设备管理，确认COM口的号码选择连接)
- 波特率：115200
- 数据位：8
- 停止位：1
- 校验位：无

连接成功后，即可进行调试。

串口命令行用于调试/配置/网络连通性/升级等。命令行提示符默认是 AICAM>（见 Custom/Core/Log/debug.h）。

NE301开发板调试示例图如下：输入回车可查看相关的控制命令

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src={useBaseUrl('/img/Hardware_Dev_Resources/Serial_Communication_Module/data.png')} alt="data" style={{ width: '100%', maxWidth: '700px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

- 上电后看到 AICAM> 即表示 CLI 就绪；输入 help 或 ? 可查看当前固件实际注册的命令。
- 支持 Tab 补全、↑/↓ 历史、行内编辑；不确定时先输入 help/?。


## 常用串口命令

- `help` / `?`：查看命令列表与帮助。
- `sysinfo`：看版本/运行时间/当前模式。
- `loglevel`：调整串口/文件日志等级。
- `ifconfig` + `ping`：配置网络并验证连通性。
- `mq` / `mqtt`：MQTT 服务/客户端测试。
- `ls` / `cat` / `fget` / `fset`：看文件、看/改 NVS 配置。
- `standby` / `u0 ...`：进入低功耗与 WakeCore(U0) 联动调试。
- `cat1stat`：看 Cat1 状态。
- `cat1csq`：看 Cat1 信号质量。
- `nn`：查看神经网络相关配置。

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src={useBaseUrl('/img/Hardware_Dev_Resources/Serial_Communication_Module/nn.png')} alt="nn" style={{ width: '100%', maxWidth: '700px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

- 命令行内置：`Custom/Common/Utils/generic_cmdline.c`
- 默认命令注册：`Custom/Core/Log/debug.c` / `Custom/Core/Log/cli_cmd.c` / `Custom/Hal/driver_core.c`
实际支持命令以设备串口 `help` 输出为准。

——上述命令仅做参考，更多关于系统调试、文件配置、升级、网络等具体细节可参考 **[NE301源码](https://github.com/camthink-ai/ne301)** 进行进一步核验。
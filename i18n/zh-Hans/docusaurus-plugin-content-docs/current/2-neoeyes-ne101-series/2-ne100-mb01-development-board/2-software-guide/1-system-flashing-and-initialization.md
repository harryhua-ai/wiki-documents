# System Flashing

## 设备烧录说明

默认固件获取地址：[lowpower_camera.zip](https://github.com/camthink-ai/lowpower_camera/tree/main/bin)

### 硬件信息

- 主控芯片：ESP32-S3
- 开发框架：ESP-IDF v5.1.6

官方参考文档：[ESP-IDF v5.1 编程指南](https://docs.espressif.com/projects/esp-idf/en/release-v5.1/esp32s3/get-started/windows-setup.html)

### 烧录方式推荐

#### 1. VSCode插件烧录（推荐）

- 集成代码编辑、编译和烧录功能
- 开发环境配置参考：[开发环境搭建指南](./0-development-environment-setup.md)

#### 2. 独立烧录工具

烧录工具下载地址：[flash_download_tool_3.9.3_0.zip](https://github.com/camthink-ai/lowpower_camera/blob/main/tools/flash_download_tool_3.9.3_0.zip)

串口驱动下载地址：[CH341SER.EXE](https://github.com/camthink-ai/lowpower_camera/tree/main/tools/CH341SER.EXE)

##### 操作步骤：

1. 安装串口驱动，启动烧录工具
   
   ![烧录工具启动界面](/img/NE101_flash_tool.png)

2. 配置烧录参数：
   
   - 选择固件文件
   - 设置Flash烧录地址
   - 选择对应COM端口

3. 执行烧录：
   
   - 先执行ERASE擦除操作
   - 再执行START开始烧录
   - 按下重启按键或者拔插usb供电口重启设备
   
   ![烧录过程界面](/img/NE101_flash_tool1.png)

## OTA无线升级指南

### 升级步骤

1. **进入配置模式**
   
   - 按下设备功能键进入配置模式
   - 连接设备WiFi热点（SSID：NE101_XXXXXX）

2. **上传升级包**
   
   - 访问设备Web界面（http://192.168.1.1）
   - 导航至"设备维护"→"固件升级"
   - 选择升级文件并上传
   
   ![OTA升级界面](/img/NE101_ota.png)

3. **等待升级完成**
   
   - 系统自动验证并安装新固件
   - 升级完成后WiFi自动重连
   
   ![升级进度界面](/img/NE101_ota2.png)

4. **验证版本信息**
   
   - 在设备信息页面确认新版本号
   - 检查各功能模块是否正常
   
   ![版本信息界面](/img/NE101_ota3.png)

### 注意事项

1. 升级过程中请保持电源稳定
2. 建议升级前备份重要配置
3. 如升级失败，设备会自动回滚至上一可用版本
4. 完整升级日志可通过串口监视器查看

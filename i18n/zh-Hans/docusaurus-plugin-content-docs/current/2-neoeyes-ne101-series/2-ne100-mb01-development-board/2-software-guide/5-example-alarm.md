#  Alarm application trigger instructions

## 应用描述

通过NE101接入Alarm，想通过外部报警或者手动触发让NE101进行抓拍。
在实际操作中你可能会有如下疑问：在 Web 界面或其他配置工具中已经正确启用了 `Enable Alarm-In Capture`（开启报警输入抓断），并且将物理报警按钮（如干节点开关）连接到了主板上的 **Alarm 接口**。但是，按下按钮时，相机无法被唤醒，也没有触发拍照或报警上报。

## 问题原因

该问题主要是由于 **NE101 硬件设计中的资源复用** 导致的，并不是程序BUG，因硬件资源有限设计如此的，默认支持PIR，不支持Alarm，但可以动手实现，具体原因如下：

1.  **固件/IO 资源冲突**：
    在 NE101 的固件源码中 `main/sleep.h` 和 `main/misc.h`，**PIR 传感器中断信号 `PIR_INTDOUT_IO`** 和 **Alarm 报警输入信号 `ALARM_IN_IO`** 被定义为同一个引脚：**GPIO 2**。

    参考代码如下：

    ```c
    // main/sleep.h & main/pir.h & main/misc.h 相关定义
    #define PIR_INTDOUT_IO      (2)
    #define ALARM_IN_IO         (2)
    ```

2.  **硬件电路默认配置**：
    现版本的 NE101 硬件主板默认配置为 **支持 PIR 传感器**。为了保证信号质量，GPIO 2 默认连通到了 **PIR 接口**。
    而独立的 **Alarm 接口** 到 GPIO 2 的通路在出厂时是断开的（缺少关键的连接电阻）。因此，即使软件上开启了 Alarm 功能，GPIO 2 实际上处于悬空或仅受内部上拉控制的状态，无法感知 Alarm 接口的电平变化。

## 解决方案

针对此问题，有两种解决方案。建议根据实际动手能力和应用场景选择：

### 方案一：修改连接方式（推荐）

直接利用线路已经连通的 **PIR 接口** 来接入 Alarm 按钮。这是最简单且不破坏主板的方法。

**操作步骤**：
1.  找到主板上的 **4-Pin PIR 接口**。
2.  准备 Alarm 按钮的连接线（通常为 2 根线：信号线和地线）。
3.  将 Alarm 按钮接入 PIR 接口，从左边数第一个和第三个，**只使用这 2 个 Pin**：
    *   **Signal (GPIO 2)**
    *   **GND (地)**
    *   *另外 2 个 Pin (VCC 等) 悬空不接。*

**原理**：
由于 PIR 接口的 Signal 引脚已经物理连接到了 GPIO 2，将干节点按钮接在 Signal 和 GND 之间。当按钮按下时，Signal 被拉低（GND），符合固件中 `ALARM_IN_ACTIVE (0)` 的触发逻辑，从而成功触发报警。

### 方案二：修改主板硬件

如果您必须使用独立的 Alarm 接口，需要对主板进行微小的硬件改动。

**操作步骤**：
1.  定位主板 **右侧** 区域。
2.  找到与 Alarm 接口通路关联的空焊盘位置（关联电阻位）。
3.  **焊接一个 0Ω 电阻**（或直接用锡短接），将 Alarm 接口与 GPIO 2 连通。

**注意**：
*   此操作需要焊接工具和一定的硬件操作经验。
*   **警告**：修改后，GPIO 2 将同时连接到 PIR 接口和 Alarm 接口。请确保不同时接入 PIR 传感器和 Alarm 按钮，否则两者信号会互相干扰，甚至导致短路或误触发。

![ne101-alarm](/img/ne101-alarm.png)

## 固件配置确认

无论使用哪种硬件方案，请确保固件配置符合干节点模式（默认配置）：

*   **PIR_ENABLE** 应为 `0`（关闭 PIR 驱动逻辑，通过通用的 GPIO 中断唤醒）。
*   **Enable Alarm-In Capture** 必须为开启状态。

在 `main/sleep.c` 的逻辑中，当 `PIR_ENABLE` 为 0 且 Alarm 开启时，GPIO 2 会被配置为 **内部上拉 (Internal Pull-up)**，按下按钮拉低电平即可唤醒设备。

参考代码如下：
```c
// main/sleep.c
#if PIR_ENABLE
    // ... PIR 逻辑 ...
#else
    if(capture.bAlarmInCap == true){
        rtc_gpio_pullup_en(ALARMIN_WAKEUP_PIN); // 开启上拉
        rtc_gpio_pulldown_dis(ALARMIN_WAKEUP_PIN);
        esp_sleep_enable_ext1_wakeup(BIT64(ALARMIN_WAKEUP_PIN), ALARMIN_WAKEUP_LEVEL); // 低电平唤醒
    }
#endif
```

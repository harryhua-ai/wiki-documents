# Hardware Connection

## 主板顶层接口描述

- Type-C供电和USB调试口

- SD卡槽

- 复位按键

- 抓拍按键

- 串口调试接口-N6

- ST-Link调试口-N6

- ST-Link调试口-U0

- ST-BOOT模式选择

- 报警输入口

- USB摄像头接口或PIR连接口

- 灯板连接座*2

- OS04C10摄像头连接座

- 滑动开关--断开电池供电

## 主板底层接口描述

电源连接端口

扩展IO接口-SPI+I2C+UART+GPIO以及电源输出

## 接口描述

##### 外设电源控制IO配置--STM32N657L0H3

在使用摄像头和补光灯前，需要将CAM_PWR引脚的电平拉高；在使用TF卡前，必须要将TF_PWR_ON引脚拉高；另外使用电池电量检测功能前，需要将BAT_DEF_ON引脚拉高；使用USB数据通信前，需要将PWR_USB_3.3V引脚拉高。

| pin序 | 引脚名称         | 引脚功能 | IO类型 | 初始电平状态  | 复用  |
| ---- | ------------ | ---- | ---- | ------- | --- |
| T2   | CAM_PWR      | PF9  | I/O  | PD 100K |     |
| W12  | TF_PWR_ON    | PA1  | I/O  | PD 100K |     |
| T8   | BAT_DEF_ON   | PA11 | I/O  | PD 100K |     |
| W11  | PWR_USB_3.3V | PG13 | I/O  |         |     |

##### RS485通信控制--STM32N657L0H3

需要使用RS485通信时，需要将RS485_RE#和RS485_DE进行拉高或者拉低操作，不使用时则将RS485_RE#和RS485_DE设置为高阻态。

| pin序 | 引脚名称            | 引脚功能 | IO类型 | 初始电平状态 | 复用        |
| ---- | --------------- | ---- | ---- | ------ | --------- |
| A18  | RS485_USART3_RX | PE0  | I/O  |        | USART3_RX |
| B17  | RS485_RE#       | PB3  | I/O  |        |           |
| B18  | RS485_USART3_TX | PE1  | I/O  |        | USART3_TX |
| B19  | RS485_DE        | PE2  | I/O  |        |           |

##### 摄像头接口

OS04C10接口使用CSI-2线制传输数据，主板上的接口如下表：

使用前需将CAM_PWR引脚拉高。

| pin序 | 引脚名称         | 引脚功能    | IO类型 | 初始电平状态  | 复用  |
| ---- | ------------ | ------- | ---- | ------- | --- |
| 1    | GND          | S       |      |         |     |
| 2    | CSI_D0N      | CSI_D0N | I    |         |     |
| 3    | CSI_D0P      | CSI_D0P | I    |         |     |
| 4    | GND          | S       |      |         |     |
| 5    | CSI_D1N      | CSI_D1N | I    |         |     |
| 6    | CSI_D1P      | CSI_D1P | I    |         |     |
| 7    | GND          | S       |      |         |     |
| 8    | CSI_CKN      | CSI_CKN | I    |         |     |
| 9    | CSI_CKP      | CSI_CKP | I    |         |     |
| 10   | GND          | S       |      |         |     |
| 11   | CSI_EN       | PG0     | I/O  |         |     |
| 12   | CSI_CLK      | PA8     | I/O  |         |     |
| 13   | CSI_I3C2_SCL | PB10    | I/O  | PU 4.7K |     |
| 14   | CSI_I3C2_SDA | PB11    | I/O  | PU 4.7K |     |
| 15   | 3V3_CSI      | S       |      |         |     |

##### 闪光灯控制--STM32N657L0H3

使用前需将CAM_PWR引脚拉高。

| pin序 | 引脚名称    | 引脚功能 | IO类型 | 初始电平状态  | 复用       |
| ---- | ------- | ---- | ---- | ------- | -------- |
| R2   | PWM_LED | PF7  | I/O  | PD 100K | TIM3_CH3 |

##### 指示灯控制--STM32N657L0H3

使用前确保U0_PWR_3V3已拉高，并且STM32N657L0H3正常与运行

| pin序 | 引脚名称           | 引脚功能 | IO类型 | 初始电平状态 | 复用  |
| ---- | -------------- | ---- | ---- | ------ | --- |
| P1   | LIGHT_RESISTOR | PF3  | I/O  | PD 51K |     |
| V16  | PWR_LED1       | PG9  | I/O  |        |     |
| T12  | DUBUG_LED      | PG10 | I/O  |        |     |

##### TF卡通信控制--STM32N657L0H3

使用前需将TF_PWR_ON引脚拉高，打开TF卡电源

| 接口pin序 | 引脚名称        | 引脚功能 | IO类型 | 初始电平状态 | 复用  |
| ------ | ----------- | ---- | ---- | ------ | --- |
| 1      | SDIO_TF_D2  | PC10 | I/O  | PU 10K |     |
| 2      | SDIO_TF_D3  | PC11 | I/O  | PU 10K |     |
| 3      | SDIO_TF_CMD | PH2  | I/O  | PU 10K |     |
| 4      | SDIO_TF_CK  | PC12 | I/O  | PU 10K |     |
| 5      | SDIO_TF_D0  | PC8  | I/O  | PU 10K |     |
| 6      | SDIO_TF_D1  | PC9  | I/O  | PU 10K |     |
| 7      | SDIO_TF_INT | PD0  | I/O  | PU 1M  |     |

##### WIFI芯片通信控制--STM32N657L0H3

| pin序 | 引脚名称               | 引脚功能 | IO类型 | 初始电平状态  | 复用  |
| ---- | ------------------ | ---- | ---- | ------- | --- |
| D10  | SPI4_SCK           | PE12 | I/O  | PU 10K  |     |
| D8   | SPI4_NSS           | PE11 | I/O  | PU 10K  |     |
| E16  | SPI4_MOSI          | PB7  | I/O  |         |     |
| D19  | SPI4_MISO          | PB6  | I/O  |         |     |
| A13  | WIFI_SPI4_IRQ      | PE8  | I/O  |         |     |
| A15  | WIFI_SleepMode_STA | PD5  | I/O  |         |     |
| A11  | WIFI_ULP_WAKEUP    | PD12 | I/O  |         |     |
| A17  | WIFI_RESET_N       | PD11 | I/O  | PU 100K |     |
| A14  | WIFI_POC_IN        | PB15 | I/O  |         |     |
| B15  | N6_PWR_WIFI        | PB9  | I/O  | PD 100K |     |

##### 外置PSRAM通信控制--STM32N657L0H3

| pin序 | 引脚名称          | 引脚功能 | IO类型 | 初始电平状态 | 复用  |
| ---- | ------------- | ---- | ---- | ------ | --- |
| H18  | XSPIM_P1_IO0  | PP0  | I/O  |        |     |
| F18  | XSPIM_P1_IO1  | PP1  | I/O  |        |     |
| K18  | XSPIM_P1_IO2  | PP2  | I/O  |        |     |
| K19  | XSPIM_P1_IO3  | PP3  | I/O  |        |     |
| L19  | XSPIM_P1_IO4  | PP4  | I/O  |        |     |
| J19  | XSPIM_P1_IO5  | PP5  | I/O  |        |     |
| H19  | XSPIM_P1_IO6  | PP6  | I/O  |        |     |
| G19  | XSPIM_P1_IO7  | PP7  | I/O  |        |     |
| F19  | XSPIM_P1_IO8  | PP8  | I/O  |        |     |
| E19  | XSPIM_P1_IO9  | PP9  | I/O  |        |     |
| D18  | XSPIM_P1_IO10 | PP10 | I/O  |        |     |
| N19  | XSPIM_P1_IO11 | PP11 | I/O  |        |     |
| N18  | XSPIM_P1_IO12 | PP12 | I/O  |        |     |
| M19  | XSPIM_P1_IO13 | PP13 | I/O  |        |     |
| M18  | XSPIM_P1_IO14 | PP14 | I/O  |        |     |
| L18  | XSPIM_P1_IO15 | PP15 | I/O  |        |     |
| F16  | XSPIM_P1_NCS1 | PO0  | I/O  | PU 10K |     |
| G18  | XSPIM_P1_DQS0 | PO2  | I/O  |        |     |
| E18  | XSPIM_P1_DQS1 | PO3  | I/O  |        |     |
| J18  | XSPIM_P1_CLK  | PO4  | I/O  |        |     |

##### 外置FLASH通信控制--STM32N657L0H3

| pin序 | 引脚名称          | 引脚功能 | IO类型 | 初始电平状态 | 复用  |
| ---- | ------------- | ---- | ---- | ------ | --- |
| R19  | XSPIM_P2_DQS0 | PN0  | I/O  |        |     |
| P16  | XSPIM_P2_NCS1 | PN1  | I/O  | PU 10K |     |
| T19  | XSPIM_P2_IO0  | PN2  | I/O  |        |     |
| P19  | XSPIM_P2_IO1  | PN3  | I/O  |        |     |
| V19  | XSPIM_P2_IO2  | PN4  | I/O  |        |     |
| U18  | XSPIM_P2_IO3  | PN5  | I/O  |        |     |
| U19  | XSPIM_P2_CLK  | PN6  | I/O  |        |     |
| V18  | XSPIM_P2_IO4  | PN8  | I/O  |        |     |
| T18  | XSPIM_P2_IO5  | PN9  | I/O  |        |     |
| R18  | XSPIM_P2_IO6  | PN10 | I/O  |        |     |
| P18  | XSPIM_P2_IO7  | PN11 | I/O  |        |     |

##### 复位按键--STM32N657L0H3

| pin序 | 引脚名称 | 引脚功能 | IO类型 | 初始电平状态 | 复用  |
| ---- | ---- | ---- | ---- | ------ | --- |
| F2   | NRST | NRST | I    | PU 47K |     |

##### 串口调试接口J26--STM32N657L0H3

| 接口pin序 | 引脚名称      | 引脚功能 | IO类型 | 初始电平状态 | 复用  |
| ------ | --------- | ---- | ---- | ------ | --- |
| 1      | 3V3       |      | S    |        |     |
| 2      | USART2_RX | PA2  | I/O  | PU 10K |     |
| 3      | USART2_TX | PF6  | I/O  | PU 10K |     |
| 4      | GND       |      | S    |        |     |

##### ST-Link调试接口--STM32N657L0H3

| 接口pin序 | 引脚名称   | 引脚功能 | IO类型 | 初始电平状态 | 复用  |
| ------ | ------ | ---- | ---- | ------ | --- |
| 1      | VCC_IN |      | S    |        |     |
| 2      | SWDIO  | PA13 | I/O  |        |     |
| 3      | SWCLK  | PA14 | I/O  |        |     |
| 4      | GND    |      | S    |        |     |

##### BOOT模式切换--STM32N657L0H3

| pin序 | 引脚名称  | 引脚功能  | IO类型 | 初始电平状态 | 复用  |
| ---- | ----- | ----- | ---- | ------ | --- |
| F4   | BOOT0 | BOOT0 | I    | PD 1M  |     |
| T10  | BOOT1 | PA6   | I/O  | PD 1M  |     |

##### 外部高速时钟和低速时钟--STM32N657L0H3

| pin序 | 引脚名称           | 引脚功能           | IO类型 |
| ---- | -------------- | -------------- | ---- |
| A5   | HSE_OSC_IN     | PH0-OSC_IN     | I/O  |
| B5   | HSE_OSC_OUT    | PH1-OSC_OUT    | I/O  |
| D1   | N6_32.768KHZ_P | PC15-OSC32_OUT | I/O  |
| E1   | N6_32.768KHZ_N | PC14-OSC32_IN  | I/O  |

##### 与STM32U073KBU6芯片通信

| pin序 | 引脚名称     | 引脚功能 | IO类型 | 初始电平状态 | 复用  |
| ---- | -------- | ---- | ---- | ------ | --- |
| U1   | UART9_RX | PF1  | I/O  | PU 10K |     |
| U3   | UART9_TX | PF0  | I/O  | PU 10K |     |

#### 通信模块接口

通信模块被安装在J11和J15上。以下将提供J12、J15、J11接口IO。

##### 16PIN扩展接口说明--J12

16PIN扩展头提供UART、I2C、SPI和RS485等通信接口。开发人员可以根据需要使用这些接口来扩展PIR传感器、OLED模块等传感器模块

| pin序 | 引脚名称       | 引脚功能      | IO类型 | 初始电平状态  | 复用        |
| ---- | ---------- | --------- | ---- | ------- | --------- |
| 1    | RS485_B    |           |      |         |           |
| 2    | GND        |           | S    |         |           |
| 3    | RS485_A    |           |      |         |           |
| 4    | GND        |           | S    |         |           |
| 5    | PD8_TAMP   | PD8       | I/O  |         |           |
| 6    | 5V0_POE    | Power-In  | S    |         |           |
| 7    | SPI2_MISO  | PD6       | I/O  |         |           |
| 8    | VCC_3V3    | Power-Out | S    |         |           |
| 9    | SPI2_SCK   | PF2       | I/O  | PU 10K  |           |
| 10   | PF4_ADC    | PF4       | I/O  |         | ADC_INP18 |
| 11   | SPI2_MOSI  | PD2       | I/O  |         |           |
| 12   | SPI2_NSS   | PB12      | I/O  |         |           |
| 13   | I2C2_SCL   | PD14      | I/O  | PU 4.7K |           |
| 14   | LPUART1_TX | PA9       | I/O  |         |           |
| 15   | I2C2_SDA   | PD15      | I/O  | PU 4.7K |           |
| 16   | LPUART1_RX | PA10      | I/O  |         |           |

VCC_3V3输出控制--STM32N657L0H3

需要使用3.3V输出时，需要将PWR_VCC_EXT引脚拉高。

| pin序 | 引脚名称        | 引脚功能 | IO类型 | 初始电平状态  | 复用  |
| ---- | ----------- | ---- | ---- | ------- | --- |
| M2   | PWR_VCC_EXT | PF10 | I/O  | PD 100K |     |

##### 12PIN模块接口说明--J15

| pin序 | 引脚名称         | 引脚功能      | IO类型 | 初始电平状态 | 复用  |
| ---- | ------------ | --------- | ---- | ------ | --- |
| 1    | CAT1_MAIN_IR | PA2(U0)   | I/O  |        |     |
| 2    | 3V3_VDD0     |           | S    |        |     |
| 3    | GND          |           | S    |        |     |
| 4    | GND          |           | S    |        |     |
| 5    | I2C1_SCL     | PE5       | I/O  | PU 10K |     |
| 6    | I2C1_SDA     | PE6       | I/O  | PU 10K |     |
| 7    | SAI1_FS_B    | PG1       | I/O  |        |     |
| 8    | SAI1_MCLK_B  | PG12      | I/O  |        |     |
| 9    | SAI1_SD_B    | PA3       | I/O  |        |     |
| 10   | SAI1_SCK_B   | PG0       | I/O  |        |     |
| 11   | OTG2_HSDP    | OTG2_HSDP | I/O  |        |     |
| 12   | OTG2_HSDM    | OTG2_HSDM | I/O  |        |     |

3V3_VDD0输出控制--STM32N657L0H3

需要使用3.3V输出时，需要将PWR_VDD0引脚拉高。

| pin序 | 引脚名称     | 引脚功能 | IO类型 | 初始电平状态  | 复用  |
| ---- | -------- | ---- | ---- | ------- | --- |
| P2   | PWR_VDD0 | PF14 | I/O  | PD 100K |     |

##### 16PIN模块接口说明--J11

| pin序 | 引脚名称                    | 引脚功能 | IO类型 | 初始电平状态  | 复用        |
| ---- | ----------------------- | ---- | ---- | ------- | --------- |
| 1    | VCC_IN                  |      | S    |         |           |
| 2    | 3V3                     |      | S    |         |           |
| 3    | VCC_IN                  |      | S    |         |           |
| 4    | 3V3                     |      | S    |         |           |
| 5    | CAT1_PWR_ON(Halow_wifi) | PG8  | I/O  |         |           |
| 6    | GND                     |      | S    |         |           |
| 7    | HalowSPI6_MOSI          | PA7  | I/O  |         |           |
| 8    | HalowSPI6_MISO          | PB4  | S    |         |           |
| 9    | CAT1_UART7_RX           | PG11 | I/O  | PU 10K  |           |
| 10   | HalowSPI6_NSS           | PA0  | I/O  |         | ADC_INP18 |
| 11   | CAT1_UART7_TX           | PA15 | I/O  |         |           |
| 12   | Halow_IRQ               | PA4  | I/O  |         |           |
| 13   | GND                     |      | I/O  | PU 4.7K |           |
| 14   | SAI1_SD_A(WIFI_WAKE)    | PB2  | I/O  |         |           |
| 15   | HalowSPI6_SCK           | PA5  | I/O  | PU 4.7K |           |
| 16   | Halow_RST               | PB0  | I/O  |         |           |

3V3输出控制--STM32U073KBU6

需要使用3.3V输出时，需要将U0_PWR_3V3引脚拉高。

| pin序 | 引脚名称     | 引脚功能 | IO类型 | 初始电平状态  | 复用  |
| ---- | -------- | ---- | ---- | ------- | --- |
| 11   | PWR_VDD0 | PA5  | I/O  | PD 100K |     |

##### 触发按键--STM32U073KBU6

| 芯片pin序 | 引脚名称      | 引脚功能      | IO类型 | 初始电平状态 | 复用  |
| ------ | --------- | --------- | ---- | ------ | --- |
| 6      | U0_CONFIG | PA0-CK_IN | I/O  | PU 47K |     |

##### 与STM32N657L0H3芯片通信

| pin序 | 引脚名称          | 引脚功能 | IO类型 | 初始电平状态 | 复用  |
| ---- | ------------- | ---- | ---- | ------ | --- |
| 29   | U0_LPUART2_TX | PB6  | I/O  |        |     |
| 30   | U0_LPUART2_RX | PB7  | I/O  |        |     |

##### 控制引脚和触发引脚--STM32U073KBU6

| pin序 | 引脚名称                    | 引脚功能     | IO类型 | 初始电平状态  | 复用  |
| ---- | ----------------------- | -------- | ---- | ------- | --- |
| 8    | CAT1_MAIN_IR            | PA2      | I/O  |         |     |
| 10   | U0_PWR_WIFI             | PA4      | I/O  | PD 100K |     |
| 11   | U0_PWR_3V3              | PA5      | I/O  | PD 100K |     |
| 12   | U0_PWR_AON              | PA6      | I/O  | PD 100K |     |
| 13   | U0_PWR_N6               | PA7      | I/O  | PD 100K |     |
| 14   | CAT1_PWR_ON(Halow_wifi) | PB0      | I/O  |         |     |
| 15   | U0_RST_N6               | PB1      | I/O  | PU 47K  |     |
| 18   | TEST_USB_IN             | PA8      | I/O  |         |     |
| 21   | WIFI_SPI4_IRQ           | PA1[PA9] | I/O  |         |     |

##### PIR 传感器接口IO配置--STM32U073KBU6

| 接口pin序 | 引脚名称      | 引脚功能 | IO类型 | 初始电平状态 | 复用  |
| ------ | --------- | ---- | ---- | ------ | --- |
| 1      | VDD       | 供电脚  | S    |        |     |
| 2      | GND       | 接地脚  | S    |        |     |
| 3      | Serial_IN | PA3  | I/O  |        |     |
| 4      | INT/Dout  | PA1  | I/O  |        |     |


import AccessoriesTable from '@site/src/components/AccessoriesTable';
import useBaseUrl from '@docusaurus/useBaseUrl';

# Cat.1 Module

## 1. 产品特性
本模组基于EG912U-GL（适用非北美）和EG915Q-NA(适用于北美)开发。

EG912U/EG915Q专为M2M和IoT应用设计的LTE Cat 1模块，支持无缝网络切换与丰富接口，核心特性包括：

### EG912U系列模组参数说明

| **Module**  | **EG912U-GL** |
|:---:|:---:|
| **网络覆盖** |全球频段（B1/2/3/4/5/7/8/12/13/17/18/19/20/25/26/28/66 LTE-FDD + B34/38/39/40/41 LTE-TDD） |
| **数据速率** | LTE-FDD: 10Mbps（DL）/5Mbps（UL）LTE-TDD: 8.96Mbps（DL）/3.1Mbps（UL） |
| **可选功能** | GNSS（GPS/GLONASS/BDS/Galileo/QZSS）蓝牙4.2Wi-Fi Scan |
| **接口** | 3x UART, USB 2.0, PCM/I2S音频, 2x ADC, SPI/I2C/LCM/摄像头/SD卡（QuecOpen®） |
| **天线** | 主天线 + GNSS/Wi-Fi天线（可选） |

## Cat-1 (EG912U)模组规格参数
| 1    | Module                   | Quectel EG912UGL                                             |
|:----:|:------------------------:|:------------------------------------------------------------:|
| 2    | LTE-FDD                  | B1/ 2/ 3/ 4/ 5/ 7/ 8/ 12/ 13/ 17/ 18/ 19/ 20/ 25/ 26/ 28/ 66 |
| 3    | LTE-TDD                  | B34/ 38/ 39/ 40/ 41                                          |
| 4    | GSM                      | B2/ 3/ 5/ 8                                                  |
| 5    | Antenna                  | PCB Antenna                                                  |
| 6    | Communication Interfaces | UART                                                         |
| 7    | Power Supply             | DC 4-6V                                                      |
| 8    | Operation Temperature    | -20℃ ~ +60℃                                                  |
| 9    | Storage Temperature      | -40℃ ~ +85℃                                                  |
| 10   | Dimensions               | 60 x 60 mm                                                   |
| 11   | Certifications           | CE                                                           |

### EG915Q模组参数说明
|  **Module**  | **EG915Q-NA** |
|:---:|:---:|
| **网络覆盖** |B2/B4/B5/B12/B13/B14/B66/B71B2/B4/B5/B12/B13/B14/B66/B71 |
| **数据速率** | LTE-FDD: 10Mbps（DL）/5Mbps（UL） |
| **接口** | UART, USB 2.0, PCM, SPI/I2C/LCM/摄像头 |
| **天线** | 主天线 + GNSS/Wi-Fi天线（可选） |
---
## Cat-1 (EG915Q)模组规格参数
| 1    | Module                   | Quectel EG915Q-NA                                             |
|:----:|:------------------------:|:------------------------------------------------------------:|
| 2    | LTE-FDD                  | B2/B4/B5/B12/B13/B14/B66/B71B2/B4/B5/B12/B13/B14/B66/B71 |
| 3    | Antenna                  | PCB Antenna                                                  |
| 4    | Communication Interfaces | UART                                                         |
| 5    | Power Supply             | DC 4-6V                                                      |
| 6    | Operation Temperature    | -20℃ ~ +60℃                                                  |
| 7    | Storage Temperature      | -40℃ ~ +85℃                                                  |
| 8   | Dimensions               | 60 x 60 mm                                                   |
| 9   | Certifications           | FCC                                                           |

## 接口说明(J1)

模组通过J1接口，与主板通过UART进行通讯连接。接口的定义如下：

| PIN# | Pin Name | Functions          | Pin Type | Pull Up/Down |
| :---:| :------: | :----------------: | :------: | :-----------:|
| 1    | UART_TXD | UART Transmit      | OUT      | N/A          |
| 2    | NC       |                    |          |              |
| 3    | CAT1_PWR | High=ON;Low=OFF    | IN       | N/A          |
| 4    | NC       |                    |          |              |
| 5    | NC       |                    |          |              |
| 6    | NC       |                    |          |              |
| 7    | UART_RXD | UART Receive       | IN       | N/A          |
| 8    | NC       |                    |          |              |
| 9    | GND      | GND                | POWER    |              |
| 10   | GND      | GND                | POWER    |              |
| 11   | NC       |                    |          |              |
| 12   | NC       |                    |          |              |
| 13   | VCC_IN   | Power Supply       |          |              |
| 14   | 3V3      | 3.3 V power supply | POWER    |              |
| 15   | VCC_IN   | Power Supply       | POWER    |              |
| 16   | 3V3      | 3.3 V power supply | POWER    |              |
## 规格尺寸

60*60mm
<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
  <img src={useBaseUrl('/img/Hardware_Dev_Resources/Cat_1/cat1PCBA.jpg')} alt="cat1PCBA" style={{ height: '400px', objectFit: 'contain', margin: '0 auto' }} />
</div>

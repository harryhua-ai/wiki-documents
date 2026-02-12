import AccessoriesTable from '@site/src/components/AccessoriesTable';
import useBaseUrl from '@docusaurus/useBaseUrl';

# 4G Module
## 产品特性
Quectel EM05-G 是一款专为 IoT/M2M 应用设计的 LTE Cat 4 模块，支持多网络制式（LTE-FDD/TDD、WCDMA、CDMA 等），采用 M.2 封装，适用于工业路由器、车载设备、数字标牌等场景。其核心特性包括：
- **全球频段覆盖**：支持 LTE-FDD/TDD、WCDMA 等多频段，适配全球主流运营商。
- **高速传输**：下行速率最高 150 Mbps，上行速率最高 50 Mbps。
- **多系统兼容**：支持 Windows/Linux/Android 系统驱动，集成 DFOTA 和 GNSS（可选）。
- **工业级可靠性**：工作温度范围 -30°C 至 +70°C，扩展温度 -40°C 至 +85°C。

### 型号对比

|型号       |区域/运营商      | 支持网络制式             | 尺寸 (mm)       | 温度范围        |
|:---------:|:---------------:|:-----------------------:|:---------------:|:---------------:|
| EM05-CN   | 中国、泰国、印度| LTE-FDD/TDD、WCDMA、CDMA | 30.0×42.0×2.3   | -30°C~+70°C      |
| EM05-E    | 欧洲、澳大利亚、新西兰| LTE-FDD/TDD、WCDMA | 30.0×42.0×2.3   | -30°C~+70°C      |
| EM05-G    |&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;全球 | LTE-FDD (B1/B2/B3/B4/B5/B7/B8/B12/B13/B14/B18/B19/B20/B25/B26/B28/B66/B71) | 30.0×42.0×2.3| -40°C~+85°C (扩展) |

---

## 规格参数

| 参数                | 规格                                                              |
|:-------------------:|:-----------------------------------------------------------------:|
| 供电电压            | 3.135 V ~ 4.4 V（典型值 3.3 V）                                    |
| 工作电流（LTE-FDD） | 最高 1005 mA（B71 频段）                                           |
| 工作温度            | -30°C ~ +70°C（标准）；-40°C ~ +85°C（扩展）                        |
| 存储温度            | -40°C ~ +90°C                                                      |
| 天线接口阻抗        | 50 Ω                                                               |
| USB 接口            | USB 2.0 高速（480 Mbps）                                           |

### 射频性能
| 网络制式    | 下行速率   | 上行速率    | 支持频段示例                          |
|:----------:|:----------:|:----------: |:------------------------------------:|
| LTE Cat 4  | 150 Mbps   | 50 Mbps    | B1/B2/B3/B4/B5/B7/B8/B12/B13/B14等   |
| DC-HSDPA   | 42 Mbps    | 5.76 Mbps  | WCDMA B1/B2/B4/B5/B6/B8/B19          |

---

## 接口说明（M.2 Key B）

### 引脚定义表
| 引脚类型       | 引脚名称          | 功能描述                              |
|:-------------:|:-----------------:|:-------------------------------------:|
| **电源**       | VCC               | 主电源输入（3.3 V）                   |
| **地**         | GND               | 接地                                  |
| **USB 接口**   | USB_DP/USB_DM     | USB 2.0 差分数据线（90 Ω阻抗匹配）    |
| **SIM 接口**   | USIM1_DATA/CLK    | 1.8 V/3.0 V SIM 卡数据与时钟信号      |
| **控制信号**   | RESET#            | 模块复位（低电平有效）                |
| **射频接口**   | ANT_MAIN          | 主天线接口（LTE/WCDMA）               |
| **GNSS 接口**  | ANT_DRX/ANT_GNSS  | 分集接收/GNSS 天线接口（可选）        |

---

## 使用说明

### 硬件设计要点
1. **供电设计**  
   - 需使用 3.3 V 稳压电源，瞬态电压需 ≤4.7 V。
   - 参考电路需包含滤波电容（如 220 μF 钽电容 + 100 nF 陶瓷电容）。

2. **天线连接**  
   - 主天线（ANT_MAIN）和分集天线（ANT_DRX）需使用 50 Ω 射频线缆。
   - GNSS 天线需支持 L1 频段（1559~1609 MHz）。

3. **SIM 卡接口**  
   - 支持 1.8 V/3.0 V SIM 卡，需靠近模块放置以减少信号干扰。
   - 热插拔检测引脚（USIM_DET）需通过电阻分压保护。

4. **固件升级**  
   - 通过 USB 接口使用 DFOTA 或 QFlash 工具升级固件。

## 规格尺寸

### 尺寸说明
- **尺寸**：42.0 mm（长） × 30.0 mm（宽） × 2.3 mm（高）
- **安装孔**：4 个 M2 螺纹孔，建议使用导热硅胶垫辅助散热
<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
  <img src={useBaseUrl('/img/Hardware_Dev_Resources/4G_Module/4G_Module.jpg')} alt="4G_Module" style={{ height: '400px', objectFit: 'contain', margin: '0 auto' }} />
</div>
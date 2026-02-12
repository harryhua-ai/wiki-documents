import AccessoriesTable from '@site/src/components/AccessoriesTable';
import useBaseUrl from '@docusaurus/useBaseUrl';

# WiFi Module

**Fn-Link FG6222MPUC-02 技术文档**

---

### 1. 主要特性
| 特性         | 说明                                                   |
| ------------ | ------------------------------------------------------ |
| **无线标准** | Wi-Fi 5 (802.11a/b/g/n/ac) + Bluetooth 5.0             |
| **接口类型** | M.2 Key E（PCIe x1 + USB 2.0）                         |
| **频段支持** | 2.4GHz（20/40MHz） + 5GHz（20/40/80MHz）               |
| **MIMO技术** | 2T2R（双发双收），支持MU-MIMO                          |
| **传输速率** | Wi-Fi：最高866.7Mbps（5GHz 80MHz），蓝牙：3Mbps（EDR） |
| **工作温度** | 0°C 至 70°C                                            |
| **物理尺寸** | 22mm × 30mm × 2.2mm，（符合M.2 2230规格）              |
| **兼容系统** | Android/Linux/Win CE/iOS/XP/WIN7/WIN10                 |

---

### 2. 规格参数
#### **射频性能（典型值）**
| 频段       | 调制方式     | 输出功率（dBm） | 接收灵敏度（dBm） |
| ---------- | ------------ | --------------- | ----------------- |
| **2.4GHz** | 802.11b      | 20              | -92（1Mbps）      |
|            | 802.11g/n    | 17              | -70（MCS7）       |
| **5GHz**   | 802.11a/n/ac | 15              | -56（MCS9）       |

#### **蓝牙规格**
| 参数           | 规格                    |
| -------------- | ----------------------- |
| **版本**       | Bluetooth 5.0           |
| **调制方式**   | GFSK/π/4-DQPSK/8DPSK    |
| **输出功率**   | Class 1/2/3（最高5dBm） |
| **接收灵敏度** | -70dBm（1Mbps）         |

---

### 3. 系列型号参数比对
| 型号              | 接口类型  | 尺寸（mm） | 天线配置       | 典型应用场景       |
| ----------------- | --------- | ---------- | -------------- | ------------------ |
| **FG6222MPUC-02** | M.2 Key E | 22×30×2.2  | 双天线（IPEX） | 笔记本/平板/工控机 |

---

### 4. 使用说明
#### **硬件安装**
1. **接口兼容性**：  
   - 仅支持 **M.2 Key E插槽**（常见于轻薄笔记本/工控设备）。  
   - 确认主板同时支持PCIe x1（Wi-Fi）和USB 2.0（蓝牙）信号。  
2. **天线安装**：  
   - 使用双频天线（2.4GHz/5GHz），通过IPEX接口牢固连接。  
   - 避免天线与金属部件接触，防止信号衰减。

<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
  <img src={useBaseUrl('/img/Hardware_Dev_Resources/WiFi_Module/WiFi_Module.jpg')} alt="WiFi_Module" style={{ height: '400px', objectFit: 'contain', margin: '0 auto' }} />
</div>
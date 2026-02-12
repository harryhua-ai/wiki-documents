
import AccessoriesTable from '@site/src/components/AccessoriesTable';
import useBaseUrl from '@docusaurus/useBaseUrl';

# 5G Module
## 产品特性
### **核心功能**
- **网络制式**：支持 **5G NR Sub-6GHz（SA/NSA）**、**LTE-FDD/TDD**、**WCDMA/HSPA+**。
- **接口类型**：**M.2 Key B**，支持 **PCIe 3.0 x4** 和 **USB 3.1 Gen2**。
- **GNSS**：集成多模定位（GPS/GLONASS/BeiDou/Galileo/QZSS），支持 **L1+L5 双频**（需 AT 命令或硬件控制）。
- **HPUE 增强**：支持 **Class 2 功率等级（26 dBm）**，提升小区边缘覆盖。
- **工业级设计**：工作温度 **-40°C 至 +85°C**，尺寸 **30×52×2.3mm**。

### **型号对比**
| **型号**      | **支持频段**                                                 | **HPUE 频段**       | **GNSS**      |
| ------------- | ------------------------------------------------------------ | ------------------- | ------------- |
| **RM520N-GL** | 5G: n1/n3/n5/n7/n28/n38/n40/n41/n77/n78/n79;                                             LTE: B1/B3/B5/B7/B8/B20/B28/B38/B40/B41 | n38/n41/n77/n78/n79 | L1+L5（预留） |
| **RM520N-EU** | 5G: n1/n3/n7/n28/n41/n77/n78; LTE: B1/B3/B7/B8/B20/B28/B41   | n41/n77/n78         | L1+L5         |
| **RM520N-CN** | 5G: n41/n78/n79; LTE: B1/B3/B5/B8/B41                        | n41/n78/n79         | L1+L5         |

---

## 规格参数
### **电气特性**
| **参数**         | **规格**                      |
| ---------------- | ----------------------------- |
| **电源电压**     | 3.135V–4.4V（典型 3.7V）      |
| **5G 峰值功耗**  | 3.5A @ 3.7V（256QAM 调制）    |
| **LTE 峰值功耗** | 2.0A @ 3.7V（256QAM 调制）    |
| **工作温度**     | -40°C 至 +85°C（工业级）      |
| **存储温度**     | -40°C 至 +90°C                |
| **ESD 防护**     | 接触放电 ±5kV，空气放电 ±10kV |

### **射频性能**
| **网络类型** | **频段**              | **下行速率** | **上行速率** | **MIMO 配置** |
| ------------ | --------------------- | ------------ | ------------ | ------------- |
| **5G NR**    | n41/n78（双载波聚合） | 2.5 Gbps     | 900 Mbps     | 4×4 MIMO      |
| **LTE**      | B41（5CA）            | 2 Gbps       | 200 Mbps     | 4×4 MIMO      |

### **接口规格**
| **M.2 Key B**    | **规格**                                                     |
| ---------------- | ------------------------------------------------------------ |
| **PCIe 3.0**     | 4 通道（x4 Lane），理论带宽 **32 Gbps**，支持 NVMe 协议。    |
| **USB 3.1 Gen2** | 10 Gbps 速率，兼容 USB 2.0，支持 UVC 协议扩展。              |
| **(U)SIM**       | 双卡单待，1.8V/3.0V 兼容，支持热插拔（需 AT+QSIMDET 使能）。 |

##  使用说明
1. **接口配置**  

   - **PCIe 模式切换**：  
     ```plaintext
     AT+QCFG="pcie/mode",1    // 切换为 RC 模式
     AT+QCFG="pcie/bandwidth",1 // 配置 x4 通道
     ```
   - **GNSS 控制**：  
     ```plaintext
     AT+QGPS=2          // 启用 L1+L5 双频定位
     AT+QGPSEND        // 关闭 GNSS
     ```

---

## 注意事项
### **设计关键点**
1. **电源稳定性**  
   - 瞬态电压需 ≤50mV（使用低 ESR 电容抑制纹波）。  
   - 禁止直接切断电源，需通过 `AT+QPOWD` 软关机或拉低 `FULL_CARD_POWER_OFF#` 至少 900ms。

2. **ESD 防护**  
   - 所有接口需添加 TVS 阵列（结电容 ≤10pF）。  
   - SIM 卡走线长度 ≤200mm，串联 22Ω 电阻抑制 EMI。

3. **散热管理**  
   - 高负载时需加装导热垫片（导热系数 ≥5W/mK）或散热片（覆盖模块屏蔽罩）。  
   - 避免与热源相邻，PCB 露铜区域 ≥50%。

---

### **安全与维护**
- **禁止操作**  
  - 避免超声波清洗（损坏晶体），使用酒精擦拭需断电。  
  - 高温环境（>85°C）需降额使用，禁用 HPUE 模式。  

- **固件升级**  
  - 通过 USB 3.1 或 PCIe 接口升级，确保电源稳定（电压 ≥3.3V）。  

---

**附录**  
- **机械尺寸**：30.0mm × 52.0mm × 2.3mm（M.2 Key B），散热区域需预留 ≥2.5mm 空间。  

- **关键 AT 命令**：  
  ```plaintext
  AT+CFUN=4        // 进入飞行模式
  AT+QSCLK=1       // 启用睡眠模式
  AT+QCFG="data_interface",0,0 // 切换回 USB 模式
  ```

---
<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
  <img src={useBaseUrl('/img/Hardware_Dev_Resources/5G_Module/5G_Module.jpg')} alt="5G_Module" style={{ height: '400px', objectFit: 'contain', margin: '0 auto' }} />
</div>

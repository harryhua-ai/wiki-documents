import ApplicationScenarios from '@site/src/components/ApplicationScenarios';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SupportGrid from '@site/src/components/SupportGrid';

# Product Information

## 基本介绍

<div align="center">
  <img src="/img/ne301/overview/301.png" alt="image" width="70%" />
</div>

CamThink AI Camera NeoEyes NE301 是一款具备AI实时推理能力的低功耗边缘智能相机，采用STM32N6 MCU，具备0.6TOPS算力，固件设计上通过其内置的WIFI AP来连接设备，并以Web UI 交互的方式供用户对设备进行AI推理预览、模型类别替换、模型参数以及其他相关功能进行调试与修改，硬件设计上采用模块化的设计理念，可根据场景需要选配或者更换通讯模组、相机模组、供电策略、部署与安装方式，同时其硬件本身支持丰富的接口扩展，整体开放式的硬件架构可助开发者根据实际需求灵活扩展功能模块，快速完成从原型到商业产品的落地。

此外，Camera 支持开发者扩展多种触发拍照方式（PIR / 雷达 / 声音等），可与不同传感器模块配合，在满足触发条件时自动唤醒并完成图像采集并进行AI推理，实现事件监测式的抓拍与端侧AI处理。


### 低功耗、性能与边缘AI计算

#### U0电源控制芯片设计

<div align="center" style={{ marginBottom: "1.5rem" }}>
  <img src="/img/ne301/overview/U0.png" alt="image" width="60%" />
</div>


NeoEyes NE301采用STM32U073Kx电源控制芯片，实现能耗的精细化管控：

- **动态功耗调节**：根据不同工作模式实时调整MCU及模块化组件的能耗，以此来平衡性能与功耗。
- **智能休眠机制**：支持低功耗下的深度休眠(μA级)和全速下的工作(mA级)；且从深度休眠到唤醒为ms级。
- **电池寿命优化**：通过精准的能耗控制，在原有STM32N6芯片能耗控制下进一步优化，显著延长电池使用寿命。

#### 性能表现

| 指标                           | 参数                  |
| ------------------------------ | --------------------- |
| **休眠功耗**             | 7-8μA (U0芯片控制)   |
| **工作能耗**             | 170-180mA             |
| **WiFi传输速率**         | 50m @ 4Mbps           |
| **本地图像推理响应时间** | 2-3秒                 |
| **AI视频流实时推理**     | 720P@25Hz, 1080P@15Hz |
| **满载电池工作续航**     | 3-4小时               |

> 注：以上功耗数据为测试理论值，具体请以实际为准。

#### 边缘AI计算

设备MCU采用STM32N6为核心进行开发，其0.6Tops算力足以在本地跑轻量级人物检测、手势识别或者其他类型模型，无需上传云端，因而类似的场景下的应用可以从云端成本的开销下沉到边缘处，其成本、时延和隐私性在很多应用场景中比传统的“设备+服务器”方案更优，结合设备自身的低功耗设计、简易安装部署、丰富的接口扩展、IP67防护等级等特点，可实现在多领域场景下的应用，以实现长时间的连续工作。

### 硬件特性信息

NeoEyes NE301产品由前盖、镜头模组、主板、通讯模块、电池模块等多个功能单元组成。各模块间通过标准化接口连接，便于拆装与维护，支持开发者按需替换、升级或定制特定模块。

* 分层式结构设计：采用前/中/后分离的模块化布局，便于快速拆装与功能扩展，支持用户按需DIY改装。如需获取结构设计文件，请联系我们获取。
* 多样化安装支持：结构主体预留丰富的安装孔位，兼容多种支架和外壳扩展方案。配合 CamThink 提供的[「产品配件」](#产品配件)，可灵活部署于不同使用场景。
* 相机模组可选：主板支持CPI、USB相机模组，可更换不同规格的镜头，用于满足不同场景的图像采集需求，相机模组更换和支持规格详见[「可换相机模组」](#可换相机模组)。
* 通讯方案可选：支持WiFi、Cat-1通讯方案切换，满足不同场景通讯需求，通讯模组更换和支持规格详见[「通讯方案扩展」](#通讯方案扩展)。
* 供电方案可选：默认支持电池仓方案供电，4节AA电池即可工作，也可通过主板Type-C进行有线供电或者太阳能、POE供电。
* 硬件开放性：提供结构设计文件用于DIY外壳（可3D打印）或自定义扩展，提供完整开源固件，具备开箱即用功能：低功耗模式、设备唤醒、MQTT数据传输、补光控制、定时拍摄、图像参数调整、网络管理。开发和烧录请参见「开发指南」

### 硬件接口扩展

> NeoEyes NE301支持根据硬件使用场景扩展硬件能力

- **16Pin IO接口**：主板背部预留16pin座子，带有GPIOs、DI、DO等接口，支持接入各种传感器触发拍摄（资源使用取决于通信模块和USB相机的占用情况）。
- **电源接口**：主板背面留有2pin电源座子，支持电池仓连接供电，主板正面下方带有Type-C接口可支持有线连接直供电（整机使用需要下方开孔引出）。
- **Micro TF卡槽**：可用于存储扩展，适用于本地图像或数据存储。
- **调试接口**：Type-C和UART用于开发串口调试使用。
- **灯光**：补光灯和系统指示灯支持，适合在近距离黑暗环境中采集图像与系统信息提示使用。
- **Alam接口**：2Pin Wafer支持Alarm输入。
- **PIR接口**：4Pin Wafer支持PIR传感器连接。

### 通讯方案扩展

> NeoEyes NE301默认支持WiFi通讯传输数据，支持选用LTE Cat-1通讯模块，模块与主板正面pin座子连接即可支持LTE Cat-1或WiFi-Halow通讯，易于硬件的通讯方案更换和扩展。
- **接口与兼容性**：标准PIN座连接，位于主板正面，支持免驱动识别。
- **Cat-1模块规格**：移远EG912U-GL（全球非北美地区）和移远EG915Q-NA（北美地区），支持LTE FDD/TDD和GSM等，尺寸60mm x 60mm。

### 可换相机模组

#### 支持的相机模组规格

<table>
  <colgroup>
    <col width="12%" />
    <col width="30%" />
    <col width="18%" />
    <col width="18%" />
    <col width="22%" />
  </colgroup>
  <thead>
    <tr>
      <th>类别</th>
      <th>型号</th>
      <th>视角</th>
      <th>适配距离</th>
      <th>应用场景</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>CPI相机</td>
      <td>OS04C10-51-4M <br/>OS04C10-88-3M <br/>OS04C10-137-4M</td>
      <td>51°<br/>88°<br/>137°</td>
       <td>4m <br/>3m <br/>2m</td>
      <td>标准角度拍摄 <br/>大角度拍摄<br/>广角拍摄</td>
    </tr>
   <tr>
      <td>USB相机</td>
      <td>SC200AI-51-4M <br/>SC200AI-88-3M <br/>SC200AI-137-4M</td>
      <td>51°<br/>88°<br/>137°</td>
      <td>4m <br/>3m <br/>2m</td>
      <td>标准角度拍摄 <br/>大角度拍摄<br/>广角拍摄</td>
    </tr> 
  </tbody>
</table>

> 注：整机标配为CPI相机-OS04C10,如需USB相机可额外选购。

### 适用性与部署

> NeoEyes NE301 设计兼顾户外稳定性与灵活部署能力，适用于多种安装环境和场景

- **前盖镜头钢化玻璃**：镜头前盖采用高透光钢化玻璃，具备出色的防雨水积聚能力，保障长期户外拍摄效果稳定。
- **无线与户外部署支持**：支持电池供电、低功耗运行，结合 IP67 级防护设计，适用于各种恶劣环境中的长期部署。
- **灵活的安装方式**：支持墙面、顶部、立杆等多种安装方式，提供丰富的原装支架和外壳扩展组件，满足多样部署需求。

<!--补充图片展示-->

## 产品信息

### 产品规格

NE301整机产品规格如下：

<table>
  <thead>
    <tr>
      <th>分类</th>
      <th>项目</th>
      <th>规格</th>
    </tr>
  </thead>
  <tbody>
    <!-- MCU -->
    <tr>
      <td rowspan="7">MCU</td>
      <td>Core</td>
      <td>Cortex-M55，主频 800 MHz，支持 Arm Helium 矢量处理技术</td>
    </tr>
    <tr>
      <td>NPU</td>
      <td>集成 Neural-ART™ 加速器，运行频率 1 GHz，AI 算力高达 600 GOPS（0.6 TOPS），支持实时神经网络推理</td>
    </tr>
    <tr>
      <td>SRAM</td>
      <td>4.2 MB</td>
    </tr>
    <tr>
      <td>ISP Image Processor</td>
      <td>内置专用 ISP，具备去马赛克、自动白平衡等预处理功能</td>
    </tr>
    <tr>
      <td>Video Codec</td>
      <td>H.264 硬件编码器与 JPEG 编码器，支持 1080p@30fps 视频处理</td>
    </tr>
    <tr>
      <td>能效指标</td>
      <td>NPU 能效达 3 TOPS/W，全速运行无需散热</td>
    </tr>
    <tr>
      <td>启动/唤醒速度</td>
      <td>微秒级启动，毫秒级唤醒</td>
    </tr>
    <!-- 主板 -->
    <tr>
      <td rowspan="11">主板</td>
      <td>HyperFlash</td>
      <td>128 MB</td>
    </tr>
    <tr>
      <td>PSRAM</td>
      <td>64 MB</td>
    </tr>
    <tr>
      <td>按键</td>
      <td>复位按键、Boot 按键、抓拍/录像按键</td>
    </tr>
    <tr>
      <td>指示灯</td>
      <td>电源指示灯、系统指示灯</td>
    </tr>
    <tr>
      <td>通讯</td>
      <td>Wi-Fi 6 / BLE</td>
    </tr>
    <tr>
      <td>镜头模组接口</td>
      <td>4 Pin USB ×1，MIPI CSI-2 ×1</td>
    </tr>
    <tr>
      <td>16 Pin IO</td>
      <td>UART×1<br/>RS485×1<br/>I2C×1<br/>SPI×1<br/>GPIO×2<br/>3.3V×1 / 5V×1（供电可控）<br/>GND×2</td>
    </tr>
    <tr>
      <td>调试与供电</td>
      <td>USB Type-C ×1，UART 4-Pin Wafer ×1</td>
    </tr>
    <tr>
      <td>音频输入输出</td>
      <td>Audio Input×1 (Wafer) 与 Audio Output×1 (Wafer)</td>
    </tr>
    <tr>
      <td>通讯模块扩展接口</td>
      <td>12-Pin + 16-Pin IO 座子（通讯模块/传感器扩展）</td>
    </tr>
    <tr>
      <td>扩展存储</td>
      <td>TF Card (Micro SD)</td>
    </tr>
    <!-- 结构参数与其它 -->
    <tr>
      <td rowspan="5">结构参数与其它</td>
      <td>电源输入</td>
      <td>DC 5 V</td>
    </tr>
    <tr>
      <td>尺寸</td>
      <td>77mm × 77mm × 48mm</td>
    </tr>
    <tr>
      <td>工作温度</td>
      <td>−20 °C ~ +50 °C</td>
    </tr>
    <tr>
      <td>湿度</td>
      <td>0% ~ 90% RH（无凝露）</td>
    </tr>
    <tr>
      <td>认证</td>
      <td>CE / FCC / RoHS/ SRRC</td>
    </tr>
  </tbody>
</table>

### 产品外形与尺寸

本产品在结构和外观上留有设计，提供多种支架配件，支持多种安装方式，可满足多种场景的使用需求。

### 产品配件

> NE301产品系列支持选配安装，结构安装同NE101，具体配件如下

| 图片                                                                                                        | 名称                  | 数量 | 说明                                                                                                            |
| ----------------------------------------------------------------------------------------------------------- | --------------------- | ---- | --------------------------------------------------------------------------------------------------------------- |
| <img src="https://camthink-ai.github.io/wiki-documents/zh-Hans/img/Overview/NE101/Bracket/1.png" alt="底部支架扩展件" width="180" />      | 底部支架扩展件        | 1    | 适合顶部安装、底部安装扩展使用                                                                                  |
| <img src="https://camthink-ai.github.io/wiki-documents/zh-Hans/img/Overview/NE101/Bracket/3.png" alt="背部支架扩展件" width="180" />      | 背部支架扩展件        | 1    | 适合壁装相机时扩展使用                                                                                          |
| <img src="https://camthink-ai.github.io/wiki-documents/zh-Hans/img/Overview/NE101/Bracket/5.png" alt="杆件支架" width="180" />            | 杆件支架              | 1    | 适合复杂场景需要多角度调整相机时根据场景扩展使用，套件包含金属杆*2、转换头*2，金属杆可定制                    |
| <img src="https://camthink-ai.github.io/wiki-documents/zh-Hans/img/Overview/NE101/Bracket/4.png" alt="表盘支架" width="180" />            | 表盘支架              | 1    | 适合环境光线影响较少的仪表采集固定安装使用                                                                      |
| <img src="https://camthink-ai.github.io/wiki-documents/zh-Hans/img/Overview/NE101/Bracket/2.png" alt="水表支架" width="180" />            | 水表支架              | -    | 可提供3D设计文件自行3D打印，非实体支架选配                                                                      |
| <img src="https://camthink-ai.github.io/wiki-documents/zh-Hans/img/Overview/NE101/sensor1.png" alt="04C10相机模组" width="180" />         | OS04C10 摄像头        | 1    | 支持3种规格：``51° FOV, 4m focus``、``88° FOV, 3m focus ``、``137° FOV, 2m focus``                           |
| <img src="https://camthink-ai.github.io/wiki-documents/zh-Hans/img/Overview/NE101/sensor1.png" alt="SC200AI USB摄像头模组" width="180" /> | SC200AI USB摄像头模组 | 1    | 支持3种规格：``51° FOV, 4m focus``、``88° FOV , 3m focus``、``137° FOV, 2m focus`` |
| <img src="https://camthink-ai.github.io/wiki-documents/zh-Hans/img/Overview/NE101/cat1PCBA.png" alt="Cat.1通讯模块" width="180" />        | Cat.1通讯模块         | 1    | 可自行通过主板插槽装配，支持全球版本或北美版本可选                                                              |
| <img src="/img/ne301/overview/poe.png" alt="image" width="180" />                                            | POE通讯模块           | 1    | 可自行通过主板插槽装配                                                                                          |

### 产品安装

#### 壁装支架及安装示意

![NE_Series_Bracket_Wall_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_Bracket_Wall_Mount.png)

![NE_Series_Wall_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_Wall_Mount.png)

#### 表盘支架及安装示意

![NE_Series_Bracket_Meter_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_Bracket_Meter_Mount.png)

![NE_Series_Meter_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_Meter_Mount.png)

#### 杆件支架及安装示意

![NE_Series_Bracket_Rod_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_Bracket_Rod_Mount.png)

![NE_Series_Rod_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_Rod_Mount.png)

#### 三轴球支架及安装示意

![NE_Series_Bracket_ShaftBall_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_Bracket_ShaftBall_Mount.png)

![NE_Series_ShaftBall_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_ShaftBall_Mount.png)

#### 座装支架及安装示意

![NE_Series_Bracket_U_Type_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_Bracket_U_Type_Mount.png)

![NE_Series_U_Type_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_U_Type_Mount.png)


## 产品应用




### 产品使用场景

NeoEyes NE301具备设备本地AI推理能力，同时保留超低功耗的特点，可适用于边缘计算与推理、场景触发、周期采样等的视觉类AI应用,以下为场景使用示例。

### 智慧城市

<div className="scenario-overview" style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
  <img src={useBaseUrl('/img/ne301/scenarios/app-smart-city.png')} alt="智慧城市应用概述" style={{ width: "260px", maxWidth: "100%" }} />
  <p style={{ flex: "1", margin: 0, lineHeight: 1.6 }}>
    NE301 凭借其超低功耗设计（休眠功耗仅7-8μA）和边缘AI计算能力，可在城市环境中长时间部署，无需人力频繁更换电池，同时实时进行本地AI推理，保障数据隐私与低延迟响应。
  </p>
</div>

<ApplicationScenarios
  imagePosition="left"
  maxDescriptionLines={8}
  categories={[
    {
      title: "应用示例",
      items: [
        {
          title: "占有检测",
          description: "通过事件触发抓拍（如 PIR / 雷达）实时监测公共区域，识别位置占用、违规占用及物品堆积，并立即上报告警。",
          image: useBaseUrl('/img/ne301/scenarios/app-possession-detection.png'),
          imageAlt: "占有检测"
        },
        {
          title: "无人零售",
          description: "利用边缘 AI 实时分析顾客行为与商品识别，实现自动结算与防盗；在无外接电源场景下仍可保持长期稳定运行。",
          image: useBaseUrl('/img/ne301/scenarios/app-unmanned-retail.png'),
          imageAlt: "无人零售"
        },
        {
          title: "智慧广告屏",
          description: "结合客流统计与人群属性分析，优化广告投放策略；设备本地处理视频流，仅上传分析结果，大幅节省带宽。",
          image: useBaseUrl('/img/ne301/scenarios/app-smart-advertising-screen.png'),
          imageAlt: "智慧广告屏"
        }
      ]
    }
  ]}
/>

### 智能工厂

<div className="scenario-overview" style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
  <img src={useBaseUrl('/img/ne301/scenarios/app-smart-factory.png')} alt="智能工厂应用概述" style={{ width: "260px", maxWidth: "100%" }} />
  <p style={{ flex: "1", margin: 0, lineHeight: 1.6 }}>
    NE301 的模块化设计支持灵活更换相机模组与通讯方案，满足工业场景的多样化需求；其边缘AI能力可在本地完成安全装备检测，避免网络延迟，提升响应速度。
  </p>
</div>

<ApplicationScenarios
  imagePosition="left"
  maxDescriptionLines={8}
  categories={[
    {
      title: "应用示例",
      items: [
        {
          title: "安全装备检测",
          description: "实时监测工作人员是否佩戴安全帽、防护服等，发现违规立即告警。",
          image: useBaseUrl('/img/ne301/scenarios/app-industrial-safety.png'),
          imageAlt: "工业安全装备检测"
        },
        {
          title: "生产检测",
          description: "流水线生产过程中，实时监测产品是否符合规范，发现异常及时告警。",
          image: useBaseUrl('/img/ne301/scenarios/app-industrial-testing.png'),
          imageAlt: "流水线生产"
        }
      ]
    }
  ]}
/>

### 智慧农业、畜牧业

<div className="scenario-overview" style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
  <img src={useBaseUrl('/img/ne301/scenarios/app-smart-agriculture.png')} alt="智慧农业与畜牧业应用概述" style={{ width: "260px", maxWidth: "100%" }} />
  <p style={{ flex: "1", margin: 0, lineHeight: 1.6 }}>
    NE301 的低功耗特性与电池供电方案使其适用于无电网覆盖的农业场景，通过周期性抓拍与边缘分析，实现作物与牲畜的智能化管理。
  </p>
</div>

<ApplicationScenarios
  imagePosition="left"
  maxDescriptionLines={8}
  categories={[
    {
      title: "应用示例",
      items: [
        {
          title: "周期性抓拍农作物生长",
          description: "定时拍摄作物图像，通过 AI 分析生长状态，为精准农业提供数据支持。",
          image: useBaseUrl('/img/ne301/scenarios/app-plant.png'),
          imageAlt: "周期性抓拍农作物生长"
        },
        {
          title: "畜牧业周期性抓拍",
          description: "监测牲畜活动与健康状况，及时发现异常并联动告警。",
          image: useBaseUrl('/img/ne301/scenarios/app-animal.png'),
          imageAlt: "畜牧业周期性抓拍"
        },
        {
          title: "智能养殖",
          description: "识别单头生猪后联动下料器精准投喂或计数，提升养殖效率。",
          image: useBaseUrl('/img/ne301/scenarios/app-pig.png'),
          imageAlt: "智能养殖"
        }
      ]
    }
  ]}
/>

### 其它集成

<div className="scenario-overview" style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
  <img src={useBaseUrl('/img/ne301/scenarios/app-integrated-applications-overview.png')} alt="其它集成应用概述" style={{ width: "260px", maxWidth: "100%" }} />
  <p style={{ flex: "1", margin: 0, lineHeight: 1.6 }}>
    NE301 的开放式硬件架构与丰富接口支持轻松集成到各类设备中，扩展应用边界，满足多场景的定制化需求。
  </p>
</div>

<ApplicationScenarios
  imagePosition="left"
  maxDescriptionLines={8}
  categories={[
    {
      title: "应用示例",
      items: [
        {
          title: "智能门铃 / 猫眼",
          description: "通过 PIR 或雷达传感器触发，抓拍可疑人员并本地识别，保障家庭安全。",
          image: useBaseUrl('/img/ne301/scenarios/app-smart-doorball.png'),
          imageAlt: "智能门铃或猫眼"
        },
        {
          title: "工业产线",
          description: "集成到产线设备，实时视频流 AI 分析，监控生产质量与流程。",
          image: useBaseUrl('/img/ne301/scenarios/app-production.png'),
          imageAlt: "工业产线监控"
        },
        {
          title: "车载系统",
          description: "检测驾驶员疲劳状态，及时发出警报，提升行车安全。",
          image: useBaseUrl('/img/ne301/scenarios/app-drowsy.png'),
          imageAlt: "车载系统监测"
        }
      ]
    }
  ]}
/>

## 应用工程实例
Coming soon!!



<!--链接到应用指南-->

<!-- NE301可满足多类场景需求，最本质的优势是支持本地AI推理，以下是典型应用案例，每个案例提供完整且详细的部署过程，助您快速上手应用完成实际项目落地

Alarm 报警触发

水表模型即时识别

人物姿态检测

物品识别分类

人数统计、课堂签到，100人教室识别

数据处理、分析和可视化：BeaverIOT
-->
## 产品资源

### 产品教程
Coming soon!!

<!--关于如何快速使用NE301系列产品可见[「快速开始」](https://camthink-ai.github.io/wiki-documents/zh-Hans/docs/NeoEyes%20NE101%20Series/Quick%20Start)

关于如何使用NE301主板的相关硬件使用和系统应用开发说明可见[「开发指南」](https://camthink-ai.github.io/wiki-documents/zh-Hans/docs/NeoEyes%20NE101%20Series/NE100-MB01%20Development%20Board/Dev%20Guide)

关于NE301系列产品的应用场景与指南可见[「应用指南」](https://camthink-ai.github.io/wiki-documents/zh-Hans/docs/NeoEyes%20NE101%20Series/Application%20Guide/low-power-image-acquisition)
-->

## 技术支持
<SupportGrid />
<!--Discord、GIthub issue-->









import AccessoriesTable from '@site/src/components/AccessoriesTable';
import useBaseUrl from '@docusaurus/useBaseUrl';

# USB Camera Module


## 硬件规格

![SC200AI](/img/Hardware_Dev_Resources/USB_Module/usb5.png)

#### **产品特性**   
本产品为高性能USB接口摄像模组，搭载1/2.7英寸200万像素图像传感器，支持1080P 30fps高清视频输出。

**主要特性**  
| 序号| Items                    | Description       |        备注       |
| ---- | ------------------------ | ----------------- | ------------- |
| 1    | CMOS Sensor              | SC200AI, 1/2.8"   |               |
| 2    | Max.Resolution           | 1920*1080         |               |
| 3    | F.No                     |                   | Optional LENS |
| 4    | Focal Length             | 2.5mm/4mm/6mm     | Optional LENS |
| 5    | Focusing distance        | 2M/3M/5M          | Optional LENS |
| 6    | FOV(H)                   | 137/88/51         | Optional LENS |
| 8    | Communication Interfaces | USB               |               |
| 9    | Operation Temperature    | -20°-- 60°        |               |
| 10   | Storage Temperature      | -40°-- 85°        |               |
| 11   | Dimensions               | 25mm*23.86mm      |               |

---

#### **模组接口线序说明**  
| **Pin序号** | **信号名称** | **功能定义**    | **备注**         |
| ----------- | ------------ | --------------- | ---------------- |
| 1           | VCC          | 5V电源输入      | 最大电流500mA    |
| 2           | DM           | USB差分信号负极 | 需匹配USB2.0协议 |
| 3           | DP           | USB差分信号正极 | 需匹配USB2.0协议 |
| 4           | GND          | 电源地          | 与信号地共用     |

---

#### **使用说明**  
1. **硬件连接**  
   - 通过4-pin 1.0mm USB接口连接至主机，确保供电稳定。  
   - 镜头出厂已调焦，避免旋转或拆卸镜头组件。  

2. **系统兼容性**  
   - 支持Windows XP/7/8.1/10、macOS、Linux 2.6.2及以上（需内置UVC驱动）。  
   - 最低配置要求：CPU 1.7GHz，512MB内存，40GB硬盘，XP SP2系统。  

3. **注意事项**  
   - 工作温度需保持在0 ~ 60度范围内，避免冷凝环境。  
   - 清洁镜头时使用无尘布轻擦，禁止使用腐蚀性溶剂。  

---

#### **4. 规格尺寸**  
<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
  <img src={useBaseUrl('/img/Hardware_Dev_Resources/USB_Module/USB_Module_Size.png')} alt="USB_Module_Size" style={{ height: '400px', objectFit: 'contain', margin: '0 auto' }} />
</div>


## 产品介绍
本相机模组适用于NeoEyes 101相机
![image](/img/Hardware_Dev_Resources/USB_Module/usb6.png)
随着 AI 视觉应用的快速发展，用户对图像质量、适配性和多场景使用的需求不断提升。
NeoEyes NE101 的标准 CPI 模组（OV5640）在日常使用中表现稳定，但在 **画质细节、广角成像与灵活性等方面** 仍有一定局限。

为此，我们专门设计了USB 扩展架构，让 NeoEyes NE101 支持多种高性能摄像模组。
通过底层接口优化，即便在原本 **ESP-S3 平台不支持多摄接入** 的情况下，也能实现稳定兼容和快速扩展。这让 NeoEyes NE101 成为一款可持续进化的视觉平台。

以下是包含项目的具体对比：

| 对比项目 | 标配 OV5640 | USB 模组                    |
| -------- | ----------- | --------------------------- |
| 镜头材质 | 塑胶镜头    | 含有玻璃镜头                |
| 像素尺寸 | 1.4×1.4μm | 2.9×2.9μm（更强光敏性能） |
| ISP 类型 | 集成式      | 独立 ISP（处理更智能）      |
| 焦距调节 | 固定        | 支持可调焦                  |
| 成像质量 | 标准级      | 高清、细节更丰富            |
| 应用扩展 | 集成式      | 可批量定制                  |
| 二次开发 | 不支持      | 支持                        |
| HFOV     | 标准、宽角  | 标准、宽角、超广角          |

注: OV5640支持微距拍摄，USB模组暂无此类规格，如对微距拍摄如8cm、15cm这种有特殊需求，请使用OV5640版本，如有特殊需要可联系我们进行定制

此外，OV5640是一个集成式的组件除了是硬件本身的参数设计上的区别外，对于开发者而言二次开发空间较小，OV5640必须连接到主板上，由主板的处理器来读取和处理这些原始数据，技术门槛高，需要底层驱动来实现。

## 多种 USB 模组规格版本
![SC200AI](/img/Hardware_Dev_Resources/USB_Module/usb2.png)
>从左到右分别是：SC200AI-137-2M（超广角款）、SC200AI-88-3M（宽角款）、SC200AI-51-4M（标准款）。

我们有提供三种类型的USB模组版本，以此来满足不同场景下的需求

| 型号                                 | 视场角 (HFOV) | 对焦距离 | 特点                                           | 适用场景                             |
| ------------------------------------ | ------------- | -------- | ---------------------------------------------- | ------------------------------------ |
| **SC200AI-51-4M（标准款）**    | 51°          | 4m       | 适合较远距离，成像自然、细节清晰，光线还原度高 | 常规监控、识别类任务                 |
| **SC200AI-88-3M（宽角款）**    | 88°          | 3m       | 中距离，拍摄范围较广，视野覆盖增加近 50%       | 室内监控、人流识别、空间检测         |
| **SC200AI-137-2M（超广角款）** | 137°         | 2m       | 近距离，全景拍摄，视野最广                     | 室内外场景监控、机器人导航、边缘检测 |

注：针对于USB相机模组我们适配了室内外的两个固件版本，用户可以依据场景需求来适配不同的版本，具体的室内外的成像效果看下方效果对比。

## OV5640与USB相机模组成像效果对比

以下分别是CPI OV5640版本与USB相机模组版本分别在室内外场景相似规格下的拍照效果对比：

| CPI相机                                         | USB相机（室内固件版本）                             |
| ----------------------------------------------- | ----------------------------------------------- |
| HFOV=92° Focus Distance=3m                     | HFOV=137° Focus Distance=2m                    |
| ![image](/img/Hardware_Dev_Resources/USB_Module/image-20251020085837-uhstdxb.png) | ![image](/img/Hardware_Dev_Resources/USB_Module/image-20251020085831-0lepsr2.png) |
| HFOV=92° Focus Distance=3m                     | HFOV=88° Focus Distance=3m                     |
| ![image](/img/Hardware_Dev_Resources/USB_Module/image-20251020085823-1lpi3d3.png) | ![image](/img/Hardware_Dev_Resources/USB_Module/image-20251020085812-1qlfobj.png) |
| HFOV=47° Focus Distance=4m                     | HFOV=51° Focus Distance=4m                     |
| ![image](/img/Hardware_Dev_Resources/USB_Module/image-20251020085803-wfggdqp.png) | ![image](/img/Hardware_Dev_Resources/USB_Module/image-20251020085755-zlr6jbj.png) |

| CPI相机                                         | USB相机（室外固件版本）                             |
| ----------------------------------------------- | ----------------------------------------------- |
| HFOV=92° Focus Distance=3m                     | HFOV=137° Focus Distance=2m                    |
| ![image](/img/Hardware_Dev_Resources/USB_Module/image.png) | ![image](/img/Hardware_Dev_Resources/USB_Module/image1.png) |
| HFOV=92° Focus Distance=3m                     | HFOV=88° Focus Distance=3m                     |
| ![image](/img/Hardware_Dev_Resources/USB_Module/image2.png) | ![image](/img/Hardware_Dev_Resources/USB_Module/image3.png) |
| HFOV=47° Focus Distance=4m                     | HFOV=51° Focus Distance=4m                     |
| ![image](/img/Hardware_Dev_Resources/USB_Module/image4.png) | ![image](/img/Hardware_Dev_Resources/USB_Module/image5.png) |

> 由对比效果可见，无论室内外场景，USB相机模组的成像效果都要优于OV5640，两款镜头模组图像上调教亦有差异，可根据喜好选择。
### USB相机模组选型建议

- **正常拍摄、较远距离**→ 选择 *标准款*
- **需要较广视野** → 选择 *宽角款*
- **复杂、大范围环境监测、近距离** → 选择 *超广角款*

---

## USB 模组的三大核心优势

### 画质提升：玻璃镜头+独立ISP

- USB 模组中有采用 **玻璃镜头**，而非塑胶镜头，具备更高透光率与耐用性，能够有效减少色散与畸变；
- 传感器像素点更大（2.9×2.9μm），图像细节与暗光表现更优秀，低噪下表现更佳；
- 独立 ISP 图像信号处理器，画质优化更精准、动态范围更广。

### 灵活适配：可调焦+标准化接口

- 支持可调焦设计，用户可根据实际场景（近距识别、远距监测）自由调整；
- 模组接口标准化，标准UVC协议，开发者可快速替换模组，无需更改底层驱动，实现即插即用;
- 定制服务：硬件/固件定制通道

### 开放生态：二次开发友好

- USB模组更适合开发者，如对成像调校或参数等有需求的用户，更加方便二次开发；
- 长期可维护性更强，可定制需求来适配更多算法与应用场景；
- 提供更细化的室内外版本，以此来适配智能门禁、车载监控、工业识别等多领域。

---

## 从硬件到体验的全面升级

USB 模组不仅仅是“更好的摄像头”，它代表着 NE101 向开放与可扩展、模块化设计特点的重要标志。
从图像质量、灵活性到未来兼容性，我们希望让开发者拥有更多选择，满足不同群体的需求，也让终端产品在不同应用场景下都能发挥更好的表现。

---

## 适合谁来选配？

- 对成像质量、清晰度要求较高的用户；
- 需要更广角/全景识别的 AI 视觉应用；
- 想要二次开发、灵活扩展功能的有技术的开发者团队或者极客。

---

## 总结

| 对比项目   | 标配 OV5640 | USB 模组       |
| ---------- | ----------- | -------------- |
| 镜头材质   | 塑胶镜头    | 含玻璃镜头     |
| 像素尺寸   | 1.4×1.4μm | 2.9×2.9μm    |
| ISP 类型   | 集成式      | 独立式         |
| 焦距调节   | 固定焦距    | 支持可调焦     |
| 适配灵活性 | 较低        | 可扩展、较灵活 |
| 成像质量   | 标准        | 更加清晰       |

总而言之，在标配版本之上选配USB模组会让你的NeoEyes NE101不止“看得见”，还能“看得更清晰、适配更灵活”。


import AccessoriesTable from '@site/src/components/AccessoriesTable';
import useBaseUrl from '@docusaurus/useBaseUrl';

# USB Camera Module

## Hardware Specifications

![SC200AI](/img/Hardware_Dev_Resources/USB_Module/usb5.png)

#### **Product Features**   
This product is a high-performance USB interface camera module, equipped with a 1/2.7-inch 2-megapixel image sensor, supporting 1080P 30fps HD video output.

**Main Specifications**  
| No. | Items                    | Description       |        Notes       |
| --- | ------------------------ | ----------------- | ------------- |
| 1   | CMOS Sensor              | SC200AI, 1/2.8"   |               |
| 2   | Max.Resolution           | 1920*1080         |               |
| 3   | F.No                     |                   | Optional LENS |
| 4   | Focal Length             | 2.5mm/4mm/6mm     | Optional LENS |
| 5   | Focusing distance        | 2M/3M/5M          | Optional LENS |
| 6   | FOV(H)                   | 137/88/51         | Optional LENS |
| 8   | Communication Interfaces | USB               |               |
| 9   | Operation Temperature    | -20°-- 60°        |               |
| 10  | Storage Temperature      | -40°-- 85°        |               |
| 11  | Dimensions               | 25mm*23.86mm      |               |

---

#### **Module Pin Definition**  
| **Pin No.** | **Signal Name** | **Function**          | **Notes**                 |
| ----------- | --------------  | --------------------- | ------------------------- |
| 1           | VCC             | 5V Power Input        | Max current 500mA         |
| 2           | DM              | USB Differential (-)  | Needs to match USB2.0     |
| 3           | DP              | USB Differential (+)  | Needs to match USB2.0     |
| 4           | GND             | Ground                | Common with signal ground |

---

#### **Instructions for Use**  
1. **Hardware Connection**  
   - Connect to the host via a 4-pin 1.0mm USB interface, ensure stable power supply.  
   - The lens is pre-focused from factory; avoid rotating or removing the lens module.

2. **System Compatibility**  
   - Supports Windows XP/7/8.1/10, macOS, Linux 2.6.2 and above (requires built-in UVC driver).  
   - Minimum hardware requirements: CPU 1.7GHz, 512MB RAM, 40GB HDD, XP SP2.

3. **Precautions**  
   - Operating temperature should be maintained between 0 ~ 60°C, avoid condensation.  
   - Clean the lens with a dust-free cloth; do not use corrosive solvents.

---

#### **4. Physical Dimensions**  
<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
  <img src={useBaseUrl('/img/Hardware_Dev_Resources/USB_Module/USB_Module_Size.png')} alt="USB_Module_Size" style={{ height: '400px', objectFit: 'contain', margin: '0 auto' }} />
</div>

## Product Introduction
This camera module is suitable for the NeoEyes 101 camera.
![image](/img/Hardware_Dev_Resources/USB_Module/usb6.png)
With the rapid development of AI vision applications, users’ demands for image quality, adaptability, and multi-scenario usage continue to grow.
The standard CPI module (OV5640) on the NeoEyes NE101 is stable for daily use but still shows limitations in **image detail, wide-angle imaging, and flexibility**.

To address these needs, we have specifically designed a USB expansion architecture, enabling NeoEyes NE101 to support multiple high-performance camera modules.
With low-level interface optimization, even when the **ESP-S3 platform originally does not support multiple cameras**, stable compatibility and quick expansion are achieved. This makes NeoEyes NE101 a visual platform with continuous upgradeability.

Comparison of main parameters:

| Comparison Item | Standard OV5640 | USB Module                    |
| --------------- | --------------- | ----------------------------- |
| Lens Material   | Plastic Lens    | With Glass Lens               |
| Pixel Size      | 1.4×1.4μm       | 2.9×2.9μm (Higher Sensitivity)|
| ISP Type        | Integrated      | Independent ISP (Smarter)     |
| Focus Adjustment| Fixed           | Supports Adjustable Focus     |
| Image Quality   | Standard        | HD, More Detail               |
| Application Extensibility | Integrated | Customizable in Bulk      |
| Secondary Development | Not Supported | Supported                |
| HFOV           | Standard/Wide    | Standard/Wide/Super Wide      |

Note: OV5640 supports macro shooting. The USB module version currently does not support such specs. If you require macro focus (e.g., 8cm, 15cm), please choose the OV5640 version. For special needs, contact us for custom options.

Moreover, as an integrated component, OV5640’s design leaves little room for secondary development. It must connect to the main board, which processes raw data directly—resulting in a high technical threshold and requiring low-level drivers.

## Multiple USB Module Versions
![SC200AI](/img/Hardware_Dev_Resources/USB_Module/usb2.png)
>From left to right: SC200AI-137-2M (Super Wide Version), SC200AI-88-3M (Wide Version), SC200AI-51-4M (Standard Version).

We provide three types of USB camera module versions, each tailored for different application needs:

| Model                                 | HFOV      | Focusing Distance | Features                                        | Application Scenarios                 |
| -------------------------------------  | ----------| ----------------- | ----------------------------------------------- | ------------------------------------  |
| **SC200AI-51-4M (Standard)**          | 51°       | 4m                | Suitable for long distance, natural imaging with high detail and color fidelity | General monitoring, recognition tasks |
| **SC200AI-88-3M (Wide)**              | 88°       | 3m                | Medium distance, wider view covering ~50% more area | Indoor monitoring, people detection, space sensing |
| **SC200AI-137-2M (Super Wide)**       | 137°      | 2m                | Short distance, panoramic capture, widest FOV   | Indoor/outdoor monitoring, robot navigation, edge detection |

Note: We provide both indoor and outdoor firmware versions for USB modules. You can choose the right version according to your scenario. Effect comparison is shown below.

## OV5640 & USB Camera Module Imaging Comparison

Below are comparison shots of the CPI OV5640 version and USB camera module version for similar scenarios both indoors and outdoors:

| CPI Camera                                         | USB Camera (Indoor Firmware)                         |
| -------------------------------------------------- | --------------------------------------------------- |
| HFOV=92° Focus Distance=3m                         | HFOV=137° Focus Distance=2m                         |
| ![image](/img/Hardware_Dev_Resources/USB_Module/image-20251020085837-uhstdxb.png) | ![image](/img/Hardware_Dev_Resources/USB_Module/image-20251020085831-0lepsr2.png) |
| HFOV=92° Focus Distance=3m                         | HFOV=88° Focus Distance=3m                          |
| ![image](/img/Hardware_Dev_Resources/USB_Module/image-20251020085823-1lpi3d3.png) | ![image](/img/Hardware_Dev_Resources/USB_Module/image-20251020085812-1qlfobj.png) |
| HFOV=47° Focus Distance=4m                         | HFOV=51° Focus Distance=4m                          |
| ![image](/img/Hardware_Dev_Resources/USB_Module/image-20251020085803-wfggdqp.png) | ![image](/img/Hardware_Dev_Resources/USB_Module/image-20251020085755-zlr6jbj.png) |


| CPI Camera                                         | USB Camera (Outdoor Firmware)                        |
| -------------------------------------------------- | --------------------------------------------------- |
| HFOV=92° Focus Distance=3m                         | HFOV=137° Focus Distance=2m                         |
| ![image](/img/Hardware_Dev_Resources/USB_Module/image.png) | ![image](/img/Hardware_Dev_Resources/USB_Module/image1.png) |
| HFOV=92° Focus Distance=3m                         | HFOV=88° Focus Distance=3m                          |
| ![image](/img/Hardware_Dev_Resources/USB_Module/image2.png) | ![image](/img/Hardware_Dev_Resources/USB_Module/image3.png) |
| HFOV=47° Focus Distance=4m                         | HFOV=51° Focus Distance=4m                          |
| ![image](/img/Hardware_Dev_Resources/USB_Module/image4.png) | ![image](/img/Hardware_Dev_Resources/USB_Module/image5.png) |

> As seen in the comparison, the USB camera module offers superior imaging to the OV5640 in both indoor and outdoor scenarios. The image tuning differs for the two lens modules as well—you can choose according to your preference.

### USB Camera Module Selection Advice

- **For normal shooting/long-distance** → Choose *Standard Version*
- **For a wider field of view** → Choose *Wide Version*
- **For complex/large-scale monitoring at close range** → Choose *Super Wide Version*

---

## Three Core Strengths of the USB Module

### Superior Image Quality: Glass Lens + Independent ISP

- Uses a **glass lens** instead of plastic, providing higher transmittance and durability, effectively reducing chromatic aberration and distortion.
- Larger sensor pixels (2.9×2.9μm) deliver better image detail and low-light performance, with less noise.
- Independent ISP (Image Signal Processor) allows for more precise image tuning and wider dynamic range.

### Flexible Adaptation: Adjustable Focus + Standardized Interface

- Supports adjustable focus, so users can freely change focus for different scenarios (close-up recognition/remote monitoring).
- Standardized module interface and UVC protocol—developers can quickly switch modules without core driver changes. Truly plug-and-play.
- Customization services: hardware/firmware customization available.

### Open Ecosystem: Developer-Friendly for Secondary Development

- USB module is more suitable for developers, especially those requiring custom tuning or parameter adjustments, making secondary development easier.
- Longer-term maintainability and the ability to customize for different algorithms and application scenarios.
- More granular indoor/outdoor versions available, to suit smart access, automotive monitoring, industrial inspection, and more.

---

## Comprehensive Upgrade from Hardware to Experience

The USB module is not just a "better camera"—it represents an important step in NE101’s journey towards openness, expandability, and modular design.
From image quality to flexibility and future compatibility, we hope to empower developers with more choices and allow end products to perform better across all application scenarios.

---

## Who Should Consider the USB Module?

- Users demanding high image quality and clarity;
- AI vision applications where wide-angle or panoramic recognition is needed;
- Teams or enthusiasts seeking secondary development or flexible feature expansion.

---

## Summary

| Comparison Item | Standard OV5640 | USB Module                |
| --------------- | --------------- | ------------------------- |
| Lens Material   | Plastic Lens    | With Glass Lens           |
| Pixel Size      | 1.4×1.4μm       | 2.9×2.9μm                 |
| ISP Type        | Integrated      | Independent               |
| Focus Setting   | Fixed           | Supports Adjustable Focus |
| Adaptability    | Low             | Expandable, Flexible      |
| Image Quality   | Standard        | Clearer                   |

In short, upgrading to a USB module above the standard version will give your NeoEyes NE101 not just the power to "see," but to "see more clearly and adapt more flexibly."

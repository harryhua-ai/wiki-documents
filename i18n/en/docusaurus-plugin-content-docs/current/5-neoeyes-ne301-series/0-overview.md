import ApplicationScenarios from '@site/src/components/ApplicationScenarios';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SupportGrid from '@site/src/components/SupportGrid';

# Product Information

## Overview

<div align="center">
  <img src="/img/ne301/overview/301.png" alt="NeoEyes NE301 camera" width="70%" />
</div>

CamThink AI Camera NeoEyes NE301 is a low-power edge AI camera that carries 0.6 TOPS of compute on the STM32N6 MCU. The firmware exposes a built‑in Wi‑Fi AP and a full Web UI so that users can preview AI inference, switch model types, adjust model parameters, and fine-tune other features directly in the browser. The hardware follows a modular design: communication modules, image sensors, power options, and mounting accessories can all be swapped according to the scenario. Rich interface expansion and an open hardware architecture help developers move swiftly from prototype to commercial deployment.

The camera also supports multiple event-triggered capture mechanisms (PIR, radar, acoustic, and more). When paired with external sensors, the device can wake up automatically, capture images, and complete edge inference whenever the trigger condition is met, enabling event-driven snapshots with on-device AI processing.

### Low Power, Performance, and Edge AI

#### U0 Power-Control Chip

<div align="center" style={{ marginBottom: "1.5rem" }}>
  <img src="/img/ne301/overview/U0.png" alt="U0 power controller diagram" width="60%" />
</div>

NeoEyes NE301 adopts the STM32U073Kx power controller to deliver fine-grained energy management:

- **Dynamic power scaling**: Adjusts MCU and modular peripherals in real time according to the active operating mode to balance performance and consumption.
- **Smart sleep**: Offers μA-level deep sleep and mA-level full-speed operation, with wake-up latency measured in milliseconds.
- **Battery life optimization**: Enhances energy efficiency on top of the STM32N6 baseline, significantly extending battery runtime.

#### Performance

| Metric                        | Value                 |
| ----------------------------- | --------------------- |
| **Sleep power**               | 7–8 μA (managed by U0)|
| **Active power**              | 170–180 mA            |
| **Wi-Fi throughput**          | 50 m @ 4 Mbps         |
| **Local inference latency**   | 2–3 s                 |
| **Realtime AI video**         | 720P@25 Hz, 1080P@15 Hz |
| **Battery runtime (full load)** | 3–4 h               |

> The values above are measured under lab conditions. Please refer to real deployments for actual results.

#### Edge AI Compute

The STM32N6 MCU provides 0.6 TOPS of compute, which is sufficient to run lightweight person detection, gesture recognition, and similar models locally without sending frames to the cloud. By moving workloads to the edge, NeoEyes NE301 lowers cost, latency, and privacy risk compared with traditional “device + server” architectures. Combined with low power design, easy installation, rich expansion, and IP67 protection, the camera fits long-running applications across multiple industries.

### Hardware Highlights

NeoEyes NE301 consists of an outer shell, camera modules, main board, communication module, battery tray, and other functional units. Standardized board-to-board connectors make it simple to swap, upgrade, or customize each module.

- **Layered structure**: The front / middle / rear assemblies can be detached independently, enabling quick maintenance and DIY extensions. Please contact us if you need mechanical drawings.
- **Flexible mounting**: The enclosure reserves abundant mounting holes and supports multiple brackets or housings. With CamThink [“Product Accessories”](#product-accessories), the camera can be deployed in many scenarios.
- **Camera choices**: The main board supports CPI and USB sensors, allowing different lenses to be swapped in. See [“Interchangeable Camera Modules”](#interchangeable-camera-modules) for details.
- **Communication options**: Wi‑Fi and Cat‑1 can be switched according to site requirements. See [“Communication Expansion”](#communication-expansion) for more information.
- **Power options**: Ships with a battery tray (4× AA). It can also draw power via USB Type‑C, solar panels, or PoE.
- **Open hardware**: Mechanical files (for 3D printing) and the open-source firmware are available. Out of the box you get low-power modes, wake-up control, MQTT data transfer, fill-light control, scheduled capture, image tuning, and network management. Refer to the “Developer Guide” for build and flashing instructions.

### Hardware Interface Expansion

> NeoEyes NE301 can extend its hardware capability to match different use cases.

- **16-pin IO header**: Provides GPIO, DI, and DO interfaces. Can connect additional sensors to trigger the camera (resource availability depends on communication modules and USB camera usage).
- **Power connector**: 2-pin power header on the back for the battery tray; USB Type‑C on the front bottom side for wired power (an aperture is required if the enclosure is sealed).
- **Micro TF slot**: Local storage for images or data.
- **Debug interfaces**: USB Type‑C and UART are exposed for development and serial debugging.
- **Lighting**: Built-in fill light and status LED for short-range imaging in dark environments and system indication.
- **Alarm interface**: 2-pin Wafer connector for alarm inputs.
- **PIR interface**: 4-pin Wafer connector to attach PIR sensors.

### Communication Expansion

> Wi‑Fi comes standard. An LTE Cat‑1 module can be added by mounting it onto the front-side headers. Swapping communication modules is straightforward.

- **Interface & compatibility**: Standard pin headers located on the front of the main board, recognized without additional drivers.
- **Cat‑1 specifications**: Quectel EG912U‑GL (global, excluding North America) and EG915Q‑NA (North America) with LTE FDD/TDD and GSM support, 60 mm × 60 mm footprint.

### Interchangeable Camera Modules

#### Supported Camera Options

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
      <th>Type</th>
      <th>Model</th>
      <th>Field of View</th>
      <th>Focus Distance</th>
      <th>Use Cases</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>CPI camera</td>
      <td>OS04C10-51-4M <br/>OS04C10-88-3M <br/>OS04C10-137-4M</td>
      <td>51°<br/>88°<br/>137°</td>
      <td>4 m<br/>3 m<br/>2 m</td>
      <td>Standard<br/>Wide angle<br/>Ultra-wide angle</td>
    </tr>
   <tr>
      <td>USB camera</td>
      <td>SC200AI-51-4M <br/>SC200AI-88-3M <br/>SC200AI-137-4M</td>
      <td>51°<br/>88°<br/>137°</td>
      <td>4 m<br/>3 m<br/>2 m</td>
      <td>Standard<br/>Wide angle<br/>Ultra-wide angle</td>
    </tr>
  </tbody>
</table>

> The standard kit ships with the CPI OS04C10 module. USB modules can be purchased separately.

### Deployment Readiness

> NeoEyes NE301 is designed for outdoor stability and flexible deployment.

- **Tempered-glass lens cover**: Highly transparent glass prevents water accumulation and secures long-term imaging quality outdoors.
- **Outdoor-grade power & protection**: Battery-powered, low-energy operation plus IP67 ingress protection suits harsh environments.
- **Flexible mounting**: Supports wall, ceiling, and pole mounting. Original brackets and additional enclosures are available to match different scenarios.

<!-- Additional image slots -->

## Product Specifications

### System Specifications

The key specifications of the complete NE301 unit are listed below.

<table>
  <thead>
    <tr>
      <th>Category</th>
      <th>Item</th>
      <th>Specification</th>
    </tr>
  </thead>
  <tbody>
    <!-- MCU -->
    <tr>
      <td rowspan="7">MCU</td>
      <td>Core</td>
      <td>Cortex-M55 @ 800 MHz with Arm Helium vector extensions</td>
    </tr>
    <tr>
      <td>NPU</td>
      <td>Neural-ART™ accelerator @ 1 GHz, up to 600 GOPS (0.6 TOPS), real-time inference</td>
    </tr>
    <tr>
      <td>SRAM</td>
      <td>4.2 MB</td>
    </tr>
    <tr>
      <td>ISP Image Processor</td>
      <td>Dedicated ISP with demosaic, auto white balance, and other preprocessing</td>
    </tr>
    <tr>
      <td>Video Codec</td>
      <td>Hardware H.264 and JPEG encoders supporting 1080p@30 fps</td>
    </tr>
    <tr>
      <td>Efficiency</td>
      <td>3 TOPS/W NPU efficiency without active cooling</td>
    </tr>
    <tr>
      <td>Boot / wake-up</td>
      <td>Microsecond boot, millisecond wake-up</td>
    </tr>
    <!-- Main board -->
    <tr>
      <td rowspan="11">Main board</td>
      <td>HyperFlash</td>
      <td>128 MB</td>
    </tr>
    <tr>
      <td>PSRAM</td>
      <td>64 MB</td>
    </tr>
    <tr>
      <td>Buttons</td>
      <td>Reset, Boot, Capture / Record</td>
    </tr>
    <tr>
      <td>Status LEDs</td>
      <td>Power LED, system LED</td>
    </tr>
    <tr>
      <td>Connectivity</td>
      <td>Wi‑Fi 6 / BLE</td>
    </tr>
    <tr>
      <td>Camera interfaces</td>
      <td>USB 4-pin ×1, MIPI CSI-2 ×1</td>
    </tr>
    <tr>
      <td>16-pin IO</td>
      <td>UART ×1<br/>RS485 ×1<br/>I2C ×1<br/>SPI ×1<br/>GPIO ×2<br/>3.3 V ×1 / 5 V ×1 (power switchable)<br/>GND ×2</td>
    </tr>
    <tr>
      <td>Debug & power</td>
      <td>USB Type‑C ×1, 4-pin UART Wafer ×1</td>
    </tr>
    <tr>
      <td>Audio IO</td>
      <td>Audio Input ×1 (Wafer), Audio Output ×1 (Wafer)</td>
    </tr>
    <tr>
      <td>Expansion headers</td>
      <td>12-pin + 16-pin connectors for communication / sensor modules</td>
    </tr>
    <tr>
      <td>Storage</td>
      <td>TF card (Micro SD)</td>
    </tr>
    <!-- Structure -->
    <tr>
      <td rowspan="5">Mechanical & other</td>
      <td>Power input</td>
      <td>DC 5 V</td>
    </tr>
    <tr>
      <td>Dimensions</td>
      <td>77 mm × 77 mm × 48 mm</td>
    </tr>
    <tr>
      <td>Operating temperature</td>
      <td>−20 °C to +50 °C</td>
    </tr>
    <tr>
      <td>Humidity</td>
      <td>0% – 90% RH (non-condensing)</td>
    </tr>
    <tr>
      <td>Certifications</td>
      <td>CE / FCC / RoHS / SRRC</td>
    </tr>
  </tbody>
</table>

### Enclosure & Accessories

The mechanical design reserves sufficient space for add-ons, and official accessories support multiple mounting scenarios.

### Product Accessories

> Optional accessories share the same mounting scheme as NeoEyes NE101. The table below lists the available kits.

| Image | Name | Qty | Description |
| ----- | ---- | --- | ----------- |
| <img src="https://camthink-ai.github.io/wiki-documents/zh-Hans/img/Overview/NE101/Bracket/1.png" alt="Bottom bracket extension" width="180" /> | Bottom bracket extension | 1 | Extends top or bottom installation points |
| <img src="https://camthink-ai.github.io/wiki-documents/zh-Hans/img/Overview/NE101/Bracket/3.png" alt="Back bracket extension" width="180" /> | Back bracket extension | 1 | Adds mounting options for wall installations |
| <img src="https://camthink-ai.github.io/wiki-documents/zh-Hans/img/Overview/NE101/Bracket/5.png" alt="Pole bracket" width="180" /> | Pole bracket | 1 | Adjustable pole mount with two metal rods and adapters (rods can be customized) |
| <img src="https://camthink-ai.github.io/wiki-documents/zh-Hans/img/Overview/NE101/Bracket/4.png" alt="Dial bracket" width="180" /> | Dial bracket | 1 | Stable mounting for meters with minimal ambient light interference |
| <img src="https://camthink-ai.github.io/wiki-documents/zh-Hans/img/Overview/NE101/Bracket/2.png" alt="Water meter bracket" width="180" /> | Water-meter bracket | – | 3D printable design files available on request |
| <img src="https://camthink-ai.github.io/wiki-documents/zh-Hans/img/Overview/NE101/sensor1.png" alt="OS04C10 camera module" width="180" /> | OS04C10 camera module | 1 | 51° / 88° / 137° FOV options (4 m / 3 m / 2 m focus) |
| <img src="https://camthink-ai.github.io/wiki-documents/zh-Hans/img/Overview/NE101/sensor1.png" alt="SC200AI USB camera module" width="180" /> | SC200AI USB camera module | 1 | 51° / 88° / 137° FOV options (4 m / 3 m / 2 m focus) |
| <img src="https://camthink-ai.github.io/wiki-documents/zh-Hans/img/Overview/NE101/cat1PCBA.png" alt="Cat.1 module" width="180" /> | Cat.1 module | 1 | Plug-in Cat‑1 module for global or North America variants |
| <img src="/img/ne301/overview/poe.png" alt="PoE module" width="180" /> | PoE module | 1 | Optional plug-in PoE module |

### Installation Examples

#### Wall Mount

![NE_Series_Bracket_Wall_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_Bracket_Wall_Mount.png)

![NE_Series_Wall_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_Wall_Mount.png)

#### Dial Mount

![NE_Series_Bracket_Meter_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_Bracket_Meter_Mount.png)

![NE_Series_Meter_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_Meter_Mount.png)

#### Pole Mount

![NE_Series_Bracket_Rod_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_Bracket_Rod_Mount.png)

![NE_Series_Rod_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_Rod_Mount.png)

#### Shaft & Ball Mount

![NE_Series_Bracket_ShaftBall_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_Bracket_ShaftBall_Mount.png)

![NE_Series_ShaftBall_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_ShaftBall_Mount.png)

#### Base Mount

![NE_Series_Bracket_U_Type_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_Bracket_U_Type_Mount.png)

![NE_Series_U_Type_Mount.png](/img/Hardware_Guide/Edge_AI_Camera/BracketsAndUsage/NE_Series_U_Type_Mount.png)

## Application Scenarios

> NeoEyes NE301 delivers on-device AI while maintaining ultra-low power consumption. It fits edge inference, event-triggered capture, and periodic sampling scenarios.

### Smart City

<div className="scenario-overview" style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
  <img src={useBaseUrl('/img/ne301/scenarios/smart-city.svg')} alt="Smart city overview" style={{ width: "260px", maxWidth: "100%" }} />
  <p style={{ flex: "1", margin: 0, lineHeight: 1.6 }}>
    Thanks to μA-level sleep current and strong edge AI, NE301 can stay deployed in city environments for long periods without frequent battery replacement, while keeping data on device for low-latency responses.
  </p>
</div>

<ApplicationScenarios
  imagePosition="left"
  maxDescriptionLines={8}
  categories={[
    {
      title: "Use Cases",
      items: [
        {
          title: "Occupancy detection",
          description: "Triggered by PIR, radar, or other events to monitor public zones, spot illegal parking or clutter, and push instant alerts.",
          image: useBaseUrl('/img/ne301/scenarios/city-occupancy.svg'),
          imageAlt: "Occupancy detection illustration"
        },
        {
          title: "Unmanned retail",
          description: "Performs edge analytics on customer behavior and product recognition to enable autonomous checkout and anti-theft—even without wired power.",
          image: useBaseUrl('/img/ne301/scenarios/city-retail.svg'),
          imageAlt: "Unmanned retail illustration"
        },
        {
          title: "Smart advertising",
          description: "Combines traffic analytics with demographic profiling to optimize ad placements. Only inference results are uploaded, saving bandwidth.",
          image: useBaseUrl('/img/ne301/scenarios/city-advertising.svg'),
          imageAlt: "Smart advertising illustration"
        }
      ]
    }
  ]}
/>

### Smart Factory

<div className="scenario-overview" style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
  <img src={useBaseUrl('/img/ne301/scenarios/smart-factory.svg')} alt="Smart factory overview" style={{ width: "260px", maxWidth: "100%" }} />
  <p style={{ flex: "1", margin: 0, lineHeight: 1.6 }}>
    Modular sensors and communication modules make it easy to adapt NE301 to industrial requirements. Local AI inference shortens response time and reduces reliance on upstream networks.
  </p>
</div>

<ApplicationScenarios
  imagePosition="left"
  maxDescriptionLines={8}
  categories={[
    {
      title: "Use Cases",
      items: [
        {
          title: "Safety gear inspection",
          description: "Detects whether workers wear helmets, vests, and other safety gear in real time and raises instant alerts for violations.",
          image: useBaseUrl('/img/ne301/scenarios/factory-ppe.svg'),
          imageAlt: "Industrial PPE inspection illustration"
        },
        {
          title: "Helmet compliance detection",
          description: "Accurately identifies missing helmets to enforce safety regulations on the production floor.",
          image: useBaseUrl('/img/ne301/scenarios/factory-helmet.svg'),
          imageAlt: "Helmet compliance illustration"
        }
      ]
    }
  ]}
/>

### Smart Agriculture & Livestock

<div className="scenario-overview" style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
  <img src={useBaseUrl('/img/ne301/scenarios/smart-agriculture.svg')} alt="Smart agriculture overview" style={{ width: "260px", maxWidth: "100%" }} />
  <p style={{ flex: "1", margin: 0, lineHeight: 1.6 }}>
    Low power consumption and battery operation suit off-grid farmlands. Periodic capture with edge analytics enables data-driven farming and husbandry.
  </p>
</div>

<ApplicationScenarios
  imagePosition="left"
  maxDescriptionLines={8}
  categories={[
    {
      title: "Use Cases",
      items: [
        {
          title: "Crop growth capture",
          description: "Takes scheduled photos and analyzes plant growth with AI to support precision agriculture.",
          image: useBaseUrl('/img/ne301/scenarios/agri-crop.svg'),
          imageAlt: "Crop monitoring illustration"
        },
        {
          title: "Livestock monitoring",
          description: "Tracks animal activity and health, raising alerts when abnormal behavior is detected.",
          image: useBaseUrl('/img/ne301/scenarios/agri-livestock.svg'),
          imageAlt: "Livestock monitoring illustration"
        },
        {
          title: "Smart feeding",
          description: "Identifies individual pigs and coordinates automatic feeders for accurate dosing or counting.",
          image: useBaseUrl('/img/ne301/scenarios/agri-breeding.svg'),
          imageAlt: "Smart breeding illustration"
        }
      ]
    }
  ]}
/>

### Additional Integrations

<div className="scenario-overview" style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
  <img src={useBaseUrl('/img/ne301/scenarios/smart-integration.svg')} alt="Integration overview" style={{ width: "260px", maxWidth: "100%" }} />
  <p style={{ flex: "1", margin: 0, lineHeight: 1.6 }}>
    The open hardware and rich IO make NE301 easy to integrate into existing systems, widening the scope of edge AI applications.
  </p>
</div>

<ApplicationScenarios
  imagePosition="left"
  maxDescriptionLines={8}
  categories={[
    {
      title: "Use Cases",
      items: [
        {
          title: "Smart doorbells / peepholes",
          description: "Triggered by PIR or radar to capture suspicious visitors and run on-device recognition for home security.",
          image: useBaseUrl('/img/ne301/scenarios/integration-doorbell.svg'),
          imageAlt: "Smart doorbell illustration"
        },
        {
          title: "Production lines",
          description: "Integrates into industrial equipment for real-time video analytics to supervise quality and process flow.",
          image: useBaseUrl('/img/ne301/scenarios/integration-production.svg'),
          imageAlt: "Production line illustration"
        },
        {
          title: "In-vehicle systems",
          description: "Monitors driver fatigue and issues timely warnings to improve road safety.",
          image: useBaseUrl('/img/ne301/scenarios/integration-vehicle.svg'),
          imageAlt: "Vehicle monitoring illustration"
        }
      ]
    }
  ]}
/>

## Application Examples

Coming soon!!

<!-- Links to Application Guide -->

## Resources

### Product Tutorials

Coming soon!!

<!--
- Quick start: https://camthink-ai.github.io/wiki-documents/zh-Hans/docs/NeoEyes%20NE101%20Series/Quick%20Start
- Developer guide: https://camthink-ai.github.io/wiki-documents/zh-Hans/docs/NeoEyes%20NE101%20Series/NE100-MB01%20Development%20Board/Dev%20Guide
- Application guide: https://camthink-ai.github.io/wiki-documents/zh-Hans/docs/NeoEyes%20NE101%20Series/Application%20Guide/low-power-image-acquisition
-->

## Technical Support

<SupportGrid />

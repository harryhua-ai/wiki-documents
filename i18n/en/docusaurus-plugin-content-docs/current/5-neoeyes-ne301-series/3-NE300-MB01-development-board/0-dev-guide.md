import useBaseUrl from '@docusaurus/useBaseUrl';
import SupportGrid from '@site/src/components/SupportGrid';


# Dev Guide

## Development Board Overview

NE300-MB01 is the high-performance development board that powers the NeoEyes NE300 series AI cameras. The reference design combines STM32U0 + STM32N6 MCUs with an ultra-low-power architecture capable of both video and still-image inference. It supports a wide set of trigger sensors for image capture and edge AI pipelines, enabling developers to quickly build proofs of concept and custom IoT camera applications spanning smart agriculture, environmental monitoring, security, and wildlife observation.

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
  <img src={useBaseUrl('/img/ne301/development-board/dev-guide/board1.jpg')} alt="Development board front" style={{ height: '300px', objectFit: 'contain', margin: '0 auto' }} />
  <img src={useBaseUrl('/img/ne301/development-board/dev-guide/board2.jpg')} alt="Development board back" style={{ height: '300px', objectFit: 'contain', margin: '0 auto' }} />
</div>

## Key Features

**Ultra-low-power orchestration**

STM32U0 manages the power tree and monitors the attached sensors, waking the full system from deep sleep only when needed.

**Support for multiple optics**

1. OS04C10 CSI camera module
2. USB camera modules
3. Swappable lenses with different focal lengths and FOVs to match each deployment

**Flexible connectivity**

1. On-board Wi-Fi 6
2. Optional Cat-1 cellular module

**Rich IO resources**

1. 16 + 12-pin GPIO expansion headers
2. USB Type-C for power and debugging
3. TF card slot for removable storage
4. Alarm/trigger input header

**Modular design**

Communication, camera, and power modules can be swapped or upgraded independently.

**Open hardware architecture**

The reference schematics and connectors simplify customization for vertical solutions.

## Technical Specifications

| **Category** | **Specification** |
| --- | --- |
| MCU | STM32N657L0H3 |
| Low-power MCU | STM32U073KBU6 |
| External PSRAM | APS512XX-OBR-BG, 64 MB |
| External Flash | MX66UM1G45G, 128 MB |
| Camera | OS04C10 (default), optional USB camera |
| Lens DFOV | 59°, 97°, 165° |
| Focus distance | 2 m, 3 m, 4 m (adjustable) |
| Connectivity | Wi-Fi 6 (default), Cat-1 LTE (optional) |
| Bluetooth | Under development |
| Power input | USB-C (5 V / 2 A) or battery pack (4 × AA, 6 V) |
| GPIO expansion | 16-pin GPIO header |
| Module GPIO expansion | 16 + 12-pin GPIO headers |
| Operating temperature | -10 °C to 50 °C |
| Local storage | Micro SD card |
| Auxiliary light | Supported |
| Dimensions | 60 mm × 60 mm |

## Developer Resources

NE300-MB01 ships with comprehensive documentation and reference material. Start with the following chapters:

### Hardware resources

- [Hardware Components Overview](./1-hardware-guide/0-components-overview.md) — Bill of materials and module specs
- [Hardware Connection Guide](./1-hardware-guide/1-hardware-connection.md) — Interfaces, pinouts, and wiring notes

### Software resources

- [NE301 GitHub Repository](https://github.com/camthink-ai/ne301) — Firmware, web UI, and sample projects

### Application examples

Coming soon!!

## Quick Start

- [Development Board Quick Start](./1-qucik-start.md) — Step-by-step usage guide

## Support & Additional Resources

<SupportGrid />
<!--Discord、GIthub issue-->

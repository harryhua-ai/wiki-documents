---
title: System Flashing and Initialization
---

## Hardware Connections

### Prerequisites

- NE301 main board × 1
- ST-Link V2 × 1
- **4-pin 1.25 mm JST (male) → 2.54 mm Dupont (female)** cable for STM32N6 flashing
- **3-pin 2.54 mm Dupont (female-female)** cable for STM32U0 flashing
- USB Type-C cable compatible with your PC port (Type-A host requires a C→A cable)

---

### Flashing `apps`, `web`, or `models`

1. Toggle DIP switch **#2** to ON to enter flashing mode. After flashing, switch it back and power-cycle (or press **Reset**) to boot into runtime mode.

   <p align="center">
     <img src="/img/ne301/development-board/software-guide/sys-flash/flash-mode.png" alt="DIP switch for flashing" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
   </p>
2. Use the **4-pin adapter cable** to connect the **ST-Link** to the board's **DEBUG** header, then plug ST-Link into the PC.

   <p align="center">
     <img src="/img/ne301/development-board/software-guide/sys-flash/st-link.png" alt="ST-Link wiring" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
   </p>
3. Connect the board to the PC or a power adapter via USB Type-C.

   <p align="center">
     <img src="/img/ne301/development-board/software-guide/sys-flash/type-c.png" alt="Type-C power" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
   </p>

   The on-board **DEBUG LED stays solid** to indicate flashing mode.

---

### Flashing `wakecore`

1. Use the **3-pin Dupont cable** to connect the **ST-Link** directly to the **STM32U0** header, then attach ST-Link to the PC.

   <p align="center">
     <img src="/img/ne301/development-board/software-guide/sys-flash/u0.png" alt="STM32U0 wiring" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
   </p>
2. Connect the board to the PC or power adapter via USB Type-C.

   <p align="center">
     <img src="/img/ne301/development-board/software-guide/sys-flash/connect.png" alt="Power connection" style={{width:'100%', maxWidth:'520px', borderRadius:'8px'}} />
   </p>

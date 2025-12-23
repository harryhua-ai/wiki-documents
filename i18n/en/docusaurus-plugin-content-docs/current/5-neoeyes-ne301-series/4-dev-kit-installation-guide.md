# Dev Kit Installation Guide

## Component Overview

<div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/ne301-dev-kit.png" alt="Panorama" style={{ width: '100%', maxWidth: '800px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
</div>

Component Parts:

① NE301_Top Cover
② NE301_Middle Frame
③ NE301_Mainboard
④ NE301_Bottom Cover
⑤ Battery Box
⑥ NE301_Sealing Ring
⑦ Sensor Mainboard
⑧ Sensor Auxiliary Board
⑨ M12 Lens Support Base
⑩ CV Light Board
⑪ X1_Lens
⑫ NE301_M12 Spacer (Dedicated for HFOV 137° lens module)
⑬ NE301_M12 Panel
⑭ NE301_Pressure Plate
⑮ NE301_Button
⑯ Lens Cap
⑰ Lens
⑱ Screw Package: Includes six types of screws, see parts list below for details
⑲ Screwdriver

<!-- > If you don't have an NE301 yet, you can purchase it through the official website — [NE301 Developer Kit Purchase Link](https://www.camthink.ai/store/ne301-dev-kit/). -->

## Parts Checklist

After receiving the device, you can verify the components against the following checklist:

<table>
  <thead>
    <tr>
      <th align="center">Component Group</th>
      <th align="center">Part Name</th>
      <th align="center">Quantity</th>
      <th align="center">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center" rowSpan="7">Housing</td>
      <td align="center">NE301_Top Cover</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">NE301_Middle Frame</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">NE301_Bottom Cover</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">NE301_Button</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">NE301_Sealing Ring</td>
      <td align="center">2</td>
      <td align="center">One each for top and bottom covers</td>
    </tr>
    <tr>
      <td align="center">NE301_Pressure Plate</td>
      <td align="center">1</td>
      <td align="center">Pressure plate for button patch</td>
    </tr>
    <tr>
      <td align="center">NE301_M12 Panel</td>
      <td align="center">1</td>
      <td align="center">Panel for OS04C10 lens</td>
    </tr>
    <tr>
      <td align="center" rowSpan="5">Boards</td>
      <td align="center">Mainboard (Wi-Fi)</td>
      <td align="center">1</td>
      <td align="center">Includes chip and other components</td>
    </tr>
    <tr>
      <td align="center">OS04C10 Camera Module</td>
      <td align="center">1</td>
      <td align="center">Includes Sensor board, auxiliary board (for connecting to mainboard), and lens</td>
    </tr>
    <tr>
      <td align="center">CV Light Board</td>
      <td align="center">1</td>
      <td align="center">Connects to the mainboard</td>
    </tr>
    <tr>
      <td align="center">Extension Board: Cat-1 (Optional)</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">Extension Board: POE (Optional)</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center" rowSpan="6">Screws</td>
      <td align="center">Phillips Machine Screws (Thin Cylindrical Head, Original Color)</td>
      <td align="center">8</td>
      <td align="center">Screws for the back of the top and bottom covers</td>
    </tr>
    <tr>
      <td align="center">Phillips Self-tapping Screws (Pointed Tail, Carbon Steel, Galvanized)</td>
      <td align="center">3</td>
      <td align="center">Mainboard fixing screws for top-right, bottom-right, and bottom-left; 1.9*5mm</td>
    </tr>
    <tr>
      <td align="center">Phillips Self-tapping Screws (Flat Tail, Carbon Steel, Black)</td>
      <td align="center">3</td>
      <td align="center">Two used for button pressure plate patch, one for fixing the bottom-right corner of the camera module</td>
    </tr>
    <tr>
      <td align="center">Phillips Self-tapping Screws (Pointed Tail, Carbon Steel, Silver)</td>
      <td align="center">2</td>
      <td align="center">Screws for fixing battery compartment</td>
    </tr>
    <tr>
      <td align="center">Phillips Self-tapping Screws (Pointed Tail, Blue-white Zinc or Black)</td>
      <td align="center">1</td>
      <td align="center">Mainboard fixing screw for top-left corner</td>
    </tr>
    <tr>
      <td align="center">Phillips Self-tapping Screws (Pointed Tail, Carbon Steel, Galvanized)</td>
      <td align="center">2</td>
      <td align="center">For fixing the lens, 1.7*5mm</td>
    </tr>
    <tr>
      <td align="center" rowSpan="4">Other Parts</td>
      <td align="center">Battery Box</td>
      <td align="center">1</td>
      <td align="center">Standard version defaults to battery power</td>
    </tr>
    <tr>
      <td align="center">NE301_M12 Spacer</td>
      <td align="center">1</td>
      <td align="center">Used for padding the bracket, dedicated for 137° lens module, not needed for 51°/88° modules</td>
    </tr>
    <tr>
      <td align="center">M12 Lens Support Base</td>
      <td align="center">1</td>
      <td align="center">Supports the camera module</td>
    </tr>
    <tr>
      <td align="center">X1_Lens</td>
      <td align="center">1</td>
      <td align="center">Frosted light board lens, placed between light board and panel</td>
    </tr>
  </tbody>
</table>

> **Please Note**:
> ① Batteries are not included in the shipment; you need to purchase four AA batteries separately.
> ② The standard configuration includes an OS04C10 module lens, with three FOV options available: 51°, 88°, 137°.
> ③ If you choose the 137° FOV lens, an additional spacer is included to support the lens; it is not required for other FOV modules.

## Installation Steps

After checking the parts list and quantities, you can assemble the components individually to further confirm their completeness. This tutorial demonstrates the installation using the HFOV 137° as an example.
Specifically, these are the top cover (four screws, lens protection foam, panel, X1 lens), middle frame (button pressure plate, button, two screws), bottom cover (four screws), battery box (requires four AA batteries), and mainboard (OS04C10 lens module, M12 lens support base, three short screws + one long screw), totaling five parts. The lens module includes the Sensor mainboard, auxiliary board, lens, lens fixing screws, M12 lens support base, and the spacer required for the HFOV 137° module.

The kit includes six types of screws, which differ slightly. Please distinguish them carefully:

- Phillips Machine Screws (Thin Cylindrical Head, Original Color)
- Phillips Self-tapping Screws (Pointed Tail, Carbon Steel, Silver)
- Phillips Self-tapping Screws (Pointed Tail, Carbon Steel, Galvanized, 1.9*5mm)
- Phillips Self-tapping Screws (Flat Tail, Carbon Steel, Black)
- Phillips Self-tapping Screws (Pointed Tail, Blue-white Zinc or Black)
- Phillips Self-tapping Screws (Pointed Tail, Carbon Steel, Black, 1.7*4mm)

### Step 1: Camera Module

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/camera-moudle.jpg" alt="NE301_Camera-Module" style={{ width: '100%', maxWidth: '400px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

The overall effect is shown above, including the Sensor mainboard, auxiliary board, lens, lens fixing screws, M12 lens support base, the spacer needed for the HFOV 137° module, and the mainboard.

Objective: Secure the lens onto the Sensor board, tightening the lens module screws (Phillips self-tapping, pointed tail, carbon steel, galvanized) to ensure the lens module is firm.
During installation, remember to remove the protective film from the Sensor board to ensure image clarity. Once removed, install the lens onto the Sensor board and tighten the screws.

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/sensor-1.jpg" alt="NE301_Guide1" style={{ flex: '1 1 200px', maxWidth: '30%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/ne301/dev-kit-installation-guide/sensor-2.jpg" alt="NE301_Guide2" style={{ flex: '1 1 200px', maxWidth: '30%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/ne301/dev-kit-installation-guide/sensor-3.jpg" alt="NE301_Guide3" style={{ flex: '1 1 200px', maxWidth: '30%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

After installing the camera module, check if the lens is secure and the screws are tightened, then prepare the Sensor auxiliary board.
The Sensor auxiliary board connects the Sensor board to the mainboard, ensuring stability.

> Tips: Pay extra attention to the installation direction of the Sensor board. Incorrect orientation will prevent connection to the mainboard, causing the camera to malfunction.

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/sensor-4.jpg" alt="NE301_Guide4" style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

If your lens module is 137° FOV, attach the NE301_M12 spacer to the back of the lens module as shown below:

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/sensor-6.png" alt="NE301_Guide6" style={{ flex: '1 1 250px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/ne301/dev-kit-installation-guide/sensor-7.jpg" alt="NE301_Guide7" style={{ flex: '1 1 250px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

The fully assembled lens module is shown below. You will need to remove the protective lens cap before mounting it to the mainboard.

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/sensor-5.jpg" alt="NE301_Guide5" style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

### Step 2: Top Cover Assembly

Once the camera module is ready, you can assemble the housing. Below is a diagram of the housing parts.

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/panel-1.jpg" alt="NE301_Guide8" style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

Start with the top cover, which involves the camera panel.
Top cover assembly: Includes internal M12 panel, X1 lens (white, for the light board), three short screws for fixing to the middle frame, one long screw, and the top cover sealing ring.

First, place the sealing ring in the groove on the inside of the top cover (note the installation direction), then place the white transparent X1 lens into the two holes (one round, one square). Peel off the adhesive from the back of the panel and stick it into the groove of the top cover, ensuring hole alignment. This will also secure the X1 lens. Finally, remove the protective film from the panel before use to ensure clarity.

> Tips: Ensure the white X1 lens is correctly placed before sticking the glass panel.

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/panel-2.jpg" alt="NE301_Guide9" style={{ flex: '1 1 250px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/ne301/dev-kit-installation-guide/panel-3.jpg" alt="NE101_Guide10" style={{ flex: '1 1 250px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

### Step 3: Middle Frame Assembly

Middle frame parts: NE301_Button, NE301_Pressure Plate, two Phillips self-tapping screws (flat tail, carbon steel, black).

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/mid-frame.jpg" alt="NE301_Mid-Frame" style={{ flex: '1 1 250px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/ne301/dev-kit-installation-guide/side-button.jpg" alt="NE301_Side-Button" style={{ flex: '1 1 250px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

As shown above, check the components and align the holes.
Install the button on the side of the middle frame with the camera icon facing outward. Place the pressure plate over the button, passing through the cylinders on both sides, and secure with two screws. Tighten these screws firmly to prevent button loosening or misalignment. If you have experience with the NE101, this will be even easier!

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/InstallationGuide/NE101_Guide4.png" alt="NE301_Guide11" style={{ flex: '1 1 200px', maxWidth: '30%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/InstallationGuide/NE101_Guide5.png" alt="NE301_Guide12" style={{ flex: '1 1 200px', maxWidth: '30%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/InstallationGuide/NE101_Guide6.png" alt="NE301_Guide13" style={{ flex: '1 1 200px', maxWidth: '30%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

> Tips: It is best to install the buttons before mounting the mainboard to avoid misalignment.

### Step 4: Battery Box Assembly

Battery box assembly: The standard version is battery-powered. It is fixed to the middle frame using two screws through the holes inside the battery box. The connection wire attaches to the power interface on the back of the mainboard.

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/InstallationGuide/NE101_Guide7.png" alt="NE301_Guide14" style={{ flex: '1 1 300px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/ne301/dev-kit-installation-guide/battery-compartment.jpg" alt="NE301_Guide15" style={{ flex: '1 1 300px', maxWidth: '45%', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

### Step 5: Bottom Cover Assembly

Bottom cover assembly: Place the sealing ring in the groove on the inside of the bottom cover and prepare the four screws.

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/InstallationGuide/NE101_Guide8.png" alt="NE301_Guide16" style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

### Step 6: Mainboard Assembly

Mainboard parts: Includes M12 lens support base, OS04C10 lens module (assembled previously), CV light board, and four screws (three short Phillips self-tapping galvanized + one long Phillips self-tapping blue-white zinc or black) for fixing to the middle frame.

Connect the Sensor auxiliary board of the lens module into the mainboard clip. This clip is a flip-type; lift to insert and press down to lock the cable. Finally, plug the CV light board pins into the mainboard below the camera module—the round light sensor on the left and the square fill light on the right. Once secure, remove the protective cap from the lens.

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/cv-board-1.jpg" alt="NE301_Board" style={{ flex: '1 1 200px', maxWidth: '30%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/ne301/dev-kit-installation-guide/board.jpg" alt="NE301_Board" style={{ flex: '1 1 200px', maxWidth: '30%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

The mainboard assembly is shown below:

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/cv-board-2.jpg" alt="NE301_Board" style={{ flex: '1 1 200px', maxWidth: '30%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

> **Note**:
> ① For development and debugging, ensuring the lens is usable is sufficient.
> ② for immediate deployment, it is recommended to secure the camera module and mainboard connection using hot-melt adhesive or soldering.

Choose the most suitable lens module based on your deployment height, space, and target. You can upgrade visual performance at a low cost by simply swapping the lens module without changing the mainboard. Supported module specifications:

<table>
  <thead>
    <tr>
      <th><strong>Type</strong></th>
      <th><strong>Model</strong></th>
      <th><strong>FOV</strong></th>
      <th><strong>Focus Distance</strong></th>
      <th><strong>Scenario</strong></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Camera Module</td>
      <td>OS04C10</td>
      <td>51°</td>
      <td>4m</td>
      <td>Long-distance capture</td>
    </tr>
    <tr>
      <td>Camera Module</td>
      <td>OS04C10</td>
      <td>88°</td>
      <td>3m</td>
      <td>Medium-distance capture</td>
    </tr>
    <tr>
      <td>Camera Module</td>
      <td>OS04C10</td>
      <td>137°</td>
      <td>2m</td>
      <td>Close-range wide-angle capture</td>
    </tr>
  </tbody>
</table>

> Tips: You can manually adjust the lens focus during debugging.

### Step 7: Fixing the Battery Box

After securing the mainboard to the middle frame, connect the battery box wire to the power interface on the back of the mainboard, as shown below. Secure the battery box to the middle frame with two screws (pointed tail, carbon steel, silver) through the internal holes, then insert the batteries.

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/battery-g.jpg" alt="NE301_Battery" style={{ flex: '1 1 200px', maxWidth: '30%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/InstallationGuide/NE101_Guide14.png" alt="NE301_Battery" style={{ flex: '1 1 200px', maxWidth: '30%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/InstallationGuide/NE101_Guide15.png" alt="NE301_Battery" style={{ flex: '1 1 200px', maxWidth: '30%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

The middle frame, mainboard, and battery components are now fully secured.

### Step 8: Securing the Covers

Finally, align the top and bottom covers with the middle frame holes and secure each with four screws to complete the assembly.

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/ne301/dev-kit-installation-guide/301-1.jpg" alt="NE301_Top_Cover" style={{ flex: '1 1 200px', maxWidth: '30%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
  <img src="/img/ne301/dev-kit-installation-guide/301-2.jpg" alt="NE301_Bottom_Cover" style={{ flex: '1 1 200px', maxWidth: '30%', height: '220px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

> **Important Detail**: Ensure the raised circular parts of the covers align with the recessed parts of the middle frame. Otherwise, gaps will remain.

<div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
  <img src="/img/InstallationGuide/NE101_Guide18.png" alt="NE301_Top_Bottom_Cover" style={{ width: '100%', maxWidth: '500px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
</div>

Your NE301 AI Camera Developer Kit is now fully assembled. For usage and deployment, see — [Quick Start](./1-quick-start.md).

For questions or suggestions, join our community on Discord or provide feedback on [GitHub Issues](https://github.com/camthink-ai/lowpower_camera/issues) — [Discord](https://discord.com/invite/6TZb2Y8WKx/).

# Dev Kit Installation Guide

## Component Overview

<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
  <img src="/img/InstallationGuide/Panorama.png" alt="Panorama" style={{ width: '60%' }} />
</div>

Component parts:
① NE101_Middle Frame
② NE101_Bottom Cover
③ NE101_Top Cover
④ NE101_M6 Panel
⑤ X1_Lens
⑥ NE101_Button
⑦ NE101_Pressure Plate
⑧ NE101_Sealing Ring
⑨ M6 Lens Support Base
⑩ NE101_M6 Dust Cover
⑪ M6 Image Module (OV5640)
⑫ CV Light Board
⑬ Mainboard (WIFI Version)
⑭ Battery Box
⑮ Screw Package: Standard version includes four types of screws, see parts list below for details
⑯ Screwdriver

> If you don't have an NE101 yet, you can purchase it through the official website — [NE101 Developer Kit Purchase Link](https://www.camthink.ai/store/ne101-dev-kit/).

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
      <td align="center" rowSpan="8">Housing</td>
      <td align="center">NE101_Top Cover</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">NE101_Middle Frame</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">NE101_Bottom Cover</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">NE101_Button</td>
      <td align="center">1</td>
      <td align="center"></td>
    </tr>
    <tr>
      <td align="center">NE101_Sealing Ring</td>
      <td align="center">2</td>
      <td align="center">One each for top and bottom covers</td>
    </tr>
    <tr>
      <td align="center">NE101_Pressure Plate</td>
      <td align="center">1</td>
      <td align="center">Pressure plate for button</td>
    </tr>
    <tr>
      <td align="center">NE101_M6 Panel</td>
      <td align="center">1</td>
      <td align="center">Top cover panel, for attaching to top cover, standard lens panel</td>
    </tr>
    <tr>
      <td align="center">NE101_M12 Panel (Optional)</td>
      <td align="center">1</td>
      <td align="center">Panel for USB lens</td>
    </tr>
    <tr>
      <td align="center" rowSpan="5">Boards</td>
      <td align="center">Mainboard (WIFI Version)</td>
      <td align="center">1</td>
      <td align="center">Includes chip, standard version comes with OV5640 120° 3M lens</td>
    </tr>
    <tr>
      <td align="center">M6 Image Module</td>
      <td align="center">1</td>
      <td align="center"></td>
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
      <td align="center" rowSpan="5">Screws</td>
      <td align="center">Phillips Machine Screws (Thin Cylindrical Head, Original Color)</td>
      <td align="center">8</td>
      <td align="center">Screws for top and bottom covers</td>
    </tr>
    <tr>
      <td align="center">Phillips Self-tapping Screws (Pointed Tail, Carbon Steel, Galvanized)</td>
      <td align="center">4</td>
      <td align="center">Screws for fixing the mainboard</td>
    </tr>
    <tr>
      <td align="center">Phillips Self-tapping Screws (Flat Tail, Carbon Steel, Black)</td>
      <td align="center">2</td>
      <td align="center">Screws for button pressure plate</td>
    </tr>
    <tr>
      <td align="center">Phillips Self-tapping Screws (Pointed Tail, Carbon Steel, Silver)</td>
      <td align="center">2</td>
      <td align="center">Screws for battery compartment</td>
    </tr>
    <tr>
      <td align="center">Phillips Self-tapping Screws - USB Lens Module Fixing Screws (Optional)</td>
      <td align="center">2</td>
      <td align="center">Unique to USB module lens, used for diagonal locking; in this case, mainboard screws are reduced from four to three</td>
    </tr>
    <tr>
      <td align="center" rowSpan="4">Other Parts</td>
      <td align="center">Battery Box</td>
      <td align="center">1</td>
      <td align="center">Standard version defaults to battery power</td>
    </tr>
    <tr>
      <td align="center">NE101_M6 Dust Cover</td>
      <td align="center">1</td>
      <td align="center">Placed between panel and lens, not needed for USB version</td>
    </tr>
    <tr>
      <td align="center">M6 Lens Support Base</td>
      <td align="center">1</td>
      <td align="center">Placed between mainboard and OV5640 base</td>
    </tr>
    <tr>
      <td align="center">X1_Lens</td>
      <td align="center">1</td>
      <td align="center">Frosted light board lens, placed between light board and panel</td>
    </tr>
  </tbody>
</table>

—If you purchased the standard version, you don't need to worry about optional accessories.

> **Please Note**:
① Batteries are not included in the shipment; you need to purchase four AA batteries separately
② The standard configuration includes an OV5640 module lens with key parameters: 120° FOV, 3m Focus
③ If you choose to use a USB module lens, two additional fixing screws are included for the module's two diagonal corners, and the mainboard screws are reduced from four to three.

## Installation Steps

After checking the parts list and quantities, you can assemble the individual components to further confirm the completeness of the parts.
Specifically, these are the top cover (four screws, lens protection foam, panel, X1 lens), middle frame (button pressure plate, button, two screws), bottom cover (four screws), battery box (requires four AA batteries), and mainboard (standard version OV5640 lens module, M6 lens support base, four screws), totaling five parts.

The kit includes four types of screws:
① Phillips Machine Screws (Thin Cylindrical Head, Original Color)
② Phillips Self-tapping Screws (Pointed Tail, Carbon Steel, Silver)
③ Phillips Self-tapping Screws (Pointed Tail, Carbon Steel, Galvanized)
④ Phillips Self-tapping Screws (Flat Tail, Carbon Steel, Black)
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <img src="/img/InstallationGuide/NE101_Guide19.png" alt="NE101_Guide19" style={{ width: '32%' }} />
</div>

### Step 1: Top Cover Assembly

Top cover components: Includes M6 panel, X1 lens (for the light board), four screws for fixing to the middle frame, and sealing ring.

First, place the sealing ring in the groove on the inside of the top cover, then insert the white transparent X1 lens into the two holes in the top cover (one round and one square). Next, peel off the adhesive backing from the panel and stick it to the groove in the top cover, making sure the holes are aligned. The lens will also be fixed to the panel. Finally, remove the protective film from the front of the panel before use to ensure clarity.

<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <img src="/img/InstallationGuide/NE101_Guide1.png" alt="NE101_Guide1" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide2.png" alt="NE101_Guide2" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide3.png" alt="NE101_Guide3" style={{ width: '32%' }} />
</div>

### Step 2: Middle Frame Assembly

Middle frame components: NE101_Button, NE101_Sealing Ring, NE101_Pressure Plate.

First, install the button on the side of the middle frame with the camera icon facing outward, then place the pressure plate over the button while passing through the cylinders on both sides, and finally secure it with two screws. Please note that the screws fixing the button should be tightened as much as possible to prevent the button from becoming loose or misaligned.
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <img src="/img/InstallationGuide/NE101_Guide4.png" alt="NE101_Guide4" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide5.png" alt="NE101_Guide5" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide6.png" alt="NE101_Guide6" style={{ width: '32%' }} />
</div>

### Step 3: Battery Box Assembly

Battery box components: The standard version is powered by batteries, with the battery box fixed to the middle frame using two screws through the screw holes inside the battery box. The battery compartment connection wire connects to the power interface on the back of the mainboard.

<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
  <img src="/img/InstallationGuide/NE101_Guide7.png" alt="NE101_Guide7" style={{ width: '32%' }} />
</div>

### Step 4: Bottom Cover Assembly

Bottom cover components: Place the sealing ring in the groove on the inside of the bottom cover and prepare the four screws for the bottom cover.

<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
  <img src="/img/InstallationGuide/NE101_Guide8.png" alt="NE101_Guide8" style={{ width: '32%' }} />
</div>

### Step 5: Mainboard Assembly

Mainboard components: Includes M6 lens support base, OV5640 lens module, CV light board for use with the lens, and four screws for fixing to the middle frame.

#### Fixing the Camera Module Support Base

First, install the M6 lens support base with the notch facing downward onto the socket in the upper left corner of the mainboard. Secure it to the mainboard using adhesive, then peel off the double-sided tape on the back of the lens module and stick it to the support base. At the same time, place the dust cover over the lens and stick it in place, or directly stick it to the front cover panel to protect the lens.

<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <img src="/img/InstallationGuide/NE101_Guide9-1.png" alt="NE101_Guide9-1" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide9-2.png" alt="NE101_Guide9-2" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide9-3.png" alt="NE101_Guide9-3" style={{ width: '32%' }} />
</div>

#### Fixing the Camera Module and Light Board

Next, connect the data cable of the lens module to the MIPI CSI clip and secure it. This clip is a flap that secures the module connection cable by lifting up and pressing down. Finally, below the camera module, insert the pins of the CV light board into the mainboard, with the round light sensor on the left and the square fill light on the right. After everything is installed, you can remove the protective film from the module lens.

<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <img src="/img/InstallationGuide/NE101_Guide10-1.png" alt="NE101_Guide10-1" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide10-2.png" alt="NE101_Guide10-2" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide10-3.png" alt="NE101_Guide10-3" style={{ width: '32%' }} />
</div>

—Final result of the mainboard assembly:
<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
  <img src="/img/InstallationGuide/NE101_Guide11.png" alt="NE101_Guide11" style={{ width: '32%' }} />
</div>

> **Please Note**:
> ① If you are using the assembly for development and debugging, it is recommended to secure the lens module with double-sided tape
> ② If you are assembling for immediate application deployment, it is recommended to use hot melt adhesive or soldering methods.

In addition to the standard camera module, you can choose the most suitable lens module for flexible deployment based on installation height, space size, and recognition targets. You can significantly improve visual effects with a low-cost upgrade by simply replacing the lens module without changing the mainboard. Below are the supported camera module specifications:
<table>
      <!-- <caption>Camera Model and Parameter Comparison</caption> -->
      <thead>
        <tr>
          <th><strong>Type</strong></th>
          <th><strong>Model</strong></th>
          <th><strong>Field of View</strong></th>
          <th><strong>Focus Distance</strong></th>
          <th><strong>Application Scenario</strong></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>CPI Camera</td>
          <td>OV5640</td>
          <td>60°</td>
          <td>15cm</td>
          <td>Close-range shooting</td>
        </tr>
        <tr>
          <td>CPI Camera</td>
          <td>OV5640</td>
          <td>60°</td>
          <td>4m</td>
          <td>Standard distance shooting</td>
        </tr>
        <tr>
          <td>CPI Camera</td>
          <td>OV5640</td>
          <td>120°</td>
          <td>8cm</td>
          <td>Close-range wide-angle shooting</td>
        </tr>
        <tr>
          <td>CPI Camera</td>
          <td>OV5640</td>
          <td>120°</td>
          <td>3m</td>
          <td>Standard distance wide-angle shooting</td>
        </tr>
        <tr>
          <td>USB Camera</td>
          <td>SC200AI-51-4M</td>
          <td>51°</td>
          <td>4m</td>
          <td>Standard angle shooting</td>
        </tr>
        <tr>
          <td>USB Camera</td>
          <td>SC200AI-88-3M</td>
          <td>88°</td>
          <td>3m</td>
          <td>Wide angle shooting</td>
        </tr>
        <tr>
          <td>USB Camera</td>
          <td>SC200AI-137-2M</td>
          <td>137°</td>
          <td>2m</td>
          <td>Ultra-wide angle shooting</td>
        </tr>
      </tbody>
    </table>

To learn more, see — [Supported Interchangeable Camera Modules](https://wiki.camthink.ai/zh-Hans/docs/NeoEyes%20NE101%20Series/Overview#%E5%8F%AF%E6%8D%A2%E7%9B%B8%E6%9C%BA%E6%A8%A1%E7%BB%84).

### Step 6: Fixing the Mainboard

After the mainboard components are installed, you can secure the mainboard to the middle frame using four screws in the screw holes. Note that the screws used are pointed tail, carbon steel, galvanized. The orientation of the mainboard in the middle frame needs to align with the button, and you can verify during installation by pressing the external button. To clearly show the mainboard fixation, the camera module and light board on the mainboard from the previous step have been removed, as shown in the image below.

<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
  <img src="/img/InstallationGuide/NE101_Guide12.png" alt="NE101_Guide12" style={{ width: '32%' }} />
</div>

### Step 7: Fixing the Battery Box

After securing the mainboard to the middle frame, connect the external wire of the battery box to the power interface on the back of the mainboard, as shown in the image below. Then secure the battery box to the middle frame using two screws through the screw holes inside the battery box. The screws used are pointed tail, carbon steel, silver. Finally, insert the batteries. At this point, the middle frame, mainboard, and battery components are all secured.

<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <img src="/img/InstallationGuide/NE101_Guide13.png" alt="NE101_Guide13" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide14.png" alt="NE101_Guide14" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide15.png" alt="NE101_Guide15" style={{ width: '32%' }} />
</div>

### Step 8: Securing the Top and Bottom Covers

Finally, align the top and bottom covers with the holes in the middle frame and secure each with four screws to complete the assembly.

<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  <img src="/img/InstallationGuide/NE101_Guide16.png" alt="NE101_Guide16" style={{ width: '32%' }} />
  <img src="/img/InstallationGuide/NE101_Guide17.png" alt="NE101_Guide17" style={{ width: '32%' }} />
</div>

> **Important Detail**: When installing, make sure that the raised circular parts of the top and bottom covers correspond to the recessed parts of the middle frame. If installed incorrectly, there will be gaps between the top/bottom covers and the middle frame.

<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
  <img src="/img/InstallationGuide/NE101_Guide18.png" alt="NE101_Guide18" style={{ width: '32%' }} />
</div>

At this point, your NE101 Sensing Camera Developer Kit is fully assembled and ready to use. For specific usage methods and deployment, see — [Quick Start](./1-quick-start.md).

If you have any questions or suggestions, feel free to join our Discord community or provide feedback through our [GitHub Issues](https://github.com/camthink-ai/lowpower_camera/issues) to communicate and share with other developers — [Discord](https://discord.com/invite/6TZb2Y8WKx/).
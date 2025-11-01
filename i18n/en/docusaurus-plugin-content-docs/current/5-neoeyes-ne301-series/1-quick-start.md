# Quick Start

## Overview

This guide walks through everything you need to get started with NeoEyes NE301—from unpacking and powering on the device to configuring features, deploying models, and managing daily operation.

## What You Need

- NeoEyes NE301 camera (main board, battery tray, enclosure)
- Four AA batteries, or another DC / solar / wired power source
- Phillips screwdriver plus the mounting brackets and fasteners you plan to use
- Optional add-ons: Cat‑1 module, alternative lenses
- A Wi‑Fi capable phone or PC to access the device Web UI

> The whole-unit SKU ships with the core firmware and a factory model preinstalled. Insert batteries and you can start debugging right away. If you are using the developer-kit SKU, confirm that the expansion boards are firmly connected before assembling the enclosure.

## Using the Device

### Power-On

Remove the rear cover with a screwdriver, install the batteries according to the tray layout, and wait for the blue LED on the front panel to light up—this indicates the system has booted. Once confirmed, reinstall the rear cover. The basic startup is now complete and you can move on to configuration.

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '8px 0 16px' }}>
  <img src="/img/ne301/quick-start/wakeup1.jpg" alt="Power-on example" style={{ flex: '1 1 280px', maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/wakeup2.jpg" alt="Battery installation" style={{ flex: '1 1 280px', maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

### Connect and Sign In

NeoEyes NE301 exposes a built-in Wi‑Fi AP with a Web UI for AI inference preview, model and parameter management, and feature tuning. The SSID is `NE301{last 6 MAC digits}`. Make sure a phone or PC is available to join this AP; once connected, open `http://192.168.10.10` in a browser to configure the device. The detailed steps are listed below.

1. **Confirm the device is on**  
   Tap the capture button on the right side—if the fill light flashes, the device is active. During debugging, a short press triggers image capture and uploads it via the configured MQTT/MQTTS endpoint. Configuration steps are explained later in this guide.

2. **Join the NE301 Wi‑Fi AP**  
   After the system starts, scan for SSIDs that match `NE301{last 6 MAC digits}` and connect; no password is required. When the connection succeeds, open `192.168.10.10` in a browser to access the Web UI.

> Short press the capture button for a snapshot; press and hold for 2 seconds to wake the Wi‑Fi AP (the blue LED lights up). The AP automatically sleeps after 10 minutes of inactivity—press the capture button again or change the sleep timer if needed.

3. **Log in**  
   The default username is fixed by the system, and the default password is `hicamthink`. You can change it later via **Home → System Settings → Device Password**. Enter the credentials to reach the main dashboard.

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '8px 0 16px' }}>
  <img src="/img/ne301/quick-start/login-en.png" alt="Login screen" style={{ flex: '1 1 280px', maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/login-hicamthink.png" alt="Default password reminder" style={{ flex: '1 1 280px', maxWidth: '360px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

After signing in you can adjust configurations and run diagnostics. The following sections describe each module in detail.

## AI Features & Debugging

### Guided Onboarding

The first time you connect through a phone or PC, the interface shows a quick guided tour. Afterwards you land on the **Feature Debugging** page where you can switch models, upload new models, and preview edge inference in real time.

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '8px 0 16px' }}>
  <img src="/img/ne301/quick-start/guidance.png" alt="Guided onboarding" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/AI-off.png" alt="AI disabled" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/AI.png" alt="AI enabled" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

### AI Preview

The AI preview page displays the latest inference results in real time. You can start or stop inference, trigger snapshots, export annotation coordinates, and download single images or zipped batches for dataset labeling.

- **Model selection**: Choose the factory model or upload your own.
- **Threshold tuning**: Adjust confidence, NMS, and other inference parameters on the fly.
- **Push notifications**: Combine with the MQTT settings described later to forward inference results upstream.

### Streaming Preview

The streaming preview page offers a low-latency RTSP/HTTP preview capture. This is useful for monitoring the installation angle, verifying focus, or checking lighting conditions.

### Trigger Management

> Configure how images are captured: via manual triggers, periodic jobs, motion/face detection, pull-based capture, and IO events.

- **Datagram type**: Select whether each upload contains only image data or image + JSON metadata.
- **Manual trigger**: Buttons for capture, refresh, and download.
  - *Capture*: Immediately grabs an image.
  - *Refresh*: Updates the preview list.
  - *Download*: Retrieves the selected picture.
- **Auto capture**: Used for scheduled sampling where periodic upload is required.
  - Interval: Time between captures (seconds). Defaults to “Off”.
  - Sampling duration: How long the schedule runs (minutes). Set to 0 to capture indefinitely.
  - Capture count: The number of images per schedule run (maximum 20, default 10). Set to 0 for bulk capture until you stop it manually.
  - Stop capture: Halts the current schedule; otherwise it stops automatically when the duration elapses.
  - Latest timestamp: Shows when the last capture occurred.
  - Capture records: Lists the most recent images. Click the thumbnail to enlarge, download locally, and examine metadata.
- **Resident detection**: Designed for lightweight presence monitoring. The device takes a reference frame, compares subsequent frames within a time window, and runs YOLO inference when significant differences are detected. Typical use cases include intrusion alerts, space utilization, and visitor counting.
- **Face detection**: Detects faces in the frame, counts them, and runs inference to determine the face region.
- **Pull capture**: Some HTTP endpoints support on-demand capture from external systems. Configure the HTTP push target and enable this feature to trigger uploads via API calls.
- **IO trigger**: Enables capture based on state changes on the expansion IO header. Choose between high-level or low-level triggers depending on the sensor you connect.

## Application Management

> Configure MQTT or MQTTS parameters so NE301 can push data to your backend.

Select the protocol (MQTT / MQTTS), fill in the fields below, then click **Save & Connect**.

- **Host**: MQTT broker hostname or IP.
- **MQTT Port**: Default 1883 (or 8883 when SSL is enabled).
- **Topic**: The topic the device publishes to.
- **Client ID**: Unique identifier for this device.
- **QoS**: Choose QoS 0, 1, or 2.
- **Username** / **Password**: Credentials for the broker.
- **SSL**: Turn on to use MQTTS. Additional certificate fields appear:
  - **CA Certificate**: Upload the broker’s CA certificate.
  - **Client Certificate**: Upload the device client certificate.
  - **Client Key**: Upload the device private key.

### Hardware Management

#### Image Settings

Use the sliders to tune image parameters while watching the preview.

- **Auto**: When enabled, the OS04C10 module automatically adjusts exposure and tone to optimize the image; manual sliders are disabled.
- **Brightness**: Range 0–100.
- **Contrast**: Range 0–100.
- **Horizontal flip / Vertical flip**: Correct the orientation for your mounting position.

<div style={{ textAlign: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/quick-start/image-management-auto.png" alt="Image management" style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

#### Lighting Control

Configure the fill light mode according to the scenario:

- **Custom schedule**: Define a time range (for example 20:00–06:00); the fill light stays on during that range.
- **Auto on during work**: Default setting. The fill light turns on when the device wakes to capture or stream, then turns off while idle.
- **Always off**: Keeps the fill light disabled to save power.

> Tip: The fill light is most effective at short range. Disable it in ultra-low-power deployments.

<div style={{ textAlign: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/quick-start/lighting-management.png" alt="Lighting control" style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

### System Settings: Connectivity, Device, Import/Export

> The menus adapt to the communication modules present. In addition to Wi‑Fi and Cat‑1, you’ll find Bluetooth (BLE), device security, and import/export utilities.

#### Connectivity Management

NeoEyes NE301 supports Wi‑Fi and Cat‑1. Configuration options vary by module.

- **Wi‑Fi**: The standard SKU scans nearby networks. Select your SSID, enter credentials, and save. NE301 remembers the most recent network.

<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', margin: '8px 0 16px' }}>
  <img src="/img/ne301/quick-start/communications.png" alt="Network configuration" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/wifi-pwd.png" alt="Wi-Fi password" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
  <img src="/img/ne301/quick-start/wifi-connected.png" alt="Wi-Fi connected" style={{ flex: '1 1 220px', maxWidth: '300px', width: '100%', height: 'auto', borderRadius: '6px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

- **Cat‑1**: NeoEyes NE301 Cat‑1 units support licensed networks outside North America. Install a SIM card and configure the cellular settings:
  1. Remove the front cover with a screwdriver.
  2. Insert the SIM card into the slot on the front of the board.
  3. Reassemble the cover.
  4. Browse to `192.168.10.10`.
  5. In **Cellular**, fill in APN, username, password, PIN, authentication type, and any required AT commands.
  6. Click **Send** to test. If the connection succeeds, *Cellular Status* shows `connect`. Click **Save** to persist.
  7. **Details** displays signal strength and other network information for diagnostics.

<!-- BLE management section intentionally omitted for now -->

#### Device Password

- **Device AP**
  - **Wi‑Fi Name**: Defaults to `NE301{last 6 MAC digits}` (MAC is printed on the enclosure label).
  - **Wi‑Fi Password**: Default `hicamthink`. Change it after the first login. The AP restarts after modification—reconnect from your phone or PC.
  - **Sleep time**: Idle timeout for the AP. Default 10 minutes. Interaction with the Web UI resets the timer. To conserve power, avoid extremely long durations.

- **Login password**
  - Username: System-defined and cannot be changed.
  - Enter the current password plus the new password twice, and click **Save** to apply.
  - We recommend 8–20 characters with letters, numbers, and symbols. Avoid weak passwords derived from device info.

- **Forgot password / Reset**
  - If the password is lost, run the hardware reset sequence to restore defaults (including the password `hicamthink`).
  - Resetting erases all custom configuration (models, network settings, parameters). Export a backup beforehand.

- **Other tips**
  - Toggle show/hide to avoid typos while entering passwords.
  - Always click **Save** after making changes.

<div style={{ textAlign: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/quick-start/device-pwd.png" alt="Password management" style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

### Import & Export

Firmware, models, and configuration files can all be imported or exported—useful for upgrades, migration, and batch deployment.

- **Firmware (local OTA)**
  - Firmware is packaged into three files: APP, Web, and FSBL. You may update them individually.
  - Upload or drag the files into the target area. The system validates and flashes them automatically, then reboots. Do not interrupt power.
  - Optionally enable “Keep current configuration” to preserve existing settings.
  - If the upgrade fails, the previous firmware remains to ensure the device is still usable.

- **Model import**
  - Upload a model package that contains the weights and parameter definitions.
    - **See also – “How to deploy a model on NeoEyes NE301?”**
  - After deployment, activate it under “Feature Debugging”.
  - Combine with “Hot-load inference parameters” to fine-tune confidence/NMS thresholds per scenario.
  - You can revert to the factory model via a device reset.

- **Configuration import**
  - Upload a `.json` configuration file. The system shows the modules to be overwritten before applying.
  - Some changes take effect immediately; low-level network changes may require a reboot.

- **Configuration export**
  - Exports the current setup as a `.json` file for backup or batch provisioning.
  - Always export before firmware upgrades or factory resets to avoid losing parameters.

- **Precautions**
  - Keep the device powered during import/export—do not close the page or cut power.
  - Configurations may not be compatible across firmware versions. If an import fails, refer to the release notes or upgrade to a compatible build first.

> Always keep the device powered and the browser window open until the import/export process finishes.

## Device Information

This page summarizes the hardware and software status:

- **Device name**: Defaults to `NE301{last 6 MAC digits}`. The name is embedded in JSON payloads (field `devName`).
- **MAC address**, **SN**, **Hardware version**, **Firmware version**
- **Camera module**: Model information for the image sensor.
- **Expansion modules**: Displayed when optional boards are connected.
- **Storage card**: Capacity and model of the TF card.
- **Power**: Battery or external. Batteries show three levels (green/amber/red). When powered externally (solar, USB, PoE), the interface shows “Always powered”.
- **Communication**: Wi‑Fi / Cat‑1 / PoE mode currently in use.

<div style={{ textAlign: 'center', margin: '12px 0' }}>
  <img src="/img/ne301/quick-start/device-information1.png" alt="Device dashboard" style={{ maxWidth: '480px', width: '100%', height: 'auto', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.12)' }} />
</div>

## Factory Reset

Double-press the capture button, then hold it for about 10 seconds to restore factory settings. This erases custom models, network parameters, and other user data—export your configuration beforehand.

> Before upgrades or batch deployments, keep a configuration backup so that you can recover quickly if anything goes wrong.

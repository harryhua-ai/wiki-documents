---
description: The role of NG4500 in third-party VMS/NVR architectures, a comparison of the documented DeepStream and Nx Meta integration paths, and the boundary between documented support and unverified third-party platforms such as Frigate.
keywords: [NG4500, VMS, NVR, DeepStream, Nx Meta, RTSP, Frigate, third-party integration]
tags: [NG4500, VMS, integration, RTSP]
---

# Third-party VMS / NVR integration

NG4500 is an edge AI computing box. This page describes its roles in a third-party VMS/NVR architecture, the integration paths covered by official documentation, and the boundary to observe when connecting NeoEyes camera streams or unverified third-party platforms. If a purchasing decision depends on a compatibility commitment for a specific VMS, read the verification status in section 4 first.

## 1. Roles of NG4500 in a video system

The NG4500 itself has no onboard camera module (cameras can be attached over USB). It enters a video system in three roles:

| Role | What it does | Interfaces used |
| :--- | :--- | :--- |
| AI analysis node | Runs analysis frameworks such as DeepStream, consuming network video streams / USB cameras / local files and outputting structured results | Dual GbE (RTSP pull), USB 3.1 |
| VMS / NVR host | Runs a video management system such as Nx Meta Server to manage cameras, recording and alert rules | Dual GbE, HDMI 4K local display |
| Local display output | HDMI direct to a monitor for on-site debugging or wall display | HDMI output (4K) |

## 2. Documented integration paths

| Path | NG4500 role | Video sources | Documentation |
| :--- | :--- | :--- | :--- |
| NVIDIA DeepStream | Analysis framework host | RTSP / USB / CSI cameras / local files | [DeepStream guide](../2-ng4500-cb01-development-board/2-software-guide/3-software-frameworks-and-tools/3-deepstream.md) |
| Nx Meta VMS | VMS server host | RTSP cameras / CSI cameras | [Nx Meta deployment guide](./5-nx-meta.md) |

Both paths come with complete deployment steps: DeepStream explicitly supports RTSP as an input source, and the Nx Meta guide demonstrates manually adding a camera by RTSP URL in the Client and enabling the AI plugin.

## 3. Connecting NeoEyes camera streams

NeoEyes cameras provide standard RTSP pull streams (NE503: see [Video and imaging](../../6-neoeyes-ne503-series/2-user-guide/1-media-and-image.md); NE302: see [Data transmission](../../8-neoeyes-ne302-series/2-user-guide/1-data-transmission.md)). To feed a camera stream into DeepStream or Nx Meta:

1. Enable the RTSP service in the camera console and copy the stream URL;
2. DeepStream: use the RTSP address as the pipeline input source; Nx Meta: add the camera manually via the RTSP URL;
3. Choose the stream (main/sub) for the purpose (recording / preview / analysis); refer to each camera's stream documentation for the differences.

## 4. Third-party platform verification status

| Platform | Official verification record | Notes |
| :--- | :--- | :--- |
| NVIDIA DeepStream | Yes | Analysis framework on NG4500, RTSP input supported |
| Nx Meta | Yes | VMS on NG4500; deployment guide includes an RTSP camera add demo |
| Frigate / Scrypted / Blue Iris / Synology and other specific third-party NVR/VMS products | None | Not covered by CamThink official documentation; no compatibility certification |

Both usage patterns of platforms like Frigate fall outside verified scope: running on NG4500 itself, or acting as an external VMS consuming NeoEyes camera streams. If the target platform supports "manually add RTSP camera", connect it using the mechanism in section 3 and validate video and stability yourself; when decoding or compatibility issues appear, follow each product's RTSP parameters (port, transport protocol, stream).

For purchases that require an official compatibility commitment before ordering, confirm through the sales channel first; this page does not constitute a compatibility statement for any specific third-party VMS.

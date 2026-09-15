---
description: NG4500 在第三方 VMS/NVR 架构中的角色、DeepStream 与 Nx Meta 官方集成路径对比，以及接入 NeoEyes 相机流与未验证第三方平台（如 Frigate）的边界说明。
keywords: [NG4500, VMS, NVR, DeepStream, Nx Meta, RTSP, Frigate, 第三方集成]
tags: [NG4500, VMS, 集成, RTSP]
---

# 第三方 VMS / NVR 集成

NG4500 是边缘 AI 计算盒。本页说明它在第三方视频管理系统（VMS/NVR）架构中的角色、官方文档已覆盖的集成路径，以及接入 NeoEyes 相机流和未验证第三方平台时的边界。采购或选型依赖特定 VMS 的兼容承诺时，先读第 4 节的验证状态。

## 1. NG4500 在视频系统中的角色

NG4500 本体不带摄像头模组（可通过 USB 外接相机）。它以三种角色进入视频系统：

| 角色 | 做什么 | 依赖接口 |
| :--- | :--- | :--- |
| AI 分析节点 | 运行 DeepStream 等分析框架，消费网络视频流/USB 摄像头/本地文件并输出结构化结果 | 双千兆网口（RTSP 拉流）、USB 3.1 |
| VMS / NVR 宿主 | 运行 Nx Meta Server 等视频管理系统，管理摄像头、录像与告警规则 | 双千兆网口、HDMI 4K 本地显示 |
| 本地显示输出 | HDMI 直连显示器，用于现场调试或大屏展示 | HDMI 输出（4K） |

## 2. 官方文档集成路径

| 路径 | NG4500 角色 | 视频来源 | 官方文档 |
| :--- | :--- | :--- | :--- |
| NVIDIA DeepStream | 分析框架宿主 | RTSP / USB / CSI 摄像头 / 本地文件 | [DeepStream 指南](../2-ng4500-cb01-development-board/2-software-guide/3-software-frameworks-and-tools/3-deepstream.md) |
| Nx Meta VMS | VMS 服务端宿主 | RTSP 摄像头 / CSI 摄像头 | [Nx Meta 部署指南](./5-nx-meta.md) |

两条路径都有完整部署步骤：DeepStream 的输入源明确支持 RTSP；Nx Meta 指南演示了在 Client 中以 RTSP URL 手动添加摄像头并启用 AI 插件。

## 3. 接入 NeoEyes 相机流

NeoEyes 系列相机提供标准 RTSP 拉流（NE503 见[视频与图像](../../6-neoeyes-ne503-series/2-user-guide/1-media-and-image.md)，NE302 见[数据发送](../../8-neoeyes-ne302-series/2-user-guide/1-data-transmission.md)）。将相机流接入 DeepStream 或 Nx Meta 时：

1. 在相机控制台开启 RTSP 服务并复制流地址；
2. DeepStream：将 RTSP 地址作为流水线输入源；Nx Meta：选择手动添加并以 RTSP URL 接入摄像头；
3. 码流按用途选择（录像 / 预览 / 分析），具体差异以各相机的码流说明为准。

## 4. 第三方平台验证状态

| 平台 | 官方验证记录 | 说明 |
| :--- | :--- | :--- |
| NVIDIA DeepStream | 有 | NG4500 端分析框架，输入支持 RTSP |
| Nx Meta | 有 | NG4500 端 VMS，部署指南含 RTSP 摄像头添加演示 |
| Frigate / Scrypted / Blue Iris / Synology 等具体第三方 NVR/VMS | 无 | CamThink 官方文档未收录，未做兼容性认证 |

Frigate 等平台有两种使用形态，均属未验证范围：部署在 NG4500 上运行，或作为外部 VMS 消费 NeoEyes 相机流。若目标平台支持「手动添加 RTSP 摄像头」，可按第 3 节的机制接入并自行验证画面与稳定性；出现解码或兼容问题时，以各产品的 RTSP 参数（端口、传输协议、码流）为准。

需要官方兼容性承诺才能下单的采购决策，请先通过销售渠道确认；本文不构成对具体第三方 VMS 的兼容性结论。

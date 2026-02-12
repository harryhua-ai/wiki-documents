# FAQs

## 概述

本文档为AIBOX系列设备的综合技术文档，包含常见问题解决方案、版本更新记录、维护指南等内容。本Wiki将持续更新，建议定期查看最新版本。

| 版本号  | 发布日期       | 主要更新内容                                       | 状态    |
| ---- | ---------- | -------------------------------------------- | ----- |
| V1.2 | 待发布        | 1. 修复OEM HDMI显示黑屏问题<br />2. Orin DRAM PCNs更新 | ✅ 待发布 |
| V1.1 | 2025-05-14 | 初始版本发布                                       | ✅ 维护中 |

## 常见问题与解决方案

### FAQ1：如何查询系统版本信息

可以执行以下指令，确认设备的版本信息，以及使用的设备型号

```shell
# 查询
cat /etc/nv_tegra_release

# 输出如下：
# R36 (release), REVISION: 4.3, GCID: 38968081, BOARD: generic, EABI: aarch64, DATE: Wed Jan  8 01:49:37 UTC 2025
# KERNEL_VARIANT: oot
TARGET_USERSPACE_LIB_DIR=nvidia
TARGET_USERSPACE_LIB_DIR_PATH=usr/lib/aarch64-linux-gnu/nvidia
# Series_Name = NeoEdge NG4500
# Category_Name = Edge AI Box
# Product_Name = NG4521
# Software_Version = V1.2
# Image_Name = aibox-NG4521-36.4.3-super-jetpack-V1.1
# branch r36.4.3
# commit ID b32073f8936a9150acb6ce2ea11ec2f4be981e86
```

### FAQ2：首次启动AIBOX卡住，无法进入系统

**现象**：设备首次启动时卡在命令行，提示如下，无法进入系统

```bash
A start job is running for end-user configuration... (1min 30s / no limit)
```

**解决方法**

- **方法一：预设账号密码**

在烧录包中执行：

```shell
sudo tools/l4t_create_default_user.sh -u <USERNAME> -p <PASSWORD> -a -n <HOSTNAME>
```

- **方法二：提前插入HDMI**

上电前插入HDMI，提前获取EDID信息，正常进入OEM引导。

### FAQ3：OEM启动时，HDMI显示偶发黑屏

**现象**：第一次进入OEM引导程序时，出现HDMI黑屏的情况

**解决方法**

OEM引导程序对4K分辨率存在兼容性问题，导致黑屏。

- **方法一：切换HDMI分辨率**

修改烧录包中的 `aibox-orin-NG45XX-super.conf` 文件，移除下述指令：

```shell
DCE_OVERLAY_DTB_FILE="tegra234-dcb-p3767-0000-hdmi.dtbo";
```

- **方法二：更新版本至V1.2**

V1.2版本已修复此问题

### FAQ4：windows远程桌面登录AIBOX失败

**现象**：远程桌面连接时出现黑屏或闪退

**解决方法**：

配置startwm.sh文件，使用`sudo vi /etc/xrdp/startwm.sh`指令打开文件，并将里面内容替换为如下内容：

```shell
if test -r /etc/profile; then
        . /etc/profile
fi

unset DBUS_SESSION_BUS_ADDRESS
unset XDG_RUNTIME_DIR

exec /bin/sh /usr/bin/gnome-session
```

替换完成后，通过以下指令重启服务：

```shell
sudo systemctl restart xrdp.service
```

---

如果您遇到本文档未涵盖的任何问题或需要额外的技术支持，请随时联系我们的技术团队。

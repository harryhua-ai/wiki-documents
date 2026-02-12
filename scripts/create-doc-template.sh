#!/bin/bash

# Document Template Generator for CamThink Wiki
# Usage: ./scripts/create-doc-template.sh <doc-name> --title-cn "标题" --title-en "Title" ...

DOC_NAME=""
TITLE_CN=""
TITLE_EN=""
DESC_CN=""
DESC_EN=""
POSITION=""
PARENT_PATH=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --title-cn) TITLE_CN="$2"; shift 2 ;;
    --title-en) TITLE_EN="$2"; shift 2 ;;
    --desc-cn) DESC_CN="$2"; shift 2 ;;
    --desc-en) DESC_EN="$2"; shift 2 ;;
    --position) POSITION="$2"; shift 2 ;;
    --parent) PARENT_PATH="$2"; shift 2 ;;
    *) DOC_NAME="$1"; shift 1 ;;
  esac
done

if [ -z "$DOC_NAME" ] || [ -z "$PARENT_PATH" ]; then
    echo "Usage: $0 <doc-name> --title-cn \"...\" --title-en \"...\" --desc-cn \"...\" --desc-en \"...\" --position N --parent \"path/to/parent\""
    exit 1
fi

CHINESE_PATH="i18n/zh-Hans/docusaurus-plugin-content-docs/current/${PARENT_PATH}"
ENGLISH_PATH="docs/${PARENT_PATH}"

mkdir -p "$CHINESE_PATH"
mkdir -p "$ENGLISH_PATH"

# Create Chinese Template
cat <<EOF > "${CHINESE_PATH}/${DOC_NAME}.md"
---
title: ${TITLE_CN:-"请输入中文标题"}
description: ${DESC_CN:-"请输入中文描述"}
sidebar_position: ${POSITION:-1}
---

# ${TITLE_CN:-"请输入中文标题"}

## 概述
在这里输入文档概述。

## 应用场景
在这里输入应用场景描述。

## 示例图片
![示例图片](/img/${PARENT_PATH}/${DOC_NAME}/image_1.jpg)

> 注：请根据实际图片数量和名称进行调整。
EOF

# Create English Template
cat <<EOF > "${ENGLISH_PATH}/${DOC_NAME}.md"
---
title: ${TITLE_EN:-"Please enter English title"}
description: ${DESC_EN:-"Please enter English description"}
sidebar_position: ${POSITION:-1}
---

# ${TITLE_EN:-"Please enter English title"}

## Overview
Enter document overview here.

## Application Scenarios
Enter application scenario description here.

## Example Images
![Example Image](/img/${PARENT_PATH}/${DOC_NAME}/image_1.jpg)

> Note: Please adjust based on actual image counts and names.
EOF

echo "✅ Created Chinese doc: ${CHINESE_PATH}/${DOC_NAME}.md"
echo "✅ Created English doc: ${ENGLISH_PATH}/${DOC_NAME}.md"
echo "🚀 Now you can add content to these files and run validation!"

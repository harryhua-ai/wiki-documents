#!/bin/bash

# Document Validation Script for CamThink Wiki
# Usage: ./scripts/validate-doc.sh <doc-name> <parent-path>
# Example: ./scripts/validate-doc.sh 6-chain-restaurant-qsc-compliance 5-neoeyes-ne301-series/3-application-guide

DOC_NAME=$1
PARENT_PATH=$2

if [ -z "$DOC_NAME" ] || [ -z "$PARENT_PATH" ]; then
    echo "Usage: $0 <doc-name> <parent-path>"
    exit 1
fi

# Clean up paths (remove trailing slashes)
PARENT_PATH=$(echo "$PARENT_PATH" | sed 's:/*$::')

CHINESE_DOC="i18n/zh-Hans/docusaurus-plugin-content-docs/current/${PARENT_PATH}/${DOC_NAME}.md"
ENGLISH_DOC="docs/${PARENT_PATH}/${DOC_NAME}.md"

ERRORS=0
WARNINGS=0

echo "🔍 Validating document: ${DOC_NAME} in ${PARENT_PATH}"
echo "----------------------------------------------------"

# 1. Existence Check
echo -n "[1/5] Existence: "
if [ ! -f "$CHINESE_DOC" ]; then
    echo "❌ Chinese doc missing ($CHINESE_DOC)"
    ERRORS=$((ERRORS+1))
else
    echo -n "🇨🇳 OK "
fi

if [ ! -f "$ENGLISH_DOC" ]; then
    echo "❌ English doc missing ($ENGLISH_DOC)"
    ERRORS=$((ERRORS+1))
else
    echo "🇺🇸 OK"
fi

# 2. Frontmatter Check
validate_frontmatter() {
    local file=$1
    local lang=$2
    local missing=0

    if [ ! -f "$file" ]; then return; fi

    for field in "title:" "description:" "sidebar_position:"; do
        if ! grep -q "^$field" "$file"; then
            echo "   ❌ [$lang] Missing frontmatter field: $field"
            missing=$((missing+1))
        fi
    done
    return $missing
}

echo -n "[2/5] Frontmatter: "
validate_frontmatter "$CHINESE_DOC" "CN" || ERRORS=$((ERRORS+$?))
validate_frontmatter "$ENGLISH_DOC" "EN" || ERRORS=$((ERRORS+$?))
if [ $ERRORS -eq 0 ]; then echo "✅ OK"; fi

# 3. Image Path Check
validate_images() {
    local file=$1
    local lang=$2
    local broken=0

    if [ ! -f "$file" ]; then return; fi

    # A. Check for non-compliant paths (static/img or ../static)
    if grep -qE '\(static/img|\.\./+static' "$file"; then
        echo "   ❌ [$lang] Non-compliant image paths found! Use root-relative paths like /img/... (no 'static' or '../')"
        broken=$((broken+1))
    fi

    # B. Find all images like ![...](/img/...) and check existence
    # Note: Using a process substitution or temporary file to preserve broken count across while loop
    local temp_broken=0
    while read -r img_path; do
        if [ -z "$img_path" ]; then continue; fi
        # Convert web path to physical path: /img/foo.png -> static/img/foo.png
        physical_path="static${img_path}"
        if [ ! -f "$physical_path" ]; then
            echo "   ❌ [$lang] Broken image link: $img_path (expected at $physical_path)"
            temp_broken=$((temp_broken+1))
        fi
    done < <(grep -o '(/img/[^)]*)' "$file" | sed 's/[()]//g')

    return $((broken + temp_broken))
}

echo -n "[3/5] Images: "
validate_images "$CHINESE_DOC" "CN" || ERRORS=$((ERRORS+$?))
validate_images "$ENGLISH_DOC" "EN" || ERRORS=$((ERRORS+$?))
if [ $ERRORS -eq 0 ]; then echo "✅ OK"; fi

# 4. Naming Convention
echo -n "[4/5] Naming: "
if [[ ! "$DOC_NAME" =~ ^[0-9]+-[a-z0-9-]+$ ]]; then
    echo "⚠️  Warning: Filename '$DOC_NAME' should follow '数字-英文-小写.md' format"
    WARNINGS=$((WARNINGS+1))
else
    echo "✅ OK"
fi

# 5. Category Sync
echo -n "[5/5] Categories: "
CN_CAT="i18n/zh-Hans/docusaurus-plugin-content-docs/current/${PARENT_PATH}/_category_.json"
EN_CAT="docs/${PARENT_PATH}/_category_.json"

if [ ! -f "$CN_CAT" ]; then
    echo "⚠️  Warning: Missing _category_.json in Chinese directory"
    WARNINGS=$((WARNINGS+1))
elif [ ! -f "$EN_CAT" ]; then
    echo "⚠️  Warning: Missing mirrored _category_.json in English directory"
    WARNINGS=$((WARNINGS+1))
else
    echo "✅ OK"
fi

echo "----------------------------------------------------"
if [ $ERRORS -gt 0 ]; then
    echo "❌ Validation FAILED: $ERRORS errors, $WARNINGS warnings"
    exit 1
else
    echo "✅ Validation PASSED: $WARNINGS warnings"
    exit 0
fi

#!/bin/bash

# Husky安装脚本
# 用于初始化Git hooks

set -e

echo "🔧 初始化Husky..."

# 检查是否在Git仓库中
if [ ! -d ".git" ]; then
  echo "❌ 错误：当前目录不是Git仓库根目录"
  exit 1
fi

# 安装Husky
echo "📦 安装Husky..."
npm pkg set scripts.prepare="husky"
npx husky init

# 创建pre-commit hook
echo "🪝 创建pre-commit hook..."
echo "npx lint-staged" > .husky/pre-commit

# 创建commit-msg hook（可选，用于commit message验证）
echo "📝 创建commit-msg hook..."
cat > .husky/commit-msg << 'EOF'
npx commitlint --edit $1
EOF

echo "✅ Husky初始化完成！"
echo ""
echo "📌 Git hooks已配置："
echo "  - pre-commit: 运行lint和格式化"
echo "  - commit-msg: 验证commit message格式"
echo ""
echo "💡 提示：Git hooks会在下次commit时生效"

#!/bin/bash

# CI/CD 快速开始脚本
# 用于初始化项目并设置开发环境

set -e

echo "🚀 CamThink Wiki CI/CD 初始化"
echo "================================"
echo ""

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ 错误：需要Node.js 18或更高版本"
  echo "当前版本：$(node -v)"
  exit 1
fi
echo "✅ Node.js版本检查通过：$(node -v)"
echo ""

# 安装根目录依赖
echo "📦 安装根目录依赖..."
yarn install
echo "✅ 根目录依赖安装完成"
echo ""

# 安装API依赖
echo "📦 安装API依赖..."
cd api && yarn install && cd ..
echo "✅ API依赖安装完成"
echo ""

# 初始化Husky
echo "🪝 初始化Husky Git Hooks..."
yarn setup:hooks
echo "✅ Git Hooks配置完成"
echo ""

# 验证配置
echo "🔍 验证配置..."
echo "前端ESLint配置："
if [ -f "eslint.config.js" ]; then
  echo "  ✅ eslint.config.js"
fi
echo "后端ESLint配置："
if [ -f "api/eslint.config.js" ]; then
  echo "  ✅ api/eslint.config.js"
fi
echo "Prettier配置："
if [ -f ".prettierrc" ]; then
  echo "  ✅ .prettierrc"
fi
echo "lint-staged配置："
if [ -f ".lintstagedrc.json" ]; then
  echo "  ✅ .lintstagedrc.json"
fi
echo "Git Hooks："
if [ -f ".husky/pre-commit" ]; then
  echo "  ✅ .husky/pre-commit"
fi
echo ""

# 运行测试验证
echo "🧪 运行测试验证..."
echo "运行前端测试..."
yarn test:frontend || echo "⚠️  前端测试失败（可能需要先实现测试）"
echo ""
echo "运行后端测试..."
cd api && yarn test || echo "⚠️  后端测试失败（可能需要先实现测试）"
cd ..
echo ""

echo "🎉 CI/CD初始化完成！"
echo ""
echo "📚 下一步："
echo "  1. 配置环境变量：cp api/.env.example api/.env"
echo "  2. 运行测试：yarn test"
echo "  3. 运行lint检查：yarn lint"
echo "  4. 开始开发：yarn start"
echo ""
echo "📖 详细文档：docs/ci-cd.md"

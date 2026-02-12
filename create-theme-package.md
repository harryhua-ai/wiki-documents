# 创建 Docusaurus 主题包

## 项目信息
- 名称: ask-ai-theme
- 版本: 1.0.0
- 描述: CamThink Wiki Ask AI 主题包
- 作者: CamThink AI Team

## 步骤 1: 初始化主题包

\`\`\`yarn init --name ask-ai-theme\`\`

## 步骤 2: 创建主题结构

\`\`\`cd ask-ai-theme && mkdir -p src/theme`\`

创建以下文件：

\`\`\`cd ask-ai-theme/src/theme && cat > Root.tsx << 'EOF'
import React from 'react';
import ChatWidget from '../components/AskAI/ChatWindow';

// Docusaurus 主题包装器
export default function Root({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      {children}
      <ChatWindow onClose={() => {}} alwaysOpen={true} />
    </>
  );
}
\`\`\`

\`\`\`cd ask-ai-theme/src/theme && cat > clientModules.ts << 'EOF'
// Docusaurus 客户端主题
export default {
  name: 'ask-ai-theme',
  getClientModules: () => {
    if (typeof window !== 'undefined') {
      return window; // 浏览器环境
    }
    return {}; // Node.js 环境不使用
  },
};

\`\`\`

\`\`\`cd ask-ai-theme && cat > package.json << 'EOF'
{
  "name": "ask-ai-theme",
  "version": "1.0.0",
  "main": "index.js",
  "docusaurus": {
    "id": "ask-ai-theme",
    "plugins": [],
    "themes": []
  }
}
\`\`\`

## 步骤 3: 复制必要文件

\`\`\`cp -r src/components/AskAI/ ask-ai-theme/src/theme/ && \
  cp -r src/css/custom.css ask-ai-theme/src/css/ && \
  cp -r src/theme/Root.tsx ask-ai-theme/src/theme/ && \
  echo "✅ 文件已复制"
\`\`\`

\`\`echo "### 安装说明

\`\`\`echo "1. 将 ask-ai-theme 文件夹复制到项目根目录："
echo '   cp -r ask-ai-theme ./'
echo ""
echo "2. 修改 docusaurus.config.js："
echo '   cat >> docusaurus.config.js << 'EOF'
    // 在 scripts 配置中添加自定义主题
    scripts: {
      build: {
        tableName: 'customScripts',
        afterBuild: [
          'inject-ask-ai-widget.js'
        ]
    },
    themes: [
      require.resolve('./ask-ai-theme')
    ]
    }
\`\`\`

\`\`\`echo "3. 安装主题包："
echo "   yarn add ./ask-ai-theme"
echo ""
\`\`\`

## 步骤 4: 安装主题依赖

\`\`\`cd ask-ai-theme && yarn install"
\`\`\`

\`\`echo "### 主题包内容说明

创建的文件结构：
ask-ai-theme/
├── package.json
├── src/
│   └── theme/
│       ├── Root.tsx         # Docusaurus 主题包装器
│       └── clientModules.ts  # 客户端模块检测
├── docusaurus.config.js  # Docusaurus 配置脚本
└── inject-ask-ai-widget.js  # 组件注入脚本

#!/usr/bin/env node
/**
 * 文档服务启动脚本
 *
 * 功能：
 * 1. 检查文档是否需要重新索引
 * 2. 可选：强制重新索引
 * 3. 启动 Docusaurus 服务
 *
 * 用法：
 *   node scripts/serve.js              # 智能索引 + 启动服务
 *   node scripts/serve.js --force      # 强制索引 + 启动服务
 *   node scripts/serve.js --no-index   # 跳过索引，直接启动服务
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 获取项目根目录
const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'api');

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, options = {}) {
  const defaultOptions = {
    cwd: rootDir,
    stdio: 'inherit',
  };
  const mergedOptions = { ...defaultOptions, ...options };

  try {
    const output = execSync(command, mergedOptions);
    return output;
  } catch (error) {
    throw error;
  }
}

function checkDocsChanged() {
  const buildDir = path.join(rootDir, 'build');
  const docsDir = path.join(rootDir, 'docs');

  if (!fs.existsSync(buildDir)) {
    return true; // 没有构建目录，需要索引
  }

  // 检查文档是否有更新（简单版本：检查最近修改时间）
  const checkScript = path.join(rootDir, 'scripts/check-docs-changed.js');
  if (fs.existsSync(checkScript)) {
    try {
      runCommand(`node ${checkScript}`, { stdio: 'pipe' });
      return true; // 脚本判断需要索引
    } catch (error) {
      return false; // 脚本判断不需要索引
    }
  }

  return false;
}

async function main() {
  const args = process.argv.slice(2);
  const forceIndex = args.includes('--force');
  const noIndex = args.includes('--no-index');

  console.log('');
  log('🚀 文档服务启动脚本', 'bright');
  console.log('');

  // 解析参数
  if (forceIndex && noIndex) {
    log('❌ 错误: --force 和 --no-index 不能同时使用', 'yellow');
    process.exit(1);
  }

  // 决定是否需要索引
  let shouldIndex = false;

  if (noIndex) {
    log('⏭️  跳过文档索引 (--no-index)', 'blue');
    shouldIndex = false;
  } else if (forceIndex) {
    log('🔄 强制重新索引文档 (--force)', 'yellow');
    shouldIndex = true;
  } else {
    log('🔍 检查文档是否需要更新...', 'blue');
    shouldIndex = checkDocsChanged();

    if (shouldIndex) {
      log('✅ 检测到文档变更，执行索引', 'green');
    } else {
      log('✅ 文档无变更，跳过索引', 'green');
    }
  }

  // 执行索引（如果需要）
  if (shouldIndex) {
    console.log('');
    log('📚 开始索引文档...', 'bright');
    console.log('');

    try {
      runCommand('npm run ingest:force', {
        cwd: apiDir,
      });
      log('✅ 文档索引完成', 'green');
    } catch (error) {
      log('❌ 文档索引失败，但继续启动服务', 'yellow');
      log(`   错误: ${error.message}`, 'yellow');
    }
  }

  // 启动 Docusaurus 服务
  console.log('');
  log('🌐 启动 Docusaurus 服务...', 'bright');
  console.log('');

  try {
    runCommand('npx docusaurus serve');
  } catch (error) {
    log('❌ 启动服务失败', 'yellow');
    log(`   错误: ${error.message}`, 'yellow');
    process.exit(1);
  }
}

main();

#!/usr/bin/env node

/**
 * 检测文档是否有变化
 * 返回 0: 有变化，继续执行索引
 * 返回 1: 无变化，跳过索引
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DOCS_DIRS = ['docs/', 'i18n/'];
const TIMESTAMP_FILE = '.last-ingest-time';

function checkDocsChanged() {
  // 检查是否在 Git 仓库中
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch {
    console.log('⚠️  不在 Git 仓库中，跳过索引检测');
    return false;
  }

  // 获取上次索引时间
  const lastIngestTime = fs.existsSync(TIMESTAMP_FILE)
    ? parseFloat(fs.readFileSync(TIMESTAMP_FILE, 'utf-8'))
    : 0;

  // 检查文档目录是否有修改
  let hasChanges = false;

  for (const dir of DOCS_DIRS) {
    if (!fs.existsSync(dir)) continue;

    try {
      // 检查未提交的修改
      const modified = execSync(`git ls-files -m ${dir}`, { encoding: 'utf-8' }).trim();
      if (modified) {
        console.log(`📝 检测到 ${dir} 有未提交的修改`);
        hasChanges = true;
        break;
      }

      // 检查最近提交的时间
      const latestCommit = execSync(
        `git log -1 --format=%ct -- ${dir}`,
        { encoding: 'utf-8' }
      ).trim();

      if (latestCommit && parseInt(latestCommit) > lastIngestTime) {
        console.log(`📝 检测到 ${dir} 有新的提交`);
        hasChanges = true;
        break;
      }
    } catch (error) {
      // 目录可能还没有 Git 历史，跳过
      continue;
    }
  }

  return hasChanges;
}

// 主逻辑
const hasChanges = checkDocsChanged();

if (hasChanges) {
  console.log('✓ 文档有变化，需要更新索引');
  fs.writeFileSync(TIMESTAMP_FILE, Date.now().toString());
  process.exit(0); // 继续执行索引
} else {
  console.log('✓ 文档无变化，跳过索引');
  process.exit(1); // 跳过索引（|| 运算符会执行后续命令）
}

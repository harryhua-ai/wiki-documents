const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOCS_BASE_PATH = '/Users/harryhua/Documents/GitHub/wiki-documents/docs';

function getOriginalTitle(filePath) {
    try {
        // 从 HEAD 提取原始文件内容
        const relativePath = path.relative(process.cwd(), filePath);
        const originalContent = execSync(`git show HEAD:"${relativePath}"`, { encoding: 'utf8' });
        const match = originalContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);

        if (match) {
            const fmContent = match[1];
            const titleMatch = fmContent.match(/^title:\s*(.*)$/m);
            return titleMatch ? titleMatch[1].trim() : null;
        }
    } catch (e) {
        console.error(`Error reading git for ${filePath}: ${e.message}`);
    }
    return null;
}

function restoreFile(filePath) {
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    const originalTitle = getOriginalTitle(filePath);

    // 如果原始就没有 title，我们应该从当前 Frontmatter 中移除它
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(frontmatterRegex);

    if (match) {
        let fmLines = match[1].split('\n');
        let newFmLines = [];
        let titleFound = false;

        fmLines.forEach(line => {
            if (line.trim().startsWith('title:')) {
                if (originalTitle) {
                    newFmLines.push(`title: ${originalTitle}`);
                }
                titleFound = true;
            } else {
                newFmLines.push(line);
            }
        });

        // 如果原始有标题但当前没在循环里处理（例如误删了），补充进去
        if (!titleFound && originalTitle) {
            newFmLines.unshift(`title: ${originalTitle}`);
        }

        const newFm = `---\n${newFmLines.join('\n')}\n---`;
        const newContent = content.replace(frontmatterRegex, newFm);
        fs.writeFileSync(filePath, newContent);
        console.log(`[Restored] Title for ${path.relative(DOCS_BASE_PATH, filePath)} -> "${originalTitle || 'Removed'}"`);
    }
}

// 找到所有被 Git 标记为修改过的 .md 文件
const modifiedFiles = execSync('git status --porcelain', { encoding: 'utf8' })
    .split('\n')
    .filter(line => line.endsWith('.md'))
    .map(line => path.join(process.cwd(), line.substring(3).trim()));

console.log(`Found ${modifiedFiles.length} modified markdown files to restore titles.`);
modifiedFiles.forEach(restoreFile);
console.log('Title restoration complete.');

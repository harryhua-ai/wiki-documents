const fs = require('fs');
const path = require('path');

const DOCS_BASE_PATH = '/Users/harryhua/Documents/GitHub/wiki-documents/docs';
const RECORD_FILE = '/Users/harryhua/Documents/GitHub/wiki-documents/scripts/tmp/tag-record.md';

function parseRecord() {
    const content = fs.readFileSync(RECORD_FILE, 'utf8');
    const sections = content.split(/###\s+\[(.*?)\]/);
    const results = [];

    for (let i = 1; i < sections.length; i += 2) {
        const filePath = sections[i].trim();
        const dataStr = sections[i + 1];

        const descMatch = dataStr.match(/\*\*Description\*\*:\s*(.*)/);
        const keywordsMatch = dataStr.match(/\*\*Keywords\*\*:\s*(.*)/);
        const tagsMatch = dataStr.match(/\*\*Tags\*\*:\s*([\s\S]*?)(?=\n\n|\n---|$)/);

        if (descMatch && keywordsMatch && tagsMatch) {
            const tags = tagsMatch[1]
                .split('\n')
                .map(line => line.replace(/^\s*-\s*/, '').trim())
                .filter(line => line.length > 0);

            results.push({
                filePath: path.join(DOCS_BASE_PATH, filePath),
                description: descMatch[1].trim(),
                keywords: keywordsMatch[1].split(',').map(k => k.trim()),
                tags: tags
            });
        }
    }
    return results;
}

function updateFrontmatter(fileData) {
    if (!fs.existsSync(fileData.filePath)) {
        console.warn(`[Warning] File not found: ${fileData.filePath}`);
        return;
    }

    let content = fs.readFileSync(fileData.filePath, 'utf8');
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(frontmatterRegex);

    let existingFrontmatter = {};
    let body = content;

    if (match) {
        const fmContent = match[1];
        body = content.replace(frontmatterRegex, '').trim();

        // Improved parser to preserve all existing fields
        fmContent.split('\n').forEach(line => {
            const separatorIndex = line.indexOf(':');
            if (separatorIndex !== -1) {
                const key = line.substring(0, separatorIndex).trim();
                const value = line.substring(separatorIndex + 1).trim();
                if (key) {
                    // Store all existing fields. We will overwrite description, keywords, and tags.
                    // title is explicitly preserved.
                    existingFrontmatter[key] = value;
                }
            }
        });
    }

    // Build new Frontmatter
    let newFm = '---\n';

    // Prioritize existing fields (including title), then add/overwrite SEO fields
    for (const [key, value] of Object.entries(existingFrontmatter)) {
        if (!['description', 'keywords', 'tags'].includes(key)) {
            newFm += `${key}: ${value}\n`;
        }
    }

    newFm += `description: ${fileData.description}\n`;
    newFm += `keywords: [${fileData.keywords.join(', ')}]\n`;
    newFm += `tags: [${fileData.tags.join(', ')}]\n`;
    newFm += '---\n\n';

    fs.writeFileSync(fileData.filePath, newFm + body);
    console.log(`[Success] Updated: ${path.relative(DOCS_BASE_PATH, fileData.filePath)}`);
}

const allData = parseRecord();
console.log(`Found ${allData.length} records to process.`);
allData.forEach(updateFrontmatter);
console.log('All updates completed.');

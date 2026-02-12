/**
 * Document Ingestion Pipeline
 *
 * Parses Markdown files from docs/ and i18n/en/docusaurus-plugin-content-docs/current/,
 * extracts frontmatter, chunks content by headings, generates embeddings,
 * and stores in vector database.
 *
 * Usage:
 *   ts-node scripts/ingest.ts
 *   or
 *   node --loader ts-node/esm scripts/ingest.ts --language en
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import * as yaml from 'js-yaml';
import crypto from 'crypto';
import { load } from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root paths
const ROOT_DIR = path.resolve(__dirname, '../..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const I18N_DOCS_DIR = path.join(ROOT_DIR, 'i18n/zh-Hans/docusaurus-plugin-content-docs/current');

// Chunking configuration
const CONFIG_PATH = path.join(__dirname, '../config/chunking.yaml');

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ChunkingConfig {
  max_tokens: number;
  overlap_tokens: number;
  preserve_blocks: string[];
  heading_levels: number[];
}

interface Frontmatter {
  title?: string;
  description?: string;
  keywords?: string[];
  tags?: string[];
  slug?: string;
  [key: string]: any;
}

interface DocumentChunk {
  docId: string;
  url: string;
  title: string;
  section: string | null;
  content: string;
  product: string;
  language: 'en' | 'zh-Hans';
  tags: string[];
  chunkIndex: number;
}

interface IngestStats {
  filesProcessed: number;
  filesSkipped: number;
  chunksCreated: number;
  errors: Array<{ file: string; error: string }>;
}

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

async function loadConfig(): Promise<ChunkingConfig> {
  const defaultConfig: ChunkingConfig = {
    max_tokens: 500,
    overlap_tokens: 50,
    preserve_blocks: ['code', 'table'],
    heading_levels: [2, 3],
  };

  try {
    const configContent = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config = yaml.load(configContent) as Partial<ChunkingConfig>;
    return { ...defaultConfig, ...config };
  } catch (error) {
    console.warn('Using default chunking config:', error);
    return defaultConfig;
  }
}

// -----------------------------------------------------------------------------
// Markdown Parsing
// -----------------------------------------------------------------------------

/**
 * Extract frontmatter from markdown content
 */
function extractFrontmatter(content: string): { frontmatter: Frontmatter; content: string } {
  const { data, content: markdownContent } = matter(content);
  return { frontmatter: data as Frontmatter, content: markdownContent };
}

/**
 * Calculate approximate token count (roughly 4 chars per token for English)
 */
function estimateTokens(text: string): number {
  // More accurate estimation: roughly 0.25 words per token, or 4 chars per token
  // For Chinese, use character count directly (1 char ~= 1 token)
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const nonChineseText = text.replace(/[\u4e00-\u9fa5]/g, '');
  const nonChineseTokens = Math.ceil(nonChineseText.length / 4);
  return chineseChars + nonChineseTokens;
}

/**
 * Check if a line is a heading
 */
function isHeadingLine(line: string): { level: number; text: string } | null {
  // Match any markdown heading: # H1, ## H2, ### H3, #### H4, ##### H5, ###### H6
  const match = line.match(/^(#+)\s+(.+)$/);
  if (match) {
    return { level: match[1].length, text: match[2].trim() };
  }
  return null;
}

/**
 * Check if content block should be preserved (not split)
 */
function isPreservedBlock(lines: string[], start: number, preserveTypes: string[]): boolean {
  if (start >= lines.length) return false;

  const line = lines[start].trim();

  for (const type of preserveTypes) {
    switch (type) {
      case 'code':
        if (line.startsWith('```')) return true;
        break;
      case 'table':
        // Simple table detection: contains pipe characters
        if (line.includes('|') && line.trim().length > 0) return true;
        break;
    }
  }

  return false;
}

/**
 * Find end of preserved block
 */
function findBlockEnd(lines: string[], start: number, preserveTypes: string[]): number {
  const line = lines[start].trim();

  if (line.startsWith('```')) {
    // Code block
    for (let i = start + 1; i < lines.length; i++) {
      if (lines[i].trim().startsWith('```')) {
        return i + 1;
      }
    }
    return lines.length;
  }

  if (line.includes('|') && preserveTypes.includes('table')) {
    // Table block - continue until non-table line
    // FIX: Start from current line, not start + 1, to properly detect empty lines
    for (let i = start; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.length === 0 || !trimmed.includes('|')) {
        return i;
      }
    }
    return lines.length;
  }

  return start + 1;
}

/**
 * Chunk markdown content by headings with token limits
 */
function chunkMarkdown(
  content: string,
  config: ChunkingConfig,
  filePath: string
): Array<{ section: string | null; content: string }> {
  const lines = content.split('\n');
  const chunks: Array<{ section: string | null; content: string }> = [];

  let currentSection: string | null = null;
  let currentChunk: string[] = [];
  let currentTokens = 0;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }

    // Check for heading (outside code blocks)
    const heading = inCodeBlock ? null : isHeadingLine(line);

    if (heading && config.heading_levels.includes(heading.level)) {
      // New section boundary
      if (currentChunk.length > 0) {
        chunks.push({
          section: currentSection,
          content: currentChunk.join('\n').trim(),
        });
      }

      currentSection = heading.text;
      currentChunk = [line];
      currentTokens = estimateTokens(line);
    } else {
      // Check if this is a preserved block
      const blockEnd = isPreservedBlock(lines, i, config.preserve_blocks)
        ? findBlockEnd(lines, i, config.preserve_blocks)
        : -1;

      if (blockEnd > i) {
        // Add preserved block as a single unit
        const blockContent = lines.slice(i, blockEnd).join('\n');
        const blockTokens = estimateTokens(blockContent);

        // Check if adding this block would exceed limit
        if (currentChunk.length > 0 && currentTokens + blockTokens > config.max_tokens) {
          // Save current chunk and start new one
          chunks.push({
            section: currentSection,
            content: currentChunk.join('\n').trim(),
          });

          // Add overlap from previous chunk
          const overlapLines = currentChunk.slice(-Math.floor(config.overlap_tokens / 10));
          currentChunk = [...overlapLines, ...lines.slice(i, blockEnd)];
          currentTokens = estimateTokens(currentChunk.join('\n'));
        } else {
          currentChunk.push(...lines.slice(i, blockEnd));
          currentTokens += blockTokens;
        }

        i = blockEnd - 1; // Skip to end of block
      } else {
        // Regular line - check token limit
        const lineTokens = estimateTokens(line);

        if (currentChunk.length > 0 && currentTokens + lineTokens > config.max_tokens) {
          // Save current chunk and start new one with overlap
          chunks.push({
            section: currentSection,
            content: currentChunk.join('\n').trim(),
          });

          const overlapLines = currentChunk.slice(-Math.floor(config.overlap_tokens / 10));
          currentChunk = [...overlapLines, line];
          currentTokens = estimateTokens(currentChunk.join('\n'));
        } else {
          currentChunk.push(line);
          currentTokens += lineTokens;
        }
      }
    }
  }

  // Add final chunk
  if (currentChunk.length > 0) {
    chunks.push({
      section: currentSection,
      content: currentChunk.join('\n').trim(),
    });
  }

  return chunks;
}

/**
 * Generate document ID (hash of file path)
 */
function generateDocId(filePath: string): string {
  return crypto.createHash('sha256').update(filePath).digest('hex').substring(0, 16);
}

/**
 * Convert file path to URL path
 */
function filePathToUrl(filePath: string, rootDir: string, sectionTitle?: string): string {
  const relativePath = path.relative(rootDir, filePath);
  const withoutExt = relativePath.replace(/\.md$/, '');

  // Convert to docs URL format
  if (withoutExt.endsWith('/index')) {
    return `/docs/${withoutExt.replace('/index', '')}`;
  }

  // Handle numbered directories (e.g., "1-neoedge" -> "neoedge")
  const formattedPath = withoutExt.replace(/^\d+-/, '').replace(/\/\d+-/, '/');

  let url = `/docs/${formattedPath}`;

  // Add section anchor if section title is provided
  if (sectionTitle && sectionTitle.trim()) {
    // Generate a slug from the section title for the anchor
    const anchor = generateSectionAnchor(sectionTitle);
    url += `#${anchor}`;
  }

  return url;
}

/**
 * Generate a URL-safe anchor from section title
 */
function generateSectionAnchor(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Remove special characters except Chinese, alphanumeric, hyphens
    .replace(/[^\u4e00-\u9fa5a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * Extract product from file path
 */
function extractProduct(filePath: string): string {
  const lowerPath = filePath.toLowerCase();

  if (lowerPath.includes('ng4500') || lowerPath.includes('neoedge')) {
    return 'neoedge';
  }
  if (lowerPath.includes('ne101')) {
    return 'ne101';
  }
  if (lowerPath.includes('ne301')) {
    return 'ne301';
  }
  if (lowerPath.includes('hardware') || lowerPath.includes('dev-resources')) {
    return 'hardware';
  }
  if (lowerPath.includes('ai') || lowerPath.includes('application')) {
    return 'ai-application';
  }

  return 'general';
}

/**
 * Detect language from file path
 */
function detectLanguage(filePath: string): 'en' | 'zh-Hans' {
  if (filePath.includes('/i18n/zh-Hans/')) {
    return 'zh-Hans';
  }
  return 'en'; // Default is English based on docs/ content
}

/**
 * Process a single markdown file
 */
async function processFile(
  filePath: string,
  rootDir: string,
  language: 'en' | 'zh-Hans',
  config: ChunkingConfig
): Promise<DocumentChunk[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const { frontmatter, content: markdownContent } = extractFrontmatter(content);

  const chunks = chunkMarkdown(markdownContent, config, filePath);
  const docId = generateDocId(filePath);
  const baseUrl = filePathToUrl(filePath, rootDir);
  const product = extractProduct(filePath);
  const title = frontmatter.title || path.basename(filePath, '.md');
  const tags = frontmatter.tags || frontmatter.keywords || [];

  return chunks.map((chunk) => {
    // Generate URL with section anchor if chunk has a section
    let url = baseUrl;
    if (chunk.section && chunk.section.trim()) {
      const anchor = generateSectionAnchor(chunk.section);
      url += `#${anchor}`;
      // Debug logging
      console.log(`Section: "${chunk.section}" -> Anchor: "${anchor}" -> URL: "${url}"`);
    }

    return {
      docId,
      url,
      title,
      section: chunk.section,
      content: chunk.content,
      product,
      language,
      tags,
      chunkIndex: 0, // Will be updated below
    };
  }).map((chunk, index) => ({ ...chunk, chunkIndex: index }));
}

/**
 * Recursively find all markdown files
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const subFiles = await findMarkdownFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

// -----------------------------------------------------------------------------
// Main Ingestion Pipeline
// -----------------------------------------------------------------------------

async function ingestDocuments(options: {
  language?: 'en' | 'zh-Hans' | 'all';
  dryRun?: boolean;
}): Promise<IngestStats> {
  const config = await loadConfig();
  const stats: IngestStats = {
    filesProcessed: 0,
    filesSkipped: 0,
    chunksCreated: 0,
    errors: [],
  };

  const language = options.language || 'all';
  const dryRun = options.dryRun || false;

  console.log('Starting document ingestion...');
  console.log(`Config: max_tokens=${config.max_tokens}, overlap=${config.overlap_tokens}`);

  // Find markdown files
  const docFiles = await findMarkdownFiles(DOCS_DIR);
  const i18nFiles = await findMarkdownFiles(I18N_DOCS_DIR);

  console.log(`Found ${docFiles.length} files in docs/`);
  console.log(`Found ${i18nFiles.length} files in i18n/en/docusaurus-plugin-content-docs/current/`);

  const allFiles = [
    ...docFiles.map((f) => ({ path: f, lang: 'en' as const, root: ROOT_DIR })),
    ...i18nFiles.map((f) => ({ path: f, lang: 'zh-Hans' as const, root: ROOT_DIR })),
  ];

  // Filter by language if specified
  const filteredFiles = language === 'all'
    ? allFiles
    : allFiles.filter((f) => f.lang === language);

  console.log(`Processing ${filteredFiles.length} files (${language})...`);

  // Process files
  for (const { path: filePath, lang, root } of filteredFiles) {
    try {
      const chunks = await processFile(filePath, root, lang, config);

      if (dryRun) {
        console.log(`[DRY RUN] ${filePath}: ${chunks.length} chunks`);
      } else {
        // TODO: Store chunks in vector database
        console.log(`[${lang}] ${path.relative(ROOT_DIR, filePath)}: ${chunks.length} chunks`);
      }

      stats.filesProcessed++;
      stats.chunksCreated += chunks.length;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      stats.errors.push({ file: filePath, error: errorMessage });
      console.error(`Error processing ${filePath}:`, errorMessage);
    }
  }

  // Print summary
  console.log('\n=== Ingestion Summary ===');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files skipped: ${stats.filesSkipped}`);
  console.log(`Chunks created: ${stats.chunksCreated}`);
  console.log(`Errors: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.forEach((e) => console.log(`  - ${e.file}: ${e.error}`));
  }

  return stats;
}

// -----------------------------------------------------------------------------
// CLI Entry Point
// -----------------------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const language = (args.find((a) => a.startsWith('--language='))?.split('=')[1] || 'all') as 'en' | 'zh-Hans' | 'all';
  const dryRun = args.includes('--dry-run');

  ingestDocuments({ language, dryRun })
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Ingestion failed:', error);
      process.exit(1);
    });
}

export { ingestDocuments, processFile, chunkMarkdown, extractFrontmatter };
export type { DocumentChunk, ChunkingConfig, Frontmatter, IngestStats };

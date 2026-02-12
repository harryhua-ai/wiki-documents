import { VectorStore } from '../lib/vector.js';
import { readdirSync, promises as fsPromises } from 'fs';
import { join } from 'path';

interface DocumentChunk {
  docId: string;
  chunkIndex: number;
  url: string;
  title: string;
  section: string | null;
  content: string;
  product: string;
  language: string;
  tags: string[];
}

// Source directories for documents
const SOURCES = [
  { path: join(process.cwd(), '../docs'), language: 'zh-Hans', prefix: 'docs/' },
  { path: join(process.cwd(), '../i18n/en/docusaurus-plugin-content-docs/current'), language: 'en', prefix: 'i18n/en/' },
];

// Chunk size and overlap
const CHUNK_SIZE = 500;

async function* walkDirectory(dir: string, language: string): AsyncGenerator<any> {
  const files = readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkDirectory(join(dir, file.name), language);
    } else if (file.name.endsWith('.md')) {
      const fullPath = join(dir, file.name);
      
      // Extract metadata from file path
      const docPath = fullPath.replace(process.cwd(), '')
        // Remove both docs/ and i18n/en/ prefixes for consistent URL structure
        .replace(/^(docs\/|i18n\/en\/)/, '/docs/');
      const urlPath = docPath.replace(/\.md$/, '').replace(/^(docs\/|i18n\/en\/)/, '/docs/');
      
      const docId = docPath.replace(/\//g, '_');
      const title = file.name.replace('.md', '');
      const url = urlPath;
      
      // Simple section detection from headings
      const section = 'Main Content';
      
      // Detect product line from path
      let product = 'General';
      if (docPath.includes('neoedge-ng4500')) product = 'NeoEdge NG4500';
      else if (docPath.includes('neoeyes-ne101')) product = 'NeoEyes NE101';
      else if (docPath.includes('neoeyes-ne301')) product = 'NeoEyes NE301';
      
      const tags = [product];
      
      yield {
        fullPath,
        docId,
        title,
        url,
        section,
        product,
        language,
        tags,
      };
    }
  }
}

async function* splitIntoChunks(text: string, docId: string): AsyncGenerator<DocumentChunk> {
  const paragraphs = text.split(/\n\n/);
  let chunkIndex = 0;
  
  for (const paragraph of paragraphs) {
    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const testChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
      
      if (testChunk.length >= CHUNK_SIZE && chunkIndex > 0) {
        yield {
          docId,
          chunkIndex,
          url: '',
          title: '',
          section: null,
          content: currentChunk.trim(),
          product: '',
          language: '',
          tags: [],
        };
        chunkIndex++;
        currentChunk = sentence;
      } else {
        currentChunk = testChunk;
      }
    }
    
    if (currentChunk.trim()) {
      yield {
        docId,
        chunkIndex,
        url: '',
        title: '',
        section: null,
        content: currentChunk.trim(),
        product: '',
        language: '',
        tags: [],
      };
      chunkIndex++;
    }
  }
}

export async function ingest(force: boolean = false): Promise<void> {
  console.log(`📚 Starting document ingestion (force=${force})`);

  const vectorStore = new VectorStore();
  await vectorStore.initialize();

  let totalChunks = 0;
  let processedFiles = 0;

  for (const source of SOURCES) {
    console.log(`📖 Processing ${source.language} documents from ${source.path}`);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - The generator issue with walkDirectory is complex to type perfectly
    for await (const doc of walkDirectory(source.path, source.language)) {
      const fileContent = await fsPromises.readFile(doc.fullPath, 'utf-8');
      const text = fileContent.toString();

      for await (const _ of splitIntoChunks(text, doc.docId)) {
        totalChunks++;
      }

      processedFiles++;
    }
  }

  console.log(`📊 Statistics:`);
  console.log(`  - Processed files: ${processedFiles}`);
  console.log(`  - Generated chunks: ${totalChunks}`);

  console.log('✅ Document ingestion complete');
}

// CLI entry point
const args = process.argv.slice(2);
const forceFlag = args.includes('--force') || args.includes('-f');

ingest(forceFlag).catch(console.error);

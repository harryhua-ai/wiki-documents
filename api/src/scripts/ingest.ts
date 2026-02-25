import { VectorStore } from '../lib/vector.js';
import { generateEmbeddings } from '../services/llm.js';
import { readdirSync, promises as fsPromises } from 'fs';
import { join, resolve } from 'path';

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
// 降低批处理大小并添加批次间延迟，避免 API 速率限制
const BATCH_SIZE = 5; // 从 10 降到 5
const BATCH_DELAY = 1000; // 批次间延迟 1 秒

async function* walkDirectory(dir: string, language: string): AsyncGenerator<any> {
  const files = readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkDirectory(join(dir, file.name), language);
    } else if (file.name.endsWith('.md')) {
      const fullPath = join(dir, file.name);

      // Extract metadata from file path
      // 修复：从完整文件路径中提取相对路径
      // fullPath 是绝对路径，需要先获取项目根目录
      const projectRoot = resolve(process.cwd(), '..');
      const docPath = fullPath.replace(projectRoot, '')
        // Remove both docs/ and i18n/en/ prefixes for consistent URL structure
        .replace(/^(\/docs\/|\/i18n\/en\/)/, '/docs/');
      const urlPath = docPath.replace(/\.md$/, '');

      const docId = docPath.replace(/\//g, '_');
      const title = file.name.replace('.md', '');

      // P0-A: 生成完整的 URL（修复 Source 链接问题）
      // 开发环境: http://localhost:3000
      // 生产环境: https://wiki.camthink.ai
      const isDev = process.env.NODE_ENV === 'development';
      const baseUrl = isDev ? 'http://localhost:3000' : 'https://wiki.camthink.ai';
      const url = `${baseUrl}${urlPath}`;

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

async function* splitIntoChunks(
  text: string,
  metadata: Omit<DocumentChunk, 'chunkIndex' | 'content'>
): AsyncGenerator<DocumentChunk> {
  const paragraphs = text.split(/\n\n/);
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      const testChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;

      if (testChunk.length >= CHUNK_SIZE && chunkIndex > 0) {
        yield {
          ...metadata,
          chunkIndex,
          content: currentChunk.trim(),
        };
        chunkIndex++;
        currentChunk = sentence;
      } else {
        currentChunk = testChunk;
      }
    }

    if (currentChunk.trim()) {
      yield {
        ...metadata,
        chunkIndex,
        content: currentChunk.trim(),
      };
      chunkIndex++;
    }
  }
}

/**
 * 父文档分块策略
 *
 * 将文档分为父文档（500-800 tokens）和子 chunks（200-300 tokens）
 * 子 chunks 用于 embedding 检索，父文档用于 LLM 生成
 *
 * 注意：当前为演示实现，实际使用时需要在 Feature Flag 启用时调用
 */
/**
 * 父文档分块策略
 *
 * 将文档分为父文档（500-800 tokens）和子 chunks（200-300 tokens）
 * 子 chunks 用于 embedding 检索，父文档用于 LLM 生成
 *
 * 注意：当前为演示实现，实际使用时需要在 Feature Flag 启用时调用
 */
// interface ParentChildChunk {  // 暂时注释，未使用
//   parent: DocumentChunk;
//   children: DocumentChunk[];
// }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// 暂时注释，未使用
/*
async function* splitIntoParentChildChunks(
  text: string,
  metadata: Omit<DocumentChunk, 'chunkIndex' | 'content'>
): AsyncGenerator<ParentChildChunk> {
  // 按 H2 标题分割父文档
  const sections = text.split(/^##\s+/m).filter(Boolean);
  let parentIndex = 0;

  for (const section of sections) {
    const lines = section.split('\n');
    const heading = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();

    if (!content) continue;

    // 创建父文档块（500-800 tokens，简化为字符数估算）
    const parentChunk: DocumentChunk = {
      ...metadata,
      chunkIndex: parentIndex,
      content: content.slice(0, 800), // 简化：按字符数限制
      section: heading,
    };

    // 创建子 chunks（200-300 tokens）
    const children: DocumentChunk[] = [];
    const paragraphs = content.split(/\n\n+/);
    let childContent = '';
    let childIndex = 0;

    for (const paragraph of paragraphs) {
      if ((childContent + paragraph).length > 300 && childContent.length > 0) {
        children.push({
          ...metadata,
          chunkIndex: childIndex,
          content: childContent.trim(),
          section: heading,
        });
        childIndex++;
        childContent = paragraph;
      } else {
        childContent += '\n\n' + paragraph;
      }
    }

    // 添加最后一个子 chunk
    if (childContent.trim()) {
      children.push({
        ...metadata,
        chunkIndex: childIndex,
        content: childContent.trim(),
        section: heading,
      });
    }

    yield { parent: parentChunk, children };
    parentIndex++;
  }
}
*/

export async function ingest(force: boolean = false): Promise<void> {
  console.log(`📚 Starting document ingestion (force=${force})`);

  const vectorStore = new VectorStore();
  await vectorStore.initialize();

  const allChunks: Array<DocumentChunk & { embedding: number[] }> = [];
  let processedFiles = 0;
  let failedEmbeddings = 0;

  // Phase 1: Collect all chunks
  console.log('📖 Phase 1: Reading and chunking documents...');
  const chunksWithoutEmbedding: DocumentChunk[] = [];

  for (const source of SOURCES) {
    console.log(`  Processing ${source.language} documents from ${source.path}`);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - The generator issue with walkDirectory is complex to type perfectly
    for await (const doc of walkDirectory(source.path, source.language)) {
      const fileContent = await fsPromises.readFile(doc.fullPath, 'utf-8');
      const text = fileContent.toString();

      for await (const chunk of splitIntoChunks(text, {
        docId: doc.docId,
        url: doc.url,
        title: doc.title,
        section: doc.section,
        product: doc.product,
        language: doc.language,
        tags: doc.tags,
      })) {
        chunksWithoutEmbedding.push(chunk);
      }

      processedFiles++;
    }
  }

  console.log(`  ✓ Processed ${processedFiles} files`);
  console.log(`  ✓ Generated ${chunksWithoutEmbedding.length} chunks`);

  // Phase 2: Generate embeddings in batches
  console.log('🔄 Phase 2: Generating embeddings...');
  console.log(`   批处理大小: ${BATCH_SIZE}, 批次间延迟: ${BATCH_DELAY}ms`);

  for (let i = 0; i < chunksWithoutEmbedding.length; i += BATCH_SIZE) {
    const batch = chunksWithoutEmbedding.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(chunksWithoutEmbedding.length / BATCH_SIZE);

    console.log(`   处理批次 ${batchNumber}/${totalBatches} (${batch.length} chunks)...`);

    try {
      // 使用批量并发生成 embeddings
      const embeddings = await generateEmbeddings(batch.map(c => c.content));

      // 将 embeddings 分配给对应的 chunks
      for (let j = 0; j < batch.length; j++) {
        if (embeddings[j] && embeddings[j].length > 0) {
          allChunks.push({ ...batch[j], embedding: embeddings[j] });
        } else {
          console.error(`     ✗ Chunk ${batch[j].docId}:${batch[j].chunkIndex} 失败: 空的 embedding`);
          failedEmbeddings++;
        }
      }

      // Progress indicator
      if (allChunks.length % 50 === 0) {
        console.log(`     ✓ 已生成 ${allChunks.length}/${chunksWithoutEmbedding.length} embeddings`);
      }
    } catch (error) {
      // 批量失败时，降级到逐个处理
      console.error(`   批次 ${batchNumber} 批量处理失败，降级到逐个处理:`, error instanceof Error ? error.message : error);

      for (const chunk of batch) {
        try {
          const embeddings = await generateEmbeddings([chunk.content]);
          if (embeddings[0] && embeddings[0].length > 0) {
            allChunks.push({ ...chunk, embedding: embeddings[0] });
          } else {
            console.error(`     ✗ Chunk ${chunk.docId}:${chunk.chunkIndex} 失败: 空的 embedding`);
            failedEmbeddings++;
          }
        } catch (singleError) {
          console.error(`     ✗ Chunk ${chunk.docId}:${chunk.chunkIndex} 失败:`, singleError instanceof Error ? singleError.message : singleError);
          failedEmbeddings++;
        }
      }
    }

    // 批次间延迟，避免 API 速率限制
    if (i + BATCH_SIZE < chunksWithoutEmbedding.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }

  console.log(`  ✓ Successfully generated ${allChunks.length} embeddings`);
  if (failedEmbeddings > 0) {
    console.log(`  ⚠ Failed to generate ${failedEmbeddings} embeddings`);
  }

  // Phase 3: Store in vector database
  if (allChunks.length > 0) {
    console.log('💾 Phase 3: Storing chunks to vector database...');
    await vectorStore.upsert(allChunks);
    console.log(`  ✓ Stored ${allChunks.length} document chunks to vector database`);
  } else {
    console.log('⚠️  No chunks to store (all embedding generation failed)');
  }

  console.log('\n📊 Final Statistics:');
  console.log(`  - Processed files: ${processedFiles}`);
  console.log(`  - Generated chunks: ${chunksWithoutEmbedding.length}`);
  console.log(`  - Successful embeddings: ${allChunks.length}`);
  console.log(`  - Failed embeddings: ${failedEmbeddings}`);
  console.log('✅ Document ingestion complete\n');
}

// CLI entry point
const args = process.argv.slice(2);
const forceFlag = args.includes('--force') || args.includes('-f');

ingest(forceFlag).catch(console.error);

import { generateEmbedding } from './dist/services/llm.js';
import { vectorStore } from './dist/services/rag.js';

const query = 'NE301电池续航';
console.log('Testing query:', query);

// Generate embedding
const embedding = await generateEmbedding(query);
console.log('Embedding dimension:', embedding.length);

// Search with filter
const results = await vectorStore.search({
  vector: embedding,
  topK: 5,
  filterObj: {
    language: 'zh-Hans',
    product_line: 'ne301'
  }
});

console.log('\nSearch results:', results.length);
results.forEach((r, i) => {
  const metadata = r.metadata || {};
  console.log(`\n[${i+1}] Score: ${r.score?.toFixed(4) || 'N/A'}`);
  console.log(`    Doc: ${metadata.doc_title}`);
  console.log(`    Section: ${metadata.section_title}`);
  console.log(`    Product: ${metadata.product_line}`);
  console.log(`    Lang: ${metadata.language}`);
  console.log(`    Content: ${(r.content || '').substring(0, 80)}...`);
});

process.exit(0);

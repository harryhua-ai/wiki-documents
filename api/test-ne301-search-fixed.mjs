import { generateEmbedding } from './dist/services/llm.js';
import { vectorStore } from './dist/services/rag.js';

const query = 'NE301电池续航';
console.log('Testing query:', query);

// Generate embedding
let embedding = await generateEmbedding(query);
console.log('Embedding type:', embedding.constructor.name);
console.log('Is Buffer?:', Buffer.isBuffer(embedding));

// Convert Buffer to number[] if needed
if (Buffer.isBuffer(embedding)) {
  console.log('Converting Buffer to number[]...');
  const arr = new Float32Array(embedding.buffer, embedding.byteOffset, embedding.byteLength / 4);
  embedding = Array.from(arr);
  console.log('Converted, first 5:', embedding.slice(0, 5));
}

// Search with filter
const results = await vectorStore.search(embedding, query, {
  topK: 5,
  minScore: 0
});

console.log('\n✅ Search results:', results.length);
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

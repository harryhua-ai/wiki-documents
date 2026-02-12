
import { generateEmbedding } from './src/services/llm.js';
import { env } from './src/config/index.js';

console.log('--- Config Debug ---');
console.log('EMBEDDING_PROVIDER:', env.EMBEDDING_PROVIDER);
console.log('EMBEDDING_MODEL:', env.EMBEDDING_MODEL);
console.log('EMBEDDING_DIMENSION:', env.EMBEDDING_DIMENSION);
console.log('EMBEDDING_API_BASE:', env.EMBEDDING_API_BASE);
console.log('EMBEDDING_API_KEY set:', !!env.EMBEDDING_API_KEY);

console.log('\n--- Generation Test ---');
try {
  const text = "test query";
  console.log(`Generating embedding for: "${text}"`);
  const embedding = await generateEmbedding(text);

  console.log('\n--- Result ---');
  console.log('Length:', embedding.length);
  console.log('First 5 values:', embedding.slice(0, 5));

  const isZero = embedding.every(v => v === 0);
  console.log('Is all zeros:', isZero);

  if (embedding.length !== 1024) {
    console.error(`\n❌ ERROR: Expected dimension 1024, got ${embedding.length}`);
  }

  if (isZero) {
    console.error('\n❌ ERROR: Embedding is all zeros!');
  }

} catch (error) {
  console.error('\n❌ FATAL ERROR:', error);
}

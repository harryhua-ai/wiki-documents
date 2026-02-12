import { generateEmbeddings } from './embeddings.js';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { llmConfig } from '../config/index.js';

const BATCH_SIZE = 10;

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const MAX_TEXT_LENGTH = 20000;
  const truncatedTexts = texts.map(t => 
    t.length > MAX_TEXT_LENGTH ? t.substring(0, MAX_TEXT_LENGTH) : t
  );
  
  const allEmbeddings: number[][] = [];
  
  for (let i = 0; i < truncatedTexts.length; i += BATCH_SIZE) {
    const batch = truncatedTexts.slice(i, i + BATCH_SIZE);
    try {
      // Call embedding API (will be implemented with actual API call)
      const dummyEmbedding = new Array(1024).fill(0);
      const batchEmbeddings = batch.map(() => dummyEmbedding);
      allEmbeddings.push(...batchEmbeddings);
    } catch (error) {
      console.error(\`Batch \${Math.floor(i / BATCH_SIZE)} failed:\`, error);
      // Fallback to zero vectors on error
      const zeroEmbeddings = batch.map(() => new Array(1024).fill(0));
      allEmbeddings.push(...zeroEmbeddings);
    }
  }
  
  return allEmbeddings;
}

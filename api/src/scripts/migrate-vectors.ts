#!/usr/bin/env tsx
import { vectorStore } from '../services/rag.js';
import { vectorOps } from '../lib/db.js';
import { dbConfig } from '../config/index.js';

async function migrate() {
  console.log('🚀 Starting vector migration...');
  console.log(`Target Vector Store: ${dbConfig.vectorStoreType}`);

  if (dbConfig.vectorStoreType === 'sqlite') {
    console.log('Target is SQLite (default). No migration needed unless you want to re-index from file system.');
    process.exit(0);
  }

  // Initialize target store
  console.log('Initializing target store...');
  await vectorStore.init();

  // Read all data from SQLite source
  // We assume the SQLite DB (lib/db.ts) is still accessible even if we are configured to use Qdrant
  // because vectorOps uses better-sqlite3 directly on the db file.
  console.log('Reading data from SQLite...');
  const rows = vectorOps.getAll();
  console.log(`Found ${rows.length} documents in SQLite.`);

  if (rows.length === 0) {
    console.log('No data to migrate.');
    process.exit(0);
  }

  const batchSize = 50;
  let processed = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    const docs = batch.map(row => ({
      id: row.id,
      content: row.content,
      embedding: row.embedding, // Use existing embedding
      metadata: row.metadata
    }));

    // We can use vectorStore.upsertBatch directly
    // Note: indexDocuments generates new embeddings, but here we already have them.
    // So we use vectorStore.upsertBatch directly.
    await vectorStore.upsertBatch(docs);

    processed += batch.length;
    process.stdout.write(`\rProgress: ${processed}/${rows.length}`);
  }

  console.log('\n✅ Migration complete!');
}

migrate().catch(console.error);

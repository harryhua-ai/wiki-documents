/**
 * Database Initialization Script
 *
 * Usage:
 *   ts-node scripts/init-db.ts
 *   or
 *   node --loader ts-node/esm scripts/init-db.ts
 *
 * Environment variables:
 *   DATABASE_URL - PostgreSQL connection string (required)
 *   DB_TYPE - 'postgresql' | 'sqlite' (default: 'postgresql')
 */

import { Client } from 'pg';
import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface InitDbOptions {
  databaseUrl?: string;
  dbType?: 'postgresql' | 'sqlite';
  schemaPath?: string;
}

/**
 * Initialize PostgreSQL database
 */
async function initPostgreSQL(connectionString: string, schemaPath: string): Promise<void> {
  const client = new Client({ connectionString });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected successfully.');

    const schema = await fs.readFile(schemaPath, 'utf-8');

    console.log('Executing schema...');
    await client.query(schema);
    console.log('Schema executed successfully.');

    // Verify tables exist
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('chat_sessions', 'chat_messages', 'chat_feedback', 'document_index_status', 'document_chunks')
      ORDER BY table_name;
    `);

    console.log(`Verified ${result.rows.length} tables created:`);
    result.rows.forEach((row) => console.log(`  - ${row.table_name}`));

  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

/**
 * Initialize SQLite database
 */
async function initSQLite(dbPath: string, schemaPath: string): Promise<void> {
  const db: Database<sqlite3.Database> = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    console.log(`Opening SQLite database: ${dbPath}`);

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON;');
    console.log('Foreign keys enabled.');

    const schema = await fs.readFile(schemaPath, 'utf-8');

    console.log('Executing schema...');
    await db.exec(schema);
    console.log('Schema executed successfully.');

    // Verify tables exist
    const tables = await db.all(`
      SELECT name
      FROM sqlite_master
      WHERE type='table'
      AND name IN ('chat_sessions', 'chat_messages', 'chat_feedback', 'document_index_status')
      ORDER BY name;
    `);

    console.log(`Verified ${tables.length} tables created:`);
    tables.forEach((row: any) => console.log(`  - ${row.name}`));

  } finally {
    await db.close();
    console.log('Database closed.');
  }
}

/**
 * Main initialization function
 */
async function initDb(options: InitDbOptions = {}): Promise<void> {
  const dbType = options.dbType || (process.env.DB_TYPE as 'postgresql' | 'sqlite') || 'postgresql';
  const schemaPath = options.schemaPath || path.join(__dirname, 'schema.sql');

  if (dbType === 'postgresql') {
    const databaseUrl = options.databaseUrl || process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
    }

    await initPostgreSQL(databaseUrl, schemaPath);
  } else if (dbType === 'sqlite') {
    const databaseUrl = options.databaseUrl || process.env.DATABASE_URL || './data/wiki.db';

    const sqliteSchemaPath = schemaPath.replace('.sql', '.sqlite.sql');
    await initSQLite(databaseUrl, sqliteSchemaPath);
  } else {
    throw new Error(`Unsupported DB_TYPE: ${dbType}. Use 'postgresql' or 'sqlite'.`);
  }

  console.log('\nDatabase initialization complete!');
}

/**
 * CLI entry point
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dbType = args.find((arg) => arg.startsWith('--db-type='))?.split('=')[1] as 'postgresql' | 'sqlite' | undefined;

  initDb({ dbType })
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Initialization failed:', error);
      process.exit(1);
    });
}

export { initDb, initPostgreSQL, initSQLite };

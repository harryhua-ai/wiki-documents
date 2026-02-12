#!/usr/bin/env tsx
/**
 * Database Initialization Script
 *
 * Creates and initializes the SQLite database with all required tables.
 */

import { db } from '../src/lib/db.js';

console.log('🔧 Initializing database...\n');

try {
  // Get all tables
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
    )
    .all();

  console.log('✅ Database initialized successfully!');
  console.log(`   Tables created: ${tables.map((t: any) => t.name).join(', ')}\n`);

  // Display schema info
  console.log('📋 Database schema:\n');

  const tableNames = tables.map((t: any) => t.name);

  for (const tableName of tableNames) {
    const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
    console.log(`   📄 ${tableName}`);

    for (const column of schema as any[]) {
      const nullable = column.notnull ? ' NOT NULL' : '';
      const pk = column.pk ? ' PRIMARY KEY' : '';
      const defaultVal = column.dflt_value ? ` DEFAULT ${column.dflt_value}` : '';
      console.log(`      ${column.name}${pk}${nullable}${defaultVal}`);
    }
    console.log('');
  }

  console.log('✅ Database is ready to use!\n');
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
} finally {
  db.close();
}

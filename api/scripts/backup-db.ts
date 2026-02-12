/**
 * Database Backup Script
 *
 * Performs a safe hot backup of the SQLite database using better-sqlite3's backup API.
 * Compresses the backup and rotates old files.
 *
 * Usage: npm run db:backup
 */

import Database from 'better-sqlite3';
import { dbConfig } from '../src/config/index.js';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10);
const DATE_FORMAT = new Date().toISOString().replace(/[:.]/g, '-');

const backupDatabase = async () => {
  console.log('📦 Starting database backup...');

  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const sourceDbPath = dbConfig.path;
  const backupFileName = `chat_backup_${DATE_FORMAT}.db`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  try {
    // 1. Perform Hot Backup
    console.log(`   Source: ${sourceDbPath}`);
    console.log(`   Target: ${backupFilePath}`);

    const db = new Database(sourceDbPath);
    await db.backup(backupFilePath);
    db.close();

    console.log('   ✅ Hot backup completed successfully');

    // 2. Compress Backup (gzip)
    console.log('   Compressing backup...');
    const compressedFilePath = `${backupFilePath}.gz`;
    await execAsync(`gzip -c "${backupFilePath}" > "${compressedFilePath}"`);

    // Remove original uncompressed file
    fs.unlinkSync(backupFilePath);
    console.log(`   ✅ Compressed to: ${compressedFilePath}`);

    // 3. Rotate Old Backups
    console.log(`   Rotating backups (retention: ${RETENTION_DAYS} days)...`);
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      if (!file.startsWith('chat_backup_') || !file.endsWith('.gz')) continue;

      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const daysOld = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

      if (daysOld > RETENTION_DAYS) {
        fs.unlinkSync(filePath);
        console.log(`   🗑️  Deleted old backup: ${file}`);
        deletedCount++;
      }
    }

    console.log(`   Cleaned up ${deletedCount} old backup(s)`);
    console.log('\n✅ Database backup finished successfully!');

  } catch (error) {
    console.error('\n❌ Backup failed:', error);
    process.exit(1);
  }
};

backupDatabase();

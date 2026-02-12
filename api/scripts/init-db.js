import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'chat.db');
const db = new Database(dbPath);

console.log('Initializing database at:', dbPath);

// Create sessions table
db.exec('CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, ip_hash TEXT NOT NULL, language TEXT NOT NULL, created_at TEXT NOT NULL, last_activity TEXT)');

// Create chat_messages table  
db.exec('CREATE TABLE IF NOT EXISTS chat_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, sources TEXT, metadata TEXT, timestamp TEXT NOT NULL)');

// Create indexes
db.exec('CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id)');

console.log('✅ Database initialized successfully');

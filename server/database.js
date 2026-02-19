import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../database.sqlite');

export async function setupDatabase() {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      score INTEGER,
      total INTEGER,
      percentage REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    return db;
}

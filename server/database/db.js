import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { seedOneYearMockData } from './mockData.js';

const DB_PATH = process.env.DB_PATH || './server/database/finance.db';

function ensureDirectory(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function initDatabase(dbFilePath = DB_PATH) {
  ensureDirectory(dbFilePath);
  const db = new DatabaseSync(dbFilePath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  createTables(db);
  seedCategories(db);
  seedOneYearMockData(db);
  return db;
}

function createTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('INCOME', 'EXPENSE')),
      icon TEXT DEFAULT 'tag',
      color TEXT DEFAULT '#3B82F6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      type TEXT NOT NULL CHECK(type IN ('INCOME', 'EXPENSE')),
      amount REAL NOT NULL CHECK(amount > 0),
      date TEXT NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      month TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category_id, month)
    );
    CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
  `);
}

function seedCategories(db) {
  const row = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (row && Number(row.count) > 0) return;

  const insert = db.prepare(`
    INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)
  `);
  const defaults = [
    ['Ăn uống', 'EXPENSE', 'utensils', '#EF4444'],
    ['Nhà cửa & Sinh hoạt', 'EXPENSE', 'home', '#F59E0B'],
    ['Đi lại & Xăng xe', 'EXPENSE', 'car', '#10B981'],
    ['Mua sắm', 'EXPENSE', 'shopping-bag', '#8B5CF6'],
    ['Giải trí & Bạn bè', 'EXPENSE', 'film', '#EC4899'],
    ['Y tế & Sức khỏe', 'EXPENSE', 'heart-pulse', '#06B6D4'],
    ['Hóa đơn & Tiện ích', 'EXPENSE', 'receipt', '#6B7280'],
    ['Lương chính', 'INCOME', 'wallet', '#10B981'],
    ['Thưởng & Làm thêm', 'INCOME', 'gift', '#3B82F6'],
    ['Đầu tư & Tiết kiệm', 'INCOME', 'trending-up', '#6366F1'],
    ['Thu nhập khác', 'INCOME', 'plus-circle', '#9CA3AF']
  ];

  db.exec('BEGIN TRANSACTION;');
  for (const item of defaults) insert.run(...item);
  db.exec('COMMIT;');
}

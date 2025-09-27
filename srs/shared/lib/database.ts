import * as SQLite from 'expo-sqlite';

// Відкриваємо базу (один раз для всього застосунку)
export const db = SQLite.openDatabaseSync('books.db');

// Можна створити загальну ініціалізацію
export const initDb = () => {
    db.execSync(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      path TEXT,
      format TEXT,
      base64 TEXT,
      currentPage INTEGER DEFAULT 0,
      totalPages INTEGER DEFAULT 0
    );
  `);

    db.execSync(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookId INTEGER,
      page INTEGER,
      note TEXT,
      FOREIGN KEY (bookId) REFERENCES books(id) ON DELETE CASCADE
    );
  `);
};

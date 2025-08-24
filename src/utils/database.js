import { openDatabaseAsync } from 'expo-sqlite';

let db;

export const initBookDB = async () => {
    db = await openDatabaseAsync('books.db');

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            path TEXT,
            format TEXT,
            base64 TEXT,
            currentPage INTEGER,
            totalPages INTEGER
        );
    `);

    // Захист від дублювання колонок при оновленнях
    const safeAlter = async (column, type) => {
        try {
            await db.execAsync(`ALTER TABLE books ADD COLUMN ${column} ${type}`);
            console.log(`✅ Додано колонку "${column}"`);
        } catch (e) {
            if (
                e.message.includes('duplicate column name') ||
                e.message.includes('already exists')
            ) {
                console.log(`ℹ️ Колонка "${column}" вже існує`);
            } else {
                console.error(`❌ Помилка при додаванні "${column}":`, e);
            }
        }
    };

    await safeAlter('base64', 'TEXT');
    await safeAlter('currentPage', 'INTEGER');
    await safeAlter('totalPages', 'INTEGER');
};

export const insertBook = async (title, path, format = 'pdf', base64 = '') => {
    await db.runAsync(
        'INSERT INTO books (title, path, format, base64, currentPage, totalPages) VALUES (?, ?, ?, ?, ?, ?)',
        [title, path, format, base64, 0, 0]
    );
};

export const fetchBooks = async () => {
    const result = await db.getAllAsync('SELECT * FROM books');
    return result;
};

export const deleteBook = async (id) => {
    await db.runAsync('DELETE FROM books WHERE id = ?', [id]);
};

export const updateBookProgress = async (id, currentPage, totalPages) => {
    await db.runAsync(
        'UPDATE books SET currentPage = ?, totalPages = ? WHERE id = ?',
        [currentPage, totalPages, id]
    );
};

export const getBookById = async (id) => {
    const result = await db.getFirstAsync('SELECT * FROM books WHERE id = ?', [id]);
    return result;
};

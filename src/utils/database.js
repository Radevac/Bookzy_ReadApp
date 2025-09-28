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

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bookId INTEGER,
            page INTEGER,
            note TEXT,
            createdAt TEXT
            );
        `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER,
            page INTEGER,
            text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bookId INTEGER,
        page INTEGER,
        selectedText TEXT,
        comment TEXT
        );
        `);


    // Захист від дублювання колонок при оновленнях
    const safeAlter = async (table, column, type) => {
        try {
            await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
            console.log(`✅ Додано колонку "${column}" в "${table}"`);
        } catch (e) {
            if (
                e.message.includes("duplicate column name") ||
                e.message.includes("already exists")
            ) {
                console.log(`ℹ️ Колонка "${column}" вже існує в "${table}"`);
            } else {
                console.error(`❌ Помилка при додаванні "${column}" в "${table}":`, e);
            }
        }
    };

    await safeAlter("books", "base64", "TEXT");
    await safeAlter("books", "currentPage", "INTEGER");
    await safeAlter("books", "totalPages", "INTEGER");


    await safeAlter("bookmarks", "preview", "TEXT");
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

export const addBookmark = async (bookId, page, preview) => {
    const createdAt = new Date().toISOString();
    await db.runAsync(
        'INSERT INTO bookmarks (bookId, page, createdAt, preview) VALUES (?, ?, ?, ?)',
        [bookId, page, createdAt, preview]
    );
};
export const getBookmarksByBook = async (bookId) => {
    return await db.getAllAsync(
        'SELECT * FROM bookmarks WHERE bookId = ? ORDER BY createdAt DESC',
        [bookId]
    );
};

export const deleteBookmark = async (bookId, page) => {
    await db.runAsync(
        'DELETE FROM bookmarks WHERE bookId = ? AND page = ?',
        [bookId, page]
    );
};

export const isBookmarked = async (bookId, page) => {
    const res = await db.getFirstAsync(
        'SELECT * FROM bookmarks WHERE bookId = ? AND page = ?',
        [bookId, page]
    );
    return !!res;
};

export const addNote = async (bookId, page, text, p0) => {
    await db.runAsync(
        "INSERT INTO notes (book_id, page, text) VALUES (?, ?, ?)",
        [bookId, page, text]
    );
};

export const getNotes = async (bookId) => {
    return await db.getAllAsync("SELECT * FROM notes WHERE book_id = ?", [bookId]);
};

export const deleteNote = async (id) => {
    await db.runAsync("DELETE FROM notes WHERE id = ?", [id]);
};

export const addComment = async (bookId, page, selectedText, comment) => {
    await db.runAsync(
        `INSERT INTO comments (bookId, page, selectedText, comment) VALUES (?, ?, ?, ?)`,
        [bookId, page, selectedText, comment]
    );
};

export const getCommentsByBook = async (bookId) => {
    return await db.getAllAsync(
        `SELECT * FROM comments WHERE bookId = ? ORDER BY page ASC`,
        [bookId]
    );
};

export const deleteComment = async (id) => {
    await db.runAsync(`DELETE FROM comments WHERE id = ?`, [id]);
};

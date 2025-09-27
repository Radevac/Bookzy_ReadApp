// import { db } from '@/shared/lib/database';
//
// // Додавання книги
// export const addBook = (title: string, path: string, format: string, base64: string) => {
//     db.runSync(
//         'INSERT INTO books (title, path, format, base64, currentPage, totalPages) VALUES (?, ?, ?, ?, 0, 0)',
//         [title, path, format, base64]
//     );
// };
//
// export const fetchBooks = () => db.getAllSync('SELECT * FROM books');
//
// export const updateBookProgress = (id: number, currentPage: number, totalPages: number) => {
//     db.runSync(
//         'UPDATE books SET currentPage = ?, totalPages = ? WHERE id = ?',
//         [currentPage, totalPages, id]
//     );
// };
//
// export const deleteBook = (id: number) => {
//     db.runSync('DELETE FROM books WHERE id = ?', [id]);
// };

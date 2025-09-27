// import { db } from '/shared/lib/database';
//
// export const addBookmark = (bookId: number, page: number, note: string = '') => {
//     db.runSync(
//         'INSERT INTO bookmarks (bookId, page, note) VALUES (?, ?, ?)',
//         [bookId, page, note]
//     );
// };
//
// export const deleteBookmark = (bookId: number, page: number) => {
//     db.runSync('DELETE FROM bookmarks WHERE bookId = ? AND page = ?', [bookId, page]);
// };
//
// export const isBookmarked = (bookId: number, page: number): boolean => {
//     const result = db.getFirstSync(
//         'SELECT * FROM bookmarks WHERE bookId = ? AND page = ?',
//         [bookId, page]
//     );
//     return !!result;
// };
//
// export const fetchBookmarks = (bookId: number) => {
//     return db.getAllSync('SELECT * FROM bookmarks WHERE bookId = ?', [bookId]);
// };

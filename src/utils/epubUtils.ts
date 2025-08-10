// import * as FileSystem from 'expo-file-system';
// import JSZip from 'jszip';
//
// /**
//  * Розпаковує EPUB (base64) у внутрішню директорію
//  * @param base64 - base64 EPUB (без префіксу)
//  * @param title - назва книги для створення папки
//  */
// export const unzipEpubToDirectory = async (base64: string, title: string): Promise<string | null> => {
//     try {
//         const zip = await JSZip.loadAsync(base64, { base64: true });
//
//         const outputDir = FileSystem.documentDirectory + `epub_books/${title.replace(/\\s/g, '_')}/`;
//         await FileSystem.makeDirectoryAsync(outputDir, { intermediates: true });
//
//         for (const filename of Object.keys(zip.files)) {
//             const file = zip.files[filename];
//             if (file.dir) continue;
//
//             const fileData = await file.async('base64');
//             const fullPath = outputDir + filename;
//
//             const folderPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
//             await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });
//
//             await FileSystem.writeAsStringAsync(fullPath, fileData, {
//                 encoding: FileSystem.EncodingType.Base64,
//             });
//         }
//
//         console.log('✅ EPUB розпаковано в:', outputDir);
//         return outputDir;
//     } catch (err) {
//         console.error('❌ Помилка розпакування EPUB:', err);
//         return null;
//     }
// };

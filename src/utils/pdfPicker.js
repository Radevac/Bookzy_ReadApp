import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { insertBook } from './database';

export const pickPdfFile = async () => {
    try {
        const res = await DocumentPicker.getDocumentAsync({
            type: 'application/pdf',
            copyToCacheDirectory: false,
        });

        if (res.canceled || !res.assets?.length) {
            console.log('⛔ Книгу не вибрано або вибір скасовано');
            return null;
        }

        const { name, uri } = res.assets[0];
        const newPath = FileSystem.documentDirectory + name;

        await FileSystem.copyAsync({ from: uri, to: newPath });

        const base64 = await FileSystem.readAsStringAsync(newPath, {
            encoding: FileSystem.EncodingType.Base64,
        });

        await insertBook(name, newPath, 'pdf', base64);

        return {
            title: name,
            base64: `data:application/pdf;base64,${base64}`,
            path: newPath,
            format: 'pdf',
        };
    } catch (error) {
        console.error('📛 Помилка при виборі PDF:', error);
        return null;
    }
};

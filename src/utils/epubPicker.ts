import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { insertBook } from './database';

export const pickEpubFile = async () => {
    try {
        const res = await DocumentPicker.getDocumentAsync({
            type: 'application/epub+zip',
            copyToCacheDirectory: false,
        });

        if (res.canceled || !res.assets?.length) return null;

        const { name, uri } = res.assets[0];
        const newPath = FileSystem.documentDirectory + name;

        await FileSystem.copyAsync({ from: uri, to: newPath });

        await insertBook(name, newPath, 'epub');

        return {
            title: name,
            path: newPath,
            format: 'epub',
        };
    } catch (error) {
        console.error('❌ EPUB error:', error);
        return null;
    }
};

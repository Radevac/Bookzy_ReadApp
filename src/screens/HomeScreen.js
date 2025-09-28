import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Button,
    Alert,
    StyleSheet,
} from 'react-native';
import { initBookDB, fetchBooks, deleteBook } from '../utils/database';
import { pickPdfFile } from '../utils/pdfPicker';
import { pickEpubFile } from '../utils/epubPicker';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';

export default function HomeScreen() {
    const [books, setBooks] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        (async () => {
            await initBookDB();
            await loadBooks();
        })();
    }, []);

    const loadBooks = async () => {
        const data = await fetchBooks();
        setBooks(data);
    };

    const handlePickPdf = async () => {
        const book = await pickPdfFile();
        if (book) {
            console.log('📗 Додано нову книгу:', book);
            navigation.navigate('Reader', { book });
            await loadBooks();
        }
    };

    const handleOpenBook = async (book) => {
        if (book.format === 'pdf') {
            if (!book.base64) {
                Alert.alert('⛔ Помилка', 'Цей файл не має збережених даних PDF.');
                return;
            }

            navigation.navigate('Reader', { book });
        } else if (book.format === 'epub') {
            const fileInfo = await FileSystem.getInfoAsync(book.path);
            if (!fileInfo.exists) {
                Alert.alert('Файл не знайдено', 'Цей файл більше не існує.');
                return;
            }

            navigation.navigate('EpubReader', { book });
        }
    };

    const confirmDelete = (book) => {
        Alert.alert(
            'Видалити книгу?',
            `Ви точно хочете видалити "${book.title}"?`,
            [
                { text: 'Скасувати', style: 'cancel' },
                {
                    text: 'Видалити',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteBook(book.id);
                        await loadBooks();
                        console.log(`🗑 Видалено: ${book.title}`);
                    },
                },
            ]
        );
    };

    const logBooks = async () => {
        const books = await fetchBooks();
        console.log('📋 Дані з таблиці books:', books);
    };

    const renderItem = ({ item }) => {
        const currentPage = item.currentPage || 0;
        const totalPages = item.totalPages || 1;
        const progress = Math.min((currentPage / totalPages) * 100, 100);

        return (
            <View style={styles.bookCard}>
                <TouchableOpacity onPress={() => handleOpenBook(item)} style={{ flex: 1 }}>
                    <Text style={styles.bookTitle}>{item.title}</Text>
                    <Text style={styles.bookProgressText}>
                        Сторінка {currentPage} з {totalPages} — {Math.round(progress)}%
                    </Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.continueText}>📖 Продовжити читання</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDelete(item)} style={{ paddingLeft: 10 }}>
                    <Text style={styles.deleteIcon}>🗑</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Button title="📥 Обрати PDF" onPress={handlePickPdf} />
            <View style={{ height: 10 }} />
            <Button title="📘 Обрати EPUB" onPress={async () => {
                const book = await pickEpubFile();
                if (book) {
                    navigation.navigate('EpubReader', { book });
                    await loadBooks();
                }
            }} />
            <View style={{ height: 10 }} />
            <Button title="📋 Логи бази" onPress={logBooks} />
            <FlatList
                data={books}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ paddingTop: 16 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    bookCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    bookTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    bookProgressText: {
        fontSize: 13,
        color: '#555',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 6,
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4caf50',
    },
    continueText: {
        fontSize: 14,
        color: '#1e8c45',
        marginTop: 4,
        fontWeight: '500',
    },
    deleteIcon: {
        fontSize: 20,
        color: 'red',
    },
});

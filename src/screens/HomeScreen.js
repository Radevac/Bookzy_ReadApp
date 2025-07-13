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
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';

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
        } else {
            console.log('⛔ Книгу не вибрано або вибір скасовано');
        }
    };


    const handleOpenBook = async (book) => {
        if (!book.base64) {
            Alert.alert('⛔ Помилка', 'Цей файл не має збережених даних PDF.');
            return;
        }

        navigation.navigate('Reader', { book });
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

    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            <TouchableOpacity
                onPress={() => handleOpenBook(item)}
                style={styles.itemText}
            >
                <Text>{item.title}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(item)}>
                <Text style={styles.deleteIcon}>🗑</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Button title="📥 Обрати PDF" onPress={handlePickPdf} />
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
    container: { flex: 1, padding: 16 },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    itemText: {
        flex: 1,
    },
    deleteIcon: {
        fontSize: 18,
        color: 'red',
        paddingLeft: 12,
    },
});

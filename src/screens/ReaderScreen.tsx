import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import PdfViewer, { PdfViewerHandle } from '../components/PdfViewer';
import {
    addBookmark,
    deleteBookmark,
    isBookmarked,
    updateBookProgress,
} from '../utils/database';
import { MaterialIcons } from '@expo/vector-icons';

export default function ReaderScreen({ route }) {
    const { book } = route.params;
    const viewerRef = useRef<PdfViewerHandle>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(book.currentPage ?? 0);
    const [bookmarked, setBookmarked] = useState(false);

    useEffect(() => {
        (async () => {
            if (book?.id && currentPage >= 0) {
                const exists = await isBookmarked(book.id, currentPage);
                setBookmarked(exists);
            }
        })();
    }, [currentPage]);

    const handleMessage = async (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'progress' || data.type === 'init') {
                const { currentPage: page = 0, totalPages = 1 } = data;
                setCurrentPage(page);

                if (book?.id) {
                    await updateBookProgress(book.id, page, totalPages);
                }
                console.log(`📖 Прогрес: ${page} з ${totalPages}`);
            }
        } catch (e) {
            console.error('❌ WebView message parse error:', e);
        }
    };

    const goToNextMatch = () => {
        viewerRef.current?.injectJavaScript(`
      window.postMessage(JSON.stringify({ type: 'next-highlight' }), '*');
    `);
    };

    const goToPrevMatch = () => {
        viewerRef.current?.injectJavaScript(`
      window.postMessage(JSON.stringify({ type: 'prev-highlight' }), '*');
    `);
    };

    const toggleBookmark = async () => {
        if (!book?.id) return;

        if (bookmarked) {
            await deleteBookmark(book.id, currentPage);
            setBookmarked(false);
            Alert.alert('Закладка', `Видалено сторінку ${currentPage}`);
        } else {
            await addBookmark(book.id, currentPage);
            setBookmarked(true);
            Alert.alert('Закладка', `Збережено сторінку ${currentPage}`);
        }
    };

    if (!book?.base64) {
        return (
            <View style={styles.center}>
                <Text>⛔ Немає base64-даних для PDF</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={toggleBookmark} style={styles.bookmarkButton}>
                <MaterialIcons
                    name={bookmarked ? 'bookmark' : 'bookmark-border'}
                    size={28}
                    color="black"
                />
            </TouchableOpacity>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="🔍 Введіть слово"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
                <TouchableOpacity onPress={goToPrevMatch} style={styles.button}>
                    <Text>←</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={goToNextMatch} style={styles.button}>
                    <Text>→</Text>
                </TouchableOpacity>
            </View>

            <PdfViewer
                ref={viewerRef}
                base64={book.base64}
                bookId={book.id}
                currentPage={book.currentPage}
                onMessage={handleMessage}
                searchTerm={searchTerm}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 8,
        alignItems: 'center',
        backgroundColor: '#f2f2f2',
    },
    input: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        borderColor: '#ccc',
        borderWidth: 1,
        marginRight: 8,
    },
    button: {
        backgroundColor: '#ddd',
        padding: 10,
        borderRadius: 6,
        marginHorizontal: 2,
    },
    bookmarkButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 6,
        elevation: 4,
        zIndex: 10,
    },
});

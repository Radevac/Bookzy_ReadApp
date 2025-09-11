import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import PdfViewer, { PdfViewerHandle } from '../components/PdfViewer';
import { updateBookProgress } from '../utils/database';

export default function ReaderScreen({ route }) {
    const { book } = route.params;
    const viewerRef = useRef<PdfViewerHandle>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleMessage = async (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'progress' || data.type === 'init') {
                const { currentPage = 0, totalPages = 1 } = data;
                await updateBookProgress(book.id, currentPage, totalPages);
                console.log(`📖 Прогрес: ${currentPage} з ${totalPages}`);
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

    if (!book?.base64) {
        return (
            <View style={styles.center}>
                <Text>⛔ Немає base64-даних для PDF</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
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
        flex: 1, justifyContent: 'center', alignItems: 'center',
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
});

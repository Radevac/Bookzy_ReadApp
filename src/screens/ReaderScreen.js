import React from 'react';
import { View, Text } from 'react-native';
import PdfViewer from '../components/PdfViewer';
import { updateBookProgress } from '../utils/database';

export default function ReaderScreen({ route }) {
    const { book } = route.params;

    const handleMessage = async (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'progress' || data.type === 'init') {
                const { currentPage = 0, totalPages = 1 } = data;
                await updateBookProgress(book.id, currentPage, totalPages);
                console.log(`📖 Збережено прогрес: ${currentPage} / ${totalPages}`);
            }
        } catch (e) {
            console.error('❌ WebView message parse error:', e);
        }
    };

    if (!book?.base64) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>⛔ Немає base64-даних для PDF</Text>
            </View>
        );
    }

    return (
        <PdfViewer
            base64={book.base64}
            bookId={book.id}
            currentPage={book.currentPage}
            onMessage={handleMessage}
        />
    );
}

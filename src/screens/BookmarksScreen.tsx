import React, { useState, useEffect } from 'react';

import {
    FlatList,
    Text,
    TouchableOpacity
} from 'react-native';
import {getBookmarksByBook} from "../utils/database";

export default function BookmarksScreen({ route, navigation }) {
    const { bookId } = route.params;
    const [bookmarks, setBookmarks] = useState([]);

    useEffect(() => {
        (async () => {
            const data = await getBookmarksByBook(bookId);
            setBookmarks(data);
        })();
    }, []);

    return (
        <FlatList
            data={bookmarks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <TouchableOpacity
                    onPress={() => {
                        navigation.navigate('Reader', { bookId, goToPage: item.page });
                    }}
                >
                    <Text>🔖 Сторінка {item.page}</Text>
                    <Text>{item.createdAt}</Text>
                </TouchableOpacity>
            )}
        />
    );
}

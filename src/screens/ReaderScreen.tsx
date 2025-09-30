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
    deleteBookmark, getBookmarksByBook, getCommentsByBook,
    isBookmarked,
    updateBookProgress,
} from '../utils/database';
import { MaterialIcons } from '@expo/vector-icons';
import ReadingSettingsScreen from './ReadingSettingsScreen';
import BookmarkNotesModal from "../components/BookmarkNotesModal";
import TextSelectionModal from "../components/TextSelectionModal";
import * as Clipboard from "expo-clipboard";
import CommentModal from "../components/CommentModal";
import { addComment } from "../utils/database";
import CommentInputModal from "../components/CommentInputModal";


export default function ReaderScreen({ route }) {
    const { book } = route.params;
    const viewerRef = useRef<PdfViewerHandle>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(book.currentPage ?? 0);
    const [bookmarked, setBookmarked] = useState(false);
    const [notesModalVisible, setNotesModalVisible] = useState(false);
    const [bookmarks, setBookmarks] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [totalPages, setTotalPages] = useState<number>(0);

    const [lastPreview, setLastPreview] = useState<string>("");
    const previewResolver = useRef<((text: string) => void) | null>(null);

    const [selectedText, setSelectedText] = useState<string | null>(null);
    const [selectionModalVisible, setSelectionModalVisible] = useState(false);
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [highlights, setHighlights] = useState<any[]>([]);


    const [settingsVisible, setSettingsVisible] = useState(false);
    const [readerSettings, setReaderSettings] = useState({
        theme: 'light',
        fontSize: 16,
        lineHeight: 1.6,
    });

    useEffect(() => {
        (async () => {
            if (book?.id && currentPage >= 0) {
                const exists = await isBookmarked(book.id, currentPage);
                setBookmarked(exists);
            }
        })();
    }, [currentPage]);

    useEffect(() => {
        (async () => {
            if (book?.id) {
                const bmarks = await getBookmarksByBook(book.id);
                setBookmarks(bmarks);
            }
        })();
    }, [notesModalVisible]);

    useEffect(() => {
        (async () => {
            if (book?.id) {
                const bmarks = await getBookmarksByBook(book.id);
                const comms = await getCommentsByBook(book.id);

                setBookmarks(bmarks);
                setComments(comms);
            }
        })();
    }, [notesModalVisible, commentModalVisible]);

    const getPdfPreview = (): Promise<string> => {
        return new Promise((resolve) => {
            previewResolver.current = resolve;
            viewerRef.current?.injectJavaScript(`
      (function() {
        try {
          var text = "";
          var spans = document.querySelectorAll('.textLayer span');
          for (var i = 0; i < spans.length; i++) {
            text += spans[i].innerText + " ";
          }
          var firstSentence = (text || "").trim().split(/[.!?…]\\s/)[0].slice(0, 160);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "preview",
            text: firstSentence
          }));
        } catch (e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "preview",
            text: ""
          }));
        }
      })();
      true;
    `);
        });
    };

    const handleMessage = async (event) => {
        try {
            const parsed = JSON.parse(event.nativeEvent.data);

            if (parsed.type === "preview") {
                setLastPreview(parsed.text);
                if (previewResolver.current) {
                    previewResolver.current(parsed.text);
                    previewResolver.current = null;
                }
                return;
            }

            if (parsed.type === "text-selected") {
                setSelectedText(parsed.text);
                setSelectionModalVisible(true);
                return;
            }

            if (parsed.type === "progress" || parsed.type === "init") {
                const { currentPage: page = 0, totalPages = 1 } = parsed;
                setCurrentPage(page);
                setTotalPages(totalPages);

                if (book?.id) {
                    await updateBookProgress(book.id, page, totalPages);
                }
                console.log(`📖 Прогрес: ${page} з ${totalPages}`);
            }
        } catch (e) {
            console.error("❌ WebView message parse error:", e);
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
        if (bookmarked) {
            await deleteBookmark(book.id, currentPage);
            setBookmarked(false);
        } else {
            const preview = await getPdfPreview();
            await addBookmark(book.id, currentPage, preview || "…");
            setBookmarked(true);
        }
        const bmarks = await getBookmarksByBook(book.id);
        setBookmarks(bmarks);
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
            <TouchableOpacity
                onPress={() => setNotesModalVisible(true)}
                style={{
                    position: "absolute",
                    top: 40,
                    left: 70,
                    backgroundColor: "#fff",
                    borderRadius: 30,
                    padding: 6,
                    elevation: 4,
                    zIndex: 10,
                }}
            >
                <MaterialIcons name="list" size={28} color="black" />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => setSettingsVisible(true)}
                style={styles.settingsButton}
            >
                <MaterialIcons name="settings" size={28} color="black" />
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
            <BookmarkNotesModal
                visible={notesModalVisible}
                onClose={() => setNotesModalVisible(false)}
                chapters={Array.from({ length: totalPages }).map((_, i) => ({
                    label: `Сторінка ${i + 1}`,
                    href: i + 1,
                }))}
                bookmarks={bookmarks}
                comments={comments}
                highlights={highlights}
                onSelectChapter={(page) => {
                    viewerRef.current?.injectJavaScript(`
      document.getElementById("viewer").scrollTop = pageOffsets[Number(${page}) - 1] || 0;
      true;
    `);
                    setNotesModalVisible(false);
                }}
                onDeleteBookmark={async (page) => {
                    await deleteBookmark(book.id, page);
                    const bmarks = await getBookmarksByBook(book.id);
                    setBookmarks(bmarks);
                }}
            />
            <TextSelectionModal
                visible={selectionModalVisible}
                onClose={() => setSelectionModalVisible(false)}
                onAddComment={() => {
                    setSelectionModalVisible(false);
                    setCommentModalVisible(true);
                }}
                onHighlight={(color) => {
                    Alert.alert("🔖 Виділено колір: " + color);
                }}
                onCopy={() => {
                    if (selectedText) {
                        Clipboard.setStringAsync(selectedText);
                        Alert.alert("Скопійовано!");
                    }
                }}
                onDelete={() => {
                    Alert.alert("❌ Видалити виділення");
                }}
            />
            <CommentModal
                visible={commentModalVisible}
                onClose={() => setCommentModalVisible(false)}
                onSave={async (text) => {
                    if (book?.id) {
                        await addComment(book.id, currentPage, selectedText || "", text);
                        setCommentModalVisible(false);
                        const bmarks = await getBookmarksByBook(book.id);
                        setBookmarks(bmarks);
                    }
                }}
            />
            <CommentInputModal
                visible={commentModalVisible}
                onClose={() => setCommentModalVisible(false)}
                onSave={async (text) => {
                    await addComment(book.id, currentPage, selectedText, text);

                    const updated = await getCommentsByBook(book.id);
                    setComments(updated);

                    setCommentModalVisible(false);
                }}
            />

            <ReadingSettingsScreen
                visible={settingsVisible}
                onClose={() => setSettingsVisible(false)}
                settings={readerSettings}
                onApply={(newSettings) => {
                    setReaderSettings(newSettings);

                    viewerRef.current?.injectJavaScript(`
      window.changeTheme("${newSettings.theme}");
      true;
    `);

                    const scale = newSettings.fontSize / 16;
                    viewerRef.current?.injectJavaScript(`
      window.changeZoom(${scale});
      true;
    `);

                    viewerRef.current?.injectJavaScript(`
      window.changeLineHeight("${newSettings.lineHeight}");
      true;
    `);
                }}
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
    settingsButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 6,
        elevation: 4,
        zIndex: 10,
    },
});

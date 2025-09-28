import React, {useEffect, useRef, useState} from 'react';
import {
    View,
    Button,
    StyleSheet,
    Alert,
    TextInput,
    FlatList,
    Text,
    TouchableOpacity,
    Modal
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import {
    addBookmark,
    deleteBookmark, getBookmarksByBook, getNotes,
    isBookmarked,
    updateBookProgress,
} from '../utils/database';

import ReadingSettingsScreen from './ReadingSettingsScreen';
import BookmarkNotesModal from "../components/BookmarkNotesModal";


export default function EpubReader({ route }) {
    const { book } = route.params;
    const webViewRef = useRef(null);

    const base64 = book.base64.replace(
        /^data:application\/epub\+zip;base64,/,
        ''
    );
    const savedPage = book.currentPage ?? 0;

    const [currentPage, setCurrentPage] = useState(savedPage);
    const [bookmarked, setBookmarked] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);

    const [bookmarks, setBookmarks] = useState([]);
    const [notes, setNotes] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [notesModalVisible, setNotesModalVisible] = useState(false);

    const [lastPreview, setLastPreview] = useState<string>("");

    const [comments, setComments] = useState<any[]>([]);
    const [highlights, setHighlights] = useState<any[]>([]);

    const [readerSettings, setReaderSettings] = useState({
        theme: 'light',
        fontSize: 16,
        lineHeight: 1.6,
    });

    const loadBookmarksAndNotes = async () => {
        const bmarks = await getBookmarksByBook(book.id);
        const nts = await getNotes(book.id);
        setBookmarks(bmarks);
        setNotes(nts);
    };

    useEffect(() => {
        if (notesModalVisible) {
            loadBookmarksAndNotes();
        }
    }, [notesModalVisible]);

    const previewResolver = useRef<((text: string) => void) | null>(null);


    const getEpubPreview = (): Promise<string> => {
        return new Promise((resolve) => {
            previewResolver.current = resolve;
            webViewRef.current?.injectJavaScript(`
      (function () {
        try {
          var text = "";

          // 1) нормальний шлях через ePub.js
          if (window.rendition && window.rendition.getContents) {
            var cs = window.rendition.getContents();
            for (var i = 0; i < cs.length; i++) {
              var doc = cs[i].document;
              if (doc && doc.body) {
                text += " " + (doc.body.innerText || "");
              }
            }
          }

          // 2) запасний варіант напряму через iframe усередині #viewer
          if (!text) {
            var ifr = document.querySelector('#viewer iframe');
            if (ifr && ifr.contentDocument && ifr.contentDocument.body) {
              text = ifr.contentDocument.body.innerText || "";
            }
          }

          text = (text || "").trim();
          var firstSentence = text.split(/[.!?…]\\s/)[0].slice(0, 160);

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

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script src="https://unpkg.com/epubjs/dist/epub.min.js"></script>
  <style>
    html, body, #viewer, iframe, .epub-container {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      background: #fff !important;
    }
    #viewer {
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
  </style>
</head>
<body>
  <div id="viewer"></div>
  <script>
    window.onerror = function(message, source, lineno, colno, error) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "error",
        message,
        stack: error?.stack || ""
      }));
    };

    const base64 = "${base64}";
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: "application/epub+zip" });
    const book = ePub(blob);

    const rendition = book.renderTo("viewer", {
      width: "100%",
      height: "100%",
      flow: "scrolled-doc",
      spread: "none",
      manager: "continuous"
    });

    // Стиль для читання
    rendition.themes.default({
      body: {
        "background": "#fff !important",
        "color": "#000 !important",
        "font-size": "120%",
        "line-height": "1.6",
        "text-align": "justify",
        "margin": "0 auto",
        "max-width": "95%"
      },
      img: {
        "max-width": "100%",
        "height": "auto",
        "display": "block",
        "margin": "1em auto"
      },
      ".search-highlight": {
        "background": "yellow",
        "opacity": "0.6"
      }
    });

    let totalLocations = 0;
    let currentLocation = 0;
    const savedLocation = ${currentPage};

    book.ready.then(() => {
      return Promise.all([
        book.locations.generate(1600),
        book.loaded.navigation
      ]);
    }).then(([_, navigation]) => {
      totalLocations = book.locations.length();

      // TOC (chapters)
      if (navigation && navigation.toc) {
        const toc = navigation.toc.map(item => ({
          label: item.label,
          href: item.href
        }));
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "toc", toc }));
      }

      // Відновлення позиції
      if (savedLocation > 0 && totalLocations > 0) {
        const cfi = book.locations.cfiFromLocation(savedLocation);
        rendition.display(cfi).catch(() => rendition.display());
      } else {
        rendition.display();
      }

      // Прогрес
      rendition.on("relocated", (location) => {
        try {
          currentLocation = book.locations.locationFromCfi(location.start.cfi);
        } catch (e) {
          currentLocation = 0;
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "progress",
          currentLocation,
          totalLocations
        }));
      });

      // Init
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "init",
        currentLocation: savedLocation,
        totalLocations
      }));
    });

    window.searchInBook = async function(query) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "debug",
        message: "[CALL] searchInBook: " + query
      }));

      const results = [];
      const spineItems = book.spine.spineItems;

      for (let i = 0; i < spineItems.length; i++) {
        const item = spineItems[i];
        try {
          await item.load(book.load.bind(book));
          const doc = item.document;
          const body = doc && doc.body;
          if (!body) continue;

          const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT, null, false);
          while (walker.nextNode()) {
            const node = walker.currentNode;
            const text = node.textContent;
            const index = text.toLowerCase().indexOf(query.toLowerCase());
            if (index !== -1) {
              const range = doc.createRange();
              range.setStart(node, index);
              range.setEnd(node, index + query.length);

              const cfi = item.cfiFromRange(range);
              results.push({
                cfi,
                excerpt: node.textContent.slice(Math.max(0, index - 30), index + query.length + 30)
              });
            }
          }
          await item.unload();
        } catch (e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "debug",
            message: "[ERROR] spineItem: " + e.message
          }));
        }
      }

      if (results.length > 0) {
        await rendition.display(results[0].cfi);
        window.highlightSearchResults(results);
      }

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "searchResults",
        results
      }));
    };

    window.highlightSearchResults = function(results) {
      let count = 0;
      results.forEach(result => {
        try {
          rendition.annotations.highlight(result.cfi, {}, () => {}, "search-highlight");
          count++;
        } catch (e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "debug",
            message: "[SKIPPED] Invalid CFI: " + e.message
          }));
        }
      });

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "debug",
        message: "[✅] Highlighted: " + count + "/" + results.length
      }));
    };

    window.book = book;
    window.rendition = rendition;
    window.currentFontSize = 120;
  </script>
</body>
</html>
`;

    const sendCommand = (cmd: string) => {
        webViewRef.current?.injectJavaScript(`${cmd}; true;`);
    };

    const handleMessage = async (event) => {
        const data = event.nativeEvent.data;

        if (data.startsWith('❌')) {
            Alert.alert('Помилка EPUB', data);
            return;
        }

        try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'preview') {
                setLastPreview(parsed.text);
                if (previewResolver.current) {
                    previewResolver.current(parsed.text);
                    previewResolver.current = null;
                }
                return;
            }


            if (parsed.type === 'progress' || parsed.type === 'init') {
                const { currentLocation, totalLocations } = parsed;
                setCurrentPage(currentLocation);

                const exists = await isBookmarked(book.id, currentLocation);
                setBookmarked(exists);

                if (book?.id && currentLocation) {
                    await updateBookProgress(book.id, currentLocation, totalLocations);
                }
            }

            if (parsed.type === 'searchResults') {
                if (!parsed.results || parsed.results.length === 0) {
                    Alert.alert('Нічого не знайдено');
                } else {
                    setSearchResults(parsed.results);
                    setShowResults(true);
                    webViewRef.current?.injectJavaScript(`
            window.highlightSearchResults(${JSON.stringify(parsed.results)});
            true;
          `);
                }
            }
            if (parsed.type === 'toc') {
                setChapters(parsed.toc);
            }
        } catch (err) {
            console.error('❌ EPUB WebView parse error:', err);
        }
    };

    const toggleBookmark = async () => {
        if (bookmarked) {
            await deleteBookmark(book.id, currentPage);
            setBookmarked(false);
        } else {
            const preview = await getEpubPreview();
            await addBookmark(book.id, currentPage, preview || "…");
            setBookmarked(true);
        }
        await loadBookmarksAndNotes();
    };

    return (
        <View style={{ flex: 1 }}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html }}
                javaScriptEnabled
                style={{ flex: 1 }}
                onMessage={handleMessage}
            />

            <TouchableOpacity
                onPress={toggleBookmark}
                style={styles.bookmarkButton}
            >
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
                }}
            >
                <MaterialIcons name="list" size={28} color="black" />
            </TouchableOpacity>

            <BookmarkNotesModal
                visible={notesModalVisible}
                onClose={() => setNotesModalVisible(false)}
                chapters={chapters}
                bookmarks={bookmarks}
                comments={comments}       // ✅ масив коментарів із useState
                highlights={highlights}   // ✅ масив виділень із useState
                onSelectChapter={(href) => {
                    webViewRef.current?.injectJavaScript(`
      window.rendition.display(${JSON.stringify(href)});
      true;
    `);
                }}
                onDeleteBookmark={async (page) => {
                    await deleteBookmark(book.id, page);
                    await loadBookmarksAndNotes();
                }}
            />
            <TouchableOpacity
                onPress={() => setSettingsVisible(true)}
                style={{
                    position: 'absolute',
                    top: 40,
                    left: 20,
                    backgroundColor: '#fff',
                    borderRadius: 30,
                    padding: 6,
                    elevation: 4,
                    zIndex: 10,
                }}
            >
                <MaterialIcons name="settings" size={28} color="black" />
            </TouchableOpacity>

            <View style={styles.bottomPanel}>
                <View style={styles.searchBar}>
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="🔍 Введіть слово для пошуку"
                        style={styles.input}
                    />
                    <Button
                        title="ЗНАЙТИ"
                        onPress={() => {
                            const queryEscaped = searchQuery.replace(/"/g, '\\"');
                            webViewRef.current?.injectJavaScript(`
            window.searchInBook("${queryEscaped}");
            true;
        `);
                        }}
                    />
                </View>
            </View>

            <Modal visible={showResults} animationType="slide">
                <View style={{ flex: 1, backgroundColor: '#fff' }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 12,
                        borderBottomWidth: 1,
                        borderColor: '#ccc',
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Результати пошуку</Text>
                        <Button title="Закрити" onPress={() => setShowResults(false)} />
                    </View>

                    <FlatList
                        data={searchResults}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item, index }) => {
                            const highlighted = item.excerpt.replace(
                                new RegExp(searchQuery, 'gi'),
                                match => `<mark>${match}</mark>`
                            );
                            return (
                                <TouchableOpacity
                                    onPress={() => {
                                        webViewRef.current?.injectJavaScript(`
                                window.rendition.display(${JSON.stringify(item.cfi)});
                                true;
                            `);
                                        setShowResults(false);
                                    }}
                                    style={{
                                        padding: 12,
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#eee',
                                    }}
                                >
                                    <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
                                        Результат №{index + 1}
                                    </Text>
                                    <WebView
                                        originWhitelist={['*']}
                                        source={{ html: `<div style="padding:8px;font-size:16px;">${highlighted}</div>` }}
                                        style={{ height: 60 }}
                                        scrollEnabled={false}
                                    />
                                </TouchableOpacity>
                            );
                        }}
                    />

                </View>
            </Modal>
            <ReadingSettingsScreen
                visible={settingsVisible}
                onClose={() => setSettingsVisible(false)}
                settings={readerSettings}
                onApply={(newSettings) => {
                    setReaderSettings(newSettings);

                    webViewRef.current?.injectJavaScript(`
      window.rendition.themes.default({
        body: {
          'background': '${newSettings.theme === 'dark' ? '#1c1c1c' : newSettings.theme === 'sepia' ? '#f5ecd9' : '#fff'}',
          'color': '${newSettings.theme === 'dark' ? '#fff' : '#000'}',
          'font-size': '${newSettings.fontSize}px',
          'line-height': '${newSettings.lineHeight}',
        }
      });
      true;
    `);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
        backgroundColor: '#eee',
    },
    bottomPanel: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: '#eee',
        paddingBottom: 10,
        paddingTop: 5,
        zIndex: 1,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        gap: 10,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    resultContainer: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        backgroundColor: '#fdfdfd',
    },
    resultIndex: {
        fontWeight: 'bold',
        marginBottom: 4,
        fontSize: 14,
        color: '#555',
    },
    bookmarkButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 6,
        elevation: 4,
    },
});

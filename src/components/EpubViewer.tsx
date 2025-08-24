import React, { useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { updateBookProgress } from '../utils/database';

interface Props {
    path: string;
    bookId: number;
}

export default function EpubViewer({ path, bookId }: Props) {
    const webViewRef = useRef(null);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script src="https://unpkg.com/epubjs/dist/epub.min.js"></script>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: white; }
    #viewer { height: 100%; }
  </style>
</head>
<body>
  <div id="viewer"></div>
  <script>
    const book = ePub("${path}");
    const rendition = book.renderTo("viewer", {
      width: "100%",
      height: "100%",
      spread: "none"
    });

    book.ready.then(() => book.locations.generate(1600)).then(() => {
      const totalPages = book.locations.length();
      const currentPage = book.rendition.location ?
        book.locations.locationFromCfi(book.rendition.location.start.cfi) : 0;
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'init',
        currentPage,
        totalPages
      }));
    });

    rendition.display();

    rendition.on("relocated", (location) => {
      const totalPages = book.locations.length();
      const currentPage = book.locations.locationFromCfi(location.start.cfi);
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'progress',
        currentPage,
        totalPages
      }));
    });

    window.book = book;
    window.rendition = rendition;
    window.currentFontSize = 100;
  </script>
</body>
</html>
`;

    const handleMessage = (event) => {
        const data = event.nativeEvent.data;
        try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'init' || parsed.type === 'progress') {
                console.log('📘 EPUB Viewer Progress:', parsed);
                if (bookId && parsed.currentPage) {
                    updateBookProgress(bookId, parsed.currentPage, parsed.totalPages);
                }
            }
        } catch (e) {
            console.warn('❌ JSON parse error:', e);
        }
    };

    return (
        <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html }}
            javaScriptEnabled
            style={{ flex: 1 }}
            onMessage={handleMessage}
        />
    );
}

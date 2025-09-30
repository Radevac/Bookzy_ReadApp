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
    
    rendition.on("rendered", (section, view) => {
  const { document, window: iframeWindow } = view.contents;
  if (!document) return;

  const style = document.createElement("style");
  style.innerHTML = "*{ -webkit-user-select:text !important; user-select:text !important; }";
  document.head.appendChild(style);

  const bridge =
    (iframeWindow.parent && iframeWindow.parent.ReactNativeWebView)
      ? iframeWindow.parent.ReactNativeWebView
      : (window.ReactNativeWebView || null); 

  const post = (payload) => {
    try { bridge && bridge.postMessage(JSON.stringify(payload)); } catch (_) {}
  };

  let t;
  document.addEventListener("selectionchange", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const sel = iframeWindow.getSelection();
      if (!sel || !sel.toString().trim()) return;

      try {
        const range = sel.getRangeAt(0);
        const cfi = section.cfiFromRange(range);
        const rect = range.getBoundingClientRect();
        post({
          type: "text-selected",
          text: sel.toString(),
          cfi,
          rect: { x: rect.left, y: rect.top, w: rect.width, h: rect.height }
        });
      } catch (err) {
        post({ type: "debug", message: "selection error: " + err.message });
      }
    }, 50);
  });
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

import React, { useRef } from 'react';
import { WebView } from 'react-native-webview';

interface Props {
    path: string;
    currentPage?: number;
    bookId?: number;
    onMessage?: (event: any) => void;
}

export default function EpubViewer({ path, currentPage = 1, bookId, onMessage }: Props) {
    const webViewRef = useRef(null);

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://unpkg.com/epubjs/dist/epub.min.js"></script>
            <style> html, body { margin: 0; padding: 0; height: 100%; } </style>
        </head>
        <body>
            <div id="viewer" style="height: 100%"></div>
            <script>
                const book = ePub("${path}");
                const rendition = book.renderTo("viewer", {
                    width: "100%", height: "100%", spread: "none"
                });

                let totalPages = 0;
                let locationsReady = false;

                book.ready.then(() => book.locations.generate(1000))
                    .then(() => {
                        totalPages = book.locations.length();
                        locationsReady = true;

                        const percent = (${currentPage} - 1) / totalPages;
                        const cfi = book.locations.cfiFromPercentage(percent);
                        rendition.display(cfi);

                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: "init", currentPage: ${currentPage}, totalPages
                        }));
                    });

                rendition.on("relocated", function(location) {
                    if (!locationsReady) return;

                    const percent = book.locations.percentageFromCfi(location.start.cfi);
                    const pageNum = Math.ceil(percent * totalPages);

                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: "progress",
                        currentPage: pageNum,
                        totalPages
                    }));
                });
            </script>
        </body>
        </html>
    `;

    return (
        <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html }}
            javaScriptEnabled
            style={{ flex: 1 }}
            onMessage={onMessage}
        />
    );
}

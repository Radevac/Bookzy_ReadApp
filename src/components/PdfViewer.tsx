import React, { useRef, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface PdfViewerProps {
    base64: string;
    bookId?: number;
    onMessage?: (event: any) => void;
    currentPage?: number;
}

export default function PdfViewer({ base64, bookId, onMessage, currentPage }: PdfViewerProps) {
    const webViewRef = useRef(null);

    const sanitizedBase64 = useMemo(() => {
        return base64.replace(/^data:application\/pdf;base64,/, '').replace(/\s/g, '');
    }, [base64]);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    html, body {
      margin: 0; padding: 0; height: 100%;
      background: #fff; overflow: hidden;
    }
    #viewer {
      height: 100%;
      overflow-y: scroll;
      -webkit-overflow-scrolling: touch;
    }
    canvas {
      display: block;
      margin: 12px auto;
    }
  </style>
</head>
<body>
  <div id="viewer"></div>
  <script>
    const pdfData = atob("${sanitizedBase64}");
    const viewer = document.getElementById("viewer");
    const startPage = ${currentPage ?? 1};

    let pageOffsets = [];
    let totalPages = 0;
    let renderedCount = 0;

    pdfjsLib.getDocument({ data: pdfData }).promise.then(pdf => {
      totalPages = pdf.numPages;

      const renderPage = (i) => {
        pdf.getPage(i).then(page => {
          const unscaled = page.getViewport({ scale: 1 });
          const scale = window.innerWidth / unscaled.width;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          viewer.appendChild(canvas);
          page.render({ canvasContext: context, viewport }).promise.then(() => {
            pageOffsets[i - 1] = canvas.offsetTop;
            renderedCount++;

            // якщо всі сторінки відрендерені — скролим
            if (renderedCount === totalPages) {
              setTimeout(() => {
                const offset = pageOffsets[startPage - 1] || 0;
                viewer.scrollTop = offset;
              }, 200); // невелика затримка для впевненості
            }

            if (i === 1) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'init',
                currentPage: 1,
                totalPages
              }));
            }
          });
        });
      };

      for (let i = 1; i <= totalPages; i++) {
        renderPage(i);
      }

      viewer.addEventListener('scroll', () => {
        const scrollTop = viewer.scrollTop;
        for (let i = 0; i < totalPages; i++) {
          if (scrollTop < pageOffsets[i] + 20) {
            const currentPage = i + 1;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'progress',
              currentPage,
              totalPages
            }));
            break;
          }
        }
      });
    });
  </script>
</body>
</html>
`;

    return (
        <View style={{ flex: 1 }}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html }}
                javaScriptEnabled
                domStorageEnabled
                style={{ flex: 1 }}
                startInLoadingState
                renderLoading={() => (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" />
                    </View>
                )}
                onMessage={onMessage}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

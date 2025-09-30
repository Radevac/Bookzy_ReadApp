import React, {
    forwardRef,
    useMemo,
    useRef,
    useImperativeHandle,
} from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export interface PdfViewerProps {
    base64: string;
    bookId?: number;
    onMessage?: (event: any) => void;
    currentPage?: number;
    searchTerm: string;
}

export interface PdfViewerHandle {
    injectJavaScript: (script: string) => void;
}

const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(
    ({ base64, onMessage, currentPage, searchTerm }, ref) => {
        const webViewRef = useRef<any>(null);

        const sanitizedBase64 = useMemo(() => {
            return base64
                .replace(/^data:application\/pdf;base64,/, '')
                .replace(/\s/g, '');
        }, [base64]);

        useImperativeHandle(ref, () => ({
            injectJavaScript: (script: string) => {
                webViewRef.current?.injectJavaScript(script);
            },
        }));

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf_viewer.min.css" />
  <style>
    html, body {
      margin: 0; padding: 0; height: 100%;
      background: #fff; overflow: hidden;
       -webkit-user-select: text; //
        user-select: text; //
    }
    #viewer {
      height: 100%;
      overflow-y: scroll;
      -webkit-overflow-scrolling: touch;
      position: relative;
    }
    canvas {
      display: block;
      margin: 12px auto;
    }
    .textLayer {
      font-family: sans-serif;
  font-size: 1em;
  line-height: 1.4;
  position: absolute;
  top: 0; left: 0;
  right: 0; bottom: 0;
  pointer-events: auto;   //
  user-select: text;      //
  -webkit-user-select: text;
  z-index: 2;
    }
    .textLayer span {
  -webkit-user-select: text;
  user-select: text;
}
::selection {
  background: transparent; 
}
  </style>
</head>
<body>
  <div id="viewer"></div>
  <script>
    const pdfData = atob("${sanitizedBase64}");
    const viewer = document.getElementById("viewer");
    const startPage = ${currentPage ?? 1};
    const searchTerm = ${JSON.stringify(searchTerm)};
    
    let pageOffsets = [];
    let totalPages = 0;
    let renderedCount = 0;
    let globalScale = 1;

    const highlightText = (textLayerDiv, term) => {
      const spans = textLayerDiv.querySelectorAll("span");
      spans.forEach(span => {
        if (span.textContent.toLowerCase().includes(term.toLowerCase())) {
          span.style.backgroundColor = "yellow";
        }
      });
    };

    const renderPage = (i, scale = 1) => {
      pdf.getPage(i).then(page => {
        const unscaled = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (window.innerWidth / unscaled.width) * scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.marginBottom = "16px";
        wrapper.appendChild(canvas);
        viewer.appendChild(wrapper);

        page.render({ canvasContext: context, viewport }).promise.then(() => {
          pageOffsets[i - 1] = wrapper.offsetTop;
          renderedCount++;

          page.getTextContent().then(textContent => {
            const textLayerDiv = document.createElement("div");
            textLayerDiv.className = "textLayer";
            textLayerDiv.style.height = canvas.height + "px";
            textLayerDiv.style.width = canvas.width + "px";
            wrapper.appendChild(textLayerDiv);

            pdfjsLib.renderTextLayer({
              textContent,
              container: textLayerDiv,
              viewport,
              textDivs: [],
            }).promise.then(() => {
              if (searchTerm) {
                highlightText(textLayerDiv, searchTerm);
              }
            });
          });

          if (renderedCount === totalPages) {
            setTimeout(() => {
              const offset = pageOffsets[startPage - 1] || 0;
              viewer.scrollTop = offset;
            }, 200);
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

    let pdf;
    pdfjsLib.getDocument({ data: pdfData }).promise.then(doc => {
      pdf = doc;
      totalPages = pdf.numPages;

      for (let i = 1; i <= totalPages; i++) {
        renderPage(i, globalScale);
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

    window.changeTheme = function(theme) {
      if (theme === "dark") {
        viewer.style.background = "#1c1c1c";
        document.body.style.filter = "invert(1) hue-rotate(180deg)";
      } else if (theme === "sepia") {
        viewer.style.background = "#f5ecd9";
        document.body.style.filter = "none";
      } else {
        viewer.style.background = "#fff";
        document.body.style.filter = "none";
      }
    };

    window.changeZoom = function(scale) {
      globalScale = scale;
      viewer.innerHTML = "";
      renderedCount = 0;
      for (let i = 1; i <= totalPages; i++) {
        renderPage(i, globalScale);
      }
    };

    window.changeLineHeight = function(lh) {
      const spans = document.querySelectorAll('.textLayer span');
      spans.forEach(s => { s.style.lineHeight = lh; });
    };
    
//     document.addEventListener("mouseup", () => {
//   const selection = window.getSelection();
//   if (selection && selection.toString().trim().length > 0) {
//     window.ReactNativeWebView.postMessage(JSON.stringify({
//       type: "text-selected",
//       text: selection.toString()
//     }));
//   }
// });
document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  if (selection && selection.toString().trim().length > 0) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: "text-selected",
      text: selection.toString()
    }));
  }
});
// document.addEventListener("selectionchange", () => {
//   const sel = window.getSelection();
//   if (sel && sel.toString().length > 0) {
//     const text = sel.toString();
//     sel.removeAllRanges();
//
//     window.ReactNativeWebView.postMessage(JSON.stringify({
//       type: "text-selected",
//       text
//     }));
//   }
// });
 window.searchInPdf = function(query) {
      const results = [];
      const spans = document.querySelectorAll('.textLayer span');
      spans.forEach((span, index) => {
        const text = span.textContent || "";
        const lower = text.toLowerCase();
        const q = query.toLowerCase();
        const pos = lower.indexOf(q);
        if (pos !== -1) {
          const excerpt = text.slice(Math.max(0, pos - 30), pos + q.length + 30);
          results.push({
            index,
            excerpt
          });
          span.style.backgroundColor = "yellow";
        }
      });

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "searchResults",
        results
      }));
    };

    window.scrollToResult = function(index) {
      const spans = document.querySelectorAll('.textLayer span');
      if (spans[index]) {
        spans[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
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
);

export default PdfViewer;

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

import React, { useState, useMemo } from 'react';
import { WebView } from 'react-native-webview';
import { View, ActivityIndicator, StyleSheet, Button, Text } from 'react-native';

interface PdfViewerProps {
    base64: string;
}

export default function PdfViewer({ base64 }: PdfViewerProps) {
    const [page, setPage] = useState(1);

    const sanitizedBase64 = useMemo(() => {
        return base64.replace(/^data:application\/pdf;base64,/, '').replace(/\s/g, '');
    }, [base64]);

    const html = useMemo(() => `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
            <style>
                body, html { margin: 0; padding: 0; height: 100%; }
                #controls { position: fixed; top: 0; left: 0; right: 0; background: #eee; padding: 8px; text-align: center; z-index: 1; }
                canvas { margin-top: 50px; display: block; margin-left: auto; margin-right: auto; }
            </style>
        </head>
        <body>
            <div id="controls">
                <button onclick="prevPage()">← Назад</button>
                <span id="page-num">Сторінка</span>
                <button onclick="nextPage()">Далі →</button>
            </div>
            <canvas id="pdf-canvas"></canvas>

            <script>
                const pdfData = atob("${sanitizedBase64}");
                let currentPage = ${page};
                let pdf = null;

                function renderPage(num) {
                    pdf.getPage(num).then(page => {
                        const scale = 1.5;
                        const viewport = page.getViewport({ scale });
                        const canvas = document.getElementById('pdf-canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        page.render({ canvasContext: context, viewport });
                        document.getElementById('page-num').innerText = "Сторінка " + num + " з " + pdf.numPages;
                    });
                }

                function prevPage() {
                    if (currentPage <= 1) return;
                    currentPage--;
                    renderPage(currentPage);
                }

                function nextPage() {
                    if (currentPage >= pdf.numPages) return;
                    currentPage++;
                    renderPage(currentPage);
                }

                pdfjsLib.getDocument({ data: pdfData }).promise.then(loadedPdf => {
                    pdf = loadedPdf;
                    renderPage(currentPage);
                });
            </script>
        </body>
        </html>
    `, [sanitizedBase64, page]);

    return (
        <View style={{ flex: 1 }}>
            <WebView
                originWhitelist={['*']}
                source={{ html }}
                javaScriptEnabled
                domStorageEnabled
                style={{ flex: 1 }}
                startInLoadingState
                renderLoading={() => (
                    <View style={styles.center}><ActivityIndicator size="large" /></View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

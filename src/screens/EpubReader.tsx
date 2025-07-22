import React, { useRef } from 'react';
import { View, Button, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';

export default function EpubReader({ route }) {
    const { book } = route.params;
    const webViewRef = useRef(null);

    const base64 = book.base64.replace(/^data:application\/epub\+zip;base64,/, '');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://unpkg.com/epubjs/dist/epub.min.js"></script>
    <style>
        html, body {
            margin: 0; padding: 0; height: 100%; background: white;
        }
        #viewer {
            height: 100%;
        }
    </style>
</head>
<body>
    <div id="viewer"></div>
    <script>
        window.onerror = function(message, source, lineno, colno, error) {
            window.ReactNativeWebView.postMessage("❌ ERROR: " + message + "\\n" + (error?.stack || ""));
        };

        try {
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
                spread: "none" 
            });

            rendition.themes.default({
                body: {
                    "font-size": "120%",
                    "line-height": "1.6",
                    "text-align": "justify",
                    "padding": "1em",
                    "margin": "0 auto",
                    "max-width": "95%",
                },
                img: {
                    "max-width": "100%",
                    "height": "auto",
                    "display": "block",
                    "margin": "1em auto"
                }
            });

            window.book = book;
            window.rendition = rendition;
            window.currentFontSize = 120;

            rendition.display();
        } catch (e) {
            window.ReactNativeWebView.postMessage("❌ JS Exception: " + e.message);
        }
    </script>
</body>
</html>
`;

    const sendCommand = (cmd: string) => {
        webViewRef.current?.injectJavaScript(`${cmd}; true;`);
    };

    sendCommand(`
    window.currentFontSize += 20;
    window.rendition.themes.fontSize(window.currentFontSize + '%');
`);

    sendCommand(`
    window.currentFontSize = Math.max(80, window.currentFontSize - 20);
    window.rendition.themes.fontSize(window.currentFontSize + '%');
`);

    const handleLog = (event) => {
        console.log('📩 WebView message:', event.nativeEvent.data);
        if (event.nativeEvent.data.startsWith('❌')) {
            Alert.alert('Помилка EPUB', event.nativeEvent.data);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html }}
                javaScriptEnabled
                style={{ flex: 1 }}
                onMessage={handleLog}
            />
            <View style={styles.controls}>
                <Button title="⬅️ Назад" onPress={() => sendCommand('window.rendition.prev()')} />
                <Button title="➡️ Вперед" onPress={() => sendCommand('window.rendition.next()')} />
                <Button title="🔎+" onPress={() => sendCommand(`window.rendition.themes.fontSize('140%')`)} />
                <Button title="🔎−" onPress={() => sendCommand(`window.rendition.themes.fontSize('100%')`)} />
            </View>
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
});

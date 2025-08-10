import React, { useRef } from 'react';
import { View, Button, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';

export default function EpubReader({ route }) {
    const { book } = route.params;
    const webViewRef = useRef(null);

    const base64 = book.base64.replace(/^data:application\/epub\+zip;base64,/, '');
    const currentPage = book.currentPage ?? 0;

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

        let totalLocations = 0;
        let currentLocation = 0;
        const savedLocation = ${currentPage};

        book.ready.then(() => {
            return book.locations.generate(1600);
        }).then(() => {
            totalLocations = book.locations.length();

            // відновлення позиції
            if (savedLocation > 0 && totalLocations > 0) {
                const cfi = book.locations.cfiFromLocation(savedLocation);
                rendition.display(cfi);
            } else {
                rendition.display();
            }

            rendition.on("relocated", (location) => {
                currentLocation = book.locations.locationFromCfi(location.start.cfi);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'progress',
                    currentLocation,
                    totalLocations
                }));
            });

            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'init',
                currentLocation: savedLocation,
                totalLocations
            }));
        });

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
            if (parsed.type === 'progress' || parsed.type === 'init') {
                console.log(`📚 EPUB Прогрес: ${parsed.currentLocation} / ${parsed.totalLocations}`);
                // виклик updateBookProgress тут, або передай в onMessage
            }
        } catch (err) {
            console.error('❌ EPUB WebView parse error:', err);
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
                onMessage={handleMessage}
            />
            <View style={styles.controls}>
                <Button title="⬅️ Назад" onPress={() => sendCommand('window.rendition.prev()')} />
                <Button title="➡️ Вперед" onPress={() => sendCommand('window.rendition.next()')} />
                <Button title="🔎+" onPress={() => sendCommand('window.currentFontSize += 20; window.rendition.themes.fontSize(window.currentFontSize + "%")')} />
                <Button title="🔎−" onPress={() => sendCommand('window.currentFontSize = Math.max(80, window.currentFontSize - 20); window.rendition.themes.fontSize(window.currentFontSize + "%")')} />
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

import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';

export default function ReadingSettingsScreen({ visible, onClose, onApply, settings }) {
    const [theme, setTheme] = useState(settings.theme || 'light');
    const [fontSize, setFontSize] = useState(settings.fontSize || 16);
    const [lineHeight, setLineHeight] = useState(settings.lineHeight || 1.6);

    const applyChanges = () => {
        onApply({ theme, fontSize, lineHeight });
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.title}>Налаштування читання</Text>

                    <Text style={styles.label}>Тема</Text>
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[styles.colorBox, { backgroundColor: '#fff' }, theme === 'light' && styles.active]}
                            onPress={() => setTheme('light')}
                        />
                        <TouchableOpacity
                            style={[styles.colorBox, { backgroundColor: '#f5ecd9' }, theme === 'sepia' && styles.active]}
                            onPress={() => setTheme('sepia')}
                        />
                        <TouchableOpacity
                            style={[styles.colorBox, { backgroundColor: '#1c1c1c' }, theme === 'dark' && styles.active]}
                            onPress={() => setTheme('dark')}
                        />
                    </View>

                    <Text style={styles.label}>Розмір шрифту: {fontSize}</Text>
                    <Slider
                        minimumValue={12}
                        maximumValue={28}
                        step={1}
                        value={fontSize}
                        onValueChange={setFontSize}
                    />

                    <Text style={styles.label}>Міжрядковий інтервал</Text>
                    <Picker selectedValue={lineHeight} onValueChange={setLineHeight}>
                        <Picker.Item label="Звичайний" value={1.6} />
                        <Picker.Item label="Тісний" value={1.2} />
                        <Picker.Item label="Вільний" value={2.0} />
                    </Picker>


                    <View style={styles.row}>
                        <TouchableOpacity onPress={onClose} style={styles.cancel}>
                            <Text>Скасувати</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={applyChanges} style={styles.apply}>
                            <Text style={{ color: '#fff' }}>Застосувати</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    label: {
        fontWeight: 'bold',
        marginTop: 12,
    },
    row: {
        flexDirection: 'row',
        marginTop: 8,
        alignItems: 'center',
    },
    colorBox: {
        width: 40,
        height: 40,
        marginRight: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    active: {
        borderColor: 'green',
        borderWidth: 2,
    },
    cancel: {
        marginRight: 16,
    },
    apply: {
        backgroundColor: 'green',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
});

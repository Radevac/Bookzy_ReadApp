import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

interface Props {
    visible: boolean;
    onClose: () => void;
    onSave: (text: string) => void;
}

export default function CommentInputModal({ visible, onClose, onSave }: Props) {
    const [text, setText] = useState("");

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Примітка</Text>
                    <TextInput
                        style={styles.input}
                        value={text}
                        onChangeText={setText}
                        placeholder="Введіть свій коментар"
                        multiline
                    />

                    <View style={styles.actions}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.cancel}>Скасувати</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                if (text.trim()) {
                                    onSave(text.trim());
                                    setText("");
                                    onClose();
                                }
                            }}
                        >
                            <Text style={styles.ok}>OK</Text>
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
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: "80%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
    },
    title: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 6,
        padding: 8,
        minHeight: 60,
        marginBottom: 16,
    },
    actions: { flexDirection: "row", justifyContent: "space-between" },
    cancel: { color: "red", fontSize: 16 },
    ok: { color: "green", fontSize: 16 },
});

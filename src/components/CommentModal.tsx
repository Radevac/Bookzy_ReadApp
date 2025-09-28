import React, { useState } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from "react-native";

interface Props {
    visible: boolean;
    onClose: () => void;
    onSave: (comment: string) => void;
}

export default function CommentModal({ visible, onClose, onSave }: Props) {
    const [comment, setComment] = useState("");

    const handleSave = () => {
        if (comment.trim().length > 0) {
            onSave(comment);
            setComment("");
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Примітка</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Введіть свою примітку"
                        value={comment}
                        onChangeText={setComment}
                        multiline
                    />
                    <View style={styles.row}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={{ color: "red" }}>Скасувати</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.okBtn} onPress={handleSave}>
                            <Text style={{ color: "green", fontWeight: "bold" }}>OK</Text>
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
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: "85%",
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 16,
    },
    title: {
        fontSize: 16,
        marginBottom: 10,
        fontWeight: "bold",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 6,
        padding: 10,
        minHeight: 60,
        textAlignVertical: "top",
        marginBottom: 12,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cancelBtn: {
        padding: 10,
    },
    okBtn: {
        padding: 10,
    },
});

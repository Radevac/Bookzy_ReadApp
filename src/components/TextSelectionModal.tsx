import React from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface Props {
    visible: boolean;
    onClose: () => void;
    text: string | null;
    onAddComment: () => void;
    onHighlight: (color: string) => void;
    onCopy: () => void;
    onDelete: () => void;
}

export default function TextSelectionModal({
                                               visible,
                                               onClose,
                                               text,
                                               onAddComment,
                                               onHighlight,
                                               onCopy,
                                               onDelete,
                                           }: Props) {
    if (!text) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>

                    <Text style={styles.selectedText} numberOfLines={3}>
                        {text}
                    </Text>

                    <View style={styles.colorsRow}>
                        {["yellow", "green", "pink"].map((c) => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.colorCircle, { backgroundColor: c }]}
                                onPress={() => onHighlight(c)}
                            />
                        ))}
                    </View>

                    <View style={styles.actionsRow}>
                        <TouchableOpacity onPress={onAddComment} style={styles.iconBtn}>
                            <MaterialIcons name="comment" size={26} color="#333" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onCopy} style={styles.iconBtn}>
                            <MaterialIcons name="content-copy" size={26} color="#333" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
                            <MaterialIcons name="delete" size={26} color="red" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Text style={{ color: "red", fontWeight: "bold" }}>Закрити</Text>
                    </TouchableOpacity>
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
        width: "90%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
    },
    selectedText: {
        fontSize: 14,
        color: "#333",
        marginBottom: 12,
    },
    colorsRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 16,
    },
    colorCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginHorizontal: 6,
        borderWidth: 1,
        borderColor: "#ccc",
    },
    actionsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 16,
    },
    iconBtn: {
        padding: 8,
    },
    closeBtn: {
        alignSelf: "center",
        marginTop: 10,
    },
});

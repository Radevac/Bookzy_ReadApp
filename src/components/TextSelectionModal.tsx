import React from "react";
import {
    Modal,
    View,
    TouchableOpacity,
    StyleSheet,
    Image,
    TouchableWithoutFeedback,
} from "react-native";

const translateIcon = require("../ assets/img/Translate.png");
const underlineIcon = require("../ assets/img/Ico.png");
const copyIcon = require("../ assets/img/Copy.png");
const commentIcon = require("../ assets/img/Comment.png");
const colorWheelIcon = require("../ assets/img/Color_RGB.png");

interface Props {
    visible: boolean;
    onClose: () => void;
    onAddComment: () => void;
    onHighlight: (color: string) => void;
    onCopy: () => void;
    onDelete: () => void;
}

export default function TextSelectionModal({
                                               visible,
                                               onClose,
                                               onAddComment,
                                               onHighlight,
                                               onCopy,
                                               onDelete,
                                           }: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.toolbar}>
                            {/* 🎨 Кольори */}
                            <TouchableOpacity style={styles.button} onPress={() => onHighlight("green")}>
                                <View style={[styles.colorCircle, { backgroundColor: "green" }]} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.button} onPress={() => onHighlight("red")}>
                                <View style={[styles.colorCircle, { backgroundColor: "red" }]} />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onDelete}>
                                <Image source={colorWheelIcon} style={styles.icon} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.button} onPress={onDelete}>
                                <Image source={underlineIcon} style={styles.icon} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.button} onPress={onClose}>
                                <Image source={translateIcon} style={styles.icon} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.button} onPress={onAddComment}>
                                <Image source={commentIcon} style={styles.icon} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.button} onPress={onCopy}>
                                <Image source={copyIcon} style={styles.icon} />
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    toolbar: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        elevation: 5, // Android тінь
        shadowColor: "#000", // iOS тінь
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        alignItems: "center",
    },
    button: {
        padding: 6,
        marginHorizontal: 4,
        borderRadius: 8,
    },
    icon: {
        width: 26,
        height: 26,
        resizeMode: "contain",
    },
    colorCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: "#ccc",
    },
});

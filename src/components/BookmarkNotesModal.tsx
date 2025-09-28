import React, { useState } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
} from "react-native";

interface Props {
    visible: boolean;
    onClose: () => void;
    chapters: any[];
    bookmarks: any[];
    comments: any[];
    highlights: any[];
    onSelectChapter: (href: string) => void;
    onDeleteBookmark: (page: number) => void;
}


export default function BookmarkNotesModal({
                                               visible,
                                               onClose,
                                               chapters = [],
                                               bookmarks = [],
                                               comments = [],
                                               highlights = [],
                                               onSelectChapter,
                                               onDeleteBookmark,
                                           }: Props) {
    const [activeTab, setActiveTab] = useState<"chapters" | "bookmarks">(
        "chapters"
    );

    const combinedData = [
        ...(bookmarks || []).map(b => ({ ...b, type: "bookmark" })),
        ...(comments || []).map(c => ({ ...c, type: "comment" })),
        ...(highlights || []).map(h => ({ ...h, type: "highlight" })),
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            {activeTab === "chapters" ? "Розділи" : "Закладки"}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeBtn}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tabs}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === "chapters" && styles.activeTab]}
                            onPress={() => setActiveTab("chapters")}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "chapters" && styles.activeTabText,
                                ]}
                            >
                                Розділи
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tab, activeTab === "bookmarks" && styles.activeTab]}
                            onPress={() => setActiveTab("bookmarks")}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "bookmarks" && styles.activeTabText,
                                ]}
                            >
                                Закладки
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {activeTab === "chapters" ? (
                        chapters.length > 0 ? (
                            <FlatList
                                data={chapters}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        style={styles.item}
                                        onPress={() => {
                                            onSelectChapter(item.href);
                                            onClose();
                                        }}
                                    >
                                        <Text style={styles.itemText}>
                                            {index + 1}. {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        ) : (
                            <Text style={styles.emptyText}>Немає розділів</Text>
                        )
                    ) : (bookmarks.length > 0 || comments.length > 0 || highlights.length > 0) ? (
                        <FlatList
                            data={combinedData}
                            keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
                            renderItem={({ item }) => (
                                <View style={styles.itemRow}>
                                    <View style={{ flex: 1, paddingRight: 8 }}>
                                        <Text style={styles.itemTitle}>
                                            {item.type === "bookmark"
                                                ? ""
                                                : item.type === "comment"
                                                    ? "Коментар"
                                                    : "Виділення"}
                                        </Text>

                                        {item.type === "bookmark" && (
                                            <>
                                                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                                    <Text style={styles.itemTitle}>Закладка</Text>
                                                    <Text style={[styles.itemText, { color: "#555" }]}>Ст {item.page}</Text>
                                                </View>
                                                <Text numberOfLines={2} style={{ color: "#666", marginTop: 2 }}>
                                                    {item.preview?.trim() || "…"}
                                                </Text>
                                            </>
                                        )}

                                        {item.type === "comment" && (
                                            <>
                                                {/*<Text style={styles.itemText}> {item.page}</Text>*/}
                                                <Text numberOfLines={2} style={styles.commentText}>
                                                    {item.comment}
                                                </Text>
                                            </>
                                        )}

                                        {item.type === "highlight" && (
                                            <>
                                                <Text style={styles.itemText}>Сторінка {item.page}</Text>
                                                <Text numberOfLines={2} style={{ color: item.color || "green" }}>
                                                    {item.selectedText}
                                                </Text>
                                            </>
                                        )}
                                    </View>
                                </View>
                            )}
                        />
                    ) : (
                        <Text style={styles.emptyText}>Закладок поки що немає</Text>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-start",
        alignItems: "flex-start",
    },
    container: {
        width: "80%",
        height: "100%",
        backgroundColor: "#fff",
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        padding: 16,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    closeBtn: {
        fontSize: 22,
        color: "red",
    },
    tabs: {
        flexDirection: "row",
        marginBottom: 12,
    },
    tab: {
        flex: 1,
        padding: 10,
        alignItems: "center",
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    activeTab: {
        borderBottomColor: "green",
    },
    tabText: {
        fontSize: 16,
        color: "#555",
    },
    activeTabText: {
        color: "green",
        fontWeight: "bold",
    },
    item: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    itemText: {
        fontSize: 15,
    },
    deleteText: {
        color: "red",
    },
    emptyText: {
        marginTop: 20,
        textAlign: "center",
        color: "#777",
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "green",
    },
    commentText: {
        marginTop: 4,
        fontSize: 13,
        color: "#444",
        fontStyle: "italic",
    },
});

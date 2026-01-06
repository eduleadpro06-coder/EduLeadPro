import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const colors = {
    primary: '#2D7A5F',
    white: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',
    background: '#F0FDF4',
    border: '#E5E7EB',
    inputBg: '#F3F4F6'
};

const chats = [
    {
        id: 1,
        name: 'Class Teacher (Ms. Priya)',
        role: 'Academic',
        lastMsg: 'Please submit the assignment by tomorrow.',
        time: '10:30 AM',
        unread: 2,
        online: true,
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
        id: 2,
        name: 'School Admin',
        role: 'Administration',
        lastMsg: 'Fee receipt generated for March 2026.',
        time: 'Yesterday',
        unread: 0,
        online: false,
        avatar: 'https://ui-avatars.com/api/?name=School+Admin&background=2D7A5F&color=fff'
    },
    {
        id: 3,
        name: 'Transport Coordinator',
        role: 'Transport',
        lastMsg: 'Bus #12 will be 10 mins late today due to traffic.',
        time: 'Yesterday',
        unread: 0,
        online: true,
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    }
];

export default function MessagesScreen() {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity style={styles.composeBtn}>
                    <Feather name="edit" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={20} color={colors.textLight} />
                    <TextInput
                        placeholder="Search messages..."
                        placeholderTextColor={colors.textLight}
                        style={styles.input}
                    />
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {chats.map((chat) => (
                    <TouchableOpacity key={chat.id} style={styles.chatItem}>
                        <View style={styles.avatarContainer}>
                            <Image source={{ uri: chat.avatar }} style={styles.avatar} />
                            {chat.online && <View style={styles.onlineDot} />}
                        </View>

                        <View style={styles.chatInfo}>
                            <View style={styles.chatHeader}>
                                <Text style={styles.name}>{chat.name}</Text>
                                <Text style={[styles.time, chat.unread > 0 && styles.timeActive]}>{chat.time}</Text>
                            </View>
                            <View style={styles.chatFooter}>
                                <Text style={[styles.msg, chat.unread > 0 && styles.msgActive]} numberOfLines={1}>
                                    {chat.lastMsg}
                                </Text>
                                {chat.unread > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{chat.unread}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                <Text style={styles.footerText}>Start a conversation with teachers or admin directly.</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' }, // White bg for chat list
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
    composeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },

    searchContainer: { paddingHorizontal: 20, paddingBottom: 20 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, height: 48, borderRadius: 12, paddingHorizontal: 16 },
    input: { flex: 1, marginLeft: 10, fontSize: 16, color: colors.textPrimary },

    content: { flex: 1 },
    chatItem: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    avatarContainer: { position: 'relative', marginRight: 16 },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E5E7EB' },
    onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2, borderColor: 'white' },

    chatInfo: { flex: 1, justifyContent: 'center' },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    name: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
    time: { fontSize: 12, color: colors.textLight },
    timeActive: { color: colors.primary, fontWeight: '600' },

    chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    msg: { fontSize: 14, color: colors.textSecondary, flex: 1, marginRight: 16 },
    msgActive: { color: colors.textPrimary, fontWeight: '500' },
    badge: { backgroundColor: colors.primary, height: 20, minWidth: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    badgeText: { color: 'white', fontSize: 11, fontWeight: 'bold' },

    footerText: { textAlign: 'center', color: colors.textLight, marginTop: 40, fontSize: 13 },
});

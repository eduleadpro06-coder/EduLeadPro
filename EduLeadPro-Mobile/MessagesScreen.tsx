import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from './src/theme';
import PremiumCard from './src/components/ui/PremiumCard';
import type { Announcement } from './services/api';

interface NotificationsScreenProps {
    announcements: Announcement[];
}

export default function MessagesScreen({ announcements }: NotificationsScreenProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredAnnouncements = announcements.filter(ann =>
        ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={20} color={colors.textTertiary} />
                    <TextInput
                        placeholder="Search notifications..."
                        placeholderTextColor={colors.textTertiary}
                        style={styles.input}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {filteredAnnouncements.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.iconCircle}>
                            <Feather name="bell" size={40} color={colors.textTertiary} />
                        </View>
                        <Text style={styles.emptyTitle}>No notifications yet</Text>
                        <Text style={styles.emptyText}>Important alerts and school updates will appear here.</Text>
                    </View>
                ) : (
                    filteredAnnouncements.map((ann) => (
                        <PremiumCard
                            key={ann.id}
                            style={[
                                styles.notifCard,
                                ann.priority === 'high' ? styles.urgentCard : {}
                            ] as any}
                        >
                            <View style={styles.cardHeader}>
                                {ann.priority === 'high' && (
                                    <View style={styles.urgentBadge}>
                                        <Feather name="alert-circle" size={12} color={colors.danger} />
                                        <Text style={styles.urgentText}>URGENT</Text>
                                    </View>
                                )}
                                <Text style={styles.dateText}>{new Date(ann.publishedAt).toLocaleDateString()}</Text>
                            </View>
                            <Text style={styles.notifTitle}>{ann.title}</Text>
                            <Text style={styles.notifContent}>{ann.content}</Text>
                        </PremiumCard>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md },
    headerTitle: { ...typography.h2 },

    searchContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: colors.border },
    input: { flex: 1, marginLeft: 10, ...typography.body },

    scrollContent: { padding: spacing.lg, paddingBottom: 100 },
    notifCard: { marginBottom: spacing.md, backgroundColor: colors.surface },
    urgentCard: { borderLeftWidth: 4, borderLeftColor: colors.danger },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    urgentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.danger + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    urgentText: { fontSize: 10, fontWeight: '700', color: colors.danger, marginLeft: 4 },
    dateText: { fontSize: 12, color: colors.textTertiary },

    notifTitle: { ...typography.h3, fontSize: 16, marginBottom: 4 },
    notifContent: { ...typography.body, color: colors.textSecondary, fontSize: 14, lineHeight: 20 },

    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    emptyTitle: { ...typography.h3, marginBottom: spacing.sm, color: colors.textPrimary },
    emptyText: { ...typography.body, textAlign: 'center', color: colors.textSecondary },
});

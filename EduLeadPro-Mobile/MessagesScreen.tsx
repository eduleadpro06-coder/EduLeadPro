import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography } from './src/theme';
import PremiumCard from './src/components/ui/PremiumCard';

export default function MessagesScreen() {
    // In future this will fetch from api.getMessages()
    const [loading, setLoading] = useState(false);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity style={styles.composeBtn}>
                    <Feather name="edit" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={20} color={colors.textTertiary} />
                    <TextInput
                        placeholder="Search messages..."
                        placeholderTextColor={colors.textTertiary}
                        style={styles.input}
                    />
                </View>
            </View>

            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                    <View style={styles.emptyState}>
                        <View style={styles.iconCircle}>
                            <Feather name="message-square" size={40} color={colors.textTertiary} />
                        </View>
                        <Text style={styles.emptyTitle}>No messages yet</Text>
                        <Text style={styles.emptyText}>Conversations with teachers and admins will appear here.</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md },
    headerTitle: { ...typography.h2 },
    composeBtn: { padding: 8, backgroundColor: colors.surfaceHighlight, borderRadius: 20 },

    searchContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: colors.border },
    input: { flex: 1, marginLeft: 10, ...typography.body },

    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
    emptyState: { alignItems: 'center' },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    emptyTitle: { ...typography.h3, marginBottom: spacing.sm, color: colors.textPrimary },
    emptyText: { ...typography.body, textAlign: 'center', color: colors.textSecondary },
});

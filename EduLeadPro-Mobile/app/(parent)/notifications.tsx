import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import { useAuthStore } from '../../src/store/authStore';
import { useNotificationStore } from '../../src/store/notificationStore';
import { colors, spacing, typography, shadows } from '../../src/theme';
import PremiumCard from '../../src/components/ui/PremiumCard';

export default function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const { setHasUnread } = useNotificationStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notices, setNotices] = useState<any[]>([]);

    async function fetchNotifications() {
        try {
            const orgId = (user as any)?.organization_id || (user as any)?.organizationId;
            if (orgId) {
                const data = await api.getAnnouncements(orgId);
                setNotices(data);
            }
        } catch (error) {
            console.error('Fetch notifications error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        setHasUnread(false);
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : notices.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Feather name="bell-off" size={40} color={colors.textTertiary} />
                        </View>
                        <Text style={styles.emptyTitle}>No Notifications Yet</Text>
                        <Text style={styles.emptySubtitle}>
                            We'll notify you when there's an update from school.
                        </Text>
                    </View>
                ) : (
                    notices.map((notice) => (
                        <PremiumCard key={notice.id} style={styles.noticeCard}>
                            <View style={styles.noticeHeader}>
                                <View style={[
                                    styles.priorityBadge,
                                    { backgroundColor: notice.priority === 'high' ? colors.danger + '20' : colors.primary + '20' }
                                ]}>
                                    <View style={[
                                        styles.priorityDot,
                                        { backgroundColor: notice.priority === 'high' ? colors.danger : colors.primary }
                                    ]} />
                                    <Text style={[
                                        styles.priorityText,
                                        { color: notice.priority === 'high' ? colors.danger : colors.primary }
                                    ]}>
                                        {notice.priority === 'high' ? 'URGENT' : 'ANNOUNCEMENT'}
                                    </Text>
                                </View>
                                <Text style={styles.dateText}>
                                    {new Date(notice.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </Text>
                            </View>
                            <Text style={styles.noticeTitle}>{notice.title}</Text>
                            <Text style={styles.noticeContent}>{notice.content}</Text>
                        </PremiumCard>
                    ))
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerButton: {
        padding: 8,
        marginRight: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.lg,
    },
    center: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    emptySubtitle: {
        ...typography.body,
        color: colors.textTertiary,
        textAlign: 'center',
        lineHeight: 20,
    },
    noticeCard: {
        marginBottom: spacing.md,
        borderRadius: 20,
        padding: 20,
    },
    noticeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priorityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    dateText: {
        fontSize: 12,
        color: colors.textTertiary,
    },
    noticeTitle: {
        ...typography.body,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 6,
    },
    noticeContent: {
        ...typography.caption,
        color: colors.textSecondary,
        lineHeight: 18,
    },
});

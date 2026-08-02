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
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing, typography, shadows } from '../../src/theme';
import PremiumCard from '../../src/components/ui/PremiumCard';
import teacherAPI from '../../src/services/api/teacher.api';

export default function TeacherNotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    async function fetchNotifications() {
        try {
            const data = await teacherAPI.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Fetch teacher notifications error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
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
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Feather name="arrow-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Notifications</Text>
                </View>
                <View style={{ width: 44 }} />
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
                ) : notifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Feather name="bell-off" size={40} color={colors.textTertiary} />
                        </View>
                        <Text style={styles.emptyTitle}>No Notifications Yet</Text>
                        <Text style={styles.emptySubtitle}>
                            You will receive a notification when your salary is credited or other updates are posted.
                        </Text>
                    </View>
                ) : (
                    notifications.map((notif) => (
                        <PremiumCard key={notif.id} style={styles.noticeCard}>
                            <View style={styles.noticeHeader}>
                                <View style={[
                                    styles.priorityBadge,
                                    { backgroundColor: notif.notification_type === 'salary' ? colors.success + '20' : colors.primary + '20' }
                                ]}>
                                    <View style={[
                                        styles.priorityDot,
                                        { backgroundColor: notif.notification_type === 'salary' ? colors.success : colors.primary }
                                    ]} />
                                    <Text style={[
                                        styles.priorityText,
                                        { color: notif.notification_type === 'salary' ? colors.success : colors.primary }
                                    ]}>
                                        {notif.notification_type ? notif.notification_type.toUpperCase() : 'NOTIFICATION'}
                                    </Text>
                                </View>
                                <Text style={styles.dateText}>
                                    {new Date(notif.sent_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                            <Text style={styles.noticeTitle}>{notif.title}</Text>
                            <Text style={styles.noticeContent}>{notif.body}</Text>
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
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_Bold',
        color: '#1F2937',
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
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_Bold',
        color: '#374151',
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        fontSize: 14,
        fontFamily: 'Inter_Regular',
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
        lineHeight: 20,
    },
    noticeCard: {
        marginBottom: spacing.md,
        padding: spacing.lg,
        borderRadius: 16,
    },
    noticeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
    },
    priorityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    priorityText: {
        fontSize: 10,
        fontFamily: 'Outfit_Bold',
        letterSpacing: 0.5,
    },
    dateText: {
        fontSize: 11,
        fontFamily: 'Inter_Regular',
        color: colors.textSecondary,
    },
    noticeTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_Bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    noticeContent: {
        fontSize: 14,
        fontFamily: 'Inter_Regular',
        color: '#4B5563',
        lineHeight: 20,
    },
});

/**
 * Parent Home Screen - Premium Design
 * Matches exact visual specifications from reference
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Image,
    Dimensions,
    RefreshControl,
} from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing, typography, shadows } from '../../src/theme';
import PremiumCard from '../../src/components/ui/PremiumCard';
import { api } from '../../services/api';
import { useNotificationStore } from '../../src/store/notificationStore';
import PremiumSideMenu from '../../src/components/navigation/PremiumSideMenu';

const { width } = Dimensions.get('window');

export default function ParentHomeScreen() {
    const router = useRouter();

    const insets = useSafeAreaInsets();
    const { user, logout } = useAuthStore();
    const { hasUnread } = useNotificationStore();
    const [refreshing, setRefreshing] = useState(false);
    const [currentChildIndex, setCurrentChildIndex] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Restore currentChild definition
    const currentChild = user?.children?.[currentChildIndex];

    const [stats, setStats] = useState({
        attendance: null as any,
        fees: null as any,
        lastUpdate: null as any,
        latestNotice: null as any,
    });
    const [loading, setLoading] = useState(true);

    const loadDashboardData = async () => {
        if (!currentChild || !user) {
            setLoading(false);
            return;
        }
        // setLoading(true); // Don't show full loading state on refresh to keep UI stable
        try {
            const orgId = (user as any).organization_id || (user as any).organizationId;
            const childId = Number(currentChild.id);
            const [attendance, fees, updates, notices] = await Promise.all([
                api.getTodayAttendance(childId),
                api.getStudentFees(childId),
                api.getDailyUpdates(childId),
                api.getAnnouncements(orgId)
            ]);

            setStats({
                attendance,
                fees,
                lastUpdate: updates[0] || null,
                latestNotice: notices[0] || null
            });
        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (currentChild) {
            loadDashboardData();
        }
    }, [currentChild]);

    const onRefresh = async () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const handleTrackBus = () => router.push('/(parent)/bus-tracking');
    const handleFees = () => router.push('/(parent)/fees');
    const handleActivities = () => router.push('/(parent)/activities');
    const handleActivityDetail = (activity: any) => {
        router.push({
            pathname: '/(parent)/activity-details',
            params: { activity: JSON.stringify(activity) }
        });
    };

    // Helper to format attendance status
    const getStatusText = () => {
        if (!stats.attendance) return 'Pending';
        return stats.attendance.status.charAt(0).toUpperCase() + stats.attendance.status.slice(1);
    };

    // Smart Widget Logic
    const renderSmartWidget = () => {
        // Find next pending installment
        const nextPending = stats.fees?.emiDetails?.installments?.find((i: any) => i.status === 'pending');

        // Case 1: All Paid (Balance is 0 or no pending)
        if (stats.fees && stats.fees.balance === 0) {
            return (
                <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                        <Feather name="check-circle" size={20} color="#10B981" />
                    </View>
                    <Text style={[styles.statValue, { color: '#10B981' }]}>All Paid</Text>
                    <Text style={styles.statLabel}>No Dues</Text>
                </View>
            );
        }

        // Case 2: Has Dues (Show next EMI)
        if (nextPending) {
            const dateStr = new Date(nextPending.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
                <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                        <Feather name="calendar" size={16} color="#FBBF24" />
                    </View>
                    <Text style={styles.statValue}>₹{nextPending.amount.toLocaleString('en-IN')}</Text>
                    <Text style={styles.statLabel}>Due {dateStr}</Text>
                </View>
            );
        }

        // Priority 2: Bus Status (Fallback if no pending EMI found but has balance)
        if (stats.fees && stats.fees.balance > 0) {
            return (
                <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                        <Feather name="calendar" size={16} color="#FBBF24" />
                    </View>
                    <Text style={styles.statValue}>₹{stats.fees.balance.toLocaleString('en-IN')}</Text>
                    <Text style={styles.statLabel}>Due Now</Text>
                </View>
            );
        }

        // Priority 3: Check In Time (Default status)
        const time = stats.attendance?.checkInTime || '--:--';
        return (
            <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                    <Feather name="clock" size={16} color="#FBBF24" />
                </View>
                <Text style={styles.statValue}>{time}</Text>
                <Text style={styles.statLabel}>Check In</Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={() => setIsMenuOpen(true)}>
                    <Feather name="menu" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerSubtitle}>{(user as any)?.organizationName || 'EduConnect'}</Text>
                    <Text style={styles.headerTitle}>Overview</Text>
                </View>
                <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(parent)/notifications')}>
                    {hasUnread && <View style={styles.notificationDot} />}
                    <MaterialCommunityIcons name="bell-outline" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Student Card */}
                {currentChild && (
                    <View style={styles.studentCardWrapper}>
                        <PremiumCard style={styles.studentCard} variant="elevated">
                            <LinearGradient
                                colors={['#1E293B', '#0F172A']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardGradient}
                            >
                                <View style={styles.studentHeader}>
                                    <View style={styles.avatarContainer}>
                                        <Feather name="user" size={32} color="#fff" />
                                    </View>
                                    <View style={styles.studentInfo}>
                                        <Text style={styles.studentName}>{currentChild.student_name}</Text>
                                        <Text style={styles.studentDetail}>{currentChild.class || 'Student'}</Text>
                                    </View>
                                    <View style={styles.statusBadge}>
                                        <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                                        <Text style={[styles.statusText, { color: '#10B981', textTransform: 'uppercase' }]}>
                                            {(currentChild as any).status || 'ENROLLED'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.cardDivider} />

                                <View style={styles.cardStats}>
                                    <View style={styles.statItem}>
                                        <View style={styles.statIconContainer}>
                                            <Feather name="user-check" size={16} color="#FBBF24" />
                                        </View>
                                        <Text style={styles.statValue}>{getStatusText()}</Text>
                                        <Text style={styles.statLabel}>Attendance</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    {renderSmartWidget()}
                                </View>
                            </LinearGradient>
                        </PremiumCard>
                    </View>
                )}

                {/* Quick Actions (Centered Row) */}
                <View style={styles.actionsContainerFixed}>
                    <TouchableOpacity style={styles.actionItem} onPress={handleActivities}>
                        <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
                            <Feather name="calendar" size={24} color="#10B981" />
                        </View>
                        <Text style={styles.actionLabel}>Activities</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={handleTrackBus}>
                        <View style={[styles.actionIcon, { backgroundColor: '#F3F4F6' }]}>
                            <MaterialCommunityIcons name="bus-school" size={28} color="#4B5563" />
                        </View>
                        <Text style={styles.actionLabel}>School Bus</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={handleFees}>
                        <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                            <Feather name="credit-card" size={24} color="#EF4444" />
                        </View>
                        <Text style={styles.actionLabel}>Fees</Text>
                    </TouchableOpacity>
                </View>

                {/* Notice Board */}
                <Text style={styles.sectionTitle}>Notice Board</Text>
                <TouchableOpacity
                    style={styles.noticeCardWrapper}
                    onPress={() => router.push('/(parent)/notifications')}
                >
                    <View style={[
                        styles.noticeCard,
                        !stats.latestNotice && { backgroundColor: '#ECFDF5' } // Very light emerald for empty state
                    ]}>
                        <View style={[
                            styles.noticeIconCircle,
                            !stats.latestNotice && { backgroundColor: '#D1FAE5' }
                        ]}>
                            {stats.latestNotice ? (
                                <MaterialCommunityIcons name="bell-ring-outline" size={24} color="#3B82F6" />
                            ) : (
                                <Feather name="check-circle" size={22} color="#10B981" />
                            )}
                        </View>
                        <View style={styles.noticeContent}>
                            <Text style={[
                                styles.noticeTitle,
                                !stats.latestNotice && { color: '#065F46' }
                            ]}>
                                {stats.latestNotice ? stats.latestNotice.title : "Everything's Clear!"}
                            </Text>
                            <Text style={[
                                styles.noticeText,
                                !stats.latestNotice && { color: '#059669' }
                            ]} numberOfLines={2}>
                                {stats.latestNotice ? stats.latestNotice.content : 'You are all caught up with school notices. Have a great day!'}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Daily Highlights */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Daily Highlights</Text>
                    <TouchableOpacity onPress={handleActivities}>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View>

                {stats.lastUpdate ? (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => handleActivityDetail(stats.lastUpdate)}
                    >
                        <PremiumCard style={styles.highlightCard}>
                            {stats.lastUpdate.mediaUrls && stats.lastUpdate.mediaUrls.length > 0 ? (
                                <Image
                                    source={{ uri: stats.lastUpdate.mediaUrls[0] }}
                                    style={{ width: '100%', height: 140 }}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.highlightImagePlaceholder}>
                                    <Feather name="image" size={40} color="#9CA3AF" />
                                </View>
                            )}
                            <View style={styles.highlightFooter}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.highlightTitle}>{stats.lastUpdate.title}</Text>
                                    <Text style={styles.highlightSubtitle} numberOfLines={1}>{stats.lastUpdate.content}</Text>
                                </View>
                                <Text style={styles.highlightDate}>
                                    {new Date(stats.lastUpdate.postedAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </PremiumCard>
                    </TouchableOpacity>
                ) : (
                    <PremiumCard style={styles.highlightCard}>
                        <View style={[styles.highlightImagePlaceholder, { height: 100 }]}>
                            <Text style={{ color: '#9CA3AF' }}>No activity updates today</Text>
                        </View>
                    </PremiumCard>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Custom Side Menu */}
            <PremiumSideMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    headerButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: '#F9FAFB',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerSubtitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B', // Slate 500
        textTransform: 'uppercase',
        letterSpacing: 2.5, // Increased spacing for premium feel
        marginBottom: -2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900', // Ultra bold
        color: '#1E293B', // Slate 800
        letterSpacing: -0.5,
    },
    notificationDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 1.5,
        borderColor: '#fff',
        zIndex: 1,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingTop: 10,
    },
    studentCardWrapper: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    studentCard: {
        padding: 0,
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: '#0F172A',
        ...shadows.lg,
    },
    cardGradient: {
        padding: 0,
    },
    studentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    studentInfo: {
        flex: 1,
        marginLeft: 16,
    },
    studentName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    studentDetail: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginTop: 4,
    },
    statusBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginRight: 6,
    },
    statusText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    cardDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        width: '100%',
    },
    cardStats: {
        flexDirection: 'row',
        paddingVertical: 20,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statIconContainer: {
        marginBottom: 8,
    },
    statValue: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: '60%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignSelf: 'center',
    },
    actionsScroll: {
        marginBottom: spacing.xl,
    },
    actionsContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 10,
    },
    actionsContainerFixed: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg + 10,
        marginBottom: spacing.xl,
        paddingBottom: 10,
    },
    actionItem: {
        alignItems: 'center',
        width: 70,
    },
    actionIcon: {
        width: 60,
        height: 60,
        borderRadius: 22,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#4B5563',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
        paddingHorizontal: spacing.lg,
    },
    noticeCardWrapper: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.xl,
    },
    noticeCard: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderRadius: 24,
        padding: 20,
    },
    noticeIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    noticeContent: {
        flex: 1,
    },
    noticeTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E40AF',
        marginBottom: 6,
    },
    noticeText: {
        fontSize: 13,
        color: '#3B82F6',
        lineHeight: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: spacing.lg,
        marginBottom: 8,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F59E0B',
    },
    highlightCard: {
        marginHorizontal: spacing.lg,
        padding: 0,
        borderRadius: 24,
        ...shadows.sm,
    },
    highlightImagePlaceholder: {
        height: 140,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    highlightFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    highlightTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    highlightSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 4,
    },
    highlightDate: {
        fontSize: 13,
        color: '#9CA3AF',
    },
});

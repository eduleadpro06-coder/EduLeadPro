/**
 * Teacher Home Screen - Refined Premium Design
 * Addresses vertical clutter, removes tabs, and organizes action sequence.
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Platform,
    StatusBar,
} from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing, shadows } from '../../src/theme';
import PremiumDrawer from '../../src/components/ui/PremiumDrawer';
import PremiumCard from '../../src/components/ui/PremiumCard';

export default function TeacherHomeScreen() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState<any>(null);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const data = await api.getTeacherDashboard();
            setDashboardData(data);
        } catch (error) {
            console.error('Dashboard error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboard();
        setRefreshing(false);
    };

    const getGreeting = () => {
        const hour = new Date().toLocaleTimeString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' });
        const currentHour = parseInt(hour, 10);
        if (currentHour < 12) return 'Good Morning,';
        if (currentHour < 18) return 'Good Afternoon,';
        return 'Good Evening,';
    };

    const quickActions = [
        { id: 'attendance', label: 'Attendance', icon: 'check-circle', color: '#3B82F6', bg: '#EFF6FF', route: '/(teacher)/mark-attendance' },
        { id: 'post', label: 'Post Update', icon: 'edit-3', color: '#EF4444', bg: '#FEF2F2', route: '/(teacher)/post-update' },
        { id: 'students', label: 'My Students', icon: 'users', color: '#8B5CF6', bg: '#F5F3FF', route: '/(teacher)/my-students' },
        { id: 'u_history', label: 'Upd. History', icon: 'calendar', color: '#D33394', bg: '#FDF2F9', route: '/(teacher)/update-history' },
        { id: 'a_history', label: 'Att. History', icon: 'clock', color: '#F97316', bg: '#FFF7ED', route: '/(teacher)/attendance-history' },
        { id: 'leaves', label: 'Leaves', icon: 'briefcase', color: '#6366F1', bg: '#EEF2FF', route: '/(teacher)/leaves' },
        { id: 'tasks', label: 'Tasks', icon: 'check-square', color: '#06B6D4', bg: '#ECFEFF', route: '/(teacher)/tasks' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Premium Header */}
            <View style={styles.headerContainerFixed}>
                <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                <View style={styles.headerContentFixed}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.headerTopRow}>
                            <TouchableOpacity style={styles.menuBtnFixed} onPress={() => setDrawerVisible(true)}>
                                <Ionicons name="grid-outline" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.dateTextFixed}>{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                        </View>
                        <View style={{ marginTop: 20 }}>
                            <Text style={styles.greetingTextFixed}>{getGreeting()}</Text>
                            <Text style={styles.teacherNameTextFixed}>{(user as any)?.name || 'Teacher'}</Text>
                        </View>
                    </View>
                    <View style={styles.avatarContainerFixed}>
                        <Text style={styles.avatarTextFixed}>{(user as any)?.name?.charAt(0) || 'T'}</Text>
                    </View>
                </View>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: spacing.lg }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    <>
                        {/* Consolidated Class Snapshot */}
                        {dashboardData && (
                            <PremiumCard style={styles.snapshotCard}>
                                <View style={styles.snapshotHeader}>
                                    <View style={styles.snapshotTitleRow}>
                                        <MaterialCommunityIcons name="finance" size={18} color={colors.primary} />
                                        <Text style={styles.snapshotTitle}>Class Snapshot</Text>
                                    </View>
                                    <Text style={styles.snapshotDate}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                                </View>
                                
                                <View style={styles.snapshotGrid}>
                                    {[
                                        { label: 'Assigned', value: dashboardData.studentsCount || 0, icon: 'users', color: colors.primary, bg: '#EEF2FF' },
                                        { label: 'Present', value: dashboardData.attendance?.present || 0, icon: 'user-check', color: colors.success, bg: '#ECFDF5' },
                                        { label: 'Absent', value: dashboardData.attendance?.absent || 0, icon: 'user-x', color: colors.danger, bg: '#FEF2F2' },
                                    ].map((stat, i) => (
                                        <View key={stat.label} style={[styles.snapshotItem, i < 2 && styles.snapshotDivider]}>
                                            <View style={[styles.snapshotIconBox, { backgroundColor: stat.bg }]}>
                                                <Feather name={stat.icon as any} size={16} color={stat.color} />
                                            </View>
                                            <View>
                                                <Text style={styles.snapshotValue}>{stat.value}</Text>
                                                <Text style={styles.snapshotLabel}>{stat.label}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </PremiumCard>
                        )}

                        {/* Quick Actions Grid */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Essential Actions</Text>
                            <View style={styles.quickActionsGridThree}>
                                {quickActions.map((action) => (
                                    <TouchableOpacity
                                        key={action.id}
                                        style={styles.actionCardCompact}
                                        onPress={() => router.push(action.route as any)}
                                    >
                                        <View style={[styles.actionIconCircle, { backgroundColor: action.bg }]}>
                                            <Feather name={action.icon as any} size={20} color={action.color} />
                                        </View>
                                        <Text style={styles.actionLabelCompact} numberOfLines={1}>{action.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Recent Activity Section */}
                        {dashboardData?.recentActivities?.length > 0 && (
                            <View style={[styles.section, { marginTop: 10 }]}>
                                <Text style={styles.sectionTitle}>Recent Updates</Text>
                                {dashboardData.recentActivities.map((activity: any) => (
                                    <PremiumCard key={activity.id} style={styles.activityCard}>
                                        <View style={styles.activityIcon}>
                                            <Feather name="file-text" size={16} color={colors.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.activityTitle}>{activity.title}</Text>
                                            <Text style={styles.activityTime}>{new Date(activity.posted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                        </View>
                                    </PremiumCard>
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <PremiumDrawer
                isVisible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                activeTab="dashboard"
                onSelectTab={(t) => {
                    const action = quickActions.find(a => a.id === t || a.label.toLowerCase().includes(t.toLowerCase()));
                    if (action) {
                        router.push(action.route as any);
                        setDrawerVisible(false);
                    }
                }}
                user={{ name: user?.name || 'Teacher', role: user?.role || 'teacher' }}
                onLogout={logout}
                menuItems={[
                    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
                    { id: 'attendance', label: 'Mark Attendance', icon: 'check-square' },
                    { id: 'post_update', label: 'Post Update', icon: 'edit-3' },
                    { id: 'students', label: 'My Students', icon: 'users' },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    content: { flex: 1 },
    headerContainerFixed: {
        height: 240,
        justifyContent: 'flex-start',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
    },
    headerGradient: { ...StyleSheet.absoluteFillObject },
    headerContentFixed: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    menuBtnFixed: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateTextFixed: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'Lexend_Medium',
        textTransform: 'uppercase',
    },
    greetingTextFixed: {
        fontSize: 22,
        color: 'rgba(255,255,255,0.8)',
        fontFamily: 'Lexend_Regular',
    },
    teacherNameTextFixed: {
        fontSize: 28,
        color: '#fff',
        fontFamily: 'Outfit_Bold',
        marginTop: 2,
    },
    avatarContainerFixed: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarTextFixed: { color: '#fff', fontSize: 20, fontFamily: 'Outfit_Bold' },
    snapshotCard: {
        marginTop: -40,
        marginBottom: 24,
        padding: 20,
        borderRadius: 24,
        ...shadows.lg,
    },
    snapshotHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.04)',
    },
    snapshotTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    snapshotTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_Bold',
        color: colors.textPrimary,
    },
    snapshotDate: {
        fontSize: 12,
        fontFamily: 'Lexend_Medium',
        color: colors.textSecondary,
    },
    snapshotGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    snapshotItem: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
    },
    snapshotDivider: {
        borderRightWidth: 1,
        borderRightColor: 'rgba(0,0,0,0.06)',
    },
    snapshotIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    snapshotValue: {
        fontSize: 20,
        fontFamily: 'Outfit_Bold',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    snapshotLabel: {
        fontSize: 10,
        fontFamily: 'Lexend_Medium',
        color: colors.textSecondary,
        textAlign: 'center',
    },
    section: { marginBottom: spacing.xl },
    sectionTitle: { fontSize: 18, fontFamily: 'Outfit_Bold', color: colors.textPrimary, marginBottom: 16 },
    quickActionsGridThree: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'flex-start',
    },
    actionCardCompact: {
        width: '31%',
        aspectRatio: 1.05,
        backgroundColor: '#fff',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        ...shadows.sm,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    actionIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    actionLabelCompact: {
        fontSize: 11,
        fontFamily: 'Lexend_Medium',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 8,
    },
    activityIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    activityTitle: { fontSize: 14, fontFamily: 'Lexend_Medium', color: colors.textPrimary },
    activityTime: { fontSize: 11, fontFamily: 'Lexend_Regular', color: colors.textSecondary },
});

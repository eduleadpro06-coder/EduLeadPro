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

    // Determine if this is an admin-type role
    const isAdmin = ['counselor', 'staff', 'director', 'admin'].includes(user?.role || '');

    const loadDashboard = async () => {
        setLoading(true);
        try {
            if (isAdmin) {
                const data = await api.getAdminDashboard();
                setDashboardData(data);
            } else {
                const data = await api.getTeacherDashboard();
                setDashboardData(data);
            }
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

    // Role-based Quick Actions
    const adminActions = [
        { id: 'att_monitor', label: 'Att. Monitor', icon: 'eye', color: '#0EA5E9', bg: '#E0F2FE', route: '/(teacher)/attendance-monitor' },
        { id: 'approve', label: 'Approve Updates', icon: 'check-square', color: '#7C3AED', bg: '#F3E8FF', route: '/(teacher)/approve-updates' },
        { id: 'leaves', label: 'Leaves', icon: 'briefcase', color: '#6366F1', bg: '#EEF2FF', route: '/(teacher)/leaves' },
        { id: 'history', label: 'Att. History', icon: 'clock', color: '#F97316', bg: '#FFF7ED', route: '/(teacher)/attendance-history' },
        { id: 'students', label: 'All Students', icon: 'users', color: '#2196F3', bg: '#E3F2FD', route: '/(teacher)/my-students' },
        { id: 'tasks', label: 'Tasks', icon: 'check-square', color: '#06B6D4', bg: '#ECFEFF', route: '/(teacher)/tasks' },
    ];

    const teacherActions = [
        { id: 'attendance', label: 'Attendance', icon: 'user-check', color: '#4CAF50', bg: '#E8F5E9', route: '/(teacher)/mark-attendance' },
        { id: 'a_history', label: 'Att. History', icon: 'clock', color: '#F97316', bg: '#FFF7ED', route: '/(teacher)/attendance-history' },
        { id: 'history', label: 'Post Updates', icon: 'clipboard', color: '#2196F3', bg: '#E3F2FD', route: '/(teacher)/update-history' },
        { id: 'leaves', label: 'Leaves', icon: 'briefcase', color: '#6366F1', bg: '#EEF2FF', route: '/(teacher)/leaves' },
        { id: 'tasks', label: 'Tasks', icon: 'check-square', color: '#06B6D4', bg: '#ECFEFF', route: '/(teacher)/tasks' },
    ];

    const quickActions = isAdmin ? adminActions : teacherActions;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Content */}
            <ScrollView 
                style={styles.content} 
                contentContainerStyle={[styles.scrollContent, { paddingTop: 260 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={loadDashboard}
                        tintColor={colors.primary} 
                        progressViewOffset={260}
                    />
                }
            >
                {loading && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : dashboardData && (
                    <>
                        {/* Snapshot Card - Role Aware */}
                        <PremiumCard style={styles.snapshotCard}>
                            <View style={styles.snapshotHeader}>
                                <View style={styles.snapshotTitleRow}>
                                    <View style={[styles.snapshotIconBox, { backgroundColor: colors.primary + '10' }]}>
                                        <Feather name={isAdmin ? 'bar-chart-2' : 'activity'} size={16} color={colors.primary} />
                                    </View>
                                    <Text style={styles.snapshotTitle}>{isAdmin ? 'School Overview' : 'Class Snapshot'}</Text>
                                </View>
                                <Text style={styles.snapshotDate}>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</Text>
                            </View>
                            
                            <View style={styles.snapshotGrid}>
                                {(isAdmin ? [
                                    { label: 'Students', value: dashboardData.totalStudents || 0, icon: 'users', color: colors.primary, bg: '#EEF2FF' },
                                    { label: 'Att. Rate', value: `${dashboardData.attendanceRate || 0}%`, icon: 'check-circle', color: colors.success, bg: '#ECFDF5' },
                                    { label: 'Pending', value: dashboardData.pendingUpdates || 0, icon: 'clock', color: '#F59E0B', bg: '#FEF3C7', route: '/(teacher)/approve-updates' },
                                ] : [
                                    { label: 'My Students', value: dashboardData.studentsCount || 0, icon: 'users', color: colors.primary, bg: '#EEF2FF', route: '/(teacher)/my-students' },
                                    { label: 'Present', value: dashboardData.attendance?.present || 0, icon: 'user-check', color: colors.success, bg: '#ECFDF5' },
                                    { label: 'Absent', value: dashboardData.attendance?.absent || 0, icon: 'user-x', color: colors.danger, bg: '#FEF2F2' },
                                ]).map((stat: any, i: number) => (
                                    <TouchableOpacity 
                                        key={stat.label} 
                                        style={[styles.snapshotItem, i < 2 && styles.snapshotDivider]}
                                        onPress={() => stat.route && router.push(stat.route as any)}
                                        disabled={!stat.route}
                                        activeOpacity={stat.route ? 0.7 : 1}
                                    >
                                        <View style={[styles.snapshotIconBox, { backgroundColor: stat.bg }]}>
                                            <Feather name={stat.icon as any} size={16} color={stat.color} />
                                        </View>
                                        <View>
                                            <Text style={styles.snapshotValue}>{stat.value}</Text>
                                            <Text style={styles.snapshotLabel}>{stat.label}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </PremiumCard>

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
            
            {/* Premium Header - Rendered after ScrollView to ensure touch capture */}
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
                            <TouchableOpacity style={styles.menuBtnFixed} onPress={() => setDrawerVisible(true)} activeOpacity={0.7}>
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
                user={{ name: user?.name || 'User', role: user?.role || 'teacher' }}
                onLogout={logout}
                menuItems={isAdmin ? [
                    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
                    { id: 'att_monitor', label: 'Attendance Monitor', icon: 'eye' },
                    { id: 'approve', label: 'Approve Updates', icon: 'check-square' },
                    { id: 'students', label: 'All Students', icon: 'users' },
                ] : [
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
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 50,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    headerContainerFixed: {
        height: 260,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
        zIndex: 10,
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
        marginTop: 10,
        marginHorizontal: 0,
        marginBottom: 24,
        padding: 20,
        borderRadius: 24,
        minHeight: 120,
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
        justifyContent: 'space-between',
        rowGap: 12,
    },
    actionCardCompact: {
        width: '31%',
        aspectRatio: 1,
        backgroundColor: '#fff',
        borderRadius: 20,
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

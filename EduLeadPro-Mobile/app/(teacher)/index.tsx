/**
 * Teacher Home Screen - Premium Design with Expo Router
 * Based on premium TeacherHomeScreen.tsx with tabs and attendance management
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
    Alert,
    TextInput,
    StatusBar,
    BackHandler,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '../../services/api';
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing, typography, shadows } from '../../src/theme';
import PremiumCard from '../../src/components/ui/PremiumCard';
import PremiumButton from '../../src/components/ui/PremiumButton';
import PremiumDrawer from '../../src/components/ui/PremiumDrawer';

type TabType = 'dashboard' | 'attendance' | 'students' | 'reports';

export default function TeacherHomeScreen() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [drawerVisible, setDrawerVisible] = useState(false);

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Attendance state
    const [attendanceRecords, setAttendanceRecords] = useState<Map<number, 'present' | 'absent' | 'late'>>(new Map());
    const [savingAttendance, setSavingAttendance] = useState(false);

    useEffect(() => {
        if (activeTab === 'dashboard') loadDashboard();
        else if (activeTab === 'students' || activeTab === 'attendance') loadStudents();
    }, [activeTab]);

    // Handle Android Back Button
    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                if (activeTab !== 'dashboard') {
                    setActiveTab('dashboard');
                    return true;
                }
                return false;
            };

            const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => backHandler.remove();
        }, [activeTab])
    );

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

    const loadStudents = async () => {
        setLoading(true);
        try {
            const data = await api.getTeacherStudents('');
            setStudents(data);

            const todayData = await api.getTodayAttendanceAll();
            const attMap = new Map();

            // Strictly check if server date matches client today
            const clientToday = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
            const serverDate = todayData?.date;

            // Only populate if dates match (handle timezone rollover issues)
            if (serverDate === clientToday) {
                todayData?.students?.forEach((s: any) => {
                    if (s.attendance?.status) {
                        attMap.set(s.id, s.attendance.status);
                    }
                });
            }
            setAttendanceRecords(attMap);
        } catch (error) {
            console.error('Students error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        if (activeTab === 'dashboard') await loadDashboard();
        else await loadStudents();
        setRefreshing(false);
    };

    const markAllPresent = () => {
        const newMap = new Map(attendanceRecords);
        students.forEach(s => newMap.set(s.id, 'present'));
        setAttendanceRecords(newMap);
    };

    const toggleAttendance = (studentId: number, status: 'present' | 'absent' | 'late') => {
        const newMap = new Map(attendanceRecords);
        newMap.set(studentId, status);
        setAttendanceRecords(newMap);
    };

    const saveAttendance = async () => {
        if (attendanceRecords.size === 0) {
            Alert.alert('No Changes', 'Please mark attendance for at least one student');
            return;
        }

        setSavingAttendance(true);
        try {
            const records = Array.from(attendanceRecords.entries()).map(([leadId, status]) => ({
                leadId,
                status,
                markedBy: user?.name,
                organizationId: (user as any)?.organization_id || (user as any)?.organizationId
            }));

            await api.markAttendanceBulk(records);
            Alert.alert('Success', 'Attendance saved successfully');
            setActiveTab('dashboard');
        } catch (error: any) {
            console.error('Save attendance error:', error);
            Alert.alert('Error', error.message || 'Failed to save attendance');
        } finally {
            setSavingAttendance(false);
        }
    };

    const filteredStudents = students.filter(s =>
        searchQuery ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

    const getGreeting = () => {
        const hour = new Date().toLocaleTimeString('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' });
        const currentHour = parseInt(hour, 10);
        if (currentHour < 12) return 'Good Morning,';
        if (currentHour < 18) return 'Good Afternoon,';
        return 'Good Evening,';
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Header Logic */}
            {activeTab === 'dashboard' ? (
                /* Premium Header - Dashboard Only */
                <View style={styles.headerContainer}>
                    <View style={styles.headerContent}>
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity style={styles.menuBtn} onPress={() => setDrawerVisible(true)}>
                                <Feather name="menu" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                            <View style={{ marginTop: 12 }}>
                                <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                                <Text style={styles.greetingText}>{getGreeting()}</Text>
                                <Text style={styles.teacherNameText}>{(user as any)?.name || 'Teacher'}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            ) : (
                /* Back Header - Other Tabs */
                <View style={[styles.headerContainer, { paddingBottom: 10 }]}>
                    <View style={[styles.headerContent, { alignItems: 'center' }]}>
                        <TouchableOpacity style={{ padding: 8, marginLeft: -8 }} onPress={() => setActiveTab('dashboard')}>
                            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={[styles.teacherNameText, { fontSize: 18, marginTop: 0 }]}>
                            {activeTab === 'attendance' ? 'Mark Attendance' : `My Students (${filteredStudents.length})`}
                        </Text>
                        <View style={{ width: 24 }} />
                    </View>
                </View>
            )}

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: spacing.lg }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 50 }} />
                ) : (
                    <>
                        {activeTab === 'dashboard' && dashboardData && (
                            <>
                                {/* Stats Grid - Fixed Layout */}
                                <View style={styles.statsGridPremium}>
                                    {[
                                        { label: 'Total', value: dashboardData.studentsCount || 0, icon: 'users', color: colors.primary, bg: '#EEF2FF' },
                                        { label: 'Present', value: dashboardData.attendance?.present || 0, icon: 'user-check', color: colors.success, bg: '#ECFDF5' },
                                        { label: 'Absent', value: dashboardData.attendance?.absent || 0, icon: 'user-x', color: colors.danger, bg: '#FEF2F2' },
                                    ].map((stat, i) => (
                                        <View key={i} style={[styles.statCardPremium, { backgroundColor: stat.bg }]}>
                                            <View style={styles.statIconHeader}>
                                                <View style={[styles.statIconBox, { backgroundColor: 'white' }]}>
                                                    <Feather name={stat.icon as any} size={16} color={stat.color} />
                                                </View>
                                                {stat.label.includes('Present') && (
                                                    <View style={styles.percentBadge}>
                                                        <Text style={styles.percentText}>
                                                            {dashboardData.studentsCount ? Math.round((stat.value / dashboardData.studentsCount) * 100) : 0}%
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.statValuePremium}>{stat.value}</Text>
                                            <Text style={styles.statLabelPremium}>{stat.label}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Quick Actions Grid */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                                    <View style={styles.quickActionsGrid}>
                                        <TouchableOpacity
                                            style={[styles.actionCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
                                            onPress={() => setActiveTab('attendance')}
                                        >
                                            <View style={[styles.actionIconBox, { backgroundColor: '#DCFCE7' }]}>
                                                <Feather name="check-circle" size={24} color={colors.success} />
                                            </View>
                                            <Text style={styles.actionLabel}>Mark Attendance</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.actionCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                                            onPress={() => router.push('/(teacher)/post-update')}
                                        >
                                            <View style={[styles.actionIconBox, { backgroundColor: '#FEE2E2' }]}>
                                                <Feather name="edit-3" size={24} color={colors.danger} />
                                            </View>
                                            <Text style={styles.actionLabel}>Post Update</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.actionCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                                            onPress={() => setActiveTab('students')}
                                        >
                                            <View style={[styles.actionIconBox, { backgroundColor: '#DBEAFE' }]}>
                                                <Feather name="users" size={24} color={colors.primary} />
                                            </View>
                                            <Text style={styles.actionLabel}>View Students</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.actionCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}
                                            onPress={() => router.push('/(teacher)/attendance-history')}
                                        >
                                            <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
                                                <Feather name="clock" size={24} color={colors.warning} />
                                            </View>
                                            <Text style={styles.actionLabel}>Attendance History</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )}

                        {activeTab === 'attendance' && (
                            <View style={styles.section}>
                                <View style={styles.attendanceHeader}>
                                    <View>
                                        <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 4 }}>
                                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={markAllPresent} style={styles.markAllBtn}>
                                        <Text style={styles.markAllText}>Mark All Present</Text>
                                    </TouchableOpacity>
                                </View>

                                {filteredStudents.map(student => {
                                    const status = attendanceRecords.get(student.id);
                                    return (
                                        <PremiumCard
                                            key={student.id}
                                            style={[
                                                styles.attendanceCard,
                                                status === 'present' && { backgroundColor: '#F0FDF4', borderColor: colors.success },
                                                status === 'absent' && { backgroundColor: '#FEF2F2', borderColor: colors.danger },
                                                status === 'late' && { backgroundColor: '#FFFBEB', borderColor: colors.warning },
                                            ]}
                                        >
                                            <View style={styles.studentInfo}>
                                                <View style={styles.studentAvatar}>
                                                    <Feather name="user" size={20} color={colors.primary} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.studentName}>{student.name}</Text>
                                                    <Text style={styles.studentDetail}>{student.class}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.statusButtons}>
                                                {(['present', 'absent', 'late'] as const).map(s => {
                                                    const isActive = status === s;
                                                    let activeStyle = {};
                                                    if (isActive) {
                                                        if (s === 'present') activeStyle = styles.presentBtnActive;
                                                        if (s === 'absent') activeStyle = styles.absentBtnActive;
                                                        if (s === 'late') activeStyle = styles.lateBtnActive;
                                                    }

                                                    return (
                                                        <TouchableOpacity
                                                            key={s}
                                                            style={[
                                                                styles.statusBtn,
                                                                isActive && styles.statusBtnActive,
                                                                isActive ? activeStyle : {},
                                                            ]}
                                                            onPress={() => toggleAttendance(student.id, s)}
                                                        >
                                                            <Text style={[
                                                                styles.statusBtnText,
                                                                isActive && styles.statusBtnTextActive
                                                            ]}>
                                                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </PremiumCard>
                                    );
                                })}

                                <PremiumButton
                                    title={savingAttendance ? "Saving..." : "Save Attendance"}
                                    onPress={saveAttendance}
                                    loading={savingAttendance}
                                    style={{ marginTop: 16 }}
                                />
                            </View>
                        )}

                        {activeTab === 'students' && (
                            <View style={styles.section}>
                                <View style={{ height: 12 }} />

                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search students..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />

                                {filteredStudents.map(student => (
                                    <PremiumCard key={student.id} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={styles.studentAvatar}>
                                            <Feather name="user" size={24} color={colors.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.studentName}>{student.name}</Text>
                                            <Text style={styles.studentDetail}>{student.class}</Text>
                                        </View>
                                    </PremiumCard>
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Sidebar Drawer */}
            <PremiumDrawer
                isVisible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                activeTab={activeTab}
                onSelectTab={(t) => {
                    if (t === 'post_update') {
                        router.push('/(teacher)/post-update');
                        setDrawerVisible(false);
                    } else if (t === 'history') {
                        router.push('/(teacher)/attendance-history');
                        setDrawerVisible(false);
                    } else {
                        setActiveTab(t as TabType);
                    }
                }}
                user={{ name: user?.name || 'Teacher', role: user?.role || 'teacher' }}
                onLogout={logout}
                menuItems={[
                    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
                    { id: 'attendance', label: 'Mark Attendance', icon: 'check-square' },
                    { id: 'post_update', label: 'Post Update', icon: 'edit-3' },
                    { id: 'students', label: 'My Students', icon: 'users' },
                    { id: 'history', label: 'Attendance History', icon: 'clock' },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerContainer: {
        backgroundColor: colors.background,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        paddingHorizontal: spacing.lg,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    menuBtn: {
        padding: 4,
        marginLeft: -4,
        marginBottom: 8,
    },
    dateText: {
        fontSize: 12,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: '600',
        marginBottom: 2,
    },
    greetingText: {
        fontSize: 24,
        fontWeight: '300',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    teacherNameText: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: -4,
        letterSpacing: -0.5,
    },
    profileButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginTop: 4,
    },
    profileInitials: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },

    statsGridPremium: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
        marginTop: spacing.md,
        paddingHorizontal: 0,
    },
    statCardPremium: {
        width: '31%',
        borderRadius: 20,
        padding: 12,
        justifyContent: 'space-between',
        aspectRatio: 0.9,
    },
    statIconHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    statIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentBadge: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 8,
    },
    percentText: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    statValuePremium: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
        marginTop: 8,
    },
    statLabelPremium: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
    },

    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    actionCard: {
        width: '48%',
        marginBottom: 16,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'center',
    },

    // ... Keep existing styles that are still used or refactor them
    content: { flex: 1 },
    section: { marginBottom: spacing.xl },
    sectionTitle: { ...typography.h3, marginBottom: spacing.md },

    attendanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    markAllBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    markAllText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },

    attendanceCard: {
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    studentAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.surfaceHighlight || '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    studentName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    studentDetail: { ...typography.caption, fontSize: 13 },

    statusButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    statusBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: colors.background,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    statusBtnActive: {
        borderWidth: 0,
    },
    presentBtn: { backgroundColor: colors.success + '20', borderColor: colors.success }, // Light green
    absentBtn: { backgroundColor: colors.danger + '20', borderColor: colors.danger },   // Light red
    lateBtn: { backgroundColor: colors.warning + '20', borderColor: colors.warning },   // Light orange

    presentBtnActive: { backgroundColor: colors.success },
    absentBtnActive: { backgroundColor: colors.danger },
    lateBtnActive: { backgroundColor: colors.warning },

    statusBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    statusBtnTextActive: {
        color: 'white',
    },

    searchInput: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
        fontSize: 16,
    },
});

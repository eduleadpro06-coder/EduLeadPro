import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from './services/api';

const colors = {
    primary: '#2D7A5F',
    primaryDark: '#1F5A45',
    white: '#FFFFFF',
    background: '#F0FDF4',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    cardBg: '#FFFFFF',
};

interface TeacherHomeScreenProps {
    user: any;
    onLogout: () => void;
}

export default function TeacherHomeScreen({ user, onLogout }: TeacherHomeScreenProps) {
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'students'>('overview');

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const data = await api.getTeacherDashboard(user.staffId);
            setDashboardData(data);
        } catch (error) {
            console.error('Failed to fetch teacher dashboard:', error);
            Alert.alert('Error', 'Failed to load dashboard data');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchDashboard();
    };

    const handleMarkAttendance = async (studentId: number, status: 'present' | 'absent') => {
        try {
            const now = new Date();
            const checkInTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            await api.markAttendance(
                studentId,
                status,
                checkInTime,
                user.name,
                user.organization_id
            );
            Alert.alert('Success', `Student marked as ${status}`);
            fetchDashboard();
        } catch (error) {
            Alert.alert('Error', 'Failed to mark attendance');
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const { teacher, todayAttendance, recentUpdates, students } = dashboardData || {};
    const presentCount = todayAttendance?.filter((a: any) => a.status === 'present').length || 0;
    const absentCount = todayAttendance?.filter((a: any) => a.status === 'absent').length || 0;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello, {user.name}!</Text>
                    <Text style={styles.role}>Teacher Dashboard</Text>
                </View>
                <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
                    <Feather name="log-out" size={22} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
                    onPress={() => setActiveTab('overview')}
                >
                    <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'attendance' && styles.activeTab]}
                    onPress={() => setActiveTab('attendance')}
                >
                    <Text style={[styles.tabText, activeTab === 'attendance' && styles.activeTabText]}>Attendance</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'students' && styles.activeTab]}
                    onPress={() => setActiveTab('students')}
                >
                    <Text style={[styles.tabText, activeTab === 'students' && styles.activeTabText]}>Students</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
            >
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <>
                        {/* Quick Stats */}
                        <View style={styles.statsContainer}>
                            <View style={[styles.statCard, { backgroundColor: colors.success + '20' }]}>
                                <Feather name="check-circle" size={24} color={colors.success} />
                                <Text style={styles.statNumber}>{presentCount}</Text>
                                <Text style={styles.statLabel}>Present Today</Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: colors.warning + '20' }]}>
                                <Feather name="x-circle" size={24} color={colors.warning} />
                                <Text style={styles.statNumber}>{absentCount}</Text>
                                <Text style={styles.statLabel}>Absent Today</Text>
                            </View>
                        </View>

                        {/* Recent Updates */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Recent Updates Posted</Text>
                            {recentUpdates && recentUpdates.length > 0 ? (
                                recentUpdates.slice(0, 5).map((update: any) => (
                                    <View key={update.id} style={styles.updateCard}>
                                        <View style={styles.updateHeader}>
                                            <Text style={styles.updateType}>{update.activity_type.toUpperCase()}</Text>
                                            <Text style={styles.updateTime}>
                                                {new Date(update.posted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                        <Text style={styles.updateContent} numberOfLines={2}>{update.content}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No updates posted yet</Text>
                            )}
                        </View>
                    </>
                )}

                {/* Attendance Tab */}
                {activeTab === 'attendance' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Mark Attendance</Text>
                        {students && students.length > 0 ? (
                            students.map((student: any) => {
                                const attended = todayAttendance?.find((a: any) => a.lead_id === student.id);
                                return (
                                    <View key={student.id} style={styles.studentCard}>
                                        <View style={styles.studentInfo}>
                                            <Text style={styles.studentName}>{student.name}</Text>
                                            <Text style={styles.studentClass}>{student.class}</Text>
                                        </View>
                                        {attended ? (
                                            <View style={[styles.statusBadge, { backgroundColor: attended.status === 'present' ? colors.success : colors.warning }]}>
                                                <Text style={styles.statusText}>{attended.status.toUpperCase()}</Text>
                                            </View>
                                        ) : (
                                            <View style={styles.attendanceActions}>
                                                <TouchableOpacity
                                                    style={[styles.attendanceBtn, { backgroundColor: colors.success }]}
                                                    onPress={() => handleMarkAttendance(student.id, 'present')}
                                                >
                                                    <Feather name="check" size={18} color={colors.white} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.attendanceBtn, { backgroundColor: colors.warning }]}
                                                    onPress={() => handleMarkAttendance(student.id, 'absent')}
                                                >
                                                    <Feather name="x" size={18} color={colors.white} />
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={styles.emptyText}>No students found</Text>
                        )}
                    </View>
                )}

                {/* Students Tab */}
                {activeTab === 'students' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>All Students ({students?.length || 0})</Text>
                        {students && students.length > 0 ? (
                            students.map((student: any) => (
                                <View key={student.id} style={styles.studentCard}>
                                    <View style={styles.studentInfo}>
                                        <Text style={styles.studentName}>{student.name}</Text>
                                        <Text style={styles.studentClass}>{student.class}</Text>
                                        <Text style={styles.studentPhone}>{student.parent_phone}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No students enrolled</Text>
                        )}
                    </View>
                )}

                <View style={{ height: 80 }} />
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
        backgroundColor: colors.white,
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    greeting: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    role: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    logoutBtn: {
        padding: 8,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 12,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    activeTabText: {
        color: colors.primary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 16,
    },
    updateCard: {
        backgroundColor: colors.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    updateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    updateType: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
    },
    updateTime: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    updateContent: {
        fontSize: 14,
        color: colors.textPrimary,
    },
    studentCard: {
        backgroundColor: colors.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    studentClass: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    studentPhone: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    attendanceActions: {
        flexDirection: 'row',
        gap: 8,
    },
    attendanceBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '700',
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 14,
        padding: 20,
    },
});

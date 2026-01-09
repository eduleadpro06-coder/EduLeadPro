/**
 * Teacher Home Screen
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    TextInput,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import teacherAPI from '../../services/api/teacher.api';
import { TeacherDashboard, StudentInfo } from '../../types/teacher.types';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export default function TeacherHomeScreen() {
    const navigation = useNavigation();
    const { user, logout } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboard, setDashboard] = useState<TeacherDashboard | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        if (!user?.userId) return;

        try {
            setLoading(true);
            const data = await teacherAPI.getDashboard(user.userId);
            setDashboard(data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboard();
        setRefreshing(false);
    };

    const handleMarkAttendance = () => {
        navigation.navigate('MarkAttendance' as never);
    };

    const handlePostUpdate = () => {
        navigation.navigate('PostUpdate' as never);
    };

    // Calculate attendance stats
    const attendanceStats = React.useMemo(() => {
        if (!dashboard?.todayAttendance) return { present: 0, absent: 0, late: 0 };

        return dashboard.todayAttendance.reduce(
            (acc, record) => {
                acc[record.status]++;
                return acc;
            },
            { present: 0, absent: 0, late: 0 }
        );
    }, [dashboard?.todayAttendance]);

    // Filter students based on search
    const filteredStudents = React.useMemo(() => {
        if (!dashboard?.students) return [];
        if (!searchQuery.trim()) return dashboard.students;

        const query = searchQuery.toLowerCase();
        return dashboard.students.filter(
            (student) =>
                student.name.toLowerCase().includes(query) ||
                student.class.toLowerCase().includes(query)
        );
    }, [dashboard?.students, searchQuery]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Good day,</Text>
                    <Text style={styles.userName}>{dashboard?.teacher.name || 'Teacher'}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Today's Attendance Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Today's Attendance</Text>
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
                            <Text style={styles.statNumber}>{attendanceStats.present}</Text>
                            <Text style={styles.statLabel}>Present</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#ef4444' }]}>
                            <Text style={styles.statNumber}>{attendanceStats.absent}</Text>
                            <Text style={styles.statLabel}>Absent</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
                            <Text style={styles.statNumber}>{attendanceStats.late}</Text>
                            <Text style={styles.statLabel}>Late</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <TouchableOpacity style={styles.actionCard} onPress={handleMarkAttendance}>
                        <View style={styles.actionIcon}>
                            <Text style={styles.actionIconText}>✓</Text>
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Mark Attendance</Text>
                            <Text style={styles.actionSubtitle}>Record today's attendance</Text>
                        </View>
                        <Text style={styles.actionArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={handlePostUpdate}>
                        <View style={styles.actionIcon}>
                            <Text style={styles.actionIconText}>📝</Text>
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Post Update</Text>
                            <Text style={styles.actionSubtitle}>Share daily activities</Text>
                        </View>
                        <Text style={styles.actionArrow}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Students List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Students ({filteredStudents.length})</Text>

                    {/* Search Bar */}
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search students..."
                        placeholderTextColor={colors.text.light}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />

                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                            <View key={student.id} style={styles.studentCard}>
                                <View style={styles.studentInfo}>
                                    <Text style={styles.studentName}>{student.name}</Text>
                                    <Text style={styles.studentClass}>Class {student.class}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'No students found' : 'No students assigned'}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.white,
        ...shadows.sm,
    },
    greeting: {
        fontSize: typography.fontSize.md,
        color: colors.text.secondary,
    },
    userName: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    logoutButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    logoutText: {
        color: colors.danger,
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    statCard: {
        flex: 1,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: typography.fontSize.xxxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.white,
    },
    statLabel: {
        fontSize: typography.fontSize.sm,
        color: colors.white,
        marginTop: spacing.xs,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    actionIconText: {
        fontSize: 24,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
    },
    actionSubtitle: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        marginTop: 2,
    },
    actionArrow: {
        fontSize: 24,
        color: colors.text.light,
    },
    searchInput: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.md,
        fontSize: typography.fontSize.md,
        color: colors.text.primary,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
    },
    studentClass: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        marginTop: 2,
    },
    emptyCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.xl,
        alignItems: 'center',
        ...shadows.sm,
    },
    emptyText: {
        fontSize: typography.fontSize.md,
        color: colors.text.secondary,
    },
});

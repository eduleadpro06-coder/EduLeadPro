/**
 * Mark Attendance Screen
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import teacherAPI from '../../services/api/teacher.api';
import { StudentInfo, AttendanceRecord } from '../../types/teacher.types';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type AttendanceStatus = 'present' | 'absent' | 'late' | null;

interface StudentAttendance extends StudentInfo {
    status: AttendanceStatus;
}

export default function MarkAttendanceScreen() {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [students, setStudents] = useState<StudentAttendance[]>([]);
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        if (!user?.userId || !user?.organizationId) return;

        try {
            setLoading(true);
            const dashboard = await teacherAPI.getDashboard();

            // Map students with existing attendance
            const studentsWithAttendance: StudentAttendance[] = dashboard.students.map((student) => {
                const existing = dashboard.todayAttendance.find((a) => a.lead_id === student.id);
                return {
                    ...student,
                    status: existing ? existing.status : null,
                };
            });

            setStudents(studentsWithAttendance);
            setTodayAttendance(dashboard.todayAttendance);
        } catch (error) {
            console.error('Failed to load students:', error);
            Alert.alert('Error', 'Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const updateStudentStatus = (studentId: number, status: AttendanceStatus) => {
        setStudents((prev) =>
            prev.map((student) =>
                student.id === studentId ? { ...student, status } : student
            )
        );
    };

    const markAllPresent = () => {
        setStudents((prev) => prev.map((student) => ({ ...student, status: 'present' })));
    };

    const handleSave = async () => {
        if (!user?.organizationId || !user?.name) return;

        // Weekend check
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            Alert.alert(
                'Weekend Restriction',
                'Student attendance cannot be marked on Saturdays or Sundays.'
            );
            return;
        }

        try {
            setSaving(true);

            // Filter students with attendance marked
            const markedStudents = students.filter((s) => s.status !== null);

            if (markedStudents.length === 0) {
                Alert.alert('No Changes', 'Please mark attendance for at least one student');
                return;
            }

            // Save each attendance record
            const attendanceRecords = markedStudents.map((student) => ({
                leadId: student.id,
                status: student.status as 'present' | 'absent' | 'late',
                markedBy: user.name,
                organizationId: user.organizationId,
                checkInTime: student.status === 'present' ? new Date().toISOString() : null,
            }));

            await teacherAPI.markAttendanceBulk(attendanceRecords);

            Alert.alert('Success', 'Attendance saved successfully', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error) {
            console.error('Failed to save attendance:', error);
            Alert.alert('Error', 'Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    const markedCount = students.filter((s) => s.status !== null).length;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹ Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mark Attendance</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Weekend Warning Banner */}
            {(new Date().getDay() === 0 || new Date().getDay() === 6) && (
                <View style={styles.weekendBanner}>
                    <Text style={styles.weekendBannerText}>
                        Today is a weekend. Attendance marking is disabled.
                    </Text>
                </View>
            )}

            {/* Progress */}
            <View style={styles.progressBar}>
                <Text style={styles.progressText}>
                    {markedCount} / {students.length} marked
                </Text>
                <TouchableOpacity onPress={markAllPresent} style={styles.markAllButton}>
                    <Text style={styles.markAllButtonText}>Mark All Present</Text>
                </TouchableOpacity>
            </View>

            {/* Student List */}
            <ScrollView style={styles.content}>
                {students.map((student) => (
                    <View key={student.id} style={styles.studentCard}>
                        <View style={styles.studentInfo}>
                            <Text style={styles.studentName}>{student.name}</Text>
                            <Text style={styles.studentClass}>Class {student.class}</Text>
                        </View>

                        <View style={styles.statusButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.statusButton,
                                    student.status === 'present' && styles.statusButtonActive,
                                    { backgroundColor: student.status === 'present' ? '#10b981' : colors.background },
                                ]}
                                onPress={() => updateStudentStatus(student.id, 'present')}
                            >
                                <Text
                                    style={[
                                        styles.statusButtonText,
                                        student.status === 'present' && styles.statusButtonTextActive,
                                    ]}
                                >
                                    Present
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.statusButton,
                                    student.status === 'absent' && styles.statusButtonActive,
                                    { backgroundColor: student.status === 'absent' ? '#ef4444' : colors.background },
                                ]}
                                onPress={() => updateStudentStatus(student.id, 'absent')}
                            >
                                <Text
                                    style={[
                                        styles.statusButtonText,
                                        student.status === 'absent' && styles.statusButtonTextActive,
                                    ]}
                                >
                                    Absent
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.statusButton,
                                    student.status === 'late' && styles.statusButtonActive,
                                    { backgroundColor: student.status === 'late' ? '#f59e0b' : colors.background },
                                ]}
                                onPress={() => updateStudentStatus(student.id, 'late')}
                            >
                                <Text
                                    style={[
                                        styles.statusButtonText,
                                        student.status === 'late' && styles.statusButtonTextActive,
                                    ]}
                                >
                                    Late
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Save Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Attendance</Text>
                    )}
                </TouchableOpacity>
            </View>
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
    backButton: {
        paddingVertical: spacing.sm,
    },
    backButtonText: {
        fontSize: typography.fontSize.xl,
        color: colors.primary,
        fontWeight: typography.fontWeight.semibold,
    },
    headerTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    progressBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
    },
    progressText: {
        fontSize: typography.fontSize.md,
        color: colors.text.secondary,
    },
    markAllButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.sm,
    },
    markAllButtonText: {
        color: colors.white,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    studentCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    studentInfo: {
        marginBottom: spacing.sm,
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
    statusButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    statusButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    statusButtonActive: {
        borderColor: 'transparent',
    },
    statusButtonText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
    },
    statusButtonTextActive: {
        color: colors.white,
    },
    footer: {
        padding: spacing.lg,
        backgroundColor: colors.white,
        ...shadows.sm,
    },
    saveButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: colors.white,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
    },
    weekendBanner: {
        backgroundColor: '#fee2e2',
        padding: spacing.md,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#fecaca',
    },
    weekendBannerText: {
        color: '#b91c1c',
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        textAlign: 'center',
    },
});

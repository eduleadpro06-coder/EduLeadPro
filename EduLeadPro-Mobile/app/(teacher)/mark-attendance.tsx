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
    SafeAreaView
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing, typography, shadows } from '../../src/theme';
import PremiumCard from '../../src/components/ui/PremiumCard';
import PremiumButton from '../../src/components/ui/PremiumButton';

export default function MarkAttendanceScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<Map<number, 'present' | 'absent' | 'late'>>(new Map());
    const [savingAttendance, setSavingAttendance] = useState(false);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const data = await api.getTeacherStudents('');
            setStudents(data);

            const todayData = await api.getTodayAttendanceAll();
            const attMap = new Map();

            const clientToday = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
            if (todayData?.date === clientToday) {
                todayData?.students?.forEach((s: any) => {
                    if (s.attendance?.status) {
                        attMap.set(s.id, s.attendance.status);
                    }
                });
            }
            setAttendanceRecords(attMap);
        } catch (error) {
            console.error('Attendance load error:', error);
            Alert.alert('Error', 'Failed to load students');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    const toggleAttendance = (studentId: number, status: 'present' | 'absent' | 'late') => {
        const newRecords = new Map(attendanceRecords);
        if (newRecords.get(studentId) === status) {
            newRecords.delete(studentId);
        } else {
            newRecords.set(studentId, status);
        }
        setAttendanceRecords(newRecords);
    };

    const markAllPresent = () => {
        const newRecords = new Map(attendanceRecords);
        students.forEach(s => newRecords.set(s.id, 'present'));
        setAttendanceRecords(newRecords);
    };

    const saveAttendance = async () => {
        if (attendanceRecords.size === 0) {
            Alert.alert('No records', 'Please mark attendance for at least one student');
            return;
        }

        setSavingAttendance(true);
        try {
            const records = Array.from(attendanceRecords.entries()).map(([studentId, status]) => ({
                leadId: studentId,
                status
            }));

            await api.markAttendanceBulk(records);
            Alert.alert('Success', 'Attendance marked successfully');
            router.back();
        } catch (error: any) {
            console.error('Save attendance error:', error);
            Alert.alert('Error', error.message || 'Failed to save attendance');
        } finally {
            setSavingAttendance(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView>
                    <View style={styles.headerContent}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Mark Attendance</Text>
                        <TouchableOpacity onPress={markAllPresent} style={styles.markAllBtn}>
                            <Text style={styles.markAllText}>All Present</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadStudents} />}
            >
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    <>
                        <View style={styles.infoRow}>
                            <Text style={styles.dateLabel}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
                            <Text style={styles.countLabel}>{students.length} Students</Text>
                        </View>

                        {students.map(student => {
                            const status = attendanceRecords.get(student.id);
                            return (
                                <PremiumCard
                                    key={student.id}
                                    style={[
                                        styles.attendanceCard,
                                        status === 'present' && { backgroundColor: '#F0FDF4', borderColor: colors.success + '40' },
                                        status === 'absent' && { backgroundColor: '#FEF2F2', borderColor: colors.danger + '40' },
                                        status === 'late' && { backgroundColor: '#FFFBEB', borderColor: colors.warning + '40' },
                                    ]}
                                >
                                    <View style={styles.studentInfo}>
                                        <View style={styles.avatarBox}>
                                            <Text style={styles.avatarText}>{student.name?.charAt(0)}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.studentName}>{student.name}</Text>
                                            <Text style={styles.studentClass}>{student.class}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.actionRow}>
                                        {[
                                            {id: 'present', label: 'Present', color: colors.success},
                                            {id: 'absent', label: 'Absent', color: colors.danger},
                                            {id: 'late', label: 'Late', color: colors.warning}
                                        ].map(s => {
                                            const isActive = status === s.id;
                                            return (
                                                <TouchableOpacity
                                                    key={s.id}
                                                    onPress={() => toggleAttendance(student.id, s.id as any)}
                                                    style={[
                                                        styles.statusBtn,
                                                        isActive && { backgroundColor: s.color, borderColor: s.color }
                                                    ]}
                                                >
                                                    <Text style={[styles.statusBtnText, isActive && { color: '#fff' }]}>{s.label}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </PremiumCard>
                            );
                        })}
                        
                        <View style={{ height: 20 }} />
                        <PremiumButton
                            title={savingAttendance ? "Saving..." : "Save Attendance"}
                            onPress={saveAttendance}
                            loading={savingAttendance}
                            style={styles.saveBtn}
                        />
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'Outfit_Bold',
    },
    markAllBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    markAllText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'Lexend_SemiBold',
    },
    content: { flex: 1 },
    scrollContent: { padding: spacing.lg },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    dateLabel: {
        fontSize: 14,
        fontFamily: 'Lexend_Medium',
        color: colors.textSecondary,
    },
    countLabel: {
        fontSize: 14,
        fontFamily: 'Lexend_Bold',
        color: colors.primary,
    },
    attendanceCard: {
        marginBottom: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontFamily: 'Outfit_Bold',
        color: colors.primary,
    },
    studentName: {
        fontSize: 16,
        fontFamily: 'Outfit_Bold',
        color: colors.textPrimary,
    },
    studentClass: {
        fontSize: 12,
        fontFamily: 'Lexend_Regular',
        color: colors.textSecondary,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statusBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    statusBtnText: {
        fontSize: 13,
        fontFamily: 'Lexend_SemiBold',
        color: colors.textSecondary,
    },
    saveBtn: {
        ...shadows.md,
    }
});

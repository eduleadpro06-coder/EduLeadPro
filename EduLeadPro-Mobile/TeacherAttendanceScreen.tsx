import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from './services/api';
import { useOffline } from './src/hooks/useOffline';
import { offlineCache } from './src/services/offline-cache';

interface AttendanceScreenProps {
    onBack: () => void;
}

export default function TeacherAttendanceScreen({ onBack }: AttendanceScreenProps) {
    const [students, setStudents] = useState<any[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<Map<number, { status: string; checkInTime: string }>>(new Map());
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { isOnline } = useOffline();

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const data = await api.getTeacherStudents('');
            setStudents(data);

            // Initialize attendance records
            const records = new Map();
            data.forEach((student: any) => {
                records.set(student.id, {
                    status: student.todayAttendance || 'not_marked',
                    checkInTime: new Date().toTimeString().slice(0, 5)
                });
            });
            setAttendanceRecords(records);
        } catch (error) {
            console.error('Failed to load students:', error);
            Alert.alert('Error', 'Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const toggleAttendance = (studentId: number, status: 'present' | 'absent') => {
        const current = attendanceRecords.get(studentId);
        const newStatus = current?.status === status ? 'not_marked' : status;

        setAttendanceRecords(new Map(attendanceRecords.set(studentId, {
            ...current!,
            status: newStatus
        })));
    };

    const markAllPresent = () => {
        const newRecords = new Map(attendanceRecords);
        students.forEach(student => {
            newRecords.set(student.id, {
                status: 'present',
                checkInTime: new Date().toTimeString().slice(0, 5)
            });
        });
        setAttendanceRecords(newRecords);
    };

    const markAllAbsent = () => {
        const newRecords = new Map(attendanceRecords);
        students.forEach(student => {
            newRecords.set(student.id, {
                status: 'absent',
                checkInTime: ''
            });
        });
        setAttendanceRecords(newRecords);
    };

    const submitAttendance = async () => {
        const records: any[] = [];
        attendanceRecords.forEach((record, leadId) => {
            if (record.status !== 'not_marked') {
                records.push({
                    leadId,
                    status: record.status,
                    checkInTime: record.status === 'present' ? record.checkInTime : undefined
                });
            }
        });

        if (records.length === 0) {
            Alert.alert('No Changes', 'Please mark at least one student');
            return;
        }

        setSubmitting(true);
        try {
            if (isOnline) {
                await api.markAttendanceBulk(records);
                Alert.alert('Success', `Attendance marked for ${records.length} student(s)`);
                onBack();
            } else {
                await offlineCache.queueAction('mark_attendance', { attendanceRecords: records });
                Alert.alert('Queued', 'Attendance will be synced when online');
                onBack();
            }
        } catch (error) {
            console.error('Failed to submit attendance:', error);
            Alert.alert('Error', 'Failed to submit attendance');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mark Attendance</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Bulk Actions */}
            <View style={styles.bulkActions}>
                <TouchableOpacity style={styles.bulkButton} onPress={markAllPresent}>
                    <Feather name="check" size={18} color="#fff" />
                    <Text style={styles.bulkButtonText}>All Present</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.bulkButton, { backgroundColor: '#EF4444' }]}
                    onPress={markAllAbsent}
                >
                    <Feather name="x" size={18} color="#fff" />
                    <Text style={styles.bulkButtonText}>All Absent</Text>
                </TouchableOpacity>
            </View>

            {/* Students List */}
            {loading ? (
                <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 50 }} />
            ) : (
                <ScrollView style={styles.studentsList}>
                    {students.map(student => {
                        const record = attendanceRecords.get(student.id);
                        const isPresent = record?.status === 'present';
                        const isAbsent = record?.status === 'absent';

                        return (
                            <View key={student.id} style={styles.studentItem}>
                                <View style={styles.studentInfo}>
                                    <Text style={styles.studentName}>{student.name}</Text>
                                    <Text style={styles.studentClass}>{student.class}</Text>
                                </View>

                                <View style={styles.attendanceButtons}>
                                    <TouchableOpacity
                                        style={[
                                            styles.attendanceBtn,
                                            isPresent && styles.attendanceBtnPresent
                                        ]}
                                        onPress={() => toggleAttendance(student.id, 'present')}
                                    >
                                        <Feather name="check" size={18} color={isPresent ? '#fff' : '#10B981'} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.attendanceBtn,
                                            styles.attendanceBtnRed,
                                            isAbsent && styles.attendanceBtnAbsent
                                        ]}
                                        onPress={() => toggleAttendance(student.id, 'absent')}
                                    >
                                        <Feather name="x" size={18} color={isAbsent ? '#fff' : '#EF4444'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            )}

            {/* Submit Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={submitAttendance}
                    disabled={submitting || loading}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Attendance</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827'
    },
    bulkActions: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    bulkButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        padding: 12,
        borderRadius: 8,
        gap: 8
    },
    bulkButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14
    },
    studentsList: {
        flex: 1,
        padding: 16
    },
    studentItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    studentInfo: {
        flex: 1
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827'
    },
    studentClass: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4
    },
    attendanceButtons: {
        flexDirection: 'row',
        gap: 8
    },
    attendanceBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff'
    },
    attendanceBtnRed: {
        borderColor: '#EF4444'
    },
    attendanceBtnPresent: {
        backgroundColor: '#10B981',
        borderColor: '#10B981'
    },
    attendanceBtnAbsent: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444'
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB'
    },
    submitButton: {
        backgroundColor: '#8B5CF6',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});

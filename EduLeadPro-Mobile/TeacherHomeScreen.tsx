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
    StatusBar
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from './services/api';
import TeacherActivityScreen from './TeacherActivityScreen';

// Premium Design
import { colors, spacing, typography, shadows } from './src/theme';
import PremiumCard from './src/components/ui/PremiumCard';
import PremiumButton from './src/components/ui/PremiumButton';
import PremiumDrawer from './src/components/ui/PremiumDrawer';

interface TeacherHomeScreenProps {
    user: any;
    onLogout: () => void;
}

type TabType = 'dashboard' | 'attendance' | 'students' | 'activity' | 'reports';

export default function TeacherHomeScreen({ user, onLogout }: TeacherHomeScreenProps) {
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

    // Reports state
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);

    // Holidays state
    const [holidays, setHolidays] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'dashboard') loadDashboard();
        else if (activeTab === 'students' || activeTab === 'attendance' || activeTab === 'reports') {
            loadStudents();
            loadHolidays();
        }
    }, [activeTab]);

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

            // Load today's attendance
            const todayData = await api.getTodayAttendanceAll();
            const attMap = new Map();
            todayData?.students?.forEach((s: any) => {
                if (s.attendance?.status) {
                    attMap.set(s.id, s.attendance.status);
                }
            });
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

    const loadHolidays = async () => {
        try {
            const holidayData = await api.getOrganizationHolidays();
            setHolidays(holidayData || []);
        } catch (error) {
            console.error('Holidays error:', error);
        }
    };

    const isHoliday = (date: Date): { isHoliday: boolean; name?: string } => {
        const dateStr = date.toISOString().split('T')[0];
        const holiday = holidays.find(h => h.date === dateStr);
        return {
            isHoliday: !!holiday,
            name: holiday?.name
        };
    };

    const loadAttendanceHistory = async (studentId: number) => {
        setLoading(true);
        try {
            const history = await api.getStudentAttendanceHistory(studentId);
            setAttendanceHistory(history || []);
        } catch (error) {
            console.error('Attendance history error:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveAttendance = async () => {
        // Check if today is a school day
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

        // Check for holiday first
        const holidayCheck = isHoliday(today);
        if (holidayCheck.isHoliday) {
            Alert.alert(
                'Holiday',
                `Today is ${holidayCheck.name}. Are you sure you want to mark attendance?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Continue Anyway', onPress: () => proceedWithSave() }
                ]
            );
            return;
        }

        // Check for weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            Alert.alert(
                'Weekend Day',
                'Today is a weekend (Saturday/Sunday). Are you sure you want to mark attendance?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Continue Anyway', onPress: () => proceedWithSave() }
                ]
            );
            return;
        }

        proceedWithSave();
    };

    const proceedWithSave = async () => {
        if (attendanceRecords.size === 0) {
            Alert.alert('No Changes', 'Please mark attendance for at least one student');
            return;
        }

        setSavingAttendance(true);
        try {
            const records = Array.from(attendanceRecords.entries()).map(([leadId, status]) => ({
                leadId,
                status,
                markedBy: user.name,
                organizationId: user.organization_id
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

    // Filter students
    const filteredStudents = students.filter(s =>
        searchQuery ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.menuBtn} onPress={() => setDrawerVisible(true)}>
                    <Feather name="menu" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {activeTab === 'dashboard' ? 'Teacher Portal' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Content */}
            {activeTab === 'activity' ? (
                <View style={{ flex: 1, backgroundColor: colors.background }}>
                    <TeacherActivityScreen onBack={() => setActiveTab('dashboard')} />
                </View>
            ) : (
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
                                    {/* Stats Grid */}
                                    <View style={styles.statsGrid}>
                                        {[
                                            { label: 'Total', value: dashboardData.studentsCount || 0, icon: 'users', color: colors.info },
                                            { label: 'Present', value: dashboardData.attendance?.present || 0, icon: 'check-circle', color: colors.success },
                                            { label: 'Absent', value: dashboardData.attendance?.absent || 0, icon: 'x-circle', color: colors.danger },
                                            { label: 'Pending', value: (dashboardData.studentsCount || 0) - (dashboardData.attendance?.total || 0), icon: 'clock', color: colors.warning },
                                        ].map((stat, i) => (
                                            <PremiumCard key={i} style={styles.statCard}>
                                                <View style={[styles.iconBox, { backgroundColor: stat.color + '15' }]}>
                                                    <Feather name={stat.icon as any} size={20} color={stat.color} />
                                                </View>
                                                <Text style={styles.statValue}>{stat.value}</Text>
                                                <Text style={styles.statLabel}>{stat.label}</Text>
                                            </PremiumCard>
                                        ))}
                                    </View>

                                    {/* Quick Actions */}
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                                        <PremiumButton
                                            title="Post New Activity"
                                            icon="camera"
                                            onPress={() => setActiveTab('activity')}
                                            style={{ marginBottom: 12 }}
                                        />
                                        <PremiumButton
                                            title="Mark Attendance"
                                            icon="check-square"
                                            variant="secondary"
                                            onPress={() => setActiveTab('attendance')}
                                            style={{ marginBottom: 12 }}
                                        />
                                        <PremiumButton
                                            title="View Student List"
                                            icon="users"
                                            variant="outline"
                                            onPress={() => setActiveTab('students')}
                                            style={{ marginBottom: 12 }}
                                        />
                                        <PremiumButton
                                            title="Attendance Reports"
                                            icon="bar-chart-2"
                                            variant="secondary"
                                            onPress={() => setActiveTab('reports')}
                                        />
                                    </View>
                                </>
                            )}

                            {activeTab === 'attendance' && (
                                <View style={styles.section}>
                                    <View style={styles.attendanceHeader}>
                                        <View>
                                            <Text style={styles.sectionTitle}>Mark Attendance</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                                </Text>
                                                {(new Date().getDay() === 0 || new Date().getDay() === 6) && (
                                                    <View style={{
                                                        marginLeft: 8,
                                                        paddingHorizontal: 8,
                                                        paddingVertical: 2,
                                                        backgroundColor: colors.warning + '20',
                                                        borderRadius: 4
                                                    }}>
                                                        <Text style={{ fontSize: 11, color: colors.warning, fontWeight: '600' }}>
                                                            WEEKEND
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                        <TouchableOpacity onPress={markAllPresent} style={styles.markAllBtn}>
                                            <Text style={styles.markAllText}>Mark All Present</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {filteredStudents.map(student => {
                                        const status = attendanceRecords.get(student.id);
                                        return (
                                            <PremiumCard key={student.id} style={styles.attendanceCard}>
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
                                                    {(['present', 'absent', 'late'] as const).map(s => (
                                                        <TouchableOpacity
                                                            key={s}
                                                            style={[
                                                                styles.statusBtn,
                                                                status === s && styles[`${s}Btn`]
                                                            ]}
                                                            onPress={() => toggleAttendance(student.id, s)}
                                                        >
                                                            <Text style={[
                                                                styles.statusBtnText,
                                                                status === s && styles.statusBtnTextActive
                                                            ]}>
                                                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </PremiumCard>
                                        );
                                    })}

                                    <PremiumButton
                                        title={savingAttendance ? "Saving..." : "Save Attendance"}
                                        onPress={saveAttendance}
                                        disabled={savingAttendance}
                                        style={{ marginTop: 16 }}
                                    />
                                </View>
                            )}

                            {activeTab === 'students' && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>My Students ({filteredStudents.length})</Text>

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

                            {activeTab === 'reports' && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Attendance Reports</Text>

                                    {!selectedStudent ? (
                                        <>
                                            <Text style={{ marginBottom: 12, color: colors.textSecondary }}>
                                                Select a student to view their attendance history
                                            </Text>
                                            {students.map(student => (
                                                <TouchableOpacity
                                                    key={student.id}
                                                    onPress={() => {
                                                        setSelectedStudent(student);
                                                        loadAttendanceHistory(student.id);
                                                    }}
                                                >
                                                    <PremiumCard style={{ marginBottom: 12 }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            <View style={styles.studentAvatar}>
                                                                <Feather name="user" size={20} color={colors.primary} />
                                                            </View>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={styles.studentName}>{student.name}</Text>
                                                                <Text style={styles.studentDetail}>{student.class}</Text>
                                                            </View>
                                                            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                                                        </View>
                                                    </PremiumCard>
                                                </TouchableOpacity>
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            <TouchableOpacity
                                                onPress={() => setSelectedStudent(null)}
                                                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                                            >
                                                <Feather name="arrow-left" size={20} color={colors.primary} />
                                                <Text style={{ marginLeft: 8, color: colors.primary, fontWeight: '600' }}>
                                                    Back to Students
                                                </Text>
                                            </TouchableOpacity>

                                            <PremiumCard style={{ marginBottom: 16 }}>
                                                <Text style={styles.studentName}>{selectedStudent.name}</Text>
                                                <Text style={styles.studentDetail}>{selectedStudent.class}</Text>

                                                {attendanceHistory.length > 0 && (
                                                    <View style={{ marginTop: 12, flexDirection: 'row', gap: 12 }}>
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.success }}>
                                                                {Math.round((attendanceHistory.filter(a => a.status === 'present' || a.status === 'late').length / attendanceHistory.length) * 100)}%
                                                            </Text>
                                                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Attendance</Text>
                                                        </View>
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
                                                                {attendanceHistory.filter(a => a.status === 'present' || a.status === 'late').length}/{attendanceHistory.length}
                                                            </Text>
                                                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Present/Total</Text>
                                                        </View>
                                                    </View>
                                                )}
                                            </PremiumCard>

                                            <Text style={{ ...styles.sectionTitle, fontSize: 16, marginBottom: 12 }}>Last 30 Days</Text>
                                            {attendanceHistory.length > 0 ? (
                                                attendanceHistory.slice(0, 30).map((record: any, index: number) => (
                                                    <PremiumCard key={index} style={{ marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <View>
                                                            <Text style={{ fontWeight: '600' }}>
                                                                {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </Text>
                                                            {record.checkInTime && (
                                                                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                                                                    Check-in: {record.checkInTime}
                                                                </Text>
                                                            )}
                                                        </View>
                                                        <View style={[
                                                            styles.statusBadge,
                                                            {
                                                                backgroundColor: record.status === 'present' ? colors.success + '20' :
                                                                    record.status === 'absent' ? colors.danger + '20' : colors.warning + '20'
                                                            }
                                                        ]}>
                                                            <Text style={{
                                                                color: record.status === 'present' ? colors.success :
                                                                    record.status === 'absent' ? colors.danger : colors.warning,
                                                                fontWeight: '600',
                                                                fontSize: 12
                                                            }}>
                                                                {record.status.toUpperCase()}
                                                            </Text>
                                                        </View>
                                                    </PremiumCard>
                                                ))
                                            ) : (
                                                <PremiumCard variant="flat" style={{ padding: 20, alignItems: 'center' }}>
                                                    <Text style={{ color: colors.textSecondary }}>No attendance records found</Text>
                                                </PremiumCard>
                                            )}
                                        </>
                                    )}
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            )}

            {/* Sidebar Drawer */}
            <PremiumDrawer
                isVisible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                activeTab={activeTab}
                onSelectTab={(t) => setActiveTab(t as TabType)}
                user={{ name: user.name, role: user.role }}
                onLogout={onLogout}
                menuItems={[
                    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
                    { id: 'attendance', label: 'Mark Attendance', icon: 'check-square' },
                    { id: 'activity', label: 'Post Activity', icon: 'camera' },
                    { id: 'students', label: 'My Students', icon: 'users' },
                    { id: 'reports', label: 'Attendance Reports', icon: 'bar-chart-2' },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    menuBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { ...typography.h3, fontSize: 18 },

    content: { flex: 1, paddingTop: spacing.md },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.lg },
    statCard: { width: '48%', marginBottom: 12, alignItems: 'center', paddingVertical: spacing.lg },
    iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
    statValue: { ...typography.h2, fontSize: 24, marginBottom: 4 },
    statLabel: { ...typography.caption, textAlign: 'center' },

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
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    studentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md
    },
    studentName: { ...typography.body, fontWeight: '700' },
    studentDetail: { ...typography.caption },

    statusButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    statusBtn: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: colors.surfaceHighlight,
        alignItems: 'center',
    },
    presentBtn: {
        backgroundColor: colors.success,
    },
    absentBtn: {
        backgroundColor: colors.danger,
    },
    lateBtn: {
        backgroundColor: colors.warning,
    },
    statusBtnText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    statusBtnTextActive: {
        color: 'white',
    },

    searchInput: {
        backgroundColor: 'white',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
});

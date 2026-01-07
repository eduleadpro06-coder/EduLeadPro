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
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { api } from './services/api';
import TeacherAttendanceScreen from './TeacherAttendanceScreen';
import TeacherActivityScreen from './TeacherActivityScreen';

// Premium Design
import { colors, spacing, typography, shadows, layout } from './src/theme';
import PremiumCard from './src/components/ui/PremiumCard';
import PremiumButton from './src/components/ui/PremiumButton';
import PremiumDrawer from './src/components/ui/PremiumDrawer';

interface TeacherHomeScreenProps {
    user: any;
    onLogout: () => void;
}

type TabType = 'dashboard' | 'attendance' | 'students' | 'activity';

export default function TeacherHomeScreen({ user, onLogout }: TeacherHomeScreenProps) {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [drawerVisible, setDrawerVisible] = useState(false);

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'dashboard') loadDashboard();
        else if (activeTab === 'students' || activeTab === 'attendance') loadStudents();
    }, [activeTab]);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const data = await api.getTeacherDashboard();
            setDashboardData(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async () => {
        setLoading(true);
        try {
            const data = await api.getTeacherStudents('');
            setStudents(data);
        } catch (error) {
            console.error(error);
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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* --- Standard Header (Clean) --- */}
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
                                            { label: 'Classes', value: '3', icon: 'book', color: colors.info },
                                            { label: 'Present', value: dashboardData.presentToday, icon: 'check-circle', color: colors.success },
                                            { label: 'Absent', value: dashboardData.absentToday, icon: 'x-circle', color: colors.danger },
                                            { label: 'Pending', value: dashboardData.notMarked, icon: 'clock', color: colors.warning },
                                        ].map((stat, i) => (
                                            <PremiumCard key={i} style={styles.statCard}>
                                                <View style={[styles.iconBox, { backgroundColor: stat.color + '15' }]}>
                                                    <Feather name={stat.icon as any} size={20} color={stat.color} />
                                                </View>
                                                <Text style={styles.statValue}>{stat.value || 0}</Text>
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
                                        />
                                    </View>
                                </>
                            )}

                            {activeTab === 'attendance' && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Mark Attendance</Text>
                                    <PremiumCard variant="flat">
                                        <Text style={{ textAlign: 'center', color: colors.textSecondary }}>Attendance list would go here.</Text>
                                    </PremiumCard>
                                </View>
                            )}

                            {activeTab === 'students' && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>My Students</Text>
                                    {students.map(student => (
                                        <PremiumCard key={student.id} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={styles.studentAvatar}>
                                                <Feather name="user" size={24} color={colors.primary} />
                                            </View>
                                            <View>
                                                <Text style={styles.studentName}>{student.name}</Text>
                                                <Text style={styles.studentDetail}>{student.class} • Parent: {student.parent_name}</Text>
                                            </View>
                                        </PremiumCard>
                                    ))}
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

    studentAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    studentName: { ...typography.body, fontWeight: '700' },
    studentDetail: { ...typography.caption },
});

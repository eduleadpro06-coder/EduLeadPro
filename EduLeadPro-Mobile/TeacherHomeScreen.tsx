```
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { api } from './services/api';
import TeacherAttendanceScreen from './TeacherAttendanceScreen';
import TeacherActivityScreen from './TeacherActivityScreen';

interface TeacherHomeScreenProps {

type TabType = 'dashboard' | 'attendance' | 'students';

export default function TeacherHomeScreen({ user, onLogout }: TeacherHomeScreenProps) {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Dashboard data
    const [dashboardData, setDashboardData] = useState<any>(null);

    // Students data
    const [students, setStudents] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'dashboard') {
            loadDashboard();
        } else if (activeTab === 'students' || activeTab === 'attendance') {
            loadStudents();
        }
    }, [activeTab]);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const data = await api.getTeacherDashboard();
            setDashboardData(data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            Alert.alert('Error', 'Failed to load dashboard data');
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
            console.error('Failed to load students:', error);
            Alert.alert('Error', 'Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            if (activeTab === 'dashboard') {
                await loadDashboard();
            } else {
                await loadStudents();
            }
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greeting}>Hello,</Text>
                        <Text style={styles.name}>{user.name}</Text>
                        <Text style={styles.role}>Teacher</Text>
                    </View>
                    <TouchableOpacity onPress={onLogout}>
                        <Feather name="log-out" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                {[
                    { key: 'dashboard', icon: 'home', label: 'Dashboard' },
                    { key: 'attendance', icon: 'check-square', label: 'Attendance' },
                    { key: 'students', icon: 'users', label: 'Students' }
                ].map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key as TabType)}
                    >
                        <Feather
                            name={tab.icon as any}
                            size={20}
                            color={activeTab === tab.key ? '#8B5CF6' : '#9CA3AF'}
                        />
                        <Text style={[
                            styles.tabLabel,
                            activeTab === tab.key && styles.tabLabelActive
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 50 }} />
                ) : (
                    <>
                        {activeTab === 'dashboard' && dashboardData && (
                            <>
                                <View style={styles.statsGrid}>
                                    <View style={styles.statCard}>
                                        <View style={styles.statCardInner}>
                                            <Feather name="users" size={24} color="#8B5CF6" />
                                            <Text style={styles.statValue}>{dashboardData.totalStudents || 0}</Text>
                                            <Text style={styles.statLabel}>Total Students</Text>
                                        </View>
                                    </View>

                                    <View style={styles.statCard}>
                                        <View style={styles.statCardInner}>
                                            <Feather name="check-circle" size={24} color="#10B981" />
                                            <Text style={styles.statValue}>{dashboardData.presentToday || 0}</Text>
                                            <Text style={styles.statLabel}>Present Today</Text>
                                        </View>
                                    </View>

                                    <View style={styles.statCard}>
                                        <View style={styles.statCardInner}>
                                            <Feather name="x-circle" size={24} color="#EF4444" />
                                            <Text style={styles.statValue}>{dashboardData.absentToday || 0}</Text>
                                            <Text style={styles.statLabel}>Absent Today</Text>
                                        </View>
                                    </View>

                                    <View style={styles.statCard}>
                                        <View style={styles.statCardInner}>
                                            <Feather name="clock" size={24} color="#F59E0B" />
                                            <Text style={styles.statValue}>{dashboardData.notMarked || 0}</Text>
                                            <Text style={styles.statLabel}>Not Marked</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.quickActions}>
                                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => setActiveTab('attendance')}
                                    >
                                        <Feather name="check-square" size={20} color="#fff" />
                                        <Text style={styles.actionButtonText}>Mark Attendance</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
                                        onPress={() => setActiveTab('students')}
                                    >
                                        <Feather name="users" size={20} color="#fff" />
                                        <Text style={styles.actionButtonText}>View Students</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {activeTab === 'attendance' && (
                            <View>
                                <Text style={styles.sectionTitle}>Mark Attendance</Text>
                                <Text style={styles.placeholder}>
                                    Attendance marking UI coming soon...
                                </Text>
                            </View>
                        )}

                        {activeTab === 'students' && (
                            <View>
                                <Text style={styles.sectionTitle}>Students List</Text>
                                {students.map(student => (
                                    <View key={student.id} style={styles.studentCard}>
                                        <Text style={styles.studentName}>{student.name}</Text>
                                        <Text style={styles.studentClass}>Class: {student.class}</Text>
                                        <Text style={styles.studentInfo}>Parent: {student parent_name}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 20,
        paddingHorizontal: 20
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    greeting: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14
    },
    name: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 4
    },
    role: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        marginTop: 2
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent'
    },
    tabActive: {
        borderBottomColor: '#8B5CF6'
    },
    tabLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4
    },
    tabLabelActive: {
        color: '#8B5CF6',
        fontWeight: '600'
    },
    content: {
        flex: 1,
        padding: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8
    },
    statCard: {
        width: '50%',
        padding: 8
    },
    statCardInner: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 8
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        textAlign: 'center'
    },
    quickActions: {
        marginTop: 24
    },
    actionButton: {
        backgroundColor: '#8B5CF6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8
    },
    placeholder: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 32
    },
    studentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    studentName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827'
    },
    studentClass: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4
    },
    studentInfo: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4
    }
});

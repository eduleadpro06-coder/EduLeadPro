import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Platform,
    TextInput,
    StatusBar,
    Image,
    Dimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing, shadows, typography } from '../../src/theme';
import PremiumCard from '../../src/components/ui/PremiumCard';
import PremiumDrawer from '../../src/components/ui/PremiumDrawer';
import { api } from '../../src/services/api';

const { width } = Dimensions.get('window');

export default function GateDashboard() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        inside: 0,
        visitors: 0
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<any[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await api.getGateStudents('');
            
            if (response && response.data) {
                setStudents(response.data);
                
                if (response.stats) {
                    setStats({
                        total: response.stats.totalStudents || response.data.length,
                        inside: response.stats.insideStudents || 0,
                        visitors: response.stats.activeVisitors || 0
                    });
                } else {
                    // Fallback to manual calculation if stats missing
                    const inside = response.data.filter((s: any) => s.gateStatus?.status === 'present').length;
                    setStats({
                        total: response.data.length,
                        inside,
                        visitors: 0
                    });
                }
            } else if (Array.isArray(response)) {
                // Legacy support if API returns array directly
                setStudents(response);
                const inside = response.filter((s: any) => s.gateStatus?.status === 'present').length;
                setStats({
                    total: response.length,
                    inside,
                    visitors: 0
                });
            }
        } catch (error) {
            console.error('Gate data error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const filteredStudents = students.filter(s =>
        searchQuery ? (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.id && s.id.toString().includes(searchQuery))) : true
    ).slice(0, 50); // Limit display for performance

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning,';
        if (hour < 18) return 'Good Afternoon,';
        return 'Good Evening,';
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
            
            {/* Premium Header */}
            <View style={styles.headerContainer}>
                <View style={styles.headerContent}>
                    <View style={{ flex: 1 }}>
                        <TouchableOpacity style={styles.menuBtn} onPress={() => setDrawerVisible(true)}>
                            <Ionicons name="grid-outline" size={26} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <View style={{ marginTop: 12 }}>
                            <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
                            <Text style={styles.greetingText}>{getGreeting()}</Text>
                            <Text style={styles.userNameText}>{user?.role === 'security' ? 'Security Staff' : 'Support Staff'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView 
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Stats Grid - Premium 3-column Layout */}
                <View style={styles.statsGrid}>
                    {[
                        { label: 'Total', value: stats.total, icon: 'users', color: colors.primary, bg: '#EEF2FF' },
                        { label: 'Inside', value: stats.inside, icon: 'user-check', color: colors.success, bg: '#ECFDF5' },
                        { label: 'Visitors', value: stats.visitors, icon: 'user-plus', color: colors.warning, bg: '#FFFBEB' },
                    ].map((stat, i) => (
                        <View key={i} style={[styles.statCard, { backgroundColor: stat.bg }]}>
                            <View style={styles.statIconBox}>
                                <Feather name={stat.icon as any} size={16} color={stat.color} />
                            </View>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Quick Actions Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Gate Operations</Text>
                    <View style={styles.quickActionsGrid}>
                        <TouchableOpacity 
                            style={[styles.actionCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
                            onPress={() => router.push('/(gate)/scanner')}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#DCFCE7' }]}>
                                <Ionicons name="scan" size={24} color={colors.success} />
                            </View>
                            <Text style={styles.actionLabel}>Scan Pass</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.actionCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                            onPress={() => router.push('/(gate)/visitor-form')}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#DBEAFE' }]}>
                                <Feather name="user-plus" size={24} color={colors.primary} />
                            </View>
                            <Text style={styles.actionLabel}>Visitor Entry</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.actionCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}
                            onPress={() => router.push('/(gate)/history')}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
                                <Feather name="clock" size={24} color={colors.warning} />
                            </View>
                            <Text style={styles.actionLabel}>Log History</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.actionCard, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}
                            onPress={logout}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#E5E7EB' }]}>
                                <Feather name="log-out" size={24} color={colors.textSecondary} />
                            </View>
                            <Text style={styles.actionLabel}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Student Enrollment List */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Quick Search</Text>
                        <Text style={styles.countText}>{students.length} Students</Text>
                    </View>
                    
                    <View style={styles.searchContainer}>
                        <Feather name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by Name or ID..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {loading && !refreshing ? (
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                    ) : (
                        filteredStudents.map((student) => (
                            <TouchableOpacity 
                                key={student.id}
                                style={styles.studentCardWrapper}
                                onPress={() => router.push(`/(gate)/student/${student.id}`)}
                            >
                                <PremiumCard style={styles.studentCard}>
                                    <View style={styles.studentRow}>
                                        <View style={styles.studentAvatar}>
                                            <Feather name="user" size={24} color={colors.primary} />
                                        </View>
                                        <View style={styles.studentInfo}>
                                            <Text style={styles.studentName}>{student.name}</Text>
                                            <Text style={styles.studentDetail}>{student.class} • ID: {student.id}</Text>
                                        </View>
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: student.gateStatus?.status === 'present' ? '#F0FDF4' : '#FEF2F2' }
                                        ]}>
                                            <Text style={[
                                                styles.statusText,
                                                { color: student.gateStatus?.status === 'present' ? colors.success : colors.danger }
                                            ]}>
                                                {student.gateStatus?.status === 'present' ? 'In' : 'Out'}
                                            </Text>
                                        </View>
                                        <Feather name="chevron-right" size={20} color={colors.border} />
                                    </View>
                                </PremiumCard>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
                
                <View style={{ height: 40 }} />
            </ScrollView>

            <PremiumDrawer 
                isVisible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                activeTab="dashboard"
                onSelectTab={(id) => {
                    if (id === 'scanner') router.push('/(gate)/scanner');
                    if (id === 'visitor') router.push('/(gate)/visitor-form');
                    if (id === 'history') router.push('/(gate)/history');
                }}
                menuItems={[
                    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
                    { id: 'scanner', label: 'Scan QR Pass', icon: 'maximize' },
                    { id: 'visitor', label: 'Visitor Logs', icon: 'user-plus' },
                    { id: 'history', label: 'Operation History', icon: 'clock' },
                ]}
                user={{ name: user?.name || 'Security', role: user?.role || 'security' }}
                onLogout={logout}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
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
    userNameText: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: -4,
        letterSpacing: -0.5,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: 40,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
        marginTop: spacing.md,
    },
    statCard: {
        width: '31%',
        borderRadius: 20,
        padding: 12,
        justifyContent: 'space-between',
        aspectRatio: 0.9,
    },
    statIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    countText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 15,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
        height: 50,
        ...shadows.sm,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.textPrimary,
    },
    studentCardWrapper: {
        marginBottom: 12,
    },
    studentCard: {
        padding: 12,
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    studentAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    studentDetail: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 10,
    },
    rollNo: {
        fontSize: 12,
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginTop: 2,
    },
});

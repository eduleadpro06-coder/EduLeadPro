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

const { width, height } = Dimensions.get('window');

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
                    const inside = response.data.filter((s: any) => s.gateStatus?.status === 'present').length;
                    setStats({
                        total: response.data.length,
                        inside,
                        visitors: 0
                    });
                }
            }
        } catch (error) {
            console.error('Gate data error:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const filteredStudents = students
        .filter(s =>
            searchQuery ? (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.id && s.id.toString().includes(searchQuery))) : true
        )
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
        .slice(0, 50);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
            
            {/* Header with Search (TOP PRIORITY) */}
            <View style={styles.headerContainer}>
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.menuBtn} onPress={() => setDrawerVisible(true)}>
                        <Ionicons name="grid-outline" size={26} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Gate Dashboard</Text>
                    <View style={{ width: 32 }} /> 
                </View>

                {/* Priority 1: Quick Search */}
                <View style={styles.searchContainer}>
                    <Feather name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search Student by Name or ID..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={colors.textSecondary + '80'}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Feather name="x-circle" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Shift Stats (Below Search) */}
                <View style={styles.statsGrid}>
                    {[
                        { label: 'Total', value: stats.total, icon: 'users', color: colors.primary, bg: '#F5F7FF' },
                        { label: 'Inside', value: stats.inside, icon: 'user-check', color: colors.success, bg: '#F0FDF4' },
                        { label: 'Visitors', value: stats.visitors, icon: 'user-plus', color: colors.warning, bg: '#FFFBEB' },
                    ].map((stat, i) => (
                        <View key={i} style={[styles.statCard, { backgroundColor: stat.bg }]}>
                            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Main Content: Student List */}
            <ScrollView 
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Students List</Text>
                    <Text style={styles.countText}>{filteredStudents.length} of {students.length}</Text>
                </View>

                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : filteredStudents.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Feather name="search" size={48} color={colors.border} />
                        <Text style={styles.emptyText}>No students found</Text>
                    </View>
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
                                        <Text style={styles.studentDetail}>{student.class}{student.section ? ` - ${student.section}` : ''} • ID: {student.id}</Text>
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
                
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Navigation: Quick Actions */}
            <View style={styles.bottomNav}>
                <TouchableOpacity 
                    style={styles.navItem}
                    onPress={() => router.push('/(gate)/scanner')}
                >
                    <View style={[styles.navIconBox, { backgroundColor: '#F0FDF4' }]}>
                        <Ionicons name="qr-code-outline" size={24} color={colors.success} />
                    </View>
                    <Text style={styles.navLabel}>QR Scan</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.navItem}
                    onPress={() => router.push('/(gate)/visitor-form')}
                >
                    <View style={[styles.navIconBox, { backgroundColor: '#EFF6FF' }]}>
                        <Feather name="user-plus" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.navLabel}>Visitors</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.navItem}
                    onPress={() => router.push('/(gate)/leaves')}
                >
                    <View style={[styles.navIconBox, { backgroundColor: '#FFF5F5' }]}>
                        <Feather name="calendar" size={24} color={colors.danger} />
                    </View>
                    <Text style={styles.navLabel}>Leaves</Text>
                </TouchableOpacity>
            </View>

            <PremiumDrawer 
                isVisible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                activeTab="dashboard"
                onSelectTab={(id) => {
                    if (id === 'scanner') router.push('/(gate)/scanner');
                    if (id === 'visitor') router.push('/(gate)/visitor-form');
                }}
                menuItems={[
                    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
                    { id: 'scanner', label: 'Scan QR Pass', icon: 'maximize' },
                    { id: 'visitor', label: 'Visitor Logs', icon: 'user-plus' },
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
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border + '40',
        paddingBottom: 15,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    menuBtn: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 15,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        width: '31%',
        borderRadius: 15,
        padding: 10,
        alignItems: 'center',
        height: 65,
        justifyContent: 'center',
        ...shadows.sm,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    countText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
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
        width: 44,
        height: 44,
        borderRadius: 22,
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
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 10,
        fontWeight: '500',
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: Platform.OS === 'ios' ? 90 : 75,
        backgroundColor: 'white',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
        borderTopWidth: 1,
        borderTopColor: colors.border + '40',
        ...shadows.lg,
    },
    navItem: {
        alignItems: 'center',
        flex: 1,
    },
    navIconBox: {
        width: 48,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    navLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textPrimary,
    },
});

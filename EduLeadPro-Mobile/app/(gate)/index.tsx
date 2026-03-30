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
    TextInput,
    StatusBar,
    Image,
} from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing, shadows } from '../../src/theme';
import PremiumCard from '../../src/components/ui/PremiumCard';
import { api } from '../../src/services/api';

export default function GateDashboard() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        inside: 0,
        exited: 0,
        visitors: 0
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await api.getGateStudents('');
            setStudents(data);
            
            // Calculate stats from data
            const inside = data.filter((s: any) => !s.gateStatus || s.gateStatus.status === 'present').length;
            const exited = data.filter((s: any) => s.gateStatus?.status === 'checked_out').length;
            
            setStats({
                total: data.length,
                inside,
                exited,
                visitors: 0 // Fetch visitors separately later
            });
        } catch (error) {
            console.error('Gate data error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const filteredStudents = students.filter(s =>
        searchQuery ? (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.roll_number && s.roll_number.includes(searchQuery))) : true
    );

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning,';
        if (hour < 18) return 'Good Afternoon,';
        return 'Good Evening,';
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
            
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greetingText}>{getGreeting()}</Text>
                        <Text style={styles.userNameText}>{user?.name || 'Security'}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>{user?.role === 'security' ? 'Security' : 'Support Staff'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Feather name="log-out" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search student by name or roll no..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={colors.textSecondary}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Stats Summary */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: '#EEF2FF' }]}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{stats.inside}</Text>
                        <Text style={styles.statLabel}>Inside</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#ECFDF5' }]}>
                        <Text style={[styles.statValue, { color: colors.success }]}>{stats.exited}</Text>
                        <Text style={styles.statLabel}>Exited</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#FFFBEB' }]}>
                        <Text style={[styles.statValue, { color: colors.warning }]}>{stats.visitors}</Text>
                        <Text style={styles.statLabel}>Visitors</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Gate Actions</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity 
                            style={styles.actionItem}
                            onPress={() => router.push('/(gate)/scanner')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                                <MaterialCommunityIcons name="qrcode-scan" size={28} color="#fff" />
                            </View>
                            <Text style={styles.actionLabel}>Scan QR</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.actionItem}
                            onPress={() => router.push('/(gate)/visitor-form')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.warning }]}>
                                <Feather name="user-plus" size={28} color="#fff" />
                            </View>
                            <Text style={styles.actionLabel}>Visitor Log</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.actionItem}
                            onPress={() => router.push('/(gate)/history')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.success }]}>
                                <Feather name="clock" size={28} color="#fff" />
                            </View>
                            <Text style={styles.actionLabel}>Entry Logs</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Student List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {searchQuery ? 'Search Results' : 'Recent Students'}
                    </Text>
                    
                    {loading && !refreshing ? (
                        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                    ) : filteredStudents.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Feather name="search" size={48} color={colors.border} />
                            <Text style={styles.emptyText}>No students found</Text>
                        </View>
                    ) : (
                        filteredStudents.slice(0, searchQuery ? 50 : 10).map((student) => (
                            <TouchableOpacity 
                                key={student.id}
                                onPress={() => router.push(`/(gate)/student/${student.id}`)}
                            >
                                <PremiumCard style={styles.studentCard}>
                                    <View style={styles.studentInfo}>
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>{student.name.charAt(0)}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.studentName}>{student.name}</Text>
                                            <Text style={styles.studentDetails}>{student.class} {student.section}</Text>
                                        </View>
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: student.gateStatus?.status === 'checked_out' ? '#FEF2F2' : '#F0FDF4' }
                                        ]}>
                                            <Text style={[
                                                styles.statusText,
                                                { color: student.gateStatus?.status === 'checked_out' ? colors.danger : colors.success }
                                            ]}>
                                                {student.gateStatus?.status === 'checked_out' ? 'Out' : 'In'}
                                            </Text>
                                        </View>
                                        <Feather name="chevron-right" size={20} color={colors.border} />
                                    </View>
                                </PremiumCard>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
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
        backgroundColor: colors.primary,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 25,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...shadows.md,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    greetingText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    userNameText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    roleText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    logoutBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 45,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        marginLeft: 8,
        fontSize: 14,
        color: colors.textPrimary,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 40,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    statBox: {
        width: '31%',
        padding: 15,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 15,
    },
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionItem: {
        width: '31%',
        alignItems: 'center',
    },
    actionIcon: {
        width: 60,
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        ...shadows.sm,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    studentCard: {
        marginBottom: 12,
        padding: 12,
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: colors.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    studentDetails: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'BOLD',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 10,
    }
});

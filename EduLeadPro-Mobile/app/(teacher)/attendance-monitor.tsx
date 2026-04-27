/**
 * Attendance Monitor Screen - Admin view
 * Shows which teachers have/haven't marked attendance today
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Platform,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import { colors, spacing, shadows } from '../../src/theme';

interface TeacherAttendance {
    id: number;
    name: string;
    role: string;
    totalAssigned: number;
    markedCount: number;
    status: 'marked' | 'partial' | 'not_marked';
}

interface Summary {
    total: number;
    marked: number;
    partial: number;
    notMarked: number;
}

export default function AttendanceMonitorScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [teachers, setTeachers] = useState<TeacherAttendance[]>([]);
    const [summary, setSummary] = useState<Summary>({ total: 0, marked: 0, partial: 0, notMarked: 0 });

    const loadData = useCallback(async () => {
        try {
            const result = await api.getAttendanceOverview();
            setTeachers(result.teachers || []);
            setSummary(result.summary || { total: 0, marked: 0, partial: 0, notMarked: 0 });
        } catch (error) {
            console.error('[AttendanceMonitor] Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [loadData]);

    const completionPercent = summary.total > 0
        ? Math.round(((summary.marked + summary.partial * 0.5) / summary.total) * 100)
        : 0;

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'marked':
                return { color: '#16A34A', bg: '#DCFCE7', icon: 'check-circle' as const, label: 'Completed' };
            case 'partial':
                return { color: '#F59E0B', bg: '#FEF3C7', icon: 'alert-circle' as const, label: 'Partial' };
            default:
                return { color: '#EF4444', bg: '#FEE2E2', icon: 'x-circle' as const, label: 'Not Marked' };
        }
    };

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long',
        timeZone: 'Asia/Kolkata'
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Header */}
            <LinearGradient
                colors={['#0EA5E9', '#0284C7']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Feather name="arrow-left" size={22} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Attendance Monitor</Text>
                        <Text style={styles.headerDate}>{today}</Text>
                    </View>
                </View>

                {/* Summary Bar */}
                <View style={styles.summaryBar}>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{completionPercent}% Complete</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        {[
                            { label: 'Total', value: summary.total, color: '#fff' },
                            { label: 'Done', value: summary.marked, color: '#86EFAC' },
                            { label: 'Partial', value: summary.partial, color: '#FDE68A' },
                            { label: 'Pending', value: summary.notMarked, color: '#FCA5A5' },
                        ].map(item => (
                            <View key={item.label} style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
                                <Text style={styles.summaryLabel}>{item.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </LinearGradient>

            {/* Teacher List */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : teachers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Feather name="users" size={48} color={colors.textTertiary} />
                        <Text style={styles.emptyTitle}>No Assignments Found</Text>
                        <Text style={styles.emptySubtitle}>No teachers with student assignments were found.</Text>
                    </View>
                ) : (
                    teachers.map(teacher => {
                        const config = getStatusConfig(teacher.status);
                        return (
                            <View key={teacher.id} style={styles.teacherCard}>
                                <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                                <View style={styles.teacherInfo}>
                                    <Text style={styles.teacherName}>{teacher.name}</Text>
                                    <Text style={styles.teacherRole}>{teacher.role}</Text>
                                </View>
                                <View style={styles.teacherStats}>
                                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                                        <Feather name={config.icon} size={13} color={config.color} />
                                        <Text style={[styles.statusText, { color: config.color }]}>
                                            {config.label}
                                        </Text>
                                    </View>
                                    <Text style={styles.countText}>
                                        {teacher.markedCount}/{teacher.totalAssigned} students
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        paddingTop: Platform.OS === 'ios' ? 56 : 44,
        paddingBottom: 20,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 22, fontFamily: 'Outfit_Bold', color: '#fff',
    },
    headerDate: {
        fontSize: 12, fontFamily: 'Lexend_Regular', color: 'rgba(255,255,255,0.7)', marginTop: 2,
    },
    summaryBar: {
        marginTop: 20,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 16,
        padding: 16,
    },
    progressContainer: {
        marginBottom: 14,
    },
    progressTrack: {
        height: 8, borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%', borderRadius: 4,
        backgroundColor: '#86EFAC',
    },
    progressText: {
        fontSize: 11, fontFamily: 'Lexend_Medium', color: 'rgba(255,255,255,0.8)', marginTop: 6,
    },
    summaryRow: {
        flexDirection: 'row', justifyContent: 'space-around',
    },
    summaryItem: { alignItems: 'center' },
    summaryValue: {
        fontSize: 20, fontFamily: 'Outfit_Bold',
    },
    summaryLabel: {
        fontSize: 10, fontFamily: 'Lexend_Regular', color: 'rgba(255,255,255,0.6)', marginTop: 2,
    },
    content: { flex: 1 },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80,
    },
    emptyState: {
        alignItems: 'center', marginTop: 80, gap: 8,
    },
    emptyTitle: {
        fontSize: 18, fontFamily: 'Outfit_Bold', color: colors.textPrimary,
    },
    emptySubtitle: {
        fontSize: 13, fontFamily: 'Lexend_Regular', color: colors.textSecondary, textAlign: 'center',
    },
    teacherCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadows.sm,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    statusDot: {
        width: 10, height: 10, borderRadius: 5, marginRight: 12,
    },
    teacherInfo: {
        flex: 1,
    },
    teacherName: {
        fontSize: 15, fontFamily: 'Outfit_Bold', color: colors.textPrimary,
    },
    teacherRole: {
        fontSize: 11, fontFamily: 'Lexend_Regular', color: colors.textSecondary, textTransform: 'capitalize',
    },
    teacherStats: {
        alignItems: 'flex-end', gap: 4,
    },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11, fontFamily: 'Lexend_Medium',
    },
    countText: {
        fontSize: 10, fontFamily: 'Lexend_Regular', color: colors.textSecondary,
    },
});

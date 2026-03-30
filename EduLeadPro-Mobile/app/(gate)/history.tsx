import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image,
    Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, shadows } from '../../src/theme';
import PremiumCard from '../../src/components/ui/PremiumCard';
import { gateAPI } from '../../src/services/api/gate.api';

type Tab = 'students' | 'visitors';

export default function GateHistoryScreen() {
    const [activeTab, setActiveTab] = useState<Tab>('students');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [studentLogs, setStudentLogs] = useState<any[]>([]);
    const [visitorLogs, setVisitorLogs] = useState<any[]>([]);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            // Fetch students to get their current status as a proxy for history if no explicit history API
            const students = await gateAPI.getGateStudents('');
            setStudentLogs(students.filter(s => s.gateStatus).sort((a,b) => 
                new Date(b.gateStatus.updated_at).getTime() - new Date(a.gateStatus.updated_at).getTime()
            ));

            const visitors = await gateAPI.getVisitorHistory();
            setVisitorLogs(visitors);
        } catch (error) {
            console.error('Logs load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLogs();
        setRefreshing(false);
    };

    const formatTime = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return '--:--';
        }
    };

    return (
        <View style={styles.container}>
            {/* Custom Tab Switcher */}
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'students' && styles.activeTab]}
                    onPress={() => setActiveTab('students')}
                >
                    <Text style={[styles.tabText, activeTab === 'students' && styles.activeTabText]}>Students</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'visitors' && styles.activeTab]}
                    onPress={() => setActiveTab('visitors')}
                >
                    <Text style={[styles.tabText, activeTab === 'visitors' && styles.activeTabText]}>Visitors</Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    <View style={styles.listContainer}>
                        {activeTab === 'students' ? (
                            studentLogs.length === 0 ? (
                                <Text style={styles.emptyText}>No entry logs today</Text>
                            ) : (
                                studentLogs.map((log, i) => (
                                    <PremiumCard key={i} style={styles.logCard}>
                                        <View style={styles.logRow}>
                                            <View style={styles.avatar}>
                                                <Text style={styles.avatarText}>{log.name.charAt(0)}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.studentName}>{log.name}</Text>
                                                <Text style={styles.logSubText}>
                                                    {log.gateStatus.status === 'checked_out' ? 'Checked Out' : 'Checked In'}
                                                </Text>
                                            </View>
                                            <View style={styles.timeInfo}>
                                                <Text style={styles.timeText}>{formatTime(log.gateStatus.updated_at)}</Text>
                                                <View style={[
                                                    styles.indicator, 
                                                    { backgroundColor: log.gateStatus.status === 'checked_out' ? colors.danger : colors.success }
                                                ]} />
                                            </View>
                                        </View>
                                        {log.gateStatus.pickup_verification && (
                                            <View style={styles.metaRow}>
                                                <Feather name="shield" size={14} color={colors.textSecondary} />
                                                <Text style={styles.metaText}>
                                                    Picked by: {log.gateStatus.pickup_verification.charAt(0).toUpperCase() + log.gateStatus.pickup_verification.slice(1)}
                                                </Text>
                                            </View>
                                        )}
                                    </PremiumCard>
                                ))
                            )
                        ) : (
                            visitorLogs.length === 0 ? (
                                <Text style={styles.emptyText}>No active visitors found</Text>
                            ) : (
                                visitorLogs.map((v, i) => (
                                    <PremiumCard key={v.id} style={styles.logCard}>
                                        <View style={styles.logRow}>
                                            <View style={[styles.avatar, { backgroundColor: '#FDE68A' }]}>
                                                <Feather name="user" size={20} color="#92400E" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.studentName}>{v.name}</Text>
                                                <Text style={styles.logSubText} numberOfLines={1}>{v.purpose}</Text>
                                            </View>
                                            <View style={styles.timeInfo}>
                                                <Text style={styles.timeText}>{formatTime(v.entry_time)}</Text>
                                                <TouchableOpacity 
                                                    style={styles.checkoutBtn}
                                                    onPress={async () => {
                                                        try {
                                                            await gateAPI.visitorCheckOut(v.id);
                                                            loadLogs();
                                                        } catch (e) { Alert.alert('Error', 'Failed to checkout'); }
                                                    }}
                                                >
                                                    <Text style={styles.checkoutBtnText}>Checkout</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </PremiumCard>
                                ))
                            )
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 6,
        margin: 15,
        borderRadius: 12,
        ...shadows.sm,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    activeTabText: {
        color: '#fff',
    },
    content: {
        flex: 1,
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingBottom: 30,
    },
    logCard: {
        padding: 15,
        marginBottom: 12,
    },
    logRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
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
    logSubText: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    timeInfo: {
        alignItems: 'flex-end',
    },
    timeText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
        marginBottom: 4,
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 0.5,
        borderTopColor: colors.border,
    },
    metaText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginLeft: 6,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: colors.textSecondary,
        fontSize: 15,
    },
    checkoutBtn: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    checkoutBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.danger,
    }
});

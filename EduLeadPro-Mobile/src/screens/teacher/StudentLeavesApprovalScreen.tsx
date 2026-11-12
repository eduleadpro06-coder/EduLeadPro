import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    RefreshControl,
    Modal,
    TextInput,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import teacherAPI from '../../services/api/teacher.api';

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const STATUS_COLOR: Record<string, string> = {
    pending: '#F59E0B',
    approved: '#10B981',
    rejected: '#EF4444',
};

const StudentLeavesApprovalScreen = () => {
    const navigation = useNavigation();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');

    // Rejection modal state
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchLeaves = useCallback(async () => {
        setLoading(true);
        try {
            const data = await teacherAPI.getStudentLeaves(
                statusFilter === 'all' ? undefined : statusFilter
            );
            setLeaves(data ?? []);
        } catch (error) {
            console.error('Failed to fetch student leaves:', error);
            Alert.alert('Error', 'Failed to load student leave requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [statusFilter]);

    useFocusEffect(
        useCallback(() => {
            fetchLeaves();
        }, [fetchLeaves])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLeaves();
    }, [fetchLeaves]);

    const handleApprove = async (leave: any) => {
        Alert.alert(
            'Approve Leave',
            `Approve leave for ${leave.student?.name ?? 'this student'}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            await teacherAPI.updateStudentLeaveStatus(leave.id, 'approved');
                            fetchLeaves();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to approve leave');
                        }
                    }
                }
            ]
        );
    };

    const handleRejectOpen = (leave: any) => {
        setSelectedLeave(leave);
        setRejectionReason('');
        setRejectModalVisible(true);
    };

    const handleRejectConfirm = async () => {
        if (!rejectionReason.trim()) {
            Alert.alert('Required', 'Please enter a rejection reason');
            return;
        }
        setSubmitting(true);
        try {
            await teacherAPI.updateStudentLeaveStatus(selectedLeave.id, 'rejected', rejectionReason);
            setRejectModalVisible(false);
            fetchLeaves();
        } catch (error) {
            Alert.alert('Error', 'Failed to reject leave');
        } finally {
            setSubmitting(false);
        }
    };

    const renderLeave = ({ item }: { item: any }) => {
        const studentName = item.student?.name ?? 'Student';
        const studentClass = item.student?.class ?? '';
        const status = item.status as string;

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <View style={styles.studentAvatar}>
                        <Text style={styles.avatarText}>{studentName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.studentName}>{studentName}</Text>
                        {studentClass ? <Text style={styles.studentClass}>Class {studentClass}</Text> : null}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[status] + '20' }]}>
                        <Text style={[styles.statusText, { color: STATUS_COLOR[status] }]}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text style={styles.infoText}>
                        {format(new Date(item.startDate), 'dd MMM')} – {format(new Date(item.endDate), 'dd MMM yyyy')}
                    </Text>
                </View>

                <Text style={styles.reason}>{item.reason}</Text>

                {item.rejectionReason ? (
                    <Text style={styles.rejectionNote}>Note: {item.rejectionReason}</Text>
                ) : null}

                <Text style={styles.appliedAt}>Applied: {format(new Date(item.appliedAt), 'dd MMM yyyy, h:mm a')}</Text>

                {status === 'pending' && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
                            <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
                            <Text style={styles.approveBtnText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectOpen(item)}>
                            <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                            <Text style={styles.rejectBtnText}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#643ae5', '#4F46E5']} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Student Leaves</Text>
            </LinearGradient>

            {/* Status Filter Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterBar}
                contentContainerStyle={{ paddingHorizontal: 16 }}
            >
                {STATUS_FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}
                        onPress={() => setStatusFilter(f)}
                    >
                        <Text style={[styles.filterText, statusFilter === f && styles.filterTextActive]}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* List */}
            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#643ae5" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={leaves}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderLeave}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#643ae5" />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={56} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No leave requests</Text>
                        </View>
                    }
                />
            )}

            {/* Rejection Modal */}
            <Modal visible={rejectModalVisible} animationType="slide" transparent onRequestClose={() => setRejectModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Reject Leave</Text>
                        <Text style={styles.modalSubtitle}>
                            For {selectedLeave?.student?.name ?? 'student'} –{' '}
                            {selectedLeave ? format(new Date(selectedLeave.startDate), 'dd MMM') : ''} to{' '}
                            {selectedLeave ? format(new Date(selectedLeave.endDate), 'dd MMM yyyy') : ''}
                        </Text>
                        <Text style={styles.label}>Rejection Reason *</Text>
                        <TextInput
                            style={styles.reasonInput}
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                            placeholder="Enter reason for rejection..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setRejectModalVisible(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmRejectBtn} onPress={handleRejectConfirm} disabled={submitting}>
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.confirmRejectText}>Confirm Reject</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: 20,
    },
    backBtn: { marginRight: 12, padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
    filterBar: { marginVertical: 12, flexShrink: 0 },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFF',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    filterChipActive: { backgroundColor: '#643ae5', borderColor: '#643ae5' },
    filterText: { fontSize: 13, color: '#374151', fontWeight: '500' },
    filterTextActive: { color: '#FFF', fontWeight: '600' },
    list: { padding: 16, paddingBottom: 32 },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    studentAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#EDE9FE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: '700', color: '#643ae5' },
    studentName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    studentClass: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: '600' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    infoText: { fontSize: 13, color: '#6B7280' },
    reason: { fontSize: 14, color: '#374151', marginBottom: 4 },
    rejectionNote: { fontSize: 12, color: '#EF4444', fontStyle: 'italic', marginTop: 4 },
    appliedAt: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    approveBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        borderRadius: 10,
        paddingVertical: 10,
        gap: 6,
    },
    approveBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
    rejectBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        borderRadius: 10,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#FECACA',
        gap: 6,
    },
    rejectBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyText: { fontSize: 15, color: '#9CA3AF', marginTop: 12 },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: 40,
    },
    modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
    modalSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
    reasonInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 14,
        fontSize: 15,
        color: '#111827',
        minHeight: 100,
        marginBottom: 20,
    },
    modalActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    cancelText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
    confirmRejectBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#EF4444',
        alignItems: 'center',
    },
    confirmRejectText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});

export default StudentLeavesApprovalScreen;

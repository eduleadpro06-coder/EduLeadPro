import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    Alert,
    RefreshControl,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import parentAPI from '../../services/api/parent.api';

const STATUS_COLOR: Record<string, string> = {
    pending: '#F59E0B',
    approved: '#10B981',
    rejected: '#EF4444',
};

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
};

const StudentLeaveApplicationScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const children = (user as any)?.children ?? [];
    const [selectedChild, setSelectedChild] = useState<any>(children[0] ?? null);

    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [reason, setReason] = useState('');
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const fetchLeaves = useCallback(async () => {
        if (!selectedChild) return;
        setLoading(true);
        try {
            const data = await parentAPI.getChildLeaves(Number(selectedChild.id));
            setLeaves(data ?? []);
        } catch (error) {
            console.error('Failed to fetch leaves:', error);
            Alert.alert('Error', 'Failed to load leave history');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedChild]);

    useFocusEffect(
        useCallback(() => {
            fetchLeaves();
        }, [fetchLeaves])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLeaves();
    }, [fetchLeaves]);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            Alert.alert('Required', 'Please enter a reason for the leave');
            return;
        }
        if (endDate < startDate) {
            Alert.alert('Invalid Date', 'End date cannot be before start date');
            return;
        }
        if (!selectedChild) {
            Alert.alert('No Child', 'Please select a child first');
            return;
        }
        setSubmitting(true);
        try {
            await parentAPI.applyChildLeave(Number(selectedChild.id), {
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd'),
                reason,
            });
            setModalVisible(false);
            setReason('');
            setStartDate(new Date());
            setEndDate(new Date());
            Alert.alert('Success', 'Leave application submitted successfully');
            fetchLeaves();
        } catch (error) {
            console.error('Failed to apply leave:', error);
            Alert.alert('Error', 'Failed to submit leave application');
        } finally {
            setSubmitting(false);
        }
    };

    const getDayCount = () => {
        const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return Math.max(1, diff);
    };

    const renderLeave = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
                        {STATUS_LABEL[item.status] ?? item.status}
                    </Text>
                </View>
                <Text style={styles.dateRange}>
                    {format(new Date(item.startDate), 'dd MMM')} – {format(new Date(item.endDate), 'dd MMM yyyy')}
                </Text>
            </View>
            <Text style={styles.reason}>{item.reason}</Text>
            {item.rejectionReason ? (
                <Text style={styles.rejection}>Reason: {item.rejectionReason}</Text>
            ) : null}
            <Text style={styles.appliedAt}>Applied: {format(new Date(item.appliedAt), 'dd MMM yyyy')}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#643ae5', '#4F46E5']} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Apply Leave</Text>
            </LinearGradient>

            {/* Child Selector */}
            {children.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSelector} contentContainerStyle={{ paddingHorizontal: 16 }}>
                    {children.map((c: any) => (
                        <TouchableOpacity
                            key={c.id}
                            style={[styles.childChip, selectedChild?.id === c.id && styles.childChipActive]}
                            onPress={() => setSelectedChild(c)}
                        >
                            <Text style={[styles.childChipText, selectedChild?.id === c.id && styles.childChipTextActive]}>
                                {c.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Leave List */}
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
                            <Ionicons name="calendar-outline" size={56} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No leave applications yet</Text>
                        </View>
                    }
                />
            )}

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <LinearGradient colors={['#643ae5', '#4F46E5']} style={styles.fabGradient}>
                    <Ionicons name="add" size={28} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>

            {/* Apply Leave Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Apply Leave for {selectedChild?.name}</Text>

                        {/* Start Date */}
                        <Text style={styles.label}>From</Text>
                        <TouchableOpacity style={styles.dateInput} onPress={() => setShowStartPicker(true)}>
                            <Ionicons name="calendar-outline" size={20} color="#643ae5" />
                            <Text style={styles.dateText}>{format(startDate, 'dd MMMM yyyy')}</Text>
                        </TouchableOpacity>
                        {showStartPicker && (
                            <DateTimePicker
                                value={startDate}
                                mode="date"
                                display="default"
                                minimumDate={new Date()}
                                onChange={(_e: DateTimePickerEvent, date?: Date) => {
                                    setShowStartPicker(false);
                                    if (date) setStartDate(date);
                                }}
                            />
                        )}

                        {/* End Date */}
                        <Text style={styles.label}>To</Text>
                        <TouchableOpacity style={styles.dateInput} onPress={() => setShowEndPicker(true)}>
                            <Ionicons name="calendar-outline" size={20} color="#643ae5" />
                            <Text style={styles.dateText}>{format(endDate, 'dd MMMM yyyy')}</Text>
                        </TouchableOpacity>
                        {showEndPicker && (
                            <DateTimePicker
                                value={endDate}
                                mode="date"
                                display="default"
                                minimumDate={startDate}
                                onChange={(_e: DateTimePickerEvent, date?: Date) => {
                                    setShowEndPicker(false);
                                    if (date) setEndDate(date);
                                }}
                            />
                        )}

                        <Text style={styles.dayCount}>Duration: {getDayCount()} day{getDayCount() !== 1 ? 's' : ''}</Text>

                        {/* Reason */}
                        <Text style={styles.label}>Reason</Text>
                        <TextInput
                            style={styles.reasonInput}
                            value={reason}
                            onChangeText={setReason}
                            placeholder="Enter reason for leave..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        {/* Actions */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                                <LinearGradient colors={['#643ae5', '#4F46E5']} style={styles.submitGradient}>
                                    {submitting ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <Text style={styles.submitText}>Submit</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
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
    childSelector: { marginVertical: 12, flexShrink: 0 },
    childChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFF',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    childChipActive: { backgroundColor: '#643ae5', borderColor: '#643ae5' },
    childChipText: { fontSize: 14, color: '#374151' },
    childChipTextActive: { color: '#FFF', fontWeight: '600' },
    list: { padding: 16, paddingBottom: 100 },
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
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: '600' },
    dateRange: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    reason: { fontSize: 14, color: '#374151', marginBottom: 4 },
    rejection: { fontSize: 13, color: '#EF4444', marginTop: 4 },
    appliedAt: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyText: { fontSize: 15, color: '#9CA3AF', marginTop: 12 },
    fab: { position: 'absolute', bottom: 32, right: 24, borderRadius: 30, overflow: 'hidden', elevation: 6 },
    fabGradient: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: 40,
    },
    modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 14,
        marginBottom: 14,
        gap: 10,
    },
    dateText: { fontSize: 15, color: '#111827' },
    dayCount: { fontSize: 13, color: '#643ae5', fontWeight: '600', marginBottom: 14 },
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
    submitBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    submitGradient: { padding: 14, alignItems: 'center' },
    submitText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});

export default StudentLeaveApplicationScreen;


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
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import teacherAPI from '../../services/api/teacher.api';
import { LeaveApplication } from '../../types/teacher.types';
import { format, addDays } from 'date-fns';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const LeaveApplicationScreen = () => {
    const navigation = useNavigation();
    const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
    const [balance, setBalance] = useState<{ cl: any; el: any } | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [reason, setReason] = useState('');
    const [leaveType, setLeaveType] = useState<'CL' | 'EL'>('CL');
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const [leavesData, balanceData] = await Promise.all([
                teacherAPI.getLeaves(),
                teacherAPI.getLeaveBalance()
            ]);
            setLeaves(leavesData);
            setBalance(balanceData);
        } catch (error) {
            console.error('Failed to fetch leaves:', error);
            Alert.alert('Error', 'Failed to load leave history');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchLeaves();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLeaves();
    }, []);

    const handleApplyLeave = async () => {
        if (!reason.trim()) {
            Alert.alert('Required', 'Please enter a reason for your leave');
            return;
        }

        if (endDate < startDate) {
            Alert.alert('Invalid Date', 'End date cannot be before start date');
            return;
        }

        try {
            await teacherAPI.applyLeave({
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd'),
                reason,
                leaveType
            });
            setModalVisible(false);
            setReason('');
            setStartDate(new Date());
            setEndDate(new Date());
            Alert.alert('Success', 'Leave application submitted successfully');
            fetchLeaves();
        } catch (error) {
            console.error('Failed to apply for leave:', error);
            Alert.alert('Error', 'Failed to submit leave application');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return '#4CAF50';
            case 'rejected': return '#F44336';
            default: return '#FF9800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return 'check-circle';
            case 'rejected': return 'close-circle';
            default: return 'clock';
        }
    };

    const renderItem = ({ item }: { item: LeaveApplication }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.dateContainer}>
                    <Text style={styles.dateLabel}>From:</Text>
                    <Text style={styles.dateValue}>
                        {item.start_date ? format(new Date(item.start_date), 'MMM dd, yyyy') : '-'}
                    </Text>
                </View>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#666" style={{ marginHorizontal: 10 }} />
                <View style={styles.dateContainer}>
                    <Text style={styles.dateLabel}>To:</Text>
                    <Text style={styles.dateValue}>
                        {item.end_date ? format(new Date(item.end_date), 'MMM dd, yyyy') : '-'}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.reasonTitle}>Reason:</Text>
            <Text style={styles.reasonText}>{item.reason}</Text>

            <View style={styles.footer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <MaterialCommunityIcons
                        name={getStatusIcon(item.status) as any}
                        size={16}
                        color={getStatusColor(item.status)}
                        style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.appliedDate}>
                    Applied: {item.applied_at ? format(new Date(item.applied_at), 'MMM dd') : ''}
                </Text>
            </View>

            {item.status === 'rejected' && item.rejection_reason && (
                <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionLabel}>Admin Note:</Text>
                    <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
                </View>
            )}
        </View>
    );

    const onStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowStartPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setStartDate(selectedDate);
            // Auto update end date if it's before start date
            if (endDate < selectedDate) {
                setEndDate(selectedDate);
            }
        }
    };

    const onEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowEndPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setEndDate(selectedDate);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Leave Applications</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <FlatList
                data={leaves}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b5998" />
                }
                ListHeaderComponent={
                    balance ? (
                        <View style={styles.balanceContainer}>
                            <View style={[styles.balanceCard, { backgroundColor: '#E3F2FD', borderColor: '#2196F3' }]}>
                                <Text style={[styles.balanceLabel, { color: '#1565C0' }]}>Casual Leave</Text>
                                <Text style={styles.balanceValue}>
                                    {Math.max(0, balance.cl?.balance ?? 0)}
                                </Text>
                                <Text style={styles.balanceSubtext}>Left</Text>
                            </View>
                            <View style={[styles.balanceCard, { backgroundColor: '#F3E5F5', borderColor: '#9C27B0' }]}>
                                <Text style={[styles.balanceLabel, { color: '#7B1FA2' }]}>Emergency Leave</Text>
                                <Text style={styles.balanceValue}>
                                    {Math.max(0, balance.el?.balance ?? 0)}
                                </Text>
                                <Text style={styles.balanceSubtext}>Left</Text>
                            </View>
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No leave applications history</Text>
                        </View>
                    ) : null
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <Feather name="plus" size={24} color="#FFF" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Apply for Leave</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Feather name="x" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <Text style={styles.label}>Leave Type</Text>
                            <View style={styles.leaveTypeContainer}>
                                <TouchableOpacity
                                    style={[styles.leaveTypeButton, leaveType === 'CL' && styles.leaveTypeActive]}
                                    onPress={() => setLeaveType('CL')}
                                >
                                    <Text style={[styles.leaveTypeText, leaveType === 'CL' && styles.leaveTypeTextActive]}>Casual Leave (CL)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.leaveTypeButton, leaveType === 'EL' && styles.leaveTypeActive]}
                                    onPress={() => setLeaveType('EL')}
                                >
                                    <Text style={[styles.leaveTypeText, leaveType === 'EL' && styles.leaveTypeTextActive]}>Emergency Leave (EL)</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>From Date</Text>
                            <TouchableOpacity
                                style={styles.datePickerButton}
                                onPress={() => setShowStartPicker(true)}
                            >
                                <Feather name="calendar" size={20} color="#666" />
                                <Text style={styles.datePickerText}>{format(startDate, 'EEE, MMMM dd, yyyy')}</Text>
                            </TouchableOpacity>
                            {showStartPicker && (
                                <DateTimePicker
                                    value={startDate}
                                    mode="date"
                                    display="default"
                                    onChange={onStartDateChange}
                                    minimumDate={new Date()}
                                />
                            )}

                            <Text style={styles.label}>To Date</Text>
                            <TouchableOpacity
                                style={styles.datePickerButton}
                                onPress={() => setShowEndPicker(true)}
                            >
                                <Feather name="calendar" size={20} color="#666" />
                                <Text style={styles.datePickerText}>{format(endDate, 'EEE, MMMM dd, yyyy')}</Text>
                            </TouchableOpacity>
                            {showEndPicker && (
                                <DateTimePicker
                                    value={endDate}
                                    mode="date"
                                    display="default"
                                    onChange={onEndDateChange}
                                    minimumDate={startDate}
                                />
                            )}

                            <Text style={styles.label}>Reason</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Enter reason for leave..."
                                value={reason}
                                onChangeText={setReason}
                                multiline
                                numberOfLines={4}
                            />

                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={handleApplyLeave}
                            >
                                <Text style={styles.applyButtonText}>Submit Application</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 0 : 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateContainer: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 2,
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#EEE',
        marginVertical: 12,
    },
    reasonTitle: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    reasonText: {
        fontSize: 14,
        color: '#444',
        marginBottom: 12,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    appliedDate: {
        fontSize: 12,
        color: '#999',
    },
    rejectionBox: {
        marginTop: 12,
        backgroundColor: '#FFEBEE',
        padding: 10,
        borderRadius: 8,
    },
    rejectionLabel: {
        fontSize: 12,
        color: '#D32F2F',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    rejectionText: {
        fontSize: 13,
        color: '#C62828',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3b5998',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 16,
        color: '#888',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        marginLeft: 4,
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        padding: 15,
        marginBottom: 16,
    },
    datePickerText: {
        fontSize: 16,
        marginLeft: 10,
        color: '#333',
    },
    input: {
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 20,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    applyButton: {
        backgroundColor: '#3b5998',
        borderRadius: 10,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    applyButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    leaveTypeContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 10,
    },
    leaveTypeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    leaveTypeActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
    },
    leaveTypeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    leaveTypeTextActive: {
        color: '#2196F3',
    },
    balanceContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 12,
    },
    balanceCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    balanceValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    balanceSubtext: {
        fontSize: 10,
        color: '#666',
    },
});

export default LeaveApplicationScreen;

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
import { Feather } from '@expo/vector-icons';
import { api } from './services/api';
import { useOffline } from './src/hooks/useOffline';
import { offlineCache } from './src/services/offline-cache';
import OfflineBanner from './src/components/OfflineBanner';

interface ParentFeesScreenProps {
    childId: number;
    onBack: () => void;
}

export default function ParentFeesScreen({ childId, onBack }: ParentFeesScreenProps) {
    const [feeData, setFeeData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { isOnline, lastSyncTime, syncNow, isSyncing } = useOffline();

    useEffect(() => {
        loadFees();
    }, [childId]);

    const loadFees = async () => {
        setLoading(true);
        try {
            const data = await api.getChildFees(childId);
            setFeeData(data);
        } catch (error) {
            console.error('Failed to load fees:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadFees();
        await syncNow();
        setRefreshing(false);
    };

    return (
        <View style={styles.container}>
            {/* Offline Banner */}
            <OfflineBanner
                isOnline={isOnline}
                lastSyncTime={lastSyncTime}
                isSyncing={isSyncing}
                onSyncPress={syncNow}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Fee Details</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 50 }} />
            ) : (
                <ScrollView
                    style={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {/* Fee Summary Card */}
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Fees</Text>
                            <Text style={styles.summaryValue}>₹{feeData?.totalFees || 0}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Amount Paid</Text>
                            <Text style={[styles.summaryValue, { color: '#10B981' }]}>₹{feeData?.paidAmount || 0}</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
                            <Text style={styles.summaryLabelBold}>Balance Due</Text>
                            <Text style={styles.summaryValueBold}>₹{feeData?.balanceDue || 0}</Text>
                        </View>
                    </View>

                    {/* Payment History */}
                    <Text style={styles.sectionTitle}>Payment History</Text>
                    {feeData?.payments && feeData.payments.length > 0 ? (
                        feeData.payments.map((payment: any, index: number) => (
                            <View key={index} style={styles.paymentCard}>
                                <View style={styles.paymentHeader}>
                                    <Text style={styles.paymentDate}>{new Date(payment.date).toLocaleDateString()}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                                        <Text style={[styles.statusText, { color: '#065F46' }]}>PAID</Text>
                                    </View>
                                </View>
                                <Text style={styles.paymentAmount}>₹{payment.amount}</Text>
                                <Text style={styles.paymentMethod}>{payment.method || 'Cash'}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No payment history</Text>
                    )}

                    {/* Pay Now Button (placeholder) */}
                    {feeData?.balanceDue > 0 && (
                        <TouchableOpacity style={styles.payButton}>
                            <Feather name="credit-card" size={20} color="#fff" />
                            <Text style={styles.payButtonText}>Pay Now</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827'
    },
    content: {
        flex: 1,
        padding: 16
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    summaryRowHighlight: {
        backgroundColor: '#F3F4F6',
        marginHorizontal: -20,
        paddingHorizontal: 20,
        borderBottomWidth: 0,
        marginTop: 8,
        paddingVertical: 16
    },
    summaryLabel: {
        fontSize: 16,
        color: '#6B7280'
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827'
    },
    summaryLabelBold: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827'
    },
    summaryValueBold: {
        fontSize: 24,
        fontWeight: '700',
        color: '#EF4444'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16
    },
    paymentCard: {
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
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    paymentDate: {
        fontSize: 14,
        color: '#6B7280'
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600'
    },
    paymentAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4
    },
    paymentMethod: {
        fontSize: 14,
        color: '#9CA3AF'
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 32
    },
    payButton: {
        backgroundColor: '#8B5CF6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        marginTop: 24,
        marginBottom: 32
    },
    payButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});

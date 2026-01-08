import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { api } from './services/api';
import { Feather } from '@expo/vector-icons';
import { useOffline } from './src/hooks/useOffline';
import OfflineBanner from './src/components/OfflineBanner';
import PremiumCard from './src/components/ui/PremiumCard';
import PremiumButton from './src/components/ui/PremiumButton';
import { colors, spacing, typography } from './src/theme';

interface ParentFeesScreenProps {
    currentChild: any;
}

export default function ParentFeesScreen({ currentChild }: ParentFeesScreenProps) {
    const [feeData, setFeeData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { isOnline, lastSyncTime, syncNow, isSyncing } = useOffline();

    useEffect(() => {
        if (currentChild?.id) {
            loadFees();
        } else {
            setLoading(false);
        }
    }, [currentChild]);

    const loadFees = async () => {
        setLoading(true);
        try {
            const data = await api.getStudentFees(currentChild.id);
            setFeeData({
                totalFees: data.totalFees,
                paidAmount: data.totalPaid, // Fixed: Backend sends 'totalPaid'
                balanceDue: data.balance,
                payments: data.payments,
                emiDetails: data.emiDetails
            });
        } catch (error) {
            console.error('Failed to load fees:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadFees();
        setRefreshing(false);
    };

    const formatCurrency = (amount: any) => {
        if (amount === undefined || amount === null) return '₹0';
        // Use Indian Number Format logic manually for consistency/reliability
        const val = Number(amount);
        if (isNaN(val)) return '₹0';
        return '₹' + val.toLocaleString('en-IN');
    };

    if (!currentChild) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <View style={[styles.iconCircle, { backgroundColor: colors.surfaceHighlight }]}>
                    <Feather name="user-x" size={32} color={colors.textSecondary} />
                </View>
                <Text style={styles.emptyTitle}>No Student Selected</Text>
                <Text style={styles.emptyText}>Please select a student to view fee details.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <OfflineBanner
                isOnline={isOnline}
                lastSyncTime={lastSyncTime}
                isSyncing={isSyncing}
                onSyncPress={syncNow}
            />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Fee Details</Text>
                <Text style={styles.headerSubtitle}>{currentChild.name}</Text>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Fee Summary Card */}
                <PremiumCard variant="elevated" style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Fees</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(feeData?.totalFees)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Amount Paid</Text>
                        <Text style={[styles.summaryValue, { color: colors.success }]}>{formatCurrency(feeData?.paidAmount)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={[styles.summaryRow, { marginTop: spacing.sm }]}>
                        <Text style={styles.summaryLabelBold}>Balance Due</Text>
                        <Text style={styles.summaryValueBold}>{formatCurrency(feeData?.balanceDue)}</Text>
                    </View>
                </PremiumCard>

                {/* EMI Details */}
                {feeData?.emiDetails && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>EMI Plan</Text>
                        <PremiumCard variant="outlined" style={styles.emiCard}>
                            <View style={styles.emiHeader}>
                                <View>
                                    <Text style={styles.emiLabel}>Total EMI Amount</Text>
                                    <Text style={styles.emiValue}>{formatCurrency(feeData.emiDetails.totalAmount)}</Text>
                                </View>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>ACTIVE</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <Text style={[styles.sectionTitle, { fontSize: 14, marginTop: 8 }]}>Installments</Text>
                            {feeData.emiDetails.installments.map((inst: any) => (
                                <View key={inst.id} style={styles.installmentRow}>
                                    <View style={styles.instLeft}>
                                        <View style={[styles.instDot, inst.status === 'paid' ? styles.instDotPaid : styles.instDotPending]} />
                                        <View>
                                            <Text style={styles.instAmount}>{formatCurrency(inst.amount)}</Text>
                                            <Text style={styles.instDate}>Due: {new Date(inst.dueDate).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.instBadge, inst.status === 'paid' ? styles.instBadgePaid : styles.instBadgePending]}>
                                        <Text style={[styles.instStatusText, inst.status === 'paid' ? { color: colors.success } : { color: colors.warning }]}>
                                            {inst.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </PremiumCard>
                    </View>
                )}

                {/* Payment History */}
                <Text style={styles.sectionTitle}>Payment History</Text>

                {loading ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: colors.textSecondary }}>Loading history...</Text>
                    </View>
                ) : (
                    feeData?.payments && feeData.payments.length > 0 ? (
                        feeData.payments.map((payment: any, index: number) => (
                            <PremiumCard key={index} variant="outlined" style={styles.paymentCard}>
                                <View style={styles.paymentHeader}>
                                    <View style={styles.paymentLeft}>
                                        <View style={styles.checkIcon}>
                                            <Feather name="check" size={14} color={colors.success} />
                                        </View>
                                        <View>
                                            <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                                            <Text style={styles.paymentDate}>{new Date(payment.date).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.statusBadge}>
                                        <Text style={styles.statusText}>{payment.status?.toUpperCase() || 'COMPLETED'}</Text>
                                    </View>
                                </View>
                                <View style={styles.paymentFooter}>
                                    <Text style={styles.paymentMethod}>
                                        Via {payment.mode || 'Cash'} • Receipt #{payment.receiptNumber || 'N/A'}
                                    </Text>
                                </View>
                            </PremiumCard>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No payment history found.</Text>
                        </View>
                    )
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centerContent: { justifyContent: 'center', alignItems: 'center', padding: 40 },
    header: { paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.md, backgroundColor: colors.surface },
    headerTitle: { ...typography.h2, color: colors.textPrimary },
    headerSubtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },

    content: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm },

    // Standardized padding for cards
    summaryCard: { padding: spacing.md, marginBottom: spacing.lg, backgroundColor: colors.surface, borderRadius: spacing.borderRadius.md }, // Changed to md to match others if needed, or keep lg for hero feel.
    // ...
    // Let's verify theme first.
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
    summaryLabel: { ...typography.body, color: colors.textSecondary },
    summaryValue: { ...typography.h3, color: colors.textPrimary },
    summaryLabelBold: { ...typography.h3, color: colors.textPrimary },
    summaryValueBold: { ...typography.h2, color: colors.danger },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },

    sectionTitle: { ...typography.h3, marginBottom: spacing.md, color: colors.textPrimary },

    paymentCard: { marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderRadius: spacing.borderRadius.md },
    paymentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    checkIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.success + '20', alignItems: 'center', justifyContent: 'center' },
    paymentAmount: { ...typography.h3, color: colors.textPrimary },
    paymentDate: { ...typography.caption, color: colors.textSecondary },

    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.success + '20' },
    statusText: { ...typography.caption, fontWeight: '700', color: colors.success },

    paymentFooter: { marginTop: spacing.xs, paddingLeft: 32 },
    paymentMethod: { ...typography.caption, color: colors.textTertiary },

    iconCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    emptyState: { alignItems: 'center', padding: spacing.xl },
    emptyTitle: { ...typography.h3, marginBottom: spacing.xs, color: colors.textPrimary },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },

    // EMI Styles
    section: { marginBottom: spacing.lg },
    emiCard: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: spacing.borderRadius.md },
    emiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    emiLabel: { ...typography.caption, color: colors.textSecondary },
    emiValue: { ...typography.h3, color: colors.textPrimary },

    installmentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingVertical: 4 },
    instLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    instDot: { width: 8, height: 8, borderRadius: 4 },
    instDotPaid: { backgroundColor: colors.success },
    instDotPending: { backgroundColor: colors.warning },
    instAmount: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    instDate: { ...typography.caption, color: colors.textSecondary },

    instBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    instBadgePaid: { backgroundColor: colors.success + '20' },
    instBadgePending: { backgroundColor: colors.warning + '20' },
    instStatusText: { fontSize: 10, fontWeight: '700' },
});

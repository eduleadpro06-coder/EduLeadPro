import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    RefreshControl
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../services/api';
import PremiumCard from '../../src/components/ui/PremiumCard';
import { colors, spacing, typography, shadows } from '../../src/theme';

const { width } = Dimensions.get('window');

export default function ParentFeesScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [fees, setFees] = useState<any>(null);

    const currentChild = user?.children?.[0];

    const fetchFees = async () => {
        if (currentChild) {
            try {
                const data = await api.getStudentFees(Number(currentChild.id));
                setFees(data);
            } catch (e) {
                console.error('Fees fetch error:', e);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        }
    };

    useEffect(() => {
        fetchFees();
    }, [currentChild]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchFees();
    };

    const formatCurrency = (amount: number) => {
        return '₹' + Math.round(amount).toLocaleString('en-IN');
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getTransactionTypeLabel = (p: any) => {
        if (p.paymentCategory === 'fee_payment' && p.installmentNumber === 0) {
            return { label: 'Registration Fee', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
        }
        if (p.installmentNumber > 0) {
            return { label: `EMI Installment #${p.installmentNumber}`, color: colors.primary, bg: 'rgba(99, 102, 241, 0.1)' };
        }
        if (p.paymentCategory === 'additional_charge') {
            return { label: 'Admission Form Fee', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
        }
        return { label: 'Tuition Fee', color: colors.textSecondary, bg: colors.background };
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const tuitionPaid = fees?.tuitionPaid || 0;
    const additionalPaid = fees?.additionalPaid || 0;
    const paidPercentage = fees && fees.totalFees > 0
        ? Math.min((tuitionPaid / fees.totalFees) * 100, 100)
        : (fees && fees.balance <= 0 ? 100 : 0);

    const progressDisplay = (fees?.totalFees === 0 && fees?.balance <= 0) ? "Settled" : `${Math.round(paidPercentage)}%`;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Fees & Payments</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {!fees ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color={colors.textTertiary} />
                        <Text style={styles.emptyText}>No fee details available</Text>
                    </View>
                ) : (
                    <>
                        {/* Summary Card */}
                        <PremiumCard style={styles.summaryCard} variant="elevated">
                            <LinearGradient
                                colors={['#1E293B', '#0F172A']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardGradient}
                            >
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={styles.cardLabel}>Outstanding Balance</Text>
                                        <Text style={styles.cardAmount}>{formatCurrency(fees.balance || 0)}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: fees.balance > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' }]}>
                                        <Text style={[styles.statusText, { color: fees.balance > 0 ? '#F87171' : '#34D399' }]}>
                                            {fees.balance > 0 ? 'DUE' : 'PAID'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Progress Bar */}
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressHeader}>
                                        <Text style={styles.progressLabel}>Payment Progress</Text>
                                        <Text style={styles.progressValue}>{progressDisplay}</Text>
                                    </View>
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, { width: `${paidPercentage}%` }]} />
                                    </View>
                                    <View style={styles.progressFooter}>
                                        <View>
                                            <Text style={styles.progressSub}>Tuition Paid: {formatCurrency(tuitionPaid)}</Text>
                                            {additionalPaid > 0 && (
                                                <Text style={[styles.progressSub, { color: '#F59E0B', marginTop: 2 }]}>
                                                    Additional Paid: {formatCurrency(additionalPaid)}
                                                </Text>
                                            )}
                                        </View>
                                        <Text style={styles.progressSub}>Total: {formatCurrency(fees.totalFees)}</Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </PremiumCard>

                        {/* EMI / Installments Section */}
                        {fees.emiDetails && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Installment Plan</Text>
                                    <Text style={styles.sectionSubtitle}>{fees.emiDetails.installments.length} Installments</Text>
                                </View>
                                {fees.emiDetails.installments.map((item: any, index: number) => (
                                    <View key={item.id} style={styles.installmentItem}>
                                        <View style={styles.installmentIconContainer}>
                                            <View style={[styles.installmentStatusDot, { backgroundColor: item.status === 'paid' ? colors.success : colors.warning }]} />
                                            <View style={styles.installmentLine} />
                                        </View>
                                        <View style={styles.installmentContent}>
                                            <View style={styles.installmentRow}>
                                                <Text style={styles.installmentLabel}>Installment #{item.installmentNumber}</Text>
                                                <Text style={styles.installmentAmount}>{formatCurrency(item.amount)}</Text>
                                            </View>
                                            <View style={styles.installmentRow}>
                                                <Text style={styles.installmentDate}>
                                                    Due: {formatDate(item.dueDate)}
                                                </Text>
                                                <Text style={[styles.installmentStatus, { color: item.status === 'paid' ? colors.success : colors.warning }]}>
                                                    {item.status.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Recent Transactions */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Recent Transactions</Text>
                            {(fees.payments && fees.payments.length > 0) ? (
                                fees.payments.map((p: any) => (
                                    <TouchableOpacity key={p.id} style={styles.paymentItem}>
                                        <View style={styles.paymentIcon}>
                                            <Ionicons
                                                name={p.mode?.toLowerCase().includes('online') ? "globe-outline" : "cash-outline"}
                                                size={20}
                                                color={colors.textSecondary}
                                            />
                                        </View>
                                        <View style={styles.paymentInfo}>
                                            <View style={[styles.typeBadge, { backgroundColor: getTransactionTypeLabel(p).bg }]}>
                                                <Text style={[styles.typeBadgeText, { color: getTransactionTypeLabel(p).color }]}>
                                                    {getTransactionTypeLabel(p).label}
                                                </Text>
                                            </View>
                                            <Text style={styles.paymentId}>Ref: {p.receiptNumber || 'N/A'} • {p.mode || 'N/A'}</Text>
                                            <Text style={styles.paymentDate}>{formatDate(p.date)}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.paymentAmount}>{formatCurrency(p.amount)}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                                                <Text style={{ fontSize: 10, color: colors.success, marginLeft: 2, fontWeight: '700' }}>PAID</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.noHistory}>
                                    <Text style={styles.noHistoryText}>No payment history found</Text>
                                </View>
                            )}
                        </View>
                    </>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        backgroundColor: '#fff',
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerButton: { padding: 8, marginRight: -8 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
    content: { padding: spacing.lg },
    summaryCard: {
        padding: 0,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: spacing.xl,
        ...shadows.lg,
    },
    cardGradient: {
        padding: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    cardLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    cardAmount: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '800',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    progressContainer: {
        marginTop: 8,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '600',
    },
    progressValue: {
        color: colors.accent,
        fontSize: 14,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.accent,
        borderRadius: 3,
    },
    progressFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    progressSub: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: colors.textTertiary,
        fontWeight: '600',
    },
    installmentItem: {
        flexDirection: 'row',
        marginBottom: 0,
    },
    installmentIconContainer: {
        alignItems: 'center',
        width: 20,
        marginRight: 16,
    },
    installmentStatusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        zIndex: 1,
        borderWidth: 2,
        borderColor: colors.background,
    },
    installmentLine: {
        flex: 1,
        width: 2,
        backgroundColor: colors.border,
        marginVertical: 4,
    },
    installmentContent: {
        flex: 1,
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
    },
    installmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 2,
    },
    installmentLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    installmentAmount: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    installmentDate: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    installmentStatus: {
        fontSize: 10,
        fontWeight: '800',
    },
    paymentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    paymentIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    paymentInfo: {
        flex: 1,
    },
    paymentMode: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    paymentId: {
        fontSize: 11,
        color: colors.textTertiary,
        marginTop: 2,
    },
    paymentDate: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 4,
    },
    paymentAmount: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.success,
    },
    noHistory: {
        padding: 32,
        alignItems: 'center',
    },
    noHistoryText: {
        color: colors.textTertiary,
        fontSize: 14,
    },
    typeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginBottom: 4,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { color: colors.textTertiary, marginTop: 16, fontSize: 16, fontWeight: '600' },
});

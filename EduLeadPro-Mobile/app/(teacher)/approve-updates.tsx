/**
 * Approve Updates Screen - Admin view
 * Review and approve/reject teacher-posted daily updates
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
    Alert,
    Image,
    Modal,
    TextInput,
    Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import { colors, spacing, shadows } from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabStatus = 'pending' | 'approved' | 'rejected';

interface DailyUpdate {
    id: number;
    title: string;
    content: string;
    activity_type: string;
    mood: string;
    media_urls: string[];
    status: string;
    posted_at: string;
    teacher_name: string;
    rejection_reason?: string;
    student?: {
        id: number;
        name: string;
        class: string;
        section?: string;
    };
}

const ACTIVITY_COLORS: Record<string, { bg: string; text: string }> = {
    learning: { bg: '#EEF2FF', text: '#4F46E5' },
    play: { bg: '#ECFDF5', text: '#059669' },
    meal: { bg: '#FFF7ED', text: '#EA580C' },
    nap: { bg: '#F5F3FF', text: '#7C3AED' },
    art: { bg: '#FDF2F8', text: '#DB2777' },
    general: { bg: '#F3F4F6', text: '#6B7280' },
};

export default function ApproveUpdatesScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabStatus>('pending');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updates, setUpdates] = useState<DailyUpdate[]>([]);
    const [processing, setProcessing] = useState<number | null>(null);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedUpdate, setSelectedUpdate] = useState<DailyUpdate | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [imageViewerVisible, setImageViewerVisible] = useState(false);
    const [viewingImage, setViewingImage] = useState('');

    const loadData = useCallback(async () => {
        try {
            const data = await api.getAdminDailyUpdates(activeTab);
            setUpdates(data);
        } catch (error) {
            console.error('[ApproveUpdates] Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab]);

    useEffect(() => {
        setLoading(true);
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [loadData]);

    const handleApprove = async (update: DailyUpdate) => {
        setProcessing(update.id);
        try {
            await api.updateDailyUpdateStatus(update.id, 'approved');
            setUpdates(prev => prev.filter(u => u.id !== update.id));
            Alert.alert('Approved', `Update for ${update.student?.name || 'student'} has been approved.`);
        } catch (error) {
            console.error('[ApproveUpdates] Approve error:', error);
            Alert.alert('Error', 'Failed to approve update.');
        } finally {
            setProcessing(null);
        }
    };

    const openRejectModal = (update: DailyUpdate) => {
        setSelectedUpdate(update);
        setRejectionReason('');
        setRejectModalVisible(true);
    };

    const handleReject = async () => {
        if (!selectedUpdate) return;
        if (!rejectionReason.trim()) {
            Alert.alert('Required', 'Please provide a reason for rejection.');
            return;
        }

        setProcessing(selectedUpdate.id);
        setRejectModalVisible(false);
        try {
            await api.updateDailyUpdateStatus(selectedUpdate.id, 'rejected', rejectionReason.trim());
            setUpdates(prev => prev.filter(u => u.id !== selectedUpdate.id));
            Alert.alert('Rejected', `Update has been rejected.`);
        } catch (error) {
            console.error('[ApproveUpdates] Reject error:', error);
            Alert.alert('Error', 'Failed to reject update.');
        } finally {
            setProcessing(null);
            setSelectedUpdate(null);
        }
    };

    const formatTime = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - d.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            const diffHrs = Math.floor(diffMins / 60);
            if (diffHrs < 24) return `${diffHrs}h ago`;
            const diffDays = Math.floor(diffHrs / 24);
            return `${diffDays}d ago`;
        } catch {
            return '';
        }
    };

    const tabs: { key: TabStatus; label: string; icon: string }[] = [
        { key: 'pending', label: 'Pending', icon: 'clock' },
        { key: 'approved', label: 'Approved', icon: 'check-circle' },
        { key: 'rejected', label: 'Rejected', icon: 'x-circle' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Header */}
            <LinearGradient
                colors={['#7C3AED', '#6D28D9']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Feather name="arrow-left" size={22} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Review Updates</Text>
                        <Text style={styles.headerSubtitle}>{updates.length} {activeTab} updates</Text>
                    </View>
                </View>

                {/* Tab Bar */}
                <View style={styles.tabBar}>
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Feather
                                name={tab.icon as any}
                                size={14}
                                color={activeTab === tab.key ? '#7C3AED' : 'rgba(255,255,255,0.6)'}
                            />
                            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </LinearGradient>

            {/* Update Cards */}
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
                        <ActivityIndicator size="large" color="#7C3AED" />
                    </View>
                ) : updates.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>
                            {activeTab === 'pending' ? '🎉' : activeTab === 'approved' ? '📋' : '📭'}
                        </Text>
                        <Text style={styles.emptyTitle}>
                            {activeTab === 'pending' ? 'All caught up!' : `No ${activeTab} updates`}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {activeTab === 'pending'
                                ? 'There are no updates waiting for review.'
                                : `No updates with ${activeTab} status found.`}
                        </Text>
                    </View>
                ) : (
                    updates.map(update => {
                        const activityColor = ACTIVITY_COLORS[update.activity_type?.toLowerCase()] || ACTIVITY_COLORS.general;
                        const isProcessing = processing === update.id;
                        return (
                            <View key={update.id} style={[styles.updateCard, isProcessing && { opacity: 0.5 }]}>
                                {/* Card Header */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardHeaderLeft}>
                                        <Text style={styles.studentName}>{update.student?.name || 'Unknown Student'}</Text>
                                        <Text style={styles.classLabel}>
                                            {update.student?.class || ''}{update.student?.section ? ` - ${update.student.section}` : ''}
                                        </Text>
                                    </View>
                                    <View style={styles.cardHeaderRight}>
                                        <View style={[styles.activityBadge, { backgroundColor: activityColor.bg }]}>
                                            <Text style={[styles.activityText, { color: activityColor.text }]}>
                                                {update.activity_type || 'General'}
                                            </Text>
                                        </View>
                                        <Text style={styles.timeText}>{formatTime(update.posted_at)}</Text>
                                    </View>
                                </View>

                                {/* Teacher name */}
                                <View style={styles.teacherRow}>
                                    <Feather name="user" size={11} color={colors.textTertiary} />
                                    <Text style={styles.teacherName}>{update.teacher_name || 'Teacher'}</Text>
                                </View>

                                {/* Content */}
                                {update.title ? (
                                    <Text style={styles.updateTitle}>{update.title}</Text>
                                ) : null}
                                <Text style={styles.updateContent} numberOfLines={4}>
                                    {update.content}
                                </Text>

                                {/* Image thumbnails */}
                                {update.media_urls && update.media_urls.length > 0 && (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
                                        {update.media_urls.map((url, i) => (
                                            <TouchableOpacity
                                                key={i}
                                                onPress={() => { setViewingImage(url); setImageViewerVisible(true); }}
                                            >
                                                <Image source={{ uri: url }} style={styles.thumbnail} />
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}

                                {/* Rejection reason (for rejected tab) */}
                                {update.status === 'rejected' && update.rejection_reason && (
                                    <View style={styles.rejectionBox}>
                                        <Feather name="alert-triangle" size={12} color="#EF4444" />
                                        <Text style={styles.rejectionText}>{update.rejection_reason}</Text>
                                    </View>
                                )}

                                {/* Action Buttons (pending only) */}
                                {activeTab === 'pending' && (
                                    <View style={styles.actionRow}>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.rejectBtn]}
                                            onPress={() => openRejectModal(update)}
                                            disabled={isProcessing}
                                        >
                                            <Feather name="x" size={16} color="#EF4444" />
                                            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Reject</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.approveBtn]}
                                            onPress={() => handleApprove(update)}
                                            disabled={isProcessing}
                                        >
                                            <Feather name="check" size={16} color="#fff" />
                                            <Text style={[styles.actionBtnText, { color: '#fff' }]}>Approve</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* Rejection Reason Modal */}
            <Modal visible={rejectModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Rejection Reason</Text>
                        <Text style={styles.modalSubtitle}>
                            Why is this update being rejected?
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter reason..."
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => setRejectModalVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalReject} onPress={handleReject}>
                                <Text style={styles.modalRejectText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Image Viewer Modal */}
            <Modal visible={imageViewerVisible} transparent animationType="fade">
                <View style={styles.imageViewer}>
                    <TouchableOpacity style={styles.imageViewerClose} onPress={() => setImageViewerVisible(false)}>
                        <Feather name="x" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Image source={{ uri: viewingImage }} style={styles.fullImage} resizeMode="contain" />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        paddingTop: Platform.OS === 'ios' ? 56 : 44,
        paddingBottom: 10,
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
    headerSubtitle: {
        fontSize: 12, fontFamily: 'Lexend_Regular', color: 'rgba(255,255,255,0.7)', marginTop: 2,
    },
    tabBar: {
        flexDirection: 'row',
        marginTop: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 3,
    },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 10, borderRadius: 10,
    },
    tabActive: {
        backgroundColor: '#fff',
    },
    tabText: {
        fontSize: 12, fontFamily: 'Lexend_Medium', color: 'rgba(255,255,255,0.7)',
    },
    tabTextActive: {
        color: '#7C3AED',
    },
    content: { flex: 1 },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: 16,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80,
    },
    emptyState: {
        alignItems: 'center', marginTop: 80, gap: 8,
    },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: {
        fontSize: 18, fontFamily: 'Outfit_Bold', color: colors.textPrimary,
    },
    emptySubtitle: {
        fontSize: 13, fontFamily: 'Lexend_Regular', color: colors.textSecondary, textAlign: 'center',
    },
    updateCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        ...shadows.sm,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardHeaderLeft: { flex: 1 },
    cardHeaderRight: { alignItems: 'flex-end', gap: 4 },
    studentName: {
        fontSize: 15, fontFamily: 'Outfit_Bold', color: colors.textPrimary,
    },
    classLabel: {
        fontSize: 11, fontFamily: 'Lexend_Regular', color: colors.textSecondary,
    },
    activityBadge: {
        paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8,
    },
    activityText: {
        fontSize: 10, fontFamily: 'Lexend_Medium', textTransform: 'capitalize',
    },
    timeText: {
        fontSize: 10, fontFamily: 'Lexend_Regular', color: colors.textTertiary,
    },
    teacherRow: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        marginTop: 6, marginBottom: 8,
    },
    teacherName: {
        fontSize: 11, fontFamily: 'Lexend_Regular', color: colors.textTertiary,
    },
    updateTitle: {
        fontSize: 14, fontFamily: 'Outfit_Bold', color: colors.textPrimary, marginBottom: 4,
    },
    updateContent: {
        fontSize: 13, fontFamily: 'Lexend_Regular', color: colors.textSecondary, lineHeight: 20,
    },
    imageRow: {
        marginTop: 10,
    },
    thumbnail: {
        width: 72, height: 72, borderRadius: 12, marginRight: 8,
        backgroundColor: '#F3F4F6',
    },
    rejectionBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 6,
        marginTop: 10, padding: 10,
        backgroundColor: '#FEF2F2', borderRadius: 10,
    },
    rejectionText: {
        flex: 1, fontSize: 12, fontFamily: 'Lexend_Regular', color: '#991B1B',
    },
    actionRow: {
        flexDirection: 'row', gap: 10, marginTop: 14,
    },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 10, borderRadius: 12,
    },
    rejectBtn: {
        backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    },
    approveBtn: {
        backgroundColor: '#16A34A',
    },
    actionBtnText: {
        fontSize: 13, fontFamily: 'Lexend_Medium',
    },
    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%',
        ...shadows.lg,
    },
    modalTitle: {
        fontSize: 18, fontFamily: 'Outfit_Bold', color: colors.textPrimary,
    },
    modalSubtitle: {
        fontSize: 13, fontFamily: 'Lexend_Regular', color: colors.textSecondary, marginTop: 4, marginBottom: 16,
    },
    modalInput: {
        borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
        padding: 12, fontSize: 14, fontFamily: 'Lexend_Regular',
        minHeight: 80, color: colors.textPrimary,
    },
    modalActions: {
        flexDirection: 'row', gap: 10, marginTop: 16,
    },
    modalCancel: {
        flex: 1, paddingVertical: 12, borderRadius: 12,
        borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 14, fontFamily: 'Lexend_Medium', color: colors.textSecondary,
    },
    modalReject: {
        flex: 1, paddingVertical: 12, borderRadius: 12,
        backgroundColor: '#EF4444', alignItems: 'center',
    },
    modalRejectText: {
        fontSize: 14, fontFamily: 'Lexend_Medium', color: '#fff',
    },
    // Image Viewer
    imageViewer: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center', alignItems: 'center',
    },
    imageViewerClose: {
        position: 'absolute', top: 50, right: 20, zIndex: 10,
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    fullImage: {
        width: SCREEN_WIDTH - 32,
        height: SCREEN_WIDTH - 32,
    },
});

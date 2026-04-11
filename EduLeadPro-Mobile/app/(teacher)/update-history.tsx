
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    RefreshControl,
    Platform,
    Modal,
    Dimensions,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { teacherAPI } from '../../src/services/api/teacher.api';
import { colors, spacing, shadows, typography } from '../../src/theme';
import PremiumCard from '../../src/components/ui/PremiumCard';

const { width, height } = Dimensions.get('window');

const UpdateHistoryScreen = () => {
    const router = useRouter();
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const fetchHistory = async () => {
        try {
            const data = await teacherAPI.getUpdateHistory();
            setActivities(data);
        } catch (error) {
            console.error('Failed to fetch update history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchHistory();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return colors.success;
            case 'rejected': return colors.danger;
            default: return colors.warning;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'approved': return 'Approved';
            case 'rejected': return 'Rejected';
            default: return 'Pending';
        }
    };

    const openPost = (post: any) => {
        setSelectedPost(post);
        setIsModalVisible(true);
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity activeOpacity={0.9} onPress={() => openPost(item)}>
            <PremiumCard style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.studentInfo}>
                        <View style={styles.avatarMini}>
                            <Text style={styles.avatarText}>{item.student?.name?.charAt(0) || 'S'}</Text>
                        </View>
                        <View>
                            <Text style={styles.studentName}>{item.student?.name || 'Student'}</Text>
                            <Text style={styles.studentClass}>{item.student?.class} {item.student?.section || ''}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {getStatusLabel(item.status)}
                        </Text>
                    </View>
                </View>

                <View style={styles.contentContainer}>
                    <Text style={styles.activityType}>{item.activity_type?.toUpperCase()}</Text>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.content} numberOfLines={3}>{item.content}</Text>
                    
                    {item.media_urls && item.media_urls.length > 0 && (
                        <View style={styles.imageGrid}>
                            {item.media_urls.slice(0, 3).map((url: string, idx: number) => (
                                <Image 
                                    key={idx} 
                                    source={{ uri: url }} 
                                    style={styles.thumbnail} 
                                />
                            ))}
                            {item.media_urls.length > 3 && (
                                <View style={styles.moreImages}>
                                    <Text style={styles.moreText}>+{item.media_urls.length - 3}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.timestamp}>
                        <Feather name="clock" size={12} color={colors.textTertiary} />
                        <Text style={styles.footerText}>
                            {item.posted_at ? format(new Date(item.posted_at), 'MMM dd, yyyy • hh:mm a') : 'N/A'}
                        </Text>
                    </View>
                    {item.status === 'rejected' && item.rejection_reason && (
                        <View style={styles.rejectionNote}>
                            <Feather name="alert-circle" size={12} color={colors.danger} />
                            <Text style={styles.rejectionText} numberOfLines={1}>{item.rejection_reason}</Text>
                        </View>
                    )}
                </View>
            </PremiumCard>
        </TouchableOpacity>
    );

    const renderDetailModal = () => (
        <Modal
            visible={isModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setIsModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeaderClose}>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setIsModalVisible(false)}>
                            <Feather name="x" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.modalHeaderTitle}>Post Details</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {selectedPost && (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                            <View style={styles.modalStudentRow}>
                                <View style={styles.avatarLarge}>
                                    <Text style={styles.avatarLargeText}>{selectedPost.student?.name?.charAt(0) || 'S'}</Text>
                                </View>
                                <View>
                                    <Text style={styles.modalStudentName}>{selectedPost.student?.name}</Text>
                                    <Text style={styles.modalStudentClass}>{selectedPost.student?.class} {selectedPost.student?.section || ''}</Text>
                                </View>
                                <View style={[styles.statusBadgeModal, { backgroundColor: getStatusColor(selectedPost.status) + '15' }]}>
                                    <Text style={[styles.statusTextModal, { color: getStatusColor(selectedPost.status) }]}>
                                        {getStatusLabel(selectedPost.status)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.modalBody}>
                                <Text style={styles.modalActivityType}>{selectedPost.activity_type?.toUpperCase()}</Text>
                                <Text style={styles.modalTitle}>{selectedPost.title}</Text>
                                <Text style={styles.modalContentText}>{selectedPost.content}</Text>

                                {selectedPost.media_urls && selectedPost.media_urls.length > 0 && (
                                    <View style={styles.modalImageGallery}>
                                        {selectedPost.media_urls.map((url: string, idx: number) => (
                                            <Image 
                                                key={idx} 
                                                source={{ uri: url }} 
                                                style={styles.fullImage} 
                                                resizeMode="cover"
                                            />
                                        ))}
                                    </View>
                                )}

                                {selectedPost.status === 'rejected' && selectedPost.rejection_reason && (
                                    <View style={styles.modalRejectionBox}>
                                        <View style={styles.rejectionHeader}>
                                            <Feather name="alert-circle" size={16} color={colors.danger} />
                                            <Text style={styles.rejectionTitle}>Feedback from Principal</Text>
                                        </View>
                                        <Text style={styles.modalRejectionText}>{selectedPost.rejection_reason}</Text>
                                    </View>
                                )}

                                <View style={styles.modalFooter}>
                                    <Feather name="calendar" size={14} color={colors.textTertiary} />
                                    <Text style={styles.modalDate}>
                                        Posted on {selectedPost.posted_at ? format(new Date(selectedPost.posted_at), 'MMMM dd, yyyy • hh:mm a') : 'N/A'}
                                    </Text>
                                </View>
                            </View>
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Update History</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <FlatList
                data={activities}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="history" size={64} color={colors.border} />
                            <Text style={styles.emptyText}>No previous updates found</Text>
                            <TouchableOpacity 
                                style={styles.postBtn}
                                onPress={() => router.push('/(teacher)/post-update')}
                            >
                                <Text style={styles.postBtnText}>Post your first update</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} />
                    )
                }
            />

            {renderDetailModal()}

            {/* Floating Action Button */}
            {!loading && (
                <TouchableOpacity 
                    style={styles.fab}
                    onPress={() => router.push('/(teacher)/post-update')}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.primaryDark]}
                        style={styles.fabGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Feather name="plus" size={28} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...shadows.md,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: Platform.OS === 'ios' ? 44 : 56,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontFamily: 'Outfit_Bold',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        marginBottom: 16,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarMini: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    avatarText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    studentName: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    studentClass: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    contentContainer: {
        marginBottom: 12,
    },
    activityType: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 6,
    },
    content: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    imageGrid: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: colors.surfaceHighlight,
    },
    moreImages: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border + '50',
    },
    timestamp: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: 11,
        color: colors.textTertiary,
    },
    rejectionNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
        marginLeft: 15,
        justifyContent: 'flex-end',
    },
    rejectionText: {
        fontSize: 11,
        color: colors.danger,
        fontStyle: 'italic',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 16,
        marginBottom: 24,
    },
    postBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        ...shadows.sm,
    },
    postBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 25,
        width: 60,
        height: 60,
        borderRadius: 30,
        ...shadows.lg,
        elevation: 8,
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: height * 0.85,
        paddingTop: 10,
    },
    modalHeaderClose: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalHeaderTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_Bold',
        color: colors.textPrimary,
    },
    modalScroll: {
        padding: 24,
    },
    modalStudentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 15,
    },
    avatarLarge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLargeText: {
        color: colors.primary,
        fontSize: 24,
        fontFamily: 'Outfit_Bold',
    },
    modalStudentName: {
        fontSize: 18,
        fontFamily: 'Outfit_Bold',
        color: colors.textPrimary,
    },
    modalStudentClass: {
        fontSize: 14,
        color: colors.textSecondary,
        fontFamily: 'Lexend_Regular',
    },
    statusBadgeModal: {
        marginLeft: 'auto',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusTextModal: {
        fontSize: 12,
        fontFamily: 'Lexend_Bold',
        textTransform: 'uppercase',
    },
    modalBody: {
        marginBottom: 20,
    },
    modalActivityType: {
        fontSize: 12,
        fontFamily: 'Lexend_Bold',
        color: colors.primary,
        marginBottom: 8,
        letterSpacing: 1,
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: 'Outfit_Bold',
        color: colors.textPrimary,
        marginBottom: 12,
    },
    modalContentText: {
        fontSize: 16,
        lineHeight: 24,
        color: colors.textSecondary,
        fontFamily: 'Lexend_Regular',
        marginBottom: 24,
    },
    modalImageGallery: {
        gap: 15,
        marginBottom: 24,
    },
    fullImage: {
        width: '100%',
        height: 250,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
    },
    modalRejectionBox: {
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 16,
        borderLeftWidth: 4,
        borderLeftColor: colors.danger,
        marginBottom: 24,
    },
    rejectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    rejectionTitle: {
        fontSize: 14,
        fontFamily: 'Lexend_Bold',
        color: colors.danger,
    },
    modalRejectionText: {
        fontSize: 14,
        color: '#991B1B',
        fontFamily: 'Lexend_Regular',
        lineHeight: 20,
    },
    modalFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    modalDate: {
        fontSize: 13,
        color: colors.textTertiary,
        fontFamily: 'Lexend_Medium',
    },
});

export default UpdateHistoryScreen;

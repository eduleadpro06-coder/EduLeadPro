
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
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { teacherAPI } from '../../src/services/api/teacher.api';
import { colors, spacing, shadows, typography } from '../../src/theme';
import PremiumCard from '../../src/components/ui/PremiumCard';

const UpdateHistoryScreen = () => {
    const router = useRouter();
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

    const renderItem = ({ item }: { item: any }) => (
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
        fontWeight: 'bold',
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
    }
});

export default UpdateHistoryScreen;

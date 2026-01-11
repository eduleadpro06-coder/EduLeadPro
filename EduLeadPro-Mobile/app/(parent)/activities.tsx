import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useAuthStore } from '../../src/store/authStore';
import PremiumCard from '../../src/components/ui/PremiumCard';

const { width } = Dimensions.get('window');

type TabType = 'updates' | 'announcements' | 'holidays';

export default function ActivitiesScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabType>('updates');
    const [loading, setLoading] = useState(true);

    // Data states
    const [updates, setUpdates] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);

    const currentChild = user?.children?.[0]; // Default to first child

    const handleActivityDetail = (activity: any) => {
        router.push({
            pathname: '/(parent)/activity-details',
            params: { activity: JSON.stringify(activity) }
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!currentChild || !user) return;
            setLoading(true);
            try {
                const childId = Number(currentChild.id);
                const orgId = (user as any).organization_id || (user as any).organizationId;

                // Parallel fetch
                const [updatesData, announcementsData, eventsData] = await Promise.all([
                    api.getDailyUpdates(childId),
                    api.getAnnouncements(orgId),
                    api.getEvents(orgId) // Assuming getEvents fetches holidays/calendar
                ]);

                setUpdates(updatesData);
                setAnnouncements(announcementsData);
                setHolidays(eventsData || []); // eventsData might be null/undefined

            } catch (e) {
                console.error('Activities load error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentChild]);

    const renderTab = (key: TabType, label: string) => (
        <TouchableOpacity
            style={[styles.tab, activeTab === key && styles.activeTab]}
            onPress={() => setActiveTab(key)}
        >
            <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>{label}</Text>
        </TouchableOpacity>
    );

    const renderContent = () => {
        if (loading) {
            return <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />;
        }

        if (activeTab === 'updates') {
            const validUpdates = updates.filter(item => item && item.id);
            if (validUpdates.length === 0) return renderEmpty('No activity updates yet');

            const getTypeConfig = (type: string) => {
                switch (type?.toLowerCase()) {
                    case 'achievement': return { icon: 'star', color: '#F59E0B', bg: '#FEF3C7', label: 'Achievement' };
                    case 'wellness': return { icon: 'heart', color: '#EC4899', bg: '#FCE7F3', label: 'Wellness' };
                    default: return { icon: 'sun', color: '#10B981', bg: '#D1FAE5', label: 'Daily Update' };
                }
            };

            return validUpdates.map((item) => {
                // Determine type based on item data - check multiple fields
                const typeKey = item.activityType || item.activity_type || item.type || 'general';
                const config = getTypeConfig(typeKey);

                // Handle different image fields
                const mediaImages = item.mediaUrls || item.media_urls || (item.image ? [item.image] : []) || [];
                const displayImage = mediaImages.length > 0 ? mediaImages[0] : null;

                return (
                    <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.9}
                        onPress={() => handleActivityDetail(item)}
                    >
                        <PremiumCard style={styles.card}>
                            <View style={styles.cardHeaderRow}>
                                <View style={[styles.avatarCircle, { backgroundColor: config.bg }]}>
                                    <Feather name={config.icon as any} size={16} color={config.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={styles.authorName}>{item.teacherName || item.teacher_name || 'Teacher'}</Text>
                                        <View style={[styles.miniBadge, { backgroundColor: config.bg }]}>
                                            <Text style={[styles.miniBadgeText, { color: config.color }]}>{config.label}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.timestamp}>{item.postedAt || item.posted_at || item.created_at ? new Date(item.postedAt || item.posted_at || item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</Text>
                                </View>
                            </View>
                            <Text style={styles.updateTitle}>{item.title || config.label}</Text>
                            <Text style={styles.updateContent}>{item.content || 'No details.'}</Text>
                            {displayImage && (
                                <Image source={{ uri: displayImage }} style={styles.mediaImage} />
                            )}
                        </PremiumCard>
                    </TouchableOpacity>
                );
            });
        }

        if (activeTab === 'announcements') {
            const validAnnouncements = announcements.filter(item => item && item.id && item.title?.trim());
            if (validAnnouncements.length === 0) return renderEmpty('No announcements');
            return validAnnouncements.map((item) => {
                const getPriorityColor = (p: string) => {
                    switch (p?.toLowerCase()) {
                        case 'high': return '#EF4444';
                        case 'medium': return '#F59E0B';
                        default: return '#10B981';
                    }
                };
                const color = getPriorityColor(item.priority);

                return (
                    <PremiumCard key={item.id} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: color }] as any}>
                        <View style={styles.announcementHeader}>
                            <Feather name="bell" size={20} color={color} />
                            <Text style={styles.announcementTitle}>{item.title}</Text>
                        </View>
                        <Text style={styles.updateContent}>{item.content}</Text>
                        <Text style={styles.timestamp}>{item.published_at ? new Date(item.published_at).toLocaleDateString() : ''}</Text>
                    </PremiumCard>
                );
            });
        }

        if (activeTab === 'holidays') {
            const validHolidays = holidays.filter(item => item && item.id && item.title?.trim());
            if (validHolidays.length === 0) return renderEmpty('No upcoming events');
            return validHolidays.map((item) => {
                const date = item.event_date ? new Date(item.event_date) : new Date();

                return (
                    <PremiumCard key={item.id} style={styles.card}>
                        <View style={styles.holidayRow}>
                            <View style={styles.dateBox}>
                                <Text style={styles.dateDay}>{date.getDate()}</Text>
                                <Text style={styles.dateMonth}>{date.toLocaleDateString('en-US', { month: 'short' })}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={styles.holidayTitle}>{item.title}</Text>
                                <Text style={styles.holidayType}>{item.event_type || item.type || 'Event'}</Text>
                            </View>
                        </View>
                    </PremiumCard>
                );
            });
        }
    };

    const renderEmpty = (msg: string) => (
        <View style={styles.emptyContainer}>
            <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/7486/7486777.png' }} style={{ width: 64, height: 64, opacity: 0.5 }} />
            <Text style={styles.emptyText}>{msg}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Feather name="arrow-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerSubtitle}>{(user as any)?.organizationName || 'EduConnect'}</Text>
                    <Text style={styles.headerTitle}>Activities & Calendar</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>


            {/* Tabs */}
            <View style={styles.tabContainer}>
                {renderTab('updates', 'Daily Updates')}
                {renderTab('announcements', 'Announcements')}
                {renderTab('holidays', 'Events and Holidays')}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {renderContent()}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
    },
    headerButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: '#F9FAFB',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerSubtitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 2.5,
        marginBottom: -2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', zIndex: 1 },

    titleSection: { padding: 20, backgroundColor: '#fff', paddingBottom: 10 },
    pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },

    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    tab: {
        paddingVertical: 12,
        marginRight: 24,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent'
    },
    activeTab: {
        borderBottomColor: '#10B981'
    },
    tabText: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '500'
    },
    activeTabText: {
        color: '#10B981',
        fontWeight: '600'
    },

    content: { padding: 20 },
    card: { padding: 16, marginBottom: 16, borderRadius: 16 },

    // Updates
    cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatarCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    authorName: { fontSize: 15, fontWeight: '600', color: '#374151' },
    timestamp: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    miniBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8 },
    miniBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    updateTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
    updateContent: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
    mediaImage: { width: '100%', height: 250, borderRadius: 12, marginTop: 12, resizeMode: 'contain', backgroundColor: '#F3F4F6' },

    // Announcements
    announcementHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    announcementTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginLeft: 8 },

    // Holidays
    holidayRow: { flexDirection: 'row', alignItems: 'center' },
    dateBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
    dateDay: { fontSize: 18, fontWeight: '700', color: '#D97706' },
    dateMonth: { fontSize: 10, color: '#D97706', textTransform: 'uppercase' },
    holidayTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
    holidayType: { fontSize: 12, color: '#6B7280' },

    emptyContainer: { alignItems: 'center', padding: 40 },
    emptyText: { marginTop: 16, color: '#9CA3AF', fontSize: 16 }
});

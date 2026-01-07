import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api, type DailyUpdate, type Event, type Homework, type Announcement } from './services/api';
import { colors, spacing, typography } from './src/theme';

const { width } = Dimensions.get('window');

const tabs = [
    { id: 'daily', label: 'Daily Updates' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'holidays', label: 'Holidays' },
];

interface ActivitiesScreenProps {
    currentUser: any;
    currentChild: any;
}

export default function ActivitiesScreen({ currentUser, currentChild }: ActivitiesScreenProps) {
    const [activeTab, setActiveTab] = useState('daily');
    const [updates, setUpdates] = useState<DailyUpdate[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    // Removed unused events state since we only show holidays
    const [holidays, setHolidays] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [currentChild]);

    const fetchData = async () => {
        if (!currentChild?.id || !currentUser?.organization_id) {
            console.warn('ActivitiesScreen: Missing child or org ID', { childId: currentChild?.id, orgId: currentUser?.organization_id });
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            // Fetch only relevant sections: Updates, Announcements, Events (for holidays)
            const [updRes, annRes, evRes] = await Promise.all([
                api.getDailyUpdates(currentChild.id),
                api.getAnnouncements(currentUser.organization_id),
                api.getEvents(currentUser.organization_id)
            ]);

            setUpdates(Array.isArray(updRes) ? updRes : []);
            setAnnouncements(Array.isArray(annRes) ? annRes : []);

            // Filter for holidays
            setHolidays(Array.isArray(evRes) ? evRes.filter(e => e.eventType === 'holiday') : []);

        } catch (e: any) {
            console.error('Failed to fetch screen data Error:', e.message || e);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return { day: '', month: '', weekday: '' };
        const d = new Date(dateStr);
        return {
            day: d.getDate().toString(),
            month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
            weekday: d.toLocaleString('default', { weekday: 'long' })
        };
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Activities & Calendar</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                >
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    <>
                        {/* Daily Updates Feed */}
                        {activeTab === 'daily' && (
                            updates.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <View style={styles.iconCircle}>
                                        <Feather name="sun" size={40} color={colors.textSecondary} />
                                    </View>
                                    <Text style={styles.emptyTitle}>No Updates Yet</Text>
                                    <Text style={styles.emptyText}>Daily activities and photos will appear here.</Text>
                                </View>
                            ) : (
                                updates.map((item) => (
                                    <View key={item.id} style={styles.card}>
                                        {item.mediaUrls && item.mediaUrls.length > 0 && (
                                            <Image source={{ uri: item.mediaUrls[0] }} style={styles.cardImage} />
                                        )}
                                        <View style={styles.cardContent}>
                                            <View style={styles.cardHeader}>
                                                <View style={styles.teacherRow}>
                                                    <View style={styles.teacherAvatar}>
                                                        <Feather name="user" size={14} color={colors.primary} />
                                                    </View>
                                                    <Text style={styles.teacherName}>{item.teacherName || 'Class Teacher'}</Text>
                                                </View>
                                                <Text style={styles.time}>{new Date(item.postedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                            </View>
                                            <Text style={styles.title}>{item.title || item.activityType.toUpperCase()}</Text>
                                            <Text style={styles.desc}>{item.content}</Text>
                                        </View>
                                    </View>
                                ))
                            )
                        )}

                        {/* Announcements List */}
                        {activeTab === 'announcements' && (
                            announcements.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <View style={styles.iconCircle}>
                                        <Feather name="bell" size={40} color={colors.textSecondary} />
                                    </View>
                                    <Text style={styles.emptyTitle}>No Announcements</Text>
                                    <Text style={styles.emptyText}>School notices and alerts will be shown here.</Text>
                                </View>
                            ) : (
                                announcements.map((item) => (
                                    <View key={item.id} style={styles.announcementCard}>
                                        <View style={styles.announcementHeader}>
                                            <View style={[styles.priorityBadge, item.priority === 'high' ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#E0F2FE' }]}>
                                                <Text style={[styles.priorityText, item.priority === 'high' ? { color: '#DC2626' } : { color: '#0284C7' }]}>
                                                    {item.priority === 'high' ? 'URGENT' : 'NOTICE'}
                                                </Text>
                                            </View>
                                            <Text style={styles.time}>{new Date(item.publishedAt).toLocaleDateString()}</Text>
                                        </View>
                                        <Text style={styles.announcementTitle}>{item.title}</Text>
                                        <Text style={styles.desc}>{item.content}</Text>
                                    </View>
                                ))
                            )
                        )}



                        {/* Holidays List */}
                        {activeTab === 'holidays' && holidays.map((item) => {
                            const d = formatDate(item.eventDate);
                            return (
                                <View key={item.id} style={styles.holidayCard}>
                                    <View style={[styles.dateBox, { backgroundColor: '#FEF3C7' }]}>
                                        <Text style={[styles.month, { color: '#D97706' }]}>{d.month}</Text>
                                        <Text style={[styles.date, { color: '#B45309' }]}>{d.day}</Text>
                                    </View>
                                    <View style={styles.eventInfo}>
                                        <Text style={styles.eventTitle}>{item.title}</Text>
                                        <Text style={styles.infoText}>{d.weekday}</Text>
                                    </View>
                                </View>
                            );
                        })}


                    </>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const Badge = ({ children, style }: any) => (
    <View style={[{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }, style]}>
        {children}
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: 20, backgroundColor: 'white' },
    headerTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },

    tabContainer: { flexDirection: 'row', marginBottom: 16, backgroundColor: 'white', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    tab: { marginHorizontal: 16, paddingBottom: 8 },
    activeTab: { borderBottomWidth: 2, borderBottomColor: colors.accent },
    tabText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    activeTabText: { color: colors.accent, fontWeight: '700' },

    content: { padding: spacing.lg },

    // Update Card
    card: { backgroundColor: 'white', borderRadius: 20, marginBottom: spacing.lg, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2, overflow: 'hidden' },
    cardImage: { width: '100%', height: 200 },
    cardContent: { padding: spacing.md },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    teacherAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center' },
    teacherName: { fontSize: 13, fontWeight: '600', color: colors.accent },
    time: { fontSize: 12, color: colors.textTertiary },
    title: { fontSize: 17, fontWeight: '700', color: colors.primary, marginBottom: 4 },
    desc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
    actions: { flexDirection: 'row', gap: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },

    // Announcement Card
    announcementCard: { backgroundColor: 'white', borderRadius: 16, padding: spacing.md, marginBottom: spacing.md, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
    announcementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    priorityText: { fontSize: 10, fontWeight: '700' },
    announcementTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },

    // Event Card
    eventCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, elevation: 1 },
    dateBox: { width: 50, height: 60, backgroundColor: colors.primaryLight, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    month: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
    date: { fontSize: 20, fontWeight: 'bold', color: colors.primaryDark },
    eventInfo: { flex: 1, marginLeft: 16 },
    eventTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    infoText: { fontSize: 13, color: colors.textSecondary },
    arrowBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },

    // Holiday
    holidayCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, elevation: 1 },

    // Empty State
    emptyState: { alignItems: 'center', marginTop: 60 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
    emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', width: '80%' },
});

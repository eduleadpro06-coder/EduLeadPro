import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api, type DailyUpdate, type Event, type Homework } from './services/api';

const { width } = Dimensions.get('window');

const colors = {
    primary: '#2D7A5F',
    primaryLight: '#D1FAE5',
    white: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',
    background: '#F0FDF4',
    border: '#E5E7EB',
    accent: '#F59E0B',
    primaryDark: '#1F5A45',
};

const tabs = [
    { id: 'daily', label: 'Daily Updates' },
    { id: 'events', label: 'Events' },
    { id: 'holidays', label: 'Holidays' },
    { id: 'homework', label: 'Homework' },
];

interface ActivitiesScreenProps {
    currentUser: any;
    currentChild: any;
}

export default function ActivitiesScreen({ currentUser, currentChild }: ActivitiesScreenProps) {
    const [activeTab, setActiveTab] = useState('daily');
    const [updates, setUpdates] = useState<DailyUpdate[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [holidays, setHolidays] = useState<Event[]>([]);
    const [homework, setHomework] = useState<Homework[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [currentChild]);

    const fetchData = async () => {
        if (!currentChild) return;
        setIsLoading(true);
        try {
            const [updRes, evRes, hwRes] = await Promise.all([
                api.getDailyUpdates(currentChild.id),
                api.getEvents(currentUser.organization_id),
                api.getHomework(currentChild.class)
            ]);

            setUpdates(updRes);
            setEvents(evRes.filter(e => e.eventType === 'event'));
            setHolidays(evRes.filter(e => e.eventType === 'holiday'));
            setHomework(hwRes);
        } catch (e) {
            console.error('Failed to fetch screen data', e);
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                        {activeTab === 'daily' && updates.length === 0 && (
                            <Text style={{ textAlign: 'center', marginTop: 50, color: colors.textSecondary }}>No updates yet.</Text>
                        )}
                        {activeTab === 'daily' && updates.map((item) => (
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
                                    <View style={styles.actions}>
                                        <TouchableOpacity style={styles.actionBtn}>
                                            <Feather name="heart" size={18} color={colors.textSecondary} />
                                            <Text style={styles.actionText}>Like</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.actionBtn}>
                                            <Feather name="message-circle" size={18} color={colors.textSecondary} />
                                            <Text style={styles.actionText}>Comment</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}

                        {/* Events List */}
                        {activeTab === 'events' && events.map((item) => {
                            const d = formatDate(item.eventDate);
                            return (
                                <View key={item.id} style={styles.eventCard}>
                                    <View style={styles.dateBox}>
                                        <Text style={styles.month}>{d.month}</Text>
                                        <Text style={styles.date}>{d.day}</Text>
                                    </View>
                                    <View style={styles.eventInfo}>
                                        <Text style={styles.eventTitle}>{item.title}</Text>
                                        <View style={styles.infoRow}>
                                            <Feather name="clock" size={14} color={colors.textSecondary} />
                                            <Text style={styles.infoText}>{item.eventTime || 'TBA'}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Feather name="map-pin" size={14} color={colors.textSecondary} />
                                            <Text style={styles.infoText}>{item.description || 'School Campus'}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.arrowBox}>
                                        <Feather name="chevron-right" size={20} color={colors.textLight} />
                                    </View>
                                </View>
                            );
                        })}

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

                        {/* Homework List */}
                        {activeTab === 'homework' && homework.map((item) => (
                            <View key={item.id} style={styles.card}>
                                <View style={styles.cardContent}>
                                    <View style={styles.cardHeader}>
                                        <Badge style={{ backgroundColor: colors.accent + '20' }}>
                                            <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700' }}>{item.subject || 'HOMEWORK'}</Text>
                                        </Badge>
                                        <Text style={styles.time}>Due: {item.dueDate}</Text>
                                    </View>
                                    <Text style={styles.title}>{item.title}</Text>
                                    <Text style={styles.desc}>{item.description}</Text>
                                    <View style={styles.teacherRow}>
                                        <Feather name="user" size={14} color={colors.textSecondary} />
                                        <Text style={styles.teacherName}>{item.teacherName || 'Subject Teacher'}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
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
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: 'white' },
    headerTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },

    tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, backgroundColor: 'white', paddingBottom: 12 },
    tab: { marginRight: 24, paddingBottom: 8 },
    activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabText: { fontSize: 16, color: colors.textSecondary, fontWeight: '500' },
    activeTabText: { color: colors.primary, fontWeight: '600' },

    content: { padding: 20 },

    // Update Card
    card: { backgroundColor: 'white', borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2, overflow: 'hidden' },
    cardImage: { width: '100%', height: 200 },
    cardContent: { padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    teacherAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
    teacherName: { fontSize: 13, fontWeight: '500', color: colors.textPrimary },
    time: { fontSize: 12, color: colors.textLight },
    title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
    desc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },
    actions: { flexDirection: 'row', gap: 24, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },

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
});

// Simple test component to verify API connection
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { api } from './services/api';

export default function APITest() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Test fetching children
            const children = await api.getChildren('gaurav.kachwaha16@gmail.com');

            // Test fetching announcements
            const announcements = await api.getAnnouncements(1);

            // Test fetching events
            const events = await api.getEvents(1);

            setData({
                children,
                announcements,
                events,
            });
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
            console.error('API Error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#2D7A5F" />
                <Text style={styles.loadingText}>Loading data from backend...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorTitle}>❌ Error</Text>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.hint}>
                    Make sure the backend is running on http://localhost:5000
                </Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>✅ API Connection Successful!</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Children ({data?.children?.length || 0})</Text>
                {data?.children?.map((child: any) => (
                    <View key={child.id} style={styles.card}>
                        <Text style={styles.cardTitle}>{child.name}</Text>
                        <Text style={styles.cardSubtitle}>Class: {child.class}</Text>
                        <Text style={styles.cardSubtitle}>Status: {child.status}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Announcements ({data?.announcements?.length || 0})</Text>
                {data?.announcements?.slice(0, 3).map((announcement: any) => (
                    <View key={announcement.id} style={styles.card}>
                        <Text style={styles.cardTitle}>{announcement.title}</Text>
                        <Text style={styles.cardText}>{announcement.content}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Events ({data?.events?.length || 0})</Text>
                {data?.events?.slice(0, 3).map((event: any) => (
                    <View key={event.id} style={styles.card}>
                        <Text style={styles.cardTitle}>{event.title}</Text>
                        <Text style={styles.cardSubtitle}>{event.eventDate}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F5F7FA',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D7A5F',
        marginBottom: 20,
        marginTop: 40,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#EF4444',
        marginBottom: 12,
    },
    errorText: {
        fontSize: 16,
        color: '#DC2626',
        marginBottom: 8,
    },
    hint: {
        fontSize: 14,
        color: '#6B7280',
        fontStyle: 'italic',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 2,
    },
    cardText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
});

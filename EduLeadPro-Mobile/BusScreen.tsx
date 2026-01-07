import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from './services/api';

const { width } = Dimensions.get('window');

const colors = {
    primary: '#2D7A5F',
    white: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    success: '#10B981',
    background: '#F0FDF4',
    border: '#E5E7EB',
};

interface BusScreenProps {
    currentChild: any;
}

export default function BusScreen({ currentChild }: BusScreenProps) {
    const [busData, setBusData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (currentChild) {
            fetchBusData();
        }
    }, [currentChild]);

    const fetchBusData = async () => {
        try {
            const data = await api.getBusLocation(currentChild.id);
            setBusData(data);
        } catch (error) {
            console.error('Failed to fetch bus location:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!busData || !busData.isLive) {
        return (
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.emptyContainer}>
                    <Feather name="navigation-2" size={64} color={colors.textSecondary} />
                    <Text style={styles.emptyTitle}>Bus Tracking Unavailable</Text>
                    <Text style={styles.emptyText}>
                        {busData?.message || 'Live tracking is not available at this moment'}
                    </Text>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Map Area */}
            <View style={styles.mapContainer}>
                <Image
                    source={{ uri: 'https://img.freepik.com/free-vector/city-map-navigation-background-with-pins_23-2148813264.jpg' }}
                    style={styles.mapImage}
                />
                <View style={styles.mapOverlay}>
                    <View style={styles.liveTag}>
                        <View style={styles.pulsingDot} />
                        <Text style={styles.liveText}>LIVE TRACKING</Text>
                    </View>
                    <View style={styles.busPin}>
                        <Feather name="truck" size={20} color="white" />
                    </View>
                </View>
            </View>

            <View style={styles.contentContainer}>
                {/* Bus Info Card */}
                <View style={styles.card}>
                    <View style={styles.busHeader}>
                        <View>
                            <Text style={styles.busNumber}>{busData.busNumber}</Text>
                            <Text style={styles.routeText}>Route #12 • Afternoon Drop</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}>
                            <Text style={[styles.statusText, { color: colors.primary }]}>On Time</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.driverRow}>
                        <View style={[styles.driverPhoto, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
                            <Feather name="user" size={24} color={colors.textSecondary} />
                        </View>
                        <View style={styles.driverInfo}>
                            <Text style={styles.label}>Driver</Text>
                            <Text style={styles.name}>Driver info unavailable</Text>
                        </View>
                        <TouchableOpacity style={styles.callButton}>
                            <Feather name="phone" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.driverRow, { marginTop: 16 }]}>
                        <View style={[styles.driverPhoto, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
                            <Feather name="user" size={24} color={colors.textSecondary} />
                        </View>
                        <View style={styles.driverInfo}>
                            <Text style={styles.label}>Attendant</Text>
                            <Text style={styles.name}>Attendant info unavailable</Text>
                        </View>
                    </View>
                </View>

                {/* ETA Card */}
                <View style={styles.card}>
                    <View style={styles.etaHeader}>
                        <Feather name="clock" size={20} color={colors.primary} />
                        <Text style={styles.etaTitle}>Estimated Arrival</Text>
                    </View>
                    <Text style={styles.etaTime}>{busData.eta || '~15 mins'}</Text>
                    <Text style={styles.etaSubtext}>Location last updated: {new Date(busData.lastUpdate).toLocaleTimeString()}</Text>
                </View>

                {/* Route Timeline - Hidden for now */}
                <View style={{ height: 80 }} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    mapContainer: { height: 250, width: '100%', position: 'relative' },
    mapImage: { width: '100%', height: '100%', opacity: 0.9 },
    mapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
    mapPin: {
        position: 'absolute',
        padding: 8,
        borderRadius: 8,
    },
    currentTag: {
        backgroundColor: colors.success,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        minHeight: 400,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    pulsingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
    liveText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    busPin: { position: 'absolute', top: '50%', left: '50%', width: 40, height: 40, marginLeft: -20, marginTop: -20, backgroundColor: colors.primary, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white', shadowColor: '#000', shadowOpacity: 0.3, elevation: 5 },

    contentContainer: { marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.background, flex: 1, padding: 20 },
    card: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2, marginBottom: 24 },
    busHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    busNumber: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
    routeText: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 12, fontWeight: '600' },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
    driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    driverPhoto: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5E7EB' },
    driverInfo: { flex: 1 },
    label: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    name: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    rating: { fontSize: 12, color: colors.textSecondary },
    callButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },

    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
    timelineCard: { backgroundColor: 'white', borderRadius: 16, padding: 20 },
    timelineItem: { flexDirection: 'row', height: 60 },
    timelineLeft: { width: 70, alignItems: 'flex-end', paddingRight: 12 },
    time: { fontSize: 12, color: colors.textSecondary, fontWeight: '500', paddingTop: 4 },
    timelineCenter: { alignItems: 'center', width: 24 },
    dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', zIndex: 2, borderWidth: 2, borderColor: 'white' },
    dotCompleted: { backgroundColor: colors.primary },
    dotCurrent: { backgroundColor: colors.white, borderColor: colors.primary, borderWidth: 4 },
    innerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' },
    line: { width: 2, flex: 1, backgroundColor: '#E5E7EB', position: 'absolute', top: 16, bottom: -16 },
    lineCompleted: { backgroundColor: colors.primary },
    timelineRight: { flex: 1, paddingLeft: 12, paddingTop: 2 },
    stopName: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    stopNameCurrent: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
    currentTag: { fontSize: 11, color: colors.primary, marginTop: 2, fontWeight: '500' },
});

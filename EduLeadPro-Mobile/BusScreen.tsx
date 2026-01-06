import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

const mockBus = {
    driver: {
        name: 'Rajesh Kumar',
        phone: '+91 98765 43210',
        photo: 'https://randomuser.me/api/portraits/men/32.jpg',
        rating: 4.8
    },
    attendant: {
        name: 'Sunita Devi',
        phone: '+91 98765 12345',
    },
    busNumber: 'MH 14 DX 4521',
    route: [
        { id: 1, name: 'School Campus', time: '1:30 PM', status: 'completed' },
        { id: 2, name: 'Mg Road Signal', time: '1:45 PM', status: 'completed' },
        { id: 3, name: 'City Mall', time: '2:00 PM', status: 'current' },
        { id: 4, name: 'Sector 45', time: '2:15 PM', status: 'pending' },
        { id: 5, name: 'Green Valley', time: '2:30 PM', status: 'pending' },
    ]
};

export default function BusScreen() {
    const [refreshing, setRefreshing] = useState(false);

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
                            <Text style={styles.busNumber}>{mockBus.busNumber}</Text>
                            <Text style={styles.routeText}>Route #12 • Afternoon Drop</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}>
                            <Text style={[styles.statusText, { color: colors.primary }]}>On Time</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.driverRow}>
                        <Image source={{ uri: mockBus.driver.photo }} style={styles.driverPhoto} />
                        <View style={styles.driverInfo}>
                            <Text style={styles.label}>Driver</Text>
                            <Text style={styles.name}>{mockBus.driver.name}</Text>
                            <View style={styles.ratingRow}>
                                <Feather name="star" size={12} color="#F59E0B" />
                                <Text style={styles.rating}>{mockBus.driver.rating}</Text>
                            </View>
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
                            <Text style={styles.name}>{mockBus.attendant.name}</Text>
                        </View>
                        <TouchableOpacity style={[styles.callButton, { backgroundColor: '#6B7280' }]}>
                            <Feather name="phone" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Timeline */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Route Timeline</Text>
                    <View style={styles.timelineCard}>
                        {mockBus.route.map((stop, index) => {
                            const isLast = index === mockBus.route.length - 1;
                            const isCompleted = stop.status === 'completed';
                            const isCurrent = stop.status === 'current';

                            return (
                                <View key={stop.id} style={styles.timelineItem}>
                                    <View style={styles.timelineLeft}>
                                        <Text style={styles.time}>{stop.time}</Text>
                                    </View>
                                    <View style={styles.timelineCenter}>
                                        <View style={[
                                            styles.dot,
                                            isCompleted && styles.dotCompleted,
                                            isCurrent && styles.dotCurrent
                                        ]}>
                                            {isCompleted && <Feather name="check" size={10} color="white" />}
                                            {isCurrent && <View style={styles.innerDot} />}
                                        </View>
                                        {!isLast && <View style={[styles.line, isCompleted && styles.lineCompleted]} />}
                                    </View>
                                    <View style={styles.timelineRight}>
                                        <Text style={[styles.stopName, isCurrent && styles.stopNameCurrent]}>
                                            {stop.name}
                                        </Text>
                                        {isCurrent && <Text style={styles.currentTag}>Bus is here</Text>}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    mapContainer: { height: 250, width: '100%', position: 'relative' },
    mapImage: { width: '100%', height: '100%', opacity: 0.9 },
    mapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
    liveTag: { position: 'absolute', top: 40, left: 20, backgroundColor: colors.success, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
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

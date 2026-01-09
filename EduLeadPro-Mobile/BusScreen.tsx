import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Linking, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from './services/api';
import { colors, spacing, typography } from './src/theme';

// Conditionally import MapView only for native platforms (not web)
let MapView: any = null;
let Marker: any = null;
let PROVIDER_DEFAULT: any = null;

if (Platform.OS !== 'web') {
    const mapModule = require('react-native-maps');
    MapView = mapModule.default;
    Marker = mapModule.Marker;
    PROVIDER_DEFAULT = mapModule.PROVIDER_DEFAULT;
}

const { width, height } = Dimensions.get('window');


interface BusScreenProps {
    currentChild: any;
}

export default function BusScreen({ currentChild }: BusScreenProps) {
    const [busData, setBusData] = useState<any>(null);
    const [liveLocation, setLiveLocation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLive, setIsLive] = useState(false);
    const [studentStatus, setStudentStatus] = useState<string>('pending');
    const [statusTime, setStatusTime] = useState<string | null>(null);
    const mapRef = useRef<any>(null); // Using any to avoid type issues with conditional import
    const [markerRotation, setMarkerRotation] = useState<number>(0);
    const [followBus, setFollowBus] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const updateInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (currentChild) {
            fetchBusData();
            startLiveUpdates();
        }

        return () => {
            if (updateInterval.current) {
                clearInterval(updateInterval.current);
            }
        };
    }, [currentChild]);

    const fetchBusData = async () => {
        try {
            const response = await api.getBusLocation(currentChild.id);
            // API returns { assignments: [...] }
            // We need to extract the first active assignment

            if (response && response.assignments && response.assignments.length > 0) {
                const assignment = response.assignments[0];
                const processedData = {
                    assignment: assignment,
                    route: {
                        id: assignment.route_id,
                        routeName: assignment.bus_routes?.route_name,
                        vehicleNumber: assignment.bus_routes?.bus_number,
                        status: assignment.bus_routes?.route_type || 'Active', // Fallback
                        helperName: assignment.bus_routes?.helper_name || 'Attendant',
                        helperPhone: assignment.bus_routes?.helper_phone
                    },
                    driver: {
                        name: assignment.driver_name || 'Driver', // Will be enhanced in backend
                        phone: assignment.driver_phone
                    }
                };

                setBusData(processedData);

                // If bus is assigned, fetch live location
                if (assignment.route_id) {
                    await fetchLiveLocation(assignment.route_id, currentChild.id);
                }
            } else {
                setBusData(null);
            }
        } catch (error) {
            console.error('Failed to fetch bus data:', error);
            setError('Failed to fetch bus data.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLiveLocation = async (routeId: number, studentId?: number) => {
        try {
            const response = await api.getLiveBusLocation(routeId, studentId);
            if (response.success && response.data) {
                if (response.data.location) {
                    const newLocation = {
                        latitude: response.data.location.latitude,
                        longitude: response.data.location.longitude,
                        speed: response.data.location.speed,
                        timestamp: response.data.location.timestamp,
                    };
                    setLiveLocation(newLocation);
                    setMarkerRotation(response.data.location.heading || 0);
                    setIsLive(response.data.isLive);

                    // Update student status
                    setStudentStatus(response.data.studentStatus || 'pending');
                    setStatusTime(response.data.statusTime);

                    if (followBus && mapRef.current) {
                        mapRef.current.animateToRegion({
                            ...newLocation,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }, 1000);
                    }
                } else {
                    setIsLive(false);
                    setStudentStatus(response.data.studentStatus || 'pending');
                }
            }
        } catch (err) {
            console.error("Error fetching live location:", err);
            setError('Failed to fetch live location.');
            setIsLive(false);
        }
    };

    const startLiveUpdates = () => {
        // Update location every 10 seconds
        updateInterval.current = setInterval(() => {
            if (busData?.route?.id) {
                fetchLiveLocation(busData.route.id);
            }
        }, 10000);
    };

    const calculateETA = () => {
        if (!liveLocation || !liveLocation.speed || liveLocation.speed === 0) {
            return '~15 mins';
        }

        // Simple ETA calculation based on speed
        // Assuming average distance of 5km to pickup point
        const averageDistance = 5; // km
        const speedKmh = liveLocation.speed;
        const timeHours = averageDistance / speedKmh;
        const timeMinutes = Math.round(timeHours * 60);

        return timeMinutes > 0 ? `~${timeMinutes} mins` : 'Arriving soon';
    };

    if (!currentChild) {
        return (
            <View style={[styles.container, styles.emptyContainer]}>
                <Feather name="user-x" size={64} color={colors.textSecondary} />
                <Text style={styles.emptyTitle}>No Student Selected</Text>
                <Text style={styles.emptyText}>Please select a student to view their bus status.</Text>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!busData || !busData.assignment) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <View style={styles.emptyContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.background }]}>
                        <Feather name="alert-circle" size={48} color={colors.accent} />
                    </View>
                    <Text style={styles.emptyTitle}>No Bus Route Assigned</Text>
                    <Text style={styles.emptyText}>
                        This student is not currently assigned to a bus route. Please contact the school office for assistance.
                    </Text>
                </View>
            </ScrollView>
        );
    }

    return (
        <View style={styles.container}>
            {/* Live Map */}
            <View style={styles.mapContainer}>
                {Platform.OS === 'web' ? (
                    // Web fallback - show simple placeholder
                    <View style={[styles.map, { backgroundColor: colors.surfaceHighlight, justifyContent: 'center', alignItems: 'center' }]}>
                        <Feather name="map" size={48} color={colors.textSecondary} />
                        <Text style={{ marginTop: 12, color: colors.textSecondary }}>
                            Map view is available on mobile app only
                        </Text>
                        {liveLocation && (
                            <View style={{ marginTop: 16, alignItems: 'center' }}>
                                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
                                    Bus Location: {liveLocation.latitude.toFixed(4)}, {liveLocation.longitude.toFixed(4)}
                                </Text>
                                <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
                                    Speed: {Math.round(liveLocation.speed)} km/h
                                </Text>
                            </View>
                        )}
                    </View>
                ) : (
                    // Native platforms - show actual map
                    <MapView
                        ref={mapRef as any}
                        provider={PROVIDER_DEFAULT}
                        style={styles.map}
                        initialRegion={{
                            latitude: liveLocation?.latitude || 28.6139, // Default to Delhi
                            longitude: liveLocation?.longitude || 77.2090,
                            latitudeDelta: 0.02,
                            longitudeDelta: 0.02,
                        }}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                    >
                        {liveLocation && isLive && (
                            <Marker
                                coordinate={{
                                    latitude: liveLocation.latitude,
                                    longitude: liveLocation.longitude,
                                }}
                                title="School Bus"
                                description={`Speed: ${Math.round(liveLocation.speed)} km/h`}
                            >
                                <View style={styles.busMarker}>
                                    <Feather name="truck" size={24} color="white" />
                                </View>
                            </Marker>
                        )}
                    </MapView>
                )}

                {/* Live Indicator Overlay */}
                {isLive && (
                    <View style={styles.liveTagContainer}>
                        <View style={styles.liveTag}>
                            <View style={styles.pulsingDot} />
                            <Text style={styles.liveText}>LIVE TRACKING</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Info Cards */}
            <ScrollView
                style={styles.contentContainer}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Bus Info Card */}
                <View style={styles.card}>
                    <View style={styles.busHeader}>
                        <View>
                            <Text style={styles.busNumber}>{busData.route?.vehicleNumber || 'Bus'}</Text>
                            <Text style={styles.routeText}>{busData.route?.routeName || 'Route'} • {busData.route?.status || 'Active'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={styles.statusBadge}>
                                <View style={[styles.statusDot, { backgroundColor: isLive ? '#4CAF50' : '#F44336' }]} />
                                <Text style={styles.statusText}>{isLive ? 'Live Tracking' : 'Inactive'}</Text>
                            </View>
                            <View style={[styles.statusBadge, { marginLeft: 10, backgroundColor: '#E3F2FD' }]}>
                                <Text style={[styles.statusText, { color: '#1976D2', textTransform: 'capitalize' }]}>
                                    {studentStatus === 'boarded' ? '✅ Boarded' :
                                        studentStatus === 'dropped' ? '🏠 Dropped' : '⏳ Waiting'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.driverRow}>
                        <View style={[styles.driverPhoto, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
                            <Feather name="user" size={24} color={colors.textSecondary} />
                        </View>
                        <View style={styles.driverInfo}>
                            <Text style={styles.label}>Driver</Text>
                            <Text style={styles.name}>{busData.driver?.name || 'Driver info unavailable'}</Text>
                        </View>
                        {busData.driver?.phone && (
                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={() => Linking.openURL(`tel:${busData.driver.phone}`)}
                            >
                                <Feather name="phone" size={20} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={[styles.driverRow, { marginTop: 16 }]}>
                        <View style={[styles.driverPhoto, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
                            <Feather name="user" size={24} color={colors.textSecondary} />
                        </View>
                        <View style={styles.driverInfo}>
                            <Text style={styles.label}>Attendant</Text>
                            <Text style={styles.name}>{busData.route?.helperName || 'Attendant info unavailable'}</Text>
                        </View>
                        {busData.route?.helperPhone && (
                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={() => Linking.openURL(`tel:${busData.route.helperPhone}`)}
                            >
                                <Feather name="phone" size={20} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ETA Card */}
                <View style={styles.card}>
                    <View style={styles.etaHeader}>
                        <Feather name="clock" size={20} color={colors.primary} />
                        <Text style={styles.etaTitle}>Estimated Arrival</Text>
                    </View>
                    <Text style={styles.etaTime}>{calculateETA()}</Text>
                    <Text style={styles.etaSubtext}>
                        Location last updated: {liveLocation ? new Date(liveLocation.timestamp).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) : 'Tracking not active'}
                    </Text>
                    {liveLocation && isLive && (
                        <View style={styles.speedInfo}>
                            <Feather name="activity" size={16} color={colors.textSecondary} />
                            <Text style={styles.speedText}>
                                Current Speed: {Math.round(liveLocation.speed)} km/h
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    mapContainer: {
        height: height * 0.4,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    busMarker: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    liveTagContainer: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    liveTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    pulsingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
        marginRight: 6,
    },
    liveText: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '700',
        fontSize: 11,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    busHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    busNumber: {
        ...typography.h2,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    routeText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        ...typography.caption,
        fontWeight: '700',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: spacing.md,
    },
    driverRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverPhoto: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    driverInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    name: {
        ...typography.body,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    etaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    etaTitle: {
        ...typography.body,
        fontWeight: '700',
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },
    etaTime: {
        ...typography.h1,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    etaSubtext: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    speedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    speedText: {
        ...typography.body,
        color: colors.textSecondary,
        marginLeft: spacing.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        ...typography.h2,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
});

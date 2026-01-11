/**
 * Bus Tracking Screen - Premium Design with Expo Router
 * Based on premium BusScreen.tsx with Ola Maps integration
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Linking,
    StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import OlaMapView from '../../src/components/maps/OlaMapView';
import { api } from '../../services/api';
import { getDirections, LatLng } from '../../src/utils/olaApi';
import { colors, spacing, typography, shadows } from '../../src/theme';
import PremiumCard from '../../src/components/ui/PremiumCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function BusTrackingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const currentChild = user?.children?.[0];

    const [busData, setBusData] = useState<any>(null);
    const [liveLocation, setLiveLocation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLive, setIsLive] = useState(false);
    const [studentStatus, setStudentStatus] = useState<string>('pending');
    const [orgLocation, setOrgLocation] = useState<any>(null);
    const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
    const [error, setError] = useState<string | null>(null);
    const updateInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (currentChild) {
            fetchBusData();
            startLiveUpdates();
        } else {
            // Stop loading if no child is found
            setIsLoading(false);
            setError('No student information found.');
        }

        return () => {
            if (updateInterval.current) {
                clearInterval(updateInterval.current);
            }
        };
    }, [currentChild]);

    useEffect(() => {
        if (liveLocation && busData) {
            updateRoute();
        }
    }, [liveLocation, studentStatus, busData]);

    const updateRoute = async () => {
        if (!liveLocation || !busData) return;

        let destination: LatLng | null = null;

        // Determine destination based on status
        if (studentStatus === 'pending' || studentStatus === 'waiting') {
            // Destination is the pickup stop
            if (busData.assignment?.pickup_stop) {
                destination = {
                    latitude: parseFloat(busData.assignment.pickup_stop.latitude),
                    longitude: parseFloat(busData.assignment.pickup_stop.longitude)
                };
            }
        } else if (studentStatus === 'boarded') {
            // Destination is the school (last stop of route)
            const stops = busData.assignment?.route_stops || [];
            if (stops.length > 0) {
                const schoolStop = stops[stops.length - 1];
                destination = {
                    latitude: parseFloat(schoolStop.latitude),
                    longitude: parseFloat(schoolStop.longitude)
                };
            }
        }

        if (destination) {
            console.log(`[BusTracking] Requesting route: From(${liveLocation.latitude}, ${liveLocation.longitude}) To(${destination.latitude}, ${destination.longitude})`);
            const coords = await getDirections(
                { latitude: liveLocation.latitude, longitude: liveLocation.longitude },
                destination
            );
            console.log(`[BusTracking] Received ${coords.length} route coordinates`);
            if (coords.length > 0) {
                setRouteCoords(coords);
            }
        } else {
            console.log('[BusTracking] No destination determined for route');
            setRouteCoords([]);
        }
    };

    const fetchBusData = async () => {
        try {
            console.log('[BusTracking] Fetching bus assignment for student:', currentChild?.id);
            const response = await api.getBusLocation(currentChild?.id ? Number(currentChild.id) : 0);
            console.log('[BusTracking] Assignment response:', JSON.stringify(response));

            if (response && response.assignments && response.assignments.length > 0) {
                const assignment = response.assignments[0];
                const processedData = {
                    assignment: assignment,
                    route: {
                        id: assignment.route_id,
                        routeName: assignment.bus_routes?.route_name,
                        vehicleNumber: assignment.bus_routes?.bus_number,
                        status: assignment.bus_routes?.route_type || 'Active',
                        helperName: assignment.bus_routes?.helper_name || 'Attendant',
                        helperPhone: assignment.bus_routes?.helper_phone
                    },
                    driver: {
                        name: assignment.driver_name || 'Driver',
                        phone: assignment.driver_phone
                    }
                };

                setBusData(processedData);

                if (assignment.route_id) {
                    await fetchLiveLocation(assignment.route_id, currentChild?.id ? Number(currentChild.id) : undefined);
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
            console.log(`[BusTracking] Polling live location for Route: ${routeId}, Student: ${studentId}`);
            const response = await api.getLiveBusLocation(routeId, studentId);
            console.log('[BusTracking] Live Location response:', JSON.stringify(response));

            // APIService.fetchWithAuth already unwraps 'data' property if it exists.
            // Our backend now returns { success: true, isLive: ... } directly at the root.
            if (response && (response.success || response.isLive !== undefined)) {
                console.log(`[BusTracking] Status: ${response.isLive ? 'LIVE' : 'OFFLINE'}, StudentStatus: ${response.studentStatus}`);
                setIsLive(!!response.isLive);
                setStudentStatus(response.studentStatus || 'pending');

                if (response.location) {
                    console.log(`[BusTracking] Pos: ${response.location.latitude}, ${response.location.longitude}`);
                    setLiveLocation({
                        latitude: response.location.latitude,
                        longitude: response.location.longitude,
                        speed: response.location.speed,
                        timestamp: response.location.timestamp,
                    });
                } else {
                    console.log('[BusTracking] No location data in response');
                }

                if (response.orgLocation) {
                    setOrgLocation(response.orgLocation);
                }
            } else {
                console.log('[BusTracking] Response invalid or missing isLive status');
                setIsLive(false);
            }
        } catch (err) {
            console.error("[BusTracking] Error fetching live location:", err);
            setIsLive(false);
        }
    };

    const startLiveUpdates = () => {
        updateInterval.current = setInterval(() => {
            if (busData?.route?.id) {
                fetchLiveLocation(busData.route.id, currentChild?.id ? Number(currentChild.id) : undefined);
            }
        }, 10000) as any;
    };

    const calculateETA = () => {
        if (!isLive || !liveLocation) {
            return '--';
        }

        // Default values for calculation
        const averageDistance = 5; // km (hardcoded for now, could be dynamic)

        // Use current speed if moving (> 2 km/h), otherwise fallback to average city speed (15 km/h)
        const speedKmh = (liveLocation.speed && liveLocation.speed > 2) ? liveLocation.speed : 15;

        const timeHours = averageDistance / speedKmh;
        const timeMinutes = Math.round(timeHours * 60);

        if (timeMinutes <= 2) return 'Arriving soon';
        return `~${timeMinutes} mins`;
    };

    // Map markers
    const mapMarkers: any[] = [];

    // 1. Always show Pickup Point
    if (busData?.assignment?.pickup_stop) {
        mapMarkers.push({
            coordinate: {
                latitude: parseFloat(busData.assignment.pickup_stop.latitude),
                longitude: parseFloat(busData.assignment.pickup_stop.longitude)
            },
            title: "Pickup Point",
            description: "Assigned Stop",
            icon: 'marker' as const
        });
    }

    // 2. Show Bus if Live
    if (liveLocation && isLive) {
        mapMarkers.push({
            coordinate: { latitude: liveLocation.latitude, longitude: liveLocation.longitude },
            title: "School Bus",
            description: `Speed: ${Math.round(liveLocation.speed)} km/h`,
            icon: 'bus' as const
        });
    }

    // 3. Show School (Org Location or Last Stop Fallback)
    const schoolLoc = orgLocation || (busData?.assignment?.route_stops?.length > 0 ? busData.assignment.route_stops[busData.assignment.route_stops.length - 1] : null);

    if (schoolLoc) {
        mapMarkers.push({
            coordinate: {
                latitude: parseFloat(schoolLoc.latitude),
                longitude: parseFloat(schoolLoc.longitude)
            },
            title: "School",
            description: "School Campus",
            icon: 'school' as const,
            pinColor: '#EF4444' // Red pin for destination
        });
    }

    // Determine initial center
    const mapCenter = (liveLocation && isLive)
        ? { latitude: liveLocation.latitude, longitude: liveLocation.longitude }
        : (busData?.assignment?.pickup_stop
            ? {
                latitude: parseFloat(busData.assignment.pickup_stop.latitude),
                longitude: parseFloat(busData.assignment.pickup_stop.longitude)
            }
            : { latitude: 28.6139, longitude: 77.2090 });

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading bus data...</Text>
            </View>
        );
    }

    if (!busData || !busData.assignment) {
        return (
            <SafeAreaView style={styles.container}>
                <TouchableOpacity
                    style={[styles.mapBackBtn, { top: insets.top + 10 }]}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.emptyContainer}>
                    <View style={styles.iconCircle}>
                        <Feather name="alert-circle" size={48} color={colors.accent} />
                    </View>
                    <Text style={styles.emptyTitle}>No Bus Route Assigned</Text>
                    <Text style={styles.emptyText}>
                        This student is not currently assigned to a bus route. Please contact the school office.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Map Section */}
            <View style={styles.mapContainer}>
                <OlaMapView
                    center={mapCenter}
                    zoom={15}
                    markers={mapMarkers}
                    route={routeCoords}
                    showUserLocation={false}
                    style={styles.map}
                />

                {/* Back Button Overlay */}
                <TouchableOpacity
                    style={[styles.mapBackBtn, { top: insets.top + 10 }]}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={24} color="#1F2937" />
                </TouchableOpacity>

                {/* Live Indicator Overlay */}
                {isLive && (
                    <View style={[styles.liveTagContainer, { top: insets.top + 10 }]}>
                        <View style={styles.liveTag}>
                            <View style={styles.pulsingDot} />
                            <Text style={styles.liveText}>LIVE TRACKING</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Info Cards */}
            <View
                style={styles.contentContainer}
            >
                {/* Bus Info Card */}
                <PremiumCard style={styles.card}>
                    <View style={styles.busHeader}>
                        <View>
                            <Text style={styles.busNumber}>{busData.route?.vehicleNumber || 'Bus'}</Text>
                            <Text style={styles.routeText}>{busData.route?.routeName || 'Route'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.statusBadge, { backgroundColor: isLive ? '#DCFCE7' : '#F3F4F6' }]}>
                                <View style={[styles.statusDot, { backgroundColor: isLive ? '#22C55E' : '#94A3B8' }]} />
                                <Text style={[styles.statusText, { color: isLive ? '#22C55E' : '#64748B' }]}>
                                    {isLive ? 'Live' : 'No Active Trip'}
                                </Text>
                            </View>
                            {isLive && (
                                <View style={[styles.statusBadge, { marginLeft: 8, backgroundColor: '#E0F2FE' }]}>
                                    <Text style={[styles.statusText, { color: '#0284C7' }]}>
                                        {studentStatus === 'boarded' ? '✅ Boarded' :
                                            studentStatus === 'dropped' ? '🏠 Dropped' : '⏳ Waiting'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Driver Row */}
                    <View style={styles.contactRow}>
                        <View style={styles.avatarCircle}>
                            <Feather name="user" size={20} color={colors.textSecondary} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>Driver</Text>
                            <Text style={styles.contactName}>{busData.driver?.name}</Text>
                        </View>
                        {busData.driver?.phone && (
                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={() => Linking.openURL(`tel:${busData.driver.phone}`)}
                            >
                                <Feather name="phone" size={18} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Helper Row */}
                    <View style={[styles.contactRow, { marginTop: 12 }]}>
                        <View style={styles.avatarCircle}>
                            <Feather name="user" size={20} color={colors.textSecondary} />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactLabel}>Attendant</Text>
                            <Text style={styles.contactName}>{busData.route?.helperName}</Text>
                        </View>
                        {busData.route?.helperPhone && (
                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={() => Linking.openURL(`tel:${busData.route.helperPhone}`)}
                            >
                                <Feather name="phone" size={18} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                </PremiumCard>

                {/* ETA Card */}
                <PremiumCard style={styles.card}>
                    <View style={styles.etaHeader}>
                        <Feather name="clock" size={20} color={colors.primary} />
                        <Text style={styles.etaTitle}>Estimated Arrival</Text>
                    </View>
                    <Text style={styles.etaTime}>{calculateETA()}</Text>
                    <Text style={styles.etaSubtext}>
                        {liveLocation && isLive ? (() => {
                            const now = Date.now();
                            // Ensure timestamp is parsed as UTC
                            const locTime = new Date(liveLocation.timestamp).getTime();
                            const diffInSeconds = Math.max(0, Math.floor((now - locTime) / 1000));

                            if (diffInSeconds < 60) return `Updated: just now`;
                            const mins = Math.floor(diffInSeconds / 60);
                            return `Updated: ${mins} ${mins === 1 ? 'min' : 'mins'} ago`;
                        })() : 'Tracking not active'}
                    </Text>
                    {liveLocation && isLive && (
                        <View style={styles.speedInfo}>
                            <Feather name="activity" size={16} color={colors.textSecondary} />
                            <Text style={styles.speedText}>
                                Speed: {Math.round(liveLocation.speed)} km/h
                            </Text>
                        </View>
                    )}
                </PremiumCard>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    mapContainer: {
        height: height * 0.55,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    mapBackBtn: {
        position: 'absolute',
        top: 50,
        left: 16,
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.md,
        zIndex: 10,
    },
    liveTagContainer: {
        position: 'absolute',
        top: 50,
        right: 16,
    },
    liveTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        ...shadows.sm,
    },
    pulsingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22C55E',
        marginRight: 6,
    },
    liveText: {
        ...typography.caption,
        color: '#22C55E',
        fontWeight: '700',
        fontSize: 11,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        marginTop: -20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: colors.background,
    },
    card: {
        marginTop: spacing.lg,
    },
    busHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    busNumber: {
        ...typography.h2,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    routeText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        ...typography.caption,
        fontWeight: '600',
        fontSize: 11,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.md,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    contactLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
    },
    contactName: {
        ...typography.body,
        fontWeight: '600',
        color: colors.textPrimary,
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
        fontWeight: '600',
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },
    etaTime: {
        ...typography.h1,
        fontWeight: '700',
        color: colors.primary,
    },
    etaSubtext: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    speedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
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
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        ...typography.h2,
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

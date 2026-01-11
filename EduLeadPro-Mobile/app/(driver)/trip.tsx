/**
 * Driver Trip Screen - Premium Design with Ola Maps
 * Active trip management with real-time location tracking
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Alert,
    StatusBar,
    BackHandler,
    Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter, useLocalSearchParams } from 'expo-router';

import OlaMapView from '../../src/components/maps/OlaMapView';
import { api } from '../../services/api';
import { getDirections, LatLng } from '../../src/utils/olaApi';
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing, typography, shadows } from '../../src/theme';
import PremiumCard from '../../src/components/ui/PremiumCard';
import PremiumButton from '../../src/components/ui/PremiumButton';

const { width, height } = Dimensions.get('window');

interface Student {
    id: number;
    name: string;
    status: 'pending' | 'boarded' | 'dropped';
    pickupStop?: string;
}

// ... imports
import { useLanguageStore } from '../../src/store/languageStore';

export default function DriverTripScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { t } = useLanguageStore(); // Use Store

    const params = useLocalSearchParams<{
        tripId: string;
        routeId: string;
        routeName: string;
    }>();

    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [routeStops, setRouteStops] = useState<any[]>([]);
    const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
    const [activeDestination, setActiveDestination] = useState<LatLng | null>(null);
    const [tripStatus, setTripStatus] = useState<'live' | 'paused' | 'ended'>('live');
    const [loading, setLoading] = useState(false);
    const locationSubscription = useRef<any>(null);
    const updateInterval = useRef<any>(null);

    useEffect(() => {
        startLocationTracking();
        loadStudents();

        return () => {
            stopLocationTracking();
        };
    }, []);

    useEffect(() => {
        if (currentLocation && (students.length > 0 || routeStops.length > 0)) {
            updateRoutePolyline();
        }
    }, [currentLocation, students, routeStops]);

    const updateRoutePolyline = async () => {
        if (!currentLocation) return;

        let destination: LatLng | null = null;

        // Find the next pending stop
        // 1. Check if there are any students who are still 'pending'
        const pendingStudents = students.filter(s => s.status === 'pending');

        if (pendingStudents.length > 0) {
            // Find the stop of the first pending student in the route order
            // If we have routeStops, we can be more precise.
            if (routeStops.length > 0) {
                // Find first stop that matches a pending student's stop
                const pendingStopNames = new Set(pendingStudents.map(s => s.pickupStop));
                const nextStop = routeStops.find(stop => pendingStopNames.has(stop.stop_name));

                if (nextStop) {
                    destination = {
                        latitude: parseFloat(nextStop.latitude),
                        longitude: parseFloat(nextStop.longitude)
                    };
                }
            }

            // Fallback: If we couldn't match a specific stop name, but there are pending students,
            // default to the FIRST stop in the route list provided it's valid.
            if (!destination && routeStops.length > 0) {
                const firstStop = routeStops[0];
                destination = {
                    latitude: parseFloat(firstStop.latitude),
                    longitude: parseFloat(firstStop.longitude)
                };
            }
        } else {
            // All picked up, destination is school (last stop)
            if (routeStops.length > 0) {
                const schoolStop = routeStops[routeStops.length - 1];
                destination = {
                    latitude: parseFloat(schoolStop.latitude),
                    longitude: parseFloat(schoolStop.longitude)
                };
            }
        }

        if (destination) {
            setActiveDestination(destination);
            const coords = await getDirections(
                { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
                destination
            );
            if (coords.length > 0) {
                setRouteCoords(coords);
            } else {
                // Fallback: Draw straight line if API fails
                setRouteCoords([
                    { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
                    destination
                ]);
            }
        } else {
            setRouteCoords([]);
        }
    };

    const startLocationTracking = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Location access is needed for trip tracking.');
                return;
            }

            // Get initial location
            const location = await Location.getCurrentPositionAsync({});
            setCurrentLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            // Watch position
            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000,
                    distanceInterval: 10,
                },
                (location) => {
                    const newLoc = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        speed: location.coords.speed || 0,
                        heading: location.coords.heading || 0,
                    };
                    setCurrentLocation(newLoc);

                    // Send location to server
                    if (params.tripId) {
                        sendLocationUpdate(newLoc);
                    }
                }
            );

            // Also update on interval for reliability
            updateInterval.current = setInterval(() => {
                if (currentLocation && params.tripId) {
                    sendLocationUpdate(currentLocation);
                }
            }, 10000);
        } catch (error) {
            console.error('Location tracking error:', error);
        }
    };

    const stopLocationTracking = () => {
        if (locationSubscription.current) {
            locationSubscription.current.remove();
        }
        if (updateInterval.current) {
            clearInterval(updateInterval.current);
        }
    };

    const sendLocationUpdate = async (location: any) => {
        try {
            await api.updateBusLocation(
                parseInt(params.routeId!),
                location.latitude,
                location.longitude,
                location.speed || 0,
                location.heading || 0
            );
        } catch (error) {
            console.error('Failed to send location update:', error);
        }
    };

    const loadStudents = async () => {
        try {
            const dashboardData = await api.getDriverDashboard();
            if (dashboardData?.assignedStudents) {
                setStudents(dashboardData.assignedStudents.map((s: any) => ({
                    id: s.id,
                    name: s.name || s.student_name,
                    status: s.status || 'pending',
                    pickupStop: s.pickup_stop || s.stop_name,
                })));
            }
            if (dashboardData?.assignedRoute?.stops) {
                setRouteStops(dashboardData.assignedRoute.stops);
            }
        } catch (error) {
            console.error('Failed to load students:', error);
        }
    };

    const updateStudentStatus = async (studentId: number, status: 'boarded' | 'dropped') => {
        try {
            await api.updateStudentTripStatus(
                studentId,
                parseInt(params.tripId!),
                parseInt(params.routeId!),
                status
            );
            setStudents(prev => prev.map(s =>
                s.id === studentId ? { ...s, status } : s
            ));
        } catch (error) {
            console.error('Failed to update student status:', error);
            Alert.alert('Error', 'Failed to update student status');
        }
    };

    const handleEndTrip = async () => {
        Alert.alert(
            t('end_trip'),
            t('confirm_end_trip'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('end_trip'),
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            if (params.tripId) {
                                await api.endTrip(parseInt(params.tripId));
                            }
                            stopLocationTracking();
                            router.back();
                        } catch (error) {
                            console.error('Failed to end trip:', error);
                            Alert.alert('Error', 'Failed to end trip');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Map markers
    // Map markers
    const mapMarkers = [
        // Driver Location
        ...(currentLocation ? [{
            id: 'driver-loc',
            coordinate: { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
            title: "Your Location",
            icon: 'bus' as const
        }] : []),

        // Route Stops
        ...routeStops.map((stop: any, index: number) => ({
            id: `stop-${index}`,
            coordinate: { latitude: parseFloat(stop.latitude), longitude: parseFloat(stop.longitude) },
            title: stop.stop_name || `Stop ${index + 1}`,
            icon: 'stop' as const,
            pinColor: '#6366F1' // Indigo-500 for stops
        }))
    ];

    const boardedCount = students.filter(s => s.status === 'boarded').length;
    const droppedCount = students.filter(s => s.status === 'dropped').length;
    // const totalCount = students.length;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

            {/* Header */}
            <LinearGradient
                colors={[colors.primaryDark, '#1E293B']}
                style={styles.header}
            >
                <View style={[styles.headerContent, { paddingTop: 20 }]}>
                    <TouchableOpacity
                        style={styles.appIconContainer}
                        onPress={() => {
                            if (activeDestination) {
                                const url = `https://www.google.com/maps/dir/?api=1&destination=${activeDestination.latitude},${activeDestination.longitude}&travelmode=driving`;
                                Linking.openURL(url);
                            } else {
                                Alert.alert(t('info'), t('no_destination_set') || "No active destination found.");
                            }
                        }}
                    >
                        <Feather name="navigation" size={24} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={styles.routeName}>{params.routeName || t('trip_in_progress')}</Text>
                        <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>{t('live_tracking')}</Text>
                        </View>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            {/* Map */}
            <View style={styles.mapContainer}>
                <OlaMapView
                    center={currentLocation ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude } : { latitude: 20.5937, longitude: 78.9629 }}
                    zoom={15}
                    markers={mapMarkers}
                    route={routeCoords}
                    showUserLocation={false}
                    style={styles.map}
                />
            </View>

            {/* Students List */}
            <View style={styles.studentsContainer}>
                <View style={styles.listHeader}>
                    <Text style={styles.sectionTitle}>{t('student_pickup_drop')}</Text>
                </View>

                <ScrollView
                    style={styles.studentsList}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {students.map((student) => {
                        const isBoarded = student.status === 'boarded';
                        const isDropped = student.status === 'dropped';
                        const isPending = student.status === 'pending';

                        return (
                            <View key={student.id} style={[
                                styles.studentCard,
                                isDropped && styles.studentCardDropped
                            ]}>
                                <View style={styles.studentInfo}>
                                    <View style={[
                                        styles.avatarCircle,
                                        isBoarded ? { backgroundColor: '#DCFCE7' } :
                                            isDropped ? { backgroundColor: '#F3F4F6' } :
                                                { backgroundColor: '#E0F2FE' }
                                    ]}>
                                        <Text style={[
                                            styles.avatarText,
                                            isBoarded ? { color: '#16A34A' } :
                                                isDropped ? { color: '#9CA3AF' } :
                                                    { color: '#0284C7' }
                                        ]}>
                                            {student.name.substring(0, 1)}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[
                                            styles.studentName,
                                            isDropped && { color: colors.textSecondary, textDecorationLine: 'line-through' }
                                        ]}>
                                            {student.name}
                                        </Text>
                                        <Text style={styles.stopName}>
                                            {isDropped ? t('done') : student.pickupStop || 'Assigned Stop'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Progressive Action Button */}
                                <View style={styles.actionContainer}>
                                    {isPending && (
                                        <TouchableOpacity
                                            style={styles.boardBtn}
                                            onPress={() => updateStudentStatus(student.id, 'boarded')}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={styles.btnText}>{t('board')}</Text>
                                        </TouchableOpacity>
                                    )}

                                    {isBoarded && (
                                        <TouchableOpacity
                                            style={styles.dropBtn}
                                            onPress={() => updateStudentStatus(student.id, 'dropped')}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={styles.btnDropText}>{t('drop')}</Text>
                                        </TouchableOpacity>
                                    )}

                                    {isDropped && (
                                        <View style={styles.droppedBadge}>
                                            <Feather name="check" size={16} color={colors.textSecondary} />
                                            <Text style={styles.droppedText}>{t('done')}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Floating End Trip Button */}
            <View style={styles.floatingFooter}>
                <TouchableOpacity
                    style={styles.endTripBtn}
                    onPress={handleEndTrip}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#EF4444', '#DC2626']}
                        style={styles.endTripGradient}
                    >
                        <Feather name="stop-circle" size={24} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.endTripText}>{t('end_trip')}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ... styles unchanged
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingTop: 40,
        paddingBottom: 16,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        zIndex: 10,
        ...shadows.md,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    appIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        alignItems: 'center',
    },
    routeName: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
        letterSpacing: 0.5,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        marginTop: 4,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.5)',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
        marginRight: 6,
    },
    liveText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FECACA',
        letterSpacing: 0.5,
    },
    mapContainer: {
        height: height * 0.28,
        marginHorizontal: spacing.md,
        marginTop: 16,
        borderRadius: 20,
        overflow: 'hidden',
        ...shadows.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    map: {
        flex: 1,
    },
    studentsContainer: {
        flex: 1,
        marginTop: spacing.md,
    },
    listHeader: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    studentsList: {
        flex: 1,
        paddingHorizontal: spacing.md,
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        ...shadows.sm,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    studentCardDropped: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
        opacity: 0.8,
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
    },
    studentName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    stopName: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    actionContainer: {
        width: 100,
        alignItems: 'flex-end',
    },
    boardBtn: {
        backgroundColor: '#22C55E',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        ...shadows.sm,
    },
    btnText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 13,
        letterSpacing: 1,
    },
    dropBtn: {
        backgroundColor: '#FEF3C7',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    btnDropText: {
        color: '#D97706',
        fontWeight: '800',
        fontSize: 13,
        letterSpacing: 1,
    },
    droppedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    droppedText: {
        fontWeight: '600',
        color: colors.textSecondary,
        marginLeft: 4,
    },
    floatingFooter: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        ...shadows.lg,
    },
    endTripBtn: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    endTripGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
    },
    endTripText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
    },
});

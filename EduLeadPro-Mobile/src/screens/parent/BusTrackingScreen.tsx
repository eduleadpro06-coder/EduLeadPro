/**
 * Bus Tracking Screen (Parent View)
 * Shows real-time bus location on map
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LeafletMap from '../../components/LeafletMap';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import webSocketService from '../../services/websocket/socket.service';
import busAPI from '../../services/api/bus.api';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export default function BusTrackingScreen() {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [busLocation, setBusLocation] = useState<any>(null);
    const [pickupStop, setPickupStop] = useState<any>(null);
    const [routeId, setRouteId] = useState<string | null>(null);
    const [eta, setEta] = useState<string | null>(null);
    const [travelTime, setTravelTime] = useState<number | null>(null); // in minutes

    useEffect(() => {
        initializeTracking();

        return () => {
            // Cleanup on unmount
            if (routeId) {
                webSocketService.unsubscribeFromBus(routeId);
            }
        };
    }, []);

    const calculateETA = async (busLat: number, busLng: number, stopLat: number, stopLng: number) => {
        try {
            const OLA_API_KEY = 'nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0';
            const url = `https://api.olakrutrim.com/routing/v1/directions?origin=${busLat},${busLng}&destination=${stopLat},${stopLng}&mode=driving&api_key=${OLA_API_KEY}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (result.routes && result.routes.length > 0) {
                const durationSeconds = result.routes[0].legs[0].duration;
                const durationMinutes = Math.round(durationSeconds / 60);

                setTravelTime(durationMinutes);

                // Calculate ETA time string
                const etaTime = new Date(Date.now() + durationSeconds * 1000);
                setEta(etaTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
        } catch (error) {
            console.log('Error calculating ETA:', error);
        }
    };

    const initializeTracking = async () => {
        try {
            // Get first child's bus assignment
            if (user?.children && user.children.length > 0) {
                const firstChild = user.children[0];

                try {
                    // Fetch fresh assignment from server
                    const data = await busAPI.getStudentBusAssignment(firstChild.id);
                    console.log('[BusTracking] Assignment Data:', JSON.stringify(data, null, 2));

                    if (data && data.assignment) {
                        const rId = data.assignment.routeId;
                        setRouteId(String(rId));

                        // Set pickup stop location for static map
                        if (data.assignment.pickupStop) {
                            const stop = {
                                latitude: parseFloat(data.assignment.pickupStop.latitude),
                                longitude: parseFloat(data.assignment.pickupStop.longitude),
                                name: data.assignment.pickupStop.name || 'Pickup Stop'
                            };
                            console.log('[BusTracking] Pickup Stop Set:', stop);
                            setPickupStop(stop);
                        }

                        // Connect WebSocket
                        webSocketService.connect();

                        // Subscribe to bus updates
                        webSocketService.subscribeToBus(String(rId), user.id, (locationData) => {
                            console.log('Bus location update:', locationData);
                            setBusLocation({
                                latitude: locationData.latitude,
                                longitude: locationData.longitude,
                                speed: locationData.speed,
                                heading: locationData.heading,
                            });

                            // Trigger ETA calculation when bus location updates
                            if (data.assignment.pickupStop) {
                                calculateETA(
                                    locationData.latitude,
                                    locationData.longitude,
                                    parseFloat(data.assignment.pickupStop.latitude),
                                    parseFloat(data.assignment.pickupStop.longitude)
                                );
                            }
                        });

                        setLoading(false);
                    } else {
                        setLoading(false);
                    }
                } catch (err) {
                    console.log('No bus assignment found or error', err);
                    setLoading(false);
                }
            } else {
                setLoading(false);
                Alert.alert('No Children', 'No children assigned to your account');
            }
        } catch (error) {
            console.error('Error initializing tracking:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading bus tracking...</Text>
            </View>
        );
    }

    // Prepare markers for the map
    const mapMarkers: {
        latitude: number;
        longitude: number;
        title: string;
        description: string;
        icon: 'bus' | 'school' | 'stop';
    }[] = [];
    const mapCenter = pickupStop || { latitude: 20.5937, longitude: 78.9629 }; // Default India center

    // Add pickup stop marker
    if (pickupStop) {
        mapMarkers.push({
            latitude: pickupStop.latitude,
            longitude: pickupStop.longitude,
            title: pickupStop.name,
            description: "Your pickup location",
            icon: 'stop'
        });
    }

    // Add bus marker if tracking is active
    if (busLocation) {
        mapMarkers.push({
            latitude: busLocation.latitude,
            longitude: busLocation.longitude,
            title: "School Bus",
            description: `Speed: ${busLocation.speed || 0} km/h`,
            icon: 'bus'
        });
    }

    console.log('[BusTracking] Map Markers:', JSON.stringify(mapMarkers, null, 2));
    console.log('[BusTracking] Map Center:', {
        lat: busLocation?.latitude || pickupStop?.latitude,
        lng: busLocation?.longitude || pickupStop?.longitude
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹ Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bus Tracking</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Map - Only show if we have pickup location or active bus */}
            {(pickupStop || busLocation) ? (
                <LeafletMap
                    latitude={busLocation?.latitude || pickupStop?.latitude}
                    longitude={busLocation?.longitude || pickupStop?.longitude}
                    markers={mapMarkers}
                    height={500}
                    zoom={busLocation ? 15 : 14}
                />
            ) : (
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>🚌</Text>
                    <Text style={styles.noDataTitle}>No Bus Assignment</Text>
                    <Text style={styles.noDataSubtitle}>
                        No bus route assigned to your child
                    </Text>
                </View>
            )}

            {/* Info Card */}
            <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text style={styles.infoValue}>
                        {busLocation ? '🟢 Live Tracking' : pickupStop ? '⚪ Waiting for Bus' : '⚪ No Route Assigned'}
                    </Text>
                </View>
                {busLocation && (
                    <>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Speed:</Text>
                            <Text style={styles.infoValue}>{busLocation.speed || 0} km/h</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>ETA:</Text>
                            <Text style={styles.infoValue}>
                                {travelTime ? `${travelTime} mins (${eta})` : 'Calculating...'}
                            </Text>
                        </View>
                    </>
                )}
                {!busLocation && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Pickup Stop:</Text>
                        <Text style={styles.infoValue}>{pickupStop.name}</Text>
                    </View>
                )}
            </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: typography.fontSize.md,
        color: colors.text.secondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: colors.white,
    },
    backButton: {
        padding: spacing.sm,
    },
    backButtonText: {
        fontSize: typography.fontSize.xl,
        color: colors.primary,
        fontWeight: typography.fontWeight.semibold,
    },
    headerTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    placeholder: {
        width: 50,
    },
    map: {
        flex: 1,
    },
    busMarker: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.full,
        padding: spacing.sm,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    busMarkerText: {
        fontSize: 24,
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    noDataText: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    noDataTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    noDataSubtitle: {
        fontSize: typography.fontSize.md,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    infoCard: {
        backgroundColor: colors.white,
        margin: spacing.md,
        padding: spacing.md,
        borderRadius: borderRadius.md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
    },
    infoLabel: {
        fontSize: typography.fontSize.md,
        color: colors.text.secondary,
    },
    infoValue: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
    },
});

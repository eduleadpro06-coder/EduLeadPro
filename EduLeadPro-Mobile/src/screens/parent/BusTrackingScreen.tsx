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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
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
    const [routeId, setRouteId] = useState<string | null>(null);

    useEffect(() => {
        initializeTracking();

        return () => {
            // Cleanup on unmount
            if (routeId) {
                webSocketService.unsubscribeFromBus(routeId);
            }
        };
    }, []);

    const initializeTracking = async () => {
        try {
            // Get first child's bus assignment
            if (user?.children && user.children.length > 0) {
                const firstChild = user.children[0];
                if (firstChild.student_bus_assignments && firstChild.student_bus_assignments.length > 0) {
                    const assignment = firstChild.student_bus_assignments[0];
                    const routeId = assignment.route_id;

                    setRouteId(routeId);

                    // Connect WebSocket
                    webSocketService.connect();

                    // Subscribe to bus updates
                    webSocketService.subscribeToBus(routeId, user.id, (data) => {
                        console.log('Bus location update:', data);
                        setBusLocation({
                            latitude: data.latitude,
                            longitude: data.longitude,
                            speed: data.speed,
                            heading: data.heading,
                        });
                    });

                    setLoading(false);
                } else {
                    setLoading(false);
                    Alert.alert('No Bus Assigned', 'No bus route assigned to your child');
                }
            } else {
                setLoading(false);
                Alert.alert('No Children', 'No children assigned to your account');
            }
        } catch (error) {
            console.error('Error initializing tracking:', error);
            setLoading(false);
            Alert.alert('Error', 'Failed to initialize bus tracking');
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

            {/* Map */}
            {busLocation ? (
                <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={{
                        latitude: busLocation.latitude,
                        longitude: busLocation.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                    }}
                    showsUserLocation
                    showsMyLocationButton
                >
                    <Marker
                        coordinate={{
                            latitude: busLocation.latitude,
                            longitude: busLocation.longitude,
                        }}
                        title="School Bus"
                        description={`Speed: ${busLocation.speed || 0} km/h`}
                    >
                        <View style={styles.busMarker}>
                            <Text style={styles.busMarkerText}>🚌</Text>
                        </View>
                    </Marker>
                </MapView>
            ) : (
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>🚌</Text>
                    <Text style={styles.noDataTitle}>No Live Tracking</Text>
                    <Text style={styles.noDataSubtitle}>
                        Bus tracking will appear here when the driver starts the trip
                    </Text>
                </View>
            )}

            {/* Info Card */}
            {busLocation && (
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Status:</Text>
                        <Text style={styles.infoValue}>🟢 Active</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Speed:</Text>
                        <Text style={styles.infoValue}>{busLocation.speed || 0} km/h</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>ETA:</Text>
                        <Text style={styles.infoValue}>Calculating...</Text>
                    </View>
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

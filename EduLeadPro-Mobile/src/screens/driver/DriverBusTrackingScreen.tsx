import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../../theme';
import { locationTrackingService } from '../../services/location.service';
import { useAuthStore } from '../../store/authStore';

export default function DriverBusTrackingScreen({ navigation }: any) {
    const [isTracking, setIsTracking] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastLocation, setLastLocation] = useState<any>(null);
    const [routeInfo, setRouteInfo] = useState<any>(null);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        // Load driver's assigned route
        loadRouteInfo();

        // Check if already tracking
        const status = locationTrackingService.getTrackingStatus();
        setIsTracking(status.isTracking);
        setLastLocation(status.lastLocation);

        // Update location every second
        const interval = setInterval(() => {
            const currentStatus = locationTrackingService.getTrackingStatus();
            setLastLocation(currentStatus.lastLocation);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const loadRouteInfo = async () => {
        try {
            // TODO: Fetch driver's assigned route from API
            // For now, using mock data
            setRouteInfo({
                id: 1,
                routeName: 'Route-1',
                vehicleNumber: 'MH46BZ0101',
                totalStudents: 12,
            });
        } catch (error) {
            console.error('Error loading route info:', error);
        }
    };

    const handleStartTracking = async () => {
        if (!routeInfo) {
            Alert.alert('Error', 'No route assigned to you. Please contact admin.');
            return;
        }

        setLoading(true);
        const success = await locationTrackingService.startTracking(routeInfo.id);
        setLoading(false);

        if (success) {
            setIsTracking(true);
            Alert.alert('Success', 'Bus tracking started successfully!');
        }
    };

    const handleStopTracking = async () => {
        Alert.alert(
            'Stop Tracking',
            'Are you sure you want to stop tracking? Parents will not be able to see the bus location.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Stop',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        await locationTrackingService.stopTracking();
                        setLoading(false);
                        setIsTracking(false);
                        Alert.alert('Stopped', 'Bus tracking has been stopped.');
                    },
                },
            ]
        );
    };

    const formatSpeed = (speed: number | null | undefined): string => {
        if (!speed) return '0';
        return Math.round(speed).toString();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bus Tracking</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Route Info Card */}
                {routeInfo && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Route Information</Text>
                        <View style={styles.infoRow}>
                            <Feather name="truck" size={20} color={colors.textSecondary} />
                            <Text style={styles.infoText}>{routeInfo.vehicleNumber}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Feather name="map-pin" size={20} color={colors.textSecondary} />
                            <Text style={styles.infoText}>{routeInfo.routeName}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Feather name="users" size={20} color={colors.textSecondary} />
                            <Text style={styles.infoText}>{routeInfo.totalStudents} Students</Text>
                        </View>
                    </View>
                )}

                {/* Tracking Status Card */}
                <View style={styles.card}>
                    <View style={styles.statusHeader}>
                        <Text style={styles.cardTitle}>Tracking Status</Text>
                        {isTracking && (
                            <View style={styles.liveIndicator}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.liveText}>LIVE</Text>
                            </View>
                        )}
                    </View>

                    {isTracking ? (
                        <>
                            <Text style={styles.statusText}>
                                Parents can now see the bus location in real-time
                            </Text>

                            {lastLocation && (
                                <View style={styles.locationInfo}>
                                    <View style={styles.locationRow}>
                                        <Text style={styles.locationLabel}>Speed:</Text>
                                        <Text style={styles.locationValue}>
                                            {formatSpeed(lastLocation.coords.speed)} km/h
                                        </Text>
                                    </View>
                                    <View style={styles.locationRow}>
                                        <Text style={styles.locationLabel}>Accuracy:</Text>
                                        <Text style={styles.locationValue}>
                                            ±{Math.round(lastLocation.coords.accuracy || 0)}m
                                        </Text>
                                    </View>
                                    <View style={styles.locationRow}>
                                        <Text style={styles.locationLabel}>Last Updated:</Text>
                                        <Text style={styles.locationValue}>
                                            {new Date(lastLocation.timestamp).toLocaleTimeString()}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.button, styles.stopButton]}
                                onPress={handleStopTracking}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Feather name="stop-circle" size={20} color="white" />
                                        <Text style={styles.buttonText}>Stop Tracking</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.statusText}>
                                Tracking is currently inactive. Start tracking to let parents see the bus
                                location.
                            </Text>

                            <TouchableOpacity
                                style={[styles.button, styles.startButton]}
                                onPress={handleStartTracking}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Feather name="play-circle" size={20} color="white" />
                                        <Text style={styles.buttonText}>Start Tracking</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Info Card */}
                <View style={[styles.card, styles.infoCard]}>
                    <Feather name="info" size={20} color={colors.primary} />
                    <Text style={styles.infoCardText}>
                        Location updates are sent every 30 seconds. Make sure your phone has good GPS signal
                        for accurate tracking.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
    },
    backButton: {
        padding: spacing.sm,
    },
    headerTitle: {
        ...typography.h2,
        color: 'white',
        fontWeight: '700',
    },
    content: {
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
    cardTitle: {
        ...typography.h3,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    infoText: {
        ...typography.body,
        color: colors.textPrimary,
        marginLeft: spacing.md,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pulseDot: {
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
    },
    statusText: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
        lineHeight: 22,
    },
    locationInfo: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    locationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    locationLabel: {
        ...typography.body,
        color: colors.textSecondary,
    },
    locationValue: {
        ...typography.body,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: 12,
        gap: spacing.sm,
    },
    startButton: {
        backgroundColor: colors.primary,
    },
    stopButton: {
        backgroundColor: '#EF4444',
    },
    buttonText: {
        ...typography.body,
        color: 'white',
        fontWeight: '700',
    },
    infoCard: {
        flexDirection: 'row',
        gap: spacing.md,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: colors.primary + '20',
    },
    infoCardText: {
        ...typography.body,
        color: colors.textSecondary,
        flex: 1,
        lineHeight: 20,
    },
});

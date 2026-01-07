import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from './services/api';

const colors = {
    primary: '#2D7A5F',
    primaryDark: '#1F5A45',
    white: '#FFFFFF',
    background: '#F0FDF4',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    danger: '#EF4444',
    cardBg: '#FFFFFF',
};

interface DriverHomeScreenProps {
    user: any;
    onLogout: () => void;
}

export default function DriverHomeScreen({ user, onLogout }: DriverHomeScreenProps) {
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [trackingActive, setTrackingActive] = useState(false);
    const [locationInterval, setLocationInterval] = useState<any>(null);

    useEffect(() => {
        fetchDashboard();
        return () => {
            if (locationInterval) {
                clearInterval(locationInterval);
            }
        };
    }, []);

    const fetchDashboard = async () => {
        try {
            const data = await api.getDriverDashboard(user.staffId);
            setDashboardData(data);
        } catch (error) {
            console.error('Failed to fetch driver dashboard:', error);
            Alert.alert('Error', 'Failed to load dashboard data');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchDashboard();
    };

    const toggleTracking = () => {
        if (!trackingActive) {
            startLocationTracking();
        } else {
            stopLocationTracking();
        }
    };

    const startLocationTracking = () => {
        if (!dashboardData?.route) {
            Alert.alert('Error', 'No route assigned');
            return;
        }

        setTrackingActive(true);
        Alert.alert('Tracking Started', 'Your location is being shared with parents');

        // Simulate location updates every 30 seconds
        // In a real app, you'd use react-native-geolocation or expo-location
        const interval = setInterval(() => {
            const mockLat = 19.0760 + (Math.random() - 0.5) * 0.01;
            const mockLng = 72.8777 + (Math.random() - 0.5) * 0.01;

            api.updateBusLocation(dashboardData.route.id, mockLat, mockLng, 30, 90)
                .then(() => console.log('Location updated'))
                .catch(() => console.error('Failed to update location'));
        }, 30000);

        setLocationInterval(interval);
    };

    const stopLocationTracking = () => {
        setTrackingActive(false);
        if (locationInterval) {
            clearInterval(locationInterval);
            setLocationInterval(null);
        }
        Alert.alert('Tracking Stopped', 'Location sharing has been disabled');
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const { driver, route, assignedStudents } = dashboardData || {};

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello, {user.name}!</Text>
                    <Text style={styles.role}>Driver Dashboard</Text>
                </View>
                <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
                    <Feather name="log-out" size={22} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
            >
                {/* Live Tracking Toggle */}
                <View style={styles.trackingCard}>
                    <View style={styles.trackingHeader}>
                        <Feather
                            name={trackingActive ? "radio" : "navigation"}
                            size={32}
                            color={trackingActive ? colors.success : colors.textSecondary}
                        />
                        <Text style={styles.trackingTitle}>
                            {trackingActive ? 'Tracking Active' : 'Start Tracking'}
                        </Text>
                    </View>
                    <Text style={styles.trackingDesc}>
                        {trackingActive
                            ? 'Parents can see your live location'
                            : 'Enable GPS tracking to share your location with parents'}
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.trackingButton,
                            { backgroundColor: trackingActive ? colors.danger : colors.success }
                        ]}
                        onPress={toggleTracking}
                    >
                        <Text style={styles.trackingButtonText}>
                            {trackingActive ? 'Stop Tracking' : 'Start Tracking'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Route Info */}
                {route ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>My Route</Text>
                        <View style={styles.routeCard}>
                            <View style={styles.routeHeader}>
                                <Feather name="map-pin" size={24} color={colors.primary} />
                                <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={styles.routeName}>{route.route_name}</Text>
                                    <Text style={styles.routeNumber}>Route #{route.route_number}</Text>
                                </View>
                            </View>
                            <View style={styles.routeTimings}>
                                <View style={styles.timingItem}>
                                    <Feather name="sunrise" size={16} color={colors.textSecondary} />
                                    <Text style={styles.timingText}>Start: {route.start_time || 'N/A'}</Text>
                                </View>
                                <View style={styles.timingItem}>
                                    <Feather name="sunset" size={16} color={colors.textSecondary} />
                                    <Text style={styles.timingText}>End: {route.end_time || 'N/A'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.section}>
                        <Text style={styles.emptyText}>No route assigned</Text>
                    </View>
                )}

                {/* Assigned Students */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Assigned Students ({assignedStudents?.length || 0})
                    </Text>
                    {assignedStudents && assignedStudents.length > 0 ? (
                        assignedStudents.map((student: any) => (
                            <View key={student.id} style={styles.studentCard}>
                                <View style={styles.studentAvatar}>
                                    <Feather name="user" size={20} color={colors.primary} />
                                </View>
                                <View style={styles.studentInfo}>
                                    <Text style={styles.studentName}>{student.name}</Text>
                                    <Text style={styles.studentClass}>{student.class}</Text>
                                    <Text style={styles.studentPhone}>{student.parent_phone}</Text>
                                </View>
                                <TouchableOpacity style={styles.callButton}>
                                    <Feather name="phone" size={20} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No students assigned to this route</Text>
                    )}
                </View>

                <View style={{ height: 80 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.white,
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    greeting: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    role: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    logoutBtn: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    trackingCard: {
        backgroundColor: colors.white,
        margin: 20,
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    trackingHeader: {
        alignItems: 'center',
        marginBottom: 12,
    },
    trackingTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 12,
    },
    trackingDesc: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    trackingButton: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    trackingButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 16,
    },
    routeCard: {
        backgroundColor: colors.white,
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    routeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    routeName: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    routeNumber: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },
    routeTimings: {
        flexDirection: 'row',
        gap: 20,
    },
    timingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timingText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    studentCard: {
        backgroundColor: colors.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
    },
    studentAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    studentInfo: {
        flex: 1,
        marginLeft: 12,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    studentClass: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    studentPhone: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 14,
        padding: 20,
    },
});

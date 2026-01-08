import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Platform,
    StatusBar,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { api } from './services/api';
import DriverTripScreen from './DriverTripScreen';

// Premium Design
import { colors, spacing, typography, shadows, layout } from './src/theme';
import PremiumCard from './src/components/ui/PremiumCard';
import PremiumButton from './src/components/ui/PremiumButton';

const { width } = layout;

interface DriverHomeScreenProps {
    user: any;
    onLogout: () => void;
}

type DriverTabType = 'dashboard' | 'routes' | 'history';

export default function DriverHomeScreen({ user, onLogout }: DriverHomeScreenProps) {
    const [activeTab, setActiveTab] = useState<DriverTabType>('dashboard');
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [activeTrip, setActiveTrip] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Check for active trip on load
    useEffect(() => {
        checkActiveTrip();
    }, []);

    const checkActiveTrip = async () => {
        setLoading(true);
        try {
            const data = await api.getDriverDashboard();
            setDashboardData(data);
            if (data?.activeTrip) setActiveTrip(data.activeTrip);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartTrip = async (routeId: number) => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location access is required for trips.');
                return;
            }

            setLoading(true);
            // Start trip via API
            const response: any = await api.startTrip(routeId);

            if (response.success) {
                // Set local state with data from API
                const session = response.data?.session || response.session;
                setActiveTrip({
                    id: session.id,
                    routeId,
                    status: 'live',
                    routeName: dashboardData?.assignedRoute?.route_name || 'Active Route',
                    students: dashboardData?.assignedStudents || []
                });
            } else {
                throw new Error(response.error || 'Failed to start trip');
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.message || 'Could not start trip. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEndTrip = async () => {
        try {
            if (activeTrip?.id) {
                await api.endTrip(activeTrip.id);
            }
            setActiveTrip(null);
            checkActiveTrip(); // Refresh dashboard
        } catch (error) {
            console.error(error);
            setActiveTrip(null);
        }
    };

    if (activeTrip && activeTab === 'dashboard') {
        return (
            <DriverTripScreen
                route={{
                    id: activeTrip.routeId.toString(),
                    name: activeTrip.routeName
                }}
                students={activeTrip.students}
                onTripEnd={handleEndTrip}
            />
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

            {/* Header */}
            <View style={styles.header}>
                <LinearGradient
                    colors={[colors.primaryDark, colors.primary]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                >
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.roleLabel}>DRIVER PORTAL</Text>
                            <Text style={styles.name}>{user.name}</Text>
                        </View>
                        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
                            <Feather name="log-out" size={20} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {activeTab === 'dashboard' && (
                    <>
                        {/* Status Card */}
                        <PremiumCard style={{ marginBottom: spacing.lg, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface }}>
                            <View style={[styles.statusIcon, { backgroundColor: activeTrip ? colors.successBg : colors.surfaceHighlight }]}>
                                <Feather name={activeTrip ? "navigation" : "map"} size={24} color={activeTrip ? colors.success : colors.textSecondary} />
                            </View>
                            <View>
                                <Text style={styles.statusTitle}>{activeTrip ? 'Trip in Progress' : 'Ready for Trip'}</Text>
                                <Text style={styles.statusSub}>{activeTrip ? 'Tracking is active' : 'Select a route to start'}</Text>
                            </View>
                        </PremiumCard>

                        {/* Today's Routes */}
                        <Text style={styles.sectionTitle}>Assigned Routes</Text>

                        {loading ? (
                            <ActivityIndicator color={colors.primary} />
                        ) : (
                            <View>
                                {dashboardData?.assignedRoute ? (
                                    <PremiumCard style={styles.routeCard}>
                                        <View style={styles.routeHeader}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.routeTitle}>{dashboardData.assignedRoute.route_name}</Text>
                                                <View style={styles.busBadge}>
                                                    <Feather name="truck" size={12} color={colors.primary} />
                                                    <Text style={styles.busNumber}>{dashboardData.assignedRoute.bus_number}</Text>
                                                </View>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                                                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                                                <Text style={[styles.statusText, { color: colors.success }]}>Active</Text>
                                            </View>
                                        </View>

                                        <View style={styles.divider} />

                                        <View style={styles.routeInfo}>
                                            <View style={styles.infoItem}>
                                                <Feather name="users" size={16} color={colors.textSecondary} />
                                                <Text style={styles.routeDetail}>{dashboardData.assignedStudents?.length || 0} Students</Text>
                                            </View>
                                            <View style={styles.infoSeparator} />
                                            <View style={styles.infoItem}>
                                                <Feather name="phone" size={16} color={colors.textSecondary} />
                                                <Text style={styles.routeDetail}>{dashboardData.assignedRoute.helper_phone || 'No Helper'}</Text>
                                            </View>
                                        </View>

                                        <PremiumButton
                                            title="Start Trip"
                                            icon="play"
                                            onPress={() => handleStartTrip(dashboardData.assignedRoute.id)}
                                            style={{ marginTop: 16 }}
                                        />
                                    </PremiumCard>
                                ) : (
                                    <View style={{ alignItems: 'center', padding: 20 }}>
                                        <Feather name="slash" size={40} color={colors.textTertiary} />
                                        <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: 10 }}>
                                            No routes assigned yet.
                                        </Text>
                                        {/* DEBUG INFO */}
                                        {dashboardData?.debug && (
                                            <Text style={{ marginTop: 20, fontSize: 10, color: colors.textTertiary }}>
                                                Debug: {JSON.stringify(dashboardData.debug, null, 2)}
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}
                    </>
                )}

                {activeTab === 'routes' && (
                    <View>
                        <Text style={styles.sectionTitle}>All Routes</Text>
                        {dashboardData?.assignedRoute ? (
                            <PremiumCard style={styles.routeCard}>
                                <Text style={styles.routeTitle}>{dashboardData.assignedRoute.route_name}</Text>
                                <Text style={styles.statusSub}>Bus: {dashboardData.assignedRoute.bus_number}</Text>
                            </PremiumCard>
                        ) : (
                            <Text style={styles.statusSub}>No routes found.</Text>
                        )}
                    </View>
                )}

                {activeTab === 'history' && (
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                        <Feather name="clock" size={48} color={colors.textTertiary} />
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Trip History</Text>
                        <Text style={styles.statusSub}>History feature coming soon.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomBarContainer}>
                <PremiumCard style={styles.bottomBar} variant="elevated">
                    {['dashboard', 'routes', 'history'].map(tab => {
                        const isActive = activeTab === tab;
                        const icons: any = { dashboard: 'home', routes: 'map', history: 'clock' };
                        return (
                            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab as DriverTabType)} style={styles.tabItem}>
                                <Feather name={icons[tab]} size={24} color={isActive ? colors.accent : colors.textSecondary} />
                                {isActive && <Text style={[styles.tabLabel, { color: colors.accent }]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>}
                            </TouchableOpacity>
                        )
                    })}
                </PremiumCard>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { height: 160, marginBottom: -30, zIndex: 1 },
    headerGradient: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    roleLabel: { ...typography.caption, color: colors.accent, fontWeight: '700', letterSpacing: 1 },
    name: { ...typography.h2, color: colors.textInverted },
    logoutBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },

    content: { flex: 1, paddingTop: 40, paddingHorizontal: spacing.lg, paddingBottom: 100 },

    statusIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    statusTitle: { ...typography.h3, fontSize: 16 },
    statusSub: { ...typography.caption },

    sectionTitle: { ...typography.h3, fontSize: 18, marginBottom: spacing.md, marginTop: spacing.md },

    routeCard: { marginBottom: spacing.md, padding: spacing.md },
    routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    routeTitle: { ...typography.h3, fontSize: 18, color: colors.textPrimary },
    busBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceHighlight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start' },
    busNumber: { ...typography.caption, color: colors.primary, fontWeight: '700', marginLeft: 4 },

    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { ...typography.caption, fontWeight: '700', fontSize: 11, textTransform: 'uppercase' },

    divider: { height: 1, backgroundColor: colors.surfaceHighlight, marginBottom: 16 },

    routeInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    infoItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    infoSeparator: { width: 1, height: 20, backgroundColor: colors.surfaceHighlight, marginHorizontal: 15 },
    routeDetail: { ...typography.body, fontSize: 13, color: colors.textSecondary, marginLeft: 8 },

    bottomBarContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
    bottomBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, borderRadius: 30 },
    tabItem: { flexDirection: 'row', alignItems: 'center', padding: 8 },
    tabLabel: { marginLeft: 8, fontWeight: '700', fontSize: 12 },
});

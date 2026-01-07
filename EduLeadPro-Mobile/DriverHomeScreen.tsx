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
            // Ideally backend endpoint would return active trip status
            const data = await api.getDriverDashboard(user.id || 0); // Assuming API signature
            setDashboardData(data);
            if (data?.activeTrip) setActiveTrip(data.activeTrip);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartTrip = async (routeId: string) => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location access is required for trips.');
                return;
            }
            // Mock Starting trip locally if API not fully ready or for UI demo
            const trip = { id: Date.now(), routeId, status: 'live' };
            setActiveTrip(trip);
            // await api.startTrip(routeId); 
        } catch (error) {
            Alert.alert('Error', 'Could not start trip');
        }
    };

    const handleEndTrip = () => {
        setActiveTrip(null);
        // await api.endTrip(activeTrip.id);
    };

    if (activeTrip && activeTab === 'dashboard') {
        return (
            <DriverTripScreen
                route={{ id: activeTrip.routeId, name: 'Morning Route (Active)' }} // Pass real data
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
                    // Mock Routes if no data
                    <View>
                        <PremiumCard style={styles.routeCard}>
                            <View style={styles.routeHeader}>
                                <Text style={styles.routeTitle}>Morning Pickup - Route A</Text>
                                <Text style={styles.routeTime}>07:30 AM</Text>
                            </View>
                            <View style={styles.routeInfo}>
                                <Feather name="users" size={16} color={colors.textSecondary} />
                                <Text style={styles.routeDetail}>12 Students</Text>
                                <View style={styles.dot} />
                                <Feather name="map-pin" size={16} color={colors.textSecondary} />
                                <Text style={styles.routeDetail}>8 Stops</Text>
                            </View>
                            <PremiumButton
                                title="Start Trip"
                                icon="play"
                                onPress={() => handleStartTrip('1')}
                                style={{ marginTop: 12 }}
                            />
                        </PremiumCard>

                        <PremiumCard style={styles.routeCard}>
                            <View style={styles.routeHeader}>
                                <Text style={styles.routeTitle}>Afternoon Drop - Route A</Text>
                                <Text style={styles.routeTime}>02:30 PM</Text>
                            </View>
                            <View style={styles.routeInfo}>
                                <Feather name="users" size={16} color={colors.textSecondary} />
                                <Text style={styles.routeDetail}>10 Students</Text>
                            </View>
                            <PremiumButton
                                title="Start Trip"
                                icon="play"
                                variant="outline"
                                onPress={() => handleStartTrip('2')}
                                style={{ marginTop: 12 }}
                            />
                        </PremiumCard>
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

    routeCard: { marginBottom: spacing.md },
    routeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    routeTitle: { ...typography.h3, fontSize: 16 },
    routeTime: { ...typography.caption, fontWeight: '700', color: colors.textPrimary },
    routeInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    routeDetail: { ...typography.caption, marginLeft: 4, marginRight: 8 },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textTertiary, marginHorizontal: 4 },

    bottomBarContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
    bottomBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, borderRadius: 30 },
    tabItem: { flexDirection: 'row', alignItems: 'center', padding: 8 },
    tabLabel: { marginLeft: 8, fontWeight: '700', fontSize: 12 },
});

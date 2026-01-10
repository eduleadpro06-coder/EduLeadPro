/**
 * Driver Home Screen - Premium Design with Expo Router
 * Based on premium DriverHomeScreen.tsx with language support
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    StatusBar,
    ActivityIndicator,
    ScrollView,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '../../services/api';
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing, typography, shadows } from '../../src/theme';
import PremiumCard from '../../src/components/ui/PremiumCard';
import PremiumButton from '../../src/components/ui/PremiumButton';

const { width, height } = Dimensions.get('window');

type DriverTabType = 'dashboard' | 'routes' | 'history';

// ... imports
import { useLanguageStore } from '../../src/store/languageStore';

export default function DriverHomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuthStore();
    const { t, language, setLanguage } = useLanguageStore(); // Use Store

    const [activeTab, setActiveTab] = useState<DriverTabType>('dashboard');
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [activeTrip, setActiveTrip] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Use useFocusEffect to re-check trip status every time screen gains focus
    useFocusEffect(
        React.useCallback(() => {
            checkActiveTrip();
        }, [])
    );

    const checkActiveTrip = async () => {
        setLoading(true);
        try {
            const data = await api.getDriverDashboard();
            setDashboardData(data);
            // Also check for active trip from API
            const tripResponse = await api.getActiveTrip();
            if (tripResponse?.activeTrip) {
                setActiveTrip({
                    id: tripResponse.activeTrip.id,
                    routeId: tripResponse.activeTrip.route_id,
                    status: 'live',
                    routeName: tripResponse.activeTrip.bus_routes?.route_name || data?.assignedRoute?.route_name || 'Active Route'
                });
            } else {
                setActiveTrip(null); // Clear if no active trip
            }
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
            const response: any = await api.startTrip(routeId);

            if (response.success) {
                const session = response.data?.session || response.session;
                setActiveTrip({
                    id: session.id,
                    routeId,
                    status: 'live',
                    routeName: dashboardData?.assignedRoute?.route_name || 'Active Route',
                    students: dashboardData?.assignedStudents || []
                });
                router.push({
                    pathname: '/(driver)/trip',
                    params: {
                        tripId: session.id,
                        routeId: routeId.toString(),
                        routeName: dashboardData?.assignedRoute?.route_name || 'Active Route'
                    }
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

    // Language Toggle Component
    const LanguageToggle = () => (
        <View style={styles.langToggleContainer}>
            {(['en', 'hi', 'mr'] as const).map((lang) => (
                <TouchableOpacity
                    key={lang}
                    onPress={() => setLanguage(lang)}
                    style={[
                        styles.langBtn,
                        language === lang && styles.langBtnActive
                    ]}
                >
                    <Text style={[
                        styles.langText,
                        language === lang && styles.langTextActive
                    ]}>
                        {lang.toUpperCase()}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

            <View style={styles.headerContainer}>
                <LinearGradient
                    colors={[colors.primaryDark, '#1E293B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, { paddingTop: insets.top + 20 }]}
                >
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.greeting}>{t('good_morning')},</Text>
                            <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Driver'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <LanguageToggle />
                            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                                <Feather name="log-out" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    <View style={styles.mainActionContainer}>
                        {/* Status Indicator */}
                        <View style={[styles.statusDisplay, activeTrip ? styles.statusActive : styles.statusInactive]}>
                            <View style={[
                                styles.statusIconLarge,
                                { backgroundColor: activeTrip ? '#DCFCE7' : '#F1F5F9' }
                            ]}>
                                {activeTrip ? (
                                    <Feather name="navigation" size={40} color="#16A34A" />
                                ) : (
                                    <MaterialCommunityIcons name="bus" size={40} color={colors.textSecondary} />
                                )}
                            </View>
                            <View style={styles.statusTextContainer}>
                                <Text style={styles.statusLabel}>{t('current_status')}</Text>
                                <Text style={[styles.statusTitleLarge, { color: activeTrip ? '#16A34A' : colors.textPrimary }]}>
                                    {activeTrip ? t('trip_in_progress') : t('ready_to_start')}
                                </Text>
                            </View>
                        </View>

                        {/* Assigned Route Card */}
                        {dashboardData?.assignedRoute ? (
                            <View style={styles.actionCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.routeIconContainer}>
                                        <Feather name="map-pin" size={24} color={colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.label}>{t('assigned_route')}</Text>
                                        <Text style={styles.routeTitleLarge} numberOfLines={2}>
                                            {dashboardData.assignedRoute.route_name}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.busInfoRow}>
                                    <View style={styles.busBadge}>
                                        <Feather name="truck" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                                        <Text style={styles.busNumberLarge}>
                                            {dashboardData.assignedRoute.bus_number}
                                        </Text>
                                    </View>
                                    <View style={styles.studentBadge}>
                                        <Feather name="users" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                                        <Text style={styles.studentCount}>
                                            {dashboardData.assignedStudents?.length || 0} {t('students')}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                {/* Big Button */}
                                {!activeTrip ? (
                                    <TouchableOpacity
                                        style={styles.buttonWrapper}
                                        onPress={() => handleStartTrip(dashboardData.assignedRoute.id)}
                                        activeOpacity={0.9}
                                    >
                                        <LinearGradient
                                            colors={['#22C55E', '#16A34A']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.bigStartButton}
                                        >
                                            <View style={styles.startIconCircle}>
                                                <Feather name="play" size={28} color="#FFFFFF" />
                                            </View>
                                            <Text style={styles.bigButtonText}>{t('start_trip')}</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.buttonWrapper}
                                        onPress={() => router.push({
                                            pathname: '/(driver)/trip',
                                            params: {
                                                tripId: activeTrip.id,
                                                routeId: activeTrip.routeId.toString(),
                                                routeName: activeTrip.routeName
                                            }
                                        })}
                                        activeOpacity={0.9}
                                    >
                                        <LinearGradient
                                            colors={['#DCFCE7', '#BBF7D0']}
                                            style={styles.bigResumeButton}
                                        >
                                            <Text style={styles.resumeButtonText}>{t('resume_trip')}</Text>
                                            <View style={styles.resumeIconCircle}>
                                                <Feather name="arrow-right" size={24} color="#15803D" />
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconBg}>
                                    <Feather name="slash" size={40} color={colors.textTertiary} />
                                </View>
                                <Text style={styles.emptyText}>{t('no_route')}</Text>
                                <Text style={styles.emptySubText}>{t('contact_admin')}</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // ... existing styles ...
    langToggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: 4,
        marginRight: 12,
    },
    langBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    langBtnActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    langText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        fontWeight: '700',
    },
    langTextActive: {
        color: '#FFFFFF',
    },
    // ... rest of styles
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerContainer: {
        backgroundColor: colors.primaryDark,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        ...shadows.md,
        zIndex: 10,
    },
    header: {
        paddingBottom: 40,
        paddingHorizontal: spacing.xl,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 14,
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
        marginTop: 10,
    },
    userName: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    logoutBtn: {
        width: 38,
        height: 38,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        marginTop: 20,
    },
    mainActionContainer: {
        flex: 1,
        alignItems: 'center',
    },
    statusDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 24,
        ...shadows.md,
        width: '100%',
        borderWidth: 1,
    },
    statusActive: {
        borderColor: '#86EFAC',
    },
    statusInactive: {
        borderColor: '#E2E8F0',
    },
    statusIconLarge: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    statusTextContainer: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textTertiary,
        marginBottom: 4,
    },
    statusTitleLarge: {
        fontSize: 20,
        fontWeight: '800',
    },
    actionCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 24,
        ...shadows.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    routeIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    routeTitleLarge: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.primary,
        lineHeight: 30,
    },
    busInfoRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 24,
    },
    busBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginRight: 12,
    },
    studentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    busNumberLarge: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
    },
    studentCount: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginBottom: 24,
    },
    buttonWrapper: {
        ...shadows.lg,
        shadowColor: '#16A34A',
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    bigStartButton: {
        width: '100%',
        height: 72,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    startIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    bigButtonText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    bigResumeButton: {
        width: '100%',
        height: 72,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#86EFAC',
    },
    resumeButtonText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#15803D',
        marginRight: 16,
        letterSpacing: 0.5,
    },
    resumeIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        height: 320,
        ...shadows.md,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.textSecondary,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 15,
        color: colors.textTertiary,
        textAlign: 'center',
    },
});

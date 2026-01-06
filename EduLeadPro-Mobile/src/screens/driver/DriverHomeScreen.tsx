/**
 * Driver Home Screen
 * Shows assigned routes and start tracking button
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export default function DriverHomeScreen() {
    const { user, logout } = useAuthStore();

    const handleStartTracking = () => {
        // TODO: Navigate to active tracking screen
        console.log('Start tracking');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Driver Portal</Text>
                    <Text style={styles.userName}>{user?.name || 'Driver'}</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusIcon}>
                        <Text style={styles.statusEmoji}>🚌</Text>
                    </View>
                    <Text style={styles.statusTitle}>Ready to Start</Text>
                    <Text style={styles.statusSubtitle}>
                        Start your route to begin real-time tracking
                    </Text>
                    <TouchableOpacity style={styles.startButton} onPress={handleStartTracking}>
                        <Text style={styles.startButtonText}>Start Route Tracking</Text>
                    </TouchableOpacity>
                </View>

                {/* Routes Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Routes</Text>

                    {/* Sample Route Card */}
                    <View style={styles.routeCard}>
                        <View style={styles.routeHeader}>
                            <Text style={styles.routeName}>Morning Route - North</Text>
                            <View style={styles.routeBadge}>
                                <Text style={styles.routeBadgeText}>ACTIVE</Text>
                            </View>
                        </View>
                        <View style={styles.routeInfo}>
                            <View style={styles.routeInfoRow}>
                                <Text style={styles.routeLabel}>Bus Number:</Text>
                                <Text style={styles.routeValue}>BUS-101</Text>
                            </View>
                            <View style={styles.routeInfoRow}>
                                <Text style={styles.routeLabel}>Start Time:</Text>
                                <Text style={styles.routeValue}>08:00 AM</Text>
                            </View>
                            <View style={styles.routeInfoRow}>
                                <Text style={styles.routeLabel}>Stops:</Text>
                                <Text style={styles.routeValue}>12 stops</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Today's Stats</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>0</Text>
                            <Text style={styles.statLabel}>Trips Today</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>0</Text>
                            <Text style={styles.statLabel}>Students</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.white,
        ...shadows.sm,
    },
    greeting: {
        fontSize: typography.fontSize.md,
        color: colors.text.secondary,
    },
    userName: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    logoutButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    logoutText: {
        color: colors.danger,
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    statusCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.xl,
        ...shadows.md,
    },
    statusIcon: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.full,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    statusEmoji: {
        fontSize: 40,
    },
    statusTitle: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    statusSubtitle: {
        fontSize: typography.fontSize.md,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    startButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.md,
    },
    startButtonText: {
        color: colors.white,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    routeCard: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        ...shadows.sm,
    },
    routeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
    },
    routeName: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
    },
    routeBadge: {
        backgroundColor: colors.success,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    routeBadgeText: {
        color: colors.white,
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold,
    },
    routeInfo: {},
    routeInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
    },
    routeLabel: {
        fontSize: typography.fontSize.md,
        color: colors.text.secondary,
    },
    routeValue: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.primary,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        alignItems: 'center',
        ...shadows.sm,
    },
    statValue: {
        fontSize: typography.fontSize.xxxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    statLabel: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
    },
});

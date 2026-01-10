/**
 * Mark Attendance Screen - Placeholder
 * TODO: Migrate from src/screens/teacher/MarkAttendanceScreen.tsx
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function MarkAttendanceScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹ Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mark Attendance</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>📋 Mark Attendance</Text>
                <Text style={styles.subtitle}>
                    Attendance marking feature coming soon...
                </Text>
            </View>
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
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    title: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    subtitle: {
        fontSize: typography.fontSize.md,
        color: colors.text.secondary,
        textAlign: 'center',
    },
});

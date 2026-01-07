/**
 * Offline Banner Component
 * Shows when app is offline with last sync time
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

interface OfflineBannerProps {
    isOnline: boolean;
    lastSyncTime: Date | null;
    isSyncing: boolean;
    onSyncPress: () => void;
}

export default function OfflineBanner({ isOnline, lastSyncTime, isSyncing, onSyncPress }: OfflineBannerProps) {
    if (isOnline && !lastSyncTime) return null;

    const getTimeSinceSync = () => {
        if (!lastSyncTime) return 'Never synced';

        const diff = Date.now() - lastSyncTime.getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    return (
        <View style={[styles.banner, isOnline ? styles.onlineBanner : styles.offlineBanner]}>
            <View style={styles.content}>
                <Text style={styles.icon}>{isOnline ? '✓' : '⚠'}</Text>
                <View style={styles.text}>
                    <Text style={styles.title}>
                        {isOnline ? 'Connected' : 'Offline Mode'}
                    </Text>
                    <Text style={styles.subtitle}>
                        Last updated: {getTimeSinceSync()}
                    </Text>
                </View>
            </View>

            {isOnline && (
                <TouchableOpacity
                    style={styles.syncButton}
                    onPress={onSyncPress}
                    disabled={isSyncing}
                >
                    {isSyncing ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.syncButtonText}>↻ Sync</Text>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    offlineBanner: {
        backgroundColor: '#ff9800',
    },
    onlineBanner: {
        backgroundColor: '#4caf50',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    icon: {
        fontSize: 20,
        color: '#fff',
        marginRight: 12,
    },
    text: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        marginTop: 2,
    },
    syncButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        minWidth: 70,
        alignItems: 'center',
    },
    syncButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});

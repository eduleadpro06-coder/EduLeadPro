/**
 * useOffline Hook
 * Provides network status and cache sync functionality
 */

import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineCache } from '../services/offline-cache';
import { api } from '../services/api';

export function useOffline() {
    const [isOnline, setIsOnline] = useState(true);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Monitor network status
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const online = !!state.isConnected && state.isInternetReachable !== false;
            setIsOnline(online);

            // Auto-sync when coming back online
            if (online && !isOnline) {
                console.log('[Offline] Connection restored, syncing...');
                syncNow();
            }
        });

        // Load last sync time
        loadLastSyncTime();

        return () => unsubscribe();
    }, []);

    const loadLastSyncTime = async () => {
        try {
            // TEMPORARILY DISABLED: await offlineCache.getLastSyncTime('last_children_sync');
            // setLastSyncTime(syncTime);
            console.log('[Offline] Cache disabled - skipping sync time load');
        } catch (error) {
            console.error('[Offline] Failed to load sync time:', error);
        }
    };

    const syncNow = async () => {
        if (!isOnline || isSyncing) return;

        setIsSyncing(true);
        try {
            // TEMPORARILY DISABLED: Offline cache sync
            console.log('[Offline] Cache disabled - skipping sync');
            setLastSyncTime(new Date());
        } catch (error) {
            console.error('[Offline] Sync error:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    const executePendingAction = async (action: any) => {
        const { actionType, payload } = action;

        switch (actionType) {
            case 'mark_attendance':
                await api.markAttendanceBulk(payload.attendanceRecords);
                break;
            case 'post_activity':
                await api.postActivity(payload.leadId, payload.content, payload.options);
                break;
            case 'update_location':
                await api.updateLocation({
                    routeId: payload.routeId,
                    latitude: payload.latitude,
                    longitude: payload.longitude,
                    speed: payload.speed,
                    heading: payload.heading
                });
                break;
            default:
                console.warn(`[Offline] Unknown action type: ${actionType}`);
        }
    };

    return {
        isOnline,
        lastSyncTime,
        syncNow,
        isSyncing
    };
}

/**
 * useChildren Hook
 * Cache-first children data with background sync
 */
export function useChildren() {
    const [children, setChildren] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fromCache, setFromCache] = useState(false);
    const { isOnline } = useOffline();

    const loadChildren = async () => {
        try {
            // TEMPORARILY DISABLED: Cache-first loading
            // Fetch directly from API
            if (isOnline) {
                const freshChildren = await api.getChildren();
                setChildren(freshChildren);
                setFromCache(false);
            }
        } catch (error) {
            console.error('[useChildren] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadChildren();
    }, [isOnline]);

    return { children, loading, fromCache, refresh: loadChildren };
}

/**
 * useAttendance Hook
 * Cache-first attendance data
 */
export function useAttendance(childId: number, days: number = 30) {
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fromCache, setFromCache] = useState(false);
    const { isOnline } = useOffline();

    const loadAttendance = async () => {
        if (!childId) return;

        try {
            // TEMPORARILY DISABLED: Cache-first loading
            if (isOnline) {
                const freshAttendance = await api.getAttendance(childId, days);
                setAttendance(freshAttendance);
                setFromCache(false);
            }
        } catch (error) {
            console.error('[useAttendance] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAttendance();
    }, [childId, isOnline]);

    return { attendance, loading, fromCache, refresh: loadAttendance };
}

/**
 * useActivities Hook
 * Cache-first activities data
 */
export function useActivities(childId: number, limit: number = 20) {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fromCache, setFromCache] = useState(false);
    const { isOnline } = useOffline();

    const loadActivities = async () => {
        if (!childId) return;

        try {
            // TEMPORARILY DISABLED: Cache-first loading
            if (isOnline) {
                const freshActivities = await api.getDailyUpdates(childId);
                setActivities(freshActivities);
                setFromCache(false);
            }
        } catch (error) {
            console.error('[useActivities] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadActivities();
    }, [childId, isOnline]);

    return { activities, loading, fromCache, refresh: loadActivities };
}

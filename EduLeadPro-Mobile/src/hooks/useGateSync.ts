import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineCache } from '../services/offline-cache';
import { gateAPI } from '../services/api/gate.api';

export function useGateSync() {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const online = !!state.isConnected && state.isInternetReachable !== false;
            setIsOnline(online);
            if (online) {
                syncPending();
            }
        });

        updatePendingCount();
        return () => unsubscribe();
    }, []);

    const updatePendingCount = async () => {
        const actions = await offlineCache.getPendingActions();
        const gateActions = actions.filter(a => a.actionType === 'gate_sync' || a.actionType === 'visitor_sync');
        setPendingCount(gateActions.length);
    };

    const syncPending = async () => {
        if (isSyncing || !isOnline) return;
        
        const actions = await offlineCache.getPendingActions();
        const gateActions = actions.filter(a => a.actionType === 'gate_sync' || a.actionType === 'visitor_sync');
        
        if (gateActions.length === 0) return;

        setIsSyncing(true);
        try {
            for (const action of gateActions) {
                try {
                    if (action.actionType === 'gate_sync') {
                        await gateAPI.syncLogs([action.payload]);
                    } else if (action.actionType === 'visitor_sync') {
                        await gateAPI.visitorCheckIn(action.payload);
                    }
                    await offlineCache.removePendingAction(action.id);
                } catch (err) {
                    console.error('Failed to sync individual action:', err);
                }
            }
            await updatePendingCount();
        } finally {
            setIsSyncing(false);
        }
    };

    const logGateAction = async (payload: any) => {
        if (isOnline) {
            try {
                await gateAPI.syncLogs([payload]);
                return { success: true, mode: 'online' };
            } catch (err) {
                console.warn('Online sync failed, queuing for offline:', err);
            }
        }
        
        await offlineCache.queueAction('gate_sync', payload);
        await updatePendingCount();
        return { success: true, mode: 'offline' };
    };

    const logVisitorAction = async (payload: any) => {
        if (isOnline) {
            try {
                await gateAPI.visitorCheckIn(payload);
                return { success: true, mode: 'online' };
            } catch (err) {
                console.warn('Online visitor log failed, queuing:', err);
            }
        }
        
        await offlineCache.queueAction('visitor_sync', payload);
        await updatePendingCount();
        return { success: true, mode: 'offline' };
    };

    return {
        isOnline,
        pendingCount,
        isSyncing,
        syncPending,
        logGateAction,
        logVisitorAction
    };
}

/**
 * Driver Layout - Stack navigator for driver screens
 */

import { Stack, router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function DriverLayout() {
    const { isAuthenticated, user, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== 'driver')) {
            router.replace('/(auth)/login');
        }
    }, [isAuthenticated, user, isLoading]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="trip" />
        </Stack>
    );
}

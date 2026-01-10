import { Stack } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../../src/theme';

export default function ParentLayout() {
    const { isAuthenticated, user, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== 'parent')) {
            router.replace('/(auth)/login');
        }
    }, [isAuthenticated, user, isLoading]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="bus-tracking" />
            <Stack.Screen name="fees" />
            <Stack.Screen name="activities" options={{ headerShown: false }} />
            <Stack.Screen name="activity-details" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="support" options={{ headerShown: false }} />
            <Stack.Screen name="menu" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        </Stack>
    );
}

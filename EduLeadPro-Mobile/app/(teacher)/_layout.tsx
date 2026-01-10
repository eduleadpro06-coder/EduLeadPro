import { Stack } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function TeacherLayout() {
    const { isAuthenticated, user, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoading && (!isAuthenticated || user?.role !== 'teacher')) {
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
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="mark-attendance" />
            <Stack.Screen name="post-update" />
            <Stack.Screen name="menu" options={{ presentation: 'modal', headerShown: true, title: 'Menu' }} />
        </Stack>
    );
}

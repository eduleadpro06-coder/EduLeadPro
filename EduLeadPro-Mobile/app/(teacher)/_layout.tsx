import { Stack } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

const TEACHER_ROLES = ['teacher', 'counselor', 'staff', 'director', 'admin', 'principal'];
const GATE_ROLES = ['security', 'support_staff', 'care giver'];

export default function TeacherLayout() {
    const { isAuthenticated, user, isLoading } = useAuthStore();
    const userRole = user?.role || '';
    const isAllowed = TEACHER_ROLES.includes(userRole);

    useEffect(() => {
        if (!isLoading && isAuthenticated && !isAllowed) {
            // Redirect to the correct screen instead of login
            if (GATE_ROLES.includes(userRole)) {
                router.replace('/(gate)');
            } else if (userRole === 'parent') {
                router.replace('/(parent)');
            } else if (userRole === 'driver') {
                router.replace('/(driver)');
            } else {
                router.replace('/(auth)/login');
            }
        } else if (!isLoading && !isAuthenticated) {
            router.replace('/(auth)/login');
        }
    }, [isAuthenticated, user, isLoading]);

    // Don't render children until we know the role is correct — prevents unauthorized API calls
    if (isLoading || !isAllowed) {
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
            <Stack.Screen name="attendance-monitor" />
            <Stack.Screen name="approve-updates" />
            <Stack.Screen name="menu" options={{ presentation: 'modal', headerShown: true, title: 'Menu' }} />
        </Stack>
    );
}

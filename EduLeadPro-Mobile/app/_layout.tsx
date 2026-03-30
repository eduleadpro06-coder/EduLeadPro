/**
 * Root Layout - Expo Router
 * Handles authentication state and provides global providers
 */

import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { colors } from '../src/theme/colors';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});

function RootLayoutNav() {
    const segments = useSegments();
    const router = useRouter();
    const { isAuthenticated, isLoading, user, loadUser } = useAuthStore();

    // Load user on app start
    useEffect(() => {
        loadUser();
    }, []);

    // Autorouting logic: this was completely missing before!
    // It watches for authentication state changes and pushes the user to the correct dashboard
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (isAuthenticated && inAuthGroup) {
            // User is authenticated but still on the login screen -> route them to their dashboard!
            if (user?.role === 'parent') {
                router.replace('/(parent)');
            } else if (user?.role === 'teacher') {
                router.replace('/(teacher)');
            } else if (user?.role === 'driver') {
                router.replace('/(driver)');
            } else {
                router.replace('/'); 
            }
        } else if (!isAuthenticated && !inAuthGroup) {
            // User is NOT authenticated but is trying to access a secure screen -> route to login!
            router.replace('/(auth)/login');
        }
    }, [isAuthenticated, segments, isLoading, user]);

    // Show loading screen while checking auth
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return <Slot />;
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <StatusBar style="auto" />
                <RootLayoutNav />
            </QueryClientProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
});

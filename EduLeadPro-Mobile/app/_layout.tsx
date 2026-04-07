/**
 * Root Layout - Expo Router
 * Handles authentication state and provides global providers
 */

import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as Updates from 'expo-updates';
import * as SplashScreen from 'expo-splash-screen';
import SpInAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates';
import { 
    useFonts, 
    Outfit_700Bold, 
    Outfit_800ExtraBold, 
    Outfit_600SemiBold 
} from '@expo-google-fonts/outfit';
import { 
    Inter_400Regular, 
    Inter_500Medium, 
    Inter_600SemiBold 
} from '@expo-google-fonts/inter';

import { useAuthStore } from '../src/store/authStore';
import { colors } from '../src/theme/colors';

// Prevent splash screen from hiding automatically
SplashScreen.preventAutoHideAsync();

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

    const [fontsLoaded] = useFonts({
        'Outfit_Bold': Outfit_700Bold,
        'Outfit_ExtraBold': Outfit_800ExtraBold,
        'Outfit_SemiBold': Outfit_600SemiBold,
        'Inter_Regular': Inter_400Regular,
        'Inter_Medium': Inter_500Medium,
        'Inter_SemiBold': Inter_600SemiBold,
    });

    // Load user and check for OTA updates on app start
    useEffect(() => {
        loadUser();

        // Check for updates (always check in diagnostics mode)
        const checkForUpdates = async () => {
            console.log('🔄 [UpdateCheck] Check started...');
            try {
                // Determine update channel from app.config (if possible) or just check
                const update = await Updates.checkForUpdateAsync();
                console.log('🔄 [UpdateCheck] OTA check result:', JSON.stringify(update, null, 2));

                if (update.isAvailable) {
                    console.log('🔄 [UpdateCheck] OTA update FOUND! Attempting to Alert user.');
                    Alert.alert(
                        'Minor Update Available 🎉',
                        'A new version of Bloomdale Connect is ready. Update now for the best experience!',
                        [
                            { text: 'Later', style: 'cancel' },
                            {
                                text: 'Update Now',
                                onPress: async () => {
                                    try {
                                        console.log('🔄 [UpdateCheck] User clicked Update Now, fetching...');
                                        await Updates.fetchUpdateAsync();
                                        console.log('🔄 [UpdateCheck] Fetch complete, re-launching!');
                                        await Updates.reloadAsync();
                                    } catch (e) {
                                        console.error('🔄 [UpdateCheck] Fetch Error:', e);
                                        Alert.alert('Error', 'Failed to download update. Please try again later.');
                                    }
                                }
                            }
                        ]
                    );
                    return; // Stop here if we have an OTA update
                } else {
                     console.log('🔄 [UpdateCheck] No OTA update available at this time.');
                }

                // Fallback to Native App Store checks if NO OTA update is found
                // We only do this if it's NOT a development environment (__DEV__)
                if (!__DEV__) {
                    console.log('🔄 [UpdateCheck] Checking Native Store updates...');
                    const inAppUpdates = new SpInAppUpdates(false); // false means debug mode disabled
                    inAppUpdates.checkNeedsUpdate().then((result) => {
                        console.log('🔄 [UpdateCheck] Native check result:', JSON.stringify(result, null, 2));
                        if (result.shouldUpdate) {
                            console.log('🔄 [UpdateCheck] Native update FOUND! Prompting user...');
                            inAppUpdates.startUpdate({
                                updateType: IAUUpdateKind.FLEXIBLE,
                            });
                        }
                    }).catch((err) => console.error('🔄 [UpdateCheck] Native check FAILED:', err));
                } else {
                    console.log('🔄 [UpdateCheck] Skipping Native check (DevMode)');
                }

            } catch (error: any) {
                console.error('🔄 [UpdateCheck] Error in update check:', error.message || error);
            } finally {
                console.log('🔄 [UpdateCheck] Check complete.');
            }
        };

        console.log('🔄 [UpdateCheck] Initializing (DevMode:', __DEV__, ')');
        // Delay slightly to ensure app is fully initialized
        const timer = setTimeout(checkForUpdates, 3000);
        return () => clearTimeout(timer);
    }, []);

    // Handle SplashScreen and Navigation
    useEffect(() => {
        if (isLoading || !fontsLoaded) return;

        // Hide splash screen when ready
        SplashScreen.hideAsync();

        const inAuthGroup = segments[0] === '(auth)';

        if (isAuthenticated && inAuthGroup) {
            // User is authenticated but still on the login screen -> route them to their dashboard!
            if (user?.role === 'parent') {
                router.replace('/(parent)');
            } else if (user?.role === 'teacher') {
                router.replace('/(teacher)');
            } else if (user?.role === 'driver') {
                router.replace('/(driver)');
            } else if (user?.role === 'security' || user?.role === 'support_staff') {
                router.replace('/(gate)');
            } else {
                router.replace('/'); 
            }
        } else if (!isAuthenticated && !inAuthGroup) {
            // User is NOT authenticated but is trying to access a secure screen -> route to login!
            router.replace('/(auth)/login');
        }
    }, [isAuthenticated, segments, isLoading, user]);

    // Show nothing (Splash Screen stays visible) while checking auth or loading fonts
    if (isLoading || !fontsLoaded) {
        return null;
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

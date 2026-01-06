/**
 * Main App Navigator
 * Handles routing between authenticated and unauthenticated states
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';

// Import screens (we'll create these next)
import LoginScreen from '../screens/auth/LoginScreen';
import ParentHomeScreen from '../screens/parent/ParentHomeScreen';
import BusTrackingScreen from '../screens/parent/BusTrackingScreen';
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        // Auth Stack
        return (
            <NavigationContainer>
                <Stack.Navigator
                    screenOptions={{
                        headerShown: false,
                    }}
                >
                    <Stack.Screen name="Login" component={LoginScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        );
    }

    // Authenticated Stack - Different for Parent vs Driver
    const isDriver = user?.role === 'driver';

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                {isDriver ? (
                    <>
                        <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="ParentHome" component={ParentHomeScreen} />
                        <Stack.Screen name="BusTracking" component={BusTrackingScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

/**
 * Main App Navigator
 * Handles routing between authenticated and unauthenticated states
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import ParentHomeScreen from '../screens/parent/ParentHomeScreen';
import BusTrackingScreen from '../screens/parent/BusTrackingScreen';
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import TeacherHomeScreen from '../screens/teacher/TeacherHomeScreen';
import MarkAttendanceScreen from '../screens/teacher/MarkAttendanceScreen';
import PostUpdateScreen from '../screens/teacher/PostUpdateScreen';

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

    // Authenticated Stack - Different for Parent vs Teacher vs Driver
    const isTeacher = user?.role === 'teacher';
    const isDriver = user?.role === 'driver';

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                {isTeacher ? (
                    <>
                        <Stack.Screen name="TeacherHome" component={TeacherHomeScreen} />
                        <Stack.Screen name="MarkAttendance" component={MarkAttendanceScreen} />
                        <Stack.Screen name="PostUpdate" component={PostUpdateScreen} />
                    </>
                ) : isDriver ? (
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

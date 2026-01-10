/**
 * Index Route - Redirects based on auth state
 */

import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    // Redirect based on user role
    if (user?.role === 'teacher') {
        return <Redirect href="/(teacher)" />;
    } else if (user?.role === 'driver') {
        return <Redirect href="/(driver)" />;
    }

    return <Redirect href="/(parent)" />;
}

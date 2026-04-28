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
    if (user?.role === 'parent') {
        return <Redirect href="/(parent)" />;
    } else if (['teacher', 'staff', 'counselor', 'director', 'admin', 'principal'].includes(user?.role || '')) {
        return <Redirect href="/(teacher)" />;
    } else if (user?.role === 'driver') {
        return <Redirect href="/(driver)" />;
    } else if (['security', 'support_staff'].includes(user?.role || '')) {
        return <Redirect href="/(gate)" />;
    }

    // Default fallback
    return <Redirect href="/(teacher)" />;
}

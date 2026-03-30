/**
 * Authentication Store using Zustand
 */

import { create } from 'zustand';
import { User, AuthState, LoginResponse } from '../types/user.types';
import authAPI from '../services/api/auth.api';

interface AuthStore extends AuthState {
    login: (phone: string, password: string) => Promise<LoginResponse>;
    logout: () => Promise<void>;
    reset: () => void; // Local cleanup without API call
    loadUser: () => Promise<void>;
    setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,

    /**
     * Load user from secure storage on app start
     */
    loadUser: async () => {
        try {
            const user = await authAPI.getCurrentUser();
            const isAuthenticated = await authAPI.isAuthenticated();

            set({
                user,
                isAuthenticated,
                isLoading: false,
            });
        } catch (error) {
            console.error('Error loading user:', error);
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    },

    /**
     * Login user
     */
    login: async (phone: string, password: string) => {
        try {
            // DO NOT SET GLOBAL isLoading: true HERE! 
            // Setting global isLoading unmounts the `<Slot />` in `_layout.tsx`, 
            // which irreversibly kills the local state of `login.tsx`!
            // The LoginScreen already maintains its own `loading` spinner for the login button.

            const response = await authAPI.login({ phone, password });

            if (response.success) {
                // If password change is required, DON'T set isAuthenticated yet
                // This keeps the user on the login screen to show the change password modal
                if (response.requiresPasswordChange) {
                    set({
                        user: response.user,
                        token: response.accessToken || (response as any).token,
                        isAuthenticated: false, // Keep false until password is changed
                    });
                } else {
                    set({
                        user: response.user,
                        token: response.accessToken || (response as any).token,
                        isAuthenticated: true,
                    });
                }
                return response;
            } else {
                throw new Error('Login failed');
            }
        } catch (error) {
            throw error;
        }
    },

    /**
     * Logout user
     */
    logout: async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    },

    /**
     * Reset auth state locally (used when token refresh fails)
     */
    reset: () => {
        set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
        });
    },

    /**
     * Set user manually (for testing or updates)
     */
    setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
    },
}));

export default useAuthStore;

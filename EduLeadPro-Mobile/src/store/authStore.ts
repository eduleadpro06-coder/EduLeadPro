/**
 * Authentication Store using Zustand
 */

import { create } from 'zustand';
import { User, AuthState } from '../types/user.types';
import authAPI from '../services/api/auth.api';

interface AuthStore extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
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
    login: async (email: string, password: string) => {
        try {
            set({ isLoading: true });

            const response = await authAPI.login({ email, password });

            if (response.success) {
                set({
                    user: response.user,
                    token: response.token,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                throw new Error('Login failed');
            }
        } catch (error) {
            set({ isLoading: false });
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
     * Set user manually (for testing or updates)
     */
    setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
    },
}));

export default useAuthStore;

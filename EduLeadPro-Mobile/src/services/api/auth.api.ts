/**
 * Authentication API Service
 */

import apiClient from './client';
import * as SecureStore from 'expo-secure-store';
import { LoginRequest, LoginResponse, User } from '../../types/user.types';
import { STORAGE_KEYS } from '../../utils/constants';

export const authAPI = {
    /**
     * Login with email and password
     */
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        const response: LoginResponse = await apiClient.post('/auth/login', credentials);

        // Store tokens and user data securely
        if (response.success && response.accessToken) {
            await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, response.accessToken);
            if (response.refreshToken) {
                await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
            }
            await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
        }

        return response;
    },

    /**
     * Logout
     */
    async logout(): Promise<void> {
        try {
            const deviceToken = await SecureStore.getItemAsync(STORAGE_KEYS.DEVICE_TOKEN);
            await apiClient.post('/auth/logout', { deviceToken });
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Clear local storage regardless of API call success
            await apiClient.clearAuth();
            await SecureStore.deleteItemAsync(STORAGE_KEYS.DEVICE_TOKEN);
        }
    },

    /**
     * Get current user from secure storage
     */
    async getCurrentUser(): Promise<User | null> {
        try {
            const userDataStr = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
            if (userDataStr) {
                return JSON.parse(userDataStr);
            }
            return null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },

    /**
     * Check if user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
        return !!token;
    },
};

export default authAPI;

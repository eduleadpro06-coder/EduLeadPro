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
        
        console.log('[AuthAPI] Received login response success:', response.success);
        console.log('[AuthAPI] Provided Password:', credentials.password, 'Provided Phone:', credentials.phone);

        // Client-side Failsafe Enforcement:
        // Only force password change for PARENTS if they use default passwords. 
        // Staff/Security passwords are strictly managed via the web portal.
        if (response.success && response.user?.role === 'parent') {
            const trimmedPass = credentials.password?.trim() || '';
            const trimmedPhone = credentials.phone?.trim() || '';
            if (trimmedPass === '1234' || trimmedPass === trimmedPhone) {
                console.log('[AuthAPI] Triggering Client-Side requiresPasswordChange = true for Parent');
                response.requiresPasswordChange = true;
            }
        }
        
        console.log('[AuthAPI] Final requiresPasswordChange status:', response.requiresPasswordChange);

        // Store tokens securely ONLY if a password change is NOT required. 
        // This is a bulletproof security measure: if they dismiss the modal or restart the app, 
        // `loadUser` will find no token and boot them back to the login screen!
        if (response.success && response.accessToken && !response.requiresPasswordChange) {
            console.log('[AuthAPI] Saving tokens to SecureStore...');
            await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, response.accessToken);
            if (response.refreshToken) {
                await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
            }
            await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
        } else {
            console.log('[AuthAPI] NOT saving tokens. Reason -> requiresPasswordChange:', response.requiresPasswordChange);
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

    /**
     * Change Password
     */
    async changePassword(phone: string, newPassword: string): Promise<any> {
        return await apiClient.post('/auth/change-password', { phone, newPassword });
    }
};

export default authAPI;

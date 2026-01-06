/**
 * API Client - HTTP client for making requests to the backend
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, STORAGE_KEYS } from '../../utils/constants';

class APIClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor - Add auth token to every request
        this.client.interceptors.request.use(
            async (config) => {
                try {
                    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
                    const userDataStr = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);

                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }

                    if (userDataStr) {
                        const userData = JSON.parse(userDataStr);
                        config.headers['x-user-name'] = userData.email;
                    }
                } catch (error) {
                    console.error('Error adding auth headers:', error);
                }

                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor - Handle errors and token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // If 401 and haven't retried yet, try to refresh token
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

                        if (refreshToken) {
                            const response = await axios.post(
                                `${API_BASE_URL}/auth/refresh`,
                                { refreshToken }
                            );

                            const { token: newToken } = response.data;
                            await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, newToken);

                            // Retry original request with new token
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            return this.client(originalRequest);
                        }
                    } catch (refreshError) {
                        // Refresh failed - logout user
                        await this.clearAuth();
                        // Navigate to login (handled by auth context)
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    /**
     * GET request
     */
    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.get(url, config);
        return response.data;
    }

    /**
     * POST request
     */
    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.post(url, data, config);
        return response.data;
    }

    /**
     * PUT request
     */
    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.put(url, data, config);
        return response.data;
    }

    /**
     * DELETE request
     */
    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.delete(url, config);
        return response.data;
    }

    /**
     * Clear authentication data
     */
    async clearAuth(): Promise<void> {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
    }
}

// Export singleton instance
export const apiClient = new APIClient();
export default apiClient;

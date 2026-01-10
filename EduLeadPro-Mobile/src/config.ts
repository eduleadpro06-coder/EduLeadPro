// Mobile App Configuration
// Uses environment variables from app.config.js

import Constants from 'expo-constants';

// Get API URL from environment
export const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000/api/mobile';
export const WS_URL = Constants.expoConfig?.extra?.wsUrl || 'ws://localhost:5000';
export const OLA_MAPS_API_KEY = Constants.expoConfig?.extra?.olaMapsApiKey || '';

// API endpoints
export const API = {
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    GET_BUS_SESSION: (routeId: string) => `${API_BASE_URL}/bus/${routeId}/active-session`,
    GET_ROUTE: (routeId: string) => `${API_BASE_URL}/bus/${routeId}/route`,
};

export const colors = {
    primary: '#4f46e5',
    background: '#f9fafb',
    white: '#ffffff',
    cardBorder: '#e5e7eb',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textLight: '#9ca3af',
    success: '#10b981',
    danger: '#ef4444',
};


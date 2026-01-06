// Mobile App Configuration
// Update this with your computer's IP address

// To find your IP:
// Windows: Run 'ipconfig' in terminal, look for IPv4 Address
// Example: 192.168.1.5 or 192.168.29.x

// IMPORTANT: Using your PC's IP for phone access
export const API_BASE_URL = 'http://192.168.29.16:5000/api/mobile';
// The IP 192.168.29.16 is your PC. Phone can access this on same WiFi.

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

/**
 * Constants used throughout the app
 */

// API Configuration
export const API_BASE_URL = __DEV__
    ? 'http://192.168.29.166:5000/api/v1/mobile'  // Development (use your PC's IP)
    : 'https://edu-lead-pro.vercel.app/api/mobile'; // Production

export const WEBSOCKET_URL = __DEV__
    ? 'ws://192.168.29.166:5000'
    : 'wss://edu-lead-pro.vercel.app';

// GPS Tracking Configuration
export const GPS_CONFIG = {
    UPDATE_INTERVAL: 15000,          // 15 seconds
    DISTANCE_FILTER: 50,             // 50 meters
    GEOFENCE_RADIUS: 200,            // 200 meters
    PROXIMITY_THRESHOLD_FAR: 500,    // 500 meters (5 mins notification)
    PROXIMITY_THRESHOLD_NEAR: 200,   // 200 meters (arriving notification)
};

// Map Configuration
export const MAP_CONFIG = {
    INITIAL_DELTA: {
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
    },
    ANIMATION_DURATION: 1000,
};

// Storage Keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    DEVICE_TOKEN: 'device_token',
};

// Notification Types
export const NOTIFICATION_TYPES = {
    BUS_STARTED: 'bus_started',
    BUS_5_MINS: 'bus_5_mins',
    BUS_ARRIVING: 'bus_arriving',
    BUS_ARRIVED: 'bus_arrived',
    BUS_DEPARTED: 'bus_departed',
    BUS_COMPLETED: 'bus_completed',
};

// Query Keys (for React Query)
export const QUERY_KEYS = {
    USER: 'user',
    STUDENTS: 'students',
    BUS_ROUTES: 'bus_routes',
    BUS_SESSION: 'bus_session',
    BUS_LOCATION: 'bus_location',
    ATTENDANCE: 'attendance',
    NOTIFICATIONS: 'notifications',
};

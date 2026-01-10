/**
 * Bus Tracking API Service
 */

import apiClient from './client';
import {
    BusRoute,
    BusStop,
    ActiveBusSession,
    BusLocationHistory
} from '../../types/bus.types';

export const busAPI = {
    /**
     * Get active bus session for a route
     */
    async getActiveSession(routeId: string): Promise<{ session: ActiveBusSession | null }> {
        return await apiClient.get(`/bus/${routeId}/active-session`);
    },

    /**
     * Get route details with all stops
     */
    async getRouteDetails(routeId: string): Promise<{ route: BusRoute }> {
        return await apiClient.get(`/bus/${routeId}/route`);
    },

    /**
     * Get location history for a session
     */
    async getLocationHistory(sessionId: string): Promise<{ history: BusLocationHistory[] }> {
        return await apiClient.get(`/bus/session/${sessionId}/history`);
    },

    /**
     * Get student's bus assignment
     */
    async getStudentBusAssignment(studentId: string): Promise<any> {
        return await apiClient.get(`/parent/child/${studentId}/bus-assignment`);
    },

    /**
     * Get driver's assigned routes
     */
    async getDriverRoutes(): Promise<{ routes: BusRoute[] }> {
        return await apiClient.get('/driver/routes');
    },

    /**
     * Get driver's trip history
     */
    async getDriverHistory(limit: number = 20): Promise<{ sessions: ActiveBusSession[] }> {
        return await apiClient.get(`/driver/history?limit=${limit}`);
    },

    /**
     * Update bus location (real-time tracking)
     */
    async updateLocation(data: {
        routeId: number;
        latitude: number;
        longitude: number;
        speed?: number;
        heading?: number;
    }): Promise<{ success: boolean }> {
        return await apiClient.post('/driver/location', data);
    },
};

export default busAPI;

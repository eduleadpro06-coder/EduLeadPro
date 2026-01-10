/**
 * Parent API Service
 */

import apiClient from './client';

export const parentAPI = {
    /**
     * Get organization details for the current user
     */
    async getOrganizationDetails(): Promise<any> {
        // We use the common endpoint which is accessible to parents via JWT
        return await apiClient.get('/parent/organization');
    },

    /**
     * Get children for the current parent
     */
    async getChildren(): Promise<any[]> {
        return await apiClient.get('/parent/children');
    },

    /**
     * Get attendance for a child
     */
    async getAttendance(childId: number, days: number = 30): Promise<any[]> {
        return await apiClient.get(`/parent/child/${childId}/attendance?days=${days}`);
    },

    /**
     * Get daily updates/activities for a child
     */
    async getDailyUpdates(childId: number): Promise<any[]> {
        return await apiClient.get(`/parent/child/${childId}/activities`);
    },

    /**
     * Get fees for a child
     */
    async getStudentFees(childId: number): Promise<any> {
        return await apiClient.get(`/parent/child/${childId}/fees`);
    },

    /**
     * Get announcements for an organization
     */
    async getAnnouncements(orgId: number): Promise<any[]> {
        return await apiClient.get(`/parent/announcements?orgId=${orgId}`);
    },

    /**
     * Get events for an organization
     */
    async getEvents(orgId: number): Promise<any[]> {
        return await apiClient.get(`/parent/events?orgId=${orgId}`);
    },

    /**
     * Get today's attendance for a child
     */
    async getTodayAttendance(childId: number): Promise<any> {
        const attendance = await this.getAttendance(childId, 1);
        return attendance[0] || null;
    }
};

export default parentAPI;

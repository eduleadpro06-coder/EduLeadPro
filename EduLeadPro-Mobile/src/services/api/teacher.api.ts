/**
 * Teacher API Service
 */

import apiClient from './client';
import {
    TeacherDashboard,
    MarkAttendanceRequest,
    PostUpdateRequest,
    StudentInfo,
} from '../../types/teacher.types';

export const teacherAPI = {
    /**
     * Get teacher dashboard data
     */
    async getDashboard(staffId: number): Promise<TeacherDashboard> {
        return await apiClient.get(`/teacher/dashboard/${staffId}`);
    },

    /**
     * Mark student attendance
     */
    async markAttendance(data: MarkAttendanceRequest): Promise<{ success: boolean; message: string }> {
        return await apiClient.post('/attendance/mark', data);
    },

    /**
     * Post daily update/activity
     */
    async postDailyUpdate(data: PostUpdateRequest): Promise<{ success: boolean; message: string }> {
        return await apiClient.post('/daily-updates/post', data);
    },

    /**
     * Get student list for organization
     */
    async getStudentList(organizationId: number): Promise<StudentInfo[]> {
        const response = await apiClient.get(`/students/list/${organizationId}`);
        return response.students || [];
    },

    /**
     * Get student details
     */
    async getStudentDetails(studentId: number): Promise<any> {
        return await apiClient.get(`/student/${studentId}`);
    },

    /**
     * Get attendance history for a student
     */
    async getAttendanceHistory(studentId: number, startDate?: string, endDate?: string): Promise<any> {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        return await apiClient.get(`/student/${studentId}/attendance?${params.toString()}`);
    },
};

export default teacherAPI;

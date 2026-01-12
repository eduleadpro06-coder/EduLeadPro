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
import { supabase } from '../../lib/supabase';
import { decode } from 'base64-arraybuffer';

// Helper to upload base64/URI image to Supabase
const uploadToSupabase = async (uriOrBase64: string): Promise<string | null> => {
    if (!uriOrBase64) return null;

    // Check if it's already a remote URL
    if (uriOrBase64.startsWith('http')) return uriOrBase64;

    try {
        console.log('Starting Supabase upload...');
        const timestamp = new Date().getTime();
        const randomId = Math.random().toString(36).substring(7);
        const fileName = `upload_${timestamp}_${randomId}.jpg`;
        // Policy requires "public" folder
        const filePath = `public/activity_uploads/${fileName}`;

        let base64Data = uriOrBase64;
        if (uriOrBase64.startsWith('data:image')) {
            base64Data = uriOrBase64.split(',')[1];
        }

        const { data, error } = await supabase.storage
            .from('media')
            .upload(filePath, decode(base64Data), {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);

        console.log('Upload success, public URL:', publicUrl);
        return publicUrl;
    } catch (error: any) {
        console.error('Failed to upload image manually:', error);
        return null;
    }
};

export const teacherAPI = {
    /**
     * Get teacher dashboard data
     */
    async getDashboard(): Promise<TeacherDashboard> {
        const response = await apiClient.get('/teacher/dashboard');
        return response.data;
    },

    // Alias for index.tsx compatibility
    async getTeacherDashboard(): Promise<TeacherDashboard> {
        return this.getDashboard();
    },

    /**
     * Mark student attendance in bulk
     */
    async markAttendanceBulk(attendanceRecords: any[]): Promise<any> {
        const response = await apiClient.post('/teacher/attendance/bulk', { attendanceRecords });
        return response.data;
    },

    /**
     * Post daily update/activity
     */
    async postDailyUpdate(data: PostUpdateRequest): Promise<{ success: boolean; message: string }> {
        return await apiClient.post('/teacher/activity', data);
    },

    /**
     * Post activity (alias for postDailyUpdate or specific implementation)
     */
    async postActivity(leadIds: number[] | number, content: string, options: any = {}): Promise<any> {
        let localImages = options.images || []; // Array of local URIs
        // Legacy support for single image property
        if (options.image && !localImages.includes(options.image)) {
            localImages.push(options.image);
        }

        let mediaUrls = options.mediaUrls || [];

        // Upload all local images
        if (localImages.length > 0) {
            console.log(`Processing ${localImages.length} images for upload...`);

            // Upload in parallel
            const uploadPromises = localImages.map(async (imgUri: string) => {
                if (!imgUri || imgUri.startsWith('http')) return imgUri; // Skip if already remote
                return await uploadToSupabase(imgUri);
            });

            const uploadedUrls = await Promise.all(uploadPromises);

            // Filter out failures (nulls) and add to mediaUrls
            const validUrls = uploadedUrls.filter((url: string | null) => url !== null);
            mediaUrls = [...mediaUrls, ...validUrls];

            console.log(`Successfully uploaded ${validUrls.length} images.`);
        }

        // Prepare clean payload for backend - explicitly exclude base64 images
        const payload: any = {
            content,
            title: options.title || 'Activity Update',
            activityType: options.activityType || 'general',
            mediaUrls: mediaUrls, // Use the uploaded Supabase URLs
            mood: options.mood,
        };

        // Add lead identifier
        if (Array.isArray(leadIds)) {
            payload.leadIds = leadIds;
        } else {
            payload.leadId = leadIds;
        }

        // Add any other metadata from options, but EXCLUDE large media fields
        const { images, image, ...otherOptions } = options;
        Object.assign(payload, otherOptions);

        // Ensure image fields are cleared in payload for backend safety
        payload.image = null;
        payload.images = undefined;

        return await this.postDailyUpdate(payload);
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
     * Get students for the logged-in teacher
     */
    async getTeacherStudents(classFilter?: string): Promise<StudentInfo[]> {
        const params = new URLSearchParams();
        if (classFilter) params.append('class', classFilter);

        const response = await apiClient.get(`/teacher/students?${params.toString()}`);
        return response.data?.students || [];
    },

    /**
     * Get attendance history for a student
     */
    async getAttendanceHistory(studentId: number, days: number = 30): Promise<any> {
        return await apiClient.get(`/teacher/student/${studentId}/attendance?days=${days}`);
    },

    /**
     * Get today's attendance for all students
     */
    async getTodayAttendanceAll(): Promise<any> {
        const response = await apiClient.get('/teacher/attendance/today');
        return response.data;
    },
};

export default teacherAPI;

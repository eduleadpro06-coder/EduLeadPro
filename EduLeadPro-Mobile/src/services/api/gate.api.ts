/**
 * Gate API Service
 */

import apiClient from './client';
import { supabase } from '../../lib/supabase';
import { decode } from 'base64-arraybuffer';

// Helper to upload to Supabase (reused from teacher.api.ts)
const uploadToSupabase = async (uriOrBase64: string, folder: string = 'gate_logs'): Promise<string | null> => {
    if (!uriOrBase64) return null;
    if (uriOrBase64.startsWith('http')) return uriOrBase64;

    try {
        const timestamp = new Date().getTime();
        const randomId = Math.random().toString(36).substring(7);
        const fileName = `gate_${timestamp}_${randomId}.jpg`;
        const filePath = `public/${folder}/${fileName}`;

        let base64Data = uriOrBase64;
        if (uriOrBase64.startsWith('data:image')) {
            base64Data = uriOrBase64.split(',')[1];
        }

        const { error } = await supabase.storage
            .from('media')
            .upload(filePath, decode(base64Data), {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Failed to upload gate image:', error);
        return null;
    }
};

export const gateAPI = {
    /**
     * Search students for gate check-in/out
     */
    async getGateStudents(query: string = ''): Promise<any[]> {
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        const response = await apiClient.get(`/mobile/gate/students?${params.toString()}`);
        return response.data;
    },

    /**
     * Get specific student details for gate
     */
    async getGateStudentDetails(studentId: string | number): Promise<any> {
        const response = await apiClient.get(`/mobile/gate/students/${studentId}`);
        return response.data;
    },

    /**
     * Sync offline logs (idempotent)
     */
    async syncLogs(logs: any[]): Promise<any> {
        const response = await apiClient.post('/mobile/gate/sync', { logs });
        return response.data;
    },

    /**
     * Create a single gate log (shortcut for sync)
     */
    async createLog(log: any): Promise<any> {
        // If there's a local photo, upload it first
        if (log.photo_url && !log.photo_url.startsWith('http')) {
            const publicUrl = await uploadToSupabase(log.photo_url);
            if (publicUrl) log.photo_url = publicUrl;
        }

        const response = await apiClient.post('/mobile/gate/sync', { logs: [log] });
        return response.data;
    },

    /**
     * Visitor Check-in
     */
    async visitorCheckIn(visitorData: any): Promise<any> {
        if (visitorData.photo_url && !visitorData.photo_url.startsWith('http')) {
            const publicUrl = await uploadToSupabase(visitorData.photo_url, 'visitors');
            if (publicUrl) visitorData.photo_url = publicUrl;
        }
        const response = await apiClient.post('/mobile/gate/visitors', visitorData);
        return response.data;
    },

    /**
     * Visitor Check-out
     */
    async visitorCheckOut(visitorId: number): Promise<any> {
        const response = await apiClient.patch(`/mobile/gate/visitors/${visitorId}/checkout`);
        return response.data;
    },

    /**
     * Get today's visitor history
     */
    async getVisitorHistory(): Promise<any[]> {
        const response = await apiClient.get('/mobile/gate/visitors/active');
        return response.data;
    }
};

export default gateAPI;

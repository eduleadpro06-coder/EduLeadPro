import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Service for Mobile App with JWT Authentication
// V1 API with token-based auth and auto-refresh
const IS_WEB_PROD = Platform.OS === 'web' && process.env.NODE_ENV === 'production';
const API_BASE_URL = IS_WEB_PROD
    ? '/api'
    : 'https://edu-lead-pro.vercel.app/api';

// Storage keys for tokens
const ACCESS_TOKEN_KEY = '@eduleadpro:accessToken';
const REFRESH_TOKEN_KEY = '@eduleadpro:refreshToken';

export interface Child {
    id: number;
    name: string;
    class: string;
    email: string;
    parentName: string;
    phone: string;
    status: string;
}

export interface DailyUpdate {
    id: number;
    title: string;
    content: string;
    mediaUrls: string[];
    activityType: string;
    mood: string;
    teacherName: string;
    postedAt: string;
}

export interface Homework {
    id: number;
    className: string;
    subject: string;
    title: string;
    description: string;
    dueDate: string;
    teacherName: string;
}

export interface Attendance {
    id: number;
    date: string;
    status: string;
    checkInTime?: string;
    checkOutTime?: string;
}

export interface Announcement {
    id: number;
    title: string;
    content: string;
    priority: string;
    publishedAt: string;
}

export interface Event {
    id: number;
    title: string;
    description: string;
    eventDate: string;
    eventTime?: string;
    eventType: string;
}

class APIService {
    private baseURL: string;
    private isRefreshing: boolean = false;
    private refreshSubscribers: Array<(token: string) => void> = [];

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    // Token management
    async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
        try {
            await AsyncStorage.multiSet([
                [ACCESS_TOKEN_KEY, accessToken],
                [REFRESH_TOKEN_KEY, refreshToken]
            ]);
        } catch (error) {
            console.error('Failed to store tokens:', error);
        }
    }

    async getAccessToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        } catch (error) {
            console.error('Failed to get access token:', error);
            return null;
        }
    }

    async getRefreshToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('Failed to get refresh token:', error);
            return null;
        }
    }

    async clearTokens(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
        } catch (error) {
            console.error('Failed to clear tokens:', error);
        }
    }

    // Token refresh logic
    private async refreshAccessToken(): Promise<string> {
        const refreshToken = await this.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(`${this.baseURL}/v1/mobile/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) {
            // Refresh token invalid - clear tokens and force re-login
            await this.clearTokens();
            throw new Error('Refresh token expired');
        }

        const data = await response.json();
        const newAccessToken = data.data.accessToken;

        // Store new access token
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);

        return newAccessToken;
    }

    private onAccessTokenFetched(token: string) {
        this.refreshSubscribers.forEach(callback => callback(token));
        this.refreshSubscribers = [];
    }

    private addRefreshSubscriber(callback: (token: string) => void) {
        this.refreshSubscribers.push(callback);
    }

    // Fetch with automatic token refresh
    private async fetchWithAuth<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const accessToken = await this.getAccessToken();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options?.headers as Record<string, string> || {})
        };

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        let response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers
        });

        // Handle 401 - try to refresh token
        if (response.status === 401) {
            if (!this.isRefreshing) {
                this.isRefreshing = true;
                try {
                    const newToken = await this.refreshAccessToken();
                    this.isRefreshing = false;
                    this.onAccessTokenFetched(newToken);
                } catch (error) {
                    this.isRefreshing = false;
                    throw error;
                }
            }

            // Wait for token refresh if already in progress
            const newToken = await new Promise<string>((resolve) => {
                this.addRefreshSubscriber((token: string) => {
                    resolve(token);
                });
            });

            // Retry request with new token
            headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers
            });
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || data; // Handle both v1 (data wrapper) and legacy formats
    }

    // Authentication
    async login(phone: string, password: string): Promise<LoginResponse> {
        const response = await fetch(`${this.baseURL}/mobile/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store tokens if present (new JWT flow)
        if (data.accessToken && data.refreshToken) {
            await this.storeTokens(data.accessToken, data.refreshToken);
        }

        return data;
    }

    async changePassword(phone: string, newPassword: string): Promise<any> {
        const res = await fetch(`${this.baseURL}/mobile/auth/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, newPassword }),
        });
        return res.json();
    }

    async changePasswordStaff(phone: string, newPassword: string, oldPassword?: string): Promise<any> {
        const res = await fetch(`${this.baseURL}/mobile/auth/change-password-staff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, newPassword, oldPassword }),
        });
        return res.json();
    }

    // Parent Methods (V1 API)
    async getChildren(): Promise<Child[]> {
        const data = await this.fetchWithAuth<{ children: any[] }>('/v1/mobile/parent/children');
        return (data.children || []).map(c => ({
            id: c.id,
            name: c.name,
            class: c.class,
            email: c.email || c.student_email,
            parentName: c.parent_name,
            phone: c.parent_phone,
            status: c.status
        }));
    }

    async getAttendance(childId: number, days: number = 30): Promise<Attendance[]> {
        const data = await this.fetchWithAuth<{ attendance: any[] }>(
            `/v1/mobile/parent/child/${childId}/attendance?days=${days}`
        );
        return (data.attendance || []).map(a => ({
            id: a.id,
            date: a.date,
            status: a.status,
            checkInTime: a.check_in_time,
            checkOutTime: a.check_out_time
        }));
    }

    async getDailyUpdates(childId: number): Promise<DailyUpdate[]> {
        const data = await this.fetchWithAuth<{ activities: any[] }>(
            `/v1/mobile/parent/child/${childId}/activities?limit=20`
        );
        return (data.activities || []).map(u => ({
            id: u.id,
            title: u.title || u.activity_type,
            content: u.content,
            mediaUrls: u.media_urls || [],
            activityType: u.activity_type,
            mood: u.mood,
            teacherName: u.teacher_name,
            postedAt: u.posted_at
        }));
    }

    async getTodayAttendance(childId: number): Promise<Attendance | null> {
        try {
            const allAttendance = await this.getAttendance(childId, 1);
            return allAttendance.length > 0 ? allAttendance[0] : null;
        } catch (error) {
            return null;
        }
    }

    async getAnnouncements(organizationId: number): Promise<Announcement[]> {
        const data = await this.fetchWithAuth<{ announcements: any[] }>(
            `/v1/mobile/parent/announcements?limit=10`
        );
        return (data.announcements || []).map(a => ({
            id: a.id,
            title: a.title,
            content: a.content,
            priority: a.priority,
            publishedAt: a.published_at
        }));
    }

    async getEvents(organizationId: number): Promise<Event[]> {
        const data = await this.fetchWithAuth<{ events: any[] }>(
            `/v1/mobile/parent/events`
        );
        return (data.events || []).map(e => ({
            id: e.id,
            title: e.title,
            description: e.description,
            eventDate: e.event_date,
            eventTime: e.event_time,
            eventType: e.event_type
        }));
    }

    async getBusLocation(childId: number): Promise<any> {
        return await this.fetchWithAuth(`/v1/mobile/parent/child/${childId}/bus-tracking`);
    }

    // Teacher Methods (V1 API)
    async getTeacherDashboard(): Promise<any> {
        return await this.fetchWithAuth('/v1/mobile/teacher/dashboard');
    }

    async getTeacherStudents(classFilter?: string): Promise<any[]> {
        const queryParam = classFilter ? `?class=${encodeURIComponent(classFilter)}` : '';
        const data = await this.fetchWithAuth<{ students: any[] }>(
            `/v1/mobile/teacher/students${queryParam}`
        );
        return data.students || [];
    }

    async markAttendanceBulk(attendanceRecords: Array<{ leadId: number; status: string; checkInTime?: string }>): Promise<any> {
        return await this.fetchWithAuth('/v1/mobile/teacher/attendance/bulk', {
            method: 'POST',
            body: JSON.stringify({ attendanceRecords })
        });
    }

    async postActivity(leadId: number, content: string, options?: {
        title?: string;
        activityType?: string;
        mood?: string;
        mediaUrls?: string[];
    }): Promise<any> {
        return await this.fetchWithAuth('/v1/mobile/teacher/activity', {
            method: 'POST',
            body: JSON.stringify({
                leadId,
                content,
                ...options
            })
        });
    }

    async getTodayAttendanceAll(): Promise<any> {
        return await this.fetchWithAuth('/v1/mobile/teacher/attendance/today');
    }

    // Driver Methods (V1 API)
    async getDriverDashboard(): Promise<any> {
        return await this.fetchWithAuth('/v1/mobile/driver/dashboard');
    }

    async updateBusLocation(routeId: number, latitude: number, longitude: number, speed?: number, heading?: number): Promise<any> {
        return await this.fetchWithAuth('/v1/mobile/driver/location', {
            method: 'POST',
            body: JSON.stringify({ routeId, latitude, longitude, speed, heading })
        });
    }

    async startTrip(routeId: number): Promise<any> {
        return await this.fetchWithAuth('/v1/mobile/driver/trip/start', {
            method: 'POST',
            body: JSON.stringify({ routeId })
        });
    }

    async endTrip(sessionId: number): Promise<any> {
        return await this.fetchWithAuth('/v1/mobile/driver/trip/end', {
            method: 'POST',
            body: JSON.stringify({ sessionId })
        });
    }

    async getActiveTrip(): Promise<any> {
        return await this.fetchWithAuth('/v1/mobile/driver/trip/active');
    }

    // Legacy method compatibility (kept for backward compatibility during migration)
    async getHomework(className: string): Promise<Homework[]> {
        // This would need a v1 endpoint - placeholder for now
        return [];
    }

    async getParentMessages(leadId: number): Promise<any[]> {
        // This would need a v1 endpoint - placeholder for now
        return [];
    }
}

export const api = new APIService();

export interface LoginResponse {
    success?: boolean;
    error?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: any;
    students?: Child[];
    requiresPasswordChange?: boolean;
}

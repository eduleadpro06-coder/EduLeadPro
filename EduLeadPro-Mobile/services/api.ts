import { setItemAsync, getItemAsync, deleteItemAsync } from 'expo-secure-store';
import { STORAGE_KEYS } from '../src/utils/constants';
import { API_BASE_URL } from '../src/config';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

// API Service for Mobile App with JWT Authentication
// V1 API with token-based auth and auto-refresh


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
    private isLoggingOut = false;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    // Token management
    async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
        try {
            await setItemAsync(STORAGE_KEYS.AUTH_TOKEN, accessToken);
            // We store refresh token but don't actively use it for auto-refresh anymore
            // since access tokens are 365d long-lived for mobile
            await setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        } catch (error) {
            console.error('Failed to store tokens:', error);
        }
    }

    async getAccessToken(): Promise<string | null> {
        try {
            const token = await getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
            // console.log('[API] Get Access Token:', token ? `Found (${token.substring(0, 10)}...)` : 'Missing');
            return token;
        } catch (error) {
            console.error('Failed to get access token:', error);
            return null;
        }
    }

    async getRefreshToken(): Promise<string | null> {
        try {
            return await getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        } catch (error) {
            console.error('Failed to get refresh token:', error);
            return null;
        }
    }

    async clearTokens(): Promise<void> {
        try {
            await deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
            await deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        } catch (error) {
            console.error('Failed to clear tokens:', error);
        }
    }

    // Fetch with simplified auth handling (No auto-refresh loop)
    private async fetchWithAuth<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const accessToken = await this.getAccessToken();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options?.headers as Record<string, string> || {})
        };

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        } else {
            console.warn(`[API] Warning: Request to ${endpoint} missing Access Token`);
        }

        // Sanitize endpoint to prevent double-prefixing
        let sanitizedEndpoint = endpoint;
        if (sanitizedEndpoint.startsWith('/v1/mobile')) {
            sanitizedEndpoint = sanitizedEndpoint.replace('/v1/mobile', '');
        }

        const url = `${this.baseURL}${sanitizedEndpoint}`;

        try {
            console.log(`[API] Requesting: ${url}`);
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Handle 401 - Immediate Logout (Simplified Strategy)
            if (response.status === 401) {
                if (this.isLoggingOut) {
                    console.log(`[API] 401 at ${url} - Logout already in progress. Debouncing.`);
                    // Return empty object or throw handled error to prevent crashes
                    throw new Error('Session expired (Debounced).');
                }

                console.warn(`[API] 401 Unauthorized at ${url} - Triggering Logout`);
                this.isLoggingOut = true;

                await this.clearTokens();
                useAuthStore.getState().reset();
                router.replace('/(auth)/login');

                // Reset flag after delay
                setTimeout(() => { this.isLoggingOut = false; }, 3000);

                throw new Error('Session expired. Please login again.');
            }

            if (!response.ok) {
                console.error(`API Error ${response.status} at ${url}: ${response.statusText}`);
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = typeof errorData.error === 'string'
                    ? errorData.error
                    : (errorData.error?.message || errorData.message || `API Error: ${response.status} ${response.statusText}`);

                throw new Error(errorMessage);
            }

            const data = await response.json();
            return data.data || data; // Handle both v1 (data wrapper) and legacy formats

        } catch (error) {
            // Rethrow unless it's a debounced error we want to swallow UI-wise
            const msg = error instanceof Error ? error.message : String(error);
            if (msg.includes('Debounced')) {
                // Swallow debounced errors to prevent UI toast spam
                return {} as T;
            }
            throw error;
        }
    }

    // Generic POST method
    async post<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
        return this.fetchWithAuth<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    // Authentication
    async login(phone: string, password: string): Promise<LoginResponse> {
        const url = `${this.baseURL}/auth/login`;
        try {
            console.log(`[API] Attempting login at: ${url}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password }),
            });

            const text = await response.text();

            let data: any;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('JSON Parse Error. Raw response:', text);
                throw new Error(`Server returned non-JSON response. First 100 chars: ${text.substring(0, 100)}`);
            }

            if (!response.ok) {
                throw new Error(data.error || `Login failed: ${response.status} ${response.statusText}`);
            }

            // Store tokens if present (new JWT flow)
            // Note: server response is { accessToken, refreshToken, user, success }
            if (data.accessToken && data.refreshToken) {
                await this.storeTokens(data.accessToken, data.refreshToken);
            } else if (data.token && data.refreshToken) {
                // Secondary check for 'token' alias if server sends that
                await this.storeTokens(data.token, data.refreshToken);
            }

            return data;
        } catch (error: any) {
            console.error('Login Error:', error);
            throw error;
        }
    }

    async changePassword(phone: string, newPassword: string): Promise<any> {
        return this.post('/auth/change-password', { phone, newPassword });
    }

    async changePasswordStaff(phone: string, newPassword: string, oldPassword?: string): Promise<any> {
        return this.post('/auth/change-password-staff', { phone, newPassword, oldPassword });
    }

    // Parent Methods (V1 API)
    async getChildren(): Promise<Child[]> {
        const data = await this.fetchWithAuth<{ children: any[] }>('/parent/children');
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
            `/parent/child/${childId}/attendance?days=${days}`
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
            `/parent/child/${childId}/activities?limit=20`
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

    async getStudentFees(childId: number): Promise<any> {
        return this.fetchWithAuth(`/parent/child/${childId}/fees`);
    }

    async getTodayAttendance(childId: number): Promise<Attendance | null> {
        try {
            const allAttendance = await this.getAttendance(childId, 1);
            if (allAttendance.length > 0) {
                const latest = allAttendance[0];
                const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // Force IST check
                const recordDate = latest.date.split('T')[0];

                if (recordDate === today) {
                    return latest;
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async getAnnouncements(organizationId: number): Promise<Announcement[]> {
        const data = await this.fetchWithAuth<{ announcements: any[] }>(
            `/parent/announcements?limit=10`
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
            `/parent/events`
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



    // Teacher Methods (V1 API)
    async getTeacherDashboard(): Promise<any> {
        return await this.fetchWithAuth('/teacher/dashboard');
    }

    async getTeacherStudents(classFilter?: string): Promise<any[]> {
        const queryParam = classFilter ? `?class=${encodeURIComponent(classFilter)}` : '';
        const data = await this.fetchWithAuth<{ students: any[] }>(
            `/teacher/students${queryParam}`
        );
        return data.students || [];
    }

    async markAttendanceBulk(attendanceRecords: Array<{ leadId: number; status: string; checkInTime?: string }>): Promise<any> {
        return await this.fetchWithAuth('/teacher/attendance/bulk', {
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
        return await this.fetchWithAuth('/teacher/activity', {
            method: 'POST',
            body: JSON.stringify({
                leadId,
                content,
                ...options
            })
        });
    }

    async uploadMedia(base64Image: string): Promise<string> {
        const data = await this.fetchWithAuth<{ success: boolean; url: string }>('/mobile/media/upload', {
            method: 'POST',
            body: JSON.stringify({
                image: base64Image,
                folder: 'activities'
            })
        });
        return data.url;
    }

    async getTodayAttendanceAll(): Promise<any> {
        return await this.fetchWithAuth('/teacher/attendance/today');
    }

    async getStudentAttendanceHistory(studentId: number, days: number = 30): Promise<any[]> {
        const data = await this.fetchWithAuth<any[]>(
            `/teacher/student/${studentId}/attendance?days=${days}`
        );
        console.log('Attendance History Response:', JSON.stringify(data, null, 2));
        // fetchWithAuth already unwraps 'data' property if present
        return (Array.isArray(data) ? data : []).map((a: any) => ({
            id: a.id,
            date: a.date,
            status: a.status,
            checkInTime: a.check_in_time,
            markedBy: a.marked_by
        }));
    }

    async getOrganizationHolidays(): Promise<any[]> {
        const data = await this.fetchWithAuth<{ holidays: any[] }>(
            '/teacher/holidays'
        );
        return (data.holidays || []).map((h: any) => ({
            date: h.holiday_date,
            name: h.holiday_name,
            isRepeating: h.is_repeating
        }));
    }

    // Driver Methods (V1 API)
    async getDriverDashboard(): Promise<any> {
        return await this.fetchWithAuth('/driver/dashboard');
    }

    async updateBusLocation(routeId: number, latitude: number, longitude: number, speed?: number, heading?: number): Promise<any> {
        return await this.fetchWithAuth('/driver/location', {
            method: 'POST',
            body: JSON.stringify({ routeId, latitude, longitude, speed, heading })
        });
    }

    async startTrip(routeId: number): Promise<any> {
        return await this.fetchWithAuth('/driver/trip/start', {
            method: 'POST',
            body: JSON.stringify({ routeId })
        });
    }

    async endTrip(sessionId: number): Promise<any> {
        return await this.fetchWithAuth('/driver/trip/end', {
            method: 'POST',
            body: JSON.stringify({ sessionId })
        });
    }

    async getActiveTrip(): Promise<any> {
        return await this.fetchWithAuth('/driver/trip/active');
    }

    async updateStudentTripStatus(studentId: number, sessionId: number, routeId: number, status: 'boarded' | 'dropped' | 'pending'): Promise<any> {
        return await this.fetchWithAuth('/driver/student-status', {
            method: 'POST',
            body: JSON.stringify({ studentId, sessionId, routeId, status })
        });
    }

    // Parent Bus Tracking Methods
    async getBusLocation(studentId: number): Promise<any> {
        return await this.fetchWithAuth(`/parent/child/${studentId}/bus-assignment`);
    }

    async getLiveBusLocation(routeId: number, studentId?: number): Promise<any> {
        let url = `/parent/bus/${routeId}/live-location`;
        if (studentId) {
            url += `?studentId=${studentId}`;
        }
        return await this.fetchWithAuth(url);
    }

    // Generic GET method for flexibility
    async get<T = any>(endpoint: string): Promise<T> {
        return await this.fetchWithAuth<T>(endpoint);
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

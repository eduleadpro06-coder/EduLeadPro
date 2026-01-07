import { Platform } from 'react-native';

// API Service for Mobile App
// Web (Production): Use relative path to leverage Vercel Rewrites (Same Domain)
// Native/Dev: Use direct URL (Backend must be up)
const IS_WEB_PROD = Platform.OS === 'web' && process.env.NODE_ENV === 'production';
const API_BASE_URL = IS_WEB_PROD
    ? '/api/mobile'
    : 'https://edu-lead-pro.vercel.app/api/mobile';


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

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    private async fetch<T>(endpoint: string): Promise<T> {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API Error: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch ${endpoint}:`, error);
            throw error;
        }
    }

    // Get parent's enrolled children
    async getChildren(parentEmail: string): Promise<Child[]> {
        const data = await this.fetch<{ children: any[] }>(`/children/${parentEmail}`);
        return (data.children || []).map(s => ({
            id: s.id,
            name: s.name,
            class: s.class,
            email: s.email,
            parentName: s.parent_name || s.parentName,
            phone: s.phone,
            status: s.status
        }));
    }

    // Get daily updates for a student
    async getDailyUpdates(leadId: number): Promise<DailyUpdate[]> {
        const data = await this.fetch<{ updates: any[] }>(`/daily-updates/${leadId}`);
        return (data.updates || []).map(u => ({
            id: u.id,
            title: u.title,
            content: u.content,
            mediaUrls: u.media_urls || [],
            activityType: u.activity_type,
            mood: u.mood,
            teacherName: u.teacher_name,
            postedAt: u.posted_at
        }));
    }

    // Get homework for a class
    async getHomework(className: string): Promise<Homework[]> {
        const data = await this.fetch<{ homework: any[] }>(`/homework/${encodeURIComponent(className)}`);
        return (data.homework || []).map(h => ({
            id: h.id,
            className: h.class_name,
            subject: h.subject,
            title: h.title,
            description: h.description,
            dueDate: h.due_date,
            teacherName: h.teacher_name
        }));
    }

    // Get attendance history
    async getAttendance(leadId: number, days: number = 30): Promise<Attendance[]> {
        const data = await this.fetch<{ attendance: any[] }>(`/attendance/${leadId}?days=${days}`);
        return (data.attendance || []).map(a => ({
            id: a.id,
            date: a.date,
            status: a.status,
            checkInTime: a.check_in_time,
            checkOutTime: a.check_out_time
        }));
    }

    // Get today's attendance
    async getTodayAttendance(leadId: number): Promise<Attendance | null> {
        const data = await this.fetch<{ attendance: any | null }>(`/today-attendance/${leadId}`);
        if (!data.attendance) return null;
        const a = data.attendance;
        return {
            id: a.id,
            date: a.date,
            status: a.status,
            checkInTime: a.check_in_time,
            checkOutTime: a.check_out_time
        };
    }

    // Get announcements
    async getAnnouncements(organizationId: number): Promise<Announcement[]> {
        const data = await this.fetch<{ announcements: any[] }>(`/announcements?organizationId=${organizationId}`);
        return (data.announcements || []).map(a => ({
            id: a.id,
            title: a.title,
            content: a.content,
            priority: a.priority,
            publishedAt: a.published_at
        }));
    }

    // Get upcoming events
    async getEvents(organizationId: number): Promise<Event[]> {
        const data = await this.fetch<{ events: any[] }>(`/events?organizationId=${organizationId}`);
        return (data.events || []).map(e => ({
            id: e.id,
            title: e.title,
            description: e.description,
            eventDate: e.event_date,
            eventTime: e.event_time,
            eventType: e.event_type
        }));
    }

    async login(phone: string, password: string): Promise<LoginResponse> {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password }),
        });
        const data = await response.json();
        if (data.students) {
            data.students = data.students.map((s: any) => ({
                id: s.id,
                name: s.name,
                class: s.class,
                status: s.status,
                parentName: s.parent_name || s.parentName,
                phone: s.phone
            }));
        }
        return data;
    }

    async changePassword(phone: string, newPassword: string): Promise<any> {
        const res = await fetch(`${this.baseURL}/auth/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, newPassword }),
        });
        return res.json();
    }

    async changePasswordStaff(phone: string, newPassword: string, oldPassword?: string): Promise<any> {
        const res = await fetch(`${this.baseURL}/api/mobile/auth/change-password-staff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, newPassword, oldPassword }),
        });
        return res.json();
    }

    // Teacher Methods
    async getTeacherDashboard(staffId: number): Promise<any> {
        const response = await fetch(`${this.baseURL}/teacher/dashboard/${staffId}`);
        return await response.json();
    }

    async markAttendance(leadId: number, status: string, checkInTime: string, markedBy: string, organizationId: number): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${this.baseURL}/attendance/mark`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId, status, checkInTime, markedBy, organizationId }),
        });
        return await response.json();
    }

    // Driver Methods
    async getDriverDashboard(staffId: number): Promise<any> {
        const response = await fetch(`${this.baseURL}/driver/dashboard/${staffId}`);
        return await response.json();
    }

    async updateBusLocation(routeId: number, latitude: number, longitude: number, speed?: number, heading?: number): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${this.baseURL}/bus-location/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ routeId, latitude, longitude, speed, heading }),
        });
        return await response.json();
    }

    // Parent Live Data Methods
    async getBusLocation(leadId: number): Promise<any> {
        const response = await fetch(`${this.baseURL}/bus-location/${leadId}`);
        return await response.json();
    }

    async getParentMessages(leadId: number): Promise<any[]> {
        const response = await fetch(`${this.baseURL}/parent-messages/${leadId}`);
        return await response.json();
    }
}

export const api = new APIService();

export interface LoginResponse {
    success?: boolean;
    error?: string;
    user?: any;
    students?: Child[];
    requiresPasswordChange?: boolean;
}

/**
 * Teacher-specific types
 */

export interface TeacherDashboard {
    teacher: {
        id: number;
        name: string;
        role: string;
    };
    todayAttendance: AttendanceRecord[];
    recentUpdates: DailyUpdate[];
    students: StudentInfo[];
}

export interface AttendanceRecord {
    lead_id: number;
    status: 'present' | 'absent' | 'late';
    check_in_time?: string;
    marked_at?: string;
}

export interface StudentInfo {
    id: number;
    name: string;
    class: string;
}

export interface DailyUpdate {
    id: number;
    lead_id: number;
    activity_type: string;
    content: string;
    posted_at: string;
    media_url?: string;
}

export interface MarkAttendanceRequest {
    leadId: number;
    status: 'present' | 'absent' | 'late';
    checkInTime?: string;
    markedBy: string;
    organizationId: number;
}

export interface PostUpdateRequest {
    leadIds: number[];
    activityType: string;
    content: string;
    mediaUrl?: string;
    teacherName: string;
    organizationId: number;
}

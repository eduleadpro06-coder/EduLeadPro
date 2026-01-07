/**
 * Mobile API v1 - Teacher Endpoints
 * Handles all teacher-facing mobile app functionality
 */

import express, { Request, Response } from 'express';
import { jwtMiddleware, roleGuard } from '../../middleware/auth.js';

const router = express.Router();

// Apply JWT middleware and role guard to all teacher routes
router.use(jwtMiddleware);
router.use(roleGuard(['teacher']));

/**
 * GET /api/v1/mobile/teacher/dashboard
 * Get teacher dashboard summary
 */
router.get('/dashboard', async (req: Request, res: Response) => {
    try {
        const staffId = req.user!.userId;
        const organizationId = req.user!.organizationId;

        const { supabase } = await import('../../supabase.js');

        // Get teacher info
        const { data: teacher } = await supabase
            .from('staff')
            .select('id, name, role')
            .eq('id', staffId)
            .single();

        // Get today's date
        const today = new Date().toISOString().split('T')[0];

        // Get today's attendance summary
        const { data: todayAttendance } = await supabase
            .from('student_attendance')
            .select('lead_id, status')
            .eq('organization_id', organizationId)
            .eq('date', today);

        // Count present/absent/not marked
        const attendanceSummary = {
            present: todayAttendance?.filter(a => a.status === 'present').length || 0,
            absent: todayAttendance?.filter(a => a.status === 'absent').length || 0,
            total: todayAttendance?.length || 0
        };

        // Get enrolled students count
        const { count: studentsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('status', 'enrolled');

        // Get recent activities posted by this teacher
        const { data: recentActivities } = await supabase
            .from('daily_updates')
            .select('id, lead_id, activity_type, title, posted_at')
            .eq('organization_id', organizationId)
            .eq('teacher_name', teacher?.name || '')
            .order('posted_at', { ascending: false })
            .limit(5);

        res.json({
            success: true,
            data: {
                teacher: teacher || { name: 'Teacher', role: 'teacher' },
                attendance: attendanceSummary,
                studentsCount: studentsCount || 0,
                recentActivities: recentActivities || []
            }
        });
    } catch (error) {
        console.error('[Mobile API] Teacher dashboard error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DASHBOARD_ERROR',
                message: 'Failed to fetch dashboard data'
            }
        });
    }
});

/**
 * GET /api/v1/mobile/teacher/students
 * Get students assigned to teacher
 */
router.get('/students', async (req: Request, res: Response) => {
    try {
        const organizationId = req.user!.organizationId;
        const classFilter = req.query.class as string;

        const { supabase } = await import('../../supabase.js');

        let query = supabase
            .from('leads')
            .select('id, name, class, parent_name, parent_phone')
            .eq('organization_id', organizationId)
            .eq('status', 'enrolled')
            .order('class', { ascending: true });

        if (classFilter) {
            query = query.eq('class', classFilter);
        }

        const { data: students, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: {
                students: students || []
            }
        });
    } catch (error) {
        console.error('[Mobile API] Get students error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_STUDENTS_ERROR',
                message: 'Failed to fetch students'
            }
        });
    }
});

/**
 * POST /api/v1/mobile/teacher/attendance/bulk
 * Mark attendance for multiple students
 */
router.post('/attendance/bulk', async (req: Request, res: Response) => {
    try {
        const { attendanceRecords } = req.body;
        // attendanceRecords: [{ leadId, status, checkInTime? }]

        if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'attendanceRecords array is required'
                }
            });
        }

        const organizationId = req.user!.organizationId;
        const markedBy = req.user!.username;
        const today = new Date().toISOString().split('T')[0];

        const { supabase } = await import('../../supabase.js');

        // Process each attendance record
        const results = [];
        for (const record of attendanceRecords) {
            const { leadId, status, checkInTime } = record;

            // Check if attendance already exists for today
            const { data: existing } = await supabase
                .from('student_attendance')
                .select('id')
                .eq('lead_id', leadId)
                .eq('date', today)
                .single();

            if (existing) {
                // Update existing
                const { error } = await supabase
                    .from('student_attendance')
                    .update({
                        status,
                        check_in_time: checkInTime || null,
                        marked_by: markedBy,
                        marked_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);

                results.push({
                    leadId,
                    success: !error,
                    action: 'updated'
                });
            } else {
                // Create new
                const { error } = await supabase
                    .from('student_attendance')
                    .insert({
                        organization_id: organizationId,
                        lead_id: leadId,
                        date: today,
                        status,
                        check_in_time: checkInTime || null,
                        marked_by: markedBy,
                        marked_at: new Date().toISOString()
                    });

                results.push({
                    leadId,
                    success: !error,
                    action: 'created'
                });
            }
        }

        const successCount = results.filter(r => r.success).length;

        res.json({
            success: true,
            data: {
                totalProcessed: results.length,
                successCount,
                failureCount: results.length - successCount,
                results
            }
        });
    } catch (error) {
        console.error('[Mobile API] Bulk attendance error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'BULK_ATTENDANCE_ERROR',
                message: 'Failed to mark bulk attendance'
            }
        });
    }
});

/**
 * POST /api/v1/mobile/teacher/activity
 * Post a daily activity update
 */
router.post('/activity', async (req: Request, res: Response) => {
    try {
        const {
            leadId,
            title,
            content,
            activityType,
            mood,
            mediaUrls
        } = req.body;

        if (!leadId || !content) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'leadId and content are required'
                }
            });
        }

        const organizationId = req.user!.organizationId;

        // Get teacher name from staff table
        const { supabase } = await import('../../supabase.js');
        const { data: teacher } = await supabase
            .from('staff')
            .select('name')
            .eq('id', req.user!.userId)
            .single();

        // Insert daily update
        const { data: activity, error } = await supabase
            .from('daily_updates')
            .insert({
                organization_id: organizationId,
                lead_id: leadId,
                title: title || 'Activity Update',
                content,
                activity_type: activityType || 'general',
                mood: mood || 'happy',
                teacher_name: teacher?.name || 'Teacher',
                media_urls: mediaUrls || [],
                posted_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: {
                activity
            }
        });
    } catch (error) {
        console.error('[Mobile API] Post activity error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'POST_ACTIVITY_ERROR',
                message: 'Failed to post activity'
            }
        });
    }
});

/**
 * GET /api/v1/mobile/teacher/attendance/today
 * Get today's attendance status for all students
 */
router.get('/attendance/today', async (req: Request, res: Response) => {
    try {
        const organizationId = req.user!.organizationId;
        const today = new Date().toISOString().split('T')[0];

        const { supabase } = await import('../../supabase.js');

        // Get all enrolled students
        const { data: students } = await supabase
            .from('leads')
            .select('id, name, class')
            .eq('organization_id', organizationId)
            .eq('status', 'enrolled')
            .order('class', { ascending: true });

        // Get today's attendance
        const { data: attendanceRecords } = await supabase
            .from('student_attendance')
            .select('lead_id, status, check_in_time')
            .eq('organization_id', organizationId)
            .eq('date', today);

        // Map attendance to students
        const attendanceMap = new Map(
            (attendanceRecords || []).map(a => [a.lead_id, a])
        );

        const studentsWithAttendance = (students || []).map(student => ({
            ...student,
            attendance: attendanceMap.get(student.id) || null
        }));

        res.json({
            success: true,
            data: {
                date: today,
                students: studentsWithAttendance
            }
        });
    } catch (error) {
        console.error('[Mobile API] Get today attendance error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_TODAY_ATTENDANCE_ERROR',
                message: 'Failed to fetch today\'s attendance'
            }
        });
    }
});

export default router;

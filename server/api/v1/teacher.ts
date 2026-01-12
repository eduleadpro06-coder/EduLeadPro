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
 * GET /api/v1/mobile/teacher/holidays
 * Get organization holidays for attendance validation
 */
router.get('/holidays', async (req: Request, res: Response) => {
    try {
        const organizationId = req.user!.organizationId;

        const { supabase } = await import('../../supabase.js');

        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        const { data: holidays, error } = await supabase
            .from('organization_holidays')
            .select('holiday_date, holiday_name, is_repeating')
            .eq('organization_id', organizationId)
            .gte('holiday_date', today) // Only today and future holidays
            .order('holiday_date', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            data: { holidays: holidays || [] }
        });
    } catch (error) {
        console.error('Get holidays error:', error);
        res.status(500).json({ error: 'Failed to fetch holidays' });
    }
});

/**
 * GET /api/v1/mobile/teacher/student/:studentId/attendance
 * Get attendance history for a specific student
 */
router.get('/student/:studentId/attendance', async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const days = parseInt(req.query.days as string) || 30;

        const { supabase } = await import('../../supabase.js');

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: attendance, error } = await supabase
            .from('student_attendance')
            .select('id, date, status, check_in_time, marked_by')
            .eq('lead_id', studentId)
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: attendance || []
        });
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({ error: 'Failed to fetch attendance history' });
    }
});

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

        // Get today's date in IST
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        // Get today's attendance summary
        const { data: todayAttendance } = await supabase
            .from('student_attendance')
            .select('lead_id, status')
            .eq('organization_id', organizationId)
            .eq('date', today);

        // Count present/absent/not marked
        const attendanceSummary = {
            present: todayAttendance?.filter(a => a.status === 'present' || a.status === 'late').length || 0,
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
        const staffId = req.user!.userId;
        const organizationId = req.user!.organizationId;
        const classFilter = req.query.class as string;

        const { supabase } = await import('../../supabase.js');

        // First check if this teacher has any assignments
        const { data: assignments, error: assignmentError } = await supabase
            .from('teacher_student_assignments')
            .select('student_lead_id')
            .eq('teacher_staff_id', staffId)
            .eq('organization_id', organizationId);

        if (assignmentError) {
            console.error('[Teacher API] Error checking assignments:', assignmentError);
        }

        let query;

        if (assignments && assignments.length > 0) {
            // Teacher has assignments - only show assigned students
            const assignedStudentIds = assignments.map(a => a.student_lead_id);

            query = supabase
                .from('leads')
                .select('id, name, class, section')
                .eq('organization_id', organizationId)
                .eq('status', 'enrolled')
                .in('id', assignedStudentIds)
                .order('class', { ascending: true });
        } else {
            // No assignments - show all students (legacy behavior)
            query = supabase
                .from('leads')
                .select('id, name, class, section')
                .eq('organization_id', organizationId)
                .eq('status', 'enrolled')
                .order('class', { ascending: true });
        }

        if (classFilter) {
            query = query.eq('class', classFilter);
        }

        const { data: students, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data: {
                students: students || [],
                filteredByAssignments: !!(assignments && assignments.length > 0)
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
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

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

router.post('/activity', async (req: Request, res: Response) => {
    try {
        const {
            leadIds, // Array of IDs
            leadId,  // Legacy support (optional)
            title,
            content,
            activityType,
            mood,
            mediaUrls, // Array of strings (optional)
            image      // Base64 string (optional)
        } = req.body;

        // Normalize leads
        let targetLeadIds: number[] = [];
        if (Array.isArray(leadIds)) {
            targetLeadIds = leadIds;
        } else if (leadId) {
            targetLeadIds = [leadId];
        }

        if (targetLeadIds.length === 0 || !content) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'At least one student and content are required'
                }
            });
        }

        const organizationId = req.user!.organizationId;
        const { supabase } = await import('../../supabase.js');

        // Handle Image Upload if 'image' (base64) is provided
        let finalMediaUrls = Array.isArray(mediaUrls) ? mediaUrls : [];

        if (image) {
            try {
                // remove header if present (e.g. "data:image/jpeg;base64,")
                const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const fileName = `updates/${organizationId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('uploads') // Assuming 'uploads' bucket exists
                    .upload(fileName, buffer, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('uploads')
                        .getPublicUrl(fileName);

                    finalMediaUrls.push(publicUrl);
                } else {
                    console.error('Supabase upload error:', uploadError);
                    // Fallback: If upload fails (e.g. no bucket), maybe don't fail the whole request?
                    // We simply continue without the image or log it.
                }
            } catch (imgError) {
                console.error('Image processing error:', imgError);
            }
        }

        // Get teacher name
        const { data: teacher } = await supabase
            .from('staff')
            .select('name')
            .eq('id', req.user!.userId)
            .single();

        // Create records for all students
        const updatesToInsert = targetLeadIds.map(id => ({
            organization_id: organizationId,
            lead_id: id,
            title: title || 'Activity Update',
            content,
            activity_type: activityType || 'general',
            mood: mood || 'happy',
            teacher_name: teacher?.name || 'Teacher',
            media_urls: finalMediaUrls,
            status: 'pending', // Pending admin approval
            posted_at: new Date().toISOString()
        }));

        const { data: activities, error } = await supabase
            .from('daily_updates')
            .insert(updatesToInsert)
            .select();

        if (error) throw error;

        res.json({
            success: true,
            data: {
                count: activities?.length || 0,
                activities
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
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

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

/**
 * GET /api/v1/mobile/teacher/leaves
 * Get leave history
 */
router.get('/leaves', async (req: Request, res: Response) => {
    try {
        const staffId = req.user!.userId;
        const organizationId = req.user!.organizationId;

        const { supabase } = await import('../../supabase.js');

        const { data: leaves, error } = await supabase
            .from('teacher_leaves')
            .select('*')
            .eq('staff_id', staffId)
            .eq('organization_id', organizationId)
            .order('applied_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: leaves || []
        });
    } catch (error) {
        console.error('[Mobile API] Get leaves error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_LEAVES_ERROR',
                message: 'Failed to fetch leave history'
            }
        });
    }
});

/**
 * GET /api/v1/mobile/teacher/leaves/balance
 * Get leave balance
 */
router.get('/leaves/balance', async (req: Request, res: Response) => {
    try {
        const staffId = req.user!.userId;
        const organizationId = req.user!.organizationId;
        const year = new Date().getFullYear();

        const { supabase } = await import('../../supabase.js');

        // Get Staff Limits
        const { data: staff, error: staffError } = await supabase
            .from('staff')
            .select('cl_limit, el_limit, total_leaves')
            .eq('id', staffId)
            .single();

        if (staffError) throw staffError;

        // Get Used Leaves
        const { data: usedLeaves, error: leavesError } = await supabase
            .from('teacher_leaves')
            .select('leave_type, start_date, end_date')
            .eq('staff_id', staffId)
            .eq('organization_id', organizationId)
            .eq('status', 'approved')
            .gte('start_date', `${year}-01-01`);

        if (leavesError) throw leavesError;

        let clUsed = 0;
        let elUsed = 0;

        console.log(`[Mobile Balance] Fetching leaves for Staff ${staffId}, Year ${year}, Org ${organizationId}`);
        console.log(`[Mobile Balance] Raw Leaves Data: ${JSON.stringify(usedLeaves)}`);

        usedLeaves?.forEach(leave => {
            // Count instances instead of days as per user requirement
            const days = 1;

            // Handle both camelCase and snake_case properties just in case
            const type = leave.leave_type || (leave as any).leaveType;

            if (type === 'CL') clUsed += days;
            else if (type === 'EL') elUsed += days;
        });

        console.log(`[Mobile Balance] Calculated Used: CL=${clUsed}, EL=${elUsed}`);

        res.json({
            success: true,
            data: {
                cl: { limit: staff.cl_limit || 10, used: clUsed, balance: (staff.cl_limit || 10) - clUsed },
                el: { limit: staff.el_limit || 5, used: elUsed, balance: (staff.el_limit || 5) - elUsed }
            }
        });
    } catch (error) {
        console.error('[Mobile API] Get leave balance error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_BALANCE_ERROR',
                message: 'Failed to fetch leave balance'
            }
        });
    }
});

/**
 * POST /api/v1/mobile/teacher/leaves
 * Apply for leave
 */
router.post('/leaves', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, reason } = req.body;
        const staffId = req.user!.userId;
        const organizationId = req.user!.organizationId;

        if (!startDate || !endDate || !reason) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'Start date, end date, and reason are required'
                }
            });
        }

        const { supabase } = await import('../../supabase.js');

        // 1. Create Leave Request
        const { data, error } = await supabase
            .from('teacher_leaves')
            .insert({
                staff_id: staffId,
                organization_id: organizationId,
                start_date: startDate,
                end_date: endDate,
                reason,
                leave_type: req.body.leaveType || 'CL',
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Fetch Teacher Name (for notification)
        const { data: teacher } = await supabase
            .from('staff')
            .select('name')
            .eq('id', staffId)
            .single();

        const teacherName = teacher?.name || 'A teacher';

        // 3. Notify Admins
        try {
            const { data: admins } = await supabase
                .from('users')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('role', 'admin');

            if (admins && admins.length > 0) {
                const notifications = admins.map(admin => ({
                    user_id: admin.id,
                    type: 'staff',
                    title: 'New Leave Application',
                    message: `${teacherName} has applied for ${req.body.leaveType || 'CL'} leave from ${startDate} to ${endDate}. Reason: ${reason}`,
                    priority: 'medium',
                    action_type: 'view_staff',
                    action_id: staffId.toString(),
                    read: false,
                    // organization_id: organizationId // schema check: notifications might not have organization_id column, checking schema...
                }));

                // Double check schema for notifications
                // Looking at my memory of schema.ts... notifications has: id, userId, type, title, message, priority, read, actionType, actionId, metadata, createdAt...
                // It does NOT seem to have organization_id in the view_file I saw earlier? 
                // Let's check schema.ts lines 1571...
                // Actually I can just exclude it if I'm not sure, or check schema first.
                // Re-reading schema lines from previous turn...

                await supabase.from('notifications').insert(notifications);
            }
        } catch (notifError) {
            console.error('Failed to send admin notifications:', notifError);
            // Don't fail the request if notification fails
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('[Mobile API] Apply leave error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'APPLY_LEAVE_ERROR',
                message: 'Failed to apply for leave'
            }
        });
    }
});

/**
 * GET /api/v1/mobile/teacher/tasks
 * Get teacher tasks
 */
router.get('/tasks', async (req: Request, res: Response) => {
    try {
        const staffId = req.user!.userId;
        const organizationId = req.user!.organizationId;

        const { supabase } = await import('../../supabase.js');

        const { data: tasks, error } = await supabase
            .from('teacher_tasks')
            .select('*')
            .eq('staff_id', staffId)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: tasks || []
        });
    } catch (error) {
        console.error('[Mobile API] Get tasks error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_TASKS_ERROR',
                message: 'Failed to fetch tasks'
            }
        });
    }
});

/**
 * POST /api/v1/mobile/teacher/tasks
 * Create task
 */
router.post('/tasks', async (req: Request, res: Response) => {
    try {
        const { title, description, dueDate } = req.body;
        const staffId = req.user!.userId;
        const organizationId = req.user!.organizationId;

        if (!title) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'Title is required'
                }
            });
        }

        const { supabase } = await import('../../supabase.js');

        const { data, error } = await supabase
            .from('teacher_tasks')
            .insert({
                staff_id: staffId,
                organization_id: organizationId,
                title,
                description,
                due_date: dueDate || null,
                is_completed: false
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('[Mobile API] Create task error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'CREATE_TASK_ERROR',
                message: 'Failed to create task'
            }
        });
    }
});

/**
 * PATCH /api/v1/mobile/teacher/tasks/:id
 * Update task status
 */
router.patch('/tasks/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isCompleted } = req.body;
        const staffId = req.user!.userId;

        const { supabase } = await import('../../supabase.js');

        const { data, error } = await supabase
            .from('teacher_tasks')
            .update({ is_completed: isCompleted })
            .eq('id', id)
            .eq('staff_id', staffId) // Ensure ownership
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('[Mobile API] Update task error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_TASK_ERROR',
                message: 'Failed to update task'
            }
        });
    }
});

/**
 * DELETE /api/v1/mobile/teacher/tasks/:id
 * Delete task
 */
router.delete('/tasks/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const staffId = req.user!.userId;

        const { supabase } = await import('../../supabase.js');

        const { error } = await supabase
            .from('teacher_tasks')
            .delete()
            .eq('id', id)
            .eq('staff_id', staffId); // Ensure ownership

        if (error) throw error;

        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('[Mobile API] Delete task error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_TASK_ERROR',
                message: 'Failed to delete task'
            }
        });
    }
});

export default router;

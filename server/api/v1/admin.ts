/**
 * Mobile API v1 - Admin Endpoints
 * Handles admin-facing mobile features for counselors, directors, and staff
 */

import express, { Request, Response } from 'express';
import { jwtMiddleware, roleGuard } from '../../middleware/auth.js';

const router = express.Router();

// Apply JWT middleware and role guard — counselors, staff, directors can access
router.use(jwtMiddleware);
router.use(roleGuard(['counselor', 'staff', 'director', 'admin', 'principal']));

/**
 * GET /api/v1/mobile/admin/dashboard
 * Admin dashboard KPI summary
 */
router.get('/dashboard', async (req: Request, res: Response) => {
    try {
        const organizationId = req.user!.organizationId;
        const { supabase } = await import('../../supabase.js');

        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        // 1. Total enrolled students
        const { count: totalStudents } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('status', 'enrolled');

        // 2. Today's attendance count
        const { count: markedToday } = await supabase
            .from('student_attendance')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('date', today);

        // 3. Pending daily updates
        const { count: pendingUpdates } = await supabase
            .from('daily_updates')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('status', 'pending');

        // 4. Pending leave requests
        const { count: pendingLeaves } = await supabase
            .from('teacher_leaves')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('status', 'pending');

        // 5. Total active staff
        const { count: totalStaff } = await supabase
            .from('staff')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('is_active', true);

        const attendanceRate = (totalStudents && totalStudents > 0)
            ? Math.round(((markedToday || 0) / totalStudents) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                totalStudents: totalStudents || 0,
                markedToday: markedToday || 0,
                attendanceRate,
                pendingUpdates: pendingUpdates || 0,
                pendingLeaves: pendingLeaves || 0,
                totalStaff: totalStaff || 0,
            }
        });
    } catch (error) {
        console.error('[Admin API] Dashboard error:', error);
        res.status(500).json({ success: false, error: { code: 'DASHBOARD_ERROR', message: 'Failed to fetch admin dashboard' } });
    }
});

/**
 * GET /api/v1/mobile/admin/attendance-overview
 * Shows which teachers have marked attendance today
 */
router.get('/attendance-overview', async (req: Request, res: Response) => {
    try {
        const organizationId = req.user!.organizationId;
        const { supabase } = await import('../../supabase.js');

        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        // 1. Get all active teaching staff with their assignments
        const { data: allStaff } = await supabase
            .from('staff')
            .select('id, name, role, phone')
            .eq('organization_id', organizationId)
            .eq('is_active', true);

        if (!allStaff || allStaff.length === 0) {
            return res.json({ success: true, data: { teachers: [], summary: { total: 0, marked: 0, partial: 0, notMarked: 0 } } });
        }

        // 2. Get teacher-student assignments
        const { data: assignments } = await supabase
            .from('teacher_student_assignments')
            .select('teacher_staff_id, student_lead_id')
            .eq('organization_id', organizationId);

        // Build assignment map: teacherId -> [studentId, ...]
        const assignmentMap = new Map<number, number[]>();
        (assignments || []).forEach(a => {
            const existing = assignmentMap.get(a.teacher_staff_id) || [];
            existing.push(a.student_lead_id);
            assignmentMap.set(a.teacher_staff_id, existing);
        });

        // 3. Get today's attendance records
        const { data: todayRecords } = await supabase
            .from('student_attendance')
            .select('lead_id, marked_by')
            .eq('organization_id', organizationId)
            .eq('date', today);

        const markedLeadIds = new Set((todayRecords || []).map(r => r.lead_id));

        // 4. Build teacher overview — only include teachers with assignments
        const teachers = allStaff
            .filter(s => assignmentMap.has(s.id))
            .map(s => {
                const assignedStudents = assignmentMap.get(s.id) || [];
                const totalAssigned = assignedStudents.length;
                const markedCount = assignedStudents.filter(sid => markedLeadIds.has(sid)).length;

                let status: 'marked' | 'partial' | 'not_marked' = 'not_marked';
                if (markedCount >= totalAssigned && totalAssigned > 0) status = 'marked';
                else if (markedCount > 0) status = 'partial';

                return {
                    id: s.id,
                    name: s.name,
                    role: s.role,
                    totalAssigned,
                    markedCount,
                    status,
                };
            })
            .sort((a, b) => {
                // Sort: not_marked first, then partial, then marked
                const order = { not_marked: 0, partial: 1, marked: 2 };
                return order[a.status] - order[b.status];
            });

        const summary = {
            total: teachers.length,
            marked: teachers.filter(t => t.status === 'marked').length,
            partial: teachers.filter(t => t.status === 'partial').length,
            notMarked: teachers.filter(t => t.status === 'not_marked').length,
        };

        res.json({ success: true, data: { teachers, summary } });
    } catch (error) {
        console.error('[Admin API] Attendance overview error:', error);
        res.status(500).json({ success: false, error: { code: 'ATTENDANCE_OVERVIEW_ERROR', message: 'Failed to fetch attendance overview' } });
    }
});

/**
 * GET /api/v1/mobile/admin/daily-updates
 * Fetch daily updates with status filter
 */
router.get('/daily-updates', async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const organizationId = req.user!.organizationId;
        const { supabase } = await import('../../supabase.js');

        let query = supabase
            .from('daily_updates')
            .select(`
                *,
                student:leads!daily_updates_lead_id_fkey (
                    id, name, class, section
                )
            `)
            .eq('organization_id', organizationId)
            .order('posted_at', { ascending: false })
            .limit(100);

        if (status) {
            query = query.eq('status', status as string);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('[Admin API] Get daily updates error:', error);
        res.status(500).json({ success: false, error: { code: 'FETCH_UPDATES_ERROR', message: 'Failed to fetch daily updates' } });
    }
});

/**
 * PATCH /api/v1/mobile/admin/daily-updates/:id/status
 * Approve or reject a daily update
 */
router.patch('/daily-updates/:id/status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Status must be approved, rejected, or pending' } });
        }

        const { supabase } = await import('../../supabase.js');

        const { data, error } = await supabase
            .from('daily_updates')
            .update({
                status,
                rejection_reason: rejectionReason || null
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('[Admin API] Update status error:', error);
        res.status(500).json({ success: false, error: { code: 'UPDATE_STATUS_ERROR', message: 'Failed to update status' } });
    }
});

export default router;

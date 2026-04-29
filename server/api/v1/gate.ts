/**
 * Mobile API v1 - Gate Security Endpoints
 * Handles student check-in/out and visitor management
 */

import express, { Request, Response } from 'express';
import { jwtMiddleware, optionalJwtMiddleware, roleGuard } from '../../middleware/auth.js';
import { db } from '../../db.js';
import { studentGateLogs, visitorLogs, leads, staff } from '../../../shared/schema.js';
import { eq, and, sql, desc, or } from 'drizzle-orm';
import { getOrganizationId } from '../../utils.js';

const router = express.Router();

// NOTE: We don't apply global middleware here anymore because we need 
// to support both Mobile JWT and Web Session auth for history endpoints.
// Individual routes will apply the appropriate middleware.

/**
 * GET /api/v1/mobile/gate/students
 * Search students for gate check-in/out
 */
router.get('/students', jwtMiddleware, roleGuard(['security', 'support_staff', 'admin', 'care giver']), async (req: Request, res: Response) => {
    try {
        const organizationId = req.user!.organizationId;
        const search = (req.query.search as string || req.query.query as string || '').toLowerCase();

        const { supabase } = await import('../../supabase.js');

        // Fetch enrolled students
        let query = supabase
            .from('leads')
            .select('id, name, class, section, father_first_name, father_last_name, mother_first_name, mother_last_name, phone')
            .eq('organization_id', organizationId)
            .eq('status', 'enrolled');

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        const { data: students, error } = await query.limit(1000);

        if (error) throw error;

        // Fetch today's gate logs to show current status - Use IST
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        
        const { data: todayLogs } = await supabase
            .from('student_gate_logs')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('date', today);

        // Fetch active visitors count
        const { count: activeVisitors } = await supabase
            .from('visitor_logs')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('status', 'inside');

        // Map status to students
        const logsMap = new Map((todayLogs || []).map(log => [log.student_id, log]));

        const results = (students || []).map(student => ({
            ...student,
            gateStatus: logsMap.get(student.id) || null
        }));

        res.json({
            success: true,
            data: results,
            stats: {
                totalStudents: results.length,
                insideStudents: (todayLogs || []).filter(l => l.status === 'present').length,
                activeVisitors: activeVisitors || 0
            }
        });
    } catch (error) {
        console.error('[Gate API] Search students error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch students' });
    }
});

/**
 * GET /api/v1/mobile/gate/students/:id
 * Get specific student details for gate
 */
router.get('/students/:id', jwtMiddleware, roleGuard(['security', 'support_staff', 'admin', 'care giver']), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const organizationId = req.user!.organizationId;
        const { supabase } = await import('../../supabase.js');

        // 1. Fetch student details
        const { data: student, error: studentError } = await supabase
            .from('leads')
            .select('id, name, class, section, father_first_name, father_last_name, mother_first_name, mother_last_name, phone')
            .eq('id', id)
            .eq('organization_id', organizationId)
            .single();

        if (studentError) throw studentError;
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // 2. Fetch today's gate log (using IST to match other gate endpoints)
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const { data: gateStatus } = await supabase
            .from('student_gate_logs')
            .select('*')
            .eq('student_id', id)
            .eq('date', today)
            .maybeSingle();

        res.json({
            success: true,
            data: {
                ...student,
                gateStatus: gateStatus || null
            }
        });
    } catch (error) {
        console.error('[Gate API] Get student details error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch student details' });
    }
});

/**
 * POST /api/v1/mobile/gate/sync
 * Sync offline check-in/out logs
 */
router.post('/sync', jwtMiddleware, roleGuard(['security', 'support_staff', 'admin', 'care giver']), async (req: Request, res: Response) => {
    try {
        const { logs } = req.body; // Array of log objects
        if (!Array.isArray(logs)) {
            return res.status(400).json({ success: false, message: 'Invalid logs format' });
        }

        const organizationId = req.user!.organizationId;
        const staffId = req.user!.userId;
        const { supabase } = await import('../../supabase.js');

        console.log(`[Gate Sync] Processing ${logs.length} logs for Org: ${organizationId}, Staff: ${staffId}`);

        const results = [];

        for (const log of logs) {
            const rawStudentId = log.student_id || log.studentId;
            const studentId = typeof rawStudentId === 'string' ? parseInt(rawStudentId, 10) : rawStudentId;
            const type = log.type || log.logType;
            const timestamp = log.timestamp;
            const offlineId = log.offline_id || log.offlineId;
            const pickupDetails = log.pickup_details || log.pickupDetails;
            const photoUrl = log.photo_url || log.photoUrl;

            // Prepare data for Supabase (snake_case columns)
            const date = timestamp 
                ? new Date(timestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) 
                : new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

            const logType = type; // 'check_in' or 'check_out'
            const checkInTime = log.check_in_time || log.checkInTime || (logType === 'check_in' ? timestamp || new Date().toISOString() : null);
            const checkOutTime = log.check_out_time || log.checkOutTime || (logType === 'check_out' ? timestamp || new Date().toISOString() : null);

            // 1. Check if log already exists (idempotency via offlineId)
            if (offlineId) {
                const { data: existing } = await supabase
                    .from('student_gate_logs')
                    .select('id')
                    .eq('offline_id', offlineId)
                    .maybeSingle(); // Use maybeSingle to avoid 406 on no match
                
                if (existing) {
                    results.push({ offlineId, status: 'synced', id: existing.id });
                    continue;
                }
            }

            // 2. Find or create today's record for this student
            const { data: currentEntry } = await supabase
                .from('student_gate_logs')
                .select('*')
                .eq('student_id', studentId)
                .eq('date', date)
                .maybeSingle();

            const entryData: any = {
                organization_id: organizationId,
                student_id: studentId,
                date: date,
                recorded_by: staffId,
                offline_id: offlineId,
                status: logType === 'check_in' ? 'present' : 'checked_out',
            };

            if (logType === 'check_in') {
                entryData.check_in_time = checkInTime;
            } else if (logType === 'check_out') {
                entryData.check_out_time = checkOutTime;
                
                // Pickup logic (flat structure or nested)
                if (pickupDetails) {
                    entryData.pickup_person_type = pickupDetails.type || pickupDetails.person_type;
                    entryData.pickup_person_name = pickupDetails.name || pickupDetails.person_name;
                    entryData.pickup_photo_url = pickupDetails.photoUrl || pickupDetails.photo_url;
                } else if (log.pickup_verification) {
                    entryData.pickup_person_type = log.pickup_verification;
                    entryData.pickup_photo_url = photoUrl;
                }
            }

            let finalLog;
            if (currentEntry) {
                const { data, error } = await supabase
                    .from('student_gate_logs')
                    .update(entryData)
                    .eq('id', currentEntry.id)
                    .select()
                    .single();
                if (error) throw error;
                finalLog = data;
            } else {
                const { data, error } = await supabase
                    .from('student_gate_logs')
                    .insert(entryData)
                    .select()
                    .single();
                if (error) throw error;
                finalLog = data;
            }

            results.push({ offlineId, status: currentEntry ? 'updated' : 'created', id: finalLog?.id });

            // 3. Trigger push notification to parents
            try {
                const { data: studentInfo } = await supabase
                    .from('leads')
                    .select('name, user_id')
                    .eq('id', studentId)
                    .single();

                if (studentInfo?.user_id) {
                    const isCheckIn = logType === 'check_in' || logType === 'check-in';
                    const actionVerb = isCheckIn ? 'arrived at' : 'left';
                    const pickupText = !isCheckIn && pickupDetails 
                        ? ` Picked up by ${pickupDetails.type || pickupDetails.person_type}.` 
                        : '';
                    
                    await supabase.from('notifications').insert({
                        user_id: studentInfo.user_id,
                        organization_id: organizationId,
                        type: 'gate_update',
                        title: `Gate Update: ${studentInfo.name}`,
                        message: `${studentInfo.name} has ${actionVerb} school.${pickupText}`,
                        priority: 'high',
                        action_type: 'student_detail',
                        action_id: studentId.toString(),
                        created_at: new Date().toISOString()
                    });
                }
            } catch (notifError) {
                console.error('[Gate API] Notification error:', notifError);
            }

        }

        res.json({
            success: true,
            data: { processed: results.length, syncResults: results }
        });
    } catch (error) {
        console.error('[Gate API] Sync error:', error);
        res.status(500).json({ success: false, message: 'Failed to sync logs' });
    }
});

/**
 * POST /api/v1/mobile/gate/visitors
 * Record new visitor entry
 */
router.post('/visitors', jwtMiddleware, roleGuard(['security', 'support_staff', 'admin', 'care giver']), async (req: Request, res: Response) => {
    try {
        const { name, phone, purpose, photoUrl, photo_url } = req.body;
        const finalPhotoUrl = photoUrl || photo_url;
        const organizationId = req.user!.organizationId;
        const staffId = req.user!.userId;

        const { supabase } = await import('../../supabase.js');

        const { data: visitor, error } = await supabase
            .from('visitor_logs')
            .insert({
                organization_id: organizationId,
                visitor_name: name,
                visitor_phone: phone,
                visitor_purpose: purpose,
                visitor_photo_url: finalPhotoUrl,
                status: 'inside',
                recorded_by: staffId,
                check_in_time: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data: visitor });
    } catch (error) {
        console.error('[Gate API] Visitor check-in error:', error);
        res.status(500).json({ success: false, message: 'Failed to record visitor' });
    }
});

/**
 * PATCH /api/v1/mobile/gate/visitors/:id/checkout
 * Mark visitor exit
 */
router.patch('/visitors/:id/checkout', jwtMiddleware, roleGuard(['security', 'support_staff', 'admin', 'care giver']), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const organizationId = req.user!.organizationId;

        const { supabase } = await import('../../supabase.js');

        const { data: visitor, error } = await supabase
            .from('visitor_logs')
            .update({
                status: 'exited',
                check_out_time: new Date().toISOString()
            })
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data: visitor });
    } catch (error) {
        console.error('[Gate API] Visitor check-out error:', error);
        res.status(500).json({ success: false, message: 'Failed to check-out visitor' });
    }
});

/**
 * GET /api/v1/mobile/gate/visitors/active
 * Get currently inside visitors
 */
router.get('/visitors/active', jwtMiddleware, roleGuard(['security', 'support_staff', 'admin', 'care giver']), async (req: Request, res: Response) => {
    try {
        const organizationId = req.user!.organizationId;
        const { supabase } = await import('../../supabase.js');

        const { data: visitors, error } = await supabase
            .from('visitor_logs')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('status', 'inside')
            .order('check_in_time', { ascending: false });

        if (error) throw error;

        res.json({ success: true, data: visitors || [] });
    } catch (error) {
        console.error('[Gate API] Fetch active visitors error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch visitors' });
    }
});

/**
 * GET /api/v1/gate/history/students
 * Get historical check-in/out logs for students
 */
router.get('/history/students', optionalJwtMiddleware, async (req: Request, res: Response) => {
    try {
        // Hybrid Auth: Try JWT first (req.user), fallback to session/header
        const organizationId = req.user?.organizationId || await getOrganizationId(req);
        
        if (!organizationId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const { startDate, endDate, search } = req.query;
        const { supabase } = await import('../../supabase.js');

        let query = supabase
            .from('student_gate_logs')
            .select(`
                *,
                student:leads(name, class, section, phone),
                recorder:staff(name)
            `)
            .eq('organization_id', organizationId)
            .order('date', { ascending: false })
            .order('check_in_time', { ascending: false });

        if (startDate) {
            // Parse as start of day in IST
            const startOfDay = new Date(`${startDate}T00:00:00.000+05:30`).toISOString();
            query = query.gte('date', startDate); // 'date' is a DATE column, use as is
            // Also filter by check_in_time for accuracy
            query = query.gte('check_in_time', startOfDay);
        }
        if (endDate) {
            // Parse as end of day in IST
            const endOfDay = new Date(`${endDate}T23:59:59.999+05:30`).toISOString();
            query = query.lte('check_in_time', endOfDay);
        }

        const { data, error } = await query.limit(1000);
        if (error) throw error;

        // Apply search filter manually if needed or via supabase ilike on joined field
        // Supabase join filtering is tricky, so we'll do it in memory for now given the limit
        let filtered = data || [];
        if (search) {
            const s = (search as string).toLowerCase();
            filtered = filtered.filter((log: any) => 
                log.student?.name?.toLowerCase().includes(s) || 
                log.student?.phone?.includes(s)
            );
        }

        res.json({ success: true, data: filtered });
    } catch (error) {
        console.error('[Gate API] Student history error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch student history' });
    }
});

/**
 * GET /api/v1/gate/history/visitors
 * Get historical visitor logs
 */
router.get('/history/visitors', optionalJwtMiddleware, async (req: Request, res: Response) => {
    try {
        const organizationId = req.user?.organizationId || await getOrganizationId(req);

        if (!organizationId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const { startDate, endDate, search } = req.query;
        const { supabase } = await import('../../supabase.js');

        let query = supabase
            .from('visitor_logs')
            .select(`
                *,
                recorder:staff(name)
            `)
            .eq('organization_id', organizationId)
            .order('check_in_time', { ascending: false });

        if (startDate) {
            // Parse as start of day in IST
            const startOfDay = new Date(`${startDate}T00:00:00.000+05:30`).toISOString();
            query = query.gte('check_in_time', startOfDay);
        }
        if (endDate) {
            // Parse as end of day in IST
            const endOfDay = new Date(`${endDate}T23:59:59.999+05:30`).toISOString();
            query = query.lte('check_in_time', endOfDay);
        }
        if (search) {
            query = query.or(`visitor_name.ilike.%${search}%,visitor_phone.ilike.%${search}%`);
        }

        const { data, error } = await query.limit(1000);
        if (error) throw error;

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('[Gate API] Visitor history error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch visitor history' });
    }
});

/**
 * GET /api/v1/mobile/gate/leaves
 * Get leave history
 */
router.get('/leaves', jwtMiddleware, roleGuard(['security', 'support_staff', 'admin', 'care giver']), async (req: Request, res: Response) => {
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

        res.json({ success: true, data: leaves });
    } catch (error) {
        console.error('[Mobile API] Gate get leaves error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch leave history' });
    }
});

/**
 * GET /api/v1/mobile/gate/leaves/balance
 * Get leave balance
 */
router.get('/leaves/balance', jwtMiddleware, roleGuard(['security', 'support_staff', 'admin', 'care giver']), async (req: Request, res: Response) => {
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

        usedLeaves?.forEach(leave => {
            // Count instances instead of days as per user requirement
            const type = leave.leave_type || (leave as any).leaveType;
            if (type === 'CL') clUsed += 1;
        });

        res.json({
            success: true,
            data: {
                cl: { limit: staff.cl_limit || 10, used: clUsed, balance: (staff.cl_limit || 10) - clUsed }
            }
        });
    } catch (error) {
        console.error('[Mobile API] Gate leave balance error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch leave balance' });
    }
});

/**
 * POST /api/v1/mobile/gate/leaves
 * Apply for leave
 */
router.post('/leaves', jwtMiddleware, roleGuard(['security', 'support_staff', 'admin', 'care giver']), async (req: Request, res: Response) => {
    try {
        const staffId = req.user!.userId;
        const organizationId = req.user!.organizationId;        
        const { startDate, endDate, reason, leaveType } = req.body;        

        if (!startDate || !endDate || !reason) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const { supabase } = await import('../../supabase.js'); 

        const { data, error } = await supabase
            .from('teacher_leaves')
            .insert({
                staff_id: staffId,
                organization_id: organizationId,
                start_date: startDate,
                end_date: endDate,
                reason,
                leave_type: leaveType || 'CL',
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // Fetch name for notification
        const { data: staffMember } = await supabase
            .from('staff')
            .select('name')
            .eq('id', staffId)
            .single();

        // Send notification to admins
        try {
            await supabase.from('notifications').insert({
                organization_id: organizationId,
                type: 'leave_request',
                title: 'New Leave Request',
                message: `${staffMember?.name || 'Gate Staff'} applied for leave from ${startDate} to ${endDate}.`,
                priority: 'normal',
                status: 'unread',
                created_at: new Date().toISOString()
            });
        } catch (nErr) {
            console.error('Notification error:', nErr);
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('[Mobile API] Gate apply leave error:', error);
        res.status(500).json({ success: false, error: 'Failed to apply for leave' });
    }
});

export default router;

/**
 * Mobile API v1 - Gate Security Endpoints
 * Handles student check-in/out and visitor management
 */

import express, { Request, Response } from 'express';
import { jwtMiddleware, roleGuard } from '../../middleware/auth.js';
import { db } from '../../db.js';
import { studentGateLogs, visitorLogs, leads, staff } from '../../../shared/schema.js';
import { eq, and, sql, desc, or } from 'drizzle-orm';

const router = express.Router();

// Apply JWT middleware and allow security/support/admin roles
router.use(jwtMiddleware);
router.use(roleGuard(['security', 'support_staff', 'admin']));

/**
 * GET /api/v1/mobile/gate/students
 * Search students for gate check-in/out
 */
router.get('/students', async (req: Request, res: Response) => {
    try {
        const organizationId = req.user!.organizationId;
        const search = (req.query.search as string || req.query.query as string || '').toLowerCase();

        const { supabase } = await import('../../supabase.js');

        // Fetch enrolled students
        let query = supabase
            .from('leads')
            .select('id, name, class, section, roll_number, father_name, mother_name, phone')
            .eq('organization_id', organizationId)
            .eq('status', 'enrolled');

        if (search) {
            query = query.or(`name.ilike.%${search}%,roll_number.ilike.%${search}%`);
        }

        const { data: students, error } = await query.limit(1000);

        if (error) throw error;

        // Fetch today's gate logs to show current status
        const today = new Date().toISOString().split('T')[0];
        const { data: todayLogs } = await supabase
            .from('student_gate_logs')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('date', today);

        // Map status to students
        const logsMap = new Map((todayLogs || []).map(log => [log.student_id, log]));

        const results = (students || []).map(student => ({
            ...student,
            gateStatus: logsMap.get(student.id) || null
        }));

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('[Gate API] Search students error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch students' });
    }
});

/**
 * POST /api/v1/mobile/gate/sync
 * Sync offline check-in/out logs
 */
router.post('/sync', async (req: Request, res: Response) => {
    try {
        const { logs } = req.body; // Array of log objects
        if (!Array.isArray(logs)) {
            return res.status(400).json({ success: false, message: 'Invalid logs format' });
        }

        const organizationId = req.user!.organizationId;
        const staffId = req.user!.userId;
        const { supabase } = await import('../../supabase.js');

        const results = [];

        for (const log of logs) {
            const { studentId, type, timestamp, pickupDetails, offlineId } = log;
            const logDate = new Date(timestamp).toISOString().split('T')[0];

            // 1. Check if log already exists (idempotency via offlineId)
            if (offlineId) {
                const { data: existing } = await supabase
                    .from('student_gate_logs')
                    .select('id')
                    .eq('offline_id', offlineId)
                    .single();
                
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
                .eq('date', logDate)
                .single();

            let updateData: any = {
                organization_id: organizationId,
                student_id: studentId,
                date: logDate,
                recorded_by: staffId,
                offline_id: offlineId
            };

            if (type === 'check-in') {
                updateData.check_in_time = timestamp;
                updateData.status = 'present';
            } else if (type === 'check-out') {
                updateData.check_out_time = timestamp;
                updateData.status = 'checked_out';
                if (pickupDetails) {
                    updateData.pickup_person_type = pickupDetails.type;
                    updateData.pickup_person_name = pickupDetails.name;
                    updateData.pickup_photo_url = pickupDetails.photoUrl;
                }
            }

            let finalLog;
            if (currentEntry) {
                const { data } = await supabase
                    .from('student_gate_logs')
                    .update(updateData)
                    .eq('id', currentEntry.id)
                    .select()
                    .single();
                finalLog = data;
            } else {
                const { data } = await supabase
                    .from('student_gate_logs')
                    .insert(updateData)
                    .select()
                    .single();
                finalLog = data;
            }

            results.push({ offlineId, status: 'created', id: finalLog?.id });

            // 3. Trigger push notification to parents
            try {
                const { data: studentInfo } = await supabase
                    .from('leads')
                    .select('name, user_id')
                    .eq('id', studentId)
                    .single();

                if (studentInfo?.user_id) {
                    const actionVerb = type === 'check-in' ? 'arrived at' : 'left';
                    const pickupText = type === 'check-out' && pickupDetails 
                        ? ` Picked up by ${pickupDetails.type}.` 
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

            results.push({ offlineId, status: 'created', id: finalLog?.id });
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
router.post('/visitors', async (req: Request, res: Response) => {
    try {
        const { name, phone, purpose, photoUrl } = req.body;
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
                visitor_photo_url: photoUrl,
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
router.patch('/visitors/:id/checkout', async (req: Request, res: Response) => {
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
router.get('/visitors/active', async (req: Request, res: Response) => {
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

export default router;

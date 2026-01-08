/**
 * Mobile API v1 - Parent Endpoints
 * Handles all parent-facing mobile app functionality
 */

import express, { Request, Response } from 'express';
import { jwtMiddleware, roleGuard } from '../../middleware/auth.js';
import { storage } from '../../storage.js';

const router = express.Router();

// Apply JWT middleware and role guard to all parent routes
router.use(jwtMiddleware);
router.use(roleGuard(['parent']));

/**
 * GET /api/v1/mobile/parent/children
 * Get all children for authenticated parent
 */
router.get('/children', async (req: Request, res: Response) => {
    try {
        const parentPhone = req.user!.username; // Username is phone number for parents
        const organizationId = req.user!.organizationId;

        // Query leads table where parent_phone matches and status is enrolled
        const { supabase } = await import('../../supabase.js');
        const { data: children, error } = await supabase
            .from('leads')
            .select('id, name, class, parent_name, parent_phone, phone, email, status, organization_id')
            .eq('organization_id', organizationId)
            .or(`parent_phone.eq.${parentPhone},phone.eq.${parentPhone}`)
            .in('status', ['enrolled', 'active']);

        if (error) throw error;

        res.json({
            success: true,
            data: {
                children: children || []
            }
        });
    } catch (error) {
        console.error('[Mobile API] Get children error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_CHILDREN_ERROR',
                message: 'Failed to fetch children'
            }
        });
    }
});

/**
 * GET /api/v1/mobile/parent/child/:id/attendance
 * Get attendance history for a child (paginated)
 */
router.get('/child/:childId/attendance', async (req: Request, res: Response) => {
    try {
        const childId = parseInt(req.params.childId);
        const days = parseInt(req.query.days as string) || 30;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        // Verify child belongs to this parent's organization
        const { supabase } = await import('../../supabase.js');
        const { data: child } = await supabase
            .from('leads')
            .select('organization_id')
            .eq('id', childId)
            .single();

        if (!child || child.organization_id !== req.user!.organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied to this child\'s data'
                }
            });
        }

        // Get attendance records
        const { data: attendance, error } = await supabase
            .from('student_attendance')
            .select('id, date, status, check_in_time, check_out_time, marked_at, marked_by')
            .eq('lead_id', childId)
            .order('date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            success: true,
            data: {
                attendance: attendance || [],
                pagination: {
                    limit,
                    offset,
                    hasMore: (attendance?.length || 0) === limit
                }
            }
        });
    } catch (error) {
        console.error('[Mobile API] Get attendance error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_ATTENDANCE_ERROR',
                message: 'Failed to fetch attendance'
            }
        });
    }
});

/**
 * GET /api/v1/mobile/parent/child/:id/activities
 * Get daily updates/activities for a child (paginated)
 */
router.get('/child/:childId/activities', async (req: Request, res: Response) => {
    try {
        const childId = parseInt(req.params.childId);
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        // Verify child belongs to this parent's organization
        const { supabase } = await import('../../supabase.js');
        const { data: child } = await supabase
            .from('leads')
            .select('organization_id')
            .eq('id', childId)
            .single();

        if (!child || child.organization_id !== req.user!.organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied to this child\'s data'
                }
            });
        }

        // Get daily updates
        const { data: activities, error } = await supabase
            .from('daily_updates')
            .select('id, title, content, activity_type, mood, teacher_name, media_urls, posted_at')
            .eq('lead_id', childId)
            .order('posted_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            success: true,
            data: {
                activities: activities || [],
                pagination: {
                    limit,
                    offset,
                    hasMore: (activities?.length || 0) === limit
                }
            }
        });
    } catch (error) {
        console.error('[Mobile API] Get activities error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_ACTIVITIES_ERROR',
                message: 'Failed to fetch activities'
            }
        });
    }
});

/**
 * GET /api/v1/mobile/parent/child/:id/fees
 * Get fee status and payment history for a child
 */
router.get('/child/:childId/fees', async (req: Request, res: Response) => {
    try {
        const childId = parseInt(req.params.childId);

        // Verify child belongs to this parent's organization
        const { supabase } = await import('../../supabase.js');
        const { data: child } = await supabase
            .from('leads')
            .select('organization_id, class, stream')
            .eq('id', childId)
            .single();

        if (!child || child.organization_id !== req.user!.organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied to this child\'s data'
                }
            });
        }

        // 1. Determine Total Fees
        let totalFees = 0;

        // Check for EMI Plan (specific to student)
        const { data: emiPlan } = await supabase
            .from('emi_plans')
            .select('id, total_amount, status')
            .eq('student_id', childId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (emiPlan) {
            totalFees = parseFloat(emiPlan.total_amount);
        } else {
            // Fallback to Class/Stream Fee Structure
            let query = supabase
                .from('fee_structure')
                .select('total_fees')
                .eq('organization_id', child.organization_id)
                .eq('class', child.class);

            if (child.stream) {
                query = query.eq('stream', child.stream);
            }

            const { data: feeStructure } = await query.limit(1).single();

            if (feeStructure) {
                totalFees = parseFloat(feeStructure.total_fees);
            }
        }

        // Get EMI Schedule if plan exists
        let emiDetails = null;
        if (emiPlan) {
            const { data: schedule } = await supabase
                .from('emi_schedule')
                .select('id, installment_number, amount, due_date, status, paid_date')
                .eq('emi_plan_id', emiPlan.id)
                .order('due_date', { ascending: true });

            if (schedule) {
                emiDetails = {
                    planId: emiPlan.id,
                    totalAmount: parseFloat(emiPlan.total_amount),
                    installments: schedule.map((s: any) => ({
                        id: s.id,
                        installmentNumber: s.installment_number,
                        amount: s.amount,
                        dueDate: s.due_date,
                        status: s.status,
                        paidDate: s.paid_date
                    }))
                };
            }
        }

        // 2. Get Payment History & Calculate Paid Amount
        const { data: payments, error: paymentsError } = await supabase
            .from('fee_payments')
            .select('id, amount, payment_date, payment_mode, receipt_number, status')
            .eq('lead_id', childId)
            .eq('status', 'completed')
            .order('payment_date', { ascending: false });

        if (paymentsError) throw paymentsError;

        const totalPaid = (payments || []).reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

        // Format payments for frontend (camelCase)
        const formattedPayments = (payments || []).map((p: any) => ({
            id: p.id,
            amount: p.amount,
            date: p.payment_date,
            mode: p.payment_mode,
            receiptNumber: p.receipt_number,
            status: p.status
        }));

        res.json({
            success: true,
            data: {
                totalFees,
                totalPaid,
                balance: Math.max(0, totalFees - totalPaid),
                payments: formattedPayments,
                emiDetails
            }
        });
    } catch (error) {
        console.error('[Mobile API] Get fees error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_FEES_ERROR',
                message: 'Failed to fetch fee information'
            }
        });
    }
});

/**
 * GET /api/v1/mobile/parent/child/:id/bus-tracking
 * Get live bus location for a child
 */
router.get('/child/:childId/bus-tracking', async (req: Request, res: Response) => {
    try {
        const childId = parseInt(req.params.childId);

        // Verify child belongs to this parent's organization
        const { supabase } = await import('../../supabase.js');
        const { data: child } = await supabase
            .from('leads')
            .select('organization_id')
            .eq('id', childId)
            .single();

        if (!child || child.organization_id !== req.user!.organizationId) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Access denied to this child\'s data'
                }
            });
        }

        // Get bus assignment
        const { data: assignment } = await supabase
            .from('student_bus_assignments')
            .select('route_id')
            .eq('lead_id', childId)
            .eq('active', true)
            .single();

        if (!assignment) {
            return res.json({
                success: true,
                data: {
                    isAssigned: false,
                    message: 'No bus route assigned'
                }
            });
        }

        // Get route info
        const { data: route } = await supabase
            .from('bus_routes')
            .select('id, route_name, route_number')
            .eq('id', assignment.route_id)
            .single();

        // Get latest location (within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: location } = await supabase
            .from('bus_location_history')
            .select('latitude, longitude, speed, recorded_at')
            .eq('route_id', assignment.route_id)
            .gte('recorded_at', fiveMinutesAgo)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single();

        res.json({
            success: true,
            data: {
                isAssigned: true,
                route: route || null,
                location: location || null,
                isLive: !!location
            }
        });
    } catch (error) {
        console.error('[Mobile API] Get bus tracking error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_BUS_ERROR',
                message: 'Failed to fetch bus tracking data'
            }
        });
    }
});

/**
 * GET /api/v1/mobile/parent/announcements
 * Get recent announcements for parent's organization
 */
router.get('/announcements', async (req: Request, res: Response) => {
    try {
        const organizationId = req.user!.organizationId;
        const limit = parseInt(req.query.limit as string) || 10;
        const now = new Date().toISOString();

        const { supabase } = await import('../../supabase.js');
        const { data: announcements, error } = await supabase
            .from('preschool_announcements')
            .select('id, title, content, priority, published_at, expires_at')
            .eq('organization_id', organizationId)
            .or(`expires_at.is.null,expires_at.gt."${now}"`)
            .order('published_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        res.json({
            success: true,
            data: {
                announcements: announcements || []
            }
        });
    } catch (error) {
        console.error('[Mobile API] Get announcements error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_ANNOUNCEMENTS_ERROR',
                message: 'Failed to fetch announcements'
            }
        });
    }
});

/**
 * GET /api/v1/mobile/parent/events
 * Get upcoming events for parent's organization
 */
router.get('/events', async (req: Request, res: Response) => {
    try {
        const organizationId = req.user!.organizationId;
        // Fetch events from 12 months ago to show full academic year context
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12);
        const dateString = startDate.toISOString().split('T')[0];

        const { supabase } = await import('../../supabase.js');
        const { data: events, error } = await supabase
            .from('preschool_events')
            .select('id, title, description, event_date, event_time, event_type')
            .eq('organization_id', organizationId)
            .gte('event_date', dateString)
            .order('event_date', { ascending: true })
            .limit(50);

        if (error) throw error;

        res.json({
            success: true,
            data: {
                events: events || []
            }
        });
    } catch (error) {
        console.error('[Mobile API] Get events error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_EVENTS_ERROR',
                message: 'Failed to fetch events'
            }
        });
    }
});

/**
 * GET /api/v1/mobile/parent/bus/:routeId/live-location
 * Get real-time bus location with latest GPS data
 */
router.get('/bus/:routeId/live-location', async (req: Request, res: Response) => {
    try {
        const routeId = parseInt(req.params.routeId);

        if (isNaN(routeId)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'Invalid route ID'
                }
            });
        }

        // Get latest location from our location tracking table
        const location = await storage.getLatestBusLocation(routeId);

        if (!location) {
            return res.json({
                success: true,
                data: {
                    isLive: false,
                    message: 'Bus is not currently tracking'
                }
            });
        }

        // Check if location is recent (within last 2 minutes)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const locationTime = new Date(location.timestamp);
        const isRecent = locationTime >= twoMinutesAgo;

        res.json({
            success: true,
            data: {
                isLive: isRecent && location.isActive,
                location: {
                    latitude: parseFloat(location.latitude),
                    longitude: parseFloat(location.longitude),
                    speed: parseFloat(location.speed || '0'),
                    heading: parseFloat(location.heading || '0'),
                    accuracy: parseFloat(location.accuracy || '0'),
                    timestamp: location.timestamp
                },
                message: isRecent ? 'Live tracking active' : 'Last known location (tracking inactive)'
            }
        });
    } catch (error) {
        console.error('[Mobile API] Get live bus location error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_LOCATION_ERROR',
                message: 'Failed to fetch bus location'
            }
        });
    }
});

export default router;


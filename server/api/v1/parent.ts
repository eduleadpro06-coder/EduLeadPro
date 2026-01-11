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

// Register push token
router.post('/register-push-token', async (req: Request, res: Response) => {
    try {
        const { token, deviceType } = req.body;
        const leadId = req.user!.userId;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token is required'
            });
        }

        // Check if token already exists
        const { pushTokens } = await import('../../../shared/schema.js');
        const { eq } = await import('drizzle-orm');
        const { db } = await import('../../db.js');

        const existing = await db.query.pushTokens.findFirst({
            where: eq(pushTokens.token, token)
        });

        if (existing) {
            await db.update(pushTokens)
                .set({
                    leadId,
                    userId: null,
                    updatedAt: new Date()
                })
                .where(eq(pushTokens.id, existing.id));
        } else {
            await db.insert(pushTokens).values({
                leadId,
                token,
                deviceType: deviceType || 'unknown'
            });
        }

        res.json({
            success: true,
            message: 'Push token registered successfully'
        });
    } catch (error) {
        console.error('[Mobile API] Push token registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register push token'
        });
    }
});

// Get organization details
router.get('/organization', async (req: Request, res: Response) => {
    try {
        const organizationId = req.user!.organizationId;
        const org = await storage.getOrganization(organizationId);

        if (!org) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        res.json({
            id: org.id,
            name: org.name,
            phone: org.phone,
            address: org.address,
            city: org.city,
            state: org.state,
            pincode: org.pincode,
            email: org.email || (org.settings as any)?.supportEmail || (org.settings as any)?.email || '',
            website: (org.settings as any)?.website || ''
        });
    } catch (error) {
        console.error('Failed to fetch organization details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

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
 * GET /api/v1/mobile/parent/child/:childId/bus-assignment
 * Get bus assignment details for a child
 */
router.get('/child/:childId/bus-assignment', async (req: Request, res: Response) => {
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
                    message: 'Access denied'
                }
            });
        }

        const { data: assignments, error } = await supabase
            .from('student_bus_assignments')
            .select(`
                *,
                bus_routes (
                    id, 
                    route_name, 
                    bus_number, 
                    driver_id,
                    helper_name,
                    helper_phone,
                    status
                ),
                pickup_stop:bus_stops!student_bus_assignments_pickup_stop_id_fkey (
                    id, 
                    stop_name, 
                    latitude, 
                    longitude, 
                    arrival_time
                ),
                drop_stop:bus_stops!student_bus_assignments_drop_stop_id_fkey (
                    id, 
                    stop_name, 
                    latitude, 
                    longitude, 
                    arrival_time
                )
            `)
            .eq('student_id', childId);

        if (error) throw error;

        // Enhance with driver and route stops
        const enhancedAssignments = await Promise.all((assignments || []).map(async (assignment) => {
            let driverName = 'Driver';
            let driverPhone = '';
            let routeStops: any[] = [];

            // Fetch stops for the route
            if (assignment.route_id) {
                const { data: stops } = await supabase
                    .from('bus_stops')
                    .select('*')
                    .eq('route_id', assignment.route_id)
                    .order('stop_order', { ascending: true });
                routeStops = stops || [];
            }

            if (assignment.bus_routes?.driver_id) {
                const { data: driver } = await supabase
                    .from('staff')
                    .select('name, phone')
                    .eq('id', assignment.bus_routes.driver_id)
                    .single();

                if (driver) {
                    driverName = driver.name;
                    driverPhone = driver.phone;
                }
            }

            return {
                ...assignment,
                driver_name: driverName,
                driver_phone: driverPhone,
                route_stops: routeStops
            };
        }));

        res.json({ success: true, assignments: enhancedAssignments });
    } catch (error) {
        console.error('[Mobile API] Get bus assignment error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch bus assignment' });
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
            .select('id, amount, payment_date, payment_mode, receipt_number, status, installment_number, payment_category')
            .eq('lead_id', childId)
            .eq('status', 'completed')
            .order('payment_date', { ascending: false });

        if (paymentsError) throw paymentsError;

        const tuitionPaid = (payments || []).filter(p => !p.payment_category || p.payment_category === 'fee_payment').reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
        const additionalPaid = (payments || []).filter(p => p.payment_category === 'additional_charge').reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
        const totalPaid = tuitionPaid + additionalPaid;

        // Dynamic Status Calculation to fix rounding issues
        if (emiDetails && emiDetails.installments.length > 0) {
            // Calculate explicit down payment (Total - Sum of Installments)
            const sumInstallments = emiDetails.installments.reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0);
            const implicitDownPayment = Math.max(0, totalFees - sumInstallments);

            // Start checking coverage from down payment
            let coveredAmount = implicitDownPayment;

            // Tolerance for rounding errors (e.g. ₹1 difference)
            const TOLERANCE = 10;

            emiDetails.installments = emiDetails.installments.map((inst: any) => {
                const amount = parseFloat(inst.amount);
                const requiredTotal = coveredAmount + amount;

                // If total paid covers this installment (within tolerance)
                if (totalPaid >= (requiredTotal - TOLERANCE)) {
                    // Update covered amount for next iteration
                    coveredAmount += amount;
                    return { ...inst, status: 'paid' };
                }

                // If partial coverage or strictly pending
                // Keep original status unless we want to show partial? 
                // For now, adhere to "paid" vs "pending" based on full coverage
                coveredAmount += amount; // Still increment to check next segments correctly in sequential logic
                return inst;
            });
        }

        // Format payments for frontend (camelCase)
        const formattedPayments = (payments || []).map((p: any) => ({
            id: p.id,
            amount: Math.round(parseFloat(p.amount)),
            date: p.payment_date,
            mode: p.payment_mode,
            receiptNumber: p.receipt_number,
            status: p.status,
            installmentNumber: p.installment_number,
            paymentCategory: p.payment_category
        }));

        res.json({
            success: true,
            data: {
                totalFees: Math.round(totalFees),
                totalPaid: Math.round(totalPaid),
                tuitionPaid: Math.round(tuitionPaid),
                additionalPaid: Math.round(additionalPaid),
                balance: Math.round(Math.max(0, totalFees - tuitionPaid)),
                payments: formattedPayments,
                emiDetails: emiDetails ? {
                    ...emiDetails,
                    totalAmount: Math.round(emiDetails.totalAmount),
                    installments: emiDetails.installments.map((inst: any) => ({
                        ...inst,
                        amount: Math.round(parseFloat(inst.amount))
                    }))
                } : null
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

        // Get organization location
        const { storage } = await import('../../storage.js');
        const org = await storage.getOrganization(child.organization_id);

        let orgLocation = null;
        if (org && org.settings) {
            const settings = org.settings as any;
            if (settings.location && settings.location.latitude && settings.location.longitude) {
                orgLocation = settings.location;
            } else if (settings.latitude && settings.longitude) {
                orgLocation = {
                    latitude: settings.latitude,
                    longitude: settings.longitude
                };
            }
        }

        res.json({
            success: true,
            data: {
                isAssigned: true,
                route: route || null,
                location: location || null,
                isLive: !!location,
                orgLocation: orgLocation
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

        const { supabase } = await import('../../supabase.js');

        // 1. Get latest location from the synchronized table
        // Use raw SQL via pg to get the recency check directly from DB to avoid timezone mismatch
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        const { Pool } = await import('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        let locationData: any = null;
        let isRecent = false;

        try {
            const query = `
                SELECT *, 
                (EXTRACT(EPOCH FROM (NOW() AT TIME ZONE 'Asia/Kolkata' - timestamp))) as seconds_ago
                FROM bus_live_locations 
                WHERE route_id = $1 AND is_active = true
                ORDER BY timestamp DESC 
                LIMIT 1
            `;
            const result = await pool.query(query, [routeId]);
            if (result.rows.length > 0) {
                locationData = result.rows[0];
                // liveThreshold is 15 minutes (900 seconds) for unified consistency
                isRecent = locationData.seconds_ago < 900;
            }
        } catch (dbError) {
            console.error('[Parent API] DB Error fetching live location:', dbError);
        } finally {
            await pool.end();
        }

        const location = locationData;

        // 2. Double-check active_bus_sessions for added robustness
        const { data: activeSession } = await supabase
            .from('active_bus_sessions')
            .select('id, started_at')
            .eq('route_id', routeId)
            .eq('status', 'live')
            .maybeSingle();

        // 3. Determine if the trip is "Live"
        // A trip is live if there's an active session OR a recent location update
        // We relax the threshold for isRecent to 15 minutes (900 seconds) for better UX
        const isLive = !!activeSession || (locationData && locationData.seconds_ago < 900);

        // Update isRecent for the response with the relaxed threshold
        if (locationData) {
            isRecent = locationData.seconds_ago < 900;
        }

        // 4. Get latest student boarding status (ONLY if session is active)
        let studentEvent = null;
        if (req.query.studentId && activeSession?.started_at) {
            const studentId = parseInt(req.query.studentId as string);

            const { data: event } = await supabase
                .from('bus_trip_passenger_events')
                .select('status, event_time')
                .eq('route_id', routeId)
                .eq('student_id', studentId)
                .gte('event_time', activeSession.started_at)
                .order('event_time', { ascending: false })
                .limit(1)
                .single();

            studentEvent = event;
        }


        res.json({
            success: true,
            isLive: !!activeSession || (isRecent && (location?.is_active ?? false)),
            location: location ? {
                latitude: parseFloat(location.latitude),
                longitude: parseFloat(location.longitude),
                speed: parseFloat(location.speed || '0'),
                heading: parseFloat(location.heading || '0'),
                timestamp: location.timestamp
            } : null,
            studentStatus: studentEvent?.status || 'pending',
            statusTime: studentEvent?.event_time || null,
            message: (!!activeSession || isRecent) ? 'Live tracking active' : 'Tracking inactive'
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

/**
 * POST /api/v1/mobile/parent/proxy/directions
 * Proxy for Ola Maps Directions (bypass domain restrictions)
 */
router.post('/proxy/directions', async (req: Request, res: Response) => {
    try {
        const { origin, destination } = req.body;
        console.log(`[Parent Proxy] Directions requested: From(${origin?.latitude},${origin?.longitude}) To(${destination?.latitude},${destination?.longitude})`);

        const apiKey = process.env.OLA_MAPS_API_KEY ||
            process.env.VITE_OLA_MAPS_KEY ||
            process.env.EXPO_PUBLIC_OLA_MAPS_KEY ||
            "nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0";

        const url = `https://api.olamaps.io/routing/v1/directions?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&api_key=${apiKey}&geometries=geojson&overview=full`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Referer': 'https://eduleadconnect.vercel.app/',
                'X-Request-Id': Math.random().toString(36).substring(7),
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Ola Proxy Error in Parent API:", errorText);
            return res.status(response.status).send(errorText);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Ola Proxy Exception in Parent API:", error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;


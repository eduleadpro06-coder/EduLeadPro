/**
 * Mobile API v1 - Driver Endpoints
 * Handles all driver-facing mobile app functionality
 */

import express, { Request, Response } from 'express';
import { jwtMiddleware, roleGuard } from '../../middleware/auth.js';

const router = express.Router();

// Apply JWT middleware and role guard to all driver routes
router.use(jwtMiddleware);
router.use(roleGuard(['driver']));

/**
 * GET /api/v1/mobile/driver/dashboard
 * Get driver dashboard with assigned routes
 */
router.get('/dashboard', async (req: Request, res: Response) => {
    try {
        const staffId = req.user!.userId;
        const organizationId = req.user!.organizationId;

        const { supabase } = await import('../../supabase.js');

        // Get driver info
        const { data: driver } = await supabase
            .from('staff')
            .select('id, name, phone')
            .eq('id', staffId)
            .single();

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        // Get routes assigned to THIS driver
        const { data: routes, error: routesError } = await supabase
            .from('bus_routes')
            .select('id, route_name, bus_number, helper_name, helper_phone')
            .eq('organization_id', organizationId)
            .eq('driver_id', staffId); // Filter by this driver's ID

        if (routesError) {
            console.error('[Mobile API] Supabase routes error:', routesError);
        }

        const assignedRoute = routes && routes.length > 0 ? routes[0] : null;

        // DEBUG: Return what we searched for
        const debug = {
            searchDriverId: staffId,
            searchOrgId: organizationId,
            routesFound: routes?.length || 0,
            error: routesError,
            firstRoute: routes?.[0] || 'none'
        };

        // Get assigned students and route stops if route exists
        let assignedStudents: any[] = [];
        let routeStops: any[] = [];
        let assignmentsDebug: any = null;

        if (assignedRoute) {
            // Fetch stops for the route
            const { data: stops, error: stopsError } = await supabase
                .from('bus_stops')
                .select('*')
                .eq('route_id', assignedRoute.id)
                .order('stop_order', { ascending: true });

            if (stopsError) {
                console.error('[Mobile API] Stops fetch error:', stopsError);
            } else {
                routeStops = stops || [];
            }

            const { data: assignments, error: assignError } = await supabase
                .from('student_bus_assignments')
                .select('student_id')
                .eq('route_id', assignedRoute.id);

            assignmentsDebug = {
                count: assignments?.length || 0,
                error: assignError,
                sample: assignments?.[0]
            };

            if (assignError) {
                console.error('[Mobile API] Assignment fetch error:', assignError);
            }

            if (assignments && assignments.length > 0) {
                const studentIds = assignments.map(a => a.student_id);
                const { data: students, error: studError } = await supabase
                    .from('leads')
                    .select('id, name, class, parent_phone')
                    .in('id', studentIds);

                if (studError) {
                    console.error('[Mobile API] Students fetch error:', studError);
                }
                assignedStudents = students || [];
            }
        }

        return res.json({
            driver: {
                id: driver.id,
                name: driver.name,
                phone: driver.phone
            },
            assignedRoute: assignedRoute ? {
                ...assignedRoute,
                stops: routeStops
            } : null,
            assignedStudents,
            debug: {
                ...debug,
                assignments: assignmentsDebug
            }
        });
    } catch (error) {
        console.error('[Mobile API] Driver dashboard error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch dashboard' });
    }
});

/**
 * POST /api/v1/mobile/driver/location
 * Update bus location (real-time tracking)
 */
router.post('/location', async (req: Request, res: Response) => {
    try {
        const {
            routeId,
            latitude,
            longitude,
            speed,
            heading
        } = req.body;

        if (!routeId || latitude === undefined || longitude === undefined) {
            console.error('[Driver API] Invalid location request:', req.body);
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'routeId, latitude, and longitude are required'
                }
            });
        }

        console.log(`[Driver API] Updating location for Route ${routeId}: ${latitude}, ${longitude}`);

        const { supabase } = await import('../../supabase.js');

        // Use raw SQL with NOW() to ensure database time is used
        // Supabase RPC has issues with custom functions, so we use pg directly
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        const { Pool } = await import('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        try {
            // Table 1: bus_live_locations (used for parent real-time map)
            // Now that we have a UNIQUE (route_id) constraint, this UPSERT is safe and fast
            await pool.query(`
                INSERT INTO bus_live_locations (route_id, driver_id, latitude, longitude, speed, heading, is_active, timestamp)
                VALUES ($1, $2, $3, $4, $5, $6, true, NOW() AT TIME ZONE 'Asia/Kolkata')
                ON CONFLICT (route_id) 
                DO UPDATE SET
                    driver_id = EXCLUDED.driver_id,
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    speed = EXCLUDED.speed,
                    heading = EXCLUDED.heading,
                    is_active = true,
                    timestamp = NOW() AT TIME ZONE 'Asia/Kolkata'
            `, [routeId, req.user?.userId, latitude, longitude, speed || 0, heading || 0]);

            // Table 2: active_bus_sessions (used for current status/dashboard)
            await pool.query(`
                UPDATE active_bus_sessions 
                SET 
                    current_latitude = $1,
                    current_longitude = $2,
                    current_speed = $3,
                    current_heading = $4,
                    last_updated = NOW() AT TIME ZONE 'Asia/Kolkata'
                WHERE route_id = $5 AND status = 'live'
            `, [latitude, longitude, speed || 0, heading || 0, routeId]);

            console.log('[Driver API] Location & Session updated via raw SQL');
        } catch (dbError) {
            console.error('[Driver API] Raw SQL error:', dbError);
        } finally {
            await pool.end();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('[Driver API] Update location error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Legacy/Alternative endpoint for location updates
 */
router.post('/location/update', async (req, res) => {
    // Reuse logic - typically you'd call a shared service, but here we'll just redirect or duplicate
    // To keep it clean, we'll let the express router handle it if we want to alias
    const locationHandler = (router.stack.find(s => s.route?.path === '/location')?.route?.stack[0]?.handle);
    if (locationHandler) return locationHandler(req, res, () => { });
    res.status(500).json({ error: 'Endpoint not configured' });
});

/**
 * Stop tracking - mark bus as inactive
 * POST /api/v1/mobile/driver/location/stop-tracking
 */
router.post('/location/stop-tracking', async (req: Request, res: Response) => {
    try {
        const { routeId } = req.body;
        if (!routeId) return res.status(400).json({ error: 'routeId required' });

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        const { Pool } = await import('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        try {
            // 1. Mark as inactive in live tracking
            await pool.query('UPDATE bus_live_locations SET is_active = false WHERE route_id = $1', [routeId]);

            // 2. Mark any live session as completed
            await pool.query("UPDATE active_bus_sessions SET status = 'completed', end_time = NOW() AT TIME ZONE 'Asia/Kolkata' WHERE route_id = $1 AND status = 'live'", [routeId]);

            console.log(`[Driver API] Tracking stopped for route ${routeId}`);
        } finally {
            await pool.end();
        }

        res.json({ success: true, message: 'Tracking stopped' });
    } catch (error) {
        console.error('[Driver API] Stop tracking error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/v1/mobile/driver/student-status
 * Update boarding/drop status for a student in a session
 */
router.post('/student-status', async (req: Request, res: Response) => {
    try {
        const { studentId, sessionId, routeId, status } = req.body;

        if (!studentId || !sessionId || !routeId || !status) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields (studentId, sessionId, routeId, status)'
            });
        }

        const { supabase } = await import('../../supabase.js');

        // Log the event in the new table
        const { error } = await supabase
            .from('bus_trip_passenger_events')
            .insert({
                session_id: sessionId,
                student_id: studentId,
                route_id: routeId,
                status: status,
                event_time: new Date().toISOString()
            });

        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        console.error('[Driver API] Update student status error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update student status',
            details: error
        });
    }
});

/**
 * POST /api/v1/mobile/driver/trip/start
 * Start a trip session
 */
router.post('/trip/start', async (req: Request, res: Response) => {
    try {
        const { routeId } = req.body;
        console.log(`[Driver API] Start Trip Request for Route: ${routeId} by User: ${req.user?.userId}`);

        if (!routeId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'routeId is required'
                }
            });
        }

        const staffId = req.user!.userId;

        if (!routeId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'routeId is required'
                }
            });
        }

        const { supabase } = await import('../../supabase.js');

        // End any existing sessions for this driver
        await supabase
            .from('active_bus_sessions')
            .update({ status: 'completed', ended_at: new Date().toISOString() })
            .eq('driver_id', staffId)
            .eq('status', 'live');

        // Start new session
        const { data: session, error } = await supabase
            .from('active_bus_sessions')
            .insert({
                route_id: routeId,
                driver_id: staffId,
                started_at: new Date().toISOString(),
                status: 'live'
            })
            .select()
            .single();

        if (error) {
            console.error('[Mobile API] Start trip error:', error);
            return res.status(500).json({
                success: false,
                error: {
                    code: 'START_TRIP_ERROR',
                    message: error.message
                }
            });
        }

        // Ensure bus is marked as active in live tracking immediately
        const { Pool } = await import('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        try {
            // Initializing with last known location if possible, or 0,0
            // The UPSERT ensures we don't crash and the Admin/Parent portals see 'is_active = true' immediately
            await pool.query(`
                INSERT INTO bus_live_locations (route_id, driver_id, latitude, longitude, is_active, timestamp)
                VALUES ($1, $2, 0, 0, true, NOW() AT TIME ZONE 'Asia/Kolkata')
                ON CONFLICT (route_id) DO UPDATE SET 
                is_active = true, 
                driver_id = $2,
                timestamp = NOW() AT TIME ZONE 'Asia/Kolkata'
            `, [routeId, staffId]);
        } catch (dbErr) {
            console.error('[Driver API] Error updating live status on trip start:', dbErr);
        } finally {
            await pool.end();
        }

        res.json({
            success: true,
            session
        });
    } catch (error) {
        console.error('[Mobile API] Start trip exception:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while starting trip'
        });
    }
});

/**
 * POST /api/v1/mobile/driver/trip/end
 * End a trip session
 */
router.post('/trip/end', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ success: false, error: 'sessionId is required' });
        }

        const { supabase } = await import('../../supabase.js');

        // Update session status and mark live location as inactive
        const { Pool } = await import('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        try {
            // 1. Mark session as completed
            await pool.query(`
                UPDATE active_bus_sessions 
                SET status = 'completed', ended_at = NOW() AT TIME ZONE 'Asia/Kolkata' 
                WHERE id = $1
            `, [sessionId]);

            // 2. Mark bus as inactive in live tracking (find routeId from session)
            await pool.query(`
                UPDATE bus_live_locations 
                SET is_active = false 
                WHERE route_id = (SELECT route_id FROM active_bus_sessions WHERE id = $1)
            `, [sessionId]);

            console.log(`[Driver API] Trip session ${sessionId} ended and live tracking deactivated`);
        } finally {
            await pool.end();
        }

        res.json({
            success: true,
            message: 'Trip ended successfully'
        });
    } catch (error) {
        console.error('[Mobile API] End trip error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to end trip'
        });
    }
});

/**
 * GET /api/v1/mobile/driver/trip/active
 * Get current active trip session
 */
router.get('/trip/active', async (req: Request, res: Response) => {
    try {
        const staffId = req.user!.userId;

        const { supabase } = await import('../../supabase.js');

        // Get active session for this driver
        const { data: session, error } = await supabase
            .from('active_bus_sessions')
            .select(`
                id,
                route_id,
                started_at,
                status,
                bus_routes (
                    id,
                    route_name,
                    bus_number
                )
            `)
            .eq('driver_id', staffId)
            .eq('status', 'live')
            .single();

        if (error || !session) {
            return res.json({ success: true, activeTrip: null });
        }

        res.json({
            success: true,
            activeTrip: session
        });
    } catch (error) {
        // If no active session, return null
        res.json({
            success: true,
            session: null
        });
    }
});

export default router;



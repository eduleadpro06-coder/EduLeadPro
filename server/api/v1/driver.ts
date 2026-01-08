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

        // Get assigned students if route exists
        let assignedStudents: any[] = [];
        let assignmentsDebug: any = null;

        if (assignedRoute) {
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
            assignedRoute,
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
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'routeId, latitude, and longitude are required'
                }
            });
        }

        const { supabase } = await import('../../supabase.js');
        // Update BOTH tables for parent/admin visibility
        // Table 1: bus_live_locations (used by parent portal map)
        const { error: liveError } = await supabase
            .from('bus_live_locations')
            .upsert({
                route_id: routeId,
                driver_id: req.user?.userId, // Keep driver_id as it was in the original code
                latitude,
                longitude,
                speed,
                heading,
                is_active: true,
                timestamp: new Date().toISOString()
            }, { onConflict: 'route_id' });

        if (liveError) console.error('[Driver API] Live location error:', liveError);

        // Table 2: active_bus_sessions (used for current status/dashboard)
        const { error: sessionError } = await supabase
            .from('active_bus_sessions')
            .update({
                current_latitude: latitude,
                current_longitude: longitude,
                current_speed: speed,
                current_heading: heading,
                last_updated: new Date().toISOString()
            })
            .eq('route_id', routeId)
            .eq('status', 'live');

        if (sessionError) console.error('[Driver API] Session update error:', sessionError);

        res.json({ success: true });
    } catch (error) {
        console.error('[Driver API] Update location error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
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
    } catch (error) {
        console.error('[Driver API] Update student status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update student status'
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

        // Update session status
        const { error } = await supabase
            .from('active_bus_sessions')
            .update({
                status: 'completed',
                ended_at: new Date().toISOString()
            })
            .eq('id', sessionId);

        if (error) throw error;

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



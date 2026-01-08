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

        // Insert location record
        const { error } = await supabase
            .from('bus_location_history')
            .insert({
                route_id: routeId,
                latitude,
                longitude,
                speed: speed || 0,
                heading: heading || 0,
                recorded_at: new Date().toISOString()
            });

        if (error) throw error;

        res.json({
            success: true,
            message: 'Location updated successfully'
        });
    } catch (error) {
        console.error('[Mobile API] Update location error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'LOCATION_UPDATE_ERROR',
                message: 'Failed to update location'
            }
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

/**
 * POST /api/v1/mobile/driver/location/start-tracking
 * Start location tracking session
 */
router.post('/location/start-tracking', async (req: Request, res: Response) => {
    try {
        const { routeId } = req.body;
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

        // Mark route as actively being tracked
        // For now, just respond success - tracking state managed by location updates
        res.json({
            success: true,
            data: {
                message: 'Tracking session started',
                routeId,
                driverId: staffId
            }
        });
    } catch (error) {
        console.error('[Mobile API] Start tracking error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'START_TRACKING_ERROR',
                message: 'Failed to start tracking session'
            }
        });
    }
});

/**
 * POST /api/v1/mobile/driver/location/update
 * Update bus GPS location (called every 30 seconds)
 */
router.post('/location/update', async (req: Request, res: Response) => {
    try {
        const {
            routeId,
            latitude,
            longitude,
            speed,
            heading,
            accuracy
        } = req.body;
        const staffId = req.user!.userId;

        if (!routeId || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'routeId, latitude, and longitude are required'
                }
            });
        }

        const { storage } = await import('../../../storage.js');

        // Save location to database
        await storage.saveBusLocation({
            routeId,
            driverId: staffId,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            speed: speed ? speed.toString() : '0',
            heading: heading ? heading.toString() : '0',
            accuracy: accuracy ? accuracy.toString() : '0',
            isActive: true
        });

        // TODO: Broadcast via WebSocket to connected parents
        // io.to(`route-${routeId}`).emit('bus:location:update', { routeId, latitude, longitude });

        res.json({
            success: true,
            data: {
                message: 'Location updated successfully',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[Mobile API] Update location error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'LOCATION_UPDATE_ERROR',
                message: 'Failed to update location'
            }
        });
    }
});

/**
 * POST /api/v1/mobile/driver/location/stop-tracking
 * Stop location tracking session
 */
router.post('/location/stop-tracking', async (req: Request, res: Response) => {
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

        const { storage } = await import('../../../storage.js');

        // Mark all locations for this route as inactive
        await storage.deactivateBusLocation(routeId);

        res.json({
            success: true,
            data: {
                message: 'Tracking session stopped'
            }
        });
    } catch (error) {
        console.error('[Mobile API] Stop tracking error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'STOP_TRACKING_ERROR',
                message: 'Failed to stop tracking session'
            }
        });
    }
});

export default router;


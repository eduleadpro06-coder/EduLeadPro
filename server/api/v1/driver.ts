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

        // Get assigned routes
        const { data: routes } = await supabase
            .from('bus_routes')
            .select('id, route_name, route_number, start_time, end_time')
            .eq('organization_id', organizationId)
            .limit(1); // For now, assume driver assigned to first route

        const assignedRoute = routes && routes.length > 0 ? routes[0] : null;

        // Get assigned students if route exists
        let assignedStudents: any[] = [];
        if (assignedRoute) {
            const { data: assignments } = await supabase
                .from('student_bus_assignments')
                .select('lead_id')
                .eq('route_id', assignedRoute.id);

            if (assignments && assignments.length > 0) {
                const leadIds = assignments.map(a => a.lead_id);
                const { data: students } = await supabase
                    .from('leads')
                    .select('id, name, class, parent_phone')
                    .in('id', leadIds);

                assignedStudents = students || [];
            }
        }

        res.json({
            success: true,
            data: {
                driver: driver || { name: 'Driver', phone: '' },
                route: assignedRoute,
                assignedStudents
            }
        });
    } catch (error) {
        console.error('[Mobile API] Driver dashboard error:', error);
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
            data: {
                message: 'Location updated successfully'
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

        const { supabase } = await import('../../supabase.js');

        // Check if there's already an active session
        const { data: existingSession } = await supabase
            .from('active_bus_sessions')
            .select('id')
            .eq('route_id', routeId)
            .eq('status', 'active')
            .single();

        if (existingSession) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'SESSION_ALREADY_ACTIVE',
                    message: 'A trip is already in progress for this route'
                }
            });
        }

        // Create new session
        const { data: session, error } = await supabase
            .from('active_bus_sessions')
            .insert({
                route_id: routeId,
                driver_id: staffId,
                start_time: new Date().toISOString(),
                status: 'active'
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: {
                session
            }
        });
    } catch (error) {
        console.error('[Mobile API] Start trip error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'START_TRIP_ERROR',
                message: 'Failed to start trip'
            }
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
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_REQUEST',
                    message: 'sessionId is required'
                }
            });
        }

        const { supabase } = await import('../../supabase.js');

        // Update session status
        const { error } = await supabase
            .from('active_bus_sessions')
            .update({
                end_time: new Date().toISOString(),
                status: 'completed'
            })
            .eq('id', sessionId);

        if (error) throw error;

        res.json({
            success: true,
            data: {
                message: 'Trip ended successfully'
            }
        });
    } catch (error) {
        console.error('[Mobile API] End trip error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'END_TRIP_ERROR',
                message: 'Failed to end trip'
            }
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
        const { data: session } = await supabase
            .from('active_bus_sessions')
            .select(`
        id,
        route_id,
        start_time,
        status,
        bus_routes (
          id,
          route_name,
          route_number
        )
      `)
            .eq('driver_id', staffId)
            .eq('status', 'active')
            .single();

        res.json({
            success: true,
            data: {
                session: session || null
            }
        });
    } catch (error) {
        // If no active session, return null
        res.json({
            success: true,
            data: {
                session: null
            }
        });
    }
});

export default router;

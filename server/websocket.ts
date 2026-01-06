/**
 * WebSocket Server for Real-Time Bus Tracking
 * Handles GPS location updates from driver apps and broadcasts to parent apps
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { supabase } from './supabase.js';

interface LocationUpdate {
    routeId: string;
    sessionId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    altitude?: number;
    timestamp: string;
}

interface StopEvent {
    sessionId: string;
    stopId: string;
    eventType: 'arrived' | 'departed';
    studentsBoarded?: number;
    notes?: string;
}

interface BusSubscription {
    routeId: string;
    userId: string;
}

class BusTrackingWebSocket {
    private io: SocketIOServer;

    constructor(httpServer: HTTPServer) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: '*', // Configure this properly for production
                methods: ['GET', 'POST'],
                credentials: true,
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000,
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket: Socket) => {
            console.log('✅ Client connected:', socket.id);

            // Handle driver location updates
            socket.on('driver:location:update', async (data: LocationUpdate) => {
                await this.handleLocationUpdate(socket, data);
            });

            // Handle driver starting a trip
            socket.on('driver:trip:start', async (data: { routeId: string; sessionType: 'morning' | 'evening' }) => {
                await this.handleTripStart(socket, data);
            });

            // Handle driver ending a trip
            socket.on('driver:trip:end', async (data: { sessionId: string }) => {
                await this.handleTripEnd(socket, data);
            });

            // Handle stop arrival/departure
            socket.on('driver:stop:event', async (data: StopEvent) => {
                await this.handleStopEvent(socket, data);
            });

            // Handle parent subscribing to bus updates
            socket.on('parent:subscribe:bus', async (data: BusSubscription) => {
                await this.handleParentSubscribe(socket, data);
            });

            // Handle parent unsubscribing
            socket.on('parent:unsubscribe:bus', (data: { routeId: string }) => {
                socket.leave(`bus-${data.routeId}`);
                console.log(`📤 Parent ${socket.id} unsubscribed from bus-${data.routeId}`);
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                console.log('❌ Client disconnected:', socket.id);
            });

            // Handle errors
            socket.on('error', (error) => {
                console.error('🔴 Socket error:', error);
            });
        });
    }

    /**
     * Handle location update from driver
     */
    private async handleLocationUpdate(socket: Socket, data: LocationUpdate) {
        try {
            const { routeId, sessionId, latitude, longitude, speed, heading, accuracy, altitude, timestamp } = data;

            // Validate data
            if (!routeId || !sessionId || !latitude || !longitude) {
                socket.emit('error', { message: 'Missing required location data' });
                return;
            }

            // Save location to history
            const { error: historyError } = await supabase
                .from('bus_location_history')
                .insert({
                    session_id: sessionId,
                    route_id: routeId,
                    latitude,
                    longitude,
                    speed: speed || null,
                    heading: heading || null,
                    accuracy: accuracy || null,
                    altitude: altitude || null,
                    recorded_at: timestamp || new Date().toISOString(),
                });

            if (historyError) {
                console.error('Error saving location history:', historyError);
            }

            // Update active session with current location
            const { error: sessionError } = await supabase
                .from('active_bus_sessions')
                .update({
                    current_latitude: latitude,
                    current_longitude: longitude,
                    current_speed: speed || null,
                    current_heading: heading || null,
                    last_updated: new Date().toISOString(),
                })
                .eq('id', sessionId);

            if (sessionError) {
                console.error('Error updating session:', sessionError);
                socket.emit('error', { message: 'Failed to update session' });
                return;
            }

            // Broadcast location to all parents subscribed to this bus
            this.io.to(`bus-${routeId}`).emit('bus:location:update', {
                routeId,
                latitude,
                longitude,
                speed,
                heading,
                timestamp: timestamp || new Date().toISOString(),
            });

            // Check proximity to stops and trigger notifications
            await this.checkStopProximity(routeId, sessionId, latitude, longitude);

            // Acknowledge to driver
            socket.emit('location:update:ack', { success: true, timestamp: new Date().toISOString() });
        } catch (error) {
            console.error('Error handling location update:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    }

    /**
     * Handle trip start
     */
    private async handleTripStart(socket: Socket, data: { routeId: string; sessionType: 'morning' | 'evening' }) {
        try {
            const { routeId, sessionType } = data;

            // Get driver info from socket (you'll need to add authentication)
            // For now, we'll assume driver ID is passed during connection
            const driverId = (socket as any).userId; // Add proper typing

            if (!driverId) {
                socket.emit('error', { message: 'Authentication required' });
                return;
            }

            // Check if there's already an active session for this route
            const { data: existingSession } = await supabase
                .from('active_bus_sessions')
                .select('id')
                .eq('route_id', routeId)
                .eq('status', 'active')
                .single();

            if (existingSession) {
                socket.emit('error', { message: 'Route already has an active session' });
                return;
            }

            // Create new session
            const { data: newSession, error } = await supabase
                .from('active_bus_sessions')
                .insert({
                    route_id: routeId,
                    driver_id: driverId,
                    session_type: sessionType,
                    status: 'active',
                    started_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error || !newSession) {
                console.error('Error creating session:', error);
                socket.emit('error', { message: 'Failed to start trip' });
                return;
            }

            // Join driver to route room
            socket.join(`driver-${routeId}`);

            // Notify all parents that bus has started
            this.io.to(`bus-${routeId}`).emit('bus:trip:started', {
                routeId,
                sessionId: newSession.id,
                sessionType,
                startedAt: newSession.started_at,
            });

            // Send notifications to parents
            await this.notifyParentsTripStarted(routeId, sessionType);

            socket.emit('trip:start:ack', {
                success: true,
                sessionId: newSession.id,
                startedAt: newSession.started_at
            });

            console.log(`🚌 Trip started: Route ${routeId}, Session ${newSession.id}`);
        } catch (error) {
            console.error('Error starting trip:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    }

    /**
     * Handle trip end
     */
    private async handleTripEnd(socket: Socket, data: { sessionId: string }) {
        try {
            const { sessionId } = data;

            // Update session status
            const { data: session, error } = await supabase
                .from('active_bus_sessions')
                .update({
                    status: 'completed',
                    ended_at: new Date().toISOString(),
                })
                .eq('id', sessionId)
                .select('route_id')
                .single();

            if (error || !session) {
                socket.emit('error', { message: 'Failed to end trip' });
                return;
            }

            // Notify parents that trip has ended
            this.io.to(`bus-${session.route_id}`).emit('bus:trip:ended', {
                routeId: session.route_id,
                sessionId,
                endedAt: new Date().toISOString(),
            });

            socket.emit('trip:end:ack', { success: true });

            console.log(`✅ Trip ended: Session ${sessionId}`);
        } catch (error) {
            console.error('Error ending trip:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    }

    /**
     * Handle stop arrival/departure events
     */
    private async handleStopEvent(socket: Socket, data: StopEvent) {
        try {
            const { sessionId, stopId, eventType, studentsBoarded, notes } = data;

            // Get current location from session
            const { data: session } = await supabase
                .from('active_bus_sessions')
                .select('current_latitude, current_longitude, route_id')
                .eq('id', sessionId)
                .single();

            if (!session) {
                socket.emit('error', { message: 'Session not found' });
                return;
            }

            // Record stop event
            const { error } = await supabase
                .from('bus_stop_events')
                .insert({
                    session_id: sessionId,
                    stop_id: stopId,
                    event_type: eventType,
                    latitude: session.current_latitude,
                    longitude: session.current_longitude,
                    students_boarded: studentsBoarded || 0,
                    notes: notes || null,
                });

            if (error) {
                console.error('Error recording stop event:', error);
                socket.emit('error', { message: 'Failed to record stop event' });
                return;
            }

            // Update current stop in session
            if (eventType === 'arrived') {
                await supabase
                    .from('active_bus_sessions')
                    .update({ current_stop_id: stopId })
                    .eq('id', sessionId);
            }

            // Broadcast to parents
            this.io.to(`bus-${session.route_id}`).emit('bus:stop:event', {
                routeId: session.route_id,
                stopId,
                eventType,
                timestamp: new Date().toISOString(),
            });

            // Notify parents at this stop
            await this.notifyParentsAtStop(stopId, eventType);

            socket.emit('stop:event:ack', { success: true });

            console.log(`📍 Stop event: ${eventType} at stop ${stopId}`);
        } catch (error) {
            console.error('Error handling stop event:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    }

    /**
     * Handle parent subscribing to bus updates
     */
    private async handleParentSubscribe(socket: Socket, data: BusSubscription) {
        try {
            const { routeId, userId } = data;

            // Join parent to bus room
            socket.join(`bus-${routeId}`);

            // Store user ID in socket data for future use
            (socket as any).userId = userId;

            // Get current bus location if session is active
            const { data: activeSession } = await supabase
                .from('active_bus_sessions')
                .select('*')
                .eq('route_id', routeId)
                .eq('status', 'active')
                .single();

            if (activeSession) {
                // Send current location immediately
                socket.emit('bus:location:current', {
                    routeId,
                    latitude: activeSession.current_latitude,
                    longitude: activeSession.current_longitude,
                    speed: activeSession.current_speed,
                    heading: activeSession.current_heading,
                    lastUpdated: activeSession.last_updated,
                    currentStopId: activeSession.current_stop_id,
                });
            }

            console.log(`📥 Parent ${userId} subscribed to bus-${routeId}`);
            socket.emit('subscribe:ack', { success: true, routeId });
        } catch (error) {
            console.error('Error subscribing parent:', error);
            socket.emit('error', { message: 'Failed to subscribe' });
        }
    }

    /**
     * Check proximity to stops and trigger notifications
     */
    private async checkStopProximity(routeId: string, sessionId: string, latitude: number, longitude: number) {
        try {
            // Get all stops for this route
            const { data: stops } = await supabase
                .from('bus_stops')
                .select('*, student_bus_assignments(student_id)')
                .eq('route_id', routeId);

            if (!stops) return;

            for (const stop of stops) {
                // Calculate distance using Haversine formula (implemented in database)
                const { data: distance } = await supabase
                    .rpc('calculate_distance', {
                        lat1: latitude,
                        lon1: longitude,
                        lat2: stop.latitude,
                        lon2: stop.longitude,
                    });

                if (!distance) continue;

                // If within 500 meters, send 5-min notification
                if (distance <= 500 && distance > 200) {
                    await this.sendProximityNotification(stop.id, '5 minutes away');
                }

                // If within 200 meters (or geofence radius), send arrival notification
                if (distance <= (stop.geofence_radius || 200)) {
                    await this.sendProximityNotification(stop.id, 'arriving now');
                }
            }
        } catch (error) {
            console.error('Error checking stop proximity:', error);
        }
    }

    /**
     * Send proximity notification to parents at a stop
     */
    private async sendProximityNotification(stopId: string, message: string) {
        // This will be implemented with FCM integration
        // For now, just emit via WebSocket
        this.io.to(`stop-${stopId}`).emit('bus:proximity:alert', {
            stopId,
            message,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Notify parents that trip has started
     */
    private async notifyParentsTripStarted(routeId: string, sessionType: string) {
        // TODO: Implement FCM push notifications
        // For now, just log
        console.log(`📢 Notifying parents: ${sessionType} trip started for route ${routeId}`);
    }

    /**
     * Notify parents at a specific stop
     */
    private async notifyParentsAtStop(stopId: string, eventType: string) {
        // TODO: Implement FCM push notifications
        console.log(`📢 Notifying parents at stop ${stopId}: Bus ${eventType}`);
    }

    /**
     * Get Socket.IO instance
     */
    public getIO(): SocketIOServer {
        return this.io;
    }
}

export default BusTrackingWebSocket;

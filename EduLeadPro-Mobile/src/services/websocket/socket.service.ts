/**
 * WebSocket Service for Real-Time Bus Tracking
 */

import { io, Socket } from 'socket.io-client';
import { WEBSOCKET_URL } from '../../utils/constants';
import { LocationUpdate } from '../../types/bus.types';

class WebSocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    /**
     * Connect to WebSocket server
     */
    connect(): void {
        if (this.socket?.connected) {
            console.log('WebSocket already connected');
            return;
        }

        this.socket = io(WEBSOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            timeout: 10000,
        });

        this.setupEventHandlers();
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Setup event handlers
     */
    private setupEventHandlers(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('🔴 WebSocket connection error:', error);
            this.reconnectAttempts++;
        });

        this.socket.on('error', (error) => {
            console.error('🔴 WebSocket error:', error);
        });
    }

    /**
     * Subscribe to bus location updates (Parent)
     */
    subscribeToBus(routeId: string, userId: string, onLocationUpdate: (data: any) => void): void {
        if (!this.socket) {
            console.error('WebSocket not connected');
            return;
        }

        // Send subscription request
        this.socket.emit('parent:subscribe:bus', { routeId, userId });

        // Listen for location updates
        this.socket.on('bus:location:update', onLocationUpdate);

        // Listen for current location (sent immediately on subscription)
        this.socket.on('bus:location:current', onLocationUpdate);

        // Listen for trip events
        this.socket.on('bus:trip:started', (data) => {
            console.log('🚌 Bus trip started:', data);
        });

        this.socket.on('bus:trip:ended', (data) => {
            console.log('🏁 Bus trip ended:', data);
        });

        // Listen for stop events
        this.socket.on('bus:stop:event', (data) => {
            console.log('📍 Bus stop event:', data);
        });

        // Listen for proximity alerts
        this.socket.on('bus:proximity:alert', (data) => {
            console.log('⚠️ Bus proximity alert:', data);
        });

        console.log(`📥 Subscribed to bus updates for route: ${routeId}`);
    }

    /**
     * Unsubscribe from bus updates
     */
    unsubscribeFromBus(routeId: string): void {
        if (!this.socket) return;

        this.socket.emit('parent:unsubscribe:bus', { routeId });
        this.socket.off('bus:location:update');
        this.socket.off('bus:location:current');
        this.socket.off('bus:trip:started');
        this.socket.off('bus:trip:ended');
        this.socket.off('bus:stop:event');
        this.socket.off('bus:proximity:alert');

        console.log(`📤 Unsubscribed from bus updates for route: ${routeId}`);
    }

    /**
     * Start bus trip (Driver)
     */
    startTrip(routeId: string, sessionType: 'morning' | 'evening', onAck: (data: any) => void): void {
        if (!this.socket) {
            console.error('WebSocket not connected');
            return;
        }

        this.socket.emit('driver:trip:start', { routeId, sessionType });
        this.socket.once('trip:start:ack', onAck);
    }

    /**
     * Send location update (Driver)
     */
    sendLocationUpdate(locationData: LocationUpdate, onAck?: (data: any) => void): void {
        if (!this.socket) {
            console.error('WebSocket not connected');
            return;
        }

        this.socket.emit('driver:location:update', locationData);

        if (onAck) {
            this.socket.once('location:update:ack', onAck);
        }
    }

    /**
     * End bus trip (Driver)
     */
    endTrip(sessionId: string, onAck: (data: any) => void): void {
        if (!this.socket) {
            console.error('WebSocket not connected');
            return;
        }

        this.socket.emit('driver:trip:end', { sessionId });
        this.socket.once('trip:end:ack', onAck);
    }

    /**
     * Mark stop arrival/departure (Driver)
     */
    markStopEvent(
        sessionId: string,
        stopId: string,
        eventType: 'arrived' | 'departed',
        studentsBoarded?: number,
        notes?: string,
        onAck?: (data: any) => void
    ): void {
        if (!this.socket) {
            console.error('WebSocket not connected');
            return;
        }

        this.socket.emit('driver:stop:event', {
            sessionId,
            stopId,
            eventType,
            studentsBoarded,
            notes,
        });

        if (onAck) {
            this.socket.once('stop:event:ack', onAck);
        }
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;

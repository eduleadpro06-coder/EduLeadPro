/**
 * Location Tracking Service
 * Handles GPS tracking for bus drivers with 30-second interval updates
 */

import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { api } from '../../services/api';

class LocationTrackingService {
    private isTracking: boolean = false;
    private locationSubscription: Location.LocationSubscription | null = null;
    private locationUpdateInterval: NodeJS.Timeout | null = null;
    private currentRouteId: number | null = null;
    private lastLocation: Location.LocationObject | null = null;

    /**
     * Request location permissions from the user
     */
    async requestPermissions(): Promise<boolean> {
        try {
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

            if (foregroundStatus !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Location permission is required for bus tracking. Please enable it in settings.',
                    [{ text: 'OK' }]
                );
                return false;
            }

            // Request background permissions for continuous tracking
            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

            if (backgroundStatus !== 'granted') {
                Alert.alert(
                    'Background Permission',
                    'Background location is recommended for continuous tracking even when the app is minimized.',
                    [{ text: 'OK' }]
                );
            }

            return true;
        } catch (error) {
            console.error('Error requesting location permissions:', error);
            return false;
        }
    }

    /**
     * Start tracking location for a specific bus route
     */
    async startTracking(routeId: number): Promise<boolean> {
        if (this.isTracking) {
            console.log('Already tracking location');
            return true;
        }

        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
            return false;
        }

        try {
            this.currentRouteId = routeId;
            this.isTracking = true;

            // Start location tracking with high accuracy
            this.locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced, // Balance between battery and accuracy
                    timeInterval: 30000, // 30 seconds
                    distanceInterval: 50, // Update if moved 50 meters
                },
                (location) => {
                    this.lastLocation = location;
                    this.handleLocationUpdate(location);
                }
            );

            // Send initial location immediately
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            this.lastLocation = currentLocation;
            await this.sendLocationToServer(currentLocation);

            console.log('Location tracking started for route:', routeId);
            return true;
        } catch (error) {
            console.error('Error starting location tracking:', error);
            this.isTracking = false;
            Alert.alert('Error', 'Failed to start location tracking. Please try again.');
            return false;
        }
    }

    /**
     * Stop tracking location
     */
    async stopTracking(): Promise<void> {
        if (!this.isTracking) {
            return;
        }

        try {
            // Stop location subscription
            if (this.locationSubscription) {
                this.locationSubscription.remove();
                this.locationSubscription = null;
            }

            // Clear interval
            if (this.locationUpdateInterval) {
                clearInterval(this.locationUpdateInterval);
                this.locationUpdateInterval = null;
            }

            // Mark tracking as inactive in backend
            if (this.currentRouteId) {
                await api.post('/driver/location/stop-tracking', {
                    routeId: this.currentRouteId,
                });
            }

            this.isTracking = false;
            this.currentRouteId = null;
            this.lastLocation = null;

            console.log('Location tracking stopped');
        } catch (error) {
            console.error('Error stopping location tracking:', error);
        }
    }

    /**
     * Handle location update from GPS
     */
    private handleLocationUpdate(location: Location.LocationObject): void {
        console.log('Location updated:', {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
            speed: location.coords.speed,
            heading: location.coords.heading,
        });

        // Send to server (already happens every 30s via watchPositionAsync)
        this.sendLocationToServer(location);
    }

    /**
     * Send location data to backend server
     */
    private async sendLocationToServer(location: Location.LocationObject): Promise<void> {
        if (!this.currentRouteId) {
            console.warn('No route ID set, skipping location update');
            return;
        }

        try {
            const locationData = {
                routeId: this.currentRouteId,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                speed: location.coords.speed ? location.coords.speed * 3.6 : 0, // Convert m/s to km/h
                heading: location.coords.heading || 0,
                accuracy: location.coords.accuracy || 0,
                timestamp: location.timestamp,
            };

            await api.post('/driver/location', locationData);
            console.log('Location sent to server successfully');
        } catch (error) {
            console.error('Error sending location to server:', error);
            // Don't alert user for every failed update, just log it
        }
    }

    /**
     * Get current tracking status
     */
    getTrackingStatus(): { isTracking: boolean; routeId: number | null; lastLocation: Location.LocationObject | null } {
        return {
            isTracking: this.isTracking,
            routeId: this.currentRouteId,
            lastLocation: this.lastLocation,
        };
    }

    /**
     * Get last known location
     */
    getLastLocation(): Location.LocationObject | null {
        return this.lastLocation;
    }
}

export const locationTrackingService = new LocationTrackingService();
export default locationTrackingService;

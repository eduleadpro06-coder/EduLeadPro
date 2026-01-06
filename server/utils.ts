/**
 * Utility functions for mobile API
 */

import express from 'express';
import { storage } from './storage.js';

/**
 * Extract organization ID from authenticated user
 */
export async function getOrganizationId(req: express.Request): Promise<number | undefined> {
    // Check session first (secure)
    let username = (req.session as any)?.username;

    // Fallback to header (for mobile app)
    if (!username) {
        username = req.headers['x-user-name'] as string;
    }

    if (!username) return undefined;

    // Normalization: trim whitespace
    const identifier = username.trim();

    // Try lookup by username (case-insensitive via ilike in storage)
    let user = await storage.getUserByUsername(identifier);

    // Fallback: try lookup by email if username lookup failed
    if (!user) {
        user = await storage.getUserByEmail(identifier);
    }

    if (!user) {
        console.warn(`[Auth] No user found for identifier: "${identifier}"`);
        return undefined;
    }

    if (!user.organizationId) {
        console.warn(`[Auth] User "${identifier}" found (ID: ${user.id}) but has no organizationId assigned.`);
    }

    return user.organizationId || undefined;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Calculate ETA based on distance and average speed
 * @param distance Distance in meters
 * @param averageSpeed Speed in km/h (default 30 km/h for city traffic)
 * @returns ETA in minutes
 */
export function calculateETA(distance: number, averageSpeed: number = 30): number {
    const distanceInKm = distance / 1000;
    const timeInHours = distanceInKm / averageSpeed;
    return Math.round(timeInHours * 60); // Convert to minutes
}

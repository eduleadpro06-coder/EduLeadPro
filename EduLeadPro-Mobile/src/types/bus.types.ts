/**
 * Bus Tracking Types
 */

export interface BusRoute {
    id: string;
    organization_id: number;
    route_name: string;
    bus_number: string;
    driver_id?: string;
    route_type: 'morning' | 'evening' | 'both';
    start_time?: string;
    end_time?: string;
    capacity: number;
    active: boolean;
    bus_stops?: BusStop[];
    users?: {
        id: string;
        name: string;
        phone?: string;
    };
}

export interface BusStop {
    id: string;
    route_id: string;
    stop_name: string;
    stop_address?: string;
    latitude: number;
    longitude: number;
    stop_order: number;
    estimated_arrival_time?: string;
    geofence_radius: number;
}

export interface ActiveBusSession {
    id: string;
    route_id: string;
    driver_id: string;
    session_type: 'morning' | 'evening';
    started_at: string;
    ended_at?: string;
    current_latitude?: number;
    current_longitude?: number;
    current_speed?: number;
    current_heading?: number;
    status: 'active' | 'paused' | 'completed' | 'cancelled';
    current_stop_id?: string;
    last_updated: string;
    bus_routes?: BusRoute;
    users?: {
        id: string;
        name: string;
        phone?: string;
    };
}

export interface LocationUpdate {
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

export interface BusLocationHistory {
    id: string;
    session_id: string;
    route_id: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    altitude?: number;
    recorded_at: string;
}

export interface StopEvent {
    id: string;
    session_id: string;
    stop_id: string;
    event_type: 'arrived' | 'departed';
    event_time: string;
    latitude?: number;
    longitude?: number;
    students_boarded?: number;
    notes?: string;
}

export interface BusTrackingState {
    activeSession: ActiveBusSession | null;
    currentLocation: {
        latitude: number;
        longitude: number;
    } | null;
    route: BusRoute | null;
    stops: BusStop[];
    isTracking: boolean;
    eta: number | null; // minutes
    distanceToStop: number | null; // meters
}

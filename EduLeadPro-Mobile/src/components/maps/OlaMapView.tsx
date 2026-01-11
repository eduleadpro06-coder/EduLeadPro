/**
 * Ola Maps View Component
 * Implementation using WebView + MapLibre GL + Ola Maps Vector Tiles
 * 
 * This approach works in Expo Go and ensures consistency with the Web Admin Panel.
 * It bypasses the need for native .aar files and complex build configurations.
 */

import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { OLA_MAPS_API_KEY } from '../../config';

interface MapLocation {
    latitude: number;
    longitude: number;
}

interface MapMarker {
    id?: string;
    coordinate: MapLocation;
    title?: string;
    description?: string;
    icon?: 'bus' | 'stop' | 'school';
    pinColor?: string;
}

interface OlaMapViewProps {
    center?: MapLocation;
    zoom?: number;
    markers?: MapMarker[];
    route?: MapLocation[];
    showUserLocation?: boolean;
    onMapReady?: () => void;
    onMarkerPress?: (marker: MapMarker) => void;
    style?: any;
}

export default function OlaMapView({
    center,
    zoom = 14,
    markers = [],
    onMapReady,
    onMarkerPress,
    style,
}: OlaMapViewProps) {
    const webviewRef = useRef<WebView>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    // Initial Center
    const [initialCenter] = useState(center || { latitude: 12.9716, longitude: 77.5946 });

    // HTML Content for the Map
    // We use MapLibre GL (Official Ola Recommendation) loaded via CDN
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
            <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
            <style>
                body { margin: 0; padding: 0; }
                #map { position: absolute; top: 0; bottom: 0; width: 100%; }
                .marker-bus {
                    font-size: 24px;
                    line-height: 24px;
                    width: 30px; height: 30px;
                    text-align: center;
                    display: flex; justify-content: center; align-items: center;
                    background: white; border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    border: 2px solid #4f46e5;
                }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                const API_KEY = '${OLA_MAPS_API_KEY}';
                const STYLE_URL = 'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json?api_key=' + API_KEY;
                
                let map;
                let markersMap = {};

                function init() {
                    try {
                        map = new maplibregl.Map({
                            container: 'map',
                            style: STYLE_URL,
                            center: [${initialCenter.longitude}, ${initialCenter.latitude}],
                            zoom: ${zoom},
                            attributionControl: false
                        });

                        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
                        map.addControl(new maplibregl.AttributionControl({ customAttribution: '© Ola Maps' }), 'bottom-right');

                        map.on('load', () => {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
                        });
                        
                        // Error handling for tiles
                        map.on('error', (e) => {
                             if(e.error && e.error.status === 403) {
                                 console.warn("Domain blocked");
                             }
                        });

                    } catch (e) {
                         window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.message }));
                    }
                }

                // Update Markers Function called from React Native
                window.updateMarkers = (markersList) => {
                    if (!map) return;

                    const currentIds = [];
                    
                    markersList.forEach(m => {
                        const id = m.id || 'm_' + m.coordinate.latitude + '_' + m.coordinate.longitude;
                        currentIds.push(id);
                        
                        const lngLat = [m.coordinate.longitude, m.coordinate.latitude];

                        if (markersMap[id]) {
                            // Update existing
                            markersMap[id].setLngLat(lngLat);
                        } else {
                            // Create new
                            const el = document.createElement('div');
                            
                            // Custom Icons logic
                            if (m.icon === 'bus') {
                                el.className = 'marker-bus';
                                el.innerHTML = '🚌';
                            } else if (m.icon === 'stop') {
                                el.className = 'marker-bus';
                                el.style.border = '2px solid #10b981';
                                el.innerHTML = '🚏'; 
                            } else {
                                el.className = 'marker-bus'; // Fallback
                                el.style.border = '2px solid #ef4444';
                                el.innerHTML = '📍';
                            }
                            
                            el.addEventListener('click', () => {
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MARKER_PRESS', payload: m }));
                            });

                            const marker = new maplibregl.Marker({ element: el })
                                .setLngLat(lngLat)
                                .addTo(map);
                            
                            markersMap[id] = marker;
                        }
                    });

                    // Cleanup removed markers
                    Object.keys(markersMap).forEach(key => {
                        if (!currentIds.includes(key)) {
                            markersMap[key].remove();
                            delete markersMap[key];
                        }
                    });
                }

                init();
            </script>
        </body>
        </html>
    `;

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'MAP_READY') {
                setIsMapReady(true);
                if (onMapReady) onMapReady();
            } else if (data.type === 'MARKER_PRESS') {
                if (onMarkerPress) onMarkerPress(data.payload);
            }
        } catch (e) {
            console.error("Map Message Error", e);
        }
    };

    // Update markers when prop changes
    useEffect(() => {
        if (isMapReady && webviewRef.current) {
            const safeMarkers = JSON.stringify(markers);
            webviewRef.current.injectJavaScript(`window.updateMarkers(${safeMarkers}); true;`);
        }
    }, [markers, isMapReady]);

    // Update center when prop changes (optional)
    useEffect(() => {
        if (isMapReady && webviewRef.current && center) {
            webviewRef.current.injectJavaScript(`
                if(map) { 
                    map.flyTo({ center: [${center.longitude}, ${center.latitude}], zoom: ${zoom} }); 
                } 
                true;
            `);
        }
    }, [center, isMapReady]); // Note: Adding zoom might conflict if user zooms manually, but acceptable for tracking

    return (
        <View style={[styles.container, style]}>
            <WebView
                ref={webviewRef}
                style={{ flex: 1, backgroundColor: '#e5e7eb' }}
                source={{ html: htmlContent, baseUrl: 'https://eduleadconnect.vercel.app/' }} // Ensure trailing slash for Origin header matching
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4f46e5" />
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
        minHeight: 200,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
    },
});

/**
 * Ola Maps View Component
 * Implementation using WebView + Official Ola Maps Web SDK v2
 */

import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
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
    route?: MapLocation[]; // List of coordinates for the polyline
    showUserLocation?: boolean;
    onMapReady?: () => void;
    onMarkerPress?: (marker: MapMarker) => void;
    style?: any;
}

export default function OlaMapView({
    center,
    zoom = 14,
    markers = [],
    route = [],
    onMapReady,
    onMarkerPress,
    style,
}: OlaMapViewProps) {
    const webviewRef = useRef<WebView>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    // Initial Center
    const [initialCenter] = useState(center || { latitude: 12.9716, longitude: 77.5946 });

    // HTML Content for the Map using Official Web SDK v2
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link href="https://cdn.jsdelivr.net/npm/olamaps-web-sdk@latest/dist/style.css" rel="stylesheet" />
            <style>
                body { margin: 0; padding: 0; }
                #map { position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; background: #f0f0f0; }
                .marker-bus {
                    font-size: 24px;
                    line-height: 24px;
                    width: 32px; height: 32px;
                    text-align: center;
                    display: flex; justify-content: center; align-items: center;
                    background: white; border-radius: 50%;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                    border: 2px solid #7C3AED;
                }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script src="https://www.unpkg.com/olamaps-web-sdk@latest/dist/olamaps-web-sdk.umd.js"></script>
            <script>
                let map;
                let olamaps;
                let markersMap = {};

                async function init() {
                    try {
                        olamaps = new OlaMaps.OlaMaps({
                            apiKey: '${OLA_MAPS_API_KEY}',
                            mode: '3d',
                            threedTileset: 'https://api.olamaps.io/tiles/vector/v1/3dtiles/tileset.json'
                        });

                        map = await olamaps.init({
                            style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
                            container: 'map',
                            center: [${initialCenter.longitude}, ${initialCenter.latitude}],
                            zoom: ${zoom}
                        });

                        // Defensive check for navigation control
                        try {
                            if (olamaps.addNavigationControl) {
                                map.addControl(olamaps.addNavigationControl(), 'top-right');
                            }
                        } catch (e) {
                            console.warn("Control Error:", e);
                        }

                        map.on('load', () => {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
                        });

                        map.on('error', (e) => {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.message || 'Map Load Error' }));
                        });

                    } catch (e) {
                         window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.message }));
                    }
                }

                // Update Route Function
                window.updateRoute = (coords) => {
                    if (!map) return;
                    
                    if (map.getSource('route')) {
                        map.getSource('route').setData({
                            type: 'Feature',
                            properties: {},
                            geometry: {
                                type: 'LineString',
                                coordinates: coords
                            }
                        });
                    } else {
                        map.addSource('route', {
                            type: 'geojson',
                            data: {
                                type: 'Feature',
                                properties: {},
                                geometry: {
                                    type: 'LineString',
                                    coordinates: coords
                                }
                            }
                        });

                        map.addLayer({
                            id: 'route',
                            type: 'line',
                            source: 'route',
                            layout: {
                                'line-join': 'round',
                                'line-cap': 'round'
                            },
                            paint: {
                                'line-color': '#4f46e5',
                                'line-width': 5,
                                'line-opacity': 0.75
                            }
                        });
                    }
                };

                window.updateMarkers = (markersList) => {
                    if (!map) return;

                    const currentIds = [];
                    markersList.forEach(m => {
                        const id = m.id || 'm_' + m.coordinate.latitude + '_' + m.coordinate.longitude;
                        currentIds.push(id);
                        const lngLat = [m.coordinate.longitude, m.coordinate.latitude];

                        if (markersMap[id]) {
                            markersMap[id].setLngLat(lngLat);
                        } else {
                            const el = document.createElement('div');
                            el.className = 'marker-bus';
                            
                            if (m.icon === 'bus') el.innerHTML = '🚌';
                            else if (m.icon === 'stop') {
                                el.innerHTML = '🚏'; 
                                el.style.border = '2px solid #10b981';
                            } else {
                                el.innerHTML = '📍';
                                el.style.border = '2px solid #ef4444';
                            }

                            el.onclick = () => {
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MARKER_PRESS', payload: m }));
                            };

                            const marker = new OlaMaps.Marker({ element: el })
                                .setLngLat(lngLat)
                                .addTo(map);
                            
                            markersMap[id] = marker;
                        }
                    });

                    Object.keys(markersMap).forEach(key => {
                        if (!currentIds.includes(key)) {
                            markersMap[key].remove();
                            delete markersMap[key];
                        }
                    });
                };

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

                // Push initial markers
                if (markers.length > 0) {
                    const safeMarkers = JSON.stringify(markers);
                    webviewRef.current?.injectJavaScript(`window.updateMarkers(${safeMarkers}); true;`);
                }

                // Push initial route
                if (route.length > 0) {
                    const safeRoute = JSON.stringify(route.map(r => [r.longitude, r.latitude]));
                    webviewRef.current?.injectJavaScript(`window.updateRoute(${safeRoute}); true;`);
                }
            } else if (data.type === 'MARKER_PRESS') {
                if (onMarkerPress) onMarkerPress(data.payload);
            }
        } catch (e) {
            console.error("Map Message Error", e);
        }
    };

    useEffect(() => {
        if (isMapReady && webviewRef.current) {
            const safeMarkers = JSON.stringify(markers);
            webviewRef.current.injectJavaScript(`window.updateMarkers(${safeMarkers}); true;`);
        }
    }, [markers, isMapReady]);

    // Update route when prop changes
    useEffect(() => {
        if (isMapReady && webviewRef.current && route.length > 0) {
            const safeRoute = JSON.stringify(route.map(r => [r.longitude, r.latitude]));
            webviewRef.current.injectJavaScript(`window.updateRoute(${safeRoute}); true;`);
        }
    }, [route, isMapReady]);

    useEffect(() => {
        if (isMapReady && webviewRef.current && center) {
            webviewRef.current.injectJavaScript(`
                if(map) { 
                    map.flyTo({ center: [${center.longitude}, ${center.latitude}], zoom: ${zoom} }); 
                } 
                true;
            `);
        }
    }, [center, isMapReady]);

    return (
        <View style={[styles.container, style]}>
            <WebView
                ref={webviewRef}
                style={{ flex: 1, backgroundColor: '#f3f4f6' }}
                source={{ html: htmlContent, baseUrl: 'https://eduleadconnect.vercel.app/' }}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#7C3AED" />
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
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
    },
});

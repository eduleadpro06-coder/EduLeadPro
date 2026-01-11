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
            <link href="https://www.unpkg.com/olamaps-web-sdk@latest/dist/style.css" rel="stylesheet" crossorigin="anonymous" />
            <style>
                html, body { 
                    margin: 0; padding: 0; height: 100%; width: 100%; 
                    overflow: hidden; background: #ffffff; 
                    -webkit-tap-highlight-color: transparent;
                }
                #map { 
                    position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; 
                    background: #f3f4f6;
                    z-index: 1;
                    transform: translateZ(0); -webkit-transform: translateZ(0);
                }
                .marker-bus {
                    z-index: 100; font-size: 24px; line-height: 24px; width: 32px; height: 32px;
                    text-align: center; display: flex; justify-content: center; align-items: center;
                    background: white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                    border: 2px solid #7C3AED;
                }
                .marker-school {
                    z-index: 95; width: 32px; height: 32px;
                    background: #3B82F6; /* Blue-500 */
                    border: 2px solid white; border-radius: 4px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                    display: flex; justify-content: center; align-items: center;
                    color: white; font-weight: bold; font-family: sans-serif;
                }
                .marker-school::after { content: 'S'; }
                .marker-stop {
                    z-index: 90; width: 16px; height: 16px;
                    background: #EF4444; /* Red-500 */
                    border: 2px solid white; border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                canvas { 
                    width: 100% !important; height: 100% !important; 
                    opacity: 1 !important; display: block !important; 
                }
                /* Hide Branding and Attribution */
                /* Hide Branding and Attribution - AGGRESSIVE */
                .maplibregl-ctrl-attrib, .maplibregl-ctrl-logo, .maplibregl-compact, .maplibregl-ctrl,
                .olamaps-logo, .ola-logo, .ola-attribution, .ola-maps-container img,
                .maplibregl-ctrl-bottom-left, .maplibregl-ctrl-bottom-right,
                a[href*="olamaps"], a[href*="openstreetmap"] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script src="https://www.unpkg.com/olamaps-web-sdk@latest/dist/olamaps-web-sdk.umd.js" crossorigin="anonymous"></script>
            <script>
                let map;
                let olamaps;
                let markersMap = {};
                let sdkLoaded = false;
                let initAttempted = false;
                let startTime = Date.now();
                let tilesLoading = 0;

                const updateStatus = (msg) => {
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ 
                            type: 'LOG', 
                            message: "[" + window.location.host + "] " + msg 
                        }));
                    }
                };

                const log = (msg) => updateStatus(msg);

                window.onerror = function(m, s, l, c, e) { log("JS ERROR: " + m); };

                function checkSDK() {
                    if (window.OlaMaps) {
                        log("SDK Found v" + (window.OlaMaps.version || "2"));
                        sdkLoaded = true;
                        if (!initAttempted) init();
                    } else { 
                        updateStatus("Waiting for SDK...");
                        setTimeout(checkSDK, 500); 
                    }
                }

                async function init() {
                    if (!sdkLoaded || initAttempted) return;
                    initAttempted = true;

                    try {
                        const ns = window.OlaMaps;
                        const OlaSDK = (ns && ns.OlaMaps) ? ns.OlaMaps : ns;

                        log("Initializing Map...");
                        olamaps = new OlaSDK({ 
                            apiKey: '${OLA_MAPS_API_KEY}'
                        });

                        map = await olamaps.init({
                            style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
                            container: 'map',
                            center: [${initialCenter.longitude}, ${initialCenter.latitude}],
                            zoom: ${zoom},
                            pitch: 75,
                            showConfiguration: false,
                            attributionControl: false,
                            logoControl: false,
                            preserveDrawingBuffer: true,
                            antialias: true
                        });

                        window.map = map;
                        log("Map Ready - Tiles Loading...");

                        map.on('dataloading', () => { tilesLoading++; updateStatus("Loading Tiles..."); });
                        map.on('data', () => { if(tilesLoading > 0) tilesLoading--; });

                        map.on('load', () => {
                            const c = document.querySelector('canvas');
                            const size = c ? (c.clientWidth + 'x' + c.clientHeight) : '??';
                            log("RENDER SUCCESS | " + size);
                            map.resize();
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
                        });

                        map.on('error', (e) => {
                            const msg = e.message || "Map Error";
                            if (!msg.includes("3d_model")) log("MAP ERR: " + msg.substring(0, 40));
                        });

                        // Markers & Routes Handlers
                        window.updateRoute = (coords) => {
                            if (!map) return;
                            try {
                                log("Updating route with " + coords.length + " points");
                                const sourceId = 'route';
                                if (map.getSource(sourceId)) {
                                    map.getSource(sourceId).setData({
                                        type: 'Feature',
                                        properties: {},
                                        geometry: { type: 'LineString', coordinates: coords }
                                    });
                                } else {
                                    map.addSource(sourceId, {
                                        type: 'geojson',
                                        data: {
                                            type: 'Feature',
                                            properties: {},
                                            geometry: { type: 'LineString', coordinates: coords }
                                        }
                                    });
                                    map.addLayer({
                                        id: 'route-layer',
                                        type: 'line',
                                        source: sourceId,
                                        layout: { 'line-join': 'round', 'line-cap': 'round' },
                                        paint: { 
                                            'line-color': '#2563EB', 
                                            'line-width': 6, 
                                            'line-opacity': 0.8 
                                        }
                                    });
                                }
                                map.triggerRepaint();
                            } catch (err) { log("Route Update Err: " + err.message); }
                        };

                        window.updateMarkers = (list) => {
                            if (!map) return;
                            try {
                                const activeIds = [];
                                list.forEach(m => {
                                    const id = m.id || 'm_' + m.coordinate.latitude + '_' + m.coordinate.longitude;
                                    activeIds.push(id);
                                    if (markersMap[id]) {
                                        markersMap[id].setLngLat([m.coordinate.longitude, m.coordinate.latitude]);
                                    } else {
                                    } else {
                                        const el = document.createElement('div');
                                        
                                        if (m.icon === 'school') {
                                            el.className = 'marker-school';
                                        } else if (m.icon === 'stop') {
                                            el.className = 'marker-stop';
                                        } else {
                                            el.className = 'marker-bus';
                                            el.innerHTML = (m.icon === 'bus') ? '🚌' : '📍';
                                        }

                                        el.onclick = () => window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MARKER_PRESS', payload: m }));
                                        
                                        const marker = new ns.Marker({ element: el })
                                            .setLngLat([m.coordinate.longitude, m.coordinate.latitude])
                                            .addTo(map);
                                        markersMap[id] = marker;
                                    }
                                });
                                Object.keys(markersMap).forEach(k => { if (!activeIds.includes(k)) { markersMap[k].remove(); delete markersMap[k]; } });
                            } catch (err) { log("Marker Update Err: " + err.message); }
                        };

                    } catch (e) { 
                        log("INIT FAIL: " + e.message); 
                    }
                }

                checkSDK();
            </script>
        </body>
        </html>
    `;

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'LOG') {
                console.log("[OlaMap WebView]", data.message);
            } else if (data.type === 'ERROR') {
                console.error("[OlaMap WebView Error]", data.message);
            } else if (data.type === 'MAP_READY') {
                setIsMapReady(true);
                if (onMapReady) onMapReady();

                // Initial Data Push
                if (markers.length > 0) {
                    const safeMarkers = JSON.stringify(markers);
                    webviewRef.current?.injectJavaScript(`if(window.updateMarkers) window.updateMarkers(${safeMarkers}); true;`);
                }
                if (route) {
                    const safeRoute = JSON.stringify(route.map(r => [r.longitude, r.latitude]));
                    webviewRef.current?.injectJavaScript(`if(window.updateRoute) window.updateRoute(${safeRoute}); true;`);
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
            webviewRef.current.injectJavaScript(`if(window.updateMarkers) window.updateMarkers(${safeMarkers}); true;`);
        }
    }, [markers, isMapReady]);

    useEffect(() => {
        if (isMapReady && webviewRef.current) {
            const safeRoute = JSON.stringify(route.map(r => [r.longitude, r.latitude]));
            webviewRef.current.injectJavaScript(`if(window.updateRoute) window.updateRoute(${safeRoute}); true;`);
        }
    }, [route, isMapReady]);

    useEffect(() => {
        if (isMapReady && webviewRef.current && center) {
            webviewRef.current.injectJavaScript(`
                if(window.map) { 
                    window.map.flyTo({ center: [${center.longitude}, ${center.latitude}], zoom: ${zoom} }); 
                } 
                true;
            `);
        }
    }, [center, isMapReady, zoom]);

    return (
        <View style={[styles.container, style]}>
            <WebView
                ref={webviewRef}
                style={{ flex: 1, backgroundColor: '#f3f4f6', opacity: 0.99 }}
                source={{ html: htmlContent, baseUrl: 'https://eduleadconnect.vercel.app/' }}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                mixedContentMode="always"
                androidLayerType="hardware"
                onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('WebView HTTP Error: ', nativeEvent.statusCode, nativeEvent.url);
                }}
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('WebView Error: ', nativeEvent.description);
                }}
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

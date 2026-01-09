import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { MAP_CONFIG } from '../config/maps';

interface Marker {
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
    icon?: 'bus' | 'school' | 'stop';
}

interface LeafletMapProps {
    latitude: number;
    longitude: number;
    markers?: Marker[];
    height?: number;
    zoom?: number;
}

const LeafletMap = ({ latitude, longitude, markers = [], height = 300, zoom = 15 }: LeafletMapProps) => {
    const webViewRef = useRef<WebView>(null);

    // HTML Content for Leaflet
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
        <style>
            body { margin: 0; padding: 0; height: 100vh; width: 100vw; }
            #map { height: 100%; width: 100%; }
            /* Hide Leaflet attribution badge */
            .leaflet-control-attribution {
                display: none !important;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            // Relay logs to React Native
            (function() {
                var originalLog = console.log;
                var originalWarn = console.warn;
                var originalError = console.error;
                
                function relay(type, args) {
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'log',
                            level: type,
                            data: Array.prototype.slice.call(args).join(' ')
                        }));
                    }
                }

                console.log = function() { originalLog.apply(console, arguments); relay('log', arguments); };
                console.warn = function() { originalWarn.apply(console, arguments); relay('warn', arguments); };
                console.error = function() { originalError.apply(console, arguments); relay('error', arguments); };
            })();

            console.log('[Leaflet] Map script started');
            var initialLat = ${latitude || 20.5937};
            var initialLng = ${longitude || 78.9629};
            var map = L.map('map').setView([initialLat, initialLng], ${zoom});
            
            var tileUrl = '${MAP_CONFIG.PROVIDER === 'ola' ? MAP_CONFIG.URLS.OLA : MAP_CONFIG.URLS.OSM}';
            var attribution = '${MAP_CONFIG.PROVIDER === 'ola' ? MAP_CONFIG.ATTRIBUTION.OLA : MAP_CONFIG.ATTRIBUTION.OSM}';

            L.tileLayer(tileUrl, {
                maxZoom: 19,
                attribution: attribution,
                id: 'ola-maps' // Optional
            }).addTo(map);

            console.log('[Leaflet] Map ready');

            var markers = [];

            function updateMap(lat, lng, zoomLevel) {
                console.log('[Leaflet] Updating view to:', lat, lng, zoomLevel);
                map.setView([lat, lng], zoomLevel);
            }

            function updateMarkers(newMarkers) {
                console.log('[Leaflet] Updating markers:', JSON.stringify(newMarkers));
                // Remove existing markers
                markers.forEach(m => map.removeLayer(m));
                markers = [];

                // Add new markers
                newMarkers.forEach(m => {
                    console.log('[Leaflet] Adding marker:', m.title, 'at', m.latitude, m.longitude);
                    var iconColor = m.icon === 'bus' ? 'red' : 'blue';
                    // Using a simpler marker style to avoid icon loading issues
                    var marker = L.circleMarker([m.latitude, m.longitude], {
                        radius: 8,
                        fillColor: iconColor,
                        color: "#fff",
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    })
                        .addTo(map)
                        .bindPopup('<b>' + (m.title || '') + '</b><br>' + (m.description || ''));
                   
                   // Fallback for L.marker if circleMarker is not desired
                   /*
                   var marker = L.marker([m.latitude, m.longitude])
                        .addTo(map)
                        .bindPopup('<b>' + (m.title || '') + '</b><br>' + (m.description || ''));
                   */
                    
                    if (m.icon === 'bus') {
                        marker.openPopup();
                    }
                    markers.push(marker);
                });
            }

            console.log('[Leaflet] Map initialized at:', ${latitude}, ${longitude});
            // Initial markers
            updateMarkers(${JSON.stringify(markers)});
        </script>
    </body>
    </html>
    `;

    // Update map when props change
    useEffect(() => {
        if (webViewRef.current) {
            // Update view
            webViewRef.current.injectJavaScript(`
                updateMap(${latitude}, ${longitude}, ${zoom});
                true;
            `);

            // Update markers
            webViewRef.current.injectJavaScript(`
                updateMarkers(${JSON.stringify(markers)});
                true;
            `);
        }
    }, [latitude, longitude, markers, zoom]);

    return (
        <View style={{ height, width: '100%', overflow: 'hidden' }}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={{ flex: 1 }}
                scrollEnabled={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mixedContentMode="always"
                onMessage={(event) => {
                    try {
                        const message = JSON.parse(event.nativeEvent.data);
                        if (message.type === 'log') {
                            console.log('[WebView Log]', message.data);
                        }
                    } catch (e) {
                        console.log('[WebView Message]', event.nativeEvent.data);
                    }
                }}
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('[Leaflet] WebView error:', nativeEvent);
                }}
                onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('[Leaflet] WebView HTTP error:', nativeEvent);
                }}
            />
        </View>
    );
};

export default LeafletMap;

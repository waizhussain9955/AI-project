import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import mapboxgl from 'mapbox-gl';
import { useIncidentStore } from '../../store/useIncidentStore';
import { useMapStore } from '../../store/useMapStore';
import { Incident } from '../../types/incident.types';
import { DESIGN_TOKENS } from '../../constants/mapThemes';

// Load Mapbox GL CSS dynamically on Web
const loadMapboxCSS = () => {
  if (typeof document === 'undefined') return;
  const id = 'mapbox-gl-css';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
  document.head.appendChild(link);
};

export const SmartMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  const { incidents, setSelectedIncident } = useIncidentStore();
  const {
    cameraLatitude,
    cameraLongitude,
    cameraZoom,
    mapTheme,
    setSelectedIncident: mapSetSelected,
  } = useMapStore();

  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Mapbox CSS and initialize Map
  useEffect(() => {
    loadMapboxCSS();

    const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
    mapboxgl.accessToken = token;

    if (!mapContainerRef.current) return;

    // Use Mapbox Dark Style
    const styleUrl = mapTheme === 'satellite' 
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : 'mapbox://styles/mapbox/dark-v11';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [cameraLongitude, cameraLatitude],
      zoom: cameraZoom,
      pitch: 45, // 3D Perspective angle
    });

    mapRef.current = map;

    map.on('load', () => {
      setMapLoaded(true);
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map style when theme changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const styleUrl = mapTheme === 'satellite' 
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : 'mapbox://styles/mapbox/dark-v11';
    mapRef.current.setStyle(styleUrl);
  }, [mapTheme, mapLoaded]);

  // Sync Markers with live incidents store
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const currentMap = mapRef.current;
    const activeIncidentIds = new Set(incidents.map(i => i.id));

    // 1. Remove markers for incidents that no longer exist
    Object.keys(markersRef.current).forEach(id => {
      if (!activeIncidentIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // 2. Add or update markers for current incidents
    incidents.forEach(incident => {
      const { longitude, latitude } = incident.location;
      
      // Determine colors/emojis
      let color = DESIGN_TOKENS.colors.neonCyan;
      let emoji = '🚨';
      if (incident.severity === 'critical') color = DESIGN_TOKENS.colors.neonRed;
      else if (incident.severity === 'high') color = DESIGN_TOKENS.colors.neonOrange;

      switch (incident.type?.toLowerCase()) {
        case 'flood': emoji = '🌊'; break;
        case 'fire': emoji = '🔥'; break;
        case 'accident': emoji = '💥'; break;
        case 'chemical': emoji = '☣️'; break;
      }

      // If marker already exists, update position
      if (markersRef.current[incident.id]) {
        markersRef.current[incident.id].setLngLat([longitude, latitude]);
        return;
      }

      // Create Custom HTML element for marker (cyberpunk style pulse)
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.border = `2px solid ${color}`;
      el.style.backgroundColor = '#121826';
      el.style.display = 'flex';
      el.style.justifyContent = 'center';
      el.style.alignItems = 'center';
      el.style.cursor = 'pointer';
      el.style.fontSize = '16px';
      el.style.boxShadow = `0 0 12px ${color}`;
      el.innerHTML = emoji;

      // Add click handler
      el.addEventListener('click', () => {
        handleIncidentPress(incident);
      });

      // Add marker to map
      const marker = new mapboxgl.Marker(el)
        .setLngLat([longitude, latitude])
        .addTo(currentMap);

      markersRef.current[incident.id] = marker;
    });

  }, [incidents, mapLoaded]);

  const handleIncidentPress = (incident: Incident) => {
    setSelectedIncident(incident);
    mapSetSelected(incident);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [incident.location.longitude, incident.location.latitude],
        zoom: 14.5,
        speed: 1.5,
        curve: 1.2,
        essential: true,
      });
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'flood': return '🌊';
      case 'fire': return '🔥';
      case 'accident': return '💥';
      case 'chemical': return '☣️';
      default: return '🚨';
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return DESIGN_TOKENS.colors.neonRed;
      case 'high': return DESIGN_TOKENS.colors.neonOrange;
      case 'medium': return DESIGN_TOKENS.colors.neonCyan;
      default: return DESIGN_TOKENS.colors.textSecondary;
    }
  };

  return (
    <View style={styles.webContainer}>
      {/* Top Header */}
      <LinearGradient
        colors={['rgba(0, 229, 255, 0.15)', 'rgba(124, 58, 237, 0.15)']}
        style={styles.webHeader}
      >
        <View style={styles.webHeaderLeft}>
          <Text style={styles.webHeaderTitle}>📡 VIGIL AI LIVE COMMAND CENTER (WEB MAPBOX)</Text>
          <Text style={styles.webHeaderSub}>Interactive Map Grid • Live Karachi Emergency Feeds</Text>
        </View>
        <View style={styles.webStatsBadge}>
          <Text style={styles.webStatsText}>{incidents.length} LIVE THREATS DETECTED</Text>
        </View>
      </LinearGradient>

      <View style={styles.webBody}>
        {/* Real Mapbox Container */}
        <View style={styles.mapWrapper}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', borderRadius: '12px' }} />
        </View>

        {/* Live Incident Sidebar Feed */}
        <View style={styles.webSidebar}>
          <Text style={styles.sidebarTitle}>🔴 LIVE INCIDENT FEED</Text>
          <ScrollView style={styles.sidebarScroll} contentContainerStyle={{ gap: 12 }}>
            {incidents.map((incident) => {
              const color = getSeverityColor(incident.severity);
              return (
                <Pressable
                  key={incident.id}
                  style={styles.sidebarCard}
                  onPress={() => handleIncidentPress(incident)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>{getIncidentIcon(incident.type)}</Text>
                    <Text style={styles.cardTitle}>{incident.title}</Text>
                    <View style={[styles.cardSevBadge, { backgroundColor: color + '20', borderColor: color }]}>
                      <Text style={[styles.cardSevText, { color }]}>{incident.severity.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardDesc} numberOfLines={2}>{incident.description}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardTime}>GPS: {incident.location.latitude.toFixed(4)}, {incident.location.longitude.toFixed(4)}</Text>
                    <Text style={styles.cardAction}>LOCATE 🛰️</Text>
                  </View>
                </Pressable>
              );
            })}
            {incidents.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No active threats registered.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  webContainer: {
    flex: 1, 
    backgroundColor: DESIGN_TOKENS.colors.background, 
    display: 'flex', 
    flexDirection: 'column',
  },
  webHeader: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16,
    borderBottomWidth: 1, 
    borderBottomColor: DESIGN_TOKENS.colors.glassBorder,
  },
  webHeaderLeft: { gap: 4 },
  webHeaderTitle: { fontSize: 18, fontWeight: '900', color: DESIGN_TOKENS.colors.neonCyan, letterSpacing: 1 },
  webHeaderSub: { fontSize: 12, color: DESIGN_TOKENS.colors.textSecondary },
  webStatsBadge: {
    backgroundColor: 'rgba(255, 23, 104, 0.2)', 
    borderWidth: 1, 
    borderColor: DESIGN_TOKENS.colors.neonRed,
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    borderRadius: 20,
  },
  webStatsText: { fontSize: 12, fontWeight: '900', color: DESIGN_TOKENS.colors.neonRed, letterSpacing: 1 },
  webBody: { 
    flex: 1, 
    flexDirection: 'row', 
    display: 'flex',
    padding: 12,
    gap: 12,
  },
  mapWrapper: {
    flex: 2.5,
    backgroundColor: '#0B0F19',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: DESIGN_TOKENS.colors.glassBorder,
    overflow: 'hidden',
  },
  webSidebar: { 
    flex: 1, 
    minWidth: 320, 
    backgroundColor: 'rgba(10, 15, 30, 0.6)', 
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: DESIGN_TOKENS.colors.glassBorder,
    padding: 16, 
    display: 'flex', 
    flexDirection: 'column',
  },
  sidebarTitle: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 1.5, marginBottom: 16 },
  sidebarScroll: { flex: 1 },
  sidebarCard: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderWidth: 1, 
    borderColor: DESIGN_TOKENS.colors.glassBorder, 
    borderRadius: 12, 
    padding: 16, 
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIcon: { fontSize: 18 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#fff' },
  cardSevBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  cardSevText: { fontSize: 9, fontWeight: '900' },
  cardDesc: { fontSize: 12, color: DESIGN_TOKENS.colors.textSecondary, lineHeight: 18 },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 4, 
    paddingTop: 8, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  cardTime: { fontSize: 10, color: DESIGN_TOKENS.colors.textMuted },
  cardAction: { fontSize: 11, fontWeight: '900', color: DESIGN_TOKENS.colors.neonCyan },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: DESIGN_TOKENS.colors.textSecondary,
  },
});

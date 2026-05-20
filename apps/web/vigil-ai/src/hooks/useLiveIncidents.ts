// ============================================================
// VIGIL AI — useLiveIncidents hook
// Fetches real incident data from ResQ AI backend
// + keeps store live via Socket.IO
// ============================================================

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIncidentStore } from '../store/useIncidentStore';
import { socketService } from '../services/socket';
import { incidentApi } from '../services/api';
import { Incident } from '../types/incident.types';
import { ENV } from '../../config/env';

export function mapIncidentType(rawType: string): 'flood' | 'fire' | 'accident' | 'collapse' | 'violence' | 'earthquake' | 'chemical' {
  const type = rawType?.toLowerCase() || '';
  if (type.includes('gas') || type.includes('chemical') || type.includes('leak') || type.includes('spill') || type.includes('toxic')) {
    return 'chemical';
  }
  if (type.includes('flood') || type.includes('water') || type.includes('rain') || type.includes('drown')) {
    return 'flood';
  }
  if (type.includes('fire') || type.includes('explosion') || type.includes('smoke') || type.includes('burn')) {
    return 'fire';
  }
  if (type.includes('accident') || type.includes('crash') || type.includes('collision') || type.includes('road')) {
    return 'accident';
  }
  if (type.includes('collapse') || type.includes('landslide')) {
    return 'collapse';
  }
  if (type.includes('violence') || type.includes('threat') || type.includes('unrest') || type.includes('riot') || type.includes('shoot')) {
    return 'violence';
  }
  if (type.includes('earthquake') || type.includes('seismic') || type.includes('tremor')) {
    return 'earthquake';
  }
  return 'accident'; // fallback
}

/** Normalize backend incident (snake_case + different field names) to frontend type */
function normalizeIncident(raw: any): Incident {
  const rawType = raw.type || raw.detectedType || 'accident';
  return {
    id: raw.id,
    type: mapIncidentType(rawType),
    title: raw.title || raw.detectedType || 'Emergency Alert',
    description: raw.description || raw.recommendations?.[0] || '',
    location: {
      latitude: raw.latitude ?? raw.location?.latitude ?? 24.8607,
      longitude: raw.longitude ?? raw.location?.longitude ?? 67.0011,
    },
    severity: (raw.severity?.toLowerCase() || 'medium') as any,
    status: (raw.status?.toLowerCase() || 'active') as any,
    confidence: raw.confidence ?? 80,
    media: raw.media || [],
    reportedBy: raw.reportedBy || raw.createdBy || 'system',
    timestamp: new Date(raw.timestamp || raw.createdAt || Date.now()),
    updatedAt: new Date(raw.updatedAt || Date.now()),
    radius: raw.radius,
    affectedCount: raw.affectedPopulation || raw.affectedCount,
    rescueStatus: raw.rescueStatus || 'pending',
  };
}

export const useLiveIncidents = () => {
  const { incidents, addIncident, updateIncident, setLoading } = useIncidentStore();
  const socketConnected = useRef(false);

  // ── Fetch initial incident list from backend ─────────────
  const query = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: async () => {
      try {
        const res = await incidentApi.getAll();
        const rawList = res.data?.data || res.data || [];
        const normalized = rawList.map(normalizeIncident);

        // Seed store with real data
        normalized.forEach((incident) => {
          const exists = useIncidentStore.getState().incidents.find((i) => i.id === incident.id);
          if (!exists) {
            addIncident(incident);
          } else {
            updateIncident(incident.id, incident);
          }
        });

        return normalized;
      } catch (err: any) {
        console.warn('[useLiveIncidents] Backend fetch failed, using mock data:', err.message);
        return useIncidentStore.getState().incidents;
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // ── Connect Socket.IO for live updates ───────────────────
  useEffect(() => {
    if (!socketConnected.current) {
      socketService.connect();
      socketConnected.current = true;
    }

    return () => {
      socketService.disconnect();
      socketConnected.current = false;
    };
  }, []);

  return {
    incidents,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

// ============================================================
// VIGIL AI — Environment Configuration
// Reads from EXPO_PUBLIC_ vars (set in .env file)
// Falls back to LAN dev values for testing
// ============================================================

import { Platform } from 'react-native';

const IS_DEV = process.env.NODE_ENV !== 'production';

// Dynamically resolve hostname: on web use current browser hostname, otherwise use LAN IP / env
const getHost = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.hostname;
  }
  // Try parsing environment variable IP or fallback to LAN IP
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) {
    try {
      const match = envUrl.match(/http:\/\/([^:/]+)/);
      if (match && match[1]) return match[1];
    } catch {}
  }
  return '192.168.1.39';
};

const baseHost = getHost();

const RAW_API_URL = IS_DEV ? `http://${baseHost}:3001/api/v1` : 'https://api.resqai.pk/api/v1';
const RAW_SOCKET_URL = IS_DEV ? `http://${baseHost}:3001` : 'https://api.resqai.pk';

export const ENV = {
  /** Full base URL for the axios API client (no trailing slash) */
  API_BASE_URL: RAW_API_URL,

  /** Socket.IO server URL (no path suffix) */
  SOCKET_URL: RAW_SOCKET_URL,

  /** Mapbox token for @rnmapbox/maps */
  MAPBOX_ACCESS_TOKEN:
    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '',

  /** Feature flags */
  ENABLE_REAL_AI: process.env.EXPO_PUBLIC_ENABLE_REAL_AI !== 'false',
  ENABLE_REAL_SOCKET: process.env.EXPO_PUBLIC_ENABLE_REAL_SOCKET !== 'false',

  IS_DEV,
};

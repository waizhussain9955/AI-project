// metro.config.js
// Fix for import.meta.url error caused by mapbox-gl (used by @rnmapbox/maps)
// Metro bundler does not support import.meta — we stub mapbox-gl on web platform.

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const mapboxGlStub = path.resolve(__dirname, 'src/mocks/mapbox-gl.mock.js');

// Intercept mapbox-gl resolution on web and return our stub
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'mapbox-gl') {
    return {
      filePath: mapboxGlStub,
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

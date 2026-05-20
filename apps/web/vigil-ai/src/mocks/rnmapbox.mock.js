// Mock stub for @rnmapbox/maps on web platform.
// @rnmapbox/maps tries to import native modules which throws an error on the web.
// SmartMap.tsx already renders a CSS radar fallback on web.

import React from 'react';
import { View } from 'react-native';

const MockComponent = (props) => <View {...props} />;

const MapboxGL = {
  MapView: null, // Setting to null ensures isMapboxAvailable evaluates to false in SmartMap
  Camera: MockComponent,
  UserLocation: MockComponent,
  ShapeSource: MockComponent,
  HeatmapLayer: MockComponent,
  MarkerView: MockComponent,
  setAccessToken: () => {},
  setTelemetryEnabled: () => {},
};

export default MapboxGL;
module.exports = MapboxGL;
module.exports.default = MapboxGL;

// Mock stub for mapbox-gl on web platform.
// mapbox-gl uses import.meta.url for web workers which Metro bundler doesn't support.
// SmartMap.tsx already renders a CSS radar fallback on web, so this is safe to stub.

const MapboxGL = {
  Map: function () {},
  NavigationControl: function () {},
  GeolocateControl: function () {},
  Marker: function () {},
  Popup: function () {},
  LngLatBounds: function () {},
  supported: function () { return false; },
};

module.exports = MapboxGL;
module.exports.default = MapboxGL;

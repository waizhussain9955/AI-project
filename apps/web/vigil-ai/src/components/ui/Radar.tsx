import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { AnimatedView, useAnimatedStyle as useSafeAnimatedStyle } from '../../utils/reanimatedHelpers';
import { DESIGN_TOKENS } from '../../constants/mapThemes';

interface RadarProps {
  size?: number;
  color?: string;
  gridCount?: number;
  activeIncidentsCount?: number;
}

export const Radar: React.FC<RadarProps> = ({
  size = 180,
  color = DESIGN_TOKENS.colors.neonCyan,
  gridCount = 3,
  activeIncidentsCount = 5,
}) => {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0.4);
  const [azimuth, setAzimuth] = useState(0);

  useEffect(() => {
    // Rotation sweep
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Pulse size expansion
    pulse.value = withRepeat(
      withTiming(1, {
        duration: 2000,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      false
    );

    // Dynamic telemetry updates for realistic look
    const interval = setInterval(() => {
      setAzimuth((prev) => (prev + 13) % 360);
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const sweepStyle = useSafeAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const pulseStyle = useSafeAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
      opacity: 1 - pulse.value,
    };
  });

  // Mock targets inside the radar range
  const mockTargets = [
    { id: 1, top: '25%', left: '35%', delay: 100 },
    { id: 2, top: '65%', left: '72%', delay: 400 },
    { id: 3, top: '45%', left: '55%', delay: 800 },
  ];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Concentric Grid Lines */}
      {Array.from({ length: gridCount }).map((_, i) => {
        const ringSize = (size / gridCount) * (i + 1);
        return (
          <View
            key={i}
            style={[
              styles.ring,
              {
                width: ringSize,
                height: ringSize,
                borderColor: color + '20',
                borderWidth: 1,
              },
            ]}
          />
        );
      })}

      {/* Axis Lines (Crosshair) */}
      <View style={[styles.axisH, { backgroundColor: color + '15' }]} />
      <View style={[styles.axisV, { backgroundColor: color + '15' }]} />

      {/* Expanding Signal Pulses */}
      <AnimatedView style={[styles.pulseRing, pulseStyle, { borderColor: color, width: size, height: size }]} />

      {/* Rotating Sweep Scanline */}
      <AnimatedView style={[styles.sweepContainer, sweepStyle, { width: size, height: size }]}>
        <View
          style={[
            styles.sweepLine,
            {
              backgroundColor: color,
              shadowColor: color,
              height: size / 2,
            },
          ]}
        />
        {/* Dynamic Sweep Gradient Trail (Mocked via transparency fade) */}
        <View style={[styles.sweepTrail, { borderRightColor: color + '30', height: size / 2 }]} />
      </AnimatedView>

      {/* Live Flashing Blips (Detected targets) */}
      {mockTargets.map((target) => (
        <View
          key={target.id}
          style={[
            styles.blip,
            {
              top: target.top as any,
              left: target.left as any,
              backgroundColor: activeIncidentsCount > 3 ? DESIGN_TOKENS.colors.neonRed : DESIGN_TOKENS.colors.neonCyan,
              shadowColor: activeIncidentsCount > 3 ? DESIGN_TOKENS.colors.neonRed : DESIGN_TOKENS.colors.neonCyan,
            },
          ]}
        />
      ))}

      {/* Mini Telemetry Display Inside Radar */}
      <View style={styles.hudOverlay}>
        <Text style={[styles.hudText, { color }]}>AZM: {azimuth.toString().padStart(3, '0')}°</Text>
        <Text style={[styles.hudText, { color }]}>TRGT LOCK: {activeIncidentsCount}</Text>
        <Text style={[styles.hudText, { color }]}>SYS: AI_OK</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 8, 16, 0.55)',
    borderRadius: 999,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
  },
  axisH: {
    position: 'absolute',
    width: '100%',
    height: 1,
  },
  axisV: {
    position: 'absolute',
    width: 1,
    height: '100%',
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
  },
  sweepContainer: {
    position: 'absolute',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  sweepLine: {
    width: 2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  sweepTrail: {
    position: 'absolute',
    width: 40,
    borderRightWidth: 40,
    transform: [{ rotate: '-15deg' }],
  },
  blip: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
  },
  hudOverlay: {
    position: 'absolute',
    bottom: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(2, 8, 16, 0.75)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  hudText: {
    fontSize: 7.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

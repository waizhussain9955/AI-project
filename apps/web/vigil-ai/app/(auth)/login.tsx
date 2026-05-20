import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, StatusBar, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../src/store/useUserStore';
import { authService } from '../../src/services/auth.service';
import { DESIGN_TOKENS } from '../../src/constants/mapThemes';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W } = Dimensions.get('window');

import axios from 'axios';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, setToken, serverIp, setServerIp, isAuthenticated } = useUserStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated]);

  // Tactical Network Settings
  const [showNetworkSettings, setShowNetworkSettings] = useState(false);
  const [tempIp, setTempIp] = useState(serverIp);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'online' | 'offline'>('idle');
  const [simulating, setSimulating] = useState(false);

  const testConnection = async () => {
    if (!tempIp.trim()) return;
    setTestStatus('testing');
    try {
      const res = await axios.get(`http://${tempIp.trim()}:3001/api/v1/ai/status`, { timeout: 3500 });
      if (res.status === 200) {
        setTestStatus('online');
        setServerIp(tempIp.trim());
      } else {
        setTestStatus('offline');
      }
    } catch (err) {
      console.warn('[NetworkTest] Ping failed:', err);
      setTestStatus('offline');
    }
  };

  const triggerSimulation = async () => {
    setSimulating(true);
    try {
      const scenario = ['FLOOD', 'FIRE', 'GAS_LEAK'][Math.floor(Math.random() * 3)];
      const res = await axios.post(`http://${tempIp.trim()}:3001/api/v1/simulation/trigger`, {
        scenario,
        severity: 'CRITICAL',
      });
      if (res.data?.success) {
        Alert.alert('Simulation Launched 🚨', `Disaster scenario "${scenario}" triggered live on the active database!`);
      } else {
        Alert.alert('Failed', 'Failed to launch simulator event.');
      }
    } catch (err) {
      Alert.alert('Connection Failed', 'Ensure local server is running and your custom IP is correctly tested.');
    } finally {
      setSimulating(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await authService.login(email, password);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.warn('[LoginScreen] Real login failed, attempting demo fallback:', err.message);
      try {
        await authService.loginDemo();
        router.replace('/(tabs)/home');
      } catch (demoErr) {
        Alert.alert('Login Failed', err?.response?.data?.message || err.message || 'Unable to authenticate.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={DESIGN_TOKENS.colors.background} />
      
      <SafeAreaView style={styles.safe}>
        
        {/* Back Button (Screen 3 left arrow) */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* Titles */}
          <View style={styles.titleWrap}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Login to continue</Text>
          </View>

          {/* Collapsible Tactical Network Settings */}
          <View style={styles.netSettingsContainer}>
            <Pressable 
              onPress={() => setShowNetworkSettings(!showNetworkSettings)}
              style={styles.netHeader}
            >
              <Text style={styles.netHeaderTitle}>🔧 TACTICAL NETWORK UTILITY</Text>
              <Text style={styles.netHeaderArrow}>{showNetworkSettings ? '▲' : '▼'}</Text>
            </Pressable>

            {showNetworkSettings && (
              <View style={styles.netBody}>
                <Text style={styles.netLbl}>TARGET SERVER IP / HOST:</Text>
                <View style={styles.netInputRow}>
                  <TextInput
                    style={styles.netInput}
                    value={tempIp}
                    onChangeText={setTempIp}
                    placeholder="e.g. 192.168.1.39"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    autoCapitalize="none"
                  />
                  <Pressable 
                    onPress={testConnection} 
                    disabled={testStatus === 'testing'}
                    style={[styles.netTestBtn, { borderColor: DESIGN_TOKENS.colors.neonCyan }]}
                  >
                    <Text style={styles.netTestBtnText}>
                      {testStatus === 'testing' ? 'PINGING...' : 'TEST'}
                    </Text>
                  </Pressable>
                </View>

                {/* Status Indicator */}
                <View style={styles.netStatusRow}>
                  <View 
                    style={[
                      styles.netStatusDot, 
                      { 
                        backgroundColor: 
                          testStatus === 'online' ? '#00E5FF' :
                          testStatus === 'offline' ? '#FF1744' : '#FFD600'
                      }
                    ]} 
                  />
                  <Text style={styles.netStatusText}>
                    {testStatus === 'online' ? '⚡ ONLINE — SAVED TO CLIENT CONFIG' :
                     testStatus === 'offline' ? '❌ OFFLINE — USING DEMO FALLBACK' :
                     testStatus === 'testing' ? '📡 SCANNING NETWORK PORTS...' :
                     `📡 PENDING TEST (CURRENT ACTIVE: ${serverIp})`}
                  </Text>
                </View>

                {/* Simulation Trigger Button */}
                <Pressable
                  onPress={triggerSimulation}
                  disabled={simulating}
                  style={[
                    styles.netSimBtn,
                    { borderColor: simulating ? 'rgba(255, 109, 0, 0.4)' : '#FF6D00' }
                  ]}
                >
                  <Text style={styles.netSimBtnText}>
                    {simulating ? '☣️ INITIATING DISASTER SIMULATION...' : '🚨 TRIGGER DYNAMIC BACKEND INCIDENT'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Form */}
          <View style={styles.form}>
            
            {/* Email field */}
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>✉</Text>
              <TextInput
                style={styles.input}
                placeholder="Email or Phone"
                placeholderTextColor={DESIGN_TOKENS.colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password field */}
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={DESIGN_TOKENS.colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureText}
              />
              <Pressable onPress={() => setSecureText(!secureText)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{secureText ? '👁' : '👁‍🗨'}</Text>
              </Pressable>
            </View>

            {/* Forgot password */}
            <Pressable style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>

            {/* Submit Grad Button */}
            <Pressable onPress={handleLogin} disabled={loading} style={styles.submitWrap}>
              <LinearGradient
                colors={['#2979FF', '#7C3AED']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitGrad}
              >
                <Text style={styles.submitText}>{loading ? 'AUTHENTICATING...' : 'LOGIN'}</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Continuation Divider */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR CONTINUE WITH</Text>
            <View style={styles.orLine} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            {['G', '', 'f'].map((logo, i) => (
              <Pressable key={i} onPress={handleLogin} style={styles.socialBtn}>
                <Text style={[styles.socialLogo, logo === '' && { fontSize: 24 }]}>{logo}</Text>
              </Pressable>
            ))}
          </View>

          {/* Bottom Link */}
          <Pressable onPress={() => router.push('/(auth)/signup')} style={styles.bottomLink}>
            <Text style={styles.bottomLinkText}>
              Don't have an account? <Text style={{ color: DESIGN_TOKENS.colors.neonCyan, fontWeight: '700' }}>Sign Up</Text>
            </Text>
          </Pressable>

        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DESIGN_TOKENS.colors.background },
  safe: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  backArrow: {
    fontSize: 26,
    color: '#fff',
    lineHeight: 28,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 28,
  },
  titleWrap: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: DESIGN_TOKENS.colors.textSecondary,
  },
  form: {
    gap: 16,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.glassBorder,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    fontSize: 18,
    color: DESIGN_TOKENS.colors.textMuted,
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
    color: DESIGN_TOKENS.colors.textMuted,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 12,
    color: DESIGN_TOKENS.colors.textMuted,
  },
  submitWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  submitGrad: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  orText: {
    fontSize: 10,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.textMuted,
    letterSpacing: 1.5,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DESIGN_TOKENS.colors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  socialLogo: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  bottomLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  bottomLinkText: {
    fontSize: 13,
    color: DESIGN_TOKENS.colors.textSecondary,
  },
  netSettingsContainer: {
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderRadius: 14,
    backgroundColor: 'rgba(5, 10, 20, 0.95)',
    overflow: 'hidden',
    shadowColor: DESIGN_TOKENS.colors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    marginVertical: 4,
  },
  netHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  netHeaderTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1.5,
  },
  netHeaderArrow: {
    fontSize: 10,
    color: DESIGN_TOKENS.colors.textMuted,
  },
  netBody: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  netLbl: {
    fontSize: 9,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.textSecondary,
    letterSpacing: 1,
  },
  netInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  netInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    color: '#fff',
    fontSize: 13,
    paddingHorizontal: 12,
  },
  netTestBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  netTestBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  netStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  netStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  netStatusText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  netSimBtn: {
    width: '100%',
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 109, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  netSimBtnText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FF6D00',
    letterSpacing: 1,
  },
});

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, SafeAreaView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { NeonButton } from '../../src/components/ui/NeonButton';
import { authService } from '../../src/services/auth.service';
import { DESIGN_TOKENS } from '../../src/constants/mapThemes';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await authService.signup(email, password, name);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.warn('[SignupScreen] Real signup failed, attempting demo fallback:', err.message);
      try {
        await authService.signupDemo(email, name);
        router.replace('/(tabs)/home');
      } catch (demoErr) {
        Alert.alert('Signup Failed', err?.response?.data?.message || err.message || 'Unable to create account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.logo}>VIGIL</Text>
          <Text style={styles.subtitle}>CREATE YOUR ACCOUNT</Text>

          <View style={styles.form}>
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={DESIGN_TOKENS.colors.textMuted} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor={DESIGN_TOKENS.colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor={DESIGN_TOKENS.colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
            <NeonButton label={loading ? 'CREATING...' : 'CREATE ACCOUNT'} color={DESIGN_TOKENS.colors.neonCyan} onPress={handleSignup} loading={loading} />
            
            {/* Continuation Divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR CONTINUE WITH</Text>
              <View style={styles.orLine} />
            </View>

            {/* Social buttons */}
            <View style={styles.socialRow}>
              {['G', '', 'f'].map((logo, i) => (
                <Pressable key={i} onPress={handleSignup} style={styles.socialBtn}>
                  <Text style={[styles.socialLogo, logo === '' && { fontSize: 24 }]}>{logo}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
              <Text style={styles.link}>Already have an account? <Text style={{ color: DESIGN_TOKENS.colors.neonCyan, fontWeight: '700' }}>Login</Text></Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN_TOKENS.colors.background },
  safe: { flex: 1 },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: DESIGN_TOKENS.spacing.xl, gap: DESIGN_TOKENS.spacing.md,
  },
  logo: {
    fontSize: 52, fontWeight: '900', color: DESIGN_TOKENS.colors.neonCyan, letterSpacing: 8,
    shadowColor: DESIGN_TOKENS.colors.neonCyan,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20,
  },
  subtitle: {
    fontSize: 11, fontWeight: '700', color: DESIGN_TOKENS.colors.textMuted,
    letterSpacing: 2, marginBottom: 16,
  },
  form: { width: '100%', gap: DESIGN_TOKENS.spacing.md },
  input: {
    borderWidth: 1, borderColor: DESIGN_TOKENS.colors.glassBorder, borderRadius: 12,
    padding: 14, fontSize: DESIGN_TOKENS.fontSize.md, color: DESIGN_TOKENS.colors.textPrimary,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  link: { textAlign: 'center', fontSize: DESIGN_TOKENS.fontSize.sm, color: DESIGN_TOKENS.colors.textSecondary },
  orRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8,
  },
  orLine: {
    flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  orText: {
    fontSize: 10, fontWeight: '700', color: DESIGN_TOKENS.colors.textMuted, letterSpacing: 1.5,
  },
  socialRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 4,
  },
  socialBtn: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center',
    shadowColor: DESIGN_TOKENS.colors.neonCyan, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 6,
  },
  socialLogo: {
    fontSize: 18, fontWeight: '900', color: '#fff',
  },
});

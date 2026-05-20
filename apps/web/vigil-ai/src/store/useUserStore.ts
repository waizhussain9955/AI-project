import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '../types/user.types';

interface UserState extends AuthState {
  serverIp: string;
  setServerIp: (ip: string) => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      serverIp: '192.168.1.39', // Fallback default IP
      user: {
        id: 'demo_user',
        name: 'Alex Chen',
        email: 'alex@vigil.ai',
        role: 'citizen',
        stats: { totalReports: 12, verifiedReports: 9, savedLives: 4, trustScore: 87 },
        badges: [],
        isAnonymous: false,
        createdAt: new Date(),
      },
      token: 'demo_token',
      isAuthenticated: true,
      isLoading: false,

      setServerIp: (serverIp) => set({ serverIp }),
      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'vigil-ai-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { AuthData } from '../types/auth.type';
import { getSecureItem, setSecureItem, removeSecureItem } from '../utils/security/secureStorage';

interface AuthState {
  authData: AuthData | null;
  token: string | null;
  refreshToken: string | null;
  mobile: string | null;
  isLoggedIn: boolean;
  deviceId: string | null;
  lastActive: number | null;
  setAuth: (data: AuthData, mobile?: string) => void;
  setCustomerId: (id: number) => void;
  setDeviceId: (id: string) => void;
  updateLastActive: () => void;
  clearAuth: () => void;
}

// Custom async storage using our SecureStorage utility
const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await getSecureItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await setSecureItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await removeSecureItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      authData: null,
      token: null,
      refreshToken: null,
      mobile: null,
      isLoggedIn: false,
      deviceId: null,
      lastActive: null,
      setAuth: (data: AuthData, mobile?: string) => set({ 
        authData: data, 
        token: data.access_token, 
        refreshToken: data.refresh_token,
        mobile: mobile || null,
        isLoggedIn: true,
        lastActive: Date.now(),
      }),
      setCustomerId: (id: number) => set((state) => ({
        authData: state.authData ? { ...state.authData, customerId: id } : { customerId: id } as AuthData
      })),
      setDeviceId: (id: string) => set({ deviceId: id }),
      updateLastActive: () => set({ lastActive: Date.now() }),
      clearAuth: () => set({ 
        authData: null, 
        token: null, 
        refreshToken: null,
        mobile: null,
        isLoggedIn: false,
        lastActive: null,
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
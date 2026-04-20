import { create } from 'zustand';
import { AuthData } from '../types/auth.type';

interface AuthState {
  authData: AuthData | null;
  token: string | null;
  mobile: string | null;
  setAuth: (data: AuthData, mobile?: string) => void;
  setCustomerId: (id: number) => void;
  clearAuth: () => void;
  isLoggedIn: boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  authData: null,
  token: null,
  mobile: null,
  isLoggedIn: false,
  setAuth: (data: AuthData, mobile?: string) => set({ 
    authData: data, 
    token: data.access_token, 
    mobile: mobile || null,
    isLoggedIn: true 
  }),
  setCustomerId: (id: number) => set((state) => ({
    authData: state.authData ? { ...state.authData, customerId: id } : { customerId: id } as AuthData
  })),
  clearAuth: () => set({ 
    authData: null, 
    token: null, 
    mobile: null,
    isLoggedIn: false 
  }),
}));

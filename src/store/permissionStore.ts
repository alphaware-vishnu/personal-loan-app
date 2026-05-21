/**
 * Permission state store
 * Tracks granted/denied permissions across the app.
 */

import { create } from 'zustand';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'blocked';

interface PermissionState {
  camera: PermissionStatus;
  location: PermissionStatus;
  notifications: PermissionStatus;
  sms: PermissionStatus;

  /** Whether the permission education screens have been shown */
  hasSeenPermissionScreens: boolean;

  // Actions
  setPermission: (key: keyof Pick<PermissionState, 'camera' | 'location' | 'notifications' | 'sms'>, status: PermissionStatus) => void;
  setHasSeenPermissionScreens: () => void;
  reset: () => void;
}

const initialState = {
  camera: 'undetermined' as PermissionStatus,
  location: 'undetermined' as PermissionStatus,
  notifications: 'undetermined' as PermissionStatus,
  sms: 'undetermined' as PermissionStatus,
  hasSeenPermissionScreens: false,
};

export const usePermissionStore = create<PermissionState>((set) => ({
  ...initialState,

  setPermission: (key, status) => set({ [key]: status }),

  setHasSeenPermissionScreens: () => set({ hasSeenPermissionScreens: true }),

  reset: () => set(initialState),
}));

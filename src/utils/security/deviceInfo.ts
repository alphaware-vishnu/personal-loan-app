/**
 * Device Information Utility
 * Gathers device metadata and generates/persists a unique device identifier.
 */

import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { getSecureItem, setSecureItem } from './secureStorage';

export interface DeviceMetadata {
  brand: string;
  model: string;
  osName: string;
  osVersion: string;
  appVersion: string;
  buildNumber: string;
  isEmulator: boolean;
  deviceId: string;
}

const DEVICE_ID_KEY = 'app_unique_device_id';

/**
 * Retrieve or generate a persistent unique device identifier.
 */
export const getUniqueDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await getSecureItem(DEVICE_ID_KEY);
    if (deviceId) return deviceId;

    // Fetch platform-specific system IDs
    if (Platform.OS === 'android') {
      deviceId = Application.getAndroidId() || '';
    } else if (Platform.OS === 'ios') {
      deviceId = (await Application.getIosIdForVendorAsync()) || '';
    }

    // Fallback: Generate a random UUID-like string if native IDs aren't available
    if (!deviceId) {
      deviceId = 'uuid-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    await setSecureItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch (error) {
    console.error('[DeviceInfo] Failed to get unique device ID:', error);
    return 'fallback-device-id';
  }
};

/**
 * Gather complete device metadata.
 */
export const getDeviceMetadata = async (): Promise<DeviceMetadata> => {
  const deviceId = await getUniqueDeviceId();
  return {
    brand: Device.brand || 'Unknown',
    model: Device.modelName || 'Unknown',
    osName: Device.osName || Platform.OS,
    osVersion: Device.osVersion || 'Unknown',
    appVersion: Application.nativeApplicationVersion || '1.0.0',
    buildNumber: Application.nativeBuildVersion || '1',
    isEmulator: !Device.isDevice,
    deviceId,
  };
};

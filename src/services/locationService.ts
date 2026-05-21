/**
 * Location Service
 * GPS-powered address auto-fill using expo-location + reverse geocoding.
 */

import * as Location from 'expo-location';
import type { Address } from '../types/customer.type';

export interface LocationResult {
  latitude: number;
  longitude: number;
  address: Address;
}

/**
 * Request location permission and get current position with reverse geocoding.
 * Returns a structured address object.
 */
export const getCurrentLocationAddress = async (): Promise<LocationResult> => {
  // Request permission
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission not granted. Please allow location access in settings.');
  }

  // Get current coordinates
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = location.coords;

  // Reverse geocode to get address
  const geocodeResults = await Location.reverseGeocodeAsync({ latitude, longitude });

  if (!geocodeResults || geocodeResults.length === 0) {
    throw new Error('Unable to determine address from your location.');
  }

  const geo = geocodeResults[0];

  const address: Address = {
    flatNo: '',
    buildingName: geo.name || '',
    street: geo.street || '',
    area: geo.district || geo.subregion || '',
    landmark: '',
    city: geo.city || '',
    stateName: geo.region || '',
    pinCode: geo.postalCode || '',
    countryName: geo.country || 'India',
    latitude,
    longitude,
  };

  return { latitude, longitude, address };
};

/**
 * Get address from specific coordinates (for manual pin drop).
 */
export const getAddressFromCoords = async (latitude: number, longitude: number): Promise<Address> => {
  const geocodeResults = await Location.reverseGeocodeAsync({ latitude, longitude });
  if (!geocodeResults || geocodeResults.length === 0) {
    throw new Error('Unable to determine address from coordinates.');
  }

  const geo = geocodeResults[0];

  return {
    flatNo: '',
    buildingName: geo.name || '',
    street: geo.street || '',
    area: geo.district || geo.subregion || '',
    landmark: '',
    city: geo.city || '',
    stateName: geo.region || '',
    pinCode: geo.postalCode || '',
    countryName: geo.country || 'India',
    latitude,
    longitude,
  };
};
/**
 * Location Service
 * GPS-powered address auto-fill using expo-location + reverse geocoding.
 */

import * as Location from 'expo-location';
import { api } from '../api/client';
import type { Address } from '../types/customer.type';

export interface LocationResult {
  latitude: number;
  longitude: number;
  address: Address;
}

export interface LocationSuggestion {
  placeId: string;
  formatted: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  resultType?: string;
}

/**
 * Fetch autocomplete suggestions for a given text query.
 */
export const getAutocompleteSuggestions = async (text: string): Promise<LocationSuggestion[]> => {
  if (!text || text.trim().length < 3) return [];
  try {
    const response = await api.get<any>('/location/autocomplete', {
      params: { query: text },
    });
    
    console.log('[Location Service] Response raw data:', JSON.stringify(response.data));
    console.log('[Location Service] response.data type:', typeof response.data);
    console.log('[Location Service] response.data keys:', response.data ? Object.keys(response.data) : 'null');
    
    let responseData = response.data;
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData);
        console.log('[Location Service] Parsed response string successfully');
      } catch (e) {
        console.error('[Location Service] Failed to parse response data as JSON:', e);
      }
    }
    
    let suggestionsArray: any[] = [];
    if (responseData) {
      if (Array.isArray(responseData)) {
        suggestionsArray = responseData;
      } else if (Array.isArray(responseData.data)) {
        suggestionsArray = responseData.data;
      } else if (responseData.data && Array.isArray(responseData.data.suggestions)) {
        suggestionsArray = responseData.data.suggestions;
      } else if (Array.isArray(responseData.suggestions)) {
        suggestionsArray = responseData.suggestions;
      } else if (responseData.data && Array.isArray(responseData.data.predictions)) {
        suggestionsArray = responseData.data.predictions;
      } else if (Array.isArray(responseData.predictions)) {
        suggestionsArray = responseData.predictions;
      }
    }
    
    console.log('[Location Service] suggestionsArray length:', suggestionsArray.length);
    if (suggestionsArray.length > 0) {
      console.log('[Location Service] first item:', JSON.stringify(suggestionsArray[0]));
    }
    
    return suggestionsArray.map((item: any, index: number) => {
      if (typeof item === 'string') {
        return {
          placeId: String(index),
          formatted: item,
          addressLine1: item,
          addressLine2: '',
          city: '',
          state: '',
          country: 'India',
          postcode: '',
          latitude: undefined,
          longitude: undefined,
        };
      }

      const formatted = item.formattedAddress || item.formatted || item.description || item.place_name || item.display_name || '';
      const parts = formatted.split(',').map((p: string) => p.trim()).filter(Boolean);
      const addressLine1 = parts[0] || '';
      const addressLine2 = parts.length > 2 ? parts[1] : (parts.length > 1 ? parts[0] : '');

      return {
        placeId: item.placeId || item.place_id || String(index),
        formatted,
        addressLine1,
        addressLine2,
        city: item.city || '',
        state: item.state || '',
        country: item.country || 'India',
        postcode: item.postcode || item.pincode || '',
        latitude: item.lat !== undefined ? item.lat : (item.latitude !== undefined ? item.latitude : undefined),
        longitude: item.lon !== undefined ? item.lon : (item.longitude !== undefined ? item.longitude : undefined),
      };
    });
  } catch (error: any) {
    console.error('[Location Service] Autocomplete failed:', error);
    return [];
  }
};

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
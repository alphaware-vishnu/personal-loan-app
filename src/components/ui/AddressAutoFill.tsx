/**
 * AddressAutoFill — GPS-powered address component
 * Auto-fills address from location, user only enters flat/house number.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../../theme';
import { getCurrentLocationAddress } from '../../services/locationService';
import type { Address } from '../../types/customer.type';
import { COPY } from '../../constants/copy';

interface AddressAutoFillProps {
  /** Current address value */
  value: Address;
  /** Change callback */
  onChange: (address: Address) => void;
  /** Label (e.g., "Home Address" or "Work Address") */
  label?: string;
  /** Show company name field (for work address) */
  showCompanyName?: boolean;
  /** Company name value */
  companyName?: string;
  /** Company name change callback */
  onCompanyNameChange?: (name: string) => void;
  /** Error message */
  error?: string;
}

export const AddressAutoFill: React.FC<AddressAutoFillProps> = ({
  value,
  onChange,
  label,
  showCompanyName = false,
  companyName = '',
  onCompanyNameChange,
  error,
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetched, setIsFetched] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleFetchLocation = useCallback(async () => {
    setIsLoading(true);
    setLocationError(null);
    try {
      const result = await getCurrentLocationAddress();
      onChange({
        ...value,
        ...result.address,
        flatNo: value.flatNo || '', // Preserve user's flat number
      });
      setIsFetched(true);
    } catch (err: any) {
      setLocationError(err.message || 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  }, [value, onChange]);

  const updateField = (key: keyof Address, text: string) => {
    onChange({
      ...value,
      [key]: text,
    });
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>{label}</Text>}

      {showCompanyName && onCompanyNameChange && (
        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Company Name</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            value={companyName}
            onChangeText={onCompanyNameChange}
            placeholder="e.g. Acme Corporation"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Flat / House No. / Building</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
          value={value.flatNo || ''}
          onChangeText={(text) => updateField('flatNo', text)}
          placeholder="e.g. Flat 101, Oakwood Apartments"
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      <TouchableOpacity
        style={[styles.gpsButton, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight }]}
        onPress={handleFetchLocation}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.gpsButtonText, { color: theme.colors.primary }]}>
              {isFetched ? 'Re-detect Location' : 'Auto-detect Location (GPS)'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {locationError && <Text style={styles.errorText}>{locationError}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Render the auto-filled address fields */}
      <MotiView
        from={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.detailsContainer}
      >
        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Area / Locality</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            value={value.area || ''}
            onChangeText={(text) => updateField('area', text)}
            placeholder="e.g. Sector 43, HSR Layout"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>City</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              value={value.city || ''}
              onChangeText={(text) => updateField('city', text)}
              placeholder="City"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Pincode</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              value={value.pinCode || ''}
              onChangeText={(text) => updateField('pinCode', text)}
              placeholder="Pincode"
              keyboardType="numeric"
              maxLength={6}
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>State</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            value={value.stateName || ''}
            onChangeText={(text) => updateField('stateName', text)}
            placeholder="State"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  gpsButton: {
    height: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  gpsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailsContainer: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 12,
  },
});
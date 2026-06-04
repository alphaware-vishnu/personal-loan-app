/**
 * AddressAutoFill — GPS-powered address component
 * Auto-fills address from location, user only enters flat/house number.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
  Modal,
  SafeAreaView,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../../theme';
import { getCurrentLocationAddress, getAutocompleteSuggestions, LocationSuggestion } from '../../services/locationService';
import { useDebounce } from '../../hooks/useDebounce';
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
  /** Whether the component is used for a work address or house address */
  isWorkAddress?: boolean;
}

export const AddressAutoFill: React.FC<AddressAutoFillProps> = ({
  value,
  onChange,
  label,
  showCompanyName = false,
  companyName = '',
  onCompanyNameChange,
  error,
  isWorkAddress = false,
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetched, setIsFetched] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Autocomplete states & effects
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<LocationSuggestion | null>(null);
  const isManuallyCleared = useRef(false);

  // Initialize selectedSuggestion card if value is already populated from server on mount
  useEffect(() => {
    if (isManuallyCleared.current) return;
    if (value && value.city && value.pinCode && !selectedSuggestion) {
      const formattedAddress = [
        value.buildingName,
        value.street,
        value.area,
        value.city,
        value.stateName,
        value.pinCode,
      ]
        .filter(Boolean)
        .join(', ');

      setSelectedSuggestion({
        placeId: 'existing_address',
        formatted: formattedAddress || `${value.city}, ${value.stateName}`,
        city: value.city,
        state: value.stateName,
        postcode: value.pinCode,
      });
      setIsFetched(true);
    }
  }, [value]);

  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearchQuery.trim().length < 3) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await getAutocompleteSuggestions(debouncedSearchQuery);
        console.log('[Autocomplete UI] Got results:', results.length, results);
        setSuggestions(results);
      } catch (err) {
        console.error('[Autocomplete UI] Failed to get suggestions:', err);
      } finally {
        setIsSearching(false);
      }
    };
    fetchSuggestions();
  }, [debouncedSearchQuery]);

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    isManuallyCleared.current = false;
    setSelectedSuggestion(suggestion);
    setSearchQuery(suggestion.formatted);
    setSuggestions([]);
    setIsModalVisible(false);
    Keyboard.dismiss();

    onChange({
      ...value,
      area: suggestion.addressLine2 || suggestion.addressLine1 || '',
      city: suggestion.city || '',
      stateName: suggestion.state || '',
      pinCode: suggestion.postcode || '',
      countryName: suggestion.country || 'India',
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setSelectedSuggestion(null);
    isManuallyCleared.current = true;
  };

  const handleChangeLocation = () => {
    handleClearSearch();
    setIsModalVisible(true);
  };

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
      setIsModalVisible(false);

      // Create a mock suggestion so it hides the search bar and shows the "Selected Location" card!
      const formattedAddress = [
        result.address.buildingName,
        result.address.street,
        result.address.area,
        result.address.city,
        result.address.stateName,
        result.address.pinCode,
      ]
        .filter(Boolean)
        .join(', ');

      setSelectedSuggestion({
        placeId: 'gps_detected',
        formatted: formattedAddress || 'Current Location (GPS)',
        city: result.address.city,
        state: result.address.stateName,
        postcode: result.address.pinCode,
        latitude: result.latitude,
        longitude: result.longitude,
      });
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

      {/* Selected Location Card or Autocomplete Placeholder Box */}
      {selectedSuggestion ? (
        <MotiView
          from={{ opacity: 0, scale: 0.95, translateY: -5 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 250 }}
          style={[styles.selectedCard, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}
        >
          <Ionicons name="location" size={20} color={theme.colors.primary} style={styles.selectedCardIcon} />
          <View style={styles.selectedCardContent}>
            <Text style={[styles.selectedCardTitle, { color: theme.colors.primary }]}>Selected Location</Text>
            <Text style={[styles.selectedCardText, { color: theme.colors.text }]} numberOfLines={2}>
              {selectedSuggestion.formatted}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.changeButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={handleChangeLocation}
            activeOpacity={0.7}
          >
            <Text style={[styles.changeButtonText, { color: theme.colors.primary }]}>Change</Text>
          </TouchableOpacity>
        </MotiView>
      ) : (
        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Search Address / Building</Text>
          <TouchableOpacity
            style={[
              styles.inputPlaceholderBtn,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
            onPress={() => setIsModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={18} color={theme.colors.textMuted} style={styles.placeholderIcon} />
            <Text style={[styles.placeholderText, { color: theme.colors.textMuted }]} numberOfLines={1}>
              Search company, tech park, building or area...
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Fullscreen Search Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.borderLight }]}>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={styles.modalCloseButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Search Location</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Search Input */}
          <View style={styles.modalSearchSection}>
            <View style={styles.searchWrapper}>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    paddingRight: 40,
                  },
                ]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search company, tech park, building or area..."
                placeholderTextColor={theme.colors.textMuted}
                autoFocus={true}
              />
              <View style={styles.searchRightIcons}>
                {isSearching ? (
                  <LottieView
                    source={require('../../../assets/new-loader.json')}
                    autoPlay
                    loop
                    style={{ width: 24, height: 24 }}
                  />
                ) : searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="search" size={18} color={theme.colors.textMuted} />
                )}
              </View>
            </View>
          </View>

          {/* Use Current Location (GPS) option */}
          <TouchableOpacity
            style={[styles.modalGpsButton, { borderBottomColor: theme.colors.borderLight }]}
            onPress={handleFetchLocation}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <View style={[styles.gpsIconCircle, { backgroundColor: theme.colors.primaryLight }]}>
              {isLoading ? (
                <LottieView
                  source={require('../../../assets/new-loader.json')}
                  autoPlay
                  loop
                  style={{ width: 24, height: 24 }}
                />
              ) : (
                <Ionicons name="locate" size={20} color={theme.colors.primary} />
              )}
            </View>
            <View style={styles.gpsTextContainer}>
              <Text style={[styles.gpsTitleText, { color: theme.colors.text }]}>Use current location</Text>
              <Text style={[styles.gpsSubtitleText, { color: theme.colors.textSecondary }]}>Detects location via GPS</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>

          {/* Suggestions List */}
          {suggestions.length > 0 ? (
            <ScrollView
              style={styles.modalSuggestionsContainer}
              keyboardShouldPersistTaps="handled"
            >
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.placeId}
                  style={[styles.suggestionItem, { borderBottomColor: theme.colors.borderLight }]}
                  onPress={() => handleSelectSuggestion(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="location-outline" size={20} color={theme.colors.primary} style={styles.suggestionIcon} />
                  <View style={styles.suggestionTextContainer}>
                    <Text style={[styles.suggestionText, { color: theme.colors.text }]}>
                      {item.formatted}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : searchQuery.trim().length >= 3 && !isSearching ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={48} color={theme.colors.textMuted} />
              <Text style={[styles.noResultsText, { color: theme.colors.textSecondary }]}>No locations found matching your search</Text>
            </View>
          ) : (
            <View style={styles.modalHelperContainer}>
              <Ionicons name="compass-outline" size={48} color={theme.colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.modalHelperText, { color: theme.colors.textMuted }]}>
                Type at least 3 characters to search for a company, tech park, or street address.
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

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

      {!isWorkAddress ? (
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Flat / House No.</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              value={value.flatNo || ''}
              onChangeText={(text) => updateField('flatNo', text)}
              placeholder="e.g. Flat 101"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Building Name</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              value={value.buildingName || ''}
              onChangeText={(text) => updateField('buildingName', text)}
              placeholder="e.g. Oakwood Apts"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>
        </View>
      ) : (
        <View style={styles.inputGroup}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Flat / House No.</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            value={value.flatNo || ''}
            onChangeText={(text) => updateField('flatNo', text)}
            placeholder="e.g. Flat 101, House 23"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>
      )}

      {locationError && <Text style={styles.errorText}>{locationError}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Render the auto-filled address fields */}
      <MotiView
        from={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.detailsContainer}
      >
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Area / Locality</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              value={value.area || ''}
              onChangeText={(text) => updateField('area', text)}
              placeholder="e.g. HSR Layout"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>State</Text>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              value={value.stateName || ''}
              onChangeText={(text) => updateField('stateName', text)}
              placeholder="State"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>
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
  inputPlaceholderBtn: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderIcon: {
    marginRight: 8,
  },
  placeholderText: {
    fontSize: 14,
    flex: 1,
  },
  searchWrapper: {
    position: 'relative',
    justifyContent: 'center',
    width: '100%',
  },
  searchRightIcons: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedCardIcon: {
    marginRight: 12,
  },
  selectedCardContent: {
    flex: 1,
    marginRight: 8,
  },
  selectedCardTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  selectedCardText: {
    fontSize: 13,
    lineHeight: 18,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  changeButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSearchSection: {
    padding: 16,
  },
  modalGpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  gpsIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gpsTextContainer: {
    flex: 1,
  },
  gpsTitleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  gpsSubtitleText: {
    fontSize: 12,
    marginTop: 2,
  },
  modalSuggestionsContainer: {
    flex: 1,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  modalHelperContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalHelperText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
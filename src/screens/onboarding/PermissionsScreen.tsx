import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { useColors } from '../../theme';
import { PermissionCard, PermissionItem } from '../../components/ui/PermissionCard';
import { usePermissionStore, PermissionStatus } from '../../store/permissionStore';

interface PermissionsScreenProps {
  onContinue: () => void;
}

const PERMISSIONS_DATA: PermissionItem[] = [
  {
    key: 'camera',
    icon: 'camera-outline',
    iconBg: '#FFF7ED',
    iconColor: '#F97316',
    title: 'Camera Access',
    subtitle: 'KYC Document Capture',
    description: 'Camera access is required to capture photos of your ID documents and selfie during the secure KYC verification process.',
  },
  {
    key: 'location',
    icon: 'location-outline',
    iconBg: '#FFF1F2',
    iconColor: '#FB7185',
    title: 'Location Services',
    subtitle: 'Address Auto-fill',
    description: 'We use your location to automatically populate address forms and verify your eligibility for fast disbursal.',
  },
  {
    key: 'notifications',
    icon: 'notifications-outline',
    iconBg: '#EFF6FF',
    iconColor: '#3B82F6',
    title: 'Notifications',
    subtitle: 'Real-time Loan Updates',
    description: 'Stay updated instantly on your application status, interest rates, repayment dates, and verification progress.',
  },
];

export const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onContinue }) => {
  const colors = useColors();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { setPermission, setHasSeenPermissionScreens } = usePermissionStore();

  const requestSystemPermission = async (key: string): Promise<PermissionStatus> => {
    try {
      if (key === 'location') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status as PermissionStatus;
      } else if (key === 'camera') {
        const { status } = await Camera.requestCameraPermissionsAsync();
        return status as PermissionStatus;
      } else if (key === 'notifications') {
        const { status } = await Notifications.requestPermissionsAsync();
        return status as PermissionStatus;
      }
    } catch (e) {
      console.warn(`Error requesting ${key} permission:`, e);
    }
    return 'denied';
  };

  const handleNext = () => {
    if (currentStep < PERMISSIONS_DATA.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setHasSeenPermissionScreens();
      onContinue();
    }
  };

  const handleAllow = async () => {
    setLoading(true);
    const key = PERMISSIONS_DATA[currentStep].key as 'camera' | 'location' | 'notifications';
    const status = await requestSystemPermission(key);
    setPermission(key, status);
    setLoading(false);
    handleNext();
  };

  const handleSkip = () => {
    const key = PERMISSIONS_DATA[currentStep].key as 'camera' | 'location' | 'notifications';
    setPermission(key, 'denied');
    handleNext();
  };

  const currentPermission = PERMISSIONS_DATA[currentStep];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.cardContainer}>
        <PermissionCard
          permission={currentPermission}
          stepIndex={currentStep}
          totalSteps={PERMISSIONS_DATA.length}
          onAllow={handleAllow}
          onSkip={handleSkip}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
});
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors, useTheme } from '../../theme';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import LottieView from 'lottie-react-native';
import { LoadingState } from '../feedback/LoadingState';

const { width, height } = Dimensions.get('window');

export interface CameraCaptureProps {
  mode?: 'document' | 'selfie';
  onCapture: (uri: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  mode = 'document',
  onCapture,
  onClose,
}) => {
  const colors = useColors();
  const { theme } = useTheme();

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const cameraRef = useRef<any>(null);

  // Set default facing based on mode
  useEffect(() => {
    if (mode === 'selfie') {
      setFacing('front');
    } else {
      setFacing('back');
    }
  }, [mode]);

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <LoadingState message="Starting camera..." fullScreen={false} />
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <SafeAreaView style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContent}>
          <View style={[styles.permissionIconWrapper, { backgroundColor: colors.primaryLight }]}>
            <Feather name="camera" size={40} color={colors.primary} />
          </View>
          <AppText variant="h1" align="center" style={[styles.permissionTitle, { color: colors.text }]}>
            Camera Access Required
          </AppText>
          <AppText variant="bodyLg" align="center" style={[styles.permissionDesc, { color: colors.textSecondary }]}>
            We need your camera permission to capture document photos and selfie verification for your application.
          </AppText>
          <AppButton title="Grant Camera Permission" onPress={requestPermission} />
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <AppText variant="labelMd" style={{ color: colors.textSecondary }}>
              Cancel
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleFacing = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setFlash((current) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const takePicture = async () => {
    if (cameraRef.current && !isTakingPhoto) {
      try {
        setIsTakingPhoto(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
        });
        if (photo?.uri) {
          setCapturedImage(photo.uri);
        }
      } catch (error) {
        console.error('Failed to take picture:', error);
      } finally {
        setIsTakingPhoto(false);
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const getFlashIcon = () => {
    if (flash === 'on') return 'flash';
    if (flash === 'auto') return 'flash-outline';
    return 'flash-off';
  };

  // Preview Mode
  if (capturedImage) {
    return (
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        <Image source={{ uri: capturedImage }} style={styles.previewImage} />

        {/* Top Control Bar in Preview */}
        <SafeAreaView style={styles.previewHeader}>
          <TouchableOpacity onPress={handleRetake} style={styles.circleBtn}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <AppText variant="labelLg" style={{ color: '#FFF' }}>
            Verify Document Quality
          </AppText>
          <View style={{ width: 44 }} />
        </SafeAreaView>

        {/* Footer controls in Preview */}
        <View style={styles.previewFooter}>
          <AppText
            variant="bodySm"
            align="center"
            style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 20, paddingHorizontal: 30 }}
          >
            Ensure all text, details and boundaries of the document are readable and clear of reflections.
          </AppText>
          <View style={styles.previewActions}>
            <TouchableOpacity
              onPress={handleRetake}
              style={[styles.previewActionBtn, { borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1.5 }]}
            >
              <AppText variant="labelLg" style={{ color: '#FFF' }}>
                Retake
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[styles.previewActionBtn, { backgroundColor: colors.primary }]}
            >
              <AppText variant="labelLg" style={{ color: '#FFF' }}>
                Use Photo
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        flash={flash}
        ref={cameraRef}
      >
        {/* Transparent Overlays with Guides */}
        <View style={styles.overlayContainer}>
          {/* Top Mask */}
          <View style={styles.maskBg} />
          
          <View style={styles.guideRow}>
            {/* Left Mask */}
            <View style={styles.maskBg} />
            
            {/* Guide Border Frame */}
            {mode === 'document' ? (
              <View style={[styles.documentGuide, { borderColor: '#FFF' }]}>
                {/* Corner Angles */}
                <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
              </View>
            ) : (
              <View style={[styles.selfieGuide, { borderColor: colors.primary }]}>
                <View style={styles.ovalMaskInner} />
              </View>
            )}
            
            {/* Right Mask */}
            <View style={styles.maskBg} />
          </View>

          {/* Bottom Mask */}
          <View style={[styles.maskBg, { flex: 1.5 }]} />
        </View>

        {/* Foreground Content */}
        <SafeAreaView style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.circleBtn}>
            <Feather name="x" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <AppText variant="labelLg" style={{ color: '#FFF' }}>
            {mode === 'document' ? 'Scan Document' : 'Face Verification'}
          </AppText>

          {facing === 'back' ? (
            <TouchableOpacity onPress={toggleFlash} style={styles.circleBtn}>
              <Ionicons name={getFlashIcon()} size={22} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </SafeAreaView>

        {/* Bottom Camera Toolbar */}
        <View style={styles.footer}>
          <AppText
            variant="bodySm"
            align="center"
            style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}
          >
            {mode === 'document'
              ? 'Position document within the card boundary'
              : 'Position your face within the oval indicator'}
          </AppText>
          <View style={styles.toolbar}>
            {/* Flip camera is disabled for documents usually, but enabled for convenience */}
            <TouchableOpacity onPress={toggleFacing} style={styles.circleBtn}>
              <Ionicons name="camera-reverse" size={26} color="#FFF" />
            </TouchableOpacity>

            {/* Shutter button */}
            <TouchableOpacity
              onPress={takePicture}
              disabled={isTakingPhoto}
              style={styles.shutterBtnOuter}
            >
              <View style={styles.shutterBtnInner}>
                {isTakingPhoto && (
                  <LottieView
                    source={require('../../../assets/new-loader.json')}
                    autoPlay
                    loop
                    style={{ width: 28, height: 28 }}
                  />
                )}
              </View>
            </TouchableOpacity>

            {/* Placeholder for toolbar spacing */}
            <View style={{ width: 44 }} />
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    marginBottom: 12,
  },
  permissionDesc: {
    marginBottom: 32,
  },
  cancelBtn: {
    marginTop: 20,
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  maskBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  guideRow: {
    flexDirection: 'row',
  },
  documentGuide: {
    width: width - 48,
    height: (width - 48) * 0.63, // ID card aspect ratio
    borderWidth: 1,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderWidth: 4,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },
  selfieGuide: {
    width: 240,
    height: 320,
    borderRadius: 120, // Ellipse/oval-like border
    borderWidth: 3,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  ovalMaskInner: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  shutterBtnOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterBtnInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'contain',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  previewFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewActionBtn: {
    flex: 0.47,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React, { useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors, useTheme } from '../../theme';
import { AppText } from './AppText';
import { AppCard } from './AppCard';

export type AppModalVariant = 'center' | 'bottom-sheet' | 'full-screen';

export interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  variant?: AppModalVariant;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  variant = 'bottom-sheet',
  children,
  showCloseButton = true,
}) => {
  const colors = useColors();
  const { theme } = useTheme();

  // Trigger selection haptic feedback when modal opens
  useEffect(() => {
    if (visible) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback
      }
    }
  }, [visible]);

  const renderContent = () => {
    const isBottomSheet = variant === 'bottom-sheet';
    const isFullScreen = variant === 'full-screen';

    const modalContent = (
      <View
        style={[
          styles.modalContent,
          isBottomSheet && [
            styles.bottomSheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: theme.radii['3xl'],
              borderTopRightRadius: theme.radii['3xl'],
            },
          ],
          isFullScreen && [
            styles.fullScreen,
            { backgroundColor: colors.background },
          ],
          variant === 'center' && [
            styles.centerCard,
            {
              backgroundColor: colors.surface,
              borderRadius: theme.radii['2xl'],
            },
          ],
        ]}
      >
        {/* Drag handle for bottom sheet */}
        {isBottomSheet && (
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
        )}
        
        {/* Header */}
        {(title || showCloseButton) && (
          <View style={styles.header}>
            {title ? (
              <AppText variant="h3" style={{ color: colors.text }}>
                {title}
              </AppText>
            ) : (
              <View />
            )}
            
            {showCloseButton && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Body content */}
        <View style={styles.body}>{children}</View>
      </View>
    );

    if (isFullScreen) {
      return <SafeAreaView style={styles.safeArea}>{modalContent}</SafeAreaView>;
    }

    return modalContent;
  };

  return (
    <Modal
      transparent={variant !== 'full-screen'}
      visible={visible}
      onRequestClose={onClose}
      animationType={variant === 'bottom-sheet' ? 'slide' : 'fade'}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {variant !== 'full-screen' ? (
          <View style={[
            styles.backdrop, 
            { 
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: variant === 'center' ? 'center' : 'flex-end',
              alignItems: variant === 'center' ? 'center' : 'stretch'
            }
          ]}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={onClose}
            />
            {renderContent()}
          </View>
        ) : (
          renderContent()
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
  },
  modalContent: {
    width: '100%',
    overflow: 'hidden',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  fullScreen: {
    flex: 1,
    height: '100%',
  },
  centerCard: {
    width: '85%',
    maxWidth: 400,
    paddingVertical: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  safeArea: {
    flex: 1,
  },
});
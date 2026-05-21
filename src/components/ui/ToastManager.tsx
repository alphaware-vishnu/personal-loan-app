import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Toast, { ToastConfig, BaseToastProps } from 'react-native-toast-message';
import { Feather } from '@expo/vector-icons';
import { useColors, useTheme } from '../../theme';
import { AppText } from './AppText';

// Helper functions for displaying Toast messages anywhere in the app
export const showToast = {
  success: (title: string, message?: string) => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
    });
  },
  error: (title: string, message?: string) => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
    });
  },
  info: (title: string, message?: string) => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
    });
  },
  warning: (title: string, message?: string) => {
    Toast.show({
      type: 'warning',
      text1: title,
      text2: message,
    });
  },
};

export const useToastConfig = (): ToastConfig => {
  const colors = useColors();
  const { theme } = useTheme();

  const renderCustomToast = (
    title: string | undefined,
    message: string | undefined,
    iconName: any,
    color: string,
    bgColor: string
  ) => {
    return (
      <View
        style={[
          styles.toastContainer,
          {
            backgroundColor: colors.surface,
            borderLeftColor: color,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View style={[styles.iconWrapper, { backgroundColor: bgColor }]}>
          <Feather name={iconName} size={20} color={color} />
        </View>
        <View style={styles.textContainer}>
          {title ? (
            <AppText variant="labelMd" style={{ color: colors.text }}>
              {title}
            </AppText>
          ) : null}
          {message ? (
            <AppText
              variant="bodySm"
              style={{ color: colors.textSecondary, marginTop: 2 }}
            >
              {message}
            </AppText>
          ) : null}
        </View>
      </View>
    );
  };

  return {
    success: (props: BaseToastProps) =>
      renderCustomToast(
        props.text1,
        props.text2,
        'check-circle',
        colors.success,
        colors.successLight || '#E8F5E9'
      ),
    error: (props: BaseToastProps) =>
      renderCustomToast(
        props.text1,
        props.text2,
        'alert-circle',
        colors.error,
        colors.errorLight || '#FFEBEE'
      ),
    info: (props: BaseToastProps) =>
      renderCustomToast(
        props.text1,
        props.text2,
        'info',
        colors.info || '#2196F3',
        colors.infoLight || '#E3F2FD'
      ),
    warning: (props: BaseToastProps) =>
      renderCustomToast(
        props.text1,
        props.text2,
        'alert-triangle',
        colors.warning || '#FF9800',
        colors.warningLight || '#FFF3E0'
      ),
  };
};

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderStyle: 'solid',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 20,
      },
    }),
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
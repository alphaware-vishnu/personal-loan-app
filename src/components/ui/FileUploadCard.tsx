import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import LottieView from 'lottie-react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useColors, useTheme } from '../../theme';
import { AppText } from './AppText';
import { AppCard } from './AppCard';
import { ProgressBar } from './ProgressBar';

export type FileUploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface FileUploadCardProps {
  label: string;
  description?: string;
  status: FileUploadStatus;
  progress?: number; // 0 to 1
  fileName?: string;
  fileUri?: string;
  isRequired?: boolean;
  onUploadPress: () => void;
  onViewPress?: () => void;
  onDeletePress?: () => void;
  onRetryPress?: () => void;
}

export const FileUploadCard: React.FC<FileUploadCardProps> = ({
  label,
  description,
  status,
  progress = 0,
  fileName,
  fileUri,
  isRequired = false,
  onUploadPress,
  onViewPress,
  onDeletePress,
  onRetryPress,
}) => {
  const colors = useColors();
  const { theme } = useTheme();

  const isUploading = status === 'uploading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isIdle = status === 'idle';

  // Determine card outline or background styling based on status
  const getCardStyle = () => {
    if (isSuccess) {
      return {
        borderColor: colors.success,
        backgroundColor: theme.mode === 'light' ? colors.successLight : 'rgba(16, 185, 129, 0.05)',
      };
    }
    if (isError) {
      return {
        borderColor: colors.error,
        backgroundColor: theme.mode === 'light' ? colors.errorLight : 'rgba(244, 63, 94, 0.05)',
      };
    }
    if (isUploading) {
      return {
        borderColor: colors.borderFocused,
        backgroundColor: colors.background,
      };
    }
    return {
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
      borderStyle: 'dashed' as const,
    };
  };

  const isImageFile = (uri?: string) => {
    if (!uri) return false;
    const lower = uri.toLowerCase();
    return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.startsWith('data:image/');
  };

  return (
    <AppCard style={[styles.card, getCardStyle()]}>
      <View style={styles.contentRow}>
        {/* Left Side: Thumbnail/Icon */}
        <View style={styles.leftContainer}>
          {isSuccess && fileUri && isImageFile(fileUri) ? (
            <Image source={{ uri: fileUri }} style={styles.thumbnail} />
          ) : (
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isSuccess
                    ? colors.success + '15'
                    : isError
                    ? colors.error + '15'
                    : colors.backgroundSecondary,
                },
              ]}
            >
              <Ionicons
                name={
                  isSuccess
                    ? 'checkmark-circle-outline'
                    : isError
                    ? 'alert-circle-outline'
                    : isUploading
                    ? 'cloud-upload-outline'
                    : 'document-attach-outline'
                }
                size={24}
                color={
                  isSuccess
                    ? colors.success
                    : isError
                    ? colors.error
                    : isUploading
                    ? colors.primary
                    : colors.textSecondary
                }
              />
            </View>
          )}

          <View style={styles.textContainer}>
            <View style={styles.labelRow}>
              <AppText variant="bodyMedium" style={{ color: colors.text }}>
                {label}
              </AppText>
              {isRequired && (
                <AppText variant="bodyMedium" style={{ color: colors.error, marginLeft: 4 }}>
                  *
                </AppText>
              )}
            </View>
            
            {description && isIdle && (
              <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                {description}
              </AppText>
            )}

            {isUploading && (
              <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                Uploading ({Math.round(progress * 100)}%)...
              </AppText>
            )}

            {(isSuccess || isError) && fileName && (
              <AppText
                variant="caption"
                numberOfLines={1}
                style={{ color: colors.textSecondary, marginTop: 2 }}
              >
                {fileName}
              </AppText>
            )}
          </View>
        </View>

        {/* Right Side: Actions */}
        <View style={styles.actionsContainer}>
          {isIdle && (
            <TouchableOpacity onPress={onUploadPress} style={styles.actionButton}>
              <Feather name="plus" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}

          {isUploading && (
            <LottieView
              source={require('../../../assets/new-loader.json')}
              autoPlay
              loop
              style={{ width: 24, height: 24 }}
            />
          )}

          {isSuccess && (
            <View style={styles.successActions}>
              {onViewPress && (
                <TouchableOpacity onPress={onViewPress} style={styles.actionButton}>
                  <Feather name="eye" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              {onDeletePress && (
                <TouchableOpacity onPress={onDeletePress} style={styles.actionButton}>
                  <Feather name="trash-2" size={18} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {isError && (
            <View style={styles.errorActions}>
              {onRetryPress && (
                <TouchableOpacity onPress={onRetryPress} style={styles.actionButton}>
                  <Feather name="refresh-cw" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
              {onDeletePress && (
                <TouchableOpacity onPress={onDeletePress} style={styles.actionButton}>
                  <Feather name="trash-2" size={18} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Upload Progress Bar */}
      {isUploading && (
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} height={4} />
        </View>
      )}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  successActions: {
    flexDirection: 'row',
    gap: 12,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  progressContainer: {
    marginTop: 12,
    width: '100%',
  },
});
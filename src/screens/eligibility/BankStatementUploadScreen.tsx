import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Linking } from 'react-native';
import { MotiView } from 'moti';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SafeHeader } from '../../components/layout/SafeHeader';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { useColors, useTheme } from '../../theme';
import { useOnboardingStore } from '../../store/onboardingStore';
import { trackEvent } from '../../utils/analytics';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { AppInput } from '../../components/ui/AppInput';
import * as DocumentPicker from 'expo-document-picker';
import { uploadDocumentToUms, getDocumentDownloadFromUms } from '../../services/documentService';
import { uploadStatementDetails } from '../../services/customerService';
import Toast from 'react-native-toast-message';
import { env } from '../../config/env';

interface BankStatementUploadScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export const BankStatementUploadScreen: React.FC<BankStatementUploadScreenProps> = ({ onNext, onBack }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { completeStep } = useOnboardingStore();

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedId, setUploadedId] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setFileName(file.name);
      setFileSize(file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown size');
      setUploadProgress(0);
      setUploadComplete(false);
      setIsUploading(true);

      const formData = new FormData();
      // @ts-ignore
      formData.append('files', {
        uri: file.uri,
        name: file.name,
        type: 'application/pdf',
      });

      // Simulated initial progress to make UI responsive
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 100);

      const response = await uploadDocumentToUms(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);

      const fileId = response.data?.data?.[0] || response.data?.fileUuid || 'temp-aws-id';
      
      let fileUrl = '';
      try {
        if (fileId && fileId !== 'temp-aws-id') {
          const downloadResponse = await getDocumentDownloadFromUms(Number(fileId));
          const docInfo = downloadResponse.data?.data?.[0];
          if (docInfo) {
            fileUrl = docInfo.filePath || docInfo.url || '';
          }
        }
      } catch (err) {
        console.error('[Bank Statement Upload] Error getting download path from UMS:', err);
      }

      if (!fileUrl) {
        fileUrl = response.data?.url || response.data?.filePath || (response.data?.data?.[0] ? `${env.userManagement}/document/download?ids=${fileId}` : '');
      }
      
      setUploadedId(String(fileId));
      setUploadedUrl(String(fileUrl));
      setUploadComplete(true);
      setIsUploading(false);

      Toast.show({
        type: 'success',
        text1: 'Upload Successful',
        text2: 'Bank statement uploaded successfully.',
      });

    } catch (err: any) {
      console.error('[Bank Statement Upload] Error picking/uploading document:', err);
      setIsUploading(false);
      setFileName(null);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: err.message || 'Could not upload bank statement. Please try again.',
      });
    }
  };

  const handleCancelFile = () => {
    setFileName(null);
    setFileSize(null);
    setUploadProgress(0);
    setUploadComplete(false);
    setUploadedId(null);
    setUploadedUrl(null);
    setPassword('');
  };

  const handleViewFile = async () => {
    if (!uploadedUrl) {
      Toast.show({
        type: 'error',
        text1: 'No File URL',
        text2: 'Statement URL is not available.',
      });
      return;
    }

    try {
      let targetUrl = uploadedUrl;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        const baseUrl = env.userManagement.replace(/\/$/, '');
        if (targetUrl.startsWith('/')) {
          if (targetUrl.startsWith('/api/user-management')) {
            targetUrl = env.userManagement.replace('/api/user-management/', '') + targetUrl.substring(1);
          } else {
            targetUrl = baseUrl + targetUrl;
          }
        } else {
          targetUrl = baseUrl + '/' + targetUrl;
        }
      }

      const canOpen = await Linking.canOpenURL(targetUrl);
      if (canOpen) {
        await Linking.openURL(targetUrl);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Cannot Open URL',
          text2: 'System cannot open this URL: ' + targetUrl,
        });
      }
    } catch (err: any) {
      console.error('[Bank Statement Upload] Error opening statement URL:', err);
      Toast.show({
        type: 'error',
        text1: 'View Failed',
        text2: err.message || 'Could not open statement.',
      });
    }
  };

  const handleContinue = async () => {
    if (!uploadComplete) {
      completeStep('bank_statement');
      trackEvent('document_upload_completed', { skip: true });
      onNext();
      return;
    }

    setIsUploading(true);
    try {
      await uploadStatementDetails({
        accountStatementId: uploadedId || undefined,
        accountStatementUrl: uploadedUrl || undefined,
        password: password || "",
      });

      completeStep('bank_statement');
      trackEvent('document_upload_completed', { skip: false });
      onNext();
    } catch (err: any) {
      console.error('[Bank Statement Upload] API error:', err);
      Toast.show({
        type: 'error',
        text1: 'Analysis Failed',
        text2: err.message || 'Could not analyze bank statement. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScreenWrapper>
      <SafeHeader title="Verify Income" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <StepIndicator totalSteps={3} currentStep={1} showLabel stageName="Eligibility Check" />

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.content}
        >
          <AppText variant="h2" style={styles.title}>
            Upload your bank statement
          </AppText>
          
          <AppText variant="bodyMd" style={{ color: colors.textSecondary, marginBottom: 24 }}>
            Upload the PDF statement of your primary bank account where your income is credited.
          </AppText>

          {/* Upload Area */}
          {!fileName && (
            <TouchableOpacity
              onPress={handleDocumentPick}
              style={[styles.uploadBox, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                <Feather name="upload-cloud" size={28} color={colors.primary} />
              </View>
              <AppText variant="labelLg" style={{ color: colors.primary, marginTop: 12 }}>
                Select Bank Statement PDF
              </AppText>
              <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>
                Supports PDF format, Max 5MB
              </AppText>
            </TouchableOpacity>
          )}

          {/* Upload Progress / Card */}
          {fileName && (
            <View style={[styles.fileCard, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.fileHeader}>
                <Feather name="file-text" size={24} color={colors.primary} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMd" style={{ fontWeight: '600' }} numberOfLines={1}>
                    {fileName}
                  </AppText>
                  {fileSize && (
                    <AppText variant="caption" style={{ color: colors.textSecondary }}>
                      {fileSize}
                    </AppText>
                  )}
                </View>
                {uploadComplete && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity 
                      onPress={handleViewFile}
                      style={{ marginRight: 14 }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Feather name="eye" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={handleCancelFile}
                      style={{ marginRight: 14 }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Feather name="trash-2" size={20} color={colors.error} />
                    </TouchableOpacity>
                    <Feather name="check-circle" size={20} color={colors.success} />
                  </View>
                )}
                {!uploadComplete && !isUploading && (
                  <TouchableOpacity 
                    onPress={handleCancelFile}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="trash-2" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>

              {isUploading && (
                <View style={styles.progressContainer}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <AppText variant="caption" style={{ color: colors.textSecondary }}>
                      Uploading...
                    </AppText>
                    <AppText variant="caption" style={{ color: colors.primary, fontWeight: '600' }}>
                      {uploadProgress}%
                    </AppText>
                  </View>
                  <ProgressBar progress={uploadProgress / 100} />
                </View>
              )}

              {uploadComplete && (
                <MotiView
                  from={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 75 }}
                  transition={{ type: 'timing', duration: 300 }}
                  style={{ marginTop: 16 }}
                >
                  <AppInput
                    label="PDF Password (if encrypted)"
                    placeholder="Enter statement password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </MotiView>
              )}
            </View>
          )}

          {/* Secure Note */}
          <View style={styles.secureBadge}>
            <Feather name="lock" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <AppText variant="caption" style={{ color: colors.textSecondary }}>
              100% Secure & encrypted with bank-grade security.
            </AppText>
          </View>
        </MotiView>
      </ScrollView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 200 }}
        style={[styles.footer, { borderTopColor: colors.border }]}
      >
        <AppButton
          title={uploadComplete ? "Analyze & Continue" : "Skip / Fetch Statement Later"}
          onPress={handleContinue}
          variant={uploadComplete ? "primary" : "secondary"}
          size="lg"
          style={styles.button}
          loading={isUploading && uploadComplete}
        />
      </MotiView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: 16,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    width: '100%',
  },
});

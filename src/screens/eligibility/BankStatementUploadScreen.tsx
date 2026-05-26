import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
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

  const simulateDocPick = () => {
    // Generate a mock PDF statement name
    setFileName('bank_statement_last_3_months.pdf');
    setFileSize('1.4 MB');
    setUploadProgress(0);
    setUploadComplete(false);
    setIsUploading(true);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleContinue = () => {
    completeStep('bank_statement');
    trackEvent('document_upload_completed', { skip: !uploadComplete });
    onNext();
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
              onPress={simulateDocPick}
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
                  <Feather name="check-circle" size={20} color={colors.success} />
                )}
                {!uploadComplete && !isUploading && (
                  <TouchableOpacity onPress={() => setFileName(null)}>
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

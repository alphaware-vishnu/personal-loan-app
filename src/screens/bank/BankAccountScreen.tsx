import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useFormik } from 'formik';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import LottieView from 'lottie-react-native';

import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SafeHeader } from '../../components/layout/SafeHeader';
import { AppText } from '../../components/ui/AppText';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
import { FileUploadCard, FileUploadStatus } from '../../components/ui/FileUploadCard';
import { DocumentPickerSheet } from '../../components/DocumentPickerSheet';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { LoadingState } from '../../components/feedback/LoadingState';

import { useColors, useTheme } from '../../theme';
import { useLoanStore } from '../../store/loanStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { bankDetailsSchema } from '../../validations/schemas';
import { uploadDocument } from '../../services/documentService';
import { trackEvent } from '../../utils/analytics';
import { useDebounce } from '../../hooks';
import { getCustomerProfile, updateCustomerProfile } from '../../services/customerService';
import { useAuthStore } from '../../store/authStore';

interface BankAccountScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

type AutoPayMethod = 'enach' | 'upi';

export const BankAccountScreen: React.FC<BankAccountScreenProps> = ({ onNext, onBack, onSkip }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { completeStep } = useOnboardingStore();
  const {
    documentRequirements,
    uploadedDocs,
    updateUploadedDoc,
    addDocument,
    addCustomerBank,
    applicationId,
  } = useLoanStore();

  const [selectedAutoPay, setSelectedAutoPay] = useState<AutoPayMethod>('upi');
  const [branchName, setBranchName] = useState('');
  const [bankName, setBankName] = useState('');
  const [isLooingUpIfsc, setIsLookingUpIfsc] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Document picker states
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeReqId, setActiveReqId] = useState<number | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [uploadStatuses, setUploadStatuses] = useState<Record<number, FileUploadStatus>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});

  // Find relevant categories and types from dynamic requirements
  const allDocTypes = documentRequirements.flatMap((r) =>
    r.availableDocumentTypes.map((t) => ({ ...t, categoryId: r.categoryId }))
  );

  const passbookReq = allDocTypes.find((t) => t.documentName === 'Bank-Passbook');
  const houseReq = allDocTypes.find((t) => t.documentName === 'House Pictures');

  // Initialize upload statuses for documents
  useEffect(() => {
    const statuses: Record<number, FileUploadStatus> = {};
    if (passbookReq) {
      statuses[passbookReq.id] = uploadedDocs[passbookReq.id] ? 'success' : 'idle';
    }
    if (houseReq) {
      statuses[houseReq.id] = uploadedDocs[houseReq.id] ? 'success' : 'idle';
    }
    setUploadStatuses(statuses);
  }, [passbookReq, houseReq, uploadedDocs]);


  const formik = useFormik({
    initialValues: {
      accountName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      ifscCode: '',
    },
    validationSchema: bankDetailsSchema,
    onSubmit: async (values) => {
      const customerId = useAuthStore.getState().authData?.customerId || 99999;
      addCustomerBank({
        accountHolderName: values.accountName,
        accountNo: values.accountNumber,
        bank: bankName || 'Verified Bank',
        branch: branchName || 'Verified Branch',
        ifsc: values.ifscCode,
        accountType: 'SAVINGS',
        isDefault: true,
      });

      try {
        await updateCustomerProfile({
          // id: customerId,
          bank: {
            accountHolderName: values.accountName,
            accountNumber: values.accountNumber,
            ifscCode: values.ifscCode,
            autoDebitType: selectedAutoPay.toUpperCase(),
          },
        });

        const profile = await getCustomerProfile(customerId);
        if (profile && profile.data) {
          const data = profile.data;
          if (data.bank) {
            addCustomerBank({
              accountHolderName: data.bank.holderName || values.accountName,
              accountNo: data.bank.accountNo || values.accountNumber,
              bank: bankName || 'Verified Bank',
              branch: branchName || 'Verified Branch',
              ifsc: data.bank.ifscCode || values.ifscCode,
              accountType: 'SAVINGS',
              isDefault: true,
            });
          }
        }

        completeStep('bank_account');
        trackEvent('bank_account_verified', { autopay_method: selectedAutoPay });
        onNext();
      } catch (err: any) {
        Toast.show({
          type: 'error',
          text1: 'Save Failed',
          text2: err.message || 'Failed to save bank details.',
        });
      }
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      const customerId = useAuthStore.getState().authData?.customerId || 99999;
      setIsProfileLoading(true);
      try {
        const profile = await getCustomerProfile(customerId);
        if (profile && profile.data) {
          const data = profile.data;
          if (data.bank) {
            formik.setValues({
              accountName: data.bank.holderName || '',
              accountNumber: data.bank.accountNo || '',
              confirmAccountNumber: data.bank.accountNo || '',
              ifscCode: data.bank.ifscCode || '',
            });
            if (data.bank.autoDebitType) {
              setSelectedAutoPay(data.bank.autoDebitType.toLowerCase() as AutoPayMethod);
            }
          }
        }
      } catch (err) {
        console.error('[Bank Account Screen] Failed to load profile:', err);
      } finally {
        setIsProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  const debouncedIfsc = useDebounce(formik.values.ifscCode, 500);

  useEffect(() => {
    if (debouncedIfsc.length === 11) {
      // Validate format: 4 letters, 0, 6 alphanumeric
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (ifscRegex.test(debouncedIfsc)) {
        setIsLookingUpIfsc(true);
        const timer = setTimeout(() => {
          setIsLookingUpIfsc(false);
          setBankName('STATE BANK OF INDIA');
          setBranchName('MUMBAI MAIN BRANCH');
          trackEvent('bank_account_submitted', { ifsc: debouncedIfsc });
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        setBankName('');
        setBranchName('');
      }
    } else {
      setBankName('');
      setBranchName('');
    }
  }, [debouncedIfsc]);

  // Simulated IFSC auto-lookup
  const handleIfscChange = (val: string) => {
    const formatted = val.toUpperCase().trim();
    formik.setFieldValue('ifscCode', formatted);
  };

  const handleDocumentPickPress = (reqId: number, categoryId: number) => {
    setActiveReqId(reqId);
    setActiveCategoryId(categoryId);
    setPickerVisible(true);
  };

  const handleDocumentSelect = async (uri: string, type: string) => {
    if (activeReqId === null || activeCategoryId === null) return;
    const reqId = activeReqId;
    const catId = activeCategoryId;

    setUploadStatuses((prev) => ({ ...prev, [reqId]: 'uploading' }));
    setUploadProgress((prev) => ({ ...prev, [reqId]: 0.1 }));

    try {
      const fileName = uri.split('/').pop() || `doc_${reqId}.${type === 'image' ? 'jpg' : 'pdf'}`;
      const formData = new FormData();
      // @ts-ignore
      formData.append('files', {
        uri,
        name: fileName,
        type: type === 'image' ? 'image/jpeg' : 'application/pdf',
      });

      // Simulate upload progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const current = prev[reqId] || 0.1;
          if (current >= 0.9) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [reqId]: current + 0.15 };
        });
      }, 100);

      const response = await uploadDocument(formData);
      clearInterval(progressInterval);

      const awsId = response.data?.data?.[0] || response.data?.fileUuid || 'temp-aws-id';

      setUploadProgress((prev) => ({ ...prev, [reqId]: 1 }));
      setUploadStatuses((prev) => ({ ...prev, [reqId]: 'success' }));

      updateUploadedDoc(reqId, {
        uri,
        awsId: String(awsId),
        fileName,
      });

      addDocument({
        categoryId: catId,
        documentTypeId: reqId,
        awsDocumentIds: [String(awsId)],
        documentNumber: null,
      });

      trackEvent('document_upload_completed', { document_type_id: reqId });
    } catch (error) {
      console.error('Document upload failed:', error);
      setUploadStatuses((prev) => ({ ...prev, [reqId]: 'error' }));
      Alert.alert('Upload Failed', 'There was an error uploading your document. Please try again.');
    }
  };

  const isFormValid =
    formik.isValid &&
    (formik.dirty || !!formik.values.accountNumber) &&
    (passbookReq ? uploadedDocs[passbookReq.id] : true) &&
    (houseReq ? uploadedDocs[houseReq.id] : true);

  if (isProfileLoading) {
    return (
      <ScreenWrapper padded={false}>
        <View style={styles.headerWrapper}>
          <SafeHeader title="Disbursal Bank Details" onBack={onBack} />
        </View>
        <LoadingState message="Loading bank details..." fullScreen={false} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper padded={false}>
      <View style={styles.headerWrapper}>
        <SafeHeader title="Disbursal Bank Details" onBack={onBack} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.screenPadding }]}
        >
          <View style={styles.stepIndicator}>
            <StepIndicator totalSteps={1} currentStep={0} showLabel stageName="Bank Verification" />
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.content}
          >
            <AppText variant="h2" style={styles.title}>
              Add your bank account
            </AppText>
            <AppText variant="bodyMd" style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter details for the bank account where you would like the loan amount to be credited.
            </AppText>

            {/* Account Holder Name */}
            <AppInput
              label="Account Holder Name"
              placeholder="Enter full name as in bank record"
              value={formik.values.accountName}
              onChangeText={formik.handleChange('accountName')}
              onBlur={formik.handleBlur('accountName')}
              error={formik.touched.accountName ? formik.errors.accountName : undefined}
              leftIcon={<Feather name="user" size={18} color={colors.textSecondary} />}
              autoCapitalize="words"
            />

            {/* Account Number */}
            <AppInput
              label="Account Number"
              placeholder="Enter bank account number"
              value={formik.values.accountNumber}
              onChangeText={formik.handleChange('accountNumber')}
              onBlur={formik.handleBlur('accountNumber')}
              error={formik.touched.accountNumber ? formik.errors.accountNumber : undefined}
              leftIcon={<Feather name="credit-card" size={18} color={colors.textSecondary} />}
              type="number"
            />

            {/* Confirm Account Number */}
            <AppInput
              label="Confirm Account Number"
              placeholder="Re-enter bank account number"
              value={formik.values.confirmAccountNumber}
              onChangeText={formik.handleChange('confirmAccountNumber')}
              onBlur={formik.handleBlur('confirmAccountNumber')}
              error={formik.touched.confirmAccountNumber ? formik.errors.confirmAccountNumber : undefined}
              leftIcon={<Feather name="shield" size={18} color={colors.textSecondary} />}
              type="number"
            />

            {/* IFSC Code */}
            <AppInput
              label="IFSC Code"
              placeholder="e.g. SBIN0001234"
              value={formik.values.ifscCode}
              onChangeText={handleIfscChange}
              onBlur={formik.handleBlur('ifscCode')}
              error={formik.touched.ifscCode ? formik.errors.ifscCode : undefined}
              leftIcon={<Feather name="hash" size={18} color={colors.textSecondary} />}
              type="pan"
              maxLength={11}
              rightIcon={
                isLooingUpIfsc ? (
                  <LottieView
                    source={require('../../../assets/loader.json')}
                    autoPlay
                    loop
                    style={{ width: 24, height: 24 }}
                  />
                ) : bankName ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                ) : null
              }
            />

            {/* Auto-populated bank and branch */}
            <AnimatePresence>
              {bankName && (
                <MotiView
                  from={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={[styles.bankDetailsBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                >
                  <View style={styles.bankDetailRow}>
                    <AppText variant="caption" style={{ color: colors.textSecondary }}>Bank:</AppText>
                    <AppText variant="bodySm" style={{ color: colors.text, fontWeight: '700' }}>{bankName}</AppText>
                  </View>
                  <View style={[styles.bankDetailRow, { marginTop: 6 }]}>
                    <AppText variant="caption" style={{ color: colors.textSecondary }}>Branch:</AppText>
                    <AppText variant="bodySm" style={{ color: colors.text, fontWeight: '700' }}>{branchName}</AppText>
                  </View>
                </MotiView>
              )}
            </AnimatePresence>

            {/* AutoPay setup section */}
            <AppText variant="labelLg" style={[styles.sectionTitle, { color: colors.text }]}>
              Set up AutoPay
            </AppText>
            <AppText variant="caption" style={{ color: colors.textSecondary, marginBottom: 12 }}>
              Choose a method to automatically repay your EMIs and avoid penalties.
            </AppText>

            <View style={styles.autoPayGrid}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.autoPayCard,
                  {
                    borderColor: selectedAutoPay === 'upi' ? colors.primary : colors.border,
                    backgroundColor: selectedAutoPay === 'upi' ? colors.primaryLight : colors.surface,
                  },
                ]}
                onPress={() => setSelectedAutoPay('upi')}
              >
                <View style={styles.radioRow}>
                  <Ionicons
                    name={selectedAutoPay === 'upi' ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={selectedAutoPay === 'upi' ? colors.primary : colors.textSecondary}
                  />
                  <AppText variant="bodyMedium" style={{ fontWeight: '700', marginLeft: 8 }}>
                    UPI AutoPay
                  </AppText>
                </View>
                <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
                  Fast & convenient using GPay, PhonePe, or BHIM.
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.autoPayCard,
                  {
                    borderColor: selectedAutoPay === 'enach' ? colors.primary : colors.border,
                    backgroundColor: selectedAutoPay === 'enach' ? colors.primaryLight : colors.surface,
                  },
                ]}
                onPress={() => setSelectedAutoPay('enach')}
              >
                <View style={styles.radioRow}>
                  <Ionicons
                    name={selectedAutoPay === 'enach' ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={selectedAutoPay === 'enach' ? colors.primary : colors.textSecondary}
                  />
                  <AppText variant="bodyMedium" style={{ fontWeight: '700', marginLeft: 8 }}>
                    eNACH NetBanking
                  </AppText>
                </View>
                <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
                  Robust setups for all major banks via NetBanking credentials.
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Document Uploads section */}
            {(passbookReq || houseReq) && (
              <View style={styles.uploadsContainer}>
                <AppText variant="labelLg" style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
                  Upload Documents
                </AppText>

                {passbookReq && (
                  <FileUploadCard
                    label="Bank Passbook / Cheque"
                    description="Upload the front page of passbook or cancelled cheque"
                    isRequired={passbookReq.isRequired}
                    status={uploadStatuses[passbookReq.id] || 'idle'}
                    progress={uploadProgress[passbookReq.id]}
                    fileName={uploadedDocs[passbookReq.id]?.fileName}
                    fileUri={uploadedDocs[passbookReq.id]?.uri}
                    onUploadPress={() => handleDocumentPickPress(passbookReq.id, passbookReq.categoryId)}
                    onDeletePress={() => {
                      updateUploadedDoc(passbookReq.id, undefined as any);
                    }}
                  />
                )}

                {houseReq && (
                  <FileUploadCard
                    label="House Verification Pictures"
                    description="Upload photos of your current residential address"
                    isRequired={houseReq.isRequired}
                    status={uploadStatuses[houseReq.id] || 'idle'}
                    progress={uploadProgress[houseReq.id]}
                    fileName={uploadedDocs[houseReq.id]?.fileName}
                    fileUri={uploadedDocs[houseReq.id]?.uri}
                    onUploadPress={() => handleDocumentPickPress(houseReq.id, houseReq.categoryId)}
                    onDeletePress={() => {
                      updateUploadedDoc(houseReq.id, undefined as any);
                    }}
                  />
                )}
              </View>
            )}
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Document Selection Modal Sheet */}
      <DocumentPickerSheet
        isVisible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleDocumentSelect}
      />

      {/* Sticky Bottom Actions */}
      <MotiView
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 200 }}
        style={[styles.footer, { borderTopColor: colors.border, paddingHorizontal: theme.screenPadding }]}
      >
        <AppButton
          title="Verify & Proceed"
          variant="primary"
          size="lg"
          onPress={() => formik.handleSubmit()}
          disabled={!isFormValid}
          loading={formik.isSubmitting}
        />
        {onSkip && (
          <AppButton
            title="Skip, I'll do later"
            variant="ghost"
            size="md"
            onPress={onSkip}
            style={{ marginTop: 8 }}
          />
        )}
      </MotiView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  headerWrapper: {
    paddingHorizontal: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  stepIndicator: {
    marginTop: 8,
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 24,
  },
  bankDetailsBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 4,
  },
  autoPayGrid: {
    gap: 12,
    marginBottom: 20,
  },
  autoPayCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadsContainer: {
    marginTop: 12,
  },
  footer: {
    paddingVertical: 16,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
});

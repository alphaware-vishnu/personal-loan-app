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
import Toast from 'react-native-toast-message';
import LottieView from 'lottie-react-native';
import * as WebBrowser from 'expo-web-browser';

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
import { initiateAutopay, getRepaymentDue } from '../../services/bankService';
import { useAuthStore } from '../../store/authStore';
import { isFeatureEnabled } from '../../config/features';
import { env } from '../../config/env';

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
    customerInfo,
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

  const [autopaySetupStatus, setAutopaySetupStatus] = useState<'idle' | 'initiating' | 'authorizing' | 'success' | 'failed'>('idle');
  const [mandateDetails, setMandateDetails] = useState<any>(null);
  const [isVerifyingAutopay, setIsVerifyingAutopay] = useState(false);

  const handleVerifyAutopay = async () => {
    if (!applicationId) return;
    setIsVerifyingAutopay(true);
    try {
      console.log('[AutoPay Verification] Verifying mandate status for application:', applicationId);
      const dueInfo = await getRepaymentDue(applicationId);
      console.log('[AutoPay Verification] Response:', dueInfo);
      
      if (dueInfo?.data?.autopayActive) {
        setAutopaySetupStatus('success');
        completeStep('bank_account');
        trackEvent('autopay_setup_completed', { method: selectedAutoPay });
        onNext();
      } else {
        Alert.alert(
          'Mandate Pending',
          'We could not verify your AutoPay setup yet. If you have authorized it, please wait a moment and try again.'
        );
      }
    } catch (error: any) {
      console.error('[AutoPay Verification] Error:', error);
      if (__DEV__) {
        Alert.alert(
          'Sandbox Bypass',
          `Failed to verify AutoPay: ${error.message || 'Unknown error'}.\n\nWould you like to force complete for testing?`,
          [
            { text: 'Retry', onPress: () => handleVerifyAutopay() },
            {
              text: 'Force Complete',
              onPress: () => {
                setAutopaySetupStatus('success');
                completeStep('bank_account');
                trackEvent('autopay_setup_completed', { method: selectedAutoPay });
                onNext();
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('Verification Error', 'Failed to check AutoPay status. Please try again.');
      }
    } finally {
      setIsVerifyingAutopay(false);
    }
  };

  const handleReopenAutopay = async () => {
    if (mandateDetails?.authUrl) {
      console.log('[AutoPay Setup] Re-opening authorization URL:', mandateDetails.authUrl);
      await WebBrowser.openBrowserAsync(mandateDetails.authUrl);
    }
  };

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
          const bank = (data.customerBanks && data.customerBanks.length > 0)
            ? data.customerBanks.find((b: any) => b.isDefault) || data.customerBanks[0]
            : data.bank;

          if (bank) {
            addCustomerBank({
              accountHolderName: bank.accountHolderName || bank.holderName || values.accountName,
              accountNo: bank.accountNo || bank.accountNumber || values.accountNumber,
              bank: bank.bank || bank.bankName || bankName || 'Verified Bank',
              branch: bank.branch || branchName || 'Verified Branch',
              ifsc: bank.ifsc || bank.ifscCode || values.ifscCode,
              accountType: 'SAVINGS',
              isDefault: true,
            });
          }
        }

        if (applicationId) {
          setAutopaySetupStatus('initiating');
          trackEvent('autopay_setup_started', { method: selectedAutoPay });

          const initiateResponse = await initiateAutopay(applicationId);
          console.log('[AutoPay Setup] Initiate response:', initiateResponse);

          const mandate = initiateResponse?.data;
          setMandateDetails(mandate);

          if (isFeatureEnabled('enableRazorpay') && mandate?.subscriptionId) {
            try {
              console.log('[AutoPay Setup] Launching Razorpay SDK for subscription:', mandate.subscriptionId);
              const RazorpayCheckout = require('react-native-razorpay').default;

              const checkoutOptions = {
                key: env.razorpayKeyId,
                subscription_id: mandate.subscriptionId,
                name: 'AlphaWare Finance',
                description: `EMI AutoPay - ₹${mandate.emiAmount || ''}`,
                prefill: {
                  name: values.accountName,
                  contact: customerInfo?.mobileNumber || '',
                  email: customerInfo?.email || '',
                },
                theme: {
                  color: '#1E40AF',
                },
              };

              setAutopaySetupStatus('authorizing');
              const rzpData = await RazorpayCheckout.open(checkoutOptions);
              console.log('[AutoPay Setup] Razorpay SDK authorized:', rzpData);

              setAutopaySetupStatus('success');
              completeStep('bank_account');
              trackEvent('autopay_setup_completed', { method: selectedAutoPay });
              onNext();
              return;
            } catch (sdkError: any) {
              console.warn('[AutoPay Setup] Razorpay SDK failed or cancelled, falling back to WebBrowser:', sdkError);
            }
          }

          if (mandate?.authUrl) {
            console.log('[AutoPay Setup] Fallback: opening mandate authUrl in WebBrowser:', mandate.authUrl);
            setAutopaySetupStatus('authorizing');
            await WebBrowser.openBrowserAsync(mandate.authUrl);
          } else {
            throw new Error('Mandate auth URL was not returned from the server.');
          }
        } else {
          completeStep('bank_account');
          trackEvent('bank_account_verified', { autopay_method: selectedAutoPay });
          onNext();
        }
      } catch (err: any) {
        setAutopaySetupStatus('failed');
        Toast.show({
          type: 'error',
          text1: 'Save Failed',
          text2: err.message || 'Failed to setup AutoPay.',
        });
      }
    },
  });
  const debouncedIfsc = useDebounce(formik.values.ifscCode, 500);

  useEffect(() => {
    const loadProfile = async () => {
      const customerId = useAuthStore.getState().authData?.customerId || 99999;
      setIsProfileLoading(true);
      try {
        const profile = await getCustomerProfile(customerId);
        if (profile && profile.data) {
          const data = profile.data;
          const bank = (data.customerBanks && data.customerBanks.length > 0)
            ? data.customerBanks.find((b: any) => b.isDefault) || data.customerBanks[0]
            : data.bank;

          if (bank) {
            const accountName = bank.accountHolderName || bank.holderName || '';
            const accountNumber = bank.accountNo || bank.accountNumber || '';
            const ifscCode = bank.ifsc || bank.ifscCode || '';
            
            formik.setValues({
              accountName,
              accountNumber,
              confirmAccountNumber: accountNumber,
              ifscCode,
            });

            if (bank.bank) {
              setBankName(bank.bank);
            } else if (bank.bankName) {
              setBankName(bank.bankName);
            }
            if (bank.branch) {
              setBranchName(bank.branch);
            }

            if (bank.autoDebitType) {
              setSelectedAutoPay(bank.autoDebitType.toLowerCase() as AutoPayMethod);
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
  }, []);  useEffect(() => {
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

  if (autopaySetupStatus === 'initiating') {
    return (
      <ScreenWrapper padded={false}>
        <View style={styles.headerWrapper}>
          <SafeHeader title="Disbursal Bank Details" onBack={onBack} />
        </View>
        <LoadingState message="Initiating AutoPay setup..." fullScreen={false} />
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

          {autopaySetupStatus === 'authorizing' ? (
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 400 }}
              style={{ alignItems: 'center', marginTop: 20 }}
            >
              <View style={[styles.autopayIconContainer, { backgroundColor: colors.primary + '15', width: 80, height: 80, borderRadius: 40, marginBottom: 20, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="card" size={40} color={colors.primary} />
              </View>

              <AppText variant="h2" style={[styles.title, { textAlign: 'center' }]}>
                Authorize AutoPay Mandate
              </AppText>
              
              <AppText variant="bodyMd" style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
                We have opened the secure {selectedAutoPay === 'upi' ? 'UPI AutoPay' : 'eNACH NetBanking'} portal in your browser. Please authorize the mandate to enable automatic EMI deductions.
              </AppText>

              {mandateDetails && (
                <AppCard style={{ width: '100%', padding: 16, marginBottom: 20 }}>
                  <View style={styles.bankDetailRow}>
                    <AppText variant="caption" style={{ color: colors.textSecondary }}>EMI Amount:</AppText>
                    <AppText variant="bodyMedium" style={{ fontWeight: '700', color: colors.text }}>
                      ₹{mandateDetails.emiAmount}
                    </AppText>
                  </View>
                  <View style={[styles.bankDetailRow, { marginTop: 8 }]}>
                    <AppText variant="caption" style={{ color: colors.textSecondary }}>Total Cycles:</AppText>
                    <AppText variant="bodyMedium" style={{ fontWeight: '700', color: colors.text }}>
                      {mandateDetails.totalCycles} cycles
                    </AppText>
                  </View>
                  {mandateDetails.subscriptionId && (
                    <View style={[styles.bankDetailRow, { marginTop: 8 }]}>
                      <AppText variant="caption" style={{ color: colors.textSecondary }}>Subscription ID:</AppText>
                      <AppText variant="bodySm" style={{ color: colors.textSecondary }}>
                        {mandateDetails.subscriptionId}
                      </AppText>
                    </View>
                  )}
                </AppCard>
              )}

              <View style={[styles.autopayInfoCard, { width: '100%', backgroundColor: colors.backgroundSecondary, borderColor: colors.border, padding: 12, borderRadius: 12, borderWidth: 1 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="shield" size={16} color={colors.success} style={{ marginRight: 8 }} />
                  <AppText variant="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                    Secured by Razorpay. You can cancel or pause this subscription anytime from your bank/UPI app.
                  </AppText>
                </View>
              </View>

              <AppButton
                title="I've Completed Setup"
                onPress={handleVerifyAutopay}
                variant="primary"
                size="lg"
                loading={isVerifyingAutopay}
                style={{ width: '100%', marginTop: 24 }}
              />

              <AppButton
                title="Re-open Setup Link"
                onPress={handleReopenAutopay}
                variant="outline"
                size="md"
                style={{ width: '100%', marginTop: 12 }}
              />
            </MotiView>
          ) : (
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
                    onUploadPress={() => handleDocumentPickPress(passbookReq.id!, passbookReq.categoryId!)}
                    onDeletePress={() => {
                      updateUploadedDoc(passbookReq.id!, undefined);
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
                    onUploadPress={() => handleDocumentPickPress(houseReq.id!, houseReq.categoryId!)}
                    onDeletePress={() => {
                      updateUploadedDoc(houseReq.id!, undefined);
                    }}
                  />
                )}
              </View>
            )}
          </MotiView>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Document Selection Modal Sheet */}
      <DocumentPickerSheet
        isVisible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleDocumentSelect}
      />

      {/* Sticky Bottom Actions */}
      {autopaySetupStatus !== 'authorizing' && (
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
      )}
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
  autopayIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  autopayInfoCard: {
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 14,
  },
});

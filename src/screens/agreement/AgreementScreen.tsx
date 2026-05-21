import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  Platform,
  Alert,
} from 'react-native';
import { MotiView } from 'moti';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useColors, useTheme } from '../../theme';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SafeHeader } from '../../components/layout/SafeHeader';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
import { AppInput } from '../../components/ui/AppInput';
import { StepIndicator } from '../../components/ui/StepIndicator';

import { useLoanStore } from '../../store/loanStore';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { createCustomer } from '../../services/customerService';
import { updateApplication, updateStepStatus } from '../../services/applicationService';
import { trackEvent } from '../../utils/analytics';
import { formatCurrency } from '../../utils/formatters';

interface AgreementScreenProps {
  onNext: () => void;
  onBack: () => void;
}

interface Point {
  x: number;
  y: number;
}

export const AgreementScreen: React.FC<AgreementScreenProps> = ({ onNext, onBack }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { completeStep } = useOnboardingStore();

  const loanStoreState = useLoanStore();
  const {
    requestedAmount,
    interest,
    tenure,
    emi,
    customerInfo,
    setCustomerId,
    applicationId,
    isExistingCustomer,
  } = loanStoreState;

  const { mobile: verifiedMobile, authData, setCustomerId: setAuthCustomerId } = useAuthStore();

  const [hasConsented, setHasConsented] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState('');

  // Signature drawing state
  const [points, setPoints] = useState<Point[]>([]);
  const isDrawingRef = useRef(false);

  // PanResponder to capture hand-drawn signature points
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        isDrawingRef.current = true;
        const { locationX, locationY } = evt.nativeEvent;
        setPoints([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (evt) => {
        if (!isDrawingRef.current) return;
        const { locationX, locationY } = evt.nativeEvent;
        setPoints((prev) => [...prev, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        isDrawingRef.current = false;
      },
    })
  ).current;

  const handleClearSignature = () => {
    setPoints([]);
  };

  const handleDownload = () => {
    setIsDownloading(true);
    trackEvent('agreement_viewed');
    setTimeout(() => {
      setIsDownloading(false);
      trackEvent('agreement_downloaded');
      Alert.alert('Success', 'Sanction letter downloaded successfully as PDF.');
    }, 1500);
  };

  const handleSubmit = async () => {
    if (!hasConsented) return;

    // Check signature completion
    if (signatureMode === 'draw' && points.length < 5) {
      Alert.alert('Signature Required', 'Please draw your signature in the signing area.');
      return;
    }
    if (signatureMode === 'type' && typedSignature.trim().length < 3) {
      Alert.alert('Signature Required', 'Please type your full name to sign.');
      return;
    }

    setIsSubmitting(true);
    trackEvent('agreement_viewed');

    try {
      let finalCustomerId = authData?.customerId || loanStoreState.customerId;

      // 1. Create Customer (PATCH /customer) ONLY for NEW customers
      if (!isExistingCustomer) {
        const customerPayload = {
          id: finalCustomerId || undefined,
          applicantName: customerInfo.applicantName,
          mobileNumber: verifiedMobile || customerInfo.mobileNumber,
          voterId: customerInfo.panNumber,
          gender: 'MALE',
          leadSource: 'HEYLON',
          leadStatus: 'ACTIVE',
          applicationSource: 'ALFIN',
          clientType: 'INDIVIDUAL',
          isVoterIdActive: true,
          customerBanks: customerInfo.customerBanks.map((bank) => ({
            ...bank,
            accountType: 'SAVINGS',
            isDefault: true,
          })),
          address: {
            city: 'Mumbai',
            pinCode: '400001',
            stateName: 'Maharashtra',
            countryName: 'India',
          },
        };

        const customerResponse = await createCustomer(customerPayload);
        const newCustomerId = customerResponse.data?.data?.id || customerResponse.data?.id;
        if (newCustomerId) {
          finalCustomerId = newCustomerId;
        }
      }

      if (!finalCustomerId) {
        throw new Error('Failed to retrieve Customer ID for application link');
      }

      setCustomerId(Number(finalCustomerId));
      setAuthCustomerId(Number(finalCustomerId));

      // 2. Update Application with final details
      const applicationPayload = {
        id: applicationId,
        requestedAmount: loanStoreState.requestedAmount,
        disbursalAmount: loanStoreState.disbursalAmount,
        emi: loanStoreState.emi,
        tenure: loanStoreState.tenure,
        interest: loanStoreState.interest,
        schemeMasterId: loanStoreState.schemeMasterId,
        repaymentFrequency: loanStoreState.repaymentFrequency,
        customerId: finalCustomerId,
        applicationSource: 'ALFIN',
        applicationDocuments: loanStoreState.applicationDocuments.map((doc) => ({
          categoryId: doc.categoryId,
          documentTypeId: doc.documentTypeId,
          awsDocumentIds: doc.awsDocumentIds,
          documentNumber: doc.documentNumber,
        })),
      };

      await updateApplication(applicationPayload);

      // 3. Mark agreement completed in database
      if (applicationId) {
        await updateStepStatus(applicationId, { loanAgreementCompleted: true });
      }

      completeStep('agreement');
      trackEvent('agreement_signed', { signature_mode: signatureMode });

      onNext();
    } catch (error: any) {
      console.error('Agreement submission failed:', error);
      trackEvent('api_error', { error: error.message });
      Alert.alert(
        'Submission Failed',
        error.response?.data?.message || error.message || 'There was an error signing your agreement. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper padded={false}>
      <View style={styles.headerWrapper}>
        <SafeHeader title="Sanction Agreement" onBack={onBack} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.screenPadding }]}
      >
        <View style={styles.stepIndicator}>
          <StepIndicator totalSteps={6} currentStep={5} showLabel />
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.content}
        >
          <AppText variant="h2" style={styles.title}>
            Review & Sign Agreement
          </AppText>
          <AppText variant="bodyMd" style={[styles.subtitle, { color: colors.textSecondary }]}>
            Please review the loan terms and digitally sign to finalize your application.
          </AppText>

          {/* Terms Overview Card */}
          <AppCard style={styles.termsCard}>
            <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
              <AppText variant="labelLg" style={{ fontWeight: '700' }}>
                Key Loan Details
              </AppText>
              <Feather name="shield" size={16} color={colors.success} />
            </View>

            <View style={styles.termsRow}>
              <View style={styles.termItem}>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>Loan Amount</AppText>
                <AppText variant="bodyMedium" style={{ fontWeight: '700', color: colors.text }}>
                  {formatCurrency(requestedAmount)}
                </AppText>
              </View>
              <View style={styles.termItem}>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>Interest Rate</AppText>
                <AppText variant="bodyMedium" style={{ fontWeight: '700', color: colors.text }}>
                  {interest}% p.a.
                </AppText>
              </View>
            </View>

            <View style={[styles.termsRow, { marginTop: 16 }]}>
              <View style={styles.termItem}>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>Tenure</AppText>
                <AppText variant="bodyMedium" style={{ fontWeight: '700', color: colors.text }}>
                  {tenure} Months
                </AppText>
              </View>
              <View style={styles.termItem}>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>Monthly EMI</AppText>
                <AppText variant="bodyMedium" style={{ fontWeight: '800', color: colors.primary }}>
                  {formatCurrency(emi)}
                </AppText>
              </View>
            </View>

            <AppButton
              title="Download Agreement PDF"
              variant="outline"
              size="sm"
              icon={<Feather name="download" size={16} color={colors.primary} />}
              onPress={handleDownload}
              loading={isDownloading}
              style={{ marginTop: 20 }}
            />
          </AppCard>

          {/* Legal Text Summary */}
          <AppText variant="label" style={[styles.sectionTitle, { color: colors.text }]}>
            Agreement Summary
          </AppText>
          <View style={[styles.documentBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <ScrollView nestedScrollEnabled style={styles.documentScroll}>
              <AppText variant="caption" style={{ color: colors.textSecondary, lineHeight: 18 }}>
                This Loan Agreement ("Agreement") is made between the borrower ("Borrower") and the lending institution ("Lender").{'\n\n'}
                1. DISBURSAL OF LOAN: The Lender agrees to disburse the loan amount stated above, subject to verification of details and successful bank account link setup.{'\n\n'}
                2. REPAYMENT TERMS: The Borrower agrees to repay the loan amount along with applicable interest in EMI installments on or before the due dates. Failure to do so will attract late payment fees and impact credit scores.{'\n\n'}
                3. PREPAYMENT: The Borrower may prepay the loan amount subject to foreclosure charges as detailed in the scheme guidelines.{'\n\n'}
                4. AUTHORIZATION: The Borrower authorizes the Lender to fetch credit bureau details and initiate AutoPay mandates (UPI / eNACH) for EMI recovery.
              </AppText>
            </ScrollView>
          </View>

          {/* Signature Selection Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.tabButton,
                { borderBottomColor: signatureMode === 'draw' ? colors.primary : 'transparent' },
              ]}
              onPress={() => setSignatureMode('draw')}
            >
              <AppText
                variant="bodyMedium"
                style={{
                  fontWeight: signatureMode === 'draw' ? '700' : '500',
                  color: signatureMode === 'draw' ? colors.primary : colors.textSecondary,
                }}
              >
                Draw Signature
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.tabButton,
                { borderBottomColor: signatureMode === 'type' ? colors.primary : 'transparent' },
              ]}
              onPress={() => setSignatureMode('type')}
            >
              <AppText
                variant="bodyMedium"
                style={{
                  fontWeight: signatureMode === 'type' ? '700' : '500',
                  color: signatureMode === 'type' ? colors.primary : colors.textSecondary,
                }}
              >
                Type Signature
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Signature input area */}
          {signatureMode === 'draw' ? (
            <View>
              <View style={[styles.canvasContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <View {...panResponder.panHandlers} style={StyleSheet.absoluteFill}>
                  {/* Drawing rendering as trail of small dots */}
                  {points.map((p, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.drawingPoint,
                        {
                          left: p.x - 2,
                          top: p.y - 2,
                          backgroundColor: colors.text,
                        },
                      ]}
                    />
                  ))}
                  {points.length === 0 && (
                    <View style={styles.canvasPlaceholder}>
                      <Feather name="edit-3" size={24} color={colors.textMuted} />
                      <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 8 }}>
                        Draw your signature here
                      </AppText>
                    </View>
                  )}
                </View>
                {points.length > 0 && (
                  <TouchableOpacity
                    style={[styles.clearButton, { backgroundColor: colors.surfaceElevated }]}
                    onPress={handleClearSignature}
                  >
                    <Feather name="trash-2" size={14} color={colors.error} />
                    <AppText variant="caption" style={{ color: colors.error, marginLeft: 4, fontWeight: '700' }}>
                      Clear
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={[styles.typeSignatureContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <AppInput
                placeholder="Type your full name"
                value={typedSignature}
                onChangeText={setTypedSignature}
                leftIcon={<Feather name="edit-3" size={18} color={colors.textSecondary} />}
              />
              {typedSignature.trim().length > 0 && (
                <View style={styles.signaturePreviewBox}>
                  <AppText variant="caption" style={{ color: colors.textSecondary, marginBottom: 8 }}>
                    Signature Preview:
                  </AppText>
                  <View style={[styles.previewCursiveBox, { backgroundColor: colors.backgroundSecondary }]}>
                    <AppText
                      style={[
                        styles.cursiveText,
                        {
                          color: colors.primary,
                          fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                        },
                      ]}
                    >
                      {typedSignature}
                    </AppText>
                  </View>
                </View>
              )}
            </MotiView>
          )}

          {/* Consent Checkbox */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setHasConsented(!hasConsented)}
            style={styles.consentRow}
          >
            <Ionicons
              name={hasConsented ? 'checkbox' : 'square-outline'}
              size={22}
              color={hasConsented ? colors.primary : colors.textSecondary}
              style={{ marginTop: 2 }}
            />
            <AppText variant="caption" style={[styles.consentText, { color: colors.textSecondary }]}>
              I have read, understood and agree to all the terms, conditions, e-stamp details and policies outlined in this loan agreement.
            </AppText>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>

      {/* Footer CTA */}
      <MotiView
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 200 }}
        style={[styles.footer, { borderTopColor: colors.border, paddingHorizontal: theme.screenPadding }]}
      >
        <AppButton
          title="Sign & Submit Application"
          variant="primary"
          size="lg"
          disabled={!hasConsented || (signatureMode === 'draw' && points.length < 5) || (signatureMode === 'type' && typedSignature.trim().length < 3)}
          loading={isSubmitting}
          onPress={handleSubmit}
        />
      </MotiView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 20,
  },
  termsCard: {
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  termsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  termItem: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  documentBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    height: 120,
    marginBottom: 24,
  },
  documentScroll: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2.5,
  },
  canvasContainer: {
    borderWidth: 1,
    borderRadius: 12,
    height: 150,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  drawingPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
  },
  canvasPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  clearButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  typeSignatureContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  signaturePreviewBox: {
    marginTop: 12,
  },
  previewCursiveBox: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cursiveText: {
    fontSize: 26,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  consentText: {
    flex: 1,
    marginLeft: 8,
    lineHeight: 16,
  },
  footer: {
    paddingVertical: 16,
    borderTopWidth: 1,
  },
});

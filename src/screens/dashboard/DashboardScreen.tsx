import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useQuery, useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { useColors, useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useLoanStore } from '../../store/loanStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { getTrackableSteps, OnboardingStepId } from '../../constants/onboardingSteps';
import { MeshBackground } from '@/components';

import { api, getProductDocuments, getCustomerApplications } from '../../services/api';
import { getCustomerProfile } from '../../services/customerService';
import { trackEvent } from '../../utils/analytics';
import { formatCurrency } from '../../utils/formatters';

import { DashboardHeader } from './components/DashboardHeader';
import { OnboardingProgressCard } from './components/OnboardingProgressCard';
import { ActiveLoanCard } from './components/ActiveLoanCard';
import { QuickActionsGrid } from './components/QuickActionsGrid';
import { OfferBanner } from './components/OfferBanner';
import { LoanSelectionModal } from '../../components/LoanSelectionModal';
import { AppText } from '../../components/ui/AppText';
import { EmiCalculatorModal } from './components/EmiCalculatorModal';
import { ReferEarnModal } from './components/ReferEarnModal';
import { SupportModal } from './components/SupportModal';
import { CreditScoreModal } from './components/CreditScoreModal';

interface DashboardScreenProps {
  onStartLoan: () => void;
  onSchemeSelect: (scheme: any) => void;
  onViewDetails: (applicationId: number, autoOpenRepay?: boolean) => void;
  onViewProfile: () => void;
  onResumeOnboarding: (screenKey: any) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onStartLoan,
  onSchemeSelect,
  onViewDetails,
  onViewProfile,
  onResumeOnboarding,
}) => {
  const colors = useColors();
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [activeModal, setActiveModal] = useState<'emi' | 'credit' | 'refer' | 'support' | null>(null);

  const handlePressService = (label: string) => {
    switch (label) {
      case 'EMI Calc':
        setActiveModal('emi');
        break;
      case 'Credit Score':
        setActiveModal('credit');
        break;
      case 'Refer & Earn':
        setActiveModal('refer');
        break;
      case 'Support':
        setActiveModal('support');
        break;
      default:
        break;
    }
  };

  const {
    setScheme,
    setCustomerId,
    setCalculationResults,
    setDocumentRequirements,
    setCustomerInfo,
    setApplicationData,
    cibilScore,
  } = useLoanStore();

  const { authData, clearAuth } = useAuthStore();
  const { completedSteps } = useOnboardingStore();

  const customerId = authData?.customerId;

  // Fetch customer profile
  const { data: profile } = useQuery({
    queryKey: ['customer-profile', customerId],
    queryFn: () => getCustomerProfile(customerId!),
    enabled: !!customerId,
  });

  React.useEffect(() => {
    if (profile?.data?.borrowerName) {
      setCustomerInfo({
        applicantName: profile.data.borrowerName,
        email: profile.data.email,
        mobileNumber: profile.data.mobile,
        panNumber: profile.data.panNumber,
      });
    }
  }, [profile, setCustomerInfo]);

  // 1. Fetch applications
  const { data: applications, isLoading: isAppsLoading } = useQuery({
    queryKey: ['applications', customerId],
    queryFn: () => getCustomerApplications(customerId!).then((res) => {
      const apiData = res.data?.data;
      if (apiData && typeof apiData === 'object') {
        if (Array.isArray(apiData)) {
          return apiData;
        }
        if (Array.isArray(apiData.records)) {
          return apiData.records;
        }
      }
      return [];
    }),
    enabled: !!customerId,
  });

  const activeApp = React.useMemo(() => {
    if (!applications || applications.length === 0) return null;
    const sorted = [...applications].sort((a, b) => b.id - a.id);
    return sorted.find((app: any) => app.applicationStatus !== 'DISBURSED' && app.applicationStatus !== 'CANCELLED') || null;
  }, [applications]);

  const { completeStep, reset: resetOnboarding } = useOnboardingStore();

  React.useEffect(() => {
    if (activeApp) {
      console.log('[DashboardScreen] Syncing active application progress:', activeApp.id, activeApp.applicationStatus);
      
      setCustomerId(activeApp.customerId);
      setApplicationData(activeApp.id, activeApp.productId || 5);
      setCalculationResults(activeApp.emiAmount || activeApp.emi || 0, activeApp.disbursedAmount || activeApp.requestedAmount || 0);
      
      useLoanStore.setState({
        requestedAmount: activeApp.requestedAmount || 0,
        tenure: activeApp.approvedTenure || activeApp.requestedTenure || 0,
        interest: activeApp.approvedInterestRate || activeApp.interest || 0,
        repaymentFrequency: activeApp.repaymentFrequency || 'MONTHLY',
      });

      resetOnboarding();
      
      const stepsToComplete: OnboardingStepId[] = [
        'intro',
        'permissions',
        'auth',
        'pan_verification',
        'employment',
        'work_address',
        'personal_address',
        'income',
        'bank_statement',
        'kyc_aadhaar',
        'kyc_selfie',
        'eligibility',
      ];

      // Infer step completion from application status when API flags are missing
      const status = activeApp.applicationStatus;
      const statusImpliesBankDone = ['SANCTION_GENERATED', 'SANCTION_SIGN_INITIATED', 'SANCTION_SIGNED', 'APPROVED', 'DISBURSED'].includes(status);
      const statusImpliesAgreementDone = ['APPROVED', 'DISBURSED'].includes(status);
      
      const bankVerificationCompleted = activeApp.applicationStepStatus?.bankVerificationCompleted ?? activeApp.bankVerificationCompleted ?? statusImpliesBankDone;
      const loanAgreementCompleted = activeApp.applicationStepStatus?.loanAgreementCompleted ?? activeApp.loanAgreementCompleted ?? statusImpliesAgreementDone;

      if (bankVerificationCompleted) {
        stepsToComplete.push('bank_account');
      }
      
      if (loanAgreementCompleted) {
        stepsToComplete.push('agreement');
      }

      if (status === 'DISBURSED') {
        stepsToComplete.push('disbursal');
      }

      useOnboardingStore.setState({
        hasCompletedIntro: true,
        hasCompletedProfile: true,
      });

      stepsToComplete.forEach((stepId) => completeStep(stepId));
    }
  }, [activeApp, completeStep, resetOnboarding, setCustomerId, setApplicationData, setCalculationResults]);

  const getResumeScreen = (app: any): any => {
    const rulesEngineCompleted = app.applicationStepStatus?.rulesEngineCompleted ?? app.rulesEngineCompleted;
    const bankVerificationCompleted = app.applicationStepStatus?.bankVerificationCompleted ?? app.bankVerificationCompleted;
    const loanAgreementCompleted = app.applicationStepStatus?.loanAgreementCompleted ?? app.loanAgreementCompleted;

    if (!rulesEngineCompleted) {
      return 'eligibilityProcessing';
    } else if (!bankVerificationCompleted) {
      return 'bankDetails';
    } else if (!loanAgreementCompleted) {
      const status = app.applicationStatus;
      if (status === 'SANCTION_GENERATED' || status === 'SANCTION_SIGN_INITIATED' || status === 'SANCTION_SIGNED') {
        return 'agreement';
      } else {
        return 'sanctionLetter';
      }
    } else {
      return 'disbursal';
    }
  };

  // 2. Fetch loan schemes
  const { data: schemesResponse, isLoading: isSchemesLoading } = useQuery({
    queryKey: ['loan-schemes'],
    queryFn: () => api({ url: `/scheme/products/5` }),
  });

  const schemes = schemesResponse?.data?.data || [];

  const handleApplyNow = () => {
    setModalVisible(true);
    onStartLoan();
    trackEvent('onboarding_started');
  };

  const emiMutation = useMutation({
    mutationFn: async (scheme: any) => {
      setScheme(scheme);
      if (authData?.customerId) setCustomerId(authData.customerId);

      const response = await api({
        url: '/application/calculate/emi',
        method: 'POST',
        data: {
          requestedAmount: scheme.loanAmount,
          interest: scheme.defaultInterest,
          tenure: scheme.defaultTenure,
          repaymentFrequency: scheme.tenureFrequency || 'MONTHLY',
          schemeMasterId: scheme.id,
          repaymentDate: new Date().toISOString().split('T')[0],
        },
      });

      const docResponse = await getProductDocuments(scheme.productId || 5);

      return {
        calc: response.data?.data,
        docs: docResponse.data?.data?.documentRequirements,
      };
    },
    onSuccess: (data, scheme) => {
      if (data?.calc) {
        setCalculationResults(data.calc.emi, data.calc.disbursementAmount);
      }
      if (data?.docs) {
        setDocumentRequirements(data.docs);
      }
      onSchemeSelect(scheme);
    },
    onError: (error: any, scheme) => {
      const errorMsg = error.response?.data?.message || 'Failed to calculate EMI';
      Toast.show({
        type: 'error',
        text1: 'Calculation Failed',
        text2: errorMsg,
        position: 'top',
      });
      onSchemeSelect(scheme);
    },
  });

  const handleSelectScheme = (scheme: any) => {
    setModalVisible(false);
    emiMutation.mutate(scheme);
  };

  const handleSignOut = () => {
    clearAuth();
  };

  const trackableSteps = getTrackableSteps().filter((step) => step.isRequired && step.isEnabled);
  const isOnboardingComplete = trackableSteps.every((step) => completedSteps.includes(step.id));
  const hasActiveApplications = applications && applications.length > 0;

  return (
    <MeshBackground style={styles.container}>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
        <DashboardHeader onViewProfile={onViewProfile} onSignOut={handleSignOut} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={{ backgroundColor: 'transparent' }}
        >
          {cibilScore !== null && (
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                marginHorizontal: 24,
                marginBottom: 16,
                padding: 16,
                borderRadius: 16,
                backgroundColor: 'rgba(52,211,153,0.1)',
                borderWidth: 1,
                borderColor: 'rgba(52,211,153,0.3)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#34D399', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="speedometer-outline" size={24} color="white" />
                </View>
                <View>
                  <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' }}>Your CIBIL Score</AppText>
                  <AppText variant="h2" style={{ color: 'white', fontWeight: '900' }}>{cibilScore}</AppText>
                </View>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(52,211,153,0.2)' }}>
                <AppText variant="caption" style={{ color: '#34D399', fontWeight: '800' }}>Excellent</AppText>
              </View>
            </MotiView>
          )}

          {!isOnboardingComplete && (
            <OnboardingProgressCard onResume={onResumeOnboarding} />
          )}

          {hasActiveApplications && (
            <ActiveLoanCard
              applications={applications}
              isLoading={isAppsLoading}
              onViewDetails={(appId) => {
                // Always show application details screen — resume logic is inside it
                onViewDetails(appId);
              }}
              onApplyNow={handleApplyNow}
            />
          )}

          {/* Quick Actions Grid */}
          <QuickActionsGrid onPressService={handlePressService} />

          {/* Instant Loan Schemes Banner */}
          <OfferBanner
            schemes={schemes}
            isLoading={isSchemesLoading}
            onSelectScheme={handleSelectScheme}
            onViewAll={() => setModalVisible(true)}
          />

          {/* Active Loan Details List at bottom */}
          {applications && applications.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 200 }}
              style={styles.loansSection}
            >
              <View style={styles.loansHeader}>
                <AppText variant="h3" style={[styles.sectionTitle, { color: colors.text }]}>
                  Active Accounts
                </AppText>
                <TouchableOpacity activeOpacity={0.7} onPress={handleApplyNow}>
                  <AppText variant="bodySm" style={{ color: colors.primary, fontWeight: '700' }}>
                    New Loan
                  </AppText>
                </TouchableOpacity>
              </View>

              {applications.map((app: any, idx: number) => {
                const isDisbursed = app.applicationStatus === 'DISBURSED';
                const rulesEngineCompleted = app.applicationStepStatus?.rulesEngineCompleted ?? app.rulesEngineCompleted;
                const bankVerificationCompleted = app.applicationStepStatus?.bankVerificationCompleted ?? app.bankVerificationCompleted;
                const loanAgreementCompleted = app.applicationStepStatus?.loanAgreementCompleted ?? app.loanAgreementCompleted;

                let stageName = '';
                const status = app.applicationStatus;
                if (status === 'DRAFT') {
                  stageName = 'Profile Setup';
                } else if (status === 'SUBMITTED' || status === 'UNDER_REVIEW') {
                  if (!rulesEngineCompleted) {
                    stageName = 'Credit Check';
                  } else if (!bankVerificationCompleted) {
                    stageName = 'Bank Verification';
                  } else if (!loanAgreementCompleted) {
                    stageName = 'Loan Agreement';
                  } else {
                    stageName = 'Final Review';
                  }
                } else if (status === 'APPROVED') {
                  stageName = 'Disbursal Ready';
                } else if (status === 'DISBURSED') {
                  stageName = 'Active Loan';
                }

                return (
                  <TouchableOpacity
                    key={app.id || idx}
                    style={[styles.loanAppItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      // Always show application details — resume/action logic is inside the details screen
                      onViewDetails(app.id);
                    }}
                  >
                    <View style={styles.appRow}>
                      <View style={styles.appLeft}>
                        <View style={[styles.walletBox, { backgroundColor: colors.backgroundSecondary }]}>
                          <Ionicons name="wallet" size={20} color={colors.primary} />
                        </View>
                        <View>
                          <AppText variant="bodyMedium" style={{ fontWeight: '800', color: colors.text }}>
                            {formatCurrency(app.requestedAmount)}
                          </AppText>
                          <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: isDisbursed ? colors.success : colors.warning }]} />
                            <AppText variant="caption" style={{ color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', fontSize: 9 }}>
                              {app.applicationStatus}
                            </AppText>
                            {stageName ? (
                              <>
                                <AppText variant="caption" style={{ color: colors.textMuted, marginHorizontal: 4, fontSize: 9 }}>•</AppText>
                                <AppText variant="caption" style={{ color: colors.primary, fontWeight: '800', textTransform: 'uppercase', fontSize: 9 }}>
                                  {stageName}
                                </AppText>
                              </>
                            ) : null}
                          </View>
                        </View>
                      </View>

                      {isDisbursed ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={(e) => {
                            e.stopPropagation();
                            onViewDetails(app.id, true);
                          }}
                          style={[styles.repayBtn, { backgroundColor: colors.primary }]}
                        >
                          <AppText variant="caption" style={{ color: 'white', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Repay
                          </AppText>
                        </TouchableOpacity>
                      ) : (
                        <View style={[styles.viewBtn, { backgroundColor: colors.backgroundSecondary }]}>
                          <AppText variant="caption" style={{ color: colors.textSecondary, fontWeight: '800', marginRight: 4 }}>
                            View
                          </AppText>
                          <Ionicons name="arrow-forward" size={12} color={colors.textSecondary} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </MotiView>
          )}
        </ScrollView>

        <LoanSelectionModal
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSelect={handleSelectScheme}
        />

        <EmiCalculatorModal
          isVisible={activeModal === 'emi'}
          onClose={() => setActiveModal(null)}
        />

        <ReferEarnModal
          isVisible={activeModal === 'refer'}
          onClose={() => setActiveModal(null)}
        />

        <SupportModal
          isVisible={activeModal === 'support'}
          onClose={() => setActiveModal(null)}
        />

        <CreditScoreModal
          isVisible={activeModal === 'credit'}
          onClose={() => setActiveModal(null)}
        />
      </SafeAreaView>
    </MeshBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loansSection: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  loansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  loanAppItem: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  repayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

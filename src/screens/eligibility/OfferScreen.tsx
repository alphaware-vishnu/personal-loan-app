// import React, { useState, useEffect } from 'react';
// import { ScrollView, StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
// import { MotiView } from 'moti';
// import { Feather, Ionicons } from '@expo/vector-icons';
// import Toast from 'react-native-toast-message';

// import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
// import { SafeHeader } from '../../components/layout/SafeHeader';
// import { StepIndicator } from '../../components/ui/StepIndicator';
// import { AmountSlider } from '../../components/ui/AmountSlider';
// import { useColors, useTheme } from '../../theme';
// import { useOnboardingStore } from '../../store/onboardingStore';
// import { useLoanStore } from '../../store/loanStore';
// import { useOfferStore } from '../../store/offerStore';
// import { useAuthStore } from '../../store/authStore';
// import { createApplication } from '../../services/applicationService';
// import { trackEvent } from '../../utils/analytics';
// import { AppText } from '../../components/ui/AppText';
// import { AppButton } from '../../components/ui/AppButton';

// interface OfferScreenProps {
//   onNext: () => void;
//   onBack: () => void;
//   onSkip?: () => void;
// }

// export const OfferScreen: React.FC<OfferScreenProps> = ({ onNext, onBack, onSkip }) => {
//   const colors = useColors();
//   const { theme } = useTheme();
//   const { completeStep } = useOnboardingStore();
//   const loanStore = useLoanStore();
//   const { 
//     eligibilityResult, 
//     selectedAmount, 
//     selectedTenure, 
//     setSelectedAmount, 
//     setSelectedTenure 
//   } = useOfferStore();

//   const minAmount = eligibilityResult?.minAmount ?? 10000;
//   const maxAmount = eligibilityResult?.maxAmount ?? 150000;
//   const interestRate = eligibilityResult?.interestRate ?? 14.5;
//   const maxTenure = eligibilityResult?.maxTenure ?? 12;

//   const [amount, setAmount] = useState(() => {
//     return selectedAmount > 0 ? selectedAmount : 75000;
//   });
//   const [tenure, setTenure] = useState(() => {
//     return selectedTenure > 0 ? selectedTenure : 12;
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Sync component state with eligibility result when loaded
//   useEffect(() => {
//     if (eligibilityResult) {
//       const initialAmount = selectedAmount > 0 ? selectedAmount : Math.min(Math.max(75000, minAmount), maxAmount);
//       const initialTenure = selectedTenure > 0 ? selectedTenure : maxTenure;

//       setAmount(initialAmount);
//       setTenure(initialTenure);

//       // Save initial selections to the store
//       if (selectedAmount === 0) setSelectedAmount(initialAmount);
//       if (selectedTenure === 0) setSelectedTenure(initialTenure);
//     }
//   }, [eligibilityResult]);

//   // Filter tenures up to approved maxTenure and ensure maxTenure is included
//   const allTenures = [3, 6, 9, 12, 18, 24];
//   const tenures = allTenures.filter((t) => t <= maxTenure);
//   if (!tenures.includes(maxTenure) && maxTenure > 0) {
//     tenures.push(maxTenure);
//   }
//   tenures.sort((a, b) => a - b);

//   // EMI formula: [P * r * (1 + r)^N] / [((1 + r)^N) - 1]
//   const calculateEMI = (p: number, rAnnual: number, n: number) => {
//     const r = (rAnnual / 12) / 100;
//     const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
//     return Math.round(emi);
//   };

//   const emi = calculateEMI(amount, interestRate, tenure);
//   const processingFee = Math.round(amount * 0.02); // 2% processing fee
//   const disbursalAmount = amount - processingFee;

//   const handleAccept = async () => {
//     setIsSubmitting(true);
//     try {
//       const customerId = useAuthStore.getState().authData?.customerId || loanStore.customerId;
//       const schemeMasterId = loanStore.schemeMasterId || 101;

//       if (!customerId) {
//         throw new Error('Customer ID not found. Please log in again.');
//       }

//       // Create loan application on the backend
//       const response = await createApplication({
//         customerId: Number(customerId),
//         schemeMasterId: Number(schemeMasterId),
//         requestedAmount: amount,
//         requestedTenure: tenure,
//       });

//       const appData = response.data?.data || response.data;
//       const appId = appData?.id || appData?.applicationId;
//       const prodId = appData?.productId || 1;

//       if (!appId) {
//         throw new Error('Failed to retrieve application ID from server.');
//       }

//       // Update state in loanStore
//       loanStore.setScheme({
//         id: schemeMasterId,
//         loanAmount: amount,
//         defaultTenure: tenure,
//         defaultInterest: interestRate,
//         tenureFrequency: 'MONTHLY',
//       });
//       loanStore.setCalculationResults(emi, disbursalAmount);
//       loanStore.setApplicationData(appId, prodId);

//       completeStep('eligibility');
//       trackEvent('offer_accepted', { amount, tenure, emi, applicationId: appId });
//       onNext();
//     } catch (err: any) {
//       console.error('Failed to accept offer / create application:', err);
//       Toast.show({
//         type: 'error',
//         text1: 'Submission Failed',
//         text2: err.response?.data?.message || err.message || 'Unable to register application. Please try again.',
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (!eligibilityResult) {
//     return (
//       <ScreenWrapper>
//         <SafeHeader title="Personalized Offer" onBack={onBack} />
//         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//           <ActivityIndicator size="large" color={colors.primary} />
//           <AppText variant="bodyMd" style={{ marginTop: 16, color: colors.textSecondary }}>
//             Loading your customized offer...
//           </AppText>
//         </View>
//       </ScreenWrapper>
//     );
//   }

//   if (eligibilityResult.status === 'NOT_ELIGIBLE') {
//     return (
//       <ScreenWrapper>
//         <SafeHeader title="Eligibility Status" onBack={onBack} />
//         <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
//           <MotiView
//             from={{ opacity: 0, scale: 0.95 }}
//             animate={{ opacity: 1, scale: 1 }}
//             style={styles.rejectionCard}
//           >
//             <View style={[styles.rejectionIconCircle, { backgroundColor: '#FEE2E2' }]}>
//               <Ionicons name="close-circle" size={48} color="#EF4444" />
//             </View>
//             <AppText variant="h2" style={[styles.title, { marginTop: 16 }]} align="center">
//               Eligibility Status
//             </AppText>
//             <AppText variant="bodyMd" style={{ color: colors.textSecondary, marginTop: 12, lineHeight: 22 }} align="center">
//               {eligibilityResult.message || "Thank you for applying. Unfortunately, your credit profile doesn't meet our criteria for a loan approval at this time."}
//             </AppText>

//             <View style={[styles.rejectionDetails, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
//               <AppText variant="caption" style={{ color: colors.textSecondary }} align="center">
//                 You can re-apply after 90 days. Feel free to explore other services or contact customer support for further details.
//               </AppText>
//             </View>

//             <AppButton
//               title="Back to Dashboard"
//               onPress={() => onSkip?.() || onBack()}
//               variant="outline"
//               size="lg"
//               style={{ width: '100%', marginTop: 24 }}
//             />
//           </MotiView>
//         </ScrollView>
//       </ScreenWrapper>
//     );
//   }

//   return (
//     <ScreenWrapper>
//       <SafeHeader title="Personalized Offer" onBack={onBack} />

//       <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
//         <StepIndicator totalSteps={1} currentStep={0} showLabel stageName="Personalized Offer" />

//         <MotiView
//           from={{ opacity: 0, translateY: 10 }}
//           animate={{ opacity: 1, translateY: 0 }}
//           transition={{ type: 'timing', duration: 400 }}
//           style={styles.content}
//         >
//           <AppText variant="h2" style={styles.title}>
//             Congratulations! 🎉
//           </AppText>
//           <AppText variant="bodyMd" style={{ color: colors.textSecondary, marginBottom: 20 }}>
//             Here is your approved credit limit. Customize your loan amount and tenure below.
//           </AppText>

//           {/* Offer Summary Card */}
//           <View style={[styles.summaryCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
//             <AppText variant="caption" style={{ color: colors.primaryDark, textTransform: 'uppercase', letterSpacing: 1 }}>
//               Approved Credit Limit
//             </AppText>
//             <AppText variant="display" style={{ color: colors.primary, fontWeight: '800', marginTop: 4 }}>
//               ₹ {maxAmount.toLocaleString('en-IN')}
//             </AppText>
//             <View style={styles.interestBadge}>
//               <Feather name="percent" size={12} color={colors.secondaryDark} style={{ marginRight: 4 }} />
//               <AppText variant="labelSm" style={{ color: colors.secondaryDark, fontWeight: '600' }}>
//                 Interest Rate: {interestRate}% p.a.
//               </AppText>
//             </View>
//           </View>

//           {/* Slider */}
//           <View style={styles.section}>
//             <AppText variant="labelLg" style={styles.sectionLabel}>
//               Select Loan Amount
//             </AppText>
//             <AmountSlider
//               value={amount}
//               onValueChange={(val) => {
//                 setAmount(val);
//                 setSelectedAmount(val);
//               }}
//               min={minAmount}
//               max={maxAmount}
//               step={5000}
//             />
//           </View>

//           {/* Tenure Selection */}
//           <View style={styles.section}>
//             <AppText variant="labelLg" style={styles.sectionLabel}>
//               Select Tenure (Months)
//             </AppText>
//             <View style={styles.tenureContainer}>
//               {tenures.map((t) => {
//                 const isSelected = tenure === t;
//                 return (
//                   <TouchableOpacity
//                     key={t}
//                     onPress={() => {
//                       setTenure(t);
//                       setSelectedTenure(t);
//                     }}
//                     style={[
//                       styles.tenureCard,
//                       {
//                         borderColor: isSelected ? colors.primary : colors.border,
//                         backgroundColor: isSelected ? colors.primaryLight : colors.surface,
//                       },
//                     ]}
//                   >
//                     <AppText
//                       variant="labelLg"
//                       style={{
//                         color: isSelected ? colors.primary : colors.text,
//                         fontWeight: '700',
//                       }}
//                     >
//                       {t}
//                     </AppText>
//                     <AppText
//                       variant="caption"
//                       style={{
//                         color: isSelected ? colors.primaryDark : colors.textSecondary,
//                         marginTop: 2,
//                       }}
//                     >
//                       Months
//                     </AppText>
//                   </TouchableOpacity>
//                 );
//               })}
//             </View>
//           </View>

//           {/* Loan Calculations List */}
//           <View style={[styles.detailsCard, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
//             <View style={styles.detailRow}>
//               <AppText variant="bodyMd" style={{ color: colors.textSecondary }}>Monthly EMI</AppText>
//               <AppText variant="bodyLg" style={{ color: colors.text, fontWeight: '700' }}>
//                 ₹ {emi.toLocaleString('en-IN')} / mo
//               </AppText>
//             </View>

//             <View style={[styles.divider, { backgroundColor: colors.border }]} />

//             <View style={styles.detailRow}>
//               <AppText variant="bodyMd" style={{ color: colors.textSecondary }}>Processing Fee (2%)</AppText>
//               <AppText variant="bodyLg" style={{ color: colors.text }}>
//                 ₹ {processingFee.toLocaleString('en-IN')}
//               </AppText>
//             </View>

//             <View style={styles.detailRow}>
//               <AppText variant="bodyMd" style={{ color: colors.textSecondary }}>Disbursal Amount</AppText>
//               <AppText variant="bodyLg" style={{ color: colors.text, fontWeight: '600' }}>
//                 ₹ {disbursalAmount.toLocaleString('en-IN')}
//               </AppText>
//             </View>
//           </View>
//         </MotiView>
//       </ScrollView>

//       <MotiView
//         from={{ opacity: 0, translateY: 20 }}
//         animate={{ opacity: 1, translateY: 0 }}
//         transition={{ type: 'timing', duration: 400, delay: 200 }}
//         style={[styles.footer, { borderTopColor: colors.border }]}
//       >
//         <AppButton
//           title="Accept Offer & Proceed to KYC"
//           onPress={handleAccept}
//           variant="primary"
//           size="lg"
//           loading={isSubmitting}
//           style={styles.button}
//         />
//         {!isSubmitting && onSkip && (
//           <AppButton
//             title="Skip, I'll do later"
//             variant="ghost"
//             size="md"
//             onPress={onSkip}
//             style={{ marginTop: 8 }}
//           />
//         )}
//       </MotiView>
//     </ScreenWrapper>
//   );
// };

// const styles = StyleSheet.create({
//   scrollContent: {
//     flexGrow: 1,
//     padding: 20,
//   },
//   content: {
//     flex: 1,
//     marginTop: 20,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     marginBottom: 8,
//   },
//   summaryCard: {
//     borderRadius: 16,
//     borderWidth: 1,
//     padding: 20,
//     alignItems: 'center',
//     marginBottom: 28,
//   },
//   interestBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 10,
//     backgroundColor: '#DEF7EC',
//     paddingVertical: 4,
//     paddingHorizontal: 12,
//     borderRadius: 99,
//   },
//   section: {
//     marginBottom: 24,
//   },
//   sectionLabel: {
//     fontWeight: '600',
//     marginBottom: 12,
//   },
//   tenureContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginHorizontal: -4,
//   },
//   tenureCard: {
//     flex: 1,
//     minWidth: '28%',
//     maxWidth: '30%',
//     borderWidth: 1,
//     borderRadius: 12,
//     paddingVertical: 12,
//     marginHorizontal: 4,
//     marginBottom: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   detailsCard: {
//     borderWidth: 1,
//     borderRadius: 16,
//     padding: 16,
//     marginVertical: 12,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 8,
//   },
//   divider: {
//     height: 1,
//     marginVertical: 4,
//   },
//   footer: {
//     padding: 20,
//     borderTopWidth: 1,
//   },
//   button: {
//     width: '100%',
//   },
//   rejectionCard: {
//     alignItems: 'center',
//     paddingVertical: 40,
//     paddingHorizontal: 16,
//   },
//   rejectionIconCircle: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//   },
//   rejectionDetails: {
//     width: '100%',
//     borderRadius: 16,
//     borderWidth: 1,
//     padding: 20,
//     marginTop: 24,
//   },
// });
import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { MotiView } from 'moti';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SafeHeader } from '../../components/layout/SafeHeader';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { useColors, useTheme } from '../../theme';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useLoanStore } from '../../store/loanStore';
import { useOfferStore } from '../../store/offerStore';
import { useAuthStore } from '../../store/authStore';
import { createApplication } from '../../services/applicationService';
import { trackEvent } from '../../utils/analytics';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';

interface OfferScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtINR = (n: number) =>
  '₹\u00A0' + Math.round(n).toLocaleString('en-IN');

const calcEMI = (p: number, rAnnual: number, n: number) => {
  const r = rAnnual / 12 / 100;
  return Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
};

const ALL_TENURES = [3, 6, 9, 12, 18, 24];

// ─── sub-components ───────────────────────────────────────────────────────────

const SectionTitle: React.FC<{ label: string }> = ({ label }) => (
  <AppText
    variant="labelSm"
    style={styles.sectionTitle}
  >
    {label.toUpperCase()}
  </AppText>
);

const Divider: React.FC<{ color: string }> = ({ color }) => (
  <View style={[styles.divider, { backgroundColor: color }]} />
);

// ─── main component ───────────────────────────────────────────────────────────

export const OfferScreen: React.FC<OfferScreenProps> = ({
  onNext,
  onBack,
  onSkip,
}) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { completeStep } = useOnboardingStore();
  const loanStore = useLoanStore();
  const {
    eligibilityResult,
    selectedAmount,
    selectedTenure,
    setSelectedAmount,
    setSelectedTenure,
  } = useOfferStore();

  const minAmount = eligibilityResult?.minAmount ?? 10000;
  const maxAmount = eligibilityResult?.maxAmount ?? 150000;
  const interestRate = eligibilityResult?.interestRate ?? 14.5;
  const maxTenure = eligibilityResult?.maxTenure ?? 24;

  const [amount, setAmount] = useState(
    () => (selectedAmount > 0 ? selectedAmount : 75000)
  );
  const [tenure, setTenure] = useState(
    () => (selectedTenure > 0 ? selectedTenure : maxTenure)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // slider live value (no store writes while dragging)
  const [sliderVal, setSliderVal] = useState(amount);

  // pulse animation for EMI card
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const triggerPulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  // sync with eligibility result
  useEffect(() => {
    if (eligibilityResult) {
      const initAmount =
        selectedAmount > 0
          ? selectedAmount
          : Math.min(Math.max(75000, minAmount), maxAmount);
      const initTenure = selectedTenure > 0 ? selectedTenure : maxTenure;
      setAmount(initAmount);
      setSliderVal(initAmount);
      setTenure(initTenure);
      if (selectedAmount === 0) setSelectedAmount(initAmount);
      if (selectedTenure === 0) setSelectedTenure(initTenure);
    }
  }, [eligibilityResult]);

  // derived values
  const emi = calcEMI(amount, interestRate, tenure);
  const processingFee = Math.round(amount * 0.02);
  const disbursalAmount = amount - processingFee;
  const totalRepayment = emi * tenure;
  const perDay = Math.round(emi / 30);

  // tenure options
  const tenures = [
    ...ALL_TENURES.filter((t) => t <= maxTenure),
    ...(ALL_TENURES.includes(maxTenure) ? [] : [maxTenure]),
  ].sort((a, b) => a - b);

  // ── handlers ──

  const handleSliderChange = (val: number) => {
    setSliderVal(val);
  };

  const handleSliderComplete = (val: number) => {
    const snapped = Math.round(val / 5000) * 5000;
    setAmount(snapped);
    setSliderVal(snapped);
    setSelectedAmount(snapped);
    triggerPulse();
  };

  const handleTenureSelect = (t: number) => {
    setTenure(t);
    setSelectedTenure(t);
    triggerPulse();
  };

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      const customerId =
        useAuthStore.getState().authData?.customerId || loanStore.customerId;
      const schemeMasterId = loanStore.schemeMasterId || 101;

      if (!customerId) throw new Error('Customer ID not found. Please log in again.');

      const response = await createApplication({
        customerId: Number(customerId),
        schemeMasterId: Number(schemeMasterId),
        requestedAmount: amount,
        requestedTenure: tenure,
      });

      const appData = response.data?.data || response.data;
      const appId = appData?.id || appData?.applicationId;
      const prodId = appData?.productId || 1;

      if (!appId) throw new Error('Failed to retrieve application ID from server.');

      loanStore.setScheme({
        id: schemeMasterId,
        loanAmount: amount,
        defaultTenure: tenure,
        defaultInterest: interestRate,
        tenureFrequency: 'MONTHLY',
      });
      loanStore.setCalculationResults(emi, disbursalAmount);
      loanStore.setApplicationData(appId, prodId);

      completeStep('eligibility');
      trackEvent('offer_accepted', { amount, tenure, emi, applicationId: appId });
      onNext();
    } catch (err: any) {
      console.error('Failed to accept offer:', err);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2:
          err.response?.data?.message ||
          err.message ||
          'Unable to register application. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── loading state ──

  if (!eligibilityResult) {
    return (
      <ScreenWrapper>
        <SafeHeader title="Personalised Offer" onBack={onBack} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#534AB7" />
          <AppText variant="bodyMd" style={[styles.loadingText, { color: colors.textSecondary }]}>
            Preparing your personalised offer…
          </AppText>
        </View>
      </ScreenWrapper>
    );
  }

  // ── not eligible state ──

  if (eligibilityResult.status === 'NOT_ELIGIBLE') {
    return (
      <ScreenWrapper>
        <SafeHeader title="Eligibility Status" onBack={onBack} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <MotiView
            from={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 18 }}
            style={styles.rejectionContainer}
          >
            <View style={styles.rejectionIconWrap}>
              <LinearGradient
                colors={['#FEE2E2', '#FCA5A5']}
                style={styles.rejectionIconGrad}
              >
                <Ionicons name="close-circle" size={52} color="#DC2626" />
              </LinearGradient>
            </View>

            <AppText variant="h2" style={styles.rejectionTitle} align="center">
              Not eligible right now
            </AppText>
            <AppText
              variant="bodyMd"
              style={[styles.rejectionBody, { color: colors.textSecondary }]}
              align="center"
            >
              {eligibilityResult.message ||
                "Thank you for applying. Your credit profile doesn't meet our current criteria. You're welcome to re-apply in 90 days."}
            </AppText>

            <View style={[styles.rejectionBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Feather name="info" size={16} color={colors.textSecondary} style={{ marginBottom: 8 }} />
              <AppText variant="caption" style={{ color: colors.textSecondary, lineHeight: 20 }} align="center">
                In the meantime, you can improve your credit score, clear existing dues, or contact our support team for personalised guidance.
              </AppText>
            </View>

            <AppButton
              title="Back to Dashboard"
              onPress={() => onSkip?.() || onBack()}
              variant="outline"
              size="lg"
              style={{ width: '100%', marginTop: 24 }}
            />
          </MotiView>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // ── main offer UI ──

  return (
    <ScreenWrapper>
      <SafeHeader title="Personalised Offer" onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StepIndicator totalSteps={1} currentStep={0} showLabel stageName="Personalised Offer" />

        {/* ── Hero card ── */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420 }}
        >
          <LinearGradient
            colors={['#534AB7', '#3C3489']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* decorative circles */}
            <View style={styles.heroBubble1} />
            <View style={styles.heroBubble2} />

            <View style={styles.approvedBadge}>
              <Feather name="star" size={12} color="#FAC775" />
              <AppText variant="labelSm" style={styles.approvedBadgeText}>
                You're approved!
              </AppText>
            </View>

            <AppText variant="caption" style={styles.heroLabel}>
              Approved credit limit
            </AppText>
            <AppText variant="display" style={styles.heroAmount}>
              {fmtINR(maxAmount)}
            </AppText>

            <View style={styles.heroChips}>
              <View style={styles.heroChip}>
                <Feather name="percent" size={11} color="rgba(255,255,255,0.85)" />
                <AppText variant="labelSm" style={styles.heroChipText}>
                  {interestRate}% p.a.
                </AppText>
              </View>
              <View style={styles.heroChip}>
                <Feather name="shield" size={11} color="rgba(255,255,255,0.85)" />
                <AppText variant="labelSm" style={styles.heroChipText}>
                  No collateral
                </AppText>
              </View>
              <View style={styles.heroChip}>
                <Feather name="zap" size={11} color="rgba(255,255,255,0.85)" />
                <AppText variant="labelSm" style={styles.heroChipText}>
                  Instant disbursal
                </AppText>
              </View>
            </View>
          </LinearGradient>
        </MotiView>

        {/* ── Amount slider card ── */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420, delay: 60 }}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <SectionTitle label="Loan amount" />

          <View style={styles.amountRow}>
            <AppText variant="display" style={[styles.amountValue, { color: '#534AB7' }]}>
              {fmtINR(sliderVal)}
            </AppText>
            <View style={[styles.amountBadge, { backgroundColor: '#EEEDFE' }]}>
              <AppText variant="labelSm" style={{ color: '#534AB7' }}>
                Drag to adjust
              </AppText>
            </View>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={minAmount}
            maximumValue={maxAmount}
            step={5000}
            value={sliderVal}
            onValueChange={handleSliderChange}
            onSlidingComplete={handleSliderComplete}
            minimumTrackTintColor="#534AB7"
            maximumTrackTintColor={colors.border}
            thumbTintColor="#534AB7"
          />

          <View style={styles.sliderLabels}>
            <AppText variant="caption" style={{ color: colors.textSecondary }}>
              {fmtINR(minAmount)}
            </AppText>
            <AppText variant="caption" style={{ color: colors.textSecondary }}>
              {fmtINR(maxAmount)}
            </AppText>
          </View>
        </MotiView>

        {/* ── Tenure picker card ── */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420, delay: 120 }}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <SectionTitle label="Repayment tenure" />
          <View style={styles.tenureGrid}>
            {tenures.map((t) => {
              const active = tenure === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => handleTenureSelect(t)}
                  style={({ pressed }) => [
                    styles.tenureBtn,
                    {
                      borderColor: active ? '#534AB7' : colors.border,
                      backgroundColor: active ? '#EEEDFE' : colors.backgroundSecondary,
                      borderWidth: active ? 2 : 0.5,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <AppText
                    variant="h2"
                    style={{ color: active ? '#534AB7' : colors.text, fontWeight: '700' }}
                  >
                    {t}
                  </AppText>
                  <AppText
                    variant="caption"
                    style={{ color: active ? '#7F77DD' : colors.textSecondary, marginTop: 2 }}
                  >
                    months
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </MotiView>

        {/* ── EMI highlight card ── */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420, delay: 180 }}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <LinearGradient
              colors={['#EEEDFE', '#DDD9FB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emiHighlightCard}
            >
              <View>
                <AppText variant="labelSm" style={styles.emiHighlightLabel}>
                  Monthly EMI
                </AppText>
                <AppText variant="display" style={styles.emiHighlightValue}>
                  {fmtINR(emi)}
                </AppText>
                <AppText variant="caption" style={styles.emiHighlightSub}>
                  for {tenure} months
                </AppText>
              </View>
              <View style={styles.perDayCard}>
                <AppText variant="h3" style={styles.perDayValue}>
                  {fmtINR(perDay)}
                </AppText>
                <AppText variant="caption" style={styles.perDayLabel}>
                  per day
                </AppText>
              </View>
            </LinearGradient>
          </Animated.View>
        </MotiView>

        {/* ── Breakdown card ── */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420, delay: 240 }}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <SectionTitle label="Loan breakdown" />

          <BreakdownRow
            icon="credit-card"
            label="Requested amount"
            value={fmtINR(amount)}
            textColor={colors.text}
            iconColor={colors.textSecondary}
          />
          <Divider color={colors.border} />
          <BreakdownRow
            icon="file-text"
            label="Processing fee (2%)"
            value={fmtINR(processingFee)}
            textColor={colors.text}
            iconColor={colors.textSecondary}
          />
          <Divider color={colors.border} />
          <BreakdownRow
            icon="download"
            label="Disbursal amount"
            value={fmtINR(disbursalAmount)}
            textColor="#059669"
            iconColor="#059669"
            highlight
          />
          <Divider color={colors.border} />
          <BreakdownRow
            icon="repeat"
            label="Total repayment"
            value={fmtINR(totalRepayment)}
            textColor={colors.text}
            iconColor={colors.textSecondary}
          />
        </MotiView>

        {/* ── Trust signals ── */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          style={styles.trustRow}
        >
          {[
            { icon: 'lock', label: 'Secure & encrypted' },
            { icon: 'check-circle', label: 'RBI compliant' },
            { icon: 'headphones', label: '24/7 support' },
          ].map(({ icon, label }) => (
            <View key={label} style={styles.trustItem}>
              <Feather name={icon as any} size={13} color="#1D9E75" />
              <AppText variant="caption" style={styles.trustLabel}>
                {label}
              </AppText>
            </View>
          ))}
        </MotiView>
      </ScrollView>

      {/* ── Footer CTA ── */}
      <MotiView
        from={{ opacity: 0, translateY: 24 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 300 }}
        style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}
      >
        <TouchableOpacity
          onPress={handleAccept}
          disabled={isSubmitting}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={isSubmitting ? ['#9CA3AF', '#6B7280'] : ['#534AB7', '#3C3489']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.acceptBtn}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <AppText variant="labelLg" style={styles.acceptBtnText}>
                  Accept offer & proceed to KYC
                </AppText>
                <Feather name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {!isSubmitting && onSkip && (
          <AppButton
            title="Skip, I'll do this later"
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

// ─── BreakdownRow ─────────────────────────────────────────────────────────────

interface BreakdownRowProps {
  icon: string;
  label: string;
  value: string;
  textColor: string;
  iconColor: string;
  highlight?: boolean;
}

const BreakdownRow: React.FC<BreakdownRowProps> = ({
  icon,
  label,
  value,
  textColor,
  iconColor,
  highlight,
}) => (
  <View style={styles.breakdownRow}>
    <View style={styles.breakdownLeft}>
      <Feather name={icon as any} size={15} color={iconColor} style={{ marginRight: 8 }} />
      <AppText variant="bodyMd" style={{ color: iconColor }}>
        {label}
      </AppText>
    </View>
    <AppText
      variant="bodyLg"
      style={{
        color: textColor,
        fontWeight: highlight ? '700' : '500',
      }}
    >
      {value}
    </AppText>
  </View>
);

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 0,
    paddingBottom: 0,

  },

  // hero
  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroBubble1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -70,
    right: -60,
  },
  heroBubble2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(129, 132, 206, 0.04)',
    bottom: -40,
    right: 24,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignSelf: 'flex-start',
    borderRadius: 99,
    paddingVertical: 5,
    paddingHorizontal: 0,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  approvedBadgeText: {
    color: '#E1F5EE',
    fontWeight: '600',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroAmount: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 40,
    letterSpacing: -1,
    marginBottom: 16,
  },
  heroChips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 99,
    paddingVertical: 5,
    paddingHorizontal: 0,
  },
  heroChipText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },

  // card
  card: {
    borderRadius: 20,
    borderWidth: 0.5,
    padding: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: '#888',
    marginBottom: 16,
  },

  // amount
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  amountBadge: {
    borderRadius: 99,
    paddingVertical: 5,
    paddingHorizontal: 0,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },

  // tenure
  tenureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tenureBtn: {
    flex: 1,
    minWidth: '28%',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // EMI highlight
  emiHighlightCard: {
    borderRadius: 20,
    padding: 10,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emiHighlightLabel: {
    color: '#3C3489',
    fontWeight: '600',
    marginBottom: 2,
  },
  emiHighlightValue: {
    color: '#26215C',
    fontWeight: '800',
    fontSize: 30,
    letterSpacing: -0.5,
  },
  emiHighlightSub: {
    color: '#1838c8ff',
    marginTop: 4,
  },
  perDayCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 0,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#AFA9EC',
    minWidth: 80,
  },
  perDayValue: {
    color: '#006effff',
    fontWeight: '700',
    fontSize: 18,
  },
  perDayLabel: {
    color: '#7F77DD',
    marginTop: 2,
  },

  // breakdown
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 0.5,
  },

  // trust
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustLabel: {
    color: '#888',
    fontSize: 11,
  },

  // footer
  footer: {
    padding: 0,
    paddingBottom: 32,
    borderTopWidth: 0.5,
  },
  acceptBtn: {
    borderRadius: 18,
    paddingVertical: 17,
    paddingHorizontal: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  // rejection
  rejectionContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 0,
  },
  rejectionIconWrap: {
    marginBottom: 24,
  },
  rejectionIconGrad: {
    width: 100,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  rejectionBody: {
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  rejectionBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 20,
    alignItems: 'center',
  },
});
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import Carousel from 'react-native-reanimated-carousel';
import { MotiView } from 'moti';
import { useColors, useTheme } from '../../../theme';
import { NotchedCard } from '../../../components/ui/NotchedCard';
import { AppText } from '../../../components/ui/AppText';
import { formatCurrency } from '../../../utils/formatters';

const { width } = Dimensions.get('window');

interface ActiveLoanCardProps {
  applications: any[] | undefined;
  isLoading: boolean;
  onViewDetails: (applicationId: number, autoOpenRepay?: boolean) => void;
  onApplyNow: () => void;
}

/** Thin repayment progress bar */
const RepaymentProgressBar: React.FC<{
  percentage: number;
  isDark: boolean;
}> = ({ percentage, isDark }) => {
  const clampedPct = Math.min(Math.max(percentage, 0), 100);

  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.row}>
        <AppText variant="caption" style={progressStyles.label}>
          Repaid
        </AppText>
        <AppText variant="caption" style={progressStyles.pctText}>
          {clampedPct}%
        </AppText>
      </View>
      <View
        style={[
          progressStyles.track,
          {
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(255,255,255,0.25)',
          },
        ]}
      >
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${clampedPct}%` as any }}
          transition={{ type: 'timing', duration: 900, delay: 300 }}
          style={progressStyles.fill}
        />
      </View>
    </View>
  );
};

const progressStyles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pctText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 9,
    fontWeight: '900',
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#34D399',
  },
});

export const ActiveLoanCard: React.FC<ActiveLoanCardProps> = React.memo(({
  applications,
  isLoading,
  onViewDetails,
  onApplyNow,
}) => {
  const colors = useColors();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <NotchedCard
          style={[styles.mainStatCard, { backgroundColor: colors.accent }]}
          notchColor={colors.background}
        >
          <View style={styles.center}>
            <LottieView
              source={require('../../../../assets/new-loader.json')}
              autoPlay
              loop
              style={{ width: 70, height: 70 }}
              resizeMode="contain"
            />
          </View>
        </NotchedCard>
      </View>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <View style={styles.outerContainer}>
        <NotchedCard
          style={[styles.mainStatCard, { backgroundColor: colors.accent }]}
          notchColor={colors.background}
        >
          <View style={styles.emptyCardContent}>
            <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Ionicons name="wallet-outline" size={28} color="white" />
            </View>
            <View style={styles.emptyTextCol}>
              <AppText variant="h3" style={{ color: colors.textOnPrimary, fontWeight: '800' }}>
                No Active Loans
              </AppText>
              <AppText
                variant="bodySm"
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  marginTop: 4,
                  lineHeight: 18,
                }}
              >
                Take advantage of our low rates and apply today!
              </AppText>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onApplyNow}
            style={[styles.applyButton, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="add-circle" size={16} color={colors.accentDark} />
            <AppText
              variant="bodyMedium"
              style={{
                color: colors.accentDark,
                fontWeight: '800',
                marginLeft: 6,
              }}
            >
              Apply for Loan
            </AppText>
          </TouchableOpacity>
        </NotchedCard>
      </View>
    );
  }

  return (
    <View style={styles.carouselWrapper}>
      <Carousel
        loop={false}
        width={width}
        height={240}
        autoPlay={false}
        data={applications}
        scrollAnimationDuration={500}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.92,
          parallaxScrollingOffset: 40,
        }}
        renderItem={({ item }: { item: any }) => {
          const rulesEngineCompleted = item.applicationStepStatus?.rulesEngineCompleted ?? item.rulesEngineCompleted;
          const bankVerificationCompleted = item.applicationStepStatus?.bankVerificationCompleted ?? item.bankVerificationCompleted;
          const loanAgreementCompleted = item.applicationStepStatus?.loanAgreementCompleted ?? item.loanAgreementCompleted;

          let stageName = '';
          const status = item.applicationStatus;
          if (status === 'DRAFT') {
            stageName = 'Profile Setup';
          } else if (status === 'SUBMITTED' || status === 'UNDER_REVIEW') {
            if (!rulesEngineCompleted) {
              stageName = 'Credit Engine Check';
            } else if (!bankVerificationCompleted) {
              stageName = 'Bank Verification';
            } else if (!loanAgreementCompleted) {
              stageName = 'Agreement Signing';
            } else {
              stageName = 'Final Review';
            }
          } else if (status === 'APPROVED') {
            stageName = 'Disbursal Ready';
          } else if (status === 'DISBURSED') {
            stageName = 'Active Loan';
          }

          const isDisbursed = item.applicationStatus === 'DISBURSED';
          const outstandingAmount = item.requestedAmount;
          const calculatedEmi = (outstandingAmount * 0.05).toFixed(0);
          const repaidPct = isDisbursed ? 35 : 0;

          return (
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => onViewDetails(item.id)}
              style={styles.carouselItem}
            >
              <NotchedCard
                style={styles.mainStatCard}
                colors={[colors.primary, colors.primaryDark]}
                notchColor={colors.background}
              >
                {/* Decorative Bubbles */}
                <View
                  style={[
                    styles.bubbleTop,
                    { backgroundColor: 'rgba(255,255,255,0.08)' },
                  ]}
                />
                <View
                  style={[
                    styles.bubbleBottom,
                    { backgroundColor: 'rgba(255,255,255,0.04)' },
                  ]}
                />

                {/* Top Row */}
                <View style={styles.cardTopRow}>
                  <View style={styles.cardLabelCol}>
                    <AppText variant="caption" style={styles.loanTypeLabel}>
                      Personal Loan
                    </AppText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 5 }}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            marginTop: 0,
                            backgroundColor: isDisbursed
                              ? 'rgba(52,211,153,0.25)'
                              : 'rgba(255,255,255,0.15)',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: isDisbursed ? '#34D399' : '#FBBF24',
                            },
                          ]}
                        />
                        <AppText variant="caption" style={styles.statusBadgeText}>
                          {item.applicationStatus}
                        </AppText>
                      </View>

                      {stageName ? (
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              marginTop: 0,
                              backgroundColor: 'rgba(255,255,255,0.12)',
                            },
                          ]}
                        >
                          <AppText variant="caption" style={[styles.statusBadgeText, { opacity: 0.95 }]}>
                            {stageName.toUpperCase()}
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.cardIconBtn,
                      { backgroundColor: 'rgba(255,255,255,0.12)' },
                    ]}
                  >
                    <Ionicons name="card" size={16} color="white" />
                  </View>
                </View>

                {/* Amount Section */}
                <View style={styles.amountSection}>
                  <AppText variant="caption" style={styles.outstandingLabel}>
                    Outstanding Balance
                  </AppText>
                  <AppText variant="h1" style={styles.amountText}>
                    {formatCurrency(outstandingAmount)}
                  </AppText>
                </View>

                {/* Bottom Row */}
                <View style={styles.cardBottomRow}>
                  <View>
                    <AppText variant="caption" style={styles.outstandingLabel}>
                      Next EMI
                    </AppText>
                    <AppText variant="bodySm" style={styles.emiText}>
                      {formatCurrency(Number(calculatedEmi))} • AutoDebit
                    </AppText>
                  </View>

                  {isDisbursed && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={(e) => {
                        e.stopPropagation();
                        onViewDetails(item.id, true);
                      }}
                      style={[
                        styles.repayButton,
                        { backgroundColor: colors.surface },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        style={[
                          styles.repayButtonText,
                          { color: colors.primary },
                        ]}
                      >
                        Repay Now
                      </AppText>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Repayment Progress Bar */}
                {isDisbursed && (
                  <RepaymentProgressBar
                    percentage={repaidPct}
                    isDark={isDark}
                  />
                )}
              </NotchedCard>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  loadingContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  outerContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainStatCard: {
    height: 215,
    justifyContent: 'space-between',
  },
  emptyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emptyTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginTop: 'auto',
  },
  carouselWrapper: {
    marginBottom: 24,
    alignItems: 'center',
  },
  carouselItem: {
    paddingHorizontal: 8,
  },
  bubbleTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  bubbleBottom: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  cardLabelCol: {
    flex: 1,
  },
  loanTypeLabel: {
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '800',
    fontSize: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 5,
    gap: 5,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountSection: {
    marginTop: 10,
    zIndex: 10,
  },
  outstandingLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
    fontSize: 9,
  },
  amountText: {
    color: 'white',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
    zIndex: 10,
  },
  emiText: {
    color: 'white',
    fontWeight: '800',
    marginTop: 2,
    fontSize: 13,
  },
  repayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  repayButtonText: {
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
});

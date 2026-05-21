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

export const ActiveLoanCard: React.FC<ActiveLoanCardProps> = React.memo(({
  applications,
  isLoading,
  onViewDetails,
  onApplyNow,
}) => {
  const colors = useColors();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <NotchedCard
          style={[styles.mainStatCard, { backgroundColor: colors.accent }]}
          notchColor={colors.background}
        >
          <View style={styles.center}>
            <LottieView
              source={require('../../../../assets/loader.json')}
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
          <View style={styles.emptyCardHeader}>
            <AppText variant="h3" style={{ color: colors.textOnPrimary, fontWeight: '800' }}>
              No Active Loans
            </AppText>
            <AppText variant="bodySm" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 6, lineHeight: 18 }}>
              You don't have any active loan accounts at the moment. Take advantage of our low rates and apply today!
            </AppText>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onApplyNow}
            style={[styles.applyButton, { backgroundColor: colors.surface }]}
          >
            <AppText variant="bodyMedium" style={{ color: colors.accentDark, fontWeight: '800' }}>
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
        height={225}
        autoPlay={false}
        data={applications}
        scrollAnimationDuration={500}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.92,
          parallaxScrollingOffset: 40,
        }}
        renderItem={({ item }: { item: any }) => {
          const isDisbursed = item.applicationStatus === 'DISBURSED';
          const outstandingAmount = item.requestedAmount;
          const calculatedEmi = (outstandingAmount * 0.05).toFixed(0);

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
                {/* Visual Decorative Bubbles */}
                <View style={[styles.bubbleTop, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                <View style={[styles.bubbleBottom, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />

                <View style={styles.cardTopRow}>
                  <View style={styles.cardLabelCol}>
                    <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '800' }}>
                      Personal Loan
                    </AppText>
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <AppText variant="caption" style={styles.statusBadgeText}>
                        {item.applicationStatus}
                      </AppText>
                    </View>
                  </View>
                  <View style={[styles.swapButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="card" size={18} color="white" />
                  </View>
                </View>

                <View style={styles.amountSection}>
                  <AppText variant="caption" style={styles.outstandingLabel}>
                    Outstanding Balance
                  </AppText>
                  <AppText variant="h1" style={styles.amountText}>
                    {formatCurrency(outstandingAmount)}
                  </AppText>
                </View>

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
                      style={[styles.repayButton, { backgroundColor: colors.surface }]}
                    >
                      <AppText variant="caption" style={[styles.repayButtonText, { color: colors.primary }]}>
                        Repay Now
                      </AppText>
                    </TouchableOpacity>
                  )}
                </View>
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
    height: 200,
    justifyContent: 'space-between',
  },
  emptyCardHeader: {
    flex: 1,
    paddingRight: 16,
  },
  applyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
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
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  bubbleBottom: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
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
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountSection: {
    marginTop: 12,
    zIndex: 10,
  },
  outstandingLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '800',
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
  },
  repayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
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
  },
});

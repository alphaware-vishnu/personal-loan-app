import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import LottieView from 'lottie-react-native';
import { useColors, useTheme } from '../../../theme';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { CreditScoreGauge } from './CreditScoreGauge';
import { useLoanStore } from '../../../store/loanStore';
import { checkCibilScore } from '../../../services/customerService';

const { width } = Dimensions.get('window');

interface CreditScoreModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const CreditScoreModal: React.FC<CreditScoreModalProps> = ({
  isVisible,
  onClose,
}) => {
  const colors = useColors();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const { cibilScore, setCibilScore } = useLoanStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleFetchScore = async () => {
    try {
      setIsLoading(true);
      const res = await checkCibilScore();
      if (res?.data?.score) {
        setCibilScore(res.data.score);
      } else {
        setCibilScore('no_data');
      }
    } catch (error) {
      console.error('Failed to fetch score:', error);
      setCibilScore('no_data');
    } finally {
      setIsLoading(false);
    }
  };

  const scoreValue = typeof cibilScore === 'number' ? cibilScore : 0;

  const scoreFactors = [
    {
      name: 'Payment History',
      status: 'Excellent',
      color: '#10B981',
      icon: 'calendar-outline',
    },
    {
      name: 'Credit Utilization',
      status: 'Good',
      color: '#3B82F6',
      icon: 'pie-chart-outline',
    },
    {
      name: 'Age of Credit History',
      status: 'Excellent',
      color: '#10B981',
      icon: 'time-outline',
    },
    {
      name: 'Total Accounts',
      status: 'Fair',
      color: '#F59E0B',
      icon: 'folder-open-outline',
    },
  ];

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: isDark ? '#151E2E' : colors.surface },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="h3" style={{ fontWeight: '800', color: colors.text }}>
              My Credit Score
            </AppText>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.backgroundSecondary },
              ]}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {cibilScore === null ? (
              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={styles.emptyContainer}
              >
                <LottieView
                  source={require('../../../../assets/new-loader.json')}
                  autoPlay
                  loop
                  style={{ width: 160, height: 160, marginBottom: 20 }}
                />
                <AppText variant="h2" style={{ fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
                  Unlock Your Credit Power
                </AppText>
                <AppText variant="bodyMedium" style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 }}>
                  Checking your credit score is a soft pull and will not impact your credit rating.
                </AppText>
                <AppButton
                  title="Check CIBIL Score"
                  variant="primary"
                  size="lg"
                  onPress={handleFetchScore}
                  loading={isLoading}
                  style={{ width: '100%' }}
                />
              </MotiView>
            ) : cibilScore === 'no_data' ? (
              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={styles.emptyContainer}
              >
                <LottieView
                  source={require('../../../../assets/new-loader.json')}
                  autoPlay
                  loop
                  style={{ width: 160, height: 160, marginBottom: 20 }}
                />
                <AppText variant="h2" style={{ fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
                  Credit report not available
                </AppText>
                <AppText variant="bodyMedium" style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 }}>
                  We were unable to fetch your credit report at this time. Please check back later.
                </AppText>
                <AppButton
                  title="Check Score"
                  variant="primary"
                  size="lg"
                  onPress={handleFetchScore}
                  loading={isLoading}
                  style={{ width: '100%' }}
                />
              </MotiView>
            ) : (
              <>
                {/* Gauge Wrapper */}
                <View style={styles.gaugeContainer}>
                  <CreditScoreGauge score={cibilScore} size={180} />
                </View>

                {/* Score History Graph Placeholder */}
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 400, delay: 200 }}
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <AppText variant="bodyMedium" style={{ fontWeight: '800', color: colors.text, marginBottom: 12 }}>
                    Score Trend (6 Months)
                  </AppText>

                  {/* Minimalist Vector Trend Line */}
                  <View style={styles.graphWrapper}>
                    <View style={styles.trendRow}>
                      {[scoreValue - 30, scoreValue - 25, scoreValue - 20, scoreValue - 8, scoreValue - 5, scoreValue].map((val, idx) => {
                        const heightPct = Math.max(0, Math.min(100, ((val - 700) / 60) * 100));
                        return (
                          <View key={idx} style={styles.trendCol}>
                            <View style={[styles.bar, { height: `${heightPct}%`, backgroundColor: colors.primary }]} />
                            <AppText variant="caption" style={{ color: colors.textMuted, fontSize: 9, marginTop: 6 }}>
                              {val}
                            </AppText>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </MotiView>

                {/* Score Factors */}
                <View style={styles.factorsSection}>
                  <AppText variant="labelLg" style={{ color: colors.text, marginBottom: 14 }}>
                    Factors Affecting Your Score
                  </AppText>

                  {scoreFactors.map((factor, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.factorRow,
                        {
                          borderBottomWidth: idx < scoreFactors.length - 1 ? 1 : 0,
                          borderBottomColor: colors.border,
                        },
                      ]}
                    >
                      <View style={[styles.factorIconBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.backgroundSecondary }]}>
                        <Ionicons name={factor.icon as any} size={18} color={colors.textSecondary} />
                      </View>
                      <AppText variant="bodyMedium" style={{ flex: 1, fontWeight: '700', color: colors.text }}>
                        {factor.name}
                      </AppText>
                      <View style={[styles.statusBadge, { backgroundColor: `${factor.color}15`, borderColor: `${factor.color}30` }]}>
                        <AppText variant="caption" style={{ color: factor.color, fontWeight: '800' }}>
                          {factor.status}
                        </AppText>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  graphWrapper: {
    height: 100,
    justifyContent: 'flex-end',
    paddingTop: 10,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  trendCol: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 14,
    borderRadius: 4,
  },
  factorsSection: {
    marginBottom: 16,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  factorIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
});

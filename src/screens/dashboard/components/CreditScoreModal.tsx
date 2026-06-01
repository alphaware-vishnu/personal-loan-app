import React from 'react';
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
import { useColors, useTheme } from '../../../theme';
import { AppText } from '../../../components/ui/AppText';
import { CreditScoreGauge } from './CreditScoreGauge';

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

  const score = 750;

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
            {/* Gauge Wrapper */}
            <View style={styles.gaugeContainer}>
              <CreditScoreGauge score={score} size={180} />
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
                  {[720, 725, 730, 742, 745, 750].map((val, idx) => {
                    const heightPct = ((val - 700) / 60) * 100;
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
});

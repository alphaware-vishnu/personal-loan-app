import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useColors, useTheme } from '../../../theme';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { formatCurrency } from '../../../utils/formatters';

const { width, height } = Dimensions.get('window');

interface EmiCalculatorModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const EmiCalculatorModal: React.FC<EmiCalculatorModalProps> = ({
  isVisible,
  onClose,
}) => {
  const colors = useColors();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const [amount, setAmount] = useState('50000');
  const [rate, setRate] = useState('12');
  const [tenure, setTenure] = useState('12'); // in months

  const [emi, setEmi] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalPayable, setTotalPayable] = useState(0);

  useEffect(() => {
    const P = parseFloat(amount) || 0;
    const r = (parseFloat(rate) || 0) / 12 / 100;
    const n = parseFloat(tenure) || 0;

    if (P > 0 && r > 0 && n > 0) {
      const calculatedEmi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const calculatedPayable = calculatedEmi * n;
      const calculatedInterest = calculatedPayable - P;

      setEmi(Math.round(calculatedEmi));
      setTotalPayable(Math.round(calculatedPayable));
      setTotalInterest(Math.round(calculatedInterest));
    } else {
      setEmi(0);
      setTotalPayable(0);
      setTotalInterest(0);
    }
  }, [amount, rate, tenure]);

  const adjustValue = (
    value: string,
    setValue: (v: string) => void,
    increment: number,
    min: number,
    max: number
  ) => {
    const current = parseFloat(value) || 0;
    const next = Math.max(min, Math.min(max, current + increment));
    setValue(next.toString());
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? '#151E2E' : colors.surface },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <AppText variant="h3" style={{ fontWeight: '800', color: colors.text }}>
                EMI Calculator
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

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* Output Result Card */}
              <MotiView
                from={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'timing', duration: 450 }}
                style={[
                  styles.resultCard,
                  { backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : colors.primaryLight },
                ]}
              >
                <AppText
                  variant="caption"
                  style={[styles.resultLabel, { color: colors.primary }]}
                >
                  ESTIMATED MONTHLY EMI
                </AppText>
                <AppText
                  variant="h1"
                  style={[styles.resultValue, { color: colors.primary }]}
                >
                  {formatCurrency(emi)}/mo
                </AppText>

                <View style={styles.resultDetails}>
                  <View style={styles.detailItem}>
                    <AppText variant="caption" style={{ color: colors.textMuted }}>
                      Principal Amount
                    </AppText>
                    <AppText variant="bodySm" style={{ fontWeight: '700', color: colors.text }}>
                      {formatCurrency(parseFloat(amount) || 0)}
                    </AppText>
                  </View>
                  <View style={styles.detailItem}>
                    <AppText variant="caption" style={{ color: colors.textMuted }}>
                      Total Interest
                    </AppText>
                    <AppText variant="bodySm" style={{ fontWeight: '700', color: colors.success }}>
                      {formatCurrency(totalInterest)}
                    </AppText>
                  </View>
                  <View style={styles.detailItem}>
                    <AppText variant="caption" style={{ color: colors.textMuted }}>
                      Total Payable
                    </AppText>
                    <AppText variant="bodySm" style={{ fontWeight: '700', color: colors.text }}>
                      {formatCurrency(totalPayable)}
                    </AppText>
                  </View>
                </View>
              </MotiView>

              {/* Input: Loan Amount */}
              <View style={styles.inputSection}>
                <AppText variant="labelLg" style={{ color: colors.text, marginBottom: 8 }}>
                  Loan Amount (₹)
                </AppText>
                <View
                  style={[
                    styles.inputWrapper,
                    { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.background },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => adjustValue(amount, setAmount, -5000, 5000, 1000000)}
                    style={styles.adjustBtn}
                  >
                    <Ionicons name="remove-circle-outline" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity
                    onPress={() => adjustValue(amount, setAmount, 5000, 5000, 1000000)}
                    style={styles.adjustBtn}
                  >
                    <Ionicons name="add-circle-outline" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Input: Interest Rate */}
              <View style={styles.inputSection}>
                <AppText variant="labelLg" style={{ color: colors.text, marginBottom: 8 }}>
                  Interest Rate (% p.a.)
                </AppText>
                <View
                  style={[
                    styles.inputWrapper,
                    { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.background },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => adjustValue(rate, setRate, -0.5, 5, 36)}
                    style={styles.adjustBtn}
                  >
                    <Ionicons name="remove-circle-outline" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={rate}
                    onChangeText={setRate}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    onPress={() => adjustValue(rate, setRate, 0.5, 5, 36)}
                    style={styles.adjustBtn}
                  >
                    <Ionicons name="add-circle-outline" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Input: Tenure */}
              <View style={styles.inputSection}>
                <AppText variant="labelLg" style={{ color: colors.text, marginBottom: 8 }}>
                  Tenure (Months)
                </AppText>
                <View
                  style={[
                    styles.inputWrapper,
                    { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.background },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => adjustValue(tenure, setTenure, -3, 3, 60)}
                    style={styles.adjustBtn}
                  >
                    <Ionicons name="remove-circle-outline" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={tenure}
                    onChangeText={setTenure}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity
                    onPress={() => adjustValue(tenure, setTenure, 3, 3, 60)}
                    style={styles.adjustBtn}
                  >
                    <Ionicons name="add-circle-outline" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* CTA button */}
              <AppButton
                title="Apply For This Loan"
                onPress={onClose}
                style={styles.applyBtn}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  keyboardContainer: {
    width: '100%',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.85,
    paddingTop: 24,
    paddingHorizontal: 24,
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
  resultCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  resultLabel: {
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  resultValue: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 16,
  },
  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 16,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  inputSection: {
    marginBottom: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 54,
  },
  adjustBtn: {
    padding: 6,
  },
  input: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  applyBtn: {
    marginTop: 16,
  },
});

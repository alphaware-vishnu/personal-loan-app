import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Clipboard,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import Toast from 'react-native-toast-message';
import { useColors, useTheme } from '../../../theme';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';

interface ReferEarnModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ReferEarnModal: React.FC<ReferEarnModalProps> = ({
  isVisible,
  onClose,
}) => {
  const colors = useColors();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const referralCode = 'ALFIN500';

  const handleCopyCode = () => {
    Clipboard.setString(referralCode);
    Toast.show({
      type: 'success',
      text1: 'Code Copied!',
      text2: `Referral code ${referralCode} copied to clipboard`,
      position: 'top',
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Use my referral code ${referralCode} to apply for a personal loan on Alphaware app and get ₹500 cashback upon disbursal! Download now: https://lms.alfinnext.com`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

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
              Refer & Earn
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

          {/* Promotion Card */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400 }}
            style={[
              styles.promoCard,
              { backgroundColor: isDark ? 'rgba(236,72,153,0.08)' : '#FDF2F8' },
            ]}
          >
            <View style={[styles.giftCircle, { backgroundColor: isDark ? 'rgba(236,72,153,0.15)' : '#FCE7F3' }]}>
              <Ionicons name="gift" size={32} color="#EC4899" />
            </View>
            <AppText variant="h2" style={{ fontWeight: '900', color: '#EC4899', marginTop: 12, marginBottom: 4 }}>
              Get ₹500 Cashback
            </AppText>
            <AppText variant="bodySm" style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 18 }}>
              Refer a friend to Alphaware Loan. Once their loan is successfully disbursed, both of you get ₹500 straight into your account!
            </AppText>
          </MotiView>

          {/* Code Section */}
          <View style={styles.codeSection}>
            <AppText variant="caption" style={{ color: colors.textMuted, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 1 }}>
              YOUR REFERRAL CODE
            </AppText>
            <View
              style={[
                styles.codeBox,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <AppText variant="h3" style={{ fontWeight: '900', color: colors.text, letterSpacing: 2 }}>
                {referralCode}
              </AppText>
              <TouchableOpacity
                onPress={handleCopyCode}
                style={[styles.copyBtn, { backgroundColor: colors.primary }]}
              >
                <AppText variant="caption" style={{ color: 'white', fontWeight: '800' }}>
                  COPY
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Share Button */}
          <AppButton
            title="Share Referral Link"
            onPress={handleShare}
            style={styles.shareBtn}
          />
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  giftCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    paddingLeft: 24,
    paddingRight: 10,
    marginTop: 8,
  },
  copyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  shareBtn: {
    width: '100%',
  },
});

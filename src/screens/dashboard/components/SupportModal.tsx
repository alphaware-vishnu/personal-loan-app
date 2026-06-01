import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useColors, useTheme } from '../../../theme';
import { AppText } from '../../../components/ui/AppText';
import Toast from 'react-native-toast-message';

interface SupportModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isVisible,
  onClose,
}) => {
  const colors = useColors();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const handleContactOption = (type: 'email' | 'call' | 'whatsapp') => {
    switch (type) {
      case 'email':
        Linking.openURL('mailto:support@alphaware.com');
        break;
      case 'call':
        Linking.openURL('tel:+911800123456');
        break;
      case 'whatsapp':
        Linking.openURL('https://wa.me/911800123456');
        break;
    }
  };

  const supportOptions = [
    {
      icon: 'mail-outline',
      label: 'Email Support',
      desc: 'support@alphaware.com',
      color: '#3B82F6',
      bgLight: '#E1EFFE',
      bgDark: 'rgba(59,130,246,0.12)',
      onPress: () => handleContactOption('email'),
    },
    {
      icon: 'call-outline',
      label: 'Phone Support',
      desc: '1800 123 456 (Toll Free)',
      color: '#10B981',
      bgLight: '#ECFDF5',
      bgDark: 'rgba(16,185,129,0.12)',
      onPress: () => handleContactOption('call'),
    },
    {
      icon: 'logo-whatsapp',
      label: 'WhatsApp Chat',
      desc: 'Instant replies 24/7',
      color: '#25D366',
      bgLight: '#E8F5E9',
      bgDark: 'rgba(37,211,102,0.12)',
      onPress: () => handleContactOption('whatsapp'),
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
              Help & Support
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

          <AppText variant="bodySm" style={[styles.description, { color: colors.textSecondary }]}>
            Have queries regarding your loan disbursal, eligibility, or documentation? Reach out to our support channels below.
          </AppText>

          {/* Support Channels List */}
          <View style={styles.optionsList}>
            {supportOptions.map((item, idx) => (
              <MotiView
                key={idx}
                from={{ opacity: 0, translateY: 15 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 400, delay: idx * 80 }}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={item.onPress}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconWrapper,
                      {
                        backgroundColor: isDark ? item.bgDark : item.bgLight,
                      },
                    ]}
                  >
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <View style={styles.textWrapper}>
                    <AppText variant="bodyMedium" style={{ fontWeight: '800', color: colors.text }}>
                      {item.label}
                    </AppText>
                    <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                      {item.desc}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
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
    marginBottom: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    lineHeight: 20,
    marginBottom: 24,
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textWrapper: {
    flex: 1,
  },
});

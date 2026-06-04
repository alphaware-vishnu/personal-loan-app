import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useColors, useTheme } from '../../../theme';
import { useAuthStore } from '../../../store/authStore';
import { useLoanStore } from '../../../store/loanStore';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { AppText } from '../../../components/ui/AppText';
import { CreditScoreGauge } from './CreditScoreGauge';

interface DashboardHeaderProps {
  onViewProfile: () => void;
  onSignOut: () => void;
  onPressCreditScore?: () => void;
  onPressNewLoan?: () => void;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(({
  onViewProfile,
  onSignOut,
  onPressCreditScore,
  onPressNewLoan,
}) => {
  const colors = useColors();
  const { theme, mode } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const { mobile } = useAuthStore();
  const { customerInfo, cibilScore } = useLoanStore();
  const onboardingName = useOnboardingStore((state) => state.formData?.applicantName);
  const applicantName = customerInfo?.applicantName || onboardingName || '';
  const firstName = applicantName ? applicantName.split(' ')[0] : '';
  const isDark = mode === 'dark';

  const hasScore = typeof cibilScore === 'number';
  const isNoData = cibilScore === 'no_data';

  const gaugeSubtitle = hasScore
    ? 'Soft pull report'
    : isNoData
    ? 'Credit report not available'
    : 'Find out your credit standing';

  const buttonText = hasScore ? 'Refresh' : 'Check Score';
  const buttonIcon = hasScore ? 'refresh' : 'speedometer-outline';

  return (
    <View style={styles.headerWrapper}>
      {/* Top Row — Menu + Greeting + Actions */}
      <View style={styles.topRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.iconButton,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
            },
          ]}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="menu-outline" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.topRowRight}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.iconButton,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
              },
            ]}
            onPress={onPressNewLoan}
          >
            <Ionicons name="add-outline" size={22} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.iconButton,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.surface,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
              },
            ]}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.avatarButton,
              {
                borderColor: isDark ? colors.accent : colors.primary,
              },
            ]}
            onPress={onViewProfile}
          >
            <View
              style={[
                styles.avatarInner,
                {
                  backgroundColor: isDark ? colors.primaryLight : colors.primaryLight,
                },
              ]}
            >
              <Ionicons
                name="person"
                size={18}
                color={isDark ? colors.primary : colors.primary}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Welcome Section */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.welcomeContainer}
      >
        <AppText
          variant="caption"
          style={[
            styles.greetingLabel,
            { color: isDark ? colors.textMuted : colors.textTertiary },
          ]}
        >
          {getGreeting()}
        </AppText>
        <AppText variant="h1" style={[styles.nameText, { color: colors.text }]}>
          {firstName ? `${firstName} 👋` : 'Welcome 👋'}
        </AppText>
      </MotiView>

      {/* Credit Score Gauge Card */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 600, delay: 150 }}
        style={[
          styles.gaugeCard,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.surface,
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
          },
        ]}
      >
        <View style={styles.gaugeRow}>
          <View style={styles.gaugeLeft}>
            <AppText
              variant="caption"
              style={[styles.gaugeLabel, { color: colors.textSecondary }]}
            >
              CREDIT SCORE
            </AppText>
            <AppText
              variant="bodySm"
              style={[styles.gaugeSubtext, { color: colors.textMuted }]}
            >
              {gaugeSubtitle}
            </AppText>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onPressCreditScore}
              style={[
                styles.refreshButton,
                {
                  backgroundColor: isDark
                    ? 'rgba(99,102,241,0.15)'
                    : colors.primaryLight,
                },
              ]}
            >
              <Ionicons name={buttonIcon as any} size={12} color={colors.primary} />
              <AppText
                variant="caption"
                style={[styles.refreshText, { color: colors.primary }]}
              >
                {buttonText}
              </AppText>
            </TouchableOpacity>
          </View>
          <CreditScoreGauge score={cibilScore} size={140} />
        </View>
      </MotiView>

      {/* Side Menu Drawer Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <MotiView
            from={{ opacity: 0, translateX: -50 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 250 }}
            style={[styles.drawerContainer, { backgroundColor: colors.surface }]}
          >
            <View style={styles.drawerHeader}>
              <View
                style={[
                  styles.drawerAvatarContainer,
                  {
                    backgroundColor: colors.primaryLight,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Ionicons name="person" size={32} color={colors.primary} />
              </View>
              <AppText
                variant="labelLg"
                style={[styles.drawerName, { color: colors.text }]}
              >
                {customerInfo?.applicantName || onboardingName || 'Applicant'}
              </AppText>
              <AppText variant="caption" style={{ color: colors.textSecondary }}>
                {mobile || 'No mobile listed'}
              </AppText>
            </View>

            <View style={styles.drawerItems}>
              {[
                { icon: 'person-outline', label: 'My Profile', onPress: () => { setMenuVisible(false); onViewProfile(); } },
                { icon: 'settings-outline', label: 'Settings' },
                { icon: 'help-circle-outline', label: 'Support' },
              ].map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  style={[styles.drawerItem, { borderBottomColor: colors.border }]}
                  onPress={item.onPress}
                >
                  <View
                    style={[
                      styles.drawerIconBox,
                      { backgroundColor: colors.backgroundSecondary },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={idx === 0 ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <AppText
                    variant="bodyMedium"
                    style={{ fontWeight: '700', color: colors.text }}
                  >
                    {item.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.signOutButton, { backgroundColor: colors.errorLight }]}
              onPress={() => {
                setMenuVisible(false);
                onSignOut();
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <AppText
                variant="bodyMedium"
                style={{
                  fontWeight: '700',
                  color: colors.error,
                  marginLeft: 12,
                }}
              >
                Sign Out
              </AppText>
            </TouchableOpacity>
          </MotiView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  headerWrapper: {
    paddingHorizontal: 24,
    paddingTop: 8,
    marginBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeContainer: {
    marginBottom: 20,
  },
  greetingLabel: {
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 1.5,
    fontSize: 11,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  gaugeCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 4,
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gaugeLeft: {
    flex: 1,
    marginRight: 12,
  },
  gaugeLabel: {
    fontWeight: '800',
    letterSpacing: 1.2,
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  gaugeSubtext: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 14,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 5,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '700',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  drawerContainer: {
    width: '75%',
    height: '100%',
    paddingTop: 64,
    paddingHorizontal: 20,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  drawerHeader: {
    marginBottom: 36,
  },
  drawerAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 16,
  },
  drawerName: {
    fontWeight: '900',
    marginBottom: 2,
  },
  drawerItems: {
    flex: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  drawerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 36,
  },
});

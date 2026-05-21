import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useColors, useTheme } from '../../../theme';
import { useAuthStore } from '../../../store/authStore';
import { useLoanStore } from '../../../store/loanStore';
import { AppText } from '../../../components/ui/AppText';

interface DashboardHeaderProps {
  onViewProfile: () => void;
  onSignOut: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(({
  onViewProfile,
  onSignOut,
}) => {
  const colors = useColors();
  const { theme } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const { mobile } = useAuthStore();
  const { customerInfo } = useLoanStore();
  const firstName = customerInfo?.applicantName?.split(' ')[0] || 'Guest';

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.topRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="menu-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.welcomeContainer}>
        <AppText variant="caption" style={[styles.welcomeLabel, { color: colors.textSecondary }]}>
          Welcome back,
        </AppText>
        <AppText variant="h1" style={[styles.nameText, { color: colors.text }]}>
          {firstName}
        </AppText>
      </View>

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
              <View style={[styles.avatarContainer, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Ionicons name="person" size={32} color={colors.primary} />
              </View>
              <AppText variant="labelLg" style={[styles.drawerName, { color: colors.text }]}>
                {customerInfo?.applicantName || 'Applicant'}
              </AppText>
              <AppText variant="caption" style={{ color: colors.textSecondary }}>
                {mobile || 'No mobile listed'}
              </AppText>
            </View>

            <View style={styles.drawerItems}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.drawerItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setMenuVisible(false);
                  onViewProfile();
                }}
              >
                <View style={[styles.drawerIconBox, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="person-outline" size={20} color={colors.primary} />
                </View>
                <AppText variant="bodyMedium" style={{ fontWeight: '700', color: colors.text }}>
                  My Profile
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.drawerItem, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.drawerIconBox, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
                </View>
                <AppText variant="bodyMedium" style={{ fontWeight: '700', color: colors.text }}>
                  Settings
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.drawerItem, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.drawerIconBox, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
                </View>
                <AppText variant="bodyMedium" style={{ fontWeight: '700', color: colors.text }}>
                  Support
                </AppText>
              </TouchableOpacity>
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
              <AppText variant="bodyMedium" style={{ fontWeight: '700', color: colors.error, marginLeft: 12 }}>
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
    marginBottom: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  welcomeContainer: {
    marginTop: 4,
  },
  welcomeLabel: {
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
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
  avatarContainer: {
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

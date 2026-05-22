import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useColors, useTheme } from '../../../theme';
import { AppText } from '../../../components/ui/AppText';

interface ServiceItem {
  icon: string;
  label: string;
  lightBg: string;
  darkBg: string;
  iconColor: string;
  darkIconColor: string;
}

const SERVICES: ServiceItem[] = [
  {
    icon: 'calculator-outline',
    label: 'EMI Calc',
    lightBg: '#FEF3C7',
    darkBg: 'rgba(245,158,11,0.12)',
    iconColor: '#F59E0B',
    darkIconColor: '#FBBF24',
  },
  {
    icon: 'speedometer-outline',
    label: 'Credit Score',
    lightBg: '#E1EFFE',
    darkBg: 'rgba(59,130,246,0.12)',
    iconColor: '#3B82F6',
    darkIconColor: '#60A5FA',
  },
  {
    icon: 'document-text-outline',
    label: 'Statements',
    lightBg: '#ECFDF5',
    darkBg: 'rgba(16,185,129,0.12)',
    iconColor: '#10B981',
    darkIconColor: '#34D399',
  },
  {
    icon: 'shield-checkmark-outline',
    label: 'Insurance',
    lightBg: '#FDF4FF',
    darkBg: 'rgba(168,85,247,0.12)',
    iconColor: '#A855F7',
    darkIconColor: '#C084FC',
  },
  {
    icon: 'gift-outline',
    label: 'Refer & Earn',
    lightBg: '#FDF2F8',
    darkBg: 'rgba(236,72,153,0.12)',
    iconColor: '#EC4899',
    darkIconColor: '#F472B6',
  },
  {
    icon: 'trending-up-outline',
    label: 'FD',
    lightBg: '#F0FDFA',
    darkBg: 'rgba(20,184,166,0.12)',
    iconColor: '#14B8A6',
    darkIconColor: '#2DD4BF',
  },
  {
    icon: 'chatbubble-ellipses-outline',
    label: 'Support',
    lightBg: '#FFF7ED',
    darkBg: 'rgba(249,115,22,0.12)',
    iconColor: '#F97316',
    darkIconColor: '#FB923C',
  },
  {
    icon: 'grid-outline',
    label: 'More',
    lightBg: '#F3F4F6',
    darkBg: 'rgba(107,114,128,0.12)',
    iconColor: '#6B7280',
    darkIconColor: '#9CA3AF',
  },
];

interface ServiceIconProps {
  item: ServiceItem;
  isDark: boolean;
  index: number;
}

const ServiceIcon: React.FC<ServiceIconProps> = ({ item, isDark, index }) => {
  const colors = useColors();

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 400, delay: index * 50 }}
    >
      <TouchableOpacity activeOpacity={0.7} style={styles.gridItem}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isDark ? item.darkBg : item.lightBg,
              borderColor: isDark
                ? `${item.darkIconColor}18`
                : 'transparent',
              borderWidth: isDark ? 1 : 0,
              // Light mode shadow
              ...(isDark
                ? {}
                : {
                    shadowColor: item.iconColor,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 2,
                  }),
            },
          ]}
        >
          <Ionicons
            name={item.icon as any}
            size={22}
            color={isDark ? item.darkIconColor : item.iconColor}
          />
        </View>
        <AppText
          variant="caption"
          style={[
            styles.iconLabel,
            { color: isDark ? colors.textSecondary : colors.textTertiary },
          ]}
          numberOfLines={1}
        >
          {item.label}
        </AppText>
      </TouchableOpacity>
    </MotiView>
  );
};

export const QuickActionsGrid: React.FC = React.memo(() => {
  const colors = useColors();
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const row1 = SERVICES.slice(0, 4);
  const row2 = SERVICES.slice(4, 8);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 600 }}
      style={styles.container}
    >
      <AppText
        variant="h3"
        style={[styles.sectionTitle, { color: colors.text }]}
      >
        Explore Services
      </AppText>

      <View
        style={[
          styles.gridCard,
          {
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.03)'
              : colors.surface,
            borderColor: isDark ? 'rgba(255,255,255,0.05)' : colors.border,
          },
        ]}
      >
        <View style={styles.gridRow}>
          {row1.map((item, idx) => (
            <ServiceIcon key={item.label} item={item} isDark={isDark} index={idx} />
          ))}
        </View>
        <View style={[styles.gridRow, { marginTop: 20 }]}>
          {row2.map((item, idx) => (
            <ServiceIcon
              key={item.label}
              item={item}
              isDark={isDark}
              index={idx + 4}
            />
          ))}
        </View>
      </View>
    </MotiView>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  gridCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gridItem: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
});

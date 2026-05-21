import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useColors } from '../../../theme';
import { AppText } from '../../../components/ui/AppText';

interface ToolItemProps {
  icon: any;
  name: string;
  color: string;
  iconColor: string;
  onPress?: () => void;
}

const ToolItem: React.FC<ToolItemProps> = ({
  icon,
  name,
  color,
  iconColor,
  onPress,
}) => {
  const colors = useColors();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.toolGridItem}
    >
      <View style={[styles.toolContainer, { backgroundColor: color }]}>
        {/* @ts-ignore */}
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <AppText variant="caption" style={[styles.toolLabel, { color: colors.textSecondary }]}>
        {name}
      </AppText>
    </TouchableOpacity>
  );
};

export const QuickActionsGrid: React.FC = React.memo(() => {
  const colors = useColors();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 600 }}
      style={styles.container}
    >
      <AppText variant="h3" style={[styles.sectionTitle, { color: colors.text }]}>
        Quick Tools
      </AppText>
      
      <View style={styles.gridRow}>
        <ToolItem
          icon="calculator-outline"
          name="Calculator"
          color={colors.warningLight}
          iconColor={colors.warning}
        />
        <ToolItem
          icon="speedometer-outline"
          name="Score"
          color={colors.infoLight}
          iconColor={colors.info}
        />
        <ToolItem
          icon="document-text-outline"
          name="Reports"
          color={colors.successLight}
          iconColor={colors.success}
        />
        <ToolItem
          icon="shield-checkmark-outline"
          name="Insure"
          color="#FDF4FF"
          iconColor="#A855F7"
        />
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
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolGridItem: {
    width: '22%',
    alignItems: 'center',
  },
  toolContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  toolLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
});

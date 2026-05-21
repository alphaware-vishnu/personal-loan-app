import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useColors, useTheme } from '../../../theme';
import { NotchedCard } from '../../../components/ui/NotchedCard';
import { AppText } from '../../../components/ui/AppText';
import { formatCurrency } from '../../../utils/formatters';

interface OfferBannerProps {
  schemes: any[];
  isLoading: boolean;
  onSelectScheme: (scheme: any) => void;
  onViewAll: () => void;
}

export const OfferBanner: React.FC<OfferBannerProps> = React.memo(({
  schemes,
  isLoading,
  onSelectScheme,
  onViewAll,
}) => {
  const colors = useColors();
  const { theme } = useTheme();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 600, delay: 100 }}
      style={styles.container}
    >
      <View style={styles.sectionHeader}>
        <AppText variant="h3" style={[styles.sectionTitle, { color: colors.text }]}>
          Instant Loan Schemes
        </AppText>
        <TouchableOpacity activeOpacity={0.7} onPress={onViewAll}>
          <AppText variant="bodySm" style={[styles.viewAllText, { color: colors.textSecondary }]}>
            View all
          </AppText>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <View style={styles.loadingRow}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.skeletonCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              />
            ))}
          </View>
        ) : schemes && schemes.length > 0 ? (
          schemes.slice(0, 3).map((scheme, idx) => {
            const schemeName = scheme.name?.split('_')?.[0] || 'Personal';
            const cardColors =
              idx % 2 === 0
                ? [colors.primary, colors.primaryDark] as const
                : [colors.secondary, colors.secondaryDark] as const;

            return (
              <View key={scheme.id || idx} style={styles.cardContainer}>
                <NotchedCard
                  style={styles.schemeCard}
                  colors={cardColors}
                  notchColor={colors.background}
                >
                  {/* Decorative element */}
                  <View style={[styles.bubble, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onSelectScheme(scheme)}
                    style={styles.cardTouchArea}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                        <Ionicons name="home" size={16} color="white" />
                      </View>
                      <View style={[styles.calcBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        <AppText variant="caption" style={styles.calcBadgeText}>
                          Calculate
                        </AppText>
                        <Ionicons
                          name="arrow-up-outline"
                          size={12}
                          color="white"
                          style={styles.arrowIcon}
                        />
                      </View>
                    </View>

                    <View style={styles.schemeDetails}>
                      <AppText variant="h2" style={styles.schemeNameText}>
                        {schemeName} Loan
                      </AppText>
                      <AppText variant="h2" style={styles.schemeAmountText}>
                        {formatCurrency(scheme.loanAmount)}
                      </AppText>
                      <View style={styles.speedLine}>
                        <Ionicons name="flash" size={10} color="#FBBF24" />
                        <AppText variant="caption" style={styles.speedText}>
                          Instant Approval
                        </AppText>
                      </View>
                    </View>

                    <View style={styles.statsRow}>
                      <View style={[styles.statBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        <Ionicons name="trending-up" size={10} color="#4ADE80" />
                        <AppText variant="caption" style={styles.statVal}>
                          {scheme.defaultInterest}%
                        </AppText>
                      </View>
                      <View style={[styles.statBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        <Ionicons name="time" size={10} color="#60A5FA" />
                        <AppText variant="caption" style={styles.statVal}>
                          {scheme.defaultTenure}M
                        </AppText>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <AppText variant="caption" style={styles.applyLabel}>
                        Apply Now
                      </AppText>
                      <View style={[styles.footerLine, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                      <Ionicons name="chevron-forward" size={12} color="white" />
                    </View>
                  </TouchableOpacity>
                </NotchedCard>
              </View>
            );
          })
        ) : (
          <View style={[styles.emptyStateBox, { borderColor: colors.border }]}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.textMuted} />
            <AppText variant="bodySm" style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No specialized schemes available right now.
            </AppText>
          </View>
        )}
      </ScrollView>
    </MotiView>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  viewAllText: {
    fontWeight: '600',
  },
  scrollContent: {
    paddingLeft: 24,
    paddingRight: 8,
  },
  loadingRow: {
    flexDirection: 'row',
  },
  skeletonCard: {
    width: 250,
    height: 195,
    borderRadius: 32,
    marginRight: 16,
    borderWidth: 1,
  },
  cardContainer: {
    marginRight: 16,
  },
  schemeCard: {
    width: 250,
    height: 195,
  },
  bubble: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cardTouchArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  calcBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  arrowIcon: {
    marginLeft: 4,
    transform: [{ rotate: '45deg' }],
  },
  schemeDetails: {
    marginTop: 8,
  },
  schemeNameText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  schemeAmountText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  speedLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  speedText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statVal: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  applyLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  footerLine: {
    height: 1,
    flex: 1,
    marginHorizontal: 10,
  },
  emptyStateBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 24,
    width: 250,
    height: 195,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});

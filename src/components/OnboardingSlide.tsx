import React from "react";
import { View, Text, Dimensions, StyleSheet, Platform, Image, Animated } from "react-native";
import { MotiView } from "moti";
import { Ionicons, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface FloatingIcon {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  darkColor: string;
  size: number;
  top: number | string;
  left: number | string;
  delay: number;
}

interface OnboardingSlideProps {
  title: string;
  description: string;
  icon: any;
  highlightWord?: string;
  bgColor?: string;
  textColor?: string;
  descColor?: string;
  primaryColor?: string;
}

export const OnboardingSlide = ({
  title,
  description,
  icon,
  highlightWord,
  bgColor = "#FFFFFF",
  textColor = "#111827",
  descColor = "#6B7280",
  primaryColor = "#4F46E5",
}: OnboardingSlideProps) => {
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  const is3DIcon = icon === 'credit_card_money' || icon === 'wallet_icon' || icon === 'rocket_icon' || icon === 'security';

  React.useEffect(() => {
    if (is3DIcon) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [icon]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 10],
  });

  // Detect dark mode by checking background luminance
  const isDark =
    bgColor === "#0B0F19" ||
    bgColor === "#151E2E" ||
    bgColor.toLowerCase().includes("0b0f") ||
    bgColor.toLowerCase().includes("151e");

  const floatingIcons: FloatingIcon[] = [
    {
      name: "document-text",
      color: "#3B82F6",
      darkColor: "#60A5FA",
      size: 20,
      top: "18%",
      left: "10%",
      delay: 0,
    },
    {
      name: "cash",
      color: "#10B981",
      darkColor: "#34D399",
      size: 22,
      top: "20%",
      left: "80%",
      delay: 500,
    },
    {
      name: "pie-chart",
      color: "#F59E0B",
      darkColor: "#FBBF24",
      size: 20,
      top: "72%",
      left: "12%",
      delay: 1000,
    },
    {
      name: "shield-checkmark",
      color: "#8B5CF6",
      darkColor: "#A78BFA",
      size: 22,
      top: "68%",
      left: "82%",
      delay: 1500,
    },
  ];

  const renderTitle = () => {
    if (!highlightWord) {
      return <Text style={[styles.title, { color: textColor }]}>{title}</Text>;
    }
    const parts = title.split(new RegExp(`(${highlightWord})`, "gi"));
    return (
      <Text style={[styles.title, { color: textColor }]}>
        {parts.map((part, i) =>
          part.toLowerCase() === highlightWord.toLowerCase() ? (
            <Text key={i} style={{ color: primaryColor }}>
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  return (
    <View style={[styles.container, { width, backgroundColor: bgColor }]}>
      {/* ─── Illustration Section ─── */}
      <View style={styles.imageSection}>
        <MotiView
          from={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", delay: 100, damping: 20 }}
          style={styles.circleContainer}
        >
          {/* Outer Ring — dashed */}
          {!is3DIcon && (
            <MotiView
              from={{ scale: 0.9, rotate: "0deg" }}
              animate={{ scale: 1, rotate: "360deg" }}
              transition={{
                loop: true,
                type: "timing",
                duration: 20000,
              }}
              style={[
                styles.ring,
                styles.outerRing,
                {
                  borderColor: isDark
                    ? `${primaryColor}25`
                    : `${primaryColor}18`,
                },
              ]}
            />
          )}

          {/* Inner Ring — solid */}
          {!is3DIcon && (
            <MotiView
              from={{ scale: 0.95, rotate: "360deg" }}
              animate={{ scale: 1, rotate: "0deg" }}
              transition={{
                loop: true,
                type: "timing",
                duration: 25000,
              }}
              style={[
                styles.ring,
                styles.innerRing,
                {
                  borderColor: isDark
                    ? `${primaryColor}35`
                    : `${primaryColor}30`,
                },
              ]}
            />
          )}

          {/* Floating Icons */}
          {!is3DIcon && floatingIcons.map((floatIcon, index) => (
            <MotiView
              key={index}
              from={{ translateY: -8 }}
              animate={{ translateY: 8 }}
              transition={{
                loop: true,
                type: "timing",
                duration: 2200,
                delay: floatIcon.delay,
              }}
              style={[
                styles.floatingIconWrapper,
                { top: floatIcon.top as any, left: floatIcon.left as any },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isDark
                      ? "rgba(30,41,59,0.9)"
                      : "#FFFFFF",
                    shadowColor: isDark
                      ? floatIcon.darkColor
                      : floatIcon.color,
                    borderColor: isDark
                      ? `${floatIcon.darkColor}25`
                      : "transparent",
                    borderWidth: isDark ? 1 : 0,
                  },
                ]}
              >
                <Ionicons
                  name={floatIcon.name}
                  size={floatIcon.size}
                  color={isDark ? floatIcon.darkColor : floatIcon.color}
                />
              </View>
            </MotiView>
          ))}

          {/* Main Center Icon */}
          <MotiView
            from={
              is3DIcon
                ? { scale: 1, opacity: 1 }
                : { scale: 0, opacity: 0 }
            }
            animate={{ scale: 1, opacity: 1 }}
            transition={
              is3DIcon
                ? { type: 'timing', duration: 0 }
                : { type: 'spring', delay: 400, damping: 15 }
            }
            style={styles.mainImageWrapper}
          >
            {/* Pulse behind icon */}
            <MotiView
              from={{ scale: 1, opacity: 0.3 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                loop: true,
                type: "timing",
                duration: 2500,
              }}
              style={[
                styles.imagePulseRing,
                { backgroundColor: primaryColor },
              ]}
            />

            {is3DIcon ? (
              <Animated.View style={{ transform: [{ translateY }] }}>
                <Image
                  source={
                    icon === 'credit_card_money'
                      ? require('../assets/animations/illustration/3d/credit_card_money.png')
                      : icon === 'wallet_icon'
                      ? require('../assets/animations/illustration/3d/wallet_icon.png')
                      : icon === 'rocket_icon'
                      ? require('../assets/animations/illustration/3d/rocket_icon.png')
                      : require('../assets/animations/illustration/3d/security.png')
                  }
                  style={styles.customImage}
                  resizeMode="contain"
                />
              </Animated.View>
            ) : (
              <View
                style={[
                  styles.mainIconBg,
                  {
                    backgroundColor: isDark
                      ? "rgba(30,41,59,0.95)"
                      : "#FFFFFF",
                    borderColor: isDark
                      ? `${primaryColor}30`
                      : "transparent",
                    borderWidth: isDark ? 1.5 : 0,
                  },
                ]}
              >
                <Feather name={icon} size={48} color={primaryColor} />
              </View>
            )}
          </MotiView>
        </MotiView>
      </View>

      {/* ─── Text Content ─── */}
      <View style={styles.textSection}>
        <MotiView
          from={{ opacity: 0, translateY: 25 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", delay: 500, damping: 20 }}
        >
          {renderTitle()}
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", delay: 600, damping: 20 }}
        >
          <Text style={[styles.description, { color: descColor }]}>
            {description}
          </Text>
        </MotiView>
      </View>
    </View>
  );
};

const CIRCLE_SIZE = width * 0.72;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  imageSection: {
    height: CIRCLE_SIZE + 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 1.5,
  },
  outerRing: {
    width: "100%",
    height: "100%",
    borderStyle: "dashed",
  },
  innerRing: {
    width: "62%",
    height: "62%",
    borderStyle: "solid",
  },
  floatingIconWrapper: {
    position: "absolute",
    zIndex: 10,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  mainImageWrapper: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  imagePulseRing: {
    position: "absolute",
    width: CIRCLE_SIZE * 0.42,
    height: CIRCLE_SIZE * 0.42,
    borderRadius: CIRCLE_SIZE * 0.21,
  },
  mainIconBg: {
    width: CIRCLE_SIZE * 0.4,
    height: CIRCLE_SIZE * 0.4,
    borderRadius: CIRCLE_SIZE * 0.12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  customImage: {
    width: CIRCLE_SIZE * 1.35,
    height: CIRCLE_SIZE * 1.35,
  },
  textSection: {
    paddingHorizontal: 36,
    alignItems: "center",
  },
  title: {
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-black",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 38,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 14,
    fontWeight: "400",
  },
});

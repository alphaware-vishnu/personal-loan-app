import React from "react";
import { View, Text, Image, Dimensions, StyleSheet, Platform } from "react-native";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface FloatingIcon {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  top: number | string;
  left: number | string;
  delay: number;
}

interface OnboardingSlideProps {
  title: string;
  description: string;
  image: any;
  highlightWord?: string;
  bgColor?: string;
  textColor?: string;
  descColor?: string;
  primaryColor?: string;
}

export const OnboardingSlide = ({
  title,
  description,
  image,
  highlightWord,
  bgColor = "#FFFFFF",
  textColor = "#111827",
  descColor = "#6B7280",
  primaryColor = "#EA580C",
}: OnboardingSlideProps) => {

  const floatingIcons: FloatingIcon[] = [
    { name: "document-text", color: "#3B82F6", size: 22, top: "15%", left: "12%", delay: 0 },
    { name: "cash", color: "#10B981", size: 24, top: "22%", left: "78%", delay: 500 },
    { name: "pie-chart", color: "#EA580C", size: 22, top: "75%", left: "15%", delay: 1000 },
    { name: "shield-checkmark", color: "#8B5CF6", size: 24, top: "65%", left: "80%", delay: 1500 },
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
      
      {/* ─── Illustration Section (Top) ─── */}
      <View style={styles.imageSection}>
        <MotiView
          from={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", delay: 100, damping: 20 }}
          style={styles.circleContainer}
        >
          {/* Outer Ring */}
          <MotiView
            from={{ scale: 0.9, rotate: "0deg" }}
            animate={{ scale: 1, rotate: "360deg" }}
            transition={{
              loop: true,
              type: "timing",
              duration: 20000,
            }}
            style={[styles.ring, styles.outerRing, { borderColor: `${primaryColor}20` }]}
          />
          {/* Inner Ring */}
          <MotiView
            from={{ scale: 0.95, rotate: "360deg" }}
            animate={{ scale: 1, rotate: "0deg" }}
            transition={{
              loop: true,
              type: "timing",
              duration: 25000,
            }}
            style={[styles.ring, styles.innerRing, { borderColor: `${primaryColor}40` }]}
          />

          {/* Floating Icons */}
          {floatingIcons.map((icon, index) => (
            <MotiView
              key={index}
              from={{ translateY: -10 }}
              animate={{ translateY: 10 }}
              transition={{
                loop: true,
                type: "timing",
                duration: 2000,
                delay: icon.delay,
              }}
              style={[
                styles.floatingIconWrapper,
                
              ]}
            >
              <View style={[styles.iconCircle, { shadowColor: icon.color }]}>
                <Ionicons name={icon.name} size={icon.size} color={icon.color} />
              </View>
            </MotiView>
          ))}

          {/* Main Image Center */}
          <MotiView
            from={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 400, damping: 15 }}
            style={styles.mainImageWrapper}
          >
            {/* Pulse behind image */}
            <MotiView
              from={{ scale: 1, opacity: 0.4 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                loop: true,
                type: "timing",
                duration: 2500,
              }}
              style={[styles.imagePulseRing, { backgroundColor: primaryColor }]}
            />
            <Image source={image} style={styles.image} resizeMode="cover" />
          </MotiView>
        </MotiView>
      </View>

      {/* ─── Text Content Section (Bottom) ─── */}
      <View style={styles.textSection}>
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", delay: 500, damping: 20 }}
        >
          {renderTitle()}
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
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

const CIRCLE_SIZE = width * 0.75;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  imageSection: {
    height: CIRCLE_SIZE + 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
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
    borderWidth: 2,
  },
  outerRing: {
    width: "100%",
    height: "100%",
    borderStyle: "dashed",
  },
  innerRing: {
    width: "65%",
    height: "65%",
    borderStyle: "solid",
  },
  floatingIconWrapper: {
    position: "absolute",
    zIndex: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  mainImageWrapper: {
    width: CIRCLE_SIZE * 0.45,
    height: CIRCLE_SIZE * 0.45,
    borderRadius: (CIRCLE_SIZE * 0.45) / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 5,
  },
  imagePulseRing: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  image: {
    width: "90%",
    height: "90%",
    borderRadius: 999,
  },
  textSection: {
    paddingHorizontal: 32,
    alignItems: "center",
  },
  title: {
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-black",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 40,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 16,
    fontWeight: "400",
  },
});

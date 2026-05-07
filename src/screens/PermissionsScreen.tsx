import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Button } from "../components/Button";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Camera } from "expo-camera";
import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

const { width } = Dimensions.get("window");

interface PermissionsScreenProps {
  onContinue: () => void;
}

// ──────────────────────────────────────────────
// Permission data
// ──────────────────────────────────────────────
const PERMISSIONS = [
  {
    key: "camera",
    icon: "camera-outline" as const,
    iconBg: "#FFF7ED",
    iconColor: "#F97316",
    title: "Camera Access",
    subtitle: "We need your camera for KYC",
    description:
      "Camera access is required for document photo capture and selfie verification during the KYC process.",
  },
  {
    key: "location",
    icon: "location-outline" as const,
    iconBg: "#FFF1F2",
    iconColor: "#FB7185",
    title: "Location Services",
    subtitle: "Help us verify your address",
    description:
      "Location helps us auto-fill your address and verify your identity for faster loan processing.",
  },
  {
    key: "notifications",
    icon: "notifications-outline" as const,
    iconBg: "#EFF6FF",
    iconColor: "#3B82F6",
    title: "Notifications",
    subtitle: "Stay updated on your loan",
    description:
      "Get real-time updates about your application status, approvals, and important reminders.",
  },
];

// ──────────────────────────────────────────────
// Single Permission Card
// ──────────────────────────────────────────────
interface PermissionCardProps {
  permission: (typeof PERMISSIONS)[number];
  stepIndex: number;
  totalSteps: number;
  onAllow: () => void;
  onSkip: () => void;
  loading: boolean;
}

const PermissionCard = ({
  permission,
  stepIndex,
  totalSteps,
  onAllow,
  onSkip,
  loading,
}: PermissionCardProps) => {
  return (
    <View className="flex-1">
      {/* Progress Dots */}
      <View className="flex-row items-center justify-center mt-6 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === stepIndex && styles.dotActive,
              i < stepIndex && styles.dotCompleted,
            ]}
          />
        ))}
      </View>

      {/* Icon Circle */}
      <View className="items-center mb-8">
        <View
          style={[
            styles.iconCircleOuter,
            { borderColor: permission.iconColor + "15" },
          ]}
        >
          <View
            style={[
              styles.iconCircleInner,
              { backgroundColor: permission.iconBg },
            ]}
          >
            <Ionicons
              name={permission.icon}
              size={44}
              color={permission.iconColor}
            />
          </View>
        </View>
        {/* Decorative dots around the icon */}
        <View style={[styles.decorDot, { top: 30, right: width * 0.22, backgroundColor: permission.iconColor + "30" }]} />
        <View style={[styles.decorDot, styles.decorDotSm, { top: 60, left: width * 0.2, backgroundColor: permission.iconColor + "20" }]} />
        <View style={[styles.decorDot, { bottom: 10, right: width * 0.28, backgroundColor: permission.iconColor + "25" }]} />
      </View>

      {/* Title & Description */}
      <View className="items-center px-6 mb-10">
        <Text className="text-3xl font-black text-slate-900 text-center mb-3">
          {permission.title}
        </Text>
        <Text className="text-base text-slate-400 text-center leading-6 font-medium">
          {permission.description}
        </Text>
      </View>

      {/* Spacer */}
      <View className="flex-1" />

      {/* Action Buttons */}
      <View className="px-2 pb-8">
        <Button
          title={`Allow ${permission.title.split(" ")[0]}`}
          variant="primary"
          size="lg"
          onPress={onAllow}
          loading={loading}
          className="bg-orange-500 border-orange-500 shadow-orange-200 mb-4"
        />
        <TouchableOpacity
          onPress={onSkip}
          className="items-center py-3"
          activeOpacity={0.6}
        >
          <Text className="text-slate-400 font-bold text-base">
            Maybe later
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ──────────────────────────────────────────────
// Main Permissions Screen
// ──────────────────────────────────────────────
export const PermissionsScreen = ({ onContinue }: PermissionsScreenProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const requestPermission = async (key: string) => {
    try {
      setLoading(true);

      if (key === "camera") {
        await Camera.requestCameraPermissionsAsync();
      } else if (key === "location") {
        await Location.requestForegroundPermissionsAsync();
      } else if (key === "notifications") {
        const isExpoGo =
          Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
        if (!(Platform.OS === "android" && isExpoGo)) {
          await Notifications.requestPermissionsAsync();
        }
      }
    } catch (error) {
      console.error(`Error requesting ${key} permission:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleAllow = async () => {
    const perm = PERMISSIONS[currentStep];
    await requestPermission(perm.key);
    advance();
  };

  const advance = () => {
    if (currentStep < PERMISSIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onContinue();
    }
  };

  const permission = PERMISSIONS[currentStep];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1 px-6">
        <PermissionCard
          permission={permission}
          stepIndex={currentStep}
          totalSteps={PERMISSIONS.length}
          onAllow={handleAllow}
          onSkip={advance}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
};

// ──────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────
const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 4,
  },
  dotActive: {
    width: 28,
    borderRadius: 6,
    backgroundColor: "#f97316",
  },
  dotCompleted: {
    backgroundColor: "#fdba74",
  },
  iconCircleOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  decorDot: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  decorDotSm: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

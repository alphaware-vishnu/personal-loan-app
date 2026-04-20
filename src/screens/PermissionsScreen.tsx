import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { MotiView } from "../components/Motion";
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

const PermissionItem = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
  <View className="flex-row items-center mb-6">
    <View className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center mr-4">
      <Text className="text-xl">{icon}</Text>
    </View>
    <View className="flex-1">
      <Text className="text-lg font-bold text-gray-950">{title}</Text>
      <Text className="text-gray-500 text-sm leading-5 font-medium">{desc}</Text>
    </View>
  </View>
);

export const PermissionsScreen = ({ onContinue }: PermissionsScreenProps) => {
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestPermissions = async () => {
    console.log('clicked', 'permission screen')
    try {
      setLoading(true);

      // Request Location (Foreground)
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      console.log("Location permission:", locationStatus);

      // Request Camera
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      console.log("Camera permission:", cameraStatus);

      // Request Notifications
      // NOTE: Push notifications are not supported in Expo Go on Android (SDK 53+).
      // We skip the request if running in Expo Go to avoid crashing.
      const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
      if (!(Platform.OS === "android" && isExpoGo)) {
        const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
        console.log("Notifications permission:", notificationStatus);
      } else {
        console.log("Skipping notification request in Expo Go on Android.");
      }

      // All prompts done, proceed to the next screen
      onContinue();
    } catch (error) {
      console.error("Error requesting permissions:", error);
      // Even if there's an error, we allow continuing (usually handled by individual features later)
      onContinue();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1">
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="flex-1 px-8 pt-8"
        >
          {/* Infographic - Clean & Small */}
          <MotiView className="items-center mb-8">
            <Image
              source={require("../../assets/permissions_sketch.png")}
              style={{ width: width * 0.6, height: 160 }}
              resizeMode="contain"
            />
          </MotiView>

          {/* Text Content */}
          <View className="w-full mb-8">
            <Text className="text-2xl font-bold text-gray-950 tracking-tight">
              Access Requirements
            </Text>
            <Text className="text-gray-400 text-sm mt-1 font-bold">
              Verification required for loan evaluation.
            </Text>
          </View>

          {/* Permissions List */}
          <View className="w-full">
            <PermissionItem
              icon="📷"
              title="Camera Access"
              desc="Required for KYC and document verification."
            />
            <PermissionItem
              icon="📍"
              title="Location Services"
              desc="Help us verify your address for faster processing."
            />
            <PermissionItem
              icon="🔔"
              title="Notifications"
              desc="Stay updated on your application status."
            />
          </View>

          {/* Privacy Note */}
          <View className="bg-gray-50 p-4 rounded-xl mt-2 mb-8 border border-gray-100">
            <Text className="text-gray-600 text-[10px] text-center leading-4 font-medium">
              Your data is encrypted. We will NOT use these permissions for any purpose other than loan evaluation.
            </Text>
          </View>

          {/* Footer Controls */}
          <View className="w-full mt-auto pb-10">
            <Button
              variant="ghost"
              className="!p-0 !min-h-0 !h-auto mb-6 !items-start !justify-start"
              contentClassName="!items-start !justify-start"
              onPress={() => setConsented(!consented)}
            >
              <View className="flex-row items-center w-full">
                <View className="mr-3">
                  <Ionicons
                    name={consented ? "checkbox" : "square-outline"}
                    size={22}
                    color={consented ? "#1d4ed8" : "#64748b"}
                  />
                </View>
                <Text className="flex-1 text-gray-700 font-bold text-xs">
                  I agree to provide the required permissions
                </Text>
              </View>
            </Button>

            <Button
              title="Allow & Continue"
              variant="primary"
              size="lg"
              onPress={handleRequestPermissions}
              disabled={!consented || loading}
              loading={loading}
            />
          </View>
        </MotiView>
      </View>
    </SafeAreaView>
  );
};

import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { MotiView } from "moti";

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

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
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
            <TouchableOpacity
              onPress={() => setConsented(!consented)}
              activeOpacity={0.7}
              className="flex-row items-center mb-6"
            >
              <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${
                consented ? "bg-primary-950 border-primary-950" : "border-gray-200"
              }`}>
                {consented && <Text className="text-white text-[10px]">✓</Text>}
              </View>
              <Text className="text-gray-700 font-bold text-xs">
                I agree to provide the required permissions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onContinue}
              disabled={!consented}
              activeOpacity={0.9}
              className={`h-14 rounded-xl items-center justify-center shadow-sm ${
                consented ? "bg-primary-950" : "bg-gray-100"
              }`}
            >
              <Text className="text-white font-bold text-base">Allow & Continue</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </SafeAreaView>
    </View>
  );
};

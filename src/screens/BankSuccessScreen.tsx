import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

interface BankSuccessScreenProps {
  onContinue: () => void;
}

export const BankSuccessScreen: React.FC<BankSuccessScreenProps> = ({ onContinue }) => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 items-center justify-center">
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 12 }}
          className="items-center"
        >
          <View className="w-64 h-64 bg-slate-50 rounded-full items-center justify-center mb-8 border border-slate-100 overflow-hidden shadow-sm">
            <Image 
              source={require("../../assets/bank_verified_infographic.png")}
              style={{ width: "90%", height: "90%" }}
              resizeMode="contain"
            />
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300 }}
            className="items-center"
          >
            <View className="flex-row items-center justify-center mb-4">
              <View className="bg-green-100 p-2 rounded-full mr-3">
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>
              <Text className="text-3xl font-bold text-slate-900">Verified!</Text>
            </View>
            
            <Text className="text-slate-500 text-center px-8 leading-6 mb-12">
              Your bank account has been successfully verified. You are now eligible for instant disbursement.
            </Text>
          </MotiView>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 600 }}
          className="w-full"
        >
          <TouchableOpacity
            onPress={onContinue}
            activeOpacity={0.8}
            className="h-16 bg-primary-950 rounded-2xl items-center justify-center shadow-lg shadow-primary-200"
          >
            <Text className="text-white text-lg font-bold">Back to Dashboard</Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </SafeAreaView>
  );
};

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

interface KycScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export const KycScreen: React.FC<KycScreenProps> = ({ onNext, onBack }) => {
  const [frontUploaded, setFrontUploaded] = useState(false);
  const [backUploaded, setBackUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isComplete = frontUploaded && backUploaded;

  const handleNext = () => {
    setIsLoading(true);
    // Simulate a brief local state before transitioning to the dummy verification screen
    setTimeout(() => {
      setIsLoading(false);
      onNext();
    }, 800);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center py-4">
          <TouchableOpacity 
            onPress={onBack}
            className="w-10 h-10 items-center justify-center rounded-full bg-slate-50"
          >
            <Ionicons name="arrow-back" size={20} color="#172554" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-xl font-bold text-slate-900 mr-10">
            Identity Verification
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500 }}
            className="mt-6"
          >
            <View className="items-center mb-8">
              <View className="w-full h-48 bg-slate-50 rounded-3xl items-center justify-center border border-slate-100 overflow-hidden">
                <Image 
                  source={require("../../assets/voter_id_infographic.png")}
                  style={{ width: "80%", height: "80%" }}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-slate-900 text-lg font-bold mt-6">Upload Voter ID</Text>
              <Text className="text-slate-500 text-center mt-2 px-6">
                Please upload clear photos of both sides of your Voter Identity Card for instant verification.
              </Text>
            </View>

            {/* Front Upload */}
            <TouchableOpacity 
              onPress={() => setFrontUploaded(true)}
              className={`p-5 rounded-2xl border-2 mb-4 flex-row items-center ${
                frontUploaded ? "border-green-500 bg-green-50" : "border-slate-100 bg-slate-50 border-dashed"
              }`}
            >
              <View className={`w-12 h-12 rounded-xl items-center justify-center ${
                frontUploaded ? "bg-green-500" : "bg-slate-200"
              }`}>
                <Ionicons 
                  name={frontUploaded ? "checkmark-circle" : "image-outline"} 
                  size={24} 
                  color="white" 
                />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-slate-900 font-bold">Front Side</Text>
                <Text className="text-slate-500 text-xs">
                  {frontUploaded ? "Photo uploaded successfully" : "Tap to capture or upload"}
                </Text>
              </View>
              {frontUploaded && (
                <Text className="text-green-600 font-bold text-xs">REPLACE</Text>
              )}
            </TouchableOpacity>

            {/* Back Upload */}
            <TouchableOpacity 
              onPress={() => setBackUploaded(true)}
              className={`p-5 rounded-2xl border-2 mb-10 flex-row items-center ${
                backUploaded ? "border-green-500 bg-green-50" : "border-slate-100 bg-slate-50 border-dashed"
              }`}
            >
              <View className={`w-12 h-12 rounded-xl items-center justify-center ${
                backUploaded ? "bg-green-500" : "bg-slate-200"
              }`}>
                <Ionicons 
                  name={backUploaded ? "checkmark-circle" : "image-outline"} 
                  size={24} 
                  color="white" 
                />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-slate-900 font-bold">Back Side</Text>
                <Text className="text-slate-500 text-xs">
                  {backUploaded ? "Photo uploaded successfully" : "Tap to capture or upload"}
                </Text>
              </View>
              {backUploaded && (
                <Text className="text-green-600 font-bold text-xs">REPLACE</Text>
              )}
            </TouchableOpacity>
          </MotiView>
        </ScrollView>

        {/* Footer Action */}
        <View className="py-6 bg-white">
          <TouchableOpacity
            disabled={!isComplete || isLoading}
            onPress={handleNext}
            activeOpacity={0.8}
            className={`h-14 rounded-xl items-center justify-center shadow-lg ${
              isComplete ? "bg-primary-950 shadow-primary-100" : "bg-slate-200"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className={`text-lg font-bold ${isComplete ? "text-white" : "text-slate-400"}`}>
                Submit for Verification
              </Text>
            )}
          </TouchableOpacity>
          <Text className="text-center text-slate-400 text-xs mt-4">
            Your data is encrypted and securely stored.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

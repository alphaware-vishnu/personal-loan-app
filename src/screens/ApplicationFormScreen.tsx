import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MotiView } from "moti";

interface ApplicationFormScreenProps {
  schemeAmount: string;
  onSubmit: () => void;
  onBack: () => void;
}

const FormField = ({ label, placeholder, value, onChangeText, keyboardType = "default" }: any) => (
  <View className="mb-6">
    <Text className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-3">{label}</Text>
    <View className="bg-gray-50 border border-gray-100 rounded-2xl px-6 h-16 justify-center">
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        className="text-gray-900 font-bold text-lg"
      />
    </View>
  </View>
);

export const ApplicationFormScreen = ({ schemeAmount, onSubmit, onBack }: ApplicationFormScreenProps) => {
  const [income, setIncome] = useState("");
  const [employment, setEmployment] = useState("");
  const [bank, setBank] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center mt-6 mb-8">
            <TouchableOpacity onPress={onBack} className="mr-4 h-10 w-10 items-center justify-center bg-gray-50 rounded-lg">
              <Text className="text-xl">←</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-950 tracking-tight">Application Details</Text>
          </View>

          {/* Scheme Summary Badge */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary-50 p-5 rounded-2xl border border-primary-100 mb-8 flex-row items-center justify-between"
          >
            <View>
              <Text className="text-primary-700 font-bold text-[10px] uppercase tracking-widest">Selected Scheme</Text>
              <Text className="text-xl font-bold text-primary-950 mt-0.5">{schemeAmount}</Text>
            </View>
            <View className="bg-white px-3 py-1.5 rounded-lg border border-primary-100">
              <Text className="text-primary-600 font-bold text-[10px] uppercase">Verify Details</Text>
            </View>
          </MotiView>

          {/* Form Fields */}
          <FormField
            label="Monthly Income"
            placeholder="$5,000"
            value={income}
            onChangeText={setIncome}
            keyboardType="numeric"
          />
          <FormField
            label="Employment Type"
            placeholder="Salaried / Self-Employed"
            value={employment}
            onChangeText={setEmployment}
          />
          <FormField
            label="Primary Bank Name"
            placeholder="e.g. Alphabank"
            value={bank}
            onChangeText={setBank}
          />

          {/* Privacy Disclaimer */}
          <View className="bg-gray-50 p-5 border border-gray-100 rounded-xl mb-10">
            <Text className="text-gray-400 text-[10px] leading-4 font-medium italic">
              By submitting, you agree to allow Alphaware to verify your details securely. We maintain 256-bit encryption for all sensitive data.
            </Text>
          </View>

          <TouchableOpacity
            onPress={onSubmit}
            activeOpacity={0.9}
            className="bg-primary-950 h-14 rounded-xl items-center justify-center shadow-sm mb-10"
          >
            <Text className="text-white font-bold text-base">Submit Application</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

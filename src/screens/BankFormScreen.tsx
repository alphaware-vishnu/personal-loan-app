import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

interface BankFormScreenProps {
  onSubmit: (data: BankDetails) => void;
  onBack: () => void;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
}

export const BankFormScreen: React.FC<BankFormScreenProps> = ({ onSubmit, onBack }) => {
  const [details, setDetails] = useState<BankDetails>({
    accountName: "",
    accountNumber: "",
    ifsc: "",
    branch: "",
  });
  const [photoIdUploaded, setPhotoIdUploaded] = useState(false);
  const [chequeUploaded, setChequeUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid =
    details.accountName.trim().length > 2 &&
    details.accountNumber.trim().length > 8 &&
    details.ifsc.trim().length === 11 &&
    details.branch.trim().length > 2 &&
    photoIdUploaded &&
    chequeUploaded;

  const updateField = (field: keyof BankDetails, value: string) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleFinish = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSubmit(details);
    }, 1200);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
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
              Bank Details
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 500 }}
              className="mt-6"
            >
              <Text className="text-slate-500 mb-8">
                Enter the bank account details where you'd like to receive your loan disbursement.
              </Text>

              {/* Account Holder Name */}
              <View className="mb-6">
                <Text className="text-slate-900 font-bold mb-2 ml-1">Account Holder Name</Text>
                <View className="h-14 bg-slate-50 rounded-xl border border-slate-100 px-4 flex-row items-center">
                  <Ionicons name="person-outline" size={20} color="#64748b" />
                  <TextInput
                    autoCapitalize="words"
                    placeholder="Enter full name"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 ml-3 text-slate-900 font-medium"
                    value={details.accountName}
                    onChangeText={(val) => updateField("accountName", val)}
                  />
                </View>
              </View>

              {/* Account Number */}
              <View className="mb-6">
                <Text className="text-slate-900 font-bold mb-2 ml-1">Account Number</Text>
                <View className="h-14 bg-slate-50 rounded-xl border border-slate-100 px-4 flex-row items-center">
                  <Ionicons name="card-outline" size={20} color="#64748b" />
                  <TextInput
                    keyboardType="number-pad"
                    placeholder="Enter account number"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 ml-3 text-slate-900 font-medium"
                    value={details.accountNumber}
                    onChangeText={(val) => updateField("accountNumber", val)}
                  />
                </View>
              </View>

              {/* IFSC Code */}
              <View className="mb-6">
                <Text className="text-slate-900 font-bold mb-2 ml-1">IFSC Code</Text>
                <View className="h-14 bg-slate-50 rounded-xl border border-slate-100 px-4 flex-row items-center">
                  <Ionicons name="business-outline" size={20} color="#64748b" />
                  <TextInput
                    autoCapitalize="characters"
                    placeholder="e.g. SBIN0001234"
                    placeholderTextColor="#94a3b8"
                    maxLength={11}
                    className="flex-1 ml-3 text-slate-900 font-medium"
                    value={details.ifsc}
                    onChangeText={(val) => updateField("ifsc", val)}
                  />
                </View>
              </View>

              {/* Branch Name */}
              <View className="mb-10">
                <Text className="text-slate-900 font-bold mb-2 ml-1">Branch Name</Text>
                <View className="h-14 bg-slate-50 rounded-xl border border-slate-100 px-4 flex-row items-center">
                  <Ionicons name="location-outline" size={20} color="#64748b" />
                  <TextInput
                    placeholder="Enter branch name"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 ml-3 text-slate-900 font-medium"
                    value={details.branch}
                    onChangeText={(val) => updateField("branch", val)}
                  />
                </View>
              </View>
              {/* Uploads Section */}
              <View className="mb-6">
                <Text className="text-slate-900 font-bold mb-4 ml-1">Required Documents</Text>

                {/* Photo ID */}
                <TouchableOpacity
                  onPress={() => setPhotoIdUploaded(true)}
                  className={`p-4 rounded-xl border-2 mb-4 flex-row items-center ${photoIdUploaded ? "border-green-500 bg-green-50" : "border-slate-100 bg-slate-50 border-dashed"
                    }`}
                >
                  <View className={`w-10 h-10 rounded-lg items-center justify-center ${photoIdUploaded ? "bg-green-500" : "bg-slate-200"
                    }`}>
                    <Ionicons
                      name={photoIdUploaded ? "checkmark-circle" : "camera-outline"}
                      size={20}
                      color="white"
                    />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-slate-900 font-bold text-sm">Valid Photo ID</Text>
                    <Text className="text-slate-500 text-[10px]">
                      {photoIdUploaded ? "ID captured successfully" : "Tap to capture ID photo"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Cancelled Cheque */}
                <TouchableOpacity
                  onPress={() => setChequeUploaded(true)}
                  className={`p-4 rounded-xl border-2 mb-8 flex-row items-center ${chequeUploaded ? "border-green-500 bg-green-50" : "border-slate-100 bg-slate-50 border-dashed"
                    }`}
                >
                  <View className={`w-10 h-10 rounded-lg items-center justify-center ${chequeUploaded ? "bg-green-500" : "bg-slate-200"
                    }`}>
                    <Ionicons
                      name={chequeUploaded ? "checkmark-circle" : "document-text-outline"}
                      size={20}
                      color="white"
                    />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-slate-900 font-bold text-sm">Cancelled Cheque / Passbook</Text>
                    <Text className="text-slate-500 text-[10px]">
                      {chequeUploaded ? "Cheque photo captured" : "Tap to upload cheque photo"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </MotiView>
          </ScrollView>

          {/* Footer Action */}
          <View className="py-6 bg-white">
            <TouchableOpacity
              disabled={!isFormValid || isLoading}
              onPress={handleFinish}
              activeOpacity={0.8}
              className={`h-14 rounded-xl items-center justify-center shadow-lg ${isFormValid ? "bg-primary-950 shadow-primary-100" : "bg-slate-200"
                }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className={`text-lg font-bold ${isFormValid ? "text-white" : "text-slate-400"}`}>
                  Finish Application
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Modal, StyleSheet, Image } from "react-native";
import { MotiView } from "../components/Motion";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../components/Button";
import { DocumentPickerSheet } from "../components/DocumentPickerSheet";
import { SafeAreaView } from "react-native-safe-area-context";

interface BankFormScreenProps {
  onSubmit: () => void;
  onBack: () => void;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
}

import { useLoanStore } from "../store/loanStore";
import { DocumentUploadField } from "../components/DocumentUploadField";

export const BankFormScreen: React.FC<BankFormScreenProps> = ({ onSubmit, onBack }) => {
  const { documentRequirements, uploadedDocs, addCustomerBank } = useLoanStore();
  const [details, setDetails] = useState<BankDetails>({
    accountName: "",
    accountNumber: "",
    ifsc: "",
    branch: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);

  // Find relevant categories and types from dynamic requirements
  const allDocTypes = documentRequirements.flatMap(r => 
    r.availableDocumentTypes.map(t => ({ ...t, categoryId: r.categoryId }))
  );
  
  const passbookReq = allDocTypes.find(t => t.documentName === "Bank-Passbook");
  const houseReq = allDocTypes.find(t => t.documentName === "House Pictures");

  const isFormValid =
    details.accountName.trim().length > 2 &&
    details.accountNumber.trim().length > 8 &&
    details.ifsc.trim().length === 11 &&
    details.branch.trim().length > 2 &&
    (passbookReq ? !!uploadedDocs[passbookReq.id] : true) &&
    (houseReq ? !!uploadedDocs[houseReq.id] : true);

  const updateField = (field: keyof BankDetails, value: string) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleFinish = () => {
    setIsLoading(true);
    
    // Save bank details to store for customer creation
    addCustomerBank({
      accountHolderName: details.accountName,
      accountNo: details.accountNumber,
      bank: "SBI", // Placeholder or fetch from IFSC if possible
      branch: details.branch,
      ifsc: details.ifsc,
      city: "Mumbai", // Default placeholder
      accountType: 'SAVINGS',
      isDefault: true
    });

    // Simulate API save
    setTimeout(() => {
      setIsLoading(false);
      setSuccessModalVisible(true);
    }, 1200);
  };

  const proceedToSanction = () => {
    setSuccessModalVisible(false);
    onSubmit();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
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
              Add Bank Account
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
                    className="flex-1 ml-3 text-slate-900 font-medium text-base"
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
                    className="flex-1 ml-3 text-slate-900 font-medium text-base"
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
                    className="flex-1 ml-3 text-slate-900 font-medium text-base"
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
                    className="flex-1 ml-3 text-slate-900 font-medium text-base"
                    value={details.branch}
                    onChangeText={(val) => updateField("branch", val)}
                  />
                </View>
              </View>

              {/* Uploads Section */}
              <View className="mb-6">
                <Text className="text-slate-900 font-bold mb-4 ml-1">Required Documents</Text>

                {/* Dynamic Document Fields */}
                {passbookReq && (
                  <DocumentUploadField 
                    requirement={passbookReq} 
                    categoryId={passbookReq.categoryId} 
                  />
                )}
                {houseReq && (
                  <DocumentUploadField 
                    requirement={houseReq} 
                    categoryId={houseReq.categoryId} 
                  />
                )}
              </View>
            </MotiView>
          </ScrollView>

          {/* Footer Action */}
          <View className="py-6 bg-white">
            <Button
              title="Add Bank Account"
              variant="primary"
              size="lg"
              disabled={!isFormValid}
              loading={isLoading}
              onPress={handleFinish}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Bank Success Modal */}
      <Modal visible={isSuccessModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.backdrop} />

          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="w-[85%] bg-white rounded-3xl p-8 items-center shadow-2xl"
          >
            <View className="w-20 h-20 bg-primary-50 rounded-full items-center justify-center mb-6 border-4 border-primary-100">
              <Ionicons name="card" size={36} color="#0f172a" />
            </View>

            <Text className="text-2xl font-black text-slate-900 text-center mb-2 tracking-tight">
              Bank Added
            </Text>
            <Text className="text-slate-500 text-center text-sm leading-5 mb-8">
              Your bank account has been successfully verified. You are now eligible for instant disbursement.
            </Text>

            <Button
              title="View Sanction Letter"
              variant="primary"
              className="w-full"
              onPress={proceedToSanction}
            />
          </MotiView>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
});

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { MotiView } from "../components/Motion";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Button } from "../components/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLoanStore } from "../store/loanStore";
import { DocumentUploadField } from "../components/DocumentUploadField";

interface KycScreenProps {
  onNext: () => void;
  onBack: () => void;
}

import { useAuthStore } from "../store/authStore";

export const KycScreen: React.FC<KycScreenProps> = ({ onNext, onBack }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const { documentRequirements, uploadedDocs, setCustomerInfo } = useLoanStore();
  const verifiedMobile = useAuthStore(state => state.mobile);

  const [applicantName, setApplicantName] = useState("Rahul Sharma");
  const [voterIdNumber, setVoterIdNumber] = useState("");
  const [hasConsented, setHasConsented] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Find relevant categories and types from dynamic requirements
  const allDocTypes = documentRequirements.flatMap(r => 
    r.availableDocumentTypes.map(t => ({ ...t, categoryId: r.categoryId }))
  );
  
  const voterFrontReq = allDocTypes.find(t => t.documentName === "Voter-ID Front");
  const voterBackReq = allDocTypes.find(t => t.documentName === "Voter-ID Back");

  const isStep1Complete = 
    (voterFrontReq ? !!uploadedDocs[voterFrontReq.id] : true) && 
    (voterBackReq ? !!uploadedDocs[voterBackReq.id] : true);
    
  const isStep2Complete = 
    applicantName.trim().length > 2 &&
    voterIdNumber.trim().length > 6 && 
    hasConsented;

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else {
      setIsLoading(true);
      
      // Save all customer details to store (Mobile is pulled from Auth)
      setCustomerInfo({
        applicantName,
        mobileNumber: verifiedMobile || "",
        voterId: voterIdNumber,
      });

      // Simulate a brief local state before transitioning
      setTimeout(() => {
        setIsLoading(false);
        onNext();
      }, 800);
    }
  };

  const handleBackLocal = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onBack();
    }
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
              onPress={handleBackLocal}
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
              key={`kyc-step-${step}`} // Force re-render animation when step changes
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
                <Text className="text-slate-900 text-lg font-bold mt-6">
                  {step === 1 ? "Upload PAN Card" : "Verify Details"}
                </Text>
                <Text className="text-slate-500 text-center mt-2 px-6">
                  {step === 1
                    ? "Please upload clear photos of your PAN Card for instant verification."
                    : "Confirm your identity details for the customer profile."}
                </Text>
              </View>

              {step === 1 ? (
                <View>
                  {/* Dynamic Document Fields */}
                  {voterFrontReq && (
                    <DocumentUploadField 
                      requirement={voterFrontReq} 
                      categoryId={voterFrontReq.categoryId} 
                    />
                  )}
                  {voterBackReq && (
                    <DocumentUploadField 
                      requirement={voterBackReq} 
                      categoryId={voterBackReq.categoryId} 
                    />
                  )}
                </View>
              ) : (
                <View>
                  {/* Applicant Name Input */}
                  <View className="mb-6">
                    <Text className="text-slate-900 font-bold mb-2 ml-1">Full Name</Text>
                    <View className="h-14 bg-slate-50 rounded-xl border border-slate-100 px-4 flex-row items-center">
                      <Ionicons name="person-outline" size={20} color="#64748b" />
                      <TextInput
                        autoCapitalize="words"
                        placeholder="Enter full name"
                        placeholderTextColor="#94a3b8"
                        className="flex-1 ml-3 text-slate-900 font-medium text-base"
                        value={applicantName}
                        onChangeText={setApplicantName}
                      />
                    </View>
                  </View>

                  {/* PAN Card Number Input */}
                  <View className="mb-6">
                    <Text className="text-slate-900 font-bold mb-2 ml-1">PAN Number</Text>
                    <View className="h-14 bg-slate-50 rounded-xl border border-slate-100 px-4 flex-row items-center">
                      <Ionicons name="card-outline" size={20} color="#64748b" />
                      <TextInput
                        autoCapitalize="characters"
                        placeholder="e.g. ABC1234567"
                        placeholderTextColor="#94a3b8"
                        className="flex-1 ml-3 text-slate-900 font-medium text-base"
                        value={voterIdNumber}
                        onChangeText={setVoterIdNumber}
                        maxLength={10}
                      />
                    </View>
                  </View>

                  {/* Consent Checkbox */}
                  <Button
                    variant="ghost"
                    className="!p-0 h-20 !min-h-0 mb-10 !items-start !justify-start"
                    contentClassName="!items-start !justify-start"
                    onPress={() => setHasConsented(!hasConsented)}
                  >
                    <View className="flex-row items-start w-full">
                      <View className="mt-0.5 mr-4">
                        <Ionicons
                          name={hasConsented ? "checkbox" : "square-outline"}
                          size={24}
                          color={hasConsented ? "#1d4ed8" : "#64748b"}
                        />
                      </View>
                      <Text className="flex-1 text-slate-700 font-medium leading-5 text-left text-sm pt-0.5">
                        I hereby consent to the use of my PAN Card details for identity verification and loan evaluation purposes.
                      </Text>
                    </View>
                  </Button>
                </View>
              )}

            </MotiView>
          </ScrollView>

          {/* Footer Action */}
          <View className="py-6 bg-white">
            <Button
              title={step === 1 ? "Next" : "Submit for Verification"}
              variant="primary"
              size="lg"
              onPress={handleNext}
              disabled={step === 1 ? !isStep1Complete : !isStep2Complete}
              loading={isLoading}
            />
            <Text className="text-center text-slate-400 text-xs mt-4">
              Your data is encrypted and securely stored.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


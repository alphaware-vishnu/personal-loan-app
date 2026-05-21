import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ToastAndroid } from "react-native";
import { MotiView } from "../components/Motion";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Button } from "../components/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useLoanStore } from "../store/loanStore";
import { DocumentUploadField } from "../components/DocumentUploadField"

interface KycScreenProps {
  onNext: () => void;
  onBack: () => void;
}

import { useAuthStore } from "../store/authStore";
import { createCustomer, calculateEmi } from "../services/api";
import { cleanNameInput } from "../utils";
import Toast from 'react-native-toast-message';



export const KycScreen: React.FC<KycScreenProps> = ({ onNext, onBack }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const { 
    documentRequirements, 
    uploadedDocs, 
    setCustomerInfo, 
    customerId,
    requestedAmount,
    interest,
    tenure,
    repaymentFrequency,
    schemeMasterId,
    setCalculationResults
  } = useLoanStore();

  const verifiedMobile = useAuthStore(state => state.mobile);

  // Find relevant categories and types from dynamic requirements
  const allDocTypes = documentRequirements.flatMap(r => 
    r.availableDocumentTypes.map(t => ({ ...t, categoryId: r.categoryId }))
  );
  
  const voterFrontReq = allDocTypes.find(t => t.documentName === "Voter-ID Front");
  const voterBackReq = allDocTypes.find(t => t.documentName === "Voter-ID Back");

  const validationSchema = Yup.object().shape({
    applicantName: Yup.string()
      .min(3, "Full name must be at least 3 characters")
      .matches(/^[a-zA-Z\s]*$/, "Special characters and numbers are not allowed")
      .required("Full name is required"),
    panNumber: Yup.string()
      .length(10, "PAN must be exactly 10 characters")
      .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format")
      .required("PAN number is required"),
    hasConsented: Yup.boolean().oneOf([true], "Consent is required"),
  });

  const kycMutation = useMutation({
    mutationFn: async (payload: { customer: any; calculation: any }) => {
      await createCustomer(payload.customer);
      return await calculateEmi(payload.calculation);
    },
    onSuccess: (calcResponse) => {
      if (calcResponse.data.data) {
        const { emi, disbursementAmount } = calcResponse.data.data;
        setCalculationResults(emi, disbursementAmount);
      }
      onNext();
    },
    onError: (error: any) => {
      console.error('[KYC] Error:', error?.response?.data || error.message);
      const errorMsg = error.response?.data?.message || "Failed to process KYC details";
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: errorMsg,
        position: 'top'
      });
    }
  });

  const formik = useFormik({
    initialValues: {
      applicantName: "Rahul Sharma",
      panNumber: "",
      hasConsented: false,
    },
    validationSchema,
    onSubmit: (values) => {
      const customerPayload = {
        id: customerId,
        mobileNumber: verifiedMobile || "",
        applicantName: values.applicantName,
        branchId: 1,
        age: 25,
        gender: "MALE",
        leadSource: "ALFIN",
        voterId: values.panNumber,
        isVoterIdActive: true
      };

      const calculationPayload = {
        requestedAmount: requestedAmount,
        interest: interest,
        tenure: tenure,
        repaymentFrequency: repaymentFrequency,
        repaymentDate: "",
        schemeMasterId: String(schemeMasterId)
      };

      setCustomerInfo({
        applicantName: values.applicantName,
        mobileNumber: verifiedMobile || "",
        panNumber: values.panNumber,
      });

      kycMutation.mutate({ customer: customerPayload, calculation: calculationPayload });
    },
  });

  const isStep1Complete = 
    (voterFrontReq ? !!uploadedDocs[voterFrontReq.id] : true) && 
    (voterBackReq ? !!uploadedDocs[voterBackReq.id] : true);
    
  const isStep2Complete = formik.isValid && formik.dirty;

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else {
      formik.handleSubmit();
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
                    <View className={`h-14 bg-slate-50 rounded-xl border px-4 flex-row items-center ${formik.touched.applicantName && formik.errors.applicantName ? 'border-red-500' : 'border-slate-100'}`}>
                      <Ionicons name="person-outline" size={20} color={formik.touched.applicantName && formik.errors.applicantName ? '#ef4444' : '#64748b'} />
                      <TextInput
                        autoCapitalize="words"
                        placeholder="Enter full name"
                        placeholderTextColor="#94a3b8"
                        className="flex-1 ml-3 text-slate-900 font-medium text-base"
                        value={formik.values.applicantName}
                        onBlur={formik.handleBlur('applicantName')}
                        onChangeText={(val) => {
                          if (/[^a-zA-Z\s]/.test(val)) {
                            console.log('[KYC] Invalid char detected. Showing toast.');
                            Toast.show({
                              type: 'info',
                              text1: 'Invalid Character',
                              text2: 'Numbers and special characters are not allowed.',
                              position: 'top',
                              visibilityTime: 2000,
                            });

                            if (Platform.OS === 'android') {
                              ToastAndroid.show('Special characters not allowed', ToastAndroid.SHORT);
                            }
                          }
                          formik.setFieldValue("applicantName", val);
                        }}
                      />
                    </View>
                    {formik.touched.applicantName && formik.errors.applicantName && (
                      <Text className="text-red-500 text-[10px] font-bold mt-1 ml-1">{formik.errors.applicantName}</Text>
                    )}
                  </View>

              {/* PAN Card Number Input */}
              <View className="mb-6">
                <Text className="text-slate-900 font-bold mb-2 ml-1">PAN Number</Text>
                <View className={`h-14 bg-slate-50 rounded-xl border px-4 flex-row items-center ${formik.touched.panNumber && formik.errors.panNumber ? 'border-red-500' : 'border-slate-100'}`}>
                  <Ionicons name="card-outline" size={20} color={formik.touched.panNumber && formik.errors.panNumber ? '#ef4444' : '#64748b'} />
                  <TextInput
                    autoCapitalize="characters"
                    placeholder="e.g. ABCDE1234F"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 ml-3 text-slate-900 font-medium text-base"
                    value={formik.values.panNumber}
                    onBlur={formik.handleBlur('panNumber')}
                    onChangeText={formik.handleChange('panNumber')}
                    maxLength={10}
                  />
                </View>
                {formik.touched.panNumber && formik.errors.panNumber && (
                  <Text className="text-red-500 text-[10px] font-bold mt-1 ml-1">{formik.errors.panNumber}</Text>
                )}
              </View>

              {/* Consent Checkbox */}
              <View>
                <Button
                  variant="ghost"
                  className="!p-0 h-20 !min-h-0 !items-start !justify-start"
                  contentClassName="!items-start !justify-start"
                  onPress={() => formik.setFieldValue('hasConsented', !formik.values.hasConsented)}
                >
                  <View className="flex-row items-start w-full">
                    <View className="mt-0.5 mr-4">
                      <Ionicons
                        name={formik.values.hasConsented ? "checkbox" : "square-outline"}
                        size={24}
                        color={formik.values.hasConsented ? "#1d4ed8" : "#64748b"}
                      />
                    </View>
                    <Text className="flex-1 text-slate-700 font-medium leading-5 text-left text-sm pt-0.5">
                      I hereby consent to the use of my PAN Card details for identity verification and loan evaluation purposes.
                    </Text>
                  </View>
                </Button>
                {formik.touched.hasConsented && formik.errors.hasConsented && (
                  <Text className="text-red-500 text-[10px] font-bold mt-1 ml-1">{formik.errors.hasConsented}</Text>
                )}
              </View>
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
              loading={kycMutation.isPending}
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


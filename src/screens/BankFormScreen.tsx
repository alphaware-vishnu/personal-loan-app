import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Modal, StyleSheet, Image, ToastAndroid } from "react-native";
import { MotiView } from "../components/Motion";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../components/Button";
import { DocumentPickerSheet } from "../components/DocumentPickerSheet";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";

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
import { updateStepStatus, pennyDrop } from "../services/api";
import { cleanNameInput } from "../utils";
import Toast from 'react-native-toast-message';

export const BankFormScreen: React.FC<BankFormScreenProps> = ({ onSubmit, onBack }) => {
  const { documentRequirements, uploadedDocs, addCustomerBank, applicationId } = useLoanStore();
  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);

  const [verificationState, setVerificationState] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [verifiedName, setVerifiedName] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [lastVerifiedKey, setLastVerifiedKey] = useState("");

  const triggerPennyDrop = async (accNum: string, ifscCode: string) => {
    setVerificationState('verifying');
    setVerificationError('');
    try {
      const response = await pennyDrop({ accountNumber: accNum, ifscCode });
      const data = response?.data || response;
      if (data && data.beneficiaryName) {
        setVerificationState('success');
        setVerifiedName(data.beneficiaryName);
        setLastVerifiedKey(`${accNum}_${ifscCode}`);
        formik.setFieldValue('accountName', data.beneficiaryName);
        Toast.show({
          type: 'success',
          text1: 'Bank Account Verified',
          text2: `Beneficiary Name: ${data.beneficiaryName}`,
          position: 'top',
        });
      } else {
        throw new Error("Beneficiary name not found");
      }
    } catch (err: any) {
      console.error("Penny drop failed:", err);
      setVerificationState('failed');
      const errorMsg = err.response?.data?.message || err.message || "Failed to verify bank account";
      setVerificationError(errorMsg);
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: errorMsg,
        position: 'top',
      });
    }
  };

  // Find relevant categories and types from dynamic requirements
  const allDocTypes = documentRequirements.flatMap(r => 
    r.availableDocumentTypes.map(t => ({ ...t, categoryId: r.categoryId }))
  );
  
  const passbookReq = allDocTypes.find(t => t.documentName === "Bank-Passbook");
  const houseReq = allDocTypes.find(t => t.documentName === "House Pictures");

  const validationSchema = Yup.object().shape({
    accountName: Yup.string()
      .min(3, "Name must be at least 3 characters")
      .matches(/^[a-zA-Z\s]*$/, "Special characters and numbers are not allowed")
      .required("Account holder name is required"),
    accountNumber: Yup.string()
      .min(9, "Account number must be at least 9 digits")
      .matches(/^[0-9]*$/, "Only digits are allowed")
      .required("Account number is required"),
    ifsc: Yup.string()
      .length(11, "IFSC must be exactly 11 characters")
      .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC format")
      .required("IFSC code is required"),
    branch: Yup.string()
      .min(3, "Branch name is too short")
      .required("Branch name is required"),
  });

  const statusMutation = useMutation({
    mutationFn: (data: { id: number; status: any }) => updateStepStatus(data.id, data.status),
    onSuccess: () => {
      setSuccessModalVisible(true);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || "Failed to update application status";
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: errorMsg,
        position: 'top'
      });
    }
  });

  const formik = useFormik({
    initialValues: {
      accountName: "",
      accountNumber: "",
      ifsc: "",
      branch: "",
    },
    validationSchema,
    onSubmit: (values) => {
      addCustomerBank({
        accountHolderName: values.accountName,
        accountNo: values.accountNumber,
        bank: "SBI",
        branch: values.branch,
        ifsc: values.ifsc,
        city: "Mumbai",
        accountType: 'SAVINGS',
        isDefault: true
      });

      if (applicationId) {
        statusMutation.mutate({ 
          id: applicationId, 
          status: { bankVerificationCompleted: true } 
        });
      } else {
        setSuccessModalVisible(true);
      }
    },
  });

  const cleanAcc = (formik.values.accountNumber || "").trim();
  const cleanIfsc = (formik.values.ifsc || "").trim().toUpperCase();

  const isValidAcc = /^[0-9]{9,18}$/.test(cleanAcc);
  const isValidIfsc = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc);

  React.useEffect(() => {
    if (isValidAcc && isValidIfsc) {
      const key = `${cleanAcc}_${cleanIfsc}`;
      if (key !== lastVerifiedKey && verificationState !== 'verifying') {
        triggerPennyDrop(cleanAcc, cleanIfsc);
      }
    } else {
      if (verificationState !== 'idle') {
        setVerificationState('idle');
        setVerifiedName('');
        setVerificationError('');
      }
    }
  }, [formik.values.accountNumber, formik.values.ifsc, isValidAcc, isValidIfsc]);

  const isFormValid =
    formik.isValid &&
    formik.dirty &&
    verificationState === 'success' &&
    (passbookReq ? !!uploadedDocs[passbookReq.id] : true) &&
    (houseReq ? !!uploadedDocs[houseReq.id] : true);

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
                <View className={`h-14 bg-slate-50 rounded-xl border px-4 flex-row items-center ${formik.touched.accountName && formik.errors.accountName ? 'border-red-500' : 'border-slate-100'}`}>
                  <Ionicons name="person-outline" size={20} color={formik.touched.accountName && formik.errors.accountName ? '#ef4444' : '#64748b'} />
                  <TextInput
                    autoCapitalize="words"
                    placeholder="Enter full name"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 ml-3 text-slate-900 font-medium text-base"
                    value={formik.values.accountName}
                    onBlur={formik.handleBlur('accountName')}
                    editable={verificationState !== 'success'}
                    onChangeText={(val) => {
                      if (/[^a-zA-Z\s]/.test(val)) {
                        Toast.show({
                          type: 'info',
                          text1: 'Invalid Character',
                          text2: 'Numbers and special characters are not allowed.',
                          position: 'top',
                        });
                        if (Platform.OS === 'android') {
                          ToastAndroid.show('Special characters not allowed', ToastAndroid.SHORT);
                        }
                      }
                      formik.setFieldValue("accountName", val);
                    }}
                  />
                  {verificationState === 'success' && (
                    <View className="bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg flex-row items-center">
                      <Ionicons name="checkmark-circle" size={12} color="#059669" />
                      <Text className="text-emerald-700 text-[10px] font-black ml-1 uppercase">Verified</Text>
                    </View>
                  )}
                </View>
                {formik.touched.accountName && formik.errors.accountName && (
                  <Text className="text-red-500 text-[10px] font-bold mt-1 ml-1">{formik.errors.accountName}</Text>
                )}
              </View>

              {/* Account Number */}
              <View className="mb-6">
                <Text className="text-slate-900 font-bold mb-2 ml-1">Account Number</Text>
                <View className={`h-14 bg-slate-50 rounded-xl border px-4 flex-row items-center ${formik.touched.accountNumber && formik.errors.accountNumber ? 'border-red-500' : 'border-slate-100'}`}>
                  <Ionicons name="card-outline" size={20} color={formik.touched.accountNumber && formik.errors.accountNumber ? '#ef4444' : '#64748b'} />
                  <TextInput
                    keyboardType="number-pad"
                    placeholder="Enter account number"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 ml-3 text-slate-900 font-medium text-base"
                    value={formik.values.accountNumber}
                    onBlur={formik.handleBlur('accountNumber')}
                    onChangeText={formik.handleChange('accountNumber')}
                  />
                </View>
                {formik.touched.accountNumber && formik.errors.accountNumber && (
                  <Text className="text-red-500 text-[10px] font-bold mt-1 ml-1">{formik.errors.accountNumber}</Text>
                )}
              </View>

              {/* IFSC Code */}
              <View className="mb-6">
                <Text className="text-slate-900 font-bold mb-2 ml-1">IFSC Code</Text>
                <View className={`h-14 bg-slate-50 rounded-xl border px-4 flex-row items-center ${formik.touched.ifsc && formik.errors.ifsc ? 'border-red-500' : 'border-slate-100'}`}>
                  <Ionicons name="business-outline" size={20} color={formik.touched.ifsc && formik.errors.ifsc ? '#ef4444' : '#64748b'} />
                  <TextInput
                    autoCapitalize="characters"
                    placeholder="e.g. SBIN0001234"
                    placeholderTextColor="#94a3b8"
                    maxLength={11}
                    className="flex-1 ml-3 text-slate-900 font-medium text-base"
                    value={formik.values.ifsc}
                    onBlur={formik.handleBlur('ifsc')}
                    onChangeText={formik.handleChange('ifsc')}
                  />
                </View>
                {formik.touched.ifsc && formik.errors.ifsc && (
                  <Text className="text-red-500 text-[10px] font-bold mt-1 ml-1">{formik.errors.ifsc}</Text>
                )}
              </View>

              {/* Automatic Bank Verification Status */}
              {verificationState !== 'idle' && (
                <MotiView
                  from={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mb-6 p-4 rounded-xl border flex-row items-center ${
                    verificationState === 'verifying'
                      ? 'bg-amber-50 border-amber-200'
                      : verificationState === 'success'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <View className="mr-3">
                    {verificationState === 'verifying' ? (
                      <Ionicons name="sync-outline" size={20} color="#d97706" />
                    ) : verificationState === 'success' ? (
                      <Ionicons name="checkmark-circle-outline" size={20} color="#059669" />
                    ) : (
                      <Ionicons name="alert-circle-outline" size={20} color="#dc2626" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`text-xs font-bold ${
                      verificationState === 'verifying'
                        ? 'text-amber-800'
                        : verificationState === 'success'
                        ? 'text-emerald-800'
                        : 'text-red-800'
                    }`}>
                      {verificationState === 'verifying'
                        ? 'Verifying bank details automatically...'
                        : verificationState === 'success'
                        ? 'Account Verified'
                        : 'Verification Failed'}
                    </Text>
                    <Text className={`text-[10px] font-medium mt-0.5 ${
                      verificationState === 'verifying'
                        ? 'text-amber-600'
                        : verificationState === 'success'
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}>
                      {verificationState === 'verifying'
                        ? 'We are running a penny-drop to check your bank details.'
                        : verificationState === 'success'
                        ? `Beneficiary Name: ${verifiedName}`
                        : verificationError || 'Invalid details or verification timeout.'}
                    </Text>
                  </View>
                </MotiView>
              )}

              {/* Branch Name */}
              <View className="mb-10">
                <Text className="text-slate-900 font-bold mb-2 ml-1">Branch Name</Text>
                <View className={`h-14 bg-slate-50 rounded-xl border px-4 flex-row items-center ${formik.touched.branch && formik.errors.branch ? 'border-red-500' : 'border-slate-100'}`}>
                  <Ionicons name="location-outline" size={20} color={formik.touched.branch && formik.errors.branch ? '#ef4444' : '#64748b'} />
                  <TextInput
                    placeholder="Enter branch name"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 ml-3 text-slate-900 font-medium text-base"
                    value={formik.values.branch}
                    onBlur={formik.handleBlur('branch')}
                    onChangeText={formik.handleChange('branch')}
                  />
                </View>
                {formik.touched.branch && formik.errors.branch && (
                  <Text className="text-red-500 text-[10px] font-bold mt-1 ml-1">{formik.errors.branch}</Text>
                )}
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
              loading={statusMutation.isPending}
              onPress={()=>formik.handleSubmit()}
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

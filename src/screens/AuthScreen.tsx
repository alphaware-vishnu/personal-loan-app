import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MotiView } from "../components/Motion";
import { Button } from "../components/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { sendOtp, verifyOtp, getCustomerById } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useLoanStore } from "../store/loanStore";
import { QueryError } from "@/types/query.type";

const { width } = Dimensions.get("window");
const OTP_LENGTH = 4;

interface AuthScreenProps {
  onVerify: (isExisting: boolean) => void;
}

export const AuthScreen = ({ onVerify }: AuthScreenProps) => {
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showError, setShowError] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const inputRef = useRef<TextInput>(null);



  const hydrateCustomerData = useLoanStore((state) => state.hydrateCustomerData);

  const verifyOtpMutation = useMutation({
    mutationFn: (data: { mobile: string; otp: string; skipOtp: boolean }) =>
      verifyOtp(data),
    onSuccess: async (response: any) => {
      const data = response?.data?.data;
      if (data) {
        setAuth(data, mobile);
        
        // Check if existing customer
        if (data.customerId) {
          try {
            console.log('[Auth] Checking customer existence for ID:', data.customerId);
            const customerResponse = await getCustomerById(data.customerId);
            const customerData = customerResponse.data?.data;
            console.log(customerData, 'customer data 111');

            // Handle both array and object responses correctly
            const actualCustomer = Array.isArray(customerData) ? customerData[0] : customerData;

            // User specified: "applicantName as null" means customer does not exist
            const exists = !!(actualCustomer && actualCustomer.applicantName);

            if (exists) {
              console.log('[Auth] Existing customer profile found (applicantName present).');
              hydrateCustomerData(actualCustomer);
              onVerify(true);
              return;
            } else {
              console.log('[Auth] Customer profile incomplete (applicantName is null/missing). Treating as new user.');
            }
          } catch (error) {
            console.error('[Auth] Failed to fetch customer data:', error);
          }
        }
      }
      onVerify(false);
    },
    onError: (error: QueryError) => {
      setShowError(true);
      setOtp("");
      console.log('verifuy errr', error.response?.data.message)
    },
  });

  const handleMobileSubmit = () => {
    if (mobile.length === 10) {
      setStep("otp");
      setShowError(false);
    }
  };

  const handleVerify = () => {
    if (otp.length === OTP_LENGTH && !verifyOtpMutation.isPending) {
      verifyOtpMutation.mutate({ mobile: `91${mobile}`, otp, skipOtp: true });
    }
  };

  // ❌ Removed auto-trigger to prevent freeze
  // useEffect(() => {
  //   if (otp.length === OTP_LENGTH) {
  //     handleVerify();
  //   }
  // }, [otp]);

  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [step]);

  const renderOtpCell = (index: number) => {
    const digit = otp[index] || "";
    const isActive = index === otp.length && isFocused;
    const isFilled = index < otp.length;

    return (
      <View
        key={index}
        className={`w-14 h-18 rounded-xl items-center justify-center border-2 ${isActive
          ? "bg-white border-red-600"
          : isFilled || showError
            ? "bg-white border-red-600"
            : "bg-gray-50 border-gray-100"
          }`}
      >
        <Text className="text-2xl font-bold text-gray-950">{digit}</Text>

        {isActive && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ loop: true, duration: 500 }}
            className="w-0.5 h-6 bg-red-600 absolute"
          />
        )}
      </View>
    );
  };

  verifyOtpMutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 px-8"
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 500 }}
          className="flex-1"
        >
          {/* Header */}
          <View className="mt-8 mb-6">
            <TouchableOpacity
              
              className="mb-8 h-12 w-12 items-center justify-center bg-white rounded-full border border-gray-100"
              onPress={() =>
                step === "otp" ? setStep("mobile") : null
              }
            >
              <Text className="text-2xl">←</Text>
            </TouchableOpacity>

            <Text className="text-3xl font-bold">
              {step === "mobile"
                ? "Enter your mobile number"
                : "Verify account with OTP"}
            </Text>

            <Text className="text-gray-500 mt-2">
              {step === "mobile"
                ? "Manage your loans and accounts"
                : `Code sent to +91 ${mobile}`}
            </Text>
          </View>

          {/* Image */}
          <View className="items-center mb-8">
            <Image
              source={
                step === "mobile"
                  ? require("../../assets/auth_mobile_sketch.png")
                  : require("../../assets/auth_otp_sketch.png")
              }
              style={{ width: width * 0.6, height: 160 }}
              resizeMode="contain"
            />
          </View>

          {/* Input */}
          {step === "mobile" ? (
            <View>
              <TextInput
                placeholder="Enter mobile"
                keyboardType="numeric"
                maxLength={10}
                value={mobile}
                onChangeText={setMobile}
                className="border border-slate-200 p-4 rounded-xl mb-6"
              />

              <Button
                title="Continue"
                variant="primary"
                onPress={handleMobileSubmit}
                disabled={mobile.length !== 10}
              />
            </View>
          ) : (
            <View>
              <Pressable
                onPress={() => inputRef.current?.focus()}
                className="flex-row justify-between mb-6"
              >
                {[0, 1, 2, 3].map(renderOtpCell)}
              </Pressable>

              {/* ✅ FIXED hidden input */}
              <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={(val) => {
                  setOtp(val.replace(/[^0-9]/g, ""));
                  if (showError) setShowError(false);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                maxLength={OTP_LENGTH}
               
                keyboardType="number-pad"
                caretHidden
                style={styles.hiddenInput}
              />

              {showError && (
                <Text className="text-red-500 mt-4 mb-4">
                  Incorrect OTP
                </Text>
              )}

              <Button
                title="Verify"
                variant="primary"
                onPress={handleVerify}
                disabled={otp.length !== OTP_LENGTH}
                loading={verifyOtpMutation.isPending}
              />
            </View>
          )}
        </MotiView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});
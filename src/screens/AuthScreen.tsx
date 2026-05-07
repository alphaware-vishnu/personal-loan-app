import React, { useState, useRef, useEffect, useCallback } from "react";
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
  StyleSheet,
  ScrollView,
} from "react-native";
import { Button } from "../components/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { sendOtp, verifyOtp, getCustomerById } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useLoanStore } from "../store/loanStore";
import { QueryError } from "@/types/query.type";

const { width } = Dimensions.get("window");
const OTP_LENGTH = 4;

// ──────────────────────────────────────────────
// Mobile Number Input Screen
// ──────────────────────────────────────────────
interface MobileScreenProps {
  mobile: string;
  setMobile: (val: string) => void;
  onSubmit: () => void;
}

const MobileScreen = ({ mobile, setMobile, onSubmit }: MobileScreenProps) => {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-7">
            {/* Illustration */}
            <View className="items-center mt-12 mb-4">
              <Image
                source={require("../../assets/auth_mobile_sketch.png")}
                style={{ width: width * 0.55, height: 180 }}
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <Text className="text-3xl font-black text-slate-900 mb-2">
              Welcome Back!
            </Text>
            <Text className="text-base text-slate-500 leading-6 mb-8">
              Don't worry! Enter the mobile number associated with your account.
            </Text>

            {/* Label */}
            <Text className="text-sm font-bold text-slate-700 mb-2 ml-1">
              Mobile Number
            </Text>

            {/* Input */}
            <View className="flex-row items-center border border-slate-200 rounded-2xl mb-8 bg-slate-50/50">
              <Text className="pl-4 pr-2 text-base text-slate-500 font-medium">
                +91
              </Text>
              <View className="w-px h-6 bg-slate-200" />
              <TextInput
                placeholder="Enter mobile number"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={10}
                value={mobile}
                onChangeText={(val) => setMobile(val.replace(/[^0-9]/g, ""))}
                className="flex-1 p-4 text-base text-slate-900 font-medium"
              />
            </View>

            {/* Submit Button */}
            <Button
              title="Submit"
              variant="primary"
              size="lg"
              onPress={onSubmit}
              disabled={mobile.length !== 10}
              className="bg-orange-500 border-orange-500 shadow-orange-200"
            />

            {/* Spacer to push content up from bottom */}
            <View className="flex-1" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ──────────────────────────────────────────────
// OTP Verification Screen
// ──────────────────────────────────────────────
interface OtpScreenProps {
  mobile: string;
  onBack: () => void;
  onVerify: (isExisting: boolean) => void;
}

const OtpScreen = ({ mobile, onBack, onVerify }: OtpScreenProps) => {
  const [otp, setOtp] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showError, setShowError] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const hydrateCustomerData = useLoanStore((state) => state.hydrateCustomerData);
  const inputRef = useRef<TextInput>(null);

  // Auto-focus the hidden input on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 500);
    return () => clearTimeout(t);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const verifyOtpMutation = useMutation({
    mutationFn: (data: { mobile: string; otp: string; skipOtp: boolean }) =>
      verifyOtp(data),
    onSuccess: async (response: any) => {
      const data = response?.data?.data;
      if (data) {
        setAuth(data, mobile);

        if (data.customerId) {
          try {
            const customerResponse = await getCustomerById(data.customerId);
            const customerData = customerResponse.data?.data;
            const actualCustomer = Array.isArray(customerData)
              ? customerData[0]
              : customerData;
            const exists = !!(actualCustomer && actualCustomer.applicantName);

            if (exists) {
              hydrateCustomerData(actualCustomer);
              onVerify(true);
              return;
            }
          } catch (error) {
            console.error("[Auth] Failed to fetch customer data:", error);
          }
        }
      }
      onVerify(false);
    },
    onError: (error: QueryError) => {
      setShowError(true);
      setOtp("");
    },
  });

  const handleVerify = useCallback(() => {
    if (otp.length === OTP_LENGTH && !verifyOtpMutation.isPending) {
      verifyOtpMutation.mutate({ mobile: `91${mobile}`, otp, skipOtp: true });
    }
  }, [otp, mobile, verifyOtpMutation]);

  const handleResend = useCallback(() => {
    if (!canResend) return;
    setTimer(30);
    setCanResend(false);
    sendOtp(`91${mobile}`);
  }, [canResend, mobile]);

  const formatTime = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // Format mobile number for display
  const formattedMobile = `+91 ${mobile.slice(0, 3)} ${mobile.slice(3, 6)} ${mobile.slice(6)}`;

  const renderOtpCell = (index: number) => {
    const digit = otp[index] || "";
    const isActive = index === otp.length && isFocused;
    const isFilled = index < otp.length;

    return (
      <View
        key={index}
        style={[
          styles.otpCell,
          isActive && styles.otpCellActive,
          isFilled && styles.otpCellFilled,
          showError && styles.otpCellError,
        ]}
      >
        <Text
          style={[
            styles.otpDigit,
            isActive && styles.otpDigitActive,
          ]}
        >
          {digit}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-7">
            {/* Back Button */}
            <TouchableOpacity
              onPress={onBack}
              className="mt-4 mb-2 h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white"
              activeOpacity={0.7}
            >
              <Text className="text-xl text-slate-700">←</Text>
            </TouchableOpacity>

            {/* Illustration */}
            <View className="items-center mt-2 mb-4">
              <Image
                source={require("../../assets/auth_otp_sketch.png")}
                style={{ width: width * 0.5, height: 160 }}
                resizeMode="contain"
              />
            </View>

            {/* Title */}
            <Text className="text-3xl font-black text-slate-900 mb-2">
              Enter OTP
            </Text>
            <Text className="text-base text-slate-500 leading-6 mb-8">
              Please enter the verification code sent to{" "}
              <Text className="font-bold text-slate-800">{formattedMobile}</Text>
            </Text>

            {/* OTP Input Cells */}
            <Pressable
              onPress={() => {
                // Blur first then refocus on next tick to guarantee keyboard opens
                inputRef.current?.blur();
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              style={styles.otpContainer}
            >
              {Array.from({ length: OTP_LENGTH }).map((_, i) => renderOtpCell(i))}
            </Pressable>

            {/* Hidden TextInput for keyboard */}
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
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              caretHidden
              style={styles.hiddenInput}
            />

            {/* Timer + Resend */}
            <View className="flex-row items-center justify-center mt-6 mb-8">
              {!canResend && (
                <Text className="text-orange-500 font-bold mr-3 text-base">
                  {formatTime(timer)}
                </Text>
              )}
              <Text className="text-slate-500 text-sm">
                Don't receive OTP code?
              </Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={!canResend}
                className="ml-2"
              >
                <Text
                  className={`font-bold text-sm ${
                    canResend ? "text-orange-500" : "text-slate-300"
                  }`}
                >
                  Resend Code
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error */}
            {showError && (
              <View className="bg-red-50 p-4 rounded-2xl mb-4 border border-red-100">
                <Text className="text-red-500 font-bold text-center">
                  Incorrect OTP. Please try again.
                </Text>
              </View>
            )}

            {/* Verify Button */}
            <Button
              title="Verify & Proceed"
              variant="primary"
              size="lg"
              onPress={handleVerify}
              disabled={otp.length !== OTP_LENGTH}
              loading={verifyOtpMutation.isPending}
              className="bg-orange-500 border-orange-500 shadow-orange-200"
            />

            <View className="flex-1" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ──────────────────────────────────────────────
// Main Auth Screen (orchestrator)
// ──────────────────────────────────────────────
interface AuthScreenProps {
  onVerify: (isExisting: boolean) => void;
}

export const AuthScreen = ({ onVerify }: AuthScreenProps) => {
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");

  const handleMobileSubmit = () => {
    if (mobile.length === 10) {
      setStep("otp");
    }
  };

  if (step === "otp") {
    return (
      <OtpScreen
        mobile={mobile}
        onBack={() => setStep("mobile")}
        onVerify={onVerify}
      />
    );
  }

  return (
    <MobileScreen
      mobile={mobile}
      setMobile={setMobile}
      onSubmit={handleMobileSubmit}
    />
  );
};

// ──────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────
const styles = StyleSheet.create({
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  otpCell: {
    width: 48,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  otpCellActive: {
    borderColor: "#f97316",
    backgroundColor: "#fff",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  otpCellFilled: {
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  otpCellError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  otpDigitActive: {
    color: "#f97316",
  },
});
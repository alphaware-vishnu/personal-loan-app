import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  Pressable,
} from "react-native";
import { MotiView, AnimatePresence } from "moti";

const { width } = Dimensions.get("window");

interface AuthScreenProps {
  onVerify: () => void;
}

export const AuthScreen = ({ onVerify }: AuthScreenProps) => {
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef<TextInput>(null);

  const handleMobileSubmit = () => {
    if (mobile.length >= 10) {
      setStep("otp");
    }
  };

  const handleVerify = () => {
    if (otp.length === 4) {
      onVerify();
    }
  };

  // Focus the input when moving to OTP step
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => inputRef.current?.focus(), 500);
    }
  }, [step]);

  const renderOtpCell = (index: number) => {
    const digit = otp[index] || "";
    const isActive = index === otp.length && isFocused;
    const isFilled = index < otp.length;

    return (
      <View
        key={index}
        className={`w-14 h-18 rounded-xl items-center justify-center border-2 ${
          isActive
            ? "bg-white border-primary-600 shadow-sm"
            : isFilled
            ? "bg-white border-primary-950"
            : "bg-gray-50 border-gray-100"
        }`}
      >
        <Text className="text-2xl font-bold text-gray-950">{digit}</Text>
        {isActive && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ loop: true, type: "timing", duration: 500 }}
            className="w-0.5 h-6 bg-primary-600 absolute"
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 px-8"
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
          className="flex-1"
        >
          {/* Header - Compact 2xl */}
          <View className="mt-8 mb-6">
            <TouchableOpacity 
              className="mb-6 h-10 w-10 items-center justify-center bg-gray-50 rounded-lg" 
              onPress={() => step === "otp" && setStep("mobile")}
            >
              <Text className="text-xl text-gray-900">←</Text>
            </TouchableOpacity>
            
            <Text className="text-2xl font-bold text-gray-950 tracking-tight">
              {step === "mobile" ? "Enter your mobile number" : "Enter verification code"}
            </Text>
            <Text className="text-gray-500 text-sm mt-2 font-medium leading-5">
              {step === "mobile"
                ? "Manage your loans and other accounts for application"
                : `We've sent a code to verify your \nmobile number to +91 ${mobile || "9876543210"}`}
            </Text>
          </View>

          {/* Infographic */}
          <View className="items-center justify-center p-4 mb-8">
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

          {/* Inputs Section */}
          <View className="w-full">
            {step === "mobile" ? (
              <View className="bg-gray-50 border border-gray-100 rounded-xl h-14 px-5 flex-row items-center">
                <Text className="text-gray-400 font-bold text-lg mr-4 border-r border-gray-200 pr-4">+91</Text>
                <TextInput
                  placeholder="98765-43210"
                  keyboardType="numeric"
                  maxLength={10}
                  autoFocus
                  value={mobile}
                  onChangeText={setMobile}
                  className="flex-1 h-full text-lg font-bold text-gray-900"
                />
              </View>
            ) : (
              <View className="w-full">
                <Pressable 
                  onPress={() => inputRef.current?.focus()}
                  className="flex-row justify-between w-full"
                >
                  {[0, 1, 2, 3].map((i) => renderOtpCell(i))}
                </Pressable>
                
                {/* Bulletproof Hidden Input */}
                <TextInput
                  ref={inputRef}
                  value={otp}
                  onChangeText={setOtp}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  maxLength={4}
                  keyboardType="numeric"
                  caretHidden
                  style={{
                    position: "absolute",
                    opacity: 0,
                    width: 1,
                    height: 1,
                  }}
                />
              </View>
            )}

            <TouchableOpacity
              onPress={step === "mobile" ? handleMobileSubmit : handleVerify}
              activeOpacity={0.9}
              className={`h-14 rounded-xl items-center justify-center mt-10 shadow-sm ${
                 (step === "mobile" && mobile.length === 10) || (step === "otp" && otp.length === 4)
                  ? "bg-primary-950"
                  : "bg-gray-200"
              }`}
            >
              <Text className="text-white font-bold text-base">
                {step === "mobile" ? "Continue" : "Verify Code"}
              </Text>
            </TouchableOpacity>

            <View className="items-center mt-6">
              <Text className="text-gray-400 text-xs font-medium">
                Didn't receive code?{" "}
                <Text className="text-primary-600 font-bold" onPress={() => setStep("mobile")}>
                  Resend again
                </Text>
              </Text>
            </View>
          </View>
        </MotiView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

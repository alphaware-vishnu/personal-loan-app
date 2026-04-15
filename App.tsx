import "./global.css";

import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import LottieView from "lottie-react-native";
import { MotiView, MotiText } from "moti";
import { LoanCard } from "@/components/LoanCard";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { AuthScreen } from "@/screens/AuthScreen";
import { PermissionsScreen } from "@/screens/PermissionsScreen";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { ApplicationFormScreen } from "@/screens/ApplicationFormScreen";

import { KycScreen } from "@/screens/KycScreen";
import { VerificationScreen } from "@/screens/VerificationScreen";
import { BankFormScreen } from "@/screens/BankFormScreen";
import { BankSuccessScreen } from "@/screens/BankSuccessScreen";

export default function App() {
  const [flow, setFlow] = useState<"onboarding" | "auth" | "permissions" | "dashboard" | "application" | "kyc" | "verifying" | "bankDetails" | "bankVerifying" | "bankSuccess">("onboarding");
  const [selectedScheme, setSelectedScheme] = useState<any>(null);

  if (flow === "onboarding") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <OnboardingScreen onStart={() => setFlow("auth")} />
      </GestureHandlerRootView>
    );
  }

  if (flow === "auth") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <AuthScreen onVerify={() => setFlow("permissions")} />
      </GestureHandlerRootView>
    );
  }

  if (flow === "permissions") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <PermissionsScreen onContinue={() => setFlow("dashboard")} />
      </GestureHandlerRootView>
    );
  }

  if (flow === "dashboard") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <DashboardScreen 
          onStartLoan={() => console.log("Init selection")} 
          onSchemeSelect={(scheme) => {
            setSelectedScheme(scheme);
            setFlow("kyc");
          }} 
        />
      </GestureHandlerRootView>
    );
  }

  if (flow === "kyc") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <KycScreen 
          onNext={() => setFlow("verifying")} 
          onBack={() => setFlow("dashboard")} 
        />
      </GestureHandlerRootView>
    );
  }

  if (flow === "verifying") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <VerificationScreen 
          onComplete={() => setFlow("bankDetails")} 
          title="Verifying Identity"
          message="Our automated system is verifying your document photos. This usually takes a few seconds."
        />
      </GestureHandlerRootView>
    );
  }

  if (flow === "bankDetails") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <BankFormScreen 
          onSubmit={(data) => {
            console.log("Bank data submitted:", data);
            setFlow("bankVerifying");
          }} 
          onBack={() => setFlow("kyc")}
        />
      </GestureHandlerRootView>
    );
  }

  if (flow === "bankVerifying") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <VerificationScreen 
          onComplete={() => setFlow("bankSuccess")} 
          title="Verifying Bank Account"
          message="We are communicating with your bank to verify the details. Please wait."
        />
      </GestureHandlerRootView>
    );
  }

  if (flow === "bankSuccess") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <BankSuccessScreen onContinue={() => setFlow("dashboard")} />
      </GestureHandlerRootView>
    );
  }

  if (flow === "application") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <ApplicationFormScreen 
          schemeAmount={selectedScheme?.amount || "$0,000"} 
          onBack={() => setFlow("dashboard")}
          onSubmit={() => {
            console.log("Application submitted");
            setFlow("dashboard");
          }}
        />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-slate-50">
        <StatusBar style="dark" />
        <ScrollView 
          className="flex-1 px-6 pt-10"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <MotiView 
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 1000 }}
            className="flex-row items-center justify-between mb-8"
          >
            <View>
              <MotiText 
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                className="text-3xl font-bold text-gray-900"
              >
                Loan Dashboard
              </MotiText>
              <Text className="text-gray-500 text-sm mt-1">
                Welcome back, User
              </Text>
            </View>
            <View className="h-12 w-12 rounded-full bg-primary-100 items-center justify-center">
              <Text className="text-primary-700 font-bold">JD</Text>
            </View>
          </MotiView>

          {/* Animation Component Section */}
          <View className="h-48 w-full bg-white rounded-3xl mb-8 items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
            <LottieView
              autoPlay
              loop
              style={{ width: 150, height: 150 }}
              source={{ uri: "https://assets9.lottiefiles.com/packages/lf20_mizp2fkw.json" }}
            />
            <Text className="text-xs text-gray-400 absolute bottom-4">
              Interactive Lottie Asset
            </Text>
          </View>

          {/* Statistics Section */}
          <View className="flex-row gap-4 mb-8">
            <View className="flex-1 bg-primary-600 p-5 rounded-2xl shadow-lg shadow-primary-200">
              <Text className="text-primary-100 text-xs font-semibold">Credit Score</Text>
              <Text className="text-white text-2xl font-bold mt-1">742</Text>
            </View>
            <View className="flex-1 bg-accent-600 p-5 rounded-2xl shadow-lg shadow-accent-200">
              <Text className="text-accent-100 text-xs font-semibold">Active Loans</Text>
              <Text className="text-white text-2xl font-bold mt-1">2</Text>
            </View>
          </View>

          {/* Recent Applications Section */}
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Recent Applications
          </Text>
          
          <LoanCard 
            amount="$12,500.00" 
            status="Approved" 
            date="Oct 12, 2023" 
            index={0} 
          />
          <LoanCard 
            amount="$1,200.00" 
            status="Pending" 
            date="Oct 15, 2023" 
            index={1} 
          />
          
          <View className="h-20" />
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

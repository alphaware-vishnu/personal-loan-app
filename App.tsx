import "./global.css";

import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Text, View, ScrollView, BackHandler } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import LottieView from "lottie-react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./src/services/queryClient";

import { MotiView, MotiText } from "./src/components/Motion";
import { LoanCard } from "@/components/LoanCard";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { AuthScreen } from "@/screens/AuthScreen";
import { PermissionsScreen } from "@/screens/PermissionsScreen";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { ApplicationFormScreen } from "@/screens/ApplicationFormScreen";

import { AddressFormScreen } from "@/screens/AddressFormScreen";
import { KycScreen } from "@/screens/KycScreen";
import { VerificationScreen } from "@/screens/VerificationScreen";
import { BankFormScreen } from "@/screens/BankFormScreen";
import { SanctionLetterScreen } from "@/screens/SanctionLetterScreen";
import { ApplicationDetailsScreen } from "@/screens/ApplicationDetailsScreen";
import NetworkLogger, { startNetworkLogging } from "react-native-network-logger";
import { TouchableOpacity, Modal, SafeAreaView } from "react-native";

startNetworkLogging();

export type Flow = "onboarding" | "auth" | "permissions" | "dashboard" | "application" | "kyc" | "verifying" | "address" | "bankDetails" | "sanctionLetter" | "applicationDetails";

function AppContent() {
  const [history, setHistory] = useState<Flow[]>(["onboarding"]);
  const [selectedScheme, setSelectedScheme] = useState<any>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [showLogger, setShowLogger] = useState(false);

  // ... keeping rest of screen logic intact ...
  const flow = history[history.length - 1];

  const push = (screen: Flow) => {
    setHistory((prev) => [...prev, screen]);
  };

  const pop = () => {
    if (history.length > 1) {
      setHistory((prev) => prev.slice(0, -1));
    }
  };

  const replace = (screen: Flow) => {
    setHistory((prev) => [...prev.slice(0, -1), screen]);
  };

  // Hardware Back Button Support (Android)
  useEffect(() => {
    const onBackPress = () => {
      if (history.length > 1) {
        pop();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => subscription.remove();
  }, [history]);

  const renderScreen = () => {
    if (flow === "onboarding") {
      return <OnboardingScreen onStart={() => push("auth")} />;
    }

    if (flow === "auth") {
      return (
        <AuthScreen 
          onVerify={(isExisting) => {
            if (isExisting) {
              push("dashboard");
            } else {
              push("permissions");
            }
          }} 
        />
      );
    }

    if (flow === "permissions") {
      return <PermissionsScreen onContinue={() => push("dashboard")} />;
    }

    if (flow === "dashboard") {
      return (
        <DashboardScreen
          onStartLoan={() => console.log("Init selection")}
          onSchemeSelect={(scheme) => {
            setSelectedScheme(scheme);
            push("kyc");
          }}
          onViewDetails={(appId) => {
            setSelectedApplicationId(appId);
            push("applicationDetails");
          }}
        />
      );
    }

    if (flow === "applicationDetails") {
      return (
        <ApplicationDetailsScreen
          applicationId={selectedApplicationId!}
          onBack={pop}
        />
      );
    }

    if (flow === "kyc") {
      return (
        <KycScreen
          onNext={() => push("verifying")}
          onBack={pop}
        />
      );
    }

    if (flow === "verifying") {
      return (
        <VerificationScreen
          onComplete={() => replace("address")}
          title="Verifying Identity"
          message="Our automated system is verifying your document photos. This usually takes a few seconds."
        />
      );
    }

    if (flow === "address") {
      return (
        <AddressFormScreen
          onNext={() => replace("bankDetails")}
          onBack={pop}
        />
      );
    }

    if (flow === "bankDetails") {
      return (
        <BankFormScreen
          onSubmit={() => replace("sanctionLetter")}
          onBack={pop}
        />
      );
    }

    if (flow === "sanctionLetter") {
      return <SanctionLetterScreen onFinish={() => replace("dashboard")} />;
    }

    if (flow === "application") {
      return (
        <ApplicationFormScreen
          schemeAmount={selectedScheme ? `₹${selectedScheme.loanAmount.toLocaleString('en-IN')}` : "₹0,000"}
          onBack={pop}
          onSubmit={() => {
            console.log("Application submitted");
            replace("dashboard");
          }}
        />
      );
    }

    return null;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={flow === "onboarding" ? "auto" : "dark"} />
      {renderScreen()}

      {/* Floating Debug Button */}
      <TouchableOpacity
        onPress={() => setShowLogger(true)}
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
          backgroundColor: "#172554",
          width: 50,
          height: 50,
          borderRadius: 25,
          alignItems: "center",
          justifyContent: "center",
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }}
      >
        <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>DEBUG</Text>
      </TouchableOpacity>

      {/* Network Logger Modal */}
      <Modal visible={showLogger} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
          <View style={{ height: 50, flexDirection: "row", alignItems: "center", paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
            <TouchableOpacity onPress={() => setShowLogger(false)} style={{ padding: 10 }}>
              <Text style={{ color: "#172554", fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: "center", fontWeight: "bold", fontSize: 16 }}>Network Logs</Text>
            <View style={{ width: 60 }} />
          </View>
          <NetworkLogger theme="light" />
        </SafeAreaView>
      </Modal>

    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}


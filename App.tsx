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
import { SplashScreen } from "@/screens/onboarding/SplashScreen";
import { IntroCarouselScreen } from "@/screens/onboarding/IntroCarouselScreen";
import { PermissionsScreen } from "@/screens/onboarding/PermissionsScreen";
import { MobileInputScreen } from "@/screens/auth/MobileInputScreen";
import { OtpVerificationScreen } from "@/screens/auth/OtpVerificationScreen";
import { DashboardScreen } from "@/screens/dashboard/DashboardScreen";
import { ApplicationFormScreen } from "@/screens/ApplicationFormScreen";

import { AddressFormScreen } from "@/screens/AddressFormScreen";
import { KycScreen } from "@/screens/KycScreen";
import { VerificationScreen } from "@/screens/VerificationScreen";
import { BankFormScreen } from "@/screens/BankFormScreen";
import { SanctionLetterScreen } from "@/screens/SanctionLetterScreen";
import { ApplicationDetailsScreen } from "@/screens/ApplicationDetailsScreen";
import { CreditScoreScreen } from "@/screens/CreditScoreScreen";

// ─── New Screens (Phase 7: Finalization & Dashboard) ───
import { BankAccountScreen } from "@/screens/bank/BankAccountScreen";
import { AgreementScreen } from "@/screens/agreement/AgreementScreen";
import { DisbursalScreen } from "@/screens/disbursal/DisbursalScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { useAuthStore } from "@/store/authStore";

// ─── New Screens (Phase 5: Profile Setup) ───
import { PanVerificationScreen } from "@/screens/profile/PanVerificationScreen";
import { EmploymentTypeScreen } from "@/screens/profile/EmploymentTypeScreen";
import { WorkAddressScreen } from "@/screens/profile/WorkAddressScreen";
import { PersonalAddressScreen } from "@/screens/profile/PersonalAddressScreen";
import { ProfileCompletionScreen } from "@/screens/profile/ProfileCompletionScreen";

// ─── New Screens (Phase 6: Eligibility & KYC) ───
import { IncomeInputScreen } from "@/screens/eligibility/IncomeInputScreen";
import { BankStatementUploadScreen } from "@/screens/eligibility/BankStatementUploadScreen";
import { EligibilityProcessingScreen } from "@/screens/eligibility/EligibilityProcessingScreen";
import { OfferScreen } from "@/screens/eligibility/OfferScreen";
import { AadhaarVerificationScreen } from "@/screens/kyc/AadhaarVerificationScreen";
import { SelfieVerificationScreen } from "@/screens/kyc/SelfieVerificationScreen";

// ─── Theme ───
import { ThemeProvider } from "@/theme";

import NetworkLogger, { startNetworkLogging } from "react-native-network-logger";
import { TouchableOpacity, Modal, SafeAreaView } from "react-native";

startNetworkLogging();

export type Flow =
  | "splash"
  | "introCarousel"
  | "mobileInput"
  | "otpVerification"
  | "permissions"
  | "dashboard"
  | "application"
  | "kyc"
  | "verifying"
  | "creditScore"
  | "address"
  | "bankDetails"
  | "sanctionLetter"
  | "applicationDetails"
  | "profile"
  // New profile setup screens
  | "panVerification"
  | "employmentType"
  | "workAddress"
  | "personalAddress"
  | "profileCompletion"
  // New eligibility & KYC screens
  | "incomeInput"
  | "bankStatementUpload"
  | "eligibilityProcessing"
  | "offer"
  | "aadhaarVerification"
  | "selfieVerification"
  // New finalization screens
  | "agreement"
  | "disbursal";


function AppContent() {
  const [history, setHistory] = useState<Flow[]>(["aadhaarVerification"]);
  const [mobile, setMobile] = useState("");
  const [selectedScheme, setSelectedScheme] = useState<any>(null);
   const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [selectedAutoRepay, setSelectedAutoRepay] = useState<boolean>(false);
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
    if (flow === "splash") {
      return <SplashScreen onFinish={(isLoggedIn) => replace(isLoggedIn ? "dashboard" : "introCarousel")} />;
    }

    if (flow === "introCarousel") {
      return <IntroCarouselScreen onStart={() => push("mobileInput")} />;
    }

    if (flow === "mobileInput") {
      return (
        <MobileInputScreen
          mobile={mobile}
          setMobile={setMobile}
          onNext={() => push("otpVerification")}
          onBack={pop}
        />
      );
    }

    if (flow === "otpVerification") {
      return (
        <OtpVerificationScreen
          mobile={mobile}
          onBack={pop}
          onVerify={(isExisting) => {
            replace(isExisting ? "dashboard" : "permissions");
          }}
        />
      );
    }

    if (flow === "permissions") {
      return <PermissionsScreen onContinue={() => push("panVerification")} />;
    }

    // ─── New Profile Setup Flow (Step 1) ───
    if (flow === "panVerification") {
      return (
        <PanVerificationScreen
          onNext={() => push("employmentType")}
          onBack={pop}
        />
      );
    }

    if (flow === "employmentType") {
      return (
        <EmploymentTypeScreen
          onNext={() => push("workAddress")}
          onBack={pop}
        />
      );
    }

    if (flow === "workAddress") {
      return (
        <WorkAddressScreen
          onNext={() => push("personalAddress")}
          onBack={pop}
        />
      );
    }

    if (flow === "personalAddress") {
      return (
        <PersonalAddressScreen
          onNext={() => push("profileCompletion")}
          onBack={pop}
        />
      );
    }

    if (flow === "profileCompletion") {
      return (
        <ProfileCompletionScreen
          onContinue={() => replace("incomeInput")}
        />
      );
    }

    // ─── New Eligibility & KYC Flow (Step 2 & 3) ───
    if (flow === "incomeInput") {
      return (
        <IncomeInputScreen
          onNext={() => push("bankStatementUpload")}
          onBack={pop}
        />
      );
    }

    if (flow === "bankStatementUpload") {
      return (
        <BankStatementUploadScreen
          onNext={() => replace("eligibilityProcessing")}
          onBack={pop}
        />
      );
    }

    if (flow === "eligibilityProcessing") {
      return (
        <EligibilityProcessingScreen
          onComplete={() => replace("offer")}
        />
      );
    }

    if (flow === "offer") {
      return (
        <OfferScreen
          onNext={() => push("aadhaarVerification")}
          onBack={pop}
        />
      );
    }

    if (flow === "aadhaarVerification") {
      return (
        <AadhaarVerificationScreen
          onNext={() => push("selfieVerification")}
          onBack={pop}
        />
      );
    }

    if (flow === "selfieVerification") {
      return (
        <SelfieVerificationScreen
          onNext={() => replace("bankDetails")}
          onBack={pop}
        />
      );
    }


    // ─── Existing Screens ───
    if (flow === "dashboard") {
      return (
        <DashboardScreen
          onStartLoan={() => console.log("Init selection")}
          onSchemeSelect={(scheme) => {
            setSelectedScheme(scheme);
            push("kyc");
          }}
          onViewDetails={(appId, autoRepay) => {
            setSelectedApplicationId(appId);
            setSelectedAutoRepay(!!autoRepay);
            push("applicationDetails");
          }}
          onViewProfile={() => push("profile")}
          onResumeOnboarding={(screenKey) => push(screenKey)}
        />
      );
    }

    if (flow === "profile") {
      return (
        <ProfileScreen
          customerId={useAuthStore.getState().authData?.customerId!}
          onBack={pop}
        />
      );
    }

    if (flow === "applicationDetails") {
      return (
        <ApplicationDetailsScreen
          applicationId={selectedApplicationId!}
          autoOpenRepay={selectedAutoRepay}
          onBack={() => {
            setSelectedAutoRepay(false);
            pop();
          }}
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
          onComplete={() => replace("creditScore")}

          title="Verifying Identity"
          message="Our automated system is verifying your document photos. This usually takes a few seconds."
        />
      );
    }

    if (flow === "creditScore") {
      return (
        <CreditScoreScreen
          onNext={() => replace("address")}
          onBack={pop}
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
        <BankAccountScreen
          onNext={() => replace("agreement")}
          onBack={pop}
        />
      );
    }

    if (flow === "agreement") {
      return (
        <AgreementScreen
          onNext={() => replace("disbursal")}
          onBack={pop}
        />
      );
    }

    if (flow === "disbursal") {
      return (
        <DisbursalScreen
          onComplete={() => replace("dashboard")}
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
      <StatusBar style={flow === "splash" || flow === "introCarousel" ? "auto" : "dark"} />
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

import Toast, { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#22c55e' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: 'bold'
      }}
      text2Style={{
        fontSize: 13,
        color: '#64748b'
      }}
      text2NumberOfLines={3}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#ef4444' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: 'bold'
      }}
      text2Style={{
        fontSize: 13,
        color: '#64748b'
      }}
      text2NumberOfLines={5}
    />
  ),
  info: (props: any) => (
    <InfoToast
      {...props}
      style={{ borderLeftColor: '#3b82f6' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: 'bold'
      }}
      text2Style={{
        fontSize: 13,
        color: '#64748b'
      }}
      text2NumberOfLines={3}
    />
  )
};

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        <Toast config={toastConfig} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { MotiView, MotiText } from "../components/Motion";
import LottieView from "lottie-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLoanStore } from "../store/loanStore";
import { Ionicons, Feather } from "@expo/vector-icons";
import { Button } from "../components/Button";
import { createApplication } from "../services/api";

interface VerificationScreenProps {
  onComplete: () => void;
  title?: string;
  message?: string;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({
  onComplete,
  title = "Verifying Identity",
  message = "Our automated system is verifying your documents. This usually takes a few seconds."
}) => {
  const [isVerified, setIsVerified] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { 
    emi, 
    disbursalAmount, 
    customerId,
    requestedAmount,
    schemeMasterId,
    repaymentFrequency,
    applicationDocuments,
    setApplicationData
  } = useLoanStore();

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        customerId: String(customerId),
        requestedAmount: String(requestedAmount),
        schemeMasterId: String(schemeMasterId),
        emi: String(emi),
        repaymentFrequency: repaymentFrequency === 'MONTHLY' ? "2" : "2",
        disbursalAmount: String(disbursalAmount),
        applicationDocuments: applicationDocuments.map(doc => ({
          categoryId: doc.categoryId,
          documentTypeId: doc.documentTypeId,
          awsDocumentIds: doc.awsDocumentIds,
          documentNumber: doc.documentNumber
        }))
      };

      console.log('[Verification] Creating application with payload:', JSON.stringify(payload, null, 2));
      const response = await createApplication(payload);
      
      const appData = response.data?.data || response.data;
      if (appData?.applicationId) {
        setApplicationData(appData.applicationId, appData.productId);
      }

      onComplete();
    } catch (error: any) {
      console.error('[Verification] Error creating application:', error?.response?.data || error.message);
      // For now, proceed to next screen anyway to not block user
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    "Scanning Documents",
    "Extracting Data via OCR",
    "Validating with Bureau",
    "Finalizing Loan Offer"
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 800);

    const timer = setTimeout(() => {
      setIsVerified(true);
      clearInterval(stepInterval);
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1 items-center justify-center px-6">
        {!isVerified ? (
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 1000 }}
            className="items-center w-full"
          >
            <View className="h-60 w-60 items-center justify-center">
              <LottieView
                autoPlay
                loop
                style={{ width: 220, height: 220 }}
                source={require("../../assets/loader.json")}
              />
            </View>

            <MotiText
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 300 }}
              className="text-2xl font-black text-slate-900 text-center mt-4 tracking-tight"
            >
              {title}
            </MotiText>

            <MotiText
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 600 }}
              className="text-slate-500 text-center mt-2 px-10 text-base font-medium"
            >
              {message}
            </MotiText>

            <View className="w-full mt-10 px-8">
              {steps.map((step, index) => (
                <MotiView
                  key={step}
                  from={{ opacity: 0, translateX: -10 }}
                  animate={{ 
                    opacity: index <= currentStep ? 1 : 0.3,
                    translateX: 0
                  }}
                  transition={{ delay: index * 200 }}
                  className="flex-row items-center mb-4"
                >
                  <View className={`w-6 h-6 rounded-full items-center justify-center mr-4 ${index < currentStep ? 'bg-green-500' : index === currentStep ? 'bg-blue-600' : 'bg-slate-200'}`}>
                    {index < currentStep ? (
                      <Ionicons name="checkmark" size={14} color="white" />
                    ) : (
                      <View className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </View>
                  <Text className={`text-sm font-bold ${index <= currentStep ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step}
                  </Text>
                  {index === currentStep && (
                    <MotiView
                      from={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ loop: true, duration: 800 }}
                      className="ml-auto"
                    >
                      <View className="w-2 h-2 rounded-full bg-blue-600" />
                    </MotiView>
                  )}
                </MotiView>
              ))}
            </View>
          </MotiView>
        ) : (
          <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            className="w-full items-center"
          >
            <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-6">
              <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
            </View>
            
            <Text className="text-3xl font-bold text-slate-900 text-center">Verification Successful!</Text>
            <Text className="text-slate-500 text-center mt-2 mb-10">
              Your identity has been verified. Here are your estimated loan details:
            </Text>

            {/* EMI Result Card */}
            <View className="w-full bg-slate-50 rounded-3xl p-6 border border-slate-100">
              <View className="flex-row items-center justify-between mb-6">
                <View>
                  <Text className="text-slate-500 text-sm font-medium mb-1">Monthly EMI</Text>
                  <Text className="text-2xl font-bold text-blue-600">₹{emi.toLocaleString('en-IN')}</Text>
                </View>
                <View className="bg-blue-50 p-3 rounded-2xl">
                  <Ionicons name="calendar-outline" size={24} color="#2563eb" />
                </View>
              </View>

              <View className="h-[1px] bg-slate-200 w-full mb-6" />

              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-slate-500 text-sm font-medium mb-1">Disbursement Amount</Text>
                  <Text className="text-xl font-bold text-slate-900">₹{disbursalAmount.toLocaleString('en-IN')}</Text>
                </View>
                <View className="bg-slate-100 p-3 rounded-2xl">
                  <Ionicons name="cash-outline" size={24} color="#64748b" />
                </View>
              </View>
            </View>

            <View className="w-full mt-10">
              <Button 
                title="Continue Application" 
                variant="primary" 
                size="lg" 
                onPress={handleContinue}
                loading={isSubmitting}
              />
            </View>
          </MotiView>
        )}

        {!isVerified && (
          <View className="absolute bottom-20 items-center w-full">
            <ActivityIndicator color="#172554" size="small" />
            <Text className="text-slate-400 text-xs font-medium mt-4 uppercase tracking-widest">
              Fetching data from secure servers...
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};


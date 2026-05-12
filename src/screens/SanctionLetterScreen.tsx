import React, { useState } from "react";
import { View, Text, ScrollView, Alert, Dimensions } from "react-native";
import { MotiView } from "../components/Motion";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Button } from "../components/Button";
import { SafeAreaView } from "react-native-safe-area-context";

interface SanctionLetterScreenProps {
  onFinish: () => void;
}

const { width } = Dimensions.get("window");

import { useAuthStore } from "../store/authStore";
import { useLoanStore } from "@/store/loanStore";
import { createApplication, createCustomer, updateApplication, updateStepStatus } from "@/services/api";

export const SanctionLetterScreen = ({ onFinish }: SanctionLetterScreenProps) => {
  const [hasConsented, setHasConsented] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const loanStoreState = useLoanStore();
  const { requestedAmount, interest, tenure, emi, reset, customerInfo, setCustomerId, applicationId } = loanStoreState;
  const { mobile: verifiedMobile, authData, setCustomerId: setAuthCustomerId } = useAuthStore();

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      Alert.alert("Success", "Sanction letter downloaded successfully as PDF.");
    }, 1500);
  };

  const handleSubmit = async () => {
    if (!hasConsented) return;

    const isExistingCustomer = loanStoreState.isExistingCustomer;
    console.log('[Sanction] Submission started. isExistingCustomer flag:', isExistingCustomer);

    setIsSubmitting(true);
    try {
      let finalCustomerId = authData?.customerId || loanStoreState.customerId;

      // 1. Create Customer (POST /customer) ONLY for NEW customers (those who had data: [] on login)
      if (!isExistingCustomer) {
        const customerPayload = {
          id: finalCustomerId || undefined, 
          applicantName: customerInfo.applicantName,
          mobileNumber: verifiedMobile || customerInfo.mobileNumber,
          voterId: customerInfo.panNumber,
          gender: "MALE",
          leadSource: 'HEYLON',
          leadStatus: "ACTIVE",
          applicationSource: "ALFIN",
          clientType: "INDIVIDUAL",
          isVoterIdActive: true,
          customerBanks: customerInfo.customerBanks.map(bank => ({
            ...bank,
            accountType: "SAVINGS",
            isDefault: true
          })),
          address: {
            city: "Mumbai",
            pinCode: "400001",
            stateName: "Maharashtra",
            countryName: "India"
          }
        };

        console.log('[API] Creating NEW Customer (POST):', JSON.stringify(customerPayload, null, 2));
        const customerResponse = await createCustomer(customerPayload);
        
        // Update finalCustomerId from creation response
        const newCustomerId = customerResponse.data?.data?.id || customerResponse.data?.id;
        if (newCustomerId) {
          finalCustomerId = newCustomerId;
        }
      } else {
        console.log('[API] Existing customer profile confirmed. Skipping profile creation.');
      }
      
      if (!finalCustomerId) {
        throw new Error("Failed to retrieve Customer ID for application link");
      }

      console.log('[API] Customer Ready with ID:', finalCustomerId);
      setCustomerId(Number(finalCustomerId));
      setAuthCustomerId(Number(finalCustomerId)); // Persist to authStore for dashboard

      // 2. Update Application with the final Customer ID and other details
      const applicationPayload = {
        id: applicationId,
        requestedAmount: loanStoreState.requestedAmount,
        disbursalAmount: loanStoreState.disbursalAmount,
        emi: loanStoreState.emi,
        tenure: loanStoreState.tenure,
        interest: loanStoreState.interest,
        schemeMasterId: loanStoreState.schemeMasterId,
        repaymentFrequency: loanStoreState.repaymentFrequency,
        customerId: finalCustomerId,
        applicationSource: "ALFIN",
        applicationDocuments: loanStoreState.applicationDocuments.map(doc => ({
          categoryId: doc.categoryId,
          documentTypeId: doc.documentTypeId,
          awsDocumentIds: doc.awsDocumentIds,
          documentNumber: doc.documentNumber
        })),
      };

      console.log('[API] Updating Application (PATCH):', JSON.stringify(applicationPayload, null, 2));
      await updateApplication(applicationPayload);

      // 3. Mark agreement as completed
      if (applicationId) {
        await updateStepStatus(applicationId, { loanAgreementCompleted: true });
        console.log('[Sanction] Step status updated: loanAgreementCompleted = true');
      }

      Alert.alert(
        "Application Successful",
        "Your profile has been created and your loan application has been submitted successfully.",
        [
          { 
            text: "View Dashboard", 
            onPress: () => {
              reset();
              onFinish();
            } 
          }
        ]
      );
    } catch (error: any) {
      console.error('Submission sequence failed:', error);
      Alert.alert(
        "Application Failed",
        error.response?.data?.message || error.message || "There was an error processing your application. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 px-6" edges={["top", "bottom"]}>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 600, type: "timing" }}
        className="flex-1"
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 200 }}
          className="items-center mb-8"
        >
          <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center shadow-sm border border-slate-100 mb-4">
            <Feather name="file-text" size={32} color="#0f172a" />
          </View>
          <Text className="text-3xl font-black text-slate-900 tracking-tighter text-center">
            Sanction Letter
          </Text>
          <Text className="text-slate-500 text-base mt-2 text-center font-medium">
            Your loan application has been approved. Please review your terms.
          </Text>
        </MotiView>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Document Preview Card */}
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
            <View className="flex-row justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest">Document Preview</Text>
              <Feather name="shield" size={16} color="#10b981" />
            </View>

            <View className="space-y-4 mb-6 gap-y-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-500 font-medium">Loan Amount</Text>
                <Text className="text-slate-900 font-bold text-lg">{formatCurrency(requestedAmount)}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-500 font-medium">Interest Rate</Text>
                <Text className="text-slate-900 font-bold text-lg">{interest}% p.a.</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-500 font-medium">Tenure</Text>
                <Text className="text-slate-900 font-bold text-lg">{tenure} Months</Text>
              </View>
              <View className="flex-row justify-between items-center pt-2">
                <Text className="text-slate-500 font-medium">Est. EMI</Text>
                <Text className="text-primary-600 font-black text-xl">{formatCurrency(emi)}</Text>
              </View>
            </View>

            {/* Download Action using standard Button */}
            <Button
              title="Download Sanction PDF"
              variant="secondary"
              icon={<Feather name="download-cloud" size={20} color="#0f172a" />}
              iconPosition="left"
              onPress={handleDownload}
              loading={isDownloading}
            />
          </View>

          <View className="bg-white rounded-3xl py-6 shadow-sm border border-slate-100 mb-10">
            <Button
              variant="ghost"
              className="!p-0 !min-h-0 !h-auto !items-start !justify-start"
              contentClassName="!items-start !justify-start"
              onPress={() => setHasConsented(!hasConsented)}
            >
              <View className="flex-row items-start w-full ">
                <View className="mt-1 mr-4">
                  <Ionicons
                    name={hasConsented ? "checkbox" : "square-outline"}
                    size={24}
                    color={hasConsented ? "#1d4ed8" : "#64748b"}
                  />
                </View>
                <Text className="h-20 text-slate-700 font-medium leading-5 text-left pt-1">
                  I have viewed and downloaded the sanction letter, and I agree to all the terms and conditions outlined within it.
                </Text>
              </View>
            </Button>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <MotiView
          animate={{ opacity: hasConsented ? 1 : 0.6 }}
          transition={{ duration: 200 }}
          className="pb-10 pt-4"
        >
          <Button
            title="Finish Application"
            variant="primary"
            size="lg"
            onPress={handleSubmit}
            disabled={!hasConsented}
            loading={isSubmitting}
          />
        </MotiView>

      </MotiView>
    </SafeAreaView>
  );
};



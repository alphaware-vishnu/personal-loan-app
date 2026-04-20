import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { MotiView } from "../components/Motion";
import { LoanCard } from "../components/LoanCard";
import { LoanSelectionModal } from "../components/LoanSelectionModal";
import { Button } from "../components/Button";
import { SafeAreaView } from "react-native-safe-area-context";

import { useQuery } from "@tanstack/react-query";
import { api, getProductDocuments, getCustomerApplications } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useLoanStore } from "../store/loanStore";

const { width } = Dimensions.get("window");

interface DashboardScreenProps {
  onStartLoan: () => void;
  onSchemeSelect: (scheme: any) => void;
  onViewDetails: (applicationId: number) => void;
}

export const DashboardScreen = ({ onStartLoan, onSchemeSelect, onViewDetails }: DashboardScreenProps) => {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const { setScheme, setCustomerId, setCalculationResults, setDocumentRequirements, customerInfo } = useLoanStore();
  const { authData } = useAuthStore();

  const customerId = authData?.customerId;

  // Fetch real applications for the customer
  const { data: applications, isLoading: isAppsLoading } = useQuery({
    queryKey: ['applications', customerId],
    queryFn: () => getCustomerApplications(customerId!).then(res => res.data?.data || []),
    enabled: !!customerId,
  });

  const handleApplyNow = () => {
    setModalVisible(true);
    onStartLoan();
  };

  const handleSelect = async (scheme: any) => {
    setModalVisible(false);
    setIsCalculating(true);
    
    try {
      // Persist to loanStore
      setScheme(scheme);
      if (authData?.customerId) {
        setCustomerId(authData.customerId);
      }

      // Calculate EMI and Disbursal Amount via API
      const response = await api({
        url: "/application/calculate/emi",
        method: "POST",
        data: {
          requestedAmount: scheme.loanAmount,
          interest: scheme.defaultInterest,
          tenure: scheme.defaultTenure,
          repaymentFrequency: scheme.tenureFrequency || 'MONTHLY',
          schemeMasterId: scheme.id,
          repaymentDate: new Date().toISOString().split('T')[0], // Today's date as default
        }
      });

      if (response.data?.data) {
        setCalculationResults(
          response.data.data.emi,
          response.data.data.disbursementAmount
        );
      }

      // Fetch Product Document Requirements (Live Call)
      console.log(`[API] Fetching document requirements for product: ${scheme.productId || 5}`);
      const docResponse = await getProductDocuments(scheme.productId || 5);
      
      console.log('[API] Document Response:', JSON.stringify(docResponse.data, null, 2));

      if (docResponse.data?.data?.documentRequirements) {
        setDocumentRequirements(docResponse.data.data.documentRequirements);
      }
      
      onSchemeSelect(scheme);
    } catch (error) {
      console.error("Error calculating EMI or fetching documents:", error);
      // Fallback or alert user
      onSchemeSelect(scheme);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatAmount = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1">
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Header - High Density Pro */}
          <View className="mt-8 mb-8 flex-row justify-between items-center">
            <View>
              <Text className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                Active Profile
              </Text>
              <Text className="text-2xl font-bold text-gray-900 mt-1">
                {customerInfo.applicantName || "Welcome Back"}
              </Text>
            </View>
            <View className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center border border-gray-100">
              <Text className="text-lg">🧑</Text>
            </View>
          </View>

          {/* New Loan Call-to-Action - Kafene Style Hero */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="bg-primary-950 rounded-2xl p-6 mb-10 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="flex-1 pr-2">
                <Text className="text-white text-xl font-bold leading-tight">
                  {applications && applications.length > 0 ? "Apply for More" : "Instant Personal Loan"}
                </Text>
                <Text className="text-primary-200 text-xs mt-1 font-medium">
                  {applications && applications.length > 0 
                    ? "Need more funds? Apply for another loan in just 2 minutes."
                    : "Check your eligibility and get approved in minutes."}
                </Text>
                <Button
                  title={applications && applications.length > 0 ? "New Application" : "Apply Now"}
                  variant="secondary"
                  size="sm"
                  onPress={handleApplyNow}
                  className="mt-5 self-start bg-white border-white"
                  textClassName="text-primary-950 font-bold uppercase tracking-tight"
                />
              </View>
              <View className="w-20 h-20 bg-primary-800/20 rounded-xl items-center justify-center">
                <Text className="text-3xl">🚀</Text>
              </View>
            </View>
          </MotiView>

          {/* Activity Section Header */}
          <View className="mb-4 flex-row justify-between items-end">
            <Text className="text-lg font-bold text-gray-900">Your Applications</Text>
            {applications && applications.length > 0 && (
              <Button
                title="See All"
                variant="ghost"
                size="sm"
                className="!p-0 !min-h-0 !h-auto"
                textClassName="text-primary-600 uppercase tracking-wider text-xs font-bold"
              />
            )}
          </View>

          {/* Dynamic Loan Cards */}
          {isAppsLoading ? (
            <View className="py-10 items-center">
              <ActivityIndicator color="#0f172a" />
              <Text className="text-gray-400 mt-2">Loading applications...</Text>
            </View>
          ) : applications && applications.length > 0 ? (
            applications.map((app: any, idx: number) => (
              <LoanCard
                key={app.id || idx}
                amount={formatAmount(app.requestedAmount)}
                status={app.applicationStatus === "PENDING" ? "In Review" : app.applicationStatus}
                date={formatDate(app.createdOn)}
                index={idx}
                onPressDetails={() => onViewDetails(app.id)}
              />
            ))
          ) : (
            <View className="py-10 items-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Text className="text-gray-400 font-medium">No active applications found</Text>
            </View>
          )}



          <View className="h-10" />
        </ScrollView>

        <LoanSelectionModal
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSelect={handleSelect}
        />
      </View>
    </SafeAreaView>
  );
};

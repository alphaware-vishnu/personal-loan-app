import React, { useState } from "react";
import {
  View,
  Text,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TouchableWithoutFeedback,
  StyleSheet,
  Linking,
  Platform,
  Animated,
} from "react-native";
import { useTheme, useColors } from "../theme";
import LottieView from "lottie-react-native";
import { MotiView } from "../components/Motion";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  getApplicationDetails,
  getDocumentDownloadPath,
  getLoanAccountById,
  getLmsLoanAccountDetails,
  createRepayment,
  initiateAutopay,
  initiateManualPayment,
  verifyManualPayment,
  getRepaymentSchedule,
  getCustomerProfile,
  getApplicationStatusHistory,
  downloadSignedAgreement,
} from "../services/api";
import {
  initiateESign,
  isDigioSdkSupported,
  createDigioInstance,
  startEsignFlow,
  refreshESignStatus,
  extractTokenIdFromUrl,
} from "../services/digioService";
import { useAuthStore } from "../store/authStore";
import { useLoanStore } from "../store/loanStore";
import { Layout } from "react-native-reanimated";
import { formatLabel } from "../utils";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { DocumentViewer } from "../components/DocumentViewer";
import Toast from "react-native-toast-message";
import * as WebBrowser from "expo-web-browser";
import { isFeatureEnabled } from "../config/features";
import { env } from "../config/env";

const { width } = Dimensions.get("window");

type TabKey = "loan" | "overview" | "documents" | "bank";

interface ApplicationDetailsScreenProps {
  applicationId: number;
  autoOpenRepay?: boolean;
  onBack: () => void;
  onResumeStep?: (screenKey: string) => void;
}

export const ApplicationDetailsScreen = ({
  applicationId,
  autoOpenRepay,
  onBack,
  onResumeStep,
}: ApplicationDetailsScreenProps) => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [initialTabSet, setInitialTabSet] = useState(false);
  const [isDownloadingAgreement, setIsDownloadingAgreement] = useState(false);

  const handleDownloadAgreement = async () => {
    if (!app) return;
    setIsDownloadingAgreement(true);
    try {
      const response = await downloadSignedAgreement(app.id);
      
      if (Platform.OS === 'web') {
        const blob = new Blob([response.data as any], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Signed_Loan_Agreement_${app.applicationNo || app.id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        Toast.show({
          type: "success",
          text1: "Download Complete",
          text2: "Signed loan agreement PDF saved to downloads.",
        });
      }
    } catch (error: any) {
      console.error("Failed to download signed agreement:", error);
      Toast.show({
        type: "error",
        text1: "Download Failed",
        text2: error.response?.data?.message || error.message || "Could not retrieve signed agreement.",
      });
    } finally {
      setIsDownloadingAgreement(false);
    }
  };

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => getApplicationDetails(applicationId).then((res) => res.data),
    enabled: !!applicationId,
  });

  const app = response?.data;

  const { data: statusHistoryResponse } = useQuery({
    queryKey: ["application-status-history", applicationId],
    queryFn: () => getApplicationStatusHistory(applicationId).then((res) => res.data),
    enabled: !!applicationId,
  });

  const statusHistory = statusHistoryResponse?.data || [];

  const { authData } = useAuthStore();
  const customerId = authData?.customerId;

  const { data: profileResponse } = useQuery({
    queryKey: ["customer-profile", customerId],
    queryFn: () => getCustomerProfile(customerId!),
    enabled: !!customerId,
  });

  const profile = profileResponse?.data;

  React.useEffect(() => {
    if (app && !initialTabSet) {
      if (autoOpenRepay || app.applicationStatus === "DISBURSED" || app.loanAccountId || app.lmsLoanId) {
        setActiveTab("loan");
      }
      setInitialTabSet(true);
    }
  }, [app, initialTabSet, autoOpenRepay]);

  const TABS = React.useMemo(() => {
    const base = [
      { key: "overview", label: "Overview", icon: "layers" },
      { key: "documents", label: "Documents", icon: "file-text" },
      { key: "bank", label: "Bank", icon: "credit-card" },
    ];
    if (app?.applicationStatus === "DISBURSED" || app?.loanAccountId || app?.lmsLoanId) {
      base.unshift({ key: "loan", label: "Loan", icon: "wallet" });
    }
    return base;
  }, [app]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getResumeScreen = (appData: any): string => {
    const reRulesEngineCompleted = appData.applicationStepStatus?.rulesEngineCompleted ?? appData.rulesEngineCompleted;
    const reBankVerificationCompleted = appData.applicationStepStatus?.bankVerificationCompleted ?? appData.bankVerificationCompleted;
    const reLoanAgreementCompleted = appData.applicationStepStatus?.loanAgreementCompleted ?? appData.loanAgreementCompleted;

    if (!reRulesEngineCompleted) {
      return 'eligibilityProcessing';
    } else if (!reBankVerificationCompleted) {
      return 'bankDetails';
    } else if (!reLoanAgreementCompleted) {
      const status = appData.applicationStatus;
      if (status === 'SANCTION_GENERATED' || status === 'SANCTION_SIGN_INITIATED' || status === 'SANCTION_SIGNED') {
        return 'agreement';
      } else {
        return 'sanctionLetter';
      }
    } else {
      return 'disbursal';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "#10b981";
      case "REJECTED":
        return "#ef4444";
      case "PENDING":
        return "#f59e0b";
      case "DISBURSED":
        return "#6366f1";
      default:
        return "#3b82f6";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-50";
      case "REJECTED":
        return "bg-red-50";
      case "PENDING":
        return "bg-amber-50";
      case "DISBURSED":
        return "bg-indigo-50";
      default:
        return "bg-blue-50";
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center" edges={["top", "bottom"]}>
        <View className="w-24 h-24 bg-white rounded-3xl items-center justify-center shadow-sm border border-slate-100 mb-4">
          <LottieView
            source={require('../../assets/new-loader.json')}
            autoPlay
            loop
            style={{ width: 80, height: 80 }}
            resizeMode="contain"
          />
        </View>
        <Text className="text-slate-900 text-lg font-bold mt-2">Loading Application</Text>
        <Text className="text-slate-400 mt-1 font-medium">Fetching your details...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !app) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center px-10" edges={["top", "bottom"]}>
        <View className="w-16 h-16 bg-red-50 rounded-3xl items-center justify-center mb-4">
          <Feather name="alert-circle" size={32} color="#ef4444" />
        </View>
        <Text className="text-slate-900 text-xl font-bold mt-2">Something went wrong</Text>
        <Text className="text-slate-500 text-center mt-2">
          Could not load application details. Please check your connection and try again.
        </Text>
        <TouchableOpacity
          onPress={onBack}
          className="mt-8 bg-slate-900 px-8 py-3 rounded-2xl"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(app.applicationStatus);

  const rulesEngineCompleted = app.applicationStepStatus?.rulesEngineCompleted ?? app.rulesEngineCompleted;
  const bankVerificationCompleted = app.applicationStepStatus?.bankVerificationCompleted ?? app.bankVerificationCompleted;
  const loanAgreementCompleted = app.applicationStepStatus?.loanAgreementCompleted ?? app.loanAgreementCompleted;

  let stageName = '';
  const status = app.applicationStatus;
  if (status === 'DRAFT') {
    stageName = 'Profile Setup';
  } else if (status === 'SUBMITTED' || status === 'UNDER_REVIEW') {
    if (!rulesEngineCompleted) {
      stageName = 'Credit Check';
    } else if (!bankVerificationCompleted) {
      stageName = 'Bank Verification';
    } else if (!loanAgreementCompleted) {
      stageName = 'Agreement Signing';
    } else {
      stageName = 'Final Review';
    }
  } else if (status === 'APPROVED') {
    stageName = 'Disbursal Ready';
  } else if (status === 'DISBURSED') {
    stageName = 'Active Loan';
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
      <View className="flex-1">
        {/* Redesigned Premium Header */}
        <View className="bg-slate-50 px-6 pt-4 pb-2 border-b border-slate-100 z-50">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={onBack}
              className="w-10 h-10 items-center justify-center rounded-2xl bg-white border border-slate-200/60 shadow-sm shadow-slate-100/50"
            >
              <Ionicons name="arrow-back" size={20} color="#0f172a" />
            </TouchableOpacity>

            <View className="items-center">
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Application ID</Text>
              <Text className="text-slate-900 font-black text-sm tracking-tight mt-0.5">
                #{app.applicationNo || app.id}
              </Text>
            </View>

            <View
              className="px-3.5 py-1.5 rounded-xl border flex-row items-center"
              style={{
                backgroundColor: getStatusBg(app.applicationStatus),
                borderColor: statusColor + '20',
              }}
            >
              <View className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: statusColor }} />
              <Text style={{ color: statusColor }} className="text-[9px] font-black uppercase tracking-widest">
                {app.applicationStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Premium Segmented Pill Tab Bar */}
        <View className="px-6 py-4 bg-slate-50/50">
          <View className="flex-row bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className="flex-1 py-2.5 rounded-xl items-center justify-center relative"
                  activeOpacity={0.8}
                >
                  {isActive && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'timing', duration: 200 }}
                      style={StyleSheet.absoluteFillObject}
                      className="bg-white rounded-xl shadow-sm border border-slate-200/20"
                    />
                  )}
                  <View className="flex-row items-center justify-center">
                    <Feather
                      name={tab.icon as any}
                      size={13}
                      color={isActive ? "#0f172a" : "#64748b"}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      className={`text-[11px] font-black tracking-wide ${
                        isActive ? "text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tab Content */}
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          <MotiView
            key={activeTab}
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400 }}
          >
            {activeTab === "loan" && (
              <LoanAccountTab
                app={app}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                autoOpenRepay={autoOpenRepay}
              />
            )}
            {activeTab === "overview" && (
              <OverviewTab
                app={app}
                profile={profile}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onResumeStep={onResumeStep ? () => onResumeStep(getResumeScreen(app)) : undefined}
                statusHistory={statusHistory}
                onDownloadAgreement={handleDownloadAgreement}
                isDownloadingAgreement={isDownloadingAgreement}
              />
            )}
            {activeTab === "documents" && <DocumentsTab app={app} />}
            {activeTab === "bank" && (
              <BankChargesTab
                app={app}
                profile={profile}
                formatCurrency={formatCurrency}
              />
            )}
          </MotiView>
          <View className="h-28" />
        </ScrollView>

        {/* Sticky Action Button for Non-Disbursed apps with pending steps */}
        {(() => {
          const isNotDisbursed = app.applicationStatus !== 'DISBURSED' && app.applicationStatus !== 'CANCELLED' && app.applicationStatus !== 'REJECTED';
          const reRulesEngineCompleted = app.applicationStepStatus?.rulesEngineCompleted ?? app.rulesEngineCompleted;
          const reBankVerificationCompleted = app.applicationStepStatus?.bankVerificationCompleted ?? app.bankVerificationCompleted;
          const reLoanAgreementCompleted = app.applicationStepStatus?.loanAgreementCompleted ?? app.loanAgreementCompleted;
          const hasPendingStep = isNotDisbursed && reRulesEngineCompleted && (!reBankVerificationCompleted || !reLoanAgreementCompleted);

          if (!hasPendingStep || !onResumeStep) return null;

          let btnLabel = '';
          let btnIcon: any = 'arrow-forward';
          if (!reBankVerificationCompleted) {
            btnLabel = 'Complete Bank Verification';
            btnIcon = 'card-outline';
          } else if (!reLoanAgreementCompleted) {
            btnLabel = 'Sign Loan Agreement';
            btnIcon = 'document-text-outline';
          }

          return (
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 300 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                paddingHorizontal: 20,
                paddingBottom: 24,
                paddingTop: 12,
                backgroundColor: 'rgba(248,250,252,0.95)',
                borderTopWidth: 1,
                borderTopColor: 'rgba(226,232,240,0.8)',
              }}
            >
              <TouchableOpacity
                onPress={() => onResumeStep(getResumeScreen(app))}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#E85D5D',
                  borderRadius: 18,
                  paddingVertical: 16,
                  shadowColor: '#E85D5D',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.35,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <Ionicons name={btnIcon} size={18} color="white" />
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 14, marginLeft: 8, letterSpacing: 0.2 }}>
                  {btnLabel}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
              <Text style={{ textAlign: 'center', color: '#94a3b8', fontSize: 10, fontWeight: '700', marginTop: 10, letterSpacing: 0.5 }}>
                You can always continue this later from your dashboard
              </Text>
            </MotiView>
          );
        })()}
      </View>
    </SafeAreaView>
  );
};

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web') {
      resolve(false);
      return;
    }
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/* ─────────────────────────────────────────────
 * LOAN ACCOUNT TAB (DISBURSED ONLY)
 * ───────────────────────────────────────────── */
const LoanAccountTab = ({ app, formatCurrency, formatDate, autoOpenRepay }: any) => {
  const queryClient = useQueryClient();
  
  // Standard loan account query
  const { data: response, isLoading: isAccountLoading } = useQuery({
    queryKey: ["loanAccount", app?.loanAccountId],
    queryFn: () => getLoanAccountById(app.loanAccountId).then((res) => res.data),
    enabled: !!app?.loanAccountId && !app?.lmsLoanId,
  });

  // LMS loan account query
  const { data: lmsLoanRes, isLoading: isLmsLoanLoading } = useQuery({
    queryKey: ["lmsLoanAccount", app?.lmsLoanId],
    queryFn: () => getLmsLoanAccountDetails(app.lmsLoanId!).then((res) => res.data || res),
    enabled: !!app?.lmsLoanId,
  });

  // LMS schedule query
  const { data: lmsScheduleRes, isLoading: isScheduleLoading } = useQuery({
    queryKey: ["repaymentSchedule", app?.lmsLoanId],
    queryFn: () => getRepaymentSchedule(app.lmsLoanId!).then((res) => res.data || res),
    enabled: !!app?.lmsLoanId,
  });

  const [selectedEmi, setSelectedEmi] = useState<any>(null);
  const [repaymentModalVisible, setRepaymentModalVisible] = useState(false);
  const [payAmount, setPayAmount] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  // Mock gateway states
  const [showMockGateway, setShowMockGateway] = useState(false);
  const [mockGatewayParams, setMockGatewayParams] = useState<any>(null);
  const [mockResolve, setMockResolve] = useState<any>(null);

  const lmsScheduleData = lmsScheduleRes;

  const emis = React.useMemo(() => {
    if (app?.lmsLoanId && lmsScheduleData) {
      return lmsScheduleData.map((item: any) => ({
        id: item.installmentNumber,
        emiDate: item.dueDate,
        paymentStatus: item.status === 'PAID' ? 'PAID' : item.status === 'OVERDUE' ? 'OVERDUE' : 'UNPAID',
        emi: item.emiAmount,
        principalDue: item.principalComponent,
        interestDue: item.interestComponent,
        outstandingPrincipal: item.outstandingPrincipal,
        outstandingInterest: item.outstandingInterest,
        paidPrincipal: item.paidPrincipal,
        paidInterest: item.paidInterest,
      }));
    }
    return response?.data?.emis || [];
  }, [app, lmsScheduleData, response]);

  const loan = React.useMemo(() => {
    if (app?.lmsLoanId && lmsLoanRes) {
      const lmsLoan = lmsLoanRes.data || lmsLoanRes;
      if (lmsLoan && (lmsLoan.totalOutstanding !== undefined || lmsLoan.outstandingPrincipal !== undefined)) {
        const paidAmount = lmsScheduleData
          ? lmsScheduleData.reduce((acc: number, item: any) => {
              if (item.status === 'PAID') {
                return acc + (item.emiAmount || 0);
              }
              return acc + (Number(item.paidPrincipal || 0) + Number(item.paidInterest || 0));
            }, 0)
          : 0;
        return {
          loanAmount: lmsLoan.sanctionedAmount || lmsLoan.disbursedAmount || app.requestedAmount || app.disbursalAmount || 0,
          loanStatus: lmsLoan.status || (app.applicationStatus === 'DISBURSED' ? 'ACTIVE' : app.applicationStatus || 'ACTIVE'),
          loanAccountNo: lmsLoan.loanNumber || app.loanAccountNo || `LMS-${app.lmsLoanId}`,
          disbursedOn: lmsLoan.disbursementDate || app.disbursedOn || app.updatedAt || new Date().toISOString(),
          outstandingBalance: lmsLoan.totalOutstanding ?? 0,
          paidAmount,
          overdueAmount: lmsLoan.totalOverdue ?? 0,
          totalPayableAmount: lmsLoan.totalDues ?? (lmsLoan.totalOutstanding ?? 0),
          emis: lmsScheduleData || [],
        };
      }
    }

    if (response?.data) return response.data;
    
    // Fallback: Compute summary from lmsScheduleData
    if (app?.lmsLoanId && lmsScheduleData && lmsScheduleData.length > 0) {
      const firstInstallment = lmsScheduleData[0];
      const totalAmount = lmsScheduleData.reduce((acc: number, item: any) => acc + item.emiAmount, 0);
      const paidAmount = lmsScheduleData.reduce((acc: number, item: any) => {
        if (item.status === 'PAID') {
          return acc + (item.emiAmount || 0);
        }
        return acc + (Number(item.paidPrincipal || 0) + Number(item.paidInterest || 0));
      }, 0);
      const outstandingBalance = lmsScheduleData.reduce((acc: number, item: any) => acc + (Number(item.outstandingPrincipal || 0) + Number(item.outstandingInterest || 0)), 0);
      const overdueAmount = lmsScheduleData.reduce((acc: number, item: any) => {
        if (item.status === 'OVERDUE') {
          const paid = Number(item.paidPrincipal || 0) + Number(item.paidInterest || 0);
          return acc + (item.emiAmount - paid);
        }
        return acc;
      }, 0);

      return {
        loanAmount: app.requestedAmount || app.disbursalAmount || firstInstallment.openingPrincipal || 0,
        loanStatus: app.applicationStatus === 'DISBURSED' ? 'ACTIVE' : app.applicationStatus || 'ACTIVE',
        loanAccountNo: app.loanAccountNo || `LMS-${app.lmsLoanId}`,
        disbursedOn: app.disbursedOn || app.updatedAt || new Date().toISOString(),
        outstandingBalance,
        paidAmount,
        overdueAmount,
        totalPayableAmount: outstandingBalance + overdueAmount,
        emis: lmsScheduleData,
      };
    }

    return null;
  }, [response, app, lmsScheduleData, lmsLoanRes]);

  const triggerRazorpayCheckout = (params: any): Promise<any> => {
    return new Promise(async (resolve) => {
      if (Platform.OS === 'web') {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          resolve({ success: false, error: 'Failed to load Razorpay script' });
          return;
        }
        const options = {
          key: params.razorpayKeyId,
          amount: params.amount,
          currency: params.currency || 'INR',
          name: 'AlphaWare Finance',
          description: 'EMI Repayment',
          order_id: params.razorpayOrderId,
          handler: function (response: any) {
            resolve({
              success: true,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
          },
          prefill: {
            name: params.customerName,
            email: params.customerEmail,
            contact: params.customerContact,
          },
          modal: {
            ondismiss: function () {
              resolve({
                success: false,
                error: 'Payment window closed by user.',
              });
            }
          },
          theme: {
            color: '#7c3aed',
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Native SDK check
        if (isFeatureEnabled('enableRazorpay')) {
          try {
            const RazorpayCheckout = require('react-native-razorpay').default;
            const checkoutOptions = {
              key: params.razorpayKeyId,
              order_id: params.razorpayOrderId,
              amount: params.amount,
              currency: params.currency,
              name: 'AlphaWare Finance',
              description: 'EMI Repayment',
              prefill: {
                name: params.customerName,
                email: params.customerEmail,
                contact: params.customerContact,
              },
              theme: {
                color: '#7c3aed',
              },
            };
            const response = await RazorpayCheckout.open(checkoutOptions);
            resolve({
              success: true,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
            return;
          } catch (sdkError) {
            console.warn('[Razorpay SDK] Failed to open. Falling back to simulation.', sdkError);
          }
        }

        // Simulation Fallback for Expo Go / Dev Sandbox
        setMockGatewayParams(params);
        setMockResolve(() => resolve);
        setShowMockGateway(true);
      }
    });
  };

  const manualPaymentMutation = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      const payResponse = await initiateManualPayment(app.id, amount);
      const payData = payResponse?.data || payResponse;
      return payData;
    },
    onSuccess: async (payData) => {
      try {
        const result = await triggerRazorpayCheckout({
          razorpayKeyId: payData.razorpayKeyId,
          razorpayOrderId: payData.razorpayOrderId,
          amount: payData.amount,
          currency: payData.currency || 'INR',
          customerName: payData.customerName || app.customerName || '',
          customerEmail: payData.customerEmail || '',
          customerContact: payData.customerContact || '',
        });

        if (result.success) {
          await verifyManualPayment(app.id, {
            razorpayOrderId: result.orderId!,
            razorpayPaymentId: result.paymentId!,
            razorpaySignature: result.signature!,
          });

          setIsSuccess(true);
          queryClient.invalidateQueries({ queryKey: ["loanAccount", app.loanAccountId] });
          queryClient.invalidateQueries({ queryKey: ["lmsLoanAccount", app.lmsLoanId] });
          queryClient.invalidateQueries({ queryKey: ["repaymentSchedule", app.lmsLoanId] });
          queryClient.invalidateQueries({ queryKey: ["application", app.id] });
        } else {
          setIsFailed(true);
          Toast.show({
            type: 'error',
            text1: 'Payment Cancelled / Failed',
            text2: result.error || 'The payment was not completed.',
            position: 'bottom',
          });
        }
      } catch (err: any) {
        setIsFailed(true);
        const errorMsg = err.response?.data?.message || err.message || 'Error completing payment.';
        Toast.show({
          type: 'error',
          text1: 'Payment Verification Failed',
          text2: errorMsg,
          position: 'bottom',
        });
      }
    },
    onError: (error: any) => {
      setIsFailed(true);
      const errorMsg = error.response?.data?.message || error.message || "Failed to initiate payment";
      Toast.show({
        type: 'error',
        text1: 'Payment Initiation Failed',
        text2: errorMsg,
        position: 'bottom',
      });
    }
  });

  React.useEffect(() => {
    if (autoOpenRepay && emis.length > 0) {
      const firstUnpaid = emis.find((e: any) => e.paymentStatus !== "PAID");
      if (firstUnpaid) {
        openRepaymentModal(firstUnpaid);
      } else if (autoOpenRepay) {
        Toast.show({
          type: 'info',
          text1: 'Loan Fully Paid',
          text2: 'All installments for this loan have been completed.',
          position: 'bottom',
        });
      }
    }
  }, [autoOpenRepay, emis]);

  const openRepaymentModal = (emi: any) => {
    setSelectedEmi(emi);
    setPayAmount(String(emi.emi));
    setIsSuccess(false);
    setIsFailed(false);
    setRepaymentModalVisible(true);
  };

  const closeRepaymentModal = () => {
    setRepaymentModalVisible(false);
    setIsSuccess(false);
    setIsFailed(false);
  };

  const handleRepay = () => {
    if (!selectedEmi) return;
    const amount = Number(payAmount);
    if (isNaN(amount) || amount < 1000) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Amount',
        text2: 'Minimum repayment amount is ₹1,000.',
        position: 'bottom'
      });
      return;
    }
    manualPaymentMutation.mutate({ amount });
  };

  const isLoading = (!!app?.loanAccountId && !app?.lmsLoanId && isAccountLoading) || 
                    (!!app?.lmsLoanId && (isScheduleLoading || isLmsLoanLoading));

  if (isLoading || !loan) {
    return (
      <View className="py-20 items-center justify-center">
        <LottieView
          source={require('../../assets/new-loader.json')}
          autoPlay
          loop
          style={{ width: 100, height: 100 }}
          resizeMode="contain"
        />
        <Text className="text-slate-400 mt-4 font-bold tracking-widest text-xs uppercase">Loading Account</Text>
      </View>
    );
  }

  const paidEmisCount = emis?.filter((e: any) => e.paymentStatus === "PAID").length || 0;
  const totalEmisCount = emis?.length || 0;
  const progressPercent = totalEmisCount > 0
    ? Math.round((paidEmisCount / totalEmisCount) * 100)
    : 0;

  const payoffDate = emis?.length > 0 ? emis[emis.length - 1].emiDate : loan.closedOn;

  return (
    <View>
      {/* Premium Hero Card */}
      <MotiView
        from={{ opacity: 0, scale: 0.95, translateY: 10 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 600 }}
      >
        <LinearGradient
          colors={["#7c3aed", "#5b21b6", "#4c1d95"]}
          className="rounded-[32px] p-6 mb-8 mt-2 shadow-xl shadow-purple-500/30 overflow-hidden relative border border-white/10"
          style={{ minHeight: 220 }}
        >
          {/* Wave/Circle Background Ornaments */}
          <View className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full border border-white/5" />
          <View className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full" />

          {/* Card Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center space-x-2">
              <MaterialCommunityIcons name="integrated-circuit-chip" size={28} color="rgba(255,255,255,0.7)" />
              <Text className="text-white/80 text-[10px] font-black uppercase tracking-[3px] ml-2">AlphaWare Pay</Text>
            </View>
            <View className="bg-white/10 border border-white/20 px-3 py-1 rounded-full">
              <Text className="text-white/90 text-[8px] font-black uppercase tracking-wider">
                {app.productName || "Active Loan"}
              </Text>
            </View>
          </View>

          {/* Card Body */}
          <View className="flex-row justify-between items-end mb-6">
            <View>
              <Text className="text-purple-200 text-[9px] font-black uppercase tracking-widest mb-1.5">Outstanding Balance</Text>
              <Text className="text-white text-3xl font-black tracking-tight">{formatCurrency(loan.outstandingBalance)}</Text>
            </View>
            
            <View className="items-end bg-white/20 border border-white/35 px-4 py-2 rounded-2xl">
              <Text className="text-[10px] text-white font-black uppercase tracking-wider">{loan.loanStatus}</Text>
            </View>
          </View>

          {/* Glassmorphic Stats Bar */}
          <View className="bg-white/10 border border-white/20 px-4 py-3 rounded-2xl flex-row justify-between mb-5">
            <View className="flex-1 items-center border-r border-white/15">
              <Text className="text-white/50 text-[8px] font-black uppercase tracking-wider mb-0.5">Loan Limit</Text>
              <Text className="text-white text-xs font-black">{formatCurrency(loan.loanAmount)}</Text>
            </View>
            <View className="flex-1 items-center border-r border-white/15">
              <Text className="text-white/50 text-[8px] font-black uppercase tracking-wider mb-0.5">Paid EMIs</Text>
              <Text className="text-white text-xs font-black">{paidEmisCount}/{totalEmisCount}</Text>
            </View>
            <View className="flex-1 items-center border-r border-white/15">
              <Text className="text-white/50 text-[8px] font-black uppercase tracking-wider mb-0.5">Progress</Text>
              <Text className="text-white text-xs font-black">{progressPercent}%</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-white/50 text-[8px] font-black uppercase tracking-wider mb-0.5">Payoff Date</Text>
              <Text className="text-white text-xs font-black">{formatDate(payoffDate)}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between space-x-3 z-10">
            <Pressable
              onPress={() => {
                const firstUnpaid = emis?.find((emi: any) => emi.paymentStatus !== "PAID");
                if (firstUnpaid) {
                  openRepaymentModal(firstUnpaid);
                } else {
                  Toast.show({
                    type: 'success',
                    text1: 'Fully Paid',
                    text2: 'Great job! You have no pending installments.',
                    position: 'bottom',
                  });
                }
              }}
              className="flex-1 bg-white/15 border border-white/20 flex-row items-center justify-center py-3.5 rounded-2xl mr-2 active:bg-white/25"
              style={({ pressed }) => [
                pressed && { transform: [{ scale: 0.98 }] }
              ]}
            >
              <Ionicons name="wallet-outline" size={16} color="white" />
              <Text className="text-white font-black text-xs ml-2 tracking-wide uppercase">Repay EMI</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </MotiView>

      {/* Account Particulars */}
      <MotiView
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 200, type: "timing", duration: 500 }}
      >
        <Text style={styles.sectionTitle} className="mb-4">Account Summary</Text>
        <View className="bg-white rounded-[24px] p-5 border border-slate-100 mb-8 flex-row flex-wrap justify-between shadow-sm shadow-slate-200/50">
          <View className="w-[48%] mb-5">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Account No</Text>
            <Text className="text-slate-900 font-bold text-sm">{loan.loanAccountNo}</Text>
          </View>
          <View className="w-[48%] mb-5">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Disbursed On</Text>
            <Text className="text-slate-900 font-bold text-sm">{formatDate(loan.disbursedOn)}</Text>
          </View>

          <View className="w-[48%] mb-5">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Outstanding</Text>
            <Text className="text-red-500 font-black text-sm">{formatCurrency(loan.outstandingBalance)}</Text>
          </View>

          <View className="w-[48%] mb-5">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Overdue Amt</Text>
            <Text className="text-slate-900 font-bold text-sm">{formatCurrency(loan.overdueAmount)}</Text>
          </View>
          <View className="w-[48%]">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Net Payable</Text>
            <Text className="text-slate-900 font-bold text-sm">{formatCurrency(loan.totalPayableAmount)}</Text>
          </View>
        </View>
      </MotiView>

      {/* Repayment Schedule */}
      <MotiView
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 300, type: "timing", duration: 500 }}
      >
        <View className="flex-row justify-between items-center mb-4">
          <Text style={styles.sectionTitle}>Repayment Schedule</Text>
          <View className="bg-slate-100 px-3 py-1 rounded-full">
            <Text className="text-slate-600 font-black text-[10px] uppercase">{emis?.length || 0} EMIs</Text>
          </View>
        </View>

        <View className="bg-white rounded-[24px] border border-slate-100 mb-8 overflow-hidden shadow-sm shadow-slate-200/50">
          {emis?.map((emi: any, idx: number) => {
            const isPaid = emi.paymentStatus === "PAID";
            const isOverdue = emi.paymentStatus === "OVERDUE";

            return (
              <Pressable
                key={emi.id || idx}
                onPress={() => {
                  if (!isPaid) {
                    openRepaymentModal(emi);
                  }
                }}
                className={`p-5 flex-row justify-between items-center ${idx !== emis.length - 1 ? 'border-b border-slate-50' : ''} ${!isPaid ? 'active:bg-slate-50' : ''}`}
                style={({ pressed }) => [
                  !isPaid && pressed && { opacity: 0.7 }
                ]}
              >
                <View className="flex-row items-center flex-1">
                  <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${isPaid ? "bg-emerald-50" : isOverdue ? "bg-red-50" : "bg-slate-50"
                    }`}>
                    <Ionicons
                      name={isPaid ? "checkmark-circle" : isOverdue ? "warning" : "calendar"}
                      size={18}
                      color={isPaid ? "#10b981" : isOverdue ? "#ef4444" : "#94a3b8"}
                    />
                  </View>
                  <View>
                    <Text className="text-slate-900 font-black tracking-tight">{formatDate(emi.emiDate)}</Text>
                    <Text className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isPaid ? "text-emerald-600" : isOverdue ? "text-red-600" : "text-slate-400"
                      }`}>
                      {emi.paymentStatus}
                    </Text>
                  </View>
                </View>

                <View className="items-end flex-row">
                  <View className="items-end mr-3">
                    <Text className="text-slate-900 font-black">{formatCurrency(emi.emi)}</Text>
                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                      Prin: {formatCurrency(emi.principalDue)}
                    </Text>
                  </View>
                  {!isPaid && (
                    <View className="bg-purple-600 px-4 py-2 rounded-xl">
                      <Text className="text-white text-[10px] font-black tracking-widest uppercase">Pay Now</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}

          {(!emis || emis.length === 0) && (
            <View className="p-8 items-center">
              <Text className="text-slate-400 font-bold">No schedule available</Text>
            </View>
          )}
        </View>
      </MotiView>

      {/* Repayment Modal */}
      <Modal
        visible={repaymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeRepaymentModal}
      >
        <View style={styles.repaymentModalRoot}>
          <TouchableWithoutFeedback onPress={closeRepaymentModal}>
            <View style={styles.repaymentBackdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.repaymentSheet}>
            {isSuccess ? (
              <View className="items-center py-10">
                <LottieView
                  source={require("../../assets/Success.json")}
                  autoPlay
                  loop={false}
                  style={{ width: 250, height: 250 }}
                  onAnimationFinish={() => {
                    closeRepaymentModal();
                  }}
                />
                <Text className="text-slate-900 text-xl font-black mt-4">Payment Successful!</Text>
                <Text className="text-slate-500 text-sm mt-2 text-center px-4">Your EMI payment has been processed successfully.</Text>
              </View>
            ) : isFailed ? (
              <View className="items-center py-10">
                <LottieView
                  source={require("../../assets/Failed.json")}
                  autoPlay
                  loop={false}
                  style={{ width: 200, height: 200 }}
                />
                <Text className="text-slate-900 text-xl font-black mt-6">Payment Failed</Text>
                <Text className="text-slate-500 text-sm mt-2 text-center px-8 mb-8">We couldn't process your payment. Please try again or contact support.</Text>

                <Pressable
                  onPress={() => setIsFailed(false)}
                  className="bg-purple-600 px-10 py-4 rounded-2xl shadow-lg shadow-purple-500/30"
                >
                  <Text className="text-white font-black text-sm">Try Again</Text>
                </Pressable>

                <Pressable
                  onPress={closeRepaymentModal}
                  className="mt-4 px-6 py-2"
                >
                  <Text className="text-slate-400 font-bold text-xs">Close</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View className="flex-row justify-between items-center mb-6">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-purple-50 rounded-xl items-center justify-center mr-3">
                      <Ionicons name="wallet" size={20} color="#7c3aed" />
                    </View>
                    <Text className="text-xl font-black text-slate-900 tracking-tight">Repay EMI</Text>
                  </View>
                  <Pressable
                    onPress={closeRepaymentModal}
                    className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center active:opacity-70"
                  >
                    <Ionicons name="close" size={16} color="#64748b" />
                  </Pressable>
                </View>

                {selectedEmi && (
                  <LinearGradient
                    colors={["#f3e8ff", "#e9d5ff"]}
                    className="p-6 rounded-3xl mb-6 flex-row justify-between items-center border border-purple-100 shadow-sm shadow-purple-100"
                  >
                    <View>
                      <Text className="text-purple-600 text-[10px] font-black uppercase tracking-widest mb-1">Scheduled EMI</Text>
                      <Text className="text-purple-900 text-3xl font-black">{formatCurrency(selectedEmi.emi)}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-purple-600 text-[10px] font-black uppercase tracking-widest mb-1">Due Date</Text>
                      <View className="bg-white/60 px-3 py-1.5 rounded-lg mt-0.5 border border-white/40">
                        <Text className="text-purple-900 font-bold text-xs">{formatDate(selectedEmi.emiDate)}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                )}

                <View className="mb-8">
                  <Text className="text-slate-700 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">Repayment Amount (INR)</Text>
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-1">
                    <Text className="text-slate-900 text-lg font-black mr-1">₹</Text>
                    <TextInput
                      value={payAmount}
                      onChangeText={setPayAmount}
                      keyboardType="numeric"
                      placeholder="Enter payment amount"
                      placeholderTextColor="#94a3b8"
                      className="flex-1 py-3.5 text-slate-900 font-black text-lg"
                    />
                  </View>
                  {Number(payAmount) < 1000 && (
                    <Text className="text-red-500 text-[10px] font-bold mt-2 ml-1">
                      ⚠️ Minimum manual repayment amount is ₹1,000.
                    </Text>
                  )}
                </View>

                <Pressable
                  onPress={handleRepay}
                  disabled={manualPaymentMutation.isPending || Number(payAmount) < 1000}
                  className={`bg-purple-600 py-4 rounded-2xl flex-row justify-center items-center mb-4 ${
                    manualPaymentMutation.isPending || Number(payAmount) < 1000 ? "opacity-50" : "active:opacity-90"
                  }`}
                  style={({ pressed }) => [
                    !(manualPaymentMutation.isPending || Number(payAmount) < 1000) && {
                      shadowColor: "#7c3aed",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6,
                    },
                    pressed && { transform: [{ scale: 0.98 }] }
                  ]}
                >
                  {manualPaymentMutation.isPending ? (
                    <LottieView
                      source={require("../../assets/new-loader.json")}
                      autoPlay
                      loop
                      style={{ width: 28, height: 28 }}
                    />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={18} color="white" />
                      <Text className="text-white font-black text-sm tracking-wide ml-2">Proceed to Pay</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  onPress={closeRepaymentModal}
                  className="bg-slate-100 py-4 rounded-2xl flex-row justify-center items-center mb-4 active:bg-slate-200"
                >
                  <Text className="text-slate-700 font-black text-sm tracking-wide">Cancel</Text>
                </Pressable>

                <View className="flex-row items-center justify-center pb-2">
                  <Ionicons name="lock-closed" size={10} color="#94a3b8" />
                  <Text className="text-slate-400 text-[10px] font-bold ml-1">Secure payment gateway powered by Razorpay</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Mock Razorpay Gateway Modal */}
      <Modal
        visible={showMockGateway}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowMockGateway(false);
          if (mockResolve) mockResolve({ success: false, error: 'Cancelled' });
        }}
      >
        <View className="flex-1 bg-slate-900/60 justify-center items-center px-6">
          <View className="bg-white w-full max-w-sm rounded-[32px] p-6 border border-slate-100 shadow-2xl">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <View className="flex-row items-center">
                <Ionicons name="card" size={24} color="#1E40AF" />
                <Text className="text-lg font-black text-slate-900 ml-2">razorpay</Text>
                <View className="bg-blue-50 px-2 py-0.5 rounded-md ml-2 border border-blue-100">
                  <Text className="text-blue-700 text-[8px] font-black uppercase tracking-wider">Sandbox</Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  setShowMockGateway(false);
                  if (mockResolve) mockResolve({ success: false, error: 'Cancelled' });
                }}
                className="w-8 h-8 bg-slate-50 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={16} color="#64748b" />
              </Pressable>
            </View>

            {/* Details */}
            <View className="space-y-4 mb-8">
              <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <Text className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Payment Amount</Text>
                <Text className="text-slate-900 text-3xl font-black mt-1">
                  {formatCurrency((mockGatewayParams?.amount || 0) / 100)}
                </Text>
              </View>

              <View className="space-y-2 px-1">
                <View className="flex-row justify-between">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase">Order ID</Text>
                  <Text className="text-[10px] text-slate-700 font-black">{mockGatewayParams?.razorpayOrderId}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase">Customer</Text>
                  <Text className="text-[10px] text-slate-700 font-black">{mockGatewayParams?.customerName}</Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View className="space-y-3">
              <Pressable
                onPress={() => {
                  setShowMockGateway(false);
                  if (mockResolve) {
                    mockResolve({
                      success: true,
                      paymentId: `pay_mock_${Date.now()}`,
                      orderId: mockGatewayParams.razorpayOrderId,
                      signature: `sig_mock_${Date.now()}`,
                    });
                  }
                }}
                className="bg-blue-600 py-4 rounded-2xl items-center justify-center active:bg-blue-700 shadow-md shadow-blue-500/10"
              >
                <Text className="text-white font-black text-sm">Simulate Payment Success</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowMockGateway(false);
                  if (mockResolve) {
                    mockResolve({
                      success: false,
                      error: 'Payment simulated failure/cancellation',
                    });
                  }
                }}
                className="bg-slate-100 py-4 rounded-2xl items-center justify-center active:bg-slate-200"
              >
                <Text className="text-slate-700 font-black text-sm">Cancel Payment</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

/* ─────────────────────────────────────────────
 * OVERVIEW TAB
 * ───────────────────────────────────────────── */
const InfoGridCell = ({ icon, label, value, color = "#6366f1" }: any) => (
  <View className="w-[48%] mb-5 flex-row items-center">
    <View
      style={{ backgroundColor: color + '10' }}
      className="w-9 h-9 rounded-xl items-center justify-center mr-3"
    >
      <Feather name={icon as any} size={15} color={color} />
    </View>
    <View className="flex-1">
      <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wider">{label}</Text>
      <Text className="text-slate-805 font-bold text-xs mt-0.5" numberOfLines={1}>
        {value || "N/A"}
      </Text>
    </View>
  </View>
);
const getStatusBadgeColors = (status: string) => {
  switch (status) {
    case "APPROVED":
    case "BRE_APPROVED":
    case "SANCTION_SIGNED":
      return { bg: "bg-emerald-50", text: "text-emerald-600" };
    case "REJECTED":
    case "BRE_REJECTED":
    case "FAILED":
      return { bg: "bg-red-50", text: "text-red-600" };
    case "PENDING":
    case "UNDER_REVIEW":
    case "BRE_PROCESSING":
    case "SANCTION_SIGN_INITIATED":
      return { bg: "bg-amber-50", text: "text-amber-600" };
    case "DISBURSED":
      return { bg: "bg-indigo-50", text: "text-indigo-600" };
    default:
      return { bg: "bg-slate-100", text: "text-slate-600" };
  }
};

const mapStatusLabel = (status: string) => {
  if (!status) return "N/A";
  switch (status) {
    case "BRE_APPROVED":
      return "Eligibility Approved";
    case "BRE_REJECTED":
      return "Eligibility Rejected";
    case "BRE_PROCESSING":
      return "Eligibility Processing";
    case "SANCTION_GENERATED":
      return "Sanction Generated";
    case "SANCTION_SIGN_INITIATED":
      return "Signature Pending";
    case "SANCTION_SIGNED":
      return "Agreement Signed";
    case "DISBURSED":
      return "Disbursed";
    case "DRAFT":
      return "Draft";
    case "SUBMITTED":
      return "Submitted";
    case "UNDER_REVIEW":
      return "Under Review";
    default:
      return status.replace(/_/g, " ");
  }
};

const OverviewTab = ({ app, profile, formatCurrency, formatDate, onResumeStep, statusHistory, onDownloadAgreement, isDownloadingAgreement }: any) => {
  const queryClient = useQueryClient();
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const rulesEngineCompleted = app.applicationStepStatus?.rulesEngineCompleted ?? app.rulesEngineCompleted;
  const bankVerificationCompleted = app.applicationStepStatus?.bankVerificationCompleted ?? app.bankVerificationCompleted;
  const loanAgreementCompleted = app.applicationStepStatus?.loanAgreementCompleted ?? app.loanAgreementCompleted;
  const disbursalCompleted = app.applicationStatus === 'DISBURSED';
  const isCancelledOrRejected = app.applicationStatus === 'CANCELLED' || app.applicationStatus === 'REJECTED';
  const isAutoPayEnabled = app.isAutoPayEnabled ?? false;
  const isAgreementSign = app.isAgreementSign ?? false;
  const showPendingOverviewActions = !isCancelledOrRejected;

  const rulesEngineActive = !rulesEngineCompleted;
  const bankVerificationActive = rulesEngineCompleted && !bankVerificationCompleted;
  const loanAgreementActive = bankVerificationCompleted && !loanAgreementCompleted;
  const disbursalActive = loanAgreementCompleted && !disbursalCompleted;

  // Chronologically sorted history (oldest first for milestone dates)
  const historyList = statusHistory
    ? [...statusHistory].sort((a: any, b: any) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())
    : [];

  // Milestone 1: Profile Setup / Submission
  const isSubmittedCompleted = app.applicationStatus !== 'DRAFT' || historyList.length > 0;
  const submittedStatus = isSubmittedCompleted ? 'COMPLETED' : 'IN_PROGRESS';
  const submittedItem = historyList.find((h: any) => h.toStatus === 'BRE_PROCESSING' || h.toStatus === 'SUBMITTED' || h.toStatus === 'UNDER_REVIEW');
  const submittedDate = submittedItem?.occurredAt || app.createdOn;

  // Milestone 2: Credit & Eligibility Check (BRE)
  const breApprovedItem = historyList.find((h: any) => h.toStatus === 'BRE_APPROVED' || h.toStatus === 'SANCTION_GENERATED');
  const breRejectedItem = historyList.find((h: any) => h.toStatus === 'BRE_REJECTED');
  const isBreCompleted = !!breApprovedItem || rulesEngineCompleted;
  const isBreFailed = !!breRejectedItem && !isBreCompleted;
  const isBreActive = !isBreCompleted && !isBreFailed && (app.applicationStatus === 'BRE_PROCESSING' || app.applicationStatus === 'UNDER_REVIEW' || historyList.some((h: any) => h.toStatus === 'BRE_PROCESSING'));
  
  const breStatus = isBreCompleted ? 'COMPLETED' : isBreFailed ? 'FAILED' : isBreActive ? 'IN_PROGRESS' : 'PENDING';
  const breDate = breApprovedItem?.occurredAt || breRejectedItem?.occurredAt;
  const breRemark = breApprovedItem?.remark || breRejectedItem?.remark;

  // Milestone 3: Bank Account Verification
  const isBankCompleted = bankVerificationCompleted || isAgreementSign || loanAgreementCompleted || disbursalCompleted || historyList.some((h: any) => ['SANCTION_GENERATED', 'SANCTION_SIGN_INITIATED', 'SANCTION_SIGNED', 'DISBURSED'].includes(h.toStatus));
  const isBankActive = isBreCompleted && !isBreFailed && !isBankCompleted;
  const bankStatus = isBankCompleted ? 'COMPLETED' : isBankActive ? 'IN_PROGRESS' : 'PENDING';
  const bankDate = historyList.find((h: any) => h.fromStatus === 'BRE_APPROVED' && h.toStatus === 'SANCTION_GENERATED')?.occurredAt || app.updatedAt;

  // Milestone 4: Sanction & Loan Agreement
  const esignCompletedItem = historyList.find((h: any) => h.toStatus === 'SANCTION_SIGNED');
  const esignInitiatedItem = historyList.find((h: any) => h.toStatus === 'SANCTION_SIGN_INITIATED');
  const isAgreementCompleted = !!esignCompletedItem || loanAgreementCompleted || disbursalCompleted;
  const isAgreementActive = isBankCompleted && !isAgreementCompleted;
  const agreementStatus = isAgreementCompleted ? 'COMPLETED' : isAgreementActive ? 'IN_PROGRESS' : 'PENDING';
  const esignDate = esignCompletedItem?.occurredAt || esignInitiatedItem?.occurredAt;
  const esignRemark = esignCompletedItem?.remark || esignInitiatedItem?.remark;

  // Milestone 5: Loan Disbursal
  const disbursalItem = historyList.find((h: any) => h.toStatus === 'DISBURSED');
  const isDisbursalCompleted = !!disbursalItem || disbursalCompleted;
  const isDisbursalActive = isAgreementCompleted && !isDisbursalCompleted;
  const disbursalStatus = isDisbursalCompleted ? 'COMPLETED' : isDisbursalActive ? 'IN_PROGRESS' : 'PENDING';
  const disbursalDate = disbursalItem?.occurredAt;
  const disbursalRemark = disbursalItem?.remark;

  // Determine if there's an action required banner to show
  const showActionBanner = !isCancelledOrRejected && !disbursalCompleted && rulesEngineCompleted && (!bankVerificationCompleted || !loanAgreementCompleted) && !!onResumeStep;
  const pendingActionLabel = !bankVerificationCompleted
    ? 'Bank Verification'
    : 'Agreement Signing';
  const pendingActionIcon: any = !bankVerificationCompleted ? 'card-outline' : 'document-text-outline';

  const openGatewayUrl = async (url?: string | null) => {
    if (!url) return false;

    await WebBrowser.openBrowserAsync(url);
    return true;
  };

  const autoPayMutation = useMutation({
    mutationFn: () => initiateAutopay(app.id),
    onSuccess: async (response: any) => {
      const mandate = response?.data || response;
      const authUrl = mandate?.authUrl || mandate?.authorizationUrl || mandate?.authorization_url || mandate?.short_url || mandate?.url || mandate?.redirectUrl || mandate?.redirect_url;
      const subscriptionId = mandate?.subscriptionId;

      if (isFeatureEnabled('enableRazorpay') && subscriptionId) {
        if (Platform.OS === 'web') {
          // Web SDK Subscription flow
          const scriptLoaded = await loadRazorpayScript();
          if (scriptLoaded) {
            try {
              const options = {
                key: env.razorpayKeyId,
                subscription_id: subscriptionId,
                name: 'AlphaWare Finance',
                description: `EMI AutoPay - ₹${mandate.emiAmount || app.emi || ''}`,
                prefill: {
                  name: app.customerName || useLoanStore.getState().customerInfo?.applicantName || '',
                  contact: app.customerContact || app.customerMobile || useAuthStore.getState().mobile || useLoanStore.getState().customerInfo?.mobileNumber || '',
                  email: app.customerEmail || useLoanStore.getState().customerInfo?.email || '',
                },
                theme: {
                  color: '#7c3aed',
                },
                handler: function (rzpResponse: any) {
                  Toast.show({
                    type: 'success',
                    text1: 'AutoPay Authorized',
                    text2: 'AutoPay mandate setup completed successfully.',
                    position: 'bottom',
                  });
                  queryClient.invalidateQueries({ queryKey: ["application", app.id] });
                },
                modal: {
                  ondismiss: function () {
                    Toast.show({
                      type: 'info',
                      text1: 'AutoPay Mandate Cancelled',
                      text2: 'Authorization process was cancelled by the user.',
                      position: 'bottom',
                    });
                  }
                }
              };
              const rzp = new (window as any).Razorpay(options);
              rzp.open();
              return;
            } catch (err: any) {
              console.warn('[Web Razorpay Subscription] Failed to open Web checkout, falling back to URL:', err);
            }
          }
        } else {
          // Native SDK Subscription flow
          try {
            console.log('[AutoPay Setup] Launching Razorpay SDK for subscription:', subscriptionId);
            const RazorpayCheckout = require('react-native-razorpay').default;

            const checkoutOptions = {
              key: env.razorpayKeyId,
              subscription_id: subscriptionId,
              name: 'AlphaWare Finance',
              description: `EMI AutoPay - ₹${mandate.emiAmount || app.emi || ''}`,
              prefill: {
                name: app.customerName || useLoanStore.getState().customerInfo?.applicantName || '',
                contact: app.customerContact || app.customerMobile || useAuthStore.getState().mobile || useLoanStore.getState().customerInfo?.mobileNumber || '',
                email: app.customerEmail || useLoanStore.getState().customerInfo?.email || '',
              },
              theme: {
                color: '#7c3aed',
              },
            };

            const rzpData = await RazorpayCheckout.open(checkoutOptions);
            console.log('[AutoPay Setup] Razorpay SDK authorized:', rzpData);

            Toast.show({
              type: 'success',
              text1: 'AutoPay Authorized',
              text2: 'AutoPay mandate setup completed successfully.',
              position: 'bottom',
            });
            queryClient.invalidateQueries({ queryKey: ["application", app.id] });
            return;
          } catch (sdkError: any) {
            console.warn('[AutoPay Setup] Razorpay SDK failed or cancelled, falling back to WebBrowser:', sdkError);
          }
        }
      }

      if (authUrl) {
        await openGatewayUrl(authUrl);
      }

      Toast.show({
        type: 'success',
        text1: authUrl ? 'AutoPay Started' : 'AutoPay Initiated',
        text2: authUrl ? 'Complete the mandate authorization to enable auto debit.' : 'AutoPay request has been initiated.',
        position: 'bottom',
      });
      queryClient.invalidateQueries({ queryKey: ["application", app.id] });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'AutoPay Failed',
        text2: error.response?.data?.message || error.message || 'Unable to initiate AutoPay. Please try again.',
        position: 'bottom',
      });
    },
  });

  const eSignMutation = useMutation({
    mutationFn: () => initiateESign(app.id),
    onSuccess: async (esignData: any) => {
      // initiateESign already returns response.data?.data so esignData is the payload directly
      const docId = esignData?.docId || esignData?.documentId;
      let signingLink = esignData?.signingLink || esignData?.signing_link || esignData?.url || esignData?.esignUrl || esignData?.redirectUrl || esignData?.redirect_url;

      if (isDigioSdkSupported() && docId) {
        console.log('[ApplicationDetailsScreen] Native Digio SDK is supported. Launching native gateway...');
        const identifier = esignData?.identifier || useAuthStore.getState().mobile || useLoanStore.getState().customerInfo?.mobileNumber || '';

        try {
          const digio = createDigioInstance();
          const tokenId = signingLink ? extractTokenIdFromUrl(signingLink, docId) : undefined;
          console.log('[ApplicationDetailsScreen] Extracted Token ID for native SDK:', tokenId);

          const result = await startEsignFlow(digio, docId, identifier, tokenId);
          console.log('[ApplicationDetailsScreen] Native SDK flow result:', result);

          if (result.success) {
            try {
              await refreshESignStatus(app.id);
            } catch (statusError) {
              console.error('[ApplicationDetailsScreen] Failed to refresh eSign status on backend:', statusError);
            }

            Toast.show({
              type: 'success',
              text1: 'eSign Completed',
              text2: 'Your sanction letter has been signed successfully!',
              position: 'bottom',
            });
            queryClient.invalidateQueries({ queryKey: ['application', app.id] });
            return;
          } else {
            Toast.show({
              type: 'error',
              text1: 'eSign Cancelled / Failed',
              text2: result.message || 'The eSign process failed or was cancelled.',
              position: 'bottom',
            });
            return;
          }
        } catch (sdkError: any) {
          console.error('[ApplicationDetailsScreen] SDK invocation crashed, falling back to browser:', sdkError);
        }
      }

      // Fallback: WebBrowser based flow
      if (signingLink) {
        await openGatewayUrl(signingLink);
        Toast.show({
          type: 'success',
          text1: 'eSign Started',
          text2: 'Complete the sanction letter eSign in the secure window.',
          position: 'bottom',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'eSign Failed',
          text2: 'Unable to initiate eSign. No signing link returned.',
          position: 'bottom',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['application', app.id] });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'eSign Failed',
        text2: error.response?.data?.message || error.message || 'Unable to initiate eSign. Please try again.',
        position: 'bottom',
      });
    },
  });

  return (
    <View>
      {/* Redesigned Premium Banking Hero Card */}
      <MotiView
        from={{ opacity: 0, scale: 0.95, translateY: 10 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 600 }}
        className="mb-8"
      >
        <LinearGradient
          colors={
            app.applicationStatus === "APPROVED"
              ? ["#059669", "#047857", "#065f46"]
              : app.applicationStatus === "DISBURSED"
              ? ["#6366f1", "#4f46e5", "#3730a3"]
              : app.applicationStatus === "REJECTED"
              ? ["#ef4444", "#dc2626", "#991b1b"]
              : ["#1e293b", "#0f172a", "#020617"]
          }
          className="rounded-[32px] p-6 shadow-xl shadow-slate-900/10 overflow-hidden relative border border-white/10"
          style={{ minHeight: 220 }}
        >
          {/* Wave/Circle Background Ornaments */}
          <View className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full border border-white/5" />
          <View className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full" />

          {/* Card Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center space-x-2">
              <MaterialCommunityIcons name="integrated-circuit-chip" size={28} color="rgba(255,255,255,0.7)" />
              <Text className="text-white/80 text-[10px] font-black uppercase tracking-[3px] ml-2">AlphaWare Pay</Text>
            </View>
            <View className="bg-white/10 border border-white/20 px-3 py-1 rounded-full">
              <Text className="text-white/90 text-[8px] font-black uppercase tracking-wider">
                {app.productName || "Personal Loan"}
              </Text>
            </View>
          </View>

          {/* Card Body */}
          <View className="flex-row justify-between items-end mb-6">
            <View>
              <Text className="text-white/60 text-[9px] font-black uppercase tracking-widest mb-1.5">Approved Loan Limit</Text>
              <Text className="text-white text-3xl font-black tracking-tight">
                {formatCurrency(app.sanctionedAmount || app.requestedAmount || 0)}
              </Text>
            </View>
            
            <View className="items-end bg-white/20 border border-white/35 px-4 py-2 rounded-2xl">
              <Text className="text-[10px] text-white font-black uppercase tracking-wider">{app.applicationStatus}</Text>
            </View>
          </View>

          {/* Glassmorphic Stats Bar */}
          <View className="bg-white/10 border border-white/20 px-4 py-3 rounded-2xl flex-row justify-between">
            <View className="flex-1 items-center border-r border-white/15">
              <Text className="text-white/50 text-[8px] font-black uppercase tracking-wider mb-0.5">EMI</Text>
              <Text className="text-white text-xs font-black">
                {formatCurrency(app.emi || app.emiAmount || 0)}
              </Text>
            </View>
            <View className="flex-1 items-center border-r border-white/15">
              <Text className="text-white/50 text-[8px] font-black uppercase tracking-wider mb-0.5">Tenure</Text>
              <Text className="text-white text-xs font-black">
                {app.tenure || app.approvedTenure || 0} Mo.
              </Text>
            </View>
            <View className="flex-1 items-center border-r border-white/15">
              <Text className="text-white/50 text-[8px] font-black uppercase tracking-wider mb-0.5">Rate</Text>
              <Text className="text-white text-xs font-black">
                {app.interest !== undefined ? app.interest : app.approvedInterestRate !== undefined ? app.approvedInterestRate : 0}%
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-white/50 text-[8px] font-black uppercase tracking-wider mb-0.5">Disbursal</Text>
              <Text className="text-white text-xs font-black">
                {formatCurrency(app.disbursalAmount || app.sanctionedAmount || 0)}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </MotiView>

      {/* Pending Overview Actions */}
      {showPendingOverviewActions && (
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 120 }}
          style={{ marginBottom: 24 }}
        >
          <Text style={styles.sectionTitle} className="mb-4">
            {(!isAutoPayEnabled || !isAgreementSign) ? "Pending Actions" : "Loan Documents"}
          </Text>
          <View className="bg-white rounded-[28px] p-4 border border-slate-100 shadow-sm shadow-slate-200/50">
            {!isAutoPayEnabled && (
              <TouchableOpacity
                onPress={() => autoPayMutation.mutate()}
                disabled={autoPayMutation.isPending}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 22,
                  backgroundColor: '#f0fdf4',
                  borderWidth: 1,
                  borderColor: '#bbf7d0',
                  marginBottom: (!isAgreementSign || (isAgreementSign && app.signedLoanAgreementUrl)) ? 12 : 0,
                  opacity: autoPayMutation.isPending ? 0.7 : 1,
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Ionicons name="card-outline" size={22} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#14532d', fontSize: 14, fontWeight: '900', letterSpacing: 0.1 }}>Set Up AutoPay</Text>
                  <Text style={{ color: '#166534', fontSize: 11, fontWeight: '600', marginTop: 3, lineHeight: 16 }}>
                    Enable automatic EMI debit for this loan.
                  </Text>
                </View>
                {autoPayMutation.isPending ? (
                  <LottieView
                    source={require("../../assets/new-loader.json")}
                    autoPlay
                    loop
                    style={{ width: 28, height: 28 }}
                  />
                ) : (
                  <Ionicons name="arrow-forward" size={18} color="#15803d" />
                )}
              </TouchableOpacity>
            )}

            {!isAgreementSign ? (
              <TouchableOpacity
                onPress={() => eSignMutation.mutate()}
                disabled={eSignMutation.isPending}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 22,
                  backgroundColor: '#eff6ff',
                  borderWidth: 1,
                  borderColor: '#bfdbfe',
                  opacity: eSignMutation.isPending ? 0.7 : 1,
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Ionicons name="document-text-outline" size={22} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#1e3a8a', fontSize: 14, fontWeight: '900', letterSpacing: 0.1 }}>eSign Sanction Letter</Text>
                  <Text style={{ color: '#1d4ed8', fontSize: 11, fontWeight: '600', marginTop: 3, lineHeight: 16 }}>
                    Review and digitally sign the sanction letter.
                  </Text>
                </View>
                {eSignMutation.isPending ? (
                  <LottieView
                    source={require("../../assets/new-loader.json")}
                    autoPlay
                    loop
                    style={{ width: 28, height: 28 }}
                  />
                ) : (
                  <Ionicons name="arrow-forward" size={18} color="#2563eb" />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={onDownloadAgreement}
                disabled={isDownloadingAgreement}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 22,
                  backgroundColor: '#eff6ff',
                  borderWidth: 1,
                  borderColor: '#bfdbfe',
                  opacity: isDownloadingAgreement ? 0.75 : 1,
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Ionicons name="document-text-outline" size={22} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#1e3a8a', fontSize: 14, fontWeight: '900', letterSpacing: 0.1 }}>Download Loan Agreement</Text>
                  <Text style={{ color: '#1d4ed8', fontSize: 11, fontWeight: '600', marginTop: 3, lineHeight: 16 }}>
                    Download a copy of your digitally signed loan agreement.
                  </Text>
                </View>
                {isDownloadingAgreement ? (
                  <LottieView
                    source={require("../../assets/new-loader.json")}
                    autoPlay
                    loop
                    style={{ width: 24, height: 24 }}
                  />
                ) : (
                  <Ionicons name="cloud-download-outline" size={18} color="#2563eb" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </MotiView>
      )}

      {/* Action Required Banner */}
      {showActionBanner && (
        <MotiView
          from={{ opacity: 0, translateY: -10, scale: 0.97 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 150 }}
          style={{ marginBottom: 24 }}
        >
          <LinearGradient
            colors={['#fff7ed', '#ffedd5']}
            style={{
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: '#fed7aa',
              shadowColor: '#f97316',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            {/* Header Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, backgroundColor: '#f97316', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="alert-circle" size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#9a3412', fontSize: 12, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' }}>Action Required</Text>
                <Text style={{ color: '#c2410c', fontSize: 11, fontWeight: '600', marginTop: 1 }}>
                  Complete <Text style={{ fontWeight: '900' }}>{pendingActionLabel}</Text> to get your loan disbursed
                </Text>
              </View>
            </View>

            {/* Step Checklist */}
            <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#ffedd5' }}>
              {[
                { label: 'Application Submitted', done: true },
                { label: 'Credit Check (BRE)', done: rulesEngineCompleted },
                { label: 'Bank Verification', done: !!bankVerificationCompleted },
                { label: 'Agreement Signing', done: !!loanAgreementCompleted },
              ].map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
                  <View style={{
                    width: 20, height: 20, borderRadius: 10, marginRight: 10,
                    backgroundColor: item.done ? '#dcfce7' : '#fef3c7',
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: item.done ? '#86efac' : '#fcd34d',
                  }}>
                    <Ionicons
                      name={item.done ? 'checkmark' : 'time-outline'}
                      size={11}
                      color={item.done ? '#16a34a' : '#d97706'}
                    />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: item.done ? '600' : '800', color: item.done ? '#6b7280' : '#92400e' }}>
                    {item.label}
                  </Text>
                  {!item.done && (
                    <View style={{ marginLeft: 8, backgroundColor: '#fde68a', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Pending</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              onPress={onResumeStep}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ea580c',
                borderRadius: 14,
                paddingVertical: 13,
                shadowColor: '#ea580c',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons name={pendingActionIcon} size={16} color="white" />
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 13, marginLeft: 8 }}>Complete {pendingActionLabel}</Text>
              <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            <Text style={{ textAlign: 'center', color: '#c2410c', fontSize: 10, fontWeight: '600', marginTop: 10, opacity: 0.7 }}>
              💡 You can also complete this later from your dashboard
            </Text>
          </LinearGradient>
        </MotiView>
      )}

      {/* Application Timeline */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 600, delay: 200 }}
      >
        <View className="flex-row justify-between items-center mb-4">
          <Text style={styles.sectionTitle}>Track Progress</Text>
        </View>

        <View className="bg-white rounded-md p-6 border border-slate-100 mb-8 shadow-sm shadow-slate-200/50">
          <StatusMilestoneItem
            title="Profile Setup"
            subtitle="Submit borrower profile details"
            status={submittedStatus}
            date={submittedDate}
            formatDate={formatDate}
          />
          <StatusMilestoneItem
            title="Rules Engine Check"
            subtitle="Credit check & initial eligibility verification"
            status={breStatus}
            date={breDate}
            remark={breRemark}
            formatDate={formatDate}
          />
          <StatusMilestoneItem
            title="Bank Verification"
            subtitle="Validating disbursal account details"
            status={bankStatus}
            date={bankStatus === 'COMPLETED' ? bankDate : undefined}
            onAction={bankStatus === 'IN_PROGRESS' && onResumeStep ? onResumeStep : undefined}
            actionLabel="Set Up Bank →"
            formatDate={formatDate}
          />
          <StatusMilestoneItem
            title="Loan Agreement"
            subtitle="Digital signing & final contract review"
            status={agreementStatus}
            date={agreementStatus === 'COMPLETED' ? esignDate : undefined}
            remark={agreementStatus === 'COMPLETED' ? esignRemark : undefined}
            onAction={agreementStatus === 'IN_PROGRESS' && onResumeStep ? onResumeStep : undefined}
            actionLabel="Sign Agreement →"
            formatDate={formatDate}
          />
          <StatusMilestoneItem
            title="Loan Disbursal"
            subtitle="Transfer of approved funds to your bank account"
            status={disbursalStatus}
            date={disbursalDate}
            remark={disbursalRemark}
            formatDate={formatDate}
            isLast
          />
        </View>
      </MotiView>

      {/* Detailed Activity Log Accordion */}
      {historyList.length > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 250 }}
          style={{ marginBottom: 32 }}
        >
          <View className="bg-white rounded-md border border-slate-100 overflow-hidden shadow-sm shadow-slate-200/50">
            {/* Accordion Header */}
            <Pressable
              onPress={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="p-6 flex-row justify-between items-center bg-white active:bg-slate-50/50"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-slate-100 rounded-2xl items-center justify-center mr-4">
                  <MaterialCommunityIcons name="history" size={20} color="#475569" />
                </View>
                <View>
                  <Text className="text-slate-900 font-black text-sm">Detailed Activity Log</Text>
                  <Text className="text-slate-400 text-[10px] font-bold mt-0.5">
                    {historyList.length} status updates recorded
                  </Text>
                </View>
              </View>

              <MotiView
                animate={{ rotate: isHistoryExpanded ? "180deg" : "0deg" }}
                transition={{ type: "timing", duration: 250 }}
              >
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </MotiView>
            </Pressable>

            {/* Accordion Content */}
            {isHistoryExpanded && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ type: "timing", duration: 300 }}
                className="px-6 pb-6 pt-2 border-t border-slate-50"
              >
                <View className="mb-4 bg-slate-50 px-3 py-2 rounded-xl flex-row items-center">
                  <Ionicons name="information-circle-outline" size={14} color="#64748b" className="mr-1.5" />
                  <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                    Showing latest updates first (Audit Trail)
                  </Text>
                </View>

                <View className="pl-2 pr-1">
                  {[...historyList].reverse().map((item: any, idx: number) => {
                    const isLastItem = idx === historyList.length - 1;
                    const fromBadge = getStatusBadgeColors(item.fromStatus);
                    const toBadge = getStatusBadgeColors(item.toStatus);
                    const itemDateStr = formatDate(item.occurredAt);
                    const itemTimeStr = new Date(item.occurredAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <View key={item.id || idx} className="flex-row">
                        {/* Timeline bar */}
                        <View className="items-center mr-4">
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: item.toStatus === 'BRE_REJECTED' || item.toStatus === 'CANCELLED' ? '#ef4444' : '#6366f1',
                              marginTop: 18,
                            }}
                          />
                          {!isLastItem && (
                            <View style={{ width: 1.5, flex: 1, backgroundColor: '#e2e8f0', minHeight: 40 }} />
                          )}
                        </View>

                        {/* Event Details */}
                        <View className="flex-1 pb-6 pt-3">
                          <View className="flex-row justify-between items-center mb-2 flex-wrap">
                            {/* Badges fromStatus -> toStatus */}
                            <View className="flex-row items-center flex-wrap mb-1">
                              {item.fromStatus ? (
                                <>
                                  <View className={`px-2 py-0.5 rounded-lg ${fromBadge.bg}`}>
                                    <Text className={`text-[9px] font-black uppercase tracking-wider ${fromBadge.text}`}>
                                      {mapStatusLabel(item.fromStatus)}
                                    </Text>
                                  </View>
                                  <Ionicons name="arrow-forward-sharp" size={10} color="#94a3b8" style={{ marginHorizontal: 6 }} />
                                </>
                              ) : null}
                              <View className={`px-2 py-0.5 rounded-lg ${toBadge.bg}`}>
                                <Text className={`text-[9px] font-black uppercase tracking-wider ${toBadge.text}`}>
                                  {mapStatusLabel(item.toStatus)}
                                </Text>
                              </View>
                            </View>

                            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wide">
                              {itemDateStr} • {itemTimeStr}
                            </Text>
                          </View>

                          {item.remark ? (
                            <View className="bg-slate-50/70 border border-slate-100 p-3 rounded-2xl flex-row items-start">
                              <Feather name="edit-3" size={10} color="#64748b" style={{ marginTop: 2, marginRight: 6 }} />
                              <Text className="text-slate-600 text-[10px] leading-4 flex-1">
                                {item.remark}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </MotiView>
            )}
          </View>
        </MotiView>
      )}

      {/* Information Grid */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 600, delay: 400 }}
      >
        <Text style={styles.sectionTitle} className="mb-4">Loan Particulars</Text>
        <View className="bg-white rounded-md p-4 border border-slate-100 mb-8 flex-row flex-wrap justify-between shadow-sm shadow-slate-200/50">
          <InfoGridCell icon="package" label="Loan Product" value={app.productName || "Personal Finance"} color="#6366f1" />
          <InfoGridCell icon="file-text" label="Selected Scheme" value={app.schemeName || "Standard Plan"} color="#10b981" />
          <InfoGridCell icon="clock" label="Tenure" value={app.tenure ? `${app.tenure} Months` : app.approvedTenure ? `${app.approvedTenure} Months` : "N/A"} color="#06b6d4" />
          <InfoGridCell icon="percent" label="Interest Rate" value={app.interest !== undefined ? `${app.interest}%` : app.approvedInterestRate !== undefined ? `${app.approvedInterestRate}%` : "N/A"} color="#f59e0b" />
          <InfoGridCell icon="tag" label="Processing Fee" value={app.processingFee !== undefined && app.processingFee !== null ? formatCurrency(app.processingFee) : "N/A"} color="#ec4899" />
          <InfoGridCell icon="dollar-sign" label="EMI Amount" value={app.emi ? formatCurrency(app.emi) : app.emiAmount ? formatCurrency(app.emiAmount) : "N/A"} color="#8b5cf6" />
          <InfoGridCell icon="calendar" label="EMI Frequency" value={app.repaymentFrequency || "Monthly"} color="#8b5cf6" />
          <InfoGridCell icon="clock" label="Applied Date" value={formatDate(app.createdOn)} color="#06b6d4" />
        </View>
      </MotiView>

      {/* Borrower Information */}
      {profile && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 500 }}
        >
          <Text style={styles.sectionTitle} className="mb-4">Borrower Information</Text>
          <View className="bg-white roundedmd p-5 border border-slate-100 mb-8 flex-row flex-wrap justify-between shadow-sm shadow-slate-200/50">
            <InfoGridCell icon="user" label="Full Name" value={profile.borrowerName} color="#3b82f6" />
            <InfoGridCell icon="phone" label="Mobile Number" value={profile.mobile} color="#10b981" />
            <InfoGridCell icon="mail" label="Email Address" value={profile.email} color="#ef4444" />
            <InfoGridCell icon="credit-card" label="PAN Card" value={profile.panNumber} color="#f59e0b" />
            <InfoGridCell icon="calendar" label="Date of Birth" value={profile.dob ? formatDate(profile.dob) : "N/A"} color="#8b5cf6" />
            <InfoGridCell icon="smile" label="Gender" value={profile.gender ? formatLabel(profile.gender) : "N/A"} color="#ec4899" />
            <InfoGridCell icon="briefcase" label="Employment" value={profile.employmentType ? formatLabel(profile.employmentType) : "N/A"} color="#6366f1" />
            <InfoGridCell icon="trending-up" label="Monthly Income" value={profile.monthlyIncome ? formatCurrency(profile.monthlyIncome) : "N/A"} color="#22c55e" />
          </View>
        </MotiView>
      )}

      {/* Professional Remark */}
      {app.remark && (
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 600, delay: 600 }}
          className="bg-indigo-50/50 rounded-[24px] p-6 border border-indigo-100 mb-10"
        >
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 bg-indigo-100 rounded-xl items-center justify-center mr-3">
              <Feather name="message-square" size={16} color="#4F46E5" />
            </View>
            <Text className="text-indigo-950 font-black text-xs uppercase tracking-widest">Lender Remarks</Text>
          </View>
          <Text className="text-indigo-900/70 text-sm font-medium leading-6">{app.remark}</Text>
        </MotiView>
      )}
    </View>
  );
};

/* ─────────────────────────────────────────────
 * DOCUMENTS TAB
 * ───────────────────────────────────────────── */

const getFileIcon = (name: string): any => {
  const lower = (name || "").toLowerCase();
  if (lower.includes("pan") || lower.includes("card") || lower.includes("voter") || lower.includes("aadhar") || lower.includes("id")) return "card-outline";
  if (lower.includes("bank") || lower.includes("statement") || lower.includes("cheque")) return "document-text-outline";
  if (lower.includes("photo") || lower.includes("image") || lower.includes("picture")) return "image-outline";
  return "document-outline";
};

const DocumentsTab = ({ app }: any) => {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [remoteUri, setRemoteUri] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState("");
  const [isLoadingDoc, setIsLoadingDoc] = useState<number | null>(null);

  const docGroups = app.applicationDocumentsGrouped || [];

  const handleViewDocument = async (doc: any) => {
    if (!doc.awsDocumentIds || doc.awsDocumentIds.length === 0) return;

    setIsLoadingDoc(doc.id);
    try {
      const id = parseInt(doc.awsDocumentIds[0]); // View the first uploaded document
      if (isNaN(id)) {
        console.warn("Invalid AWS Document ID");
        setIsLoadingDoc(null);
        return;
      }

      const response = await getDocumentDownloadPath(id);
      if (response.data?.data?.[0]?.filePath) {
        setRemoteUri(response.data.data[0].filePath);
        setViewerTitle(formatLabel(doc.documentName || "Document"));
        setViewerVisible(true);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Preview Failed',
          text2: 'Could not load document preview.',
          position: 'bottom',
        });
      }
    } catch (error: any) {
      console.error('View failed:', error);
      const errorMsg = error.response?.data?.message || "Error loading document.";
      Toast.show({
        type: 'error',
        text1: 'View Failed',
        text2: errorMsg,
        position: 'bottom'
      });
    } finally {
      setIsLoadingDoc(null);
    }
  };

  if (docGroups.length === 0) {
    return (
      <View className="mt-10 items-center py-16">
        <View className="w-20 h-20 bg-slate-100 rounded-[32px] items-center justify-center mb-6">
          <Feather name="folder-plus" size={32} color="#94a3b8" />
        </View>
        <Text className="text-slate-900 font-black text-xl tracking-tight">No Documents Yet</Text>
        <Text className="text-slate-400 text-sm mt-2 text-center px-12 leading-5 font-medium">
          The documentation process hasn't started for this application.
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-4">
      {docGroups.map((group: any, gIdx: number) => (
        <MotiView
          key={group.category?.id || gIdx}
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: gIdx * 100, type: "timing", duration: 500 }}
          className="mb-8"
        >
          {/* Category Section Header */}
          <View className="flex-row items-center justify-between mb-4 px-2">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-indigo-50 rounded-2xl items-center justify-center mr-4 border border-indigo-100/50">
                <Ionicons name="folder-open" size={18} color="#6366f1" />
              </View>
              <View>
                <Text className="text-slate-900 font-black text-sm uppercase tracking-wider">
                  {group.category?.categoryName || "Supporting Docs"}
                </Text>
                <Text className="text-slate-400 text-[10px] font-bold mt-0.5">
                  Verification Group {gIdx + 1}
                </Text>
              </View>
            </View>
            <View className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200/55">
              <Text className="text-slate-600 text-[10px] font-black">
                {group.documentTypes?.length || 0} {group.documentTypes?.length === 1 ? 'FILE' : 'FILES'}
              </Text>
            </View>
          </View>

          {/* Document Cards List */}
          <View className="space-y-3">
            {(group.documentTypes || []).map((doc: any, dIdx: number) => {
              const hasUpload = doc.awsDocumentIds && doc.awsDocumentIds.length > 0;
              const isDownloading = isLoadingDoc === doc.id;

              return (
                <View
                  key={doc.id || dIdx}
                  className={`bg-white rounded-2xl border ${
                    hasUpload
                      ? "border-emerald-100/80 shadow-sm shadow-emerald-50/50 bg-emerald-50/5"
                      : "border-slate-100 shadow-sm shadow-slate-100 bg-white"
                  } p-4`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      {/* Folder File Icon */}
                      <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
                        hasUpload ? "bg-emerald-50 border border-emerald-100/50" : "bg-slate-50 border border-slate-100"
                      }`}>
                        {hasUpload && (
                          <View className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white items-center justify-center z-10 shadow-sm">
                            <Ionicons name="checkmark" size={11} color="white" />
                          </View>
                        )}
                        <Ionicons
                          name={getFileIcon(doc.documentName)}
                          size={22}
                          color={hasUpload ? "#10b981" : "#94a3b8"}
                        />
                      </View>

                      {/* Meta */}
                      <View className="flex-1 pr-2">
                        <Text className="text-slate-900 font-black text-[14px] mb-0.5 tracking-tight">
                          {formatLabel(doc.documentName || "Document")}
                        </Text>
                        <View className="flex-row items-center flex-wrap">
                          {doc.isRequired && (
                            <View className="flex-row items-center mr-3 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-lg">
                              <Text className="text-orange-600 text-[8px] font-black uppercase tracking-wider">Required</Text>
                            </View>
                          )}
                          <Text className={`text-[10px] font-bold ${hasUpload ? "text-emerald-600" : "text-slate-400"}`}>
                            {hasUpload ? "Document verified" : "Awaiting verification/upload"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Actions */}
                    <View className="items-end pl-2">
                      {hasUpload ? (
                        <TouchableOpacity
                          className="bg-white border border-emerald-200 px-3.5 py-2.5 rounded-[12px] flex-row items-center shadow-sm shadow-emerald-500/5 active:bg-emerald-50/20"
                          onPress={() => handleViewDocument(doc)}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <LottieView
                              source={require("../../assets/new-loader.json")}
                              autoPlay
                              loop
                              style={{ width: 16, height: 16 }}
                            />
                          ) : (
                            <>
                              <Ionicons name="eye-outline" size={14} color="#059669" />
                              <Text className="text-emerald-700 text-[11px] font-black ml-1.5 tracking-tight uppercase">
                                View
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <View className="bg-slate-50 px-3 py-2 rounded-xl border border-dashed border-slate-200">
                          <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Pending</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </MotiView>
      ))}

      <DocumentViewer
        isVisible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        uri={remoteUri}
        title={viewerTitle}
      />
    </View>
  );
};

/* ─────────────────────────────────────────────
 * BANK & CHARGES TAB
 * ───────────────────────────────────────────── */
const BankChargesTab = ({ app, profile, formatCurrency }: any) => {
  const bank = app.applicationBank;
  const profileBank = profile?.bank;
  const charges = app.charges || app.charge || [];
  const [isAccountVisible, setIsAccountVisible] = useState(false);
  const [isProfileBankVisible, setIsProfileBankVisible] = useState(false);

  return (
    <View className="mt-4">
      {/* Customer Linked Bank Section */}
      <View className="flex-row justify-between items-center mb-6 px-2">
        <Text style={styles.sectionTitle}>Customer Bank Account</Text>
      </View>

      {profileBank ? (
        <MotiView
          from={{ opacity: 0, rotateX: "15deg", scale: 0.95 }}
          animate={{ opacity: 1, rotateX: "0deg", scale: 1 }}
          transition={{ type: "timing", duration: 600 }}
          className="mb-10"
        >
          <LinearGradient
            colors={["#059669", "#10b981"]}
            className="rounded-[32px] p-8 shadow-xl relative overflow-hidden"
          >
            {/* Background Pattern */}
            <View className="absolute right-0 bottom-0 opacity-10">
              <MaterialCommunityIcons name="bank" size={180} color="white" />
            </View>

            <View className="flex-row justify-between items-start mb-12">
              <View className="w-14 h-10 bg-white/20 rounded-xl items-center justify-center border border-white/20">
                <Ionicons name="card" size={24} color="white" />
              </View>
              <View className="items-end">
                <Text className="text-white font-black text-sm uppercase tracking-widest">Linked Bank</Text>
                {profileBank.autoDebitType && (
                  <View className="bg-white/25 px-2.5 py-0.5 rounded-full mt-1.5 border border-white/10">
                    <Text className="text-white text-[8px] font-black uppercase tracking-wider">
                      Auto-Debit: {profileBank.autoDebitType}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-emerald-100/60 text-[10px] font-black uppercase tracking-[3px]">Account Number</Text>
              <TouchableOpacity onPress={() => setIsProfileBankVisible(!isProfileBankVisible)} className="p-1">
                <Ionicons name={isProfileBankVisible ? "eye-off-outline" : "eye-outline"} size={18} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
            <Text className="text-white text-2xl font-black tracking-[4px] mb-10">
              {profileBank.accountNumber
                ? isProfileBankVisible
                  ? profileBank.accountNumber.match(/.{1,4}/g)?.join(' ')
                  : `•••• •••• •••• ${profileBank.accountNumber.slice(-4)}`
                : "•••• •••• •••• ••••"}
            </Text>

            <View className="flex-row justify-between items-end">
              <View>
                <Text className="text-emerald-100/60 text-[8px] font-black uppercase tracking-widest mb-1">Account Holder</Text>
                <Text className="text-white font-black text-sm uppercase">{profileBank.accountHolderName || "Authorized User"}</Text>
              </View>
              <View className="items-end">
                <Text className="text-emerald-100/60 text-[8px] font-black uppercase tracking-widest mb-1">IFSC Code</Text>
                <Text className="text-white font-black text-sm uppercase">{profileBank.ifscCode || "NOT_SET"}</Text>
              </View>
            </View>
          </LinearGradient>
        </MotiView>
      ) : (
        <View className="bg-white rounded-[32px] p-10 border border-dashed border-slate-200 mb-10 items-center">
          <View className="w-16 h-16 bg-slate-50 rounded-[24px] items-center justify-center mb-4">
            <Ionicons name="business" size={28} color="#94a3b8" />
          </View>
          <Text className="text-slate-400 font-black text-sm uppercase tracking-widest">No Bank Linked to Profile</Text>
        </View>
      )}

      {/* Bank Account Section */}
      <View className="flex-row justify-between items-center mb-6 px-2">
        <Text style={styles.sectionTitle}>Disbursement Account</Text>
      </View>

      {bank ? (
        <MotiView
          from={{ opacity: 0, rotateX: "15deg", scale: 0.95 }}
          animate={{ opacity: 1, rotateX: "0deg", scale: 1 }}
          transition={{ type: "timing", duration: 600, delay: 100 }}
          className="mb-10"
        >
          <LinearGradient
            colors={["#2563eb", "#1d4ed8"]}
            className="rounded-[32px] p-8 shadow-xl relative overflow-hidden"
          >
            {/* Background Pattern */}
            <View className="absolute right-0 bottom-0 opacity-10">
              <MaterialCommunityIcons name="bank" size={180} color="white" />
            </View>

            <View className="flex-row justify-between items-start mb-12">
              <View className="w-14 h-10 bg-white/20 rounded-xl items-center justify-center border border-white/20">
                <Ionicons name="card" size={24} color="white" />
              </View>
              <View className="items-end">
                <Text className="text-white font-black text-sm uppercase tracking-widest">{bank.bank || "Partner Bank"}</Text>
                <Text className="text-blue-100/60 text-[10px] font-bold mt-1">{bank.branch || "Head Office"}</Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-blue-100/60 text-[10px] font-black uppercase tracking-[3px]">Account Number</Text>
              <TouchableOpacity onPress={() => setIsAccountVisible(!isAccountVisible)} className="p-1">
                <Ionicons name={isAccountVisible ? "eye-off-outline" : "eye-outline"} size={18} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
            <Text className="text-white text-2xl font-black tracking-[4px] mb-10">
              {bank.accountNo
                ? isAccountVisible
                  ? bank.accountNo.match(/.{1,4}/g)?.join(' ')
                  : `•••• •••• •••• ${bank.accountNo.slice(-4)}`
                : "•••• •••• •••• ••••"}
            </Text>

            <View className="flex-row justify-between items-end">
              <View>
                <Text className="text-blue-100/60 text-[8px] font-black uppercase tracking-widest mb-1">Account Holder</Text>
                <Text className="text-white font-black text-sm uppercase">{bank.accountHolderName || "Authorized User"}</Text>
              </View>
              <View className="items-end">
                <Text className="text-blue-100/60 text-[8px] font-black uppercase tracking-widest mb-1">IFSC Code</Text>
                <Text className="text-white font-black text-sm uppercase">{bank.ifsc || "NOT_SET"}</Text>
              </View>
            </View>
          </LinearGradient>
        </MotiView>
      ) : (
        <View className="bg-white rounded-[32px] p-10 border border-dashed border-slate-200 mb-10 items-center">
          <View className="w-16 h-16 bg-slate-50 rounded-[24px] items-center justify-center mb-4">
            <Ionicons name="business" size={28} color="#94a3b8" />
          </View>
          <Text className="text-slate-400 font-black text-sm uppercase tracking-widest">Awaiting Bank Details</Text>
        </View>
      )}

      {/* Charges Section */}
      <View className="flex-row justify-between items-center mb-6 px-2">
        <Text style={styles.sectionTitle}>Breakdown of Charges</Text>
      </View>

      {charges.length > 0 ? (
        <View className="bg-white rounded-[32px] border border-slate-100 mb-10 overflow-hidden shadow-sm shadow-slate-200/40 p-2">
          {/* Table Header */}
          <View className="bg-slate-50/70 px-5 py-4 rounded-2xl flex-row justify-between items-center border border-slate-100/60 mb-2">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Charge Details</Text>
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Value / Rate</Text>
          </View>

          {charges.map((charge: any, idx: number) => {
            const isLast = idx === charges.length - 1;
            return (
              <View key={charge.id || idx} className={`p-4 mx-1 ${!isLast ? "border-b border-slate-100/60" : ""}`}>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1 pr-2">
                    <View className="w-8 h-8 bg-slate-50 rounded-xl items-center justify-center mr-3 border border-slate-100/80">
                      <Feather name="tag" size={12} color="#64748b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-800 font-black text-sm tracking-tight">{charge.name || charge.code || "Service Fee"}</Text>
                      <View className="flex-row items-center mt-1">
                        <View className="bg-slate-100 px-1.5 py-0.5 rounded-md mr-2 border border-slate-200/40">
                          <Text className="text-slate-550 text-[8px] font-black uppercase tracking-wider">
                            {charge.chargeType?.replace(/_/g, " ") || "TAXABLE"}
                          </Text>
                        </View>
                        <View className="bg-indigo-50/50 px-1.5 py-0.5 rounded-md border border-indigo-100/40">
                          <Text className="text-indigo-600 text-[8px] font-black uppercase tracking-wider">
                            {charge.deductionType || "UPFRONT"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <Text className="text-slate-900 font-black text-sm text-right">
                    {charge.calculationType === "PERCENTAGE" ? `${charge.value}%` : formatCurrency(charge.value || 0)}
                  </Text>
                </View>

                {/* Nested Child Charges (GST, etc.) */}
                {charge.childCharges && charge.childCharges.length > 0 && (
                  <View className="ml-11 mt-3 bg-slate-50/50 rounded-2xl p-3.5 border border-slate-100/80 space-y-2.5">
                    {charge.childCharges.map((child: any, cIdx: number) => (
                      <View key={child.id || cIdx} className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1 pr-2">
                          <View className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2" />
                          <Text className="text-slate-500 text-[11px] font-bold tracking-tight">{child.name || child.code}</Text>
                        </View>
                        <Text className="text-slate-700 text-[11px] font-black">
                          {child.calculationType === "PERCENTAGE" ? `${child.value}%` : formatCurrency(child.value || 0)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <View className="bg-white rounded-[32px] p-10 border border-dashed border-slate-200 mb-10 items-center">
          <Feather name="info" size={24} color="#94a3b8" className="mb-3" />
          <Text className="text-slate-400 font-black text-sm uppercase tracking-widest">No Charges Applied</Text>
        </View>
      )}
    </View>
  );
};

/* ─────────────────────────────────────────────
 * SHARED COMPONENTS
 * ───────────────────────────────────────────── */

const NotchedCard = ({ children, style, notchColor = "#ffffff" }: any) => (
  <View style={[styles.notchedCard, style]}>
    <View style={[styles.notch, { backgroundColor: notchColor }]} />
    <View style={{ flex: 1, paddingTop: 10 }}>
      {children}
    </View>
  </View>
);

const SectionTitle = ({ title, icon }: { title: string; icon: string; iconPack?: string }) => (
  <View className="flex-row items-center mb-3 mt-2">
    <Feather name={icon as any} size={16} color="#64748b" />
    <Text className="text-slate-700 text-sm font-bold ml-2">{title}</Text>
  </View>
);

const StatPill = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-1 bg-white/5 rounded-xl py-2 px-3 mx-0.5">
    <Text className="text-slate-400 text-[9px] uppercase font-bold tracking-tight">{label}</Text>
    <Text className="text-white font-bold text-sm mt-0.5">{value}</Text>
  </View>
);

const PulsingDot = () => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={{ width: 12, height: 12, marginRight: 6, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }],
          position: 'absolute',
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#a855f7',
          opacity: 0.4,
        }}
      />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#7c3aed' }} />
    </View>
  );
};

const StatusMilestoneItem = ({
  title,
  subtitle,
  status,
  date,
  remark,
  onAction,
  actionLabel,
  formatDate,
  isLast,
}: any) => {
  const isCompleted = status === "COMPLETED";
  const isActive = status === "IN_PROGRESS";
  const isFailed = status === "FAILED";

  return (
    <View className="flex-row">
      <View style={{ paddingTop: isActive ? 6 : 8 }} className="items-center mr-5">
        {isCompleted ? (
          <View className="w-10 h-10 rounded-2xl items-center justify-center bg-emerald-500 border-2 border-emerald-500 shadow-sm shadow-emerald-200">
            <Ionicons name="checkmark-done" size={20} color="white" />
          </View>
        ) : isActive ? (
          <View
            style={{
              backgroundColor: "#f3e8ff",
              borderColor: "#a855f7",
            }}
            className="w-10 h-10 rounded-2xl items-center justify-center border-2 shadow-sm"
          >
            <View className="w-3 h-3 bg-purple-600 rounded-full" />
          </View>
        ) : isFailed ? (
          <View className="w-10 h-10 rounded-2xl items-center justify-center bg-red-500 border-2 border-red-500 shadow-sm shadow-red-200">
            <Ionicons name="close" size={20} color="white" />
          </View>
        ) : (
          <View className="w-10 h-10 rounded-2xl items-center justify-center border-2 bg-white border-slate-100">
            <View className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
          </View>
        )}
        {!isLast && (
          <View className={`w-0.5 flex-1 my-1 ${isCompleted ? "bg-emerald-500" : isFailed ? "bg-red-500" : "bg-slate-100"}`} />
        )}
      </View>

      <View
        style={
          isActive
            ? {
                backgroundColor: "rgba(243, 232, 255, 0.5)",
                borderColor: "#e9d5ff",
                borderWidth: 1,
                borderRadius: 16,
                padding: 16,
                marginBottom: !isLast ? 16 : 0,
              }
            : {
                marginBottom: !isLast ? 32 : 8,
                paddingTop: 8,
              }
        }
        className="flex-1"
      >
        {isActive && (
          <View className="flex-row items-center bg-purple-100 px-2.5 py-1 rounded-full self-start mb-2 border border-purple-200">
            <PulsingDot />
            <Text className="text-purple-700 text-[9px] font-black uppercase tracking-widest">
              In Progress
            </Text>
          </View>
        )}
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-2">
            <Text
              className={`font-black text-sm tracking-tight ${
                isCompleted
                  ? "text-slate-900"
                  : isActive
                  ? "text-purple-950"
                  : isFailed
                  ? "text-red-950"
                  : "text-slate-400"
              }`}
            >
              {title}
            </Text>
            <Text
              className={`text-[11px] font-bold mt-1 leading-4 ${
                isActive
                  ? "text-purple-900/60"
                  : isFailed
                  ? "text-red-900/60"
                  : "text-slate-400"
              }`}
            >
              {subtitle}
            </Text>
          </View>
          {date && (
            <Text className="text-[9px] font-black text-slate-400 uppercase tracking-wider self-start mt-1">
              {formatDate(date)}
            </Text>
          )}
        </View>

        {remark ? (
          <View className="bg-slate-50/80 border border-slate-100 p-3 rounded-2xl flex-row items-start mt-3">
            <Feather name="edit-3" size={10} color="#64748b" style={{ marginTop: 2, marginRight: 6 }} />
            <Text className="text-slate-600 text-[10px] leading-4 flex-1">
              {remark}
            </Text>
          </View>
        ) : null}

        {isActive && onAction && (
          <TouchableOpacity
            onPress={onAction}
            activeOpacity={0.8}
            style={{
              marginTop: 12,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#7c3aed",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              alignSelf: "flex-start",
              shadowColor: "#7c3aed",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.25,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Text style={{ color: "white", fontSize: 11, fontWeight: "900", letterSpacing: 0.3 }}>
              {actionLabel || "Continue"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const DetailRow = ({ label, value, isLast }: any) => (
  <View className={`flex-row justify-between py-4 ${!isLast ? "border-b border-slate-50" : ""}`}>
    <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</Text>
    <Text className="text-slate-900 font-black text-sm tracking-tight">{value || "N/A"}</Text>
  </View>
);

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  notchedCard: {
    backgroundColor: "transparent",
    borderRadius: 32,
    position: "relative",
    overflow: "visible",
    marginBottom: 32,
  },
  notch: {
    position: "absolute",
    top: -10,
    alignSelf: "center",
    width: 100,
    height: 25,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    zIndex: 1,
  },
  heroNotchedCard: {
    height: 240,
    marginTop: 10,
  },
  repaymentModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  repaymentBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  repaymentSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    maxHeight: Dimensions.get("window").height * 0.85,
  },
});

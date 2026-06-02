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
  createRepayment,
  initiateAutopay,
  initiateManualPayment,
  verifyManualPayment,
  getRepaymentSchedule,
  getCustomerProfile,
} from "../services/api";
import {
  initiateESign,
  isDigioSdkSupported,
  createDigioInstance,
  startEsignFlow,
  refreshESignStatus,
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

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => getApplicationDetails(applicationId).then((res) => res.data),
    enabled: !!applicationId,
  });

  const app = response?.data;

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
            source={require('../../assets/loader.json')}
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
        <View className="bg-white px-6 pb-4 pt-4 border-b border-slate-100 z-50 shadow-sm shadow-slate-200/10">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={onBack}
              className="w-10 h-10 items-center justify-center rounded-[16px] bg-slate-50 border border-slate-100 shadow-sm"
            >
              <Ionicons name="arrow-back" size={20} color="#1e293b" />
            </TouchableOpacity>

            <View className="flex-row items-center bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
              <View className={`w-2 h-2 rounded-full mr-3 ${getStatusBg(app.applicationStatus).replace('bg-', 'bg-')}`} style={{ backgroundColor: statusColor }} />
              <Text className="text-slate-900 text-xs font-black tracking-tight mr-2">
                #{app.applicationNo || app.id}
              </Text>
              <View className="w-[1px] h-3 bg-slate-200 mx-2" />
              <Text style={{ color: statusColor }} className="text-[10px] font-black uppercase tracking-widest">
                {app.applicationStatus}
              </Text>
              {stageName ? (
                <>
                  <View className="w-[1px] h-3 bg-slate-200 mx-2" />
                  <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    {stageName}
                  </Text>
                </>
              ) : null}
            </View>

            <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-[16px] bg-slate-50 border border-slate-100 shadow-sm">
              <Feather name="more-vertical" size={18} color="#1e293b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Exact Match Tab Bar */}
        <View className="bg-white border-b border-slate-200">
          <View className="flex-row px-4 py-5 justify-around">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className="flex-1 py-4 relative items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-[12px] font-semibold ${isActive ? "text-[#E85D5D]" : "text-slate-500"
                      }`}
                  >
                    {tab.label}
                  </Text>

                  {isActive && (
                    <MotiView
                      from={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ type: 'timing', duration: 300 }}
                      className="absolute bottom-[-1px] left-2 right-2 h-[2px] bg-[#E85D5D]"
                    />
                  )}
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
    enabled: !!app?.loanAccountId,
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
    if (response?.data) return response.data;
    
    // Fallback: Compute summary from lmsScheduleData
    if (app?.lmsLoanId && lmsScheduleData && lmsScheduleData.length > 0) {
      const firstInstallment = lmsScheduleData[0];
      const totalAmount = lmsScheduleData.reduce((acc: number, item: any) => acc + item.emiAmount, 0);
      const paidAmount = lmsScheduleData.reduce((acc: number, item: any) => acc + (item.paidPrincipal + item.paidInterest), 0);
      const outstandingBalance = lmsScheduleData.reduce((acc: number, item: any) => acc + (item.outstandingPrincipal + item.outstandingInterest), 0);
      const overdueAmount = lmsScheduleData.reduce((acc: number, item: any) => {
        if (item.status === 'OVERDUE') {
          return acc + (item.emiAmount - (item.paidPrincipal + item.paidInterest));
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
  }, [response, app, lmsScheduleData]);

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

  const isLoading = (!!app?.loanAccountId && isAccountLoading) || (!!app?.lmsLoanId && isScheduleLoading);

  if (isLoading || !loan) {
    return (
      <View className="py-20 items-center justify-center">
        <LottieView
          source={require('../../assets/loader.json')}
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
          colors={["#7c3aed", "#4c1d95"]}
          className="rounded-[32px] p-6 mb-8 mt-2 shadow-xl shadow-purple-500/30 overflow-hidden relative"
        >
          {/* Decorative Elements */}
          <View className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
          <View className="absolute bottom-[-40px] left-[-20px] w-32 h-32 bg-purple-400/20 rounded-full" />

          <View className="flex-row justify-between items-start mb-6 z-10">
            <View>
              <Text className="text-purple-200 text-[10px] font-black uppercase tracking-[2px] mb-1">Loan Amount</Text>
              <Text className="text-white text-3xl font-black tracking-tight">{formatCurrency(loan.loanAmount)}</Text>
            </View>

            {/* Custom Progress Ring Replacement */}
            <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center border-4 border-yellow-400/80">
              <Text className="text-white font-black text-sm">{progressPercent}%</Text>
            </View>
          </View>

          <View className="flex-row justify-between items-end border-t border-white/10 pt-4 z-10 mb-6">
            <View>
              <Text className="text-purple-200 text-[9px] font-black uppercase tracking-widest mb-1">Payoff Date</Text>
              <Text className="text-white font-black">{formatDate(payoffDate)}</Text>
            </View>
            <View className="items-end">
              <Text className="text-purple-200 text-[9px] font-black uppercase tracking-widest mb-1">Loan Status</Text>
              <Text className="text-white font-black">{loan.loanStatus}</Text>
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
              className="flex-1 bg-white flex-row items-center justify-center py-3.5 rounded-2xl mr-2 active:opacity-90"
              style={({ pressed }) => [
                pressed && { transform: [{ scale: 0.98 }] }
              ]}
            >
              <Ionicons name="wallet-outline" size={16} color="#4c1d95" />
              <Text className="text-[#4c1d95] font-black text-xs ml-2 tracking-wide">Repay</Text>
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
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Total Paid</Text>
            <Text className="text-emerald-500 font-black text-sm">{formatCurrency(loan.paidAmount)}</Text>
          </View>

          <View className="w-[48%]">
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
                      source={require("../../assets/loader.json")}
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
const OverviewTab = ({ app, profile, formatCurrency, formatDate, onResumeStep }: any) => {
  const queryClient = useQueryClient();
  const rulesEngineCompleted = app.applicationStepStatus?.rulesEngineCompleted ?? app.rulesEngineCompleted;
  const bankVerificationCompleted = app.applicationStepStatus?.bankVerificationCompleted ?? app.bankVerificationCompleted;
  const loanAgreementCompleted = app.applicationStepStatus?.loanAgreementCompleted ?? app.loanAgreementCompleted;
  const disbursalCompleted = app.applicationStatus === 'DISBURSED';
  const isCancelledOrRejected = app.applicationStatus === 'CANCELLED' || app.applicationStatus === 'REJECTED';
  const isAutoPayEnabled = app.isAutoPayEnabled ?? false;
  const isAgreementSign = app.isAgreementSign ?? false;
  const showPendingOverviewActions = !isCancelledOrRejected && (!isAutoPayEnabled || !isAgreementSign);

  const rulesEngineActive = !rulesEngineCompleted;
  const bankVerificationActive = rulesEngineCompleted && !bankVerificationCompleted;
  const loanAgreementActive = bankVerificationCompleted && !loanAgreementCompleted;
  const disbursalActive = loanAgreementCompleted && !disbursalCompleted;

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
        const identifier = useAuthStore.getState().mobile || useLoanStore.getState().customerInfo?.mobileNumber || '';

        try {
          const digio = createDigioInstance();
          const result = await startEsignFlow(digio, docId, identifier);
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
      {/* Hero Card - Premium Notched Gradient */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 600 }}
      >
        <NotchedCard style={[styles.heroNotchedCard]} notchColor="#F8FAFC">
          <LinearGradient
            colors={["#0F172A", "#1E293B"]}
            className="rounded-[32px] p-8 relative overflow-hidden h-full"
          >
            {/* Subtle Decorative Circle */}
            <View className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full" />

            <View className="flex-row justify-between items-start mb-8">
              <View>
                <Text className="text-blue-400 text-[9px] font-black uppercase tracking-[2px] mb-2">Principal Amount</Text>
                <Text className="text-white text-3xl font-black tracking-tight">
                  {formatCurrency(app.requestedAmount)}
                </Text>
              </View>
              <View className="w-12 h-12 bg-white/5 rounded-2xl items-center justify-center border border-white/10">
                <MaterialCommunityIcons name="wallet-outline" size={24} color="#3B82F6" />
              </View>
            </View>

            {/* Stats Grid - High Fidelity */}
            <View className="flex-row flex-wrap justify-between pt-6 border-t border-white/5">
              <View className="w-[48%] mb-6">
                <Text className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Monthly EMI</Text>
                <Text className="text-white text-base font-black">{formatCurrency(app.emi)}</Text>
              </View>
              <View className="w-[48%] mb-6">
                <Text className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Interest</Text>
                <Text className="text-white text-base font-black">{app.interest}% p.a.</Text>
              </View>
              <View className="w-[48%]">
                <Text className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Tenure</Text>
                <Text className="text-white text-base font-black">{app.tenure} Months</Text>
              </View>
              <View className="w-[48%]">
                <Text className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Disbursal</Text>
                <Text className="text-white text-base font-black">{formatCurrency(app.disbursalAmount)}</Text>
              </View>
            </View>
          </LinearGradient>
        </NotchedCard>
      </MotiView>

      {/* Pending Overview Actions */}
      {showPendingOverviewActions && (
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 120 }}
          style={{ marginBottom: 24 }}
        >
          <Text style={styles.sectionTitle} className="mb-4">Pending Actions</Text>
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
                  marginBottom: !isAgreementSign ? 12 : 0,
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
                    source={require("../../assets/loader.json")}
                    autoPlay
                    loop
                    style={{ width: 28, height: 28 }}
                  />
                ) : (
                  <Ionicons name="arrow-forward" size={18} color="#15803d" />
                )}
              </TouchableOpacity>
            )}

            {!isAgreementSign && (
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
                    source={require("../../assets/loader.json")}
                    autoPlay
                    loop
                    style={{ width: 28, height: 28 }}
                  />
                ) : (
                  <Ionicons name="arrow-forward" size={18} color="#2563eb" />
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
          <TouchableOpacity>
            <Text className="text-blue-600 text-xs font-black uppercase tracking-widest">History</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-[32px] p-6 border border-slate-100 mb-8 shadow-sm shadow-slate-200/50">
          <StepItem
            title="Rules Engine Check"
            subtitle="Credit & eligibility verification"
            isCompleted={rulesEngineCompleted}
            isActive={rulesEngineActive}
            isFirst
          />
          <StepItem
            title="Bank Verification"
            subtitle="Validating disbursal account"
            isCompleted={bankVerificationCompleted}
            isActive={bankVerificationActive}
            onAction={bankVerificationActive && onResumeStep ? onResumeStep : undefined}
            actionLabel="Set Up Bank →"
          />
          <StepItem
            title="Loan Agreement"
            subtitle="Digital signing & final review"
            isCompleted={loanAgreementCompleted}
            isActive={loanAgreementActive}
            onAction={loanAgreementActive && onResumeStep ? onResumeStep : undefined}
            actionLabel="Sign Agreement →"
          />
          <StepItem
            title="Loan Disbursal"
            subtitle="Disbursal of funds to bank account"
            isCompleted={disbursalCompleted}
            isActive={disbursalActive}
            isLast
          />
        </View>
      </MotiView>

      {/* Information Grid */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 600, delay: 400 }}
      >
        <Text style={styles.sectionTitle} className="mb-4">Loan Particulars</Text>
        <View className="bg-white rounded-[32px] p-6 border border-slate-100 mb-8 shadow-sm shadow-slate-200/50">
          <DetailRow label="Loan Product" value={app.productName || "Personal Finance"} />
          <DetailRow label="Selected Scheme" value={app.schemeName || "Standard Plan"} />
          <DetailRow label="Interest Model" value={app.interestType || "Reducing Balance"} />
          <DetailRow label="EMI Frequency" value={app.repaymentFrequency || "Monthly"} />
          <DetailRow label="Acquisition" value={app.applicationSource || "Direct"} />
          <DetailRow label="Applied Date" value={formatDate(app.createdOn)} isLast />
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
          <View className="bg-white rounded-[32px] p-6 border border-slate-100 mb-8 shadow-sm shadow-slate-200/50">
            <DetailRow label="Full Name" value={profile.borrowerName} />
            <DetailRow label="Mobile Number" value={profile.mobile} />
            <DetailRow label="Email Address" value={profile.email} />
            <DetailRow label="PAN Card" value={profile.panNumber} />
            <DetailRow label="Date of Birth" value={profile.dob ? formatDate(profile.dob) : "N/A"} />
            <DetailRow label="Gender" value={profile.gender ? formatLabel(profile.gender) : "N/A"} />
            <DetailRow label="Employment" value={profile.employmentType ? formatLabel(profile.employmentType) : "N/A"} />
            <DetailRow label="Monthly Income" value={profile.monthlyIncome ? formatCurrency(profile.monthlyIncome) : "N/A"} isLast />
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
          {/* Category Section */}
          <View className="flex-row items-center justify-between mb-4 px-2">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-blue-100/50 rounded-2xl items-center justify-center mr-4">
                <Feather name="layers" size={18} color="#2563eb" />
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
            <View className="bg-slate-200/50 px-3 py-1 rounded-full">
              <Text className="text-slate-600 text-[10px] font-black">
                {group.documentTypes?.length || 0} ITEMS
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
                  className={`bg-white rounded-2xl border ${hasUpload ? "border-emerald-100 shadow-sm shadow-emerald-50" : "border-slate-100 shadow-sm shadow-slate-100"
                    } p-4`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      {/* Icon */}
                      <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${hasUpload ? "bg-emerald-50" : "bg-slate-50"
                        }`}>
                        {hasUpload && (
                          <View className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white items-center justify-center z-10">
                            <Ionicons name="checkmark" size={10} color="white" />
                          </View>
                        )}
                        <Ionicons
                          name={getFileIcon(doc.documentName)}
                          size={22}
                          color={hasUpload ? "#059669" : "#94a3b8"}
                        />
                      </View>

                      {/* Meta */}
                      <View className="flex-1 pr-2">
                        <Text className="text-slate-900 font-bold text-[14px] mb-1 tracking-tight">
                          {formatLabel(doc.documentName || "Document")}
                        </Text>
                        <View className="flex-row items-center">
                          {doc.isRequired && (
                            <View className="flex-row items-center mr-3">
                              <View className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5" />
                              <Text className="text-slate-500 text-[10px] font-bold">Required</Text>
                            </View>
                          )}
                          <Text className="text-slate-400 text-[10px] font-medium" numberOfLines={1}>
                            {hasUpload ? "Uploaded successfully" : "Awaiting upload"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Actions */}
                    <View className="items-end pl-2">
                      {hasUpload ? (
                        <TouchableOpacity
                          className="bg-white border border-emerald-100 px-4 py-2.5 rounded-[12px] flex-row items-center shadow-sm shadow-emerald-50"
                          onPress={() => handleViewDocument(doc)}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <LottieView
                              source={require("../../assets/loader.json")}
                              autoPlay
                              loop
                              style={{ width: 24, height: 24 }}
                            />
                          ) : (
                            <>
                              <Ionicons name="eye" size={14} color="#059669" />
                              <Text className="text-emerald-700 text-[12px] font-black ml-1.5 tracking-tight">
                                View
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <View className="bg-slate-50 px-3 py-1.5 rounded-lg border border-dashed border-slate-200">
                          <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Pending</Text>
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
        <View className="bg-white rounded-[32px] border border-slate-100 mb-10 overflow-hidden shadow-sm shadow-slate-200/40">
          <View className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex-row justify-between">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Description</Text>
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Value</Text>
          </View>

          {charges.map((charge: any, idx: number) => {
            const isLast = idx === charges.length - 1;
            return (
              <View key={charge.id || idx} className={`p-6 ${!isLast ? "border-b border-slate-50" : ""}`}>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 bg-slate-100 rounded-xl items-center justify-center mr-4">
                      <Feather name="percent" size={14} color="#475569" />
                    </View>
                    <Text className="text-slate-900 font-black text-sm">{charge.name || charge.code || "Service Fee"}</Text>
                  </View>
                  <Text className="text-slate-900 font-black text-sm">
                    {charge.calculationType === "PERCENTAGE" ? `${charge.value}%` : formatCurrency(charge.value || 0)}
                  </Text>
                </View>

                <View className="flex-row items-center ml-12">
                  <View className="bg-slate-100 px-2 py-0.5 rounded-lg mr-3">
                    <Text className="text-slate-500 text-[8px] font-black uppercase tracking-tighter">
                      {charge.chargeType?.replace(/_/g, " ") || "TAXABLE"}
                    </Text>
                  </View>
                  <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    {charge.deductionType || "UPFRONT"}
                  </Text>
                </View>

                {/* Nested Charges */}
                {charge.childCharges && charge.childCharges.length > 0 && (
                  <View className="ml-12 mt-4 space-y-3">
                    {charge.childCharges.map((child: any, cIdx: number) => (
                      <View key={child.id || cIdx} className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View className="w-1 h-1 rounded-full bg-slate-300 mr-3" />
                          <Text className="text-slate-500 text-[11px] font-medium">{child.name || child.code}</Text>
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
          <Feather name="info" size={24} color="#94a3b8" className="mb-4" />
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

const StepItem = ({ title, subtitle, isCompleted, isActive, isFirst, isLast, onAction, actionLabel }: any) => {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  return (
    <View className="flex-row">
      <View style={{ paddingTop: isActive ? 6 : 8 }} className="items-center mr-5">
        {isCompleted ? (
          <View className="w-10 h-10 rounded-2xl items-center justify-center border-2 bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200">
            <Ionicons name="checkmark-done" size={20} color="white" />
          </View>
        ) : isActive ? (
          <View
            style={{
              backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : '#f3e8ff',
              borderColor: '#a855f7',
            }}
            className="w-10 h-10 rounded-2xl items-center justify-center border-2 shadow-sm"
          >
            <View className="w-3 h-3 bg-purple-600 rounded-full" />
          </View>
        ) : (
          <View className="w-10 h-10 rounded-2xl items-center justify-center border-2 bg-white border-slate-100">
            <View className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
          </View>
        )}
        {!isLast && (
          <View className={`w-0.5 flex-1 my-1 ${isCompleted ? "bg-emerald-500" : "bg-slate-100"}`} />
        )}
      </View>

      <View
        style={
          isActive
            ? {
              backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(243, 232, 255, 0.5)',
              borderColor: isDark ? 'rgba(168, 85, 247, 0.4)' : '#e9d5ff',
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
          <View className="flex-row items-center bg-purple-100 dark:bg-purple-950/40 px-2.5 py-1 rounded-full self-start mb-2 border border-purple-200 dark:border-purple-800">
            <PulsingDot />
            <Text className="text-purple-700 dark:text-purple-300 text-[9px] font-black uppercase tracking-widest">
              In Progress
            </Text>
          </View>
        )}
        <Text
          className={`font-black text-sm tracking-tight ${isCompleted ? "text-slate-900" : isActive ? "text-purple-950" : "text-slate-400"
            }`}
        >
          {title}
        </Text>
        <Text
          className={`text-[11px] font-bold mt-1 leading-4 ${isActive ? "text-purple-900/60" : "text-slate-400"
            }`}
        >
          {subtitle}
        </Text>

        {isActive && onAction && (
          <TouchableOpacity
            onPress={onAction}
            activeOpacity={0.8}
            style={{
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#7c3aed',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 10,
              alignSelf: 'flex-start',
              shadowColor: '#7c3aed',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.25,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Text style={{ color: 'white', fontSize: 11, fontWeight: '900', letterSpacing: 0.3 }}>
              {actionLabel || 'Continue'}
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

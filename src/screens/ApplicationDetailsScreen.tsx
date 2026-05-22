import React, { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
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
import { getApplicationDetails, getDocumentDownloadPath, getLoanAccountById, createRepayment } from "../services/api";
import { Layout } from "react-native-reanimated";
import { formatLabel } from "../utils";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { DocumentViewer } from "../components/DocumentViewer";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

type TabKey = "loan" | "overview" | "documents" | "bank";

interface ApplicationDetailsScreenProps {
  applicationId: number;
  autoOpenRepay?: boolean;
  onBack: () => void;
}

export const ApplicationDetailsScreen = ({
  applicationId,
  autoOpenRepay,
  onBack,
}: ApplicationDetailsScreenProps) => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [initialTabSet, setInitialTabSet] = useState(false);

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => getApplicationDetails(applicationId).then((res) => res.data),
    enabled: !!applicationId,
  });

  const app = response?.data;

  React.useEffect(() => {
    if (app && !initialTabSet) {
      if (autoOpenRepay || app.applicationStatus === "DISBURSED" || app.loanAccountId) {
        setActiveTab("loan");
      }
      setInitialTabSet(true);
    }
  }, [app, initialTabSet, autoOpenRepay]);

  const TABS = React.useMemo(() => {
    const base = [
      { key: "overview", label: "Overview", icon: "layers" },
      { key: "documents", label: "Documents", icon: "file-text" },
      { key: "bank", label: "Bank & Charges", icon: "credit-card" },
    ];
    if (app?.applicationStatus === "DISBURSED" || app?.loanAccountId) {
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
            {activeTab === "overview" && <OverviewTab app={app} formatCurrency={formatCurrency} formatDate={formatDate} />}
            {activeTab === "documents" && <DocumentsTab app={app} />}
            {activeTab === "bank" && <BankChargesTab app={app} formatCurrency={formatCurrency} />}
          </MotiView>
          <View className="h-8" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

/* ─────────────────────────────────────────────
 * LOAN ACCOUNT TAB (DISBURSED ONLY)
 * ───────────────────────────────────────────── */
const LoanAccountTab = ({ app, formatCurrency, formatDate, autoOpenRepay }: any) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useQuery({
    queryKey: ["loanAccount", app?.loanAccountId],
    queryFn: () => getLoanAccountById(app.loanAccountId).then((res) => res.data),
    enabled: !!app?.loanAccountId,
  });
  const [selectedEmi, setSelectedEmi] = useState<any>(null);
  const [repaymentModalVisible, setRepaymentModalVisible] = useState(false);
  const [repaymentForm, setRepaymentForm] = useState({
    paymentMode: "RTGS",
    refNo: "",
    remark: ""
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [availableUpiApps, setAvailableUpiApps] = useState<any[]>([]);
  const [selectedUpiApp, setSelectedUpiApp] = useState<any>(null);
  const [showAllUpiApps, setShowAllUpiApps] = useState(false);

  const UPI_APPS = [
    { id: 'gpay', name: 'GPay', scheme: 'tez://upi/pay', color: '#4285F4', icon: 'logo-google' },
    { id: 'paytm', name: 'Paytm', scheme: 'paytmmp://pay', color: '#00baf2', icon: 'wallet' },
    { id: 'whatsapp', name: 'WhatsApp', scheme: 'whatsapp://upi/pay', color: '#25D366', icon: 'logo-whatsapp' },
    { id: 'amazon', name: 'Amazon', scheme: 'amazonpay://upi/pay', color: '#FF9900', icon: 'cart' },
    { id: 'phonepe', name: 'PhonePe', scheme: 'phonepe://pay', color: '#5f259f', icon: 'arrow-forward' },
    { id: 'cred', name: 'CRED', scheme: 'credpay://upi/pay', color: '#000000', icon: 'card' },
    { id: 'bhim', name: 'BHIM', scheme: 'bhim://upi/pay', color: '#e67e22', icon: 'flash' },
    { id: 'slice', name: 'Slice', scheme: 'slice://upi/pay', color: '#9d34da', icon: 'cut' },
    { id: 'jupiter', name: 'Jupiter', scheme: 'jupiter://upi/pay', color: '#ff7a45', icon: 'planet' },
    { id: 'navi', name: 'Navi', scheme: 'navi://upi/pay', color: '#00d09c', icon: 'navigate' },
    { id: 'mobikwik', name: 'MobiKwik', scheme: 'mobikwik://upi/pay', color: '#004BA0', icon: 'card' },
    { id: 'freecharge', name: 'Freecharge', scheme: 'freecharge://upi/pay', color: '#f36e21', icon: 'battery-full' },
    { id: 'airtel', name: 'Airtel Pay', scheme: 'airtel://upi/pay', color: '#e40000', icon: 'call' },
    { id: 'sbi', name: 'YONO SBI', scheme: 'sbi://upi/pay', color: '#2d68b3', icon: 'home' },
    { id: 'hdfc', name: 'HDFC PayZapp', scheme: 'payzapp://upi/pay', color: '#004c8f', icon: 'wallet' },
    { id: 'icici', name: 'iMobile', scheme: 'icici://upi/pay', color: '#f28b01', icon: 'business' },
    { id: 'axis', name: 'Axis Pay', scheme: 'axispay://upi/pay', color: '#971237', icon: 'trending-up' },
    { id: 'supermoney', name: 'super.money', scheme: 'supermoney://upi/pay', color: '#ffdd00', icon: 'flash' },
  ];

  const launchUpiPayment = async (upiApp: any = null) => {
    if (!selectedEmi) return;
    
    const vpa = "alphaware@axisbank";
    const name = "Alphaware LMS";
    const amount = Number(selectedEmi.emi).toFixed(2);
    
    const upiUrl = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
    const params = `?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
    
    try {
      if (upiApp) {
        let intentUrl = upiApp.scheme + params;
        
        console.log(`Launching UPI App [${upiApp.name}]: ${intentUrl}`);
        
        if (upiApp.id === 'phonepe') {
          // Special multi-attempt for PhonePe
          try {
            await Linking.openURL(intentUrl); // Try phonepe://pay
          } catch (e) {
            try {
              await Linking.openURL(`phonepe://upi/pay${params}`); // Try fallback phonepe scheme
            } catch (e2) {
              await Linking.openURL(upiUrl); // Fallback to system chooser
            }
          }
        } else {
          const canOpen = await Linking.canOpenURL(intentUrl);
          if (canOpen) {
            await Linking.openURL(intentUrl);
          } else {
            console.log(`Fallback to system chooser: ${upiUrl}`);
            await Linking.openURL(upiUrl);
          }
        }
      } else {
        console.log(`Launching System Chooser: ${upiUrl}`);
        await Linking.openURL(upiUrl);
      }
      
      setTimeout(() => {
        setIsFailed(true);
      }, 2000);
    } catch (e) {
      setIsFailed(true);
    }
  };

  const detectUpiApps = async () => {
    const installed = [];
    for (const app of UPI_APPS) {
      try {
        const isSupported = await Linking.canOpenURL(app.scheme);
        if (isSupported) {
          installed.push(app);
        }
      } catch (e) {
        console.log(`Error checking ${app.name}:`, e);
      }
    }
    setAvailableUpiApps(installed);
  };

  React.useEffect(() => {
    if (autoOpenRepay && response?.data?.emis) {
      const firstUnpaid = response.data.emis.find((e: any) => e.paymentStatus !== "PAID");
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
  }, [autoOpenRepay, response]);

  React.useEffect(() => {
    if (repaymentForm.paymentMode === 'UPI') {
      detectUpiApps();
    }
  }, [repaymentForm.paymentMode]);

  const openRepaymentModal = (emi: any) => {
    setSelectedEmi(emi);
    setRepaymentForm({ paymentMode: "RTGS", refNo: "", remark: "" });
    setIsSuccess(false);
    setRepaymentModalVisible(true);
  };

  const closeRepaymentModal = () => {
    setRepaymentModalVisible(false);
    setIsSuccess(false);
    setIsFailed(false);
  };

  const repaymentMutation = useMutation({
    mutationFn: (data: any) => createRepayment(data),
    onSuccess: () => {
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["loanAccount", app.loanAccountId] });
    },
    onError: (error: any) => {
      setIsFailed(true);
      const errorMsg = error.response?.data?.message || "Something went wrong";
      Toast.show({
        type: 'error',
        text1: 'Payment Failed',
        text2: errorMsg,
        position: 'bottom'
      });
    }
  });

  const handleRepay = () => {
    if (!selectedEmi) return;
    
    if (repaymentForm.paymentMode === 'UPI') {
      launchUpiPayment(selectedUpiApp);
      return;
    }

    repaymentMutation.mutate({
      amount: selectedEmi.emi,
      paymentMode: repaymentForm.paymentMode,
      remark: repaymentForm.remark,
      loanAccountId: app.loanAccountId,
      emiId: selectedEmi.id,
      refNo: repaymentForm.refNo,
      discount: 0
    });
  };

  if (isLoading || !response) {
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

  const loan = response.data;
  const paidEmisCount = loan.emis?.filter((e: any) => e.paymentStatus === "PAID").length || 0;
  const totalEmisCount = loan.emis?.length || 0;
  const progressPercent = totalEmisCount > 0
    ? Math.round((paidEmisCount / totalEmisCount) * 100)
    : 0;

  const nextEmi = loan.emis?.find((e: any) => e.paymentStatus === "UNPAID");
  const payoffDate = loan.emis?.length > 0 ? loan.emis[loan.emis.length - 1].emiDate : loan.closedOn;

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
                const firstUnpaid = loan.emis?.find((emi: any) => emi.paymentStatus !== "PAID");
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
            {/* <Pressable 
              className="flex-1 bg-purple-800/50 flex-row items-center justify-center py-3.5 rounded-2xl border border-white/10 ml-2 active:bg-purple-800/70"
              style={({ pressed }) => [
                pressed && { transform: [{ scale: 0.98 }] }
              ]}
            >
              <Ionicons name="document-text-outline" size={16} color="white" />
              <Text className="text-white font-black text-xs ml-2 tracking-wide">Statement</Text>
            </Pressable> */}
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
            <Text className="text-slate-600 font-black text-[10px] uppercase">{loan.emis?.length || 0} EMIs</Text>
          </View>
        </View>

        <View className="bg-white rounded-[24px] border border-slate-100 mb-8 overflow-hidden shadow-sm shadow-slate-200/50">
          {loan.emis?.map((emi: any, idx: number) => {
            const isPaid = emi.paymentStatus === "PAID";
            const isOverdue = emi.paymentStatus === "OVERDUE";
            const isPending = emi.paymentStatus === "UNPAID";

            return (
              <Pressable 
                key={emi.id || idx} 
                onPress={() => {
                  if (!isPaid) {
                    openRepaymentModal(emi);
                  }
                }}
                className={`p-5 flex-row justify-between items-center ${idx !== loan.emis.length - 1 ? 'border-b border-slate-50' : ''} ${!isPaid ? 'active:bg-slate-50' : ''}`}
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
                      <Text className="text-white text-[10px] font-black tracking-widest uppercase">Repay</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}

          {(!loan.emis || loan.emis.length === 0) && (
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
                <Text className="text-slate-500 text-sm mt-2 text-center px-4">Your EMI has been recorded successfully.</Text>
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
                <Text className="text-slate-500 text-sm mt-2 text-center px-8 mb-8">We couldn't process your payment. Please check your network or try a different method.</Text>
                
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
                    className="p-6 rounded-3xl mb-8 flex-row justify-between items-center border border-purple-100 shadow-sm shadow-purple-100"
                  >
                    <View>
                      <Text className="text-purple-600 text-[10px] font-black uppercase tracking-widest mb-1">Due Amount</Text>
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

                <View className="mb-6">
                  <Text className="text-slate-700 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">Payment Mode</Text>
                  <View className="flex-row flex-wrap">
                    {["RTGS", "NEFT", "IMPS", "UPI", "CASH"].map((mode) => (
                      <Pressable
                        key={mode}
                        onPress={() => {
                          console.log("Selecting mode:", mode);
                          setRepaymentForm((current) => ({ ...current, paymentMode: mode }));
                          if (mode !== 'UPI') setSelectedUpiApp(null);
                        }}
                        className={`px-4 py-2.5 rounded-xl border mr-2 mb-2 ${
                          repaymentForm.paymentMode === mode 
                            ? "bg-purple-600 border-purple-600" 
                            : "bg-white border-slate-200"
                        } active:scale-95`}
                        style={({ pressed }) => [
                          repaymentForm.paymentMode === mode && {
                            shadowColor: "#7c3aed",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 3,
                          },
                          pressed && { opacity: 0.8 }
                        ]}
                      >
                        <Text className={`font-bold text-[11px] tracking-wide ${
                          repaymentForm.paymentMode === mode ? "text-white" : "text-slate-600"
                        }`}>{mode}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* High Fidelity UPI App Picker */}
                  {repaymentForm.paymentMode === 'UPI' && (
                    <MotiView
                      from={{ opacity: 0, translateY: 10, scale: 0.95 }}
                      animate={{ opacity: 1, translateY: 0, scale: 1 }}
                      className="mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-100"
                    >
                      <View className="flex-row justify-between items-center mb-3 ml-1">
                        <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Installed UPI Apps</Text>
                        {availableUpiApps.length > 4 && (
                          <Pressable onPress={() => setShowAllUpiApps(!showAllUpiApps)}>
                            <Text className="text-purple-600 text-[10px] font-black uppercase tracking-widest">
                              {showAllUpiApps ? "Show Less" : `+${availableUpiApps.length - 4} More`}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                      
                      <View className="flex-row">
                        {availableUpiApps.length > 0 ? (
                          <ScrollView 
                            horizontal={!showAllUpiApps} 
                            showsHorizontalScrollIndicator={false}
                            className={showAllUpiApps ? "flex-row flex-wrap" : ""}
                          >
                            <View className={showAllUpiApps ? "flex-row flex-wrap" : "flex-row"}>
                              {(showAllUpiApps ? availableUpiApps : availableUpiApps.slice(0, 4)).map((upiApp) => (
                                <Pressable
                                  key={upiApp.id}
                                  onPress={() => {
                                    setSelectedUpiApp(upiApp);
                                    launchUpiPayment(upiApp);
                                  }}
                                  className="mr-4 mb-4 items-center"
                                >
                                  <View 
                                    className={`w-14 h-14 rounded-2xl items-center justify-center border-2 ${
                                      selectedUpiApp?.id === upiApp.id ? 'border-purple-600 bg-white' : 'border-transparent bg-white'
                                    } shadow-sm shadow-slate-200`}
                                  >
                                    <View style={{ backgroundColor: upiApp.color }} className="w-10 h-10 rounded-xl items-center justify-center">
                                      <Ionicons name={upiApp.icon as any} size={20} color="white" />
                                    </View>
                                  </View>
                                  <Text className={`text-[10px] mt-2 font-bold ${
                                    selectedUpiApp?.id === upiApp.id ? 'text-purple-600' : 'text-slate-500'
                                  }`}>{upiApp.name}</Text>
                                </Pressable>
                              ))}
                              
                              <Pressable
                                onPress={() => {
                                  setSelectedUpiApp(null);
                                  launchUpiPayment(null);
                                }}
                                className="mr-2 mb-4 items-center"
                              >
                                <View 
                                  className={`w-14 h-14 rounded-2xl items-center justify-center border-2 ${
                                    !selectedUpiApp ? 'border-purple-600 bg-white' : 'border-transparent bg-white'
                                  } shadow-sm shadow-slate-200`}
                                >
                                  <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
                                    <Ionicons name="apps-outline" size={20} color="#64748b" />
                                  </View>
                                </View>
                                <Text className={`text-[10px] mt-2 font-bold ${
                                  !selectedUpiApp ? 'text-purple-600' : 'text-slate-500'
                                }`}>Others</Text>
                              </Pressable>
                            </View>
                          </ScrollView>
                        ) : (
                          <View className="flex-row items-center py-2">
                            <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center mr-3">
                              <Ionicons name="flash" size={14} color="#7c3aed" />
                            </View>
                            <Text className="text-slate-600 text-xs font-bold">Standard UPI intent will be used</Text>
                          </View>
                        )}
                      </View>
                    </MotiView>
                  )}
                </View>

                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-1 mb-4">
                  <Ionicons name="receipt-outline" size={18} color="#94a3b8" />
                  <TextInput
                    value={repaymentForm.refNo}
                    onChangeText={(t) => setRepaymentForm((current) => ({ ...current, refNo: t }))}
                    placeholder="Reference No. (UTR/Transaction ID)"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 ml-3 py-3.5 text-slate-900 font-bold"
                  />
                </View>

                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-1 mb-8">
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#94a3b8" />
                  <TextInput
                    value={repaymentForm.remark}
                    onChangeText={(t) => setRepaymentForm((current) => ({ ...current, remark: t }))}
                    placeholder="Add a remark (Optional)"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 ml-3 py-3.5 text-slate-900 font-bold"
                  />
                </View>

                <Pressable
                  onPress={handleRepay}
                  disabled={repaymentMutation.isPending}
                  className={`bg-purple-600 py-4 rounded-2xl flex-row justify-center items-center mb-4 ${
                    repaymentMutation.isPending ? "opacity-50" : "active:opacity-90"
                  }`}
                  style={({ pressed }) => [
                    !repaymentMutation.isPending && {
                      shadowColor: "#7c3aed",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6,
                    },
                    pressed && { transform: [{ scale: 0.98 }] }
                  ]}
                >
                  {repaymentMutation.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={18} color="white" />
                      <Text className="text-white font-black text-sm tracking-wide ml-2">Confirm Payment</Text>
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
                  <Text className="text-slate-400 text-[10px] font-bold ml-1">Secure 256-bit encrypted transaction</Text>
                </View>
                </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

/* ─────────────────────────────────────────────
 * OVERVIEW TAB
 * ───────────────────────────────────────────── */
const OverviewTab = ({ app, formatCurrency, formatDate }: any) => {
  const rulesEngineCompleted = app.applicationStepStatus?.rulesEngineCompleted ?? app.rulesEngineCompleted;
  const bankVerificationCompleted = app.applicationStepStatus?.bankVerificationCompleted ?? app.bankVerificationCompleted;
  const loanAgreementCompleted = app.applicationStepStatus?.loanAgreementCompleted ?? app.loanAgreementCompleted;
  const disbursalCompleted = app.applicationStatus === 'DISBURSED';

  const rulesEngineActive = !rulesEngineCompleted;
  const bankVerificationActive = rulesEngineCompleted && !bankVerificationCompleted;
  const loanAgreementActive = bankVerificationCompleted && !loanAgreementCompleted;
  const disbursalActive = loanAgreementCompleted && !disbursalCompleted;

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
          />
          <StepItem
            title="Loan Agreement"
            subtitle="Digital signing & final review"
            isCompleted={loanAgreementCompleted}
            isActive={loanAgreementActive}
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
        alert("Could not load document preview.");
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
                            <ActivityIndicator size="small" color="#059669" />
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
const BankChargesTab = ({ app, formatCurrency }: any) => {
  const bank = app.applicationBank;
  const charges = app.charges || app.charge || [];
  const [isAccountVisible, setIsAccountVisible] = useState(false);

  return (
    <View className="mt-4">
      {/* Bank Account Section */}
      <View className="flex-row justify-between items-center mb-6 px-2">
        <Text style={styles.sectionTitle}>Disbursement Account</Text>
      </View>

      {bank ? (
        <MotiView
          from={{ opacity: 0, rotateX: "15deg", scale: 0.95 }}
          animate={{ opacity: 1, rotateX: "0deg", scale: 1 }}
          transition={{ type: "timing", duration: 600 }}
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

const StepItem = ({ title, subtitle, isCompleted, isActive, isFirst, isLast }: any) => {
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
          className={`font-black text-sm tracking-tight ${
            isCompleted ? "text-slate-900" : isActive ? "text-purple-950" : "text-slate-400"
          }`}
        >
          {title}
        </Text>
        <Text
          className={`text-[11px] font-bold mt-1 leading-4 ${
            isActive ? "text-purple-900/60" : "text-slate-400"
          }`}
        >
          {subtitle}
        </Text>
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

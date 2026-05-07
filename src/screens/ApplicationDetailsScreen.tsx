import React, { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { MotiView } from "../components/Motion";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { getApplicationDetails, getDocumentDownloadPath } from "../services/api";
import { Layout } from "react-native-reanimated";
import { formatLabel } from "../utils";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { DocumentViewer } from "../components/DocumentViewer";

const { width } = Dimensions.get("window");

type TabKey = "overview" | "documents" | "bank";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "overview", label: "Overview", icon: "layers" },
  { key: "documents", label: "Documents", icon: "file-text" },
  { key: "bank", label: "Bank & Charges", icon: "credit-card" },
];

interface ApplicationDetailsScreenProps {
  applicationId: number;
  onBack: () => void;
}

export const ApplicationDetailsScreen = ({
  applicationId,
  onBack,
}: ApplicationDetailsScreenProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => getApplicationDetails(applicationId).then((res) => res.data),
    enabled: !!applicationId,
  });

  const app = response?.data;

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
        <View className="w-16 h-16 bg-white rounded-3xl items-center justify-center shadow-sm border border-slate-100 mb-4">
          <ActivityIndicator size="large" color="#172554" />
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

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-6 pb-6 pt-6 border-b border-slate-100 z-50 shadow-sm shadow-slate-200/20">
          <View className="flex-row items-center justify-between mb-8">
            <TouchableOpacity
              onPress={onBack}
              className="w-12 h-12 items-center justify-center rounded-[20px] bg-slate-50 border border-slate-100 shadow-sm"
            >
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            
            <View className="items-center">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mb-1">
                Application File
              </Text>
              <Text className="text-slate-900 text-xl font-black tracking-tight">
                #{app.applicationNo || app.id}
              </Text>
            </View>

            <TouchableOpacity className="w-12 h-12 items-center justify-center rounded-[20px] bg-slate-50 border border-slate-100 shadow-sm">
              <Feather name="more-vertical" size={20} color="#1e293b" />
            </TouchableOpacity>
          </View>

          {/* Status & Date Info */}
          <View className="flex-row items-center justify-center space-x-6">
            <View className={`px-5 py-2 rounded-full border ${getStatusBg(app.applicationStatus)} border-opacity-30 flex-row items-center`}>
              <View style={{ backgroundColor: statusColor }} className="w-2.5 h-2.5 rounded-full mr-2.5 shadow-sm" />
              <Text style={{ color: statusColor }} className="text-[11px] font-black uppercase tracking-widest">
                {app.applicationStatus}
              </Text>
            </View>
            <View className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              Updated {formatDate(app.updatedOn || app.createdOn)}
            </Text>
          </View>
        </View>

        {/* Exact Match Tab Bar */}
        <View className="bg-white border-b border-slate-200">
          <View className="flex-row px-8 py-5 justify-around">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className="flex-1 py-12 relative items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-[13px] font-semibold ${
                      isActive ? "text-[#E85D5D]" : "text-slate-500"
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
 * OVERVIEW TAB
 * ───────────────────────────────────────────── */
const OverviewTab = ({ app, formatCurrency, formatDate }: any) => (
  <View>
    {/* Hero Card - Premium Gradient */}
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "timing", duration: 600 }}
    >
      <LinearGradient
        colors={["#0F172A", "#1E293B"]}
        className="rounded-[40px] p-8 mt-2 shadow-2xl mb-8 relative overflow-hidden"
      >
        {/* Subtle Decorative Circle */}
        <View className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full" />
        
        <View className="flex-row justify-between items-start mb-10">
          <View>
            <Text className="text-blue-400 text-[10px] font-black uppercase tracking-[2.5px] mb-2">Principal Amount</Text>
            <View className="flex-row items-baseline">
              <Text className="text-white text-4xl font-black tracking-tight">
                {formatCurrency(app.requestedAmount)}
              </Text>
            </View>
          </View>
          <View className="w-14 h-14 bg-white/5 rounded-2xl items-center justify-center border border-white/10">
            <MaterialCommunityIcons name="wallet-outline" size={28} color="#3B82F6" />
          </View>
        </View>

        {/* Stats Grid - High Fidelity */}
        <View className="flex-row flex-wrap justify-between pt-6 border-t border-white/10">
          <View className="w-[48%] mb-6">
            <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Monthly EMI</Text>
            <Text className="text-white text-lg font-black">{formatCurrency(app.emi)}</Text>
          </View>
          <View className="w-[48%] mb-6">
            <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Annual Interest</Text>
            <View className="flex-row items-center">
              <Text className="text-white text-lg font-black">{app.interest}%</Text>
              <View className="ml-2 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                <Text className="text-emerald-400 text-[8px] font-black">FIXED</Text>
              </View>
            </View>
          </View>
          <View className="w-[48%]">
            <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Loan Tenure</Text>
            <Text className="text-white text-lg font-black">{app.tenure} Months</Text>
          </View>
          <View className="w-[48%]">
            <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Disbursal Amt</Text>
            <Text className="text-white text-lg font-black">{formatCurrency(app.disbursalAmount)}</Text>
          </View>
        </View>
      </LinearGradient>
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
          isCompleted={app.applicationStepStatus?.rulesEngineCompleted}
          isFirst
        />
        <StepItem
          title="Bank Verification"
          subtitle="Validating disbursal account"
          isCompleted={app.applicationStepStatus?.bankVerificationCompleted}
        />
        <StepItem
          title="Loan Agreement"
          subtitle="Digital signing & final review"
          isCompleted={app.applicationStepStatus?.loanAgreementCompleted}
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
    } catch (error) {
      console.error('View failed:', error);
      alert("Error loading document.");
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
                  className={`bg-white rounded-2xl border ${
                    hasUpload ? "border-emerald-100 shadow-sm shadow-emerald-50" : "border-slate-100 shadow-sm shadow-slate-100"
                  } p-4`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      {/* Icon */}
                      <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
                        hasUpload ? "bg-emerald-50" : "bg-slate-50"
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

            <Text className="text-blue-100/60 text-[10px] font-black uppercase tracking-[3px] mb-2">Account Number</Text>
            <Text className="text-white text-2xl font-black tracking-[4px] mb-10">
              {bank.accountNo ? `•••• •••• •••• ${bank.accountNo.slice(-4)}` : "•••• •••• •••• ••••"}
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

const StepItem = ({ title, subtitle, isCompleted, isFirst, isLast }: any) => (
  <View className="flex-row">
    <View className="items-center mr-5">
      <View
        className={`w-10 h-10 rounded-2xl items-center justify-center border-2 ${
          isCompleted ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200" : "bg-white border-slate-100"
        }`}
      >
        {isCompleted ? (
          <Ionicons name="checkmark-done" size={20} color="white" />
        ) : (
          <View className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
        )}
      </View>
      {!isLast && (
        <View className={`w-0.5 flex-1 my-1 ${isCompleted ? "bg-emerald-500" : "bg-slate-100"}`} />
      )}
    </View>
    <View className={`flex-1 ${!isLast ? "mb-8" : "mb-2"}`}>
      <Text className={`font-black text-sm tracking-tight ${isCompleted ? "text-slate-900" : "text-slate-400"}`}>
        {title}
      </Text>
      <Text className="text-slate-400 text-[11px] font-bold mt-1 leading-4">{subtitle}</Text>
    </View>
  </View>
);

const DetailRow = ({ label, value, isLast }: any) => (
  <View className={`flex-row justify-between py-4 ${!isLast ? "border-b border-slate-50" : ""}`}>
    <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</Text>
    <Text className="text-slate-900 font-black text-sm tracking-tight">{value || "N/A"}</Text>
  </View>
);

const styles = {
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900" as any,
    color: "#0F172A",
    letterSpacing: -0.5,
  },
};

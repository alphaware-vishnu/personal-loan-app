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
import { getApplicationDetails } from "../services/api";
import { Layout } from "react-native-reanimated";

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
        <View className="bg-white px-6 pb-4 pt-2 border-b border-slate-100">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={onBack}
              className="w-10 h-10 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100"
            >
              <Ionicons name="arrow-back" size={20} color="#1e293b" />
            </TouchableOpacity>
            <View className="flex-1 ml-4">
              <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                Application
              </Text>
              <Text className="text-slate-900 text-base font-bold">
                {app.applicationNo || `APP-${app.id}`}
              </Text>
            </View>
            <View
              className={`px-3 py-1.5 rounded-full ${getStatusBg(app.applicationStatus)}`}
            >
              <Text
                style={{ color: statusColor }}
                className="text-[10px] font-black uppercase tracking-wider"
              >
                {app.applicationStatus}
              </Text>
            </View>
          </View>

          {/* Tab Bar */}
          <View className="flex-row mt-4 px-1 border-b border-slate-100">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className="flex-1 items-center py-4"
                >
                  <View className="flex-row items-center">
                    <Feather
                      name={tab.icon as any}
                      size={18}
                      color={isActive ? "#3b82f6" : "#94a3b8"}
                    />
                    <Text
                      className={`ml-2 text-sm font-extrabold ${
                        isActive ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </View>
                  
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <MotiView
                      layout={Layout}
                      from={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      className="absolute bottom-0 left-4 right-4 h-1 bg-blue-600 rounded-full"
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
    {/* Hero Card */}
    <View className="bg-slate-900 rounded-3xl p-6 mt-6 shadow-xl mb-6">
      <View className="flex-row justify-between items-start mb-5">
        <View>
          <Text className="text-slate-400 text-xs font-medium">Requested Amount</Text>
          <Text className="text-white text-3xl font-black mt-1">
            {formatCurrency(app.requestedAmount)}
          </Text>
        </View>
        <View className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center">
          <MaterialCommunityIcons name="finance" size={24} color="white" />
        </View>
      </View>

      {/* Stats Grid - 2x2 */}
      <View className="border-t border-white/10 pt-5">
        <View className="flex-row justify-between mb-4">
          <StatPill label="Est. EMI" value={formatCurrency(app.emi)} />
          <StatPill label="Disbursal" value={formatCurrency(app.disbursalAmount)} />
        </View>
        <View className="flex-row justify-between">
          <StatPill label="Interest" value={`${app.interest}% p.a.`} />
          <StatPill label="Tenure" value={`${app.tenure} Months`} />
        </View>
      </View>
    </View>

    {/* Application Progress */}
    <SectionTitle title="Application Progress" icon="activity" />
    <View className="bg-white rounded-3xl p-6 border border-slate-100 mb-6">
      <StepItem
        title="Rules Engine Check"
        subtitle="Automated credit & eligibility verification"
        isCompleted={app.applicationStepStatus?.rulesEngineCompleted}
        isFirst
      />
      <StepItem
        title="Bank Account Verification"
        subtitle="Validating disbursement account details"
        isCompleted={app.applicationStepStatus?.bankVerificationCompleted}
      />
      <StepItem
        title="Loan Agreement"
        subtitle="Digital signing & final review"
        isCompleted={app.applicationStepStatus?.loanAgreementCompleted}
        isLast
      />
    </View>

    {/* Loan Details Grid */}
    <SectionTitle title="Loan Information" icon="info" />
    <View className="bg-white rounded-3xl p-5 border border-slate-100 mb-6">
      <DetailRow label="Product" value={app.productName || "Personal Loan"} />
      <DetailRow label="Scheme" value={app.schemeName || "—"} />
      <DetailRow label="Interest Type" value={app.interestType || "REDUCING"} />
      <DetailRow label="Repayment" value={app.repaymentFrequency || "MONTHLY"} />
      <DetailRow label="Application Source" value={app.applicationSource || "—"} />
      <DetailRow label="Created On" value={formatDate(app.createdOn)} isLast />
    </View>

    {/* Remark */}
    {app.remark && (
      <>
        <SectionTitle title="Remark" icon="message-circle" />
        <View className="bg-amber-50 rounded-3xl p-5 border border-amber-100 mb-6">
          <Text className="text-amber-800 text-sm font-medium leading-5">{app.remark}</Text>
        </View>
      </>
    )}
  </View>
);

/* ─────────────────────────────────────────────
 * DOCUMENTS TAB
 * ───────────────────────────────────────────── */
const DocumentsTab = ({ app }: any) => {
  const docGroups = app.applicationDocumentsGrouped || [];

  if (docGroups.length === 0) {
    return (
      <View className="mt-10 items-center py-16">
        <View className="w-16 h-16 bg-slate-100 rounded-3xl items-center justify-center mb-4">
          <Feather name="folder" size={28} color="#94a3b8" />
        </View>
        <Text className="text-slate-900 font-bold text-lg">No Documents</Text>
        <Text className="text-slate-400 text-sm mt-1 text-center px-8">
          No documents have been uploaded for this application yet.
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-6">
      {docGroups.map((group: any, gIdx: number) => (
        <MotiView
          key={group.category?.id || gIdx}
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: gIdx * 100, type: "timing", duration: 400 }}
          className="mb-6"
        >
          {/* Category Header */}
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 bg-blue-50 rounded-xl items-center justify-center mr-3">
              <Feather name="folder" size={16} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 font-bold text-sm">
                {group.category?.categoryName || "Documents"}
              </Text>
              {group.category?.description && (
                <Text className="text-slate-400 text-[10px] mt-0.5">
                  {group.category.description}
                </Text>
              )}
            </View>
            <View className="bg-slate-100 px-2 py-0.5 rounded-full">
              <Text className="text-slate-500 text-[10px] font-bold">
                {group.documentTypes?.length || 0} files
              </Text>
            </View>
          </View>

          {/* Document Cards */}
          <View className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            {(group.documentTypes || []).map((doc: any, dIdx: number) => {
              const hasUpload = doc.awsDocumentIds && doc.awsDocumentIds.length > 0;
              const isLast = dIdx === (group.documentTypes?.length || 0) - 1;
              return (
                <View
                  key={doc.id || dIdx}
                  className={`flex-row items-center p-4 ${!isLast ? "border-b border-slate-50" : ""}`}
                >
                  <View className={`w-10 h-10 rounded-2xl items-center justify-center mr-3 ${hasUpload ? "bg-emerald-50" : "bg-slate-50"}`}>
                    <Feather
                      name={hasUpload ? "check-circle" : "upload-cloud"}
                      size={18}
                      color={hasUpload ? "#10b981" : "#94a3b8"}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 font-bold text-sm">
                      {doc.documentName || "Document"}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      {doc.isRequired && (
                        <View className="bg-red-50 px-1.5 py-0.5 rounded mr-2">
                          <Text className="text-red-500 text-[9px] font-bold">REQUIRED</Text>
                        </View>
                      )}
                      {doc.documentNumber && (
                        <Text className="text-slate-400 text-[10px] font-medium">
                          Doc#: {doc.documentNumber}
                        </Text>
                      )}
                      {!doc.documentNumber && doc.acceptedFormats && (
                        <Text className="text-slate-400 text-[10px] font-medium uppercase">
                          {doc.acceptedFormats}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View className="items-end">
                    {hasUpload ? (
                      <View className="flex-row items-center">
                        <Text className="text-emerald-600 text-[10px] font-bold mr-1">
                          {doc.awsDocumentIds.length} uploaded
                        </Text>
                        <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                      </View>
                    ) : (
                      <Text className="text-slate-300 text-[10px] font-bold">PENDING</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </MotiView>
      ))}
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
    <View className="mt-6">
      {/* Bank Account Card */}
      <SectionTitle title="Bank Account" icon="landmark" iconPack="feather" />
      {bank ? (
        <View className="bg-white rounded-3xl border border-slate-100 mb-6 overflow-hidden">
          {/* Bank Header */}
          <View className="bg-blue-600 p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-white/20 rounded-2xl items-center justify-center mr-3">
                  <Ionicons name="business" size={20} color="white" />
                </View>
                <View>
                  <Text className="text-white font-bold text-base">{bank.bank || "Bank"}</Text>
                  <Text className="text-blue-200 text-xs">{bank.branch || "Branch"}</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="shield-check" size={22} color="#bbf7d0" />
            </View>
          </View>

          {/* Bank Details */}
          <View className="p-5">
            <DetailRow label="Account Holder" value={bank.accountHolderName || "—"} />
            <DetailRow
              label="Account No."
              value={bank.accountNo ? `••••${bank.accountNo.slice(-4)}` : "—"}
            />
            <DetailRow label="IFSC Code" value={bank.ifsc || "—"} />
            <DetailRow label="Account Type" value={bank.accountType || "SAVINGS"} />
            <DetailRow label="City" value={bank.city || "—"} isLast />
          </View>
        </View>
      ) : (
        <View className="bg-white rounded-3xl p-8 border border-dashed border-slate-200 mb-6 items-center">
          <View className="w-14 h-14 bg-slate-50 rounded-3xl items-center justify-center mb-3">
            <Ionicons name="business-outline" size={24} color="#94a3b8" />
          </View>
          <Text className="text-slate-400 font-bold text-sm">No Bank Details</Text>
          <Text className="text-slate-300 text-xs mt-1">Bank information not available</Text>
        </View>
      )}

      {/* Charges Section */}
      <SectionTitle title="Charges & Fees" icon="percent" iconPack="feather" />
      {charges.length > 0 ? (
        <View className="bg-white rounded-3xl border border-slate-100 mb-6 overflow-hidden">
          {charges.map((charge: any, idx: number) => {
            const isLast = idx === charges.length - 1;
            return (
              <View key={charge.id || idx}>
                <View className={`p-4 ${!isLast ? "border-b border-slate-50" : ""}`}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-9 h-9 bg-orange-50 rounded-xl items-center justify-center mr-3">
                        <MaterialCommunityIcons name="receipt" size={18} color="#f97316" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 font-bold text-sm">
                          {charge.name || charge.code || "Charge"}
                        </Text>
                        <View className="flex-row items-center mt-0.5">
                          <View className="bg-slate-100 px-1.5 py-0.5 rounded mr-2">
                            <Text className="text-slate-500 text-[9px] font-bold uppercase">
                              {charge.chargeType?.replace(/_/g, " ") || "FEE"}
                            </Text>
                          </View>
                          <Text className="text-slate-400 text-[10px]">
                            {charge.deductionType || "UPFRONT"} • {charge.calculationType || "FLAT"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text className="text-slate-900 font-black text-sm ml-2">
                      {charge.calculationType === "PERCENTAGE"
                        ? `${charge.value}%`
                        : formatCurrency(charge.value || 0)}
                    </Text>
                  </View>

                  {/* Child Charges */}
                  {charge.childCharges && charge.childCharges.length > 0 && (
                    <View className="ml-12 mt-3 pl-3 border-l-2 border-slate-100">
                      {charge.childCharges.map((child: any, cIdx: number) => (
                        <View
                          key={child.id || cIdx}
                          className="flex-row items-center justify-between py-2"
                        >
                          <View className="flex-row items-center flex-1">
                            <Feather name="corner-down-right" size={12} color="#cbd5e1" />
                            <Text className="text-slate-500 text-xs font-medium ml-2">
                              {child.name || child.code}
                            </Text>
                          </View>
                          <Text className="text-slate-700 text-xs font-bold">
                            {child.calculationType === "PERCENTAGE"
                              ? `${child.value}%`
                              : formatCurrency(child.value || 0)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View className="bg-white rounded-3xl p-8 border border-dashed border-slate-200 mb-6 items-center">
          <View className="w-14 h-14 bg-slate-50 rounded-3xl items-center justify-center mb-3">
            <Feather name="percent" size={24} color="#94a3b8" />
          </View>
          <Text className="text-slate-400 font-bold text-sm">No Charges</Text>
          <Text className="text-slate-300 text-xs mt-1">No fees or charges recorded</Text>
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
    <View className="items-center mr-4">
      <View
        className={`w-7 h-7 rounded-full items-center justify-center border-2 ${
          isCompleted ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-200"
        }`}
      >
        {isCompleted ? (
          <Ionicons name="checkmark" size={14} color="white" />
        ) : (
          <View className="w-2 h-2 bg-slate-200 rounded-full" />
        )}
      </View>
      {!isLast && (
        <View className={`w-0.5 flex-1 ${isCompleted ? "bg-emerald-400" : "bg-slate-100"}`} />
      )}
    </View>
    <View className={`flex-1 ${!isLast ? "mb-7" : ""}`}>
      <Text className={`font-bold text-sm ${isCompleted ? "text-slate-900" : "text-slate-400"}`}>
        {title}
      </Text>
      <Text className="text-slate-400 text-xs mt-0.5">{subtitle}</Text>
    </View>
  </View>
);

const DetailRow = ({ label, value, isLast }: any) => (
  <View className={`flex-row justify-between py-3 ${!isLast ? "border-b border-slate-50" : ""}`}>
    <Text className="text-slate-400 text-sm">{label}</Text>
    <Text className="text-slate-900 font-bold text-sm">{value || "N/A"}</Text>
  </View>
);

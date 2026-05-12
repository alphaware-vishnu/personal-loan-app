import React from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { LoanCard } from "../components/LoanCard";
import { LoanSelectionModal } from "../components/LoanSelectionModal";
import { Button } from "../components/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import Carousel from "react-native-reanimated-carousel";

import { useQuery } from "@tanstack/react-query";
import { api, getProductDocuments, getCustomerApplications } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useLoanStore } from "../store/loanStore";

const { width } = Dimensions.get("window");

interface DashboardScreenProps {
  onStartLoan: () => void;
  onSchemeSelect: (scheme: any) => void;
  onViewDetails: (applicationId: number, autoOpenRepay?: boolean) => void;
  onViewProfile: () => void;
}

export const DashboardScreen = ({ onStartLoan, onSchemeSelect, onViewDetails, onViewProfile }: DashboardScreenProps) => {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const { setScheme, setCustomerId, setCalculationResults, setDocumentRequirements, customerInfo } = useLoanStore();
  const { authData } = useAuthStore();

  const customerId = authData?.customerId;

  const { data: applications, isLoading: isAppsLoading } = useQuery({
    queryKey: ['applications', customerId],
    queryFn: () => getCustomerApplications(customerId!).then(res => res.data?.data || []),
    enabled: !!customerId,
  });

  const { data: schemesResponse, isLoading: isSchemesLoading } = useQuery({
    queryKey: ["loan-schemes"],
    queryFn: () => api({
      url: `/scheme/products/5`
    }),
  });

  const schemes = schemesResponse?.data?.data || [];

  const handleApplyNow = () => {
    setModalVisible(true);
    onStartLoan();
  };

  const handleSelect = async (scheme: any) => {
    setModalVisible(false);
    setIsCalculating(true);
    try {
      setScheme(scheme);
      if (authData?.customerId) setCustomerId(authData.customerId);
      const response = await api({
        url: "/application/calculate/emi",
        method: "POST",
        data: {
          requestedAmount: scheme.loanAmount,
          interest: scheme.defaultInterest,
          tenure: scheme.defaultTenure,
          repaymentFrequency: scheme.tenureFrequency || 'MONTHLY',
          schemeMasterId: scheme.id,
          repaymentDate: new Date().toISOString().split('T')[0],
        }
      });
      if (response.data?.data) {
        setCalculationResults(response.data.data.emi, response.data.data.disbursementAmount);
      }
      const docResponse = await getProductDocuments(scheme.productId || 5);
      if (docResponse.data?.data?.documentRequirements) {
        setDocumentRequirements(docResponse.data.data.documentRequirements);
      }
      onSchemeSelect(scheme);
    } catch (error) {
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
  const firstName = customerInfo.applicantName?.split(" ")[0] || "there";

  // --- UI Components ---
  const Header = () => (
    <View className="px-6 pt-2 mb-6">
      <View className="flex-row justify-between items-center mb-6">
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="menu-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>
      <View>
        <Text className="text-slate-500 text-[11px] font-black uppercase tracking-widest mb-1">Welcome back,</Text>
        <Text className="text-slate-900 text-3xl font-black tracking-tight">{firstName}</Text>
      </View>

      {/* Side Menu Popover */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <MotiView
            from={{ opacity: 0, translateX: -50 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            className="w-2/3 h-full bg-white shadow-2xl pt-16 px-6"
          >
            <View className="mb-10">
              <View className="w-16 h-16 bg-blue-50 rounded-2xl items-center justify-center mb-4 border border-blue-100">
                <Ionicons name="person" size={32} color="#3B82F6" />
              </View>
              <Text className="text-slate-900 text-xl font-black">{firstName}</Text>
              <Text className="text-slate-400 text-xs font-medium">{authData?.mobile}</Text>
            </View>

            <TouchableOpacity 
              className="flex-row items-center py-4 border-b border-slate-50"
              onPress={() => {
                setMenuVisible(false);
                onViewProfile();
              }}
            >
              <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-4">
                <Ionicons name="person-outline" size={20} color="#3B82F6" />
              </View>
              <Text className="text-slate-700 font-bold">My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center py-4 border-b border-slate-50">
              <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-4">
                <Ionicons name="settings-outline" size={20} color="#64748B" />
              </View>
              <Text className="text-slate-700 font-bold">Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center py-4 border-b border-slate-50">
              <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-4">
                <Ionicons name="help-circle-outline" size={20} color="#64748B" />
              </View>
              <Text className="text-slate-700 font-bold">Support</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center mt-auto mb-10 py-4">
              <View className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center mr-4">
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              </View>
              <Text className="text-red-500 font-bold">Sign Out</Text>
            </TouchableOpacity>
          </MotiView>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  const NotchedCard = ({ children, style, notchColor = "#ffffff", colors }: any) => (
    <View style={[styles.notchedCard, style, colors && { backgroundColor: "transparent" }]}>
      {colors && (
        <LinearGradient colors={colors} style={[StyleSheet.absoluteFill, { borderRadius: 32 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      )}
      {/* Improved Notch with smooth shoulders */}
      <View style={[styles.notchContainer]}>
        <View style={[styles.notchShoulder, styles.notchShoulderLeft, { backgroundColor: colors ? colors[0] : '#FFF' }]} />
        <View style={[styles.notch, { backgroundColor: notchColor }]} />
        <View style={[styles.notchShoulder, styles.notchShoulderRight, { backgroundColor: colors ? colors[1] : '#FFF' }]} />
      </View>
      
      <View style={{ flex: 1, paddingTop: 10, zIndex: 10 }}>
        {children}
      </View>
    </View>
  );

  const ServiceItem = ({ icon, name, color, iconColor }: any) => (
    <TouchableOpacity
      style={styles.serviceGridItem}
      activeOpacity={0.7}
    >
      <View style={[styles.serviceContainer, { backgroundColor: color || "#FFF" }]}>
        <Ionicons name={icon} size={22} color={iconColor || "#1A1A1A"} />
      </View>
      <Text style={styles.serviceLabel}>{name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#ffff", "#ffff"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <Header />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* Active Loans Carousel */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 800 }}
            className="mb-8"
          >
            {isAppsLoading ? (
              <View className="px-6">
                <View style={[styles.mainStatCard, { backgroundColor: "#F97316", justifyContent: 'center', alignItems: 'center' }]}>
                  <ActivityIndicator color="#FFF" />
                </View>
              </View>
            ) : applications && applications.length > 0 ? (
              <Carousel
                loop={false}
                width={width}
                height={220}
                autoPlay={false}
                data={applications}
                scrollAnimationDuration={1000}
                mode="parallax"
                modeConfig={{
                  parallaxScrollingScale: 0.9,
                  parallaxScrollingOffset: 50,
                }}
                renderItem={({ item }: { item: any }) => (
                  <TouchableOpacity 
                    onPress={() => onViewDetails(item.id)}
                    activeOpacity={0.9}
                  >
                    <NotchedCard 
                      style={[styles.mainStatCard, { marginHorizontal: 0 }]} 
                      colors={["#3B82F6", "#2563EB"]}
                      notchColor="#EFF6FF"
                    >
                    <View className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
                    <View className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-400/20 rounded-full" />
                    
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 pr-4">
                        <Text style={[styles.cardLabel, { color: "#FFF", fontSize: 14 }]}>Personal Loan</Text>
                        <View className="bg-white/20 self-start px-2 py-0.5 rounded-md mt-1">
                          <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                            {item.applicationStatus}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.swapButton, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                        <Ionicons name="card" size={18} color="#FFF" />
                      </View>
                    </View>

                    <View className="mt-2">
                      <Text className="text-blue-100 text-[10px] uppercase font-black tracking-wider">Outstanding Amount</Text>
                      <Text className="text-white text-3xl font-black">{formatAmount(item.requestedAmount)}</Text>
                    </View>

                    <View className="flex-row items-center justify-between mt-auto">
                      <View>
                        <Text className="text-blue-100 text-[10px] uppercase font-black tracking-wider">Next EMI</Text>
                        <Text className="text-white text-xs font-bold">₹{(item.requestedAmount * 0.05).toFixed(0)} • 15 May</Text>
                      </View>
                      {item.applicationStatus === "DISBURSED" && (
                        <TouchableOpacity
                          className="bg-white px-6 py-2.5 rounded-2xl shadow-lg shadow-black/10 flex-row items-center"
                          activeOpacity={0.8}
                          onPress={(e) => {
                            e.stopPropagation();
                            onViewDetails(item.id, true);
                          }}
                        >
                          <Text className="text-blue-600 text-xs font-black uppercase tracking-wider">Repay Now</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </NotchedCard>
                </TouchableOpacity>
                )}
              />
            ) : (
              <View className="px-6">
                <NotchedCard style={[styles.mainStatCard, { backgroundColor: "#F97316" }]} notchColor="#EFF6FF">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1 pr-4">
                      <Text style={[styles.cardLabel, { color: "#FFF" }]}>No Active Loans</Text>
                      <Text style={[styles.cardSubLabel, { color: "rgba(255,255,255,0.8)" }]}>
                        You don't have any active loans at the moment.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={handleApplyNow}
                    className="bg-white px-6 py-3 rounded-2xl self-start mt-auto"
                  >
                    <Text className="text-orange-600 font-bold">Apply for Loan</Text>
                  </TouchableOpacity>
                </NotchedCard>
              </View>
            )}
          </MotiView>

          {/* Services Section - Organized Grid */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 800, delay: 200 }}
            className="px-6 mb-8"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text style={styles.sectionTitle}>Quick Tools</Text>
            </View>
            <View className="flex-row flex-wrap justify-between">
              <ServiceItem icon="calculator-outline" name="Calculator" color="#FFF7ED" iconColor="#F97316" />
              <ServiceItem icon="speedometer-outline" name="Score" color="#EFF6FF" iconColor="#3B82F6" />
              <ServiceItem icon="document-text-outline" name="Reports" color="#ECFDF5" iconColor="#10B981" />
              <ServiceItem icon="shield-checkmark-outline" name="Insure" color="#FDF4FF" iconColor="#A855F7" />
            </View>
          </MotiView>

          {/* Featured Schemes Section */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 800, delay: 400 }}
            className="mb-8"
          >
            <View className="flex-row justify-between items-center px-6 mb-4">
              <Text style={styles.sectionTitle}>Instant Loan Schemes</Text>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6">
              {isSchemesLoading ? (
                <View className="flex-row">
                  {[1, 2, 3].map(i => (
                    <View key={i} className="w-[160px] h-[180px] bg-white rounded-3xl mr-4 animate-pulse border border-slate-100" />
                  ))}
                </View>
              ) : schemes.length > 0 ? (
                schemes.slice(0, 3).map((scheme: any, idx: number) => (
                  <NotchedCard 
                    key={scheme.id} 
                    style={styles.schemeSummaryCard} 
                    colors={idx % 2 === 0 ? ["#8B5CF6", "#7C3AED"] : ["#6366F1", "#4F46E5"]} 
                    notchColor="#ffffff"
                  >
                    <View className="absolute -top-16 -right-16 w-32 h-32 bg-white/10 rounded-full" />
                    <TouchableOpacity
                      onPress={() => handleSelect(scheme)}
                      activeOpacity={0.9}
                      className="flex-1 justify-between"
                    >
                      <View>
                        <View className="flex-row justify-between items-start">
                          <View className="bg-black/20 p-2.5 rounded-2xl">
                            <Ionicons name="home" size={18} color="#FFF" />
                          </View>
                          <View className="flex-row items-center bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                            <Text className="text-white text-[9px] font-black mr-2 uppercase tracking-tighter">Calculate</Text>
                            <Ionicons name="arrow-up-outline" size={14} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />
                          </View>
                        </View>

                        <View className="flex-row items-start justify-between mt-2">
                          <View className="flex-1">
                            <Text className="text-white text-xl font-black leading-tight">
                              {scheme.name.split('_')[0]}{'\n'}Loan
                            </Text>
                            <Text className="text-white text-lg font-black mt-1">{formatAmount(scheme.loanAmount)}</Text>
                            <View className="flex-row items-center mt-1">
                              <Ionicons name="flash" size={8} color="#FBBF24" />
                              <Text className="text-white/80 text-[7px] font-bold ml-1 uppercase tracking-widest">
                                Instant Approval
                              </Text>
                            </View>
                          </View>
                          <View className="w-16 h-10 bg-white/10 rounded-full items-center justify-center overflow-hidden border border-white/20">
                            <Ionicons name="business" size={20} color="rgba(255,255,255,0.2)" />
                          </View>
                        </View>

                        <View className="flex-row items-center mt-3">
                          <View className="bg-white/15 px-2 py-1 rounded-lg flex-row items-center mr-2 border border-white/5">
                            <Ionicons name="trending-up" size={10} color="#4ADE80" />
                            <Text className="text-white text-[9px] font-black ml-1">{scheme.defaultInterest}%</Text>
                          </View>
                          <View className="bg-white/15 px-2 py-1 rounded-lg flex-row items-center border border-white/5">
                            <Ionicons name="time" size={10} color="#60A5FA" />
                            <Text className="text-white text-[9px] font-black ml-1">{scheme.defaultTenure}M</Text>
                          </View>
                        </View>
                      </View>

                      <View className="mt-4 flex-row items-center justify-between">
                        <Text className="text-white/80 text-[8px] font-black uppercase tracking-[2px]">Apply Now</Text>
                        <View className="h-[1px] flex-1 bg-white/20 mx-3" />
                        <Ionicons name="chevron-forward" size={12} color="#FFF" />
                      </View>
                    </TouchableOpacity>
                  </NotchedCard>
                ))
              ) : (
                <View className="bg-white/50 p-6 rounded-3xl border border-dashed border-slate-200 ml-6 w-[260px] h-[200px] justify-center items-center">
                  <Ionicons name="alert-circle-outline" size={32} color="#CBD5E1" />
                  <Text className="text-slate-400 text-center mt-2 text-xs font-medium">No specialized schemes available right now.</Text>
                </View>
              )}
            </ScrollView>
          </MotiView>

          {/* Original Applications List (Integrated) */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 800, delay: 600 }}
            className="px-6"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text style={styles.sectionTitle}>Active Loans</Text>
              <TouchableOpacity onPress={handleApplyNow}>
                <Text style={styles.viewAllText}>New Loan</Text>
              </TouchableOpacity>
            </View>

            {isAppsLoading ? (
              <ActivityIndicator color="#3B82F6" size="small" />
            ) : applications && applications.length > 0 ? (
              applications.map((app: any, idx: number) => (
                <TouchableOpacity
                  key={app.id || idx}
                  style={styles.loanAppItem}
                  onPress={() => onViewDetails(app.id)}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="bg-slate-50 w-12 h-12 rounded-xl items-center justify-center mr-4 border border-slate-100">
                        <Ionicons name="wallet" size={20} color="#3B82F6" />
                      </View>
                      <View>
                        <Text className="text-sm font-black text-slate-900 tracking-tight">{formatAmount(app.requestedAmount)}</Text>
                        <View className="flex-row items-center mt-1">
                          <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                          <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{app.applicationStatus}</Text>
                        </View>
                      </View>
                    </View>
                    {app.applicationStatus === "DISBURSED" ? (
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          onViewDetails(app.id, true);
                        }}
                        className="bg-blue-600 px-4 py-2 rounded-xl flex-row items-center shadow-sm shadow-blue-200"
                      >
                        <Text className="text-white text-[9px] font-black uppercase tracking-widest mr-1">Repay</Text>
                        <Ionicons name="wallet-outline" size={12} color="#FFF" />
                      </TouchableOpacity>
                    ) : (
                      <View className="bg-slate-50 px-3 py-2 rounded-xl flex-row items-center border border-slate-100">
                        <Text className="text-slate-600 text-[9px] font-black uppercase tracking-widest mr-1">View</Text>
                        <Ionicons name="arrow-forward" size={12} color="#64748B" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="bg-white p-8 rounded-3xl border border-slate-100 items-center">
                <Ionicons name="receipt-outline" size={40} color="#CBD5E1" />
                <Text className="text-slate-400 text-center mt-4 font-medium">No active loans found. Start a new application today!</Text>
              </View>
            )}
          </MotiView>

        </ScrollView>

        <LoanSelectionModal
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSelect={handleSelect}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF6FF", // Light blue tint background
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1A1A1A",
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  notchedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 24,
    position: "relative",
    overflow: "visible", 
  },
  notchContainer: {
    position: "absolute",
    top: -1,
    left: 0,
    right: 0,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 20,
  },
  notch: {
    width: 120,
    height: 22,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  notchShoulder: {
    width: 16,
    height: 16,
    marginTop: 0,
  },
  notchShoulderLeft: {
    borderTopRightRadius: 16,
    marginRight: -0.5, // Bleed over to prevent gap
  },
  notchShoulderRight: {
    borderTopLeftRadius: 16,
    marginLeft: -0.5, // Bleed over to prevent gap
  },
  mainStatCard: {
    height: 200,
    justifyContent: "space-between",
    marginHorizontal: 0,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  cardSubLabel: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  viewAllText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  serviceGridItem: {
    width: "22%",
    alignItems: "center",
  },
  serviceContainer: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  serviceLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },
  schemeSummaryCard: {
    width: 260,
    height: 200,
    borderRadius: 36,
    marginRight: 16,
    padding: 18,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  visaCard: {
    width: 240,
    height: 180,
    backgroundColor: "#1A1A1A",
    marginRight: 16,
    justifyContent: "space-between",
  },
  paypalCard: {
    width: 240,
    height: 180,
    backgroundColor: "#FFFFFF",
    marginRight: 16,
    justifyContent: "space-between",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  loanAppItem: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
});

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import LottieView from 'lottie-react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { getCustomerById } from "../services/api";

const { width } = Dimensions.get("window");

interface ProfileScreenProps {
  customerId: number;
  onBack: () => void;
}

export const ProfileScreen = ({ customerId, onBack }: ProfileScreenProps) => {
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => getCustomerById(customerId).then((res) => res.data),
    enabled: !!customerId,
  });

  const customer = response?.data;

  const [isAccountVisible, setIsAccountVisible] = React.useState(false);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <LottieView
          source={require('../../assets/loader.json')}
          autoPlay
          loop
          style={{ width: 100, height: 100 }}
          resizeMode="contain"
        />
        <Text className="mt-4 text-slate-500 font-medium">Fetching Profile...</Text>
      </View>
    );
  }

  if (isError || !customer) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-10">
        <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
        <Text className="text-xl font-bold text-slate-900 mt-4 text-center">Failed to load profile</Text>
        <TouchableOpacity
          onPress={onBack}
          className="mt-8 bg-blue-600 px-8 py-3 rounded-2xl"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const StatCard = ({ icon, label, value, color, iconColor }: any) => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 500 }}
      className="w-[48%] bg-white rounded-[32px] p-5 mb-4 relative shadow-sm shadow-slate-200 border border-slate-50"
    >
      <View style={{ backgroundColor: color }} className="w-10 h-10 rounded-xl items-center justify-center mb-4">
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View>
        <Text className="text-slate-900 text-sm font-black mb-1" numberOfLines={1}>{value || "N/A"}</Text>
        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{label}</Text>
      </View>
    </MotiView>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Top Blue Header - Fixed */}
      <View className="bg-blue-600 h-64 pt-12 px-6">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={onBack}
            className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl items-center justify-center border border-white/20"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-black text-lg">My Profile</Text>
          <TouchableOpacity
            className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl items-center justify-center border border-white/20"
          >
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Overlapping Info Section - Partially Fixed */}
      <View className="flex-1 -mt-20 bg-white rounded-t-[48px] px-6 pt-16">
        {/* Overlapping Avatar */}
        <View className="absolute -top-14 left-6">
          <View className="w-28 h-28 rounded-full border-[6px] border-white shadow-2xl shadow-black/20 overflow-hidden bg-slate-100 items-center justify-center">
            {customer.digiLockerData?.photo ? (
              <Image 
                source={{ uri: `data:image/png;base64,${customer.digiLockerData.photo}` }} 
                className="w-full h-full"
              />
            ) : (
              <Ionicons name="person" size={50} color="#CBD5E1" />
            )}
          </View>
        </View>

        {/* User Info & Verified Badge - Fixed */}
        <View className="flex-row justify-between items-start mb-6">
          <View className="flex-1 pr-4">
            <Text className="text-slate-900 text-2xl font-black tracking-tight mb-1">
              {customer.applicantName}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="call-outline" size={12} color="#94A3B8" />
              <Text className="text-slate-400 text-xs font-bold ml-1">{customer.mobileNumber}</Text>
            </View>
          </View>
          <View className="bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100 flex-row items-center">
            <Ionicons name="shield-checkmark" size={14} color="#F97316" />
            <Text className="text-orange-600 font-black text-[10px] ml-1 uppercase">Verified</Text>
          </View>
        </View>

        {/* Scrollable Content starts here */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
          {/* Identity Grid (Bento Style) - Now Scrollable */}
          <View className="flex-row flex-wrap justify-between mt-2 mb-6">
            <StatCard 
              icon="calendar" 
              label="Date of Birth" 
              value={customer.dateOfBirth} 
              color="#EFF6FF" 
              iconColor="#3B82F6" 
            />
            <StatCard 
              icon="briefcase" 
              label="Occupation" 
              value={customer.occupation} 
              color="#FFF7ED" 
              iconColor="#F97316" 
            />
            <StatCard 
              icon="heart" 
              label="Marital Status" 
              value={customer.maritalStatus} 
              color="#FFF1F2" 
              iconColor="#F43F5E" 
            />
            <StatCard 
              icon="person" 
              label="Gender" 
              value={customer.gender} 
              color="#F0FDFA" 
              iconColor="#0D9488" 
            />
          </View>

          {/* Address Card */}
          <View className="mb-8">
            <Text className="text-slate-900 text-lg font-black mb-4">Contact Address</Text>
            <View className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
              <View className="flex-row items-start">
                <View className="bg-white w-10 h-10 rounded-xl items-center justify-center shadow-sm mr-4">
                  <Ionicons name="location" size={20} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Current Address</Text>
                  <Text className="text-slate-900 font-bold text-sm leading-5">
                    {customer.address?.house}, {customer.address?.street}, {customer.address?.talukaName}, {customer.address?.districtName}, {customer.address?.stateName} - {customer.address?.pinCode}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bank Card (Premium Style) */}
          <Text className="text-slate-900 text-lg font-black mb-4">Primary Bank Account</Text>

          {customer.customerBanks?.slice(0, 1).map((bank: any) => (
            <LinearGradient
              key={bank.id}
              colors={["#1E3A8A", "#2563EB"]}
              className="p-6 rounded-[32px] mb-8 relative overflow-hidden"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
              <View className="flex-row justify-between items-start mb-10">
                <View>
                  <Text className="text-blue-100/60 text-[10px] font-black uppercase tracking-widest mb-1">{bank.bank}</Text>
                  <Text className="text-white font-black text-lg">{bank.accountHolderName}</Text>
                </View>
                <MaterialCommunityIcons name="bank" size={24} color="white" />
              </View>
              <View className="flex-row justify-between items-end">
                <View className="flex-1">
                  <Text className="text-blue-100/40 text-[8px] font-black uppercase tracking-widest mb-1">Account Number</Text>
                  <View className="flex-row items-center">
                    <Text className="text-white font-mono tracking-widest text-sm mr-3">
                      {isAccountVisible ? bank.accountNo : `**** **** ${bank.accountNo.slice(-4)}`}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setIsAccountVisible(!isAccountVisible)}
                      className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
                    >
                      <Ionicons name={isAccountVisible ? "eye-off-outline" : "eye-outline"} size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-blue-100/40 text-[8px] font-black uppercase tracking-widest mb-1">IFSC Code</Text>
                  <Text className="text-white font-black text-xs">{bank.ifsc}</Text>
                </View>
              </View>
            </LinearGradient>
          ))}

          <TouchableOpacity 
            className="bg-red-50 py-5 rounded-[32px] flex-row items-center justify-center border border-red-100"
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="text-red-500 font-black ml-3 uppercase tracking-widest text-xs">Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // No complex styles needed thanks to NativeWind
});
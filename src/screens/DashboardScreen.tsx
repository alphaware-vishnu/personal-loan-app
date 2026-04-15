import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { MotiView } from "moti";
import { LoanCard } from "../components/LoanCard";
import { LoanSelectionModal } from "../components/LoanSelectionModal";

const { width } = Dimensions.get("window");

interface DashboardScreenProps {
  onStartLoan: () => void;
  onSchemeSelect: (scheme: any) => void;
}

export const DashboardScreen = ({ onStartLoan, onSchemeSelect }: DashboardScreenProps) => {
  const [modalVisible, setModalVisible] = React.useState(false);

  const handleApplyNow = () => {
    setModalVisible(true);
    onStartLoan();
  };

  const handleSelect = (scheme: any) => {
    setModalVisible(false);
    onSchemeSelect(scheme);
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Header - High Density Pro */}
          <View className="mt-8 mb-8 flex-row justify-between items-center">
            <View>
              <Text className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                Active Profile
              </Text>
              <Text className="text-2xl font-bold text-gray-900 mt-1">
                Rahul Sharma
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
                  Continue Application
                </Text>
                <Text className="text-primary-200 text-xs mt-1 font-medium">
                  We checked your credit score and now you can go further.
                </Text>
                <TouchableOpacity
                  onPress={handleApplyNow}
                  activeOpacity={0.9}
                  className="bg-white h-10 px-5 rounded-lg mt-5 items-center justify-center self-start shadow-sm"
                >
                  <Text className="text-primary-950 font-bold text-xs uppercase tracking-tight">Finish Application</Text>
                </TouchableOpacity>
              </View>
              <View className="w-20 h-20 bg-primary-800/20 rounded-xl items-center justify-center">
                 <Text className="text-3xl">🚀</Text>
              </View>
            </View>
          </MotiView>

          {/* Activity Section Header */}
          <View className="mb-4 flex-row justify-between items-end">
            <Text className="text-lg font-bold text-gray-900">Your Repayments</Text>
            <TouchableOpacity>
              <Text className="text-primary-600 text-xs font-bold uppercase tracking-wider">See All</Text>
            </TouchableOpacity>
          </View>

          {/* Denser Loan Cards */}
          <LoanCard 
            amount="$6,000" 
            status="In Review" 
            date="Oct 12, 2026" 
            index={0} 
          />
          <LoanCard 
            amount="$2,400" 
            status="Approved" 
            date="Sep 28, 2026" 
            index={1} 
          />

          <View className="h-10" />
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

import React from "react";
import { View, Text, Pressable } from "react-native";
import { MotiView } from "moti";

interface LoanCardProps {
  amount: string;
  status: string;
  date: string;
  index: number;
}

export const LoanCard = ({ amount, status, index }: LoanCardProps) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 100, type: "timing", duration: 500 }}
      className="mb-4 w-full rounded-xl bg-white border border-gray-100 p-4"
    >
      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text className="text-gray-950 text-sm font-bold">Personal Loan Alpha</Text>
          <Text className="text-gray-400 text-[10px] font-medium mt-0.5">ID: BZ221-A21231</Text>
        </View>
        <View className="items-end">
           <Text className="text-gray-900 text-sm font-bold">{amount}</Text>
           <View className={`mt-1 px-2 py-0.5 rounded ${status === "Approved" ? "bg-green-50" : "bg-primary-50"}`}>
             <Text className={`text-[10px] font-bold ${status === "Approved" ? "text-green-700" : "text-primary-700"}`}>{status}</Text>
           </View>
        </View>
      </View>

      <View className="flex-row justify-between mb-4">
        <View>
          <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-tighter">Remaining</Text>
          <Text className="text-gray-900 text-xs font-bold mt-0.5">$3,450.00</Text>
        </View>
        <View>
          <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-tighter">Next Pay</Text>
          <Text className="text-gray-900 text-xs font-bold mt-0.5">Nov 20, 2026</Text>
        </View>
        <View className="items-end">
          <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-tighter">Progress</Text>
          <Text className="text-gray-900 text-xs font-bold mt-0.5">14/24 mos</Text>
        </View>
      </View>

      <View className="h-1 w-full bg-gray-50 rounded-full overflow-hidden">
        <View className="h-full bg-primary-600 w-[60%]" />
      </View>

      <View className="mt-4 flex-row space-x-2">
        <TouchableOpacity className="flex-1 h-8 bg-primary-950 rounded-lg items-center justify-center">
          <Text className="text-white text-[10px] font-bold">Repay Now</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 h-8 bg-gray-50 rounded-lg items-center justify-center border border-gray-100">
          <Text className="text-gray-600 text-[10px] font-bold">Details</Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );
};

// Simple internal TouchableOpacity since we don't have it imported globally here
const TouchableOpacity = ({ children, className, ...props }: any) => (
  <Pressable className={className} {...props}>
    {children}
  </Pressable>
);

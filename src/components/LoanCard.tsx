import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface LoanCardProps {
  amount: string;
  status: string;
  date: string;
  index: number;
  onPressDetails?: () => void;
}

const getStatusStyle = (status: string) => {
  const s = status.toUpperCase();
  if (s === "APPROVED" || s === "DISBURSED") return { bg: "#ECFDF5", text: "#059669", label: "Active" };
  if (s === "REJECTED") return { bg: "#FEF2F2", text: "#DC2626", label: "Rejected" };
  if (s === "IN REVIEW" || s === "PENDING") return { bg: "#FFF7ED", text: "#EA580C", label: "In Review" };
  return { bg: "#F1F5F9", text: "#475569", label: status };
};

export const LoanCard = ({ amount, status, date, index, onPressDetails }: LoanCardProps) => {
  const statusStyle = getStatusStyle(status);

  return (
    <TouchableOpacity
      onPress={onPressDetails}
      activeOpacity={0.7}
      style={styles.card}
    >
      {/* Top Row */}
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center">
          <View style={styles.iconCircle}>
            <Ionicons name="document-text-outline" size={18} color="#F97316" />
          </View>
          <View className="ml-3">
            <Text className="text-base font-bold text-slate-900">Loan Request</Text>
            <Text className="text-xs text-slate-400 font-medium mt-0.5">{date}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      {/* Amount Row */}
      <View className="flex-row items-end justify-between mb-4">
        <Text className="text-2xl font-black text-slate-900">{amount}</Text>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: "60%" }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  progressTrack: {
    height: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#F97316",
    borderRadius: 2,
  },
});

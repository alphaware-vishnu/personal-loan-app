import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
} from "react-native";
import { MotiView, AnimatePresence } from "./Motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Button } from "./Button";
import { QueryApiResponse, QueryError } from "@/types/query.type";

const { height } = Dimensions.get("window");

interface Charge {
  id: number;
  code: string;
  name: string;
  chargeType?: string;
  deductionType: string;
  calculationType: string;
  value: number;
  childCharges: Charge[];
}

interface Scheme {
  id: number;
  name: string;
  description: string;
  loanAmount: number;
  minTenure: number;
  maxTenure: number;
  defaultTenure: number;
  tenureFrequency: string;
  minInterest: number;
  maxInterest: number;
  defaultInterest: number;
  interestType: string;
  installmentPlan: string;
  productId: number;
  flatPenaltyAmount: number;
  charges: Charge[];
}

interface LoanSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (scheme: Scheme) => void;
}

export const LoanSelectionModal = ({ isVisible, onClose, onSelect }: LoanSelectionModalProps) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: response, isLoading } = useQuery<QueryApiResponse<{ data: Scheme[] }>, QueryError>({
    queryKey: ["loan-schemes"],
    queryFn: () => api({
      url: `/scheme/products/5`
    }),
    enabled: isVisible,
  })

  const schemes = response?.data?.data || [];
  console.log(schemes, 'schemes')

  const handleSchemePress = (id: number) => {
    setSelectedId(selectedId === id ? null : id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getProcessingFee = (scheme: Scheme) => {
    const fee = scheme.charges.find(c => c.chargeType === "PROCESSING_FEE" || c.code.includes("processing"));
    if (fee) {
      return `${fee.value}${fee.calculationType === "PERCENTAGE" ? "%" : " Fee"}`;
    }
    return "N/A";
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <MotiView
          from={{ translateY: height }}
          animate={{ translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
          style={styles.container}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-gray-950 tracking-tight">Select Loan Scheme</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-400 text-xl">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mb-6">
            {isLoading ? (
              <View className="py-10 items-center">
                <Text className="text-gray-400">Loading schemes...</Text>
              </View>
            ) : schemes.length === 0 ? (
              <View className="py-10 items-center">
                <Text className="text-gray-400">No schemes available.</Text>
              </View>
            ) : (
              schemes.map((scheme) => (
                <View key={scheme.id} className="mb-3">
                  <TouchableOpacity
                    onPress={() => handleSchemePress(scheme.id)}
                    activeOpacity={0.9}
                    className={`p-5 rounded-2xl border-2 transition-all ${selectedId === scheme.id ? "border-primary-600 bg-primary-50" : "border-gray-100 bg-gray-50"
                      }`}
                  >
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className={`text-[10px] font-bold uppercase tracking-widest ${selectedId === scheme.id ? "text-primary-700" : "text-gray-400"
                          }`}>
                          Loan Amount
                        </Text>
                        <Text className="text-2xl font-bold text-gray-950 mt-0.5">
                          {formatCurrency(scheme.loanAmount)}
                        </Text>
                      </View>
                      <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedId === scheme.id ? "border-primary-600 bg-primary-600" : "border-gray-200"
                        }`}>
                        {selectedId === scheme.id && <Text className="text-white text-[10px]">✓</Text>}
                      </View>
                    </View>

                    {/* Accordion Content */}
                    <AnimatePresence>
                      {selectedId === scheme.id && (
                        <MotiView
                          from={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 90 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ type: "timing", duration: 300 }}
                        >
                          <View className="mt-4 pt-4 border-t border-primary-100">
                            <View className="flex-row justify-between mb-3">
                              <View>
                                <Text className="text-gray-400 text-[9px] font-bold uppercase">Tenure</Text>
                                <Text className="text-gray-900 text-xs font-bold">
                                  {scheme.defaultTenure} {scheme.tenureFrequency.toLowerCase()}s
                                </Text>
                              </View>
                              <View>
                                <Text className="text-gray-400 text-[9px] font-bold uppercase">Interest</Text>
                                <Text className="text-gray-900 text-xs font-bold">{scheme.defaultInterest}% p.a.</Text>
                              </View>
                              <View>
                                <Text className="text-gray-400 text-[9px] font-bold uppercase">Fees</Text>
                                <Text className="text-gray-900 text-xs font-bold">{getProcessingFee(scheme)}</Text>
                              </View>
                            </View>
                            <Text className="text-[9px] text-primary-600 font-medium italic">
                              * Final terms subject to credit score.
                            </Text>
                          </View>
                        </MotiView>
                      )}
                    </AnimatePresence>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          <Button
            title="Confirm & Apply"
            variant="primary"
            size="lg"
            onPress={() => {
              const selectedScheme = schemes.find(s => s.id === selectedId);
              if (selectedScheme) onSelect(selectedScheme);
            }}
            disabled={!selectedId}
          />
        </MotiView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  container: {
    backgroundColor: "white",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: height * 0.85,
  },
});

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
import { MotiView, AnimatePresence } from "moti";

const { height } = Dimensions.get("window");

interface Scheme {
  id: string;
  amount: string;
  tenure: string;
  interest: string;
  charges: string;
}

const SCHEMES: Scheme[] = [
  { id: "1", amount: "$6,000", tenure: "12 Months", interest: "12% p.a.", charges: "$120 Fee" },
  { id: "2", amount: "$8,000", tenure: "18 Months", interest: "13.5% p.a.", charges: "$150 Fee" },
  { id: "3", amount: "$10,000", tenure: "24 Months", interest: "15% p.a.", charges: "$200 Fee" },
];

interface LoanSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (scheme: Scheme) => void;
}

export const LoanSelectionModal = ({ isVisible, onClose, onSelect }: LoanSelectionModalProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSchemePress = (id: string) => {
    setSelectedId(selectedId === id ? null : id);
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
            {SCHEMES.map((scheme) => (
              <View key={scheme.id} className="mb-3">
                <TouchableOpacity
                  onPress={() => handleSchemePress(scheme.id)}
                  activeOpacity={0.9}
                  className={`p-5 rounded-2xl border-2 transition-all ${
                    selectedId === scheme.id ? "border-primary-600 bg-primary-50" : "border-gray-100 bg-gray-50"
                  }`}
                >
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className={`text-[10px] font-bold uppercase tracking-widest ${
                        selectedId === scheme.id ? "text-primary-700" : "text-gray-400"
                      }`}>
                        Loan Amount
                      </Text>
                      <Text className="text-2xl font-bold text-gray-950 mt-0.5">{scheme.amount}</Text>
                    </View>
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      selectedId === scheme.id ? "border-primary-600 bg-primary-600" : "border-gray-200"
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
                              <Text className="text-gray-900 text-xs font-bold">{scheme.tenure}</Text>
                            </View>
                            <View>
                              <Text className="text-gray-400 text-[9px] font-bold uppercase">Interest</Text>
                              <Text className="text-gray-900 text-xs font-bold">{scheme.interest}</Text>
                            </View>
                            <View>
                              <Text className="text-gray-400 text-[9px] font-bold uppercase">Fees</Text>
                              <Text className="text-gray-900 text-xs font-bold">{scheme.charges}</Text>
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
            ))}
          </ScrollView>

          <TouchableOpacity
            disabled={!selectedId}
            onPress={() => selectedId && onSelect(SCHEMES.find(s => s.id === selectedId)!)}
            activeOpacity={0.9}
            className={`h-14 rounded-xl items-center justify-center shadow-sm ${
              selectedId ? "bg-primary-950" : "bg-gray-100"
            }`}
          >
            <Text className="text-white font-bold text-base">Confirm & Apply</Text>
          </TouchableOpacity>
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

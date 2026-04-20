import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Modal, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { MotiView } from "../components/Motion";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../components/Button";
import { SafeAreaView } from "react-native-safe-area-context";

interface AddressDetails {
  address: string;
  pincode: string;
  state: string;
  city: string;
}

interface AddressFormScreenProps {
  onNext: (data: AddressDetails) => void;
  onBack: () => void;
}

const { height } = Dimensions.get("window");

export const AddressFormScreen: React.FC<AddressFormScreenProps> = ({ onNext, onBack }) => {
  const [details, setDetails] = useState<AddressDetails>({
    address: "",
    pincode: "",
    state: "",
    city: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEligibilityModalVisible, setEligibilityModalVisible] = useState(false);

  // Mock auto-fill based on pincode for a better UX
  const handlePincodeChange = (pin: string) => {
    let newState = details.state;
    let newCity = details.city;

    if (pin.length === 6) {
      if (pin.startsWith("4")) {
        newState = "Maharashtra";
        newCity = "Mumbai";
      } else if (pin.startsWith("1")) {
        newState = "Delhi";
        newCity = "New Delhi";
      } else if (pin.startsWith("5")) {
        newState = "Karnataka";
        newCity = "Bengaluru";
      }
    }

    setDetails({ ...details, pincode: pin, state: newState, city: newCity });
  };

  const updateField = (field: keyof AddressDetails, value: string) => {
    setDetails((prev) => ({ ...prev, [field]: value }));
  };

  const isComplete =
    details.address.trim().length > 5 &&
    details.pincode.trim().length === 6 &&
    details.state.trim().length > 2 &&
    details.city.trim().length > 2;

  const handleSubmit = () => {
    setIsLoading(true);
    // Simulate API delay for eligibility check
    setTimeout(() => {
      setIsLoading(false);
      setEligibilityModalVisible(true);
    }, 1500);
  };

  const proceedToBank = () => {
    setEligibilityModalVisible(false);
    onNext(details);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6">
          {/* Header */}
          <View className="flex-row items-center py-4">
            <TouchableOpacity
              onPress={onBack}
              className="w-10 h-10 items-center justify-center rounded-full bg-slate-50"
            >
              <Ionicons name="arrow-back" size={20} color="#172554" />
            </TouchableOpacity>
            <Text className="flex-1 text-center text-xl font-bold text-slate-900 mr-10">
              Address Details
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 500 }}
              className="mt-6"
            >
              <Text className="text-slate-500 mb-8">
                Please confirm your permanent address to verify your identity and determine loan eligibility.
              </Text>

              {/* Full Address */}
              <View className="mb-6">
                <Text className="text-slate-900 font-bold mb-2 ml-1">Flat / House No. / Building</Text>
                <View className="bg-slate-50 rounded-xl border border-slate-100 p-4 min-h-[100px]">
                  <TextInput
                    multiline
                    placeholder="Enter complete address"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 text-slate-900 font-medium h-full text-base"
                    style={{ textAlignVertical: "top" }}
                    value={details.address}
                    onChangeText={(val) => updateField("address", val)}
                  />
                </View>
              </View>

              {/* Pincode */}
              <View className="mb-6">
                <Text className="text-slate-900 font-bold mb-2 ml-1">Pincode</Text>
                <View className="h-14 bg-slate-50 rounded-xl border border-slate-100 px-4 flex-row items-center">
                  <Ionicons name="location-outline" size={20} color="#64748b" />
                  <TextInput
                    keyboardType="number-pad"
                    placeholder="Enter 6-digit Pincode"
                    placeholderTextColor="#94a3b8"
                    maxLength={6}
                    className="flex-1 ml-3 text-slate-900 font-medium text-base"
                    value={details.pincode}
                    onChangeText={handlePincodeChange}
                  />
                </View>
              </View>

              {/* State */}
              <View className="mb-6">
                <Text className="text-slate-900 font-bold mb-2 ml-1">State</Text>
                <View className="h-14 bg-slate-50 rounded-xl border border-slate-100 px-4 flex-row items-center">
                  <Ionicons name="map-outline" size={20} color="#64748b" />
                  <TextInput
                    placeholder="e.g. Maharashtra"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 ml-3 text-slate-900 font-medium text-base"
                    value={details.state}
                    onChangeText={(val) => updateField("state", val)}
                  />
                </View>
              </View>

              {/* City */}
              <View className="mb-10">
                <Text className="text-slate-900 font-bold mb-2 ml-1">City</Text>
                <View className="h-14 bg-slate-50 rounded-xl border border-slate-100 px-4 flex-row items-center">
                  <Ionicons name="business-outline" size={20} color="#64748b" />
                  <TextInput
                    placeholder="e.g. Mumbai"
                    placeholderTextColor="#94a3b8"
                    className="flex-1 ml-3 text-slate-900 font-medium text-base"
                    value={details.city}
                    onChangeText={(val) => updateField("city", val)}
                  />
                </View>
              </View>

            </MotiView>
          </ScrollView>

          {/* Footer Action */}
          <View className="py-6 bg-white">
            <Button
              title="Next Step"
              variant="primary"
              size="lg"
              onPress={handleSubmit}
              disabled={!isComplete}
              loading={isLoading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Eligibility Success Modal */}
      <Modal visible={isEligibilityModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.backdrop} />

          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="w-[85%] bg-white rounded-3xl p-8 items-center shadow-2xl"
          >
            <View className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-6 border-4 border-green-100">
              <Ionicons name="star" size={36} color="#10b981" />
            </View>

            <Text className="text-2xl font-black text-slate-900 text-center mb-2 tracking-tight">
              Congratulations!
            </Text>
            <Text className="text-slate-500 text-center text-sm leading-5 mb-8">
              You are eligible for the selected loan scheme. Proceed to add your bank account for disbursement.
            </Text>

            <Button
              title="Continue"
              variant="success"
              className="w-full"
              onPress={proceedToBank}
            />
          </MotiView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
});

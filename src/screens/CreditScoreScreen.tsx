import React, { useState, useEffect } from "react";
import { View, Text, Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import { MotiView, MotiText } from "../components/Motion";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../components/Button";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { useLoanStore } from "../store/loanStore";
import { ScrollView } from "react-native-gesture-handler";
import { updateStepStatus } from "../services/api";
import { useMutation } from "@tanstack/react-query";
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get("window");
const GAUGE_SIZE = 300;
const TICK_COUNT = 120;

interface CreditScoreScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export const CreditScoreScreen: React.FC<CreditScoreScreenProps> = ({ onNext, onBack }) => {
  const [isEvaluating, setIsEvaluating] = useState(true);
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const { customerInfo, applicationId } = useLoanStore();

  const firstName = customerInfo.applicantName.split(" ")[0] || "Guest";

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsEvaluating(false);
      const randomScore = Math.floor(Math.random() * (820 - 720 + 1)) + 720; // Aiming for ~82% as in image
      setScore(randomScore);
      // Map score 300-850 to 0-100%
      const pct = Math.round(((randomScore - 300) / (850 - 300)) * 100);
      setPercentage(pct);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const renderTicks = () => {
    const ticks = [];
    for (let i = 0; i <= TICK_COUNT; i++) {
      const angle = (i / TICK_COUNT) * 180 - 90;
      const isActive = (i / TICK_COUNT) * 100 <= percentage;
      
      // Exact color mapping from image: Orange -> Yellow -> Pale Grey
      // We'll interpolate based on the total arc position
      const progress = i / TICK_COUNT;
      let tickColor = '#f3f4f6'; // Default inactive

      if (isActive) {
        if (progress < 0.3) {
          tickColor = '#ea580c'; // Deep orange
        } else if (progress < 0.6) {
          tickColor = '#f97316'; // Orange
        } else if (progress < 0.8) {
          tickColor = '#fbbf24'; // Amber
        } else {
          tickColor = '#fde68a'; // Light yellow
        }
      }

      ticks.push(
        <View
          key={i}
          style={{
            position: 'absolute',
            width: 1,
            height: 25,
            backgroundColor: tickColor,
            transform: [
              { rotate: `${angle}deg` },
              { translateY: -110 }
            ],
            opacity: isActive ? 1 : 0.3
          }}
        />
      );
    }
    return ticks;
  };

  const renderMarkers = () => {
    const markers = [
      { label: "300", angle: -95, textAlign: 'right', translateX: -25, translateY: 10 },
      { label: "450", angle: -45, translateX: -15, translateY: -5 },
      { label: "500", angle: 0, translateY: -20 },
      { label: "700", angle: 45, translateX: 15, translateY: -5 },
      { label: "850", angle: 95, textAlign: 'left', translateX: 25, translateY: 10 },
    ];

    return markers.map((m, idx) => (
      <View
        key={idx}
        style={{
          position: 'absolute',
          transform: [
            { rotate: `${m.angle}deg` },
            { translateY: -130 },
            { translateX: m.translateX || 0 },
            { translateY: m.translateY || 0 }
          ],
        }}
      >
        <Text 
          style={{ 
            transform: [{ rotate: `${-m.angle}deg` }],
            color: '#64748b',
            fontSize: 11,
            fontWeight: '500'
          }}
        >
          {m.label}
        </Text>
      </View>
    ));
  };

  const statusMutation = useMutation({
    mutationFn: (data: { id: number; status: any }) => updateStepStatus(data.id, data.status),
    onSuccess: () => {
      onNext();
    },
    onError: (error: any) => {
      console.error('[CreditScore] Failed to update step status on continue:', error);
      const errorMsg = error.response?.data?.message || "Failed to update application status";
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: errorMsg,
        position: 'top'
      });
      onNext(); // Proceed anyway
    }
  });

  const handleContinue = () => {
    if (applicationId) {
      statusMutation.mutate({ 
        id: applicationId, 
        status: { rulesEngineCompleted: true } 
      });
    } else {
      onNext();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1 px-6 pt-10">
        {isEvaluating ? (
          <View className="flex-1 items-center justify-center">
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="items-center"
            >
              <View className="w-64 h-64 mb-8">
                <LottieView
                  autoPlay
                  loop
                  style={{ width: "100%", height: "100%" }}
                  source={require("../../assets/loader.json")}
                />
              </View>
              <MotiText
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                className="text-2xl font-bold text-slate-900 text-center"
              >
                Evaluating Credit Report...
              </MotiText>
              <Text className="text-slate-500 text-center mt-3 px-10 text-base">
                Our system is evaluating your credit history to secure the best loan terms for you.
              </Text>
            </MotiView>
          </View>
        ) : (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 items-center"
          >
            {/* Header */}
            <View className="w-full flex-row items-center justify-between mb-8">
              <TouchableOpacity
                onPress={onBack}
                className="w-10 h-10 items-center justify-center rounded-full bg-slate-50"
              >
                <Ionicons name="arrow-back" size={20} color="#172554" />
              </TouchableOpacity>
              <View className="items-center">
                <Text className="text-xl font-bold text-slate-900">Credit Analysis</Text>
                <Text className="text-xs text-slate-500 font-medium uppercase tracking-widest">Real-time Report</Text>
              </View>
              <View className="w-10" />
            </View>

            <View className="items-center mb-10">
              <Text className="text-3xl font-black text-slate-900 tracking-tighter">
                Credit Analysis
              </Text>
              <Text className="text-base text-slate-500 mt-1 font-medium">
                Real-time Credit Bureau Report
              </Text>
            </View>

            {/* Gauge Container */}
            <View className="w-full aspect-[16/10] items-center justify-center relative mt-4">
              {/* Ticks and Markers Layer */}
              <View 
                style={{ width: GAUGE_SIZE, height: GAUGE_SIZE, alignItems: 'center', justifyContent: 'center' }}
              >
                {renderTicks()}
                {renderMarkers()}
              </View>

              {/* Pill Indicator */}
              <MotiView
                from={{ rotate: "-90deg" }}
                animate={{ rotate: `${(percentage * 1.8) - 90}deg` }}
                transition={{ type: "timing", duration: 1500, delay: 300 }}
                style={{
                  position: 'absolute',
                  width: GAUGE_SIZE,
                  height: GAUGE_SIZE,
                  zIndex: 20,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <View 
                  style={{
                    width: 12,
                    height: 40,
                    backgroundColor: '#f97316',
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: 'white',
                    transform: [{ translateY: -110 }],
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                  }}
                />
              </MotiView>

            {/* Center Content */}
              <View className="absolute top-[32%] items-center">
                <MotiText
                  from={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", delay: 800 }}
                  className="text-8xl font-black text-slate-900"
                >
                  {score}
                </MotiText>
                <Text className="text-slate-500 text-sm font-medium mt-[-5px]">
                  Your Credit Score
                </Text>
              </View>
            </View>

            {/* Credit Summary Cards */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              className="w-full mt-8 max-h-32"
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              <View className="bg-orange-50 rounded-3xl p-5 mr-4 border border-orange-100 flex-row items-center w-72">
                <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mr-4 shadow-sm">
                  <Ionicons name="notifications" size={24} color="#f97316" />
                </View>
                <View className="flex-1">
                  <Text className="text-orange-900 font-bold text-sm">Utilization Alert</Text>
                  <Text className="text-orange-700 text-xs mt-0.5" numberOfLines={2}>
                    High credit card usage (85%) is impacting your score.
                  </Text>
                </View>
              </View>

              <View className="bg-blue-50 rounded-3xl p-5 mr-4 border border-blue-100 flex-row items-center w-72">
                <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mr-4 shadow-sm">
                  <Ionicons name="time" size={24} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-blue-900 font-bold text-sm">Payment History</Text>
                  <Text className="text-blue-700 text-xs mt-0.5" numberOfLines={2}>
                    Perfect 100% on-time payment record! Great job.
                  </Text>
                </View>
              </View>

              <View className="bg-green-50 rounded-3xl p-5 border border-green-100 flex-row items-center w-72">
                <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mr-4 shadow-sm">
                  <Ionicons name="shield-checkmark" size={24} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-green-900 font-bold text-sm">Credit Age</Text>
                  <Text className="text-green-700 text-xs mt-0.5" numberOfLines={2}>
                    Average account age is 4.2 years (Healthy).
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View className="w-full mt-auto pb-10">
              <Button 
                title="Continue Application" 
                variant="primary" 
                size="lg" 
                onPress={handleContinue}
                loading={statusMutation.isPending}
                icon={!statusMutation.isPending ? <Ionicons name="arrow-forward" size={20} color="white" /> : undefined}
              />
              <Text className="text-center text-slate-400 text-[10px] mt-4 font-medium uppercase tracking-widest">
                Data provided by CIBIL & Equifax
              </Text>
            </View>
          </MotiView>
        )}
      </View>
    </SafeAreaView>
  );
};

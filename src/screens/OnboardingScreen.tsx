import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Dimensions, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import { OnboardingSlide } from "../components/OnboardingSlide";
import { OnboardingProgress } from "../components/OnboardingProgress";

const { width, height } = Dimensions.get("window");

const DATA = [
  {
    title: "Instant Access to $6,000 Schemes",
    description: "Start saving safely and accurately with our entry-level enterprise package.",
    image: require("../../assets/saving_blue_sketch.png"),
    bgColor: "#E0F2FE", // Precise match for Saving sketch
  },
  {
    title: "Double Security with $8,000 Loans",
    description: "Your money is under guaranteed state surveillance for maximum peace of mind.",
    image: require("../../assets/security_blue_sketch.png"),
    bgColor: "#DBEAFE", // Precise match for Security sketch
  },
  {
    title: "Standard Rewards on $10,000 Schemes",
    description: "Earn and spend points like cash with our most popular high-limit scheme.",
    image: require("../../assets/points_blue_sketch.png"),
    bgColor: "#F0F9FF", // Precise match for Points sketch
  },
];

interface OnboardingScreenProps {
  onStart: () => void;
}

export const OnboardingScreen = ({ onStart }: OnboardingScreenProps) => {
  const [index, setIndex] = useState(0);
  const carouselRef = useRef<ICarouselInstance>(null);

  const handleNext = () => {
    if (index < DATA.length - 1) {
      carouselRef.current?.scrollTo({ index: index + 1, animated: true });
    } else {
      onStart();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Story Style Progress */}
        <OnboardingProgress total={DATA.length} current={index} />

        <Carousel
          ref={carouselRef}
          loop={false}
          width={width}
          height={height * 0.7}
          data={DATA}
          onSnapToItem={(i) => setIndex(i)}
          renderItem={({ item }) => (
            <View style={{ width, height: height * 0.65 }} className="items-center justify-center px-10">
              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "timing", duration: 500 }}
                className="w-full h-[240px] items-center justify-center mb-10"
              >
                <Image 
                  source={item.image} 
                  style={{ width: width * 0.7, height: 220 }}
                  resizeMode="contain"
                />
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                className="w-full"
              >
                <Text className="text-2xl font-bold text-gray-950 tracking-tight leading-tight">
                  {item.title}
                </Text>
                <Text className="text-gray-500 text-sm mt-3 leading-6 font-medium">
                  {item.description}
                </Text>
              </MotiView>
            </View>
          )}
        />

        {/* Bottom Navigation */}
        <View className="flex-1 justify-end px-10 pb-12">
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.9}
            className="bg-primary-950 w-full h-14 rounded-xl items-center justify-center shadow-sm"
          >
            <Text className="text-white font-bold text-base">
              {index === DATA.length - 1 ? "Get Started" : "Continue"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={onStart}
            className="items-center mt-5"
          >
            <Text className="text-gray-400 font-bold text-sm">Skip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

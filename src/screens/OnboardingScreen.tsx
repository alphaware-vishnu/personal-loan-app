import React, { useState, useRef } from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import { Button } from "../components/Button";
import { OnboardingSlide } from "../components/OnboardingSlide";

const { width, height } = Dimensions.get("window");
const THEME_COLOR = "#EA580C"; // A deeper orange to perfectly match the reference button

const DATA = [
  {
    title: "Find perfect loan in your area",
    highlightWord: "loan",
    description: "We will help you with finding best loan scheme in your area. You can set your preferences and more!",
    icon: "map-pin" as const,
  },
  {
    title: "Quick and secure processing",
    highlightWord: "secure",
    description: "Your data is encrypted and approvals are lightning fast for ultimate peace of mind.",
    icon: "shield" as const,
  },
  {
    title: "Start saving with high rewards",
    highlightWord: "saving",
    description: "Earn and spend points like cash with our most popular high-limit schemes.",
    icon: "gift" as const,
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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.flex}>
        <Carousel
          ref={carouselRef}
          loop={false}
          width={width}
          height={height * 0.70}
          data={DATA}
          onSnapToItem={(i) => setIndex(i)}
          renderItem={({ item }) => (
            <OnboardingSlide
              title={item.title}
              highlightWord={item.highlightWord}
              description={item.description}
              icon={item.icon}
              primaryColor={THEME_COLOR}
              bgColor="#FFFFFF"
              textColor="#111827"
              descColor="#6B7280"
            />
          )}
        />

        <View style={styles.footer}>
          <Button
            title={index === DATA.length - 1 ? "Set your preferences" : "Continue to next"}
            onPress={handleNext}
            className="rounded-full bg-[#EA580C] border-0 mb-4 h-[56px]"
            textClassName="text-white text-[17px] font-bold"
          />
          <Button
            title="Skip for now"
            variant="ghost"
            onPress={onStart}
            className="h-[44px]"
            textClassName="text-[#6B7280] font-medium text-[15px]"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    justifyContent: "flex-end",
    flex: 1,
  },
});

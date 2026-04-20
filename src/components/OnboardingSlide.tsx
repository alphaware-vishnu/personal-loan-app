import React from "react";
import { View, Text, Image, Dimensions } from "react-native";
import { MotiView } from "./Motion";

const { width, height } = Dimensions.get("window");

interface OnboardingSlideProps {
  title: string;
  description: string;
  image: any;
  bgColor: string;
}

export const OnboardingSlide = ({ title, description, image, bgColor }: OnboardingSlideProps) => {
  return (
    <View 
      style={{ width, height: height * 0.75, backgroundColor: bgColor }} 
      className="items-center justify-center pt-8 px-6"
    >
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 1000 }}
        className="w-full h-[320px] items-center justify-center mt-10"
      >
        <Image 
          source={image} 
          style={{ width: width * 0.9, height: 300 }}
          resizeMode="contain"
        />
      </MotiView>

      <View className="flex-1 justify-end pb-12 w-full">
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 300, type: "timing", duration: 600 }}
        >
          <Text className="text-4xl font-extrabold text-gray-900 leading-[44px]">
            {title}
          </Text>
          <Text className="text-gray-600 text-lg mt-4 leading-7">
            {description}
          </Text>
        </MotiView>
      </View>
    </View>
  );
};

import React from "react";
import { View } from "react-native";
import { MotiView } from "./Motion";

interface OnboardingProgressProps {
  total: number;
  current: number;
}

export const OnboardingProgress = ({ total, current }: OnboardingProgressProps) => {
  return (
    <View className="flex-row gap-1 px-6 pt-4 w-full">
      {Array.from({ length: total }).map((_, index) => (
        <View 
          key={index} 
          className="flex-1 h-1 bg-black/10 rounded-full overflow-hidden"
        >
          {index <= current && (
            <MotiView
              from={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ type: "timing", duration: 500 }}
              className="h-full bg-black/60"
            />
          )}
        </View>
      ))}
    </View>
  );
};

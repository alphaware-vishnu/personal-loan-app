import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { MotiView, MotiText } from "../components/Motion";
import LottieView from "lottie-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface VerificationScreenProps {
  onComplete: () => void;
  title?: string;
  message?: string;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({
  onComplete,
  title = "Verifying Identity",
  message = "Our automated system is verifying your documents. This usually takes a few seconds."
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1 items-center justify-center px-6">
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 1000 }}
          className="items-center"
        >
          <View className="h-64 w-64 items-center justify-center">
            <LottieView
              autoPlay
              loop
              style={{ width: 250, height: 250 }}
              source={{ uri: "https://assets10.lottiefiles.com/packages/lf20_at6m0puj.json" }} // Professional pulse/check animation
            />
          </View>

          <MotiText
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300 }}
            className="text-2xl font-bold text-navy-900 text-center mt-4"
          >
            {title}
          </MotiText>

          <MotiText
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 600 }}
            className="text-slate-500 text-center mt-2 px-10"
          >
            {message}
          </MotiText>
        </MotiView>

        <View className="absolute bottom-20 items-center w-full">
          <ActivityIndicator color="#172554" size="small" />
          <Text className="text-slate-400 text-xs font-medium mt-4 uppercase tracking-widest">
            Fetching data from secure servers...
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

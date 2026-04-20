import React, { useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { MotiView } from "./Motion";

const { width } = Dimensions.get("window");

const SCHEMES = [
  { id: "1", amount: "₹6,000", tenor: "12 Months", rate: "8.5%" },
  { id: "2", amount: "₹8,000", tenor: "18 Months", rate: "7.9%" },
  { id: "3", amount: "₹10,000", tenor: "24 Months", rate: "7.2%" },
];

interface SchemeCarouselProps {
  onIndexChange: (index: number) => void;
}

export const SchemeCarousel = ({ onIndexChange }: SchemeCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / (width - 48)); // 48 is total horizontal padding
    if (index !== activeIndex) {
      setActiveIndex(index);
      onIndexChange(index);
    }
  };

  return (
    <View className="items-center">
      <FlatList
        data={SCHEMES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={width - 48}
        contentContainerStyle={{ paddingHorizontal: 24 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ width: width - 48 }} className="pr-4">
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "timing", duration: 500 }}
              className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm items-center justify-center min-h-[220px]"
            >
              <Text className="text-secondary-600 font-bold text-sm uppercase tracking-widest mb-2">
                Available Scheme
              </Text>
              <Text className="text-5xl font-bold text-gray-900 mb-6">
                {item.amount}
              </Text>
              
              <View className="flex-row items-center justify-center gap-6 border-t border-gray-50 pt-6 w-full">
                <View className="items-center">
                  <Text className="text-gray-400 text-xs uppercase font-semibold">Tenor</Text>
                  <Text className="text-gray-800 font-bold mt-1">{item.tenor}</Text>
                </View>
                <View className="w-[1px] h-8 bg-gray-100" />
                <View className="items-center">
                  <Text className="text-gray-400 text-xs uppercase font-semibold">Interest</Text>
                  <Text className="text-secondary-600 font-bold mt-1">{item.rate}</Text>
                </View>
              </View>
            </MotiView>
          </View>
        )}
      />

      {/* Pagination Dots */}
      <View className="flex-row gap-2 mt-8">
        {SCHEMES.map((_, i) => (
          <View
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              activeIndex === i ? "w-8 bg-primary-600" : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </View>
    </View>
  );
};

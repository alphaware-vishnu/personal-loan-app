import React, { useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const SCHEMES = [
  { id: "1", amount: "₹6,000", tenor: "12 Months", rate: "8.5%", color: "#F97316" },
  { id: "2", amount: "₹8,000", tenor: "18 Months", rate: "7.9%", color: "#3B82F6" },
  { id: "3", amount: "₹10,000", tenor: "24 Months", rate: "7.2%", color: "#10B981" },
];

interface SchemeCarouselProps {
  onIndexChange: (index: number) => void;
}

export const SchemeCarousel = ({ onIndexChange }: SchemeCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / (width - 48));
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
            <View style={[styles.card, { borderTopColor: item.color }]}>
              {/* Header Badge */}
              <View style={[styles.badge, { backgroundColor: item.color + "15" }]}>
                <Text style={[styles.badgeText, { color: item.color }]}>
                  Available Scheme
                </Text>
              </View>

              {/* Amount */}
              <Text className="text-4xl font-black text-slate-900 mt-4 mb-6">
                {item.amount}
              </Text>

              {/* Details Row */}
              <View className="flex-row items-center justify-center w-full">
                <View className="flex-1 items-center py-3 bg-slate-50 rounded-xl mr-2">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="time-outline" size={14} color="#94a3b8" />
                    <Text className="text-slate-400 text-xs ml-1 font-semibold">Tenor</Text>
                  </View>
                  <Text className="text-slate-900 font-bold text-sm">{item.tenor}</Text>
                </View>
                <View className="flex-1 items-center py-3 bg-slate-50 rounded-xl ml-2">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="trending-down-outline" size={14} color="#94a3b8" />
                    <Text className="text-slate-400 text-xs ml-1 font-semibold">Interest</Text>
                  </View>
                  <Text style={{ color: item.color }} className="font-bold text-sm">{item.rate}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      />

      {/* Pagination Dots */}
      <View className="flex-row gap-2 mt-8">
        {SCHEMES.map((scheme, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              activeIndex === i && [styles.dotActive, { backgroundColor: scheme.color }],
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderTopWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e2e8f0",
  },
  dotActive: {
    width: 28,
    borderRadius: 6,
  },
});

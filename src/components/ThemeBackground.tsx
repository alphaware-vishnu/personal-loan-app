import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ThemeBackgroundProps extends ViewProps {
  children: React.ReactNode;
}

export const ThemeBackground = ({ children, style, ...props }: ThemeBackgroundProps) => {
  return (
    <View style={[styles.container, style]} {...props}>
      <LinearGradient
        // Diagonal gradient from top-left to bottom-right
        colors={["#FF5E62", "#FF9966", "#FFFFFF"]}
        locations={[0, 0.4, 0.8]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

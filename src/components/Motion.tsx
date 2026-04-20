import React from "react";
import { Text, TextProps, View, ViewProps } from "react-native";

type MotionProps = {
  from?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
};

type MotionViewProps = ViewProps & MotionProps;
type MotionTextProps = TextProps & MotionProps;

export const MotiView = ({
  from,
  animate,
  exit,
  transition,
  ...props
}: MotionViewProps) => <View {...props} />;

export const MotiText = ({
  from,
  animate,
  exit,
  transition,
  ...props
}: MotionTextProps) => <Text {...props} />;

export const AnimatePresence = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

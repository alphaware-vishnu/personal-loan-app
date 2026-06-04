import React from "react";
import { TouchableOpacity, Text, TouchableOpacityProps, View } from "react-native";
import LottieView from "lottie-react-native";

export type ButtonVariant = "default" | "primary" | "secondary" | "success" | "destructive" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = ({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  textClassName = "",
  icon,
  iconPosition = "left",
  contentClassName = "",
  ...props
}: ButtonProps & { contentClassName?: string }) => {

  const baseStyles = "flex-row items-center justify-center rounded-2xl transition-all";

  const variantStyles = {
    default: "bg-slate-900 border border-slate-900",
    primary: "bg-primary-950 border border-primary-950 shadow-lg shadow-primary-200/50",
    secondary: "bg-slate-100 border border-slate-200",
    success: "bg-emerald-500 border border-emerald-500 shadow-md shadow-emerald-200",
    destructive: "bg-rose-500 border border-rose-500 shadow-md shadow-rose-200",
    outline: "bg-transparent border-2 border-primary-950",
    ghost: "bg-transparent",
  };

  const textVariantStyles = {
    default: "text-white",
    primary: "text-white",
    secondary: "text-slate-800",
    success: "text-white",
    destructive: "text-white",
    outline: "text-primary-950",
    ghost: "text-gray-500",
  };

  const sizeStyles = {
    sm: "h-10 px-4",
    md: "h-14 px-6",
    lg: "h-16 px-8",
  };

  const textSizeStyles = {
    sm: "text-sm font-bold",
    md: "text-base font-bold",
    lg: "text-lg font-bold",
  };

  const isDisabled = disabled || loading;

  // Specific disabled styles overriding background when explicitly disabled
  const disabledStyles = isDisabled && variant !== 'ghost' && variant !== 'outline'
    ? "bg-slate-300 border-slate-300 opacity-80"
    : isDisabled
      ? "opacity-50"
      : "";

  const containerClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`;
  const textFinalClassName = `${textVariantStyles[variant]} ${textSizeStyles[size]} ${textClassName}`;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      className={containerClassName}
      {...props}
    >
      {loading ? (
        <LottieView
          source={require("../../assets/new-loader.json")}
          autoPlay
          loop
          style={{ width: 36, height: 36 }}
        />
      ) : (
        <View className={`flex-row items-center justify-center w-full ${contentClassName}`}>
          {icon && iconPosition === "left" && <View className="mr-2">{icon}</View>}
          {title && <Text className={textFinalClassName}>{title}</Text>}
          {props.children && !title && <View className="w-full">{props.children}</View>}
          {icon && iconPosition === "right" && <View className="ml-2">{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

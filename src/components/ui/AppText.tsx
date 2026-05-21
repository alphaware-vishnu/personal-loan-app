import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useColors } from '../../theme';
import { textStyles } from '../../theme/typography';

export type AppTextVariant = keyof typeof textStyles;

export interface AppTextProps extends TextProps {
  variant?: AppTextVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'bodyMd',
  color,
  align,
  style,
  children,
  ...props
}) => {
  const colors = useColors();
  
  const textStyle = textStyles[variant];
  const variantStr = String(variant);
  const defaultColor = variantStr.startsWith('display') || variantStr.startsWith('h') || variantStr.startsWith('label') || variant === 'buttonLg' || variant === 'buttonMd' || variant === 'buttonSm' || variant === 'input'
    ? colors.text
    : colors.textSecondary;

  return (
    <Text
      style={[
        {
          color: color || defaultColor,
          textAlign: align,
        },
        textStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

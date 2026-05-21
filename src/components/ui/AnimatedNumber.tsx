import React, { useEffect, useState, useRef } from 'react';
import { useColors } from '../../theme';
import { AppText, AppTextProps } from './AppText';

export interface AnimatedNumberProps extends Omit<AppTextProps, 'children'> {
  value: number;
  duration?: number; // duration in milliseconds
  formatter?: (val: number) => string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  formatter = (val) => val.toLocaleString('en-IN'), // Default to Indian Numbering System
  style,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const valueRef = useRef(value);
  const startValueRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startValueRef.current = displayValue;
    valueRef.current = value;
    startTimeRef.current = null;

    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutQuad)
      const easeOutQuad = (t: number) => t * (2 - t);
      const easedProgress = easeOutQuad(progress);

      const currentValue = Math.floor(
        startValueRef.current +
          (valueRef.current - startValueRef.current) * easedProgress
      );

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(valueRef.current);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  return (
    <AppText style={style} {...props}>
      {formatter(displayValue)}
    </AppText>
  );
};

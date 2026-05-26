import React from 'react';
import { StyleSheet, ImageBackground, ViewStyle } from 'react-native';

interface MeshBackgroundProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const MeshBackground: React.FC<MeshBackgroundProps> = ({ children, style }) => {
  return (
    <ImageBackground
      source={require('../../assets/mesh-four.png')}
      resizeMode="cover"
      style={[styles.container, style]}
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

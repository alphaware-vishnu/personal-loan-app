import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from './Motion';

const { width, height } = Dimensions.get('window');

interface DocumentViewerProps {
  isVisible: boolean;
  onClose: () => void;
  uri: string | null;
  title: string;
}

export const DocumentViewer = ({ isVisible, onClose, uri, title }: DocumentViewerProps) => {
  if (!uri) return null;

  const isPdf = uri.toLowerCase().endsWith('.pdf');

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.backdrop} />

        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl w-[90%] h-[70%] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-slate-100">
            <View className="flex-1">
              <Text className="text-slate-900 font-bold text-lg" numberOfLines={1}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-slate-50 rounded-full">
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="flex-1 bg-slate-50 items-center justify-center p-4">
            {isPdf ? (
              <View className="items-center">
                <Ionicons name="document-text" size={80} color="#64748b" />
                <Text className="text-slate-500 mt-4 font-medium text-center">
                  PDF Preview is not available in the demo.
                </Text>
                <Text className="text-slate-400 text-xs mt-2 text-center">
                  FilePath: {uri}
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri }}
                className="w-full h-full"
                resizeMode="contain"
              />
            )}
          </View>

          {/* Footer */}
          <View className="p-6 bg-white border-t border-slate-100">
            <TouchableOpacity
              onPress={onClose}
              className="bg-primary-950 py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-bold">Done</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
});

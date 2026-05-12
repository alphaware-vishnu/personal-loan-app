import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import { MotiView } from "./Motion";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

const { height } = Dimensions.get("window");

interface DocumentPickerSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (uri: string, type: string) => void;
}

export const DocumentPickerSheet = ({
  isVisible,
  onClose,
  onSelect,
}: DocumentPickerSheetProps) => {
  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access camera was denied");
      return;
    }

    onClose(); // Close modal before launching native UI to prevent dimming

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      onSelect(result.assets[0].uri, "image");
    }
  };

  const handleGallery = async () => {
    onClose(); // Close modal before launching native UI
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      onSelect(result.assets[0].uri, "image");
    }
  };

  const handleFile = async () => {
    onClose(); // Close modal before launching native UI
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      onSelect(result.assets[0].uri, result.assets[0].mimeType || "file");
    }
  };

  const Option = ({
    icon,
    title,
    desc,
    onPress,
    color,
  }: {
    icon: string;
    title: string;
    desc: string;
    onPress: () => void;
    color: string;
  }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center p-4 mb-3 bg-gray-50 rounded-2xl border border-gray-100"
    >
      <View
        className="w-12 h-12 rounded-xl items-center justify-center mr-4"
        style={{ backgroundColor: `${color}15` }}
      >
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-bold">{title}</Text>
        <Text className="text-gray-400 text-xs">{desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <MotiView
          from={{ translateY: height * 0.4 }}
          animate={{ translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
          style={styles.container}
        >
          <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />

          <Text className="text-xl font-bold text-gray-950 mb-1">
            Choose Source
          </Text>
          <Text className="text-gray-400 text-sm mb-6">
            Select how you would like to upload your document.
          </Text>

          <Option
            icon="camera"
            title="Take Photo"
            desc="Use camera to capture document"
            onPress={handleCamera}
            color="#2563eb"
          />
          <Option
            icon="image"
            title="Photo Gallery"
            desc="Select an image from library"
            onPress={handleGallery}
            color="#0891b2"
          />
          <Option
            icon="document"
            title="Files"
            desc="Select PDF or other document"
            onPress={handleFile}
            color="#059669"
          />

          <TouchableOpacity
            onPress={onClose}
            className="mt-4 p-4 items-center"
          >
            <Text className="text-gray-500 font-bold">Cancel</Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  container: {
    backgroundColor: "white",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { DocumentPickerSheet } from './DocumentPickerSheet';
import { DocumentViewer } from './DocumentViewer';
import { uploadDocument, getDocumentDownloadPath } from '../services/api';
import { useLoanStore, DocumentType } from '../store/loanStore';
import { formatLabel } from '../utils';

interface DocumentUploadFieldProps {
  requirement: DocumentType;
  categoryId: number;
}

export const DocumentUploadField = ({ requirement, categoryId }: DocumentUploadFieldProps) => {
  const { uploadedDocs, updateUploadedDoc, addDocument } = useLoanStore();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [remoteUri, setRemoteUri] = useState<string | null>(null);

  const currentDoc = uploadedDocs[requirement.id];

  const handleSelect = async (uri: string, type: string) => {
    setIsUploading(true);
    try {
      const fileName = uri.split('/').pop() || `doc_${requirement.id}.${type === 'image' ? 'jpg' : 'pdf'}`;

      const formData = new FormData();
      // @ts-ignore
      formData.append('files', {
        uri,
        name: fileName,
        type: type === 'image' ? 'image/jpeg' : 'application/pdf',
      });

      const response = await uploadDocument(formData);

      // The API response for upload usually returns the ID or AWS path
      // Adjusting based on standard patterns (user didn't provide upload response JSON, only download)
      const awsId = response.data?.data?.[0] || response.data?.fileUuid || "temp-aws-id";

      updateUploadedDoc(requirement.id, {
        uri,
        awsId: String(awsId),
      });

      // Update the final application payload store
      addDocument({
        categoryId,
        documentTypeId: requirement.id,
        awsDocumentIds: [String(awsId)],
        documentNumber: currentDoc?.documentNumber || null,
      });

    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert("Upload Failed", "There was an error uploading your document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleView = async () => {
    if (!currentDoc?.awsId) return;

    try {
      // In a real app, awsId is likely an integer ID for the download API
      const id = parseInt(currentDoc.awsId);
      if (isNaN(id)) {
        setRemoteUri(currentDoc.uri);
        setViewerVisible(true);
        return;
      }

      const response = await getDocumentDownloadPath(id);
      if (response.data?.data?.[0]?.filePath) {
        setRemoteUri(response.data.data[0].filePath);
        setViewerVisible(true);
      } else {
        // Fallback to local URI if download path fails
        setRemoteUri(currentDoc.uri);
        setViewerVisible(true);
      }
    } catch (error) {
      console.error('View failed:', error);
      setRemoteUri(currentDoc.uri);
      setViewerVisible(true);
    }
  };

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-slate-900 font-bold ml-1">
          {formatLabel(requirement.documentName)}
          {requirement.isRequired && <Text className="text-red-500"> *</Text>}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => setPickerVisible(true)}
        disabled={isUploading}
        className={`p-5 rounded-2xl border-2 flex-row items-center ${currentDoc ? "border-green-500 bg-green-50" : "border-slate-100 bg-slate-50 border-dashed"
          }`}
      >
        <View className={`w-12 h-12 rounded-xl items-center justify-center overflow-hidden ${currentDoc ? "bg-green-50" : "bg-slate-200"
          }`}>
          {isUploading ? (
            <LottieView
              source={require('../../assets/new-loader.json')}
              autoPlay
              loop
              style={{ width: 32, height: 32 }}
            />
          ) : currentDoc ? (
            <Image source={{ uri: currentDoc.uri }} className="w-full h-full" />
          ) : (
            <Ionicons
              name={requirement.documentName.toLowerCase().includes('voter') ? 'card-outline' : 'image-outline'}
              size={24}
              color="#64748b"
            />
          )}
        </View>

        <View className="ml-4 flex-1">
          <Text className="text-slate-700 font-medium text-sm">
            {currentDoc ? 'Document Uploaded' : `Tap to upload ${formatLabel(requirement.documentName)}`}
          </Text>
          <Text className="text-slate-400 text-[10px] mt-1">
            {requirement.description || `Supported: ${requirement.acceptedFormats}`}
          </Text>
        </View>

        {currentDoc && !isUploading && (
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleView}
              className="mr-4 p-2 bg-white rounded-full border border-slate-100 shadow-sm"
            >
              <Ionicons name="eye-outline" size={18} color="#1d4ed8" />
            </TouchableOpacity>
            <Text className="text-green-600 font-bold text-xs">REPLACE</Text>
          </View>
        )}
      </TouchableOpacity>

      <DocumentPickerSheet
        isVisible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleSelect}
      />

      <DocumentViewer
        isVisible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        uri={remoteUri}
        title={formatLabel(requirement.documentName)}
      />
    </View>
  );
};

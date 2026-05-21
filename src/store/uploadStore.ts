/**
 * Upload state store
 * Tracks per-document upload progress, retry, and completion.
 */

import { create } from 'zustand';

export type UploadStatus = 'idle' | 'selecting' | 'uploading' | 'processing' | 'complete' | 'error';

export interface UploadItem {
  documentTypeId: number;
  categoryId: number;
  status: UploadStatus;
  uri?: string;
  awsId?: string;
  documentNumber?: string;
  progress: number; // 0-100
  error?: string;
  retryCount: number;
}

interface UploadStoreState {
  uploads: Record<number, UploadItem>; // keyed by documentTypeId

  // Actions
  initUpload: (typeId: number, categoryId: number) => void;
  setStatus: (typeId: number, status: UploadStatus) => void;
  setProgress: (typeId: number, progress: number) => void;
  setComplete: (typeId: number, awsId: string, uri: string, documentNumber?: string) => void;
  setError: (typeId: number, error: string) => void;
  incrementRetry: (typeId: number) => void;
  removeUpload: (typeId: number) => void;
  isAllComplete: (requiredTypeIds: number[]) => boolean;
  reset: () => void;
}

export const useUploadStore = create<UploadStoreState>((set, get) => ({
  uploads: {},

  initUpload: (typeId, categoryId) => set((state) => ({
    uploads: {
      ...state.uploads,
      [typeId]: {
        documentTypeId: typeId,
        categoryId,
        status: 'idle',
        progress: 0,
        retryCount: 0,
      },
    },
  })),

  setStatus: (typeId, status) => set((state) => ({
    uploads: {
      ...state.uploads,
      [typeId]: { ...state.uploads[typeId], status },
    },
  })),

  setProgress: (typeId, progress) => set((state) => ({
    uploads: {
      ...state.uploads,
      [typeId]: { ...state.uploads[typeId], progress },
    },
  })),

  setComplete: (typeId, awsId, uri, documentNumber) => set((state) => ({
    uploads: {
      ...state.uploads,
      [typeId]: {
        ...state.uploads[typeId],
        status: 'complete',
        progress: 100,
        awsId,
        uri,
        documentNumber,
        error: undefined,
      },
    },
  })),

  setError: (typeId, error) => set((state) => ({
    uploads: {
      ...state.uploads,
      [typeId]: {
        ...state.uploads[typeId],
        status: 'error',
        error,
      },
    },
  })),

  incrementRetry: (typeId) => set((state) => ({
    uploads: {
      ...state.uploads,
      [typeId]: {
        ...state.uploads[typeId],
        retryCount: (state.uploads[typeId]?.retryCount || 0) + 1,
      },
    },
  })),

  removeUpload: (typeId) => set((state) => {
    const nextUploads = { ...state.uploads };
    delete nextUploads[typeId];
    return { uploads: nextUploads };
  }),

  isAllComplete: (requiredTypeIds) => {
    const { uploads } = get();
    return requiredTypeIds.every((id) => uploads[id]?.status === 'complete');
  },

  reset: () => set({ uploads: {} }),
}));

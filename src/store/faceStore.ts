import { create } from 'zustand';
import { faceService } from '@/services/faceService';
import type { FaceAuthenticationResponse } from '@/types/face.types';

interface FaceState {
  isRecognizing: boolean;
  isRegistering: boolean;
  recognitionResult: FaceAuthenticationResponse | null;
  error: string | null;
  capturedFace: Blob | null;
  startRecognition: (image: Blob) => Promise<FaceAuthenticationResponse>;
  registerFace: (image: Blob, username: string) => Promise<void>;
  setCapturedFace: (image: Blob | null) => void;
  clearCapturedFace: () => void;
  reset: () => void;
}

export const useFaceStore = create<FaceState>((set) => ({
  isRecognizing: false,
  isRegistering: false,
  recognitionResult: null,
  error: null,
  capturedFace: null,

  setCapturedFace: (image: Blob | null) => {
    set({ capturedFace: image });
  },

  clearCapturedFace: () => {
    set({ capturedFace: null });
  },

  startRecognition: async (image: Blob): Promise<FaceAuthenticationResponse> => {
    set({ isRecognizing: true, error: null });
    try {
      const result = await faceService.authenticate(image);
      set({
        isRecognizing: false,
        recognitionResult: result,
      });
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Recognition failed';
      set({
        isRecognizing: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  registerFace: async (image: Blob, username: string): Promise<void> => {
    set({ isRegistering: true, error: null });
    try {
      await faceService.register({ image, username });
      set({ isRegistering: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      set({
        isRegistering: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  reset: () => {
    set({
      isRecognizing: false,
      isRegistering: false,
      recognitionResult: null,
      error: null,
      capturedFace: null,
    });
  },
}));

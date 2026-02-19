import api from './api';
import type {
  FaceRegistrationRequest,
  FaceRegistrationResponse,
  FaceAuthenticationResponse,
} from '@/types/face.types';
import { MOCK_MODE } from '@/config/env';
import { mockFace } from './mockApi';

export const faceService = {
  async authenticate(image: Blob): Promise<FaceAuthenticationResponse> {
    if (MOCK_MODE) {
      return mockFace.authenticate(image);
    }

    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await api.post<FaceAuthenticationResponse>(
        '/face/authenticate',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: FaceAuthenticationResponse } };
        throw axiosError.response?.data || { success: false, authenticated: false, message: 'Authentication failed' };
      }
      throw { success: false, authenticated: false, message: 'Network error' };
    }
  },

  async register(data: FaceRegistrationRequest): Promise<FaceRegistrationResponse> {
    if (MOCK_MODE) {
      return mockFace.register(data.image, data.username);
    }

    try {
      const formData = new FormData();
      formData.append('image', data.image);
      formData.append('username', data.username);

      const response = await api.post<FaceRegistrationResponse>(
        '/face/register',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: FaceRegistrationResponse } };
        throw axiosError.response?.data || { success: false, message: 'Registration failed' };
      }
      throw { success: false, message: 'Network error' };
    }
  },
};

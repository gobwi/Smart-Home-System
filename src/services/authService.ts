import api from './api';
import type { LoginCredentials, LoginResponse, SignupCredentials, SignupResponse } from '@/types/auth.types';
import { MOCK_MODE } from '@/config/env';
import { mockAuth } from './mockApi';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    if (MOCK_MODE) {
      const response = await mockAuth.login(credentials.username, credentials.password);
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      return response;
    }

    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: LoginResponse } };
        throw axiosError.response?.data || { success: false, message: 'Login failed' };
      }
      throw { success: false, message: 'Network error' };
    }
  },

  logout(): void {
    localStorage.removeItem('auth_token');
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  async signup(credentials: SignupCredentials): Promise<SignupResponse> {
    if (MOCK_MODE) {
      // Check if face image is provided
      if (credentials.faceImage) {
        const response = await mockAuth.signupWithFace(
          credentials.username,
          credentials.email,
          credentials.password,
          credentials.faceImage
        );
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
        }
        return response;
      } else {
        const response = await mockAuth.signup(
          credentials.username,
          credentials.email,
          credentials.password
        );
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
        }
        return response;
      }
    }

    try {
      // If face image is provided, use FormData
      if (credentials.faceImage) {
        const formData = new FormData();
        formData.append('username', credentials.username);
        formData.append('email', credentials.email);
        formData.append('password', credentials.password);
        formData.append('faceImage', credentials.faceImage);

        const response = await api.post<SignupResponse>('/auth/signup', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
        }
        
        return response.data;
      } else {
        // Regular signup without face
        const response = await api.post<SignupResponse>('/auth/signup', {
          username: credentials.username,
          email: credentials.email,
          password: credentials.password,
        });
        
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
        }
        
        return response.data;
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: SignupResponse } };
        throw axiosError.response?.data || { success: false, message: 'Signup failed' };
      }
      throw { success: false, message: 'Network error' };
    }
  },
};

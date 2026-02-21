import { create } from 'zustand';
import type { User } from '@/types/auth.types';
import { authService } from '@/services/authService';
import api from '@/services/api';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, faceImage?: Blob) => Promise<void>;
  setAuth: (user: User) => void;
  logout: () => void;
  checkAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ username, password });
      if (response.success && response.user) {
        set({
          isAuthenticated: true,
          user: response.user,
          isLoading: false,
          error: null,
        });
      } else {
        const errorMessage = response.message || 'Login failed';
        set({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  signup: async (username: string, email: string, password: string, faceImage?: Blob) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.signup({ username, email, password, faceImage });
      if (response.success && response.user) {
        set({
          isAuthenticated: true,
          user: response.user,
          isLoading: false,
          error: null,
        });
      } else {
        const errorMessage = response.message || 'Signup failed';
        set({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  setAuth: (user: User) => {
    set({
      isAuthenticated: true,
      user,
    });
  },

  logout: () => {
    authService.logout();
    set({
      isAuthenticated: false,
      user: null,
    });
  },

  checkAuth: async () => {
    const token = authService.getToken();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    try {
      const response = await api.get<{ success: boolean; user?: import('@/types/auth.types').User }>('/auth/me');
      if (response.data.success && response.data.user) {
        set({ isAuthenticated: true, user: response.data.user });
      } else {
        localStorage.removeItem('auth_token');
        set({ isAuthenticated: false, user: null });
      }
    } catch {
      localStorage.removeItem('auth_token');
      set({ isAuthenticated: false, user: null });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

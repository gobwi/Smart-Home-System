import api from './api';
import type {
  Device,
  Sensor,
  ToggleDeviceRequest,
  ToggleDeviceResponse,
} from '@/types/device.types';
import { MOCK_MODE } from '@/config/env';
import { mockDevices, mockSensors } from './mockApi';

export const deviceService = {
  async toggleDevice(request: ToggleDeviceRequest): Promise<ToggleDeviceResponse> {
    if (MOCK_MODE) {
      return mockDevices.toggleDevice(request.deviceId, request.status);
    }

    try {
      const response = await api.post<ToggleDeviceResponse>(
        '/device/toggle',
        request
      );
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: ToggleDeviceResponse } };
        throw axiosError.response?.data || { success: false, message: 'Toggle failed' };
      }
      throw { success: false, message: 'Network error' };
    }
  },

  async getDevices(): Promise<Device[]> {
    if (MOCK_MODE) {
      return mockDevices.getDevices();
    }

    try {
      const response = await api.get<Device[]>('/device/list');
      return response.data;
    } catch (error: unknown) {
      // Fallback to mock data if API fails
      return mockDevices.getDevices();
    }
  },

  async getSensors(): Promise<Sensor[]> {
    if (MOCK_MODE) {
      return mockSensors.getSensors();
    }

    try {
      const response = await api.get<Sensor[]>('/sensors');
      return response.data;
    } catch (error: unknown) {
      // Fallback to mock data if API fails
      return mockSensors.getSensors();
    }
  },
};

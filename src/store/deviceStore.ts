import { create } from 'zustand';
import type { Device, Sensor, DeviceId, DeviceStatus } from '@/types/device.types';
import { deviceService } from '@/services/deviceService';

interface DeviceState {
  devices: Device[];
  sensors: Sensor[];
  isLoading: boolean;
  fetchDevices: () => Promise<void>;
  fetchSensors: () => Promise<void>;
  toggleDevice: (deviceId: DeviceId, status: DeviceStatus) => Promise<void>;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [
    { id: 'ac', name: 'AC', status: 'off' },
    { id: 'fan', name: 'Fan', status: 'off' },
    { id: 'lights', name: 'Lights', status: 'off' },
  ],
  sensors: [],
  isLoading: false,

  fetchDevices: async () => {
    set({ isLoading: true });
    try {
      const devices = await deviceService.getDevices();
      set({ devices, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      set({ isLoading: false });
    }
  },

  fetchSensors: async () => {
    try {
      const sensors = await deviceService.getSensors();
      set({ sensors });
    } catch (error) {
      console.error('Failed to fetch sensors:', error);
    }
  },

  toggleDevice: async (deviceId: DeviceId, status: DeviceStatus) => {
    try {
      await deviceService.toggleDevice({ deviceId, status });
      
      set((state) => ({
        devices: state.devices.map((device) =>
          device.id === deviceId ? { ...device, status } : device
        ),
      }));
    } catch (error) {
      console.error('Failed to toggle device:', error);
      throw error;
    }
  },
}));

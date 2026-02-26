import { create } from 'zustand';
import type { Device, Sensor, DeviceId, DeviceStatus } from '@/types/device.types';
import { deviceService } from '@/services/deviceService';

interface DeviceState {
  devices: Device[];
  sensors: Sensor[];
  isLoading: boolean;
  lastUpdated: Date | null;
  espConnected: boolean;
  fetchDevices: () => Promise<void>;
  fetchSensors: () => Promise<void>;
  toggleDevice: (deviceId: DeviceId, status: DeviceStatus) => Promise<void>;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [
    { id: 'fan',    name: 'Fan',    status: 'off' },
    { id: 'lights', name: 'Lights', status: 'off' },
  ],
  sensors: [],
  isLoading: false,
  lastUpdated: null,
  espConnected: false,

  fetchDevices: async () => {
    try {
      const devices = await deviceService.getDevices();
      if (devices.length > 0) {
        set({ devices });
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    }
  },

  fetchSensors: async () => {
    try {
      const sensors = await deviceService.getSensors();
      // Determine if the ESP is live — if any sensor has a real value it's connected
      const connected = sensors.some(
        (s) => s.value !== '--' && s.status !== 'inactive'
      );
      set({ sensors, lastUpdated: new Date(), espConnected: connected });
    } catch (error) {
      console.error('Failed to fetch sensors:', error);
      set({ espConnected: false });
    }
  },

  toggleDevice: async (deviceId: DeviceId, status: DeviceStatus) => {
    // Optimistic update — flip the UI immediately
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === deviceId ? { ...d, status } : d
      ),
    }));
    try {
      await deviceService.toggleDevice({ deviceId, status });
    } catch (error) {
      // Revert on failure
      const opposite: DeviceStatus = status === 'on' ? 'off' : 'on';
      set((state) => ({
        devices: state.devices.map((d) =>
          d.id === deviceId ? { ...d, status: opposite } : d
        ),
      }));
      throw error;
    }
  },
}));

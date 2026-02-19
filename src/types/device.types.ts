export type DeviceId = 'ac' | 'fan' | 'lights';

export type DeviceStatus = 'on' | 'off';

export interface Device {
  id: DeviceId;
  name: string;
  status: DeviceStatus;
}

export interface Sensor {
  id: string;
  name: string;
  value: string | number;
  unit?: string;
  status: 'active' | 'inactive' | 'detected' | 'not_detected';
}

export interface ToggleDeviceRequest {
  deviceId: DeviceId;
  status: DeviceStatus;
}

export interface ToggleDeviceResponse {
  success: boolean;
  device: Device;
  message?: string;
}

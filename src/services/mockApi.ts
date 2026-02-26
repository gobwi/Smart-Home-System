import type {
  LoginResponse,
  SignupResponse,
} from '@/types/auth.types';
import type {
  FaceAuthenticationResponse,
  FaceRegistrationResponse,
} from '@/types/face.types';
import type {
  Device,
  Sensor,
  ToggleDeviceResponse,
  DeviceId,
  DeviceStatus,
} from '@/types/device.types';

// Utility function to simulate network delay
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// In-memory face store for mock mode.
// Persists registrations for the lifetime of the browser tab so that
// register → authenticate actually works end-to-end without a real backend.
// ---------------------------------------------------------------------------
interface MockFaceRecord {
  faceId: string;
  username: string;
  userId: string;
}

const registeredFaces: MockFaceRecord[] = [];

export const mockAuth = {
  async login(username: string, _password: string): Promise<LoginResponse> {
    await delay(500);

    // Simulate successful login
    return {
      success: true,
      user: {
        id: '1',
        username: username || 'Demo User',
        email: 'demo@smarthome.com',
      },
      token: 'mock_token_' + Date.now(),
      message: 'Login successful',
    };
  },

  async signup(
    username: string,
    email: string,
    _password: string
  ): Promise<SignupResponse> {
    await delay(500);

    // Simulate successful signup
    return {
      success: true,
      user: {
        id: '1',
        username,
        email,
      },
      token: 'mock_token_' + Date.now(),
      message: 'Account created successfully',
    };
  },

  async signupWithFace(
    username: string,
    email: string,
    _password: string,
    _faceImage: Blob
  ): Promise<SignupResponse> {
    await delay(1000);

    // Simulate successful signup with face registration
    return {
      success: true,
      user: {
        id: '1',
        username,
        email,
      },
      token: 'mock_token_' + Date.now(),
      message: 'Account created successfully with face registration',
    };
  },
};

export const mockFace = {
  async authenticate(_image: Blob): Promise<FaceAuthenticationResponse> {
    await delay(1500);

    // Fail clearly if no faces have been registered yet — previously this
    // always returned success, masking the broken register → authenticate flow.
    if (registeredFaces.length === 0) {
      return {
        success: false,
        authenticated: false,
        message: 'No faces registered. Please register a face first.',
      };
    }

    // In mock mode we can't do real face matching, so simulate a successful
    // match against the most recently registered face.
    const matched = registeredFaces[registeredFaces.length - 1];

    return {
      success: true,
      authenticated: true,
      user: {
        id: matched.userId,
        username: matched.username,
      },
      token: 'mock_token_' + Date.now(),
      message: 'Face recognized successfully',
    };
  },

  async register(
    _image: Blob,
    username: string
  ): Promise<FaceRegistrationResponse> {
    await delay(1000);

    const faceId = 'face_' + Date.now();
    const userId = 'user_' + Date.now();

    // Persist the registration so authenticate can find it
    registeredFaces.push({ faceId, username, userId });

    return {
      success: true,
      message: 'Face registered successfully',
      faceId,
    };
  },
};

export const mockDevices = {
  async getDevices(): Promise<Device[]> {
    await delay(300);

    // Return mock devices
    return [
      { id: 'ac', name: 'Air Conditioner', status: 'off' },
      { id: 'fan', name: 'Fan', status: 'on' },
      { id: 'lights', name: 'Lights', status: 'off' },
    ];
  },

  async toggleDevice(
    deviceId: DeviceId,
    status: DeviceStatus
  ): Promise<ToggleDeviceResponse> {
    await delay(200);

    // Simulate device toggle
    const deviceNames: Record<DeviceId, string> = {
      ac: 'Air Conditioner',
      fan: 'Fan',
      lights: 'Lights',
    };

    return {
      success: true,
      device: {
        id: deviceId,
        name: deviceNames[deviceId],
        status,
      },
      message: `${deviceNames[deviceId]} turned ${status}`,
    };
  },
};

export const mockSensors = {
  async getSensors(): Promise<Sensor[]> {
    await delay(300);

    // Return mock sensor data with some variation
    const baseTemp = 26;
    const tempVariation = Math.floor(Math.random() * 5) - 2; // -2 to +2
    const temperature = baseTemp + tempVariation;
    const motionDetected = Math.random() > 0.7; // 30% chance of motion

    return [
      {
        id: 'temperature',
        name: 'Temperature Sensor',
        value: temperature,
        unit: '°C',
        status: 'active',
      },
      {
        id: 'motion',
        name: 'IR Motion Sensor',
        value: motionDetected ? 'Detected' : 'Not detected',
        status: motionDetected ? 'detected' : 'not_detected',
      },
    ];
  },
};

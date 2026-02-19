export const DEVICES = {
  AC: 'ac',
  FAN: 'fan',
  LIGHTS: 'lights',
} as const;

export const SENSORS = {
  TEMPERATURE: 'temperature',
  MOTION: 'motion',
} as const;

export const ROUTES = {
  LANDING: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  FACE_RECOGNITION: '/face-recognition',
  ADD_FACE: '/add-face',
} as const;

export interface User {
  id: string;
  username: string;
  email?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
  faceImage?: Blob;
}

export interface SignupResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

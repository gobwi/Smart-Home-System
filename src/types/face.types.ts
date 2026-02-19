export interface FaceRegistrationRequest {
  image: Blob;
  username: string;
}

export interface FaceRegistrationResponse {
  success: boolean;
  message?: string;
  faceId?: string;
}

export interface FaceAuthenticationResponse {
  success: boolean;
  authenticated: boolean;
  user?: {
    id: string;
    username: string;
  };
  message?: string;
}

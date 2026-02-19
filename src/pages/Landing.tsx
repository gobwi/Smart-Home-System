import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {CameraIcon, UserPlus, Zap} from "lucide-react";
import Button from '@/components/Button';
import FaceCamera from '@/components/FaceCamera';
import { useFaceStore } from '@/store/faceStore';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/utils/constants';
import { MOCK_MODE } from '@/config/env';

export default function Landing() {
  const navigate = useNavigate();
  const [showCamera, setShowCamera] = useState(false);
  const { startRecognition, isRecognizing, error } = useFaceStore();
  const { setAuth } = useAuthStore();

  const handleFaceRecognition = async (image: Blob): Promise<void> => {
    try {
      const result = await startRecognition(image);
      if (result.success && result.authenticated) {
        setAuth(result.user || { id: '1', username: 'user' });
        navigate(ROUTES.DASHBOARD);
      } else {
        alert(result.message || 'Face recognition failed. Please try again.');
      }
    } catch (err) {
      alert(error || 'Failed to authenticate. Please try manual login.');
    }
  };

  const handleDemoMode = (): void => {
    setAuth({
      id: '1',
      username: 'Demo User',
      email: 'demo@smarthome.com',
    });
    navigate(ROUTES.DASHBOARD);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Smart Home Access
          </h1>
          <p className="text-muted-foreground text-lg">
            Secure and convenient access to your smart home
          </p>
          {MOCK_MODE && (
            <div className="mt-6">
              <Button
                onClick={handleDemoMode}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Zap className="h-5 w-5" />
                Enter Demo Mode
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Development Mode Active - No backend required
              </p>
            </div>
          )}
        </div>

        {showCamera ? (
          <div className="bg-card rounded-2xl border border-border p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Face Recognition
            </h2>
            {isRecognizing ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                <p className="text-muted-foreground">Waiting for face...</p>
              </div>
            ) : (
              <FaceCamera
                onCapture={handleFaceRecognition}
                onClose={() => setShowCamera(false)}
              />
            )}
            {error && (
              <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg text-center">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card rounded-2xl border border-border p-8 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 p-4 bg-primary/10 rounded-full">
                  <CameraIcon className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">
                  Face Recognition
                </h2>
                <p className="text-muted-foreground mb-6">
                  Authenticate using facial recognition technology
                </p>
                <Button
                  onClick={() => setShowCamera(true)}
                  size="lg"
                  className="w-full"
                >
                  Authenticate with Face Recognition
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-8 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 p-4 bg-secondary/10 rounded-full">
                  <CameraIcon className="h-12 w-12 text-secondary-foreground" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">
                  Manual Login
                </h2>
                <p className="text-muted-foreground mb-6">
                  Use your username and password to access
                </p>
                <Button
                  onClick={() => navigate(ROUTES.LOGIN)}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  Manual Login Override
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-8 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 p-4 bg-primary/10 rounded-full">
                  <UserPlus className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">
                  Sign Up
                </h2>
                <p className="text-muted-foreground mb-6">
                  Create a new account to access your smart home
                </p>
                <Button
                  onClick={() => navigate(ROUTES.SIGNUP)}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Create Account
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

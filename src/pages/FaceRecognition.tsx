import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanFace, UserPlus } from 'lucide-react';
import Button from '@/components/Button';
import FaceCamera from '@/components/FaceCamera';
import { useFaceStore } from '@/store/faceStore';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/utils/constants';

export default function FaceRecognition() {
  const navigate = useNavigate();
  const [showCamera, setShowCamera] = useState(false);
  const { startRecognition, isRecognizing, error } = useFaceStore();
  const { setAuth } = useAuthStore();

  const handleAuthenticate = async (image: Blob): Promise<void> => {
    try {
      const result = await startRecognition(image);
      if (result.success && result.authenticated) {
        setAuth(result.user || { id: '1', username: 'user' });
        navigate(ROUTES.DASHBOARD);
      } else {
        alert(result.message || 'Face recognition failed. Please try again.');
        setShowCamera(false);
      }
    } catch (err) {
      alert(error || 'Failed to authenticate. Please try again.');
      setShowCamera(false);
    }
  };

  if (showCamera) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-xl">
          <h2 className="text-3xl font-bold mb-6">Authenticate Face</h2>
          {isRecognizing ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground">Authenticating face…</p>
            </div>
          ) : (
            <>
              <FaceCamera
                onCapture={handleAuthenticate}
                onClose={() => setShowCamera(false)}
              />
              {error && (
                <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg text-center">
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Face Recognition</h1>
        <p className="text-muted-foreground">Manage face recognition settings</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 p-4 bg-primary/10 rounded-full">
              <ScanFace className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Authenticate Face</h2>
            <p className="text-muted-foreground mb-6">
              Use face recognition to authenticate
            </p>
            <Button onClick={() => setShowCamera(true)} size="lg" className="w-full">
              Authenticate Face
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 p-4 bg-secondary/10 rounded-full">
              <UserPlus className="h-12 w-12 text-secondary-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Add New Face</h2>
            <p className="text-muted-foreground mb-6">
              Register a new face for recognition
            </p>
            <Button
              onClick={() => navigate(ROUTES.ADD_FACE)}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              Add New Face
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, UserPlus, Loader2 } from 'lucide-react';
import Button from '@/components/Button';
import FaceCamera from '@/components/FaceCamera';
import { useFaceStore } from '@/store/faceStore';
import { ROUTES } from '@/utils/constants';

export default function AddFace() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { registerFace, isRegistering, error } = useFaceStore();

  const handleCapture = (image: Blob): void => {
    setCapturedImage(image);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(image);
  };

  const handleRegister = async (): Promise<void> => {
    if (!capturedImage || !username.trim()) {
      alert('Please capture an image and enter a username');
      return;
    }

    try {
      await registerFace(capturedImage, username.trim());
      alert('Face registered successfully!');
      navigate(ROUTES.FACE_RECOGNITION);
    } catch (err) {
      alert(error || 'Failed to register face. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Add New Face</h1>
        <p className="text-muted-foreground">Register a new face for recognition</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-8 shadow-xl">
        <div className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              User Name
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              placeholder="Enter username for this face"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-4">
              Camera Preview
            </label>
            {imagePreview ? (
              <FaceCamera
                onCapture={handleCapture}
                showPreview={true}
                capturedImage={imagePreview}
                onClose={() => {
                  setImagePreview(null);
                  setCapturedImage(null);
                }}
              />
            ) : (
              <FaceCamera onCapture={handleCapture} />
            )}
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleRegister}
              disabled={!capturedImage || !username.trim() || isRegistering}
              size="lg"
              className="flex-1"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register Face
                </>
              )}
            </Button>
            <Button
              onClick={() => navigate(ROUTES.FACE_RECOGNITION)}
              variant="outline"
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

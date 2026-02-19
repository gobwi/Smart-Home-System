import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Loader2, CheckCircle2 } from 'lucide-react';
import Button from '@/components/Button';
import FaceCamera from '@/components/FaceCamera';
import { useAuthStore } from '@/store/authStore';
import { useFaceStore } from '@/store/faceStore';
import { ROUTES } from '@/utils/constants';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, isLoading, error } = useAuthStore();
  const { capturedFace, setCapturedFace, clearCapturedFace } = useFaceStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [faceImagePreview, setFaceImagePreview] = useState<string | null>(null);
  const [faceCaptured, setFaceCaptured] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleFaceCapture = (imageBlob: Blob): void => {
    setCapturedFace(imageBlob);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFaceImagePreview(reader.result as string);
      setFaceCaptured(true);
    };
    reader.readAsDataURL(imageBlob);
  };

  const handleRetakeFace = (): void => {
    clearCapturedFace();
    setFaceImagePreview(null);
    setFaceCaptured(false);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setValidationError('All fields are required');
      return;
    }

    if (!validateEmail(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long');
      return;
    }

    if (!capturedFace) {
      setValidationError('Please capture your face for registration');
      return;
    }

    try {
      await signup(username.trim(), email.trim(), password, capturedFace);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      // Error is handled by the store
      console.error('Signup error:', err);
    }
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground">Sign up to access your smart home</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                placeholder="Confirm your password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Face Registration <span className="text-muted-foreground">(Required)</span>
              </label>
              {faceCaptured && faceImagePreview ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={faceImagePreview}
                      alt="Captured face"
                      className="w-full rounded-xl border border-border"
                    />
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Face captured successfully</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleRetakeFace}
                    variant="outline"
                    className="w-full"
                  >
                    Retake Photo
                  </Button>
                </div>
              ) : (
                <FaceCamera onCapture={handleFaceCapture} />
              )}
            </div>

            {displayError && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                {displayError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || !faceCaptured}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link
              to={ROUTES.LOGIN}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
            >
              Already have an account? Login
            </Link>
            <Link
              to={ROUTES.LANDING}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

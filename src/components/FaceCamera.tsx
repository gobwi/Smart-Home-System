import { useState, useEffect, useCallback } from 'react';
import { Camera, X } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import Button from './Button';
import { cn } from '@/utils/cn';

interface FaceCameraProps {
  onCapture: (image: Blob) => void;
  onClose?: () => void;
  showPreview?: boolean;
  capturedImage?: string | null;
}

export default function FaceCamera({
  onCapture,
  onClose,
  showPreview = false,
  capturedImage,
}: FaceCameraProps) {
  const { videoRef, isStreaming, error, startCamera, stopCamera, captureImage } =
    useCamera();
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    if (!showPreview) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showPreview, startCamera, stopCamera]);

  const handleCapture = useCallback((): void => {
    setCaptureError(null);
    const imageBlob = captureImage();
    if (imageBlob) {
      onCapture(imageBlob);
    } else {
      // Camera stream exists but frame isn't ready yet — give the user feedback
      setCaptureError('Camera is not ready yet. Please wait a moment and try again.');
    }
  }, [captureImage, onCapture]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-xl">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={startCamera} variant="outline">
          Retry Camera Access
        </Button>
      </div>
    );
  }

  if (showPreview && capturedImage) {
    return (
      <div className="relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background rounded-full p-2 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <img
          src={capturedImage}
          alt="Captured face"
          className="w-full rounded-xl border border-border"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background rounded-full p-2 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="relative bg-muted rounded-xl overflow-hidden border border-border">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn('w-full h-auto', !isStreaming && 'hidden')}
        />
        {!isStreaming && (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Starting camera...</p>
          </div>
        )}
      </div>
      {isStreaming && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <Button onClick={handleCapture} size="lg" className="gap-2">
            <Camera className="h-5 w-5" />
            Capture Face
          </Button>
          {captureError && (
            <p className="text-sm text-destructive text-center">{captureError}</p>
          )}
        </div>
      )}
    </div>
  );
}

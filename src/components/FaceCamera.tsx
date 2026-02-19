import { useEffect, useRef } from 'react';
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
  const { videoRef, isStreaming, error, startCamera, stopCamera, captureImage } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!showPreview) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showPreview]);

  const handleCapture = (): void => {
    const imageBlob = captureImage();
    if (imageBlob) {
      onCapture(imageBlob);
    }
  };

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
          className={cn(
            'w-full h-auto',
            !isStreaming && 'hidden'
          )}
        />
        {!isStreaming && (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Starting camera...</p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      {isStreaming && (
        <div className="mt-4 flex justify-center">
          <Button onClick={handleCapture} size="lg" className="gap-2">
            <Camera className="h-5 w-5" />
            Capture Face
          </Button>
        </div>
      )}
    </div>
  );
}

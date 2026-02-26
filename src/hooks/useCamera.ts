import { useState, useRef, useEffect, useCallback } from 'react';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  isStreaming: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImage: () => Blob | null;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Track whether the hook is still mounted so we don't update state after unmount
  const mountedRef = useRef(true);

  const stopCamera = useCallback((): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (mountedRef.current) {
      setIsStreaming(false);
    }
  }, []);

  const startCamera = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });

      // Guard: if the component unmounted while getUserMedia was awaiting,
      // stop the stream immediately to prevent a resource leak.
      if (!mountedRef.current || !videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      // Wait for the video to load its dimensions before marking as ready.
      // Without this, videoWidth/videoHeight are 0 and captureImage returns null.
      await new Promise<void>((resolve) => {
        const video = videoRef.current;
        if (!video) return resolve();
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
          return resolve();
        }
        video.onloadedmetadata = () => resolve();
      });

      if (mountedRef.current) {
        setIsStreaming(true);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to access camera';
      if (mountedRef.current) {
        setError(errorMessage);
        setIsStreaming(false);
      }
    }
  }, []);

  const captureImage = useCallback((): Blob | null => {
    if (!videoRef.current || !isStreaming) {
      return null;
    }

    const canvas = document.createElement('canvas');
    const video = videoRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    ctx.drawImage(video, 0, 0);

    // Convert canvas to blob synchronously
    const dataURL = canvas.toDataURL('image/jpeg', 0.95);
    const arr = dataURL.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }, [isStreaming]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isStreaming,
    error,
    startCamera,
    stopCamera,
    captureImage,
  };
}

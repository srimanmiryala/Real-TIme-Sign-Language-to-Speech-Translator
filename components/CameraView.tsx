import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, VideoOff } from 'lucide-react';

interface CameraViewProps {
  isActive: boolean;
  onFrameCapture: (base64Image: string) => void;
}

const CameraView: React.FC<CameraViewProps> = ({ isActive, onFrameCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError(null);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Unable to access camera. Please ensure permissions are granted.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Frame Capture Loop
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (isActive && stream && !error) {
      intervalId = setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const context = canvasRef.current.getContext('2d');
          if (context) {
            const { videoWidth, videoHeight } = videoRef.current;
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;
            
            // Draw video frame to canvas
            context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
            
            // Compress slightly for speed
            const base64 = canvasRef.current.toDataURL('image/jpeg', 0.7);
            onFrameCapture(base64);
          }
        }
      }, 1500); // Capture every 1.5 seconds to balance API load
    }

    return () => clearInterval(intervalId);
  }, [isActive, stream, error, onFrameCapture]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-700 group">
      {error ? (
        <div className="flex flex-col items-center justify-center h-full text-red-400">
          <VideoOff size={48} className="mb-4" />
          <p>{error}</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Overlay UI */}
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-xs font-mono text-white uppercase">
              {isActive ? 'Live Inference' : 'Standby'}
            </span>
          </div>

          {/* Grid Overlay for sci-fi feel */}
          <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity">
             <div className="absolute inset-0 border-2 border-slate-500/30 rounded-2xl"></div>
             <div className="absolute center w-16 h-16 border border-white/20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"></div>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraView;
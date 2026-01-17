
import React, { useRef, useState, useEffect } from 'react';

interface CameraModalProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const startCamera = async () => {
    stopStream();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode, 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setError("कैमरा शुरू करने में विफल। कृपया अनुमति जांचें।");
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopStream();
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        // High quality capture but keep it small enough for Sheets strings
        const targetWidth = 800;
        const targetHeight = (video.videoHeight / video.videoWidth) * targetWidth;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Horizontal flip if using front camera
        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }

        context.drawImage(video, 0, 0, targetWidth, targetHeight);
        
        // JPEG format with 0.5 quality balances detail and size
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        onCapture(dataUrl);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {/* Top Bar */}
      <div className="safe-top bg-black/50 backdrop-blur-md px-4 py-4 flex justify-between items-center z-10">
        <button 
          onClick={onClose} 
          className="text-white bg-white/10 p-2 rounded-full active:bg-white/20 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-white font-bold text-sm tracking-wide uppercase">आधार कार्ड स्कैन करें</h3>
        <button 
          onClick={toggleCamera} 
          className="text-white bg-white/10 p-2 rounded-full active:bg-white/20 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Viewfinder Area */}
      <div className="relative flex-grow flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-white text-center p-8 max-w-xs">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <p className="font-bold text-lg mb-2">त्रुटि!</p>
            <p className="text-zinc-400 text-sm">{error}</p>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
        )}
        
        {/* Mobile Guide Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
           <div className="w-full aspect-[1.6/1] border-2 border-dashed border-indigo-400 rounded-2xl shadow-[0_0_0_1000px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500"></div>
              <div className="flex flex-col items-center gap-2 opacity-60">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Align Aadhar Card</span>
              </div>
           </div>
           <p className="mt-8 text-white/70 text-sm font-medium text-center bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
             कार्ड को चौकोर घेरे के अंदर रखें
           </p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="safe-bottom pb-10 pt-6 bg-gradient-to-t from-black to-transparent flex justify-center items-center px-6">
        <div className="w-20 h-20 relative flex items-center justify-center">
          <button 
            onClick={capturePhoto}
            disabled={!!error}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 z-20"
          >
            <div className="w-14 h-14 border-2 border-zinc-900 rounded-full" />
          </button>
          <div className="absolute inset-0 border-4 border-white/20 rounded-full animate-pulse"></div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraModal;

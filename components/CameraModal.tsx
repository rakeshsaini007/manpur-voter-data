
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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

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
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
      // Auto-capture timer starts after a brief pause
      setTimeout(() => setCountdown(3), 800);
    } catch (err) {
      console.error("Camera error:", err);
      setError("कैमरा शुरू करने में विफल। कृपया अनुमति जांचें।");
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopStream();
  }, [facingMode]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isCapturing) {
      capturePhoto();
    }
  }, [countdown]);

  const toggleCamera = () => {
    setCountdown(null);
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (isCapturing) return;
    if (videoRef.current && canvasRef.current) {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        // Optimized for Google Sheets cell limit (50k chars)
        // Width 600px + 0.35 quality usually results in ~30-40k chars Base64
        const targetWidth = 600;
        const targetHeight = (video.videoHeight / video.videoWidth) * targetWidth;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }

        context.drawImage(video, 0, 0, targetWidth, targetHeight);
        
        // Low quality is mandatory to fit image data in a single Google Sheet cell
        const dataUrl = canvas.toDataURL('image/jpeg', 0.35);
        
        // shutter flash
        const shutter = document.createElement('div');
        shutter.className = 'fixed inset-0 bg-white z-[200] opacity-80';
        document.body.appendChild(shutter);
        
        setTimeout(() => {
          document.body.removeChild(shutter);
          onCapture(dataUrl);
          onClose();
        }, 100);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden">
      <div className="safe-top bg-black/60 backdrop-blur-lg px-4 py-4 flex justify-between items-center z-20">
        <button 
          onClick={onClose} 
          className="text-white bg-white/10 p-2 rounded-full active:bg-white/30 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex flex-col items-center">
          <h3 className="text-white font-bold text-xs tracking-widest uppercase">Smart Scanner</h3>
          {countdown !== null && countdown > 0 && (
            <p className="text-indigo-400 text-[10px] font-black animate-pulse">Capturing in {countdown}s...</p>
          )}
        </div>
        <button 
          onClick={toggleCamera} 
          className="text-white bg-white/10 p-2 rounded-full active:bg-white/30 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="relative flex-grow flex items-center justify-center">
        {error ? (
          <div className="text-white text-center p-8 max-w-xs z-10">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <p className="font-bold text-lg mb-2">कैमरा त्रुटि</p>
            <p className="text-zinc-400 text-sm">{error}</p>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${countdown !== null ? 'opacity-100' : 'opacity-0'} ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
        )}
        
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 z-10">
           <div className={`w-full max-w-md aspect-[1.586/1] border-2 transition-all duration-500 rounded-2xl shadow-[0_0_0_2000px_rgba(0,0,0,0.75)] flex items-center justify-center relative overflow-hidden ${countdown === 0 ? 'border-green-500 scale-105 shadow-[0_0_40px_rgba(34,197,94,0.3)]' : 'border-indigo-400/40'}`}>
              <div className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 transition-colors duration-300 ${countdown === 0 ? 'border-green-500' : 'border-indigo-500'}`}></div>
              <div className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 transition-colors duration-300 ${countdown === 0 ? 'border-green-500' : 'border-indigo-500'}`}></div>
              <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 transition-colors duration-300 ${countdown === 0 ? 'border-green-500' : 'border-indigo-500'}`}></div>
              <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 transition-colors duration-300 ${countdown === 0 ? 'border-green-500' : 'border-indigo-500'}`}></div>
              <div className="absolute inset-x-0 h-1 bg-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.6)] animate-[scan_2.5s_ease-in-out_infinite]"></div>
              <div className="flex flex-col items-center gap-3 opacity-30">
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-white text-[9px] font-black uppercase tracking-[0.4em]">Stabilizing...</span>
              </div>
           </div>
           
           <div className="mt-16 bg-black/60 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/10 text-center animate-bounce shadow-2xl">
              <p className="text-white text-base font-black tracking-wide">आधार कार्ड यहाँ रखें</p>
              <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5">Auto-capture Active</p>
           </div>
        </div>

        {isCapturing && (
          <div className="absolute inset-0 bg-white z-[50] opacity-100"></div>
        )}
      </div>

      <div className="safe-bottom pb-12 pt-6 bg-black flex justify-center items-center">
        <button 
          onClick={capturePhoto}
          disabled={!!error || isCapturing}
          className="group relative flex items-center justify-center"
        >
          <div className={`absolute inset-0 rounded-full bg-indigo-500/30 blur-2xl transition-all duration-500 ${countdown === 0 ? 'scale-150 opacity-100' : 'scale-100 opacity-0'}`}></div>
          <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${countdown === 0 ? 'border-green-500 scale-110 shadow-[0_0_30px_rgba(34,197,94,0.4)]' : 'border-white/20'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${countdown === 0 ? 'bg-green-500' : 'bg-white shadow-xl'}`}>
               {countdown !== null && countdown > 0 ? (
                 <span className="text-indigo-950 font-black text-3xl">{countdown}</span>
               ) : (
                 <div className="w-16 h-16 rounded-full border-2 border-black/5" />
               )}
            </div>
          </div>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraModal;

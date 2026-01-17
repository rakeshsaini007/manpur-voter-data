
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
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
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
        // Calculation for standard ID card ratio (1.586)
        const idRatio = 1.586;
        const vWidth = video.videoWidth;
        const vHeight = video.videoHeight;

        // Calculate crop area based on the visual guide 
        // We assume the guide is roughly 80% of the narrowest dimension in the UI
        // In the video stream, we'll take a central crop
        let sWidth, sHeight, sx, sy;

        if (vWidth / vHeight > idRatio) {
          // Video is wider than ID card
          sHeight = vHeight * 0.7; // Take 70% of height
          sWidth = sHeight * idRatio;
        } else {
          // Video is taller or same
          sWidth = vWidth * 0.85; // Take 85% of width
          sHeight = sWidth / idRatio;
        }

        sx = (vWidth - sWidth) / 2;
        sy = (vHeight - sHeight) / 2;

        // Final output size (optimized for Sheets 50k char limit)
        const targetWidth = 640;
        const targetHeight = targetWidth / idRatio;
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Flip for front camera
        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }

        // DRAW ONLY THE CROPPED PORTION
        context.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.4);
        
        const shutter = document.createElement('div');
        shutter.className = 'fixed inset-0 bg-white z-[200] opacity-90';
        document.body.appendChild(shutter);
        
        setTimeout(() => {
          document.body.removeChild(shutter);
          onCapture(dataUrl);
          onClose();
        }, 150);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden">
      <div className="safe-top bg-black/60 backdrop-blur-lg px-4 py-4 flex justify-between items-center z-20">
        <button onClick={onClose} className="text-white bg-white/10 p-2 rounded-full active:bg-white/30 transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="flex flex-col items-center">
          <h3 className="text-white font-black text-[10px] tracking-[0.3em] uppercase opacity-70">Smart Card Cropper</h3>
          {countdown !== null && countdown > 0 && (
            <p className="text-indigo-400 text-xs font-black animate-pulse mt-1 uppercase">Auto-Capture: {countdown}s</p>
          )}
        </div>
        <button onClick={toggleCamera} className="text-white bg-white/10 p-2 rounded-full active:bg-white/30 transition-all">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      <div className="relative flex-grow flex items-center justify-center">
        {error ? (
          <div className="text-white text-center p-8 max-w-xs z-10">
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
        
        {/* THE CROP GUIDE BOX */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 z-10">
           <div className={`w-full max-w-md aspect-[1.586/1] border-2 transition-all duration-500 rounded-3xl shadow-[0_0_0_2000px_rgba(0,0,0,0.8)] flex items-center justify-center relative overflow-hidden ${countdown === 0 ? 'border-green-500 scale-105' : 'border-indigo-400/50'}`}>
              <div className={`absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 transition-colors duration-300 rounded-tl-xl ${countdown === 0 ? 'border-green-500' : 'border-indigo-500'}`}></div>
              <div className={`absolute top-0 right-0 w-12 h-12 border-t-8 border-r-8 transition-colors duration-300 rounded-tr-xl ${countdown === 0 ? 'border-green-500' : 'border-indigo-500'}`}></div>
              <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-8 border-l-8 transition-colors duration-300 rounded-bl-xl ${countdown === 0 ? 'border-green-500' : 'border-indigo-500'}`}></div>
              <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 transition-colors duration-300 rounded-br-xl ${countdown === 0 ? 'border-green-500' : 'border-indigo-500'}`}></div>
              
              <div className="absolute inset-x-0 h-1 bg-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.6)] animate-[scan_2.5s_ease-in-out_infinite]"></div>
              
              <div className="flex flex-col items-center gap-3">
                <div className="bg-indigo-600/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                   <span className="text-white text-[9px] font-black uppercase tracking-[0.2em]">Crop Area</span>
                </div>
              </div>
           </div>
           
           <div className="mt-16 bg-white/10 backdrop-blur-xl px-10 py-4 rounded-full border border-white/10 text-center shadow-2xl">
              <p className="text-white text-base font-black tracking-wide uppercase">आधार कार्ड बॉक्स में रखें</p>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 animate-pulse">Auto-Cropping Enabled</p>
           </div>
        </div>

        {isCapturing && <div className="absolute inset-0 bg-white z-[50] opacity-100 transition-opacity"></div>}
      </div>

      <div className="safe-bottom pb-12 pt-6 bg-black flex justify-center items-center">
        <button 
          onClick={capturePhoto}
          disabled={!!error || isCapturing}
          className="relative group"
        >
          <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${countdown === 0 ? 'border-green-500 scale-110' : 'border-white/20'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${countdown === 0 ? 'bg-green-500' : 'bg-white shadow-xl'}`}>
               {countdown !== null && countdown > 0 ? (
                 <span className="text-indigo-950 font-black text-3xl">{countdown}</span>
               ) : (
                 <div className="w-16 h-16 rounded-full border-4 border-black/5" />
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

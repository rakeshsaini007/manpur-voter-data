
import { useRef, useState, useEffect } from 'react';

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
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.error("Video play error:", playErr);
        }
      }
      
      setError(null);
      setTimeout(() => setCountdown(3), 1000);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("कैमरा एक्सेस नहीं मिल सका। कृपया परमिशन चेक करें।");
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
        const vWidth = video.videoWidth || 1280;
        const vHeight = video.videoHeight || 720;

        // Wider crop to ensure all card text is captured
        const cropWidth = vWidth * 0.95;
        const cropHeight = vHeight * 0.95;
        const sx = (vWidth - cropWidth) / 2;
        const sy = (vHeight - cropHeight) / 2;

        // Increased target resolution for much better OCR accuracy
        const targetWidth = 1024;
        const targetHeight = (targetWidth * cropHeight) / cropWidth; 
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }

        context.drawImage(video, sx, sy, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
        
        // High quality setting (0.8) for better text clarity
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        const shutter = document.createElement('div');
        shutter.className = 'fixed inset-0 bg-white z-[200] opacity-100 transition-opacity duration-300';
        document.body.appendChild(shutter);
        
        setTimeout(() => {
          shutter.style.opacity = '0';
          setTimeout(() => {
            if (document.body.contains(shutter)) document.body.removeChild(shutter);
            onCapture(dataUrl);
            onClose();
          }, 300);
        }, 50);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden">
      <div className="safe-top bg-black/40 backdrop-blur-md px-6 py-4 flex justify-between items-center z-30">
        <button onClick={onClose} className="text-white bg-white/10 p-3 rounded-2xl active:scale-90 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="text-center">
          <h3 className="text-white font-black text-[10px] tracking-[0.3em] uppercase opacity-70">Aadhar Scanner</h3>
          {countdown !== null && countdown > 0 && (
            <div className="mt-1 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <p className="text-white text-xs font-black tracking-widest uppercase">Auto-Capture in {countdown}s</p>
            </div>
          )}
        </div>
        <button onClick={toggleCamera} className="text-white bg-white/10 p-3 rounded-2xl active:scale-90 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      <div className="relative flex-grow flex items-center justify-center bg-zinc-900">
        {!error ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${stream ? 'opacity-100' : 'opacity-0'} ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
        ) : (
          <div className="px-10 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <p className="text-white font-bold text-lg">{error}</p>
            <button onClick={startCamera} className="mt-6 px-8 py-3 bg-white text-black font-black rounded-2xl">पुनः प्रयास करें</button>
          </div>
        )}
        
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 z-10">
           <div className={`w-[90vw] h-[58vw] max-w-2xl max-h-[30rem] border-4 transition-all duration-500 rounded-[2.5rem] shadow-[0_0_0_4000px_rgba(0,0,0,0.7)] flex items-center justify-center relative overflow-hidden ${countdown === 0 ? 'border-emerald-500 scale-105 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : 'border-white/30'}`}>
              <div className="absolute inset-x-0 h-1 bg-white/40 shadow-[0_0_20px_white] animate-[scan_2s_ease-in-out_infinite]"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 border-white rounded-tl-3xl"></div>
              <div className="absolute top-0 right-0 w-12 h-12 border-t-8 border-r-8 border-white rounded-tr-3xl"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-8 border-l-8 border-white rounded-bl-3xl"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 border-white rounded-br-3xl"></div>
           </div>
           <div className="mt-12 bg-white/10 backdrop-blur-2xl px-10 py-5 rounded-full border border-white/10 text-center">
              <p className="text-white text-sm font-black tracking-[0.1em] uppercase">आधार कार्ड को बॉक्स के भीतर रखें</p>
           </div>
        </div>
      </div>

      <div className="safe-bottom pb-12 pt-8 bg-black flex flex-col items-center gap-6">
        <button 
          onClick={capturePhoto} 
          disabled={!!error || isCapturing} 
          className="relative w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center active:scale-90 transition-transform"
        >
          <div className={`w-20 h-20 rounded-full transition-all duration-300 flex items-center justify-center ${countdown === 0 ? 'bg-emerald-500 scale-110' : 'bg-white'}`}>
            {countdown !== null && countdown > 0 && <span className="text-black font-black text-3xl">{countdown}</span>}
            {isCapturing && <div className="w-10 h-10 border-4 border-black border-t-transparent animate-spin rounded-full" />}
          </div>
        </button>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Smart OCR Precision Mode</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan { 
          0% { top: -10%; opacity: 0; } 
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 110%; opacity: 0; } 
        }
      `}} />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraModal;

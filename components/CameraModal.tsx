
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

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError("कैमरा शुरू करने में विफल। कृपया अनुमति जांचें।");
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        // Target a compressed size for Google Sheets
        const targetWidth = 640;
        const targetHeight = (video.videoHeight / video.videoWidth) * targetWidth;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        context.drawImage(video, 0, 0, targetWidth, targetHeight);
        
        // Use JPEG with 0.6 quality to keep string length manageable
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        onCapture(dataUrl);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="relative bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full flex flex-col aspect-video md:aspect-auto">
        <div className="p-4 flex justify-between items-center border-b border-zinc-800">
          <h3 className="text-white font-bold">आधार कार्ड की फोटो लें</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="relative flex-grow bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="text-red-400 text-center p-8">
              <p className="font-bold">{error}</p>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-contain"
            />
          )}
          
          {/* Guide Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div className="w-[80%] h-[60%] border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center">
                <span className="text-white/20 text-xs font-bold uppercase tracking-widest">आधार कार्ड यहाँ रखें</span>
             </div>
          </div>
        </div>

        <div className="p-6 bg-zinc-900 flex justify-center">
          <button 
            onClick={capturePhoto}
            disabled={!!error}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl disabled:opacity-50"
          >
            <div className="w-14 h-14 border-2 border-zinc-900 rounded-full" />
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraModal;

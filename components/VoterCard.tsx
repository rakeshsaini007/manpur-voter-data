
import React, { useState, useEffect, useRef } from 'react';
import { VoterRecord } from '../types.ts';
import { calculateAgeAsOf2026, formatAadhar } from '../utils/calculations.ts';
import { checkDuplicateAadhar } from '../services/api.ts';
import { extractAadharData } from '../services/ocr.ts';
import CameraModal from './CameraModal.tsx';

interface VoterCardProps {
  voter: VoterRecord;
  onChange: (updatedVoter: VoterRecord) => void;
  onDeleteRequest: (voter: VoterRecord) => void;
  onDuplicateFound: (member: VoterRecord) => void;
}

const VoterCard: React.FC<VoterCardProps> = ({ voter, onChange, onDeleteRequest, onDuplicateFound }) => {
  const [localAadhar, setLocalAadhar] = useState(voter.aadhar || '');
  const [localDob, setLocalDob] = useState(voter.dob || '');
  const [showCamera, setShowCamera] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalAadhar(voter.aadhar || '');
    setLocalDob(voter.dob || '');
  }, [voter.voterNo, voter.aadhar, voter.dob, voter.booth]);

  const handleFieldChange = (field: keyof VoterRecord, value: string) => {
    onChange({ ...voter, [field]: value });
  };

  const performAadharUpdate = async (val: string, currentVoter: VoterRecord) => {
    const cleanedVal = formatAadhar(val);
    setLocalAadhar(cleanedVal);
    
    const updated = { ...currentVoter, aadhar: cleanedVal };
    onChange(updated);

    if (cleanedVal.length === 12) {
      const check = await checkDuplicateAadhar(cleanedVal, currentVoter.voterNo);
      if (check.isDuplicate) {
        onDuplicateFound(check.member);
      }
    }
  };

  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    performAadharUpdate(e.target.value, voter);
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalDob(val);
    const age = calculateAgeAsOf2026(val);
    onChange({ ...voter, dob: val, calculatedAge: age });
  };

  const handlePhotoCaptured = (base64: string) => {
    const voterWithPhoto = { ...voter, aadharPhoto: base64 };
    onChange(voterWithPhoto);
  };

  const handleDeletePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ ...voter, aadharPhoto: undefined });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scale = Math.min(MAX_WIDTH / img.width, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
            handlePhotoCaptured(compressedBase64);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualOCR = async () => {
    if (!voter.aadharPhoto || isExtracting) return;

    setIsExtracting(true);
    try {
      const extracted = await extractAadharData(voter.aadharPhoto);
      
      // CRITICAL: Prepare the update object first
      let updatedVoter = { ...voter };
      let newAadhar = null;
      
      if (extracted.aadhar) {
        newAadhar = formatAadhar(extracted.aadhar);
        setLocalAadhar(newAadhar);
        updatedVoter.aadhar = newAadhar;
      }

      if (extracted.dob) {
        setLocalDob(extracted.dob);
        updatedVoter.dob = extracted.dob;
        updatedVoter.calculatedAge = calculateAgeAsOf2026(extracted.dob);
      }

      // Sync with parent immediately. This ensures that if onDuplicateFound 
      // triggers a re-render, the card props already have the new values.
      onChange(updatedVoter);

      // Now check for duplicates after values are safely stored in parent state
      if (newAadhar && newAadhar.length === 12) {
        const check = await checkDuplicateAadhar(newAadhar, voter.voterNo);
        if (check.isDuplicate) {
          onDuplicateFound(check.member);
        }
      }
    } catch (err) {
      console.error("OCR Extraction failed:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] premium-shadow overflow-hidden border border-slate-50 hover:border-indigo-100 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col h-full relative group">
      {/* Card Header Overlay */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
            <span className="text-white text-xs font-black">{voter.voterNo}</span>
          </div>
          <span className="text-white font-black text-[11px] tracking-[0.2em] uppercase opacity-90">मतदाता विवरण</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${voter.isNew ? 'bg-emerald-500 text-white' : 'bg-white/10 text-indigo-100 border border-white/10'}`}>
            {voter.isNew ? 'नया' : 'डेटाबेस'}
          </span>
          <button onClick={() => onDeleteRequest(voter)} className="text-white/40 hover:text-rose-400 transition-colors p-1.5 hover:bg-white/10 rounded-lg">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
      
      <div className="p-8 space-y-8 flex-grow">
        {/* Top Section: Photo + Basic Name Info */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="relative shrink-0 mx-auto sm:mx-0">
            <div 
              onClick={() => voter.aadharPhoto ? setIsZoomed(true) : setShowCamera(true)}
              className={`relative w-36 h-44 rounded-3xl border-2 transition-all duration-500 overflow-hidden flex items-center justify-center cursor-pointer shadow-inner group/photo ${voter.aadharPhoto ? 'border-indigo-100 bg-slate-900 ring-4 ring-indigo-50/50' : 'border-dashed border-slate-200 bg-slate-50'}`}
            >
              {voter.aadharPhoto ? (
                <>
                  <img src={voter.aadharPhoto} alt="Aadhar" className="w-full h-full object-contain group-hover/photo:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover/photo:opacity-100 flex flex-col items-center justify-center transition-opacity">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    </div>
                  </div>
                  <button 
                    onClick={handleDeletePhoto}
                    className="absolute top-2 right-2 w-8 h-8 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors z-20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </>
              ) : (
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">स्कैन/अपलोड</p>
                </div>
              )}
            </div>
            
            <div className="absolute -bottom-3 -right-3 flex gap-2">
               <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
               />
               <button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-10 h-10 bg-slate-800 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-slate-900 active:scale-90 transition-all border-4 border-white"
                title="फोटो अपलोड करें"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
               </button>
               <button 
                onClick={() => setShowCamera(true)} 
                className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-indigo-700 active:scale-90 transition-all border-4 border-white"
                title="कैमरा खोलें"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               </button>
            </div>
          </div>

          <div className="flex-grow space-y-5 w-full">
            <div className="group/field">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-focus-within/field:text-indigo-600 transition-colors">निर्वाचक का नाम</label>
              <input 
                type="text" 
                value={voter.name} 
                onChange={(e) => handleFieldChange('name', e.target.value)} 
                className="w-full px-6 py-3.5 text-base font-bold text-slate-900 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-200 outline-none transition-all" 
              />
            </div>
            <div className="group/field">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-focus-within/field:text-indigo-600 transition-colors">पिता/पति का नाम</label>
              <input 
                type="text" 
                value={voter.relationName} 
                onChange={(e) => handleFieldChange('relationName', e.target.value)} 
                className="w-full px-6 py-3.5 text-base font-medium text-slate-600 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-200 outline-none transition-all" 
              />
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">लिंग</label>
            <select value={voter.gender} onChange={(e) => handleFieldChange('gender', e.target.value)} className="w-full text-sm font-black bg-transparent text-slate-800 appearance-none text-center cursor-pointer"><option value="पु">पु</option><option value="म">म</option><option value="अन्य">अन्य</option></select>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">आयु</label>
            <input type="number" value={voter.originalAge} onChange={(e) => handleFieldChange('originalAge', e.target.value)} className="w-full text-sm font-black bg-transparent text-slate-800 text-center outline-none" />
          </div>
          <div className="col-span-2 bg-indigo-50/30 p-3 rounded-2xl border border-indigo-100/50 text-center">
            <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">बूथ / वार्ड / मकान</label>
            <p className="text-sm font-black text-indigo-800 truncate">{voter.booth} / {voter.ward || '0'} / {voter.houseNo}</p>
          </div>
        </div>

        {/* ID Details Section */}
        <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
          {/* AI OCR Trigger Button */}
          {voter.aadharPhoto && (
            <div className="flex justify-center -mt-3">
              <button 
                onClick={handleManualOCR}
                disabled={isExtracting}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                  isExtracting 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-indigo-200 hover:scale-105'
                }`}
              >
                {isExtracting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent animate-spin rounded-full" />
                    <span>डेटा निकाला जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span>AI से डेटा भरें</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="relative group/id">
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">आधार संख्या (12 अंक)</label>
              {isExtracting && <span className="text-[10px] font-black text-indigo-600 animate-pulse uppercase tracking-widest">AI सक्रिय...</span>}
            </div>
            <div className="relative">
              <input 
                type="text" 
                value={isExtracting ? "••• ••• ••• •••" : localAadhar}
                onChange={handleAadharChange}
                disabled={isExtracting}
                placeholder="0000 0000 0000"
                className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg font-black tracking-[0.2em] outline-none shadow-sm text-center ${isExtracting ? 'bg-indigo-50/50 border-indigo-100 text-indigo-400' : 'bg-white border-white text-slate-900 focus:border-indigo-600'}`}
              />
              {!isExtracting && localAadhar.length === 12 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 scale-125">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-grow">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">जन्म तिथि</label>
              <input 
                type="date" 
                value={localDob} 
                onChange={handleDobChange} 
                className="w-full px-6 py-4 bg-white border-2 border-white rounded-2xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 text-sm font-bold outline-none transition-all shadow-sm" 
              />
            </div>
            <div className="shrink-0 bg-indigo-600 px-6 py-4 rounded-[1.5rem] flex flex-col items-center justify-center shadow-xl shadow-indigo-100 border-b-4 border-indigo-800 active:translate-y-1 active:border-b-0 transition-all cursor-default">
              <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest opacity-80">आयु 2026</span>
              <span className="text-3xl font-black text-white mt-1 leading-none">{voter.calculatedAge || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {showCamera && <CameraModal onCapture={handlePhotoCaptured} onClose={() => setShowCamera(false)} />}
      
      {isZoomed && voter.aadharPhoto && (
        <div className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6" onClick={() => setIsZoomed(false)}>
          <img src={voter.aadharPhoto} alt="Cropped Aadhar" className="max-w-full max-h-[75vh] rounded-[3rem] shadow-2xl border-4 border-white/20 object-contain card-entry" />
          <div className="mt-10 bg-white/10 backdrop-blur-md px-10 py-4 rounded-full text-white font-black text-sm uppercase tracking-widest border border-white/10">आधार कार्ड का विहंगम दृश्य</div>
          <button className="mt-8 text-white/60 hover:text-white flex items-center gap-2">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             बंद करने के लिए कहीं भी क्लिक करें
          </button>
        </div>
      )}
    </div>
  );
};

export default VoterCard;

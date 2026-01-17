
import React, { useState, useEffect } from 'react';
import { VoterRecord } from '../types.ts';
import { calculateAgeAsOf2026, formatAadhar } from '../utils/calculations.ts';
import { checkDuplicateAadhar } from '../services/api.ts';
import { extractAadharNumber } from '../services/ocr.ts';
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

  useEffect(() => {
    setLocalAadhar(voter.aadhar || '');
    setLocalDob(voter.dob || '');
  }, [voter.voterNo, voter.aadhar, voter.dob, voter.booth]);

  const handleFieldChange = (field: keyof VoterRecord, value: string) => {
    onChange({ ...voter, [field]: value });
  };

  const handleAadharChange = async (e: React.ChangeEvent<HTMLInputElement> | string) => {
    const rawValue = typeof e === 'string' ? e : e.target.value;
    const val = formatAadhar(rawValue);
    setLocalAadhar(val);
    
    const updated = { ...voter, aadhar: val };
    onChange(updated);

    if (val.length === 12) {
      const check = await checkDuplicateAadhar(val, voter.voterNo);
      if (check.isDuplicate) {
        onDuplicateFound(check.member);
      }
    }
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalDob(val);
    const age = calculateAgeAsOf2026(val);
    onChange({ ...voter, dob: val, calculatedAge: age });
  };

  const handlePhotoCaptured = async (base64: string) => {
    onChange({ ...voter, aadharPhoto: base64 });
    
    setIsExtracting(true);
    const extracted = await extractAadharNumber(base64);
    setIsExtracting(false);
    
    if (extracted) {
      handleAadharChange(extracted);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500 flex flex-col h-full relative group">
      {/* Header Info */}
      <div className="bg-indigo-600 px-5 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] font-black">{voter.voterNo}</span>
          </div>
          <span className="text-white font-black text-[10px] tracking-widest uppercase">मतदाता विवरण</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${voter.isNew ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-indigo-400/50 text-white'}`}>
            {voter.isNew ? 'नया' : 'पुराना'}
          </span>
          <button 
            onClick={() => onDeleteRequest(voter)}
            className="text-white/60 hover:text-red-300 transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-5 space-y-5 flex-grow">
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0">
            <div 
              onClick={() => voter.aadharPhoto ? setIsZoomed(true) : setShowCamera(true)}
              className={`relative w-28 h-36 rounded-2xl border-2 transition-all duration-300 overflow-hidden flex items-center justify-center cursor-pointer shadow-inner group/photo ${voter.aadharPhoto ? 'border-indigo-100' : 'border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
            >
              {voter.aadharPhoto ? (
                <>
                  <img src={voter.aadharPhoto} alt="Aadhar" className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-110" />
                  <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover/photo:opacity-100 flex flex-col items-center justify-center transition-opacity gap-1">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    <span className="text-[8px] text-white font-bold uppercase tracking-widest">क्रॉप्ड फोटो</span>
                  </div>
                </>
              ) : (
                <div className="text-center p-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-2 group-hover/photo:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-tight">आधार कार्ड<br/>क्रॉप करें</p>
                </div>
              )}
            </div>
            
            <div className="mt-3 flex gap-2">
               <button onClick={() => setShowCamera(true)} className="flex-1 py-1 bg-indigo-50 text-indigo-700 text-[9px] font-black rounded-lg hover:bg-indigo-100 transition-colors uppercase">स्कैन</button>
               {voter.aadharPhoto && (
                 <button onClick={() => handleFieldChange('aadharPhoto', '')} className="px-2 py-1 bg-red-50 text-red-500 text-[9px] font-black rounded-lg hover:bg-red-100 transition-colors">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 </button>
               )}
            </div>
          </div>

          <div className="flex-grow space-y-4">
            <div>
              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">निर्वाचक का नाम</label>
              <input type="text" value={voter.name} onChange={(e) => handleFieldChange('name', e.target.value)} className="w-full px-4 py-2 text-sm font-bold text-gray-900 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">पिता/पति का नाम</label>
              <input type="text" value={voter.relationName} onChange={(e) => handleFieldChange('relationName', e.target.value)} className="w-full px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
          <div className="text-center">
            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-wider mb-1">लिंग</label>
            <select value={voter.gender} onChange={(e) => handleFieldChange('gender', e.target.value)} className="w-full text-xs font-bold bg-white border rounded-lg py-1.5 text-center appearance-none shadow-sm"><option value="पु">पु</option><option value="म">म</option><option value="अन्य">अन्य</option></select>
          </div>
          <div className="text-center">
            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-wider mb-1">आयु</label>
            <input type="number" value={voter.originalAge} onChange={(e) => handleFieldChange('originalAge', e.target.value)} className="w-full text-xs font-bold bg-white border rounded-lg py-1.5 text-center shadow-sm" />
          </div>
          <div className="text-center">
            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-wider mb-1">बूथ/मकान</label>
            <div className="w-full bg-white border text-indigo-600 rounded-lg py-1.5 text-[10px] font-black shadow-sm">{voter.booth}/{voter.houseNo}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <label className="block text-[10px] font-bold text-gray-500 mb-1.5 px-1">आधार संख्या (12 अंक)</label>
            <div className="relative">
              <input 
                type="text" 
                value={isExtracting ? "एक्सट्रैक्टिंग..." : localAadhar}
                onChange={handleAadharChange}
                disabled={isExtracting}
                placeholder="0000 0000 0000"
                className={`w-full px-5 py-3 border rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-black tracking-[0.2em] outline-none shadow-sm ${isExtracting ? 'bg-indigo-50 text-indigo-400 animate-pulse' : 'bg-gray-50 text-gray-900'}`}
              />
              {!isExtracting && localAadhar.length === 12 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-gray-500 mb-1.5 px-1">जन्म तिथि</label>
              <input type="date" value={localDob} onChange={handleDobChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-[11px] font-bold outline-none shadow-sm" />
            </div>
            <div className="bg-indigo-600 px-4 py-2 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-indigo-600/20 ring-4 ring-indigo-50">
              <span className="text-[8px] font-black text-indigo-200 uppercase tracking-widest">2026 उम्र</span>
              <span className="text-xl font-black text-white mt-1">{voter.calculatedAge || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {showCamera && <CameraModal onCapture={handlePhotoCaptured} onClose={() => setShowCamera(false)} />}

      {isZoomed && voter.aadharPhoto && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4" onClick={() => setIsZoomed(false)}>
          <img src={voter.aadharPhoto} alt="Cropped Aadhar" className="max-w-full max-h-[75vh] rounded-3xl shadow-2xl border-2 border-white/20 object-contain" />
          <div className="mt-8 bg-indigo-600 px-8 py-3 rounded-full text-white font-black text-xs uppercase tracking-widest">क्रॉप्ड आधार कार्ड</div>
        </div>
      )}
    </div>
  );
};

export default VoterCard;

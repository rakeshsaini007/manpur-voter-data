
import React, { useState, useEffect } from 'react';
import { VoterRecord } from '../types.ts';
import { calculateAgeAsOf2026, formatAadhar } from '../utils/calculations.ts';
import { checkDuplicateAadhar } from '../services/api.ts';
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

  useEffect(() => {
    setLocalAadhar(voter.aadhar || '');
    setLocalDob(voter.dob || '');
  }, [voter.voterNo, voter.aadhar, voter.dob]);

  const handleFieldChange = (field: keyof VoterRecord, value: string) => {
    onChange({ ...voter, [field]: value });
  };

  const handleAadharChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = formatAadhar(e.target.value);
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

  const handlePhotoCaptured = (base64: string) => {
    onChange({ ...voter, aadharPhoto: base64 });
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col h-full relative group`}>
      <div className="bg-indigo-600 px-4 py-2.5 flex justify-between items-center">
        <span className="text-white font-black text-xs tracking-wider uppercase">म० क्र०: {voter.voterNo}</span>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${voter.isNew ? 'bg-green-500 text-white' : 'bg-indigo-400 text-white'}`}>
            {voter.isNew ? 'New' : 'Stored'}
          </span>
          <button 
            onClick={() => onDeleteRequest(voter)}
            className="text-white/70 hover:text-red-300 transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-4 flex-grow">
        <div className="flex gap-4 items-start">
          {/* Photo Section */}
          <div className="flex-shrink-0">
            <div 
              onClick={() => voter.aadharPhoto ? setIsZoomed(true) : setShowCamera(true)}
              className="relative w-24 h-32 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center cursor-pointer hover:border-indigo-300 transition-all shadow-inner group/photo"
            >
              {voter.aadharPhoto ? (
                <>
                  <img 
                    src={voter.aadharPhoto} 
                    alt="Aadhar" 
                    className="w-full h-full object-cover transition-transform group-hover/photo:scale-110"
                  />
                  <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                  </div>
                </>
              ) : (
                <div className="text-center p-2">
                  <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-[7px] font-black text-gray-400 mt-2 uppercase tracking-widest">Tap to Scan</p>
                </div>
              )}
            </div>
            <div className="mt-2 flex justify-between">
               <button 
                onClick={() => setShowCamera(true)}
                className="text-[8px] font-black text-indigo-600 uppercase hover:underline"
               >
                 {voter.aadharPhoto ? 'Retake' : 'Scan'}
               </button>
               {voter.aadharPhoto && (
                 <button 
                  onClick={() => handleFieldChange('aadharPhoto', '')}
                  className="text-[8px] font-black text-red-400 uppercase hover:underline"
                 >
                   Clear
                 </button>
               )}
            </div>
          </div>

          <div className="flex-grow space-y-3 pt-1">
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">निर्वाचक का नाम</label>
              <input 
                type="text" 
                value={voter.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full px-3 py-1.5 text-sm font-bold text-gray-900 bg-gray-50/50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none shadow-sm"
                placeholder="नाम"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">पिता/पति का नाम</label>
              <input 
                type="text" 
                value={voter.relationName}
                onChange={(e) => handleFieldChange('relationName', e.target.value)}
                className="w-full px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50/50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none shadow-sm"
                placeholder="सम्बन्धी का नाम"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-50">
          <div className="text-center">
            <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">लिंग</label>
            <select 
              value={voter.gender}
              onChange={(e) => handleFieldChange('gender', e.target.value)}
              className="w-full text-xs font-bold border-none bg-gray-50 rounded-lg p-1.5 outline-none text-center appearance-none"
            >
              <option value="पु">पु</option>
              <option value="म">म</option>
              <option value="अन्य">अन्य</option>
            </select>
          </div>
          <div className="text-center">
            <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">आयु</label>
            <input 
              type="number" 
              value={voter.originalAge}
              onChange={(e) => handleFieldChange('originalAge', e.target.value)}
              className="w-full text-xs font-bold border-none bg-gray-50 rounded-lg p-1.5 outline-none text-center"
            />
          </div>
          <div className="text-center">
            <label className="block text-[8px] font-black text-gray-400 uppercase mb-1">बूथ/मकान</label>
            <div className="w-full bg-indigo-50 text-indigo-700 rounded-lg p-1.5 text-[10px] font-black">
              {voter.booth}/{voter.houseNo}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <label className="block text-[10px] font-bold text-gray-500 mb-1">आधार संख्या (12 अंक)</label>
            <input 
              type="text" 
              value={localAadhar}
              onChange={handleAadharChange}
              placeholder="0000 0000 0000"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold tracking-widest placeholder:text-gray-300 outline-none"
            />
            <div className="absolute right-3 top-[30px]">
              {localAadhar.length === 12 && (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">जन्म तिथि</label>
              <input 
                type="date" 
                value={localDob}
                onChange={handleDobChange}
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-[11px] font-bold outline-none"
              />
            </div>
            <div className="bg-indigo-600 p-2 rounded-lg flex flex-col items-center justify-center shadow-md">
              <span className="text-[8px] font-black text-indigo-200 uppercase tracking-tighter">Jan-2026 Age</span>
              <span className="text-lg font-black text-white leading-none">{voter.calculatedAge || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {showCamera && (
        <CameraModal 
          onCapture={handlePhotoCaptured} 
          onClose={() => setShowCamera(false)} 
        />
      )}

      {/* Enlarged Image Preview Modal */}
      {isZoomed && voter.aadharPhoto && (
        <div 
          className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setIsZoomed(false)}
        >
          <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black">{voter.voterNo}</div>
               <div>
                  <h4 className="text-white font-black uppercase text-sm">{voter.name}</h4>
                  <p className="text-indigo-300 text-[10px] font-bold tracking-widest uppercase">आधार कार्ड प्रीव्यू</p>
               </div>
             </div>
             <button className="bg-white/10 p-3 rounded-full text-white hover:bg-white/20 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
          
          <img 
            src={voter.aadharPhoto} 
            alt="Enlarged Aadhar" 
            className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border-4 border-white/10 object-contain animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          />
          
          <div className="mt-8 bg-white/5 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/10 text-center">
             <p className="text-white font-bold text-sm tracking-widest uppercase">Tap anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoterCard;

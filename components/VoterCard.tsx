
import React, { useState, useEffect } from 'react';
import { VoterRecord } from '../types.ts';
import { calculateAgeAsOf2026, formatAadhar } from '../utils/calculations.ts';
import { checkDuplicateAadhar } from '../services/api.ts';

interface VoterCardProps {
  voter: VoterRecord;
  onChange: (updatedVoter: VoterRecord) => void;
  onDuplicateFound: (member: VoterRecord) => void;
}

const VoterCard: React.FC<VoterCardProps> = ({ voter, onChange, onDuplicateFound }) => {
  const [localAadhar, setLocalAadhar] = useState(voter.aadhar || '');
  const [localDob, setLocalDob] = useState(voter.dob || '');

  // Update local state if voter object changes externally
  useEffect(() => {
    setLocalAadhar(voter.aadhar || '');
    setLocalDob(voter.dob || '');
  }, [voter.voterNo]);

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

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <div className="bg-indigo-600 px-4 py-2 flex justify-between items-center">
        <span className="text-white font-bold text-sm">मतदाता क्रमांक: {voter.voterNo}</span>
        <span className="bg-indigo-400 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
          {voter.isNew ? 'नया सदस्य' : 'मौजूदा सदस्य'}
        </span>
      </div>
      
      <div className="p-5 space-y-4 flex-grow">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">निर्वाचक का नाम</label>
            <input 
              type="text" 
              value={voter.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full px-3 py-1.5 text-sm font-semibold text-gray-900 border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
              placeholder="नाम भरें"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">पिता/पति का नाम</label>
            <input 
              type="text" 
              value={voter.relationName}
              onChange={(e) => handleFieldChange('relationName', e.target.value)}
              className="w-full px-3 py-1.5 text-sm font-medium text-gray-900 border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
              placeholder="रिश्तेदार का नाम भरें"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-50">
          <div className="text-center">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">लिंग</label>
            <select 
              value={voter.gender}
              onChange={(e) => handleFieldChange('gender', e.target.value)}
              className="w-full text-xs font-medium border-none bg-gray-50 rounded p-1 outline-none text-center"
            >
              <option value="पु">पु</option>
              <option value="म">म</option>
              <option value="अन्य">अन्य</option>
            </select>
          </div>
          <div className="text-center">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">वर्तमान आयु</label>
            <input 
              type="number" 
              value={voter.originalAge}
              onChange={(e) => handleFieldChange('originalAge', e.target.value)}
              className="w-full text-xs font-medium border-none bg-gray-50 rounded p-1 outline-none text-center"
            />
          </div>
          <div className="text-center">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">बूथ/मकान</label>
            <p className="text-xs font-bold text-gray-500 mt-1">{voter.booth}/{voter.houseNo}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">आधार संख्या (12 Digit)</label>
            <input 
              type="text" 
              value={localAadhar}
              onChange={handleAadharChange}
              placeholder="0000 0000 0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">जन्म तिथि</label>
            <input 
              type="date" 
              value={localDob}
              onChange={handleDobChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
            />
          </div>
          <div className="bg-gray-50 p-2 rounded-md border border-dashed border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase">01-Jan-2026 को उम्र:</span>
              <span className="text-lg font-bold text-indigo-700">{voter.calculatedAge || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoterCard;

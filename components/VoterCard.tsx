
import React, { useState } from 'react';
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
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
      <div className="bg-indigo-600 px-4 py-2 flex justify-between items-center">
        <span className="text-white font-bold text-sm">मतदाता क्रमांक: {voter.voterNo}</span>
        <span className="bg-indigo-400 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
          {voter.isNew ? 'नया सदस्य' : 'मौजूदा सदस्य'}
        </span>
      </div>
      
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">निर्वाचक का नाम</label>
            <p className="text-gray-900 font-semibold">{voter.name || '—'}</p>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">पिता/पति का नाम</label>
            <p className="text-gray-900 font-medium">{voter.relationName || '—'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-50">
          <div className="text-center">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">लिंग</label>
            <p className="text-sm font-medium">{voter.gender || '—'}</p>
          </div>
          <div className="text-center">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">वर्तमान आयु</label>
            <p className="text-sm font-medium">{voter.originalAge || '—'}</p>
          </div>
          <div className="text-center">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">बूथ/मकान</label>
            <p className="text-sm font-medium">{voter.booth}/{voter.houseNo}</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">जन्म तिथि</label>
            <input 
              type="date" 
              value={localDob}
              onChange={handleDobChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
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

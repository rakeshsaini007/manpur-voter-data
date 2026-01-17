
import React from 'react';
import { VoterRecord } from '../types';

interface DuplicateModalProps {
  member: VoterRecord | null;
  onClose: () => void;
}

const DuplicateModal: React.FC<DuplicateModalProps> = ({ member, onClose }) => {
  if (!member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
        <div className="bg-red-500 p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white uppercase tracking-wider">डुप्लिकेट आधार चेतावनी!</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-center leading-relaxed">
            यह आधार संख्या पहले से ही डेटाबेस में किसी अन्य मतदाता के साथ जुड़ी हुई है।
          </p>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <span className="text-gray-400 font-semibold uppercase">नाम:</span>
              <span className="text-gray-900 font-bold">{member.name}</span>
              
              <span className="text-gray-400 font-semibold uppercase">मतदाता क्रमांक:</span>
              <span className="text-gray-900 font-bold">{member.voterNo}</span>
              
              <span className="text-gray-400 font-semibold uppercase">मकान नं०:</span>
              <span className="text-gray-900 font-bold">{member.houseNo}</span>
              
              <span className="text-gray-400 font-semibold uppercase">बूथ संख्या:</span>
              <span className="text-gray-900 font-bold">{member.booth}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg active:transform active:scale-95"
          >
            ठीक है
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateModal;

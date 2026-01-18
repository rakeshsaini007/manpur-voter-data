
import React from 'react';
import { VoterRecord } from '../types';

interface DuplicateModalProps {
  member: VoterRecord | null;
  onClose: () => void;
}

const DuplicateModal: React.FC<DuplicateModalProps> = ({ member, onClose }) => {
  if (!member) return null;

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden transform transition-all relative card-entry"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Icon Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors text-slate-500 hover:text-slate-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="bg-rose-500 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md text-white mb-4 border border-white/30 shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-widest leading-none">डुप्लिकेट आधार!</h3>
          <p className="text-rose-100 text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-80">डेटाबेस सुरक्षा चेतावनी</p>
        </div>

        <div className="p-8 space-y-6">
          <p className="text-slate-600 text-center font-medium leading-relaxed">
            यह आधार संख्या पहले से ही डेटाबेस में किसी अन्य मतदाता के साथ जुड़ी हुई है।
          </p>

          <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">नाम</span>
                <span className="text-sm font-black text-slate-900">{member.name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">मतदाता क्रमांक</span>
                <span className="text-sm font-black text-slate-900">#{member.voterNo}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">मकान नं०</span>
                <span className="text-sm font-black text-slate-900">{member.houseNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">बूथ संख्या</span>
                <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{member.booth}</span>
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">बंद करने के लिए कहीं भी क्लिक करें</p>
        </div>
      </div>
    </div>
  );
};

export default DuplicateModal;

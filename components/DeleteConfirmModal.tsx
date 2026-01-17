
import React, { useState } from 'react';
import { VoterRecord } from '../types.ts';

interface DeleteConfirmModalProps {
  voter: VoterRecord | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const DELETE_REASONS = ['शादी', 'मृत्यु', 'डुप्लीकेट', 'पलायन'];

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ voter, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');

  if (!voter) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="bg-red-50 p-6 border-b border-red-100">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-800 text-center">सदस्य हटाएं</h3>
          <p className="text-sm text-red-600 text-center mt-1">
            क्या आप वाकई <b>{voter.name || 'इस सदस्य'}</b> को हटाना चाहते हैं?
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">हटाने का कारण चुनें</label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-gray-700 font-medium"
            >
              <option value="">कारण चुनें...</option>
              {DELETE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95"
            >
              रद्द करें
            </button>
            <button 
              onClick={() => onConfirm(reason)}
              disabled={!reason}
              className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200"
            >
              हटाएं
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

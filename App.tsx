
import React, { useState, useCallback, useEffect } from 'react';
import { VoterRecord } from './types.ts';
import { searchVoters, saveVoters, getMetadata, deleteVoter, searchVotersByName } from './services/api.ts';
import VoterCard from './components/VoterCard.tsx';
import DuplicateModal from './components/DuplicateModal.tsx';
import DeleteConfirmModal from './components/DeleteConfirmModal.tsx';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

const App: React.FC = () => {
  const [booth, setBooth] = useState('');
  const [ward, setWard] = useState('');
  const [house, setHouse] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  
  const [boothOptions, setBoothOptions] = useState<string[]>([]);
  const [wardMap, setWardMap] = useState<Record<string, string[]>>({});
  const [houseMap, setHouseMap] = useState<Record<string, string[]>>({});
  
  const [voters, setVoters] = useState<VoterRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [duplicateMember, setDuplicateMember] = useState<VoterRecord | null>(null);
  const [voterToDelete, setVoterToDelete] = useState<VoterRecord | null>(null);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchMeta = useCallback(async () => {
    setMetaLoading(true);
    const res = await getMetadata();
    if (res.success) {
      setBoothOptions(res.booths || []);
      setWardMap(res.wardMap || {});
      setHouseMap(res.houseMap || {});
    } else {
      showToast(res.error || 'कनेक्शन विफल', 'error');
    }
    setMetaLoading(false);
  }, []);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!booth || !house) return;
    
    setLoading(true);
    setSearchTriggered(true);
    setNameQuery(''); 
    const response = await searchVoters(booth, ward, house);
    if (response.success) {
      setVoters(response.data);
      if(response.data.length === 0) showToast('कोई परिणाम नहीं मिला', 'info');
    } else {
      showToast(response.error || 'खोज विफल रही', 'error');
      setVoters([]);
    }
    setLoading(false);
  };

  const handleNameSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nameQuery.trim()) return;

    setLoading(true);
    setSearchTriggered(true);
    setBooth('');
    setWard('');
    setHouse('');
    
    const response = await searchVotersByName(nameQuery.trim());
    if (response.success) {
      setVoters(response.data);
      if(response.data.length === 0) showToast('कोई परिणाम नहीं मिला', 'info');
    } else {
      showToast(response.error || 'नाम से खोज विफल रही', 'error');
      setVoters([]);
    }
    setLoading(false);
  };

  const clearResults = () => {
    setVoters([]);
    setSearchTriggered(false);
    setBooth('');
    setWard('');
    setHouse('');
    setNameQuery('');
  };

  const updateVoter = useCallback((updated: VoterRecord) => {
    setVoters(prev => prev.map(v => v.voterNo === updated.voterNo && v.booth === updated.booth ? updated : v));
  }, []);

  const handleDeleteVoter = useCallback(async (reason: string) => {
    if (!voterToDelete) return;
    const vNo = voterToDelete.voterNo;
    const vBooth = voterToDelete.booth;
    if (voterToDelete.isNew) {
      setVoters(prev => prev.filter(v => !(v.voterNo === vNo && v.booth === vBooth)));
      setVoterToDelete(null);
      showToast('नया रिकॉर्ड हटाया गया');
      return;
    }
    setLoading(true);
    const result = await deleteVoter(vBooth, vNo, reason);
    setLoading(false);
    if (result.success) {
      setVoters(prev => prev.filter(v => !(v.voterNo === vNo && v.booth === vBooth)));
      showToast('रिकॉर्ड सफलतापूर्वक हटाया गया');
    } else {
      showToast('हटाने में त्रुटि', 'error');
    }
    setVoterToDelete(null);
  }, [voterToDelete]);

  const addNewMember = () => {
    if (!booth || !house) {
      showToast('पहले बूथ और मकान चुनें', 'info');
      return;
    }
    const nextVoterNo = voters.length > 0 
      ? (Math.max(...voters.map(v => parseInt(v.voterNo) || 0)) + 1).toString()
      : '1';
    
    const newVoter: VoterRecord = {
      booth, 
      ward,
      houseNo: house, 
      voterNo: nextVoterNo, 
      name: '', 
      relationName: '', 
      gender: 'पु', 
      originalAge: '0', 
      aadhar: '', 
      dob: '', 
      calculatedAge: '', 
      isNew: true
    };
    setVoters(prev => [newVoter, ...prev]);
    showToast('नया सदस्य जोड़ा गया', 'success');
  };

  const handleSave = async () => {
    if (voters.length === 0) return;
    setSaving(true);
    const result = await saveVoters(voters);
    if (result.success) {
      showToast('डेटा सफलतापूर्वक सहेजा गया!', 'success');
    } else {
      showToast(result.message || 'सहेजने में त्रुटि', 'error');
    }
    setSaving(false);
  };

  const wardOptions = booth ? wardMap[booth] || [] : [];
  const houseOptions = (booth !== '') ? houseMap[`${booth}_${ward}`] || [] : [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Premium Toast Notification */}
      {toast && (
        <div className={`fixed top-0 left-1/2 -translate-x-1/2 z-[300] toast-animation w-[90%] max-w-sm`}>
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-l-4 glass-panel ${
            toast.type === 'success' ? 'border-emerald-500' : 
            toast.type === 'error' ? 'border-rose-500' : 'border-indigo-500'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
              toast.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
            }`}>
              {toast.type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
              {toast.type === 'error' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>}
              {toast.type === 'info' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            </div>
            <p className="text-slate-800 font-bold text-sm tracking-tight">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="bg-indigo-950 text-white relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-5 cursor-pointer group" onClick={clearResults}>
              <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 group-hover:scale-105 transition-transform">
                <svg className="w-8 h-8 text-indigo-300" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 12V8h2v4H9zm0 2h2v2H9v-2z" /></svg>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight leading-none">ELECTION PRO</h1>
                <p className="text-indigo-400 text-xs font-bold tracking-[0.2em] uppercase mt-1 opacity-80">Premium Management Suite</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <form onSubmit={handleNameSearch} className="flex-grow md:w-96 flex items-center gap-3">
                <div className="relative flex-grow group">
                  <input 
                    type="text" 
                    placeholder="नाम या पिता के नाम से खोजें..." 
                    value={nameQuery} 
                    onChange={e => setNameQuery(e.target.value)} 
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 text-white placeholder-indigo-400 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 transition-all text-sm"
                  />
                  <svg className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <button 
                  type="submit" 
                  disabled={loading || !nameQuery.trim()}
                  className="p-3.5 bg-indigo-600 border border-indigo-500 rounded-2xl text-white hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-900/20"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              </form>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex flex-wrap items-stretch gap-4">
            <div className="flex flex-grow items-center gap-4 bg-indigo-900/30 p-2 rounded-3xl border border-indigo-800/50 backdrop-blur-md">
              <div className="flex-1 flex flex-col px-4 group">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">बूथ संख्या</label>
                <select 
                  value={booth} 
                  onChange={e => { setBooth(e.target.value); setWard(''); setHouse(''); }} 
                  className="bg-transparent text-white text-lg font-bold outline-none cursor-pointer"
                  required 
                  disabled={metaLoading}
                >
                  <option value="" className="bg-indigo-950">चुनें</option>
                  {boothOptions.map(b => <option key={b} value={b} className="bg-indigo-950">{b}</option>)}
                </select>
              </div>
              <div className="w-px h-10 bg-indigo-800" />
              <div className="flex-1 flex flex-col px-4 group">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">वार्ड</label>
                <select 
                  value={ward} 
                  onChange={e => { setWard(e.target.value); setHouse(''); }} 
                  className="bg-transparent text-white text-lg font-bold outline-none cursor-pointer"
                  disabled={!booth || metaLoading || wardOptions.length === 0}
                >
                  <option value="" className="bg-indigo-950">{wardOptions.length === 0 ? "N/A" : "चुनें"}</option>
                  {wardOptions.map((w, i) => <option key={i} value={w} className="bg-indigo-950">{w || "Standard"}</option>)}
                </select>
              </div>
              <div className="w-px h-10 bg-indigo-800" />
              <div className="flex-1 flex flex-col px-4 group">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">मकान नं०</label>
                <select 
                  value={house} 
                  onChange={e => setHouse(e.target.value)} 
                  className="bg-transparent text-white text-lg font-bold outline-none cursor-pointer"
                  required 
                  disabled={!booth || metaLoading}
                >
                  <option value="" className="bg-indigo-950">चुनें</option>
                  {houseOptions.map((h, i) => <option key={i} value={h} className="bg-indigo-950">{h}</option>)}
                </select>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading || !booth || !house} 
              className="px-10 bg-white text-indigo-950 font-black text-lg rounded-3xl hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_15px_30px_-5px_rgba(255,255,255,0.2)]"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-3 border-indigo-950 border-t-transparent animate-spin rounded-full" />
                  <span>खोज जारी...</span>
                </div>
              ) : 'खोजें'}
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-6 md:p-10 space-y-10">
        {metaLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
             </div>
             <p className="text-indigo-900 font-black tracking-widest uppercase text-sm animate-pulse">डेटाबेस तैयार किया जा रहा है...</p>
          </div>
        ) : searchTriggered && voters.length === 0 && !loading ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center premium-shadow border border-slate-100 max-w-2xl mx-auto card-entry">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-3xl font-black text-slate-800">कोई डेटा नहीं मिला!</h2>
            <p className="text-slate-500 mt-4 font-medium">चयनित विवरण के लिए कोई रिकॉर्ड उपलब्ध नहीं है। आप नया सदस्य जोड़ सकते हैं।</p>
            <button 
              onClick={addNewMember} 
              className="mt-10 px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
            >
              नया सदस्य जोड़ें
            </button>
          </div>
        ) : voters.length > 0 && (
          <div className="space-y-8 pb-32">
            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 border-b border-slate-100 pb-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">मतदाता सूची</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">{voters.length} कुल रिकॉर्ड पाए गए</p>
                </div>
              </div>
              {booth && house && (
                <button 
                  onClick={addNewMember} 
                  className="flex items-center gap-3 px-6 py-3 bg-indigo-50 text-indigo-700 font-black rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all active:scale-95 shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                  सदस्य जोड़ें
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {voters.map((voter, index) => (
                <div key={`${voter.booth}-${voter.voterNo}`} className="card-entry" style={{ animationDelay: `${index * 0.1}s` }}>
                  <VoterCard 
                    voter={voter} 
                    onChange={updateVoter} 
                    onDeleteRequest={setVoterToDelete} 
                    onDuplicateFound={setDuplicateMember} 
                  />
                </div>
              ))}
            </div>

            {/* Bottom Floating Action Bar */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[50] w-full max-w-sm px-6">
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className={`w-full py-5 rounded-[2rem] text-white font-black text-xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-4 ${
                  saving ? 'bg-slate-400 cursor-not-allowed scale-95' : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:scale-105 active:scale-95'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white animate-spin rounded-full" />
                    <span>डेटा सुरक्षित हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    <span>डेटा सहेजें</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <DuplicateModal member={duplicateMember} onClose={() => setDuplicateMember(null)} />
      <DeleteConfirmModal voter={voterToDelete} onClose={() => setVoterToDelete(null)} onConfirm={handleDeleteVoter} />
    </div>
  );
};

export default App;

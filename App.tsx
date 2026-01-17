
import React, { useState, useCallback, useEffect } from 'react';
import { VoterRecord } from './types.ts';
import { searchVoters, saveVoters, getMetadata, deleteVoter, searchVotersByName } from './services/api.ts';
import VoterCard from './components/VoterCard.tsx';
import DuplicateModal from './components/DuplicateModal.tsx';
import DeleteConfirmModal from './components/DeleteConfirmModal.tsx';
import { GAS_DEPLOY_URL as DEFAULT_URL } from './constants.ts';

const App: React.FC = () => {
  const [booth, setBooth] = useState('');
  const [house, setHouse] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [boothOptions, setBoothOptions] = useState<string[]>([]);
  const [houseMap, setHouseMap] = useState<Record<string, string[]>>({});
  const [voters, setVoters] = useState<VoterRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [duplicateMember, setDuplicateMember] = useState<VoterRecord | null>(null);
  const [voterToDelete, setVoterToDelete] = useState<VoterRecord | null>(null);
  const [searchTriggered, setSearchTriggered] = useState(false);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(localStorage.getItem('voter_script_url') || DEFAULT_URL);

  const fetchMeta = useCallback(async () => {
    setMetaLoading(true);
    const res = await getMetadata();
    if (res.success) {
      setBoothOptions(res.booths);
      setHouseMap(res.houseMap);
    } else {
      // If metadata fails, it's a good sign the URL is wrong
      if (!localStorage.getItem('voter_script_url')) {
        setShowSettings(true);
      }
    }
    setMetaLoading(false);
  }, []);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  const handleSaveSettings = () => {
    localStorage.setItem('voter_script_url', tempUrl);
    setShowSettings(false);
    window.location.reload(); // Reload to apply new URL to all services
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!booth || !house) return;
    
    setLoading(true);
    setSearchTriggered(true);
    setNameQuery(''); 
    const response = await searchVoters(booth, house);
    if (response.success) {
      setVoters(response.data);
    } else {
      alert(response.error || 'खोज विफल रही');
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
    setHouse('');
    
    const response = await searchVotersByName(nameQuery.trim());
    if (response.success) {
      setVoters(response.data);
    } else {
      alert(response.error || 'नाम से खोज विफल रही');
      setVoters([]);
    }
    setLoading(false);
  };

  const clearResults = () => {
    setVoters([]);
    setSearchTriggered(false);
    setBooth('');
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
      return;
    }

    setLoading(true);
    const result = await deleteVoter(vBooth, vNo, reason);
    setLoading(false);
    
    if (result.success) {
      setVoters(prev => prev.filter(v => !(v.voterNo === vNo && v.booth === vBooth)));
      alert(`सदस्य को सफलतापूर्वक हटाया गया। कारण: ${reason}`);
    } else {
      alert('सदस्य को हटाने में त्रुटि हुई।');
    }
    setVoterToDelete(null);
  }, [voterToDelete]);

  const addNewMember = () => {
    if (!booth || !house) {
      alert('नया सदस्य जोड़ने के लिए पहले बूथ संख्या और मकान संख्या चुनें।');
      return;
    }

    const nextVoterNo = voters.length > 0 
      ? (Math.max(...voters.map(v => parseInt(v.voterNo) || 0)) + 1).toString()
      : '1';

    const newVoter: VoterRecord = {
      booth,
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
    setVoters(prev => [...prev, newVoter]);
  };

  const handleSave = async () => {
    if (voters.length === 0) return;
    
    const invalidAadhar = voters.some(v => v.aadhar && v.aadhar.length !== 12);
    if (invalidAadhar) {
      alert('कृपया सभी आधार नंबर 12 अंकों के भरें।');
      return;
    }

    setSaving(true);
    const result = await saveVoters(voters);
    if (result.success) {
      alert('डेटा सफलतापूर्वक सहेजा/अपडेट किया गया है।');
      if (booth && house) {
        handleSearch();
      } else if (nameQuery) {
        handleNameSearch();
      }
    } else {
      alert(result.message || 'सहेजने में त्रुटि।');
    }
    setSaving(false);
  };

  const houseOptions = booth ? houseMap[booth] || [] : [];
  const hasExistingData = voters.some(v => v.aadhar || v.dob);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFF]">
      <header className="bg-indigo-950 text-white shadow-2xl px-6 py-8 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-5 group cursor-pointer" onClick={clearResults}>
              <div className="p-3 bg-white rounded-2xl shadow-xl transition-transform group-hover:rotate-12">
                <svg className="w-10 h-10 text-indigo-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight uppercase leading-none">Election Hub</h1>
                <p className="text-indigo-400 text-xs font-bold tracking-[0.2em] uppercase mt-1">निर्वाचन डेटा पोर्टल</p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <form onSubmit={handleNameSearch} className="flex-grow md:w-80 relative">
                <input 
                  type="text" 
                  placeholder="नाम से खोजें..." 
                  value={nameQuery} 
                  onChange={e => setNameQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 text-white placeholder-indigo-300 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/20 transition-all shadow-inner font-medium"
                />
                <svg className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </form>
              
              <button 
                onClick={() => setShowSettings(true)}
                className="p-3.5 bg-white/10 border border-white/20 rounded-2xl text-white hover:bg-white/20 transition-all active:scale-95 shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4 p-2 bg-indigo-900/50 rounded-3xl border border-white/10 shadow-2xl">
            <div className="flex-grow sm:flex-grow-0 flex items-center gap-2 bg-indigo-950 p-1.5 rounded-2xl border border-indigo-800 shadow-inner">
              <select 
                value={booth} 
                onChange={e => { setBooth(e.target.value); setHouse(''); }}
                className="appearance-none px-6 py-3 bg-transparent text-white rounded-xl outline-none focus:ring-0 min-w-[140px] font-bold cursor-pointer text-sm"
                required
                disabled={metaLoading}
              >
                <option value="" className="bg-indigo-950">बूथ संख्या</option>
                {boothOptions.map(b => <option key={b} value={b} className="bg-indigo-950">{b}</option>)}
              </select>
              <div className="w-px h-8 bg-indigo-800" />
              <select 
                value={house} 
                onChange={e => setHouse(e.target.value)}
                className="appearance-none px-6 py-3 bg-transparent text-white rounded-xl outline-none focus:ring-0 min-w-[140px] font-bold cursor-pointer text-sm"
                required
                disabled={!booth || metaLoading}
              >
                <option value="" className="bg-indigo-950">मकान नं०</option>
                {houseOptions.map(h => <option key={h} value={h} className="bg-indigo-950">{h}</option>)}
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading || !booth || !house}
              className="flex-grow sm:flex-grow-0 px-10 py-4 bg-white text-indigo-950 font-black rounded-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl active:scale-95 uppercase tracking-widest text-xs"
            >
              {loading ? <div className="w-5 h-5 border-3 border-indigo-950 border-t-transparent animate-spin rounded-full" /> : 'खोजें (Search)'}
            </button>

            {searchTriggered && (
              <button 
                type="button"
                onClick={clearResults}
                className="px-6 py-4 bg-indigo-800/50 text-indigo-200 font-bold rounded-2xl hover:bg-indigo-800 hover:text-white transition-all border border-indigo-700 active:scale-95 text-xs uppercase"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto w-full p-8">
        {metaLoading && !showSettings && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
             <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent animate-spin rounded-full"></div>
             <p className="text-indigo-600 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Sheet Data...</p>
          </div>
        )}

        {searchTriggered && voters.length === 0 && !loading && (
          <div className="bg-white rounded-[2rem] p-16 text-center border-2 border-dashed border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <svg className="w-12 h-12 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">कोई रिकॉर्ड नहीं मिला</h2>
            <p className="text-gray-400 mt-3 font-medium">इस स्थान के लिए कोई सदस्य मौजूद नहीं है। नया सदस्य जोड़ें।</p>
            {(booth && house) && (
              <button 
                onClick={addNewMember} 
                className="mt-10 px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl active:scale-95 ring-8 ring-indigo-50 uppercase tracking-widest text-xs"
              >
                इस मकान ({house}) में सदस्य जोड़ें
              </button>
            )}
          </div>
        )}

        {voters.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-12 bg-indigo-600 rounded-full"></div>
                <div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                    {booth && house ? (
                      <>मकान: <span className="text-indigo-600">{house}</span>, बूथ: <span className="text-indigo-600">{booth}</span></>
                    ) : (
                      <>परिणाम: <span className="text-indigo-600">"{nameQuery}"</span></>
                    )}
                  </h2>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">{voters.length} सदस्य उपलब्ध</p>
                </div>
              </div>
              {booth && house && (
                <button 
                  onClick={addNewMember}
                  className="flex items-center gap-3 px-6 py-3 bg-white text-indigo-700 font-black rounded-2xl hover:bg-indigo-50 transition-all border-2 border-indigo-100 shadow-xl active:scale-95 uppercase text-xs tracking-widest"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                  सदस्य जोड़ें
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {voters.map((voter) => (
                <VoterCard 
                  key={`${voter.booth}-${voter.voterNo}`} 
                  voter={voter} 
                  onChange={updateVoter}
                  onDeleteRequest={setVoterToDelete}
                  onDuplicateFound={setDuplicateMember}
                />
              ))}
            </div>

            <div className="sticky bottom-10 mt-12 flex justify-center z-40">
              <button 
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-4 px-14 py-5 rounded-[2rem] text-white font-black text-xl shadow-[0_20px_50px_rgba(34,197,94,0.3)] transition-all transform hover:scale-110 active:scale-95 ring-8 ring-white ${saving ? 'bg-gray-400 scale-95 shadow-none' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {saving ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent animate-spin rounded-full" />
                    सहेजा जा रहा है...
                  </div>
                ) : (
                  <>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    {hasExistingData ? 'डेटा अपडेट करें' : 'डेटा सुरक्षित करें'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 py-12 px-6 text-center">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
           <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.45l7.7 13.55H4.3L12 5.45zM11 13v-3h2v3h-2zm0 4v-2h2v2h-2z" /></svg>
           </div>
           <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em]">Election Voter Management System © 2025 • Secure Cloud Sync</p>
        </div>
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-indigo-950/80 backdrop-blur-xl p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-indigo-100">
             <div className="bg-indigo-600 p-10 text-white relative">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                  <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" /></svg>
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight">Backend Settings</h3>
                <p className="text-indigo-200 text-sm font-bold mt-2 uppercase tracking-widest">अपना Google Script URL यहाँ पेस्ट करें</p>
             </div>
             <div className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-1">Google Apps Script Web App URL</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      value={tempUrl}
                      onChange={e => setTempUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:bg-white transition-all text-sm font-bold text-gray-800 placeholder:text-gray-300 outline-none"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-200 group-focus-within:text-indigo-600 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.803a4 4 0 015.656 0l4 4a4 4 0 11-5.656 5.656l-1.1-1.1" /></svg>
                    </div>
                  </div>
                  <p className="text-[10px] text-indigo-400 font-bold px-2 uppercase tracking-wider">Note: 'Execute as Me' और 'Access Anyone' के साथ Deploy करें।</p>
                </div>
                
                <div className="flex gap-4 pt-4">
                   <button 
                    onClick={() => setShowSettings(false)}
                    className="flex-1 py-4 bg-gray-50 text-gray-400 font-black rounded-2xl hover:bg-gray-100 transition-all active:scale-95 uppercase text-xs tracking-widest"
                   >
                     Cancel
                   </button>
                   <button 
                    onClick={handleSaveSettings}
                    className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-2xl active:scale-95 uppercase text-xs tracking-widest ring-4 ring-indigo-50"
                   >
                     Save & Connect
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      <DuplicateModal 
        member={duplicateMember} 
        onClose={() => setDuplicateMember(null)} 
      />

      <DeleteConfirmModal 
        voter={voterToDelete}
        onClose={() => setVoterToDelete(null)}
        onConfirm={handleDeleteVoter}
      />
    </div>
  );
};

export default App;

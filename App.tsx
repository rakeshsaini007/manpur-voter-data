
import React, { useState, useCallback, useEffect } from 'react';
import { VoterRecord } from './types.ts';
import { searchVoters, saveVoters, getMetadata, deleteVoter, searchVotersByName } from './services/api.ts';
import VoterCard from './components/VoterCard.tsx';
import DuplicateModal from './components/DuplicateModal.tsx';
import DeleteConfirmModal from './components/DeleteConfirmModal.tsx';
import { GAS_DEPLOY_URL as DEFAULT_URL } from './constants.ts';

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
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(localStorage.getItem('voter_script_url') || DEFAULT_URL);

  const fetchMeta = useCallback(async () => {
    setMetaLoading(true);
    const res = await getMetadata();
    if (res.success) {
      setBoothOptions(res.booths || []);
      setWardMap(res.wardMap || {});
      setHouseMap(res.houseMap || {});
    }
    setMetaLoading(false);
  }, []);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  const handleSaveSettings = () => {
    localStorage.setItem('voter_script_url', tempUrl);
    setShowSettings(false);
    window.location.reload(); 
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!booth || !house) return;
    
    setLoading(true);
    setSearchTriggered(true);
    setNameQuery(''); 
    const response = await searchVoters(booth, ward, house);
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
    setWard('');
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
      return;
    }
    setLoading(true);
    const result = await deleteVoter(vBooth, vNo, reason);
    setLoading(false);
    if (result.success) {
      setVoters(prev => prev.filter(v => !(v.voterNo === vNo && v.booth === vBooth)));
    }
    setVoterToDelete(null);
  }, [voterToDelete]);

  const addNewMember = () => {
    if (!booth || !house) {
      alert('नया सदस्य जोड़ने के लिए पहले बूथ, वार्ड और मकान संख्या चुनें।');
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
    setVoters(prev => [...prev, newVoter]);
  };

  const handleSave = async () => {
    if (voters.length === 0) return;
    setSaving(true);
    const result = await saveVoters(voters);
    if (result.success) {
      alert('डेटा सफलतापूर्वक सहेजा/अपडेट किया गया है।');
    } else {
      alert(result.message || 'सहेजने में त्रुटि।');
    }
    setSaving(false);
  };

  const wardOptions = booth ? wardMap[booth] || [] : [];
  const houseOptions = (booth !== '') ? houseMap[`${booth}_${ward}`] || [] : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-indigo-950 text-white shadow-xl px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={clearResults}>
              <div className="p-2 bg-white rounded-xl shadow-inner">
                <svg className="w-8 h-8 text-indigo-900" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 12V8h2v4H9zm0 2h2v2H9v-2z" /></svg>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight uppercase">Election Portal</h1>
                <p className="text-indigo-400 text-[10px] font-bold tracking-widest uppercase">निर्वाचन डेटा प्रबंधन</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <form onSubmit={handleNameSearch} className="flex-grow md:w-80 relative">
                <input type="text" placeholder="नाम से खोजें..." value={nameQuery} onChange={e => setNameQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 text-white placeholder-indigo-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400" />
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </form>
              <button onClick={() => setShowSettings(true)} className="p-2.5 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-indigo-900/50 p-1.5 rounded-xl border border-indigo-800 shadow-inner">
              <select value={booth} onChange={e => { setBooth(e.target.value); setWard(''); setHouse(''); }} className="appearance-none px-4 py-2 bg-transparent text-white rounded-lg outline-none w-32 font-medium cursor-pointer" required disabled={metaLoading}>
                <option value="" className="bg-indigo-950">बूथ</option>
                {boothOptions.map(b => <option key={b} value={b} className="bg-indigo-950">{b}</option>)}
              </select>
              <div className="w-px h-6 bg-indigo-800" />
              <select value={ward} onChange={e => { setWard(e.target.value); setHouse(''); }} className="appearance-none px-4 py-2 bg-transparent text-white rounded-lg outline-none w-32 font-medium cursor-pointer" disabled={!booth || metaLoading || wardOptions.length === 0}>
                <option value="" className="bg-indigo-950">{wardOptions.length === 0 ? "वार्ड (N/A)" : "वार्ड"}</option>
                {wardOptions.map((w, i) => <option key={i} value={w} className="bg-indigo-950">{w || "Standard"}</option>)}
              </select>
              <div className="w-px h-6 bg-indigo-800" />
              <select value={house} onChange={e => setHouse(e.target.value)} className="appearance-none px-4 py-2 bg-transparent text-white rounded-lg outline-none w-32 font-medium cursor-pointer" required disabled={!booth || metaLoading}>
                <option value="" className="bg-indigo-950">मकान</option>
                {houseOptions.map((h, i) => <option key={i} value={h} className="bg-indigo-950">{h}</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading || !booth || !house} className="px-8 py-3 bg-white text-indigo-950 font-bold rounded-xl hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-indigo-950 border-t-transparent animate-spin rounded-full" /> : 'खोजें'}
            </button>
          </form>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto w-full p-6">
        {metaLoading && <div className="text-center py-20 text-indigo-600 font-bold animate-pulse">Loading Database...</div>}
        
        {searchTriggered && voters.length === 0 && !loading && (
          <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100">
            <h2 className="text-xl font-bold text-gray-700">कोई रिकॉर्ड नहीं मिला</h2>
            <button onClick={addNewMember} className="mt-6 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">नया सदस्य जोड़ें</button>
          </div>
        )}

        {voters.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">मतदाता सूची ({voters.length})</h2>
              {booth && house && (
                <button onClick={addNewMember} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  सदस्य जोड़ें
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {voters.map((voter) => (
                <VoterCard key={`${voter.booth}-${voter.voterNo}`} voter={voter} onChange={updateVoter} onDeleteRequest={setVoterToDelete} onDuplicateFound={setDuplicateMember} />
              ))}
            </div>

            <div className="sticky bottom-6 mt-8 flex justify-center z-40">
              <button onClick={handleSave} disabled={saving} className={`px-10 py-4 rounded-full text-white font-black text-lg shadow-2xl transition-all ${saving ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
                {saving ? 'सहेजा जा रहा है...' : 'डेटा सहेजें'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden">
             <div className="bg-indigo-600 p-8 text-white">
                <h3 className="text-2xl font-black">Backend Settings</h3>
                <p className="text-indigo-100 text-sm mt-1">Paste your Google Script URL here</p>
             </div>
             <div className="p-8 space-y-6">
                <input type="text" value={tempUrl} onChange={e => setTempUrl(e.target.value)} placeholder="Script URL..." className="w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:border-indigo-600 outline-none font-medium" />
                <div className="flex gap-4">
                   <button onClick={() => setShowSettings(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Cancel</button>
                   <button onClick={handleSaveSettings} className="flex-2 py-3 bg-indigo-600 text-white rounded-xl font-bold">Save & Refresh</button>
                </div>
             </div>
          </div>
        </div>
      )}

      <DuplicateModal member={duplicateMember} onClose={() => setDuplicateMember(null)} />
      <DeleteConfirmModal voter={voterToDelete} onClose={() => setVoterToDelete(null)} onConfirm={handleDeleteVoter} />
    </div>
  );
};

export default App;

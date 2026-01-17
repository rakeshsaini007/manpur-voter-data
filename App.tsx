
import React, { useState, useCallback, useEffect } from 'react';
import { VoterRecord } from './types.ts';
import { searchVoters, saveVoters, getMetadata, deleteVoter, searchVotersByName } from './services/api.ts';
import VoterCard from './components/VoterCard.tsx';
import DuplicateModal from './components/DuplicateModal.tsx';

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
  const [searchTriggered, setSearchTriggered] = useState(false);

  useEffect(() => {
    const fetchMeta = async () => {
      setMetaLoading(true);
      const res = await getMetadata();
      if (res.success) {
        setBoothOptions(res.booths);
        setHouseMap(res.houseMap);
      }
      setMetaLoading(false);
    };
    fetchMeta();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!booth || !house) return;
    
    setLoading(true);
    setSearchTriggered(true);
    setNameQuery(''); // Clear name search when using dropdowns
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
    // Optionally clear dropdowns to show this is a global search
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

  const handleDeleteVoter = useCallback(async (vBooth: string, vNo: string) => {
    const voterToDelete = voters.find(v => v.voterNo === vNo && v.booth === vBooth);
    
    if (voterToDelete && voterToDelete.isNew) {
      setVoters(prev => prev.filter(v => !(v.voterNo === vNo && v.booth === vBooth)));
      return;
    }

    const result = await deleteVoter(vBooth, vNo);
    if (result.success) {
      setVoters(prev => prev.filter(v => !(v.voterNo === vNo && v.booth === vBooth)));
      alert('सदस्य को सफलतापूर्वक हटाया गया और "Deleted" शीट में स्थानांतरित कर दिया गया।');
    } else {
      alert('सदस्य को हटाने में त्रुटि हुई।');
    }
  }, [voters]);

  const addNewMember = () => {
    // If we're in a global search and booth/house aren't selected, prevent adding
    if (!booth || !house) {
      alert('नया सदस्य जोड़ने के लिए पहले बूथ और मकान संख्या चुनें।');
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
      // If we had a specific booth/house selected, refresh that view
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
    <div className="min-h-screen flex flex-col">
      <header className="bg-indigo-900 text-white shadow-xl px-4 py-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={clearResults}>
              <div className="p-2 bg-white rounded-full">
                <svg className="w-8 h-8 text-indigo-900" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 12V8h2v4H9zm0 2h2v2H9v-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight uppercase">Election Portal</h1>
                <p className="text-indigo-300 text-[10px] font-semibold tracking-widest uppercase">निर्वाचन डेटा प्रबंधन</p>
              </div>
            </div>

            {/* Global Name Search */}
            <form onSubmit={handleNameSearch} className="w-full md:w-96 relative">
              <input 
                type="text" 
                placeholder="नाम / पिता का नाम से खोजें..." 
                value={nameQuery} 
                onChange={e => setNameQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-indigo-800/50 border border-indigo-700 text-white placeholder-indigo-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-indigo-800 transition-all shadow-inner"
              />
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {nameQuery && (
                 <button 
                  type="button"
                  onClick={() => setNameQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white"
                 >
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                 </button>
              )}
            </form>
          </div>

          <div className="h-px bg-indigo-800/50 w-full" />

          {/* Filters Row */}
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-indigo-800/30 p-1.5 rounded-xl border border-indigo-700">
              <select 
                value={booth} 
                onChange={e => { setBooth(e.target.value); setHouse(''); }}
                className="appearance-none px-4 py-2 bg-transparent text-white rounded-lg outline-none focus:ring-0 w-40 font-medium"
                required
                disabled={metaLoading}
              >
                <option value="" className="bg-indigo-900">बूथ संख्या</option>
                {boothOptions.map(b => <option key={b} value={b} className="bg-indigo-900">{b}</option>)}
              </select>
              <div className="w-px h-6 bg-indigo-700" />
              <select 
                value={house} 
                onChange={e => setHouse(e.target.value)}
                className="appearance-none px-4 py-2 bg-transparent text-white rounded-lg outline-none focus:ring-0 w-40 font-medium"
                required
                disabled={!booth || metaLoading}
              >
                <option value="" className="bg-indigo-900">मकान नं०</option>
                {houseOptions.map(h => <option key={h} value={h} className="bg-indigo-900">{h}</option>)}
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading || !booth || !house}
              className="px-8 py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg active:scale-95"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-indigo-900 border-t-transparent animate-spin rounded-full" />
              ) : 'खोजें'}
            </button>

            {searchTriggered && (
              <button 
                type="button"
                onClick={clearResults}
                className="px-4 py-3 bg-indigo-800/50 text-indigo-200 font-semibold rounded-xl hover:bg-indigo-800 hover:text-white transition-all border border-indigo-700"
              >
                साफ करें
              </button>
            )}
          </form>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto w-full p-6">
        {searchTriggered && voters.length === 0 && !loading && (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-700">कोई रिकॉर्ड नहीं मिला</h2>
            <p className="text-gray-400 mt-2">प्रतीक्षा करें या दूसरी जानकारी से खोजें।</p>
            {(booth && house) && (
              <button 
                onClick={addNewMember} 
                className="mt-6 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
              >
                इस मकान में नया सदस्य जोड़ें
              </button>
            )}
          </div>
        )}

        {voters.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {booth && house ? (
                    <>मकान नं०: <span className="text-indigo-600">{house}</span>, बूथ: <span className="text-indigo-600">{booth}</span></>
                  ) : (
                    <>खोज परिणाम: <span className="text-indigo-600">"{nameQuery}"</span></>
                  )}
                </h2>
                <p className="text-sm text-gray-500 font-medium">{voters.length} सदस्य मिले</p>
              </div>
              <div className="flex gap-2">
                {booth && house && (
                  <button 
                    onClick={addNewMember}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    सदस्य जोड़ें
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {voters.map((voter) => (
                <VoterCard 
                  key={`${voter.booth}-${voter.voterNo}`} 
                  voter={voter} 
                  onChange={updateVoter}
                  onDelete={handleDeleteVoter}
                  onDuplicateFound={setDuplicateMember}
                />
              ))}
            </div>

            <div className="sticky bottom-6 mt-8 flex justify-center z-40">
              <button 
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-3 px-10 py-4 rounded-full text-white font-black text-lg shadow-2xl transition-all transform hover:scale-105 active:scale-95 ring-4 ring-white ${saving ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                    सहेजा जा रहा है...
                  </div>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    {hasExistingData ? 'अपडेट करें' : 'डेटा सहेजें'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-6 px-6 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-12">
        Election Voter Management System © 2025 • निर्वाचन डेटा पोर्टल
      </footer>

      <DuplicateModal 
        member={duplicateMember} 
        onClose={() => setDuplicateMember(null)} 
      />
    </div>
  );
};

export default App;

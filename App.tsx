
import React, { useState, useEffect, useCallback } from 'react';
import { VoterRecord } from './types';
import { searchVoters, saveVoters } from './services/api';
import VoterCard from './components/VoterCard';
import DuplicateModal from './components/DuplicateModal';

const App: React.FC = () => {
  const [booth, setBooth] = useState('');
  const [house, setHouse] = useState('');
  const [voters, setVoters] = useState<VoterRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duplicateMember, setDuplicateMember] = useState<VoterRecord | null>(null);
  const [searchTriggered, setSearchTriggered] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booth || !house) return;
    
    setLoading(true);
    setSearchTriggered(true);
    const response = await searchVoters(booth, house);
    if (response.success) {
      setVoters(response.data);
    } else {
      alert(response.error || 'खोज विफल रही');
      setVoters([]);
    }
    setLoading(false);
  };

  const updateVoter = useCallback((updated: VoterRecord) => {
    setVoters(prev => prev.map(v => v.voterNo === updated.voterNo ? updated : v));
  }, []);

  const addNewMember = () => {
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
    
    // Simple validation
    const invalidAadhar = voters.some(v => v.aadhar && v.aadhar.length !== 12);
    if (invalidAadhar) {
      alert('कृपया सभी आधार नंबर 12 अंकों के भरें।');
      return;
    }

    setSaving(true);
    const result = await saveVoters(voters);
    if (result.success) {
      alert('डेटा सफलतापूर्वक सहेजा/अपडेट किया गया है।');
    } else {
      alert(result.message || 'सहेजने में त्रुटि।');
    }
    setSaving(false);
  };

  const hasExistingData = voters.some(v => v.aadhar || v.dob);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-indigo-900 text-white shadow-xl px-4 py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-full">
              <svg className="w-8 h-8 text-indigo-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 12V8h2v4H9zm0 2h2v2H9v-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">Election Portal</h1>
              <p className="text-indigo-300 text-xs font-semibold">निर्वाचन डेटा प्रबंधन प्रणाली</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="w-full md:w-auto flex flex-wrap gap-2">
            <input 
              type="text" 
              placeholder="बूथ संख्या" 
              value={booth} 
              onChange={e => setBooth(e.target.value)}
              className="px-4 py-2 bg-indigo-800 border border-indigo-700 text-white placeholder-indigo-400 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-32"
              required
            />
            <input 
              type="text" 
              placeholder="मकान नं०" 
              value={house} 
              onChange={e => setHouse(e.target.value)}
              className="px-4 py-2 bg-indigo-800 border border-indigo-700 text-white placeholder-indigo-400 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-32"
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 bg-white text-indigo-900 font-bold rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
            >
              {loading ? 'खोज रहे हैं...' : 'खोजें'}
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto w-full p-6">
        {searchTriggered && voters.length === 0 && !loading && (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-600">कोई रिकॉर्ड नहीं मिला</h2>
            <p className="text-gray-400">कृपया सही बूथ और मकान संख्या दर्ज करें या नया सदस्य जोड़ें।</p>
            <button 
              onClick={addNewMember} 
              className="mt-6 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg"
            >
              नया सदस्य जोड़ें
            </button>
          </div>
        )}

        {voters.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  मकान नं०: <span className="text-indigo-600">{house}</span>, बूथ: <span className="text-indigo-600">{booth}</span>
                </h2>
                <p className="text-sm text-gray-500">{voters.length} सदस्य मिले</p>
              </div>
              <button 
                onClick={addNewMember}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 font-bold rounded-lg hover:bg-indigo-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                सदस्य जोड़ें
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {voters.map((voter) => (
                <VoterCard 
                  key={voter.voterNo} 
                  voter={voter} 
                  onChange={updateVoter}
                  onDuplicateFound={setDuplicateMember}
                />
              ))}
            </div>

            {/* Sticky Action Bar */}
            <div className="sticky bottom-6 mt-8 flex justify-center">
              <button 
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-3 px-10 py-4 rounded-full text-white font-black text-lg shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${saving ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {saving ? (
                  <>डेटा सहेजा जा रहा है...</>
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

      <footer className="bg-gray-100 border-t border-gray-200 py-4 px-6 text-center text-gray-400 text-xs font-medium uppercase tracking-widest">
        © 2025 Election Voter Management System • Secure Data Entry
      </footer>

      {/* Modals */}
      <DuplicateModal 
        member={duplicateMember} 
        onClose={() => setDuplicateMember(null)} 
      />
    </div>
  );
};

export default App;

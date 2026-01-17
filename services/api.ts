
import { VoterRecord, ApiSearchResponse, ApiSaveResponse } from '../types.ts';
import { GAS_DEPLOY_URL as DEFAULT_URL } from '../constants.ts';

// Get URL from localStorage or fallback to default
const getBaseUrl = () => {
  return localStorage.getItem('voter_script_url') || DEFAULT_URL;
};

export const getMetadata = async (): Promise<{ success: boolean; booths: string[]; houseMap: Record<string, string[]>; error?: string }> => {
  try {
    const url = `${getBaseUrl()}?action=getMetadata`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Metadata Error:', error);
    return { success: false, booths: [], houseMap: {}, error: 'कनेक्शन विफल: कृपया सेटिंग्स में सही "Script URL" जाँचें।' };
  }
};

export const searchVoters = async (booth: string, house: string): Promise<ApiSearchResponse> => {
  try {
    const url = `${getBaseUrl()}?action=search&booth=${encodeURIComponent(booth)}&house=${encodeURIComponent(house)}`;
    const response = await fetch(url);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Search Error:', error);
    return { success: false, data: [], error: 'डेटा खोजने में असमर्थ।' };
  }
};

export const searchVotersByName = async (query: string): Promise<ApiSearchResponse> => {
  try {
    const url = `${getBaseUrl()}?action=searchByName&query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Name Search Error:', error);
    return { success: false, data: [], error: 'नाम से खोजने में असमर्थ।' };
  }
};

export const saveVoters = async (voters: VoterRecord[]): Promise<ApiSaveResponse> => {
  try {
    // We send as plain text to avoid CORS preflight (OPTIONS request) 
    // which GAS doesn't handle natively. GAS parses the body in doPost(e).
    const response = await fetch(getBaseUrl(), {
      method: 'POST',
      body: JSON.stringify({ action: 'save', data: voters }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Save Error:', error);
    return { success: false, message: 'डेटा सहेजने में विफल', error: String(error) };
  }
};

export const deleteVoter = async (booth: string, voterNo: string, reason: string): Promise<ApiSaveResponse> => {
  try {
    const response = await fetch(getBaseUrl(), {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', booth, voterNo, reason }),
    });
    return await response.json();
  } catch (error) {
    console.error('Delete Error:', error);
    return { success: false, message: 'हटाने में विफल' };
  }
};

export const checkDuplicateAadhar = async (aadhar: string, currentVoterNo: string): Promise<any> => {
  try {
    const url = `${getBaseUrl()}?action=checkAadhar&aadhar=${encodeURIComponent(aadhar)}&voterNo=${encodeURIComponent(currentVoterNo)}`;
    const response = await fetch(url);
    const result = await response.json();
    return result;
  } catch (error) {
    return { isDuplicate: false };
  }
};

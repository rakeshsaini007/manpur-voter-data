
import { VoterRecord, ApiSearchResponse, ApiSaveResponse } from '../types.ts';
import { GAS_DEPLOY_URL } from '../constants.ts';

export const getMetadata = async (): Promise<{ success: boolean; booths: string[]; houseMap: Record<string, string[]>; error?: string }> => {
  try {
    const url = `${GAS_DEPLOY_URL}?action=getMetadata`;
    const response = await fetch(url);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Metadata Error:', error);
    return { success: false, booths: [], houseMap: {}, error: 'नेटवर्क त्रुटि: ड्रॉपडाउन डेटा लोड करने में असमर्थ' };
  }
};

export const searchVoters = async (booth: string, house: string): Promise<ApiSearchResponse> => {
  try {
    const url = `${GAS_DEPLOY_URL}?action=search&booth=${encodeURIComponent(booth)}&house=${encodeURIComponent(house)}`;
    const response = await fetch(url);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Search Error:', error);
    return { success: false, data: [], error: 'नेटवर्क त्रुटि: डेटा खोजने में असमर्थ' };
  }
};

export const searchVotersByName = async (query: string): Promise<ApiSearchResponse> => {
  try {
    const url = `${GAS_DEPLOY_URL}?action=searchByName&query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Name Search Error:', error);
    return { success: false, data: [], error: 'नेटवर्क त्रुटि: नाम से खोजने में असमर्थ' };
  }
};

export const saveVoters = async (voters: VoterRecord[]): Promise<ApiSaveResponse> => {
  try {
    const response = await fetch(GAS_DEPLOY_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'save', data: voters }),
    });
    return { success: true, message: 'डेटा सफलतापूर्वक सहेजा गया' };
  } catch (error) {
    console.error('Save Error:', error);
    return { success: false, message: 'डेटा सहेजने में विफल', error: String(error) };
  }
};

export const deleteVoter = async (booth: string, voterNo: string, reason: string): Promise<ApiSaveResponse> => {
  try {
    await fetch(GAS_DEPLOY_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'delete', booth, voterNo, reason }),
    });
    return { success: true, message: 'सदस्य को हटा दिया गया' };
  } catch (error) {
    console.error('Delete Error:', error);
    return { success: false, message: 'हटाने में विफल' };
  }
};

export const checkDuplicateAadhar = async (aadhar: string, currentVoterNo: string): Promise<any> => {
  try {
    const url = `${GAS_DEPLOY_URL}?action=checkAadhar&aadhar=${encodeURIComponent(aadhar)}&voterNo=${encodeURIComponent(currentVoterNo)}`;
    const response = await fetch(url);
    const result = await response.json();
    return result;
  } catch (error) {
    return { isDuplicate: false };
  }
};

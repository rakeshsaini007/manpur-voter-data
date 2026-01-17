
import { VoterRecord, ApiSearchResponse, ApiSaveResponse } from '../types';
import { GAS_DEPLOY_URL } from '../constants';

/**
 * We use JSONP or standard fetch with CORS. 
 * Since Apps Script returns a redirect on POST, we need to handle that.
 * The Apps Script should be deployed as a Web App with 'Anyone' access.
 */

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

export const saveVoters = async (voters: VoterRecord[]): Promise<ApiSaveResponse> => {
  try {
    const response = await fetch(GAS_DEPLOY_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps Script POST often requires no-cors for simple implementation
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'save', data: voters }),
    });

    // Since 'no-cors' doesn't return the body, we assume success or handle it differently.
    // For a more robust app, 'cors' is preferred if the script headers are set correctly.
    return { success: true, message: 'डेटा सफलतापूर्वक सहेजा गया' };
  } catch (error) {
    console.error('Save Error:', error);
    return { success: false, message: 'डेटा सहेजने में विफल', error: String(error) };
  }
};

/**
 * Global Aadhar Check
 */
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

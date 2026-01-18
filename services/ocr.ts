
import { GoogleGenAI } from "@google/genai";

interface ExtractedData {
  aadhar: string | null;
  dob: string | null;
}

/**
 * Extracts a 12-digit Aadhar number and Date of Birth from a base64 image string using Gemini Vision.
 */
export const extractAadharData = async (base64Image: string): Promise<ExtractedData> => {
  try {
    // ALWAYS use process.env.API_KEY for the Gemini API
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Ensure we only send the raw base64 data string
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg'
            }
          },
          {
            text: "Extract the 12-digit Aadhar number and the Date of Birth (DOB) from this image. Format the output as a JSON object with keys 'aadhar' (12 digits string, no spaces) and 'dob' (string in DD/MM/YYYY format). Only return the JSON object."
          }
        ]
      }],
      config: {
        responseMimeType: "application/json"
      }
    });

    // Extract text and parse JSON
    const resultText = response.text || '{}';
    const parsed = JSON.parse(resultText);
    
    let formattedDob = null;
    if (parsed.dob && typeof parsed.dob === 'string') {
      // Clean and validate date format DD/MM/YYYY
      const dateMatch = parsed.dob.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
      if (dateMatch) {
        const [_, day, month, year] = dateMatch;
        // Standardize to YYYY-MM-DD for HTML5 date inputs
        formattedDob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    return {
      aadhar: parsed.aadhar ? String(parsed.aadhar).replace(/\D/g, '').substring(0, 12) : null,
      dob: formattedDob
    };
  } catch (error) {
    console.error("OCR Extraction Error:", error);
    return { aadhar: null, dob: null };
  }
};

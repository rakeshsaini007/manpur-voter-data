
import { GoogleGenAI } from "@google/genai";

interface ExtractedData {
  aadhar: string | null;
  dob: string | null;
}

/**
 * Extracts a 12-digit Aadhar number and Date of Birth from a base64 image string.
 */
export const extractAadharData = async (base64Image: string): Promise<ExtractedData> => {
  try {
    // Initialize GoogleGenAI with the environment variable as per guidelines
    const ai = new GoogleGenAI({ apiKey: "AIzaSyAZzNEvE-UBaXaArXU-Q8j3coYEFmwGHD0" });
    
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
            text: "Identify the 12-digit Aadhar number and the Date of Birth (DOB) from this Indian Aadhar card image. Return ONLY a JSON object with keys 'aadhar' and 'dob'. The 'aadhar' should be exactly 12 numeric digits without spaces. The 'dob' should be in DD/MM/YYYY format. If you cannot find a value, return null for that key."
          }
        ]
      }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const resultText = response.text || '{}';
    const parsed = JSON.parse(resultText);
    
    let formattedDob = null;
    if (parsed.dob && typeof parsed.dob === 'string') {
      // Clean up the string to remove any extra text the model might have added
      const dateMatch = parsed.dob.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (dateMatch) {
        const [_, day, month, year] = dateMatch;
        // Convert DD/MM/YYYY to YYYY-MM-DD for HTML date input compatibility
        formattedDob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    return {
      aadhar: parsed.aadhar ? String(parsed.aadhar).replace(/\D/g, '').substring(0, 12) : null,
      dob: formattedDob
    };
  } catch (error) {
    console.error("OCR API Error:", error);
    return { aadhar: null, dob: null };
  }
};

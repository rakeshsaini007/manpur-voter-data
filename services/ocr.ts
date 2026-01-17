
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts a 12-digit Aadhar number from a base64 image string.
 */
export const extractAadharNumber = async (base64Image: string): Promise<string | null> => {
  try {
    // Remove the data:image/jpeg;base64, prefix
    const base64Data = base64Image.split(',')[1];
    
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
            text: "Identify the 12-digit Aadhar number (UID) from this Indian Aadhar card image. Return ONLY the 12 digits with no spaces or other text. If not found, return 'NOT_FOUND'."
          }
        ]
      }]
    });

    const result = response.text?.trim() || '';
    
    // Validate if it's a 12-digit number
    const cleaned = result.replace(/\D/g, '');
    if (cleaned.length === 12) {
      return cleaned;
    }
    
    return null;
  } catch (error) {
    console.error("OCR Extraction Error:", error);
    return null;
  }
};

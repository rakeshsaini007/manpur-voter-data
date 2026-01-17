
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyDo0hVOtClkyq_DT9VIxOsp-I5jE_l1ahM" });

/**
 * Extracts a 12-digit Aadhar number from a base64 image string.
 */
export const extractAadharNumber = async (base64Image: string): Promise<string | null> => {
  try {
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
            text: "Identify the 12-digit Aadhar number from this cropped Indian Aadhar card image. Return ONLY the 12 digits (no spaces). If not found, return 'NOT_FOUND'."
          }
        ]
      }]
    });

    const result = response.text?.trim() || '';
    const cleaned = result.replace(/\D/g, '');
    return cleaned.length === 12 ? cleaned : null;
  } catch (error) {
    console.error("OCR Error:", error);
    return null;
  }
};

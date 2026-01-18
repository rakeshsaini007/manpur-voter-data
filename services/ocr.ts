
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyDxsYBWWbEYfSw-d1SZ3Qf0pi3-sxkA73g" });

/**
 * Extracts a 12-digit Aadhar number from a base64 image string.
 */
export const extractAadharNumber = async (base64Image: string): Promise<string | null> => {
  try {
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
            text: "Identify the 12-digit Aadhar number from this cropped Indian Aadhar card image. Return ONLY the 12 digits without any spaces or characters. If no 12-digit number is found, return 'NOT_FOUND'."
          }
        ]
      }]
    });

    const result = response.text?.trim() || '';
    const match = result.match(/\d{12}/);
    return match ? match[0] : null;
  } catch (error) {
    console.error("OCR API Error:", error);
    return null;
  }
};

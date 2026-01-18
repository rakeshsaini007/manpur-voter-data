
import { GoogleGenAI } from "@google/genai";

/**
 * Extracts a 12-digit Aadhar number from a base64 image string.
 */
export const extractAadharNumber = async (base64Image: string): Promise<string | null> => {
  try {
    // Correctly initialize GoogleGenAI inside the function with the environment variable
    const ai = new GoogleGenAI({ apiKey: "AIzaSyDo0hVOtClkyq_DT9VIxOsp-I5jE_l1ahM" });
    
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

    // Directly access the .text property of GenerateContentResponse
    const result = response.text?.trim() || '';
    const match = result.match(/\d{12}/);
    return match ? match[0] : null;
  } catch (error) {
    console.error("OCR API Error:", error);
    return null;
  }
};

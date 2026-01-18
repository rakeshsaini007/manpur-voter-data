
import { GoogleGenAI } from "@google/genai";

/**
 * Extracts a 12-digit Aadhar number from a base64 image string.
 */
export const extractAadharNumber = async (base64Image: string): Promise<string | null> => {
  try {
    // Correctly initialize GoogleGenAI with the environment variable
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
            text: "This is an Indian Aadhar card. Identify and extract the 12-digit Aadhar identification number. The number is usually formatted as 4-4-4 digits (e.g., 1234 5678 9012). Return ONLY the 12 digits without any spaces, letters, or symbols. If you cannot find a 12-digit number, return 'NOT_FOUND'."
          }
        ]
      }]
    });

    // Directly access the .text property and clean up any unexpected formatting
    const result = response.text?.trim() || '';
    
    // Robustly extract 12 digits even if the model included spaces or text
    const digitsOnly = result.replace(/\D/g, '');
    const match = digitsOnly.match(/\d{12}/);
    
    return match ? match[0] : null;
  } catch (error) {
    console.error("OCR API Error:", error);
    return null;
  }
};

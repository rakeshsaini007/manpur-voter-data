
import { GoogleGenAI, Type } from "@google/genai";

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
    const ai = new GoogleGenAI({ apiKey: "AIzaSyAZzNEvE-UBaXaArXU-Q8j3coYEFmwGHD0" });
    
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
            text: "Extract the 12-digit Aadhar number (numeric only) and the Date of Birth (DOB) from this Aadhar card image. Return the DOB in DD/MM/YYYY format."
          }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aadhar: {
              type: Type.STRING,
              description: "The 12-digit Aadhar number found in the image."
            },
            dob: {
              type: Type.STRING,
              description: "The Date of Birth in DD/MM/YYYY format."
            }
          },
          required: ["aadhar", "dob"]
        }
      }
    });

    // Directly access the .text property
    const resultText = response.text || '{}';
    let parsed: any = {};
    
    try {
      parsed = JSON.parse(resultText);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON", resultText);
    }
    
    let formattedDob = null;
    if (parsed.dob && typeof parsed.dob === 'string') {
      // Robust regex to find a date pattern even if formatted slightly differently
      const dateMatch = parsed.dob.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
      if (dateMatch) {
        const [_, day, month, year] = dateMatch;
        // Standardize to YYYY-MM-DD for HTML5 date input compatibility
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

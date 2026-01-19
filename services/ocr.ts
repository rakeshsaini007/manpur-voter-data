
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Ensure we only send the raw base64 data string
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    
    if (!base64Data) {
      throw new Error("Invalid image data provided to OCR");
    }

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
            text: `Carefully analyze this image of an Indian Aadhar Card. 
Note: The image may be rotated or have regional text in Hindi/Devanagari.

Please extract:
1. The 12-digit Aadhar number. It is usually formatted as "XXXX XXXX XXXX". Return exactly 12 numeric digits only.
2. The Date of Birth (DOB). Look for "DOB", "जन्म तिथि", or "Year of Birth".
3. Return the DOB in DD/MM/YYYY format. If you only find the Year, return 01/01/YYYY.

Ensure accuracy for these fields. Respond in JSON format only.`
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
              description: "The 12-digit Aadhar number without any spaces."
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

    const resultText = response.text || '{}';
    let parsed: any = {};
    
    try {
      parsed = JSON.parse(resultText);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON", resultText);
    }
    
    let formattedDob = null;
    if (parsed.dob && typeof parsed.dob === 'string') {
      // Standardize the date using a robust match for DD/MM/YYYY or YYYY-MM-DD
      const dateMatch = parsed.dob.match(/(\d{1,4})[\/\-.](\d{1,2})[\/\-.](\d{1,4})/);
      if (dateMatch) {
        let day, month, year;
        if (dateMatch[1].length === 4) {
          // YYYY-MM-DD format
          [year, month, day] = [dateMatch[1], dateMatch[2], dateMatch[3]];
        } else {
          // DD-MM-YYYY format
          [day, month, year] = [dateMatch[1], dateMatch[2], dateMatch[3]];
        }
        
        // Final sanity check on component lengths
        if (day && month && year) {
           formattedDob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }

    // Clean up Aadhar: remove all non-digits and take first 12
    const cleanAadhar = parsed.aadhar ? String(parsed.aadhar).replace(/\D/g, '').substring(0, 12) : null;

    return {
      aadhar: cleanAadhar && cleanAadhar.length === 12 ? cleanAadhar : null,
      dob: formattedDob
    };
  } catch (error) {
    console.error("OCR Extraction Error:", error);
    return { aadhar: null, dob: null };
  }
};

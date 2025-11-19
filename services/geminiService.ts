import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini Client
// Note: process.env.API_KEY is injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION = `
You are an expert American Sign Language (ASL) translator. 
Your task is to analyze the input image of a hand gesture and identify the corresponding letter or word.
- If the gesture represents a clear letter (A-Z) or a common word (Hello, Yes, No, Thanks, Please), return it.
- If the gesture is unclear, ambiguous, or no hand is visible, return "..." or an empty string.
- Provide a confidence score between 0 and 100 based on the clarity of the hand shape.
`;

export const translateSignLanguageFrame = async (base64Image: string): Promise<{ text: string; confidence: number }> => {
  try {
    // Remove header from base64 string if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "Identify the ASL sign in this image."
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sign: {
              type: Type.STRING,
              description: "The identified letter or word. Use '...' if unclear."
            },
            confidence: {
              type: Type.INTEGER,
              description: "Confidence score from 0 to 100."
            }
          },
          required: ["sign", "confidence"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      return { text: '...', confidence: 0 };
    }

    const result = JSON.parse(jsonText);
    return {
      text: result.sign || '...',
      confidence: result.confidence || 0
    };

  } catch (error) {
    console.error("Translation error:", error);
    return { text: '...', confidence: 0 };
  }
};

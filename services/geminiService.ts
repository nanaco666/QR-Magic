import { GoogleGenAI } from "@google/genai";

export const generateSocialCaption = async (context: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Please configure your API Key to use AI features.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, catchy, and engaging social media caption (Instagram/TikTok style) for a video revealing a QR code. 
      The context of the QR code is: "${context}". 
      Include 2-3 relevant hashtags. 
      Keep it under 50 words. 
      Do not include quotes around the output.`,
    });

    return response.text || "Check out this QR code!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Could not generate caption at this time.";
  }
};

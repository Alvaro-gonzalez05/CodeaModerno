const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;
const prompt = "A futuristic city in neon yellow and black";

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'nano-banana-pro-preview',
      contents: prompt,
      config: {
        responseModalities: ["IMAGE"]
      }
    });

    console.log("Success with nano-banana-pro-preview!");
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
           console.log("Found image!", part.inlineData.mimeType, part.inlineData.data.substring(0, 30) + '...');
        }
      }
    }
  } catch(e) {
    console.error("Error with nano-banana-pro-preview:", e.message);
  }
}

run();

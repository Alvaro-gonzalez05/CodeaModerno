const { GoogleGenAI } = require('@google/genai');

const apiKey = "AIzaSyDN9VJspay54TmUom02QRque9vaQI2J_W0";
const prompt = "A futuristic city";

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png'
      }
    });

    console.log("Success!");
    if (response.generatedImages && response.generatedImages[0].image) {
      console.log("Found image!", response.generatedImages[0].image.imageBytes.substring(0, 30));
    }
  } catch(e) {
    console.error("Error:", e.message);
  }
}

run();

const { GoogleGenAI } = require('@google/genai');
const apiKey = process.env.GEMINI_API_KEY;
async function run() {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.list();
  const models = [];
  for await (const m of response) {
    if (m.name.includes("imagen") || m.name.includes("flash") || m.name.includes("pro")) {
      models.push(m.name);
    }
  }
  console.log(models);
}
run();

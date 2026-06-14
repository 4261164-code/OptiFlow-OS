import { GoogleGenAI } from "@google/genai";

export async function generateClusterNodes(keyword: string, targetCount = 20, intent?: string): Promise<{ keyword: string; searchIntent: string; searchVolume?: number; isPillar: boolean }[]> {
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY!,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
  const prompt = `You are an expert SEO Architect.
  The primary Root Keyword is: "${keyword}".
  Target Intent focus: ${intent || "mixed"}.
  
  Generate a JSON array of up to ${targetCount} supporting keywords for a topic cluster.
  Exactly ONE item should represent the pillar page (isPillar: true). The rest should be supporting nodes (isPillar: false).
  Assign an estimated searchIntent (informational, commercial, navigational) and an estimated searchVolume.
  
  Output MUST be ONLY valid JSON array. Do not include markdown \`\`\` around the block.
  Format:
  [
    { "keyword": "Best Survey Sites", "searchIntent": "commercial", "searchVolume": 12000, "isPillar": true },
    { "keyword": "Are survey sites legit?", "searchIntent": "informational", "searchVolume": 4500, "isPillar": false }
  ]`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt,
  });
  
  let resultText = response.text || "[]";
  resultText = resultText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
  try {
    return JSON.parse(resultText);
  } catch (e) {
    console.error("Failed to parse cluster nodes JSON", e);
    return [{ keyword, searchIntent: "informational", searchVolume: 1000, isPillar: true }];
  }
}

import { GoogleGenAI } from "@google/genai";

export async function generateAnchorText(sourceContent: string, targetKeyword: string): Promise<{ anchor: string, confidence: number }> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const prompt = `Extract a natural insertion point phrase from the following source content to link to a related article about "${targetKeyword}". Provide a 2-8 word phrase from the source content that works best as anchor text. Return ONLY JSON format: { "anchor": "exact phrase from text", "confidence": 0.8 }. If none fit perfectly, return a confidence lower than 0.5. Source Content: ${sourceContent.substring(0, 1000)}...`;
    
    const res = await ai.models.generateContent({ model: "gemini-3.5-flash", contents: prompt });
    let text = res.text || "{}";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const result = JSON.parse(text);
    return {
      anchor: result.anchor || targetKeyword,
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.5
    };
  } catch (err) {
    return { anchor: targetKeyword, confidence: 0.3 };
  }
}

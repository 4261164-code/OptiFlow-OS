
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await ai.models.list();
    console.log('Available models:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('Failed to list models:', e);
  }
}
listModels();

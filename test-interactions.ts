
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function testInteractions() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  console.log('AI object keys:', Object.keys(ai));
  // @ts-ignore
  if (ai.interactions) {
    console.log('ai.interactions exists');
  } else {
    console.log('ai.interactions DOES NOT EXIST');
  }
}
testInteractions();

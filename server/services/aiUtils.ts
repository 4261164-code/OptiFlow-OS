import { logger } from "../lib/logger";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { MODEL_PRIMARY, MODEL_FALLBACK } from "../config/models";
import { db } from "../firebaseAdmin";

export async function robustGenerateContent(params: any, userId?: string): Promise<any> {
    const aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const execute = async (model: string) => {
        const response = await aiClient.models.generateContent({
            ...params,
            model,
        });

        // Validation
        const text = response.text || "";
        
        // Check for HTML injection (requirement B)
        if (text.trim().startsWith("<!doctype html>")) {
            throw new Error("Received HTML instead of expected JSON");
        }

        // JSON Enforcement (requirement C)
        if (params.config?.responseMimeType === "application/json") {
            try {
                JSON.parse(text);
            } catch (e) {
                logger.error("Malformed JSON response:", { text });
                throw new Error("Malformed JSON response");
            }
        }
        
        return response;
    };

    // Retry with exponential backoff (Requirement F)
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
        try {
            return await execute(MODEL_PRIMARY);
        } catch (err: any) {
            retries++;
            logger.error(`Attempt ${retries} failed for ${MODEL_PRIMARY}:`, err.message);
            
            if (retries === maxRetries) {
                logger.info(`Primary model failed, trying fallback: ${MODEL_FALLBACK}`);
                return await execute(MODEL_FALLBACK);
            }
            
            // Exponential backoff
            const delay = Math.pow(5, retries) * 1000;
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

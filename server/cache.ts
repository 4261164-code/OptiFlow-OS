import { db } from "./firebaseAdmin";

const settingsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getUserSettings(userId: string) {
  const cached = settingsCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const snap = await db.collection("settings").doc(userId).get();
    const data = snap.exists ? snap.data() : null;
    settingsCache.set(userId, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error("Cache Fetch Error:", error);
    return null;
  }
}

export function clearSettingsCache(userId: string) {
  settingsCache.delete(userId);
}

import { logger } from "./lib/logger";
import { db } from "./firebaseAdmin";

const cache = new Map<string, { data: unknown; expires: number }>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) {
    if (entry) cache.delete(key); // Evict expired entry
    return null;
  }
  return entry.data as T;
}

export function setCached(key: string, data: unknown, ttlMs = 300_000) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

export async function getUserSettings(userId: string) {
  const cached = getCached<any>(`user_settings_${userId}`);
  if (cached !== null) {
    return cached;
  }

  try {
    const snap = await db.collection("settings").doc(userId).get();
    const data = snap.exists ? snap.data() : null;
    setCached(`user_settings_${userId}`, data, 300_000);
    return data;
  } catch (error) {
    logger.error("Cache Fetch Error:", error);
    return null;
  }
}

export function clearSettingsCache(userId: string) {
  cache.delete(`user_settings_${userId}`);
}


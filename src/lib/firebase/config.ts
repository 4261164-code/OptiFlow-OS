import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export function getAppletConfig() {
  try {
    const configPath = join(process.cwd(), 'firebase-applet-config.json');
    if (existsSync(configPath)) {
      const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf8'));
      return {
        firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || firebaseConfig.databaseId || process.env.FIREBASE_DATABASE_ID || '(default)',
        projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId || 'earn-pulse-51df9'
      };
    }
  } catch (e) {
    console.warn('[AppletConfig] Fallback to defaults. Error loading config file:', e instanceof Error ? e.message : String(e));
  }
  return {
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || '(default)',
    projectId: process.env.FIREBASE_PROJECT_ID || 'earn-pulse-51df9'
  };
}

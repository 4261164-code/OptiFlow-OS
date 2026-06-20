import { readFileSync } from 'fs';
import { join } from 'path';

export function getAppletConfig() {
  try {
    const configPath = join(process.cwd(), 'firebase-applet-config.json');
    const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf8'));
    console.log('[AppletConfig] Loaded from file:', { 
      projectId: firebaseConfig.projectId, 
      dbId: firebaseConfig.firestoreDatabaseId 
    });
    return {
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || firebaseConfig.databaseId || process.env.FIREBASE_DATABASE_ID || '(default)',
      projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId || 'earn-pulse-51df9'
    };
  } catch (e) {
    console.warn('[AppletConfig] Fallback to defaults. Error loading config file:', e instanceof Error ? e.message : String(e));
    return {
      firestoreDatabaseId: '(default)',
      projectId: 'earn-pulse-51df9'
    };
  }
}

import { readFileSync } from 'fs';
import { join } from 'path';

export function getAppletConfig() {
  try {
    const configPath = join(process.cwd(), 'firebase-applet-config.json');
    const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf8'));
    return {
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || 'ai-studio-b17ddf8c-b59f-4f82-8ac3-b7bf4fcbe0ce',
      projectId: firebaseConfig.projectId || 'earn-pulse-51df9'
    };
  } catch (e) {
    return {
      firestoreDatabaseId: 'ai-studio-b17ddf8c-b59f-4f82-8ac3-b7bf4fcbe0ce',
      projectId: 'earn-pulse-51df9'
    };
  }
}

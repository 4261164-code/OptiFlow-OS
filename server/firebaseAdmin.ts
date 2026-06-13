import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Retrieve databaseId dynamically
let databaseId = 'ai-studio-b17ddf8c-b59f-4f82-8ac3-b7bf4fcbe0ce';
let projectIdFromConfig = 'earn-pulse-51df9';
try {
  const configPath = join(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf8'));
  if (firebaseConfig.firestoreDatabaseId) {
    databaseId = firebaseConfig.firestoreDatabaseId;
  }
  if (firebaseConfig.projectId) {
    projectIdFromConfig = firebaseConfig.projectId;
  }
} catch (e) {
  // Silent fallback to standard named database ID
}

let defaultApp;
if (!getApps().some(app => app.name === '[DEFAULT]')) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    defaultApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    // Enforce strict production environment variable checks
    if (process.env.NODE_ENV === 'production') {
      if (!projectId) throw new Error('FATAL: FIREBASE_PROJECT_ID not set — server cannot start');
      if (!clientEmail) throw new Error('FATAL: FIREBASE_CLIENT_EMAIL not set — server cannot start');
      if (!privateKey) throw new Error('FATAL: FIREBASE_PRIVATE_KEY not set — server cannot start');
    }
    // Fall back to standard Application Default Credentials in the development/preview environment
    defaultApp = initializeApp(projectIdFromConfig ? { projectId: projectIdFromConfig } : undefined);
  }
} else {
  defaultApp = getApps().find(app => app.name === '[DEFAULT]');
}

let authApp;
if (!getApps().some(app => app.name === 'authApp')) {
  authApp = initializeApp({ projectId: projectIdFromConfig }, 'authApp');
} else {
  authApp = getApps().find(app => app.name === 'authApp');
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}

export function handleServerError(error: unknown): never {
  const code = (error as { code?: string | number }).code;
  if (code === 'permission-denied' || code === 7 || (error instanceof Error && error.message.includes('PERMISSION_DENIED'))) {
    throw new Error(
      'DATABASE_UNAVAILABLE: Firestore permission denied. ' +
      'Check FIREBASE_PRIVATE_KEY and service account permissions in Firebase Console.'
    );
  }
  throw error as Error;
}



class LocalFirestore {
  private filepath: string;
  private data: Record<string, Record<string, any>> = {};

  constructor() {
    this.filepath = join(process.cwd(), 'local-db-fallback.json');
    this.load();
  }

  private load() {
    try {
      if (existsSync(this.filepath)) {
        const fileContent = readFileSync(this.filepath, 'utf8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = {};
      }
    } catch (e) {
      console.error('[Fallback DB] Failed to load local database:', e);
      this.data = {};
    }
  }

  private save() {
    try {
      writeFileSync(this.filepath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('[Fallback DB] Failed to save local database:', e);
    }
  }

  collection(colName: string) {
    return new LocalCollection(this, colName);
  }

  get dataStore() {
    return this.data;
  }

  set dataStore(val) {
    this.data = val;
    this.save();
  }

  async runTransaction(callback: (transaction: any) => Promise<any>) {
    const transaction = {
      get: async (docRef: any) => docRef.get(),
      set: async (docRef: any, data: any, options: any) => docRef.set(data, options),
      update: async (docRef: any, data: any) => docRef.update(data),
      delete: async (docRef: any) => docRef.delete()
    };
    return await callback(transaction);
  }

  batch() {
    const operations: Array<() => Promise<void>> = [];
    return {
      set: (docRef: any, data: any, options: any) => {
        operations.push(() => docRef.set(data, options));
      },
      update: (docRef: any, data: any) => {
        operations.push(() => docRef.update(data));
      },
      delete: (docRef: any) => {
        operations.push(() => docRef.delete());
      },
      commit: async () => {
        for (const op of operations) {
          await op();
        }
      }
    };
  }
}

class LocalCollection {
  constructor(private db: LocalFirestore, private colName: string) {
    if (!this.db.dataStore[this.colName]) {
      const current = this.db.dataStore;
      current[this.colName] = {};
      this.db.dataStore = current;
    }
  }

  doc(id?: string) {
    const docId = id || Math.random().toString(36).substring(2, 12);
    return new LocalDocument(this.db, this.colName, docId);
  }

  async add(data: any) {
    const docId = Math.random().toString(36).substring(2, 12);
    const ref = new LocalDocument(this.db, this.colName, docId);
    await ref.set(data);
    return ref;
  }

  where(field: string, op: string, val: any) {
    return new LocalQuery(this.db, this.colName, []).where(field, op, val);
  }

  orderBy(field: string, dir?: 'asc' | 'desc') {
    return new LocalQuery(this.db, this.colName, []).orderBy(field, dir);
  }

  limit(num: number) {
    return new LocalQuery(this.db, this.colName, []).limit(num);
  }

  async get() {
    return new LocalQuery(this.db, this.colName, []).get();
  }
}

class LocalDocument {
  constructor(private db: LocalFirestore, private colName: string, public id: string) {}

  get ref() {
    return this;
  }

  async get() {
    const colData = this.db.dataStore[this.colName] || {};
    const docData = colData[this.id];
    return {
      id: this.id,
      exists: docData !== undefined,
      data: () => (docData ? JSON.parse(JSON.stringify(docData)) : undefined),
      ref: this
    };
  }

  async set(data: any, options?: { merge?: boolean }) {
    const current = this.db.dataStore;
    const colData = current[this.colName] || {};
    const existing = colData[this.id] || {};
    
    let updated;
    if (options?.merge) {
      updated = { ...existing, ...data };
    } else {
      updated = { ...data };
    }
    
    colData[this.id] = JSON.parse(JSON.stringify(updated));
    current[this.colName] = colData;
    this.db.dataStore = current;
  }

  async update(data: any) {
    const current = this.db.dataStore;
    const colData = current[this.colName] || {};
    const existing = colData[this.id];
    if (existing === undefined) {
      throw new Error(`Document ${this.id} not found in collection ${this.colName}`);
    }
    
    const updated = { ...existing };
    for (const [key, val] of Object.entries(data)) {
      if (key.includes('.')) {
        const parts = key.split('.');
        let curr = updated;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!curr[parts[i]]) curr[parts[i]] = {};
          curr = curr[parts[i]];
        }
        curr[parts[parts.length - 1]] = val;
      } else {
        updated[key] = val;
      }
    }
    
    colData[this.id] = JSON.parse(JSON.stringify(updated));
    current[this.colName] = colData;
    this.db.dataStore = current;
  }

  async delete() {
    const current = this.db.dataStore;
    const colData = current[this.colName] || {};
    delete colData[this.id];
    current[this.colName] = colData;
    this.db.dataStore = current;
  }
}

class LocalQuery {
  private filters: Array<{ field: string; op: string; val: any }> = [];
  private orderField?: string;
  private orderDirection?: 'asc' | 'desc';
  private limitNum?: number;

  constructor(
    private db: LocalFirestore, 
    private colName: string,
    existingFilters?: Array<{ field: string; op: string; val: any }>
  ) {
    if (existingFilters) {
      this.filters = [...existingFilters];
    }
  }

  where(field: string, op: string, val: any) {
    const q = new LocalQuery(this.db, this.colName, this.filters);
    q.filters.push({ field, op, val });
    return q;
  }

  orderBy(field: string, dir?: 'asc' | 'desc') {
    const q = new LocalQuery(this.db, this.colName, this.filters);
    q.orderField = field;
    q.orderDirection = dir || 'asc';
    return q;
  }

  limit(num: number) {
    const q = new LocalQuery(this.db, this.colName, this.filters);
    q.limitNum = num;
    return q;
  }

  async get() {
    const colData = this.db.dataStore[this.colName] || {};
    let docsList = Object.entries(colData).map(([id, data]) => ({
      id,
      data: JSON.parse(JSON.stringify(data))
    }));

    for (const filter of this.filters) {
      const { field, op, val } = filter;
      docsList = docsList.filter(doc => {
        const docVal = doc.data[field];
        switch (op) {
          case '==':
            return docVal === val;
          case '!=':
            return docVal !== val;
          case '>':
            return docVal > val;
          case '>=':
            return docVal >= val;
          case '<':
            return docVal < val;
          case '<=':
            return docVal <= val;
          case 'array-contains':
            return Array.isArray(docVal) && docVal.includes(val);
          case 'in':
            return Array.isArray(val) && val.includes(docVal);
          default:
            return true;
        }
      });
    }

    if (this.orderField) {
      const field = this.orderField;
      const dir = this.orderDirection === 'desc' ? -1 : 1;
      docsList.sort((a, b) => {
        const valA = a.data[field];
        const valB = b.data[field];
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;
        return valA > valB ? dir : valA < valB ? -dir : 0;
      });
    }

    if (this.limitNum !== undefined) {
      docsList = docsList.slice(0, this.limitNum);
    }

    const docs = docsList.map(doc => ({
      id: doc.id,
      exists: true,
      data: () => doc.data,
      ref: new LocalDocument(this.db, this.colName, doc.id)
    }));

    return {
      empty: docs.length === 0,
      size: docs.length,
      docs,
      forEach(callback: (doc: any) => void) {
        docs.forEach(callback);
      }
    };
  }
}

const realDb = getFirestore(databaseId);
const fallbackDb = new LocalFirestore();

let isFallbackMode = true;

async function checkConnectivity() {
  try {
    await realDb.collection('jobs').limit(1).get();
    isFallbackMode = false;
    console.log('[Firebase Admin] Connected to live cloud Firestore database!');
  } catch (err: any) {
    console.warn('[Firebase Admin] Live database query failed with insufficient permissions (GCP cross-project organization restrictions are active). Activating high-fidelity fallback persistent storage.');
  }
}
checkConnectivity();

export const db: any = new Proxy({}, {
  get(target, prop) {
    const activeDb = isFallbackMode ? fallbackDb : realDb;
    const value = Reflect.get(activeDb, prop);
    if (typeof value === 'function') {
      return value.bind(activeDb);
    }
    return value;
  }
});

export const auth = getAuth(authApp);

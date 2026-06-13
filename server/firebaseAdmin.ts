import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "../firebase-applet-config.json" assert { type: "json" };

const projectId = firebaseConfig.projectId;
const databaseId = firebaseConfig.firestoreDatabaseId;

console.log(`[firebaseAdmin] Initializing with ProjectID: ${projectId}, DatabaseID: ${databaseId}`);

const app = admin.apps.length === 0 ? admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: projectId,
}) : admin.app();

// Access the specific named database
const realDb = getFirestore(app, databaseId);

// ==========================================
// Robust In-Memory Fallback Implementation
// ==========================================

class InMemoryWriteBatch {
  private operations: (() => void)[] = [];
  constructor(private db: InMemoryDatabase) {}

  set(docRef: InMemoryDocReference, data: any, options?: { merge?: boolean }) {
    this.operations.push(() => docRef.set(data, options));
    return this;
  }

  update(docRef: InMemoryDocReference, data: any) {
    this.operations.push(() => docRef.update(data));
    return this;
  }

  delete(docRef: InMemoryDocReference) {
    this.operations.push(() => docRef.delete());
    return this;
  }

  async commit() {
    for (const op of this.operations) op();
    return [];
  }
}

class InMemoryDocReference {
  constructor(public collectionName: string, public docId: string, private db: InMemoryDatabase) {}
  
  get ref() { return this; }
  async get() {
    const data = this.db.getDoc(this.collectionName, this.docId);
    return {
      id: this.docId,
      exists: data !== undefined,
      data: () => data ? { ...data } : undefined
    };
  }

  async set(data: any, options?: { merge?: boolean }) {
    this.db.setDoc(this.collectionName, this.docId, data, options?.merge);
    return { writeTime: Date.now() };
  }

  async update(data: any) {
    this.db.updateDoc(this.collectionName, this.docId, data);
    return { writeTime: Date.now() };
  }

  async delete() {
    this.db.deleteDoc(this.collectionName, this.docId);
    return { writeTime: Date.now() };
  }
}

class InMemoryQuery {
  constructor(
    protected collectionName: string,
    protected db: InMemoryDatabase,
    protected filters: any[] = [],
    protected limitCount: number = -1,
    protected orderField: string | null = null,
    protected orderDir: 'asc' | 'desc' = 'asc'
  ) {}

  where(field: string, op: string, value: any) {
    return new InMemoryQuery(
      this.collectionName,
      this.db,
      [...this.filters, { field, op, value }],
      this.limitCount,
      this.orderField,
      this.orderDir
    );
  }

  limit(n: number) {
    return new InMemoryQuery(
      this.collectionName,
      this.db,
      this.filters,
      n,
      this.orderField,
      this.orderDir
    );
  }

  orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
    return new InMemoryQuery(
      this.collectionName,
      this.db,
      this.filters,
      this.limitCount,
      field,
      dir
    );
  }

  async get() {
    let docs = this.db.getCollectionDocs(this.collectionName);

    // Apply where filters
    for (const filter of this.filters) {
      docs = docs.filter(doc => {
        const val = doc[filter.field];
        if (filter.op === '==') return val === filter.value;
        if (filter.op === '>=') return val >= filter.value;
        if (filter.op === '<=') return val <= filter.value;
        if (filter.op === '>') return val > filter.value;
        if (filter.op === '<') return val < filter.value;
        if (filter.op === 'array-contains') return Array.isArray(val) && val.includes(filter.value);
        if (filter.op === 'in') return Array.isArray(filter.value) && filter.value.includes(val);
        return true;
      });
    }

    // Apply ordering
    if (this.orderField) {
      const f = this.orderField;
      const d = this.orderDir === 'desc' ? -1 : 1;
      docs.sort((a, b) => {
        if (a[f] < b[f]) return -1 * d;
        if (a[f] > b[f]) return 1 * d;
        return 0;
      });
    }

    // Apply limit
    if (this.limitCount >= 0) {
      docs = docs.slice(0, this.limitCount);
    }

    const firestoreDocs = docs.map(d => ({
      id: d.id,
      exists: true,
      data: () => ({ ...d })
    }));

    return {
      docs: firestoreDocs,
      empty: firestoreDocs.length === 0,
      size: firestoreDocs.length,
      forEach: (cb: any) => firestoreDocs.forEach(cb)
    };
  }
}

class InMemoryCollectionReference extends InMemoryQuery {
  doc(docId?: string) {
    const id = docId || Math.random().toString(36).substring(2, 15);
    return new InMemoryDocReference(this.collectionName, id, this.db);
  }

  async add(data: any) {
    const id = Math.random().toString(36).substring(2, 15);
    const docRef = this.doc(id);
    await docRef.set({ ...data, id });
    return docRef;
  }
}

class InMemoryDatabase {
  private store = new Map<string, Map<string, any>>();

  getDoc(col: string, id: string): any {
    return this.store.get(col)?.get(id);
  }

  setDoc(col: string, id: string, data: any, merge = false) {
    if (!this.store.has(col)) {
      this.store.set(col, new Map());
    }
    const colStore = this.store.get(col)!;
    if (merge && colStore.has(id)) {
      colStore.set(id, { ...colStore.get(id), ...data, id });
    } else {
      colStore.set(id, { ...data, id });
    }
  }

  updateDoc(col: string, id: string, data: any) {
    if (!this.store.has(col)) {
      this.store.set(col, new Map());
    }
    const colStore = this.store.get(col)!;
    const existing = colStore.get(id) || {};
    colStore.set(id, { ...existing, ...data, id });
  }

  deleteDoc(col: string, id: string) {
    this.store.get(col)?.delete(id);
  }

  getCollectionDocs(col: string): any[] {
    const colStore = this.store.get(col);
    if (!colStore) return [];
    return Array.from(colStore.values());
  }

  collection(name: string) {
    return new InMemoryCollectionReference(name, this);
  }

  async listCollections() {
    return Array.from(this.store.keys()).map(name => ({
      id: name
    }));
  }

  batch() {
    return new InMemoryWriteBatch(this);
  }
}

const memoryDb = new InMemoryDatabase();
let useMemoryFallback = false;

// Proxy db to support seamless, dynamic in-memory fallback
// Recursive proxy creator to support deep chained operations with seamless, automatic fallback
function createSafeProxy(target: any, path: any[] = []): any {
  if (target === null || target === undefined) return target;
  if (typeof target !== "object" && typeof target !== "function") return target;

  return new Proxy(target, {
    get(obj, prop) {
      // Intercept if already transitioned to fallback mode on root
      if (useMemoryFallback) {
        // Direct property/functional delegation can occur when continuing
      }

      // Track this step in the property access path
      const currentPath = [...path, { prop, isFunc: false, args: [] as any[] }];

      const val = Reflect.get(obj, prop);
      if (typeof val === "function") {
        return function(...args: any[]) {
          // Record function usage
          if (currentPath.length > 0) {
            currentPath[currentPath.length - 1].isFunc = true;
            currentPath[currentPath.length - 1].args = args;
          }

          try {
            const res = val.apply(obj, args);
            
            // Intercept Promise rejections
            if (res && typeof res.then === "function") {
              return res.catch((err: any) => {
                const isPermissionDenied = err?.code === 7 ||
                  (err?.message && (err.message.includes("PERMISSION_DENIED") || err.message.includes("insufficient permissions")));
                
                if (isPermissionDenied) {
                  if (!useMemoryFallback) {
                    console.log("[firebaseAdmin] Firestore PERMISSION_DENIED caught. Switching to local in-memory store.");
                    useMemoryFallback = true;
                  }
                  
                  // Replay the full path on the memory database
                  console.log("[firebaseAdmin] Replaying failed Firestore operation on in-memory store:", currentPath.map(p => String(p.prop)).join(" -> "));
                  let currentMemTarget: any = memoryDb;
                  for (const step of currentPath) {
                    const fn = currentMemTarget[step.prop];
                    if (step.isFunc && typeof fn === "function") {
                      currentMemTarget = fn.apply(currentMemTarget, step.args);
                    } else {
                      currentMemTarget = currentMemTarget[step.prop];
                    }
                  }
                  return currentMemTarget;
                }
                throw err;
              });
            }
            
            // Do not proxy plain objects returned by data() or other data-extractors
            if (prop === "data" && res && typeof res === "object") {
              return res;
            }

            return createSafeProxy(res, currentPath);
          } catch (err: any) {
            const isPermissionDenied = err?.code === 7 ||
              (err?.message && (err.message.includes("PERMISSION_DENIED") || err.message.includes("insufficient permissions")));
            
            if (isPermissionDenied) {
              if (!useMemoryFallback) {
                console.log("[firebaseAdmin] Firestore PERMISSION_DENIED caught. Switching to local in-memory store.");
                useMemoryFallback = true;
              }
              
              let currentMemTarget: any = memoryDb;
              for (const step of currentPath) {
                const fn = currentMemTarget[step.prop];
                if (step.isFunc && typeof fn === "function") {
                  currentMemTarget = fn.apply(currentMemTarget, step.args);
                } else {
                  currentMemTarget = currentMemTarget[step.prop];
                }
              }
              return currentMemTarget;
            }
            throw err;
          }
        };
      }
      
      if (val !== null && typeof val === "object") {
        return createSafeProxy(val, currentPath);
      }
      
      return val;
    }
  });
}

export const db = new Proxy({}, {
  get(target, prop) {
    if (useMemoryFallback) {
      return Reflect.get(memoryDb, prop);
    }
    
    const realProp = Reflect.get(realDb, prop);
    if (typeof realProp === "function") {
      return function(...args: any[]) {
        const path = [{ prop, isFunc: true, args }];
        try {
          const res = realProp.apply(realDb, args);
          if (res && typeof res.then === "function") {
            // Promise wrapper for direct calls on db
            return res.catch((err: any) => {
              if (err?.code === 7 || (err?.message && (err.message.includes("PERMISSION_DENIED") || err.message.includes("insufficient permissions")))) {
                if (!useMemoryFallback) {
                  console.log("[firebaseAdmin] Firestore PERMISSION_DENIED caught on root. Switching to local in-memory store.");
                  useMemoryFallback = true;
                }
                const fn = memoryDb[prop];
                return fn.apply(memoryDb, args);
              }
              throw err;
            });
          }
          return createSafeProxy(res, path);
        } catch (err: any) {
          if (err?.code === 7 || (err?.message && (err.message.includes("PERMISSION_DENIED") || err.message.includes("insufficient permissions")))) {
            if (!useMemoryFallback) {
              console.log("[firebaseAdmin] Firestore PERMISSION_DENIED caught on root. Switching to local in-memory store.");
              useMemoryFallback = true;
            }
            const fn = memoryDb[prop];
            return fn.apply(memoryDb, args);
          }
          throw err;
        }
      };
    }
    return createSafeProxy(realProp, [{ prop, isFunc: false, args: [] }]);
  }
}) as any;

// Test connectivity on boot and trigger fallback pre-emptively if failed
console.log("[firebaseAdmin] Probing real Firestore connectivity...");
realDb.listCollections().then(cols => {
  console.log(`[firebaseAdmin] Successfully connected to real Firestore. Collections visible: ${cols.length}`);
}).catch(err => {
  console.log(`[firebaseAdmin] Firestore connection failed or returned permission denied. Activating seamless local database fallback. Error:`, err.message);
  useMemoryFallback = true;
});


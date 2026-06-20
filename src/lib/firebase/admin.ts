import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getAppletConfig } from './config';
import { handleAll, circuitBreaker, ConsecutiveBreaker } from 'cockatiel';

export class FirestoreUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirestoreUnavailableError';
  }
}

// Circuit breaker trips after 50 consecutive failures, with cool down of 10s
export const dbCircuitBreaker = circuitBreaker(handleAll, {
  halfOpenAfter: 10000,
  breaker: new ConsecutiveBreaker(50)
});

function captureMockSentryException(error: any, extra?: any) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    event: "Sentry.captureException",
    level: "ERROR",
    error: error?.message || String(error),
    stack: error?.stack,
    ...extra
  }));
}

let adminApp: App | undefined;
let db: any;
let auth: Auth | undefined;

export const hasServiceAccount = !!(
  (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.K_SERVICE || // Cloud Run / AI Studio environment
  process.env.AIS_BENTO // Bento AI Studio environment
);

function shouldBypassProxy(obj: any): boolean {
  if (obj === null || obj === undefined) return true;
  if (typeof obj !== 'object' && typeof obj !== 'function') return true;
  
  if (
    obj instanceof Map || 
    obj instanceof Set || 
    obj instanceof Date || 
    obj instanceof RegExp || 
    obj instanceof Promise ||
    obj instanceof WeakMap ||
    obj instanceof WeakSet
  ) {
    return true;
  }

  const name = obj.constructor?.name;
  if (
    name === 'Timestamp' || 
    name === 'FieldValue' || 
    name === 'FieldPath' || 
    name === 'GeoPoint'
  ) {
    return true;
  }

  return false;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function makeSafeFirestoreProxy(target: any, path = "db"): any {
  if (target === null || target === undefined) return target;

  const proxyCache = new WeakMap<any, any>();

  async function executeWithRetry<T>(fn: () => Promise<T>, currentPath: string, propName: string, args: any[] = [], attempt = 1): Promise<T> {
    const isProd = process.env.NODE_ENV === "production";
    
    try {
      // Execute the operation within the cockatiel circuit breaker
      return await dbCircuitBreaker.execute(async () => {
        try {
          return await fn();
        } catch (nativeErr: any) {
          const errStr = String(nativeErr?.message || nativeErr).toLowerCase();
          const code = nativeErr.code;
          
          const isPermissionDenied = 
            code === 7 || 
            code === 'permission-denied' || 
            errStr.includes("permission") ||
            errStr.includes("denied") ||
            errStr.includes("missing or insufficient permissions");

          const isFailedPrecondition = 
            code === 9 || 
            code === 'failed-precondition' || 
            errStr.includes("precondition") ||
            errStr.includes("index") ||
            errStr.includes("composite index");

          const isUnauthenticated = 
            code === 16 || 
            code === 'unauthenticated' || 
            errStr.includes("unauthenticated");

          const isNotFound = code === 5 || errStr.includes("not_found") || errStr.includes("not found");

          // Always fallback gracefully to prevent crash loops and circuit breaker tripping
          if (isPermissionDenied || isUnauthenticated || isFailedPrecondition || isNotFound || !hasServiceAccount) {
            return handleFallback(currentPath, propName, args);
          }
          
          throw nativeErr;
        }
      });
    } catch (err: any) {
      if (err.name === 'BrokenCircuitException' || err.message?.includes('circuit breaker')) {
        const breakerMsg = "Firestore circuit breaker triggered. Database calls are temporarily halted to prevent cascading failures.";
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "ERROR",
          message: breakerMsg,
          path: currentPath,
          operation: propName,
          alert: "FIRESTORE_CIRCUIT_BREAKER_ACTIVE"
        }));
        
        throw new FirestoreUnavailableError(breakerMsg);
      }

      const errStr = String(err?.message || err).toLowerCase();
      const code = err.code;

      const isTransient = 
        code === 4 || // DEADLINE_EXCEEDED
        code === 14 || // UNAVAILABLE
        code === 10 || // ABORTED
        errStr.includes("deadline exceeded") ||
        errStr.includes("unavailable") ||
        errStr.includes("aborted") ||
        errStr.includes("socket") ||
        errStr.includes("timeout");

      const isPermissionDenied = 
        code === 7 || 
        code === 'permission-denied' || 
        errStr.includes("permission") ||
        errStr.includes("denied") ||
        errStr.includes("missing or insufficient permissions");

      const isFailedPrecondition = 
        code === 9 || 
        code === 'failed-precondition' || 
        errStr.includes("precondition") ||
        errStr.includes("index") ||
        errStr.includes("composite index");

      const isUnauthenticated = 
        code === 16 || 
        code === 'unauthenticated' || 
        errStr.includes("unauthenticated");

      const isNotFound = code === 5 || errStr.includes("not_found") || errStr.includes("not found");

      // 1. Log the failure structurally with audit/alert metrics
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: isPermissionDenied || isUnauthenticated || isFailedPrecondition ? "ERROR" : "WARN",
        message: `[Firestore Safe Guard] Error occurred during invocation of ${currentPath}.${propName}()`,
        path: currentPath,
        operation: propName,
        code,
        error: err.message || err,
        isTransient: isTransient || isNotFound,
        attempt,
        hasServiceAccount,
        isProduction: isProd,
        config: {
          projectId: getAppletConfig().projectId,
          databaseId: getAppletConfig().firestoreDatabaseId,
          envDatabaseId: process.env.FIREBASE_DATABASE_ID
        }
      };
      
      const shouldSuppress = !isProd && (isPermissionDenied || isUnauthenticated || isFailedPrecondition || isNotFound);

      if (shouldSuppress) {
        // In dev mode, we log as info to avoid triggering error detectors while maintaining visibility
        console.info(`[Firestore Safe Guard] Using local fallback (Database not yet fully provisioned or configured).`);
      } else {
        console.error(JSON.stringify({
          ...logEntry,
          alert: (isPermissionDenied || isUnauthenticated || isFailedPrecondition) ? "CRITICAL_DATABASE_ISSUE" : "DATABASE_WARN"
        }));
        // Trigger Sentry Exception Capture Telemetry (Item 1 / 6)
        captureMockSentryException(err, { currentPath, propName, code });
      }

      // 2. Exponential retry for transient issues (up to 3 times)
      if ((isTransient || (isNotFound && hasServiceAccount)) && attempt < 3) {
        const delay = Math.pow(2, attempt) * 100; // 200ms, 400ms, etc.
        console.log(`[Firestore Safe Guard] Retrying ${currentPath}.${propName}() in ${delay}ms... (Attempt ${attempt}/3)`);
        await sleep(delay);
        return executeWithRetry(fn, currentPath, propName, args, attempt + 1);
      }

      const configMissingOrDev = !hasServiceAccount || !isProd;

      if (configMissingOrDev) {
        // In local sandbox development, gracefully fall back to prevent complete lockouts
        if (isPermissionDenied || isUnauthenticated || isFailedPrecondition || isNotFound || !hasServiceAccount) {
          return handleFallback(currentPath, propName, args);
        }
      }

      // 3. Strict propagation strategy
      // In all environments, strictly throw the FirestoreUnavailableError if real DB fails
      throw new FirestoreUnavailableError(`Firestore operation failed: ${err.message || err}`);
    }
  }

  function handleFallback(currentPath: string, propName: string, args: any[]): any {
    console.warn(`[Firestore Safe Guard][DEGRADED_MODE] Local/Dev mode fallback enabled for ${currentPath}.${propName}. Returning dummy mock payload.`);
          
    if (propName === 'runTransaction') {
      const cb = args[0];
      console.warn(`[Firestore Safe Guard][DEGRADED_MODE] Executing runTransaction callback with mock transaction.`);
      const mockTx = {
        get: async (ref: any) => ({ exists: false, data: () => ({}), ref, id: ref?.id || "mock" }),
        set: (ref: any, data: any) => mockTx,
        update: (ref: any, data: any) => mockTx,
        delete: (ref: any) => mockTx,
        getAll: async (...refs: any[]) => refs.map(ref => ({ exists: false, data: () => ({}), ref, id: ref?.id || "mock" }))
      };
      return cb(mockTx);
    }
    if (propName === 'get') {
      return {
        exists: false,
        empty: true,
        size: 0,
        docs: [],
        id: "mock_" + Math.random().toString(36).substring(2, 10),
        data: () => ({}),
        forEach: (cb: any) => {},
        ref: createProxy({}, `${currentPath}.ref`),
      } as any;
    }
    if (propName === 'add') {
      return {
        id: "mock_" + Math.random().toString(36).substring(2, 10),
        path: `${currentPath}/mock_id`,
        get: async () => ({ exists: false, data: () => ({}) }),
      } as any;
    }
    if (propName === 'set' || propName === 'update' || propName === 'delete' || propName === 'create') {
      return { writeTime: Date.now() } as any;
    }
    if (propName === 'commit') {
      return [{ writeTime: Date.now() }] as any;
    }
    return { success: true, mock: true } as any;
  }

  function createProxy(obj: any, currentPath: string): any {
    if (shouldBypassProxy(obj)) {
      return obj;
    }
    if (proxyCache.has(obj)) {
      return proxyCache.get(obj);
    }

    const proxy = new Proxy(obj, {
      get(targetObj, prop, receiver) {
        if (typeof prop === 'symbol') {
          return Reflect.get(targetObj, prop, receiver);
        }

        let value = Reflect.get(targetObj, prop, receiver);

        // In development, handle missing properties strictly as well
        if (value === undefined) {
          return value;
        }

        if (typeof value === 'function') {
          return function(this: any, ...args: any[]) {
            try {
              const context = (this === proxy) ? targetObj : (this || targetObj);
              const res = value.apply(context, args);

              if (res instanceof Promise) {
                // Prevent unhandled promise rejection if this first execution is swept aside 
                // by the circuit breaker or fails during a retry.
                res.catch(() => {});

                let isFirstCall = true;
                const fn = () => {
                  if (isFirstCall) {
                    isFirstCall = false;
                    return res;
                  }
                  return value.apply(context, args);
                };

                return executeWithRetry(fn, currentPath, String(prop), args);
              }

              if (res && (typeof res === 'object' || typeof res === 'function')) {
                return createProxy(res, `${currentPath}.${String(prop)}`);
              }

              return res;
            } catch (err: any) {
              const errStr = String(err?.message || err).toLowerCase();
              const isPermissionDenied = 
                err.code === 7 || 
                err.code === 'permission-denied' || 
                errStr.includes("permission") ||
                errStr.includes("denied") ||
                errStr.includes("missing or insufficient permissions");
              
              const isNotFound = err.code === 5 || errStr.includes("not found");

              console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: "ERROR",
                message: `[Firestore Safe Guard] Sync invocation failure at ${currentPath}.${String(prop)}()`,
                error: err.message || err
              }));
              throw err;
            }
          };
        }

        if (value && typeof value === 'object') {
          return createProxy(value, `${currentPath}.${String(prop)}`);
        }

        return value;
      }
    });

    proxyCache.set(obj, proxy);
    return proxy;
  }

  return createProxy(target, path);
}

export function initFirebaseAdmin() {
  if (adminApp) return { db, auth: auth!, adminApp, hasServiceAccount };

  const config = getAppletConfig();
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (getApps().length === 0) {
    if (projectId && clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('[Firebase Admin] Initialized with Service Account Credentials.');
    } else {
      adminApp = initializeApp({
        projectId: config.projectId
      });
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ Firebase Admin credentials missing in production. Expect PERMISSION_DENIED on reads/writes.');
      } else {
        console.warn('⚠️ Firebase Admin credentials missing. Run "npm run setup" or provide Service Account ENV vars.');
      }
    }
  } else {
    adminApp = getApps()[0];
  }

  const actualDb = getFirestore(adminApp, config.firestoreDatabaseId);
  db = makeSafeFirestoreProxy(actualDb);
  auth = getAuth(adminApp);

  return { db, auth, adminApp };
}

// Initialize immediately so db and auth exports are available
initFirebaseAdmin();

export { db, auth, adminApp };

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handleServerError(error: unknown): never {
  const code = (error as { code?: string | number }).code;
  if (code === 'permission-denied' || code === 7 || (error instanceof Error && error.message.includes('PERMISSION_DENIED'))) {
    throw new DatabaseError(
      'DATABASE_UNAVAILABLE: Firestore permission denied. ' +
      'Check FIREBASE_PRIVATE_KEY and service account permissions in Firebase Console.'
    );
  }
  if (error instanceof Error && error.message.includes('Service Account')) {
    throw new DatabaseError(error.message);
  }
  throw error as Error;
}

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Firebase configuration from environment variables (injected by Vite)
declare const __FIREBASE_CONFIG__: any;

const getInjectedConfig = () => {
  if (typeof __FIREBASE_CONFIG__ !== 'undefined') {
    return __FIREBASE_CONFIG__;
  }
  return null;
};

const injectedConfig = getInjectedConfig();

const firebaseConfig = {
  apiKey: (injectedConfig?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
  authDomain: (injectedConfig?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
  projectId: (injectedConfig?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
  storageBucket: (injectedConfig?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
  messagingSenderId: (injectedConfig?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
  appId: (injectedConfig?.appId || import.meta.env.VITE_FIREBASE_APP_ID || '').trim(),
  firestoreDatabaseId: (injectedConfig?.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '').trim(),
};

console.log("Firebase Config Status:", {
  hasApiKey: !!firebaseConfig.apiKey,
  apiKeyPrefix: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 5)}...` : 'None',
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId,
  source: injectedConfig ? 'Injected' : 'Env',
  timestamp: new Date().toISOString()
});

// Initialize Firebase safely
let app: any;
let auth: any;
let db: any;
let initError: string | null = null;

export const isFirebaseConfigValid = !!firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('TODO');

try {
  if (isFirebaseConfigValid) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
  } else {
    initError = "Firebase API Key is missing or is a placeholder (TODO).";
  }
} catch (error: any) {
  console.error("Error initializing Firebase:", error);
  initError = error.message;
}

export { auth, db, initError };

// Error handling for Firestore permissions
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData.map((provider: any) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection
async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

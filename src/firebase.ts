import { initializeApp } from 'firebase/app';
// Firebase Configuration and Initialization
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Load configuration from environment variables (VITE_ prefix for client-side)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID
};

// Validation and Error Reporting
const isValidKey = (key: any) => {
  return typeof key === 'string' && key.length > 10 && key.startsWith('AIza');
};

export const isFirebaseConfigValid = isValidKey(firebaseConfig.apiKey) && !!firebaseConfig.projectId;

if (!isFirebaseConfigValid) {
  const missing = [];
  if (!isValidKey(firebaseConfig.apiKey)) {
    const keyType = typeof firebaseConfig.apiKey;
    const keyVal = String(firebaseConfig.apiKey);
    missing.push(`API Key (Type: ${keyType}, Start: ${keyVal.substring(0, 4)}...)`);
  }
  if (!firebaseConfig.projectId) missing.push('Project ID');
  
  console.error(`Firebase Configuration Error: Missing or Invalid ${missing.join(', ')}`);
}

// Initialize Firebase safely
let app;
let auth: any;
let db: any;

try {
  if (isFirebaseConfigValid) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

export { auth, db };

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

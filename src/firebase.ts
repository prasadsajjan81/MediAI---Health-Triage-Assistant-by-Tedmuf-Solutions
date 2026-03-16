import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Import the Firebase configuration from the config file if it exists
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase safely
let app;
let auth: any;
let db: any;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

export { auth, db };

// Validation for UI
export const isFirebaseConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

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

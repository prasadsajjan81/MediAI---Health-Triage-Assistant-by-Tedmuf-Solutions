
import { firebaseAppletConfig } from './firebase-config';

export const config = {
  apiKey: firebaseAppletConfig.apiKey || '',
  authDomain: firebaseAppletConfig.authDomain || '',
  projectId: firebaseAppletConfig.projectId || '',
  storageBucket: firebaseAppletConfig.storageBucket || '',
  messagingSenderId: firebaseAppletConfig.messagingSenderId || '',
  appId: firebaseAppletConfig.appId || '',
  firestoreDatabaseId: firebaseAppletConfig.firestoreDatabaseId || '',
};

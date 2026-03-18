import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
    
    // Load Firebase config from JSON if it exists (for AI Studio context)
    let firebaseConfig = {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      firestoreDatabaseId: ''
    };

    // Firebase configuration is now handled via src/firebase-config.ts
    // This simplifies the build process and avoids JSON resolution issues.
    const finalConfig = {
      apiKey: env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY || '',
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN || '',
      projectId: env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '',
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.VITE_FIREBASE_APP_ID || env.FIREBASE_APP_ID || '',
      firestoreDatabaseId: env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || env.FIREBASE_FIRESTORE_DATABASE_ID || '',
    };

    console.log('Vite Build: Final Firebase Config API Key present:', !!finalConfig.apiKey);

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        // Inject the whole config object as a global
        '__FIREBASE_CONFIG__': JSON.stringify(finalConfig),
        // Also inject individual variables for compatibility
        'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(finalConfig.apiKey),
        'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(finalConfig.authDomain),
        'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(finalConfig.projectId),
        'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(finalConfig.storageBucket),
        'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(finalConfig.messagingSenderId),
        'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(finalConfig.appId),
        'import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID': JSON.stringify(finalConfig.firestoreDatabaseId),
        'import.meta.env.VITE_RAZORPAY_KEY_ID': JSON.stringify(env.VITE_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(process.cwd(), '.'),
        }
      }
    };
});

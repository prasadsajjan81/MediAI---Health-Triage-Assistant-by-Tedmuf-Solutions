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

    const configPaths = [
      path.resolve(__dirname, 'src/firebase-applet-config.json'),
      path.resolve(__dirname, 'firebase-applet-config.json'),
      path.resolve(process.cwd(), 'src/firebase-applet-config.json'),
      path.resolve(process.cwd(), 'firebase-applet-config.json')
    ];

    console.log('Vite Build: Checking config paths:', configPaths);

    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          firebaseConfig = { ...firebaseConfig, ...fileConfig };
          console.log(`Vite Build: Loaded config from ${configPath}`);
          break;
        } catch (e) {
          console.error(`Vite Build: Error parsing ${configPath}:`, e);
        }
      }
    }

    if (!firebaseConfig.apiKey && !env.VITE_FIREBASE_API_KEY && !env.FIREBASE_API_KEY) {
      console.warn('Vite Build: No Firebase API Key found in environment or JSON config files.');
    }

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
        '__FIREBASE_CONFIG__': JSON.stringify({
          apiKey: env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY || firebaseConfig.apiKey || '',
          authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain || '',
          projectId: env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || firebaseConfig.projectId || '',
          storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket || '',
          messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId || '',
          appId: env.VITE_FIREBASE_APP_ID || env.FIREBASE_APP_ID || firebaseConfig.appId || '',
          firestoreDatabaseId: env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || env.FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '',
        }),
        'import.meta.env.VITE_RAZORPAY_KEY_ID': JSON.stringify(env.VITE_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(process.cwd(), '.'),
        }
      }
    };
});

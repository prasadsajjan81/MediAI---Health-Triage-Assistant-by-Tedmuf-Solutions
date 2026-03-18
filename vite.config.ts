import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

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
      path.resolve(__dirname, 'firebase-applet-config.json')
    ];

    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          firebaseConfig = { ...firebaseConfig, ...fileConfig };
          break;
        } catch (e) {
          console.error(`Error parsing ${configPath}:`, e);
        }
      }
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
        'import.meta.env.VITE_RAZORPAY_KEY_ID': JSON.stringify(env.VITE_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

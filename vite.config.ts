
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use (process as any) to avoid TS errors if @types/node is missing
  const cwd = (process as any).cwd ? (process as any).cwd() : '.';
  const env = loadEnv(mode, cwd, '');
  
  // 1. Prioritize VITE_API_KEY (standard for Vite)
  // 2. Fallback to API_KEY (standard for Node/Vercel)
  // 3. Fallback to a hardcoded string to prevent build crash (even if invalid for Gemini, it stops the "undefined" error)
  const apiKey = env.VITE_API_KEY || env.API_KEY || "";

  return {
    plugins: [react()],
    define: {
      // Define process.env globally to prevent "process is not defined" error
      'process.env': {
         API_KEY: apiKey
      }
    },
  };
});

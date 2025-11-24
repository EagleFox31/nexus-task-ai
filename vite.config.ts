import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill pour éviter les erreurs de process.env dans certaines libs
    'process.env': {} 
  }
});
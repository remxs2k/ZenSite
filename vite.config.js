import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Use absolute base for reliable deep links on Vercel/SPA fallback
  base: '/',
  plugins: [
    react({
      // remove babel-plugin-react-compiler — it's for React 19 only
      babel: {
        plugins: [],
      },
    }),
  ],
});

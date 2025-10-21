import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Use relative base so preview/static hosting under a subpath works
  base: './',
  plugins: [
    react({
      // remove babel-plugin-react-compiler — it's for React 19 only
      babel: {
        plugins: [],
      },
    }),
  ],
});

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_SHEETS_WEBHOOK_URL || '';
  return {
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
    server: {
      proxy: target && target.startsWith('http') ? {
        '/gsheets': {
          target,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/gsheets/, ''),
        },
      } : undefined,
    },
  };
});


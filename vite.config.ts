import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gerar version.json para controle de cache apenas se não existir
const version = new Date().getTime();
const publicDir = path.resolve(__dirname, 'public');
const versionFile = path.resolve(publicDir, 'version.json');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(versionFile, JSON.stringify({ version }));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    '__APP_VERSION__': version,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
        output: {
            manualChunks: {
                vendor: ['react', 'react-dom', 'react-router-dom'],
                maps: ['leaflet', 'react-leaflet'],
                db: ['@supabase/supabase-js']
            }
        }
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    hmr: false,
    proxy: {
      '/whaticket-proxy': {
        target: 'https://app.whatendimento.digital/backend',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/whaticket-proxy/, '')
      },
      '/supabase-proxy': {
        target: 'https://nfbolgqsrpjqhpoplulf.supabase.co',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/supabase-proxy/, '')
      }
    }
  }
});

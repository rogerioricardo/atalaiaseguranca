const fs = require('fs');
let content = fs.readFileSync('vite.config.ts', 'utf8');

const replacement = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gerar version.json para controle de cache
const version = new Date().getTime();
if (!fs.existsSync(path.resolve(__dirname, 'public'))) {
  fs.mkdirSync(path.resolve(__dirname, 'public'));
}
fs.writeFileSync(path.resolve(__dirname, 'public/version.json'), JSON.stringify({ version }));

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
    host: true
  }
});
`;

fs.writeFileSync('vite.config.ts', replacement);

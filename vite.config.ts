import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';
import { randomBytes, createHash } from 'crypto';
import { TextEncoder, TextDecoder } from 'util';

if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      getRandomValues: (arr: Uint8Array) => {
        if (!(arr instanceof Uint8Array)) {
          throw new TypeError('Expected Uint8Array');
        }
        const bytes = randomBytes(arr.length);
        arr.set(bytes);
        return arr;
      },
      subtle: {
        digest: async (algorithm: string, data: ArrayBuffer | ArrayBufferView) => {
          const normalized = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
          if (algorithm !== 'SHA-256') {
            throw new Error(`Unsupported algorithm: ${algorithm}`);
          }
          const hash = createHash('sha256');
          hash.update(Buffer.from(normalized));
          return hash.digest();
        }
      }
    },
    configurable: true,
    enumerable: false
  });
}

if (typeof globalThis.TextEncoder === 'undefined') {
  Object.defineProperty(globalThis, 'TextEncoder', {
    value: TextEncoder,
    configurable: true,
    enumerable: false
  });
}

if (typeof globalThis.TextDecoder === 'undefined') {
  Object.defineProperty(globalThis, 'TextDecoder', {
    value: TextDecoder,
    configurable: true,
    enumerable: false
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
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
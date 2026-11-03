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

import https from 'https';
import http from 'http';

function whaticketProxyPlugin() {
  return {
    name: 'whaticket-custom-proxy',
    configureServer(server: any) {
      server.middlewares.use('/whaticket-proxy', (req: any, res: any, next: any) => {
        if (req.method !== 'POST') {
          return next();
        }

        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', async () => {
          const authHeader = req.headers['authorization'] || '';
          const apikeyHeader = req.headers['apikey'] || '';
          const subPath = '/backend' + (req.url || '');

          const forwardRequest = (port: number, isHttps: boolean) => {
            return new Promise<{ statusCode: number; headers: any; body: string }>((resolve, reject) => {
              const client = isHttps ? https : http;
              const options = {
                hostname: 'whatsapp.alienmonitoramento.com.br',
                port,
                path: subPath,
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(body),
                  ...(authHeader ? { 'Authorization': authHeader } : {}),
                  ...(apikeyHeader ? { 'apikey': apikeyHeader } : {})
                },
                rejectUnauthorized: false,
                timeout: 8000
              };

              const upstreamReq = client.request(options, (upstreamRes) => {
                let responseData = '';
                upstreamRes.on('data', (chunk) => { responseData += chunk; });
                upstreamRes.on('end', () => {
                  resolve({
                    statusCode: upstreamRes.statusCode || 200,
                    headers: upstreamRes.headers,
                    body: responseData
                  });
                });
              });

              upstreamReq.on('error', reject);
              upstreamReq.on('timeout', () => {
                upstreamReq.destroy();
                reject(new Error('Timeout de conexão com o servidor Whaticket'));
              });
              upstreamReq.write(body);
              upstreamReq.end();
            });
          };

          try {
            // Tenta primeiro HTTPS (443)
            let result: { statusCode: number; headers: any; body: string };
            try {
              result = await forwardRequest(443, true);
            } catch {
              // Se falhar o handshake SSL, tenta HTTP (80)
              result = await forwardRequest(80, false);
            }

            res.writeHead(result.statusCode, {
              'Content-Type': result.headers['content-type'] || 'application/json'
            });
            res.end(result.body);
          } catch (err: any) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: `Servidor Whaticket indisponível (${err.message}). Verifique o SSL e o status do serviço na VPS.`
            }));
          }
        });
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), whaticketProxyPlugin()],
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
      '/supabase-proxy': {
        target: 'https://nfbolgqsrpjqhpoplulf.supabase.co',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/supabase-proxy/, '')
      }
    }
  }
});

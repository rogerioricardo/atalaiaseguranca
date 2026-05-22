import { createClient } from '@supabase/supabase-js';

// Normalização da URL (preferência por variável de ambiente, fallback para o fornecido)
const FALLBACK_URL = 'https://nfbolgqsrpjqhpoplulf.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYm9sZ3FzcnBqcWhwb3BsdWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTY1MTUsImV4cCI6MjA3OTY3MjUxNX0.VQU4KbW2rXHD3VrH5wfSb9_1nojQxQ5VK8h--bFofDk';

const env = (import.meta as any).env || {};

let rawUrl = env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').trim();
const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY).trim();

// Verificação rigorosa se as credenciais são válidas
export const isRealSupabase = !!(supabaseUrl && 
                               supabaseUrl.includes('supabase.co') && 
                               supabaseAnonKey && 
                               supabaseAnonKey.length > 20);

if (!isRealSupabase) {
  console.warn("⚠️ SUPABASE NÃO CONFIGURADO: Usando credenciais de demonstração. Os dados reais não serão carregados.");
  console.info("Para usar seu banco de dados real, adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas configurações (Settings).");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

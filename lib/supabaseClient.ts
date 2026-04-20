
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nfbolgqsrpjqhpoplulf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mYm9sZ3FzcnBqcWhwb3BsdWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTY1MTUsImV4cCI6MjA3OTY3MjUxNX0.VQU4KbW2rXHD3VrH5wfSb9_1nojQxQ5VK8h--bFofDk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'atalaia-auth-token'
  }
});

const fs = require('fs');
let content = fs.readFileSync('src/lib/supabaseClient.ts', 'utf8');

// Replace (import.meta as any).env with just import.meta.env to allow Vite to statically analyze it
content = content.replace(
  /const env = \(import\.meta as any\)\.env \|\| \{\};/g,
  'const env = import.meta.env || {};'
);

fs.writeFileSync('src/lib/supabaseClient.ts', content);

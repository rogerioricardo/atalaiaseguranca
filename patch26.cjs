const fs = require('fs');
let content = fs.readFileSync('src/services/sessionService.ts', 'utf8');
content = `import { MockService } from './mockService';\n` + content;
content = content.replace(/const \{ MockService \} = await import\('\.\/mockService'\);/g, '');
fs.writeFileSync('src/services/sessionService.ts', content);

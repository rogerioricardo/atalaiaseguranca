const fs = require('fs');
let content = fs.readFileSync('src/pages/Cameras.tsx', 'utf8');

// Primeiro: substituir TODOS os `<ExternalLink size={11} /> MONITOR POPUP` para `<Maximize2 size={11} /> MONITOR POPUP`
content = content.replace(/<ExternalLink size={11} \/> MONITOR POPUP/g, '<Maximize2 size={11} /> MONITOR POPUP');

// Segundo: substituir `onClick={handleOpenHttp}` nos botões de `MONITOR POPUP`
content = content.replace(/onClick={handleOpenHttp}\s*>\s*<Maximize2 size=\{11\} \/> MONITOR POPUP/g, 'onClick={onExpand}\n          >\n            <Maximize2 size={11} /> MONITOR POPUP');

// Terceiro: substituir a action no card inline `onClick={() => { ... window.open ... }}` para `onClick={() => setSelectedCameraForModal(cam)}`
const inlineWindowOpenRegex = /onClick=\{\(\) => \{\s*const url = cam\.iframeCode[^}]*\}\s*catch[^}]*\}\s*\}\}/g;
content = content.replace(inlineWindowOpenRegex, 'onClick={() => setSelectedCameraForModal(cam)}');

fs.writeFileSync('src/pages/Cameras.tsx', content);

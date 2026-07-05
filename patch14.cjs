const fs = require('fs');

let content = fs.readFileSync('src/pages/Cameras.tsx', 'utf8');

// Modifica o srcDoc return do CameraStreamPlayer
content = content.replace(
  'className="w-full h-full border-0 absolute inset-0"',
  'className="w-full h-full border-0 absolute inset-0 pointer-events-none"'
);

// Modifica o iframe regular do CameraStreamPlayer
content = content.replace(
  'className="w-full h-full border-0 absolute inset-0" \n         allowFullScreen',
  'className="w-full h-full border-0 absolute inset-0 pointer-events-none" \n         allowFullScreen'
);

// Remove EXPANDIR E MONITORAR
const targetButtons = `<Button \n              className="pointer-events-auto bg-atalaia-neon text-black font-black text-[10px] px-3.5 h-8 gap-1.5 shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:scale-105 transition-all text-xs animate-fade-in"\n              onClick={onExpand}\n            >\n              <Maximize2 size={12} strokeWidth={2.5} /> EXPANDIR E MONITORAR\n            </Button>`;
content = content.replace(targetButtons, '');

const targetButtons2 = `<Button \n             className="pointer-events-auto bg-atalaia-neon text-black font-black text-[10px] px-3.5 h-8 gap-1.5 shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:scale-105 transition-all text-xs"\n            onClick={onExpand}\n          >\n            <Maximize2 size={12} strokeWidth={2.5} /> EXPANDIR E MONITORAR\n          </Button>`;
content = content.replace(targetButtons2, '');

fs.writeFileSync('src/pages/Cameras.tsx', content);

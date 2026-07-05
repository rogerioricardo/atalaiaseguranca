const fs = require('fs');
let content = fs.readFileSync('src/pages/Cameras.tsx', 'utf8');

// Modifica o botão MONITOR POPUP no CameraStreamPlayer para chamar onExpand
content = content.replace(
  'onClick={handleOpenHttp}\n            >\n              <ExternalLink size={11} /> MONITOR POPUP\n            </Button>',
  'onClick={onExpand}\n            >\n              <Maximize2 size={11} /> MONITOR POPUP\n            </Button>'
);

// Remove os botões do canto superior direito do card principal
const targetTopRightButtons = `<div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto z-10">\n                             <button \n                                onClick={() => setSelectedCameraForModal(cam)}\n                                className="p-1.5 bg-gradient-to-r from-atalaia-neon to-emerald-500 hover:scale-105 text-black rounded-lg shadow-[0_0_15px_rgba(0,255,102,0.4)] transition-all flex items-center justify-center"\n                                title="Expandir Visualização"\n                             >\n                                <Maximize2 size={12} strokeWidth={2.5} />\n                             </button>\n                             <button \n                                onClick={() => {\n                                    const url = cam.iframeCode.trim().startsWith('<') \n                                        ? cam.iframeCode.match(/src="([^"]+)"/)?.[1] || '' \n                                        : cam.iframeCode;\n                                    try { window.open(url, \`cam_\${cam.id}\`, 'width=640,height=480,menubar=no,status=no,location=no,toolbar=no,scrollbars=no,resizable=yes'); } catch (e) { console.warn("Invalid URL", e); }\n                                }}\n                                className="p-1.5 bg-black/75 hover:bg-black text-white hover:text-atalaia-neon border border-white/10 rounded-lg transition-all flex items-center justify-center"\n                                title="Abrir Monitor Externo Compacto"\n                             >\n                                <ExternalLink size={12} />\n                             </button>\n                         </div>`;
content = content.replace(targetTopRightButtons, '');

fs.writeFileSync('src/pages/Cameras.tsx', content);

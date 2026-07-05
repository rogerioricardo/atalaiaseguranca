const fs = require('fs');
let content = fs.readFileSync('src/pages/Cameras.tsx', 'utf8');

content = content.replace(
  'interface CameraStreamPlayerProps {\n  iframeCode: string;\n  name: string;\n  id: string;\n  onExpand: () => void;\n  isModal?: boolean;\n}',
  'interface CameraStreamPlayerProps {\n  iframeCode: string;\n  name: string;\n  id: string;\n  onExpand: () => void;\n  isModal?: boolean;\n  maintenancePhotoUrl?: string;\n}'
);

content = content.replace(
  'const CameraStreamPlayer: React.FC<CameraStreamPlayerProps> = React.memo(({ iframeCode, name, id, onExpand, isModal = false }) => {',
  'const CameraStreamPlayer: React.FC<CameraStreamPlayerProps> = React.memo(({ iframeCode, name, id, onExpand, isModal = false, maintenancePhotoUrl }) => {'
);

const oldMaintenanceState = `  if (!iframeCode || iframeCode.trim() === '') {
    return (
      <div className="relative w-full h-full group/video-container flex flex-col items-center justify-center bg-[#0a0a0a] text-center p-4">
        <Wrench className="text-gray-500 mb-2 animate-pulse" size={32} />
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Câmera em Manutenção</h3>
        <p className="text-xs text-gray-500 mt-2 max-w-[250px]">Em breve estará transmitindo.</p>
        <button 
          onClick={(e) => { e.stopPropagation(); onExpand(); }} 
          className={\`absolute top-2 right-2 p-1.5 bg-black/60 rounded flex items-center justify-center text-white/50 hover:text-white hover:bg-black/80 transition-colors z-20 \${isModal ? 'hidden' : 'opacity-0 group-hover/video-container:opacity-100'}\`}
          title="Expandir câmera"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    );
  }`;

const newMaintenanceState = `  if (!iframeCode || iframeCode.trim() === '') {
    return (
      <div className="relative w-full h-full group/video-container flex flex-col items-center justify-center bg-[#0a0a0a] text-center overflow-hidden">
        {maintenancePhotoUrl ? (
           <>
             <img src={maintenancePhotoUrl} alt="Câmera em manutenção" className="absolute inset-0 w-full h-full object-cover opacity-50" />
             <div className="absolute inset-0 bg-black/40 z-10"></div>
             <div className="relative z-20 flex flex-col items-center justify-center p-4">
                 <Wrench className="text-gray-300 mb-2 animate-pulse" size={32} />
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest shadow-black drop-shadow-md">Câmera em Manutenção</h3>
             </div>
           </>
        ) : (
           <div className="p-4 flex flex-col items-center justify-center">
             <Wrench className="text-gray-500 mb-2 animate-pulse" size={32} />
             <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Câmera em Manutenção</h3>
             <p className="text-xs text-gray-500 mt-2 max-w-[250px]">Em breve estará transmitindo.</p>
           </div>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onExpand(); }} 
          className={\`absolute top-2 right-2 p-1.5 bg-black/60 rounded flex items-center justify-center text-white/50 hover:text-white hover:bg-black/80 transition-colors z-30 \${isModal ? 'hidden' : 'opacity-0 group-hover/video-container:opacity-100'}\`}
          title="Expandir câmera"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    );
  }`;

content = content.replace(oldMaintenanceState, newMaintenanceState);
fs.writeFileSync('src/pages/Cameras.tsx', content);

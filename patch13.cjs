const fs = require('fs');

// Patch Cameras.tsx
let content = fs.readFileSync('src/pages/Cameras.tsx', 'utf8');
const target1 = `{maintenancePhotoUrl ? (
           <>
             <img src={maintenancePhotoUrl} alt="Câmera em manutenção" className="absolute inset-0 w-full h-full object-cover opacity-50" />
             <div className="absolute inset-0 bg-black/40 z-10"></div>
             <div className="relative z-20 flex flex-col items-center justify-center p-4">
                 <Wrench className="text-gray-300 mb-2 animate-pulse" size={32} />
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest shadow-black drop-shadow-md">Câmera em Manutenção</h3>
             </div>
           </>`;
const insert1 = `{maintenancePhotoUrl ? (
           <>
             <img src={maintenancePhotoUrl} alt="Câmera em manutenção" className="absolute inset-0 w-full h-full object-cover" />
           </>`;
content = content.replace(target1, insert1);
fs.writeFileSync('src/pages/Cameras.tsx', content);

// Patch Dashboard.tsx
content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
const target2 = `{cam.maintenancePhotoUrl ? (
                          <>
                             <img src={cam.maintenancePhotoUrl} alt="Manutenção" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                             <div className="absolute inset-0 bg-black/40 z-10"></div>
                             <div className="relative z-20 flex flex-col items-center">
                                 <Wrench className="text-gray-300 mb-1 animate-pulse" size={24} />
                                 <h4 className="text-[10px] font-bold text-white uppercase tracking-widest drop-shadow-md">Em Manutenção</h4>
                             </div>
                          </>`;
const insert2 = `{cam.maintenancePhotoUrl ? (
                          <>
                             <img src={cam.maintenancePhotoUrl} alt="Manutenção" className="absolute inset-0 w-full h-full object-cover" />
                          </>`;
content = content.replace(target2, insert2);
fs.writeFileSync('src/pages/Dashboard.tsx', content);

// Patch MapPage.tsx
content = fs.readFileSync('src/pages/MapPage.tsx', 'utf8');
const target3 = `{cam.maintenancePhotoUrl ? (
                          <>
                             <img src={cam.maintenancePhotoUrl} alt="Manutenção" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                             <div className="absolute inset-0 bg-black/40 z-10"></div>
                             <div className="relative z-20 flex flex-col items-center">
                                 <Wrench className="text-gray-300 mb-1 animate-pulse" size={24} />
                                 <h4 className="text-[10px] font-bold text-white uppercase tracking-widest drop-shadow-md">Em Manutenção</h4>
                             </div>
                          </>`;
const insert3 = `{cam.maintenancePhotoUrl ? (
                          <>
                             <img src={cam.maintenancePhotoUrl} alt="Manutenção" className="absolute inset-0 w-full h-full object-cover" />
                          </>`;
content = content.replace(target3, insert3);
fs.writeFileSync('src/pages/MapPage.tsx', content);


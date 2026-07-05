const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const target = `              ) : !cam.iframeCode || cam.iframeCode.trim() === '' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-center p-2">
                      <Wrench className="text-gray-500 mb-1 animate-pulse" size={24} />
                      <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Em Manutenção</h4>
                      <p className="text-[8px] text-gray-500 mt-1 max-w-[150px]">Em breve estará transmitindo.</p>
                  </div>`;

const insert = `              ) : !cam.iframeCode || cam.iframeCode.trim() === '' ? (
                  <div className="w-full h-full relative flex flex-col items-center justify-center bg-[#0a0a0a] text-center overflow-hidden p-2">
                      {cam.maintenancePhotoUrl ? (
                          <>
                             <img src={cam.maintenancePhotoUrl} alt="Manutenção" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                             <div className="absolute inset-0 bg-black/40 z-10"></div>
                             <div className="relative z-20 flex flex-col items-center">
                                 <Wrench className="text-gray-300 mb-1 animate-pulse" size={24} />
                                 <h4 className="text-[10px] font-bold text-white uppercase tracking-widest drop-shadow-md">Em Manutenção</h4>
                             </div>
                          </>
                      ) : (
                          <>
                              <Wrench className="text-gray-500 mb-1 animate-pulse" size={24} />
                              <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Em Manutenção</h4>
                              <p className="text-[8px] text-gray-500 mt-1 max-w-[150px]">Em breve estará transmitindo.</p>
                          </>
                      )}
                  </div>`;

content = content.replace(target, insert);
fs.writeFileSync('src/pages/Dashboard.tsx', content);

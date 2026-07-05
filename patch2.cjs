const fs = require('fs');
const content = fs.readFileSync('src/pages/Cameras.tsx', 'utf8');

const target = `                                    </div>
                                </div>

                                <Button type="submit" className="w-full">{editingCameraId ? 'Atualizar Câmera' : 'Adicionar'}</Button>`;

const insert = `                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1">Capa de Manutenção</label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black border border-white/10 rounded-xl cursor-pointer hover:border-atalaia-neon/50 transition-all text-xs font-bold text-gray-400">
                                            {isUploadingMaintenance ? <Loader2 className="animate-spin" size={16} /> : <CameraIcon size={16} />}
                                            {newMaintenancePhoto ? 'Capa Selecionada' : 'Fazer Upload da Capa'}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleMaintenanceFileChange} />
                                        </label>
                                        {newMaintenancePhoto && (
                                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-atalaia-neon/30">
                                                <img src={newMaintenancePhoto} className="w-full h-full object-cover" alt="Preview Manutenção" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button type="submit" className="w-full">{editingCameraId ? 'Atualizar Câmera' : 'Adicionar'}</Button>`;

const newContent = content.replace(target, insert);
fs.writeFileSync('src/pages/Cameras.tsx', newContent);

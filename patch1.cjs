const fs = require('fs');
let content = fs.readFileSync('src/pages/Cameras.tsx', 'utf8');

const target1 = `  const [searchTerm, setSearchTerm] = useState('');`;
const insert1 = `  const [searchTerm, setSearchTerm] = useState('');
  const [hoodSearchTerm, setHoodSearchTerm] = useState('');
  const [manageHoodSearchTerm, setManageHoodSearchTerm] = useState('');`;
content = content.replace(target1, insert1);

const target2 = `            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {user?.role === UserRole.ADMIN && (
                    <Button 
                        variant={selectedNeighborhoodId === '' ? 'primary' : 'outline'}
                        onClick={() => setSelectedNeighborhoodId('')}
                        className="whitespace-nowrap px-4 py-2 text-xs"
                    >
                        Todas
                    </Button>
                )}
                {managedNeighborhoods.map(hood => (
                    <Button
                        key={hood.id}
                        variant={selectedNeighborhoodId === hood.id ? 'primary' : 'outline'}
                        onClick={() => setSelectedNeighborhoodId(hood.id)}
                        className="whitespace-nowrap px-4 py-2 text-xs"
                    >
                        {hood.name}
                    </Button>
                ))}
            </div>`;

const insert2 = `            {/* Filtro de Bairros */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
               <div className="relative min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={14} />
                  <input 
                      type="text" 
                      placeholder="Filtrar bairros..." 
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-atalaia-neon/50 transition-colors"
                      value={hoodSearchTerm}
                      onChange={e => setHoodSearchTerm(e.target.value)}
                  />
               </div>
               <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {user?.role === UserRole.ADMIN && (
                      <Button 
                          variant={selectedNeighborhoodId === '' ? 'primary' : 'outline'}
                          onClick={() => setSelectedNeighborhoodId('')}
                          className="whitespace-nowrap px-4 py-2 text-xs"
                      >
                          Todas
                      </Button>
                  )}
                  {managedNeighborhoods.filter(h => h.name.toLowerCase().includes(hoodSearchTerm.toLowerCase())).map(hood => (
                      <Button
                          key={hood.id}
                          variant={selectedNeighborhoodId === hood.id ? 'primary' : 'outline'}
                          onClick={() => setSelectedNeighborhoodId(hood.id)}
                          className="whitespace-nowrap px-4 py-2 text-xs"
                      >
                          {hood.name}
                      </Button>
                  ))}
               </div>
            </div>`;

content = content.replace(target2, insert2);

const target3 = `                            <select 
                                value={selectedManageHoodId}
                                onChange={(e) => setSelectedManageHoodId(e.target.value)}
                                disabled={user?.role === UserRole.INTEGRATOR}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-atalaia-neon/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <option value="">Selecione um bairro</option>
                                {managedNeighborhoods.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>`;

const insert3 = `                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar bairro para gerenciar..." 
                                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-atalaia-neon/50 transition-colors"
                                    value={manageHoodSearchTerm}
                                    onChange={e => setManageHoodSearchTerm(e.target.value)}
                                    disabled={user?.role === UserRole.INTEGRATOR}
                                />
                            </div>
                            <select 
                                value={selectedManageHoodId}
                                onChange={(e) => setSelectedManageHoodId(e.target.value)}
                                disabled={user?.role === UserRole.INTEGRATOR}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-atalaia-neon/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <option value="">Selecione um bairro</option>
                                {managedNeighborhoods.filter(h => h.name.toLowerCase().includes(manageHoodSearchTerm.toLowerCase())).map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>`;

content = content.replace(target3, insert3);

fs.writeFileSync('src/pages/Cameras.tsx', content);

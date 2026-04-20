
import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { UserRole, Neighborhood, Camera } from '../types';
import { MockService } from '../services/mockService';
import { supabase } from '../lib/supabaseClient';
import { Card, Button, Input, Badge } from '../components/UI';
import { 
    Video, Plus, Edit2, Trash2, MapPin, RefreshCw, Maximize2, Loader2, 
    Camera as CameraIcon, List, Settings, Save, XCircle, RotateCw,
    AlertTriangle, Lock, Info 
} from 'lucide-react';

const UniversalPlayer: React.FC<{ url: string; title?: string }> = ({ url, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [key, setKey] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [hasError, setHasError] = useState(false);

  const toggleFullscreen = async () => {
      if (!containerRef.current) return;
      if (!document.fullscreenElement) await containerRef.current.requestFullscreen();
      else await document.exitFullscreen();
  };

  const rotate = () => {
      setRotation(prev => (prev + 90) % 360);
  };

  if (!url) return null;
  const isRawHtml = url.trim().startsWith('<');
  const isInsecure = !isRawHtml && url.trim().startsWith('http://');
  const isIncomplete = !isRawHtml && !url.trim().startsWith('http');

  const isDirectVideo = !isRawHtml && (
      /\.(mp4|webm|ogg|m4v|mov)($|\?)/i.test(url) || 
      url.includes('video/mp4') ||
      url.includes('servcam.alienmonitoramento')
  );

  return (
      <div ref={containerRef} className="w-full bg-black border border-atalaia-border relative shadow-lg aspect-video group rounded-xl overflow-hidden">
           {title && <div className="absolute top-0 left-0 w-full p-2 bg-black/60 backdrop-blur-sm z-10 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">{title}</div>}
           
           <div 
             className="w-full h-full transition-all duration-300 flex items-center justify-center" 
             style={{ 
                 transform: `rotate(${rotation}deg)`,
                 width: (rotation === 90 || rotation === 270) ? '56.25%' : '100%',
                 margin: 'auto'
             }} 
             key={key}
           >
              {hasError ? (
                  <div className="text-center p-4">
                      <AlertTriangle className="text-red-500 mx-auto mb-2" size={32} />
                      <p className="text-white text-xs font-bold uppercase">Erro de Conexão</p>
                      <p className="text-gray-500 text-[10px] mt-1 mb-4">O servidor da câmera recusou a conexão ou o link está quebrado.</p>
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-lg transition-colors"
                      >
                        <RefreshCw size={12} /> Testar Link em Nova Aba
                      </a>
                  </div>
              ) : isIncomplete ? (
                  <div className="text-center p-4">
                      <AlertTriangle className="text-yellow-500 mx-auto mb-2" size={32} />
                      <p className="text-white text-xs font-bold uppercase">Link Incompleto</p>
                      <p className="text-gray-500 text-[10px] mt-1">O link deve começar com https://</p>
                  </div>
              ) : isInsecure ? (
                  <div className="text-center p-4">
                      <Lock className="text-orange-500 mx-auto mb-2" size={32} />
                      <p className="text-white text-xs font-bold uppercase">Link Inseguro (HTTP)</p>
                      <p className="text-gray-500 text-[10px] mt-1">Navegadores bloqueiam links HTTP em sites HTTPS. Use HTTPS.</p>
                  </div>
              ) : isRawHtml ? (
                <iframe 
                  srcDoc={`
                    <html>
                      <head>
                        <style>
                          body { margin: 0; padding: 0; background: black; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; }
                          video, iframe { width: 100%; height: 100%; object-fit: contain; border: none; }
                        </style>
                      </head>
                      <body>${url}</body>
                    </html>
                  `}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              ) : isDirectVideo ? (
                <video 
                    src={url} 
                    controls 
                    autoPlay 
                    muted 
                    playsInline 
                    preload="auto"
                    className="w-full h-full object-contain"
                    onError={() => setHasError(true)}
                />
              ) : (
                <iframe src={url} className="w-full h-full bg-black border-0" allowFullScreen onError={() => setHasError(true)} />
              )}
           </div>

           <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-20">
               <button onClick={rotate} className="p-2 rounded bg-black/70 text-white hover:text-atalaia-neon" title="Rotacionar 90°"><RotateCw size={14} /></button>
               <button onClick={() => { setKey(k => k + 1); setHasError(false); }} className="p-2 rounded bg-black/70 text-white hover:text-atalaia-neon" title="Recarregar"><RefreshCw size={14} /></button>
               <button onClick={toggleFullscreen} className="p-2 rounded bg-black/70 text-white hover:text-atalaia-neon" title="Tela Cheia"><Maximize2 size={14} /></button>
           </div>
      </div>
  );
};

const Cameras: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'view' | 'manage'>('view');
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingHoodId, setEditingHoodId] = useState<string | null>(null);
  const [newHoodName, setNewHoodName] = useState('');
  const [newHoodUrl, setNewHoodUrl] = useState('');

  const [selectedManageHoodId, setSelectedManageHoodId] = useState('');
  const [newCameraName, setNewCameraName] = useState('');
  const [newCameraCode, setNewCameraCode] = useState('');
  const [newCameraLat, setNewCameraLat] = useState('');
  const [newCameraLng, setNewCameraLng] = useState('');

  const loadData = async () => {
      setLoading(true);
      try {
          const allHoods = await MockService.getNeighborhoods(true);
          
          // Filtro de segurança: Moradores e SCR só veem seu próprio bairro
          const filteredHoods = (user?.role === UserRole.ADMIN || user?.role === UserRole.INTEGRATOR)
            ? allHoods
            : allHoods.filter(h => h.id === user?.neighborhoodId);

          setNeighborhoods(filteredHoods);

          // Seleção automática do bairro do usuário
          if (user?.neighborhoodId) {
              const myHood = filteredHoods.find(h => h.id === user.neighborhoodId);
              if (myHood) setSelectedNeighborhood(myHood);
          } else if (filteredHoods.length > 0 && !selectedNeighborhood) {
              setSelectedNeighborhood(filteredHoods[0]);
          }

          if (user?.role === UserRole.INTEGRATOR) {
              setSelectedManageHoodId(user.neighborhoodId || '');
          } else if (user?.role === UserRole.ADMIN && filteredHoods.length > 0) {
              setSelectedManageHoodId(filteredHoods[0].id);
          }
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => { loadData(); }, [user]);

  useEffect(() => {
    const subHoods = MockService.subscribeToTable('neighborhoods', loadData);
    const subCameras = MockService.subscribeToTable('cameras', () => {
        const hoodId = activeTab === 'view' ? selectedNeighborhood?.id : selectedManageHoodId;
        if (hoodId) MockService.getAdditionalCameras(hoodId).then(setCameras);
    });

    return () => {
        supabase.removeChannel(subHoods);
        supabase.removeChannel(subCameras);
    };
  }, [selectedNeighborhood, selectedManageHoodId, activeTab]);

  useEffect(() => {
      const hoodId = activeTab === 'view' ? selectedNeighborhood?.id : selectedManageHoodId;
      if (hoodId) {
          MockService.getAdditionalCameras(hoodId).then(setCameras);
      } else {
          setCameras([]);
      }
  }, [selectedNeighborhood, selectedManageHoodId, activeTab]);

  const handleSaveNeighborhood = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      try {
          if (editingHoodId) {
              await MockService.updateNeighborhood(editingHoodId, newHoodName, '', newHoodUrl);
          } else {
              await MockService.createNeighborhood(newHoodName, '', newHoodUrl);
          }
          setEditingHoodId(null); 
          setNewHoodName(''); 
          setNewHoodUrl('');
          await loadData();
          alert('Bairro atualizado!');
      } catch (e: any) { 
          alert('Erro ao salvar: ' + e.message); 
      } finally {
          setSaving(false);
      }
  };

  const isManagementAllowed = user?.role === UserRole.ADMIN || user?.role === UserRole.INTEGRATOR;

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Vigilância nos Bairros</h1>
            <p className="text-gray-400">Monitoramento colaborativo e gestão territorial.</p>
        </div>
        <div className="flex bg-[#111] p-1 rounded-xl border border-atalaia-border w-full md:w-auto shadow-lg">
            <button onClick={() => setActiveTab('view')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'view' ? 'bg-atalaia-neon text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>Visualizar</button>
            {isManagementAllowed && <button onClick={() => setActiveTab('manage')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'manage' ? 'bg-atalaia-neon text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>Gestão Geral</button>}
        </div>
      </div>

      {activeTab === 'view' && (
          <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {neighborhoods.map(h => (
                      <button key={h.id} onClick={() => setSelectedNeighborhood(h)} className={`whitespace-nowrap px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${selectedNeighborhood?.id === h.id ? 'border-atalaia-neon bg-atalaia-neon/10 text-atalaia-neon shadow-lg' : 'border-white/5 bg-[#111] text-gray-500 hover:text-white'}`}>
                        {h.name}
                      </button>
                  ))}
              </div>

              {selectedNeighborhood ? (
                  <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {selectedNeighborhood.iframeUrl && <UniversalPlayer url={selectedNeighborhood.iframeUrl} title={`Principal - ${selectedNeighborhood.name}`} />}
                          {cameras.map(c => <UniversalPlayer key={c.id} url={c.iframeCode} title={c.name} />)}
                      </div>
                  </div>
              ) : (
                  <div className="text-center py-40 text-gray-700 bg-black/10 rounded-3xl border border-dashed border-white/5">
                      <MapPin size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="uppercase tracking-[0.3em] text-xs font-black">Selecione um bairro acima</p>
                  </div>
              )}
          </div>
      )}

      {activeTab === 'manage' && (
          <div className="space-y-12 pb-20 animate-in slide-in-from-bottom-4">
              {user?.role === UserRole.ADMIN && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <Card className="p-6 h-fit border-atalaia-neon/20 bg-[#080808]">
                          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><MapPin size={20} className="text-atalaia-neon" /> {editingHoodId ? 'Editar Bairro' : 'Novo Bairro'}</h2>
                          <form onSubmit={handleSaveNeighborhood} className="space-y-4">
                              <Input label="Nome" value={newHoodName} onChange={e => setNewHoodName(e.target.value)} required />
                              <Input label="Iframe Principal" value={newHoodUrl} onChange={e => setNewHoodUrl(e.target.value)} />
                              <Button type="submit" disabled={saving} className="w-full mt-4">{saving ? <Loader2 className="animate-spin" /> : <Save size={16} className="mr-2"/>} Salvar</Button>
                              {editingHoodId && <Button type="button" variant="outline" onClick={() => setEditingHoodId(null)} className="w-full mt-2">Cancelar</Button>}
                          </form>
                      </Card>
                      <Card className="lg:col-span-2 overflow-hidden bg-[#0a0a0a]">
                          <div className="p-4 border-b border-white/5 font-black uppercase text-[10px] tracking-widest text-gray-500">Bairros no Banco</div>
                          <div className="max-h-[400px] overflow-y-auto">
                              <table className="w-full text-sm text-left">
                                  <tbody className="divide-y divide-white/5">
                                      {neighborhoods.map(h => (
                                          <tr key={h.id} className="hover:bg-white/5">
                                              <td className="p-4 font-bold text-white">{h.name}</td>
                                              <td className="p-4 text-right">
                                                  <button onClick={() => { setEditingHoodId(h.id); setNewHoodName(h.name); setNewHoodUrl(h.iframeUrl || ''); }} className="p-2 text-blue-500"><Edit2 size={16}/></button>
                                                  <button onClick={async () => { if(confirm('Excluir?')) { await MockService.deleteNeighborhood(h.id); loadData(); } }} className="p-2 text-red-500"><Trash2 size={16}/></button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </Card>
                  </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="p-6 h-fit border-blue-500/20 bg-[#080808]">
                         <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><CameraIcon size={20} className="text-blue-500" /> Câmera Individual</h2>
                         <div className="bg-blue-900/10 border border-blue-500/20 p-3 rounded-lg mb-6">
                             <h4 className="text-[10px] font-black text-blue-400 uppercase mb-1 flex items-center gap-1"><Info size={12}/> Regras de Link</h4>
                             <ul className="text-[9px] text-gray-400 space-y-1 list-disc list-inside">
                                 <li>Use sempre links com <strong className="text-white">https://</strong></li>
                                 <li>Evite links <strong className="text-orange-400">http://</strong> (serão bloqueados)</li>
                                 <li>O link deve ser <strong className="text-white">completo</strong> (ex: https://site.com/video.mp4)</li>
                             </ul>
                         </div>
                         <select className="w-full bg-black border border-white/10 rounded-xl p-3 text-white mb-4" value={selectedManageHoodId} onChange={(e) => setSelectedManageHoodId(e.target.value)} disabled={user?.role === UserRole.INTEGRATOR}>
                            <option value="">Selecione o Bairro...</option>
                            {neighborhoods.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                        {selectedManageHoodId && (
                            <form onSubmit={async (e) => { 
                                e.preventDefault(); 
                                try {
                                    const lat = newCameraLat ? parseFloat(newCameraLat) : undefined;
                                    const lng = newCameraLng ? parseFloat(newCameraLng) : undefined;
                                    await MockService.addCamera(selectedManageHoodId, newCameraName, newCameraCode, lat, lng); 
                                    setNewCameraName(''); 
                                    setNewCameraCode(''); 
                                    setNewCameraLat('');
                                    setNewCameraLng('');
                                    const updated = await MockService.getAdditionalCameras(selectedManageHoodId);
                                    setCameras(updated);
                                    alert('Câmera adicionada com sucesso!');
                                } catch (err: any) {
                                    alert('Erro ao adicionar câmera: ' + err.message);
                                }
                            }} className="space-y-4">
                                <Input label="Nome da Câmera" value={newCameraName} onChange={e => setNewCameraName(e.target.value)} required />
                                <Input label="Código Iframe" value={newCameraCode} onChange={e => setNewCameraCode(e.target.value)} required />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Latitude (Opcional)" value={newCameraLat} onChange={e => setNewCameraLat(e.target.value)} placeholder="-23.5505" />
                                    <Input label="Longitude (Opcional)" value={newCameraLng} onChange={e => setNewCameraLng(e.target.value)} placeholder="-46.6333" />
                                </div>
                                <Button type="submit" className="w-full">Adicionar</Button>
                            </form>
                        )}
                   </Card>
                   <Card className="lg:col-span-2 overflow-hidden bg-[#0a0a0a]">
                        <div className="p-4 border-b border-white/5 font-black uppercase text-[10px] tracking-widest text-gray-500">Dispositivos do Bairro</div>
                        <div className="max-h-[400px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-white/5">
                                    {cameras.map(c => (
                                        <tr key={c.id} className="hover:bg-white/5">
                                            <td className="p-4 font-bold text-white">{c.name}</td>
                                            <td className="p-4 text-right">
                                                <button onClick={async () => { if(confirm('Remover?')) { await MockService.deleteCamera(c.id); MockService.getAdditionalCameras(selectedManageHoodId).then(setCameras); } }} className="p-2 text-red-500"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                   </Card>
              </div>
          </div>
      )}
    </Layout>
  );
};

export default Cameras;

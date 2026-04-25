
import React, { useEffect, useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/auth/context';
import { UserRole, Neighborhood, Camera } from '@/types';
import { MockService } from '@/services/mockService';
import { supabase } from '@/lib/supabaseClient';
import { 
    Video, Plus, Trash2, Search, MapPin, 
    AlertTriangle, Shield, CheckCircle, Info, ExternalLink,
    ChevronRight, Camera as CameraIcon, Loader2, Edit2, X, Lock
} from 'lucide-react';
import { Card, Button, Input, Badge } from '@/components/UI';
import { UpgradeModal } from '@/components/UpgradeModal';
import { motion, AnimatePresence } from 'motion/react';

const Cameras: React.FC = () => {
  const { user } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>('');
  
  // States for adding/editing camera
  const [selectedManageHoodId, setSelectedManageHoodId] = useState<string>('');
  const [newCameraName, setNewCameraName] = useState('');
  const [newCameraCode, setNewCameraCode] = useState('');
  const [newCameraLat, setNewCameraLat] = useState('');
  const [newCameraLng, setNewCameraLng] = useState('');
  const [newCameraPhoto, setNewCameraPhoto] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [editingCameraId, setEditingCameraId] = useState<string | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploading(true);
          const reader = new FileReader();
          reader.onloadend = () => {
              setNewCameraPhoto(reader.result as string);
              setIsUploading(false);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleEditCamera = (cam: Camera) => {
      setEditingCameraId(cam.id);
      setNewCameraName(cam.name);
      setNewCameraCode(cam.iframeCode);
      setNewCameraLat(cam.lat?.toString() || '');
      setNewCameraLng(cam.lng?.toString() || '');
      setNewCameraPhoto(cam.locationPhotoUrl || '');
      
      // Select the neighborhood of the camera being edited
      setSelectedManageHoodId(cam.neighborhoodId);
  };

  const handleCancelEdit = () => {
      setEditingCameraId(null);
      setNewCameraName('');
      setNewCameraCode('');
      setNewCameraLat('');
      setNewCameraLng('');
      setNewCameraPhoto('');
  };

  const handleSendSupport = async (e: React.FormEvent) => {
      e.preventDefault();
      console.log("[Cameras] handleSendSupport triggered");
      
      if (!supportMessage || !supportMessage.trim()) {
          alert('Por favor, descreva o problema antes de enviar.');
          return;
      }

      if (!user) {
          console.warn("[Cameras] No user found in context");
          alert('Sessão expirada. Por favor, faça login novamente.');
          return;
      }
      
      setSendingSupport(true);
      try {
          console.log("[Cameras] Sending support ticket:", { 
              userId: user.id, 
              name: user.name, 
              neighborhoodId: user.neighborhoodId 
          });

          await MockService.createSupportTicket(
              user.id,
              user.name,
              supportMessage.trim(),
              user.neighborhoodId
          );
          
          console.log("[Cameras] Support ticket sent successfully");
          alert('Sua solicitação de suporte foi enviada com sucesso! Em breve um técnico entrará em contato.');
          setSupportMessage('');
          setIsSupportModalOpen(false);
      } catch (err: any) {
          console.error("[Cameras] Error creating support ticket:", err);
          alert('Erro ao enviar solicitação: ' + (err.message || 'Erro desconhecido.'));
      } finally {
          setSendingSupport(false);
      }
  };

  const loadData = async () => {
      setLoading(true);
      try {
          const cams = await MockService.getAllSystemCameras();
          setCameras(cams);
          
          const hoods = await MockService.getNeighborhoods();
          setNeighborhoods(hoods);
          
          if (hoods.length > 0) {
              if (user?.role === UserRole.INTEGRATOR && user?.neighborhoodId) {
                  setSelectedNeighborhoodId(user.neighborhoodId);
                  setSelectedManageHoodId(user.neighborhoodId);
              } else {
                  setSelectedNeighborhoodId(hoods[0].id);
                  if (user?.role === UserRole.ADMIN) {
                      setSelectedManageHoodId(hoods[0].id);
                  }
              }
          }
      } catch (err) {
          console.error("Error loading cameras:", err);
      } finally {
          setLoading(false);
      }
  };

  const managedNeighborhoods = user?.role === UserRole.ADMIN 
    ? neighborhoods 
    : neighborhoods.filter(h => h.id === user?.neighborhoodId);

  useEffect(() => {
    if (user?.id) {
        loadData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.role === UserRole.INTEGRATOR && user?.neighborhoodId) {
        setSelectedManageHoodId(user.neighborhoodId);
    }
  }, [user, neighborhoods]);

  const filteredCameras = cameras.filter(cam => {
    const matchesSearch = cam.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNeighborhood = selectedNeighborhoodId ? cam.neighborhoodId === selectedNeighborhoodId : true;
    return matchesSearch && matchesNeighborhood;
  });

  const isIntegrator = user?.role === UserRole.INTEGRATOR || user?.role === UserRole.ADMIN;

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-700 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-atalaia-neon/10 rounded-lg">
                <Video className="text-atalaia-neon" size={20} />
              </div>
              <h1 className="text-2xl font-black text-white italic tracking-tighter">CENTRAL DE CÂMERAS</h1>
            </div>
            <p className="text-gray-400 text-sm font-medium">Gestão e monitoramento de ativos de segurança.</p>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input 
                  className="pl-10 min-w-[240px]" 
                  placeholder="Pesquisar câmeras..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Grid: Cameras List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
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
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-black/40 rounded-3xl border border-white/5">
                    <Loader2 className="text-atalaia-neon animate-spin mb-4" size={32} />
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Carregando dispositivos...</p>
                </div>
            ) : filteredCameras.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-black/40 rounded-3xl border border-white/5">
                    <Video className="text-gray-600 mb-4" size={48} />
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Nenhuma câmera encontrada</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCameras.map((cam) => (
                    <Card key={cam.id} className="group overflow-hidden border-white/5 hover:border-atalaia-neon/30 transition-all duration-300">
                      <div className="aspect-video bg-black relative">
                         {user?.plan === 'FREE' && user?.role === UserRole.RESIDENT ? (
                             <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 px-6 text-center">
                                 <Lock className="text-atalaia-neon/40 mb-3" size={32} />
                                 <h4 className="text-white font-bold text-xs uppercase mb-1">Assinatura Necessária</h4>
                                 <p className="text-[10px] text-gray-500 max-w-[180px] mb-3">
                                     Câmeras liberadas nos planos pagos.
                                 </p>
                                 <div className="flex flex-col gap-1.5 w-full max-w-[160px]">
                                     <Button 
                                         className="h-7 text-[8px] font-black bg-yellow-600 hover:bg-yellow-700"
                                         onClick={() => setShowUpgradeModal(true)}
                                     >
                                         PLANO FAMÍLIA (R$ 39,90)
                                     </Button>
                                     <Button 
                                         variant="outline"
                                         className="h-7 text-[8px] font-black border-atalaia-neon/30 text-atalaia-neon"
                                         onClick={() => setShowUpgradeModal(true)}
                                     >
                                         PLANO PRÊMIO (R$ 79,90)
                                     </Button>
                                 </div>
                             </div>
                         ) : cam.iframeCode.trim().startsWith('<') ? (
                            <iframe 
                                srcDoc={`
                                    <html>
                                        <head>
                                            <style>
                                                body { margin: 0; padding: 0; background: black; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; }
                                                video, iframe { width: 100%; height: 100%; object-fit: contain; border: none; }
                                            </style>
                                        </head>
                                        <body>${cam.iframeCode}</body>
                                    </html>
                                `}
                                className="w-full h-full border-0"
                                allowFullScreen
                            />
                         ) : (
                            <iframe src={cam.iframeCode} className="w-full h-full border-0" allowFullScreen />
                         )}
                         <div className="absolute top-2 left-2 flex gap-2">
                             <Badge color="green" className="text-[8px] px-1.5 animate-pulse">LIVE</Badge>
                             <Badge color="blue" className="text-[8px] px-1.5 bg-black/50 backdrop-blur-sm border-white/20">HD</Badge>
                         </div>
                      </div>
                      <div className="p-4 bg-gradient-to-b from-transparent to-black/20">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-white group-hover:text-atalaia-neon transition-colors truncate">{cam.name}</h3>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                                <MapPin size={10} />
                                {cam.lat?.toFixed(2)}, {cam.lng?.toFixed(2)}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-gray-500 font-medium">Bairro:</span>
                            <span className="text-[10px] text-atalaia-neon/70 font-black uppercase tracking-wider">
                                {neighborhoods.find(h => h.id === cam.neighborhoodId)?.name || 'Desconhecido'}
                            </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
            )}
          </div>

          {/* Sidebar: Management */}
          <div className="space-y-6">
            {/* Legend / Status */}
            <Card className="bg-atalaia-neon/5 border-atalaia-neon/20 p-5">
                <h3 className="text-gray-300 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Info size={14} className="text-atalaia-neon" />
                    Status do Sistema
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-gray-400">Total de Câmeras</span>
                        <span className="text-white">{cameras.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-gray-400">Ativas Online</span>
                        <span className="text-green-400">{cameras.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-gray-400">Em Manutenção</span>
                        <span className="text-red-400">0</span>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    className="w-full mt-6 text-[10px] h-9 border-atalaia-neon/30 text-atalaia-neon font-black"
                    onClick={() => setIsSupportModalOpen(true)}
                >
                    SOLICITAR SUPORTE TÉCNICO
                </Button>
            </Card>

            {/* Admin/Integrator Controls */}
            {isIntegrator && (
                <Card className="p-6 border-white/10 bg-black/20">
                    <h3 className="text-white text-sm font-black uppercase tracking-tighter italic mb-4 flex items-center gap-2">
                        <Shield className="text-atalaia-neon" size={16} />
                        Gestão de Dispositivos
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5 block pl-1">Bairro para Gestão</label>
                            <select 
                                value={selectedManageHoodId}
                                onChange={(e) => setSelectedManageHoodId(e.target.value)}
                                disabled={user?.role === UserRole.INTEGRATOR}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-atalaia-neon/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Selecione um bairro</option>
                                {managedNeighborhoods.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                        </div>

                        {selectedManageHoodId && (
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                try {
                                    const lat = newCameraLat ? parseFloat(newCameraLat) : undefined;
                                    const lng = newCameraLng ? parseFloat(newCameraLng) : undefined;
                                    
                                    if (editingCameraId) {
                                        await MockService.updateCamera(editingCameraId, newCameraName, newCameraCode, lat, lng, newCameraPhoto);
                                        alert('Câmera atualizada com sucesso!');
                                    } else {
                                        await MockService.addCamera(selectedManageHoodId, newCameraName, newCameraCode, lat, lng, newCameraPhoto); 
                                        alert('Câmera adicionada com sucesso!');
                                    }
                                    
                                    handleCancelEdit();
                                    const updated = await MockService.getAdditionalCameras(selectedManageHoodId);
                                    setCameras(updated);
                                } catch (err) {
                                    alert('Erro ao processar câmera. Tente novamente.');
                                }
                            }} className="mt-4 space-y-4 pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-bold text-atalaia-neon flex items-center gap-2">
                                        {editingCameraId ? <Edit2 size={14} /> : <Plus size={14} />}
                                        {editingCameraId ? 'Editar Câmera' : 'Adicionar Nova Câmera'}
                                    </h4>
                                    {editingCameraId && (
                                        <button 
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="text-[10px] text-gray-400 hover:text-white transition-colors"
                                        >
                                            Cancelar Edição
                                        </button>
                                    )}
                                </div>
                                <Input label="Nome da Câmera" value={newCameraName} onChange={e => setNewCameraName(e.target.value)} placeholder="Ex: Câmera Rua X" required />
                                <Input label="Código Iframe (Link Youtube ou RTMP)" value={newCameraCode} onChange={e => setNewCameraCode(e.target.value)} placeholder="<iframe... />" required />
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="Latitude (Opcional)" value={newCameraLat} onChange={e => setNewCameraLat(e.target.value)} placeholder="-23.5505" />
                                    <Input label="Longitude (Opcional)" value={newCameraLng} onChange={e => setNewCameraLng(e.target.value)} placeholder="-46.6333" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1">Foto do Local (Poste)</label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black border border-white/10 rounded-xl cursor-pointer hover:border-atalaia-neon/50 transition-all text-xs font-bold text-gray-400">
                                            {isUploading ? <Loader2 className="animate-spin" size={16} /> : <CameraIcon size={16} />}
                                            {newCameraPhoto ? 'Foto Selecionada' : 'Fazer Upload da Foto'}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                        {newCameraPhoto && (
                                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-atalaia-neon/30">
                                                <img src={newCameraPhoto} className="w-full h-full object-cover" alt="Preview" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button type="submit" className="w-full">{editingCameraId ? 'Atualizar Câmera' : 'Adicionar'}</Button>
                                
                                <div className="mt-4 space-y-2">
                                    {cameras.filter(c => c.neighborhoodId === selectedManageHoodId).map(cam => (
                                        <div key={cam.id} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
                                            <div className="flex items-center gap-3">
                                                <Video size={14} className="text-gray-400" />
                                                <span className="text-[11px] font-medium">{cam.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => handleEditCamera(cam)}
                                                    className="p-1.5 hover:bg-atalaia-neon/20 rounded text-atalaia-neon transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={async () => {
                                                        if(confirm('Excluir câmera?')) {
                                                            await MockService.deleteCamera(cam.id);
                                                            const updated = await MockService.getAdditionalCameras(selectedManageHoodId);
                                                            setCameras(updated);
                                                        }
                                                    }}
                                                    className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </form>
                        )}
                    </div>
                </Card>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSupportModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-atalaia-neon/10 to-transparent">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="text-atalaia-neon" size={18} />
                    <h2 className="text-white font-black italic tracking-tighter">SUPORTE TÉCNICO</h2>
                </div>
                <button 
                  onClick={() => setIsSupportModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSendSupport} className="p-6 space-y-4">
                <p className="text-xs text-gray-400 font-medium">
                  Descreva o problema que está ocorrendo com seus equipamentos ou sistema. Um técnico certificado Atalaia será designado para ajudar.
                </p>
                
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1">Sua Mensagem</label>
                    <textarea 
                        required
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        placeholder="Ex: Câmera da Rua X está com imagem travada..."
                        className="w-full min-h-[120px] bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-atalaia-neon/50 transition-all resize-none"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setIsSupportModalOpen(false)}
                    >
                        CANCELAR
                    </Button>
                    <Button 
                        type="submit" 
                        className="flex-1 bg-atalaia-neon text-black hover:bg-atalaia-neon/90"
                        disabled={sendingSupport}
                    >
                        {sendingSupport ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'ENVIAR CHAMADO'}
                    </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </Layout>
  );
};

export default Cameras;

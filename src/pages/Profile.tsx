
import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '@/auth/context';
import { Card, Input, Button } from '../components/UI';
import { MockService } from '../services/mockService';
import { Save, User as UserIcon, Camera, Home, MapPin, CheckCircle, Loader2, AlertCircle, Smartphone, Laptop, Monitor, Trash2, LogOut, Scan, UserCheck, ShieldAlert } from 'lucide-react';
import { SessionService } from '../services/sessionService';
import { FacialScannerModal } from '@/components/FacialScannerModal';
import { FacialBiometricService, FacialBiometric } from '@/services/facialBiometricService';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [neighborhoodName, setNeighborhoodName] = useState('Carregando...');
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active user sessions states
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionActionLoading, setSessionActionLoading] = useState<string | null>(null);

  const loadSessions = async () => {
    if (!user?.id) return;
    setLoadingSessions(true);
    try {
      const activeSessions = await SessionService.getSessions(user.id);
      setSessions(activeSessions);
    } catch (e) {
      console.error("Erro ao carregar sessões:", e);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [user?.id]);

  // Face biometrics states
  const [userBiometrics, setUserBiometrics] = useState<any | null>(null);
  const [loadingBiometrics, setLoadingBiometrics] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [deletingBiometrics, setDeletingBiometrics] = useState(false);

  const loadUserBiometrics = async () => {
    if (!user?.id) return;
    setLoadingBiometrics(true);
    try {
      const bio = await FacialBiometricService.getBiometricsForUser(user.id);
      setUserBiometrics(bio);
    } catch (e) {
      console.error("Erro ao carregar biometria facial:", e);
    } finally {
      setLoadingBiometrics(false);
    }
  };

  const handleRemoveBiometrics = async () => {
    if (!user?.id) return;
    if (!window.confirm("Deseja realmente excluir seu cadastro facial? Você precisará cadastrar novamente para entrar com rosto.")) return;
    
    setDeletingBiometrics(true);
    try {
      await FacialBiometricService.deleteBiometrics(user.id);
      setUserBiometrics(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (e) {
      console.error("Erro ao remover biometria:", e);
      setErrorMsg("Falha ao remover cadastro facial.");
    } finally {
      setDeletingBiometrics(false);
    }
  };

  const handleEnrollSuccess = async (data: any) => {
    console.log("[Profile] Cadastro facial realizado com sucesso:", data);
    setUserBiometrics(data);
    setShowEnrollModal(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  useEffect(() => {
    loadUserBiometrics();
  }, [user?.id]);

  const handleTerminateSession = async (id: string) => {
    setSessionActionLoading(id);
    try {
      await SessionService.terminateSession(id);
      await loadSessions();
    } catch (e) {
      console.error("Erro ao encerrar sessão:", e);
    } finally {
      setSessionActionLoading(null);
    }
  };

  const handleTerminateOthers = async () => {
    if (!user?.id) return;
    setSessionActionLoading('others');
    try {
      await SessionService.terminateAllOtherSessions(user.id);
      await loadSessions();
    } catch (e) {
      console.error("Erro ao encerrar outras sessões:", e);
    } finally {
      setSessionActionLoading(null);
    }
  };
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    lat: '',
    lng: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    photoUrl: ''
  });

  const roleNames: Record<string, string> = {
    ADMIN: 'Administrador',
    INTEGRATOR: 'Integrador',
    SCR: 'Motovigia',
    RESIDENT: 'Morador'
  };

  // Carrega dados iniciais do usuário
  useEffect(() => {
    if (user && !saving) { // Não sincroniza se estiver salvando para evitar pulos no input
        setFormData({
            name: user.name || '',
            email: user.email || '',
            lat: user.lat?.toString() || '',
            lng: user.lng?.toString() || '',
            address: user.address || '',
            city: user.city || '',
            state: user.state || '',
            phone: user.phone || '',
            photoUrl: user.photoUrl || ''
        });
    }
  }, [user, saving]);

  useEffect(() => {
    const loadNeighborhood = async () => {
        if (user?.neighborhoodId) {
            const hood = await MockService.getNeighborhoodById(user.neighborhoodId);
            setNeighborhoodName(hood?.name || 'Bairro Desconhecido');
        } else if (user?.role === 'ADMIN') {
            setNeighborhoodName('Administrador Global');
        } else {
            setNeighborhoodName('Não vinculado');
        }
    };
    loadNeighborhood();
  }, [user?.neighborhoodId, user?.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    
    // Limpeza e conversão de coordenadas
    const rawLat = formData.lat.replace(',', '.').trim();
    const rawLng = formData.lng.replace(',', '.').trim();
    
    const parsedLat = rawLat === '' ? undefined : parseFloat(rawLat);
    const parsedLng = rawLng === '' ? undefined : parseFloat(rawLng);

    // Validação básica de números
    if ((rawLat !== '' && isNaN(parsedLat as number)) || (rawLng !== '' && isNaN(parsedLng as number))) {
        setErrorMsg("Latitude ou Longitude inválidas. Use apenas números e ponto.");
        setSaving(false);
        return;
    }

    try {
        await updateProfile({
            name: formData.name.trim(),
            phone: formData.phone.trim() || undefined,
            address: formData.address.trim() || undefined,
            city: formData.city.trim() || undefined,
            state: formData.state.trim() || undefined,
            photoUrl: formData.photoUrl || undefined,
            lat: parsedLat,
            lng: parsedLng
        });
        
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 4000);
    } catch (error: any) {
        console.error("Erro ao salvar perfil:", error);
        setErrorMsg(error.message || 'Erro inesperado ao salvar os dados.');
    } finally {
        setSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
          alert("A imagem deve ter no máximo 2MB");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Meu Perfil</h1>
            <p className="text-gray-400">Gerencie suas informações pessoais e de localização.</p>
        </div>

        {errorMsg && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={20} />
                <span className="text-sm font-medium">{errorMsg}</span>
            </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            {/* Left Col: Photo & Basic Info */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="p-6 text-center">
                    <div className="relative inline-block mb-6 group">
                        <div className="w-32 h-32 rounded-full border-2 border-atalaia-neon p-1 mx-auto bg-black overflow-hidden relative">
                             {formData.photoUrl ? (
                                 <img src={formData.photoUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                             ) : (
                                 <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-4xl text-gray-600 font-bold">
                                     {formData.name ? formData.name.charAt(0) : '?'}
                                 </div>
                             )}
                             
                             <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                             >
                                 <Camera className="text-white" size={24} />
                             </div>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload} 
                            accept="image/*" 
                            className="hidden" 
                        />
                        <p className="text-xs text-gray-500 mt-2">Clique para alterar foto</p>
                    </div>

                    <h2 className="text-xl font-bold text-white truncate px-2">{user?.name}</h2>
                    <p className="text-atalaia-neon text-sm font-medium mb-4">
                        {user?.role ? roleNames[user.role] : ''}
                    </p>

                    <div className="text-left space-y-4 pt-4 border-t border-white/5">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Plano Atual</label>
                            <div className="flex items-center justify-between">
                                <span className={`text-sm font-bold ${user?.plan === 'FREE' ? 'text-gray-400' : 'text-yellow-500'}`}>
                                    {user?.plan === 'FREE' ? 'Gratuito' : user?.plan === 'FAMILY' ? 'Família' : 'Prêmio'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">E-mail de Acesso</label>
                            <p className="text-sm text-gray-300 truncate" title={user?.email}>{user?.email}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Right Col: Forms */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="p-6 md:p-8">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <UserIcon className="text-atalaia-neon" size={20} />
                        Dados Pessoais
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <Input 
                            label="Nome Completo"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                        />
                         <Input 
                            label="WhatsApp / Telefone"
                            placeholder="+55 48 99999-9999"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>

                    <div className="pt-6 border-t border-white/10">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Home className="text-atalaia-neon" size={20} />
                            Endereço e Bairro
                        </h3>

                        <div className="mb-6">
                            <Input 
                                label="Bairro Vinculado"
                                value={neighborhoodName}
                                disabled
                                className="opacity-80 cursor-not-allowed bg-atalaia-neon/5 border-atalaia-neon/30 text-atalaia-neon font-bold"
                            />
                        </div>

                        <div className="mb-6">
                            <Input 
                                label="Endereço (Rua, Número, Apto)"
                                placeholder="Ex: Rua das Flores, 123"
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 mb-6">
                             <Input 
                                label="Cidade"
                                value={formData.city}
                                onChange={(e) => setFormData({...formData, city: e.target.value})}
                            />
                             <Input 
                                label="Estado (UF)"
                                placeholder="SC"
                                value={formData.state}
                                maxLength={2}
                                onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <MapPin className="text-atalaia-neon" size={20} />
                            Geolocalização (Mapa)
                        </h3>
                        <p className="text-xs text-gray-500 mb-6">
                            Estes dados permitem que você apareça no Mapa Comunitário para seus vizinhos.
                        </p>

                        <div className="grid grid-cols-2 gap-6">
                            <Input 
                                label="Latitude"
                                placeholder="Ex: -27.5969"
                                value={formData.lat}
                                onChange={(e) => setFormData({...formData, lat: e.target.value})}
                            />
                            <Input 
                                label="Longitude"
                                placeholder="Ex: -48.5495"
                                value={formData.lng}
                                onChange={(e) => setFormData({...formData, lng: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="pt-8 flex items-center justify-end gap-4">
                        {showSuccess && (
                            <div className="flex items-center gap-2 text-green-500 animate-in fade-in slide-in-from-right-2">
                                <CheckCircle size={18} />
                                <span className="font-bold text-sm">Atualizado com sucesso!</span>
                            </div>
                        )}
                        <Button 
                            type="submit" 
                            disabled={saving}
                            className={`px-8 py-3 min-w-[180px] transition-all duration-300 ${showSuccess ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20' : ''}`}
                        >
                            {saving ? (
                                <><Loader2 className="animate-spin mr-2" size={18} /> Salvando...</>
                            ) : showSuccess ? (
                                <><CheckCircle size={18} className="mr-2" /> Salvo!</>
                            ) : (
                                <><Save size={18} className="mr-2" /> Salvar Alterações</>
                            )}
                        </Button>
                    </div>
                </Card>
            </div>
        </form>

        {/* RECONHECIMENTO FACIAL - CADASTRO BIOMÉTRICO */}
        <div className="pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="p-6 md:p-8 border border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-atalaia-neon/30 to-transparent" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                    <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Scan className="text-atalaia-neon" size={18} />
                            Reconhecimento Facial (Acesso Seguro)
                        </h3>
                        <p className="text-[11px] text-zinc-500 mt-1">
                            Cadastre seu rosto para conseguir acessar o Atalaia instantaneamente pelo navegador, de forma 100% segura usando inteligência artificial biométrica local. Nenhum serviço pago de terceiros é utilizado.
                        </p>
                    </div>
                </div>

                {loadingBiometrics ? (
                    <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
                        <Loader2 className="text-atalaia-neon animate-spin mb-3" size={24} />
                        <span className="text-[11px] font-mono tracking-wider text-zinc-500">Verificando banco de dados biométrico...</span>
                    </div>
                ) : userBiometrics ? (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl border border-green-500/30 p-0.5 bg-black overflow-hidden relative group">
                                {userBiometrics.photoBase64 ? (
                                    <img src={userBiometrics.photoBase64} alt="Cadastrado" className="w-full h-full rounded-lg object-cover animate-pulse" />
                                ) : (
                                    <div className="w-full h-full rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                        <UserCheck size={28} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-[#0ffa9c]/10 animate-pulse rounded-lg pointer-events-none" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-white">Biometria Facial Ativa</span>
                                    <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-[8px] font-bold text-green-400 tracking-widest rounded-md uppercase font-mono">
                                        CADASTRADA
                                    </span>
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                                    Identificação Segura Local &bull; Registro: Ativo & Autenticado
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowEnrollModal(true)}
                                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-850 text-xs font-bold uppercase py-2.5 px-4 rounded-xl transition-all"
                            >
                                Recadastrar Rosto
                            </button>
                            <button
                                type="button"
                                onClick={handleRemoveBiometrics}
                                disabled={deletingBiometrics}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold uppercase py-2.5 px-4 rounded-xl transition-all flex items-center gap-2"
                            >
                                {deletingBiometrics ? <Loader2 className="animate-spin" size={12} /> : <Trash2 size={12} />}
                                <span>Remover Biometria</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6">
                        <div className="flex items-start gap-3">
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl mt-1">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-zinc-200 font-sans">Acesso Biométrico Desabilitado</h4>
                                <p className="text-[11px] text-zinc-500 mt-0.5">
                                    Você ainda não possui um rosto cadastrado nesta conta tática. Registre sua biometria para realizar autenticações rápidas sem senha.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowEnrollModal(true)}
                            className="bg-atalaia-neon text-black font-black hover:bg-atalaia-neon/90 hover:shadow-[0_0_20px_rgba(15,250,156,0.25)] text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition-all flex items-center gap-2 self-start sm:self-center"
                        >
                            <Scan size={14} />
                            <span>Cadastrar Meu Rosto</span>
                        </button>
                    </div>
                )}
            </Card>
        </div>

        {/* CONTROLE DE SESSÕES ATIVAS - ANTI-COMPARTILHAMENTO */}
        <div className="pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="p-6 md:p-8 border border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md relative overflow-hidden">
                {/* Visual accent top line */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-atalaia-neon/30 to-transparent" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
                    <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Monitor className="text-atalaia-neon" size={18} />
                            Dispositivos Conectados
                        </h3>
                        <p className="text-[11px] text-zinc-500 mt-1">
                            Monitore e encerre as sessões táticas ativas no Atalaia. Uso compartilhado é bloqueado automaticamente para auditar a integridade das câmeras.
                        </p>
                    </div>
                    {sessions.length > 1 && (
                        <button
                            onClick={handleTerminateOthers}
                            disabled={sessionActionLoading !== null}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 text-[10px] font-bold uppercase py-2 px-4 rounded-xl transition-all flex items-center gap-2 self-start sm:self-center"
                        >
                            {sessionActionLoading === 'others' ? (
                                <><Loader2 className="animate-spin" size={12} /> Desconectando Outros...</>
                            ) : (
                                <><LogOut size={12} /> Desconectar Outros Dispositivos</>
                            )}
                        </button>
                    )}
                </div>

                {loadingSessions ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                        <Loader2 className="text-atalaia-neon animate-spin mb-3" size={24} />
                        <span className="text-[11px] font-mono tracking-wider text-zinc-500">Sincronizando sessões ativas com o servidor...</span>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 text-xs">
                         Nenhuma sessão tática localizada.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                         {sessions.map((sess) => {
                             const isMobile = sess.os === 'Android' || sess.os === 'iOS';
                             
                             return (
                                 <div 
                                     key={sess.id}
                                     className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                         sess.isCurrent 
                                             ? 'bg-[#0f1c19] border-[#0ffa9c]/20' 
                                             : 'bg-[#121212] border-white/5 hover:border-white/10'
                                     }`}
                                 >
                                     <div className="flex items-start gap-4">
                                         <div className={`p-3 rounded-xl flex items-center justify-center ${
                                             sess.isCurrent ? 'bg-[#0ffa9c]/10 text-[#0ffa9c]' : 'bg-white/5 text-zinc-500'
                                         }`}>
                                             {isMobile ? <Smartphone size={18} /> : sess.os === 'Windows' || sess.os === 'macOS' || sess.os === 'Linux' ? <Laptop size={18} /> : <Monitor size={18} />}
                                         </div>
                                         <div>
                                             <div className="flex flex-wrap items-center gap-2">
                                                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                                      {sess.os} <span className="w-1 h-1 bg-zinc-650 rounded-full" /> {sess.browser}
                                                  </span>
                                                  {sess.isCurrent && (
                                                      <span className="px-2 py-0.5 bg-[#0ffa9c]/10 border border-[#0ffa9c]/20 text-[8px] font-bold text-[#0ffa9c] tracking-widest rounded-md uppercase font-mono">
                                                          Conexão Atual
                                                      </span>
                                                  )}
                                             </div>
                                             <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 font-mono text-[9px] text-zinc-500">
                                                  <span><strong className="text-zinc-650 font-normal">IP:</strong> {sess.ipAddress}</span>
                                                  <span><strong className="text-zinc-650 font-normal">Acesso em:</strong> {sess.createdAt.toLocaleString('pt-BR')}</span>
                                             </div>
                                         </div>
                                     </div>

                                     {!sess.isCurrent && (
                                         <button
                                             onClick={() => handleTerminateSession(sess.id)}
                                             disabled={sessionActionLoading !== null}
                                             className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/20 rounded-xl text-[10px] font-bold tracking-wider text-red-500/80 hover:text-red-500 transition-all self-end md:self-center uppercase"
                                         >
                                             {sessionActionLoading === sess.id ? (
                                                 <Loader2 className="animate-spin" size={12} />
                                             ) : (
                                                 <Trash2 size={12} />
                                             )}
                                             <span>Desconectar Sessão</span>
                                         </button>
                                     )}
                                 </div>
                             );
                         })}
                    </div>
                )}
            </Card>
        </div>
      </div>

      {/* MODAL DE CADASTRO BIOMÉTRICO (TENSORFLOW / BLAZEFACE) */}
      <FacialScannerModal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          mode="enroll"
          userId={user?.id}
          onSuccess={handleEnrollSuccess}
      />
    </Layout>
  );
};

export default Profile;

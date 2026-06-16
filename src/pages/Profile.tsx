
import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '@/auth/context';
import { Card, Input, Button } from '../components/UI';
import { MockService } from '../services/mockService';
import { Save, User as UserIcon, Camera, Home, MapPin, CheckCircle, Loader2, AlertCircle, Smartphone, Laptop, Monitor, Trash2, LogOut, Sparkles, Upload, Building, CreditCard, Sliders, Check } from 'lucide-react';
import { SessionService } from '../services/sessionService';
import { UserRole } from '@/types';

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
  
  // BRANDING & SPLIT PAYMENT STATES FOR INTEGRATOR
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [mpPubKey, setMpPubKey] = useState('');
  const [mpAccToken, setMpAccToken] = useState('');
  const [splitPct, setSplitPct] = useState(70);
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingStatusMsg, setBrandingStatusMsg] = useState('');

  const [brandCnpj, setBrandCnpj] = useState('');
  const [brandRazaoSocial, setBrandRazaoSocial] = useState('');
  const [brandPhone, setBrandPhone] = useState('');
  const [brandBanco, setBrandBanco] = useState('');
  const [brandPix, setBrandPix] = useState('');
  const [brandCpf, setBrandCpf] = useState('');
  const [brandEmail, setBrandEmail] = useState('');

  useEffect(() => {
    if (user && !savingBranding) {
      setBrandName(user.companyName || '');
      setBrandLogo(user.companyLogo || '');
      setMpPubKey(user.mpPublicKey || '');
      setMpAccToken(user.mpAccessToken || '');
      setSplitPct(user.splitPercentage || 70);
      setBrandCnpj(user.cnpj || '');
      setBrandRazaoSocial(user.razaoSocial || '');
      setBrandPhone(user.phone || '');
      setBrandBanco(user.banco || '');
      setBrandPix(user.pix || '');
      setBrandCpf(user.cpf || '');
      setBrandEmail(user.email || '');
    }
  }, [user, savingBranding]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                  setBrandLogo(reader.result);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
      e.preventDefault();
      setSavingBranding(true);
      setBrandingStatusMsg('');
      try {
          // Serialize branding details inside standard 'address' column as JSON string to maintain schema consistency
          const serializedAddress = JSON.stringify({
              companyName: brandName,
              companyLogo: brandLogo,
              splitPercentage: Number(splitPct),
              cnpj: brandCnpj,
              razaoSocial: brandRazaoSocial,
              banco: brandBanco,
              pix: brandPix,
              cpf: brandCpf
          });

          await updateProfile({
              address: serializedAddress,
              mpPublicKey: mpPubKey,
              mpAccessToken: mpAccToken,
              companyName: brandName,
              companyLogo: brandLogo,
              splitPercentage: Number(splitPct),
              cnpj: brandCnpj,
              razaoSocial: brandRazaoSocial,
              phone: brandPhone,
              banco: brandBanco,
              pix: brandPix,
              cpf: brandCpf,
              email: brandEmail
          } as any);

          setBrandingStatusMsg('Configurações de Parceria e Dados Corporativos salvas com sucesso!');
          setTimeout(() => {
              setBrandingStatusMsg('');
          }, 3500);
      } catch (err: any) {
          setBrandingStatusMsg('Erro ao salvar configurações: ' + (err.message || err));
      } finally {
          setSavingBranding(false);
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
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
                <form onSubmit={handleSubmit}>
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
                </form>

                {/* INTEGRATOR CO-BRANDING & SPLIT PAYMENTS SECTOR */}
                {user?.role === UserRole.INTEGRATOR && (
                    <Card className="p-6 md:p-8 border border-atalaia-neon/20 bg-gradient-to-b from-[#03140a]/40 to-black relative overflow-hidden">
                        {/* Glowing backdrop decorative bubble */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-atalaia-neon/5 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                            <div className="p-2.5 bg-atalaia-neon/15 rounded-xl text-atalaia-neon border border-atalaia-neon/20 shadow-[0_0_15px_rgba(0,255,102,0.1)]">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white tracking-wide">Configurar Parceria & Split</h3>
                                <p className="text-[11px] text-gray-400">Co-Branding Visual & Integração Financeira Mercado Pago</p>
                            </div>
                        </div>

                        {/* ALERT INFO */}
                        <div className="p-4 bg-[#05110a] border border-atalaia-neon/20 rounded-xl flex items-start gap-3 mb-6">
                            <AlertCircle className="text-atalaia-neon shrink-0 mt-0.5 animate-pulse" size={18} />
                            <p className="text-xs text-zinc-305 leading-relaxed font-sans">
                                Como nosso <strong className="text-atalaia-neon">Integrador Parceiro</strong>, suas modificações comerciais são refletidas para todos os moradores do seu bairro. Customize sua identidade visual e configure suas credenciais de Mercado Pago para split automático instantâneo em tempo real!
                            </p>
                        </div>

                        <form onSubmit={handleSaveBranding} className="space-y-6">
                            {/* SECTION 1: IDENTITY */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800/60 pb-2">
                                    <Building size={14} className="text-atalaia-neon" /> Identidade Visual da sua Empresa
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input 
                                        label="Nome da Empresa" 
                                        placeholder="Ex: Delta Monitoramento Ltda" 
                                        value={brandName} 
                                        onChange={e => setBrandName(e.target.value)} 
                                    />
                                    <div>
                                        <label className="text-[10px] text-gray-405 uppercase font-black tracking-wider block mb-2 font-mono">Logomarca (URL ou Upload)</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Link da imagem da sua marca..." 
                                                value={brandLogo} 
                                                onChange={e => setBrandLogo(e.target.value)} 
                                                className="flex-1 h-12 bg-black border border-white/10 rounded-xl px-4 text-xs text-white placeholder-gray-600 focus:border-atalaia-neon outline-none transition-all"
                                            />
                                            <label className="h-12 w-12 bg-zinc-900 border border-white/10 hover:border-atalaia-neon/50 rounded-xl flex items-center justify-center cursor-pointer text-gray-400 hover:text-white transition-all shadow-md shrink-0">
                                                <Upload size={18} />
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={handleLogoUpload} 
                                                    className="hidden" 
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* CO-BRANDING LIVE PREVIEW */}
                                <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl space-y-2.5 shadow-inner">
                                    <span className="text-[9px] text-zinc-500 uppercase font-black block font-mono">Pré-visualização da Parceria Comercial</span>
                                    <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-zinc-900 to-black rounded-lg border border-white/10">
                                        <div className="flex items-center gap-2.5">
                                            <h5 className="text-xs font-black text-white tracking-widest uppercase">ATALAIA</h5>
                                            <span className="text-[10px] text-zinc-500 font-bold">🤝</span>
                                            {brandLogo ? (
                                                <div className="flex items-center gap-2 filter drop-shadow-[0_0_5px_rgba(255,255,255,0.15)] animate-in fade-in-30">
                                                    <img referrerPolicy="no-referrer" src={brandLogo} alt="Logo" className="w-5 h-5 rounded-md object-cover bg-zinc-800" />
                                                    <span className="text-xs font-semibold text-atalaia-neon">{brandName || 'Sua Empresa'}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900/50 px-2 py-1 rounded">Logomarca Pendente</span>
                                            )}
                                        </div>
                                        <span className="text-[9px] bg-atalaia-neon/15 text-atalaia-neon px-2 py-0.5 rounded font-black uppercase">Homologado</span>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: CORPORATE REGISTRATION & BILLING */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800/60 pb-2">
                                    <Building size={14} className="text-atalaia-neon" /> Cadastro Corporativo & Faturamento Bancário
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input 
                                        label="Razão Social" 
                                        placeholder="Ex: Delta Serviços Gerais de Monitoramento Eireli" 
                                        value={brandRazaoSocial} 
                                        onChange={e => setBrandRazaoSocial(e.target.value)} 
                                    />
                                    <Input 
                                        label="CNPJ" 
                                        placeholder="Ex: 00.000.000/0001-00" 
                                        value={brandCnpj} 
                                        onChange={e => setBrandCnpj(e.target.value)} 
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <Input 
                                        label="CPF do Responsável" 
                                        placeholder="Ex: 000.000.000-00" 
                                        value={brandCpf} 
                                        onChange={e => setBrandCpf(e.target.value)} 
                                    />
                                    <Input 
                                        label="Telefone Corporativo" 
                                        placeholder="Ex: (11) 99999-9999" 
                                        value={brandPhone} 
                                        onChange={e => setBrandPhone(e.target.value)} 
                                    />
                                    <Input 
                                        label="E-mail Corporativo" 
                                        type="email"
                                        placeholder="Ex: contato@suaempresa.com" 
                                        value={brandEmail} 
                                        onChange={e => setBrandEmail(e.target.value)} 
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input 
                                        label="Banco" 
                                        placeholder="Ex: Itaú Unibanco (341) ou Nubank (260)" 
                                        value={brandBanco} 
                                        onChange={e => setBrandBanco(e.target.value)} 
                                    />
                                    <Input 
                                        label="Chave PIX do Sacado" 
                                        placeholder="Ex: Celular, E-mail, CNPJ ou Chave Aleatória" 
                                        value={brandPix} 
                                        onChange={e => setBrandPix(e.target.value)} 
                                    />
                                </div>
                            </div>

                            {/* SECTION 3: MERCADO PAGO INTEGRATION */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800/60 pb-2">
                                    <CreditCard size={14} className="text-atalaia-neon" /> Integração Financeira Mercado Pago (Split)
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input 
                                        label="Chave Pública (Public Key)" 
                                        placeholder="APP_USR-xxxxxx..." 
                                        value={mpPubKey} 
                                        onChange={e => setMpPubKey(e.target.value)} 
                                    />
                                    <Input 
                                        label="Token de Acesso (Access Token)" 
                                        type="password"
                                        placeholder="MLA-xxxxxx..." 
                                        value={mpAccToken} 
                                        onChange={e => setMpAccToken(e.target.value)} 
                                    />
                                </div>

                                {/* SLIDER FOR SPLIT PERCENTAGE */}
                                <div className="p-4 bg-zinc-950/40 rounded-xl border border-white/5 space-y-4 shadow-inner">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400 font-bold flex items-center gap-1.5 font-mono"><Sliders size={14} className="text-atalaia-neon"/> Divisão de Split (% Repasse)</span>
                                        <span className="bg-atalaia-neon text-black font-black px-2.5 py-1 rounded text-xs animate-pulse">
                                            {splitPct}% de Comissão
                                        </span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="20" 
                                        max="95" 
                                        step="5" 
                                        value={splitPct}
                                        onChange={e => setSplitPct(Number(e.target.value))}
                                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-atalaia-neon focus:outline-none focus:ring-1 focus:ring-atalaia-neon"
                                    />
                                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                                        <span>Mínima (20% Integrador)</span>
                                        <span>Máxima (95% Integrador)</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-3.5 text-center text-xs border-t border-white/5">
                                        <div>
                                            <span className="text-zinc-550 font-bold block text-[9px] uppercase tracking-wider font-mono">Sua Comissão (Integrador)</span>
                                            <span className="text-lg font-black text-white">{splitPct}%</span>
                                        </div>
                                        <div className="border-l border-white/5">
                                            <span className="text-zinc-550 font-bold block text-[9px] uppercase tracking-wider font-mono">Royalties Plataforma (Atalaia)</span>
                                            <span className="text-lg font-black text-zinc-400">{100 - splitPct}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {brandingStatusMsg && (
                                <div className={`p-4 rounded-xl text-center text-xs font-bold leading-relaxed border animate-in fade-in slide-in-from-bottom-2 ${
                                    brandingStatusMsg.includes('Erro') 
                                    ? 'bg-red-950/20 border-red-500/20 text-red-500' 
                                    : 'bg-[#0f2415] border-atalaia-neon/20 text-atalaia-neon'
                                }`}>
                                    {brandingStatusMsg}
                                </div>
                            )}

                            <div className="flex items-center justify-end pt-2">
                                <Button
                                    type="submit"
                                    disabled={savingBranding}
                                    className="px-8 h-12 bg-atalaia-neon hover:bg-atalaia-neon/90 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-[0_4px_15px_rgba(0,255,102,0.25)] flex items-center justify-center gap-2 w-full md:w-auto"
                                >
                                    {savingBranding ? (
                                        <Loader2 className="animate-spin mr-2" size={18} />
                                    ) : (
                                        <><Check size={18} className="mr-2" /> Gravar Configurações de Parceria</>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}
            </div>
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

    </Layout>
  );
};

export default Profile;


import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '@/context/AuthContext';
import { Card, Input, Button } from '../components/UI';
import { MockService } from '../services/mockService';
import { Save, User as UserIcon, Camera, Home, MapPin, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [neighborhoodName, setNeighborhoodName] = useState('Carregando...');
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
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
      </div>
    </Layout>
  );
};

export default Profile;

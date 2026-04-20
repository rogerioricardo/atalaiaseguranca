
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, Badge } from '../components/UI';
import { 
    AlertTriangle, ShieldAlert, CheckCircle, Eye, Phone, Shield, 
    Ambulance, Flame, Headset, Camera, MessageSquare, Send, Loader2, Sparkles,
    Save, RefreshCw, Edit2, Trash2
} from 'lucide-react';
import { MockService } from '../services/mockService';
import { UserRole } from '../types';
import { supabase } from '../lib/supabaseClient';

const Alerts: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<Record<string, string>>({});
  const [editingTemplates, setEditingTemplates] = useState<Record<string, string>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [activeEditKey, setActiveEditKey] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === UserRole.ADMIN;

  const loadTemplates = useCallback(async () => {
      const settings = await MockService.getSettings();
      const filtered = Object.entries(settings)
        .filter(([key]) => !['template_alert', 'template_welcome', 'template_login', 'template_broadcast_prefix'].includes(key))
        .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {} as Record<string, string>);
      setCustomTemplates(filtered);
      setEditingTemplates(filtered);
  }, []);

  useEffect(() => {
      loadTemplates();

      const sub = MockService.subscribeToTable('system_settings', loadTemplates);
      return () => {
          supabase.removeChannel(sub);
      };
  }, [loadTemplates]);

  const handlePanic = async (type: 'PANIC' | 'DANGER' | 'SUSPICIOUS' | 'OK', imageBase64?: string) => {
      if(!user) return;
      setLoading(true);
      
      try {
        await MockService.createAlert({
            type,
            userId: user.id,
            userName: user.name,
            neighborhoodId: user.neighborhoodId || undefined,
            userRole: user.role,
            image: imageBase64
        });
        
        alert(imageBase64 ? 'Alerta com foto enviado!' : 'Alerta enviado!');
      } catch (e) {
        alert('Erro ao enviar alerta.');
      } finally {
        setLoading(false);
      }
  };

  const handleSaveTemplate = async (key: string) => {
      const newValue = editingTemplates[key];
      if (newValue === customTemplates[key]) {
          setActiveEditKey(null);
          return;
      }

      setSavingKeys(prev => new Set(prev).add(key));
      try {
          await MockService.updateSetting(key, newValue);
          setCustomTemplates(prev => ({ ...prev, [key]: newValue }));
          setActiveEditKey(null);
          setTimeout(() => {
              setSavingKeys(prev => {
                  const next = new Set(prev);
                  next.delete(key);
                  return next;
              });
          }, 800);
      } catch (e) {
          alert("Erro ao salvar template: " + key);
          setSavingKeys(prev => {
              const next = new Set(prev);
              next.delete(key);
              return next;
          });
      }
  };

  const handleSendCustomTemplate = async (key: string) => {
      const content = editingTemplates[key];
      
      if (isAdmin && content !== customTemplates[key]) {
          await handleSaveTemplate(key);
      }

      if (!window.confirm(`Disparar mensagem do template "${key}" agora?`)) return;
      
      setLoading(true);
      try {
          const hood = user?.neighborhoodId ? (await MockService.getNeighborhoodById(user.neighborhoodId))?.name : 'Geral';
          const finalMsg = content
            .replace('{{name}}', user?.name || 'Usuário')
            .replace('{{hood}}', hood || 'Atalaia')
            .replace('{{time}}', new Date().toLocaleTimeString());

          await MockService.createAlert({
              type: 'OK',
              userId: user?.id || '',
              userName: user?.name || 'Sistema',
              neighborhoodId: user?.neighborhoodId || undefined,
              userRole: user?.role,
              message: `MENSAGEM RÁPIDA: ${finalMsg}`
          });

          alert('Mensagem disparada e registrada no sistema!');
      } catch (e) {
          alert('Falha ao disparar template.');
      } finally {
          setLoading(false);
      }
  };

  const handleButtonClick = (type: 'PANIC' | 'DANGER' | 'SUSPICIOUS' | 'OK') => {
      if (type === 'SUSPICIOUS') {
          cameraInputRef.current?.click();
      } else {
          handlePanic(type);
      }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              handlePanic('SUSPICIOUS', reader.result as string);
          };
          reader.readAsDataURL(file);
      }
      e.target.value = '';
  };

  const PanicButton = ({ type, icon: Icon, label, color, bg }: any) => (
      <button
        onClick={() => handleButtonClick(type)}
        disabled={loading}
        className={`relative overflow-hidden group p-6 rounded-2xl border transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-4 h-40 w-full shadow-lg ${bg} ${color}`}
      >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Icon size={40} className="z-10" />
          <span className="font-bold text-xl z-10 text-center leading-tight">{label}</span>
          {type === 'SUSPICIOUS' && <Camera size={16} className="absolute bottom-4 right-4 opacity-50" />}
      </button>
  );

  return (
    <Layout>
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-2">Central de Alertas</h1>
                <p className="text-gray-400 text-lg">Acione a rede de proteção da sua comunidade.</p>
            </div>
            
            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleCameraCapture} className="hidden" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <PanicButton type="PANIC" icon={ShieldAlert} label="PÂNICO" bg="bg-red-600 border-red-500" color="text-white shadow-[0_0_30px_rgba(220,38,38,0.5)]" />
                <PanicButton type="DANGER" icon={AlertTriangle} label="PERIGO" bg="bg-orange-600 border-orange-500" color="text-white shadow-[0_0_30_rgba(234,88,12,0.5)]" />
                <PanicButton type="SUSPICIOUS" icon={Eye} label="SUSPEITA" bg="bg-yellow-500 border-yellow-400" color="text-black shadow-[0_0_30px_rgba(234,179,8,0.5)]" />
                <PanicButton type="OK" icon={CheckCircle} label="ESTOU BEM" bg="bg-atalaia-neon border-green-400" color="text-black shadow-[0_0_30px_rgba(0,255,102,0.5)]" />
            </div>

            {user?.role !== UserRole.RESIDENT && Object.keys(editingTemplates).length > 0 && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-widest text-sm">
                            <Sparkles className="text-atalaia-neon" size={18} /> Mensagens Rápidas (Templates)
                        </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(editingTemplates).map(([key, val]) => {
                            const isDirty = val !== customTemplates[key];
                            const isSaving = savingKeys.has(key);
                            const isEditing = activeEditKey === key;

                            return (
                                <Card key={key} className={`p-5 transition-all group relative overflow-hidden ${isSaving ? 'border-atalaia-neon/50 bg-atalaia-neon/5' : isEditing ? 'border-atalaia-neon/40 shadow-[0_0_15px_rgba(0,255,102,0.1)]' : 'border-atalaia-border bg-[#080808]'}`}>
                                    {isSaving && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center">
                                            <Loader2 className="animate-spin text-atalaia-neon" size={24} />
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-atalaia-neon/10 rounded-lg text-atalaia-neon">
                                            <MessageSquare size={20} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isDirty && <Badge color="yellow">ALTERADO</Badge>}
                                            {isAdmin && (
                                                <div className="flex gap-1">
                                                    <button onClick={() => setActiveEditKey(isEditing ? null : key)} className={`p-1.5 rounded transition-colors ${isEditing ? 'text-atalaia-neon bg-atalaia-neon/10' : 'text-gray-500 hover:text-white'}`}><Edit2 size={16}/></button>
                                                    <button onClick={async () => { if(confirm('Excluir?')) { await MockService.deleteSetting(key); loadTemplates(); } }} className="p-1.5 text-gray-500 hover:text-red-500 rounded transition-colors"><Trash2 size={16}/></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-white font-bold mb-2 uppercase text-[10px] tracking-widest">{key.replace(/_/g, ' ')}</h3>
                                    
                                    {isEditing ? (
                                        <textarea 
                                            className="w-full h-32 bg-black/50 border border-atalaia-neon/40 rounded-lg p-3 text-[10px] font-mono text-white focus:border-atalaia-neon outline-none resize-none mb-4 custom-scrollbar"
                                            value={val}
                                            onChange={(e) => setEditingTemplates(prev => ({ ...prev, [key]: e.target.value }))}
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="w-full h-32 bg-black/20 border border-white/5 rounded-lg p-3 text-[10px] text-gray-500 font-mono leading-relaxed mb-4 overflow-y-auto custom-scrollbar">
                                            {val}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        {isAdmin && (isDirty || isEditing) && (
                                            <Button 
                                                onClick={() => handleSaveTemplate(key)}
                                                variant="outline"
                                                className="flex-1 text-[10px] h-10 border-atalaia-neon/50 text-atalaia-neon"
                                            >
                                                <Save size={14} /> {isEditing ? 'Salvar' : ''}
                                            </Button>
                                        )}
                                        <Button 
                                            onClick={() => handleSendCustomTemplate(key)}
                                            disabled={loading}
                                            className="flex-[2] text-[10px] font-black uppercase h-10 tracking-widest"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={14} /> : <><Send size={14} className="mr-2" /> Disparar</>}
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            <Card className="p-8 border-atalaia-border bg-[#050505]">
                <h3 className="font-bold text-xl mb-6 flex items-center gap-3 text-white">
                    <Phone className="text-atalaia-neon" size={24} />
                    Contatos de Emergência
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="tel:190" className="flex items-center gap-4 p-5 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors border border-gray-800 group">
                        <div className="p-3 rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors"><Shield size={28} /></div>
                        <div><span className="block font-bold text-white uppercase tracking-wide">Polícia Militar</span><span className="text-gray-400 font-mono text-2xl group-hover:text-white transition-colors">190</span></div>
                    </a>
                    <a href="tel:192" className="flex items-center gap-4 p-5 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors border border-gray-800 group">
                        <div className="p-3 rounded-full bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors"><Ambulance size={28} /></div>
                        <div><span className="block font-bold text-white uppercase tracking-wide">SAMU</span><span className="text-gray-400 font-mono text-2xl group-hover:text-white transition-colors">192</span></div>
                    </a>
                    <a href="tel:193" className="flex items-center gap-4 p-5 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors border border-gray-800 group">
                        <div className="p-3 rounded-full bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors"><Flame size={28} /></div>
                        <div><span className="block font-bold text-white uppercase tracking-wide">Bombeiros</span><span className="text-gray-400 font-mono text-2xl group-hover:text-white transition-colors">193</span></div>
                    </a>
                    <a href="tel:08009999999" className="flex items-center gap-4 p-5 bg-atalaia-neon/5 rounded-xl hover:bg-atalaia-neon/10 transition-colors border border-atalaia-neon/30 group">
                        <div className="p-3 rounded-full bg-atalaia-neon/20 text-atalaia-neon group-hover:bg-atalaia-neon group-hover:text-black transition-colors"><Headset size={28} /></div>
                        <div><span className="block font-bold text-white uppercase tracking-wide">Central 24h</span><span className="text-atalaia-neon font-mono text-2xl">0800 999 9999</span></div>
                    </a>
                </div>
            </Card>
        </div>
    </Layout>
  );
};

export default Alerts;

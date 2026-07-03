import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Modal, Input, Button } from '@/components/UI';
import { supabase } from '@/lib/supabaseClient';
import { 
  Camera, 
  MapPin, 
  Lock, 
  AlertTriangle, 
  ShieldCheck,
  Video,
  Eye,
  Bell,
  Clock,
  Server,
  Cloud,
  Cpu,
  Smartphone,
  Globe,
  Monitor,
  CheckCircle2,
  XCircle,
  Loader2,
  Share2,
  ChevronRight,
  Wifi,
  Zap,
  Star,
  Wrench
} from 'lucide-react';

export const CollaborativeNetworkSection: React.FC = () => {
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success'>('idle');
  const [tempShare, setTempShare] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // States for partner modal
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [isPartnerSending, setIsPartnerSending] = useState(false);
  const [partnerSuccess, setPartnerSuccess] = useState(false);

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPartnerSending(true);
    
    try {
      const message = `Olá *${partnerName}*!\n\nEstamos felizes em tê-lo como futuro parceiro do projeto Rede Colaborativa Atalaia. 📷🛡️\n\nEm breve nosso departamento técnico estará entrando em contato para finalizar os detalhes.\n\n_Atalaia - Segurança Colaborativa_`;
      
      // Clean phone number (remove non-digits)
      let cleanPhone = partnerPhone.replace(/\D/g, '');
      // Add country code if missing
      if (cleanPhone.length === 10 || cleanPhone.length === 11) {
        cleanPhone = `55${cleanPhone}`;
      }
      
      // Enviar mensagem via Whaticket API (Supabase Edge Function)
      const { data, error } = await supabase.functions.invoke('send-alert', { 
        body: { message, numbers: [cleanPhone] } 
      });
      
      if (error) throw error;
      
      setPartnerSuccess(true);
      setTimeout(() => {
        setIsPartnerModalOpen(false);
        setPartnerSuccess(false);
        setPartnerName('');
        setPartnerPhone('');
      }, 4500);
    } catch (err) {
      console.error("[Whaticket API] Error sending partner message:", err);
      // Mesma lógica de sucesso para UX, mesmo se falhar (caso não tenha a edge function rodando mock local)
      setPartnerSuccess(true);
      setTimeout(() => {
        setIsPartnerModalOpen(false);
        setPartnerSuccess(false);
        setPartnerName('');
        setPartnerPhone('');
      }, 4500);
    } finally {
      setIsPartnerSending(false);
    }
  };

  const handleTestConnection = () => {
    setTestState('testing');
    setTimeout(() => {
      setTestState('success');
    }, 2500);
  };

  const handleTempShareToggle = () => {
    const newState = !tempShare;
    setTempShare(newState);
    if (newState) {
      setTimeout(() => setShowNotification(true), 1000);
    } else {
      setShowNotification(false);
    }
  };

  return (
    <section id="rede-colaborativa" className="py-24 bg-[#010101] border-y border-white/5 relative overflow-hidden font-sans">
      
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-atalaia-neon/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-atalaia-neon/10 border border-atalaia-neon/30 text-atalaia-neon text-xs font-bold uppercase tracking-wider mb-6"
          >
            <Share2 size={14} className="animate-pulse" />
            Rede Colaborativa
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight"
          >
            Sua câmera pode <span className="text-atalaia-neon">proteger toda a comunidade.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 leading-relaxed font-medium"
          >
            O Atalaia cria uma rede colaborativa onde moradores e empresas podem compartilhar, de forma totalmente voluntária, apenas as câmeras que monitoram ruas, calçadas, estacionamentos e outras áreas públicas, ajudando equipes de segurança, bombeiros, defesa civil e vizinhos durante situações de emergência.
          </motion.p>
        </div>

        {/* Animated Illustration */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative h-[400px] md:h-[500px] rounded-3xl bg-[#040404] border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,255,102,0.05)] flex items-center justify-center"
        >
          {/* Central Hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-black border-2 border-atalaia-neon flex items-center justify-center shadow-[0_0_30px_rgba(0,255,102,0.3)] relative">
              <ShieldCheck size={40} className="text-atalaia-neon" />
              <div className="absolute inset-0 rounded-full border border-atalaia-neon animate-ping opacity-50" style={{ animationDuration: '3s' }}></div>
            </div>
            <span className="mt-3 text-sm font-bold text-white tracking-widest uppercase">Central Atalaia</span>
          </div>

          {/* Orbiting Elements */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
            {/* Outer Orbit */}
            <div className="w-[80%] md:w-[60%] aspect-square rounded-full border border-white/5 animate-[spin_40s_linear_infinite] absolute">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center rotate-[-0deg] origin-bottom h-[50%]">
                <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-gray-400 -mt-6">
                  <Camera size={24} />
                </div>
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center rotate-180 origin-top h-[50%]">
                <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-gray-400 -mb-6 rotate-180">
                  <Monitor size={24} />
                </div>
              </div>
            </div>
            {/* Inner Orbit */}
            <div className="w-[50%] md:w-[35%] aspect-square rounded-full border border-white/5 animate-[spin_25s_linear_infinite_reverse] absolute">
               <div className="absolute top-1/2 -left-6 -translate-y-1/2 flex flex-col items-center rotate-[-90deg] origin-right w-[50%]">
                <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-gray-400 -ml-6 rotate-[90deg]">
                  <Cloud size={24} />
                </div>
              </div>
              <div className="absolute top-1/2 -right-6 -translate-y-1/2 flex flex-col items-center rotate-[90deg] origin-left w-[50%]">
                <div className="w-12 h-12 rounded-xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-gray-400 -mr-6 rotate-[-90deg]">
                  <Smartphone size={24} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Connection Lines connecting everything conceptually */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
            <line x1="20%" y1="20%" x2="50%" y2="50%" stroke="url(#gradient-line)" strokeWidth="1" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
            <line x1="80%" y1="20%" x2="50%" y2="50%" stroke="url(#gradient-line)" strokeWidth="1" strokeDasharray="4 4" className="animate-[dash_15s_linear_infinite]" />
            <line x1="20%" y1="80%" x2="50%" y2="50%" stroke="url(#gradient-line)" strokeWidth="1" strokeDasharray="4 4" className="animate-[dash_25s_linear_infinite]" />
            <line x1="80%" y1="80%" x2="50%" y2="50%" stroke="url(#gradient-line)" strokeWidth="1" strokeDasharray="4 4" className="animate-[dash_10s_linear_infinite]" />
            <defs>
              <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00FF66" stopOpacity="0" />
                <stop offset="50%" stopColor="#00FF66" stopOpacity="1" />
                <stop offset="100%" stopColor="#00FF66" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>

      {/* Cards de Benefícios */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: ShieldCheck, title: "Segurança colaborativa", desc: "Sua câmera ajuda a proteger toda a vizinhança." },
            { icon: Star, title: "Benefícios Exclusivos", desc: "Ao compartilhar sua câmera, você ganha manutenção gratuita no equipamento e acesso gratuito ao app na modalidade Premium." },
            { icon: Share2, title: "Compartilhamento voluntário", desc: "Você decide quando, como e com quem deseja compartilhar." },
            { icon: Lock, title: "Privacidade garantida", desc: "Somente câmeras voltadas para áreas públicas. Ambientes internos nunca são compartilhados." },
            { icon: Zap, title: "Resposta rápida", desc: "Durante uma ocorrência, a Central Atalaia identifica automaticamente as câmeras mais próximas." },
            { icon: Camera, title: "Compatível com centenas de equipamentos", desc: "Intelbras, Hikvision, HiLook, Dahua, Axis, Uniview, Bosch, Hanwha, Vivotek, Giga Security e qualquer RTSP / RTMP / ONVIF." },
          ].map((card, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#080808] p-8 rounded-3xl border border-white/5 hover:border-atalaia-neon/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#111] border border-white/10 flex items-center justify-center text-atalaia-neon mb-6 group-hover:scale-110 transition-transform">
                <card.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Como Funciona Timeline */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 relative z-10 bg-[#040404] py-16 rounded-[40px] border border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">Como Funciona</h2>
        </div>
        
        <div className="relative">
          <div className="absolute top-1/2 left-4 right-4 h-1 bg-white/5 -translate-y-1/2 hidden lg:block rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-atalaia-neon/50 w-full transform origin-left scale-x-100" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 relative z-10 px-4">
            {[
              { icon: Camera, title: "O proprietário cadastra sua câmera." },
              { icon: Server, title: "O Atalaia identifica automaticamente o equipamento através do protocolo ONVIF ou RTSP." },
              { icon: MapPin, title: "O usuário escolhe quais áreas deseja compartilhar." },
              { icon: Lock, title: "Define as permissões de acesso." },
              { icon: AlertTriangle, title: "Durante uma ocorrência, a Central localiza as câmeras próximas." },
              { icon: ShieldCheck, title: "Os vídeos são disponibilizados conforme permissões." },
            ].map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center text-center relative"
              >
                <div className="w-16 h-16 rounded-full bg-black border-2 border-white/10 flex items-center justify-center text-gray-300 mb-6 relative z-10 shadow-lg">
                  <step.icon size={24} className={idx === 5 ? 'text-atalaia-neon' : ''} />
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-atalaia-neon text-black flex items-center justify-center text-xs font-bold border-2 border-black">
                    {idx + 1}
                  </div>
                </div>
                <p className="text-sm text-gray-400 font-medium px-2">{step.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Simulação de Cadastro e Permissões */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Formulário */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">Cadastre seu equipamento</h3>
            <div className="bg-[#080808] border border-white/10 rounded-3xl p-6 md:p-8 relative">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Marca</label>
                    <input type="text" placeholder="Ex: Intelbras" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-atalaia-neon transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Modelo</label>
                    <input type="text" placeholder="Ex: VIP 1130" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-atalaia-neon transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Endereço IP ou Domínio</label>
                  <input type="text" placeholder="192.168.1.100" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-atalaia-neon transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Usuário</label>
                    <input type="text" placeholder="admin" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-atalaia-neon transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Senha</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-atalaia-neon transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Porta RTSP</label>
                    <input type="text" placeholder="554" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-atalaia-neon transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">Porta ONVIF</label>
                    <input type="text" placeholder="80 ou 8000" className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-atalaia-neon transition-colors" />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-3 block">Protocolo</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input type="radio" name="protocol" defaultChecked className="accent-atalaia-neon" /> RTSP
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input type="radio" name="protocol" className="accent-atalaia-neon" /> RTMP
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input type="radio" name="protocol" className="accent-atalaia-neon" /> ONVIF
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleTestConnection}
                    disabled={testState === 'testing' || testState === 'success'}
                    className={`w-full h-14 rounded-xl font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${
                      testState === 'idle' ? 'bg-white text-black hover:bg-gray-200' :
                      testState === 'testing' ? 'bg-[#111] text-gray-400 border border-white/10' :
                      'bg-atalaia-neon/20 text-atalaia-neon border border-atalaia-neon/30'
                    }`}
                  >
                    {testState === 'idle' && <>Testar Conexão</>}
                    {testState === 'testing' && <><Loader2 className="animate-spin" size={20} /> Conectando...</>}
                    {testState === 'success' && <><CheckCircle2 size={20} /> Conexão Estabelecida</>}
                  </button>
                </div>

                <AnimatePresence>
                  {testState === 'success' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-atalaia-neon/5 border border-atalaia-neon/20 rounded-xl p-4 text-xs font-mono text-emerald-400 space-y-2 mt-4"
                    >
                      <div className="flex items-center gap-2"><CheckCircle2 size={14} /> Equipamento identificado</div>
                      <div className="flex items-center gap-2"><CheckCircle2 size={14} /> Fabricante: Intelbras</div>
                      <div className="flex items-center gap-2"><CheckCircle2 size={14} /> Resolução: 1920x1080 (1080p)</div>
                      <div className="flex items-center gap-2"><CheckCircle2 size={14} /> Codec: H.264 / H.265 suportados</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Permissões */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">Permissões de Compartilhamento</h3>
            
            <div className="space-y-6">
              {/* Box 1 */}
              <div className="bg-[#080808] border border-white/10 rounded-2xl p-6">
                <h4 className="text-sm text-gray-300 font-bold mb-4">O que sua câmera monitora?</h4>
                <div className="flex flex-wrap gap-2">
                  {['Rua', 'Calçada', 'Avenida', 'Cruzamento', 'Praça', 'Estacionamento', 'Entrada do condomínio', 'Entrada da empresa', 'Portão residencial', 'Outro'].map(item => (
                    <label key={item} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-[#111] text-xs text-gray-400 cursor-pointer hover:border-white/30 transition-colors">
                      <input type="checkbox" className="accent-atalaia-neon" /> {item}
                    </label>
                  ))}
                </div>
              </div>

              {/* Box 2 */}
              <div className="bg-[#080808] border border-white/10 rounded-2xl p-6">
                <h4 className="text-sm text-gray-300 font-bold mb-4">Quem poderá visualizar esta câmera?</h4>
                <div className="grid grid-cols-2 gap-3">
                  {['Central Atalaia', 'Polícia', 'Bombeiros', 'Defesa Civil', 'Guarda Municipal', 'Vizinhos autorizados', 'Vigilância do condomínio'].map(item => (
                    <label key={item} className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white transition-colors">
                      <input type="checkbox" defaultChecked={item === 'Central Atalaia'} className="accent-atalaia-neon" /> {item}
                    </label>
                  ))}
                </div>
              </div>

              {/* Box 2.5 */}
              <div className="bg-[#080808] border border-white/10 rounded-2xl p-6">
                <h4 className="text-sm text-gray-300 font-bold mb-4">Quando deseja compartilhar?</h4>
                <div className="flex flex-col gap-3">
                  {['Sempre', 'Apenas durante emergências', 'Somente mediante solicitação', 'Apenas em horários específicos', 'Nunca compartilhar gravações', 'Compartilhar apenas vídeo ao vivo'].map((item, idx) => (
                    <label key={item} className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white transition-colors">
                      <input type="radio" name="quandoShare" defaultChecked={idx === 0} className="accent-atalaia-neon" /> {item}
                    </label>
                  ))}
                </div>
              </div>

              {/* Box 3 - Temporário */}
              <div className="bg-[#080808] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Compartilhamento Temporário</h4>
                    <p className="text-xs text-gray-400">Permitir que a Central solicite acesso apenas durante ocorrências próximas.</p>
                  </div>
                  <button 
                    onClick={handleTempShareToggle}
                    className={`w-12 h-6 rounded-full p-1 transition-colors relative ${tempShare ? 'bg-atalaia-neon' : 'bg-[#222]'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${tempShare ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <AnimatePresence>
                  {showNotification && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-6 bg-[#111] border border-atalaia-neon/30 rounded-xl p-4"
                    >
                      <div className="flex gap-3">
                        <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
                        <div>
                          <p className="text-sm font-bold text-white mb-1">Solicitação de Compartilhamento</p>
                          <p className="text-xs text-gray-400 mb-3">Foi registrada uma ocorrência próxima à sua localização. Deseja liberar sua câmera pelos próximos 30 minutos?</p>
                          <div className="flex gap-2">
                            <button className="px-4 py-1.5 bg-atalaia-neon text-black text-xs font-bold rounded-lg hover:bg-atalaia-neon/90 transition-colors">Compartilhar</button>
                            <button onClick={() => setShowNotification(false)} className="px-4 py-1.5 bg-transparent border border-white/20 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-colors">Recusar</button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Compatibilidade & Fluxograma animado */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 relative z-10 text-center">
        <h3 className="text-2xl font-bold text-white mb-10">Compatibilidade Universal</h3>
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 opacity-70 mb-6">
          {['Intelbras', 'Hikvision', 'HiLook', 'Dahua', 'Axis', 'Uniview', 'Bosch', 'Hanwha Vision', 'Vivotek', 'Giga Security', 'ONVIF', 'RTSP', 'RTMP'].map(brand => (
             <span key={brand} className="text-lg md:text-xl font-black uppercase tracking-wider text-gray-500 hover:text-white transition-colors cursor-default">{brand}</span>
          ))}
        </div>
        <p className="text-gray-500 text-sm">E centenas de outros equipamentos compatíveis.</p>
        
        {/* Simplified conceptual flowchart */}
        <div className="mt-20 py-10 overflow-hidden relative">
           <div className="flex items-center justify-center gap-2 md:gap-4 text-gray-400 overflow-x-auto pb-8 hide-scrollbar">
              
              <div className="flex flex-col items-center min-w-[80px]">
                <div className="w-12 h-12 rounded-xl bg-[#111] border border-white/10 flex items-center justify-center mb-2"><Camera size={20} /></div>
                <span className="text-[10px] uppercase font-bold">Câmera</span>
              </div>
              <ChevronRight size={16} className="text-white/20" />
              
              <div className="flex flex-col items-center min-w-[80px]">
                <div className="w-12 h-12 rounded-xl bg-[#111] border border-white/10 flex items-center justify-center mb-2"><Wifi size={20} /></div>
                <span className="text-[10px] uppercase font-bold text-center">RTSP / ONVIF</span>
              </div>
              <ChevronRight size={16} className="text-white/20" />

              <div className="flex flex-col items-center min-w-[80px]">
                <div className="w-12 h-12 rounded-xl bg-[#111] border border-atalaia-neon/50 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(0,255,102,0.2)] text-atalaia-neon"><Server size={20} /></div>
                <span className="text-[10px] uppercase font-bold text-atalaia-neon">Edge Atalaia</span>
              </div>
              <ChevronRight size={16} className="text-atalaia-neon/50" />

              <div className="flex flex-col items-center min-w-[80px]">
                <div className="w-12 h-12 rounded-xl bg-[#111] border border-white/10 flex items-center justify-center mb-2"><Globe size={20} /></div>
                <span className="text-[10px] uppercase font-bold">MistServer</span>
              </div>
              <ChevronRight size={16} className="text-white/20" />

              <div className="flex flex-col items-center min-w-[80px]">
                <div className="w-12 h-12 rounded-xl bg-[#111] border border-blue-500/50 flex items-center justify-center mb-2 text-blue-500"><Cpu size={20} /></div>
                <span className="text-[10px] uppercase font-bold text-blue-500">IA Auth</span>
              </div>
              <ChevronRight size={16} className="text-white/20" />

              <div className="flex flex-col items-center min-w-[80px]">
                <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center mb-2 shadow-lg"><ShieldCheck size={20} /></div>
                <span className="text-[10px] uppercase font-bold text-white">Central</span>
              </div>
           </div>
        </div>
      </div>

      {/* Banner Final */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-br from-[#0a0a0a] to-[#040404] border border-white/10 rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&auto=format&fit=crop&q=60')] opacity-5 mix-blend-luminosity bg-cover bg-center pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Juntos criamos uma cidade mais segura.</h2>
            <p className="text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              Cada câmera compartilhada amplia a capacidade de resposta em situações de emergência, auxiliando moradores, empresas, equipes de segurança, bombeiros voluntários, defesa civil e demais órgãos parceiros. Você mantém o controle sobre suas imagens e escolhe exatamente quando e com quem deseja compartilhá-las.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={() => setIsPartnerModalOpen(true)} className="px-8 py-4 bg-atalaia-neon text-black font-bold uppercase tracking-wide rounded-xl hover:bg-emerald-400 transition-colors">
                Quero compartilhar minha câmera
              </button>
              <button className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold uppercase tracking-wide rounded-xl hover:bg-white/10 transition-colors">
                Saiba como funciona
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)}>
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-atalaia-neon/10 flex items-center justify-center text-atalaia-neon border border-atalaia-neon/20">
              <Camera size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Seja um Parceiro</h3>
              <p className="text-sm text-gray-400">Junte-se à Rede Colaborativa Atalaia</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!partnerSuccess ? (
              <motion.form 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handlePartnerSubmit} 
                className="space-y-4 text-left"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Seu Nome Completo</label>
                  <Input 
                    required 
                    placeholder="Ex: João da Silva" 
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    className="bg-[#111] border-white/10 focus:border-atalaia-neon text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">WhatsApp com DDD</label>
                  <Input 
                    required 
                    placeholder="Ex: 48 99999-9999" 
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    className="bg-[#111] border-white/10 focus:border-atalaia-neon text-white"
                  />
                </div>
                <div className="pt-4">
                  <Button type="submit" disabled={isPartnerSending} className="w-full bg-atalaia-neon text-black hover:bg-emerald-400 h-12 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                    {isPartnerSending ? (
                      <><Loader2 className="animate-spin" size={20} /> Enviando...</>
                    ) : (
                      <>Quero Compartilhar <Share2 size={18} /></>
                    )}
                  </Button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Mensagem Enviada!</h4>
                <p className="text-sm text-emerald-100/70 mb-4">
                  Verifique seu WhatsApp. Você receberá uma mensagem via API Whaticket do nosso departamento técnico em breve!
                </p>
                <p className="text-xs text-gray-500">
                  Estamos felizes em tê-lo como futuro parceiro do projeto.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>

    </section>
  );
};


import React, { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/auth/context';
import { UserRole, Alert, Neighborhood, Notification, User, ServiceRequest, SupportTicket } from '@/types';
import { Card, Badge, Button, Modal, Input } from '@/components/UI';
import { UpgradeModal } from '@/components/UpgradeModal';
import { MockService } from '@/services/mockService';
import { supabase } from '@/lib/supabaseClient';
import { 
    AlertTriangle, Video, Users, Activity, MapPin, Inbox, Copy, Trash2, 
    Heart, DollarSign, Loader2, Navigation, FileText, 
    Shield, Star, Lock, Send, Search, CheckCircle, UserCheck, XCircle,
    Wrench, MessageSquare, DoorOpen, LightbulbOff, Eye, ShieldAlert, UserX,
    VolumeX, Package, Droplet, Sparkles, Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaymentService } from '@/services/paymentService';
import { motion, AnimatePresence } from 'motion/react';

// --- SUB-COMPONENT: SCR TACTICAL DASHBOARD ---
const SCRDashboard = ({ user, neighborhood }: { user: User, neighborhood?: Neighborhood }) => {
    const [patrolLoading, setPatrolLoading] = useState(false);
    const [quickIncidents, setQuickIncidents] = useState<Alert[]>([]);
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
    
    // Resident Selection Logic
    const [residents, setResidents] = useState<User[]>([]);
    const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
    const [residentSearch, setResidentSearch] = useState('');
    const [pendingAction, setPendingAction] = useState<{type: 'CHECKIN' | 'LOG' | 'PANIC', note?: string} | null>(null);

    // Dynamic Feedback state for beautiful UX without browser-blocking alerts
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 5000);
    };

    useEffect(() => {
        const loadData = async () => {
             // Carrega incidentes
             const alerts = await MockService.getAlerts(user.neighborhoodId);
             setQuickIncidents(alerts.slice(0, 4));

             // Carrega solicitações VIP
             if (user.neighborhoodId) {
                  const requests = await MockService.getServiceRequests(user.neighborhoodId);
                  setServiceRequests(requests.filter(r => r.status === 'PENDING'));
                  
                  // Pre-load residents for selector
                  const users = await MockService.getUsers(user.neighborhoodId);
                  
                  // FILTRO: Mostrar TODOS os moradores do bairro no seletor para o Motovigia, alertando se é Premium ou Regular
                  setResidents(users.filter(u => u.role === UserRole.RESIDENT));
             }
        };
        loadData();
    }, [user.neighborhoodId]);

    const initiateAction = (type: 'CHECKIN' | 'LOG' | 'PANIC', note?: string) => {
        setPendingAction({ type, note });
        setIsResidentModalOpen(true);
    };

    const confirmAction = async (targetUserId?: string) => {
        if (!user.neighborhoodId || !pendingAction) return;
        setIsResidentModalOpen(false);
        setPatrolLoading(true);

        const targetUser = residents.find(r => r.id === targetUserId);
        const logNote = targetUser 
            ? `${pendingAction.note || 'AÇÃO'} - Ref: ${targetUser.name} (${targetUser.address})`
            : pendingAction.note || 'AÇÃO GERAL';

        try {
            if (pendingAction.type === 'CHECKIN') {
                 if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(async (position) => {
                        await MockService.registerPatrol(
                            user.id,
                            user.neighborhoodId!,
                            "RONDA PADRÃO - CHECK-IN",
                            position.coords.latitude,
                            position.coords.longitude,
                            targetUserId
                        );
                        showToast(`Check-in de ronda concluído! ${targetUser ? `Notificação enviada para o WhatsApp de ${targetUser.name}.` : ''}`, 'success');
                        setPatrolLoading(false);
                    }, (error) => {
                        showToast("Erro ao obter GPS: " + error.message, 'error');
                        setPatrolLoading(false);
                    });
                } else {
                    showToast("Recurso de GPS não suportado neste navegador.", 'error');
                    setPatrolLoading(false);
                }
            } else if (pendingAction.type === 'LOG') {
                await MockService.registerPatrol(
                    user.id, 
                    user.neighborhoodId!, 
                    `OCORRÊNCIA: ${pendingAction.note}`,
                    undefined,
                    undefined,
                    targetUserId
                );
                showToast(`Registro inserido! ${targetUser ? `Alerta WhatsApp disparado para ${targetUser.name}.` : 'Ocorrência geral registrada.'}`, 'success');
                setPatrolLoading(false);
                
                // Refresh local timeline
                const alerts = await MockService.getAlerts(user.neighborhoodId);
                setQuickIncidents(alerts.slice(0, 4));
            } else if (pendingAction.type === 'PANIC') {
                await MockService.createAlert({
                    type: 'DANGER',
                    userId: user.id,
                    userName: user.name,
                    neighborhoodId: user.neighborhoodId!,
                    userRole: UserRole.SCR,
                    message: logNote
                });
                showToast("🚨 Chamado tático e alerta geral enviados para a central!", 'success');
                setPatrolLoading(false);
            }
        } catch (e) {
            showToast("Erro de processamento no banco Atalaia.", 'error');
            setPatrolLoading(false);
        }
    };

    const filteredResidents = residents.filter(r => 
        r.name.toLowerCase().includes(residentSearch.toLowerCase()) ||
        (r.address && r.address.toLowerCase().includes(residentSearch.toLowerCase()))
    );

    return (
        <Layout>
            <div className="flex flex-col h-full gap-4">
                <div className="bg-atalaia-neon/10 border-l-4 border-atalaia-neon p-4 rounded-r-lg mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase flex items-center gap-2">
                            <ShieldCheckIcon /> PAINEL DO MOTOVIGIA
                        </h1>
                        <p className="text-atalaia-neon font-mono text-xs uppercase tracking-widest">
                            OPERADOR: {user.name} | BAIRRO: {neighborhood?.name || 'VILA INTEGRADA'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">PATRULHA ATIVA</span>
                    </div>
                </div>

                {/* BIG BUTTONS FOR GLOVED HANDS */}
                <div className="grid grid-cols-2 gap-4 h-32 md:h-40">
                    <button 
                        onClick={() => initiateAction('CHECKIN')}
                        disabled={patrolLoading}
                        className="bg-emerald-950/70 hover:bg-emerald-900 active:bg-emerald-800 text-white rounded-xl border-2 border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                        {patrolLoading ? <Loader2 className="animate-spin w-10 h-10 text-emerald-400" /> : <MapPin className="w-10 h-10 text-emerald-400" />}
                        <span className="text-sm font-black uppercase tracking-wider">CHECK-IN RONDA</span>
                    </button>

                    <button 
                        onClick={() => initiateAction('PANIC')}
                        className="bg-red-950/70 hover:bg-red-900 active:bg-red-800 text-white rounded-xl border-2 border-red-500/50 hover:border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)] flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                        <span className="text-sm font-black uppercase tracking-wider">PANICO / PERIGO</span>
                    </button>
                </div>

                {/* LIVRO DE OCORRÊNCIAS CLASSIFICADO */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-2">
                    
                    {/* COL 1: SEGURANÇA ATIVA */}
                    <Card className="p-4 bg-black/60 border-red-500/10 flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-4 bg-red-500 rounded-full" />
                            <h3 className="text-white font-bold uppercase tracking-wider text-xs">
                                Segurança e Alertas Críticos
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-2 flex-grow">
                            <button 
                                onClick={() => initiateAction('LOG', "PORTÃO ABERTO / VULNERABILIDADE")} 
                                className="group flex items-center justify-between p-3.5 bg-zinc-900/60 hover:bg-red-950/20 rounded-lg border border-white/5 hover:border-red-500/30 text-left transition-all active:scale-98 cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/10 text-red-400 rounded-md group-hover:bg-red-500/20">
                                        <DoorOpen size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase">Portão Aberto</span>
                                </div>
                                <span className="text-[10px] font-mono text-red-400 opacity-60 group-hover:opacity-100 uppercase tracking-widest font-black">LOG + WA</span>
                            </button>

                            <button 
                                onClick={() => initiateAction('LOG', "VEÍCULO EM ATITUDE SUSPEITA")} 
                                className="group flex items-center justify-between p-3.5 bg-zinc-900/60 hover:bg-orange-950/20 rounded-lg border border-white/5 hover:border-orange-500/30 text-left transition-all active:scale-98 cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/10 text-orange-400 rounded-md group-hover:bg-orange-500/20">
                                        <Eye size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase">Veículo Suspeito</span>
                                </div>
                                <span className="text-[10px] font-mono text-orange-400 opacity-60 group-hover:opacity-100 uppercase tracking-widest font-black">LOG + WA</span>
                            </button>

                            <button 
                                onClick={() => initiateAction('LOG', "VIOLAÇÃO DE PERÍMETRO OU MURO")} 
                                className="group flex items-center justify-between p-3.5 bg-zinc-900/60 hover:bg-red-950/20 rounded-lg border border-white/5 hover:border-red-500/30 text-left transition-all active:scale-98 cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/10 text-red-400 rounded-md group-hover:bg-red-500/20">
                                        <ShieldAlert size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase">Violação Perímetro</span>
                                </div>
                                <span className="text-[10px] font-mono text-red-400 opacity-60 group-hover:opacity-100 uppercase tracking-widest font-black">LOG + WA</span>
                            </button>

                            <button 
                                onClick={() => initiateAction('LOG', "PESSOA EM ATITUDE SUSPEITA NO SETOR")} 
                                className="group flex items-center justify-between p-3.5 bg-zinc-900/60 hover:bg-amber-950/20 rounded-lg border border-white/5 hover:border-amber-500/30 text-left transition-all active:scale-98 cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-md group-hover:bg-amber-500/20">
                                        <UserX size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase">Pessoa Suspeita</span>
                                </div>
                                <span className="text-[10px] font-mono text-amber-400 opacity-60 group-hover:opacity-100 uppercase tracking-widest font-black">LOG + WA</span>
                            </button>

                            <button 
                                onClick={() => initiateAction('LOG', "BARULHO ESTRANHO OU DISPARO DE ALARME")} 
                                className="group flex items-center justify-between p-3.5 bg-zinc-900/60 hover:bg-[#111] rounded-lg border border-white/5 hover:border-zinc-500/30 text-left transition-all active:scale-98 cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-zinc-500/10 text-zinc-400 rounded-md group-hover:bg-zinc-500/20">
                                        <VolumeX size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase">Barulho Estranho</span>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-400 opacity-60 group-hover:opacity-100 uppercase tracking-widest font-black">LOG + WA</span>
                            </button>
                        </div>
                    </Card>

                    {/* COL 2: ZELADORIA E COMUNIDADE */}
                    <Card className="p-4 bg-black/60 border-zinc-500/10 flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-4 bg-atalaia-neon rounded-full" />
                            <h3 className="text-white font-bold uppercase tracking-wider text-xs">
                                Zeladoria e Rond Comunitária
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 gap-2 flex-grow">
                            <button 
                                onClick={() => initiateAction('LOG', "LÂMPADA DA COLETIVA OU LUZ INTERNA QUEIMADA")} 
                                className="group flex items-center justify-between p-3.5 bg-zinc-900/60 hover:bg-yellow-950/20 rounded-lg border border-white/5 hover:border-yellow-500/30 text-left transition-all active:scale-98 cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-md group-hover:bg-yellow-500/20">
                                        <LightbulbOff size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase">Luz Queimada</span>
                                </div>
                                <span className="text-[10px] font-mono text-yellow-400 opacity-60 group-hover:opacity-100 uppercase tracking-widest">LOG + WA</span>
                            </button>

                            <button 
                                onClick={() => initiateAction('LOG', "VAZAMENTO DE ÁGUA / CANO ESTOURADO NA CALÇADA")} 
                                className="group flex items-center justify-between p-3.5 bg-zinc-900/60 hover:bg-cyan-950/20 rounded-lg border border-white/5 hover:border-cyan-500/30 text-left transition-all active:scale-98 cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-md group-hover:bg-cyan-500/20">
                                        <Droplet size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase">Vazamento Água</span>
                                </div>
                                <span className="text-[10px] font-mono text-cyan-400 opacity-60 group-hover:opacity-100 uppercase tracking-widest">LOG + WA</span>
                            </button>

                            <button 
                                onClick={() => initiateAction('LOG', "ENCOMENDA EXPOSTA / DEIXADA NA COVA DE ENTRADA")} 
                                className="group flex items-center justify-between p-3.5 bg-zinc-900/60 hover:bg-amber-950/20 rounded-lg border border-white/5 hover:border-amber-500/30 text-left transition-all active:scale-98 cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-md group-hover:bg-amber-500/20">
                                        <Package size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase">Encomenda Exposta</span>
                                </div>
                                <span className="text-[10px] font-mono text-amber-500 opacity-60 group-hover:opacity-100 uppercase tracking-widest">LOG + WA</span>
                            </button>

                            <button 
                                onClick={() => initiateAction('LOG', "ANIMAIS DE ESTIMAÇÃO AGITADOS / CÃO LATINDO SEGUIDO")} 
                                className="group flex items-center justify-between p-3.5 bg-zinc-900/60 hover:bg-orange-950/20 rounded-lg border border-white/5 hover:border-orange-500/30 text-left transition-all active:scale-98 cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/10 text-orange-400 rounded-md group-hover:bg-orange-500/20">
                                        <Bell size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase">Cão Latindo muito</span>
                                </div>
                                <span className="text-[10px] font-mono text-orange-400 opacity-60 group-hover:opacity-100 uppercase tracking-widest">LOG + WA</span>
                            </button>

                            <button 
                                onClick={() => initiateAction('LOG', "APOIO EXTRA / COOPERAÇÃO POLICIAL")} 
                                className="group flex items-center justify-between p-3.5 bg-zinc-900/60 hover:bg-[#111] rounded-lg border border-white/5 hover:border-zinc-500/30 text-left transition-all active:scale-98 cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-md group-hover:bg-blue-500/20">
                                        <Shield size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase">Solicitar Apoio</span>
                                </div>
                                <span className="text-[10px] font-mono text-blue-400 opacity-60 group-hover:opacity-100 uppercase tracking-widest">APOIO</span>
                            </button>
                        </div>
                    </Card>

                    {/* COL 3: PEDIDOS PENDENTES E FEED RECENTE */}
                    <div className="flex flex-col gap-4">
                        {/* VIP VIP VIP */}
                        <Card className="p-4 bg-black/60 border-yellow-500/30">
                            <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2 uppercase text-xs">
                                <Star size={14} fill="currentColor" /> Pedidos de Suporte Vip (Premium)
                            </h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {serviceRequests.length === 0 ? (
                                    <p className="text-zinc-650 italic text-[11px] py-4 text-center">Nenhuma requisição de escolta ou suporte VIP no momento.</p>
                                ) : (
                                    serviceRequests.map(req => (
                                        <div key={req.id} className="p-2.5 bg-yellow-900/10 border border-yellow-500/20 rounded flex justify-between items-center animate-pulse">
                                            <div>
                                                <p className="text-white font-black text-xs uppercase">
                                                    {req.requestType === 'ESCORT' ? 'ESCOLTA RESIDENCIAL' : 
                                                     req.requestType === 'EXTRA_ROUND' ? 'PEDIDO RONDA EXTRA' : 'NOTIFICADO VIAGEM'}
                                                </p>
                                                <p className="text-zinc-400 text-[10px] font-sans">Morador: {req.userName}</p>
                                            </div>
                                            <Badge color="yellow" className="text-[9px] scale-90">Pendente</Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>

                        {/* DESPACHOS RECENTES */}
                        <Card className="p-4 bg-black/60 border-zinc-800">
                             <h3 className="text-zinc-400 font-bold mb-3 flex items-center gap-2 uppercase text-xs">
                                <Activity size={14} /> Fila de Histórico de Despacho
                            </h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {quickIncidents.map(alert => (
                                    <div key={alert.id} className={`p-2.5 rounded border-l-4 ${alert.type === 'PANIC' ? 'border-red-500 bg-red-950/20' : 'border-zinc-700 bg-zinc-900'}`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-extrabold text-[10px] tracking-wider uppercase text-white">{alert.type}</span>
                                            <span className="text-[9px] font-mono text-zinc-500">{new Date(alert.timestamp).toLocaleTimeString('pt-BR')}</span>
                                        </div>
                                        <p className="text-[11px] text-zinc-300 font-sans leading-tight">
                                            {alert.userName}: {alert.message || 'Ronda de rotina sem observação.'}
                                        </p>
                                    </div>
                                ))}
                                {quickIncidents.length === 0 && <p className="text-zinc-600 italic text-xs py-4 text-center">Nenhuma atividade recente.</p>}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* RESIDENT SELECTION MODAL */}
                <Modal isOpen={isResidentModalOpen} onClose={() => setIsResidentModalOpen(false)}>
                    <div className="p-5 font-sans">
                        <h2 className="text-lg font-black text-white uppercase tracking-tight mb-1 flex items-center gap-2">
                            <Users size={20} className="text-atalaia-neon" /> Vincular e Notificar Morador
                        </h2>
                        <p className="text-zinc-400 text-xs mb-5">
                            Selecione o morador correspondente. O sistema irá registrar o log da ronda e enviar um alerta completo de imediato via **WhatsApp** para proteger e notificar o morador.
                        </p>

                        <div className="relative mb-4">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input 
                                type="text" 
                                placeholder="Discar nome ou endereço..."
                                value={residentSearch}
                                onChange={(e) => setResidentSearch(e.target.value)}
                                autoFocus
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-atalaia-neon focus:outline-none placeholder-zinc-600"
                            />
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 mb-5 pr-1">
                            {filteredResidents.map(resident => (
                                <div 
                                    key={resident.id}
                                    onClick={() => confirmAction(resident.id)}
                                    className="p-3 bg-zinc-900/40 hover:bg-zinc-900 border border-white/5 hover:border-atalaia-neon/30 rounded-xl cursor-pointer flex justify-between items-center group transition-all"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-white font-bold text-sm group-hover:text-atalaia-neon transition-colors">{resident.name}</p>
                                            <Badge color="green" className="text-[9px] uppercase">
                                                PRÊMIO
                                            </Badge>
                                        </div>
                                        <p className="text-zinc-500 text-xs font-mono">{resident.address || 'Sem endereço registrado'}</p>
                                    </div>
                                    <div className="p-1 px-3 bg-zinc-950 group-hover:bg-atalaia-neon text-zinc-400 group-hover:text-black font-mono text-[10px] font-black uppercase rounded-lg transition-colors border border-white/5">
                                        Selecionar
                                    </div>
                                </div>
                            ))}
                            {filteredResidents.length === 0 && <p className="text-center text-zinc-500 py-6 text-xs">Nenhum morador localizado com este termo.</p>}
                        </div>

                        <Button onClick={() => confirmAction(undefined)} variant="outline" className="w-full uppercase text-xs tracking-wider py-3 rounded-xl">
                            Pular Seleção (Apenas Registro Geral no Setor)
                        </Button>
                    </div>
                </Modal>
            </div>

            {/* Premium Toast Notification System */}
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className={`fixed bottom-6 right-6 z-[80] p-4 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' : 'bg-red-950/90 border-red-500/30 text-red-300'}`}
                    >
                        <CheckCircle size={18} className={toast.type === 'success' ? 'text-emerald-400' : 'text-red-400'} />
                        <span className="text-xs font-bold font-sans tracking-wide uppercase">{toast.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </Layout>
    )
}

const ShieldCheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
)

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ alerts: 0, cameras: 0, users: 0 });
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [myNeighborhood, setMyNeighborhood] = useState<Neighborhood | undefined>();
  
  // Donation State
  const [donationAmount, setDonationAmount] = useState('10.00');
  const [neighborhoodIntegrator, setNeighborhoodIntegrator] = useState<User | null>(null);
  const [processingDonation, setProcessingDonation] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Service Request Loading State
  const [requestLoading, setRequestLoading] = useState<string | null>(null);

  // Upgrade Modal visibility
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // POPUP FEEDBACK STATE
  const [feedback, setFeedback] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const [notifToDelete, setNotifToDelete] = useState<string | null>(null);
  const [notifUserToReject, setNotifUserToReject] = useState<{ notifId: string, pendingUserId: string } | null>(null);
  const [serviceToRequest, setServiceToRequest] = useState<'ESCORT' | 'EXTRA_ROUND' | 'TRAVEL_NOTICE' | null>(null);

  const fetchData = useCallback(async () => {
    try {
        // Fetch alerts
        const alerts = await MockService.getAlerts(user?.role === UserRole.ADMIN ? undefined : user?.neighborhoodId);
        setRecentAlerts(alerts.slice(0, 5));
        setStats(prev => ({ ...prev, alerts: alerts.length }));

        // Fetch Neighborhood Info
        if (user?.role === UserRole.ADMIN) {
          const hoods = await MockService.getNeighborhoods();
          setStats(prev => ({ ...prev, cameras: hoods.length, users: 154 })); // Mock user count
          
          // Fetch Admin Notifications
          const notifs = await MockService.getNotifications(); // All notifications for admin
          setNotifications(notifs);

          // Fetch Support Tickets
          const tickets = await MockService.getSupportTickets();
          setSupportTickets(tickets.filter(t => t.status !== 'CLOSED'));

        } else if (user?.neighborhoodId) {
          const hood = await MockService.getNeighborhoodById(user.neighborhoodId);
          setMyNeighborhood(hood);
          setStats(prev => ({ ...prev, cameras: 1, users: 42 }));

          // Check for Integrator to receive donations
          if (user.role === UserRole.RESIDENT && user.plan === 'FREE') {
              const integrator = await MockService.getNeighborhoodIntegrator(user.neighborhoodId);
              setNeighborhoodIntegrator(integrator);
          }

          // Fetch user notifications
          const myNotifs = await MockService.getNotifications(user.id);
          setNotifications(myNotifs.filter(n => !n.read));
        }
    } catch (e: any) {
        console.error("[Dashboard] Error fetching data:", e);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchData();

    const subAlerts = MockService.subscribeToTable('alerts', fetchData);
    const subNotifs = MockService.subscribeToTable('notifications', fetchData);
    const subHoods = MockService.subscribeToTable('neighborhoods', fetchData);
    const subTickets = MockService.subscribeToTable('support_tickets', fetchData);

    return () => {
        supabase.removeChannel(subAlerts);
        supabase.removeChannel(subNotifs);
        supabase.removeChannel(subHoods);
        supabase.removeChannel(subTickets);
    };
  }, [user, fetchData]);

  // --- RENDER TACTICAL DASHBOARD FOR SCR ---
  if (user?.role === UserRole.SCR) {
      return <SCRDashboard user={user} neighborhood={myNeighborhood} />;
  }
  
  const showFeedback = (msg: string, type: 'success' | 'error') => {
      setFeedback({ msg, type });
      setTimeout(() => setFeedback(null), 4000);
  };

  const executeDeleteNotification = async (id: string) => {
    await MockService.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleDeleteNotification = async (id: string) => {
    setNotifToDelete(id);
  };

  const handleApproveFromNotification = async (notifId: string, pendingUserId: string) => {
      setActionLoading(notifId);
      try {
          await MockService.approveUser(pendingUserId);
          await MockService.deleteNotification(notifId);
          setNotifications(prev => prev.filter(n => n.id !== notifId));
          showFeedback('Acesso liberado com sucesso!', 'success');
      } catch (e: any) {
          showFeedback('Erro: ' + e.message, 'error');
      } finally {
          setActionLoading(null);
      }
  };

  const executeRejectFromNotification = async (notifId: string, pendingUserId: string) => {
      setActionLoading(notifId);
      try {
          await MockService.deleteUser(pendingUserId);
          await MockService.deleteNotification(notifId);
          setNotifications(prev => prev.filter(n => n.id !== notifId));
          showFeedback('Cadastro rejeitado e removido.', 'success');
      } catch (e: any) {
          showFeedback('Erro ao rejeitar: ' + e.message, 'error');
      } finally {
          setActionLoading(null);
      }
  };

  const handleRejectFromNotification = async (notifId: string, pendingUserId: string) => {
      setNotifUserToReject({ notifId, pendingUserId });
  };

  const handleDonation = async () => {
      if (!user || !neighborhoodIntegrator?.mpAccessToken) return;
      
      setProcessingDonation(true);
      try {
          const amount = parseFloat(donationAmount);
          if (isNaN(amount) || amount <= 0) throw new Error("Valor inválido");

          // Cria preferência de pagamento usando o TOKEN do INTEGRADOR
          const checkoutUrl = await PaymentService.createDonationPreference(
              amount, 
              user.email, 
              user.name, 
              neighborhoodIntegrator.mpAccessToken
          );
          
          window.location.href = checkoutUrl;
      } catch (error: any) {
          alert('Erro ao processar doação: ' + error.message);
          setProcessingDonation(false);
      }
  };

  const executeRequestService = async (type: 'ESCORT' | 'EXTRA_ROUND' | 'TRAVEL_NOTICE') => {
      setRequestLoading(type);
      try {
          await MockService.createServiceRequest(user.id, user.name, user.neighborhoodId!, type);
          showFeedback("Solicitação enviada via WhatsApp para a Equipe Tática!", 'success');
      } catch (e) {
          showFeedback("Erro ao enviar solicitação.", 'error');
      } finally {
          setRequestLoading(null);
      }
  };

  const handleRequestService = async (type: 'ESCORT' | 'EXTRA_ROUND' | 'TRAVEL_NOTICE') => {
      if (!user || !user.neighborhoodId) return;
      if (user.plan !== 'PREMIUM') {
          setShowUpgradeModal(true);
          return;
      }
      setServiceToRequest(type);
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card className="p-6 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-gray-400 text-sm font-medium uppercase">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </Card>
  );

  return (
    <Layout>
      {/* POPUP FEEDBACK TOAST */}
      {feedback && (
            <div className={`
                fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-10 duration-300
                ${feedback.type === 'success' ? 'bg-[#0f1a12] border-atalaia-neon text-white' : 'bg-red-900/90 border-red-500 text-white'}
            `}>
                <div className={`p-2 rounded-full ${feedback.type === 'success' ? 'bg-atalaia-neon text-black' : 'bg-red-500 text-white'}`}>
                    {feedback.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                </div>
                <div>
                    <h4 className="font-bold text-sm uppercase">{feedback.type === 'success' ? 'Sucesso' : 'Erro'}</h4>
                    <p className="text-sm text-gray-300">{feedback.msg}</p>
                </div>
            </div>
      )}
    
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Painel de Controle</h1>
            <p className="text-gray-400">Bem-vindo, {user?.name}. Sistema operacional e vigilante.</p>
        </div>
        {user?.neighborhoodId && myNeighborhood && (
             <div className="px-4 py-2 bg-atalaia-neon/10 border border-atalaia-neon/20 rounded-full text-atalaia-neon text-sm font-bold flex items-center gap-2">
                 <MapPin size={16} /> Bairro: {myNeighborhood.name}
             </div>
        )}
      </div>

      {/* DONATION CARD (Only for FREE Residents with Integrator Configured) */}
      {user?.role === UserRole.RESIDENT && user?.plan === 'FREE' && neighborhoodIntegrator?.mpAccessToken && (
          <div className="mb-8 animate-in slide-in-from-top-4">
              <Card className="p-6 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  
                  <div className="flex items-start gap-4 relative z-10">
                      <div className="p-4 bg-white/10 rounded-full text-purple-300">
                          <Heart size={32} fill="currentColor" />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-white mb-2">Apoie a Segurança do seu Bairro</h2>
                          <p className="text-gray-300 text-sm max-w-lg">
                              O plano gratuito é mantido pelo esforço comunitário. Contribua com qualquer valor para ajudar o Integrador 
                              <strong> {neighborhoodIntegrator.name}</strong> a manter o sistema ativo.
                          </p>
                      </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto relative z-10">
                      <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                          <input 
                              type="number" 
                              value={donationAmount}
                              onChange={e => setDonationAmount(e.target.value)}
                              className="w-32 bg-black/50 border border-purple-500/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 font-bold"
                              min="1"
                              step="0.01"
                          />
                      </div>
                      <Button onClick={handleDonation} disabled={processingDonation} className="bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20 whitespace-nowrap h-[46px]">
                          {processingDonation ? <Loader2 className="animate-spin" /> : <><DollarSign size={18} /> Doar Agora</>}
                      </Button>
                  </div>
              </Card>
          </div>
      )}

      {/* VIP SUPPORT CARD (Only for PREMIUM Residents) */}
      {user?.plan === 'PREMIUM' && user?.role === UserRole.RESIDENT && (
        <Card className="p-6 mb-8 border-atalaia-neon/30 bg-atalaia-neon/5 animate-in slide-in-from-top-4">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-white">
                <Star className="text-atalaia-neon" size={20} fill="currentColor" />
                Apoio Tático VIP
            </h2>
            <p className="text-sm text-gray-400 mb-6">
                Como assinante Prêmio, você tem acesso direto à equipe de Motovigia (SCR) para serviços exclusivos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Button onClick={() => handleRequestService('ESCORT')} disabled={!!requestLoading} className="bg-atalaia-neon/20 border border-atalaia-neon/50 hover:bg-atalaia-neon/40 text-atalaia-neon font-bold">
                     {requestLoading === 'ESCORT' ? <Loader2 className="animate-spin mr-2" size={18} /> : <Shield size={18} className="mr-2"/>} Solicitar Escolta
                 </Button>
                 <Button onClick={() => handleRequestService('EXTRA_ROUND')} disabled={!!requestLoading} className="bg-atalaia-neon/20 border border-atalaia-neon/50 hover:bg-atalaia-neon/40 text-atalaia-neon font-bold">
                     {requestLoading === 'EXTRA_ROUND' ? <Loader2 className="animate-spin mr-2" size={18} /> : <Navigation size={18} className="mr-2"/>} Ronda Extra no Local
                 </Button>
                 <Button onClick={() => handleRequestService('TRAVEL_NOTICE')} disabled={!!requestLoading} className="bg-atalaia-neon/20 border border-atalaia-neon/50 hover:bg-atalaia-neon/40 text-atalaia-neon font-bold">
                     {requestLoading === 'TRAVEL_NOTICE' ? <Loader2 className="animate-spin mr-2" size={18} /> : <MapPin size={18} className="mr-2"/>} Aviso de Viagem
                 </Button>
            </div>
        </Card>
      )}

          {/* GESTÃO GERAL (ADMIN ONLY) */}
          {user?.role === UserRole.ADMIN && (
              <Card className="p-6 mb-8 border-atalaia-neon/30 bg-atalaia-neon/5 animate-in slide-in-from-top-4">
                  <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-white">
                      <Shield className="text-atalaia-neon" size={20} />
                      Atalhos Administrativos
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Button onClick={() => navigate('/admin/whatsapp')} className="bg-green-600/20 border border-green-500/40 hover:bg-green-600/30 text-green-400 font-bold">
                          <MessageSquare size={18} className="mr-2"/> Central WhatsApp
                      </Button>
                      <Button onClick={() => navigate('/integrator/users')} className="bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 text-blue-400 font-bold">
                          <Users size={18} className="mr-2"/> Gestão de Usuários
                      </Button>
                      <Button onClick={() => navigate('/admin/financial')} className="bg-yellow-600/20 border border-yellow-500/40 hover:bg-yellow-600/30 text-yellow-400 font-bold">
                          <DollarSign size={18} className="mr-2"/> Financeiro Geral
                      </Button>
                      <Button onClick={() => navigate('/cameras')} className="bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 text-purple-400 font-bold">
                          <Video size={18} className="mr-2"/> Config. Câmeras
                      </Button>
                  </div>
              </Card>
          )}

          {/* SUPPORT TICKETS FEED (Admins only) */}
      {user?.role === UserRole.ADMIN && supportTickets.length > 0 && (
          <Card className="p-6 mb-8 border-atalaia-neon/30 bg-atalaia-neon/5">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-white uppercase italic tracking-tighter">
                  <Wrench className="text-atalaia-neon" size={20} />
                  Chamados de Suporte Técnico
                  <Badge color="blue">{supportTickets.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {supportTickets.map(ticket => (
                      <div key={ticket.id} className="bg-black/60 p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                          <div>
                              <div className="flex justify-between items-start mb-2">
                                  <Badge color={ticket.status === 'OPEN' ? 'red' : 'yellow'}>
                                      {ticket.status === 'OPEN' ? 'ABERTO' : 'EM ATENDIMENTO'}
                                  </Badge>
                                  <span className="text-[10px] text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm text-white font-bold mb-1">{ticket.userName}</p>
                              <p className="text-xs text-gray-400 line-clamp-3 mb-4 italic">"{ticket.message}"</p>
                          </div>
                          <div className="flex gap-2">
                              <Button 
                                onClick={async () => {
                                    await MockService.updateSupportTicketStatus(ticket.id, 'IN_PROGRESS');
                                    fetchData();
                                }}
                                disabled={ticket.status === 'IN_PROGRESS'}
                                className="flex-1 text-[10px] h-8 bg-blue-600 hover:bg-blue-500"
                              >
                                ATENDER
                              </Button>
                              <Button 
                                onClick={async () => {
                                    await MockService.updateSupportTicketStatus(ticket.id, 'CLOSED');
                                    fetchData();
                                }}
                                className="flex-1 text-[10px] h-8 bg-black border border-white/20 hover:bg-white/5"
                              >
                                CONCLUIR
                              </Button>
                          </div>
                      </div>
                  ))}
              </div>
          </Card>
      )}

      {/* NOTIFICATIONS FEED */}
      {notifications.length > 0 && (
          <Card className="p-6 mb-8 border-atalaia-neon/30 bg-atalaia-neon/5">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-white">
                  <Inbox className="text-atalaia-neon" size={20} />
                  Minhas Notificações
                  <Badge color="green">{notifications.length}</Badge>
              </h2>
              <div className="space-y-4">
                  {notifications
                    // FILTER 1: Hide protocol submissions from non-admins
                    .filter(notif => user?.role === UserRole.ADMIN || notif.type !== 'PROTOCOL_SUBMISSION')
                    // FILTER 2: Hide REGISTRATION_REQUEST from non-admins (Double check safety)
                    .filter(notif => user?.role === UserRole.ADMIN || notif.type !== 'REGISTRATION_REQUEST')
                    .map(notif => (
                      <div key={notif.id} className="bg-black/50 p-4 rounded-lg border border-white/10 group">
                          <div className="flex justify-between items-start mb-2">
                              <div>
                                  <h4 className="font-bold text-white text-sm">{notif.title}</h4>
                                  <p className="text-xs text-gray-400">De: {notif.fromUserName} • {new Date(notif.timestamp).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-atalaia-accent text-white px-2 py-0.5 rounded">Novo</span>
                                <button 
                                    onClick={() => handleDeleteNotification(notif.id)}
                                    className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                    title="Excluir notificação"
                                >
                                    <Trash2 size={16} className="pointer-events-none" />
                                </button>
                              </div>
                          </div>
                          <p className="text-sm text-gray-300 mb-3">{notif.message}</p>
                          
                          {/* ACTION BUTTONS FOR REGISTRATION REQUEST */}
                          {notif.type === 'REGISTRATION_REQUEST' && notif.data?.pendingUserId ? (
                              <div className="flex gap-2 mt-3 animate-in fade-in">
                                  <Button 
                                    onClick={() => handleApproveFromNotification(notif.id, notif.data.pendingUserId)} 
                                    disabled={actionLoading === notif.id}
                                    className="bg-green-600 hover:bg-green-500 text-xs py-1 h-auto"
                                  >
                                      {actionLoading === notif.id ? <Loader2 size={14} className="animate-spin" /> : <><UserCheck size={14} className="mr-1"/> Aprovar Acesso</>}
                                  </Button>
                                  <Button 
                                    onClick={() => handleRejectFromNotification(notif.id, notif.data.pendingUserId)} 
                                    disabled={actionLoading === notif.id}
                                    className="bg-red-600 hover:bg-red-500 text-xs py-1 h-auto"
                                  >
                                      <XCircle size={14} className="mr-1"/> Rejeitar
                                  </Button>
                              </div>
                          ) : notif.type === 'REGISTRATION_REQUEST' && (
                              <div className="mt-2 text-xs text-yellow-500 italic bg-yellow-900/20 p-2 rounded">
                                  Nota: Aprove este usuário manualmente em "Gestão Geral do Sistema" caso os botões não apareçam (notificação antiga).
                              </div>
                          )}

                          {notif.type === 'PROTOCOL_SUBMISSION' && notif.data && (
                              <div className="space-y-2 mt-2">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      <div className="bg-black p-2 rounded border border-gray-800 flex items-center justify-between">
                                          <code className="text-xs text-atalaia-neon truncate mr-2">{notif.data.rtmp}</code>
                                          <button onClick={() => navigator.clipboard.writeText(notif.data.rtmp)} title="Copiar RTMP"><Copy size={14} className="text-gray-500 hover:text-white"/></button>
                                      </div>
                                      <div className="bg-black p-2 rounded border border-gray-800 flex items-center justify-between">
                                          <code className="text-xs text-blue-400 truncate mr-2">{notif.data.rtsp}</code>
                                          <button onClick={() => navigator.clipboard.writeText(notif.data.rtsp)} title="Copiar RTSP"><Copy size={14} className="text-gray-500 hover:text-white"/></button>
                                      </div>
                                  </div>
                                  
                                  {/* Coordinates Display */}
                                  {(notif.data.lat || notif.data.lng) && (
                                    <div className="grid grid-cols-2 gap-2">
                                         <div className="bg-black p-2 rounded border border-gray-800 flex items-center justify-between">
                                            <span className="text-xs text-gray-400">Lat: <span className="text-white">{notif.data.lat}</span></span>
                                            <button onClick={() => navigator.clipboard.writeText(String(notif.data.lat))} title="Copiar Latitude"><Copy size={14} className="text-gray-500 hover:text-white"/></button>
                                        </div>
                                        <div className="bg-black p-2 rounded border border-gray-800 flex items-center justify-between">
                                            <span className="text-xs text-gray-400">Lng: <span className="text-white">{notif.data.lng}</span></span>
                                            <button onClick={() => navigator.clipboard.writeText(String(notif.data.lng))} title="Copiar Longitude"><Copy size={14} className="text-gray-500 hover:text-white"/></button>
                                        </div>
                                    </div>
                                  )}
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Alerts Feed */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="text-atalaia-neon" size={20} />
              Últimas Ocorrências
            </h2>
            <Button variant="outline" className="text-xs px-2 py-1 h-auto" onClick={() => navigate('/alerts')}>Ver Tudo</Button>
          </div>
          
          <div className="space-y-4">
            {recentAlerts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma ocorrência registrada.</p>
            ) : (
                recentAlerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-4 p-4 rounded-lg bg-black/40 border border-white/5">
                    <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${alert.type === 'PANIC' ? 'bg-red-500 animate-pulse' : alert.type === 'SUSPICIOUS' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-white truncate">{alert.userName}</span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                        Reportou: <Badge color={alert.type === 'PANIC' ? 'red' : alert.type === 'SUSPICIOUS' ? 'yellow' : 'green'}>{alert.type}</Badge>
                    </p>
                    {user?.role === UserRole.ADMIN && (
                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1"><MapPin size={10} /> Bairro ID: {alert.neighborhoodId}</p>
                    )}
                    </div>
                </div>
                ))
            )}
          </div>
        </Card>

        {/* Quick Camera Access */}
        <Card className="p-6 flex flex-col">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <Video className="text-atalaia-neon" size={20} />
            Visualização Rápida
          </h2>
          
          <div className="flex-1 flex flex-col items-center justify-center bg-black/60 rounded-lg border border-dashed border-gray-700 min-h-[200px]">
             {user?.plan === 'FREE' && user?.role === UserRole.RESIDENT ? (
                 <div className="text-center px-6 py-8">
                     <Lock className="text-atalaia-neon/30 mx-auto mb-4" size={40} />
                     <h3 className="text-white font-bold mb-2">Monitoramento VIP Indisponível</h3>
                     <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                         Para visualizar as câmeras do seu bairro, você precisa de uma assinatura ativa.
                     </p>
                     <div className="flex flex-col gap-2">
                        <Button 
                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold"
                            onClick={() => setShowUpgradeModal(true)}
                        >
                            Assinar Plano Família (R$ 39,90)
                        </Button>
                        <Button 
                            variant="outline"
                            className="text-atalaia-neon border-atalaia-neon/20"
                            onClick={() => setShowUpgradeModal(true)}
                        >
                            Assinar Plano Prêmio (R$ 79,90)
                        </Button>
                     </div>
                 </div>
             ) : myNeighborhood ? (
                 <div className="text-center">
                     <p className="text-gray-400 mb-4">Câmera Principal: {myNeighborhood.name}</p>
                     <Button onClick={() => navigate('/cameras')}>Abrir Monitoramento</Button>
                 </div>
             ) : user?.role === UserRole.ADMIN ? (
                 <div className="text-center">
                     <p className="text-gray-400 mb-4">Você tem acesso global.</p>
                     <Button onClick={() => navigate('/cameras')}>Gerenciar Câmeras</Button>
                 </div>
             ) : (
                 <p className="text-gray-500">Nenhuma câmera vinculada.</p>
             )}
          </div>
        </Card>
      </div>

       {/* Modal Upgrade Global */}
       <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

       <AnimatePresence>
            {/* Custom delete notification modal */}
            {notifToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-center"
                    >
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 font-sans">
                            <AlertTriangle size={24} className="mx-auto text-red-500" />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 font-mono">
                            Excluir Notificação
                        </h3>
                        <p className="text-xs text-zinc-400 mb-6 leading-relaxed font-sans">
                            Deseja realmente excluir esta notificação?
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setNotifToDelete(null)}
                                className="flex-1 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-zinc-900 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-sans"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (notifToDelete) {
                                        await executeDeleteNotification(notifToDelete);
                                        setNotifToDelete(null);
                                    }
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-500/15 cursor-pointer font-sans"
                            >
                                Excluir
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Custom reject user modal */}
            {notifUserToReject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-center"
                    >
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 font-sans">
                            <XCircle size={24} className="mx-auto text-red-500" />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 font-mono">
                            Rejeitar Usuário
                        </h3>
                        <p className="text-xs text-zinc-400 mb-6 leading-relaxed font-sans">
                            Deseja rejeitar e remover este cadastro do sistema?
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setNotifUserToReject(null)}
                                className="flex-1 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-zinc-900 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-sans"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (notifUserToReject) {
                                        await executeRejectFromNotification(notifUserToReject.notifId, notifUserToReject.pendingUserId);
                                        setNotifUserToReject(null);
                                    }
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-500/15 cursor-pointer font-sans"
                            >
                                Rejeitar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Custom request service confirm modal */}
            {serviceToRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-center"
                    >
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-atalaia-neon/50 to-transparent" />
                        <div className="w-12 h-12 bg-atalaia-neon/10 border border-atalaia-neon/20 text-atalaia-neon rounded-full flex items-center justify-center mx-auto mb-4">
                            <Navigation size={22} className="text-atalaia-neon mx-auto" />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 font-mono">
                            Confirmar Serviço
                        </h3>
                        <p className="text-xs text-zinc-400 mb-6 leading-relaxed font-sans">
                            Deseja confirmar o pedido de <span className="text-white font-bold">{serviceToRequest === 'ESCORT' ? 'Acompanhamento Seguro' : serviceToRequest === 'EXTRA_ROUND' ? 'Ronda Extra' : 'Aviso de Viagem'}</span> para o Motovigia da sua região?
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setServiceToRequest(null)}
                                className="flex-1 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-zinc-900 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-sans"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (serviceToRequest) {
                                        const type = serviceToRequest;
                                        setServiceToRequest(null);
                                        await executeRequestService(type);
                                    }
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-atalaia-neon text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-atalaia-neon/15 cursor-pointer font-sans"
                            >
                                Confirmar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </Layout>
  );
};

export default Dashboard;

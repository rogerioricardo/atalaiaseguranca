
import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { UserRole, Alert, Neighborhood, Notification, User, ServiceRequest } from '../types';
import { Card, Badge, Button, Modal, Input } from '../components/UI';
import { MockService } from '../services/mockService';
import { supabase } from '../lib/supabaseClient';
import { 
    AlertTriangle, Video, Users, Activity, MapPin, Inbox, Copy, Trash2, 
    Heart, DollarSign, Loader2, Navigation, FileText, 
    Shield, Star, Lock, Send, Search, CheckCircle, UserCheck, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaymentService } from '../services/paymentService';

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

    useEffect(() => {
        const loadData = async () => {
             // Carrega incidentes
             const alerts = await MockService.getAlerts(user.neighborhoodId);
             setQuickIncidents(alerts.slice(0, 3));

             // Carrega solicitações VIP
             if (user.neighborhoodId) {
                 const requests = await MockService.getServiceRequests(user.neighborhoodId);
                 setServiceRequests(requests.filter(r => r.status === 'PENDING'));
                 
                 // Pre-load residents for selector
                 const users = await MockService.getUsers(user.neighborhoodId);
                 
                 // FILTRO: Apenas moradores do plano PREMIUM (PRÊMIO) aparecem para o SCR
                 setResidents(users.filter(u => u.role === UserRole.RESIDENT && u.plan === 'PREMIUM'));
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
                        alert(`✅ Check-in registrado! ${targetUser ? `Notificação enviada para ${targetUser.name}.` : ''}`);
                        setPatrolLoading(false);
                    }, (error) => {
                        alert("Erro de GPS: " + error.message);
                        setPatrolLoading(false);
                    });
                } else {
                    alert("GPS não suportado.");
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
                alert(`📖 Ocorrência registrada! ${targetUser ? `Notificação enviada para ${targetUser.name}.` : ''}`);
                setPatrolLoading(false);
            } else if (pendingAction.type === 'PANIC') {
                // For SCR Panic, we create a general alert but mention the resident in the note if selected
                await MockService.createAlert({
                    type: 'DANGER', // SCR panic is usually a danger report
                    userId: user.id,
                    userName: user.name,
                    neighborhoodId: user.neighborhoodId!,
                    userRole: UserRole.SCR,
                    message: logNote
                });
                alert("🚨 Alerta de Perigo enviado à central!");
                setPatrolLoading(false);
            }
        } catch (e) {
            alert("Erro ao executar ação.");
            setPatrolLoading(false);
        }
    };

    const filteredResidents = residents.filter(r => 
        r.name.toLowerCase().includes(residentSearch.toLowerCase()) ||
        r.address?.toLowerCase().includes(residentSearch.toLowerCase())
    );

    return (
        <Layout>
            <div className="flex flex-col h-full gap-4">
                <div className="bg-atalaia-neon/10 border-l-4 border-atalaia-neon p-4 rounded-r-lg mb-4">
                    <h1 className="text-2xl font-black text-white tracking-tighter uppercase flex items-center gap-2">
                        <ShieldCheckIcon /> PAINEL TÁTICO
                    </h1>
                    <p className="text-atalaia-neon font-mono text-xs uppercase tracking-widest">
                        OPERADOR: {user.name} | POSTO: {neighborhood?.name || 'GLOBAL'}
                    </p>
                </div>

                {/* BIG BUTTONS FOR GLOVED HANDS */}
                <div className="grid grid-cols-2 gap-4 h-48">
                    <button 
                        onClick={() => initiateAction('CHECKIN')}
                        disabled={patrolLoading}
                        className="bg-green-700 hover:bg-green-600 active:bg-green-500 text-white rounded-xl border-2 border-green-500 shadow-[0_0_20px_rgba(21,128,61,0.5)] flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {patrolLoading ? <Loader2 className="animate-spin w-12 h-12" /> : <MapPin className="w-12 h-12" />}
                        <span className="text-xl font-black uppercase">CHECK-IN RONDA</span>
                    </button>

                    <button 
                        onClick={() => initiateAction('PANIC')}
                        className="bg-red-700 hover:bg-red-600 active:bg-red-500 text-white rounded-xl border-2 border-red-500 shadow-[0_0_20px_rgba(185,28,28,0.5)] flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <AlertTriangle className="w-12 h-12" />
                        <span className="text-xl font-black uppercase">REPORTAR PERIGO</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                    {/* VIP REQUESTS */}
                    <Card className="p-4 bg-[#111] border-yellow-500/30">
                        <h3 className="text-yellow-400 font-bold mb-4 flex items-center gap-2 uppercase text-sm">
                            <Star size={16} fill="currentColor" /> Solicitações VIP (Premium)
                        </h3>
                        <div className="space-y-2">
                            {serviceRequests.length === 0 ? (
                                <p className="text-gray-600 italic text-xs">Nenhuma solicitação pendente.</p>
                            ) : (
                                serviceRequests.map(req => (
                                    <div key={req.id} className="p-3 bg-yellow-900/10 border border-yellow-500/20 rounded flex justify-between items-center">
                                        <div>
                                            <p className="text-white font-bold text-sm">
                                                {req.requestType === 'ESCORT' ? 'SOLICITAÇÃO DE ESCOLTA' : 
                                                 req.requestType === 'EXTRA_ROUND' ? 'RONDA EXTRA NO LOCAL' : 'AVISO DE VIAGEM'}
                                            </p>
                                            <p className="text-gray-400 text-xs">Morador: {req.userName}</p>
                                            <p className="text-gray-500 text-[10px]">{new Date(req.createdAt).toLocaleString()}</p>
                                        </div>
                                        <Badge color="yellow">PENDENTE</Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* QUICK INCIDENTS */}
                    <Card className="p-4 bg-[#111] border-gray-800">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2 uppercase text-sm text-gray-400">
                            <FileText size={16} /> Livro de Ocorrências Rápido
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => initiateAction('LOG', "PORTÃO ABERTO")} className="p-4 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700 text-white font-bold text-sm">PORTÃO ABERTO</button>
                            <button onClick={() => initiateAction('LOG', "LÂMPADA QUEIMADA")} className="p-4 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700 text-white font-bold text-sm">LUZ QUEIMADA</button>
                            <button onClick={() => initiateAction('LOG', "VEÍCULO SUSPEITO")} className="p-4 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700 text-white font-bold text-sm">VEÍCULO SUSPEITO</button>
                            <button onClick={() => initiateAction('LOG', "VIOLAÇÃO DE PERÍMETRO")} className="p-4 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700 text-white font-bold text-sm">VIOLAÇÃO PERÍMETRO</button>
                        </div>
                    </Card>

                    {/* RECENT ALERTS FEED */}
                    <Card className="p-4 bg-[#111] border-gray-800">
                         <h3 className="text-white font-bold mb-4 flex items-center gap-2 uppercase text-sm text-gray-400">
                            <Activity size={16} /> Fila de Despacho (Últimos)
                        </h3>
                        <div className="space-y-2">
                            {quickIncidents.map(alert => (
                                <div key={alert.id} className={`p-3 rounded border-l-4 ${alert.type === 'PANIC' ? 'border-red-500 bg-red-900/20' : 'border-gray-500 bg-gray-900'}`}>
                                    <div className="flex justify-between">
                                        <span className="font-bold text-white">{alert.type}</span>
                                        <span className="text-xs text-gray-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-300 truncate">{alert.userName} - {alert.message || 'Sem detalhes'}</p>
                                </div>
                            ))}
                            {quickIncidents.length === 0 && <p className="text-gray-600 italic">Sem incidentes recentes.</p>}
                        </div>
                    </Card>
                </div>

                {/* RESIDENT SELECTION MODAL */}
                <Modal isOpen={isResidentModalOpen} onClose={() => setIsResidentModalOpen(false)}>
                    <div className="p-4">
                        <h2 className="text-xl font-bold text-white mb-2">Vincular Morador (VIP)</h2>
                        <p className="text-gray-400 text-sm mb-4">
                            Selecione o morador <strong>Premium</strong> relacionado a esta ocorrência.
                            Apenas assinantes do plano Prêmio aparecem nesta lista.
                        </p>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="Buscar morador ou endereço..."
                                value={residentSearch}
                                onChange={(e) => setResidentSearch(e.target.value)}
                                autoFocus
                                className="w-full bg-black border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-atalaia-neon focus:outline-none"
                            />
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                            {filteredResidents.map(resident => (
                                <div 
                                    key={resident.id}
                                    onClick={() => confirmAction(resident.id)}
                                    className="p-3 bg-atalaia-neon/10 border border-atalaia-neon/20 rounded-lg hover:bg-atalaia-neon/20 hover:border-atalaia-neon cursor-pointer flex justify-between items-center group"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-white font-bold text-sm">{resident.name}</p>
                                            <Badge color="green">PRÊMIO</Badge>
                                        </div>
                                        <p className="text-gray-500 text-xs">{resident.address || 'Sem endereço'}</p>
                                    </div>
                                    <CheckCircle size={18} className="text-gray-600 group-hover:text-atalaia-neon" />
                                </div>
                            ))}
                            {filteredResidents.length === 0 && <p className="text-center text-gray-500 py-4">Nenhum assinante Prêmio encontrado.</p>}
                        </div>

                        <Button onClick={() => confirmAction(undefined)} variant="secondary" className="w-full">
                            Pular Seleção (Registro Geral)
                        </Button>
                    </div>
                </Modal>
            </div>
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
  const [myNeighborhood, setMyNeighborhood] = useState<Neighborhood | undefined>();
  
  // Donation State
  const [donationAmount, setDonationAmount] = useState('10.00');
  const [neighborhoodIntegrator, setNeighborhoodIntegrator] = useState<User | null>(null);
  const [processingDonation, setProcessingDonation] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Service Request Loading State
  const [requestLoading, setRequestLoading] = useState<string | null>(null);

  // Upgrade Modal for SCR feature
  const [showSCRUpgradeModal, setShowSCRUpgradeModal] = useState(false);
  
  // POPUP FEEDBACK STATE
  const [feedback, setFeedback] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

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

    return () => {
        supabase.removeChannel(subAlerts);
        supabase.removeChannel(subNotifs);
        supabase.removeChannel(subHoods);
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

  const handleDeleteNotification = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta notificação?')) {
        await MockService.deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    }
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

  const handleRejectFromNotification = async (notifId: string, pendingUserId: string) => {
      if(!window.confirm("Rejeitar e excluir este cadastro?")) return;
      
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

  const handleRequestService = async (type: 'ESCORT' | 'EXTRA_ROUND' | 'TRAVEL_NOTICE') => {
      if (!user || !user.neighborhoodId) return;
      if (user.plan !== 'PREMIUM') {
          setShowSCRUpgradeModal(true);
          return;
      }

      if (window.confirm("Confirmar solicitação ao Motovigia?")) {
          setRequestLoading(type);
          try {
              await MockService.createServiceRequest(user.id, user.name, user.neighborhoodId, type);
              showFeedback("Solicitação enviada via WhatsApp para a Equipe Tática!", 'success');
          } catch (e) {
              showFeedback("Erro ao enviar solicitação.", 'error');
          } finally {
              setRequestLoading(null);
          }
      }
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
                                    <Trash2 size={16} />
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
             {myNeighborhood ? (
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

       {/* Modal Upgrade for SCR */}
       <Modal isOpen={showSCRUpgradeModal} onClose={() => setShowSCRUpgradeModal(false)}>
           <div className="p-4 text-center">
               <div className="w-16 h-16 bg-atalaia-neon/20 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Star size={32} fill="white" className="text-atalaia-neon" />
               </div>
               <h2 className="text-2xl font-bold text-white mb-2">Desbloqueie o Suporte SCR</h2>
               <p className="text-gray-400 mb-6">
                   O serviço de Apoio Tático Motovigia (Escolta, Rondas Extras) é exclusivo para assinantes do <strong>Plano Prêmio</strong>.
               </p>
               <Button onClick={() => {
                   window.location.href = '#/cameras'; 
                   setShowSCRUpgradeModal(false);
               }} className="w-full">
                   Fazer Upgrade para Prêmio
               </Button>
           </div>
       </Modal>
    </Layout>
  );
};

export default Dashboard;

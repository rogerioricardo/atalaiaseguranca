
import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '@/auth/context';
import { User, UserRole, Neighborhood } from '../types';
import { MockService } from '../services/mockService';
import { supabase } from '../lib/supabaseClient';
import { Card, Button, Input, Modal, Badge } from '../components/UI';
import { 
    Trash2, MapPin, Users, Search, 
    Edit2, Loader2, Wrench, CheckCircle, Smartphone, Mail, RefreshCw, Filter, Database, AlertTriangle,
    Star, Upload, Check, Settings, Building, CreditCard, Sparkles, AlertCircle, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const IntegratorUsers: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [residents, setResidents] = useState<User[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminFilterHood, setAdminFilterHood] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'trial' | 'subscribed' | 'free'>('all');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editHoodId, setEditHoodId] = useState('');
  const [editPlan, setEditPlan] = useState<string>('FREE');
  const [editRole, setEditRole] = useState<UserRole>(UserRole.RESIDENT);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const getDaysRemaining = (promoEnd?: string) => {
      if (!promoEnd) return 0;
      const promoEndMs = new Date(promoEnd).getTime();
      const nowMs = new Date().getTime();
      const diffMs = promoEndMs - nowMs;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const hoods = await MockService.getNeighborhoods(true);
        const filteredHoods = user?.role === UserRole.ADMIN 
          ? hoods 
          : hoods.filter(h => h.id === user?.neighborhoodId);
        setNeighborhoods(filteredHoods);
        
        // Se Admin, traz tudo. Se Integrador, traz só o bairro dele.
        const targetHoodId = user?.role === UserRole.INTEGRATOR ? user.neighborhoodId : undefined;
        const allUsers = await MockService.getUsers(targetHoodId);
        setResidents(allUsers);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  }, [user]);

  useEffect(() => { 
    if (user) fetchData(); 

    const subProfiles = MockService.subscribeToTable('profiles', fetchData);
    const subHoods = MockService.subscribeToTable('neighborhoods', fetchData);

    return () => {
        supabase.removeChannel(subProfiles);
        supabase.removeChannel(subHoods);
    };
  }, [fetchData, user]);

  const handleUpdateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;
      try {
          await MockService.adminUpdateUser(editingUser.id, { 
              name: editName, 
              phone: editPhone, 
              neighborhood_id: editHoodId || null,
              plan: editPlan,
              role: editRole
          });
          setIsEditModalOpen(false);
          fetchData();
          alert('Usuário atualizado no banco!');
      } catch (e: any) { alert(e.message); }
  };

  const totalResidents = residents.filter(r => r.role === UserRole.RESIDENT).length;
  const trialResidents = residents.filter(r => r.role === UserRole.RESIDENT && r.promoActive && r.promoEnd).length;
  const subscribedResidents = residents.filter(r => r.role === UserRole.RESIDENT && !r.promoActive && (r.plan === 'FAMILY' || r.plan === 'PREMIUM')).length;
  const freeResidents = residents.filter(r => r.role === UserRole.RESIDENT && r.plan === 'FREE' && !r.promoActive).length;

  const filteredResidents = residents.filter(r => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
          r.name.toLowerCase().includes(searchLower) || 
          (r.email && r.email.toLowerCase().includes(searchLower)) ||
          (r.phone && r.phone.includes(searchLower)) ||
          (r.promoCoupon && r.promoCoupon.toLowerCase().includes(searchLower));

      const matchesHood = adminFilterHood ? r.neighborhoodId === adminFilterHood : true;
      
      let matchesTab = true;
      if (filterTab === 'trial') {
          matchesTab = !!(r.role === UserRole.RESIDENT && r.promoActive && r.promoEnd);
      } else if (filterTab === 'subscribed') {
          matchesTab = !!(r.role === UserRole.RESIDENT && !r.promoActive && (r.plan === 'FAMILY' || r.plan === 'PREMIUM'));
      } else if (filterTab === 'free') {
          matchesTab = !!(r.role === UserRole.RESIDENT && r.plan === 'FREE' && !r.promoActive);
      }

      return matchesSearch && matchesHood && matchesTab;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Database className="text-atalaia-neon" size={32} /> 
                {user?.role === UserRole.ADMIN ? 'Gestão Geral do Sistema' : 'Gestão de Moradores'}
            </h1>
            <div className="flex gap-2 w-full md:w-auto">
                <button onClick={fetchData} className="flex-1 md:flex-none p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-atalaia-neon transition-colors flex items-center justify-center gap-2">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    <span className="md:hidden">Sincronizar</span>
                </button>
            </div>
        </div>

        {/* METRICS GRID FOR INTEGRATOR/ADMIN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 bg-zinc-900/40 border-white/5 flex items-center justify-between">
                <div>
                    <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block mb-1">Total de Moradores</span>
                    <span className="text-3xl font-black text-white">{totalResidents}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                    <Users size={22} />
                </div>
            </Card>

            <Card className="p-5 bg-zinc-900/40 border-yellow-500/20 flex items-center justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-all duration-500" />
                <div className="relative z-10">
                    <span className="text-xs text-yellow-300 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                        <Sparkles size={12} className="animate-pulse" /> Em Teste (7 dias)
                    </span>
                    <span className="text-3xl font-black text-yellow-400">{trialResidents}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center justify-center relative z-10">
                    <Sparkles size={22} className="text-yellow-400 animate-pulse" />
                </div>
            </Card>

            <Card className="p-5 bg-zinc-900/40 border-emerald-500/20 flex items-center justify-between">
                <div>
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block mb-1">Assinantes Ativos</span>
                    <span className="text-3xl font-black text-emerald-400">{subscribedResidents}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <CreditCard size={22} />
                </div>
            </Card>

            <Card className="p-5 bg-zinc-900/40 border-white/5 flex items-center justify-between">
                <div>
                    <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block mb-1">Planos Gratuitos</span>
                    <span className="text-3xl font-black text-zinc-300">{freeResidents}</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-zinc-800/50 border border-white/5 text-zinc-450 flex items-center justify-center">
                    <CheckCircle size={22} />
                </div>
            </Card>
        </div>

        {user?.role === UserRole.ADMIN && (
            <Card className="p-6 border-blue-500/20 bg-blue-900/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                <div>
                    <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2"><Wrench size={20} className="text-blue-500"/> Integridade de Dados</h2>
                    <p className="text-xs text-gray-400">Corrige vínculos órfãos de usuários com bairros deletados.</p>
                </div>
                <Button onClick={async () => { const count = await MockService.maintenanceFixOrphans(); alert(`${count} usuários corrigidos.`); fetchData(); }} variant="outline">Corrigir Agora</Button>
            </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input type="text" placeholder="Buscar por nome, email, telefone ou cupom..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-14 bg-[#111] border border-atalaia-border rounded-xl pl-12 pr-4 text-white outline-none" />
            </div>
            {user?.role === UserRole.ADMIN && (
                <select className="w-full h-14 bg-[#111] border border-atalaia-border rounded-xl px-4 text-white outline-none" value={adminFilterHood} onChange={(e) => setAdminFilterHood(e.target.value)}>
                    <option value="">Todos os Bairros</option>
                    {neighborhoods.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
            )}
        </div>

        {/* TABS FILTER */}
        <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
            <button
                onClick={() => setFilterTab('all')}
                className={`py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest font-bold transition-all ${
                    filterTab === 'all'
                        ? 'bg-white text-black font-black'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
            >
                Todos ({residents.length})
            </button>
            <button
                onClick={() => setFilterTab('trial')}
                className={`py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-1.5 ${
                    filterTab === 'trial'
                        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 font-black'
                        : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20'
                }`}
            >
                <Sparkles size={14} className={filterTab === 'trial' ? 'animate-pulse' : ''} />
                Em Teste de 7 Dias ({trialResidents})
            </button>
            <button
                onClick={() => setFilterTab('subscribed')}
                className={`py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest font-bold transition-all ${
                    filterTab === 'subscribed'
                        ? 'bg-emerald-500 text-black font-black'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                }`}
            >
                Assinantes ({subscribedResidents})
            </button>
            <button
                onClick={() => setFilterTab('free')}
                className={`py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest font-bold transition-all ${
                    filterTab === 'free'
                        ? 'bg-zinc-800 text-white font-black'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
            >
                Gratuitos ({freeResidents})
            </button>
        </div>

        {loading ? (
             <div className="text-center py-20 flex flex-col items-center">
                <Loader2 className="animate-spin text-atalaia-neon mb-4" size={48} />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Consultando Supabase...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredResidents.map(resident => (
                    <Card key={resident.id} className="p-6 bg-[#0a0a0a] border-white/5 hover:border-atalaia-neon/30 transition-all">
                        <div className="flex gap-4 items-start">
                            <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-atalaia-neon font-black shadow-inner shrink-0">
                                {resident.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white truncate">{resident.name}</h3>
                                <p className="text-xs text-gray-500 truncate">{resident.email}</p>
                                {resident.phone && <p className="text-[10px] text-gray-400 mt-0.5">{resident.phone}</p>}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <Badge color={resident.role === UserRole.ADMIN ? 'purple' : 'green'}>{resident.role}</Badge>
                                    <Badge color={resident.plan === 'PREMIUM' ? 'green' : (resident.plan === 'FAMILY' ? 'yellow' : 'blue')}>
                                        {resident.plan || 'FREE'}
                                    </Badge>
                                    <span className="text-[10px] text-atalaia-neon font-bold uppercase">
                                        {neighborhoods.find(n => n.id === resident.neighborhoodId)?.name || 'NÃO VINCULADO'}
                                    </span>
                                </div>

                                {/* ACTIVE TRIAL BANNER CARDS AND PROGRESS COUNTDOWN */}
                                {resident.promoActive && resident.promoEnd && (
                                    <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 text-xs text-yellow-300 animate-in fade-in-50 duration-200">
                                        <div className="flex justify-between items-center mb-2 flex-wrap gap-1">
                                            <span className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-yellow-400">
                                                <Sparkles size={12} className="animate-pulse text-yellow-400" />
                                                Teste Ativo (7 dias)
                                            </span>
                                            {resident.promoCoupon && (
                                                <span className="text-[10px] font-mono bg-yellow-500/20 text-yellow-300 font-semibold px-2 py-0.5 rounded-md">
                                                    Cupom: {resident.promoCoupon}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[11px] text-zinc-300">
                                                <span>Tempo restante:</span>
                                                <span className={`font-mono text-xs font-black ${getDaysRemaining(resident.promoEnd) <= 2 ? 'text-red-400 animate-pulse' : 'text-yellow-300'}`}>
                                                    {getDaysRemaining(resident.promoEnd)} {getDaysRemaining(resident.promoEnd) === 1 ? 'dia restante' : 'dias restantes'}
                                                </span>
                                            </div>
                                            
                                            {/* Beautiful progress bar */}
                                            {(() => {
                                                const rem = getDaysRemaining(resident.promoEnd);
                                                const pct = Math.max(0, Math.min(100, Math.round((rem / 7) * 100)));
                                                return (
                                                    <div className="w-full bg-zinc-900 border border-white/5 h-2 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-300 ${rem <= 2 ? 'bg-red-500 shadow-md shadow-red-500/20' : 'bg-yellow-500 shadow-md shadow-yellow-500/20'}`} 
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                );
                                            })()}

                                            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                                                <span>Começo: {resident.promoStart ? new Date(resident.promoStart).toLocaleDateString('pt-BR') : '-'}</span>
                                                <span>Expira: {resident.promoEnd ? new Date(resident.promoEnd).toLocaleDateString('pt-BR') : '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button onClick={() => { setEditingUser(resident); setEditName(resident.name); setEditPhone(resident.phone || ''); setEditHoodId(resident.neighborhoodId || ''); setEditPlan(resident.plan); setEditRole(resident.role); setIsEditModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg"><Edit2 size={18} className="pointer-events-none" /></button>
                                {user?.id !== resident.id && (
                                    <button onClick={() => setUserToDelete(resident)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={18} className="pointer-events-none" /></button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        )}

        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
            <div className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Editar Usuário no Banco</h2>
                <form onSubmit={handleUpdateUser} className="space-y-4">
                    <Input label="Nome" value={editName} onChange={e => setEditName(e.target.value)} required />
                    <Input label="Telefone" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Papel</label>
                            <select className="w-full bg-black border border-white/10 rounded-xl p-4 text-white" value={editRole} onChange={e => setEditRole(e.target.value as UserRole)}>
                                <option value={UserRole.RESIDENT}>Morador</option>
                                <option value={UserRole.SCR}>SCR (Motovigia)</option>
                                <option value={UserRole.INTEGRATOR}>Integrador</option>
                                <option value={UserRole.ADMIN}>Administrador</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Plano</label>
                            <select className="w-full bg-black border border-white/10 rounded-xl p-4 text-white" value={editPlan} onChange={e => setEditPlan(e.target.value)}>
                                <option value="FREE">FREE</option>
                                <option value="FAMILY">FAMILY</option>
                                <option value="PREMIUM">PREMIUM</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Bairro</label>
                        <select className="w-full bg-black border border-white/10 rounded-xl p-4 text-white" value={editHoodId} onChange={e => setEditHoodId(e.target.value)}>
                            <option value="">Sem Bairro</option>
                            {neighborhoods.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                    </div>
                    <Button type="submit" className="w-full h-12 mt-4 font-bold uppercase tracking-widest">Atualizar Agora</Button>
                </form>
            </div>
        </Modal>

        <AnimatePresence>
            {userToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-center"
                    >
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 font-mono">
                            Excluir Usuário
                        </h3>
                        <p className="text-xs text-zinc-400 mb-6 leading-relaxed font-sans">
                            Deseja realmente excluir permanentemente o cadastro de <span className="text-white font-bold">"{userToDelete.name}"</span> do sistema?
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setUserToDelete(null)}
                                className="flex-1 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-zinc-900 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-sans"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (userToDelete) {
                                        await MockService.deleteUser(userToDelete.id);
                                        await fetchData();
                                        setUserToDelete(null);
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
         </AnimatePresence>
       </div>
    </Layout>
  );
};

export default IntegratorUsers;

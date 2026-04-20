
import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { User, UserRole, Neighborhood } from '../types';
import { MockService } from '../services/mockService';
import { supabase } from '../lib/supabaseClient';
import { Card, Button, Input, Modal, Badge } from '../components/UI';
import { 
    Trash2, MapPin, Users, Search, 
    Edit2, Loader2, Wrench, CheckCircle, Smartphone, Mail, RefreshCw, Filter, Database
} from 'lucide-react';

const IntegratorUsers: React.FC = () => {
  const { user } = useAuth();
  const [residents, setResidents] = useState<User[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminFilterHood, setAdminFilterHood] = useState('');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editHoodId, setEditHoodId] = useState('');
  const [editPlan, setEditPlan] = useState<string>('FREE');
  const [editRole, setEditRole] = useState<UserRole>(UserRole.RESIDENT);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const hoods = await MockService.getNeighborhoods(true);
        setNeighborhoods(hoods);
        
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

  const filteredResidents = residents.filter(r => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = r.name.toLowerCase().includes(searchLower) || (r.email && r.email.toLowerCase().includes(searchLower));
      const matchesHood = adminFilterHood ? r.neighborhoodId === adminFilterHood : true;
      return matchesSearch && matchesHood;
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
                <input type="text" placeholder="Buscar por nome ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-14 bg-[#111] border border-atalaia-border rounded-xl pl-12 pr-4 text-white outline-none" />
            </div>
            {user?.role === UserRole.ADMIN && (
                <select className="w-full h-14 bg-[#111] border border-atalaia-border rounded-xl px-4 text-white outline-none" value={adminFilterHood} onChange={(e) => setAdminFilterHood(e.target.value)}>
                    <option value="">Todos os Bairros</option>
                    {neighborhoods.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
            )}
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
                            <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-atalaia-neon font-black shadow-inner">
                                {resident.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white">{resident.name}</h3>
                                <p className="text-xs text-gray-500">{resident.email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge color={resident.role === UserRole.ADMIN ? 'purple' : 'green'}>{resident.role}</Badge>
                                    <span className="text-[10px] text-atalaia-neon font-bold uppercase">
                                        {neighborhoods.find(n => n.id === resident.neighborhoodId)?.name || 'NÃO VINCULADO'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingUser(resident); setEditName(resident.name); setEditPhone(resident.phone || ''); setEditHoodId(resident.neighborhoodId || ''); setEditPlan(resident.plan); setEditRole(resident.role); setIsEditModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg"><Edit2 size={18}/></button>
                                {user?.id !== resident.id && (
                                    <button onClick={async () => { if(confirm('Excluir usuário do banco?')) { await MockService.deleteUser(resident.id); fetchData(); } }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={18}/></button>
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
      </div>
    </Layout>
  );
};

export default IntegratorUsers;


import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, Button, Badge, Input } from '@/components/UI';
import { MockService } from '@/services/mockService';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Download,
  ChevronRight,
  User,
  MapPin
} from 'lucide-react';
import { UserRole } from '@/types';

interface Payment {
  id: string;
  userName: string;
  neighborhoodName: string;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  plan: string;
}

const FinancialAdmin: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const neighborhoods = await MockService.getNeighborhoods();
      const hoodMap = new Map(neighborhoods.map(h => [h.id, h.name]));
      
      const realPayments = await MockService.getPayments();
      
      if (realPayments.length === 0) {
        // Se não houver pagamentos no banco ainda, podemos sugerir criar ou mostrar vazio
        setPayments([]);
      } else {
        const formattedPayments: Payment[] = realPayments.map(p => ({
          id: p.id,
          userName: p.profiles?.name || 'Desconhecido',
          neighborhoodName: hoodMap.get(p.profiles?.neighborhood_id || '') || 'Geral',
          amount: Number(p.amount),
          dueDate: p.due_date,
          status: p.status,
          plan: '-' // Opcional: buscar do perfil se necessário
        }));
        setPayments(formattedPayments);
      }
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (paymentId: string, newStatus: 'PAID' | 'PENDING' | 'OVERDUE') => {
    try {
      await MockService.updatePaymentStatus(paymentId, newStatus);
      loadData();
    } catch (error) {
      alert("Erro ao atualizar status do pagamento.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.neighborhoodName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: payments.length,
    paid: payments.filter(p => p.status === 'PAID').length,
    pending: payments.filter(p => p.status === 'PENDING').length,
    overdue: payments.filter(p => p.status === 'OVERDUE').length,
    revenue: payments.filter(p => p.status === 'PAID').reduce((acc, p) => acc + p.amount, 0)
  };

  const handleGenerateInvoices = async () => {
    if (!confirm("Deseja gerar as mensalidades do mês atual para todos os moradores ativos?")) return;
    
    setLoading(true);
    try {
      const users = await MockService.getUsers();
      const residents = users.filter(u => u.role === UserRole.RESIDENT && u.approved);
      const now = new Date();
      const refMonth = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
      const dueDate = new Date(now.getFullYear(), now.getMonth(), 10).toISOString().split('T')[0];

      for (const resident of residents) {
        let amount = 0;
        if (resident.plan === 'FAMILY') amount = 29.90;
        else if (resident.plan === 'PREMIUM') amount = 49.90;
        else amount = 39.90;

        await MockService.createPayment(resident.id, amount, dueDate, refMonth);
      }

      alert(`${residents.length} mensalidades geradas com sucesso!`);
      loadData();
    } catch (error) {
      console.error("Error generating invoices:", error);
      alert("Erro ao gerar mensalidades.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Painel Financeiro</h1>
            <p className="text-gray-400">Controle de mensalidades, vencimentos e inadimplência.</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="border-atalaia-neon/30 text-atalaia-neon hover:bg-atalaia-neon/10"
              onClick={handleGenerateInvoices}
              disabled={loading}
            >
              <DollarSign size={18} className="mr-2" /> Gerar Mensalidades
            </Button>
            <Button className="bg-atalaia-neon text-black hover:bg-atalaia-neon/80">
              <Download size={18} className="mr-2" /> Exportar Relatório
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-l-4 border-atalaia-neon">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Receita (Mês)</span>
              <DollarSign className="text-atalaia-neon" size={20} />
            </div>
            <div className="text-2xl font-bold text-white">R$ {stats.revenue.toFixed(2)}</div>
            <p className="text-[10px] text-green-500 mt-1 flex items-center gap-1">
              <CheckCircle2 size={10} /> Pagamentos confirmados
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">A Vencer</span>
              <Clock className="text-yellow-500" size={20} />
            </div>
            <div className="text-2xl font-bold text-white">{stats.pending}</div>
            <p className="text-[10px] text-yellow-500/70 mt-1">Aguardando processamento</p>
          </Card>

          <Card className="p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Vencidos</span>
              <AlertTriangle className="text-red-500" size={20} />
            </div>
            <div className="text-2xl font-bold text-white">{stats.overdue}</div>
            <p className="text-[10px] text-red-500/70 mt-1">Inadimplência ativa</p>
          </Card>

          <Card className="p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Moradores</span>
              <User className="text-blue-500" size={20} />
            </div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-[10px] text-blue-500/70 mt-1">Base ativa de assinantes</p>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por morador ou bairro..." 
                className="w-full bg-black border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-atalaia-neon outline-none transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {(['ALL', 'PAID', 'PENDING', 'OVERDUE'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    filterStatus === status 
                      ? 'bg-atalaia-neon text-black' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {status === 'ALL' ? 'Todos' : status === 'PAID' ? 'Pagos' : status === 'PENDING' ? 'A Vencer' : 'Vencidos'}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Payments Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Morador</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Bairro</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Plano</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Valor</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Vencimento</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-gray-500">Carregando dados financeiros...</td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-gray-500">Nenhum registro encontrado.</td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-atalaia-neon/10 flex items-center justify-center text-atalaia-neon font-bold text-xs">
                            {payment.userName.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-white">{payment.userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          <MapPin size={14} />
                          {payment.neighborhoodName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge color="blue" className="text-[10px] border-white/10 text-gray-400 bg-transparent">
                          {payment.plan}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-white">
                        R$ {payment.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          color={
                            payment.status === 'PAID' ? 'green' :
                            payment.status === 'OVERDUE' ? 'red' :
                            'yellow'
                          }
                        >
                          {payment.status === 'PAID' ? 'Pago' : payment.status === 'OVERDUE' ? 'Vencido' : 'Pendente'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                           {payment.status !== 'PAID' && (
                             <Button 
                               className="bg-green-600 hover:bg-green-500 text-[10px] h-7 px-2"
                               onClick={() => handleUpdateStatus(payment.id, 'PAID')}
                             >
                               MARCAR PAGO
                             </Button>
                           )}
                           {payment.status === 'PAID' && (
                             <Button 
                               variant="outline"
                               className="text-[10px] h-7 px-2 border-yellow-500/50 text-yellow-500"
                               onClick={() => handleUpdateStatus(payment.id, 'PENDING')}
                             >
                               ESTORNAR
                             </Button>
                           )}
                           <button className="p-2 text-gray-500 hover:text-atalaia-neon transition-colors">
                             <ChevronRight size={18} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default FinancialAdmin;

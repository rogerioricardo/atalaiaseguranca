
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, Button, Badge, Input } from '../components/UI';
import { MockService } from '../services/mockService';
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Simulando busca de dados financeiros
      // Em um cenário real, isso viria de uma tabela 'subscriptions' ou 'payments' no Supabase
      const mockPayments: Payment[] = [
        { id: '1', userName: 'João Silva', neighborhoodName: 'Centro', amount: 49.90, dueDate: '2025-04-10', status: 'PAID', plan: 'PREMIUM' },
        { id: '2', userName: 'Maria Oliveira', neighborhoodName: 'Jardins', amount: 29.90, dueDate: '2025-04-15', status: 'PENDING', plan: 'FAMILY' },
        { id: '3', userName: 'Carlos Souza', neighborhoodName: 'Centro', amount: 49.90, dueDate: '2025-04-05', status: 'OVERDUE', plan: 'PREMIUM' },
        { id: '4', userName: 'Ana Costa', neighborhoodName: 'Bela Vista', amount: 29.90, dueDate: '2025-04-20', status: 'PENDING', plan: 'FAMILY' },
        { id: '5', userName: 'Roberto Lima', neighborhoodName: 'Jardins', amount: 49.90, dueDate: '2025-03-28', status: 'OVERDUE', plan: 'PREMIUM' },
        { id: '6', userName: 'Juliana Farias', neighborhoodName: 'Centro', amount: 29.90, dueDate: '2025-04-01', status: 'PAID', plan: 'FAMILY' },
      ];
      
      setPayments(mockPayments);
      setLoading(false);
    };
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Painel Financeiro</h1>
            <p className="text-gray-400">Controle de mensalidades, vencimentos e inadimplência.</p>
          </div>
          <Button className="bg-atalaia-neon text-black hover:bg-atalaia-neon/80">
            <Download size={18} className="mr-2" /> Exportar Relatório
          </Button>
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
                        <button className="p-2 text-gray-500 hover:text-atalaia-neon transition-colors">
                          <ChevronRight size={18} />
                        </button>
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

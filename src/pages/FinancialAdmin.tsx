
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, Button, Badge, Input } from '@/components/UI';
import { MockService } from '@/services/mockService';
import { supabase } from "@/lib/supabaseClient";
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
  MapPin,
  RefreshCw,
  Key,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Sliders,
  UserCheck
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

interface MPTransaction {
  id: string;
  email: string;
  name: string;
  amount: number;
  status: 'approved' | 'pending' | 'in_process' | 'rejected' | 'cancelled' | 'refunded' | 'unknown';
  dateCreated: string;
  dateApproved: string | null;
  matchedUserId: string | null;
  matchedUserName: string | null;
  matchedEmail: string | null;
}

const FinancialAdmin: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  
  // States para Integração Mercado Pago
  const [activeTab, setActiveTab] = useState<'SYSTEM' | 'MERCADOPAGO'>('SYSTEM');
  const [mpToken, setMpToken] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [mpTransactions, setMpTransactions] = useState<MPTransaction[]>([]);
  const [loadingMP, setLoadingMP] = useState(false);
  const [residents, setResidents] = useState<any[]>([]);

  // Helper robusto para encontrar usuário correspondente a um pagamento Mercado Pago
  const findMatchedUser = (rawPay: any, users: any[]) => {
    const mpPayerEmail = rawPay.payer?.email?.trim().toLowerCase() || '';
    const metadataPayerEmail = rawPay.metadata?.payer_email?.trim().toLowerCase() || '';
    
    // 1. Tentar correspondência por e-mail no metadata (contém o e-mail real do Atalaia)
    if (metadataPayerEmail) {
      const match = users.find(u => u.email?.trim().toLowerCase() === metadataPayerEmail);
      if (match) return match;
    }

    // 2. Tentar correspondência por e-mail do pagador direto do Mercado Pago (comum em pagamentos logados)
    if (mpPayerEmail) {
      const match = users.find(u => u.email?.trim().toLowerCase() === mpPayerEmail);
      if (match) return match;
    }

    // 2.1. Procurar em qualquer campo dos metadados que contenha uma string com o símbolo @
    const anyEmailMeta = Object.values(rawPay.metadata || {}).find(v => typeof v === 'string' && v.includes('@'));
    if (anyEmailMeta) {
      const cleanMetaEmail = String(anyEmailMeta).trim().toLowerCase();
      const match = users.find(u => u.email?.trim().toLowerCase() === cleanMetaEmail);
      if (match) return match;
    }

    // 3. Tentar correspondência por Nome do pagador (se houver semelhanças parciais ou totais relevantes)
    const payerFirstName = String(rawPay.payer?.first_name || '').trim().toLowerCase();
    const payerLastName = String(rawPay.payer?.last_name || '').trim().toLowerCase();
    const payerFullName = `${payerFirstName} ${payerLastName}`.trim();
    if (payerFullName.length > 4) {
      const match = users.find(u => {
        const uName = String(u.name || '').trim().toLowerCase();
        return uName && (uName.includes(payerFullName) || payerFullName.includes(uName));
      });
      if (match) return match;
    }

    // 4. Tentar correspondência por telefone se existirem dígitos correspondentes finais
    const payerPhone = String(rawPay.payer?.phone?.number || '').replace(/\D/g, '');
    if (payerPhone && payerPhone.length >= 8) {
      const match = users.find(u => {
        const uPhone = String(u.phone || '').replace(/\D/g, '');
        return uPhone && (uPhone.endsWith(payerPhone) || payerPhone.endsWith(uPhone));
      });
      if (match) return match;
    }

    return null;
  };

  // Carregar token de acesso do Mercado Pago do banco de dados (system_settings)
  const loadMpSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'mercado_pago_access_token')
        .maybeSingle();
      
      if (data && data.value) {
        setMpToken(data.value);
        return data.value;
      } else {
        const local = localStorage.getItem('atalaia_mp_token');
        if (local) {
          setMpToken(local);
          return local;
        }
      }
    } catch (e) {
      console.warn("[FinancialAdmin] Erro ao carregar credenciais:", e);
    }
    return '';
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const neighborhoods = await MockService.getNeighborhoods();
      const hoodMap = new Map(neighborhoods.map(h => [h.id, h.name]));
      
      const realPayments = await MockService.getPayments();
      const users = await MockService.getUsers();
      const residentUsers = users.filter(u => u.role === UserRole.RESIDENT);
      setResidents(residentUsers);
      
      if (realPayments.length === 0) {
        setPayments([]);
      } else {
        const formattedPayments: Payment[] = realPayments.map(p => ({
          id: p.id,
          userName: p.profiles?.name || 'Desconhecido',
          neighborhoodName: hoodMap.get(p.profiles?.neighborhood_id || '') || 'Geral',
          amount: Number(p.amount),
          dueDate: p.due_date,
          status: p.status,
          plan: p.profiles?.plan === 'PREMIUM' ? 'Prêmio' : p.profiles?.plan === 'FAMILY' ? 'Família' : 'Padrão'
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

  // Carregar faturamento em tempo real do Mercado Pago via Proxy CORS seguro
  const fetchMPTransactions = async (tokenToUse?: string) => {
    const token = tokenToUse || mpToken;
    if (!token) return;

    setLoadingMP(true);
    try {
      // URL de busca de pagamentos do Mercado Pago
      const mpUrl = `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=50&access_token=${token}`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(mpUrl)}`;

      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Erro na conexão com o gateway do Mercado Pago.");
      const data = await response.json();

      if (data && data.results) {
        const users = await MockService.getUsers();
        
        const mapped: MPTransaction[] = data.results.map((item: any) => {
          const payerEmail = item.payer?.email?.trim().toLowerCase() || '';
          const payerName = `${item.payer?.first_name || ''} ${item.payer?.last_name || ''}`.trim() || 'Desconhecido';
          
          // Tentar encontrar morador no Atalaia usando o helper robusto (e-mail, metadata, nome ou telefone)
          const matchedUser = findMatchedUser(item, users);

          return {
            id: String(item.id),
            email: payerEmail,
            name: payerName,
            amount: Number(item.transaction_amount || 0),
            status: item.status || 'unknown',
            dateCreated: item.date_created,
            dateApproved: item.date_approved || null,
            matchedUserId: matchedUser ? matchedUser.id : null,
            matchedUserName: matchedUser ? matchedUser.name : null,
            matchedEmail: matchedUser ? matchedUser.email : null
          };
        });

        setMpTransactions(mapped);
      }
    } catch (e) {
      console.error("[FinancialAdmin] Erro ao carregar transações reais:", e);
    } finally {
      setLoadingMP(false);
    }
  };

  // Salvar credencial Mercado Pago no banco e atualizar estado
  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingToken(true);
    const croppedToken = mpToken.trim();

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'mercado_pago_access_token',
          value: croppedToken,
          description: 'Token de Produção do Mercado Pago para conciliação bancária'
        });

      if (error) throw error;
      
      localStorage.setItem('atalaia_mp_token', croppedToken);
      alert("Integração ativada! Token salvo de forma segura.");
      setShowConfig(false);
      fetchMPTransactions(croppedToken);
    } catch (error: any) {
      console.error("Error saving token:", error);
      localStorage.setItem('atalaia_mp_token', croppedToken);
      alert("Token salvo localmente no seu dispositivo.");
      setShowConfig(false);
      fetchMPTransactions(croppedToken);
    } finally {
      setSavingToken(false);
    }
  };

  // Conciliar pagamentos reais em lote de forma inteligente
  const handleSyncMercadoPago = async () => {
    const currentToken = await loadMpSettings();
    if (!currentToken) {
      setShowConfig(true);
      alert("Configure seu Access Token do Mercado Pago para realizar a conciliação automática.");
      return;
    }

    setSyncing(true);
    try {
      const mpUrl = `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=50&access_token=${currentToken}`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(mpUrl)}`;

      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Erro na solicitação de conciliação.");
      const data = await response.json();

      if (!data || !data.results || data.results.length === 0) {
        alert("Nenhum pagamento encontrado na sua conta do Mercado Pago.");
        setSyncing(false);
        return;
      }

      const users = await MockService.getUsers();
      const existingPayments = await MockService.getPayments();

      let matchedPaymentsCount = 0;
      let reconciledCount = 0;
      let newPaidGeneratedCount = 0;

      // Pegar apenas transações com status 'approved' (completadas)
      const approvedPayments = data.results.filter((p: any) => p.status === 'approved');

      for (const rawPay of approvedPayments) {
        // Buscar usuário do Atalaia usando o helper robusto
        const matchedUser = findMatchedUser(rawPay, users);
        if (!matchedUser) {
          console.warn("[reconcile] Não foi possível encontrar usuário correspondente para", rawPay.id, rawPay.payer?.email);
          continue;
        }

        matchedPaymentsCount++;

        // Obter data e mês de referência da cobrança (ex: "06/2026")
        const payDateStr = rawPay.date_approved || rawPay.date_created;
        const payDate = new Date(payDateStr);
        const refMonth = `${(payDate.getMonth() + 1).toString().padStart(2, '0')}/${payDate.getFullYear()}`;
        const amount = Number(rawPay.transaction_amount || 0);

        // Verificar se esse morador já tem faturamento para esse mês específico
        const matchedSystemPayment = existingPayments.find(p => 
          p.user_id === matchedUser.id && 
          p.reference_month === refMonth
        );

        if (matchedSystemPayment) {
          // Se já existe e está pendente, concilia para PAGO
          if (matchedSystemPayment.status !== 'PAID') {
            await MockService.updatePaymentStatus(matchedSystemPayment.id, 'PAID', payDate.toISOString());
            reconciledCount++;
          }
        } else {
          // Se não há fatura gerada para aquele mês, cria uma nova automaticamente já como PAGO
          await supabase
            .from('payments')
            .insert([{ 
                user_id: matchedUser.id, 
                amount, 
                due_date: new Date(payDate.getFullYear(), payDate.getMonth(), 10).toISOString().split('T')[0],
                payment_date: payDate.toISOString(),
                status: 'PAID',
                reference_month: refMonth
            }]);
          newPaidGeneratedCount++;
        }
      }

      alert(`CONCILIAÇÃO MERCADO PAGO CONCLUÍDA!\n\n` +
            `✅ ${matchedPaymentsCount} pagamentos identificados de moradores do Atalaia.\n` +
            `🔄 ${reconciledCount} faturas pendentes atualizadas para PAGO de forma instantânea.\n` +
            `⭐ ${newPaidGeneratedCount} novas mensalidades pagas lançadas diretamente no faturamento.`);
      
      await loadData();
      await fetchMPTransactions(currentToken);

    } catch (e: any) {
      console.error("[MP Sync Error]", e);
      alert(`Falha ao se comunicar com Mercado Pago: ${e.message || "Erro desconhecido"}`);
    } finally {
      setSyncing(false);
    }
  };

  // Conciliar manualmente um pagamento específico
  const handleManualReconcile = async (item: any, userId: string) => {
    if (!userId) return;
    const selectedRes = residents.find(r => r.id === userId);
    if (!selectedRes) return;

    if (!confirm(`Deseja vincular manualmente o pagamento de R$ ${Number(item.amount || 0).toFixed(2)} ao morador ${selectedRes.name}?`)) return;

    try {
      const payDateStr = item.dateApproved || item.dateCreated;
      const payDate = new Date(payDateStr);
      const refMonth = `${(payDate.getMonth() + 1).toString().padStart(2, '0')}/${payDate.getFullYear()}`;
      const amount = Number(item.amount || 0);

      // Carregar as faturas existentes do Atalaia
      const existingPayments = await MockService.getPayments();

      // Verificar se esse morador já tem faturamento para esse mês específico
      const matchedSystemPayment = existingPayments.find(p => 
        p.user_id === selectedRes.id && 
        p.reference_month === refMonth
      );

      if (matchedSystemPayment) {
        if (matchedSystemPayment.status !== 'PAID') {
          await MockService.updatePaymentStatus(matchedSystemPayment.id, 'PAID', payDate.toISOString());
        }
      } else {
        await supabase
          .from('payments')
          .insert([{ 
              user_id: selectedRes.id, 
              amount, 
              due_date: new Date(payDate.getFullYear(), payDate.getMonth(), 10).toISOString().split('T')[0],
              payment_date: payDate.toISOString(),
              status: 'PAID',
              reference_month: refMonth
          }]);
      }

      alert(`Sucesso! Pagamento vinculado a ${selectedRes.name}`);
      await loadData();
      await fetchMPTransactions();
    } catch (e: any) {
      console.error(e);
      alert("Erro ao vincular pagamento.");
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = await loadMpSettings();
      await loadData();
      if (token) {
        fetchMPTransactions(token);
      }
    };
    init();
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
        if (resident.plan === 'FAMILY') amount = 39.90;
        else if (resident.plan === 'PREMIUM') amount = 79.90;
        else amount = 39.90;

        await MockService.createPayment(resident.id, amount, dueDate, refMonth);
      }

      alert(`${residents.length} mensalidades geradas com sucesso no banco de dados!`);
      loadData();
    } catch (error) {
      console.error("Error generating invoices:", error);
      alert("Erro ao gerar mensalidades.");
    } finally {
      setLoading(false);
    }
  };

  // Tradução e formatação humana dos status do Mercado Pago
  const getMPStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge color="green">Pago</Badge>;
      case 'pending':
      case 'in_process':
        return <Badge color="yellow">Em Processo</Badge>;
      case 'rejected':
        return <Badge color="red">Recusado</Badge>;
      case 'cancelled':
        return <Badge color="red">Cancelado</Badge>;
      case 'refunded':
        return <Badge color="blue">Reembolsado</Badge>;
      default:
        return <Badge color={undefined}>Outro</Badge>;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              Painel Financeiro
              {mpToken && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-green-550/10 text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded-full uppercase font-black tracking-widest bg-emerald-950/20">
                  <UserCheck size={10} className="text-emerald-400" /> Mercado Pago Conectado
                </span>
              )}
            </h1>
            <p className="text-gray-400">Controle real de mensalidades, conciliação direta com Mercado Pago e adimplência.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              className="border-white/10 text-gray-300 hover:bg-white/5"
              onClick={() => setShowConfig(!showConfig)}
              disabled={loading}
            >
              <Key size={18} className="mr-2" />
              {mpToken ? 'Alterar Token' : 'Integrar MP'}
            </Button>
            <Button 
              variant="outline" 
              className="border-atalaia-neon/30 text-atalaia-neon hover:bg-atalaia-neon/10"
              onClick={handleSyncMercadoPago}
              disabled={syncing || loading}
            >
              <RefreshCw size={18} className={`mr-2 ${syncing ? 'animate-spin' : ''}`} /> 
              {syncing ? 'Sincronizando...' : 'Conciliar Mercado Pago'}
            </Button>
            <Button 
              variant="outline" 
              className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
              onClick={handleGenerateInvoices}
              disabled={loading}
            >
              <DollarSign size={18} className="mr-2" /> Gerar Planilha
            </Button>
          </div>
        </div>

        {/* Mercado Pago Token Card Config */}
        {showConfig && (
          <Card className="p-6 mb-8 border-t-4 border-atalaia-neon relative overflow-hidden bg-black">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-atalaia-neon/5 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-atalaia-neon/10 text-atalaia-neon"><ShieldCheck size={24} /></div>
              <div>
                <h3 className="text-lg font-bold text-white">Integração Direta com Mercado Pago</h3>
                <p className="text-xs text-gray-400">Insira seu Access Token de Produção para ler e dar baixa real de pagamentos.</p>
              </div>
            </div>
            <form onSubmit={handleSaveToken} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-2">Access Token (Produção ou Testes)</label>
                <input 
                  type="password" 
                  placeholder="Ex: APP_USR-87425..." 
                  className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-atalaia-neon outline-none transition-colors"
                  value={mpToken}
                  onChange={(e) => setMpToken(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={savingToken} className="bg-atalaia-neon text-black font-bold">
                  {savingToken ? 'Salvando...' : 'Salvar e Conectar'}
                </Button>
                <Button type="button" variant="outline" className="border-white/10 text-gray-400" onClick={() => setShowConfig(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-l-4 border-atalaia-neon">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Receita (Mês)</span>
              <DollarSign className="text-atalaia-neon" size={20} />
            </div>
            <div className="text-2xl font-bold text-white">R$ {stats.revenue.toFixed(2)}</div>
            <p className="text-[10px] text-green-500 mt-1 flex items-center gap-1">
              <CheckCircle2 size={10} /> Pagamentos reais e conciliados
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">A Vencer</span>
              <Clock className="text-yellow-500" size={20} />
            </div>
            <div className="text-2xl font-bold text-white">{stats.pending}</div>
            <p className="text-[10px] text-yellow-500/70 mt-1">Aguardando conciliação automática</p>
          </Card>

          <Card className="p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Vencidos</span>
              <AlertTriangle className="text-red-500" size={20} />
            </div>
            <div className="text-2xl font-bold text-white">{stats.overdue}</div>
            <p className="text-[10px] text-red-500/70 mt-1">Atraso ativo detectado</p>
          </Card>

          <Card className="p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Moradores</span>
              <User className="text-blue-500" size={20} />
            </div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-[10px] text-blue-500/70 mt-1">Base ativa cadastrada</p>
          </Card>
        </div>

        {/* Tabs Control */}
        <div className="flex gap-4 mb-6 border-b border-white/10 pb-px">
          <button
            onClick={() => setActiveTab('SYSTEM')}
            className={`pb-3 text-sm font-bold tracking-wide uppercase transition-all relative ${
              activeTab === 'SYSTEM' 
                ? 'text-atalaia-neon border-b-2 border-atalaia-neon' 
                : 'text-gray-500 hover:text-white'
            }`}
          >
            Faturamento do Sistema
          </button>
          
          <button
            onClick={() => setActiveTab('MERCADOPAGO')}
            disabled={!mpToken}
            className={`pb-3 text-sm font-bold tracking-wide uppercase transition-all relative flex items-center gap-2 ${
              !mpToken ? 'opacity-35 cursor-not-allowed' : ''
            } ${
              activeTab === 'MERCADOPAGO' 
                ? 'text-atalaia-neon border-b-2 border-atalaia-neon' 
                : 'text-gray-500 hover:text-white'
            }`}
            title={!mpToken ? 'Insira seu access token acima para habilitar esta visualização' : ''}
          >
            <CreditCard size={16} /> Feed Mercado Pago (Tempo Real)
          </button>
        </div>

        {activeTab === 'SYSTEM' ? (
          <>
            {/* Filters & Search */}
            <Card className="p-4 mb-6 bg-black border border-white/10">
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
                <div className="flex gap-2 flex-wrap">
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
                      {status === 'ALL' ? 'Todos' : status === 'PAID' ? 'Contribuído' : status === 'PENDING' ? 'A Vencer' : 'Vencidos'}
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
                        <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-3">
                            <RefreshCw size={24} className="animate-spin text-atalaia-neon" />
                            <span>Carregando dados financeiros...</span>
                          </div>
                        </td>
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
                              <div className="w-8 h-8 rounded-full bg-atalaia-neon/10 flex items-center justify-center text-atalaia-neon font-bold text-xs uppercase">
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
                          <td className="px-6 py-4 text-sm text-gray-400 font-mono">
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
                                   className="bg-green-600 hover:bg-green-500 text-[10px] h-7 px-2 font-bold"
                                   onClick={() => handleUpdateStatus(payment.id, 'PAID')}
                                 >
                                   MARCAR PAGO
                                 </Button>
                               )}
                               {payment.status === 'PAID' && (
                                 <Button 
                                   variant="outline"
                                   className="text-[10px] h-7 px-2 border-yellow-500/30 hover:bg-yellow-500/10 text-yellow-500"
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
          </>
        ) : (
          /* FEED MERCADO PAGO TEMPO REAL */
          <Card className="overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Lançamentos Diretos no Mercado Pago</h4>
                <p className="text-xs text-gray-400">Últimos 50 faturamentos registrados no gateway associados ou não ao Atalaia.</p>
              </div>
              <Button 
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5"
                onClick={() => fetchMPTransactions()}
                disabled={loadingMP}
              >
                <RefreshCw size={14} className={`mr-2 ${loadingMP ? 'animate-spin' : ''}`} /> Atualizar Transações
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">ID MP</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Payer Original (E-mail Mercado Pago)</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Valor Pago</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Criação / Aprovação</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Status Mercado Pago</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Vínculo de Cadastro (Atalaia)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loadingMP ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-3">
                          <RefreshCw size={24} className="animate-spin text-atalaia-neon" />
                          <span>Puxando dados reais do Mercado Pago API...</span>
                        </div>
                      </td>
                    </tr>
                  ) : mpTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                        Sem faturamento ou transações registradas no momento com esta chave.
                      </td>
                    </tr>
                  ) : (
                    mpTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-gray-400">
                          {tx.id}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="block text-sm font-medium text-white">{tx.name || "Sem Nome"}</span>
                            <span className="block text-xs font-mono text-gray-500 text-[10px] select-all">{tx.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-white text-sm">
                          R$ {tx.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                          <span className="block">Criado: {new Date(tx.dateCreated).toLocaleDateString('pt-BR')}</span>
                          {tx.dateApproved && (
                            <span className="block text-green-500 text-[10px]">Pago em: {new Date(tx.dateApproved).toLocaleDateString('pt-BR')}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getMPStatusBadge(tx.status)}
                        </td>
                        <td className="px-6 py-4">
                          {tx.matchedUserId ? (
                            <div className="inline-flex items-center gap-1 text-[11px] bg-green-500/10 text-green-400 px-2 py-1 rounded-lg border border-green-500/20">
                              <CheckCircle size={12} />
                              <span>{tx.matchedUserName}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <span className="inline-flex items-center gap-1 text-[10px] bg-white/5 text-gray-500 px-2 py-1 rounded-lg border border-white/5 w-fit">
                                <HelpCircle size={12} />
                                Não cadastrado / Sem correspondência automática
                              </span>
                              {residents.length > 0 && tx.status === 'approved' && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <select
                                    defaultValue=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleManualReconcile(tx, e.target.value);
                                        e.target.value = ""; // reset
                                      }
                                    }}
                                    className="bg-black border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-300 focus:border-atalaia-neon outline-none max-w-[170px]"
                                  >
                                    <option value="" disabled>Vincular a Morador...</option>
                                    {residents.map(r => (
                                      <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default FinancialAdmin;

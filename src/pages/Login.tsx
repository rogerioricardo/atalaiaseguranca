
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole, Neighborhood } from '../types';
import { Button, Input, Card } from '../components/UI';
import { ShieldCheck, ArrowLeft, AlertCircle, MapPin, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { MockService } from '../services/mockService';
import { PaymentService } from '../services/paymentService';

const Login: React.FC = () => {
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get('mode') === 'register');
  const planParam = searchParams.get('plan');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.RESIDENT);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState('');
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectingToPay, setRedirectingToPay] = useState(false);

  // Monitora se o usuário foi autenticado para redirecionar
  useEffect(() => {
    if (isAuthenticated && user) {
       console.log("[Login] Autenticação confirmada, navegando para dashboard...");
       navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
      const loadHoods = async () => {
          try {
              const hoods = await MockService.getNeighborhoods(false);
              setNeighborhoods(hoods);
              if (hoods.length > 0 && !selectedNeighborhoodId) {
                  setSelectedNeighborhoodId(hoods[0].id);
              }
          } catch (e) {
              console.error("Erro ao carregar bairros", e);
          }
      };
      loadHoods();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      if (isRegister) {
          if (!selectedNeighborhoodId && role !== UserRole.ADMIN) {
              throw new Error('Por favor, selecione seu bairro.');
          }
          
          await login(email, password, role, name, selectedNeighborhoodId, phone);

          if (planParam && (planParam === 'FAMILY' || planParam === 'PREMIUM')) {
              setRedirectingToPay(true);
              const checkoutUrl = await PaymentService.createPreference(planParam, email, name, phone);
              window.location.href = checkoutUrl;
              return; 
          }

          setSuccess('Cadastro realizado com sucesso!');
          setTimeout(() => navigate('/welcome'), 1000);
      } else {
          // Login via Supabase com Timeout de Segurança
          console.log("[Login] Iniciando tentativa de login para:", email);
          
          const loginPromise = login(email, password);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Tempo limite excedido. Verifique sua conexão ou tente novamente.')), 10000)
          );

          await Promise.race([loginPromise, timeoutPromise]);
          
          setSuccess('Acesso autorizado!');
          console.log("[Login] Login bem-sucedido, aguardando redirecionamento...");
          
          // O useEffect acima tratará o redirecionamento assim que o AuthContext atualizar
          // Se em 5 segundos não redirecionar, liberamos o botão para evitar travamento visual
          setTimeout(() => {
              setLoading(false);
          }, 5000);
      }
    } catch (err: any) {
        console.error("[Login] Erro capturado:", err);
        setError(err.message || 'Dados inválidos ou erro de conexão com o banco Atalaia.');
        setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#010101] relative overflow-hidden px-4 py-8">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-atalaia-neon/5 rounded-full blur-[120px]" />
      
      <Card className="w-full max-w-md p-8 border-atalaia-border relative z-10 bg-[#040404]">
        <button 
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 text-gray-500 hover:text-atalaia-neon transition-colors flex items-center gap-2 text-sm font-medium group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Voltar</span>
        </button>

        <div className="text-center mb-8 pt-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-atalaia-neon/10 text-atalaia-neon mb-4">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isRegister ? 'Criar Conta' : 'Acesso Atalaia'}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {isRegister ? 'Segurança colaborativa inteligente.' : 'Entre para monitorar sua comunidade.'}
          </p>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500 text-sm animate-in fade-in duration-300">
                <AlertCircle size={20} className="shrink-0" />
                <span>{error}</span>
            </div>
        )}

        {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 text-green-500 text-sm animate-in fade-in duration-300">
                <CheckCircle size={20} className="shrink-0" />
                <span>{success}</span>
            </div>
        )}

        {redirectingToPay ? (
            <div className="text-center py-8">
                <RefreshCw size={32} className="animate-spin text-atalaia-neon mx-auto mb-4" />
                <p className="text-white font-bold">Iniciando pagamento seguro...</p>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
                <>
                    <Input label="Nome Completo" placeholder="Seu Nome" value={name} onChange={(e) => setName(e.target.value)} required />
                    <Input label="WhatsApp" placeholder="+55 48 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </>
            )}

            <Input label="Email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Senha" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

            {isRegister && (
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin size={12} /> Bairro
                    </label>
                    <select 
                        className="w-full bg-black/50 border border-atalaia-border rounded-lg px-4 py-2.5 text-white focus:border-atalaia-neon focus:outline-none"
                        value={selectedNeighborhoodId}
                        onChange={(e) => setSelectedNeighborhoodId(e.target.value)}
                        required={role !== UserRole.ADMIN}
                    >
                        <option value="" disabled>Selecione seu bairro</option>
                        {neighborhoods.map(hood => (
                            <option key={hood.id} value={hood.id}>{hood.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <Button type="submit" className="w-full h-12 text-lg mt-6" disabled={loading || !!success || authLoading}>
                {(loading || authLoading) ? <><Loader2 className="animate-spin mr-2" /> Aguarde...</> : (isRegister ? 'Finalizar Cadastro' : 'Entrar no Sistema')}
            </Button>
            </form>
        )}

        <div className="mt-6 text-center">
            <button 
                onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
                className="text-sm text-gray-400 hover:text-atalaia-neon transition-colors"
                type="button"
                disabled={loading || authLoading}
            >
                {isRegister ? 'Já tem conta? Faça login' : 'Não tem conta? Crie agora'}
            </button>
        </div>
      </Card>
    </div>
  );
};

export default Login;


import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/context';
import { UserRole, Neighborhood } from '@/types';
import { Button, Input, Card } from '@/components/UI';
import { ShieldCheck, ArrowLeft, AlertCircle, MapPin, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { MockService } from '@/services/mockService';
import { PaymentService } from '@/services/paymentService';
import { SessionService } from '@/services/sessionService';
import { supabase, isRealSupabase } from '@/lib/supabaseClient';

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

  // States to audit concurrent session security
  const [showActiveSessionModal, setShowActiveSessionModal] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  // Recovery Password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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

  const handleSubmit = async (e?: React.FormEvent | boolean, forceBypass = false) => {
    let actualBypass = forceBypass;
    if (typeof e === 'boolean') {
      actualBypass = e;
    } else if (e) {
      e.preventDefault();
    }

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
          // Pre-emptively check for active concurrent sessions with a safety timeout
          if (!actualBypass) {
              try {
                  const checkPromise = SessionService.checkSessionsByEmail(email);
                  const raceTimeout = new Promise<any[]>((_, reject) => 
                      setTimeout(() => reject(new Error('timeout')), 3500)
                  );
                  const existingSess = await Promise.race([checkPromise, raceTimeout]);
                  if (existingSess && existingSess.length > 0) {
                      setActiveSessions(existingSess);
                      setShowActiveSessionModal(true);
                      setLoading(false);
                      return; // interrupt the login to display confirmation prompt
                  }
              } catch (sessError) {
                  console.warn("[Login] Could not pre-screen active sessions safely or timeout hit", sessError);
              }
          }

          // Login via Supabase com Timeout de Segurança
          console.log("[Login] Iniciando tentativa de login para:", email);
          
          const loginPromise = login(email, password);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Tempo limite excedido. Verifique sua conexão ou tente novamente.')), 20000)
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

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, informe seu e-mail ou WhatsApp cadastrado.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const inputStr = email.trim();

      // Se estiver rodando sem banco de dados configurado (Conexão Local de Demonstração Dev):
      if (!isRealSupabase) {
        setSuccess(`[Simulador] Solicitação de recuperação processada via ambiente de demonstração! Instruções enviadas de forma segura.`);
        setResetSent(true);
        setLoading(false);
        return;
      }

      let targetEmail = '';
      let targetPhone = '';
      let userName = '';
      let foundProfile: any = null;

      if (inputStr.includes('@')) {
        targetEmail = inputStr.toLowerCase();
        // Buscar perfil para ver se tem WhatsApp cadastrado de forma clássica
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', targetEmail)
          .maybeSingle();
        if (profile) {
          foundProfile = profile;
          targetPhone = profile.phone || '';
          userName = profile.name || '';
        }
      } else {
        // Tratar como possível telefone digitado pelo usuário
        const cleanPhone = inputStr.replace(/\D/g, '');
        if (cleanPhone.length < 8) {
          throw new Error('Por favor, insira um e-mail válido ou o número do seu WhatsApp com DDD.');
        }

        // Buscar todos os perfis para localizar de forma resiliente, ignorando diferenças de formato
        const { data: profiles, error: queryErr } = await supabase
          .from('profiles')
          .select('*');

        if (queryErr) throw queryErr;

        const matchedProfile = (profiles || []).find((p: any) => {
          if (!p.phone) return false;
          const cleanDbPhone = p.phone.replace(/\D/g, '');
          // Correspondência idêntica ou correspondência nos últimos 8 caracteres para ser imune a prefixo internacional ou DDD digitado diferente
          return cleanDbPhone === cleanPhone ||
                 (cleanDbPhone.length >= 8 && cleanPhone.endsWith(cleanDbPhone.slice(-8))) ||
                 (cleanPhone.length >= 8 && cleanDbPhone.endsWith(cleanPhone.slice(-8)));
        });

        if (!matchedProfile) {
          throw new Error('Nenhum cadastro com esse número de WhatsApp foi localizado no sistema Atalaia.');
        }

        foundProfile = matchedProfile;
        targetEmail = matchedProfile.email || '';
        targetPhone = matchedProfile.phone || '';
        userName = matchedProfile.name || '';
      }

      if (!targetEmail) {
        throw new Error('Não conseguimos identificar um e-mail cadastrado associado a essa conta de acesso.');
      }

      // Dispara o reset via Auth do Supabase por segurança
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${window.location.origin}/#/reset-password`
      });
      if (resetError) throw resetError;

      // Ofuscar e-mail para feedback visual seguro
      const obscureEmail = (emailStr: string) => {
        const parts = emailStr.split('@');
        if (parts.length !== 2) return emailStr;
        const u = parts[0];
        const d = parts[1];
        if (u.length <= 3) return `${u[0]}***@${d}`;
        return `${u.slice(0, 2)}***${u.slice(-1)}@${d}`;
      };

      const obscured = obscureEmail(targetEmail);
      let waStatus = '';

      // Tenta enviar o WhatsApp via função oficial de disparo de alertas
      if (targetPhone) {
        try {
          const customMsg = `🛡️ *ATALAIA - RECUPERAÇÃO DE ACESSO*\n\nOlá, *${userName || 'Colaborador Atalaia'}*!\n\nRecebemos uma solicitação de redefinição de senha para sua credencial de acesso tático ao Atalaia.\n\nEnviamos o link de alteração de senha de forma segura para o seu e-mail:\n➡️ *${targetEmail}*\n\nSe você não recebeu o e-mail ou precisa que alteremos seu e-mail de acesso cadastrado, basta responder a esta mensagem diretamente no WhatsApp!\n\nAtenciosamente,\n*Equipe de Suporte Atalaia*`;

          await supabase.functions.invoke('send-alert', {
            body: { message: customMsg, numbers: [targetPhone] }
          });

          waStatus = ` E notificamos seu WhatsApp (${targetPhone})!`;
        } catch (waErr) {
          console.error('[ForgotPassword] Failed to send WhatsApp alert:', waErr);
        }
      }

      setSuccess(`Solicitação processada! Código e link enviados com sucesso para ${obscured}.${waStatus}`);
      setResetSent(true);
    } catch (err: any) {
      console.error('[ForgotPassword] Error:', err);
      setError(err.message || 'Erro ao processar sua solicitação de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#010101] relative overflow-hidden px-4 py-8">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-atalaia-neon/5 rounded-full blur-[120px]" />
      
      <Card className="w-full max-w-md p-8 border-atalaia-border relative z-10 bg-[#040404]">
        <button 
          onClick={() => {
            if (isForgotPassword) {
              setIsForgotPassword(false);
              setResetSent(false);
              setError('');
              setSuccess('');
            } else {
              navigate('/');
            }
          }}
          className="absolute top-6 left-6 text-gray-500 hover:text-atalaia-neon transition-colors flex items-center gap-2 text-sm font-medium group text-left"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Voltar</span>
        </button>

        <div className="text-center mb-8 pt-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-atalaia-neon/10 text-atalaia-neon mb-4">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isForgotPassword ? 'Recuperar Acesso' : isRegister ? 'Criar Conta' : 'Acesso Atalaia'}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {isForgotPassword 
              ? 'Digite seu e-mail ou WhatsApp (DDD+número) para receber as instruções de recuperação.' 
              : isRegister 
                ? 'Segurança colaborativa inteligente.' 
                : 'Entre para monitorar sua comunidade.'}
          </p>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex flex-col gap-2 text-red-500 text-sm animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                    <AlertCircle size={20} className="shrink-0" />
                    <span>{error}</span>
                </div>
                {error.includes('fetch') && (
                    <div className="mt-2 p-2 bg-black/40 rounded text-xs text-amber-500 border border-amber-500/20">
                        <strong>Dica:</strong> Para logar utilizando perfis locais pré-configurados:<br/>
                        Email: <code className="bg-white/10 px-1 rounded text-white">admin@atalaia.com</code><br/>
                        Senha: <code className="bg-white/10 px-1 rounded text-white">admin123</code>
                    </div>
                )}
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
        ) : isForgotPassword ? (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                <Input 
                    label="E-mail ou WhatsApp Cadastrado" 
                    type="text" 
                    placeholder="ex: rogerio@gmail.com ou 48999999999" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
                
                <Button type="submit" className="w-full h-12 text-sm uppercase tracking-wider font-bold mt-6" disabled={loading || resetSent}>
                    {loading ? <><Loader2 className="animate-spin mr-2" /> Enviando...</> : 'Enviar Link & WhatsApp'}
                </Button>

                <div className="text-center mt-4">
                    <button 
                        type="button"
                        onClick={() => {
                            setIsForgotPassword(false);
                            setResetSent(false);
                            setError('');
                            setSuccess('');
                        }}
                        className="text-xs text-atalaia-neon hover:underline transition-colors bg-transparent border-none p-0 cursor-pointer"
                    >
                        Voltar para a tela de login
                    </button>
                </div>
            </form>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
                <>
                    <Input label="Nome Completo" placeholder="Seu Nome" value={name} onChange={(e) => setName(e.target.value)} required />
                    <Input label="WhatsApp" placeholder="+55 48 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    
                    <div className="space-y-2 mb-4">
                        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck size={12} /> Tipo de Acesso
                        </label>
                        <select 
                            className="w-full bg-black/55 border border-zinc-850 rounded-lg px-4 py-2.5 text-white focus:border-atalaia-neon focus:outline-none"
                            value={role}
                            onChange={(e) => setRole(e.target.value as UserRole)}
                            required
                        >
                            <option value={UserRole.RESIDENT}>Morador (Residencial)</option>
                            <option value={UserRole.INTEGRATOR}>Integrador (Gestor de Bairro)</option>
                            <option value={UserRole.SCR}>SCR (Equipe de Apoio)</option>
                        </select>
                    </div>
                </>
            )}

            <Input 
                label="Email" 
                type="email" 
                placeholder="seu@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
            />
            
            <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Senha</label>
                    {!isRegister && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsForgotPassword(true);
                                setError('');
                                setSuccess('');
                            }}
                            className="text-xs text-atalaia-neon/80 hover:text-atalaia-neon transition-colors font-medium bg-transparent border-none p-0 cursor-pointer focus:outline-none"
                        >
                            Esqueci minha senha
                        </button>
                    )}
                </div>
                <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    minLength={6} 
                />
            </div>

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

            <Button type="submit" className="w-full h-12 text-sm uppercase tracking-wider font-bold mt-6" disabled={loading || !!success || authLoading}>
                {(loading || authLoading) ? <><Loader2 className="animate-spin mr-2" /> Validando credenciais...</> : (isRegister ? 'Finalizar Cadastro' : 'Entrar no Sistema')}
            </Button>
            </form>
        )}

        {!isForgotPassword && (
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
        )}
      </Card>

      {/* POPUP DE AVISO CONEXÃO ATIVA (SEGUNDO USUÁRIO) */}
      {showActiveSessionModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
              <div className="w-full max-w-md bg-zinc-950 border border-amber-500/35 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                  <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 mb-1 animate-pulse">
                          <AlertCircle size={32} />
                      </div>
                      <div className="absolute inset-x-0 -bottom-2 flex justify-center">
                          <span className="px-2 py-0.5 bg-amber-500 text-[9px] font-black uppercase text-black tracking-widest rounded-sm font-sans">ATIVO</span>
                      </div>
                  </div>

                  <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-3 font-sans">Conta em Uso</h3>
                  
                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                      Esta conta já possui uma sessão de monitoramento ativa em outro dispositivo. Para preservar a segurança e o controle dos alertas, o uso de sessões simultâneas é limitado.
                  </p>

                  <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl mb-6 text-left w-full text-xs text-zinc-400 space-y-2">
                       <span className="text-[10px] uppercase font-bold text-amber-500 font-mono tracking-wider block">Dispositivo Conectado Encontrado:</span>
                       {activeSessions.map((s, idx) => (
                           <div key={idx} className="bg-black/30 p-2.5 rounded border border-white/5 font-mono text-[10px] space-y-1">
                                <div className="flex justify-between text-white font-bold text-[11px]">
                                     <span>{s.os} &bull; {s.browser}</span>
                                     <span className="text-[8px] text-amber-500">● ATIVO AGORA</span>
                                </div>
                                <div className="flex justify-between text-zinc-500 text-[9px]">
                                     <span>IP: {s.ipAddress}</span>
                                     <span>Conectado em: {new Date(s.createdAt).toLocaleTimeString('pt-BR')}</span>
                                </div>
                           </div>
                       ))}
                  </div>

                  <p className="text-[10px] text-zinc-500 leading-normal mb-6">
                      Ao clicar em <strong>"Desconectar Outro & Entrar"</strong>, o outro dispositivo será deslogado de forma instantânea e você assumirá o controle das câmeras.
                  </p>

                  <div className="grid grid-cols-2 gap-3 w-full">
                      <button
                          type="button"
                          onClick={() => {
                              setShowActiveSessionModal(false);
                              setLoading(false);
                          }}
                          className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all border border-white/5"
                      >
                          Cancelar
                      </button>
                      <button
                          type="button"
                          onClick={() => {
                              setShowActiveSessionModal(false);
                              handleSubmit(true); // Força bypass e loga
                          }}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                      >
                          Derrubar & Entrar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Login;

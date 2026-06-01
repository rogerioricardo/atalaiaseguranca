
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/context';
import { ShieldCheck, AlertTriangle, Eye, Lock, HeartHandshake, CheckCircle, Scan, Check } from 'lucide-react';
import { Button, Card } from '../components/UI';
import { FacialBiometricService } from '@/services/facialBiometricService';
import { FacialScannerModal } from '@/components/FacialScannerModal';

const Welcome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasBiometrics, setHasBiometrics] = useState<boolean | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      FacialBiometricService.getBiometricsForUser(user.id).then((data) => {
        setHasBiometrics(!!data);
      });
    }
  }, [user?.id]);

  const handleAgree = () => {
    // Aqui poderíamos salvar no banco que o usuário aceitou os termos
    navigate('/dashboard');
  };

  const handleEnrollSuccess = () => {
    setHasBiometrics(true);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-atalaia-neon/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl w-full relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-atalaia-neon/10 text-atalaia-neon mb-6 border border-atalaia-neon/20 shadow-[0_0_30px_rgba(0,255,102,0.15)]">
                <ShieldCheck size={48} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Bem-vindo à Rede, <span className="text-atalaia-neon">{user?.name}</span>.
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
                Você agora faz parte do sistema <strong>ATALAIA</strong>. Sua presença fortalece a segurança de todo o bairro.
            </p>
        </div>

        <Card className="p-8 bg-[#0a0a0a] border-atalaia-border/50 shadow-2xl mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-widest border-b border-white/5 pb-4">
                <AlertTriangle className="text-yellow-500" size={20} />
                Protocolos de Conduta & Responsabilidade
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#111] p-5 rounded-xl border border-white/5 hover:border-atalaia-neon/30 transition-colors">
                    <div className="flex items-center gap-3 mb-3 text-red-400">
                        <AlertTriangle size={24} />
                        <h3 className="font-bold text-sm uppercase">O Botão de Pânico é Sagrado</h3>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Nunca acione alertas de PÂNICO ou PERIGO por brincadeira. 
                        <strong>Trotes resultam em banimento imediato e permanente.</strong> 
                        Lembre-se: seus vizinhos podem parar o que estão fazendo para te ajudar.
                    </p>
                </div>

                <div className="bg-[#111] p-5 rounded-xl border border-white/5 hover:border-atalaia-neon/30 transition-colors">
                    <div className="flex items-center gap-3 mb-3 text-blue-400">
                        <Eye size={24} />
                        <h3 className="font-bold text-sm uppercase">Guardião, não Espião</h3>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        O monitoramento serve para proteção externa. Respeite a privacidade alheia. 
                        Não compartilhe imagens de vizinhos ou suas rotinas fora do contexto de segurança.
                    </p>
                </div>

                <div className="bg-[#111] p-5 rounded-xl border border-white/5 hover:border-atalaia-neon/30 transition-colors">
                    <div className="flex items-center gap-3 mb-3 text-green-400">
                        <HeartHandshake size={24} />
                        <h3 className="font-bold text-sm uppercase">Espírito Colaborativo</h3>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Ao ver um alerta, mantenha a calma. Se puder ajudar sem se colocar em risco, ajude. 
                        Caso contrário, acione as autoridades (190) imediatamente pelo aplicativo.
                    </p>
                </div>

                <div className="bg-[#111] p-5 rounded-xl border border-white/5 hover:border-atalaia-neon/30 transition-colors">
                    <div className="flex items-center gap-3 mb-3 text-gray-300">
                        <Lock size={24} />
                        <h3 className="font-bold text-sm uppercase">Segurança da Conta</h3>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Você é responsável por qualquer ação realizada através do seu usuário. 
                        Não compartilhe sua senha. Se perder o celular, avise o administrador do seu bairro.
                    </p>
                </div>
            </div>
        </Card>

        {/* SEÇÃO DE INTEGRAÇÃO BIOMÉTRICA DE BOAS-VINDAS */}
        <Card className="p-8 bg-[#0a0a0a] border-atalaia-border/50 shadow-2xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-atalaia-neon/5 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest border-b border-white/5 pb-4 font-sans">
            <Scan className="text-atalaia-neon animate-pulse shrink-0" size={20} />
            Configuração de Segurança: Biometria Facial
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-sans">
            O sistema Atalaia permite o login rápido e o envio de alertas de pânico imediatos utilizando o reconhecimento facial. Seus dados biométricos são convertidos em uma assinatura matemática criptografada de 15 relações angulares e armazenados com segurança integrada no banco de dados.
          </p>

          {hasBiometrics ? (
            <div className="p-5 bg-green-500/5 border border-green-500/20 rounded-xl flex items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-500/10 text-green-400 rounded-lg shrink-0">
                  <Check size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-sans">Assinatura Biométrica Ativa</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-sans">Seu rosto foi mapeado e associado de forma única ao seu perfil no banco de dados.</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black uppercase rounded-lg tracking-wider font-sans shrink-0">ATIVO</span>
            </div>
          ) : (
            <div className="p-5 bg-zinc-950 border border-white/5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h4 className="text-sm font-bold text-zinc-300 font-sans">Você ainda não cadastrou sua biometria</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5 font-sans">Registre sua face para habilitar o acionamento tático rápido pelo navegador ou login sem senha.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEnrollModal(true)}
                className="bg-atalaia-neon text-black font-black hover:bg-atalaia-neon/90 hover:shadow-[0_0_20px_rgba(15,250,156,0.3)] text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition-all flex items-center gap-2 shrink-0 self-start md:self-auto font-sans"
              >
                <Scan size={14} />
                <span>Cadastrar Rosto Agora</span>
              </button>
            </div>
          )}
        </Card>

        <div className="text-center">
            <p className="text-sm text-gray-500 mb-6 italic">
                "A segurança da nossa rua começa na consciência de cada um."
            </p>
            <Button 
                onClick={handleAgree} 
                className="w-full md:w-auto px-12 py-4 text-lg font-bold shadow-[0_0_30px_rgba(0,255,102,0.3)] hover:shadow-[0_0_50px_rgba(0,255,102,0.5)] transition-all duration-300 transform hover:-translate-y-1"
            >
                <CheckCircle className="mr-2" /> Concordo e Assumo o Compromisso
            </Button>
        </div>

      </div>

      <FacialScannerModal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          mode="enroll"
          userId={user?.id}
          onSuccess={handleEnrollSuccess}
      />
    </div>
  );
};

export default Welcome;

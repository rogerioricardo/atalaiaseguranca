
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertTriangle, Eye, Lock, HeartHandshake, CheckCircle } from 'lucide-react';
import { Button, Card } from '../components/UI';

const Welcome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAgree = () => {
    // Aqui poderíamos salvar no banco que o usuário aceitou os termos
    navigate('/dashboard');
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
    </div>
  );
};

export default Welcome;

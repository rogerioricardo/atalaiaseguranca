
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowLeft, AlertTriangle, FileText } from 'lucide-react';
import { Button, Card } from '../components/UI';

const Terms: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" onClick={() => navigate(user ? '/dashboard' : '/')} className="mb-8 text-xs">
            <ArrowLeft size={14} className="mr-2" /> {user ? 'Voltar ao Painel' : 'Voltar ao Início'}
        </Button>

        <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="text-atalaia-neon" size={40} />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Termos de Serviço</h1>
        </div>

        <Card className="p-8 bg-[#111] border-white/10 space-y-8">
            <section>
                <h2 className="text-xl font-bold text-white mb-4">1. Aceitação dos Termos</h2>
                <p className="text-sm leading-relaxed">
                    Ao criar uma conta e utilizar o sistema <strong>Atalaia - Segurança Colaborativa</strong>, você concorda em cumprir estes termos. 
                    A plataforma é uma ferramenta tecnológica de auxílio mútuo e monitoramento comunitário, não substituindo o serviço oficial de segurança pública (Polícia Militar, Civil ou Guarda Municipal).
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">2. Uso Responsável do Botão de Pânico</h2>
                <div className="bg-red-900/10 border-l-4 border-red-500 p-4 mb-4">
                    <p className="text-sm text-red-200 flex items-start gap-2">
                        <AlertTriangle className="shrink-0" size={18} />
                        <strong>Atenção:</strong> O acionamento falso ou "trote" dos botões de Pânico, Perigo ou Suspeita resultará no banimento imediato e permanente da conta.
                    </p>
                </div>
                <p className="text-sm leading-relaxed">
                    O usuário compromete-se a utilizar os alertas apenas em situações reais de risco, emergência médica ou atividade suspeita comprovada. 
                    Você entende que seu alerta notifica vizinhos e operadores, mobilizando pessoas reais.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">3. Privacidade e Câmeras</h2>
                <p className="text-sm leading-relaxed mb-2">
                    O acesso às câmeras é concedido estritamente para fins de segurança patrimonial e comunitária. É <strong>estritamente proibido</strong>:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 ml-2 text-gray-400">
                    <li>Gravar ou tirar prints de vizinhos para fins de fofoca, bullying ou perseguição.</li>
                    <li>Divulgar imagens internas do sistema em redes sociais públicas sem autorização.</li>
                    <li>Utilizar o sistema para monitorar a rotina de terceiros de forma invasiva.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">4. Limitação de Responsabilidade</h2>
                <p className="text-sm leading-relaxed">
                    O Atalaia é um software de comunicação e visualização. Nós <strong>não garantimos</strong> a prevenção de crimes, nem nos responsabilizamos por falhas de internet, falta de energia ou indisponibilidade de câmeras que impeçam o monitoramento. 
                    A segurança física é responsabilidade das autoridades competentes.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">5. Planos e Pagamentos</h2>
                <p className="text-sm leading-relaxed">
                    Os planos (Família e Prêmio) são assinaturas mensais processadas via Mercado Pago. O cancelamento pode ser feito a qualquer momento, interrompendo o acesso aos recursos premium ao final do ciclo vigente. 
                    O plano Gratuito pode ter recursos limitados ou ser descontinuado mediante aviso prévio.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">6. Modificações</h2>
                <p className="text-sm leading-relaxed">
                    Reservamo-nos o direito de alterar estes termos a qualquer momento. O uso contínuo do sistema após as alterações constitui aceitação dos novos termos.
                </p>
            </section>
        </Card>

        <div className="mt-8 text-center text-xs text-gray-500">
            Última atualização: Dezembro de 2025
        </div>
      </div>
    </div>
  );
};

export default Terms;

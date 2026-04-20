
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, ArrowLeft, Eye, MapPin, MessageSquare } from 'lucide-react';
import { Button, Card } from '../components/UI';

const Privacy: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" onClick={() => navigate(user ? '/dashboard' : '/')} className="mb-8 text-xs">
            <ArrowLeft size={14} className="mr-2" /> {user ? 'Voltar ao Painel' : 'Voltar ao Início'}
        </Button>

        <div className="flex items-center gap-3 mb-8">
            <Lock className="text-atalaia-neon" size={40} />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Política de Privacidade</h1>
        </div>

        <Card className="p-8 bg-[#111] border-white/10 space-y-8">
            <p className="text-sm text-gray-400">
                Sua privacidade é fundamental para a segurança. Esta política descreve como o <strong>Atalaia</strong> coleta, usa e protege suas informações.
            </p>

            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Eye size={20} className="text-blue-500"/> 1. Coleta de Dados
                </h2>
                <p className="text-sm leading-relaxed mb-2">
                    Para o funcionamento do sistema de segurança colaborativa, coletamos:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 ml-2 text-gray-400">
                    <li><strong>Dados de Identificação:</strong> Nome, E-mail e Telefone (WhatsApp).</li>
                    <li><strong>Dados de Localização:</strong> Latitude, Longitude e Endereço para plotagem no Mapa Comunitário.</li>
                    <li><strong>Registros de Uso:</strong> Logs de alertas acionados, mensagens no chat e acessos ao sistema.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <MapPin size={20} className="text-red-500"/> 2. Uso da Geolocalização
                </h2>
                <p className="text-sm leading-relaxed">
                    Sua localização é utilizada para:
                    <br/> a) Mostrar sua posição no Mapa Comunitário para seus vizinhos (apenas do mesmo bairro).
                    <br/> b) Calcular a distância das câmeras para liberar acesso no Plano Família.
                    <br/> c) Enviar alertas geolocalizados em caso de emergência.
                    <br/> Você pode alterar ou remover sua localização nas configurações de perfil a qualquer momento.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <MessageSquare size={20} className="text-green-500"/> 3. Integração com WhatsApp
                </h2>
                <p className="text-sm leading-relaxed">
                    Utilizamos seu número de telefone para enviar notificações urgentes (Pânico, Suspeita) via API do WhatsApp. 
                    Ao se cadastrar, você consente em receber essas mensagens automáticas. Seu número não é compartilhado com terceiros para fins de marketing.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">4. Compartilhamento de Dados</h2>
                <p className="text-sm leading-relaxed">
                    Seus dados (Nome, Endereço e Telefone) são visíveis para:
                    <br/> - O Administrador do Sistema.
                    <br/> - O Integrador responsável pelo seu bairro.
                    <br/> - O SCR (Motovigia) em caso de ocorrências ou rondas.
                    <br/> - Outros moradores do seu bairro (apenas Nome e Localização no mapa).
                    <br/> <strong>Não vendemos seus dados para empresas de publicidade.</strong>
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">5. Segurança</h2>
                <p className="text-sm leading-relaxed">
                    Utilizamos criptografia padrão de mercado e servidores seguros (Supabase) para armazenar suas informações. 
                    No entanto, nenhum sistema é 100% inviolável. Recomendamos o uso de senhas fortes e não compartilhamento de credenciais.
                </p>
            </section>
        </Card>

        <div className="mt-8 text-center text-xs text-gray-500">
            Dúvidas? Entre em contato via contato@atalaia.com.br
        </div>
      </div>
    </div>
  );
};

export default Privacy;

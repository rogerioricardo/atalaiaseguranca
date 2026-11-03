
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/context';
import { 
    ShieldCheck, Users, Video, Bell, MessageCircle, MapPin, 
    Smartphone, CreditCard, Lock, ArrowLeft, Star, 
    AlertTriangle, CheckCircle, FileText, Menu, X, Download, BookOpen, Sparkles
} from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { IntegratorManualModal } from '../components/IntegratorManualModal';
import { generateIntegratorPdf } from '../utils/integratorPdfGenerator';

const Documentation: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    const handleDownloadPdf = async () => {
        setDownloadingPdf(true);
        try {
            await generateIntegratorPdf({
                integratorName: user?.name,
                companyName: user?.companyName,
                companyCnpj: user?.cnpj,
                phone: user?.phone
            });
        } catch (err: any) {
            console.error(err);
            alert('Erro ao gerar PDF: ' + err.message);
        } finally {
            setDownloadingPdf(false);
        }
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setMobileMenuOpen(false);
        }
    };

    const sections = [
        { id: 'intro', label: 'Introdução', icon: ShieldCheck },
        { id: 'plans', label: 'Planos e Regras', icon: CreditCard },
        { id: 'residents', label: 'Para Moradores', icon: Users },
        { id: 'cameras', label: 'Câmeras e Privacidade', icon: Video },
        { id: 'alerts', label: 'Sistema de Alertas', icon: Bell },
        { id: 'whatsapp', label: 'Integração WhatsApp', icon: MessageCircle },
        { id: 'scr', label: 'Módulo Tático (SCR)', icon: Star },
        { id: 'integrator', label: 'Para Integradores', icon: Lock },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-gray-300 font-sans">
            {/* Header Mobile */}
            <div className="lg:hidden fixed top-0 left-0 w-full bg-[#0a0a0a] border-b border-white/10 z-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="text-atalaia-neon" size={24} />
                    <span className="font-bold text-white">Manual Atalaia</span>
                </div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            <div className="flex pt-16 lg:pt-0">
                {/* Sidebar Navigation */}
                <aside className={`
                    fixed lg:sticky top-16 lg:top-0 left-0 h-[calc(100vh-64px)] lg:h-screen w-64 bg-[#0a0a0a] border-r border-white/10 z-40
                    transform transition-transform duration-300 ease-in-out overflow-y-auto
                    ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <div className="p-6 hidden lg:block">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-8 h-8 bg-atalaia-neon rounded flex items-center justify-center text-black">
                                <FileText size={20} />
                            </div>
                            <h1 className="font-bold text-xl text-white">Documentação</h1>
                        </div>
                        <Button variant="outline" onClick={() => navigate(user ? '/dashboard' : '/')} className="w-full text-xs mb-6">
                            <ArrowLeft size={14} className="mr-2" /> {user ? 'Voltar ao Painel' : 'Voltar ao Site'}
                        </Button>
                    </div>

                    <nav className="px-4 pb-6 space-y-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                            >
                                <section.icon size={18} className="text-atalaia-neon" />
                                {section.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 lg:p-12 max-w-5xl mx-auto space-y-16">
                    
                    {/* Intro */}
                    <section id="intro" className="animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-4xl font-bold text-white mb-6">Bem-vindo ao Ecossistema Atalaia</h2>
                        <p className="text-lg leading-relaxed mb-6">
                            O Atalaia não é apenas um aplicativo de câmeras; é uma plataforma de <strong>Segurança Colaborativa</strong>. 
                            Nosso objetivo é conectar vizinhos, tecnologias de monitoramento e equipes táticas em uma única rede de proteção.
                        </p>
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="p-5 bg-[#111] border-l-4 border-atalaia-neon">
                                <h3 className="font-bold text-white mb-2">Colaborativo</h3>
                                <p className="text-sm">A segurança é feita por todos. Um alerta seu avisa todos os vizinhos instantaneamente.</p>
                            </Card>
                            <Card className="p-5 bg-[#111] border-l-4 border-blue-500">
                                <h3 className="font-bold text-white mb-2">Inteligente</h3>
                                <p className="text-sm">Filtros geográficos, integração com WhatsApp e níveis de acesso baseados em planos.</p>
                            </Card>
                            <Card className="p-5 bg-[#111] border-l-4 border-atalaia-neon">
                                <h3 className="font-bold text-white mb-2">Tático</h3>
                                <p className="text-sm">Suporte para motovigias (SCR) com painel exclusivo de rondas e ocorrências.</p>
                            </Card>
                        </div>
                    </section>

                    {/* Plans */}
                    <section id="plans" className="border-t border-white/10 pt-12">
                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                            <CreditCard className="text-atalaia-neon" /> Planos e Níveis de Acesso
                        </h2>
                        <p className="mb-6">O sistema possui regras claras de acesso às câmeras baseadas no plano escolhido.</p>
                        
                        <div className="space-y-6">
                            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white">Plano Gratuito</h3>
                                    <Badge color="blue">Básico</Badge>
                                </div>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Recebe notificações no WhatsApp.</li>
                                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Pode acionar o botão de Pânico.</li>
                                    <li className="flex items-center gap-2 text-red-400"><X size={16} /> <strong>Sem acesso às câmeras.</strong></li>
                                </ul>
                            </div>

                            <div className="bg-[#0f1a12] p-6 rounded-xl border border-atalaia-neon/30">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white">Plano Família</h3>
                                    <Badge color="green">Recomendado</Badge>
                                </div>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-atalaia-neon"/> Tudo do plano gratuito.</li>
                                    <li className="flex items-center gap-2 bg-atalaia-neon/10 p-2 rounded">
                                        <MapPin size={16} className="text-atalaia-neon"/> 
                                        <strong>Regra de Câmeras:</strong> Você tem acesso às <strong>3 câmeras mais próximas</strong> da sua casa.
                                        <br/><span className="text-xs text-gray-400 ml-6">Necessário configurar seu endereço no Perfil.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-[#0f1a12] p-6 rounded-xl border border-atalaia-neon/50">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-white">Plano Prêmio</h3>
                                    <Badge color="green">VIP</Badge>
                                </div>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-atalaia-neon"/> <strong>Acesso Total:</strong> Vê todas as câmeras do bairro.</li>
                                    <li className="flex items-center gap-2"><CheckCircle size={16} className="text-atalaia-neon"/> Solicitação de Escolta e Rondas Extras ao SCR.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Residents */}
                    <section id="residents" className="border-t border-white/10 pt-12">
                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                            <Users className="text-atalaia-neon" /> Guia do Morador
                        </h2>
                        
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">1. Cadastro e Vínculo</h3>
                                <p className="text-sm text-gray-400 mb-2">
                                    Ao se cadastrar, você seleciona seu Bairro. Você será vinculado automaticamente a este grupo.
                                    Para mudar de bairro, é necessário solicitar ao Administrador.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">2. Configurando o Perfil (Importante!)</h3>
                                <p className="text-sm text-gray-400 mb-2">
                                    Para aparecer no Mapa Comunitário e para que o sistema calcule quais câmeras estão perto de você (Plano Família),
                                    vá em <strong>Meu Perfil</strong> e preencha sua Latitude e Longitude.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Alerts */}
                    <section id="alerts" className="border-t border-white/10 pt-12">
                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                            <Bell className="text-atalaia-neon" /> Tipos de Alerta
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                                <h4 className="text-red-500 font-bold flex items-center gap-2"><AlertTriangle/> PÂNICO</h4>
                                <p className="text-xs mt-2">Use em emergências reais (invasão, assalto). Aciona sirenes (se houver), notifica todos os vizinhos e chama o SCR.</p>
                            </div>
                            <div className="p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
                                <h4 className="text-yellow-500 font-bold flex items-center gap-2"><ShieldCheck/> SUSPEITA</h4>
                                <p className="text-xs mt-2">Ao clicar, o sistema abre sua câmera para tirar uma foto do suspeito ou veículo. Envia a foto no chat.</p>
                            </div>
                            <div className="p-4 bg-orange-900/20 border border-orange-500/50 rounded-lg">
                                <h4 className="text-orange-500 font-bold flex items-center gap-2"><AlertTriangle/> PERIGO</h4>
                                <p className="text-xs mt-2">Para situações de risco iminente (incêndio, acidente grave).</p>
                            </div>
                            <div className="p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
                                <h4 className="text-green-500 font-bold flex items-center gap-2"><CheckCircle/> ESTOU BEM</h4>
                                <p className="text-xs mt-2">Para avisar que chegou bem em casa ou que um alarme foi falso.</p>
                            </div>
                        </div>
                    </section>

                    {/* WhatsApp */}
                    <section id="whatsapp" className="border-t border-white/10 pt-12">
                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                            <MessageCircle className="text-green-500" /> Integração WhatsApp
                        </h2>
                        <div className="bg-[#111] p-6 rounded-xl border border-green-500/20">
                            <p className="mb-4">
                                O Atalaia possui um "Robô Guardião" que envia mensagens automáticas para o seu WhatsApp.
                            </p>
                            <h4 className="font-bold text-white mb-2">Quando você recebe mensagem?</h4>
                            <ul className="list-disc list-inside space-y-2 text-sm text-gray-400">
                                <li>Quando um vizinho aperta o botão de <strong>PÂNICO</strong> ou <strong>PERIGO</strong>.</li>
                                <li>Quando o SCR (Motovigia) registra uma ronda na sua casa (Check-in VIP).</li>
                                <li>Quando alguém faz login na sua conta (Aviso de Segurança).</li>
                                <li>Quando o administrador envia um comunicado oficial.</li>
                            </ul>
                            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-300">
                                <strong>Dica:</strong> Mantenha seu número de celular atualizado no perfil (com DDD) para garantir o recebimento.
                            </div>
                        </div>
                    </section>

                    {/* SCR */}
                    <section id="scr" className="border-t border-white/10 pt-12">
                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                            <Star className="text-atalaia-neon" /> Módulo SCR (Motovigia)
                        </h2>
                        <p className="mb-4 text-gray-400">
                            O <strong>SCR (Sistema de Controle de Rondas)</strong> é o perfil utilizado pelos seguranças/táticos do bairro.
                        </p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="p-5">
                                <h3 className="font-bold text-white mb-2">Painel Tático</h3>
                                <p className="text-sm">O SCR vê um painel diferente, com botões grandes para uso com luvas, focado em registrar Rondas e Ocorrências rapidamente.</p>
                            </Card>
                            <Card className="p-5">
                                <h3 className="font-bold text-white mb-2">Check-in VIP</h3>
                                <p className="text-sm">O SCR pode selecionar um morador (Premium) e registrar "Ronda Realizada". O morador recebe um WhatsApp na hora confirmando a passagem.</p>
                            </Card>
                        </div>
                    </section>

                    {/* Integrator */}
                    <section id="integrator" className="border-t border-white/10 pt-12 pb-20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                <Lock className="text-atalaia-neon" /> Para Integradores & Parceiros
                            </h2>
                            <Button 
                                onClick={handleDownloadPdf} 
                                disabled={downloadingPdf}
                                className="bg-atalaia-neon text-black font-black text-xs gap-2 shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:scale-105 transition-all"
                            >
                                <Download size={15} />
                                {downloadingPdf ? 'Gerando PDF...' : 'Baixar Manual do Integrador (PDF)'}
                            </Button>
                        </div>

                        {/* Banner de destaque do manual em PDF */}
                        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-[#072014] to-zinc-950 border border-atalaia-neon/40 shadow-[0_0_30px_rgba(0,255,102,0.1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-2 max-w-2xl">
                                <div className="flex items-center gap-2">
                                    <Badge color="green" className="text-[10px] font-mono uppercase">Documento Homologado v2.5 (RTMP & STREAMS)</Badge>
                                    <span className="text-xs text-atalaia-neon font-bold flex items-center gap-1">
                                        <Sparkles size={12} /> Ilustrado com fotos de campo
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-white">Manual Operacional Passo a Passo em PDF</h3>
                                <p className="text-sm text-zinc-300 leading-relaxed">
                                    Guia técnico com passo a passo de configuração RTMP, parâmetros ideais de codecs H.264, servidores de retransmissão HTTPS, fotos do padrão de caixas herméticas, placas de advertência, homologação de câmeras com pinos verdes no mapa, máscaras LGPD e automação de Split financeiro.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                                <Button 
                                    onClick={() => setIsManualModalOpen(true)}
                                    variant="outline"
                                    className="text-xs font-bold border-white/20 hover:border-atalaia-neon text-white justify-center"
                                >
                                    <BookOpen size={15} className="mr-1.5" /> Ler Online
                                </Button>
                                <Button 
                                    onClick={handleDownloadPdf}
                                    disabled={downloadingPdf}
                                    className="bg-atalaia-neon text-black font-black text-xs px-5 justify-center shadow-lg hover:scale-105 transition-all"
                                >
                                    <Download size={15} className="mr-1.5" />
                                    {downloadingPdf ? 'Baixando...' : 'Baixar Arquivo PDF (9 Páginas)'}
                                </Button>
                            </div>
                        </div>

                        <ul className="space-y-4">
                            <li className="bg-[#111] p-4 rounded-xl border border-white/5">
                                <strong className="text-emerald-400 block mb-1">Configuração de Câmeras em RTMP e Codecs H.264</strong>
                                <span className="text-sm">Passo a passo para enviar o fluxo de vídeo direto da câmera ou DVR para a nuvem via Push RTMP (porta 1935), sem precisar de IP fixo nem abrir portas no roteador do morador. Parâmetros homologados: H.264, 15 FPS, CBR 2048kbps e GOP de 30.</span>
                            </li>
                            <li className="bg-[#111] p-4 rounded-xl border border-white/5">
                                <strong className="text-white block mb-1">Homologação de Câmeras no Mapa</strong>
                                <span className="text-sm">O integrador cadastra streams em protocolo HTTPS (Iframe, RTSP.me, HLS, WebRTC, YouTube Live) e marca o ponto georreferenciado direto no mapa para criar o pino verde comunitário.</span>
                            </li>
                            <li className="bg-[#111] p-4 rounded-xl border border-white/5">
                                <strong className="text-white block mb-1">Máscaras de Privacidade (LGPD)</strong>
                                <span className="text-sm">Desenho de retângulos e polígonos pretos opacos sobre janelas e áreas privadas de vizinhos, com sincronização em tempo real para proteção jurídica.</span>
                            </li>
                            <li className="bg-[#111] p-4 rounded-xl border border-white/5">
                                <strong className="text-white block mb-1">Gestão da Base de Moradores e Faturamento</strong>
                                <span className="text-sm">Acompanhamento de moradores no período de testes (Trial Promocional), assinantes pagos e configuração das chaves de Split do Mercado Pago.</span>
                            </li>
                        </ul>
                    </section>

                </main>
            </div>

            <IntegratorManualModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                integratorData={{
                    integratorName: user?.name,
                    companyName: user?.companyName,
                    companyCnpj: user?.cnpj,
                    phone: user?.phone
                }}
            />
        </div>
    );
};

export default Documentation;

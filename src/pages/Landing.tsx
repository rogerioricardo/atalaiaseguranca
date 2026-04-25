
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, MessageSquare, Users, MapPin, Bell, Clock, BarChart3, MessageCircle, Menu, X, Lock, CreditCard, Smartphone, Download, Printer, Video, Check, Wifi, XCircle, FileText, Scan, AlertTriangle, Star, Shield, Heart, Eye } from 'lucide-react';
import { Button, Modal } from '@/components/UI';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [plateModalOpen, setPlateModalOpen] = useState(false);
  
  // State for WhatsApp Animation
  const [startWaAnimation, setStartWaAnimation] = useState(false);
  const waSectionRef = useRef<HTMLDivElement>(null);

  // Trigger animation when section is in view
  useEffect(() => {
      const observer = new IntersectionObserver(
          (entries) => {
              if (entries[0].isIntersecting) {
                  setStartWaAnimation(true);
                  observer.disconnect(); // Animate only once
              }
          },
          { threshold: 0.3 }
      );

      if (waSectionRef.current) {
          observer.observe(waSectionRef.current);
      }

      return () => observer.disconnect();
  }, []);

  const handleLogin = () => navigate('/login');
  const handleRegister = (plan?: string) => navigate(`/login?mode=register${plan ? `&plan=${plan}` : ''}`);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrintPlate = () => {
    const plateContent = document.getElementById('printable-plate');
    if (!plateContent) return;

    // Criar uma nova janela para impressão
    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) {
      alert("Por favor, habilite pop-ups para imprimir a placa.");
      return;
    }

    // Gerar o conteúdo HTML da janela de impressão
    printWindow.document.write(`
      <html>
        <head>
          <title>Impressão de Placa Atalaia</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { 
              margin: 0; 
              padding: 0; 
              background: white; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh;
            }
            #plate-to-print {
              width: 100%;
              max-width: 800px;
              margin: auto;
            }
            @media print {
              body { padding: 0; }
              #plate-to-print { 
                width: 100vw; 
                height: 75vw; /* Mantém o aspect ratio 4:3 na página inteira */
                max-width: none;
                border-radius: 0;
                border-width: 25px !important;
              }
              .print-hidden { display: none; }
            }
          </style>
        </head>
        <body>
          <div id="plate-to-print">
            ${plateContent.outerHTML}
          </div>
          <script>
            // Aguarda o Tailwind e as fontes carregarem antes de abrir o diálogo
            setTimeout(() => {
              window.print();
              window.close();
            }, 800);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-[#010101] text-white font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-[#010101]/90 backdrop-blur-md border-b border-white/5 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* LOGO CLICÁVEL (VOLTAR AO TOPO) */}
            <button 
              onClick={scrollToTop}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none group"
            >
              <ShieldCheck className="text-atalaia-neon h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="text-xl font-bold tracking-tight text-white">ATALAIA</span>
            </button>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
              <button onClick={() => scrollToSection('como-funciona')} className="text-gray-300 hover:text-white transition-colors">Como funciona</button>
              <button onClick={() => scrollToSection('funcionalidades')} className="text-gray-300 hover:text-white transition-colors">Funcionalidades</button>
              <button onClick={() => scrollToSection('planos')} className="text-gray-300 hover:text-white transition-colors">Planos</button>
              <button onClick={() => setPlateModalOpen(true)} className="flex items-center gap-2 text-atalaia-neon hover:text-white transition-colors border border-atalaia-neon/30 px-3 py-1.5 rounded-full hover:bg-atalaia-neon hover:border-atalaia-neon hover:text-black">
                  <Printer size={14} /> Imprimir Placa
              </button>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
               <Button onClick={handleLogin} variant="primary" className="px-6 py-2 text-sm font-bold">
                 Login
               </Button>
            </div>

            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Menu Principal"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-[#040404] border-b border-white/5 px-4 py-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top-5">
             <button onClick={() => scrollToSection('como-funciona')} className="text-left text-base font-medium text-gray-300 hover:text-atalaia-neon py-2">Como funciona</button>
             <button onClick={() => scrollToSection('funcionalidades')} className="text-left text-base font-medium text-gray-300 hover:text-atalaia-neon py-2">Funcionalidades</button>
             <button onClick={() => scrollToSection('planos')} className="text-left text-base font-medium text-gray-300 hover:text-atalaia-neon py-2">Planos</button>
             <button onClick={() => { setPlateModalOpen(true); setMobileMenuOpen(false); }} className="text-left text-base font-medium text-atalaia-neon py-2 flex items-center gap-2">
                 <Printer size={18} /> Imprimir Placa de Segurança
             </button>
             <hr className="border-white/5 my-2" />
             <Button onClick={handleLogin} variant="primary" className="w-full justify-center py-3 font-bold">
                 Login
             </Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center pt-20 overflow-hidden print:hidden bg-[#010101]">
        <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
          <img 
            src="https://lh3.googleusercontent.com/d/1yg0QDslqgCr8k41c1GtK0VSNaLYxHrAq" 
            alt="Atalaia Security Environment" 
            className="w-full h-full object-cover md:object-contain object-left opacity-60 animate-in fade-in duration-1000 ease-out"
            style={{ 
                filter: 'brightness(0.7) contrast(1.4) grayscale(0.2)',
                WebkitMaskImage: `linear-gradient(to right, black 0%, black 45%, rgba(0,0,0,0.85) 52%, rgba(0,0,0,0.6) 62%, rgba(0,0,0,0.35) 72%, rgba(0,0,0,0.15) 82%, rgba(0,0,0,0.04) 90%, transparent 98%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)`,
                maskImage: `linear-gradient(to right, black 0%, black 45%, rgba(0,0,0,0.85) 52%, rgba(0,0,0,0.6) 62%, rgba(0,0,0,0.35) 72%, rgba(0,0,0,0.15) 82%, rgba(0,0,0,0.04) 90%, transparent 98%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)`,
                WebkitMaskComposite: 'source-in',
                maskComposite: 'intersect'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent via-45% via-[#010101]/40 via-60% via-[#010101]/80 via-75% to-[#010101] to-95%"></div>
          <div className="absolute inset-y-0 right-0 w-[35%] bg-[#010101]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-end w-full text-right animate-in slide-in-from-right-10 duration-700 delay-150">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6 max-w-3xl drop-shadow-[0_0_30px_rgba(0,0,0,0.9)]">
            Atalaia — <span className="text-atalaia-neon">Segurança</span><br />
            <span className="text-atalaia-neon">Colaborativa</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mb-10 leading-relaxed font-medium drop-shadow-lg">
            Vigie sua rua. Proteja sua comunidade. Sistema de alertas comunitários com mapas em tempo real e integração com WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto sm:justify-end">
            <Button onClick={() => scrollToSection('planos')} className="h-12 sm:h-14 px-8 text-sm sm:text-base font-bold uppercase tracking-wide w-full sm:w-auto">
              Entrar no Grupo do meu Bairro
            </Button>
            <button onClick={handleLogin} className="h-12 sm:h-14 px-8 text-sm sm:text-base font-medium text-white border border-white/20 rounded-lg hover:bg-white/10 hover:border-white transition-all uppercase tracking-wide w-full sm:w-auto">
              Entrar no Sistema
            </button>
          </div>
        </div>
      </section>

      {/* Seção Como Funciona */}
      <section id="como-funciona" className="py-16 md:py-24 bg-[#040404] print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Como funciona?</h2>
          <p className="text-gray-400">Um ciclo simples para uma segurança poderosa.</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Users, title: "Cadastro", desc: "O integrador cadastra sua rua e moradores e se inscreve em poucos passos." },
            { icon: Zap, title: "Alerta Instantâneo", desc: "Moradores contam alertas de perigo ou suspeitas que são divulgadas em tempo real." },
            { icon: MessageSquare, title: "Notificação Ativa", desc: "O alerta vai instantaneamente para o WhatsApp da comunidade inteira via chatbot." },
            { icon: ShieldCheck, title: "Comunidade Segura", desc: "Ajuda rápida e coordenada em menos a segurança de todos os moradores." }
          ].map((item, i) => (
            <div key={i} className="bg-[#080808] p-6 md:p-8 rounded-2xl border border-white/5 hover:border-atalaia-neon/30 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-lg bg-[#010101] flex items-center justify-center text-atalaia-neon mb-6 border border-white/5">
                <item.icon size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Seção Funcionalidades */}
      <section id="funcionalidades" className="py-16 md:py-24 bg-[#010101] border-t border-white/5 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Funcionalidades</h2>
          <p className="text-gray-400">Ferramentas para uma vigilância completa e colaborativa.</p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[
            { icon: MapPin, title: "Mapa Interativo", desc: "Visualize todos os alertas em tempo real na tela do seu celular." },
            { icon: Bell, title: "Botão de Alerta", desc: "Envie alertas de Perigo, Suspeita ou Tudo OK com apenas um toque." },
            { icon: Clock, title: "Histórico de Eventos", desc: "Acesse um histórico completo das ocorrências em seu bairro." },
            { icon: ShieldCheck, title: "Painel Administrativo", desc: "Gerência completa de usuários, regiões e alertas para administradores." },
            { icon: BarChart3, title: "Estatísticas de Segurança", desc: "Gráficos e relatórios sobre a frequência e tipo de alertas do bairro." },
            { icon: MessageCircle, title: "Bate-papo em Tempo Real", desc: "Comunique-se instantaneamente com todos os vizinhos para coordenar e ajudar." },
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-xl bg-[#040404] border border-white/5 flex items-start gap-4 hover:bg-[#080808] transition-colors">
              <div className="p-3 rounded-lg bg-atalaia-neon/10 text-atalaia-neon shrink-0">
                <feature.icon size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WhatsApp Section */}
      <section id="whatsapp-demo" ref={waSectionRef} className="py-20 bg-[#020202] border-y border-white/5 print:hidden overflow-hidden relative">
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-green-900/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 text-center lg:text-left z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-xs font-bold uppercase tracking-wider mb-6">
                      <MessageSquare size={14} /> Integração Oficial
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Alertas Inteligentes no <span className="text-[#25D366]">WhatsApp</span></h2>
                  <p className="text-gray-400 text-lg mb-8 leading-relaxed">Não exige que todos os vizinhos tenham o aplicativo instalado. O Atalaia envia notificações instantâneas diretamente para o WhatsApp do grupo ou de cada morador.</p>
                  <ul className="space-y-4 mb-8 text-left max-w-md mx-auto lg:mx-0">
                      <li className="flex items-center gap-3 text-gray-300"><Check className="text-[#25D366]" size={18} /> Sem necessidade de app para receber</li>
                      <li className="flex items-center gap-3 text-gray-300"><Check className="text-[#25D366]" size={18} /> Detalhes completos: Quem, Onde e Quando</li>
                      <li className="flex items-center gap-3 text-gray-300"><Check className="text-[#25D366]" size={18} /> Link direto para câmeras ao vivo</li>
                  </ul>
                  <Button onClick={() => scrollToSection('planos')} className="h-12 px-8 bg-[#25D366] text-black hover:bg-[#20bd5a] font-bold shadow-[0_0_20px_rgba(37,211,102,0.3)]">Conectar Meu Bairro</Button>
              </div>
              <div className="flex-1 relative z-10 flex justify-center">
                  <div className="relative w-[300px] h-[600px] bg-black border-[8px] border-[#151515] rounded-[3rem] shadow-2xl overflow-hidden ring-1 ring-white/10">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-20"></div>
                      <div className="w-full h-full bg-[#0b141a] flex flex-col pt-10 relative">
                          <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3 border-b border-[#202c33]">
                              <div className="w-8 h-8 rounded-full bg-atalaia-neon flex items-center justify-center text-black font-bold text-xs shrink-0">AT</div>
                              <div className="overflow-hidden">
                                  <p className="text-white text-xs font-bold truncate">Atalaia Segurança Colaborativa</p>
                                  <p className="text-[10px] text-gray-400">online</p>
                              </div>
                          </div>
                          <div className="flex-1 p-4 space-y-6 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-opacity-10 bg-repeat overflow-hidden relative">
                              <div className={`flex justify-center transition-all duration-700 ${startWaAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`} style={{ transitionDelay: '500ms' }}>
                                  <span className="bg-[#1e2a30] text-gray-400 text-[10px] px-3 py-1 rounded-lg uppercase shadow-sm">Hoje</span>
                              </div>
                              <div className={`flex flex-col items-start transition-all duration-700 ease-out transform ${startWaAnimation ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`} style={{ transitionDelay: '1500ms' }}>
                                  <div className="bg-[#202c33] p-3 rounded-lg rounded-tl-none max-w-[90%] shadow-md border-l-4 border-red-500 relative">
                                      <p className="text-[10px] text-red-400 font-bold mb-2">🛡️ ATALAIA - ALERTA DE SEGURANÇA</p>
                                      <p className="text-sm text-white font-bold mb-2">🚨🚨 PÂNICO</p>
                                      <div className="space-y-1 text-[10px] text-gray-300 leading-tight">
                                          <p>👤 <span className="font-bold text-gray-400">Solicitante:</span> Laura</p>
                                          <p>📍 <span className="font-bold text-gray-400">Local:</span> Bairro Centro</p>
                                          <p>📝 <span className="font-bold text-gray-400">Relato:</span> Alguém no pátio!</p>
                                          <p>🕒 <span className="font-bold text-gray-400">Horário:</span> 15:30:00</p>
                                      </div>
                                      <div className="mt-2 pt-2 border-t border-white/5">
                                          <p className="text-[#53bdeb] text-[10px] truncate">🔗 atalaia.cloud/#/login</p>
                                      </div>
                                      <span className="text-[9px] text-gray-500 absolute bottom-1 right-2">15:30</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Planos Section */}
      <section id="planos" className="py-20 md:py-32 bg-[#010101] border-b border-white/5 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16 md:mb-24">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Escolha sua Proteção</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">Planos flexíveis para cada nível de necessidade.</p>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              <div className="bg-[#040404] border border-white/5 rounded-3xl p-8 flex flex-col hover:border-atalaia-neon/20 transition-all duration-300">
                  <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                          <Heart className="text-gray-500" size={20} />
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Colaborativo</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Gratuito</h3>
                      <p className="text-gray-500 text-sm">Apoie a rede sem custo fixo.</p>
                  </div>
                  <div className="mb-10"><span className="text-4xl font-bold text-white">R$ 0</span><span className="text-gray-500 text-sm ml-1">/mês</span></div>
                  <ul className="space-y-4 mb-12 flex-1">
                      <li className="flex items-start gap-3 text-sm text-gray-400"><Check className="text-atalaia-neon mt-0.5 shrink-0" size={16} /> Notificações via WhatsApp</li>
                      <li className="flex items-start gap-3 text-sm text-gray-400"><Check className="text-atalaia-neon mt-0.5 shrink-0" size={16} /> Botão de Pânico Ativo</li>
                  </ul>
                  <Button onClick={() => handleRegister('FREE')} variant="outline" className="w-full justify-center h-12">Começar Grátis</Button>
              </div>
              <div className="bg-[#080808] border-2 border-atalaia-neon rounded-3xl p-8 flex flex-col shadow-[0_0_40px_rgba(0,255,102,0.05)] relative transform md:-translate-y-4 scale-105 z-10 transition-all duration-300">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-atalaia-neon text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">Mais Popular</div>
                  <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4"><Shield className="text-atalaia-neon" size={20} /><span className="text-xs font-bold text-atalaia-neon uppercase tracking-widest">Segurança Total</span></div>
                      <h3 className="text-2xl font-bold text-white mb-2">Família</h3>
                  </div>
                  <div className="mb-10"><span className="text-4xl font-bold text-white">R$ 39,90</span><span className="text-gray-500 text-sm ml-1">/mês</span></div>
                  <ul className="space-y-4 mb-12 flex-1">
                      <li className="flex items-start gap-3 text-sm text-white"><Check className="text-atalaia-neon mt-0.5 shrink-0" size={16} /> Tudo do Plano Gratuito</li>
                      <li className="flex items-start gap-3 text-sm text-white"><Check className="text-atalaia-neon mt-0.5 shrink-0" size={16} /> Acesso às 3 câmeras próximas</li>
                  </ul>
                  <Button onClick={() => handleRegister('FAMILY')} className="w-full justify-center h-12 font-bold">Assinar Plano Família</Button>
              </div>
              <div className="bg-[#040404] border border-white/5 rounded-3xl p-8 flex flex-col hover:border-atalaia-neon/20 transition-all duration-300">
                  <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4"><Star className="text-atalaia-neon" size={20} /><span className="text-xs font-bold text-atalaia-neon uppercase tracking-widest">Apoio Tático</span></div>
                      <h3 className="text-2xl font-bold text-white mb-2">Prêmio</h3>
                  </div>
                  <div className="mb-10"><span className="text-4xl font-bold text-white">R$ 79,90</span><span className="text-gray-500 text-sm ml-1">/mês</span></div>
                  <ul className="space-y-4 mb-12 flex-1">
                      <li className="flex items-start gap-3 text-sm text-gray-400"><Check className="text-atalaia-neon mt-0.5 shrink-0" size={16} /> Tudo do Plano Família</li>
                      <li className="flex items-start gap-3 text-sm text-gray-400"><Check className="text-atalaia-neon mt-0.5 shrink-0" size={16} /> Acesso a TODAS as câmeras</li>
                  </ul>
                  <Button onClick={() => handleRegister('PREMIUM')} className="w-full justify-center h-12 font-bold">Assinar Plano Premium</Button>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-[#010101] border-t border-white/5 text-gray-400 text-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-12">
            {/* Brand Column */}
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="text-atalaia-neon h-6 w-6" />
                <span className="text-xl font-bold text-white tracking-tight">ATALAIA</span>
              </div>
              <p className="text-gray-500 max-w-xs mb-6 leading-relaxed">
                A maior rede de segurança colaborativa do Brasil. Unindo tecnologia e vizinhança para um ambiente mais seguro para todos.
              </p>
              <div className="flex gap-4">
                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-atalaia-neon hover:text-black transition-all">
                  <MessageCircle size={18} />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-atalaia-neon hover:text-black transition-all">
                  <Users size={18} />
                </button>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Produto</h4>
              <ul className="space-y-4">
                <li><button onClick={() => scrollToSection('como-funciona')} className="hover:text-atalaia-neon transition-colors">Como Funciona</button></li>
                <li><button onClick={() => scrollToSection('funcionalidades')} className="hover:text-atalaia-neon transition-colors">Funcionalidades</button></li>
                <li><button onClick={() => scrollToSection('planos')} className="hover:text-atalaia-neon transition-colors">Planos e Preços</button></li>
                <li><button onClick={() => setPlateModalOpen(true)} className="hover:text-atalaia-neon transition-colors">Imprimir Placa</button></li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Suporte</h4>
              <ul className="space-y-4">
                <li><button onClick={() => navigate('/docs')} className="hover:text-atalaia-neon transition-colors">Documentação</button></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-atalaia-neon transition-colors">Central de Ajuda</button></li>
                <li><button className="hover:text-atalaia-neon transition-colors">Contato</button></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Legal</h4>
              <ul className="space-y-4">
                <li><button onClick={() => navigate('/terms')} className="hover:text-atalaia-neon transition-colors">Termos de Uso</button></li>
                <li><button onClick={() => navigate('/privacy')} className="hover:text-atalaia-neon transition-colors">Privacidade</button></li>
                <li><button className="hover:text-atalaia-neon transition-colors">Cookies</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest font-medium opacity-50">
            <p>© 2025 ALIEN MONITORAMENTO ELETRONICO LTDA. TODOS OS DIREITOS RESERVADOS.</p>
            <div className="flex gap-8">
              <span>CNPJ: 00.000.000/0001-00</span>
              <span>BRASIL</span>
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL DE IMPRESSÃO DE PLACA */}
      <Modal isOpen={plateModalOpen} onClose={() => setPlateModalOpen(false)}>
        <div className="p-4 sm:p-8 flex flex-col items-center">
            <div className="mb-6 text-center print:hidden">
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <Printer className="text-atalaia-neon" /> Modelo de Placa de Segurança
                </h2>
                <p className="text-gray-400 text-sm">Imprima e coloque em local visível.</p>
            </div>

            {/* AREA DA PLACA - DESIGN PROFISSIONAL VERDE NEON */}
            <div 
                id="printable-plate"
                className="bg-[#00FF66] w-full max-w-[600px] aspect-[4/3] border-[12px] border-black rounded-xl p-8 flex flex-col items-center justify-between text-black shadow-2xl relative overflow-hidden"
                style={{ fontFamily: "'Inter', sans-serif" }}
            >
                <div className="absolute inset-0 opacity-[0.07] flex flex-wrap gap-12 justify-center items-center p-4 pointer-events-none">
                    {[...Array(12)].map((_, i) => (<ShieldCheck key={i} size={100} className={`transform ${i % 2 === 0 ? 'rotate-12' : '-rotate-12'}`} />))}
                </div>
                <div className="w-full flex justify-between items-start z-10">
                    <div className="flex items-center gap-3"><ShieldCheck size={64} fill="black" /><div className="leading-tight"><h3 className="text-5xl font-black tracking-tighter">ATALAIA</h3><p className="text-sm font-bold tracking-[0.2em] uppercase">Vigilância Digital</p></div></div>
                    <div className="bg-black text-[#00FF66] p-3 rounded-lg flex flex-col items-center justify-center border-2 border-black"><Video size={32} /><span className="text-[10px] font-black uppercase mt-1">24 Horas</span></div>
                </div>
                <div className="text-center z-10 flex flex-col gap-4">
                    <h4 className="text-4xl sm:text-5xl font-black uppercase leading-none tracking-tight">LOCAL VIGIADO</h4>
                    <div className="bg-black text-[#00FF66] px-4 py-2 inline-block mx-auto rounded shadow-lg"><p className="text-xl sm:text-2xl font-black uppercase tracking-wider">Segurança Colaborativa</p></div>
                </div>
                <div className="w-full text-center z-10">
                    <p className="text-sm sm:text-lg font-bold leading-tight max-w-md mx-auto mb-4">COMUNICAÇÃO INSTANTÂNEA ENTRE MORADORES<br />E MONITORAMENTO INTEGRADO 24H</p>
                    <div className="flex items-center justify-center gap-6 border-t-2 border-black/20 pt-4">
                        <div className="flex items-center gap-1"><Smartphone size={20} /><span className="text-xs font-black uppercase">App Integrado</span></div>
                        <div className="flex items-center gap-1"><MessageSquare size={20} /><span className="text-xs font-black uppercase">Alertas WhatsApp</span></div>
                        <div className="flex items-center gap-1"><Eye size={20} /><span className="text-xs font-black uppercase">Rede Vizinhos</span></div>
                    </div>
                </div>
                <div className="absolute bottom-2 right-4 text-[10px] font-bold opacity-30 uppercase tracking-widest">WWW.ATALAIA.CLOUD</div>
            </div>

            <div className="mt-8 flex gap-4 w-full sm:w-auto print:hidden">
                <Button onClick={handlePrintPlate} className="flex-1 sm:flex-none h-12 px-8 bg-white text-black hover:bg-atalaia-neon font-black shadow-lg">
                    <Printer className="mr-2" /> IMPRIMIR AGORA
                </Button>
                <Button onClick={() => setPlateModalOpen(false)} variant="outline" className="flex-1 sm:flex-none h-12">FECHAR</Button>
            </div>
        </div>
      </Modal>

      {/* Botão WhatsApp Flutuante */}
      <a 
        href="https://wa.me/5548992067665" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 bg-[#25D366] text-white px-5 py-3 rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.5)] hover:scale-105 transition-transform group animate-in fade-in slide-in-from-bottom-10 duration-1000"
      >
        <div className="flex flex-col items-end leading-tight">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-90">Estamos online</span>
          <span className="text-sm font-bold">Suporte Atalaia</span>
        </div>
        <div className="relative">
            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20"></div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative z-10">
                <MessageSquare size={22} fill="currentColor" />
            </div>
        </div>
      </a>
    </div>
  );
};

export default Landing;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/context';
import { 
  ArrowLeft, 
  Scale, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Printer, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  BookOpen, 
  Search, 
  Layers,
  FileText
} from 'lucide-react';
import { Button, Card } from '@/components/UI';
import { POLICY_SECTIONS, RAW_POLICY_TEXT } from '@/components/ImagePolicyModal';

const ImagePolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string>('intro');
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);

  const scrollAnimRef = useRef<number | null>(null);

  // Auto-scroll on window
  useEffect(() => {
    let lastTime = performance.now();

    const step = (now: number) => {
      if (!isPlaying) return;
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const pxToScroll = 40 * speed * delta;
      
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= total - 5) {
        setIsPlaying(false);
        return;
      }

      window.scrollBy({ top: pxToScroll, left: 0, behavior: 'auto' });
      scrollAnimRef.current = requestAnimationFrame(step);
    };

    if (isPlaying) {
      lastTime = performance.now();
      scrollAnimRef.current = requestAnimationFrame(step);
    } else {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    }

    return () => {
      if (scrollAnimRef.current) cancelAnimationFrame(scrollAnimRef.current);
    };
  }, [isPlaying, speed]);

  // Scroll Progress calculation
  useEffect(() => {
    const handleWindowScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const current = window.scrollY;
      const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((current / total) * 100))) : 0;
      setProgress(pct);

      for (const sec of POLICY_SECTIONS) {
        const el = document.getElementById(`page-sec-${sec.id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 50) {
            setActiveSectionId(sec.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleWindowScroll);
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  const scrollToSec = (id: string) => {
    const el = document.getElementById(`page-sec-${id}`);
    if (el) {
      const offset = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: offset, behavior: 'smooth' });
      setActiveSectionId(id);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(RAW_POLICY_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (speechActive) {
      window.speechSynthesis.cancel();
      setSpeechActive(false);
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(RAW_POLICY_TEXT);
      utterance.lang = 'pt-BR';
      utterance.rate = speed === 0.5 ? 0.8 : speed === 1 ? 1.0 : 1.25;
      utterance.onend = () => { setSpeechActive(false); setIsPlaying(false); };
      utterance.onerror = () => { setSpeechActive(false); setIsPlaying(false); };
      window.speechSynthesis.speak(utterance);
      setSpeechActive(true);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return POLICY_SECTIONS;
    const q = searchQuery.toLowerCase();
    return POLICY_SECTIONS.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.content.some(c => c.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#050508] text-gray-200 font-sans pb-24 selection:bg-atalaia-neon selection:text-black">
      {/* Top Fixed Reading Tracker Bar */}
      <div className="fixed top-0 inset-x-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/10">
        <div className="w-full bg-zinc-900 h-1">
          <div 
            className="h-full bg-atalaia-neon transition-all duration-150 shadow-[0_0_10px_#00FF66]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate(user ? '/cameras' : '/')} 
              className="h-9 px-3 text-xs border-white/10 hover:border-atalaia-neon"
            >
              <ArrowLeft size={14} className="mr-1.5" /> {user ? 'Voltar ao Painel' : 'Voltar ao Início'}
            </Button>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded bg-atalaia-neon/10 text-atalaia-neon border border-atalaia-neon/20">
                LGPD
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {progress}% concluído
              </span>
            </div>
          </div>

          {/* Reading Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md ${
                isPlaying 
                  ? 'bg-amber-500 hover:bg-amber-400 text-black' 
                  : 'bg-atalaia-neon hover:bg-[#33ff85] text-black shadow-[0_0_15px_rgba(0,255,102,0.3)]'
              }`}
            >
              {isPlaying ? <Pause size={14} className="fill-black" /> : <Play size={14} className="fill-black" />}
              <span>{isPlaying ? 'Pausar' : 'Correr Leitura'}</span>
            </button>

            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-all ${
                speechActive 
                  ? 'bg-blue-600 text-white border-blue-400 animate-pulse' 
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
              title="Voz / Síntese de Áudio"
            >
              {speechActive ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors"
              title="Copiar texto"
            >
              {copied ? <Check size={15} className="text-atalaia-neon" /> : <Copy size={15} />}
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors"
              title="Imprimir"
            >
              <Printer size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout with Sidebar Index */}
      <div className="max-w-6xl mx-auto px-4 pt-24 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sticky Index */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-24 p-5 rounded-2xl bg-zinc-950 border border-white/10 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-atalaia-neon">
              <BookOpen size={16} /> Índice Geral (18 Tópicos)
            </div>

            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Filtrar tópicos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-atalaia-neon"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {POLICY_SECTIONS.map((sec) => {
                const isActive = activeSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSec(sec.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-start gap-2 ${
                      isActive 
                        ? 'bg-atalaia-neon/15 text-atalaia-neon border border-atalaia-neon/30 font-bold' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-zinc-500 shrink-0 mt-0.5">
                      {sec.number ? `${sec.number}.` : '•'}
                    </span>
                    <span className="line-clamp-1">
                      {sec.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sections Content */}
        <div className="lg:col-span-8 space-y-8">
          {filteredSections.map((sec) => {
            const isActive = activeSectionId === sec.id;
            
            if (sec.id === 'intro') {
              return (
                <div 
                  key={sec.id}
                  id={`page-sec-${sec.id}`}
                  className="p-8 md:p-10 rounded-3xl bg-zinc-950 border border-atalaia-neon/30 text-center space-y-4 shadow-[0_0_40px_rgba(0,255,102,0.1)]"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-atalaia-neon/10 border border-atalaia-neon/30 text-atalaia-neon text-xs font-black uppercase tracking-widest">
                    <Scale size={14} /> Documento Oficial de Segurança
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase leading-tight">
                    {sec.title}
                  </h1>
                  <h2 className="text-sm sm:text-base font-bold text-atalaia-neon uppercase tracking-widest">
                    {sec.subtitle}
                  </h2>
                  <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed text-sm">
                    {sec.content[0]}
                  </p>
                </div>
              );
            }

            return (
              <Card
                key={sec.id}
                id={`page-sec-${sec.id}`}
                className={`p-6 md:p-8 transition-all relative ${
                  isActive 
                    ? 'border-atalaia-neon/50 bg-zinc-900/80 shadow-[0_0_30px_rgba(0,255,102,0.1)]' 
                    : sec.isHighlight
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : 'border-white/10 bg-zinc-950/60'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-atalaia-neon font-mono font-black text-sm flex items-center justify-center shrink-0">
                    {sec.number}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                    {sec.title}
                  </h3>
                </div>

                {sec.isFlowchart ? (
                  <div className="p-4 bg-black/60 rounded-xl border border-white/10 space-y-3 text-xs sm:text-sm">
                    <div className="text-center py-2 px-4 bg-atalaia-neon/10 border border-atalaia-neon/30 text-atalaia-neon font-black uppercase rounded-lg">
                      📩 FLUXO OPERACIONAL DE ATENDIMENTO
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 bg-zinc-900/80 rounded-lg border border-white/5">
                        <span className="font-bold text-atalaia-neon block mb-1 text-xs uppercase">1. Quem está solicitando?</span>
                        <ul className="space-y-1 text-zinc-300 text-xs">
                          <li>• Cliente: Analisar normalmente.</li>
                          <li>• Titular da Imagem: Tratar como direito de titular.</li>
                          <li>• Terceiro: Analisar legitimidade.</li>
                          <li>• Autoridade Policial: Analisar requisição oficial.</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-zinc-900/80 rounded-lg border border-white/5">
                        <span className="font-bold text-atalaia-neon block mb-1 text-xs uppercase">2. Decisão e Controlador</span>
                        <p className="text-zinc-300 text-xs">
                          Identificar se a ALIEN é controladora ou operadora em nome do contratante.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-900/80 rounded-lg border border-white/5">
                        <span className="font-bold text-atalaia-neon block mb-1 text-xs uppercase">3. Proteção de Terceiros</span>
                        <p className="text-zinc-300 text-xs">
                          Avaliar privacidade e possibilidade de anonimização ou limitação do trecho.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-900/80 rounded-lg border border-white/5">
                        <span className="font-bold text-atalaia-neon block mb-1 text-xs uppercase">4. Casos Criminais</span>
                        <p className="text-zinc-300 text-xs">
                          Orientar Boletim de Ocorrência e solicitação oficial de autoridade competente.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-zinc-300 leading-relaxed text-sm">
                    {sec.content.map((paragraph, pIdx) => {
                      if (paragraph.startsWith('“') || paragraph.startsWith('"')) {
                        return (
                          <div key={pIdx} className="p-4 rounded-xl bg-atalaia-neon/5 border-l-4 border-atalaia-neon text-white font-medium italic my-3">
                            {paragraph}
                          </div>
                        );
                      }
                      if (paragraph.startsWith('IMPORTANTE:')) {
                        return (
                          <div key={pIdx} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm font-medium flex items-start gap-3 my-3">
                            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                            <div>{paragraph}</div>
                          </div>
                        );
                      }
                      if (paragraph.startsWith('•') || paragraph.startsWith('a)') || paragraph.startsWith('b)') || paragraph.startsWith('c)') || paragraph.startsWith('d)') || paragraph.startsWith('e)') || paragraph.startsWith('f)') || paragraph.startsWith('g)') || paragraph.startsWith('h)') || paragraph.startsWith('i)') || paragraph.startsWith('j)')) {
                        return (
                          <div key={pIdx} className="flex items-start gap-2.5 pl-2 text-zinc-300">
                            <span className="text-atalaia-neon font-bold text-xs shrink-0 mt-0.5">•</span>
                            <span>{paragraph.replace(/^[•a-j]\)\s*/, '')}</span>
                          </div>
                        );
                      }
                      return (
                        <p key={pIdx} className="text-zinc-300 leading-relaxed">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ImagePolicyPage;

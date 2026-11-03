import React, { useState } from 'react';
import { Modal, Button } from './UI';
import { 
  FileText, Download, Printer, CheckCircle, 
  Camera, Lock, Wrench, AlertTriangle, 
  Sparkles, Loader2, Radio, Server, Copy, Check, Info, ShieldCheck
} from 'lucide-react';
import { generateIntegratorPdf, IntegratorPdfOptions } from '@/utils/integratorPdfGenerator';

interface IntegratorManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  integratorData?: IntegratorPdfOptions;
  initialTab?: 'all' | 'mod1' | 'mod2' | 'rtmp' | 'streaming' | 'cameras' | 'lgpd' | 'users' | 'checklist';
}

export const IntegratorManualModal: React.FC<IntegratorManualModalProps> = ({
  isOpen,
  onClose,
  integratorData,
  initialTab = 'all'
}) => {
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'mod1' | 'mod2' | 'rtmp' | 'streaming' | 'cameras' | 'lgpd' | 'users' | 'checklist'>(initialTab);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await generateIntegratorPdf(integratorData || {});
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      alert('Não foi possível gerar o PDF. Você também pode clicar em Imprimir / Salvar em PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 space-y-6 max-h-[88vh] overflow-y-auto pr-2">
        {/* Banner de Ação Superior */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-950 via-[#06180e] to-zinc-950 border border-atalaia-neon/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_30px_rgba(0,255,102,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-atalaia-neon/20 border border-atalaia-neon/40 flex items-center justify-center text-atalaia-neon shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">Manual do Integrador Atalaia (PDF)</h3>
                <span className="text-[10px] font-mono font-bold bg-atalaia-neon text-black px-2 py-0.5 rounded-full">v2.5 RTMP & STREAMS</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Passo a passo completo: RTMP, RTSP, codecs H.264, servidores de vídeo, caixas herméticas, máscaras LGPD e monetização.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="bg-atalaia-neon hover:bg-emerald-400 text-black font-black text-xs px-4 py-2.5 h-10 shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:scale-105 transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center cursor-pointer"
            >
              {downloading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Gerando PDF (11 Páginas)...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Baixar Manual em PDF</span>
                </>
              )}
            </Button>
            <button
              onClick={handlePrint}
              className="px-3 py-2.5 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Imprimir ou Salvar via Navegador"
            >
              <Printer size={15} />
              <span className="hidden md:inline">Imprimir</span>
            </button>
          </div>
        </div>

        {/* Abas Rápidas de Navegação Tática */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 text-xs font-bold scrollbar-thin">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'all' ? 'bg-atalaia-neon text-black font-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            Visão Geral Completa
          </button>
          <button
            onClick={() => setActiveTab('rtmp')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${activeTab === 'rtmp' ? 'bg-emerald-400 text-black font-black shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
          >
            <Radio size={13} />
            <span>Passo a Passo RTMP & Codecs</span>
          </button>
          <button
            onClick={() => setActiveTab('streaming')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${activeTab === 'streaming' ? 'bg-atalaia-neon text-black font-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            <Server size={13} />
            <span>Servidores & HTTPS</span>
          </button>
          <button
            onClick={() => setActiveTab('cameras')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'cameras' ? 'bg-atalaia-neon text-black font-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            Cadastro no Painel
          </button>
          <button
            onClick={() => setActiveTab('mod2')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'mod2' ? 'bg-atalaia-neon text-black font-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            Infraestrutura de Campo
          </button>
          <button
            onClick={() => setActiveTab('lgpd')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'lgpd' ? 'bg-atalaia-neon text-black font-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            LGPD & Máscaras
          </button>
          <button
            onClick={() => setActiveTab('mod1')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'mod1' ? 'bg-atalaia-neon text-black font-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            Perfil & Split
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'checklist' ? 'bg-atalaia-neon text-black font-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
          >
            Checklist & Termo
          </button>
        </div>

        {/* CONTEÚDO VISUAL DETALHADO */}
        <div className="space-y-8 text-zinc-300 print:text-black">
          
          {/* SEÇÃO RTMP E CODECS (DESTAQUE MÁXIMO) */}
          {(activeTab === 'all' || activeTab === 'rtmp') && (
            <div className="space-y-5 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-emerald-950/20 border-2 border-emerald-500/40 p-6 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.1)]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-widest">
                  <Radio size={18} className="animate-pulse" /> Módulo Técnico Especial — Configuração de Câmeras em RTMP
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                  PORTA 1935 TCP (PUSH DIRECT)
                </span>
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  Como Configurar o Fluxo RTMP nas Câmeras e DVRs
                </h2>
                <p className="text-sm text-zinc-300 mt-1 leading-relaxed">
                  O <strong>RTMP (Real-Time Messaging Protocol)</strong> é o protocolo ideal para segurança ao vivo. No modo Push, a própria câmera IP ou DVR/NVR envia o vídeo diretamente para o servidor na nuvem. <strong>Vantagem decisiva:</strong> funciona mesmo quando o morador voluntário não tem IP fixo ou está atrás de CGNAT (não precisa abrir portas no roteador da casa!).
                </p>
              </div>

              {/* Tabela de Codecs e Parâmetros Ideais */}
              <div className="p-4 bg-black/60 border border-white/10 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle size={15} /> Parâmetros Críticos de Vídeo (Obrigatório seguir exatamente):
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-zinc-900/80 border border-emerald-500/30 rounded-lg">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase block font-bold">Codec de Vídeo</span>
                    <strong className="text-emerald-400 text-sm block">H.264 (Baseline ou Main)</strong>
                    <span className="text-[10px] text-red-400 block mt-1 font-bold">⚠️ NUNCA use H.265 / HEVC ou Smart Codec +</span>
                  </div>

                  <div className="p-3 bg-zinc-900/80 border border-white/10 rounded-lg">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase block font-bold">Resolução Recomendada</span>
                    <strong className="text-white text-sm block">1080p (1920x1080)</strong>
                    <span className="text-[10px] text-zinc-400 block mt-1">Ou 720p (1280x720) para links lentos</span>
                  </div>

                  <div className="p-3 bg-zinc-900/80 border border-white/10 rounded-lg">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase block font-bold">Taxa de Quadros (FPS)</span>
                    <strong className="text-atalaia-neon text-sm block">15 a 20 FPS</strong>
                    <span className="text-[10px] text-zinc-400 block mt-1">Perfeita para segurança sem saturar upload</span>
                  </div>

                  <div className="p-3 bg-zinc-900/80 border border-white/10 rounded-lg">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase block font-bold">Taxa de Bits (Bitrate)</span>
                    <strong className="text-white text-sm block">1500 a 2500 kbps (CBR)</strong>
                    <span className="text-[10px] text-zinc-400 block mt-1">Modo Taxa Constante (impede picos)</span>
                  </div>

                  <div className="p-3 bg-zinc-900/80 border border-white/10 rounded-lg">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase block font-bold">Intervalo de I-Frame (GOP)</span>
                    <strong className="text-atalaia-neon text-sm block">30 (ou 15)</strong>
                    <span className="text-[10px] text-zinc-400 block mt-1">1 a 2 segundos: abre na hora sem buffer!</span>
                  </div>

                  <div className="p-3 bg-zinc-900/80 border border-white/10 rounded-lg">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase block font-bold">Áudio do Stream</span>
                    <strong className="text-white text-sm block">Desativado ou AAC</strong>
                    <span className="text-[10px] text-zinc-400 block mt-1">G.711 / PCM trava o player no browser</span>
                  </div>
                </div>
              </div>

              {/* Guia Passo a Passo de Configuração */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-400" /> Passo a Passo de Ativação do RTMP:
                </h4>

                <div className="space-y-2.5">
                  <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black text-xs flex items-center justify-center shrink-0">1</span>
                    <div className="space-y-1">
                      <h5 className="font-bold text-white text-xs">Conectar no IP Local da Câmera / DVR</h5>
                      <p className="text-xs text-zinc-400">
                        Abra o Chrome no notebook e digite o IP local da câmera (ex: <code className="text-emerald-300 bg-white/5 px-1 py-0.5 rounded">192.168.1.108</code> em Intelbras/Dahua ou <code className="text-emerald-300 bg-white/5 px-1 py-0.5 rounded">192.168.1.64</code> em Hikvision). Entre com a senha de administrador.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black text-xs flex items-center justify-center shrink-0">2</span>
                    <div className="space-y-1">
                      <h5 className="font-bold text-white text-xs">Ajustar os Parâmetros de Compressão (Encode)</h5>
                      <p className="text-xs text-zinc-400">
                        Acesse <strong>Configuração &gt; Vídeo/Áudio &gt; Compressão</strong>. Mude o Codec para <strong>H.264</strong>, desative <strong>Smart Codec / H.264+</strong>, configure Resolução em <strong>1080p</strong>, FPS em <strong>15</strong>, Taxa em <strong>CBR 2048 Kbps</strong> e I-Frame em <strong>30</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black text-xs flex items-center justify-center shrink-0">3</span>
                    <div className="space-y-1">
                      <h5 className="font-bold text-white text-xs">Ativar o Push RTMP no Menu de Rede</h5>
                      <p className="text-xs text-zinc-400">
                        Acesse <strong>Rede (Network) &gt; RTMP</strong> (em alguns modelos fica em <em>Acesso à Plataforma</em> ou <em>Transmissão ao Vivo</em>). Marque a opção <strong>Habilitar RTMP</strong> e escolha o tipo <strong>Servidor Personalizado (Custom)</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black text-xs flex items-center justify-center shrink-0">4</span>
                    <div className="space-y-1.5 w-full">
                      <h5 className="font-bold text-white text-xs">Inserir a URL RTMP e Chave do Servidor</h5>
                      <p className="text-xs text-zinc-400">
                        Insira a URL do seu servidor de streaming com a porta 1935 e a chave de fluxo da câmera.
                      </p>
                      <div className="p-2.5 bg-zinc-950 border border-white/10 rounded-lg flex items-center justify-between text-xs font-mono text-emerald-400">
                        <span>rtmp://atalaiadobairro.com.br:1935/live/bairro_rua_cam01</span>
                        <button
                          onClick={() => handleCopy('rtmp://atalaiadobairro.com.br:1935/live/bairro_rua_cam01', 'rtmp_sample')}
                          className="text-[11px] font-sans text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedUrl === 'rtmp_sample' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          <span>{copiedUrl === 'rtmp_sample' ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-black text-xs flex items-center justify-center shrink-0">5</span>
                    <div className="space-y-1">
                      <h5 className="font-bold text-white text-xs">Salvar e Conferir Status Online</h5>
                      <p className="text-xs text-zinc-400">
                        Clique em <strong>Salvar / Aplicar</strong>. Aguarde 10 segundos. O status da conexão deve mudar para <strong>"Conectado"</strong> ou <strong>"Transmitindo"</strong>. A partir desse instante o fluxo já está disponível para visualização.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Troubleshooting RTMP */}
              <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl space-y-2">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Solução de Problemas Mais Frequentes (Troubleshooting):
                </span>
                <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                  <li><strong>Tela Preta no Navegador:</strong> 99% das vezes é o codec H.265 ativo. Entre na câmera e mude para H.264 normal.</li>
                  <li><strong>Vídeo com atraso crescente (delay de 10s ou mais):</strong> GOP / I-Frame muito alto ou CBR desativado. Fixe o I-Frame em 30 e taxa em CBR.</li>
                  <li><strong>Status "Falha de Conexão":</strong> Verifique se a porta 1935 TCP de saída do firewall ou roteador está liberada.</li>
                </ul>
              </div>
            </div>
          )}

          {/* SEÇÃO SERVIDORES & CONVERSÃO HTTPS */}
          {(activeTab === 'all' || activeTab === 'streaming') && (
            <div className="space-y-5 bg-zinc-900/40 border border-white/5 p-6 rounded-2xl">
              <div className="flex items-center gap-2 text-atalaia-neon font-black text-xs uppercase tracking-widest">
                <Server size={18} /> Módulo 4 — Re-streaming RTSP e Conversão para HTTPS
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Como Converter RTSP/RTMP para Web Segura (HTTPS)</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Para tocar em navegadores modernos sem plugins adicionais e sem erro de <em>Mixed Content</em> (Conteúdo Misto), o stream deve ser entregue em HTTPS via HLS (.m3u8), WebRTC WHEP ou player em Iframe seguro.
                </p>
              </div>

              {/* URLs RTSP por Fabricante */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Sintaxe RTSP Local das Principais Marcas:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-black/60 border border-white/10 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-400 font-sans font-bold block">Intelbras / Dahua</span>
                    <div className="text-emerald-400 text-[11px] truncate select-all">
                      rtsp://admin:senha@atalaiadobairro.com.br:554/cam/realmonitor?channel=1&subtype=0
                    </div>
                    <span className="text-[10px] text-zinc-500 font-sans block">Subtype 0 = Main Stream (Full HD) | Subtype 1 = Sub-stream</span>
                  </div>

                  <div className="p-3 bg-black/60 border border-white/10 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-400 font-sans font-bold block">Hikvision / Hilook</span>
                    <div className="text-emerald-400 text-[11px] truncate select-all">
                      rtsp://admin:senha@atalaiadobairro.com.br:554/Streaming/Channels/101
                    </div>
                    <span className="text-[10px] text-zinc-500 font-sans block">Canal 1: 101 = Principal | 102 = Secundário</span>
                  </div>

                  <div className="p-3 bg-black/60 border border-white/10 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-400 font-sans font-bold block">Yoosee / ICSee / V380 (ONVIF)</span>
                    <div className="text-emerald-400 text-[11px] truncate select-all">
                      rtsp://admin:senha@atalaiadobairro.com.br:554/onvif1
                    </div>
                    <span className="text-[10px] text-zinc-500 font-sans block">Padrão ONVIF porta 554 nativa</span>
                  </div>

                  <div className="p-3 bg-black/60 border border-white/10 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-400 font-sans font-bold block">DVRs Multi-Canais</span>
                    <div className="text-emerald-400 text-[11px] truncate select-all">
                      rtsp://admin:senha@atalaiadobairro.com.br:554/cam/realmonitor?channel=2&subtype=0
                    </div>
                    <span className="text-[10px] text-zinc-500 font-sans block">Basta trocar o número do canal da câmera</span>
                  </div>
                </div>
              </div>

              {/* 3 Opções de Conversão */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  3 Opções Homologadas para Entregar o Stream no Atalaia:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 bg-black/60 border border-blue-500/30 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-blue-400 uppercase block">Opção A: RTSP.me / Nuvem</span>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Crie conta no rtsp.me ou mistersrv. Cole o link RTSP com IP externo. O serviço gera uma URL HTTPS pronta para incorporar no Atalaia.
                    </p>
                    <span className="text-[10px] font-mono text-zinc-500 block">Ex: https://rtsp.me/embed/XYZ...</span>
                  </div>

                  <div className="p-4 bg-black/60 border border-emerald-500/30 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase block">Opção B: MediaMTX / go2rtc</span>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Servidor Linux gratuito e open-source. Recebe RTMP (1935) da câmera e emite WebRTC e HLS (.m3u8) com latência menor que 1 segundo!
                    </p>
                    <span className="text-[10px] font-mono text-zinc-500 block">Ex: https://atalaiadobairro.com.br/live/cam01/index.m3u8</span>
                  </div>

                  <div className="p-4 bg-black/60 border border-purple-500/30 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-purple-400 uppercase block">Opção C: YouTube Live</span>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Transmissão ao vivo Não-Listada. Aponte o RTMP para a chave do YouTube. O Atalaia remove todos os controles e toca sem parar.
                    </p>
                    <span className="text-[10px] font-mono text-zinc-500 block">Ex: https://youtube.com/watch?v=...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 3: CADASTRO DE CÂMERAS NO PAINEL */}
          {(activeTab === 'all' || activeTab === 'cameras') && (
            <div className="space-y-4 bg-zinc-900/40 border border-white/5 p-6 rounded-2xl">
              <div className="flex items-center gap-2 text-atalaia-neon font-black text-xs uppercase tracking-widest">
                <Camera size={16} /> Módulo 5 — Cadastro e Homologação de Câmeras no Atalaia
              </div>
              <h2 className="text-xl font-black text-white">Como Inserir e Configurar Streams no Painel</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Na página <strong>Gestão de Câmeras</strong> (/cameras), o integrador clica em "Adicionar Câmera" e preenche os parâmetros:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-atalaia-neon text-black font-black text-xs flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h5 className="font-bold text-white text-xs">Vincular ao Bairro Correto</h5>
                    <p className="text-xs text-zinc-400 mt-0.5">Selecione o bairro onde a câmera física foi instalada para que os moradores tenham acesso autorizado.</p>
                  </div>
                </div>

                <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-atalaia-neon text-black font-black text-xs flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h5 className="font-bold text-white text-xs">Inserir Código Iframe / Stream HTTPS</h5>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Aceita códigos de incorporação completa, RTSP.me, HLS (.m3u8), WebRTC WHEP, YouTube Live ou streams diretos de DVRs/NVRs em HTTPS.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-atalaia-neon text-black font-black text-xs flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h5 className="font-bold text-white text-xs">Marcação Geográfica no Mapa Interativo</h5>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Basta clicar no ponto exato do mapa onde a câmera está fixada. A latitude e longitude são salvas automaticamente gerando o marcador luminoso verde.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-atalaia-neon text-black font-black text-xs flex items-center justify-center shrink-0">4</span>
                  <div>
                    <h5 className="font-bold text-white text-xs">Fotos de Localização e Manutenção</h5>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Anexe a foto da fachada/poste e o registro interno da caixa hermética para histórico técnico e validação de garantias.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 4: INFRAESTRUTURA FÍSICA & FOTOS REAIS */}
          {(activeTab === 'all' || activeTab === 'mod2') && (
            <div className="space-y-4 bg-zinc-900/40 border border-white/5 p-6 rounded-2xl">
              <div className="flex items-center gap-2 text-atalaia-neon font-black text-xs uppercase tracking-widest">
                <Wrench size={16} /> Módulo 2 — Padrão de Instalação Física de Campo
              </div>
              <h2 className="text-xl font-black text-white">Equipamentos e Padrão Homologado</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                As câmeras de rua ficam expostas a chuva, raios, surtos elétricos e vandalismo. Para garantir 99.8% de uptime, siga o padrão:
              </p>

              {/* Grid com as fotos reais do sistema */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-black/60 rounded-xl border border-white/10 overflow-hidden">
                  <div className="aspect-[4/3] bg-zinc-950 overflow-hidden relative">
                    <img 
                      src="/images/caixa_hermetica.jpg" 
                      alt="Caixa Hermética Padrão Atalaia" 
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md text-[10px] text-atalaia-neon font-bold px-2 py-0.5 rounded border border-atalaia-neon/30">
                      PADRÃO IP66 / HOMOLOGADO
                    </span>
                  </div>
                  <div className="p-3">
                    <h5 className="font-bold text-white text-xs">Caixa Hermética de Proteção</h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Contém protetor de surtos DPS, disjuntor de segurança, fonte blindada e organizador de cabos.
                    </p>
                  </div>
                </div>

                <div className="bg-black/60 rounded-xl border border-white/10 overflow-hidden">
                  <div className="aspect-[4/3] bg-zinc-950 overflow-hidden relative">
                    <img 
                      src="/images/placa_advertencia.jpg" 
                      alt="Placa Oficial Atalaia" 
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md text-[10px] text-atalaia-neon font-bold px-2 py-0.5 rounded border border-atalaia-neon/30">
                      PLACA DISSUASIVA 24H
                    </span>
                  </div>
                  <div className="p-3">
                    <h5 className="font-bold text-white text-xs">Placa de Advertência Comunitária</h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Instalada em postes e portões voluntários para respaldo de transparência jurídica e inibição de delitos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
                <strong>Altura Mínima:</strong> Fixar a caixa hermética a pelo menos 3,5 metros de altura no poste ou fachada para proteção contra sabotagem.
              </div>
            </div>
          )}

          {/* SEÇÃO 5: LGPD E MÁSCARAS DE PRIVACIDADE */}
          {(activeTab === 'all' || activeTab === 'lgpd') && (
            <div className="space-y-4 bg-zinc-900/40 border border-white/5 p-6 rounded-2xl">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-widest">
                <Lock size={16} /> Módulo 6 — LGPD & Máscaras de Privacidade
              </div>
              <h2 className="text-xl font-black text-white">Procedimento Técnico e Jurídico Obrigatório</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                A <strong>Lei nº 13.709/2018 (LGPD)</strong> exige que o monitoramento seja restrito à via pública. É expressamente proibido transmitir o interior de quartos, janelas de vizinhos, garagens privativas ou piscinas.
              </p>

              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-red-300">
                  <strong className="text-white block mb-1">Aplicação Obrigatória em Todas as Câmeras:</strong>
                  Antes de divulgar as câmeras aos moradores, o integrador DEVE acessar a ferramenta de máscaras e cobrir todas as áreas íntimas e janelas residenciais com tarjas pretas opacas.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                  <span className="text-xs font-bold text-atalaia-neon uppercase tracking-wider block mb-1">Máscara Retangular</span>
                  <p className="text-xs text-zinc-400">Ideal para bloquear janelas, portas, sacadas e portões fechados de residências particulares.</p>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                  <span className="text-xs font-bold text-atalaia-neon uppercase tracking-wider block mb-1">Máscara Poligonal</span>
                  <p className="text-xs text-zinc-400">Ideal para áreas irregulares como quintais, piscinas vizinhas e ângulos diagonais de muros.</p>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 6: PERFIL & MONETIZAÇÃO */}
          {(activeTab === 'all' || activeTab === 'mod1') && (
            <div className="space-y-4 bg-zinc-900/40 border border-white/5 p-6 rounded-2xl">
              <div className="flex items-center gap-2 text-atalaia-neon font-black text-xs uppercase tracking-widest">
                <Sparkles size={16} /> Módulo 1 — O Modelo de Negócio do Integrador
              </div>
              <h2 className="text-xl font-black text-white">Como Operar e Faturar com o Atalaia</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                O Atalaia transforma câmeras isoladas em uma malha comunitária inteligente. Como integrador homologado, você instala os equipamentos e passa a receber faturamento mensal recorrente comissionado das assinaturas dos moradores (Split no Mercado Pago ou Pix).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 bg-black/50 border border-emerald-500/20 rounded-xl">
                  <div className="text-emerald-400 font-black text-base">Receita Recorrente</div>
                  <p className="text-xs text-zinc-400 mt-1">Split automático direto para o seu Mercado Pago em cada morador ativo.</p>
                </div>
                <div className="p-4 bg-black/50 border border-blue-500/20 rounded-xl">
                  <div className="text-blue-400 font-black text-base">Co-Branding Exclusivo</div>
                  <p className="text-xs text-zinc-400 mt-1">Sua marca e logo exibidos no topo do aplicativo para toda a vizinhança.</p>
                </div>
                <div className="p-4 bg-black/50 border border-amber-500/20 rounded-xl">
                  <div className="text-amber-400 font-black text-base">Venda de Placas & Manutenção</div>
                  <p className="text-xs text-zinc-400 mt-1">Monetização na venda de placas dissuasivas e contratos de suporte.</p>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 7: CHECKLIST TÉCNICO DE HOMOLOGAÇÃO */}
          {(activeTab === 'all' || activeTab === 'checklist') && (
            <div className="space-y-4 bg-zinc-900/40 border border-white/5 p-6 rounded-2xl">
              <div className="flex items-center gap-2 text-atalaia-neon font-black text-xs uppercase tracking-widest">
                <ShieldCheck size={16} /> Módulo 8 — Checklist de Homologação Final
              </div>
              <h2 className="text-xl font-black text-white">Lista de Verificação Antes da Entrega ao Bairro</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Confira cada item antes de considerar o bairro homologado e liberado para cadastros de moradores:
              </p>

              <div className="space-y-2">
                {[
                  'Caixa hermética IP66 instalada a mais de 3,5m com disjuntor e DPS.',
                  'Cabo UTP blindado Cat5e/Cat6 devidamente aterrado e crimpado.',
                  'Câmera configurada em H.264 (sem H.265), FPS 15-20, CBR 2048kbps e GOP 1-2s.',
                  'Push RTMP (porta 1935) ou link RTSP testado e transmitindo em HTTPS sem travamentos.',
                  'Ponto da câmera marcado no mapa com Latitude e Longitude precisas.',
                  'MÁSCARAS DE PRIVACIDADE LGPD aplicadas sobre todas as janelas.',
                  'Placa de Advertência Oficial parafusada em local visível da rua.',
                  'Grupo de WhatsApp do bairro configurado na Central de WhatsApp.',
                  'Chave Pix e credenciais Mercado Pago conferidas no seu perfil.',
                  'Teste simulado de alerta de pânico com notificação via WhatsApp realizado com sucesso.'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-xl">
                    <CheckCircle size={18} className="text-atalaia-neon shrink-0" />
                    <span className="text-xs text-zinc-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Rodapé do Modal com Botão de Download */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-500 text-center sm:text-left flex items-center gap-2">
            <Info size={14} className="text-atalaia-neon shrink-0" />
            <span>Documento Técnico Oficial Atalaia — Homologação Operacional v2.5 (9 Páginas em PDF)</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto cursor-pointer">
              Fechar
            </Button>
            <Button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="bg-atalaia-neon hover:bg-emerald-400 text-black font-black text-xs px-6 py-2.5 shadow-[0_0_20px_rgba(0,255,102,0.3)] w-full sm:w-auto justify-center cursor-pointer"
            >
              {downloading ? 'Gerando PDF...' : 'Baixar Arquivo PDF (.pdf)'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

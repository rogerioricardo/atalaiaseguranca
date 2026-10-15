import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, PrivacyMask, MaskPoint } from '@/types';
import { 
  EyeOff, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  RotateCcw, 
  Sliders, 
  Info, 
  Crosshair, 
  Square, 
  CornerDownLeft, 
  Undo2, 
  MousePointerClick,
  Camera as CameraIcon,
  Upload,
  Image as ImageIcon,
  Video,
  Clipboard,
  Maximize2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { CameraPrivacyMaskOverlay } from './CameraPrivacyMaskOverlay';

interface CameraPrivacyMaskModalProps {
  camera: Camera;
  isOpen: boolean;
  onClose: () => void;
  onSave: (masks: PrivacyMask[], updatedPhotoUrl?: string) => Promise<void> | void;
}

export const CameraPrivacyMaskModal: React.FC<CameraPrivacyMaskModalProps> = ({
  camera,
  isOpen,
  onClose,
  onSave
}) => {
  const [masks, setMasks] = useState<PrivacyMask[]>([]);
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [maskOpacity, setMaskOpacity] = useState<number>(1); // 1 = 100% preto, 0.7 = translúcido para ajuste

  // Modo de desenho: 'polygon' (Ponto a Ponto - PADRÃO) ou 'rect' (Retângulo)
  const [drawMode, setDrawMode] = useState<'polygon' | 'rect'>('polygon');

  // Estado para desenho Ponto a Ponto (Polígono)
  const [polygonPoints, setPolygonPoints] = useState<MaskPoint[]>([]);
  const [mousePos, setMousePos] = useState<MaskPoint | null>(null);
  const [isNearFirstPoint, setIsNearFirstPoint] = useState<boolean>(false);

  // Estado para desenho por arrasto (Retângulo)
  const [isDrawingRect, setIsDrawingRect] = useState(false);
  const [rectStartPos, setRectStartPos] = useState<MaskPoint | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Notificação toast temporária (ex: print colado com sucesso)
  const [notification, setNotification] = useState<string | null>(null);

  // Modo de ajuste da imagem de print: 'cover' (preencher vídeo 16:9) ou 'contain' (inteira)
  const [imageFit, setImageFit] = useState<'cover' | 'contain'>('cover');

  // Print da Câmera (Snapshot / Foto / Captura)
  const [customPrintUrl, setCustomPrintUrl] = useState<string | null>(() => {
    if (camera?.locationPhotoUrl && camera.locationPhotoUrl.trim() !== '') {
      return camera.locationPhotoUrl;
    }
    if (camera?.maintenancePhotoUrl && camera.maintenancePhotoUrl.trim() !== '') {
      return camera.maintenancePhotoUrl;
    }
    if (typeof window !== 'undefined' && camera?.id) {
      try {
        const cached = localStorage.getItem(`atalaia_camera_print_${camera.id}`);
        if (cached) return cached;
      } catch {}
    }
    return null;
  });

  // Parse e detecção da transmissão ou imagem embutida no iframeCode
  const cleanIframeCode = (camera?.iframeCode || '').trim();
  const isHtmlCode = cleanIframeCode.startsWith('<');

  // Detecta se há tag <img src="...">
  const imgTagMatch = cleanIframeCode.match(/<img[^>]+src=["']([^"']+)["']/i);
  let urlFromCode = '';
  if (imgTagMatch) {
    urlFromCode = imgTagMatch[1];
  } else if (isHtmlCode) {
    const srcMatch = cleanIframeCode.match(/src=["']([^"']+)["']/i);
    if (srcMatch) {
      urlFromCode = srcMatch[1];
    }
  }

  let rawUrl = urlFromCode || cleanIframeCode;
  if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be') || rawUrl.includes('vimeo.com') || rawUrl.includes('rtsp.me')) {
    rawUrl = rawUrl.replace(/^http:\/\//gi, 'https://');
  }

  // Verifica se a URL é diretamente uma imagem (jpg, png, webp, data:image, etc.)
  const isDirectImage = Boolean(
    imgTagMatch || 
    /\.(jpeg|jpg|gif|png|webp|bmp|svg)($|\?)/i.test(rawUrl) || 
    rawUrl.startsWith('data:image/')
  );

  const getCleanStreamUrl = (urlStr: string) => {
    if (isDirectImage) return '';
    let url = urlStr;
    try {
      if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
        let videoId = '';
        if (url.includes('youtube.com/watch')) {
          const urlParams = new URLSearchParams(url.split('?')[1] || '');
          videoId = urlParams.get('v') || '';
        } else {
          videoId = url.split('/').pop()?.split('?')[0] || '';
        }
        if (videoId) {
          url = `https://www.youtube.com/embed/${videoId}`;
        }
      }
      const urlObj = new URL(url);
      urlObj.searchParams.set('autoplay', '1');
      urlObj.searchParams.set('mute', '1');
      urlObj.searchParams.set('muted', '1');
      urlObj.searchParams.set('controls', '0');
      url = urlObj.toString();
    } catch {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}autoplay=1&mute=1&controls=0`;
    }
    return url;
  };

  const streamUrl = (rawUrl && !isDirectImage) ? getCleanStreamUrl(rawUrl) : '';
  const isCustomVideoOrScript = isHtmlCode && !urlFromCode && !isDirectImage;

  // Print efetivo consolidado (prioridade: customizado/carregado > imagem direta > locationPhotoUrl > maintenancePhotoUrl)
  const effectivePrintUrl = customPrintUrl || (isDirectImage ? rawUrl : null) || camera?.locationPhotoUrl || camera?.maintenancePhotoUrl || null;

  // Fonte de exibição em background: 'print' (foto/screenshot) ou 'stream' (ao vivo)
  // Se houver print disponível, inicia em 'print' conforme solicitado pelo usuário para desenhar sobre o print!
  const [displaySource, setDisplaySource] = useState<'print' | 'stream'>(() => {
    if (effectivePrintUrl) return 'print';
    if (streamUrl || isCustomVideoOrScript) return 'stream';
    return 'print';
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega as máscaras existentes e print da câmera quando a câmera mudar
  useEffect(() => {
    if (camera) {
      const existing = camera.privacyMasks || [];
      if (existing.length === 0 && typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`atalaia_camera_privacy_masks_${camera.id}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMasks(parsed);
              if (parsed.length > 0) setSelectedMaskId(parsed[0].id);
            }
          }
        } catch {}
      } else {
        setMasks(existing);
        if (existing.length > 0) setSelectedMaskId(existing[0].id);
      }

      // Sincroniza o print da câmera
      let printCandidate = camera.locationPhotoUrl || camera.maintenancePhotoUrl || null;
      if (!printCandidate && typeof window !== 'undefined') {
        try {
          const cachedPrint = localStorage.getItem(`atalaia_camera_print_${camera.id}`);
          if (cachedPrint) printCandidate = cachedPrint;
        } catch {}
      }
      if (printCandidate) {
        setCustomPrintUrl(printCandidate);
        setDisplaySource('print');
      } else if (isDirectImage && rawUrl) {
        setCustomPrintUrl(rawUrl);
        setDisplaySource('print');
      }
    }
  }, [camera, isDirectImage, rawUrl]);

  // Listener para Colar Print da Área de Transferência com Ctrl+V
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      // Ignora paste em inputs de texto
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              if (dataUrl) {
                setCustomPrintUrl(dataUrl);
                setDisplaySource('print');
                try {
                  localStorage.setItem(`atalaia_camera_print_${camera.id}`, dataUrl);
                } catch {}
                setNotification('📸 Print colado com sucesso! Agora você pode desenhar a máscara.');
                setTimeout(() => setNotification(null), 4000);
              }
            };
            reader.readAsDataURL(blob);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, camera.id]);

  // Handler para upload de arquivo de imagem do print
  const handlePrintFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomPrintUrl(dataUrl);
        setDisplaySource('print');
        try {
          localStorage.setItem(`atalaia_camera_print_${camera.id}`, dataUrl);
        } catch {}
        setNotification('📸 Print da câmera carregado com sucesso!');
        setTimeout(() => setNotification(null), 4000);
      }
    };
    reader.readAsDataURL(file);
    // Limpa o valor do input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  // Converte coordenadas do mouse/touch em porcentagem (0-100%) em relação ao container de vídeo
  const getRelativeCoordinates = useCallback((clientX: number, clientY: number): MaskPoint => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
  }, []);

  // Finaliza o polígono e salva como máscara de privacidade
  const handleFinishPolygon = useCallback(() => {
    if (polygonPoints.length < 3) return;

    const xs = polygonPoints.map(p => p.x);
    const ys = polygonPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const newMask: PrivacyMask = {
      id: `mask-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      x: Number(minX.toFixed(1)),
      y: Number(minY.toFixed(1)),
      width: Number(Math.max(1, maxX - minX).toFixed(1)),
      height: Number(Math.max(1, maxY - minY).toFixed(1)),
      points: [...polygonPoints],
      type: 'polygon',
      label: `Área Privada #${masks.length + 1}`
    };

    setMasks(prev => [...prev, newMask]);
    setSelectedMaskId(newMask.id);
    setPolygonPoints([]);
    setIsNearFirstPoint(false);
  }, [polygonPoints, masks.length]);

  // Atalhos de teclado (Enter para fechar polígono, Esc para cancelar, Backspace para desfazer ponto)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (polygonPoints.length > 0) {
          setPolygonPoints([]);
          setIsNearFirstPoint(false);
        } else {
          onClose();
        }
      } else if (e.key === 'Enter') {
        if (polygonPoints.length >= 3) {
          handleFinishPolygon();
        }
      } else if (e.key === 'Backspace' || (e.key === 'z' && (e.ctrlKey || e.metaKey))) {
        if (polygonPoints.length > 0) {
          e.preventDefault();
          setPolygonPoints(prev => prev.slice(0, -1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, polygonPoints, handleFinishPolygon, onClose]);

  // Tratador de movimento do mouse (atualiza posição da cruz e verifica proximidade com o ponto 1)
  const handleMouseMoveOrTouch = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const coords = getRelativeCoordinates(clientX, clientY);

    setMousePos(coords);

    if (drawMode === 'polygon') {
      if (polygonPoints.length >= 2) {
        const first = polygonPoints[0];
        const dist = Math.hypot(coords.x - first.x, coords.y - first.y);
        // Se estiver a menos de 3.5% do primeiro ponto, ativa o snap de fechamento
        setIsNearFirstPoint(dist < 3.5);
      } else {
        setIsNearFirstPoint(false);
      }
    } else if (drawMode === 'rect' && isDrawingRect && rectStartPos) {
      const x = Math.min(rectStartPos.x, coords.x);
      const y = Math.min(rectStartPos.y, coords.y);
      const width = Math.abs(coords.x - rectStartPos.x);
      const height = Math.abs(coords.y - rectStartPos.y);
      setCurrentRect({
        x: Number(x.toFixed(1)),
        y: Number(y.toFixed(1)),
        width: Number(Math.max(1, width).toFixed(1)),
        height: Number(Math.max(1, height).toFixed(1))
      });
    }
  };

  // Clique no canvas (adiciona vértice no modo polígono)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (drawMode !== 'polygon') return;
    const coords = getRelativeCoordinates(e.clientX, e.clientY);

    // Se já tiver pelo menos 3 pontos e clicou perto do ponto 1, fecha o polígono automaticamente
    if (polygonPoints.length >= 3 && isNearFirstPoint) {
      handleFinishPolygon();
      return;
    }

    // Adiciona o novo vértice
    setPolygonPoints(prev => [...prev, coords]);
  };

  // Duplo clique fecha o polígono
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (drawMode === 'polygon' && polygonPoints.length >= 3) {
      e.preventDefault();
      handleFinishPolygon();
    }
  };

  // Início do arrasto no modo retangular
  const handleMouseDownRect = (e: React.MouseEvent) => {
    if (drawMode !== 'rect') return;
    const coords = getRelativeCoordinates(e.clientX, e.clientY);
    setIsDrawingRect(true);
    setRectStartPos(coords);
    setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  // Fim do arrasto no modo retangular
  const handleMouseUpRect = () => {
    if (drawMode !== 'rect' || !isDrawingRect || !currentRect) return;
    setIsDrawingRect(false);

    // Ignora retângulos minúsculos (cliques acidentais)
    if (currentRect.width < 2 && currentRect.height < 2) {
      setCurrentRect(null);
      setRectStartPos(null);
      return;
    }

    const newMask: PrivacyMask = {
      id: `mask-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      x: currentRect.x,
      y: currentRect.y,
      width: currentRect.width,
      height: currentRect.height,
      type: 'rect',
      label: `Tarja Retangular #${masks.length + 1}`
    };

    setMasks(prev => [...prev, newMask]);
    setSelectedMaskId(newMask.id);
    setCurrentRect(null);
    setRectStartPos(null);
  };

  // Adiciona um preset rápido de máscara
  const handleAddPreset = (type: 'center' | 'top' | 'bottom') => {
    const id = `mask-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let newMask: PrivacyMask;

    if (type === 'center') {
      newMask = {
        id,
        x: 30,
        y: 30,
        width: 40,
        height: 40,
        type: 'rect',
        label: `Área Central #${masks.length + 1}`
      };
    } else if (type === 'top') {
      newMask = {
        id,
        x: 0,
        y: 0,
        width: 100,
        height: 25,
        type: 'rect',
        label: `Faixa Superior #${masks.length + 1}`
      };
    } else {
      newMask = {
        id,
        x: 0,
        y: 75,
        width: 100,
        height: 25,
        type: 'rect',
        label: `Faixa Inferior #${masks.length + 1}`
      };
    }

    setMasks(prev => [...prev, newMask]);
    setSelectedMaskId(newMask.id);
  };

  // Ajuste fino de posição para máscara selecionada (funciona para retângulos e polígonos)
  const updateSelectedMaskCoord = (field: 'x' | 'y' | 'width' | 'height', delta: number) => {
    if (!selectedMaskId) return;
    setMasks(prev => prev.map(m => {
      if (m.id !== selectedMaskId) return m;

      // Se for polígono e estiver ajustando X ou Y, translada todos os vértices
      if (m.points && m.points.length >= 3 && (field === 'x' || field === 'y')) {
        const updatedPoints = m.points.map(p => ({
          x: Number(Math.max(0, Math.min(100, p.x + (field === 'x' ? delta : 0))).toFixed(1)),
          y: Number(Math.max(0, Math.min(100, p.y + (field === 'y' ? delta : 0))).toFixed(1))
        }));
        const xs = updatedPoints.map(p => p.x);
        const ys = updatedPoints.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        return {
          ...m,
          x: Number(minX.toFixed(1)),
          y: Number(minY.toFixed(1)),
          width: Number((maxX - minX).toFixed(1)),
          height: Number((maxY - minY).toFixed(1)),
          points: updatedPoints
        };
      }

      // Para retângulos
      let val = m[field] + delta;
      if (field === 'x' || field === 'y') {
        val = Math.max(0, Math.min(100 - (field === 'x' ? m.width : m.height), val));
      } else {
        val = Math.max(2, Math.min(100, val));
      }
      return { ...m, [field]: Number(val.toFixed(1)) };
    }));
  };

  // Remove uma máscara específica
  const handleDeleteMask = (id: string) => {
    setMasks(prev => prev.filter(m => m.id !== id));
    if (selectedMaskId === id) setSelectedMaskId(null);
  };

  // Remove todas as máscaras
  const handleClearAll = () => {
    if (masks.length === 0) return;
    if (confirm('Deseja realmente remover todas as máscaras pretas de privacidade desta câmera?')) {
      setMasks([]);
      setSelectedMaskId(null);
      setPolygonPoints([]);
    }
  };

  // Salva as configurações
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (customPrintUrl && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`atalaia_camera_print_${camera.id}`, customPrintUrl);
        } catch {}
      }
      await onSave(masks, customPrintUrl || undefined);
      onClose();
    } catch (err) {
      console.error("Erro ao salvar máscaras de privacidade:", err);
      alert("Erro ao salvar as máscaras. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedMask = masks.find(m => m.id === selectedMaskId);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-4xl bg-zinc-950 border border-atalaia-neon/40 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,240,255,0.25)] flex flex-col max-h-[92vh] z-10"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-black via-zinc-950 to-zinc-900 gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black border border-atalaia-neon/40 flex items-center justify-center text-atalaia-neon shadow-[0_0_15px_rgba(0,240,255,0.3)] shrink-0">
                <EyeOff size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-white font-black text-sm sm:text-base uppercase tracking-wider font-mono flex items-center gap-2">
                    <span>Máscara de Privacidade</span>
                    <span className="text-[10px] text-black bg-atalaia-neon px-2 py-0.5 rounded-full font-sans font-black">
                      TARJA PRETA
                    </span>
                  </h2>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Câmera: <strong className="text-white">{camera.name}</strong> • Desenhe ponto a ponto sobre o print da imagem para cobrir áreas privadas
                </p>
              </div>
            </div>

            <button 
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Notificação Toast Flutuante (ex: Print colado com sucesso) */}
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-500 text-black px-4 py-2 text-xs font-mono font-bold flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Check size={16} strokeWidth={3} />
                <span>{notification}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setNotification(null)}
                className="text-black/70 hover:text-black"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}

          {/* Barra de Ferramentas / Seletor de Print vs Stream / Modos de Desenho / Opacidade */}
          <div className="bg-zinc-900/95 border-b border-white/5 px-4 py-2.5 flex items-center justify-between text-xs text-zinc-300 gap-3 flex-wrap shrink-0">
            {/* Visualização de Fundo: Print da Câmera vs Vídeo ao Vivo */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Imagem:</span>
              <div className="flex items-center bg-black/80 border border-white/10 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setDisplaySource('print')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                    displaySource === 'print'
                      ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Exibir o print estático da câmera (ideal para desenhar com firmeza)"
                >
                  <ImageIcon size={13} strokeWidth={2.5} />
                  <span>Print da Imagem</span>
                  {effectivePrintUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />}
                </button>

                {(streamUrl || isCustomVideoOrScript) && (
                  <button
                    type="button"
                    onClick={() => setDisplaySource('stream')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                      displaySource === 'stream'
                        ? 'bg-atalaia-neon text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Alternar para transmissão de vídeo ao vivo"
                  >
                    <Video size={13} strokeWidth={2.5} />
                    <span>Ao Vivo</span>
                  </button>
                )}
              </div>

              {/* Botões para carregar ou colar novo print */}
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePrintFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-400 text-[11px] font-mono font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Carregar um arquivo de imagem do print da câmera do seu computador"
                >
                  <Upload size={12} />
                  <span>{effectivePrintUrl ? 'Trocar Print' : 'Carregar Print'}</span>
                </button>

                {effectivePrintUrl && (
                  <button
                    type="button"
                    onClick={() => setImageFit(prev => prev === 'cover' ? 'contain' : 'cover')}
                    className="p-1 px-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white rounded-lg text-[10px] font-mono transition-colors"
                    title={`Ajuste da imagem: ${imageFit === 'cover' ? 'Preenchendo vídeo (Cover)' : 'Foto inteira (Contain)'}`}
                  >
                    {imageFit === 'cover' ? 'Preencher' : 'Conter'}
                  </button>
                )}
              </div>
            </div>

            {/* Seletor de Modo de Desenho: Ponto a Ponto vs Retângulo */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Desenho:</span>
              <div className="flex items-center bg-black/70 border border-white/10 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setDrawMode('polygon');
                    setIsDrawingRect(false);
                    setCurrentRect(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                    drawMode === 'polygon'
                      ? 'bg-atalaia-neon text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Desenhe polígonos ponto a ponto clicando nos vértices com a cruz do mouse"
                >
                  <Crosshair size={13} strokeWidth={2.5} />
                  <span>Ponto a Ponto</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrawMode('rect');
                    setPolygonPoints([]);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                    drawMode === 'rect'
                      ? 'bg-atalaia-neon text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Clique e arraste para desenhar retângulos rápidos"
                >
                  <Square size={13} strokeWidth={2.5} />
                  <span>Retângulo</span>
                </button>
              </div>
            </div>

            {/* Presets Rápidos */}
            <div className="hidden xl:flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono font-bold text-gray-500">Presets:</span>
              <button
                type="button"
                onClick={() => handleAddPreset('center')}
                className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-[10px] font-bold rounded transition-colors"
              >
                Centro
              </button>
              <button
                type="button"
                onClick={() => handleAddPreset('top')}
                className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-[10px] font-bold rounded transition-colors"
              >
                Superior
              </button>
              <button
                type="button"
                onClick={() => handleAddPreset('bottom')}
                className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-[10px] font-bold rounded transition-colors"
              >
                Inferior
              </button>
            </div>

            {/* Opacidade de Ajuste e Botão Limpar */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setMaskOpacity(1)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${maskOpacity === 1 ? 'bg-atalaia-neon text-black' : 'text-gray-400 hover:text-white'}`}
                  title="Exibir tarja 100% preta (como os moradores verão)"
                >
                  Preto Total
                </button>
                <button
                  type="button"
                  onClick={() => setMaskOpacity(0.7)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${maskOpacity === 0.7 ? 'bg-atalaia-neon text-black' : 'text-gray-400 hover:text-white'}`}
                  title="Modo ajuste: ver vídeo por baixo para enquadrar a janela ou sacada"
                >
                  Translúcido
                </button>
              </div>

              {masks.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Remover todas as máscaras"
                >
                  <RotateCcw size={11} /> Limpar
                </button>
              )}
            </div>
          </div>

          {/* Canvas interativo com o Print da Imagem ou Player de Vídeo em background */}
          <div className="p-3 sm:p-5 flex-1 overflow-y-auto space-y-4">
            <div 
              className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl select-none group"
              onMouseLeave={() => setMousePos(null)}
            >
              {/* O Print da Imagem da Câmera ou Player no Fundo */}
              <div className="absolute inset-0 pointer-events-none">
                {displaySource === 'print' && effectivePrintUrl ? (
                  // EXIBIÇÃO DO PRINT ESTÁTICO DA CÂMERA
                  <div className="w-full h-full relative bg-zinc-950 flex items-center justify-center overflow-hidden">
                    <img 
                      src={effectivePrintUrl} 
                      alt={`Print da ${camera.name}`} 
                      className={`w-full h-full pointer-events-none select-none transition-all ${
                        imageFit === 'contain' ? 'object-contain' : 'object-cover'
                      }`}
                      onError={() => {
                        console.warn("Falha ao carregar print da câmera:", effectivePrintUrl);
                      }}
                    />
                    {/* Badge indicando que está sobre o print estático */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/80 backdrop-blur px-2.5 py-1 rounded-lg border border-emerald-500/40 z-10 pointer-events-none">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-wider uppercase">
                        PRINT ESTÁTICO DA CÂMERA
                      </span>
                    </div>
                  </div>
                ) : displaySource === 'stream' && isCustomVideoOrScript ? (
                  // CÓDIGO HTML DE VÍDEO
                  <div 
                    className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:inset-0 [&_video]:w-full [&_video]:h-full [&_video]:absolute [&_video]:inset-0 [&_iframe]:border-0 [&_video]:object-cover"
                    dangerouslySetInnerHTML={{ 
                      __html: cleanIframeCode
                        .replace(/<video([^>]*)>/gi, (match, attrs) => {
                          let cleanAttrs = attrs.replace(/\b(autoplay|muted|playsinline|loop|controls)\b/gi, '');
                          return `<video ${cleanAttrs} autoplay="true" muted="true" playsinline="true" loop="true" style="width:100%; height:100%; object-fit:cover; border:none;">`;
                        })
                        .replace(/<iframe([^>]*)>/gi, (match, attrs) => {
                          let cleanAttrs = attrs.replace(/style=["']([^"']*)["']/gi, '');
                          return `<iframe ${cleanAttrs} style="width:100%; height:100%; position:absolute; inset:0; border:none;" allow="autoplay; encrypted-media">`;
                        })
                    }}
                  />
                ) : displaySource === 'stream' && streamUrl ? (
                  // IFRAME DE TRANSMISSÃO AO VIVO
                  <iframe 
                    src={streamUrl} 
                    title={camera.name}
                    className="w-full h-full border-0 pointer-events-none"
                    allowFullScreen 
                    loading="eager"
                  />
                ) : effectivePrintUrl ? (
                  // FALLBACK AUTOMÁTICO PARA O PRINT SE A TRANSMISSÃO NÃO ESTIVER DISPONÍVEL
                  <div className="w-full h-full relative bg-zinc-950 flex items-center justify-center overflow-hidden">
                    <img 
                      src={effectivePrintUrl} 
                      alt={`Print da ${camera.name}`} 
                      className={`w-full h-full pointer-events-none select-none ${
                        imageFit === 'contain' ? 'object-contain' : 'object-cover'
                      }`}
                    />
                  </div>
                ) : (
                  // NENHUMA IMAGEM E NENHUM VÍDEO DETECTADO
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950 pointer-events-auto">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-atalaia-neon mb-3 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                      <CameraIcon size={28} />
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase font-mono">
                      Nenhum print ou transmissão detectada
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-md">
                      Carregue um arquivo de imagem do print da câmera ou aperte <kbd className="px-1.5 py-0.5 bg-black border border-white/20 rounded text-atalaia-neon font-mono font-bold">Ctrl+V</kbd> para colar a foto e desenhar a máscara sobre ela.
                    </p>
                    <div className="flex items-center gap-2.5 mt-4 flex-wrap justify-center">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-atalaia-neon text-black font-bold text-xs font-mono flex items-center gap-2 hover:bg-white transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] cursor-pointer"
                      >
                        <Upload size={14} /> Selecionar Arquivo do Print
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const sampleUrl = 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80';
                          setCustomPrintUrl(sampleUrl);
                          setDisplaySource('print');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ImageIcon size={14} /> Usar Imagem Exemplo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Camada das Máscaras Pretas Salvas (Polígonos e Retângulos) */}
              <CameraPrivacyMaskOverlay
                masks={masks}
                opacity={maskOpacity}
                selectedMaskId={selectedMaskId}
                onSelectMask={(id) => {
                  // Só seleciona se não estiver no meio de um desenho
                  if (polygonPoints.length === 0 && !isDrawingRect) {
                    setSelectedMaskId(id);
                  }
                }}
                showLabels={true}
              />

              {/* Camada Interativa de Desenho com Cruz do Mouse */}
              <div 
                ref={containerRef}
                onClick={handleCanvasClick}
                onDoubleClick={handleDoubleClick}
                onMouseMove={handleMouseMoveOrTouch}
                onTouchMove={handleMouseMoveOrTouch}
                onMouseDown={handleMouseDownRect}
                onMouseUp={handleMouseUpRect}
                className="absolute inset-0 cursor-crosshair z-20"
                style={{ touchAction: 'none' }}
              >
                {/* SVG Interativo em Tempo Real para Desenho Ponto a Ponto */}
                {drawMode === 'polygon' && (
                  <svg 
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none"
                  >
                    {/* Linhas conectando os pontos já marcados */}
                    {polygonPoints.length >= 2 && (
                      <polyline
                        points={polygonPoints.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke="#00f0ff"
                        strokeWidth="0.5"
                        strokeDasharray="1 0.5"
                      />
                    )}

                    {/* Preenchimento temporário semitransparente se tiver >= 2 pontos */}
                    {polygonPoints.length >= 2 && mousePos && (
                      <polygon
                        points={[
                          ...polygonPoints.map(p => `${p.x},${p.y}`),
                          `${mousePos.x},${mousePos.y}`
                        ].join(' ')}
                        fill="rgba(0, 240, 255, 0.2)"
                        stroke="#00f0ff"
                        strokeWidth="0.3"
                      />
                    )}

                    {/* Linha dinâmica da última ponta até a posição atual da cruz do mouse */}
                    {polygonPoints.length > 0 && mousePos && (
                      <line
                        x1={polygonPoints[polygonPoints.length - 1].x}
                        y1={polygonPoints[polygonPoints.length - 1].y}
                        x2={isNearFirstPoint ? polygonPoints[0].x : mousePos.x}
                        y2={isNearFirstPoint ? polygonPoints[0].y : mousePos.y}
                        stroke={isNearFirstPoint ? "#10b981" : "#00f0ff"}
                        strokeWidth="0.6"
                        strokeDasharray="1 0.5"
                      />
                    )}

                    {/* Linha guia de fechamento caso já tenha >= 2 pontos */}
                    {polygonPoints.length >= 2 && mousePos && !isNearFirstPoint && (
                      <line
                        x1={mousePos.x}
                        y1={mousePos.y}
                        x2={polygonPoints[0].x}
                        y2={polygonPoints[0].y}
                        stroke="rgba(0, 240, 255, 0.4)"
                        strokeWidth="0.3"
                        strokeDasharray="0.8 0.8"
                      />
                    )}

                    {/* Vértices já colocados com números */}
                    {polygonPoints.map((pt, idx) => {
                      const isFirst = idx === 0;
                      return (
                        <g key={idx}>
                          {/* Anel pulsante no 1º ponto para indicar que clicar nele fecha o polígono */}
                          {isFirst && polygonPoints.length >= 2 && (
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isNearFirstPoint ? 2.5 : 1.8}
                              fill="none"
                              stroke={isNearFirstPoint ? "#10b981" : "#00f0ff"}
                              strokeWidth="0.4"
                              className={isNearFirstPoint ? "animate-ping" : ""}
                            />
                          )}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isFirst && isNearFirstPoint ? 1.5 : 1.1}
                            fill={isFirst && isNearFirstPoint ? "#10b981" : "#00f0ff"}
                            stroke="#000000"
                            strokeWidth="0.3"
                            style={{ filter: 'drop-shadow(0 0 2px rgba(0,240,255,0.9))' }}
                          />
                        </g>
                      );
                    })}
                  </svg>
                )}

                {/* Retângulo sendo desenhado no modo 'rect' */}
                {drawMode === 'rect' && isDrawingRect && currentRect && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${currentRect.x}%`,
                      top: `${currentRect.y}%`,
                      width: `${currentRect.width}%`,
                      height: `${currentRect.height}%`,
                      backgroundColor: 'rgba(0, 0, 0, 0.95)',
                      border: '2px dashed #00f0ff',
                      boxShadow: '0 0 20px rgba(0,240,255,0.7)'
                    }}
                    className="flex items-center justify-center pointer-events-none"
                  >
                    <span className="text-[10px] text-atalaia-neon font-mono font-bold bg-black/90 px-2 py-0.5 rounded border border-atalaia-neon/40">
                      {currentRect.width}% x {currentRect.height}%
                    </span>
                  </div>
                )}
              </div>

              {/* Floating HUD de Ação durante o desenho Ponto a Ponto */}
              {drawMode === 'polygon' && polygonPoints.length > 0 && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/90 border border-atalaia-neon/60 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-[0_0_25px_rgba(0,240,255,0.4)]">
                  <span className="w-2 h-2 rounded-full bg-atalaia-neon animate-pulse" />
                  <span className="text-xs font-mono font-bold text-white">
                    {polygonPoints.length} {polygonPoints.length === 1 ? 'ponto marcado' : 'pontos marcados'}
                  </span>

                  <div className="h-4 w-[1px] bg-white/20 mx-1" />

                  {polygonPoints.length >= 3 ? (
                    <button
                      type="button"
                      onClick={handleFinishPolygon}
                      className="px-2.5 py-1 bg-atalaia-neon text-black text-xs font-mono font-black rounded-lg hover:bg-white transition-all shadow-[0_0_12px_rgba(0,240,255,0.6)] flex items-center gap-1 cursor-pointer"
                      title="Fechar e criar a tarja preta poligonal (ou pressione Enter)"
                    >
                      <Check size={13} strokeWidth={3} />
                      <span>Concluir Máscara (Enter)</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono text-zinc-400">
                      Marque mais {3 - polygonPoints.length} ponto(s)...
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setPolygonPoints(prev => prev.slice(0, -1))}
                    className="p-1 hover:bg-white/10 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Desfazer último ponto (Z)"
                  >
                    <Undo2 size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPolygonPoints([]);
                      setIsNearFirstPoint(false);
                    }}
                    className="p-1 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                    title="Cancelar desenho (Esc)"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Indicador de Status no rodapé do player */}
              <div className="absolute bottom-3 left-3 z-30 pointer-events-none flex items-center gap-2 bg-black/85 backdrop-blur px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-mono text-zinc-300 shadow-lg">
                <Crosshair size={13} className="text-atalaia-neon animate-pulse" />
                {drawMode === 'polygon' ? (
                  polygonPoints.length === 0 ? (
                    <span>CLIQUE COM A CRUZ DO MOUSE NO PRINT PARA O 1º PONTO DA MÁSCARA</span>
                  ) : isNearFirstPoint ? (
                    <span className="text-emerald-400 font-bold">CLIQUE NO PONTO INICIAL PARA FECHAR O POLÍGONO!</span>
                  ) : (
                    <span>CLIQUE NOS PRÓXIMOS PONTOS • DUPLO CLIQUE OU ENTER PARA CONCLUIR</span>
                  )
                ) : (
                  <span>CLIQUE E ARRASTE COM O MOUSE PARA CRIAR UM RETÂNGULO</span>
                )}

                {mousePos && (
                  <span className="text-zinc-500 border-l border-white/20 pl-2 ml-1">
                    X: {mousePos.x}% Y: {mousePos.y}%
                  </span>
                )}
              </div>
            </div>

            {/* Dica de Atalho Ctrl+V para Print */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-atalaia-neon" />
                <span>Dica: Você pode tirar um print da tela e pressionar <kbd className="px-1.5 py-0.5 bg-black border border-white/20 rounded text-atalaia-neon font-mono font-bold">Ctrl+V</kbd> para colar a foto da câmera diretamente aqui.</span>
              </span>
              {effectivePrintUrl && (
                <span className="text-[10px] text-emerald-400 font-mono">
                  ✓ Print carregado
                </span>
              )}
            </div>

            {/* Painel de Ajuste da Máscara Selecionada */}
            {selectedMask && (
              <div className="bg-black/70 border border-atalaia-neon/40 rounded-2xl p-3.5 space-y-3 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-atalaia-neon" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <span>Editando: <strong className="text-atalaia-neon">{selectedMask.label || 'Máscara'}</strong></span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-normal">
                        {selectedMask.points && selectedMask.points.length >= 3 
                          ? `Polígono (${selectedMask.points.length} pontos)` 
                          : 'Retângulo'}
                      </span>
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteMask(selectedMask.id)}
                      className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} /> Excluir esta Máscara
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                      Nome / Motivo do Bloqueio:
                    </label>
                    <input
                      type="text"
                      value={selectedMask.label || ''}
                      placeholder="Ex: Janela 2º Andar, Sacada, Piscina"
                      onChange={(e) => {
                        const newLabel = e.target.value;
                        setMasks(prev => prev.map(m => m.id === selectedMask.id ? { ...m, label: newLabel } : m));
                      }}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-atalaia-neon"
                    />
                  </div>

                  {/* Controles de Translação X / Y */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                      <span>Mover Horizontal (X)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateSelectedMaskCoord('x', -2)}
                        className="flex-1 h-7 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white rounded text-xs font-mono font-bold cursor-pointer"
                      >
                        ← -2%
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedMaskCoord('x', 2)}
                        className="flex-1 h-7 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white rounded text-xs font-mono font-bold cursor-pointer"
                      >
                        +2% →
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                      <span>Mover Vertical (Y)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateSelectedMaskCoord('y', -2)}
                        className="flex-1 h-7 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white rounded text-xs font-mono font-bold cursor-pointer"
                      >
                        ↑ -2%
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedMaskCoord('y', 2)}
                        className="flex-1 h-7 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white rounded text-xs font-mono font-bold cursor-pointer"
                      >
                        +2% ↓
                      </button>
                    </div>
                  </div>

                  {/* Redimensionamento (se for retângulo) ou Info do Polígono */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                      <span>Dimensões</span>
                    </div>
                    <div className="h-7 bg-zinc-900/80 border border-white/10 rounded px-2 flex items-center justify-center text-[10px] font-mono text-atalaia-neon font-bold">
                      {selectedMask.width}% x {selectedMask.height}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lista com todas as Máscaras Criadas */}
            {masks.length > 0 && (
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <EyeOff size={14} className="text-atalaia-neon" />
                    <span>Todas as Áreas Mascaradas ({masks.length})</span>
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Clique em qualquer máscara para selecionar e ajustar
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {masks.map((mask, idx) => {
                    const isSelected = selectedMaskId === mask.id;
                    const isPoly = mask.points && mask.points.length >= 3;

                    return (
                      <div
                        key={mask.id}
                        onClick={() => setSelectedMaskId(mask.id)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-black/90 border-atalaia-neon shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                            : 'bg-black/50 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded bg-black border border-white/20 text-atalaia-neon flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0 truncate">
                            <span className="text-[11px] font-bold text-white block truncate">
                              {mask.label || `Máscara #${idx + 1}`}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-400 block">
                              {isPoly ? `Polígono (${mask.points!.length} vértices)` : `Retângulo (${mask.width}x${mask.height}%)`}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMask(mask.id);
                          }}
                          className="p-1 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-colors shrink-0"
                          title="Remover máscara"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer de Ações */}
          <div className="p-4 bg-zinc-900 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap shrink-0">
            <div className="text-[11px] text-zinc-400">
              {masks.length === 0 ? (
                <span className="italic text-amber-400/90 flex items-center gap-1.5">
                  <Info size={14} /> Nenhuma máscara salva. Use a cruz do mouse para desenhar ponto a ponto.
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
                  <Check size={14} /> {masks.length} área(s) mascarada(s) em preto absoluto permanente
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="text-xs h-9 px-4 border-white/10 hover:border-white/20 text-zinc-300"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="text-xs h-9 px-5 bg-atalaia-neon text-black hover:bg-atalaia-neon/90 font-black shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <Check size={14} strokeWidth={3} />
                    <span>Salvar Tarja Preta ({masks.length})</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

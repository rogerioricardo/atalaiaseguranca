
import React, { useEffect, useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/auth/context';
import { UserRole, Neighborhood, Camera, RecordingRequest } from '@/types';
import { MockService } from '@/services/mockService';
import { supabase } from '@/lib/supabaseClient';
import { 
    Video, Plus, Trash2, Search, MapPin, 
    AlertTriangle, Shield, CheckCircle, Info, ExternalLink,
    ChevronRight, Camera as CameraIcon, Loader2, Edit2, X, Lock,
    Maximize2, Clock, Wrench, RefreshCw, Calendar, Download, 
    Upload, FileText, Phone, UploadCloud
} from 'lucide-react';
import { Card, Button, Input, Badge } from '@/components/UI';
import { UpgradeModal } from '@/components/UpgradeModal';
import { motion, AnimatePresence } from 'motion/react';

// Relógio tático isolado para impedir que todo o painel de câmeras re-renderize a cada 1 segundo
const TacticalClock: React.FC = () => {
  const [time, setTime] = useState('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR'));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-gray-300">
      <Clock size={12} className="text-atalaia-neon" />
      <span>{time}</span>
    </div>
  );
};

interface CameraStreamPlayerProps {
  iframeCode: string;
  name: string;
  id: string;
  onExpand: () => void;
  isModal?: boolean;
  maintenancePhotoUrl?: string;
}

// Player de streaming que foca em reprodução em tempo real e em modo limpo (sem controles/textos), com a opção de popup no hover
const CameraStreamPlayer: React.FC<CameraStreamPlayerProps> = React.memo(({ iframeCode, name, id, onExpand, isModal = false, maintenancePhotoUrl }) => {
  if (!iframeCode || iframeCode.trim() === '') {
    return (
      <div className="relative w-full h-full group/video-container flex flex-col items-center justify-center bg-[#0a0a0a] text-center overflow-hidden rounded-2xl border border-white/5">
        {maintenancePhotoUrl ? (
           <img src={maintenancePhotoUrl} alt="Câmera em manutenção" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
           <div className="p-4 flex flex-col items-center justify-center">
             <Wrench className="text-gray-500 mb-2 animate-pulse" size={32} />
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Câmera em Manutenção</h3>
             <p className="text-xs text-gray-600 mt-2 max-w-[250px]">Em breve estará transmitindo.</p>
           </div>
        )}
      </div>
    );
  }

  const cleanIframeCode = iframeCode.trim();

  // Tenta extrair a URL de um código iframe caso tenha sido fornecido em HTML
  const isHtmlCode = cleanIframeCode.startsWith('<');
  let urlFromCode = '';
  if (isHtmlCode) {
    const srcMatch = cleanIframeCode.match(/src=["']([^"']+)["']/i);
    if (srcMatch) {
      urlFromCode = srcMatch[1];
    }
  }

  // Define a URL final de reprodução
  let rawUrl = urlFromCode || cleanIframeCode;

  // Se for um link de plataforma conhecida, atualiza para HTTPS automaticamente para prevenir bloqueios de conteúdo misto
  if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be') || rawUrl.includes('vimeo.com') || rawUrl.includes('rtsp.me')) {
    rawUrl = rawUrl.replace(/^http:\/\//gi, 'https://');
  }

  // Gera a URL ultra-clean com parâmetros para reprodução automática, sem controles, sem timelines e sem marcas
  const getCleanStreamUrl = (urlStr: string) => {
    let url = urlStr;
    try {
      // Se for URL normal do YouTube, converte para embed
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
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        urlObj.searchParams.set('autoplay', '1');
        urlObj.searchParams.set('mute', '1');
        urlObj.searchParams.set('muted', '1');
        urlObj.searchParams.set('controls', '0');
        urlObj.searchParams.set('showinfo', '0');
        urlObj.searchParams.set('rel', '0');
        urlObj.searchParams.set('modestbranding', '1');
        urlObj.searchParams.set('iv_load_policy', '3');
        urlObj.searchParams.set('playsinline', '1');
        urlObj.searchParams.set('loop', '1');
        const videoId = urlObj.pathname.split('/').pop();
        if (videoId) {
          urlObj.searchParams.set('playlist', videoId);
        }
      } else if (urlObj.hostname.includes('vimeo.com')) {
        urlObj.searchParams.set('autoplay', '1');
        urlObj.searchParams.set('mute', '1');
        urlObj.searchParams.set('muted', '1');
        urlObj.searchParams.set('background', '1'); // Oculta todos os controles e força reprodução direta de fundo
        urlObj.searchParams.set('loop', '1');
        urlObj.searchParams.set('playsinline', '1');
        urlObj.searchParams.set('controls', '0');
      } else {
        urlObj.searchParams.set('autoplay', '1');
        urlObj.searchParams.set('mute', '1');
        urlObj.searchParams.set('muted', '1');
        urlObj.searchParams.set('controls', '0');
      }
      url = urlObj.toString();
    } catch (e) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}autoplay=1&mute=1&muted=1&controls=0&playsinline=1&loop=1`;
    }
    return url;
  };

  const cleanStreamUrl = getCleanStreamUrl(rawUrl);

  const handleOpenHttp = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try { 
      window.open(rawUrl, `cam_${id}`, 'width=800,height=600,menubar=no,status=no,location=no,toolbar=no,scrollbars=no,resizable=yes'); 
    } catch (err) { 
      console.warn("Invalid URL", err); 
    }
  };

  const isCustomVideoOrScript = isHtmlCode && !urlFromCode;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center group/video-container rounded-2xl border border-white/5">
      {isCustomVideoOrScript ? (
        // Caso de código HTML customizado (video tag ou scripts de widget)
        <div 
          className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:absolute [&_iframe]:inset-0 [&_video]:w-full [&_video]:h-full [&_video]:absolute [&_video]:inset-0 [&_iframe]:border-0 [&_video]:object-cover [&_iframe]:object-cover"
          dangerouslySetInnerHTML={{ 
            __html: cleanIframeCode
              .replace(/<video([^>]*)>/gi, (match, attrs) => {
                let cleanAttrs = attrs.replace(/\b(autoplay|muted|playsinline|loop|controls)\b/gi, '');
                return `<video ${cleanAttrs} autoplay="true" muted="true" playsinline="true" loop="true" style="width:100%; height:100%; object-fit:cover; border:none;">`;
              })
              .replace(/<iframe([^>]*)>/gi, (match, attrs) => {
                let cleanAttrs = attrs.replace(/style=["']([^"']*)["']/gi, '');
                return `<iframe ${cleanAttrs} style="width:100%; height:100%; position:absolute; inset:0; border:none;" allow="autoplay; encrypted-media; picture-in-picture">`;
              })
          }}
        />
      ) : (
        // Caso padrão (URLs puras ou iframes de provedores que extraímos o link)
        <iframe 
          src={cleanStreamUrl} 
          title={name}
          className="w-full h-full border-0 absolute inset-0 pointer-events-none"
          allowFullScreen 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          loading="eager"
          scrolling="no"
        />
      )}

      {/* Identificador sutil de Live (Apenas aparece no hover para manter o player 100% limpo em repouso) */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5 opacity-0 group-hover/video-container:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-atalaia-neon opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-atalaia-neon"></span>
        </span>
        <span className="text-[10px] text-atalaia-neon font-black font-mono tracking-widest uppercase">AO VIVO</span>
      </div>

      {/* Controles flutuantes de suporte (Apenas aparecem no hover para manter o player 100% limpo em repouso) */}
      <div className="absolute bottom-3 right-3 flex gap-2 z-20 opacity-0 group-hover/video-container:opacity-100 transition-opacity duration-300 pointer-events-auto">
        <button 
          onClick={handleOpenHttp}
          className="px-3 py-1.5 bg-black/80 hover:bg-black border border-white/10 rounded-xl text-[10px] text-gray-300 hover:text-atalaia-neon font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg backdrop-blur-sm"
          title="Abrir em popup externo"
        >
          <ExternalLink size={11} className="stroke-[2.5]" />
          <span>ABRIR POPUP</span>
        </button>
      </div>
    </div>
  );
});

CameraStreamPlayer.displayName = 'CameraStreamPlayer';

const Cameras: React.FC = () => {
  const { user } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoodSearchTerm, setHoodSearchTerm] = useState('');
  const [manageHoodSearchTerm, setManageHoodSearchTerm] = useState('');
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>('');
  
  // States for adding/editing camera
  const [selectedManageHoodId, setSelectedManageHoodId] = useState<string>('');
  const [newCameraName, setNewCameraName] = useState('');
  const [newCameraCode, setNewCameraCode] = useState('');
  const [newCameraLat, setNewCameraLat] = useState('');
  const [newCameraLng, setNewCameraLng] = useState('');
  const [newCameraPhoto, setNewCameraPhoto] = useState('');
  const [newMaintenancePhoto, setNewMaintenancePhoto] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingMaintenance, setIsUploadingMaintenance] = useState(false);
  const [editingCameraId, setEditingCameraId] = useState<string | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedCameraForModal, setSelectedCameraForModal] = useState<Camera | null>(null);

  // States for adding a new neighborhood
  const [showAddHood, setShowAddHood] = useState(false);
  const [newHoodName, setNewHoodName] = useState('');
  const [newHoodDescription, setNewHoodDescription] = useState('');
  const [addingHood, setAddingHood] = useState(false);
  const [cameraToDelete, setCameraToDelete] = useState<Camera | null>(null);

  // Estados para Pedidos de Gravação
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [activeRecordingTab, setActiveRecordingTab] = useState<'new' | 'history'>('new');
  const [recordingRequests, setRecordingRequests] = useState<RecordingRequest[]>([]);
  const [selectedCamForRequest, setSelectedCamForRequest] = useState('');
  const [requestStartDate, setRequestStartDate] = useState('');
  const [requestStartTime, setRequestStartTime] = useState('');
  const [requestEndDate, setRequestEndDate] = useState('');
  const [requestEndTime, setRequestEndTime] = useState('');
  const [requestIncidentDetails, setRequestIncidentDetails] = useState('');
  const [requestNotifyWhatsApp, setRequestNotifyWhatsApp] = useState(true);
  const [requestPhone, setRequestPhone] = useState(user?.phone || '');
  const [boFileName, setBoFileName] = useState('');
  const [boFileBase64, setBoFileBase64] = useState('');
  const [isUploadingBO, setIsUploadingBO] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Estados para upload de gravação pelo administrador
  const [uploadingForRequestId, setUploadingForRequestId] = useState<string | null>(null);
  const [recordingFileName, setRecordingFileName] = useState('');
  const [recordingFileBase64, setRecordingFileBase64] = useState('');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
              const img = new Image();
              img.src = event.target?.result as string;
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_WIDTH = 800;
                  const MAX_HEIGHT = 800;
                  let width = img.width;
                  let height = img.height;

                  if (width > height) {
                      if (width > MAX_WIDTH) {
                          height *= MAX_WIDTH / width;
                          width = MAX_WIDTH;
                      }
                  } else {
                      if (height > MAX_HEIGHT) {
                          width *= MAX_HEIGHT / height;
                          height = MAX_HEIGHT;
                      }
                  }

                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx?.drawImage(img, 0, 0, width, height);
                  resolve(canvas.toDataURL('image/jpeg', 0.7));
              };
              img.onerror = (err) => reject(err);
          };
          reader.onerror = (err) => reject(err);
      });
  };

  const handleMaintenanceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploadingMaintenance(true);
          try {
              const compressedBase64 = await compressImage(file);
              setNewMaintenancePhoto(compressedBase64);
          } catch (err) {
              console.error("Erro ao comprimir imagem:", err);
              alert("Erro ao processar a imagem. Tente uma imagem menor.");
          } finally {
              setIsUploadingMaintenance(false);
          }
      }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploading(true);
          try {
              const compressedBase64 = await compressImage(file);
              setNewCameraPhoto(compressedBase64);
          } catch (err) {
              console.error("Erro ao comprimir imagem:", err);
              alert("Erro ao processar a imagem. Tente uma imagem menor.");
          } finally {
              setIsUploading(false);
          }
      }
  };

  const handleEditCamera = (cam: Camera) => {
      setEditingCameraId(cam.id);
      setNewCameraName(cam.name);
      setNewCameraCode(cam.iframeCode);
      setNewCameraLat(cam.lat?.toString() || '');
      setNewCameraLng(cam.lng?.toString() || '');
      setNewCameraPhoto(cam.locationPhotoUrl || '');
      setNewMaintenancePhoto(cam.maintenancePhotoUrl || '');
      
      // Select the neighborhood of the camera being edited
      setSelectedManageHoodId(cam.neighborhoodId);
  };

  const handleCancelEdit = () => {
      setEditingCameraId(null);
      setNewCameraName('');
      setNewCameraCode('');
      setNewCameraLat('');
      setNewCameraLng('');
      setNewCameraPhoto('');
      setNewMaintenancePhoto('');
  };

  const handleSendSupport = async (e: React.FormEvent) => {
      e.preventDefault();
      console.log("[Cameras] handleSendSupport triggered");
      
      if (!supportMessage || !supportMessage.trim()) {
          alert('Por favor, descreva o problema antes de enviar.');
          return;
      }

      if (!user) {
          console.warn("[Cameras] No user found in context");
          alert('Sessão expirada. Por favor, faça login novamente.');
          return;
      }
      
      setSendingSupport(true);
      try {
          console.log("[Cameras] Sending support ticket:", { 
              userId: user.id, 
              name: user.name, 
              neighborhoodId: user.neighborhoodId 
          });

          await MockService.createSupportTicket(
              user.id,
              user.name,
              supportMessage.trim(),
              user.neighborhoodId
          );
          
          console.log("[Cameras] Support ticket sent successfully");
          alert('Sua solicitação de suporte foi enviada com sucesso! Em breve um técnico entrará em contato.');
          setSupportMessage('');
          setIsSupportModalOpen(false);
      } catch (err: any) {
          console.error("[Cameras] Error creating support ticket:", err);
          alert('Erro ao enviar solicitação: ' + (err.message || 'Erro desconhecido.'));
      } finally {
          setSendingSupport(false);
      }
  };

  const handleCreateNeighborhood = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newHoodName.trim()) {
          alert('Por favor, informe o nome do bairro.');
          return;
      }
      setAddingHood(true);
      try {
          await MockService.createNeighborhood(
              newHoodName.trim(),
              newHoodDescription.trim() || 'Monitoramento integrado Atalaia.',
              ''
          );
          alert('Bairro cadastrado com sucesso!');
          setNewHoodName('');
          setNewHoodDescription('');
          setShowAddHood(false);
          
          // Re-carregar os dados imediatamente
          const hoods = await MockService.getNeighborhoods();
          setNeighborhoods(hoods);
      } catch (err: any) {
          console.error("[Cameras] Error adding neighborhood:", err);
          alert('Erro ao cadastrar bairro: ' + (err.message || 'Erro desconhecido.'));
      } finally {
          setAddingHood(false);
      }
  };

  const fileToDataURL = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
      });
  };

  const loadRecordingRequests = async () => {
      if (!user) return;
      try {
          const reqs = await MockService.getRecordingRequests(user.role === UserRole.ADMIN ? undefined : user.id);
          setRecordingRequests(reqs);
      } catch (err) {
          console.error("Error loading recording requests:", err);
      }
  };

  const handleCreateRecordingRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      if (!selectedCamForRequest) {
          alert('Por favor, selecione uma câmera.');
          return;
      }
      if (!requestStartDate || !requestStartTime || !requestEndDate || !requestEndTime) {
          alert('Por favor, preencha o período completo (data e horário de início e fim).');
          return;
      }
      if (!requestIncidentDetails.trim()) {
          alert('Por favor, descreva a cena do acontecido para facilitar as buscas.');
          return;
      }

      setIsSubmittingRequest(true);
      try {
          const cam = cameras.find(c => c.id === selectedCamForRequest);
          const camName = cam ? cam.name : 'Câmera Comunitária';

          await MockService.createRecordingRequest({
              userId: user.id,
              userName: user.name,
              neighborhoodId: user.neighborhoodId || 'unknown',
              cameraId: selectedCamForRequest,
              cameraName: camName,
              startDate: requestStartDate,
              startTime: requestStartTime,
              endDate: requestEndDate,
              endTime: requestEndTime,
              incidentDetails: requestIncidentDetails,
              notifyWhatsApp: requestNotifyWhatsApp,
              phone: requestPhone,
              boFileName: boFileName || undefined,
              boFileUrl: boFileBase64 || undefined
          });

          alert('Solicitação de gravação criada com sucesso! Se você anexou o Boletim de Ocorrência, seu pedido entrou em análise.');
          
          // Resetar formulário
          setSelectedCamForRequest('');
          setRequestStartDate('');
          setRequestStartTime('');
          setRequestEndDate('');
          setRequestEndTime('');
          setRequestIncidentDetails('');
          setBoFileName('');
          setBoFileBase64('');
          
          await loadRecordingRequests();
      } catch (err: any) {
          console.error("Error creating recording request:", err);
          alert('Erro ao criar solicitação: ' + err.message);
      } finally {
          setIsSubmittingRequest(false);
      }
  };

  const handleUploadBO = async (requestId: string, file: File) => {
      setIsUploadingBO(true);
      try {
          const fileUrl = await fileToDataURL(file);
          await MockService.uploadBOFile(requestId, file.name, fileUrl);
          alert('Boletim de Ocorrência enviado com sucesso! O pedido agora está em análise.');
          await loadRecordingRequests();
      } catch (err: any) {
          console.error("Error uploading BO:", err);
          alert('Erro ao enviar BO: ' + err.message);
      } finally {
          setIsUploadingBO(false);
      }
  };

  const handleAdminStatusUpdate = async (requestId: string, status: RecordingRequest['status']) => {
      try {
          await MockService.updateRecordingRequestStatus(requestId, status);
          alert(`Status do pedido atualizado para: ${status}`);
          await loadRecordingRequests();
      } catch (err: any) {
          console.error("Error updating status:", err);
          alert('Erro ao atualizar status: ' + err.message);
      }
  };

  const handleAdminUploadRecording = async (requestId: string, file: File) => {
      setIsUploadingVideo(true);
      try {
          const fileUrl = await fileToDataURL(file);
          await MockService.updateRecordingRequestStatus(requestId, 'COMPLETED', fileUrl);
          alert('Gravação enviada com sucesso! O status foi alterado para concluído e o morador poderá baixar o arquivo.');
          setUploadingForRequestId(null);
          setRecordingFileName('');
          setRecordingFileBase64('');
          await loadRecordingRequests();
      } catch (err: any) {
          console.error("Error uploading recording:", err);
          alert('Erro ao enviar vídeo: ' + err.message);
      } finally {
          setIsUploadingVideo(false);
      }
  };

  const handleDownloadRecording = (req: RecordingRequest) => {
      if (!req.recordingUrl) return;
      const link = document.createElement('a');
      link.href = req.recordingUrl;
      link.download = `gravacao_${req.cameraName.toLowerCase().replace(/\s+/g, '_')}_${req.startDate}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleDownloadBO = (req: RecordingRequest) => {
      if (!req.boFileUrl) return;
      const link = document.createElement('a');
      link.href = req.boFileUrl;
      link.download = req.boFileName || 'boletim_de_ocorrencia.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const loadData = async () => {
      setLoading(true);
      try {
          const cams = await MockService.getAllSystemCameras();
          setCameras(cams);
          
          const hoods = await MockService.getNeighborhoods();
          setNeighborhoods(hoods);
          
          if (hoods.length > 0) {
              if (user?.role !== UserRole.ADMIN && user?.neighborhoodId) {
                  setSelectedNeighborhoodId(user.neighborhoodId);
                  setSelectedManageHoodId(user.neighborhoodId);
              } else {
                  setSelectedNeighborhoodId(hoods[0].id);
                  if (user?.role === UserRole.ADMIN) {
                      setSelectedManageHoodId(hoods[0].id);
                  }
              }
          }

          if (user) {
              const reqs = await MockService.getRecordingRequests(user.role === UserRole.ADMIN ? undefined : user.id);
              setRecordingRequests(reqs);
          }
      } catch (err) {
          console.error("Error loading cameras:", err);
      } finally {
          setLoading(false);
      }
  };

  const managedNeighborhoods = user?.role === UserRole.ADMIN 
    ? neighborhoods 
    : neighborhoods.filter(h => h.id === user?.neighborhoodId);

  useEffect(() => {
    if (user?.id) {
        loadData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.role === UserRole.INTEGRATOR && user?.neighborhoodId) {
        setSelectedManageHoodId(user.neighborhoodId);
    }
  }, [user, neighborhoods]);

  const filteredCameras = cameras.filter(cam => {
    const matchesSearch = cam.name.toLowerCase().includes(searchTerm.toLowerCase());
    const userNeighborhoodId = user?.role === UserRole.ADMIN ? selectedNeighborhoodId : user?.neighborhoodId;
    
    // Se o bairro selecionado não possuir nenhuma câmera real cadastrada no banco, 
    // permitimos que as câmeras de demonstração ('hood-demo-1') apareçam para que o usuário não fique sem visualização.
    const neighborhoodHasRealCameras = cameras.some(c => c.neighborhoodId === userNeighborhoodId && !c.id.startsWith('cam-demo-'));
    
    const matchesNeighborhood = userNeighborhoodId 
      ? (cam.neighborhoodId === userNeighborhoodId || (cam.neighborhoodId === 'hood-demo-1' && !neighborhoodHasRealCameras))
      : true;
      
    return matchesSearch && matchesNeighborhood;
  });

  const neighborhoodCamerasCount = cameras.filter(cam => {
    const userNeighborhoodId = user?.role === UserRole.ADMIN ? selectedNeighborhoodId : user?.neighborhoodId;
    if (!userNeighborhoodId) return true;
    
    const neighborhoodHasRealCameras = cameras.some(c => c.neighborhoodId === userNeighborhoodId && !c.id.startsWith('cam-demo-'));
    return cam.neighborhoodId === userNeighborhoodId || (cam.neighborhoodId === 'hood-demo-1' && !neighborhoodHasRealCameras);
  }).length;

  const isIntegrator = user?.role === UserRole.INTEGRATOR || user?.role === UserRole.ADMIN;

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-700 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-atalaia-neon/10 rounded-lg">
                <Video className="text-atalaia-neon" size={20} />
              </div>
              <h1 className="text-2xl font-black text-white italic tracking-tighter">CENTRAL DE CÂMERAS</h1>
            </div>
            <p className="text-gray-400 text-sm font-medium">Gestão e monitoramento de ativos de segurança.</p>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input 
                  className="pl-10 min-w-[240px]" 
                  placeholder="Pesquisar câmeras..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Grid: Cameras List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filtro de Bairros */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
               <div className="relative min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={14} />
                  <input 
                      type="text" 
                      placeholder="Filtrar bairros..." 
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-atalaia-neon/50 transition-colors"
                      value={hoodSearchTerm}
                      onChange={e => setHoodSearchTerm(e.target.value)}
                  />
               </div>
               <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {user?.role === UserRole.ADMIN && (
                      <Button 
                          variant={selectedNeighborhoodId === '' ? 'primary' : 'outline'}
                          onClick={() => setSelectedNeighborhoodId('')}
                          className="whitespace-nowrap px-4 py-2 text-xs"
                      >
                          Todas
                      </Button>
                  )}
                  {managedNeighborhoods.filter(h => h.name.toLowerCase().includes(hoodSearchTerm.toLowerCase())).map(hood => (
                      <Button
                          key={hood.id}
                          variant={selectedNeighborhoodId === hood.id ? 'primary' : 'outline'}
                          onClick={() => setSelectedNeighborhoodId(hood.id)}
                          className="whitespace-nowrap px-4 py-2 text-xs"
                      >
                          {hood.name}
                      </Button>
                  ))}
               </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-black/40 rounded-3xl border border-white/5">
                    <Loader2 className="text-atalaia-neon animate-spin mb-4" size={32} />
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Carregando dispositivos...</p>
                </div>
            ) : filteredCameras.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-black/40 rounded-3xl border border-white/5">
                    <Video className="text-gray-600 mb-4" size={48} />
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Nenhuma câmera encontrada</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCameras.map((cam) => (
                    <Card key={cam.id} className="group overflow-hidden border-white/5 hover:border-atalaia-neon/30 transition-all duration-300">
                      <div className="aspect-video bg-black relative">
                         {user?.plan === 'FREE' && user?.role === UserRole.RESIDENT ? (
                             <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 px-6 text-center">
                                 <Lock className="text-atalaia-neon/40 mb-3" size={32} />
                                 <h4 className="text-white font-bold text-xs uppercase mb-1">Assinatura Necessária</h4>
                                 <p className="text-[10px] text-gray-500 max-w-[180px] mb-3">
                                     Câmeras liberadas nos planos pagos.
                                 </p>
                                 <div className="flex flex-col gap-1.5 w-full max-w-[160px]">
                                     <Button 
                                         className="h-7 text-[8px] font-black bg-yellow-600 hover:bg-yellow-700"
                                         onClick={() => setShowUpgradeModal(true)}
                                     >
                                         PLANO FAMÍLIA (R$ 29,90)
                                     </Button>
                                     <Button 
                                         variant="outline"
                                         className="h-7 text-[8px] font-black border-atalaia-neon/30 text-atalaia-neon"
                                         onClick={() => setShowUpgradeModal(true)}
                                     >
                                         PLANO PRÊMIO (R$ 49,90)
                                     </Button>
                                 </div>
                             </div>
                         ) : (
                             <CameraStreamPlayer maintenancePhotoUrl={cam.maintenancePhotoUrl}
                                 iframeCode={cam.iframeCode}
                                 name={cam.name}
                                 id={cam.id}
                                 onExpand={() => setSelectedCameraForModal(cam)}
                             />
                         )}
                         {false && (
                             <div className="relative w-full h-full group/video-container">
                                 {cam.iframeCode.trim().startsWith('<') && !cam.iframeCode.toLowerCase().includes('src="http://') ? (
                                    <iframe 
                                        srcDoc={`
                                            <html>
                                                <head>
                                                    <style>
                                                        body { margin: 0; padding: 0; background: black; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; }
                                                        video, iframe { width: 100%; height: 100%; object-fit: contain; border: none; }
                                                    </style>
                                                </head>
                                                <body>${cam.iframeCode}</body>
                                            </html>
                                        `}
                                        title={cam.name}
                                        className="w-full h-full border-0 animate-fade-in"
                                        allowFullScreen
                                    />
                                 ) : (cam.iframeCode.trim().toLowerCase().startsWith('http://') || (cam.iframeCode.trim().startsWith('<') && cam.iframeCode.toLowerCase().includes('src="http://'))) ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 border border-amber-500/20 px-6 text-center animate-fade-in">
                                        <AlertTriangle className="text-amber-500 mb-2" size={24} />
                                        <h4 className="text-white font-bold text-[10px] uppercase mb-1">Link Inseguro (HTTP)</h4>
                                        <p className="text-[9px] text-gray-400 leading-tight mb-3">
                                            O navegador bloqueia conteúdo <code className="text-amber-500">http://</code> por segurança.
                                            <br/>Use o botão do Monitor Externo.
                                        </p>
                                        <div className="flex flex-col gap-2 w-full max-w-[180px] pointer-events-auto z-10">
                                            <Button 
                                                onClick={() => {
                                                    const url = cam.iframeCode.trim().startsWith('<') 
                                                        ? cam.iframeCode.match(/src="([^"]+)"/)?.[1] || '' 
                                                        : cam.iframeCode;
                                                    try { window.open(url, `cam_${cam.id}`, 'width=640,height=480,menubar=no,status=no,location=no,toolbar=no,scrollbars=no,resizable=yes'); } catch (e) { console.warn("Invalid URL", e); }
                                                }}
                                                className="flex items-center justify-center gap-1.5 h-8 bg-atalaia-neon text-black text-[10px] font-black shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:scale-105 transition-transform"
                                            >
                                                <ExternalLink size={12} /> MONITOR EXTERNO HTTP
                                            </Button>
                                        </div>
                                    </div>
                                 ) : (
                                    <iframe 
                                        src={cam.iframeCode} 
                                        title={cam.name}
                                        className="w-full h-full border-0 animate-fade-in" 
                                        allowFullScreen 
                                        referrerPolicy="no-referrer"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        loading="lazy"
                                    />
                                 )}

                                 {/* Overlay unificado com botão Expandir e Popup para maior controle tático */}
                                 {!(cam.iframeCode.trim().toLowerCase().startsWith('http://') || (cam.iframeCode.trim().startsWith('<') && cam.iframeCode.toLowerCase().includes('src="http://'))) && (
                                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/video-container:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 pointer-events-none z-10">
                                         <Button 
                                             className="pointer-events-auto bg-atalaia-neon text-black font-black text-[10px] px-3.5 h-8 gap-1.5 shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:scale-105 transition-all text-xs"
                                             onClick={() => setSelectedCameraForModal(cam)}
                                         >
                                             <Maximize2 size={12} strokeWidth={2.5} /> EXPANDIR E MONITORAR
                                         </Button>
                                         <Button 
                                             variant="outline"
                                             className="pointer-events-auto bg-black/70 border-white/10 text-[10px] px-3 h-7 gap-1 hover:bg-black text-white hover:text-atalaia-neon transition-all"
                                             onClick={() => {
                                                 const url = cam.iframeCode.trim().startsWith('<') 
                                                     ? cam.iframeCode.match(/src="([^"]+)"/)?.[1] || '' 
                                                     : cam.iframeCode;
                                                 try { window.open(url, `cam_${cam.id}`, 'width=640,height=480,menubar=no,status=no,location=no,toolbar=no,scrollbars=no,resizable=yes'); } catch (e) { console.warn("Invalid URL", e); }
                                             }}
                                         >
                                             <ExternalLink size={11} /> MONITOR POPUP
                                         </Button>
                                     </div>
                                 )}
                             </div>
                         )}
                         <div className="absolute top-2 left-2 flex gap-2 z-10">
                             <Badge color="green" className="text-[8px] px-1.5 animate-pulse">LIVE</Badge>
                             <Badge color="blue" className="text-[8px] px-1.5 bg-black/50 backdrop-blur-sm border-white/20">HD</Badge>
                         </div>
                         
                      </div>
                      <div className="p-4 bg-gradient-to-b from-transparent to-black/20">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-white group-hover:text-atalaia-neon transition-colors truncate">{cam.name}</h3>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                                <MapPin size={10} />
                                {cam.lat?.toFixed(2)}, {cam.lng?.toFixed(2)}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-gray-500 font-medium">Bairro:</span>
                            <span className="text-[10px] text-atalaia-neon/70 font-black uppercase tracking-wider">
                                {neighborhoods.find(h => h.id === cam.neighborhoodId)?.name || 'Desconhecido'}
                            </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
            )}
          </div>

          {/* Sidebar: Management */}
          <div className="space-y-6">
            {/* Legend / Status */}
            <Card className="bg-atalaia-neon/5 border-atalaia-neon/20 p-5">
                <h3 className="text-gray-300 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Info size={14} className="text-atalaia-neon" />
                    Status do Sistema
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-gray-400">Total de Câmeras</span>
                        <span className="text-white">{neighborhoodCamerasCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-gray-400">Ativas Online</span>
                        <span className="text-green-400">{neighborhoodCamerasCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-gray-400">Em Manutenção</span>
                        <span className="text-red-400">0</span>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    className="w-full mt-6 text-[10px] h-9 border-atalaia-neon/30 text-atalaia-neon font-black"
                    onClick={() => setIsSupportModalOpen(true)}
                >
                    SOLICITAR SUPORTE TÉCNICO
                </Button>
                <Button 
                    variant="outline" 
                    className="w-full mt-2 text-[10px] h-9 border-emerald-500/30 hover:border-emerald-500 text-emerald-400 font-black flex items-center justify-center gap-1.5"
                    onClick={() => {
                        setIsRecordingModalOpen(true);
                        if (user?.phone && !requestPhone) {
                            setRequestPhone(user.phone);
                        }
                    }}
                >
                    🎬 PEDIR GRAVAÇÃO DE IMAGEM
                </Button>
            </Card>

            {/* Admin/Integrator Controls */}
            {isIntegrator && (
                <Card className="p-6 border-white/10 bg-black/20">
                    <h3 className="text-white text-sm font-black uppercase tracking-tighter italic mb-4 flex items-center gap-2">
                        <Shield className="text-atalaia-neon" size={16} />
                        Gestão de Dispositivos
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block pl-1">Bairro para Gestão</label>
                                {user?.role === UserRole.ADMIN && (
                                    <button 
                                        type="button"
                                        onClick={() => setShowAddHood(!showAddHood)}
                                        className="text-[10px] font-bold text-atalaia-neon hover:text-atalaia-neon/80 transition-colors uppercase tracking-wider font-mono cursor-pointer"
                                    >
                                        {showAddHood ? 'Fechar Cadastro' : '+ Novo Bairro'}
                                    </button>
                                )}
                            </div>

                            {showAddHood && (
                                <div className="p-3 bg-white/5 border border-white/15 rounded-xl mb-3 space-y-3 animate-fade-in">
                                    <div className="text-[10px] font-bold text-atalaia-neon uppercase tracking-widest font-mono">Cadastrar Novo Bairro</div>
                                    <input
                                        type="text"
                                        placeholder="Nome do Bairro (ex: Jardim Flora)"
                                        value={newHoodName}
                                        onChange={(e) => setNewHoodName(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-atalaia-neon/50 placeholder:text-zinc-600 outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Descrição (ex: Zona Leste Monitorada)"
                                        value={newHoodDescription}
                                        onChange={(e) => setNewHoodDescription(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-atalaia-neon/50 placeholder:text-zinc-600 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCreateNeighborhood}
                                        disabled={addingHood}
                                        className="w-full h-8 bg-atalaia-neon text-black font-black text-[10px] uppercase rounded-lg hover:bg-atalaia-neon/90 transition-all flex items-center justify-center cursor-pointer gap-1"
                                    >
                                        {addingHood ? (
                                            <>
                                                <Loader2 className="animate-spin" size={12} />
                                                <span>Cadastrando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={12} strokeWidth={3} />
                                                <span>Salvar Bairro</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar bairro para gerenciar..." 
                                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-atalaia-neon/50 transition-colors"
                                    value={manageHoodSearchTerm}
                                    onChange={e => setManageHoodSearchTerm(e.target.value)}
                                    disabled={user?.role === UserRole.INTEGRATOR}
                                />
                            </div>
                            <select 
                                value={selectedManageHoodId}
                                onChange={(e) => setSelectedManageHoodId(e.target.value)}
                                disabled={user?.role === UserRole.INTEGRATOR}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-atalaia-neon/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <option value="">Selecione um bairro</option>
                                {managedNeighborhoods.filter(h => h.name.toLowerCase().includes(manageHoodSearchTerm.toLowerCase())).map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                        </div>

                        {selectedManageHoodId && (
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                try {
                                    const lat = newCameraLat ? parseFloat(newCameraLat) : undefined;
                                    const lng = newCameraLng ? parseFloat(newCameraLng) : undefined;
                                    
                                    if (editingCameraId) {
                                        await MockService.updateCamera(editingCameraId, newCameraName, newCameraCode, lat, lng, newCameraPhoto, newMaintenancePhoto, selectedManageHoodId);
                                        alert('Câmera atualizada com sucesso!');
                                    } else {
                                        await MockService.addCamera(selectedManageHoodId, newCameraName, newCameraCode, lat, lng, newCameraPhoto, newMaintenancePhoto); 
                                        alert('Câmera adicionada com sucesso!');
                                    }
                                    
                                    handleCancelEdit();
                                    const updated = await MockService.getAdditionalCameras(selectedManageHoodId);
                                    setCameras(updated);
                                } catch (err) {
                                    alert('Erro ao processar câmera. Tente novamente.');
                                }
                            }} className="mt-4 space-y-4 pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-bold text-atalaia-neon flex items-center gap-2">
                                        {editingCameraId ? <Edit2 size={14} /> : <Plus size={14} />}
                                        {editingCameraId ? 'Editar Câmera' : 'Adicionar Nova Câmera'}
                                    </h4>
                                    {editingCameraId && (
                                        <button 
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="text-[10px] text-gray-400 hover:text-white transition-colors"
                                        >
                                            Cancelar Edição
                                        </button>
                                    )}
                                </div>
                                <Input label="Nome da Câmera" value={newCameraName} onChange={e => setNewCameraName(e.target.value)} placeholder="Ex: Câmera Rua X" required />
                                <div className="space-y-1">
                                    <Input label="Código Iframe ou Link" value={newCameraCode} onChange={e => setNewCameraCode(e.target.value)} placeholder="https://... ou <iframe... />" />
                                    <p className="text-[9px] text-amber-500/80 px-1 leading-tight">
                                        💡 <strong>Atenção MisterServer / Servidores Locais:</strong> Browsers modernos bloqueiam links <code className="bg-black/40 px-1">http://</code> por segurança em sites seguros. Se sua câmera não aparecer, use o botão de <strong>Monitor Externo</strong> que aparecerá no card, ou configure SSL (HTTPS) no seu servidor.
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="Latitude (Opcional)" value={newCameraLat} onChange={e => setNewCameraLat(e.target.value)} placeholder="-23.5505" />
                                    <Input label="Longitude (Opcional)" value={newCameraLng} onChange={e => setNewCameraLng(e.target.value)} placeholder="-46.6333" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1">Foto do Local (Poste)</label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black border border-white/10 rounded-xl cursor-pointer hover:border-atalaia-neon/50 transition-all text-xs font-bold text-gray-400">
                                            {isUploading ? <Loader2 className="animate-spin" size={16} /> : <CameraIcon size={16} />}
                                            {newCameraPhoto ? 'Foto Selecionada' : 'Fazer Upload da Foto'}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                        {newCameraPhoto && (
                                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-atalaia-neon/30">
                                                <img src={newCameraPhoto} className="w-full h-full object-cover" alt="Preview" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1">Capa de Manutenção</label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black border border-white/10 rounded-xl cursor-pointer hover:border-atalaia-neon/50 transition-all text-xs font-bold text-gray-400">
                                            {isUploadingMaintenance ? <Loader2 className="animate-spin" size={16} /> : <CameraIcon size={16} />}
                                            {newMaintenancePhoto ? 'Capa Selecionada' : 'Fazer Upload da Capa'}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleMaintenanceFileChange} />
                                        </label>
                                        {newMaintenancePhoto && (
                                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-atalaia-neon/30">
                                                <img src={newMaintenancePhoto} className="w-full h-full object-cover" alt="Preview Manutenção" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button type="submit" className="w-full">{editingCameraId ? 'Atualizar Câmera' : 'Adicionar'}</Button>
                                
                                <div className="mt-4 space-y-2">
                                    {cameras.filter(c => c.neighborhoodId === selectedManageHoodId).map(cam => (
                                        <div key={cam.id} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
                                            <div className="flex items-center gap-3">
                                                <Video size={14} className="text-gray-400" />
                                                <span className="text-[11px] font-medium">{cam.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => handleEditCamera(cam)}
                                                    className="p-1.5 hover:bg-atalaia-neon/20 rounded text-atalaia-neon transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={14} className="pointer-events-none" />
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setCameraToDelete(cam)}
                                                    className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={14} className="pointer-events-none" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </form>
                        )}
                    </div>
                </Card>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSupportModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-atalaia-neon/10 to-transparent">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="text-atalaia-neon" size={18} />
                    <h2 className="text-white font-black italic tracking-tighter">SUPORTE TÉCNICO</h2>
                </div>
                <button 
                  onClick={() => setIsSupportModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSendSupport} className="p-6 space-y-4">
                <p className="text-xs text-gray-400 font-medium">
                  Descreva o problema que está ocorrendo com seus equipamentos ou sistema. Um técnico certificado Atalaia será designado para ajudar.
                </p>
                
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest pl-1">Sua Mensagem</label>
                    <textarea 
                        required
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        placeholder="Ex: Câmera da Rua X está com imagem travada..."
                        className="w-full min-h-[120px] bg-black/60 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-atalaia-neon/50 transition-all resize-none"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setIsSupportModalOpen(false)}
                    >
                        CANCELAR
                    </Button>
                    <Button 
                        type="submit" 
                        className="flex-1 bg-atalaia-neon text-black hover:bg-atalaia-neon/90"
                        disabled={sendingSupport}
                    >
                        {sendingSupport ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'ENVIAR CHAMADO'}
                    </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {selectedCameraForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCameraForModal(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-5xl bg-zinc-950 border border-atalaia-neon/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,255,102,0.15)] flex flex-col md:h-[80vh] z-10"
            >
              {/* Header do Monitor */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-atalaia-neon/10 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-atalaia-neon rounded-full animate-ping" />
                    <div>
                        <h2 className="text-white font-extrabold text-base md:text-lg uppercase tracking-tight flex items-center gap-2">
                            {selectedCameraForModal.name}
                            <span className="text-[10px] text-atalaia-neon font-mono bg-atalaia-neon/10 border border-atalaia-neon/20 px-2 py-0.5 rounded">ONLINE</span>
                        </h2>
                        <p className="text-[10px] text-gray-400 mt-0.5 animate-pulse">
                            Bairro: <span className="text-atalaia-neon font-semibold uppercase">{neighborhoods.find(h => h.id === selectedCameraForModal.neighborhoodId)?.name || 'Atalaia'}</span>
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Relógio Tático do Transmissor */}
                    <TacticalClock />

                    <button 
                      onClick={() => setSelectedCameraForModal(null)}
                      className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all hover:rotate-90 duration-300"
                    >
                      <X size={20} />
                    </button>
                </div>
              </div>

              {/* Feed de Vídeo Ampliado */}
              <div className="flex-1 min-h-[300px] bg-black relative flex items-center justify-center">
                 <CameraStreamPlayer maintenancePhotoUrl={selectedCameraForModal.maintenancePhotoUrl}
                     iframeCode={selectedCameraForModal.iframeCode}
                     name={selectedCameraForModal.name}
                     id={selectedCameraForModal.id}
                     onExpand={() => {}}
                     isModal={true}
                 />
                 
                 {/* Visual Tático em hover */}
                 <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 bg-black/70 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-4 text-[10px] font-mono text-gray-400">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 1080p stream</span>
                    {selectedCameraForModal.lat && (
                        <span>GPS: {selectedCameraForModal.lat.toFixed(4)}, {selectedCameraForModal.lng?.toFixed(4)}</span>
                    )}
                 </div>
              </div>

              {/* Rodapé Tático */}
              <div className="p-4 bg-zinc-900/60 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 font-medium">
                <div>
                    Transmissão comunitária monitorada e criptografada cooperativamente.
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline"
                        className="text-[10px] h-8 font-black gap-1.5 text-white"
                        onClick={() => {
                            const url = selectedCameraForModal.iframeCode.trim().startsWith('<') 
                                ? selectedCameraForModal.iframeCode.match(/src="([^"]+)"/)?.[1] || '' 
                                : selectedCameraForModal.iframeCode;
                            try { window.open(url, `cam_${selectedCameraForModal.id}`, '_blank'); } catch (e) { console.warn("Invalid URL", e); }
                        }}
                    >
                        ABRIR EM NOVA ABA INTEIRA
                    </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {cameraToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-center"
            >
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 font-mono">
                Confirmar Exclusão
              </h3>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed font-sans">
                Tem certeza que deseja excluir a câmera tática <span className="text-white font-bold">"{cameraToDelete.name}"</span>? Esta ação removerá a câmera definitivamente.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCameraToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-zinc-900 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (cameraToDelete) {
                      await MockService.deleteCamera(cameraToDelete.id);
                      const updated = await MockService.getAdditionalCameras(selectedManageHoodId);
                      setCameras(updated);
                      setCameraToDelete(null);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-500/15 cursor-pointer font-sans"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {/* MODAL DE PEDIDOS DE GRAVAÇÃO */}
      <AnimatePresence>
        {isRecordingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-zinc-950 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col my-8 max-h-[85vh] z-50 font-sans"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <div>
                    <h2 className="text-white font-black text-sm md:text-base uppercase tracking-wider flex items-center gap-2">
                      🎬 CENTRAL DE GRAVAÇÕES E IMAGENS
                    </h2>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {user?.role === UserRole.ADMIN ? 'Painel de Administração de Gravações' : 'Solicitar resgate de imagens de câmeras comunitárias'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsRecordingModalOpen(false)}
                  className="p-2 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tabs if resident */}
              {user?.role !== UserRole.ADMIN && (
                <div className="flex border-b border-white/5 bg-zinc-900/40">
                  <button
                    onClick={() => setActiveRecordingTab('new')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                      activeRecordingTab === 'new' 
                        ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    📝 Nova Solicitação
                  </button>
                  <button
                    onClick={() => setActiveRecordingTab('history')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                      activeRecordingTab === 'history' 
                        ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    📂 Minhas Solicitações ({recordingRequests.filter(r => r.userId === user?.id).length})
                  </button>
                </div>
              )}

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {user?.role === UserRole.ADMIN ? (
                  /* VISTA ADMINISTRADOR */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest font-mono">
                        Gerenciamento de Pedidos ({recordingRequests.length})
                      </h3>
                      <button 
                        onClick={loadRecordingRequests}
                        className="text-[10px] text-zinc-400 hover:text-white font-bold flex items-center gap-1 uppercase tracking-wider transition-colors"
                      >
                        <RefreshCw size={10} /> Atualizar Lista
                      </button>
                    </div>

                    {recordingRequests.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-black/20">
                        <Video size={32} className="mx-auto text-zinc-600 mb-2" />
                        <p className="text-xs text-zinc-400 font-medium">Nenhum pedido de gravação pendente ou registrado no sistema.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recordingRequests.map((req) => (
                          <div 
                            key={req.id} 
                            className="p-5 bg-zinc-900/60 border border-white/5 rounded-2xl space-y-4 hover:border-white/10 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                              <div>
                                <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-widest">Solicitante</span>
                                <span className="text-xs font-bold text-white">{req.userName}</span>
                                {req.phone && (
                                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                                    📞 {req.phone} {req.notifyWhatsApp && <span className="text-emerald-500 text-[9px] font-mono font-bold bg-emerald-500/10 px-1 py-0.2 rounded ml-1">WPP ATIVO</span>}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-zinc-500">{new Date(req.createdAt).toLocaleString('pt-BR')}</span>
                                <Badge 
                                  className={
                                    req.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                    req.status === 'APPROVED' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                    req.status === 'ANALYZING' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                    req.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                  }
                                >
                                  {req.status === 'COMPLETED' ? 'CONCLUÍDO' :
                                   req.status === 'APPROVED' ? 'APROVADO' :
                                   req.status === 'ANALYZING' ? 'EM ANÁLISE' :
                                   req.status === 'REJECTED' ? 'REJEITADO' : 'PENDENTE'}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-[10px] font-black text-zinc-500 block uppercase tracking-wider mb-1">Câmera e Bairro</span>
                                <span className="text-white font-bold">{req.cameraName}</span>
                                <span className="text-zinc-400 block text-[10px]">ID: {req.cameraId}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-black text-zinc-500 block uppercase tracking-wider mb-1">Período Solicitado</span>
                                <span className="text-emerald-400 font-bold block">
                                  De: {new Date(req.startDate + 'T' + req.startTime).toLocaleString('pt-BR')}
                                </span>
                                <span className="text-emerald-400 font-bold block">
                                  Até: {new Date(req.endDate + 'T' + req.endTime).toLocaleString('pt-BR')}
                                </span>
                              </div>
                            </div>

                            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                              <span className="text-[10px] font-black text-zinc-500 block uppercase tracking-wider mb-1">Cena / Descrição do Acontecido</span>
                              <p className="text-zinc-300 text-xs leading-relaxed">{req.incidentDetails}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5">
                              {/* BO Actions */}
                              {req.boFileUrl ? (
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="text-[10px] h-8 bg-zinc-900 border-white/10 hover:bg-zinc-800 text-white gap-1 flex items-center"
                                  onClick={() => handleDownloadBO(req)}
                                >
                                  📄 BAIXAR BOLETIM DE OCORRÊNCIA
                                </Button>
                              ) : (
                                <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                                  ⚠️ Sem Boletim de Ocorrência anexado
                                </span>
                              )}

                              {/* Recording Actions */}
                              {req.recordingUrl && (
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="text-[10px] h-8 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 gap-1 flex items-center"
                                  onClick={() => handleDownloadRecording(req)}
                                >
                                  🎬 VER/BAIXAR GRAVAÇÃO ATUAL
                                </Button>
                              )}
                            </div>

                            {/* Status Change & Video Upload Buttons for Admin */}
                            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-2">Alterar Status:</span>
                                <Button 
                                  type="button" 
                                  onClick={() => handleAdminStatusUpdate(req.id, 'ANALYZING')}
                                  className="text-[9px] h-7 px-2.5 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500 text-blue-400 hover:text-white"
                                >
                                  EM ANÁLISE
                                </Button>
                                <Button 
                                  type="button" 
                                  onClick={() => handleAdminStatusUpdate(req.id, 'APPROVED')}
                                  className="text-[9px] h-7 px-2.5 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500 text-purple-400 hover:text-white"
                                >
                                  APROVAR
                                </Button>
                                <Button 
                                  type="button" 
                                  onClick={() => handleAdminStatusUpdate(req.id, 'REJECTED')}
                                  className="text-[9px] h-7 px-2.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500 text-red-400 hover:text-white"
                                >
                                  RECUSAR
                                </Button>
                              </div>

                              <div className="border-t border-white/5 pt-3">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                                  📤 ENVIAR ARQUIVO DE VÍDEO DA GRAVAÇÃO:
                                </span>
                                
                                <div className="flex items-center gap-3">
                                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 border border-dashed border-white/10 hover:border-emerald-500/40 rounded-xl cursor-pointer text-xs font-bold text-zinc-400 hover:text-emerald-400 transition-all">
                                    <UploadCloud size={14} />
                                    {uploadingForRequestId === req.id && recordingFileName ? (
                                      <span className="text-emerald-400 truncate">{recordingFileName}</span>
                                    ) : (
                                      <span>Selecionar Gravação (MP4/Vídeo/Imagem)</span>
                                    )}
                                    <input 
                                      type="file" 
                                      accept="video/*,image/*" 
                                      className="hidden" 
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          setUploadingForRequestId(req.id);
                                          setRecordingFileName(file.name);
                                          handleAdminUploadRecording(req.id, file);
                                        }
                                      }}
                                    />
                                  </label>

                                  {isUploadingVideo && uploadingForRequestId === req.id && (
                                    <span className="text-zinc-500 text-[10px] font-bold flex items-center gap-1">
                                      <Loader2 size={12} className="animate-spin text-emerald-500" /> Enviando vídeo...
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : activeRecordingTab === 'new' ? (
                  /* VISTA MORADOR: CRIAR SOLICITAÇÃO */
                  <form onSubmit={handleCreateRecordingRequest} className="space-y-5">
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex gap-3">
                      <Info size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        Sua segurança é nossa prioridade. Para solicitar o resgate de gravações do sistema comunitário de câmeras, preencha os detalhes do incidente abaixo. É fortemente recomendado anexar o <strong className="text-white">Boletim de Ocorrência (B.O.)</strong> para liberação imediata das imagens.
                      </p>
                    </div>

                    {/* Camera Selector */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest pl-1 block">
                        Câmera Monitorada
                      </label>
                      <select
                        required
                        value={selectedCamForRequest}
                        onChange={(e) => setSelectedCamForRequest(e.target.value)}
                        className="w-full h-11 bg-black/60 border border-white/10 rounded-2xl px-4 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                      >
                        <option value="">Selecione a câmera...</option>
                        {cameras
                          .filter(c => c.neighborhoodId === user?.neighborhoodId)
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))
                        }
                      </select>
                      {cameras.filter(c => c.neighborhoodId === user?.neighborhoodId).length === 0 && (
                        <p className="text-[10px] text-amber-500 pl-1 font-medium">⚠️ Nenhuma câmera ativa vinculada ao seu bairro no momento.</p>
                      )}
                    </div>

                    {/* Date/Time Filter Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Início */}
                      <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl space-y-3">
                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block pl-1">
                          ⏱️ Ponto de Início da Gravação
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block pl-1">Data</label>
                            <input 
                              type="date"
                              required
                              value={requestStartDate}
                              onChange={(e) => setRequestStartDate(e.target.value)}
                              className="w-full h-10 bg-black/60 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block pl-1">Horário</label>
                            <input 
                              type="time"
                              required
                              value={requestStartTime}
                              onChange={(e) => setRequestStartTime(e.target.value)}
                              className="w-full h-10 bg-black/60 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Fim */}
                      <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl space-y-3">
                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block pl-1">
                          ⏱️ Ponto Final da Gravação
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block pl-1">Data</label>
                            <input 
                              type="date"
                              required
                              value={requestEndDate}
                              onChange={(e) => setRequestEndDate(e.target.value)}
                              className="w-full h-10 bg-black/60 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block pl-1">Horário</label>
                            <input 
                              type="time"
                              required
                              value={requestEndTime}
                              onChange={(e) => setRequestEndTime(e.target.value)}
                              className="w-full h-10 bg-black/60 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scene Specification details */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest pl-1 block">
                        Cena / Detalhes do Acontecido
                      </label>
                      <textarea
                        required
                        value={requestIncidentDetails}
                        onChange={(e) => setRequestIncidentDetails(e.target.value)}
                        placeholder="Descreva detalhadamente o ocorrido (ex: colisão de veículo cinza, atividade suspeita no portão, pet perdido no horário...) para facilitar a pesquisa da gravação pela central de monitoramento."
                        className="w-full min-h-[100px] bg-black/60 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all resize-none leading-relaxed"
                      />
                    </div>

                    {/* WhatsApp notification options */}
                    <div className="p-4 bg-zinc-900/30 border border-white/5 rounded-2xl space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={requestNotifyWhatsApp}
                          onChange={(e) => setRequestNotifyWhatsApp(e.target.checked)}
                          className="mt-0.5 rounded border-white/10 text-emerald-500 bg-black focus:ring-emerald-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">Quero ser notificado via WhatsApp</span>
                          <span className="text-[10px] text-zinc-400">Você receberá atualizações sobre a análise e a disponibilização da gravação.</span>
                        </div>
                      </label>

                      {requestNotifyWhatsApp && (
                        <div className="space-y-1 pl-7 animate-fade-in">
                          <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest block">Telefone com DDD</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">📱</span>
                            <input 
                              type="text"
                              required
                              placeholder="Ex: 11 99999-9999"
                              value={requestPhone}
                              onChange={(e) => setRequestPhone(e.target.value)}
                              className="w-full h-10 bg-black/80 border border-white/10 rounded-xl pl-10 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BO File upload */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest pl-1 block">
                        Anexar Boletim de Ocorrência (Opcional)
                      </label>
                      <div className="border border-dashed border-white/10 hover:border-emerald-500/30 rounded-2xl p-5 bg-black/40 text-center transition-all">
                        <UploadCloud className="mx-auto text-zinc-500 mb-2" size={24} />
                        {boFileName ? (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-emerald-400 truncate">{boFileName}</p>
                            <button
                              type="button"
                              onClick={() => {
                                setBoFileName('');
                                setBoFileBase64('');
                              }}
                              className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider"
                            >
                              Remover Arquivo
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <span className="text-xs font-bold text-zinc-400 hover:text-white transition-colors block">
                              Clique para fazer upload do B.O. (PDF ou Imagem)
                            </span>
                            <span className="text-[10px] text-zinc-600 block mt-1">Formatos suportados: PDF, PNG, JPG, JPEG</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    setBoFileName(file.name);
                                    const base64 = await fileToDataURL(file);
                                    setBoFileBase64(base64);
                                  } catch (err) {
                                    alert('Erro ao carregar arquivo B.O.');
                                  }
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsRecordingModalOpen(false)}
                      >
                        CANCELAR
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-emerald-500 text-black hover:bg-emerald-400 font-black"
                        disabled={isSubmittingRequest}
                      >
                        {isSubmittingRequest ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'SOLICITAR GRAVAÇÃO'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* VISTA MORADOR: LISTA DE SOLICITAÇÕES */
                  <div className="space-y-4">
                    {recordingRequests.filter(r => r.userId === user?.id).length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-black/20">
                        <Video size={32} className="mx-auto text-zinc-600 mb-2" />
                        <p className="text-xs text-zinc-400 font-medium">Você ainda não possui nenhuma solicitação de gravação registrada.</p>
                      </div>
                    ) : (
                      recordingRequests
                        .filter(r => r.userId === user?.id)
                        .map((req) => (
                          <div 
                            key={req.id}
                            className="p-5 bg-zinc-900/60 border border-white/5 rounded-2xl space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                              <div>
                                <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-widest">Câmera Tática</span>
                                <span className="text-xs font-bold text-white">{req.cameraName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-zinc-500">{new Date(req.createdAt).toLocaleDateString('pt-BR')}</span>
                                <Badge 
                                  className={
                                    req.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                    req.status === 'APPROVED' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                    req.status === 'ANALYZING' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                    req.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                  }
                                >
                                  {req.status === 'COMPLETED' ? 'DISPONÍVEL' :
                                   req.status === 'APPROVED' ? 'APROVADO' :
                                   req.status === 'ANALYZING' ? 'EM ANÁLISE' :
                                   req.status === 'REJECTED' ? 'RECUSADO' : 'PENDENTE'}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-[10px] font-black text-zinc-500 block uppercase tracking-wider mb-1">Período Solicitado</span>
                                <span className="text-zinc-300 block">De: {new Date(req.startDate + 'T' + req.startTime).toLocaleString('pt-BR')}</span>
                                <span className="text-zinc-300 block">Até: {new Date(req.endDate + 'T' + req.endTime).toLocaleString('pt-BR')}</span>
                              </div>
                              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                                <span className="text-[10px] font-black text-zinc-500 block uppercase tracking-wider mb-1">Cena Solicitada</span>
                                <p className="text-zinc-400 text-[11px] leading-relaxed truncate-2-lines">{req.incidentDetails}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                              {/* BO Attachment section */}
                              <div className="text-xs">
                                {req.boFileName ? (
                                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                    ✓ B.O. Enviado: {req.boFileName}
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-amber-500 font-bold">⚠️ Falta Boletim de Ocorrência</span>
                                    <label className="text-[9px] font-black text-white bg-zinc-800 hover:bg-zinc-700 border border-white/10 px-2 py-1 rounded cursor-pointer uppercase tracking-wider">
                                      Anexar Agora
                                      <input 
                                        type="file" 
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            handleUploadBO(req.id, file);
                                          }
                                        }}
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>

                              {/* Download Actions */}
                              <div className="flex items-center gap-2">
                                {req.status === 'COMPLETED' && req.recordingUrl ? (
                                  <Button 
                                    type="button" 
                                    onClick={() => handleDownloadRecording(req)}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] h-8 gap-1.5 flex items-center"
                                  >
                                    <Download size={12} /> BAIXAR IMAGENS GRAVADAS
                                  </Button>
                                ) : (
                                  <span className="text-[10px] text-zinc-500 italic font-medium">
                                    {req.status === 'PENDING' ? 'Aguardando liberação / B.O.' : 'Aguardando processamento do vídeo...'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-zinc-900 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                <span>Atalaia Tecnologia Inteligente de Monitoramento Cooperativo © 2026</span>
                <span>Câmeras do Bairro</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Cameras;

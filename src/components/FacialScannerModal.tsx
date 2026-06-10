import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, Scan, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { FacialBiometricService } from '@/services/facialBiometricService';
import { supabase, isRealSupabase } from '@/lib/supabaseClient';

interface FacialScannerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'enroll' | 'login';
  userId?: string; // and/or email, useful for registering who to save to
  typedEmail?: string;
  onSuccess: (matchedUser?: any) => void;
}

export const FacialScannerModal: React.FC<FacialScannerProps> = ({
  isOpen,
  onClose,
  mode,
  userId,
  typedEmail,
  onSuccess
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Inicializando câmera...');
  const [captureProgress, setCaptureProgress] = useState(0); // 0 to 100
  const [errorText, setErrorText] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [activeModel, setActiveModel] = useState<any>(null);
  const [scannedProfile, setScannedProfile] = useState<any>(null);
  
  // List of all registered biometric descriptors for real-time login matching
  const [enrolledList, setEnrolledList] = useState<any[]>([]);

  // Array to collect sequential descriptor readings for multi-match noise cancelation during enrollment
  const enrollmentDescriptorsRef = useRef<number[][]>([]);

  const [isScanning, setIsScanning] = useState(false);
  const isScanningRef = useRef(false);
  const timeoutIdRef = useRef<any>(null);

  // Cleanup helper
  const stopResources = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    isScanningRef.current = false;
    setIsScanning(false);
  };

  const handleTriggerScan = () => {
    if (loading || errorText) return;
    
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    
    setCaptureProgress(0);
    enrollmentDescriptorsRef.current = [];
    isScanningRef.current = true;
    setIsScanning(true);
    setScannedProfile(null);
    
    if (mode === 'enroll') {
      setStatusMessage('Iniciando mapeamento facial... Olhe para a câmera.');
    } else {
      setStatusMessage('Autenticando... Analisando perfil biométrico.');
      
      // Set a safety timeout for login mismatch or search
      timeoutIdRef.current = setTimeout(() => {
        if (isScanningRef.current) {
          isScanningRef.current = false;
          setIsScanning(false);
          setStatusMessage('Rosto não reconhecido. Centralize o rosto e tente novamente.');
        }
      }, 4500);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopResources();
      return;
    }

    setLoading(true);
    setErrorText(null);
    setCaptureProgress(0);
    setScannedProfile(null);
    enrollmentDescriptorsRef.current = [];
    setIsScanning(false);
    isScanningRef.current = false;

    const initialize = async () => {
      try {
        // 1. If we are in 'login' mode, fetch all enrolled records for fast comparison matching
        if (mode === 'login') {
          setStatusMessage('Carregando base biométrica...');
          const list = await FacialBiometricService.getAllBiometrics();
          setEnrolledList(list);
          console.log(`[FacialScanner] Base carregada. Perfis biométricos registrados: ${list.length}`);
        }

        // 2. Load TFJS and BlazeFace dynamically
        setStatusMessage('Carregando algoritmos de biometria...');
        const loadedModelClass = await FacialBiometricService.loadTensorFlowAndBlazeFace();
        
        // 3. Instantiate or verify if BlazeFace backend is loaded
        setStatusMessage('Instanciando modelo neural...');
        const model = await (window as any).blazeface.load();
        setActiveModel(model);

        // 4. Request webcam authorization and mount stream
        setStatusMessage('Ativando câmera...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false
        });
        
        streamRef.current = stream;
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setLoading(false);
            setStatusMessage('Detector ativo! Centralize seu rosto no visor.');
            
            // Start the frame looping sequence
            startDetectionLoop(model);
          };
        }
      } catch (err: any) {
        console.warn("[FacialScanner] Informação de inicialização (Modo Local de Contingência Ativo):", err);
        setLoading(false);
        setHasCameraPermission(false);
        setErrorText(err.message || 'Falha ao acessar os recursos biométricos.');
      }
    };

    initialize();

    return () => {
      stopResources();
    };
  }, [isOpen, mode]);

  // Frame detection processor
  const startDetectionLoop = (model: any) => {
    const processFrame = async () => {
      if (!videoRef.current || !canvasRef.current || !isOpen) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (video.paused || video.ended || !ctx) {
        rafIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Sync canvas display resolution with incoming video feed dimensions
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Clear layout and render fresh snapshot frames
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const returnTensors = false;
        const predictions = await model.estimateFaces(video, returnTensors);

        // Cyberpunk HUD aesthetic overlays
        drawSciFiHUD(ctx, canvas.width, canvas.height);

        if (predictions && predictions.length > 0) {
          const prediction = predictions[0];
          
          // Render biometric skeleton and targets
          drawDetectionOverlays(ctx, prediction);

          const landmarks = prediction.landmarks as [number, number][]; // 6 points
          const probability = prediction.probability[0];

          if (probability > 0.90 && landmarks.length >= 6) {
            // Generate scale invariant biometric vector
            const liveDescriptor = FacialBiometricService.calculateBiometricDescriptor(landmarks);

            if (mode === 'enroll') {
              if (isScanningRef.current) {
                if (captureProgress < 100) {
                  // Collect sequential scans to get clean averaged vectors
                  enrollmentDescriptorsRef.current.push(liveDescriptor);
                  const nextProgress = Math.min(100, enrollmentDescriptorsRef.current.length * 4);
                  setCaptureProgress(nextProgress);
                  setStatusMessage(`Mantenha sua pose... Escaneando: ${nextProgress}%`);

                  if (nextProgress >= 100) {
                    // Take averages of landmarks to produce pristine anti-noise signature
                    const avgDescriptor = computeAverageDescriptor(enrollmentDescriptorsRef.current);
                    // Capture thumbnail while the video stream is still active
                    const thumbnail = captureCanvasBase64(video);

                    // Now we can safely stop resources
                    stopResources();
                    setStatusMessage('Analisando consistência biométrica...');

                    if (userId) {
                      const saveOk = await FacialBiometricService.saveBiometrics(userId, avgDescriptor, thumbnail);
                      if (saveOk) {
                        setCaptureProgress(100);
                        setStatusMessage('Sucesso! Sensores biométricos configurados.');
                        setTimeout(() => {
                          onSuccess({ userId, descriptor: avgDescriptor, photoBase64: thumbnail });
                          onClose();
                        }, 1800);
                      } else {
                        setErrorText('Ocorreu um erro ao salvar o descriptor biométrico facial.');
                      }
                    } else {
                       setErrorText('ID de usuário ausente para cadastro.');
                    }
                  }
                }
              } else {
                setStatusMessage('Rosto alinhado! Clique no botão abaixo para escanear.');
              }
            } else if (mode === 'login') {
              if (isScanningRef.current) {
                // Compare live vector against all enrolled members
                const match = FacialBiometricService.matchFace(liveDescriptor, enrolledList);
                if (match) {
                  // Match confirmed! Freeze capture and fire success
                  stopResources();
                  setScannedProfile(match);
                  setStatusMessage(`BIOMETRIA CONFIRMADA: ${match.name}`);
                  
                  // Overlay matching success state 
                  drawMatchedCrown(ctx, prediction, match.name);
                  
                  setTimeout(() => {
                     onSuccess(match);
                     onClose();
                  }, 1800);
                  return;
                } else {
                  setStatusMessage('Analisando perfil facial... Procurando correspondência...');
                }
              } else {
                setStatusMessage('Rosto alinhado! Clique no botão abaixo para escanear.');
              }
            }
          } else {
            if (isScanningRef.current) {
              setStatusMessage('Centralize melhor o rosto e evite movimentos bruscos.');
            } else {
              setStatusMessage('Centralize melhor o rosto e evite movimentos bruscos.');
            }
          }
        } else {
          if (isScanningRef.current) {
            setStatusMessage('Centralize seu rosto no visor e olhe fixamente para a tela.');
          } else {
            setStatusMessage('Centralize seu rosto no visor e olhe fixamente para a tela.');
          }
        }
      } catch (loopErr) {
        console.warn("[FacialScanner] Frame evaluation warning:", loopErr);
      }

      rafIdRef.current = requestAnimationFrame(processFrame);
    };

    rafIdRef.current = requestAnimationFrame(processFrame);
  };

  // Compute average vectors to cancel spatial capture noise
  const computeAverageDescriptor = (matrix: number[][]): number[] => {
    if (matrix.length === 0) return [];
    const size = matrix[0].length;
    const totals = new Array(size).fill(0);
    for (const arr of matrix) {
      for (let i = 0; i < size; i++) {
        totals[i] += arr[i];
      }
    }
    return totals.map(tot => tot / matrix.length);
  };

  // Simple copy video frame to base64 canvas thumbnail
  const captureCanvasBase64 = (video: HTMLVideoElement): string => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 160;
    tempCanvas.height = 160;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      // Crop centering the camera feed to thumbnail scale
      const cropSize = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - cropSize) / 2;
      const startY = (video.videoHeight - cropSize) / 2;
      ctx.drawImage(video, startX, startY, cropSize, cropSize, 0, 0, 160, 160);
    }
    return tempCanvas.toDataURL('image/jpeg', 0.8);
  };

  // Aesthetic drawing: drawing neon sci-fi overlay indicators on top of webcam footage
  const drawSciFiHUD = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const rx = 120;
    const ry = 140;

    // 1. Sleek darkened vignette around the scanning scope
    ctx.fillStyle = 'rgba(9, 9, 11, 0.75)'; // deep zinc-950 background math
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI, true);
    ctx.fill();

    // 2. High-precision neon scope ring
    const color = mode === 'enroll' ? '#00f0ff' : '#0ffa9c'; // Electric Cyan / Atalaia Mint Green
    
    // Ambient glowing glass ring behind
    ctx.strokeStyle = mode === 'enroll' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(15, 250, 156, 0.1)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Sharp dotted inner circle
    ctx.strokeStyle = mode === 'enroll' ? 'rgba(0, 240, 255, 0.5)' : 'rgba(15, 250, 156, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]); // clear

    // 3. Dynamic sweep scan line
    const scanPeriod = 2500;
    const progress = (Date.now() % scanPeriod) / scanPeriod;
    // Ping-pong travel back and forth for natural scan feel
    const factor = Math.sin(progress * Math.PI); 
    const scanY = (cy - ry) + factor * (ry * 2);

    // Glow backing for sweep line
    const gradient = ctx.createLinearGradient(cx - rx, scanY, cx + rx, scanY);
    const alpha = 0.4 * (1 - Math.abs(factor - 0.5) * 0.4); // fade near boundaries
    const pulseColor = mode === 'enroll' ? `rgba(0, 240, 255, ${alpha})` : `rgba(15, 250, 156, ${alpha})`;
    const solidColor = mode === 'enroll' ? `rgba(0, 240, 255, ${alpha * 2})` : `rgba(15, 250, 156, ${alpha * 2})`;
    
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.2, solidColor);
    gradient.addColorStop(0.5, pulseColor);
    gradient.addColorStop(0.8, solidColor);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - rx + 15, scanY);
    ctx.lineTo(cx + rx - 15, scanY);
    ctx.stroke();

    // Sleek bracket corners (cybernetic alignment points)
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    const bracketSize = 20;

    // TL
    ctx.beginPath();
    ctx.moveTo(cx - rx, cy - ry + bracketSize);
    ctx.lineTo(cx - rx, cy - ry);
    ctx.lineTo(cx - rx + bracketSize, cy - ry);
    ctx.stroke();

    // TR
    ctx.beginPath();
    ctx.moveTo(cx + rx, cy - ry + bracketSize);
    ctx.lineTo(cx + rx, cy - ry);
    ctx.lineTo(cx + rx - bracketSize, cy - ry);
    ctx.stroke();

    // BL
    ctx.beginPath();
    ctx.moveTo(cx - rx, cy + ry - bracketSize);
    ctx.lineTo(cx - rx, cy + ry);
    ctx.lineTo(cx - rx + bracketSize, cy + ry);
    ctx.stroke();

    // BR
    ctx.beginPath();
    ctx.moveTo(cx + rx, cy + ry - bracketSize);
    ctx.lineTo(cx + rx, cy + ry);
    ctx.lineTo(cx + rx - bracketSize, cy + ry);
    ctx.stroke();
  };

  // Draw face bounding skeleton and tracking points
  const drawDetectionOverlays = (ctx: CanvasRenderingContext2D, prediction: any) => {
    const start = prediction.topLeft as [number, number];
    const end = prediction.bottomRight as [number, number];
    const landmarks = prediction.landmarks as [number, number][];

    const boxWidth = end[0] - start[0];
    const boxHeight = end[1] - start[1];
    const themeColor = mode === 'enroll' ? '#00f0ff' : '#0ffa9c';

    // Thin elegant face boundary box
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(start[0], start[1], boxWidth, boxHeight);

    // Smart bracket brackets inside corner of bounding box
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 2;
    const sz = Math.min(15, boxWidth * 0.15);
    
    // Top-left
    ctx.beginPath();
    ctx.moveTo(start[0], start[1] + sz);
    ctx.lineTo(start[0], start[1]);
    ctx.lineTo(start[0] + sz, start[1]);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(start[0] + boxWidth, start[1] + sz);
    ctx.lineTo(start[0] + boxWidth, start[1]);
    ctx.lineTo(start[0] + boxWidth - sz, start[1]);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(start[0], start[1] + boxHeight - sz);
    ctx.lineTo(start[0], start[1] + boxHeight);
    ctx.lineTo(start[0] + sz, start[1] + boxHeight);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(start[0] + boxWidth, start[1] + boxHeight - sz);
    ctx.lineTo(start[0] + boxWidth, start[1] + boxHeight);
    ctx.lineTo(start[0] + boxWidth - sz, start[1] + boxHeight);
    ctx.stroke();

    // Subtly highlight the face card inside
    ctx.fillStyle = mode === 'enroll' ? 'rgba(0, 240, 255, 0.03)' : 'rgba(15, 250, 156, 0.03)';
    ctx.fillRect(start[0], start[1], boxWidth, boxHeight);

    // Glowing coordinate targets (face landmarks: eyes, nose, mouth, ears)
    landmarks.forEach((pt) => {
      // Small core solid dot
      ctx.fillStyle = themeColor;
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], 3, 0, 2 * Math.PI);
      ctx.fill();

      // Delicate outer boundary target
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], 6, 0, 2 * Math.PI);
      ctx.stroke();
    });

    // Draw connection facial frame webs (very high-tech but minimalist and crisp)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    // Eye to eye connection
    ctx.moveTo(landmarks[0][0], landmarks[0][1]);
    ctx.lineTo(landmarks[1][0], landmarks[1][1]);
    // Eye to nose
    ctx.lineTo(landmarks[2][0], landmarks[2][1]);
    ctx.lineTo(landmarks[0][0], landmarks[0][1]);
    // Nose to mouth
    ctx.moveTo(landmarks[2][0], landmarks[2][1]);
    ctx.lineTo(landmarks[3][0], landmarks[3][1]);
    // Ears to eyes
    ctx.moveTo(landmarks[0][0], landmarks[0][1]);
    ctx.lineTo(landmarks[4][0], landmarks[4][1]);
    ctx.moveTo(landmarks[1][0], landmarks[1][1]);
    ctx.lineTo(landmarks[5][0], landmarks[5][1]);

    // Cross-links for beautiful facial topology representation
    ctx.moveTo(landmarks[4][0], landmarks[4][1]); // right ear
    ctx.lineTo(landmarks[3][0], landmarks[3][1]); // mouth
    ctx.lineTo(landmarks[5][0], landmarks[5][1]); // left ear
    ctx.stroke();
  };

  const drawMatchedCrown = (ctx: CanvasRenderingContext2D, prediction: any, name: string) => {
    const start = prediction.topLeft as [number, number];
    const end = prediction.bottomRight as [number, number];
    const boxWidth = end[0] - start[0];
    const boxHeight = end[1] - start[1];

    // Highlight brilliant green match state
    ctx.strokeStyle = '#0ffa9c';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(start[0], start[1], boxWidth, boxHeight);
    
    ctx.fillStyle = 'rgba(15, 250, 156, 0.08)';
    ctx.fillRect(start[0], start[1], boxWidth, boxHeight);

    // Draw badge header with name
    ctx.fillStyle = '#0ffa9c';
    ctx.fillRect(start[0] - 1, start[1] - 32, boxWidth + 2, 32);

    ctx.fillStyle = '#18181b'; // dark zinc-900 background contrast
    ctx.font = 'black 10px sans-serif';
    ctx.textAlign = 'center';
    
    ctx.font = 'bold 9px monospace';
    ctx.fillText('IDENTIDADE CONFIRMADA', start[0] + boxWidth / 2, start[1] - 18);
    ctx.font = 'black 11px sans-serif';
    ctx.fillText(name.toUpperCase(), start[0] + boxWidth / 2, start[1] - 6);
  };

  const handleSelectUser = (profile: any) => {
    stopResources();
    setLoading(true);
    setStatusMessage(`Assinatura confirmada para: ${profile.name}`);
    setTimeout(() => {
      onSuccess(profile);
      onClose();
    }, 1200);
  };



  if (!isOpen) return null;

  const primaryAccentColor = mode === 'enroll' ? '#00f0ff' : '#0ffa9c';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-[0_0_80px_rgba(15,250,156,0.06)] relative overflow-hidden flex flex-col text-center">
        
        {/* Glow corner effects */}
        <div className={`absolute top-0 right-0 w-32 h-32 blur-[100px] rounded-full opacity-20 ${mode === 'enroll' ? 'bg-[#00f0ff]' : 'bg-[#0ffa9c]'}`} />
        <div className={`absolute bottom-0 left-0 w-32 h-32 blur-[100px] rounded-full opacity-10 ${mode === 'enroll' ? 'bg-[#00f0ff]' : 'bg-[#0ffa9c]'}`} />

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6 relative">
          <div className="flex items-center space-x-3 text-left">
            <div 
              style={{ borderColor: `${primaryAccentColor}20` }}
              className="p-2.5 rounded-xl border bg-zinc-900/50"
            >
              <Scan size={20} style={{ color: primaryAccentColor }} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider font-sans">
                {mode === 'enroll' ? 'Mapeamento Facial' : 'Autenticação Biométrica'}
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                Mecanismo de Verificação Biométrica Ativo
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              stopResources();
              onClose();
            }}
            className="p-1 px-3 bg-zinc-900/60 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs tracking-wider uppercase transition-all duration-150 font-mono"
          >
            Sair
          </button>
        </div>

        {/* Video feed monitor workspace */}
        <div className="relative w-full aspect-[4/3] max-h-[340px] bg-black rounded-2xl overflow-hidden border border-zinc-800/80 ring-1 ring-white/5 shadow-2xl flex items-center justify-center mb-5">
          
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center space-y-4 bg-zinc-950/90 backdrop-blur-md">
              <RefreshCw className="text-[#0ffa9c] animate-spin" size={28} />
              <p className="text-xs text-zinc-400 font-mono tracking-wider">{statusMessage}</p>
            </div>
          )}

          {errorText && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 space-y-4 bg-zinc-950 text-center">
              <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 text-red-500">
                <AlertTriangle size={28} />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Câmera Não Detectada ou Bloqueada</h4>
              <p className="text-xs text-zinc-400 max-w-sm leading-relaxed font-sans">
                A câmera está indisponível ou as permissões foram negadas. Por favor, feche esta tela de biometria e realize o login normalmente utilizando seu e-mail e senha cadastrados no formulário tradicional.
              </p>
            </div>
          )}

          {/* Core Webcam stream node */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Dynamic tracking overlays rendering plane */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none object-cover"
          />

          {/* Multi-scan progress bar in enrollment */}
          {mode === 'enroll' && !loading && !errorText && (
            <div className="absolute bottom-4 inset-x-4 bg-zinc-950/80 border border-zinc-900 p-2.5 rounded-xl backdrop-blur-md flex items-center space-x-3">
              <span className="text-[10px] font-mono font-bold text-zinc-400 text-right w-12">{captureProgress}%</span>
              <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-[#00f0ff] transition-all duration-200 shadow-[0_0_10px_#00f0ff]"
                  style={{ width: `${captureProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Manual Scan Trigger Action Button */}
        {!errorText && !loading && !scannedProfile && (
          <button
            type="button"
            onClick={handleTriggerScan}
            disabled={isScanning}
            style={{ 
              borderColor: isScanning ? '#27272a' : `${primaryAccentColor}30`,
              backgroundColor: isScanning ? 'rgba(24, 24, 27, 0.4)' : `${primaryAccentColor}06`
            }}
            className={`w-full py-4 px-6 mb-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 shadow-lg border hover:scale-[1.01] transition-transform duration-150 ${
              isScanning
                ? 'text-zinc-500 cursor-not-allowed border-zinc-800'
                : 'hover:bg-zinc-900/60 text-white animate-pulse'
            }`}
          >
            <Scan size={15} style={{ color: isScanning ? '#71717a' : primaryAccentColor }} className={isScanning ? "animate-spin" : ""} />
            <span style={{ color: isScanning ? '#71717a' : '#ffffff' }}>
              {isScanning ? 'Mapeando Características...' : 'Iniciar Escaneamento Facial'}
            </span>
          </button>
        )}

        {/* Console notification output bar */}
        <div 
          className={`p-3.5 rounded-xl text-xs flex items-center justify-center space-x-2.5 font-mono mb-5 border transition-all duration-300 ${
            scannedProfile 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
              : mode === 'enroll' 
                ? 'bg-zinc-900/40 border-zinc-800 text-zinc-300' 
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-300'
          }`}
        >
          {!scannedProfile && (
            <div 
              style={{ backgroundColor: primaryAccentColor }} 
              className="w-1.5 h-1.5 rounded-full animate-ping" 
            />
          )}
          <span className="leading-tight text-[11px] uppercase tracking-wider">{statusMessage}</span>
        </div>

        {/* Secondary controls/manual simulation triggers & simulations panel */}
        {!errorText && (
          <div className="flex flex-col space-y-3 pt-3 border-t border-zinc-900 text-xs w-full text-center">
            <div className="flex items-center justify-center text-zinc-500 text-[10px] font-mono leading-none">
              <span className="flex items-center">
                <HelpCircle size={12} className="mr-1.5 text-zinc-600 animate-pulse" />
                Biometria local criptografada de alta segurança.
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { PrivacyMask } from '@/types';
import { MockService } from '@/services/mockService';

interface CameraPrivacyMaskOverlayProps {
  cameraId?: string;
  masks?: PrivacyMask[];
  opacity?: number;
  selectedMaskId?: string | null;
  onSelectMask?: (id: string) => void;
  showLabels?: boolean;
  className?: string;
}

export const CameraPrivacyMaskOverlay: React.FC<CameraPrivacyMaskOverlayProps> = ({
  cameraId,
  masks = [],
  opacity = 1,
  selectedMaskId = null,
  onSelectMask,
  showLabels = false,
  className = ''
}) => {
  const [internalMasks, setInternalMasks] = useState<PrivacyMask[]>(masks || []);

  useEffect(() => {
    if (masks && masks.length > 0) {
      setInternalMasks(masks);
      return;
    }

    if (cameraId) {
      // 1. Tentar ler do cache local
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`atalaia_camera_privacy_masks_${cameraId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setInternalMasks(parsed);
              return;
            }
          }
        } catch {}
      }

      // 2. Se for novo dispositivo ou aba anônima, buscar no Supabase
      let active = true;
      MockService.getCameraPrivacyMasks(cameraId).then(res => {
        if (active && res && res.length > 0) {
          setInternalMasks(res);
        }
      }).catch(() => {});

      return () => { active = false; };
    } else {
      setInternalMasks(masks || []);
    }
  }, [masks, cameraId]);

  const effectiveMasks = (masks && masks.length > 0) ? masks : internalMasks;

  if (!effectiveMasks || effectiveMasks.length === 0) return null;

  const fillColor = opacity === 1 ? '#000000' : `rgba(0, 0, 0, ${opacity})`;

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden z-20 ${className}`}>
      {/* SVG para renderizar todas as máscaras poligonais ponto a ponto com perfeição vetorial */}
      <svg 
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        {effectiveMasks.map((mask, idx) => {
          if (!mask.points || mask.points.length < 3) return null;
          const isSelected = selectedMaskId === mask.id;
          const pointsString = mask.points.map(p => `${p.x},${p.y}`).join(' ');

          return (
            <g 
              key={mask.id || idx}
              style={{ pointerEvents: onSelectMask ? 'auto' : 'none', cursor: onSelectMask ? 'pointer' : 'default' }}
              onClick={(e) => {
                if (onSelectMask) {
                  e.stopPropagation();
                  onSelectMask(mask.id);
                }
              }}
            >
              <polygon
                points={pointsString}
                fill={fillColor}
                stroke={isSelected ? '#00f0ff' : 'rgba(0,0,0,0.8)'}
                strokeWidth={isSelected ? '0.6' : '0.2'}
                strokeDasharray={isSelected ? '1.5 1' : undefined}
                style={{
                  filter: isSelected ? 'drop-shadow(0 0 3px rgba(0,240,255,0.8))' : 'none',
                  transition: 'stroke 0.2s, filter 0.2s'
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Renderização de máscaras retangulares clássicas ou rótulos */}
      {effectiveMasks.map((mask, idx) => {
        const isSelected = selectedMaskId === mask.id;
        const hasPolygon = mask.points && mask.points.length >= 3;

        // Se for polígono, podemos exibir um badge no centróide ou centro da bounding box se showLabels estiver ativo
        if (hasPolygon) {
          if (!showLabels && !isSelected) return null;
          return (
            <div
              key={`label-${mask.id || idx}`}
              onClick={(e) => {
                if (onSelectMask) {
                  e.stopPropagation();
                  onSelectMask(mask.id);
                }
              }}
              style={{
                position: 'absolute',
                left: `${mask.x + mask.width / 2}%`,
                top: `${mask.y + mask.height / 2}%`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: onSelectMask ? 'auto' : 'none'
              }}
              className="flex flex-col items-center justify-center select-none"
            >
              <span className={`text-[9px] font-mono font-bold uppercase tracking-tight px-1.5 py-0.5 rounded shadow ${
                isSelected 
                  ? 'bg-black text-atalaia-neon border border-atalaia-neon shadow-[0_0_10px_rgba(0,240,255,0.5)]' 
                  : 'bg-black/80 text-zinc-400 border border-white/10'
              }`}>
                🔒 {mask.label || `MÁSCARA #${idx + 1}`}
              </span>
            </div>
          );
        }

        // Renderização retangular (fallback / presets retangulares)
        return (
          <div
            key={mask.id || idx}
            onClick={(e) => {
              if (onSelectMask) {
                e.stopPropagation();
                onSelectMask(mask.id);
              }
            }}
            style={{
              position: 'absolute',
              left: `${mask.x}%`,
              top: `${mask.y}%`,
              width: `${mask.width}%`,
              height: `${mask.height}%`,
              backgroundColor: fillColor,
              border: isSelected ? '2px solid #00f0ff' : 'none',
              boxShadow: isSelected ? '0 0 0 2px rgba(0,240,255,0.5), 0 0 20px rgba(0,240,255,0.4)' : 'none',
              pointerEvents: onSelectMask ? 'auto' : 'none',
              cursor: onSelectMask ? 'pointer' : 'default'
            }}
            className="flex flex-col items-center justify-center select-none"
          >
            {showLabels && (
              <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-widest pointer-events-none select-none px-1 py-0.5 bg-black/60 rounded border border-white/10">
                {mask.label || 'PRIVACIDADE'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

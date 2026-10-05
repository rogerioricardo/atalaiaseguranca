import React from 'react';
import { CameraSponsor, UserRole } from '@/types';
import { Sparkles } from 'lucide-react';

interface CameraSponsorsFooterProps {
  sponsors?: CameraSponsor[];
  isOverlay?: boolean;
  onContactSponsor?: () => void;
  userRole?: UserRole;
}

export const CameraSponsorsFooter: React.FC<CameraSponsorsFooterProps> = ({
  sponsors = [],
  isOverlay = true,
  onContactSponsor,
}) => {
  // Filtrar apenas os patrocinadores cadastrados que possuem LOGO
  const activeSponsors = sponsors.filter(s => s && s.logoUrl && s.logoUrl.trim() !== '');

  // Se não houver nenhum patrocinador com logo cadastrado, não exibe o rodapé
  if (activeSponsors.length === 0) {
    return null;
  }

  const handleSponsorClick = (sponsor: CameraSponsor) => {
    if (sponsor.linkUrl && sponsor.linkUrl.trim() !== '') {
      let url = sponsor.linkUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (onContactSponsor) {
      onContactSponsor();
    }
  };

  return (
    <div 
      data-ignore-screenshot="true"
      className={`w-full bg-gradient-to-t from-black via-black/95 to-black/80 border-t border-atalaia-neon/30 p-2.5 transition-all ${
        isOverlay ? 'absolute bottom-0 left-0 right-0 z-20 backdrop-blur-md' : 'rounded-b-2xl'
      }`}
    >
      {/* Header do Rodapé de Mantenedores */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase font-mono tracking-wider text-emerald-400 flex items-center gap-1">
            <Sparkles size={11} className="text-emerald-400" /> Câmera Aberta • Mantenedores Comunitários
          </span>
        </div>
        <span className="text-[9px] text-zinc-400 font-mono hidden sm:inline">
          {activeSponsors.length} {activeSponsors.length === 1 ? 'Empresa Mantenedora' : 'Empresas Mantenedoras'}
        </span>
      </div>

      {/* Grid com apenas os Mantenedores Cadastrados */}
      <div className={`grid gap-2 ${
        activeSponsors.length === 1 ? 'grid-cols-1' : activeSponsors.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
      }`}>
        {activeSponsors.map((sponsor, index) => (
          <div
            key={sponsor.id || `sponsor-${index}`}
            onClick={() => handleSponsorClick(sponsor)}
            className="group relative flex items-center justify-center p-1.5 sm:p-2 bg-zinc-950/95 hover:bg-black border border-white/15 hover:border-atalaia-neon rounded-xl transition-all cursor-pointer overflow-hidden shadow-lg h-14 sm:h-16 w-full"
            title={sponsor.linkUrl ? `Acessar ${sponsor.name || 'Empresa'}` : sponsor.name}
          >
            <img
              src={sponsor.logoUrl}
              alt={sponsor.name || 'Logo Mantenedor'}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Camera, UserRole } from '@/types';
import { useAuth } from '@/auth/context';
import { MockService } from '@/services/mockService';
import { 
  MapPin, X, Navigation, Copy, Check, Edit3, Save, 
  Layers, Upload, Loader2, Camera as CameraIcon, Info, ExternalLink, Compass, Shield
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { Button, Badge, Input } from '@/components/UI';

// Fix Leaflet Default Icon in React using CDN URLs
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
if (typeof window !== 'undefined') {
  L.Marker.prototype.options.icon = DefaultIcon;
}

// Custom Camera Icon for map markers
const CameraMarkerIcon = L.divIcon({
  className: 'custom-camera-location-marker',
  html: `<div style="background-color: #00FF66; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(0,255,102,0.85); border: 2.5px solid #000; cursor: pointer; transition: transform 0.2s;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
         </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

// Map Resizer component to ensure Leaflet renders correctly inside modals
const MapResizer: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// Map Click Handler for Admin to pick exact point on map
interface MapPickerProps {
  isEditing: boolean;
  onLocationSelected: (lat: number, lng: number) => void;
}

const MapPicker: React.FC<MapPickerProps> = ({ isEditing, onLocationSelected }) => {
  useMapEvents({
    click(e) {
      if (isEditing) {
        onLocationSelected(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
};

// Map Recenter Controller
const MapCenterController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';

const STREET_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const STREET_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface CameraLocationModalProps {
  camera: Camera | null;
  isOpen: boolean;
  onClose: () => void;
  neighborhoodName?: string;
  onCameraUpdated?: (updatedCamera: Camera) => void;
  startInEditMode?: boolean;
}

export const CameraLocationModal: React.FC<CameraLocationModalProps> = ({
  camera,
  isOpen,
  onClose,
  neighborhoodName,
  onCameraUpdated,
  startInEditMode = false
}) => {
  const { user } = useAuth();
  const isAdminOrIntegrator = user?.role === UserRole.ADMIN || user?.role === UserRole.INTEGRATOR;

  const [isEditing, setIsEditing] = useState(false);
  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Editable Form States
  const [editLat, setEditLat] = useState<number>(-27.5969);
  const [editLng, setEditLng] = useState<number>(-48.5495);
  const [editDescription, setEditDescription] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');

  useEffect(() => {
    if (camera) {
      const defaultLat = camera.lat !== undefined && camera.lat !== 0 ? camera.lat : -27.5969;
      const defaultLng = camera.lng !== undefined && camera.lng !== 0 ? camera.lng : -48.5495;
      
      setEditLat(defaultLat);
      setEditLng(defaultLng);
      setEditDescription(camera.locationDescription || '');
      setEditAddress(camera.address || '');
      setEditPhotoUrl(camera.locationPhotoUrl || '');
      setIsEditing(startInEditMode && isAdminOrIntegrator);
      setSaveSuccessMsg('');
    }
  }, [camera, startInEditMode, isAdminOrIntegrator, isOpen]);

  if (!isOpen || !camera) return null;

  const currentLat = isEditing ? editLat : (camera.lat || editLat);
  const currentLng = isEditing ? editLng : (camera.lng || editLng);
  const currentCenter: [number, number] = [currentLat, currentLng];

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2500);
  };

  const handleOpenGoogleMaps = () => {
    window.open(`https://www.google.com/maps?q=${currentLat},${currentLng}`, '_blank');
  };

  const handleOpenWaze = () => {
    window.open(`https://waze.com/ul?ll=${currentLat},${currentLng}&navigate=yes`, '_blank');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setEditPhotoUrl(dataUrl);
        setIsUploadingPhoto(false);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLocation = async () => {
    if (!camera) return;
    setIsSaving(true);
    try {
      const updated = await MockService.updateCameraLocation(
        camera.id,
        editLat,
        editLng,
        editDescription,
        editAddress,
        editPhotoUrl
      );

      const resolvedCam: Camera = updated || {
        ...camera,
        lat: editLat,
        lng: editLng,
        locationDescription: editDescription,
        address: editAddress,
        locationPhotoUrl: editPhotoUrl
      };

      if (onCameraUpdated) {
        onCameraUpdated(resolvedCam);
      }

      setSaveSuccessMsg('Localização e descrição da câmera atualizadas com sucesso!');
      setIsEditing(false);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      alert('Erro ao salvar localização da câmera. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-40"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-4xl bg-[#09090b] border border-atalaia-neon/30 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,255,102,0.18)] flex flex-col max-h-[92vh] z-50 my-auto"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-atalaia-neon/15 via-[#0d1510] to-[#09090b] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-atalaia-neon/15 border border-atalaia-neon/40 flex items-center justify-center text-atalaia-neon shadow-[0_0_20px_rgba(0,255,102,0.3)] shrink-0">
              <MapPin size={20} className="animate-bounce" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-white font-extrabold text-sm sm:text-base uppercase tracking-tight truncate">
                  {camera.name}
                </h2>
                <Badge color="green" className="text-[9px] px-2 py-0.5 bg-atalaia-neon/10 border-atalaia-neon/30 text-atalaia-neon font-mono">
                  LOCALIZAÇÃO EXATA
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                Bairro: <span className="text-atalaia-neon font-semibold uppercase">{neighborhoodName || 'Atalaia'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAdminOrIntegrator && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-xl bg-atalaia-neon/10 hover:bg-atalaia-neon/20 border border-atalaia-neon/40 text-atalaia-neon text-xs font-bold font-mono uppercase flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Editar localização e descrição no mapa"
              >
                <Edit3 size={13} />
                <span className="hidden sm:inline">Editar Localização</span>
                <span className="sm:hidden">Editar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        <AnimatePresence>
          {saveSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-500/15 border-b border-emerald-500/30 px-5 py-2.5 text-xs text-emerald-400 flex items-center gap-2 font-medium"
            >
              <Check size={16} className="stroke-[3] shrink-0" />
              <span>{saveSuccessMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Instruction in Edit Mode */}
          {isEditing && (
            <div className="p-3.5 bg-atalaia-neon/10 border border-atalaia-neon/30 rounded-2xl flex items-start gap-3 text-xs text-zinc-300">
              <Shield className="text-atalaia-neon shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold text-white uppercase tracking-wide font-mono text-[11px]">
                  Modo de Edição de Localização Ativo (Administrador)
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Clique em qualquer ponto do mapa abaixo para reposicionar o pino GPS da câmera com precisão máxima, ou edite as coordenadas e a descrição nos campos a seguir.
                </p>
              </div>
            </div>
          )}

          {/* Interactive Map Section */}
          <div className="relative w-full h-[280px] sm:h-[350px] rounded-2xl overflow-hidden border border-white/10 bg-black shadow-inner">
            <MapContainer
              center={currentCenter}
              zoom={17}
              scrollWheelZoom={true}
              className="w-full h-full"
              attributionControl={false}
            >
              <MapResizer />
              <MapCenterController center={currentCenter} />
              <MapPicker
                isEditing={isEditing}
                onLocationSelected={(lat, lng) => {
                  setEditLat(lat);
                  setEditLng(lng);
                }}
              />

              <TileLayer
                url={mapType === 'satellite' ? SATELLITE_URL : STREET_URL}
                attribution={mapType === 'satellite' ? SATELLITE_ATTRIBUTION : STREET_ATTRIBUTION}
                maxZoom={19}
              />

              <Marker position={currentCenter} icon={CameraMarkerIcon}>
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 text-center font-sans">
                    <p className="font-bold text-xs text-black uppercase">{camera.name}</p>
                    <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
                      {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
                    </p>
                    {camera.locationDescription && (
                      <p className="text-[9px] text-zinc-700 mt-1 max-w-[180px] line-clamp-2">
                        {camera.locationDescription}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            </MapContainer>

            {/* Map Layer Switcher & Pin Feedback */}
            <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
              <div className="bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/15 flex items-center gap-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => setMapType('satellite')}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all ${
                    mapType === 'satellite' 
                      ? 'bg-atalaia-neon text-black shadow-[0_0_10px_rgba(0,255,102,0.5)]' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  🛰️ Satélite
                </button>
                <button
                  type="button"
                  onClick={() => setMapType('street')}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all ${
                    mapType === 'street' 
                      ? 'bg-atalaia-neon text-black shadow-[0_0_10px_rgba(0,255,102,0.5)]' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  🗺️ Ruas
                </button>
              </div>
            </div>

            {/* GPS HUD Tag on Map */}
            <div className="absolute bottom-3 left-3 z-[400] px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-xl border border-white/15 text-[10px] font-mono text-zinc-300 flex items-center gap-2 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-atalaia-neon animate-ping" />
              <span>GPS: {currentLat.toFixed(5)}, {currentLng.toFixed(5)}</span>
            </div>
          </div>

          {/* Location Details & Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left Column: Description & Address */}
            <div className="md:col-span-7 space-y-4">
              {/* Onde Está Esta Câmera (Descrição Principal) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-white/10 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-atalaia-neon/15 text-atalaia-neon">
                      <Compass size={16} />
                    </div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                      Onde Está Esta Câmera?
                    </h3>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">Instalação Tática</span>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">
                      Descrição detalhada do local / ponto de instalação
                    </label>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Ex: Instalada no poste metálico em frente ao condomínio, monitorando a rotatória central e os acessos norte/sul."
                      className="w-full bg-black/70 border border-white/15 focus:border-atalaia-neon rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 outline-none transition-colors leading-relaxed"
                    />
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                    {camera.locationDescription || (
                      <span className="text-zinc-500 italic">
                        Nenhuma descrição cadastrada para esta câmera. Câmera instalada no ponto estratégico do bairro {neighborhoodName || 'Atalaia'}.
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Endereço / Ponto de Referência */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={14} className="text-atalaia-neon" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Endereço & Ponto de Referência
                  </h4>
                </div>

                {isEditing ? (
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Ex: Av. Principal, 1200 - Esquina com Rua das Palmeiras"
                    className="w-full bg-black/70 border border-white/15 focus:border-atalaia-neon rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-600 outline-none transition-colors"
                  />
                ) : (
                  <p className="text-xs text-zinc-300 font-sans">
                    {camera.address || 'Ponto tático comunitário cadastrado no bairro.'}
                  </p>
                )}
              </div>

              {/* Coordenadas GPS Exatas */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-zinc-400 font-mono tracking-wider">
                    Coordenadas Geográficas (Latitude / Longitude)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCoords}
                    className="text-[10px] text-atalaia-neon hover:text-atalaia-neon/80 font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedCoords ? (
                      <>
                        <Check size={11} className="stroke-[3]" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>Copiar GPS</span>
                      </>
                    )}
                  </button>
                </div>

                {isEditing ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-zinc-500 font-mono block mb-1">LATITUDE</label>
                      <input
                        type="number"
                        step="any"
                        value={editLat}
                        onChange={(e) => setEditLat(parseFloat(e.target.value) || 0)}
                        className="w-full bg-black border border-white/15 focus:border-atalaia-neon rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 font-mono block mb-1">LONGITUDE</label>
                      <input
                        type="number"
                        step="any"
                        value={editLng}
                        onChange={(e) => setEditLng(parseFloat(e.target.value) || 0)}
                        className="w-full bg-black border border-white/15 focus:border-atalaia-neon rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 font-mono text-xs text-white">
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                      Lat: <strong className="text-atalaia-neon">{currentLat.toFixed(6)}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                      Lng: <strong className="text-atalaia-neon">{currentLng.toFixed(6)}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Location Photo & Quick GPS Links */}
            <div className="md:col-span-5 space-y-4">
              {/* Foto do Local / Poste */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CameraIcon size={14} className="text-atalaia-neon" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Foto do Local (Poste)
                    </h4>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center gap-2 p-4 border border-dashed border-white/20 hover:border-atalaia-neon rounded-xl bg-black/50 cursor-pointer transition-colors text-center">
                      {isUploadingPhoto ? (
                        <Loader2 className="animate-spin text-atalaia-neon" size={24} />
                      ) : (
                        <Upload size={24} className="text-zinc-400" />
                      )}
                      <span className="text-xs font-bold text-zinc-300">
                        {editPhotoUrl ? 'Alterar Foto do Local' : 'Enviar Foto do Local/Poste'}
                      </span>
                      <span className="text-[10px] text-zinc-500">JPG, PNG até 5MB</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                      />
                    </label>

                    {editPhotoUrl && (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/15">
                        <img src={editPhotoUrl} alt="Prévia do local" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditPhotoUrl('')}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-red-500 text-white transition-colors"
                          title="Remover foto"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {camera.locationPhotoUrl ? (
                      <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/15 relative group">
                        <img 
                          src={camera.locationPhotoUrl} 
                          alt={`Localização de ${camera.name}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                          <span className="text-[10px] text-zinc-300 font-mono">Ponto de Instalação Real</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-xl border border-white/10 bg-black/40 flex flex-col items-center justify-center text-center p-4">
                        <CameraIcon size={24} className="text-zinc-600 mb-1.5" />
                        <p className="text-xs text-zinc-400 font-medium">Sem foto do poste cadastrada</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">Visível pelo mapa georreferenciado</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botões de Navegação GPS Externa */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-2.5">
                <span className="text-[10px] font-black uppercase text-zinc-400 font-mono tracking-wider block">
                  Navegar até a Câmera
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleOpenGoogleMaps}
                    className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Navigation size={13} className="text-blue-400" />
                    <span>Google Maps</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenWaze}
                    className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <ExternalLink size={13} className="text-cyan-400" />
                    <span>Waze GPS</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#070709] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-2">
            <Info size={13} className="text-atalaia-neon shrink-0" />
            <span>Rede Atalaia de Segurança Colaborativa Georreferenciada</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 sm:flex-initial text-xs h-9 border-white/10 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveLocation}
                  disabled={isSaving}
                  className="flex-1 sm:flex-initial text-xs h-9 bg-atalaia-neon text-black hover:bg-atalaia-neon/90 font-black flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,255,102,0.3)]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Salvar Localização</span>
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto text-xs h-9 border-white/15 text-white hover:border-atalaia-neon"
              >
                Fechar
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

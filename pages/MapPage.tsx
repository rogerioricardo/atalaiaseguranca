
import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MockService } from '../services/mockService';
import { User, Neighborhood, UserRole, Camera } from '../types';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { Video, MapPin, Globe } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Fix Leaflet Default Icon in React using CDN URLs
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Camera Icon for map markers
const CameraIcon = L.divIcon({
    className: 'custom-camera-marker',
    html: `<div style="background-color: #00FF66; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(0,255,102,0.6); border: 2px solid #000;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
           </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

// Custom Icon for Neighborhood Centers
const NeighborhoodIcon = L.divIcon({
    className: 'custom-hood-marker',
    html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(59, 130, 246, 0.6); border: 2px solid #fff;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

// Custom MOTO Icon for SCR markers (Yellow/Neon)
const MotoIcon = L.divIcon({
    className: 'custom-moto-marker',
    html: `<div style="background-color: #EAB308; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(234, 179, 8, 0.8); border: 2px solid #000;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h-5a1 1 0 0 0-1 1v4h12V7a1 1 0 0 0-1-1z"/><path d="M12 11v6"/><path d="M5.5 17.5h13"/></svg>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

// SATELLITE ONLY CONFIGURATION
const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

const MapResizer = () => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};

const MapPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  
  const centerPos: [number, number] = user?.lat && user?.lng ? [user.lat, user.lng] : [-27.5969, -48.5495];

  const roleNames: Record<string, string> = {
    ADMIN: 'Administrador',
    INTEGRATOR: 'Integrador',
    SCR: 'Motovigia',
    RESIDENT: 'Morador'
  };

  const fetchData = useCallback(async () => {
      // Fetch users from my neighborhood only (except Admin)
      const targetHood = user?.role === UserRole.ADMIN ? undefined : user?.neighborhoodId;
      const usersData = await MockService.getUsers(targetHood);
      setUsers(usersData);
      
      const hoodsData = await MockService.getNeighborhoods();
      setNeighborhoods(hoodsData);

      // Fetch All System Cameras (Nova Configuração)
      const allCameras = await MockService.getAllSystemCameras();
      setCameras(allCameras);
  }, [user]);

  useEffect(() => {
    fetchData();

    const subProfiles = MockService.subscribeToTable('profiles', fetchData);
    const subHoods = MockService.subscribeToTable('neighborhoods', fetchData);
    const subCameras = MockService.subscribeToTable('cameras', fetchData);

    return () => {
        supabase.removeChannel(subProfiles);
        supabase.removeChannel(subHoods);
        supabase.removeChannel(subCameras);
    };
  }, [fetchData]);

  return (
    <Layout>
      <div className="h-[calc(100vh-100px)] flex flex-col">
        <div className="mb-4 flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-white">Mapa Comunitário</h1>
                <p className="text-gray-400">Visualize a rede de proteção e câmeras em tempo real.</p>
            </div>
            {/* Satellite Badge Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-500/30 rounded-lg text-blue-300 text-xs font-bold uppercase tracking-wider">
                <Globe size={14} /> Modo Satélite
            </div>
        </div>

        <div className="flex-1 rounded-xl overflow-hidden border border-atalaia-border shadow-2xl relative z-0 group">
             <MapContainer 
                center={centerPos} 
                zoom={14} 
                style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
                scrollWheelZoom={true}
            >
                <MapResizer />
                {/* FORCED SATELLITE LAYER */}
                <TileLayer
                    attribution={SATELLITE_ATTRIBUTION}
                    url={SATELLITE_URL}
                />

                {/* User Markers */}
                {users.map((u) => (
                    u.lat && u.lng && (
                        <Marker 
                            key={`user-${u.id}`} 
                            position={[u.lat, u.lng]}
                            icon={u.role === UserRole.SCR ? MotoIcon : DefaultIcon} // SCR gets Moto Icon
                        >
                            <Popup className="text-black">
                                <strong className="block text-sm mb-1">{u.name}</strong>
                                <span className={`text-xs uppercase px-1 rounded ${u.role === UserRole.SCR ? 'bg-yellow-400 font-bold' : 'bg-gray-200'}`}>
                                    {u.role ? roleNames[u.role] : u.role}
                                </span>
                                {u.role === UserRole.SCR && (
                                    <div className="text-[10px] text-gray-500 mt-1 italic">
                                        Em deslocamento tático
                                    </div>
                                )}
                            </Popup>
                        </Marker>
                    )
                ))}

                {/* Neighborhood Center Markers (Blue) */}
                {neighborhoods.map((h) => (
                    h.lat && h.lng && (
                        <Marker key={`hood-${h.id}`} position={[h.lat, h.lng]} icon={NeighborhoodIcon}>
                             <Popup className="text-black">
                                <div className="flex items-center gap-2 mb-1">
                                    <MapPin size={16} />
                                    <strong className="text-sm">Bairro: {h.name}</strong>
                                </div>
                                <span className="text-xs text-blue-600 font-medium">Ponto Central / Info</span>
                            </Popup>
                        </Marker>
                    )
                ))}

                {/* Individual Camera Markers (Green) - NEW */}
                {cameras.map((cam) => (
                    cam.lat && cam.lng && (
                        <Marker key={`cam-${cam.id}`} position={[cam.lat, cam.lng]} icon={CameraIcon}>
                             <Popup className="text-black" minWidth={300}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Video size={16} />
                                    <strong className="text-sm">Câmera: {cam.name}</strong>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] text-green-600 font-bold animate-pulse">● EM OPERAÇÃO</span>
                                    <span className="text-[9px] text-gray-400 font-mono">{cam.lat.toFixed(4)}, {cam.lng.toFixed(4)}</span>
                                </div>
                                
                                <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-gray-200 shadow-inner mt-1">
                                    {cam.iframeCode.trim().startsWith('<') ? (
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
                                            className="w-full h-full border-0"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <iframe 
                                            src={cam.iframeCode} 
                                            className="w-full h-full border-0" 
                                            allowFullScreen 
                                        />
                                    )}
                                </div>
                                <div className="mt-2 text-[9px] text-gray-500 italic text-center">
                                    Monitoramento em tempo real Atalaia
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}

            </MapContainer>

            {/* Overlay Legend */}
            <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-md p-4 rounded-lg border border-white/10 z-[1000] text-xs pointer-events-none">
                <h4 className="font-bold text-white mb-2 uppercase">Legenda</h4>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-yellow-500 border border-black flex items-center justify-center shadow-[0_0_5px_rgba(234,179,8,0.5)]">
                             <div className="w-4 h-1 bg-black rounded" />
                        </div>
                        <span className="text-yellow-400 font-bold">Motovigia (SCR)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <img src={iconUrl} className="w-4 h-6 opacity-80" alt="marker" />
                        <span className="text-gray-300">Moradores</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-atalaia-neon border border-black flex items-center justify-center shadow-[0_0_5px_rgba(0,255,102,0.5)]">
                             <div className="w-1 h-1 bg-black rounded-full" />
                        </div>
                        <span className="text-gray-300">Câmeras (Individual)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm bg-blue-500 border border-black flex items-center justify-center shadow-[0_0_5px_rgba(59,130,246,0.5)]">
                             <div className="w-1 h-1 bg-black rounded-full" />
                        </div>
                        <span className="text-gray-300">Centro do Bairro</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default MapPage;

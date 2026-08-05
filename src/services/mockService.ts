
import { supabase, isRealSupabase } from '../lib/supabaseClient';
import { Neighborhood, Alert, ChatMessage, UserRole, User, Notification, ServiceRequest, Camera, SupportTicket, Coupon, RecordingRequest } from '../types';

const generateUUID = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const sanitizeUUID = (id?: string): string | null => {
    if (!id || id === 'unknown' || id === 'undefined' || id.trim() === '') return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isRealSupabase && !isUuid) return null;
    return id;
};

const DEMO_CAMERAS: Camera[] = [
  {
    id: 'cam-demo-1',
    neighborhoodId: 'hood-demo-1',
    name: 'Câmera Entrada Norte',
    iframeCode: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    lat: -27.5910,
    lng: -48.5420,
    locationPhotoUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'cam-demo-2',
    neighborhoodId: 'hood-demo-1',
    name: 'Câmera Avenida Central',
    iframeCode: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    lat: -27.5969,
    lng: -48.5495,
    locationPhotoUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'cam-demo-3',
    neighborhoodId: 'hood-demo-1',
    name: 'Câmera Rotatória Leste',
    iframeCode: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    lat: -27.6015,
    lng: -48.5550,
    locationPhotoUrl: 'https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?w=500&auto=format&fit=crop&q=60'
  }
];

const getLocalCameras = (): Camera[] => {
  if (typeof window === 'undefined') return [];
  try {
    const cached = localStorage.getItem('atalaia_local_cameras');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
  } catch (err) {
    console.warn("localStorage is not accessible");
  }
  return [];
};

const saveLocalCameras = (cameras: Camera[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('atalaia_local_cameras', JSON.stringify(cameras));
  } catch (err) {
    console.warn("localStorage is not accessible");
  }
};

export const MockService = {
  // --- SISTEMA ---
  getSettings: async (forceRefresh = false): Promise<Record<string, string>> => {
      if (!isRealSupabase) return { 'template_broadcast_prefix': '[DEMO]' };
      try {
          const { data, error } = await supabase.from('system_settings').select('key, value');
          if (error) {
              console.error("[MockService] Error fetching settings:", error);
              throw error;
          }
          const settings: Record<string, string> = {};
          (data || []).forEach(s => settings[s.key] = s.value);
          return settings;
      } catch (e) { 
          console.error("[MockService] Catch in getSettings:", e);
          return {}; 
      }
  },

  updateSetting: async (key: string, value: string): Promise<void> => {
      if (!isRealSupabase) return;
      const { error } = await supabase.from('system_settings').upsert({ 
          key: key.trim(), 
          value: value.trim(), 
          updated_at: new Date().toISOString() 
      }, { onConflict: 'key' });
      if (error) {
          console.error("[MockService] Error updating setting:", error);
          throw error;
      }
  },

  deleteSetting: async (key: string): Promise<void> => {
      if (!isRealSupabase) return;
      const { error } = await supabase.from('system_settings').delete().eq('key', key);
      if (error) {
          console.error("[MockService] Error deleting setting:", error);
          throw error;
      }
  },

  // --- BAIRROS ---
  getNeighborhoods: async (forceRefresh = false): Promise<Neighborhood[]> => {
    if (!isRealSupabase) {
        return [{
            id: 'hood-demo-1',
            name: 'Atalaia Central',
            description: 'Bairro central sob monitoramento integrado Atalaia.',
            iframeUrl: 'about:blank',
            lat: -27.5969,
            lng: -48.5495
        }];
    }
    try {
        const { data, error } = await supabase.from('neighborhoods').select('*').order('name');
        if (error) {
            console.error("[MockService] Error fetching neighborhoods:", JSON.stringify(error));
            throw error;
        }
        return (data || []).map(n => ({ 
            id: n.id, 
            name: n.name, 
            iframeUrl: n.iframe_url || n.camera_url || '', 
            description: n.description, 
            lat: n.lat, 
            lng: n.lng 
        }));
    } catch (e) { 
        console.error("[MockService] Catch in getNeighborhoods:", e instanceof Error ? e.message : JSON.stringify(e));
        return []; 
    }
  },

  getNeighborhoodById: async (id: string): Promise<Neighborhood | undefined> => {
    const safeId = sanitizeUUID(id);
    if (!safeId) return undefined;
    const { data } = await supabase.from('neighborhoods').select('*').eq('id', safeId).maybeSingle();
    return data ? { id: data.id, name: data.name, iframeUrl: data.iframe_url || data.camera_url || '', description: data.description, lat: data.lat, lng: data.lng } : undefined;
  },

  createNeighborhood: async (name: string, description: string, iframeUrl: string): Promise<void> => {
    const { error } = await supabase.from('neighborhoods').insert([{ name, description, iframe_url: iframeUrl }]);
    if (error) {
        console.error("[MockService] Error creating neighborhood:", error);
        throw error;
    }
  },

  updateNeighborhood: async (id: string, name: string, description: string, iframeUrl: string): Promise<void> => {
    const { error } = await supabase.from('neighborhoods').update({ name, description, iframe_url: iframeUrl }).eq('id', id);
    if (error) {
        console.error("[MockService] Error updating neighborhood:", error);
        throw error;
    }
  },

  deleteNeighborhood: async (id: string): Promise<void> => {
    const { error } = await supabase.from('neighborhoods').delete().eq('id', id);
    if (error) {
        console.error("[MockService] Error deleting neighborhood:", error);
        throw error;
    }
  },

  // --- CÂMERAS ---
  getAdditionalCameras: async (neighborhoodId: string): Promise<Camera[]> => {
    const safeId = sanitizeUUID(neighborhoodId);
    let dbCameras: Camera[] = [];
    try {
        if (safeId) {
            const { data, error } = await supabase.from('cameras').select('*').eq('neighborhood_id', safeId);
            if (!error && data) {
                dbCameras = data.map(c => ({ 
                    id: c.id, 
                    neighborhoodId: c.neighborhood_id, 
                    name: c.name, 
                    iframeCode: c.iframe_code, 
                    lat: c.lat, 
                    lng: c.lng,
                    locationPhotoUrl: c.location_photo_url,
                    maintenancePhotoUrl: c.maintenance_photo_url
                }));
            } else if (error) {
                console.warn("[MockService] Erro de permissão ou banco ao buscar câmeras do Supabase:", error.message);
            }
        }
    } catch (e) {
        console.warn("[MockService] Falha em getAdditionalCameras do Supabase:", e);
    }

    const localCameras = getLocalCameras().filter(c => c.neighborhoodId === neighborhoodId);
    const mergedMap = new Map<string, Camera>();

    if (dbCameras.length === 0 && localCameras.length === 0) {
        DEMO_CAMERAS.filter(c => c.neighborhoodId === neighborhoodId || c.neighborhoodId === 'hood-demo-1').forEach(c => mergedMap.set(c.id, c));
    } else {
        dbCameras.forEach(c => mergedMap.set(c.id, c));
        localCameras.forEach(c => mergedMap.set(c.id, c));
    }

    return Array.from(mergedMap.values());
  },

  getAllSystemCameras: async (): Promise<Camera[]> => {
    let dbCameras: Camera[] = [];
    try {
        const { data, error } = await supabase.from('cameras').select('*');
        if (!error && data) {
            dbCameras = data.map(c => ({ 
                id: c.id, 
                neighborhoodId: c.neighborhood_id, 
                name: c.name, 
                iframeCode: c.iframe_code, 
                lat: c.lat, 
                lng: c.lng,
                locationPhotoUrl: c.location_photo_url,
                maintenancePhotoUrl: c.maintenance_photo_url
            }));
        } else if (error) {
            console.warn("[MockService] Supabase cameras query returned error, using local fallback.", error);
        }
    } catch (e) {
        console.warn("[MockService] Error in getAllSystemCameras from Supabase, using local fallback:", e);
    }

    const localCameras = getLocalCameras();
    const mergedMap = new Map<string, Camera>();
    
    if (dbCameras.length === 0 && localCameras.length === 0) {
        DEMO_CAMERAS.forEach(c => mergedMap.set(c.id, c));
    } else {
        dbCameras.forEach(c => mergedMap.set(c.id, c));
        localCameras.forEach(c => mergedMap.set(c.id, c));
    }
    
    return Array.from(mergedMap.values());
  },

  addCamera: async (neighborhoodId: string, name: string, iframeCode: string, lat?: number, lng?: number, locationPhotoUrl?: string, maintenancePhotoUrl?: string): Promise<void> => {
    const id = generateUUID();
    
    const local = getLocalCameras();
    const newCam: Camera = {
        id,
        neighborhoodId,
        name,
        iframeCode,
        lat,
        lng,
        locationPhotoUrl,
        maintenancePhotoUrl
    };
    local.push(newCam);
    saveLocalCameras(local);

    try {
        const payload: any = {
            id,
            neighborhood_id: sanitizeUUID(neighborhoodId), 
            name, 
            iframe_code: iframeCode,
            lat,
            lng,
            location_photo_url: locationPhotoUrl
        };
        let error;
        if (maintenancePhotoUrl) {
            payload.maintenance_photo_url = maintenancePhotoUrl;
            const res = await supabase.from('cameras').insert([payload]);
            error = res.error;
            if (error && error.message && error.message.includes("maintenance_photo_url")) {
                console.warn("[MockService] Coluna maintenance_photo_url ausente, tentando sem ela...");
                delete payload.maintenance_photo_url;
                const res2 = await supabase.from('cameras').insert([payload]);
                error = res2.error;
            }
        } else {
            const res = await supabase.from('cameras').insert([payload]);
            error = res.error;
        }
        if (error) {
            console.warn("[MockService] Failed to write camera to Supabase, saved locally:", error);
        }
    } catch (e) {
        console.warn("[MockService] Error adding camera to Supabase, saved locally:", e);
    }
  },

  updateCamera: async (cameraId: string, name: string, iframeCode: string, lat?: number, lng?: number, locationPhotoUrl?: string, maintenancePhotoUrl?: string, neighborhoodId?: string): Promise<void> => {
    const local = getLocalCameras();
    const index = local.findIndex(c => c.id === cameraId);
    if (index !== -1) {
        local[index] = {
            ...local[index],
            name,
            iframeCode,
            lat,
            lng,
            locationPhotoUrl,
            maintenancePhotoUrl
        };
    } else if (neighborhoodId) {
        local.push({
            id: cameraId,
            neighborhoodId: neighborhoodId,
            name,
            iframeCode,
            lat,
            lng,
            locationPhotoUrl,
            maintenancePhotoUrl
        });
    }
    saveLocalCameras(local);

    try {
        const payload: any = { 
                name, 
                iframe_code: iframeCode,
                lat,
                lng,
                location_photo_url: locationPhotoUrl
            };
            let error;
            if (maintenancePhotoUrl) {
                payload.maintenance_photo_url = maintenancePhotoUrl;
                const res = await supabase.from('cameras').update(payload).eq('id', cameraId);
                error = res.error;
                if (error && error.message && error.message.includes("maintenance_photo_url")) {
                    console.warn("[MockService] Coluna maintenance_photo_url ausente no update, tentando sem ela...");
                    delete payload.maintenance_photo_url;
                    const res2 = await supabase.from('cameras').update(payload).eq('id', cameraId);
                    error = res2.error;
                }
            } else {
                const res = await supabase.from('cameras').update(payload).eq('id', cameraId);
                error = res.error;
            }
        if (error) {
            console.warn("[MockService] Failed to update camera on Supabase, updated locally:", error);
        }
    } catch (e) {
        console.warn("[MockService] Error updating camera on Supabase, updated locally:", e);
    }
  },

  deleteCamera: async (id: string): Promise<void> => {
    const local = getLocalCameras();
    const filtered = local.filter(c => c.id !== id);
    saveLocalCameras(filtered);

    try {
        const { error } = await supabase.from('cameras').delete().eq('id', id);
        if (error) {
            console.warn("[MockService] Failed to delete camera from Supabase, deleted locally:", error);
        }
    } catch (e) {
        console.warn("[MockService] Error deleting camera from Supabase, deleted locally:", e);
    }
  },

  // --- USUÁRIOS (Sincronização Total) ---
  getUsers: async (neighborhoodId?: string): Promise<User[]> => {
    if (!isRealSupabase) {
        const localUsers: User[] = [];
        if (typeof window !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('atalaia_local_profile_')) {
                    try {
                        const u = JSON.parse(localStorage.getItem(key) || '');
                        if (u && (!neighborhoodId || u.neighborhoodId === neighborhoodId || u.secondaryNeighborhoodId === neighborhoodId)) {
                            localUsers.push(u);
                        }
                    } catch {}
                }
            }
            if (localUsers.length === 0) {
                const demoUsers = [
                    { id: 'demo-user-id', name: 'Mariana Costa', email: 'morador@atalaia.com', role: UserRole.RESIDENT, plan: 'PREMIUM', approved: true, neighborhoodId: 'hood-demo-1', primaryNeighborhoodId: 'hood-demo-1' },
                    { id: 'demo-scr-id', name: 'Vigia Roberto', email: 'scr@atalaia.com', role: UserRole.SCR, plan: 'PREMIUM', approved: true, neighborhoodId: 'hood-demo-1', primaryNeighborhoodId: 'hood-demo-1' },
                    { id: 'demo-integrator-id', name: 'Gestor Anderson', email: 'integrador@atalaia.com', role: UserRole.INTEGRATOR, plan: 'PREMIUM', approved: true, neighborhoodId: 'hood-demo-1', primaryNeighborhoodId: 'hood-demo-1' }
                ];
                demoUsers.forEach(du => {
                    localStorage.setItem(`atalaia_local_profile_${du.id}`, JSON.stringify(du));
                    localUsers.push(du as any);
                });
            }
        }
        return localUsers;
    }

    try {
        let query = supabase.from('profiles').select('*').order('name');
        const safeId = sanitizeUUID(neighborhoodId);
        
        let data: any[] | null = null;
        let error: any = null;

        if (safeId) {
            // Tenta usar a coluna nova secondary_neighborhood_id na consulta OR
            const res = await supabase.from('profiles').select('*').or(`neighborhood_id.eq.${safeId},secondary_neighborhood_id.eq.${safeId}`).order('name');
            data = res.data;
            error = res.error;
            
            if (error) {
                console.warn("[getUsers] Falha ao filtrar por secondary_neighborhood_id no Supabase, usando fallback de neighborhood_id padrão:", error);
                // Fallback: filtra apenas pelo neighborhood_id padrão se a coluna secondary não existir
                const resFallback = await supabase.from('profiles').select('*').eq('neighborhood_id', safeId).order('name');
                data = resFallback.data;
                error = resFallback.error;
            }
        } else {
            const res = await query;
            data = res.data;
            error = res.error;
        }

        if (error || !data) return [];

        return data.map(p => {
            // Tenta carregar dados de cache local adicionais (ex: se salvou no localStorage mas não no DB real)
            let localData: any = {};
            if (typeof window !== 'undefined') {
                try {
                    const cached = localStorage.getItem(`atalaia_local_profile_${p.id}`);
                    if (cached) {
                        localData = JSON.parse(cached);
                    }
                } catch {}
            }

            return {
                id: p.id,
                name: p.name || 'Sem Nome',
                email: p.email || '',
                role: p.role as UserRole,
                plan: p.plan,
                neighborhoodId: p.neighborhood_id,
                primaryNeighborhoodId: p.primary_neighborhood_id || p.neighborhood_id || localData.primaryNeighborhoodId,
                secondaryNeighborhoodId: p.secondary_neighborhood_id || localData.secondaryNeighborhoodId,
                phone: p.phone,
                address: p.address,
                approved: p.approved === true,
                lat: p.lat,
                lng: p.lng,
                promoActive: p.promo_active === true,
                promoStart: p.promo_start,
                promoEnd: p.promo_end,
                promoCoupon: p.promo_coupon
            };
        });
    } catch (err) {
        console.error("[getUsers] Erro crítico ao buscar usuários:", err);
        return [];
    }
  },

  adminUpdateUser: async (userId: string, data: any): Promise<void> => {
      const safeId = sanitizeUUID(userId);
      
      // Sempre atualiza o cache local (essencial para persistência robusta)
      if (typeof window !== 'undefined') {
          const targetKey = `atalaia_local_profile_${userId}`;
          const currentStr = localStorage.getItem(targetKey);
          let profileObj = currentStr ? JSON.parse(currentStr) : {};
          profileObj = {
              ...profileObj,
              name: data.name !== undefined ? data.name : profileObj.name,
              phone: data.phone !== undefined ? data.phone : profileObj.phone,
              neighborhoodId: data.neighborhood_id !== undefined ? (data.neighborhood_id || undefined) : profileObj.neighborhoodId,
              primaryNeighborhoodId: data.primary_neighborhood_id !== undefined ? (data.primary_neighborhood_id || undefined) : profileObj.primaryNeighborhoodId,
              secondaryNeighborhoodId: data.secondary_neighborhood_id !== undefined ? (data.secondary_neighborhood_id || undefined) : profileObj.secondaryNeighborhoodId,
              plan: data.plan !== undefined ? data.plan : profileObj.plan,
              role: data.role !== undefined ? data.role : profileObj.role
          };
          localStorage.setItem(targetKey, JSON.stringify(profileObj));
      }

      if (!isRealSupabase || !safeId) return;

      try {
          const { error } = await supabase.from('profiles').update(data).eq('id', safeId);
          if (error) {
              console.warn("[adminUpdateUser] Falha ao atualizar Supabase, tentando sem os campos de duplo bairro:", error);
              // Fallback gracioso: remove colunas novas e atualiza apenas o padrão
              const fallbackData = { ...data };
              delete fallbackData.primary_neighborhood_id;
              delete fallbackData.secondary_neighborhood_id;
              const { error: fallbackError } = await supabase.from('profiles').update(fallbackData).eq('id', safeId);
              if (fallbackError) {
                  throw fallbackError;
              }
          }
      } catch (err) {
          console.error("[adminUpdateUser] Erro ao atualizar perfil no Supabase:", err);
          throw err;
      }
  },

  updateUserPlan: async (userId: string, plan: string): Promise<void> => {
      const safeId = sanitizeUUID(userId);
      if (!isRealSupabase || !safeId) return;
      await supabase.from('profiles').update({ plan }).eq('id', safeId);
  },

  approveUser: async (userId: string): Promise<void> => {
      const safeId = sanitizeUUID(userId);
      if (!isRealSupabase || !safeId) return;
      await supabase.from('profiles').update({ approved: true }).eq('id', safeId);
  },

  deleteUser: async (id: string): Promise<void> => {
      const safeId = sanitizeUUID(id);
      if (!isRealSupabase || !safeId) return;
      await supabase.from('profiles').delete().eq('id', safeId);
  },

  maintenanceFixOrphans: async (): Promise<number> => {
      if (!isRealSupabase) return 0;
      const { data: hoods } = await supabase.from('neighborhoods').select('id');
      const hoodIds = (hoods || []).map(h => h.id);
      const { data: users } = await supabase.from('profiles').select('id, neighborhood_id');
      let fixedCount = 0;
      if (users) {
          for (const u of users) {
              if (u.neighborhood_id && !hoodIds.includes(u.neighborhood_id)) {
                  await supabase.from('profiles').update({ neighborhood_id: null }).eq('id', u.id);
                  fixedCount++;
              }
          }
      }
      return fixedCount;
  },

  // --- ALERTAS E CHAT ---
  getAlerts: async (neighborhoodId?: string): Promise<Alert[]> => {
    if (!isRealSupabase) {
        return [{
            id: 'alert-1',
            type: 'OK' as any,
            userId: 'demo-user',
            userName: 'Morador Atalaia',
            neighborhoodId: 'hood-demo-1',
            timestamp: new Date(),
            message: 'Ronda preventiva de segurança ativa.'
        }];
    }
    try {
        const safeId = sanitizeUUID(neighborhoodId);
        let query = supabase.from('alerts').select('*').order('timestamp', { ascending: false });
        if (safeId) query = query.eq('neighborhood_id', safeId);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(a => ({ id: a.id, type: a.type as any, userId: a.user_id, userName: a.user_name, neighborhoodId: a.neighborhood_id, timestamp: new Date(a.timestamp), message: a.message, image: a.image }));
    } catch (e) {
        console.error("[MockService] Error in getAlerts:", e);
        return [];
    }
  },

  createAlert: async (alertData: any) => {
    if (!isRealSupabase) { console.log("[DEMO] Alerta criado:", alertData); return; }
    try {
        const safeHoodId = sanitizeUUID(alertData.neighborhoodId);
        const safeUserId = sanitizeUUID(alertData.userId);
        const { error: alertErr } = await supabase.from('alerts').insert([{ 
            type: alertData.type, 
            user_id: safeUserId, 
            user_name: alertData.userName, 
            neighborhood_id: safeHoodId, 
            message: alertData.message, 
            image: alertData.image 
        }]);
        if (alertErr) throw alertErr;
        
        const { error: chatErr } = await supabase.from('chat_messages').insert([{ 
            neighborhood_id: safeHoodId, 
            user_id: safeUserId, 
            user_name: alertData.userName, 
            user_role: alertData.userRole, 
            text: alertData.message || (alertData.type === 'PANIC' ? '🚨 PÂNICO ACIONADO!' : alertData.type), 
            is_system_alert: true, 
            alert_type: alertData.type, 
            image: alertData.image 
        }]);
        if (chatErr) throw chatErr;

        // --- WHATSAPP BROADCAST ---
        if (safeHoodId) {
            const settings = await MockService.getSettings();
            const hood = await MockService.getNeighborhoodById(safeHoodId);
            const hoodName = hood?.name || 'Bairro';
            
            const typeLabels: Record<string, string> = {
                'PANIC': '🚨 PÂNICO',
                'DANGER': '⚠️ PERIGO',
                'SUSPICIOUS': '👁️ SUSPEITA',
                'OK': '✅ ESTOU BEM'
            };

            const prefix = settings['template_broadcast_prefix'] || '[ATALAIA]';
            const message = `${prefix} ${typeLabels[alertData.type] || alertData.type}\n\nMorador: ${alertData.userName}\nBairro: ${hoodName}\n${alertData.message ? `Mensagem: ${alertData.message}` : ''}\n\nVerifique o app para mais detalhes.`;

            // Fetch all phone numbers in the neighborhood
            const { data: profiles, error: profileErr } = await supabase
                .from('profiles')
                .select('phone')
                .eq('neighborhood_id', safeHoodId)
                .not('phone', 'is', null);

            if (!profileErr && profiles && profiles.length > 0) {
                const numbers = profiles.map(p => p.phone).filter(Boolean) as string[];
                if (numbers.length > 0) {
                    // Dispara em background para não travar a resposta do app
                    supabase.functions.invoke('send-alert', { 
                        body: { message, numbers } 
                    }).catch(err => console.error("[WhatsApp Broadcast] Error:", err));
                }
            }
        }
    } catch (e) {
        console.error("[MockService] Error in createAlert:", e);
        throw e;
    }
  },

  getMessages: async (neighborhoodId: string): Promise<ChatMessage[]> => {
    if (!isRealSupabase) {
        return [{
            id: 'msg-1',
            neighborhoodId: 'hood-demo-1',
            userId: 'demo-admin-id',
            userName: 'Suporte Atalaia',
            userRole: UserRole.ADMIN,
            text: 'Bem-vindo ao canal integrado de segurança comunitária!',
            timestamp: new Date(),
        }];
    }
    try {
        const safeId = sanitizeUUID(neighborhoodId);
        let query = supabase.from('chat_messages').select('*').order('timestamp', { ascending: true });
        if (safeId) query = query.eq('neighborhood_id', safeId);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(m => ({ id: m.id, neighborhoodId: m.neighborhood_id, userId: m.user_id, userName: m.user_name, userRole: m.user_role as UserRole, text: m.text, timestamp: new Date(m.timestamp), isSystemAlert: m.is_system_alert, alertType: m.alert_type, image: m.image }));
    } catch (e) {
        console.error("[MockService] Error in getMessages:", e);
        return [];
    }
  },

  sendMessage: async (msgData: any) => {
    const { error } = await supabase.from('chat_messages').insert([{ neighborhood_id: sanitizeUUID(msgData.neighborhoodId), user_id: sanitizeUUID(msgData.userId), user_name: msgData.userName, user_role: msgData.userRole, text: msgData.text, image: msgData.image }]);
    if (error) {
        console.error("[MockService] Error in sendMessage:", error);
        throw error;
    }
  },

  sendChatMessageToWhatsApp: async (userName: string, text: string, phoneNumber?: string) => {
    if (!phoneNumber) return;
    try {
        const settings = await MockService.getSettings();
        const template = settings['chat_mirror_template'] || "*CHAT ATALAIA*\nDe: {user}\n{text}";
        const message = template.replace('{user}', userName).replace('{text}', text);

        supabase.functions.invoke('send-alert', { 
            body: { message, numbers: [phoneNumber] } 
        }).catch(e => console.error("[WhatsApp Chat Mirror] Failed:", e));
    } catch (e) {
        console.error("[WhatsApp Chat Mirror] Error:", e);
    }
  },

  notifyUserLogin: async (user: User) => {
    try {
        const settings = await MockService.getSettings();
        let waBody = settings['aviso_login'] || '✅ Login detectado: {{name}}';
        waBody = waBody.replace('{{name}}', user.name).replace('{{time}}', new Date().toLocaleTimeString());
        if (user.phone) { await supabase.functions.invoke('send-alert', { body: { message: waBody, numbers: [user.phone] } }); }
    } catch (e) {}
  },

  sendCustomBroadcast: async (message: string, targetType: string, neighborhoodId?: string) => {
      try {
          let query = supabase.from('profiles').select('phone').not('phone', 'is', null);
          
          if (targetType === 'HOOD' && neighborhoodId) {
              query = query.eq('neighborhood_id', neighborhoodId);
          } else if (targetType === 'ADMINS') {
              query = query.eq('role', 'ADMIN');
          } else if (targetType === 'INDIVIDUAL') {
              // No caso individual, o 'message' pode conter o número ou ser tratado de outra forma
              // Mas aqui o broadcast geralmente é para grupos de pessoas
          }
          
          const { data, error } = await query;
          if (error) throw error;
          
          const numbers = (data || []).map(u => u.phone).filter(Boolean) as string[];
          
          if (numbers.length > 0) { 
              const { data: funcData, error: funcError } = await supabase.functions.invoke('send-alert', { 
                  body: { message, numbers } 
              });
              
              if (funcError) throw funcError;
              
              const failed = funcData?.results?.find((r: any) => !r.success);
              if (failed) {
                  throw new Error(`Erro na API WhatsApp: ${failed.error || 'Falha no envio'}`);
              }
              
              return funcData;
          } else {
              throw new Error("Nenhum número de telefone encontrado para o alvo selecionado.");
          }
      } catch (e) {
          console.error("[MockService] Error in sendCustomBroadcast:", e);
          throw e;
      }
  },

  getServiceRequests: async (neighborhoodId: string): Promise<ServiceRequest[]> => {
    try {
        const safeId = sanitizeUUID(neighborhoodId);
        const { data, error } = await supabase.from('service_requests').select('*').eq('neighborhood_id', safeId).order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(r => ({ id: r.id, userId: r.user_id, userName: r.user_name, neighborhoodId: r.neighborhood_id, requestType: r.request_type as any, status: r.status as any, createdAt: new Date(r.created_at) }));
    } catch (e) {
        console.error("[MockService] Error in getServiceRequests:", e);
        return [];
    }
  },

  createServiceRequest: async (userId: string, userName: string, neighborhoodId: string, requestType: string) => {
    const { error } = await supabase.from('service_requests').insert([{ user_id: sanitizeUUID(userId), user_name: userName, neighborhood_id: sanitizeUUID(neighborhoodId), request_type: requestType, status: 'PENDING' }]);
    
    if (true) {
        if (error) console.error("[MockService] Ignorando erro no supabase para continuar o alerta:", error);
        const integrator = await MockService.getNeighborhoodIntegrator(neighborhoodId);
        if (integrator?.phone) {
            const settings = await MockService.getSettings();
            const template = settings['service_request_template'] || "*SOLICITAÇÃO*\nTipo: {type}\nMorador: {user}";
            const label = requestType === 'ESCORT' ? 'ESCOLTA' : requestType === 'EXTRA_ROUND' ? 'RONDA EXTRA' : 'AVISO DE VIAGEM';
            
            const message = template.replace('{type}', label).replace('{user}', userName);

            await supabase.functions.invoke('send-alert', {
                body: { message, numbers: [integrator.phone] }
            });
        }
    }

    if (error) {
        console.error("[MockService] Error in createServiceRequest (ignoring for fallback):", error);
    }
  },

  registerPatrol: async (userId: string, neighborhoodId: string, note: string, lat?: number, lng?: number, targetUserId?: string) => {
    // 1. Insert into patrol_logs
    const { error } = await supabase.from('patrol_logs').insert([{ 
        user_id: sanitizeUUID(userId), 
        neighborhood_id: sanitizeUUID(neighborhoodId), 
        note, 
        lat, 
        lng, 
        target_user_id: sanitizeUUID(targetUserId) || undefined 
    }]);
    
    if (error) {
        console.error("[MockService] Error in registerPatrol (ignoring for fallback):", error);
        // Do not throw, continue to send notifications
    }

    // 2. Send Whatsapp and Resident Notifications if a user was linked
    if (targetUserId) {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sanitizeUUID(targetUserId))
                .maybeSingle();

            if (profile) {
                // Determine clean time string
                const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                // Send WhatsApp if they have a phone number
                if (profile.phone) {
                    const settings = await MockService.getSettings();
                    const template = settings['patrol_notification_template'] || 
                        "*ATALAIA - INFORME DO MOTOVIGIA* 🏍️💨\n\nOlá *{name}*!\n\nInformamos que o Motovigia em ronda pelo seu setor registrou uma ocorrência em sua residência:\n\n📌 Ocorrência: *{note}*\n🏠 Local: {address}\n⏰ Horário: *{time}*\n\n_Bairro Seguro e vigiado com o Atalaia. Se precisar, conte conosco!_";

                    const customMessage = template
                        .replace(/{name}/g, profile.name || 'Morador')
                        .replace(/{note}/g, note.replace(/OCORRÊNCIA:\s*/g, '')) // clean any occurrence prefix
                        .replace(/{address}/g, profile.address || 'Seu lote cadastrado')
                        .replace(/{time}/g, timeStr);

                    try {
                        await supabase.functions.invoke('send-alert', {
                            body: { message: customMessage, numbers: [profile.phone] }
                        });
                    } catch (err) {
                        console.error("[MockService/WhatsApp] Failed to dispatch patrol WhatsApp alert:", err);
                    }
                }

                // Create an in-app notification record so they see it in the user app dashboard
                try {
                    await supabase.from('notifications').insert([{
                        user_id: sanitizeUUID(targetUserId),
                        type: 'SYSTEM',
                        title: 'Ronda do Motovigia',
                        message: `O Motovigia registrou a seguinte ocorrência: ${note.replace(/OCORRÊNCIA:\s*/g, '')}`,
                        from_user_name: 'Motovigia',
                        read: false
                    }]);
                } catch (err) {
                    console.error("[MockService/InApp] Failed to insert in-app notification:", err);
                }
            }
        } catch (e) {
            console.error("[MockService] Failed during registerPatrol notification side-effects:", e);
        }
    }
  },

  getNotifications: async (userId?: string): Promise<Notification[]> => {
    try {
        let query = supabase.from('notifications').select('*').order('timestamp', { ascending: false });
        if (userId) {
            const safeUserId = sanitizeUUID(userId);
            if (!safeUserId) {
                // If ID is not a valid UUID on real Supabase, return empty array to prevent PostgreSQL error
                return [];
            }
            query = query.eq('user_id', safeUserId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(n => ({ id: n.id, userId: n.user_id, type: n.type as any, title: n.title, message: n.message, data: n.data, fromUserName: n.from_user_name, timestamp: new Date(n.timestamp), read: n.read }));
    } catch (e) {
        console.error("[MockService] Error in getNotifications:", e);
        return [];
    }
  },

  deleteNotification: async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) {
        console.error("[MockService] Error in deleteNotification:", error);
        throw error;
    }
  },

  getNeighborhoodIntegrator: async (neighborhoodId: string): Promise<User | null> => {
      try {
          // Primeiro, verifica se há atualizações locais salvas no localStorage (ex: conta Demo Integrador ou atualizações salvas localmente)
          const keys = Object.keys(localStorage);
          for (const key of keys) {
              if (key.startsWith('atalaia_local_profile_')) {
                  try {
                      const cached = JSON.parse(localStorage.getItem(key) || '');
                      if (cached && cached.role === UserRole.INTEGRATOR && cached.neighborhoodId === neighborhoodId) {
                          return cached;
                      }
                  } catch (e) {}
              }
          }

          // Fallback específico para o demo-integrator-id na mesma sessão/local se as chaves de neighborhoodId não baterem
          const demoCached = localStorage.getItem('atalaia_local_profile_demo-integrator-id');
          if (demoCached) {
              try {
                  const parsed = JSON.parse(demoCached);
                  if (parsed && parsed.role === UserRole.INTEGRATOR) {
                      return parsed;
                  }
              } catch (e) {}
          }

          const { data, error } = await supabase.from('profiles').select('*').eq('neighborhood_id', neighborhoodId).eq('role', UserRole.INTEGRATOR).maybeSingle();
          if (error || !data) return null;

          let companyName = undefined;
          let companyLogo = undefined;
          let splitPercentage = undefined;

          if (data.address && data.address.trim().startsWith('{')) {
              try {
                  const parsed = JSON.parse(data.address);
                  companyName = parsed.companyName;
                  companyLogo = parsed.companyLogo;
                  splitPercentage = parsed.splitPercentage;
              } catch (e) {}
          }

          return { 
              id: data.id, 
              name: data.name, 
              email: data.email, 
              role: data.role as UserRole, 
              plan: data.plan, 
              neighborhoodId: data.neighborhood_id, 
              phone: data.phone, 
              mpPublicKey: data.mp_public_key, 
              mpAccessToken: data.mp_access_token,
              companyName,
              companyLogo,
              splitPercentage: splitPercentage || 10,
              address: data.address
          };
      } catch (e) {
          return null;
      }
  },

  // --- SUPORTE TÉCNICO ---
  getSupportTickets: async (): Promise<SupportTicket[]> => {
    try {
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return (data || []).map(t => ({
            id: t.id,
            userId: t.user_id,
            userName: t.user_name,
            neighborhoodId: t.neighborhood_id,
            message: t.message,
            status: t.status as any,
            createdAt: new Date(t.created_at)
        }));
    } catch (e) {
        console.error("[MockService] Error in getSupportTickets:", e);
        return [];
    }
  },

  createSupportTicket: async (userId: string, userName: string, message: string, neighborhoodId?: string) => {
    const { error } = await supabase
        .from('support_tickets')
        .insert([{ 
            user_id: sanitizeUUID(userId), 
            user_name: userName, 
            message, 
            neighborhood_id: sanitizeUUID(neighborhoodId),
            status: 'OPEN'
        }]);
    
    if (!error) {
        const settings = await MockService.getSettings();
        const adminPhone = settings['admin_whatsapp'];
        const template = settings['support_ticket_template'] || "*SUPORTE*\n{user}: {text}";
        
        if (adminPhone) {
            const finalMsg = template.replace('{user}', userName).replace('{text}', message);
            await supabase.functions.invoke('send-alert', {
                body: { message: finalMsg, numbers: [adminPhone] }
            });
        }
    }

    if (error) {
        console.error("[MockService] Error in createSupportTicket:", error);
        throw error;
    }
  },

  updateSupportTicketStatus: async (ticketId: string, status: string) => {
    const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);
    
    if (error) {
        console.error("[MockService] Error in updateSupportTicketStatus:", error);
        throw error;
    }
  },

  // --- FINANCEIRO / PAGAMENTOS ---
  getPayments: async (): Promise<any[]> => {
    if (!isRealSupabase) {
        let localPayments: any[] = [];
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('atalaia_local_payments');
            if (cached) {
                try {
                    localPayments = JSON.parse(cached);
                } catch {}
            }
            if (localPayments.length === 0) {
                localPayments = [
                    {
                        id: 'pay-demo-1',
                        user_id: 'demo-user-id',
                        amount: 49.90,
                        due_date: new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0],
                        status: 'PENDING',
                        reference_month: '08/2026',
                        profiles: { name: 'Mariana Costa', neighborhood_id: 'hood-demo-1', plan: 'PREMIUM' }
                    },
                    {
                        id: 'pay-demo-2',
                        user_id: 'demo-scr-id',
                        amount: 49.90,
                        due_date: new Date(Date.now() - 2*24*60*60*1000).toISOString().split('T')[0],
                        status: 'PAID',
                        reference_month: '07/2026',
                        profiles: { name: 'Vigia Roberto', neighborhood_id: 'hood-demo-1', plan: 'PREMIUM' }
                    }
                ];
                localStorage.setItem('atalaia_local_payments', JSON.stringify(localPayments));
            }
            
            // Enrich with current mock profiles to ensure updates in users (name, neighborhood, plan) are reflected
            const users = await MockService.getUsers();
            const userMap = new Map(users.map(u => [u.id, u]));
            localPayments = localPayments.map(p => {
                const u = userMap.get(p.user_id);
                const localReceipt = localStorage.getItem(`receipt_data_${p.id}`);
                const localReceiptName = localStorage.getItem(`receipt_name_${p.id}`);
                return {
                    ...p,
                    profiles: u ? { name: u.name, neighborhood_id: u.neighborhoodId, plan: u.plan } : p.profiles,
                    receipt_base64: p.receipt_base64 || localReceipt || null,
                    receipt_name: p.receipt_name || localReceiptName || null
                };
            });
        }
        return localPayments;
    }

    try {
        let data: any[] | null = null;
        let error: any = null;

        // Try direct relational join first
        try {
            const res = await supabase
                .from('payments')
                .select('*, profiles(name, neighborhood_id, plan)')
                .order('due_date', { ascending: false });
            data = res.data;
            error = res.error;
        } catch (joinErr) {
            console.warn("[getPayments] Falha de join na primeira tentativa:", joinErr);
            error = joinErr;
        }

        if (error) {
            console.warn("[getPayments] Falha ao fazer join direto, buscando pagamentos e perfis separadamente...", error);
            const { data: payData, error: payError } = await supabase
                .from('payments')
                .select('*')
                .order('due_date', { ascending: false });
            
            if (payError) throw payError;
            
            const { data: profData } = await supabase
                .from('profiles')
                .select('id, name, neighborhood_id, plan');
            
            const profMap = new Map((profData || []).map(p => [p.id, p]));
            
            data = (payData || []).map(p => ({
                ...p,
                profiles: profMap.get(p.user_id) || null
            }));
        }
        
        // Enriquecer pagamentos com os dados de comprovante anexados localmente ou no banco
        const enriched = (data || []).map((p: any) => {
          const localReceipt = localStorage.getItem(`receipt_data_${p.id}`);
          const localReceiptName = localStorage.getItem(`receipt_name_${p.id}`);
          return {
            ...p,
            receipt_base64: p.receipt_base64 || localReceipt || null,
            receipt_name: p.receipt_name || localReceiptName || null
          };
        });
        return enriched;
    } catch (e) {
        console.error("[MockService] Error in getPayments:", e);
        return [];
    }
  },

  createPayment: async (userId: string, amount: number, dueDate: string, referenceMonth: string) => {
    if (!isRealSupabase) {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('atalaia_local_payments');
            let localPayments: any[] = [];
            if (cached) {
                try { localPayments = JSON.parse(cached); } catch {}
            }
            const newPayment = {
                id: `pay-local-${Date.now()}`,
                user_id: userId,
                amount: Number(amount),
                due_date: dueDate,
                status: 'PENDING',
                reference_month: referenceMonth,
                created_at: new Date().toISOString()
            };
            localPayments.unshift(newPayment);
            localStorage.setItem('atalaia_local_payments', JSON.stringify(localPayments));
        }
        return;
    }

    const { error } = await supabase
        .from('payments')
        .insert([{ 
            user_id: sanitizeUUID(userId), 
            amount, 
            due_date: dueDate,
            reference_month: referenceMonth,
            status: 'PENDING'
        }]);
    
    if (error) {
        console.error("[MockService] Error in createPayment:", error);
        throw error;
    }
  },

  updatePaymentStatus: async (paymentId: string, status: 'PAID' | 'PENDING' | 'OVERDUE', paymentDate?: string) => {
    if (!isRealSupabase) {
        if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('atalaia_local_payments');
            let localPayments: any[] = [];
            if (cached) {
                try { localPayments = JSON.parse(cached); } catch {}
            }
            localPayments = localPayments.map(p => {
                if (p.id === paymentId) {
                    return {
                        ...p,
                        status,
                        payment_date: status === 'PAID' ? (paymentDate || new Date().toISOString()) : null
                    };
                }
                return p;
            });
            localStorage.setItem('atalaia_local_payments', JSON.stringify(localPayments));
        }
        return;
    }

    const updateData: any = { status };
    if (status === 'PAID') {
        updateData.payment_date = paymentDate || new Date().toISOString();
    } else {
        updateData.payment_date = null;
    }

    const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId);
    
    if (error) {
        console.error("[MockService] Error in updatePaymentStatus:", error);
        throw error;
    }
  },

  // --- COUPONS AND TRIAL PROMOTIONS SYSTEM ---
  getCoupons: async (): Promise<Coupon[]> => {
    let localCoupons: Coupon[] = [];
    const cached = localStorage.getItem('atalaia_coupons');
    if (cached) {
      try { localCoupons = JSON.parse(cached); } catch (e) {}
    }

    // Garantir que TESTE7DIAS5REAIS sempre exista na lista local contra caches velhos
    const hasDefaultLocal = localCoupons.some(c => c.code.toUpperCase() === 'TESTE7DIAS5REAIS');
    if (!hasDefaultLocal) {
      localCoupons.push({
        id: "teste-7dias-5reais-id",
        code: "TESTE7DIAS5REAIS",
        active: true,
        promotionalPrice: 5.00,
        trialDays: 7,
        maxUses: 1000,
        usedCount: 0,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('atalaia_coupons', JSON.stringify(localCoupons));
    }

    if (isRealSupabase) {
      try {
        const { data, error } = await supabase.from('coupons').select('*');
        if (!error && data) {
          const dbCoupons = data.map((c: any) => ({
            id: c.id,
            code: c.code,
            active: c.active,
            promotionalPrice: Number(c.promotional_price),
            trialDays: c.trial_days,
            maxUses: c.max_uses,
            usedCount: c.used_count,
            createdAt: c.created_at
          }));
          
          // Se o TESTE7DIAS5REAIS não estiver no banco, vamos inseri-lo ou mesclá-lo para que sempre exista
          const hasDefault = dbCoupons.some(c => c.code.toUpperCase() === 'TESTE7DIAS5REAIS');
          if (!hasDefault) {
             const defaultCoupon = {
                id: "teste-7dias-5reais-id",
                code: "TESTE7DIAS5REAIS",
                active: true,
                promotionalPrice: 5.00,
                trialDays: 7,
                maxUses: 1000,
                usedCount: 0,
                createdAt: new Date().toISOString()
             };
             try {
                // Tenta inserir no banco. Se falhar, pelo menos retorna em dbCoupons
                await supabase.from('coupons').insert({
                   code: defaultCoupon.code,
                   active: defaultCoupon.active,
                   promotional_price: defaultCoupon.promotionalPrice,
                   trial_days: defaultCoupon.trialDays,
                   max_uses: defaultCoupon.maxUses,
                   used_count: defaultCoupon.usedCount
                });
             } catch (insertErr) {
                console.warn("[MockService] Erro ao auto-inserir cupom padrão no banco:", insertErr);
             }
             dbCoupons.push(defaultCoupon);
          }
          return dbCoupons;
        }
      } catch (e) {
        console.warn("[MockService] Erro ao carregar cupons do Supabase. Usando local:", e);
      }
    }

    return localCoupons;
  },

  saveCoupon: async (coupon: Coupon): Promise<void> => {
    let localCoupons: Coupon[] = [];
    const cached = localStorage.getItem('atalaia_coupons');
    if (cached) {
      try { localCoupons = JSON.parse(cached); } catch (e) {}
    }
    const idx = localCoupons.findIndex(c => c.id === coupon.id || c.code === coupon.code);
    if (idx >= 0) {
      localCoupons[idx] = { ...localCoupons[idx], ...coupon };
    } else {
      localCoupons.push(coupon);
    }
    localStorage.setItem('atalaia_coupons', JSON.stringify(localCoupons));

    if (isRealSupabase) {
      try {
        const dbPayload: any = {
          code: coupon.code.toUpperCase().trim(),
          active: coupon.active,
          promotional_price: coupon.promotionalPrice,
          trial_days: coupon.trialDays,
          max_uses: coupon.maxUses,
          used_count: coupon.usedCount
        };
        
        // Só envia id se for um UUID válido.
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(coupon.id);
        if (isUuid) {
          dbPayload.id = coupon.id;
        }

        const { data, error } = await supabase
          .from('coupons')
          .upsert(dbPayload, { onConflict: 'code' })
          .select();

        if (error) throw error;
        
        if (data && data.length > 0) {
          const dbCoupon = data[0];
          const updatedLocalIdx = localCoupons.findIndex(c => c.code.toUpperCase() === dbCoupon.code.toUpperCase());
          if (updatedLocalIdx >= 0) {
            localCoupons[updatedLocalIdx].id = dbCoupon.id;
            localStorage.setItem('atalaia_coupons', JSON.stringify(localCoupons));
          }
        }
      } catch (e) {
        console.error("[MockService] Erro ao salvar cupom no Supabase:", e);
      }
    }
  },

  deleteCoupon: async (id: string): Promise<void> => {
    let localCoupons: Coupon[] = [];
    const cached = localStorage.getItem('atalaia_coupons');
    if (cached) {
      try { localCoupons = JSON.parse(cached); } catch (e) {}
    }
    
    const couponToDelete = localCoupons.find(c => c.id === id);
    const code = couponToDelete?.code;

    localCoupons = localCoupons.filter(c => c.id !== id);
    localStorage.setItem('atalaia_coupons', JSON.stringify(localCoupons));

    if (isRealSupabase) {
      try {
        let query = supabase.from('coupons').delete();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        if (isUuid) {
          query = query.eq('id', id);
        } else if (code) {
          query = query.eq('code', code.toUpperCase().trim());
        } else {
          query = query.eq('id', id);
        }
        const { error } = await query;
        if (error) throw error;
      } catch (e) {
        console.error("[MockService] Erro ao deletar cupom no Supabase:", e);
      }
    }
  },

  validateCoupon: async (code: string, userId: string): Promise<{ success: boolean; message: string; coupon?: Coupon }> => {
    const coupons = await MockService.getCoupons();
    const coupon = coupons.find(c => c.code.trim().toUpperCase() === code.trim().toUpperCase());

    if (!coupon) {
      return { success: false, message: "Cupom inválido ou não encontrado." };
    }

    if (!coupon.active) {
      return { success: false, message: "Este cupom promocional não está mais ativo." };
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return { success: false, message: "Limite de utilizações deste cupom esgotado." };
    }

    let alreadyUsed = false;
    const cachedProfileStr = localStorage.getItem(`atalaia_local_profile_${userId}`);
    if (cachedProfileStr) {
      try {
        const u = JSON.parse(cachedProfileStr);
        if (u.promoCoupon?.trim().toUpperCase() === code.trim().toUpperCase()) {
          alreadyUsed = true;
        }
      } catch (e) {}
    }

    if (isRealSupabase && userId) {
      try {
        const { data, error } = await supabase.from('profiles').select('promo_coupon').eq('id', userId).maybeSingle();
        if (!error && data && data.promo_coupon?.trim().toUpperCase() === code.trim().toUpperCase()) {
          alreadyUsed = true;
        }
      } catch (e) {
        console.warn("[MockService] Erro ao verificar reuso de cupom no Supabase:", e);
      }
    }

    if (alreadyUsed) {
      return { success: false, message: "Este cupom já foi utilizado nesta conta." };
    }

    return { success: true, message: "Cupom aplicado com sucesso!", coupon };
  },

  incrementCouponUses: async (code: string): Promise<void> => {
    let coupons = await MockService.getCoupons();
    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
    if (coupon) {
      coupon.usedCount += 1;
      await MockService.saveCoupon(coupon);
    }
  },

  checkAllUsersPromoExpiration: async (): Promise<number> => {
    console.log("[MockService] Iniciando varredura diária de expiração de testes de 7 dias...");
    let degradedCount = 0;
    const nowISO = new Date().toISOString();

    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('atalaia_local_profile_')) {
        try {
          const cachedUser = JSON.parse(localStorage.getItem(key) || '');
          if (cachedUser && cachedUser.promoActive && cachedUser.promoEnd && new Date(cachedUser.promoEnd) < new Date()) {
            console.log(`[MockService Local] Expirando promoção de: ${cachedUser.email}. Novo plano: FREE`);
            cachedUser.plan = 'FREE';
            cachedUser.promoActive = false;
            cachedUser.promoStart = undefined;
            cachedUser.promoEnd = undefined;
            localStorage.setItem(key, JSON.stringify(cachedUser));
            degradedCount++;
          }
        } catch (e) {}
      }
    }

    if (isRealSupabase) {
      try {
        const { data: expiredProfiles, error } = await supabase
          .from('profiles')
          .select('id, email, name')
          .eq('promo_active', true)
          .lt('promo_end', nowISO);

        if (!error && expiredProfiles && expiredProfiles.length > 0) {
          for (const profile of expiredProfiles) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                plan: 'FREE',
                promo_active: false,
                promo_start: null,
                promo_end: null
              })
              .eq('id', profile.id);

            if (!updateError) {
              console.log(`[MockService Cloud] Cupom expirado com sucesso para ${profile.email}`);
              const cachedStr = localStorage.getItem(`atalaia_local_profile_${profile.id}`);
              if (cachedStr) {
                try {
                  const parsed = JSON.parse(cachedStr);
                  parsed.plan = 'FREE';
                  parsed.promoActive = false;
                  parsed.promoStart = undefined;
                  parsed.promoEnd = undefined;
                  localStorage.setItem(`atalaia_local_profile_${profile.id}`, JSON.stringify(parsed));
                } catch (e) {}
              }
              degradedCount++;
            }
          }
        }
      } catch (e) {
        console.error("[MockService] Falha ao processar expirações automáticas no banco:", e);
      }
    }

    return degradedCount;
  },

  // --- REAL-TIME HELPER ---
  manualConfirmPromoTrialPayment: async (userId: string, receiptName?: string, receiptBase64?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const safeId = sanitizeUUID(userId);
      if (!safeId) return { success: false, message: "ID do usuário inválido para operação." };
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 7);
      const refMonth = `${(startDate.getMonth() + 1).toString().padStart(2, '0')}/${startDate.getFullYear()}`;

      // 1. Atualizar banco Supabase
      if (isRealSupabase) {
        const { error: profileErr } = await supabase.from('profiles').update({
          plan: 'FAMILY',
          promo_active: true,
          promo_start: startDate.toISOString(),
          promo_end: endDate.toISOString(),
          promo_coupon: 'TESTE7DIAS5REAIS'
        }).eq('id', safeId);
        
        if (profileErr) throw profileErr;

        // Inserir registro de pagamento para não acusar inadimplência e aparecer em relatórios
        const paymentPayload = {
          user_id: safeId,
          amount: 5.00,
          due_date: startDate.toISOString().split('T')[0],
          payment_date: startDate.toISOString(),
          status: 'PAID',
          reference_month: receiptName ? `${refMonth} (Anexo: ${receiptName})` : refMonth
        };

        try {
          const { data, error } = await supabase.from('payments').insert([{
            ...paymentPayload,
            receipt_name: receiptName || null,
            receipt_base64: receiptBase64 || null
          }]).select();

          let insertedId = "";
          if (!error && data && data[0]) {
            insertedId = data[0].id;
          } else {
            const { data: fallbackData } = await supabase.from('payments').insert([paymentPayload]).select();
            if (fallbackData && fallbackData[0]) {
              insertedId = fallbackData[0].id;
            }
          }

          if (insertedId) {
            if (receiptBase64) {
              localStorage.setItem(`receipt_data_${insertedId}`, receiptBase64);
              await supabase.from('system_settings').upsert([{ key: `receipt_data_${insertedId}`, value: receiptBase64 }]);
            }
            if (receiptName) {
              localStorage.setItem(`receipt_name_${insertedId}`, receiptName);
              await supabase.from('system_settings').upsert([{ key: `receipt_name_${insertedId}`, value: receiptName }]);
            }
            await supabase.from('system_settings').upsert([{ key: `user_receipt_id_${safeId}`, value: insertedId }]);
          }
        } catch (err) {
          const { data: fallbackData } = await supabase.from('payments').insert([paymentPayload]).select();
          if (fallbackData && fallbackData[0]) {
            const insertedId = fallbackData[0].id;
            if (receiptBase64) {
              localStorage.setItem(`receipt_data_${insertedId}`, receiptBase64);
              await supabase.from('system_settings').upsert([{ key: `receipt_data_${insertedId}`, value: receiptBase64 }]);
            }
            if (receiptName) {
              localStorage.setItem(`receipt_name_${insertedId}`, receiptName);
              await supabase.from('system_settings').upsert([{ key: `receipt_name_${insertedId}`, value: receiptName }]);
            }
            await supabase.from('system_settings').upsert([{ key: `user_receipt_id_${safeId}`, value: insertedId }]);
          }
        }
      } else {
        // Modo local mock
        const mockPaymentId = `pay_${Date.now()}`;
        if (receiptBase64) localStorage.setItem(`receipt_data_${mockPaymentId}`, receiptBase64);
        if (receiptName) localStorage.setItem(`receipt_name_${mockPaymentId}`, receiptName);

        const localPaymentsStr = localStorage.getItem('atalaia_local_payments') || '[]';
        try {
          const localPayments = JSON.parse(localPaymentsStr);
          localPayments.push({
            id: mockPaymentId,
            user_id: safeId,
            amount: 5.00,
            due_date: startDate.toISOString().split('T')[0],
            payment_date: startDate.toISOString(),
            status: 'PAID',
            reference_month: receiptName ? `${refMonth} (Anexo: ${receiptName})` : refMonth
          });
          localStorage.setItem('atalaia_local_payments', JSON.stringify(localPayments));
        } catch(e) {}
      }

      // 2. Atualizar cache local do perfil
      let parsed: any = {};
      const cachedStr = localStorage.getItem(`atalaia_local_profile_${safeId}`);
      if (cachedStr) {
        try {
          parsed = JSON.parse(cachedStr);
        } catch (e) {}
      }
      parsed.plan = 'FAMILY';
      parsed.promoActive = true;
      parsed.promoStart = startDate.toISOString();
      parsed.promoEnd = endDate.toISOString();
      parsed.promoCoupon = 'TESTE7DIAS5REAIS';
      localStorage.setItem(`atalaia_local_profile_${safeId}`, JSON.stringify(parsed));

      // Desmarcar possível flag anterior de trial expirado
      localStorage.removeItem(`atalaia_trial_expired_${userId}`);

      // 3. Incrementar o Contador do Cupom
      await MockService.incrementCouponUses('TESTE7DIAS5REAIS');

      return { success: true, message: "Parabéns! O pagamento de R$ 5,00 foi confirmado e seu Plano Família de teste está ativo!" };
    } catch (e: any) {
      console.error("[MockService] Erro ao ativar promoção manualmente:", e);
      return { success: false, message: e.message || "Erro técnico ao liberar plano." };
    }
  },

  // --- GRAVAÇÕES / PEDIDOS DE GRAVAÇÃO ---
  getRecordingRequests: async (userId?: string): Promise<RecordingRequest[]> => {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem('atalaia_recording_requests');
      let requests: RecordingRequest[] = cached ? JSON.parse(cached) : [];
      if (userId) {
        requests = requests.filter(r => r.userId === userId);
      }
      return requests;
    } catch (e) {
      console.warn("localStorage recording requests failed:", e);
      return [];
    }
  },

  createRecordingRequest: async (request: Omit<RecordingRequest, 'id' | 'createdAt' | 'status'>): Promise<RecordingRequest> => {
    if (typeof window === 'undefined') throw new Error("Window is undefined");
    const newRequest: RecordingRequest = {
      ...request,
      id: 'req-' + generateUUID(),
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    };
    try {
      const cached = localStorage.getItem('atalaia_recording_requests');
      const requests: RecordingRequest[] = cached ? JSON.parse(cached) : [];
      requests.push(newRequest);
      localStorage.setItem('atalaia_recording_requests', JSON.stringify(requests));
      return newRequest;
    } catch (e) {
      console.warn("localStorage recording request create failed:", e);
      return newRequest;
    }
  },

  updateRecordingRequestStatus: async (requestId: string, status: RecordingRequest['status'], recordingUrl?: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      const cached = localStorage.getItem('atalaia_recording_requests');
      if (cached) {
        const requests: RecordingRequest[] = JSON.parse(cached);
        const index = requests.findIndex(r => r.id === requestId);
        if (index !== -1) {
          requests[index].status = status;
          if (recordingUrl) {
            requests[index].recordingUrl = recordingUrl;
          }
          localStorage.setItem('atalaia_recording_requests', JSON.stringify(requests));
          
          // Envia notificação simulada de WhatsApp se aplicável
          if (requests[index].notifyWhatsApp && requests[index].phone) {
            console.log(`[WhatsApp API] Notificação enviada para ${requests[index].phone}: Olá ${requests[index].userName}, o status do seu pedido de gravação da câmera ${requests[index].cameraName} mudou para ${status}!`);
          }
        }
      }
    } catch (e) {
      console.warn("localStorage recording request update failed:", e);
    }
  },

  uploadBOFile: async (requestId: string, fileName: string, fileUrl: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    try {
      const cached = localStorage.getItem('atalaia_recording_requests');
      if (cached) {
        const requests: RecordingRequest[] = JSON.parse(cached);
        const index = requests.findIndex(r => r.id === requestId);
        if (index !== -1) {
          requests[index].boFileName = fileName;
          requests[index].boFileUrl = fileUrl;
          requests[index].status = 'ANALYZING'; // Entra em análise após envio do BO
          localStorage.setItem('atalaia_recording_requests', JSON.stringify(requests));
        }
      }
    } catch (e) {
      console.warn("localStorage recording request BO upload failed:", e);
    }
  },

  subscribeToTable: (table: string, callback: () => void) => {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        callback();
      })
      .subscribe();
  }
};

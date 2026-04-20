
import { supabase } from '../lib/supabaseClient';
import { Neighborhood, Alert, ChatMessage, UserRole, User, Notification, ServiceRequest, Camera } from '../types';

const sanitizeUUID = (id?: string): string | null => {
    if (!id || id === 'unknown' || id === 'undefined' || id.trim() === '') return null;
    return id;
};

export const MockService = {
  // --- SISTEMA ---
  getSettings: async (forceRefresh = false): Promise<Record<string, string>> => {
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
      const { error } = await supabase.from('system_settings').delete().eq('key', key);
      if (error) {
          console.error("[MockService] Error deleting setting:", error);
          throw error;
      }
  },

  // --- BAIRROS ---
  getNeighborhoods: async (forceRefresh = false): Promise<Neighborhood[]> => {
    try {
        const { data, error } = await supabase.from('neighborhoods').select('*').order('name');
        if (error) {
            console.error("[MockService] Error fetching neighborhoods:", error);
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
        console.error("[MockService] Catch in getNeighborhoods:", e);
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
    try {
        const safeId = sanitizeUUID(neighborhoodId);
        if (!safeId) return [];
        const { data, error } = await supabase.from('cameras').select('*').eq('neighborhood_id', safeId);
        if (error) {
            console.error("[MockService] Erro de permissão ou banco ao buscar câmeras:", error.message);
            throw error;
        }
        return (data || []).map(c => ({ id: c.id, neighborhoodId: c.neighborhood_id, name: c.name, iframeCode: c.iframe_code, lat: c.lat, lng: c.lng }));
    } catch (e) {
        console.error("[MockService] Falha crítica em getAdditionalCameras:", e);
        return [];
    }
  },

  getAllSystemCameras: async (): Promise<Camera[]> => {
    try {
        const { data, error } = await supabase.from('cameras').select('*');
        if (error) throw error;
        return (data || []).map(c => ({ id: c.id, neighborhoodId: c.neighborhood_id, name: c.name, iframeCode: c.iframe_code, lat: c.lat, lng: c.lng }));
    } catch (e) {
        console.error("[MockService] Error in getAllSystemCameras:", e);
        return [];
    }
  },

  addCamera: async (neighborhoodId: string, name: string, iframeCode: string, lat?: number, lng?: number): Promise<void> => {
    const { error } = await supabase.from('cameras').insert([{ 
        neighborhood_id: sanitizeUUID(neighborhoodId), 
        name, 
        iframe_code: iframeCode,
        lat,
        lng
    }]);
    if (error) {
        console.error("[MockService] Error adding camera:", error);
        throw error;
    }
  },

  deleteCamera: async (id: string): Promise<void> => {
    const { error } = await supabase.from('cameras').delete().eq('id', id);
    if (error) {
        console.error("[MockService] Error deleting camera:", error);
        throw error;
    }
  },

  // --- USUÁRIOS (Sincronização Total) ---
  getUsers: async (neighborhoodId?: string): Promise<User[]> => {
    let query = supabase.from('profiles').select('*').order('name');
    const safeId = sanitizeUUID(neighborhoodId);
    if (safeId) query = query.eq('neighborhood_id', safeId);
    
    const { data, error } = await query;
    if (error) return [];
    
    return (data || []).map(p => ({
        id: p.id,
        name: p.name || 'Sem Nome',
        email: p.email || '',
        role: p.role as UserRole,
        plan: p.plan,
        neighborhoodId: p.neighborhood_id,
        phone: p.phone,
        address: p.address,
        approved: p.approved,
        lat: p.lat,
        lng: p.lng
    }));
  },

  adminUpdateUser: async (userId: string, data: any): Promise<void> => {
      await supabase.from('profiles').update(data).eq('id', userId);
  },

  updateUserPlan: async (userId: string, plan: string): Promise<void> => {
      await supabase.from('profiles').update({ plan }).eq('id', userId);
  },

  approveUser: async (userId: string): Promise<void> => {
      await supabase.from('profiles').update({ approved: true }).eq('id', userId);
  },

  deleteUser: async (id: string): Promise<void> => {
      await supabase.from('profiles').delete().eq('id', id);
  },

  maintenanceFixOrphans: async (): Promise<number> => {
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
    try {
        const safeHoodId = sanitizeUUID(alertData.neighborhoodId);
        const { error: alertErr } = await supabase.from('alerts').insert([{ 
            type: alertData.type, 
            user_id: alertData.userId, 
            user_name: alertData.userName, 
            neighborhood_id: safeHoodId, 
            message: alertData.message, 
            image: alertData.image 
        }]);
        if (alertErr) throw alertErr;
        
        const { error: chatErr } = await supabase.from('chat_messages').insert([{ 
            neighborhood_id: safeHoodId, 
            user_id: alertData.userId, 
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
                    await supabase.functions.invoke('send-alert', { 
                        body: { message, numbers } 
                    });
                }
            }
        }
    } catch (e) {
        console.error("[MockService] Error in createAlert:", e);
        throw e;
    }
  },

  getMessages: async (neighborhoodId: string): Promise<ChatMessage[]> => {
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
    const { error } = await supabase.from('chat_messages').insert([{ neighborhood_id: sanitizeUUID(msgData.neighborhoodId), user_id: msgData.userId, user_name: msgData.userName, user_role: msgData.userRole, text: msgData.text, image: msgData.image }]);
    if (error) {
        console.error("[MockService] Error in sendMessage:", error);
        throw error;
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
              if (funcData?.error) throw new Error(funcData.error);
              
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
    const { error } = await supabase.from('service_requests').insert([{ user_id: userId, user_name: userName, neighborhood_id: sanitizeUUID(neighborhoodId), request_type: requestType, status: 'PENDING' }]);
    if (error) {
        console.error("[MockService] Error in createServiceRequest:", error);
        throw error;
    }
  },

  registerPatrol: async (userId: string, neighborhoodId: string, note: string, lat?: number, lng?: number, targetUserId?: string) => {
    const { error } = await supabase.from('patrol_logs').insert([{ user_id: userId, neighborhood_id: sanitizeUUID(neighborhoodId), note, lat, lng, target_user_id: targetUserId }]);
    if (error) {
        console.error("[MockService] Error in registerPatrol:", error);
        throw error;
    }
  },

  getNotifications: async (userId?: string): Promise<Notification[]> => {
    try {
        let query = supabase.from('notifications').select('*').order('timestamp', { ascending: false });
        if (userId) query = query.eq('user_id', userId);
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
          const { data, error } = await supabase.from('profiles').select('*').eq('neighborhood_id', neighborhoodId).eq('role', UserRole.INTEGRATOR).maybeSingle();
          if (error || !data) return null;
          return { id: data.id, name: data.name, email: data.email, role: data.role as UserRole, plan: data.plan, neighborhoodId: data.neighborhood_id, phone: data.phone, mpPublicKey: data.mp_public_key, mpAccessToken: data.mp_access_token };
      } catch (e) {
          return null;
      }
  },

  // --- REAL-TIME HELPER ---
  subscribeToTable: (table: string, callback: () => void) => {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        callback();
      })
      .subscribe();
  }
};

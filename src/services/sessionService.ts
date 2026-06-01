import { supabase, isRealSupabase } from '../lib/supabaseClient';
import { UserSession } from '../types';

// Helper to get OS and Browser details dynamically
export const getBrowserAndOS = () => {
  const ua = navigator.userAgent;
  let browser = "Navegador Desconhecido";
  let os = "S.O. Desconhecido";

  // OS Detection
  if (ua.indexOf("Win") !== -1) os = "Windows";
  else if (ua.indexOf("Mac") !== -1) os = "macOS";
  else if (ua.indexOf("X11") !== -1) os = "UNIX";
  else if (ua.indexOf("Linux") !== -1) os = "Linux";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";

  // Browser Detection
  if (ua.indexOf("Chrome") !== -1 && ua.indexOf("Chromium") === -1) {
    if (ua.indexOf("Edg") !== -1) browser = "Microsoft Edge";
    else browser = "Google Chrome";
  }
  else if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1) browser = "Safari";
  else if (ua.indexOf("Firefox") !== -1) browser = "Mozilla Firefox";
  else if (ua.indexOf("MSIE") !== -1 || !!(document as any).documentMode) browser = "Internet Explorer";
  else if (ua.indexOf("Opera") !== -1 || ua.indexOf("OPR") !== -1) browser = "Opera";

  return { browser, os };
};

// Helper to fetch client IP with local/priv list support
export const getIpAddress = async (): Promise<string> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.ip || '127.0.0.1';
  } catch (error) {
    // Fallback semi-random private IP for high-fidelity demos
    return '192.168.1.' + Math.floor(Math.random() * 254 + 1);
  }
};

// Key names for LocalStorage
const SESSION_TOKEN_KEY = 'atalaia_session_token';
const SIMULATED_SESSIONS_KEY = 'atalaia_simulated_sessions';

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export const SessionService = {
  /**
   * Generates a new unique session token
   */
  generateUUID: (): string => {
    return 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },

  /**
   * Registers a brand new session, automatically invalidating any old active sessions
   */
  registerSession: async (userId: string, email: string): Promise<string> => {
    const token = SessionService.generateUUID();
    const { browser, os } = getBrowserAndOS();
    const ipAddress = await getIpAddress();

    sessionStorage.setItem(SESSION_TOKEN_KEY, token);

    const isIdUuid = isUuid(userId);
    if (!isRealSupabase || !isIdUuid) {
      // Simulate database transaction under localStorage
      const simulatedSess: UserSession[] = JSON.parse(localStorage.getItem(SIMULATED_SESSIONS_KEY) || '[]');
      
      // Filter out and remove any existing sessions for this specific user (only allows newest session)
      const filtered = simulatedSess.filter(s => s.userId !== userId);
      
      const newSession: UserSession = {
        id: 'sim_sess_id_' + Math.random().toString(36).substring(2, 9),
        userId,
        token,
        ipAddress,
        browser,
        os,
        createdAt: new Date(),
        lastActive: new Date(),
      };

      filtered.push(newSession);
      localStorage.setItem(SIMULATED_SESSIONS_KEY, JSON.stringify(filtered));
      
      console.log("[SessionService - Demo] Created session for user:", email, token);
      
      // Dispatch simulated native notification
      try {
        const title = `🔒 Nova Sessão Conectada`;
        const body = `Uma nova conexão foi registrada de um dispositivo ${os} (${browser}) com IP ${ipAddress}. Todas as sessões anteriores foram desconectadas.`;
        
        // Push notification simulation in chat or notification bar
        const { MockService } = await import('./mockService');
        const settings = await MockService.getSettings();
        if (settings['template_broadcast_prefix']) {
          const numbers = [localStorage.getItem('user_last_phone') || ''];
          if (numbers[0]) {
            supabase.functions.invoke('send-alert', {
              body: { message: `*Atalaia Segurança*:\n${body}`, numbers }
            }).catch(() => {});
          }
        }
      } catch (e) {
        console.warn("Could not dispatch notification alert:", e);
      }

      return token;
    }

    try {
      // Invalidate existing sessions in Supabase database
      await supabase.from('user_sessions').delete().eq('user_id', userId);

      // Create new session record
      const { error } = await supabase.from('user_sessions').insert({
        user_id: userId,
        token: token,
        ip_address: ipAddress,
        browser: browser,
        os: os,
      });

      if (error) {
        console.error("[SessionService] Error pushing user_sessions row:", error);
        throw error;
      }

      // Notify user of new login via integrated notification center & whatsapp
      try {
        const { MockService } = await import('./mockService');
        const userProfiles = await MockService.getUsers();
        const fullUser = userProfiles.find(u => u.id === userId);
        
        if (fullUser?.phone) {
          const body = `*Segurança Atalaia*\n\nNovo acesso detectado em sua conta!\nDispositivo: ${os} (${browser})\nIP: ${ipAddress}\nData/Hora: ${new Date().toLocaleString('pt-BR')}\n\nSe não foi você, faça login imediatamente para invalidar conexões e contate o suporte.`;
          supabase.functions.invoke('send-alert', {
            body: { message: body, numbers: [fullUser.phone] }
          }).catch(() => {});
        }
      } catch (e) {
        console.warn("Could not send automated security warning message:", e);
      }

      return token;
    } catch (error) {
      console.error("[SessionService] Critical error registering DB session:", error);
      return token; // fallback token to avoid blocking login flow
    }
  },

  /**
   * Retrieves all sessions for a specific user
   */
  getSessions: async (userId: string): Promise<UserSession[]> => {
    const currentToken = sessionStorage.getItem(SESSION_TOKEN_KEY) || '';

    const isIdUuid = isUuid(userId);
    if (!isRealSupabase || !isIdUuid) {
      const simulatedSess: UserSession[] = JSON.parse(localStorage.getItem(SIMULATED_SESSIONS_KEY) || '[]');
      return simulatedSess
        .filter(s => s.userId === userId)
        .map(s => ({
          ...s,
          createdAt: new Date(s.createdAt),
          lastActive: new Date(s.lastActive),
          isCurrent: s.token === currentToken,
        }));
    }

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(s => ({
        id: s.id,
        userId: s.user_id,
        token: s.token,
        ipAddress: s.ip_address || 'Indisponível',
        browser: s.browser || 'Navegador Desconhecido',
        os: s.os || 'S.O. Desconhecido',
        createdAt: new Date(s.created_at),
        lastActive: new Date(s.last_active),
        isCurrent: s.token === currentToken,
      }));
    } catch (e) {
      console.error("[SessionService] Error fetching user_sessions:", e);
      return [];
    }
  },

  /**
   * Terminates a specific connected remote session
   */
  terminateSession: async (sessionId: string): Promise<void> => {
    if (!isRealSupabase) {
      const simulatedSess: UserSession[] = JSON.parse(localStorage.getItem(SIMULATED_SESSIONS_KEY) || '[]');
      const filtered = simulatedSess.filter(s => s.id !== sessionId);
      localStorage.setItem(SIMULATED_SESSIONS_KEY, JSON.stringify(filtered));
      return;
    }

    const { error } = await supabase.from('user_sessions').delete().eq('id', sessionId);
    if (error) {
      console.error("[SessionService] Error deleting session in DB:", error);
      throw error;
    }
  },

  /**
   * Terminates all other sessions except the current active session
   */
  terminateAllOtherSessions: async (userId: string): Promise<void> => {
    const currentToken = sessionStorage.getItem(SESSION_TOKEN_KEY) || '';

    const isIdUuid = isUuid(userId);
    if (!isRealSupabase || !isIdUuid) {
      const simulatedSess: UserSession[] = JSON.parse(localStorage.getItem(SIMULATED_SESSIONS_KEY) || '[]');
      const filtered = simulatedSess.filter(s => s.userId !== userId || s.token === currentToken);
      localStorage.setItem(SIMULATED_SESSIONS_KEY, JSON.stringify(filtered));
      return;
    }

    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)
      .not('token', 'eq', currentToken);

    if (error) {
      console.error("[SessionService] Error terminating other sessions in DB:", error);
      throw error;
    }
  },

  /**
   * Verifies if the local token is still listed as valid in the database
   */
  checkSessionValidity: async (userId: string): Promise<boolean> => {
    const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) return false;

    const isIdUuid = isUuid(userId);
    if (!isRealSupabase || !isIdUuid) {
      const simulatedSess: UserSession[] = JSON.parse(localStorage.getItem(SIMULATED_SESSIONS_KEY) || '[]');
      const foundSession = simulatedSess.find(s => s.token === token && s.userId === userId);
      return !!foundSession;
    }

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('token', token)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn("[SessionService] Error checking validation inside DB, acting safely:", error);
        return true; // Return true on transient db failures to avoid false logout kicker
      }

      return !!data;
    } catch {
      return true;
    }
  },

  /**
   * Cleans the active session locally and logs out
   */
  clearLocalStorageSession: () => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  },

  /**
   * Checks if an email has any active sessions anywhere on the platform
   */
  checkSessionsByEmail: async (email: string): Promise<UserSession[]> => {
    const cleanEmail = email.trim().toLowerCase();
    const demoUsers: Record<string, string> = {
      'admin@atalaia.com': 'demo-admin-id',
      'morador@atalaia.com': 'demo-user-id',
      'integrador@atalaia.com': 'demo-integrator-id',
      'scr@atalaia.com': 'demo-scr-id'
    };
    const isDemoEmail = !!demoUsers[cleanEmail];
    
    if (!isRealSupabase || isDemoEmail) {
      // Simulate by matching demo credentials
      const userId = demoUsers[cleanEmail];
      if (!userId) return [];
      
      const simulatedSess: UserSession[] = JSON.parse(localStorage.getItem(SIMULATED_SESSIONS_KEY) || '[]');
      return simulatedSess
        .filter(s => s.userId === userId)
        .map(s => ({
          ...s,
          createdAt: new Date(s.createdAt),
          lastActive: new Date(s.lastActive),
        }));
    }

    try {
      // Find the profile belonging to that email
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (pError || !profile) return [];

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', profile.id);

      if (error) return [];

      return (data || []).map(s => ({
        id: s.id,
        userId: s.user_id,
        token: s.token,
        ipAddress: s.ip_address || 'Indisponível',
        browser: s.browser || 'Navegador Desconhecido',
        os: s.os || 'S.O. Desconhecido',
        createdAt: new Date(s.created_at),
        lastActive: new Date(s.last_active),
      }));
    } catch {
      return [];
    }
  }
};

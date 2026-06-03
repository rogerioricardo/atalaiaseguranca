
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserPlan } from '@/types';
import { supabase, isRealSupabase } from '@/lib/supabaseClient';
import { MockService } from '@/services/mockService';
import { SessionService } from '@/services/sessionService';

// Contas iniciais de acesso seguro para modo local/offline
const DEMO_USERS: Record<string, any> = {
    'admin@atalaia.com': {
        id: 'demo-admin-id',
        email: 'admin@atalaia.com',
        name: 'Carlos Silva',
        role: UserRole.ADMIN,
        plan: 'PREMIUM',
        approved: true
    },
    'morador@atalaia.com': {
        id: 'demo-user-id',
        email: 'morador@atalaia.com',
        name: 'Mariana Costa',
        role: UserRole.RESIDENT,
        plan: 'FREE',
        approved: true,
        neighborhood_id: 'any-hood-id'
    }
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: UserRole, name?: string, neighborhoodId?: string, phone?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
  sessionTerminatedReason: string | null;
  clearSessionTerminatedReason: () => void;
  loginWithBiometrics: (profile: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTerminatedReason, setSessionTerminatedReason] = useState<string | null>(null);

  console.log("[AuthProvider] Renderizing AuthProvider with loading =", loading);

  const logoutNoCheck = async () => {
    SessionService.clearLocalStorageSession();
    try {
      if (isRealSupabase) {
        await supabase.auth.signOut();
      }
    } catch {}
    setUser(null);
    setLoading(false);
  };

  const clearSessionTerminatedReason = () => {
    setSessionTerminatedReason(null);
  };

  const mapProfile = (profile: any): User => ({
      id: profile.id,
      name: profile.name || profile.email?.split('@')[0] || 'Usuário',
      email: profile.email,
      role: (profile.role as UserRole) || UserRole.RESIDENT,
      plan: (profile.plan as UserPlan) || 'FREE',
      neighborhoodId: profile.neighborhood_id,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      phone: profile.phone,
      photoUrl: profile.photo_url,
      lat: profile.lat,
      lng: profile.lng,
      approved: profile.approved === true, 
      mpPublicKey: profile.mp_public_key,
      mpAccessToken: profile.mp_access_token
  });

  const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const fetchProfile = async (userId: string, email: string, metadata?: any, triggerNotify = false) => {
      console.log("[Auth] Buscando perfil para:", userId);
      
      const isIdUuid = isUuid(userId);
      if (!isRealSupabase || !isIdUuid) {
          console.log("[Auth] Bypass de busca no banco para ID não-UUID ou Supabase inativo. ID:", userId);
          setUser({
              id: userId,
              email: email,
              name: metadata?.name || email.split('@')[0],
              role: (metadata?.role as UserRole) || UserRole.RESIDENT,
              plan: (metadata?.plan as UserPlan) || 'FREE',
              neighborhoodId: metadata?.neighborhood_id,
              phone: metadata?.phone,
              approved: true
          });
          setLoading(false);
          return;
      }

      // Criamos uma promessa com timeout para a busca do perfil
      const fetchPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();


      const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao buscar perfil')), 8000)
      );

      try {
          const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
          
          if (error) throw error;

          if (data) {
              const mappedUser = mapProfile(data);
              setUser(mappedUser);
              console.log("[Auth] Perfil carregado com sucesso. Role:", mappedUser.role);
              
              if (triggerNotify) {
                  MockService.notifyUserLogin(mappedUser).catch(() => {});
              }
          } else {
              console.warn("[Auth] Perfil não encontrado no banco para o ID:", userId, ". Usando metadados do Auth.");
              setUser({
                  id: userId,
                  email: email,
                  name: metadata?.name || email.split('@')[0],
                  role: (metadata?.role as UserRole) || UserRole.RESIDENT,
                  plan: (metadata?.plan as UserPlan) || 'FREE',
                  neighborhoodId: metadata?.neighborhood_id,
                  phone: metadata?.phone,
                  approved: true
              });
          }
      } catch (e) {
          console.warn("[Auth] Erro ou Timeout ao buscar perfil:", e);
          // Fallback para não travar o usuário se o banco falhar mas o Auth do Supabase funcionou
          if (userId) {
              setUser({
                  id: userId,
                  email: email,
                  name: metadata?.name || email.split('@')[0],
                  role: (metadata?.role as UserRole) || UserRole.RESIDENT,
                  plan: (metadata?.plan as UserPlan) || 'FREE',
                  neighborhoodId: metadata?.neighborhood_id,
                  phone: metadata?.phone,
                  approved: true
              });
          }
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const token = sessionStorage.getItem('atalaia_session_token');
        if (!token) {
          await SessionService.registerSession(session.user.id, session.user.email!);
        }
        fetchProfile(session.user.id, session.user.email!, session.user.user_metadata);
      } else {
        setLoading(false);
      }
    });

    // Timeout de segurança para não travar a UI se o Supabase demorar
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      clearTimeout(safetyTimeout);
      if (session?.user) {
         const token = sessionStorage.getItem('atalaia_session_token');
         if (!token) {
           await SessionService.registerSession(session.user.id, session.user.email!);
         }
         await fetchProfile(session.user.id, session.user.email!, session.user.user_metadata, event === 'SIGNED_IN');
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Synchronize the currently active user ID to localStorage for cross-tab session guarding
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem('atalaia_active_user_id', user.id);
    } else {
      localStorage.removeItem('atalaia_active_user_id');
    }
  }, [user?.id]);

  // Instantly detect if another user account logs in inside another tab of the same browser
  useEffect(() => {
    if (!user?.id) return;

    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === 'atalaia_active_user_id') {
        const newValue = e.newValue;
        if (newValue && newValue !== user.id) {
          console.warn("[Auth] Outro usuário fez login neste navegador!");
          setSessionTerminatedReason("Sua sessão foi encerrada de maneira automática porque outro usuário acessou esta conta neste navegador.");
          await logoutNoCheck();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user?.id]);

  // Periodic session validation check (Heartbeat/Activity middle-man check to log out other simultaneous logged in accounts)
  useEffect(() => {
    if (!user?.id) return;

    const intervalId = setInterval(async () => {
      // Check cross-tab session collision on the same browser first
      if (typeof window !== 'undefined') {
        const activeUserId = localStorage.getItem('atalaia_active_user_id');
        if (activeUserId && activeUserId !== user.id) {
          console.warn("[Auth] Outro login detectado localmente!");
          setSessionTerminatedReason("Sua sessão foi encerrada de maneira automática porque outro usuário acessou esta conta neste navegador.");
          await logoutNoCheck();
          return;
        }
      }

      const isValid = await SessionService.checkSessionValidity(user.id);
      if (!isValid) {
        console.warn("[Auth] Sessão invalidada por outro dispositivo!");
        setSessionTerminatedReason("Sua sessão foi encerrada de maneira automática porque outro dispositivo acessou esta conta.");
        await logoutNoCheck();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [user?.id]);

  // Real-time listen channel for instant logout alert
  useEffect(() => {
    if (!user?.id || !isRealSupabase) return;

    const sessionSubscription = supabase
      .channel(`session-updates-${user.id}`)
      .on('postgres_changes', { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'user_sessions',
      }, async (payload) => {
          const currentToken = sessionStorage.getItem('atalaia_session_token');
          // If deleted token is undefined or matches our current token
          if (!payload.old || payload.old.token === currentToken || !payload.old.token) {
              const isValid = await SessionService.checkSessionValidity(user.id);
              if (!isValid) {
                  setSessionTerminatedReason("Sua sessão foi encerrada pois um novo dispositivo fez login utilizando sua conta.");
                  await logoutNoCheck();
              }
          }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionSubscription);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const profileSubscription = supabase
      .channel(`profile-updates-${user.id}`)
      .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles', 
          filter: `id=eq.${user.id}` 
      }, (payload) => {
          console.log("[Auth] Perfil atualizado em tempo real:", payload.new);
          setUser(mapProfile(payload.new));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [user?.id]);

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isDemoEmail = ['admin@atalaia.com', 'morador@atalaia.com', 'integrador@atalaia.com', 'scr@atalaia.com'].includes(cleanEmail);

    // Bypass de contingência se Supabase não estiver configurado ou se for uma conta demo conhecida de teste
    if (!isRealSupabase || isDemoEmail) {
        console.log("[Auth] Modo Secundário: Iniciando login local para", email);
        const demoUser = DEMO_USERS[cleanEmail] || {
            id: `demo-${cleanEmail.split('@')[0]}-id`,
            email: cleanEmail,
            name: cleanEmail.split('@')[0].toUpperCase(),
            role: cleanEmail.includes('admin') ? UserRole.ADMIN : (cleanEmail.includes('integrador') ? UserRole.INTEGRATOR : UserRole.RESIDENT),
            plan: 'PREMIUM',
            approved: true
        };

        if (password === 'admin123') {
            if (demoUser.phone) {
               localStorage.setItem('user_last_phone', demoUser.phone);
            }
            setUser(demoUser);
            await SessionService.registerSession(demoUser.id, demoUser.email);
            return;
        } else if (isDemoEmail) {
            throw new Error("Senha incorreta para o perfil de acesso local. (Dica: admin123)");
        }
        throw new Error("Conexão indisponível. Entre com 'admin@atalaia.com' e senha 'admin123' para acessar a conta local.");
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
            await SessionService.registerSession(data.user.id, data.user.email!);
        }
    } catch (e: any) {
        if (e.message?.includes('Failed to fetch')) {
             console.warn("[Auth] Conexão falhou, ativando bypass emergencial para admin.");
             if (email === 'admin@atalaia.com' && password === 'admin123') {
                 const demoUser = DEMO_USERS['admin@atalaia.com'];
                 setUser(demoUser);
                 await SessionService.registerSession(demoUser.id, demoUser.email);
                 return;
             }
        }
        throw e;
    }
  };

  const logout = async () => {
    try {
      if (user?.id) {
        const currentToken = sessionStorage.getItem('atalaia_session_token');
        if (currentToken) {
          if (!isRealSupabase) {
            const simulatedSess = JSON.parse(localStorage.getItem('atalaia_simulated_sessions') || '[]');
            const filtered = simulatedSess.filter((s: any) => s.token !== currentToken);
            localStorage.setItem('atalaia_simulated_sessions', JSON.stringify(filtered));
          } else {
            await supabase.from('user_sessions').delete().eq('token', currentToken);
          }
        }
      }
    } catch (e) {
      console.error("[Auth] Error dropping login session during logout:", e);
    } finally {
      SessionService.clearLocalStorageSession();
      try {
        await supabase.auth.signOut();
      } catch {}
      setUser(null);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    if (error) throw error;
    setUser(prev => prev ? ({ ...prev, ...data }) : null);
  };

  const refreshUser = async () => {
      if (user) {
          const { data: { session } } = await supabase.auth.getSession();
          await fetchProfile(user.id, user.email, session?.user?.user_metadata);
      }
  };

  const loginWithBiometrics = async (profile: User) => {
    console.log("[Auth] Efetuando login via Biometria Facial para:", profile.email);
    setUser(profile);
    await SessionService.registerSession(profile.id, profile.email);
    if (profile.phone) {
       localStorage.setItem('user_last_phone', profile.phone);
    }
  };

  const contextValue: AuthContextType = { 
        user, 
        login: async (email, password, role, name, neighborhoodId, phone) => {
             if (name) {
                if (!isRealSupabase) {
                    console.log("[Auth] Demo Mode: Simulando registro para", name);
                    const newUser = {
                        id: `demo-${Date.now()}`,
                        email,
                        name,
                        role: role || UserRole.RESIDENT,
                        plan: 'FREE' as UserPlan,
                        approved: true,
                        neighborhoodId,
                        phone
                    };
                    setUser(newUser);
                    return;
                }
                const isApproved = role === UserRole.ADMIN || role === UserRole.RESIDENT;
                const { data, error } = await supabase.auth.signUp({
                    email, password, options: { data: { role, name, neighborhood_id: neighborhoodId, phone, approved: isApproved } }
                });
                if (error) throw error;
                if (data.user) {
                    await supabase.from('profiles').upsert({ id: data.user.id, email, name, phone, neighborhood_id: neighborhoodId, role, approved: isApproved });
                    if (!isApproved) { await supabase.auth.signOut(); throw new Error("Aguarde aprovação."); }
                }
                return;
             }
             return login(email, password);
         }, 
        logout, 
        updateProfile, 
        isAuthenticated: !!user,
        loading,
        refreshUser,
        sessionTerminatedReason,
        clearSessionTerminatedReason,
        loginWithBiometrics
  };

  // Safe global fallback assignment to protect against multiple react bundles
  if (typeof window !== 'undefined') {
     (window as any).__atalaia_auth_context = contextValue;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  console.log("[useAuth] Context resolved:", context ? "success (has value)" : "failed (undefined!)");
  if (!context) {
    if (typeof window !== 'undefined' && (window as any).__atalaia_auth_context) {
       console.log("[useAuth] Context recovered from global __atalaia_auth_context fallback.");
       return (window as any).__atalaia_auth_context;
    }
    throw new Error('useAuth error');
  }
  return context;
};


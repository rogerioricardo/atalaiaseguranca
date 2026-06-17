
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
        plan: 'PREMIUM',
        approved: true,
        neighborhood_id: 'any-hood-id'
    },
    'scr@atalaia.com': {
        id: 'demo-scr-id',
        email: 'scr@atalaia.com',
        name: 'Vigia Roberto',
        role: UserRole.SCR,
        plan: 'PREMIUM',
        approved: true,
        neighborhood_id: 'any-hood-id'
    },
    'integrador@atalaia.com': {
        id: 'demo-integrator-id',
        email: 'integrador@atalaia.com',
        name: 'Gestor Anderson',
        role: UserRole.INTEGRATOR,
        plan: 'PREMIUM',
        approved: true,
        neighborhood_id: 'any-hood-id'
    }
};

const deriveRoleFromEmail = (emailStr: string, defaultRole = UserRole.RESIDENT): UserRole => {
    const e = (emailStr || '').toLowerCase();
    if (e.includes('admin')) return UserRole.ADMIN;
    if (e.includes('integrador')) return UserRole.INTEGRATOR;
    if (e.includes('scr') || e.includes('vigia') || e.includes('patrulha') || e.includes('moto')) return UserRole.SCR;
    return defaultRole;
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: UserRole, name?: string, neighborhoodId?: string, phone?: string, plan?: UserPlan) => Promise<void>;
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

  const mapProfile = (profile: any): User => {
      const mappedRole = (profile.role as UserRole) || UserRole.RESIDENT;
      
      let companyName = undefined;
      let companyLogo = undefined;
      let splitPercentage = undefined;
      let cnpj = undefined;
      let razaoSocial = undefined;
      let banco = undefined;
      let pix = undefined;
      let cpf = undefined;
      
      if (profile.address && profile.address.trim().startsWith('{')) {
          try {
              const parsed = JSON.parse(profile.address);
              companyName = parsed.companyName;
              companyLogo = parsed.companyLogo;
              splitPercentage = parsed.splitPercentage;
              cnpj = parsed.cnpj;
              razaoSocial = parsed.razaoSocial;
              banco = parsed.banco;
              pix = parsed.pix;
              cpf = parsed.cpf;
          } catch (e) {}
      }

      return {
          id: profile.id,
          name: profile.name || profile.email?.split('@')[0] || 'Usuário',
          email: profile.email,
          role: mappedRole,
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
          mpAccessToken: profile.mp_access_token,
          companyName,
          companyLogo,
          splitPercentage: splitPercentage || 10,
          cnpj,
          razaoSocial,
          banco,
          pix,
          cpf,
          promoActive: profile.promo_active === true,
          promoStart: profile.promo_start,
          promoEnd: profile.promo_end,
          promoCoupon: profile.promo_coupon
      };
  };

  const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const fetchProfile = async (userId: string, email: string, metadata?: any, triggerNotify = false) => {
      console.log("[Auth] Buscando perfil para:", userId);
      
      const isIdUuid = isUuid(userId);
      const cachedRole = userId ? localStorage.getItem(`atalaia_cached_role_${userId}`) : null;

      // Carrega atualizações locais do perfil do localStorage se existirem
      let localCachedUser: any = {};
      const cachedStr = localStorage.getItem(`atalaia_local_profile_${userId}`);
      if (cachedStr) {
          try { localCachedUser = JSON.parse(cachedStr); } catch (e) {}
      }

      if (!isRealSupabase || !isIdUuid) {
          console.log("[Auth] Bypass de busca no banco para ID não-UUID ou Supabase inativo. ID:", userId);
          const resolvedRole = (cachedRole as UserRole) || (metadata?.role as UserRole) || deriveRoleFromEmail(email, UserRole.RESIDENT);
          
          const finalUser = {
              id: userId,
              email: email,
              name: metadata?.name || email.split('@')[0],
              role: resolvedRole,
              plan: ((metadata?.plan as UserPlan) || 'FREE'),
              neighborhoodId: metadata?.neighborhood_id,
              phone: metadata?.phone,
              approved: true,
              ...localCachedUser
          };

          // Garante mapeamento correto das colunas serializadas no address também
          let companyName = finalUser.companyName;
          let companyLogo = finalUser.companyLogo;
          let splitPercentage = finalUser.splitPercentage;
          let cnpj = finalUser.cnpj;
          let razaoSocial = finalUser.razaoSocial;
          let banco = finalUser.banco;
          let pix = finalUser.pix;
          let cpf = finalUser.cpf;

          if (finalUser.address && finalUser.address.trim().startsWith('{')) {
              try {
                  const parsed = JSON.parse(finalUser.address);
                  if (parsed.companyName !== undefined) companyName = parsed.companyName;
                  if (parsed.companyLogo !== undefined) companyLogo = parsed.companyLogo;
                  if (parsed.splitPercentage !== undefined) splitPercentage = parsed.splitPercentage;
                  if (parsed.cnpj !== undefined) cnpj = parsed.cnpj;
                  if (parsed.razaoSocial !== undefined) razaoSocial = parsed.razaoSocial;
                  if (parsed.banco !== undefined) banco = parsed.banco;
                  if (parsed.pix !== undefined) pix = parsed.pix;
                  if (parsed.cpf !== undefined) cpf = parsed.cpf;
              } catch (e) {}
          }

          setUser({
              ...finalUser,
              companyName,
              companyLogo,
              splitPercentage: splitPercentage || 10,
              cnpj,
              razaoSocial,
              banco,
              pix,
              cpf
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
          setTimeout(() => reject(new Error('Timeout ao buscar perfil')), 12000)
      );

      try {
          const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
          
          if (error) throw error;

          if (data) {
              const mappedUser = mapProfile(data);
              
              // Verificação de Expiração do Teste Promocional (7 dias)
              if (mappedUser.promoActive && mappedUser.promoEnd && new Date(mappedUser.promoEnd) < new Date()) {
                  console.log("[Auth] Cupom promocional de teste de 7 dias expirado! Rebaixando automaticamente para Plano Gratuito...");
                  mappedUser.plan = 'FREE';
                  mappedUser.promoActive = false;
                  mappedUser.promoStart = undefined;
                  mappedUser.promoEnd = undefined;
                  mappedUser.promoCoupon = undefined;
                  
                  if (isRealSupabase && isIdUuid) {
                      const expireProfile = async () => {
                          try {
                              await supabase.from('profiles').update({
                                  plan: 'FREE',
                                  promo_active: false,
                                  promo_start: null,
                                  promo_end: null,
                                  promo_coupon: null
                              }).eq('id', userId);
                          } catch (err) {
                              console.error("[Promo Expire] Erro ao rebaixar perfil no Supabase:", err);
                          }
                      };
                      expireProfile();
                  }
                  
                  const cachedStr = localStorage.getItem(`atalaia_local_profile_${userId}`);
                  if (cachedStr) {
                      try {
                          const parsed = JSON.parse(cachedStr);
                          parsed.plan = 'FREE';
                          parsed.promoActive = false;
                          parsed.promoStart = undefined;
                          parsed.promoEnd = undefined;
                          parsed.promoCoupon = undefined;
                          localStorage.setItem(`atalaia_local_profile_${userId}`, JSON.stringify(parsed));
                      } catch (e) {}
                  }
              }

              if (mappedUser.id && mappedUser.role) {
                  localStorage.setItem(`atalaia_cached_role_${mappedUser.id}`, mappedUser.role);
              }
              
              setUser({
                  ...mappedUser,
                  ...localCachedUser
              });
              console.log("[Auth] Perfil carregado com sucesso. Role:", mappedUser.role);
              
              if (triggerNotify) {
                  MockService.notifyUserLogin(mappedUser).catch(() => {});
               }
           } else {
              console.warn("[Auth] Perfil não encontrado no banco para o ID:", userId, ". Usando metadados do Auth.");
              const resolvedRole = (cachedRole as UserRole) || (metadata?.role as UserRole) || deriveRoleFromEmail(email, UserRole.RESIDENT);
              setUser({
                  id: userId,
                  email: email,
                  name: metadata?.name || email.split('@')[0],
                  role: resolvedRole,
                  plan: ((metadata?.plan as UserPlan) || 'FREE'),
                  neighborhoodId: metadata?.neighborhood_id,
                  phone: metadata?.phone,
                  approved: true,
                  ...localCachedUser
              });
          }
      } catch (e) {
          console.warn("[Auth] Erro ou Timeout ao buscar perfil:", e);
          // Fallback para não travar o usuário se o banco falhar mas o Auth do Supabase funcionou
          if (userId) {
              const resolvedRole = (cachedRole as UserRole) || (metadata?.role as UserRole) || deriveRoleFromEmail(email, UserRole.RESIDENT);
              setUser({
                  id: userId,
                  email: email,
                  name: metadata?.name || email.split('@')[0],
                  role: resolvedRole,
                  plan: ((metadata?.plan as UserPlan) || 'FREE'),
                  neighborhoodId: metadata?.neighborhood_id,
                  phone: metadata?.phone,
                  approved: true,
                  ...localCachedUser
              });
          }
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          const token = sessionStorage.getItem('atalaia_session_token');
          if (!token) {
            SessionService.registerSession(session.user.id, session.user.email!).catch(err => {
              console.error("[Auth Init] Erro assíncrono ao registrar sessão:", err);
            });
          }
          await fetchProfile(session.user.id, session.user.email!, session.user.user_metadata);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("[Auth Init] Erro ao recuperar sessão inicial:", err);
        setLoading(false);
      }
    }).catch(err => {
      console.error("[Auth Init] Erro crítico no getSession:", err);
      setLoading(false);
    });

    // Timeout de segurança para não travar a UI se o Supabase demorar
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
           const token = sessionStorage.getItem('atalaia_session_token');
           if (!token) {
             SessionService.registerSession(session.user.id, session.user.email!).catch(err => {
               console.error("[Auth State Change] Erro assíncrono ao registrar sessão:", err);
             });
           }
           await fetchProfile(session.user.id, session.user.email!, session.user.user_metadata, event === 'SIGNED_IN');
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("[Auth State Change] Erro crítico:", err);
        setLoading(false);
      } finally {
        clearTimeout(safetyTimeout);
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
            role: deriveRoleFromEmail(cleanEmail, UserRole.RESIDENT),
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
            SessionService.registerSession(data.user.id, data.user.email!).catch(err => {
                console.error("[Auth Login] Erro assíncrono ao registrar sessão:", err);
            });
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
    
    const dbPayload: any = {};
    if ('email' in data) dbPayload.email = data.email;
    if ('name' in data) dbPayload.name = data.name;
    if ('role' in data) dbPayload.role = data.role;
    if ('plan' in data) dbPayload.plan = data.plan;
    if ('neighborhoodId' in data) dbPayload.neighborhood_id = data.neighborhoodId;
    if ('address' in data) dbPayload.address = data.address;
    if ('city' in data) dbPayload.city = data.city;
    if ('state' in data) dbPayload.state = data.state;
    if ('phone' in data) dbPayload.phone = data.phone;
    if ('photoUrl' in data) dbPayload.photo_url = data.photoUrl;
    if ('lat' in data) dbPayload.lat = data.lat;
    if ('lng' in data) dbPayload.lng = data.lng;
    if ('approved' in data) dbPayload.approved = data.approved;
    if ('mpPublicKey' in data) dbPayload.mp_public_key = data.mpPublicKey;
    if ('mpAccessToken' in data) dbPayload.mp_access_token = data.mpAccessToken;
    if ('promoActive' in data) dbPayload.promo_active = data.promoActive;
    if ('promoStart' in data) dbPayload.promo_start = data.promoStart;
    if ('promoEnd' in data) dbPayload.promo_end = data.promoEnd;
    if ('promoCoupon' in data) dbPayload.promo_coupon = data.promoCoupon;

    const isIdUuid = isUuid(user.id);

    if (isRealSupabase && isIdUuid) {
        const { error } = await supabase.from('profiles').update(dbPayload).eq('id', user.id);
        if (error) throw error;
    } else {
        console.log("[Auth - Local Mode] Simulating profile update successfully:", dbPayload);
    }
    if (data.role) {
       localStorage.setItem(`atalaia_cached_role_${user.id}`, data.role);
    }

    const updatedUser = { ...user, ...data };
    
    // Persist in localStorage so changes (including clearing brandName or brandLogo) are retained on refresh
    try {
        localStorage.setItem(`atalaia_local_profile_${user.id}`, JSON.stringify(updatedUser));
    } catch (e) {
        console.error("[Auth] Error caching profile updates:", e);
    }

    setUser(updatedUser);
  };

  const refreshUser = async () => {
      if (user) {
          const { data: { session } } = await supabase.auth.getSession();
          await fetchProfile(user.id, user.email, session?.user?.user_metadata);
      }
  };

  const loginWithBiometrics = async (profile: User) => {
    console.log("[Auth] Efetuando login via Biometria Facial para:", profile.email);
    
    let completeProfile = { ...profile };

    // Tentar carregar o perfil completo no banco de dados se houver conexão real
    try {
      if (isRealSupabase && isUuid(profile.id)) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profile.id)
          .maybeSingle();
        
        if (!error && data) {
          completeProfile = mapProfile(data);
        }
      }
    } catch (err) {
      console.warn("[Auth] Erro ao buscar perfil completo após biometria:", err);
    }

    // Resolver a role da forma mais segura e persistente
    if (!completeProfile.role) {
      const cachedRole = localStorage.getItem(`atalaia_cached_role_${profile.id}`);
      completeProfile.role = (cachedRole as UserRole) || deriveRoleFromEmail(profile.email, UserRole.RESIDENT);
    } else {
      localStorage.setItem(`atalaia_cached_role_${profile.id}`, completeProfile.role);
    }

    setUser(completeProfile);
    await SessionService.registerSession(completeProfile.id, completeProfile.email);
    if (completeProfile.phone) {
       localStorage.setItem('user_last_phone', completeProfile.phone);
    }
  };

  const contextValue: AuthContextType = { 
        user, 
        login: async (email, password, role, name, neighborhoodId, phone, plan) => {
             if (name || role) {
                 if (!isRealSupabase) {
                    console.log("[Auth] Demo Mode: Simulando registro para", name);
                    const resolvedRole = role || UserRole.RESIDENT;
                    const newUser = {
                        id: `demo-${Date.now()}`,
                        email,
                        name: name || email.split('@')[0],
                        role: resolvedRole,
                        plan: (resolvedRole === UserRole.RESIDENT ? (plan || 'PREMIUM') : 'FREE') as UserPlan,
                        approved: true,
                        neighborhoodId,
                        phone
                    };
                    setUser(newUser);
                    return;
                }
                const isApproved = role === UserRole.ADMIN || role === UserRole.RESIDENT;
                const safeNeighborhoodId = neighborhoodId && neighborhoodId.trim() !== '' ? neighborhoodId.trim() : null;
                const resolvedPlan = role === UserRole.RESIDENT ? (plan || 'PREMIUM') : 'FREE';
                const { data, error } = await supabase.auth.signUp({
                    email, password, options: { data: { role, name, neighborhood_id: safeNeighborhoodId, phone, approved: isApproved, plan: resolvedPlan } }
                });
                if (error) throw error;
                if (data.user) {
                    await supabase.from('profiles').upsert({ id: data.user.id, email, name, phone, neighborhood_id: safeNeighborhoodId, role, approved: isApproved, plan: resolvedPlan });
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


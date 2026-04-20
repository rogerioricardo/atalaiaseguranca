
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserPlan } from '../types';
import { supabase } from '../lib/supabaseClient';
import { MockService } from '../services/mockService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: UserRole, name?: string, neighborhoodId?: string, phone?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  const fetchProfile = async (userId: string, email: string, metadata?: any, triggerNotify = false) => {
      console.log("[Auth] Buscando perfil para:", userId);
      
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
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
  }

  return (
    <AuthContext.Provider value={{ 
        user, 
        login: async (email, password, role, name, neighborhoodId, phone) => {
             if (name) {
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
        refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth error');
  return context;
};

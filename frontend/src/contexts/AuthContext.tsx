import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { atribuirNomeReligioso } from '../lib/religiosoNome';

export interface User {
  id: string;
  nome: string;
  email: string;
  status: string;
  acessos: string[];
  religiosoId?: string;
  religiosoNome?: string;
  religiosoGrau?: string;
  religiosoStatusCadastro?: string;
  isReligioso?: boolean;
  isAdmin?: boolean;
  precisaTrocarSenha?: boolean;
}

export const hasModuleAccess = (user: User | null, accessKey: string): boolean => {
  if (!user) return false;
  return Boolean(user.acessos.includes('admin') || user.acessos.includes(accessKey));
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUserProfile: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_CACHE_KEY = 'brm_auth_user_cache_v1';

const getCachedUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.id && parsed.email && Array.isArray(parsed.acessos)) {
      return parsed as User;
    }
  } catch (err) {
    console.warn('Erro ao ler cache de autenticação:', err);
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialização síncrona a partir do cache local para entrada instantânea (0ms / direto)
  const initialCachedUser = getCachedUser();
  const [user, setUser] = useState<User | null>(initialCachedUser);
  const [loading, setLoading] = useState<boolean>(() => !initialCachedUser);
  const currentUserIdRef = useRef<string | null>(initialCachedUser?.id || null);

  const saveUser = (newUser: User | null) => {
    setUser(newUser);
    currentUserIdRef.current = newUser?.id || null;
    try {
      if (newUser) {
        localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(newUser));
      } else {
        localStorage.removeItem(AUTH_USER_CACHE_KEY);
      }
    } catch (err) {
      console.warn('Erro ao persistir cache de autenticação:', err);
    }
  };

  const fetchUserProfile = async (userId: string, email: string, userMetadata?: Record<string, unknown>) => {
    try {
      // Executa as consultas de usuário e de religioso em paralelo para máxima velocidade
      const [userRes, relRes] = await Promise.all([
        supabase
          .from('usuarios')
          .select('usu_nome, usu_email, usu_status, usu_acessos')
          .eq('auth_user_id', userId)
          .maybeSingle(),
        supabase
          .from('religiosos')
          .select('id, nome_civil, nome_religioso, grau, auth_user_id, status_cadastro')
          .eq('auth_user_id', userId)
          .maybeSingle(),
      ]);

      if (userRes.error) throw userRes.error;
      const userData = userRes.data;

      let religiosoId: string | undefined;
      let religiosoNome: string | undefined;
      let religiosoGrau: string | undefined;
      let religiosoStatusCadastro: string | undefined;
      let isReligioso = false;
      const precisaTrocarSenha = Boolean(userMetadata?.precisa_trocar_senha);

      if (relRes.error) {
        console.error('Falha ao consultar vínculo religioso:', relRes.error.message);
      } else if (relRes.data) {
        const relData = relRes.data;
        religiosoId = relData.id;
        religiosoNome = atribuirNomeReligioso(relData.grau, relData.nome_civil) || relData.nome_religioso || relData.nome_civil;
        religiosoGrau = relData.grau;
        religiosoStatusCadastro = relData.status_cadastro;
        isReligioso = true;
      }

      if (userData) {
        let acessos: string[] = [];
        const rawAcessos = typeof userData.usu_acessos === 'string'
          ? JSON.parse(userData.usu_acessos)
          : userData.usu_acessos;
        if (Array.isArray(rawAcessos)) {
          acessos = rawAcessos.filter((access): access is string => typeof access === 'string');
        } else if (rawAcessos != null) {
          console.error('Perfil de usuário contém permissões em formato inválido.');
        }

        if (userData.usu_status !== 'Ativo') acessos = [];

        if (religiosoStatusCadastro !== 'Aprovado') {
          acessos = acessos.filter(access => access !== 'religioso' && access !== 'portal');
        } else if (userData.usu_status === 'Ativo' && !acessos.includes('religioso')) {
          acessos.push('religioso');
        }

        const isAdmin = acessos.includes('admin');

        saveUser({
          id: userId,
          nome: userData.usu_nome || religiosoNome || email.split('@')[0],
          email: userData.usu_email || email,
          status: userData.usu_status,
          acessos,
          religiosoId,
          religiosoNome,
          religiosoGrau,
          religiosoStatusCadastro,
          isReligioso,
          isAdmin,
          precisaTrocarSenha,
        });
      } else if (isReligioso) {
        const aprovado = religiosoStatusCadastro === 'Aprovado';
        saveUser({
          id: userId,
          nome: religiosoNome || email.split('@')[0],
          email: email,
          status: 'Ativo',
          acessos: aprovado ? ['religioso', 'portal'] : [],
          religiosoId,
          religiosoNome,
          religiosoGrau,
          religiosoStatusCadastro,
          isReligioso: true,
          isAdmin: false,
          precisaTrocarSenha,
        });
      } else {
        saveUser({
          id: userId,
          nome: email.split('@')[0],
          email,
          status: 'Pendente',
          acessos: [],
          isReligioso: false,
          isAdmin: false,
          precisaTrocarSenha,
        });
      }
    } catch (err) {
      console.error("Falha ao obter perfil do usuario:", err);
      // Se já temos o perfil em cache, preserva dados existentes em vez de zerar
      if (!currentUserIdRef.current) {
        saveUser({
          id: userId,
          nome: email.split('@')[0],
          email,
          status: 'Pendente',
          acessos: [],
          isReligioso: false,
          isAdmin: false,
        });
      }
    }
  };

  useEffect(() => {
    // Modo E2E / Preview para testes de renderização
    if (import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem('brm_e2e_preview') === 'true') {
      const previewRole = localStorage.getItem('brm_e2e_role');
      
      if (previewRole === 'patrimonio') {
        saveUser({
          id: 'e2e-patrimonio',
          nome: 'Usuário de Patrimônio',
          email: 'patrimonio@brm.org.br',
          status: 'Ativo',
          acessos: ['patrimonio'],
          isReligioso: false,
          isAdmin: false,
        });
      } else if (previewRole === 'religioso') {
        saveUser({
          id: 'e2e-religioso',
          nome: 'Pe. Carlos Eduardo, SCJ',
          email: 'pe.carlos@brm.org.br',
          status: 'Ativo',
          acessos: ['religioso', 'portal'],
          religiosoId: 'e2e-religioso-01',
          religiosoNome: 'Pe. Carlos Eduardo',
          religiosoGrau: 'Padre',
          religiosoStatusCadastro: 'Aprovado',
          isReligioso: true,
          isAdmin: false,
        });
      } else {
        saveUser({
          id: 'e2e-admin',
          nome: 'Administrador Dehoniano',
          email: 'admin@brm.org.br',
          status: 'Ativo',
          acessos: ['admin', 'inicio', 'religiosos', 'hospedagens', 'configuracoes', 'usuarios', 'obras', 'patrimonio', 'religioso', 'portal'],
          religiosoId: 'e2e-religioso-admin',
          religiosoNome: 'Pe. Secretário Provincial',
          religiosoGrau: 'Padre',
          religiosoStatusCadastro: 'Aprovado',
          isReligioso: true,
          isAdmin: true,
        });
      }
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // 1. Caso de renovação periódica de token ou retorno do foco na aba (visibilitychange):
      // NUNCA ative loading e não recarregue perfil desnecessariamente, preservando formulários e telas ativas.
      if (event === 'TOKEN_REFRESHED') {
        return;
      }

      // 2. Caso de saída de sessão (Logout)
      if (event === 'SIGNED_OUT' || !session?.user) {
        if (isMounted) {
          saveUser(null);
          setLoading(false);
        }
        return;
      }

      const sessionUserId = session.user.id;
      const sessionUserEmail = session.user.email || '';
      const sessionUserMetadata = session.user.user_metadata;

      // 3. Caso o usuário autenticado seja exatamente o mesmo já ativo na aplicação:
      // Revalida em segundo plano SEM acionar estado de loading global e SEM desmontar páginas ou formulários.
      if (currentUserIdRef.current === sessionUserId) {
        await fetchUserProfile(sessionUserId, sessionUserEmail, sessionUserMetadata);
        return;
      }

      // 4. Caso seja a carga inicial da sessão ou uma troca legítima de usuário:
      await fetchUserProfile(sessionUserId, sessionUserEmail, sessionUserMetadata);
      if (isMounted) {
        setLoading(false);
      }
    });

    // Fallback de inicialização de sessão caso o listener demore a disparar
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      if (!session?.user) {
        // Se a sessão expirou no Supabase, limpa o cache
        if (isMounted) {
          saveUser(null);
          setLoading(false);
        }
      } else if (!currentUserIdRef.current || currentUserIdRef.current !== session.user.id) {
        await fetchUserProfile(session.user.id, session.user.email || '', session.user.user_metadata);
        if (isMounted) {
          setLoading(false);
        }
      } else {
        // Sessão confirmada e usuário já ativo via cache instantâneo
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    saveUser(null);
    await supabase.auth.signOut();
  };

  const refreshUserProfile = async (userId: string) => {
    await fetchUserProfile(userId, user?.email || '');
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, logout, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

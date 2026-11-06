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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const currentUserIdRef = useRef<string | null>(null);

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
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

      if (userRes.error) {
        console.error('Falha ao consultar perfil do usuario:', userRes.error.message);
      }
      const userData = userRes.data;

      let religiosoId: string | undefined;
      let religiosoNome: string | undefined;
      let religiosoGrau: string | undefined;
      let religiosoStatusCadastro: string | undefined;
      let isReligioso = false;

      if (relRes.error) {
        console.error('Falha ao consultar vinculo religioso:', relRes.error.message);
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
        }

        if (userData.usu_status !== 'Ativo') acessos = [];

        if (religiosoStatusCadastro !== 'Aprovado') {
          acessos = acessos.filter(access => access !== 'religioso' && access !== 'portal');
        } else if (userData.usu_status === 'Ativo' && !acessos.includes('religioso')) {
          acessos.push('religioso');
        }

        const isAdmin = acessos.includes('admin');

        setUser({
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
        });
      } else if (isReligioso) {
        const aprovado = religiosoStatusCadastro === 'Aprovado';
        setUser({
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
        });
      } else {
        setUser({
          id: userId,
          nome: email.split('@')[0],
          email,
          status: 'Pendente',
          acessos: [],
          isReligioso: false,
          isAdmin: false,
        });
      }
    } catch (err) {
      console.error("Falha ao obter perfil do usuario:", err);
      setUser({
        id: userId,
        nome: email.split('@')[0],
        email,
        status: 'Pendente',
        acessos: [],
        isReligioso: false,
        isAdmin: false,
      });
    }
  };

  useEffect(() => {
    // Modo E2E / Preview para testes de renderização
    if (import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem('brm_e2e_preview') === 'true') {
      const previewRole = localStorage.getItem('brm_e2e_role');
      
      if (previewRole === 'patrimonio') {
        currentUserIdRef.current = 'e2e-patrimonio';
        setUser({
          id: 'e2e-patrimonio',
          nome: 'Usuário de Patrimônio',
          email: 'patrimonio@brm.org.br',
          status: 'Ativo',
          acessos: ['patrimonio'],
          isReligioso: false,
          isAdmin: false,
        });
      } else if (previewRole === 'religioso') {
        currentUserIdRef.current = 'e2e-religioso';
        setUser({
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
        currentUserIdRef.current = 'e2e-admin';
        setUser({
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

    // Timeout de segurança: em no máximo 3s libera o loading para nunca travar a tela
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 3000);

    // Escutar eventos de autenticação do Supabase.
    // O callback NÃO deve ser async para nunca reter a trava interna do GoTrueClient no Supabase.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      // 1. Renovação periódica de token ou retorno do foco na aba (visibilitychange):
      // NUNCA ativa loading e não altera o estado do usuário, evitando qualquer reset de tela.
      if (event === 'TOKEN_REFRESHED') {
        return;
      }

      // 2. Logout ou ausência de sessão ativa
      if (event === 'SIGNED_OUT' || !session?.user) {
        currentUserIdRef.current = null;
        if (isMounted) {
          clearTimeout(safetyTimer);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const sessionUserId = session.user.id;
      const sessionUserEmail = session.user.email || '';

      // 3. Usuário já ativo (ex.: revalidação de aba em background):
      // Atualiza dados silenciosamente, sem ativar loading global.
      if (currentUserIdRef.current === sessionUserId) {
        void fetchUserProfile(sessionUserId, sessionUserEmail);
        return;
      }

      // 4. Carga inicial ou novo login:
      currentUserIdRef.current = sessionUserId;
      void fetchUserProfile(sessionUserId, sessionUserEmail).then(() => {
        if (isMounted) {
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      });
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    currentUserIdRef.current = null;
    await supabase.auth.signOut();
    setUser(null);
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

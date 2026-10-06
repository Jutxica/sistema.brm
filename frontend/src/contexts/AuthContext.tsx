import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface User {
  id: string;
  nome: string;
  email: string;
  status: string;
  acessos: string[];
  religiosoId?: string;
  religiosoNome?: string;
  religiosoGrau?: string;
  isReligioso?: boolean;
  isAdmin?: boolean;
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
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      // 1. Consultar perfil administrativo na tabela 'usuarios'
      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      // 2. Consultar perfil eclesiástico na tabela 'religiosos'
      let religiosoId: string | undefined;
      let religiosoNome: string | undefined;
      let religiosoGrau: string | undefined;
      let isReligioso = false;

      try {
        const { data: relData } = await supabase
          .from('religiosos')
          .select('id, nome_civil, nome_religioso, grau, auth_user_id')
          .or(`auth_user_id.eq.${userId},email_institucional.eq.${email},email_pessoal.eq.${email}`)
          .maybeSingle();

        if (relData) {
          religiosoId = relData.id;
          religiosoNome = relData.nome_religioso || relData.nome_civil;
          religiosoGrau = relData.grau;
          isReligioso = true;

          // Se ainda não estava com o auth_user_id gravado, atualiza silenciosamente
          if (!relData.auth_user_id) {
            supabase
              .from('religiosos')
              .update({ auth_user_id: userId })
              .eq('id', relData.id)
              .then(() => {});
          }
        }
      } catch (relErr) {
        console.warn("Aviso ao buscar vinculo com tabela de religiosos:", relErr);
      }

      if (userData) {
        let acessos: string[] = [];
        try {
          acessos = typeof userData.usu_acessos === 'string'
            ? JSON.parse(userData.usu_acessos)
            : userData.usu_acessos || [];
        } catch {
          acessos = [];
        }

        if (isReligioso && !acessos.includes('religioso')) {
          acessos.push('religioso');
        }

        const isAdmin = Boolean(
          acessos.includes('admin') || 
          acessos.includes('usuarios') || 
          acessos.includes('secretaria')
        );

        setUser({
          id: userId,
          nome: userData.usu_nome || religiosoNome || email.split('@')[0],
          email: userData.usu_email || email,
          status: userData.usu_status,
          acessos,
          religiosoId,
          religiosoNome,
          religiosoGrau,
          isReligioso,
          isAdmin,
        });
      } else if (isReligioso) {
        // Usuário é um religioso cadastrado (acesso ao Portal do Confrade)
        setUser({
          id: userId,
          nome: religiosoNome || email.split('@')[0],
          email: email,
          status: 'Ativo',
          acessos: ['religioso', 'portal'],
          religiosoId,
          religiosoNome,
          religiosoGrau,
          isReligioso: true,
          isAdmin: false,
        });
      } else {
        // Verificar se é o primeiro usuário do sistema (bootstrap inicial de admin)
        const { count } = await supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true });

        const isFirstUser = (count === 0 || count === null);

        if (isFirstUser) {
          setUser({
            id: userId,
            nome: email.split('@')[0],
            email: email,
            status: 'Ativo',
            acessos: ['admin', 'inicio', 'religiosos', 'hospedagens', 'configuracoes', 'usuarios', 'obras', 'patrimonio', 'religioso'],
            isReligioso: false,
            isAdmin: true,
          });
        } else {
          // Princípio do menor privilégio: sem perfil cadastrado
          setUser({
            id: userId,
            nome: email.split('@')[0],
            email: email,
            status: 'Pendente',
            acessos: [],
            isReligioso: false,
            isAdmin: false,
          });
        }
      }
    } catch (err) {
      console.error("Falha ao obter perfil do usuario:", err);
      setUser(null);
    }
  };

  useEffect(() => {
    // Modo E2E / Preview para testes de renderização
    if (typeof window !== 'undefined' && localStorage.getItem('brm_e2e_preview') === 'true') {
      const previewRole = localStorage.getItem('brm_e2e_role');
      
      if (previewRole === 'patrimonio') {
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
        setUser({
          id: 'e2e-religioso',
          nome: 'Pe. Carlos Eduardo, SCJ',
          email: 'pe.carlos@brm.org.br',
          status: 'Ativo',
          acessos: ['religioso', 'portal'],
          religiosoId: 'e2e-religioso-01',
          religiosoNome: 'Pe. Carlos Eduardo',
          religiosoGrau: 'Padre',
          isReligioso: true,
          isAdmin: false,
        });
      } else {
        setUser({
          id: 'e2e-admin',
          nome: 'Administrador Dehoniano',
          email: 'admin@brm.org.br',
          status: 'Ativo',
          acessos: ['admin', 'inicio', 'religiosos', 'hospedagens', 'configuracoes', 'usuarios', 'obras', 'patrimonio', 'religioso', 'portal'],
          religiosoId: 'e2e-religioso-admin',
          religiosoNome: 'Pe. Secretário Provincial',
          religiosoGrau: 'Padre',
          isReligioso: true,
          isAdmin: true,
        });
      }
      setLoading(false);
      return;
    }

    // Verificar sessão ativa inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email || '').then(() => {
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setLoading(true);
        fetchUserProfile(session.user.id, session.user.email || '').then(() => {
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
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

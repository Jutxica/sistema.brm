import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface User {
  id: string;
  nome: string;
  email: string;
  status: string;
  acessos: string[];
}

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
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar perfil do usuario administrativo:", error);
        setUser(null);
        return;
      }

      if (data) {
        let acessos: string[] = [];
        try {
          acessos = typeof data.usu_acessos === 'string'
            ? JSON.parse(data.usu_acessos)
            : data.usu_acessos || [];
        } catch {
          acessos = [];
        }

        setUser({
          id: userId,
          nome: data.usu_nome,
          email: data.usu_email,
          status: data.usu_status,
          acessos: acessos
        });
      } else {
        // Se o usuário autenticado no auth.users não existir na tabela customizada 'usuarios',
        // criamos um perfil básico temporário para evitar falhas de visualização
        setUser({
          id: userId,
          nome: email.split('@')[0],
          email: email,
          status: 'Ativo',
          acessos: ['inicio', 'hospedagens', 'configuracoes', 'usuarios'] // Acesso completo para primeiro administrador
        });
      }
    } catch (err) {
      console.error("Falha ao obter perfil do usuario:", err);
      setUser(null);
    }
  };

  useEffect(() => {
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


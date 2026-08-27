import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Inicio from './pages/Inicio';
import HospedagensInscricoes from './pages/HospedagensInscricoes';
import HospedagensConfiguracoes from './pages/HospedagensConfiguracoes';
import Usuarios from './pages/Usuarios';

// Route guards
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#061320]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-500">Verificando sessão...</span>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const DefaultRedirect: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return null;
  
  return <Navigate to={isAuthenticated ? "/inicio" : "/login"} replace />;
};

import InscricaoPublica from './pages/InscricaoPublica';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Access */}
            <Route path="/login" element={<Login />} />
            <Route path="/inscricao" element={<InscricaoPublica />} />

            {/* Private Workspace */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DefaultRedirect />} />
              <Route path="inicio" element={<Inicio />} />
              <Route path="hospedagens-inscricoes" element={<HospedagensInscricoes />} />
              <Route path="hospedagens-configuracoes" element={<HospedagensConfiguracoes />} />
              <Route path="usuarios" element={<Usuarios />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<DefaultRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

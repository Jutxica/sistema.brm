import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FeedbackProvider } from './contexts/FeedbackContext';
import Layout from './components/Layout';
import AppleErrorBoundary from './components/AppleErrorBoundary';

// Lazy-loaded Pages (Code-Splitting)
const Login = lazy(() => import('./pages/Login'));
const Inicio = lazy(() => import('./pages/Inicio'));
const Institucional = lazy(() => import('./pages/Institucional'));
const CadastroReligiosoPublico = lazy(() => import('./pages/CadastroReligiosoPublico'));
const HospedagensInscricoes = lazy(() => import('./pages/HospedagensInscricoes'));
const HospedagensConfiguracoes = lazy(() => import('./pages/HospedagensConfiguracoes'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const ReligiososAdmin = lazy(() => import('./pages/ReligiososAdmin'));
const ReligiososConfiguracoes = lazy(() => import('./pages/ReligiososConfiguracoes'));
const ObrasAdmin = lazy(() => import('./pages/ObrasAdmin'));
const ObraForm = lazy(() => import('./pages/ObraForm'));
const InscricaoPublica = lazy(() => import('./pages/InscricaoPublica'));
const PoliticaPrivacidade = lazy(() => import('./pages/PoliticaPrivacidade'));
const AtualizarObraPublico = lazy(() => import('./pages/AtualizarObraPublico'));
const EstatisticaBRM = lazy(() => import('./pages/EstatisticaBRM'));
const MeuPerfilReligioso = lazy(() => import('./pages/MeuPerfilReligioso'));
const AnuarioBRM = lazy(() => import('./pages/AnuarioBRM'));
const PortalReligioso = lazy(() => import('./pages/portal-religioso/PortalReligioso'));
const DocumentosAdmin = lazy(() => import('./pages/DocumentosAdmin'));
const AgendaAdmin = lazy(() => import('./pages/AgendaAdmin'));
const SecretariaConfiguracoes = lazy(() => import('./pages/SecretariaConfiguracoes'));
const FormularioPublicoInscricao = lazy(() => import('./pages/FormularioPublicoInscricao'));
const PatrimonioAdmin = lazy(() => import('./pages/PatrimonioAdmin'));
const PatrimonioForm = lazy(() => import('./pages/PatrimonioForm'));
const PatrimonioDetalhes = lazy(() => import('./pages/PatrimonioDetalhes'));
const ValidarDocumento = lazy(() => import('./pages/ValidarDocumento'));

// Apple Loading Spinner Fallback
const AppleLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[50vh] w-full py-16">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-[#0071e3]/20 border-t-[#0071e3] animate-spin" />
      <span className="text-[11px] font-medium text-[#707070] dark:text-[#86868b] tracking-wider uppercase">
        Carregando módulo...
      </span>
    </div>
  </div>
);

// Route guards
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f7] dark:bg-[#0d1117]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#0071e3]/20 border-t-[#0071e3] animate-spin" />
          <span className="text-xs font-medium text-[#707070] dark:text-[#86868b]">Verificando sessão...</span>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <AppleLoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = Boolean(user?.acessos?.includes('admin') || user?.acessos?.includes('usuarios'));
  if (!isAdmin) {
    return <Navigate to="/inicio" replace />;
  }

  return <>{children}</>;
};

const DefaultRedirect: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return null;
  
  return <Navigate to={isAuthenticated ? "/inicio" : "/login"} replace />;
};

export const App: React.FC = () => {
  return (
    <AppleErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <FeedbackProvider>
            <BrowserRouter>
              <Suspense fallback={<AppleLoadingFallback />}>
              <Routes>
                {/* Standalone Religious Member Area (Portal do Confrade) */}
                <Route path="/portal-religioso" element={<PortalReligioso />} />
                <Route path="/area-religioso" element={<PortalReligioso />} />

                {/* Public Access */}
                <Route path="/login" element={<Login />} />
                <Route path="/inscricao" element={<InscricaoPublica />} />
                <Route path="/cadastro-religiosos" element={<CadastroReligiosoPublico />} />
                <Route path="/religiosos-publico" element={<CadastroReligiosoPublico />} />
                <Route path="/privacidade" element={<PoliticaPrivacidade />} />
                <Route path="/atualizar-obra/:token" element={<AtualizarObraPublico />} />
                <Route path="/preview-obras" element={<ObrasAdmin />} />
                <Route path="/formularios/:id" element={<FormularioPublicoInscricao />} />
                <Route path="/validar" element={<ValidarDocumento />} />
                <Route path="/validar/:codigo" element={<ValidarDocumento />} />

                {/* Private Administrative Workspace */}
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
                  <Route path="meu-perfil" element={<MeuPerfilReligioso />} />
                  <Route path="anuario" element={<AnuarioBRM />} />
                  <Route path="religiosos" element={<ReligiososAdmin />} />
                  <Route path="estatisticas-brm" element={<EstatisticaBRM />} />
                  <Route path="documentos" element={<DocumentosAdmin />} />
                  <Route path="agenda" element={<AgendaAdmin />} />
                  <Route path="secretaria-configuracoes" element={<SecretariaConfiguracoes />} />
                  <Route path="religiosos/novo" element={<CadastroReligiosoPublico adminMode />} />
                  <Route path="religiosos/editar/:id" element={<CadastroReligiosoPublico adminMode />} />
                  <Route path="religiosos-configuracoes" element={<ReligiososConfiguracoes />} />
                  <Route path="obras" element={<ObrasAdmin />} />
                  <Route path="obras/nova" element={<ObraForm />} />
                  <Route path="obras/editar/:id" element={<ObraForm />} />
                  <Route path="institucional" element={<Institucional />} />
                  <Route path="patrimonio" element={<PatrimonioAdmin />} />
                  <Route path="patrimonio/novo" element={<PatrimonioForm />} />
                  <Route path="patrimonio/editar/:tipo/:id" element={<PatrimonioForm />} />
                  <Route path="patrimonio/detalhes/:tipo/:id" element={<PatrimonioDetalhes />} />
                  <Route path="hospedagens-inscricoes" element={<HospedagensInscricoes />} />
                  <Route path="hospedagens-configuracoes" element={<HospedagensConfiguracoes />} />
                  <Route
                    path="usuarios"
                    element={
                      <AdminRoute>
                        <Usuarios />
                      </AdminRoute>
                    }
                  />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<DefaultRedirect />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </FeedbackProvider>
      </AuthProvider>
    </ThemeProvider>
  </AppleErrorBoundary>
  );
};

export default App;

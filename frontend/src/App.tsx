import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, hasModuleAccess } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FeedbackProvider } from './contexts/FeedbackContext';
import Layout from './components/Layout';
import AppleErrorBoundary from './components/AppleErrorBoundary';
import { isPortalPublicHost } from './lib/portalUrls';

// Lazy-loaded Pages (Code-Splitting)
const Login = lazy(() => import('./pages/Login'));
const Inicio = lazy(() => import('./pages/Inicio'));
const Institucional = lazy(() => import('./pages/Institucional'));
const CadastroReligiosoPublico = lazy(() => import('./pages/CadastroReligiosoPublico'));
const HospedagensInscricoes = lazy(() => import('./pages/HospedagensInscricoes'));
const HospedagensConfiguracoes = lazy(() => import('./pages/HospedagensConfiguracoes'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const ReligiososAdmin = lazy(() => import('./pages/ReligiososAdmin'));
const ReligiososDossies = lazy(() => import('./pages/ReligiososDossies'));
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
const PatrimonioTarefas = lazy(() => import('./pages/PatrimonioTarefas'));
const PatrimonioForm = lazy(() => import('./pages/PatrimonioForm'));
const PatrimonioDetalhes = lazy(() => import('./pages/PatrimonioDetalhes'));
const ValidarDocumento = lazy(() => import('./pages/ValidarDocumento'));
const ArquivoSecretaria = lazy(() => import('./pages/ArquivoSecretaria'));
const SecretariaDashboard = lazy(() => import('./pages/SecretariaDashboard'));
const ReligiosoDossie = lazy(() => import('./pages/ReligiosoDossie'));

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

const getDefaultPath = (user: ReturnType<typeof useAuth>['user']): string => {
  if (user?.acessos.includes('secretaria')) return '/secretaria';

  const destinations = [
    ['inicio', '/inicio'],
    ['patrimonio', '/patrimonio'],
    ['arquivo_secretaria', '/secretaria'],
    ['arquivo_substituto', '/secretaria'],
    ['religiosos', '/religiosos'],
    ['obras', '/obras'],
    ['hospedagens', '/hospedagens-inscricoes'],
    ['configuracoes', '/religiosos-configuracoes'],
    ['usuarios', '/usuarios'],
    ['religioso', '/meu-perfil'],
    ['portal', '/meu-perfil'],
  ] as const;

  return destinations.find(([accessKey]) => hasModuleAccess(user, accessKey))?.[1] || '/login';
};

const ModuleRoute: React.FC<{ children: React.ReactNode; accessKey: string }> = ({ children, accessKey }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <AppleLoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasModuleAccess(user, accessKey)) {
    return <Navigate to={getDefaultPath(user)} replace />;
  }

  return <>{children}</>;
};

const SecretariaReligiososRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <AppleLoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasModuleAccess(user, 'secretaria') && !hasModuleAccess(user, 'religiosos')) {
    return <Navigate to={getDefaultPath(user)} replace />;
  }
  return <>{children}</>;
};

const ArquivoSecretariaRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <AppleLoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.acessos.some(access => access === 'arquivo_secretaria' || access === 'arquivo_substituto')) {
    return <Navigate to={getDefaultPath(user)} replace />;
  }
  return <>{children}</>;
};

const SecretariaDashboardRoute: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const canAccessArchive = Boolean(
    user?.acessos.some(access => access === 'arquivo_secretaria' || access === 'arquivo_substituto'),
  );

  if (loading) return <AppleLoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasModuleAccess(user, 'secretaria') && !canAccessArchive) {
    return <Navigate to={getDefaultPath(user)} replace />;
  }
  return <SecretariaDashboard />;
};

const DefaultRedirect: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return null;
  
  return <Navigate to={isAuthenticated ? getDefaultPath(user) : "/login"} replace />;
};

const ApplicationRoot: React.FC = () => {
  const location = useLocation();
  if (isPortalPublicHost() && location.pathname === '/') return <PortalReligioso />;
  return <ProtectedRoute><Layout /></ProtectedRoute>;
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
                  element={<ApplicationRoot />}
                >
                  <Route index element={<DefaultRedirect />} />
                  <Route path="inicio" element={<ModuleRoute accessKey="inicio"><Inicio /></ModuleRoute>} />
                  <Route path="meu-perfil" element={<ModuleRoute accessKey="religioso"><MeuPerfilReligioso /></ModuleRoute>} />
                  <Route path="anuario" element={<ModuleRoute accessKey="religiosos"><AnuarioBRM /></ModuleRoute>} />
                  <Route path="religiosos" element={<SecretariaReligiososRoute><ReligiososAdmin /></SecretariaReligiososRoute>} />
                  <Route path="religiosos/dossies" element={<SecretariaReligiososRoute><ReligiososDossies /></SecretariaReligiososRoute>} />
                  <Route path="religiosos/:id/dossie" element={<SecretariaReligiososRoute><ReligiosoDossie /></SecretariaReligiososRoute>} />
                  <Route path="estatisticas-brm" element={<ModuleRoute accessKey="religiosos"><EstatisticaBRM /></ModuleRoute>} />
                  <Route path="documentos" element={<ModuleRoute accessKey="secretaria"><DocumentosAdmin /></ModuleRoute>} />
                  <Route path="secretaria" element={<SecretariaDashboardRoute />} />
                  <Route path="secretaria/arquivo" element={<ArquivoSecretariaRoute><ArquivoSecretaria modo="secretaria" /></ArquivoSecretariaRoute>} />
                  <Route path="agenda" element={<ModuleRoute accessKey="secretaria"><AgendaAdmin /></ModuleRoute>} />
                  <Route path="secretaria-configuracoes" element={<ModuleRoute accessKey="configuracoes"><SecretariaConfiguracoes /></ModuleRoute>} />
                  <Route path="religiosos/novo" element={<ModuleRoute accessKey="religiosos"><CadastroReligiosoPublico adminMode /></ModuleRoute>} />
                  <Route path="religiosos/editar/:id" element={<ModuleRoute accessKey="religiosos"><CadastroReligiosoPublico adminMode /></ModuleRoute>} />
                  <Route path="religiosos-configuracoes" element={<ModuleRoute accessKey="configuracoes"><ReligiososConfiguracoes /></ModuleRoute>} />
                  <Route path="obras" element={<ModuleRoute accessKey="obras"><ObrasAdmin /></ModuleRoute>} />
                  <Route path="obras/nova" element={<ModuleRoute accessKey="obras"><ObraForm /></ModuleRoute>} />
                  <Route path="obras/editar/:id" element={<ModuleRoute accessKey="obras"><ObraForm /></ModuleRoute>} />
                  <Route path="institucional" element={<ModuleRoute accessKey="obras"><Institucional /></ModuleRoute>} />
                  <Route path="patrimonio/tarefas" element={<PatrimonioTarefas />} />
                  <Route
                    path="patrimonio"
                    element={
                      <ModuleRoute accessKey="patrimonio">
                        <PatrimonioAdmin />
                      </ModuleRoute>
                    }
                  />
                  <Route path="patrimonio/envios-secretaria" element={<ModuleRoute accessKey="patrimonio"><ArquivoSecretaria modo="patrimonio" /></ModuleRoute>} />
                  <Route
                    path="patrimonio/novo"
                    element={
                      <ModuleRoute accessKey="patrimonio">
                        <PatrimonioForm />
                      </ModuleRoute>
                    }
                  />
                  <Route
                    path="patrimonio/editar/:tipo/:id"
                    element={
                      <ModuleRoute accessKey="patrimonio">
                        <PatrimonioForm />
                      </ModuleRoute>
                    }
                  />
                  <Route
                    path="patrimonio/detalhes/:tipo/:id"
                    element={
                      <ModuleRoute accessKey="patrimonio">
                        <PatrimonioDetalhes />
                      </ModuleRoute>
                    }
                  />
                  <Route path="hospedagens-inscricoes" element={<ModuleRoute accessKey="hospedagens"><HospedagensInscricoes /></ModuleRoute>} />
                  <Route path="hospedagens-configuracoes" element={<ModuleRoute accessKey="configuracoes"><HospedagensConfiguracoes /></ModuleRoute>} />
                  <Route
                    path="usuarios"
                    element={
                      <ModuleRoute accessKey="usuarios">
                        <Usuarios />
                      </ModuleRoute>
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

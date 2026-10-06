import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  User, Lock, Mail, Phone, Calendar, BookOpen, FileText, 
  Hotel, LogOut, ChevronRight, UserCheck, ShieldCheck, 
  Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Building, 
  Home, Cake, Clock, ExternalLink, ArrowRight, ArrowLeft,
  ChevronDown, Printer, Share2, MapPin, Download, Search, Tag, Filter, X
} from 'lucide-react';
import MeuPerfilReligioso from '../MeuPerfilReligioso';
import AnuarioBRM from '../AnuarioBRM';
import CadastroReligiosoPublico, { validateCpf } from '../CadastroReligiosoPublico';
import FichaCanonicaPDF from './FichaCanonicaPDF';
import type { DocumentoProvincial, CategoriaDocumento } from '../DocumentosAdmin';
import type { EventoProvincial } from '../AgendaAdmin';
import { staggerStyle } from '../../hooks/useMotion';
import { FormularioTimbrado } from '../../components/FormularioTimbrado';
import { LeitorDocumentoModal } from '../../components/LeitorDocumentoModal';
import { downloadArquivo } from '../../lib/downloadHelper';
import type { FormularioSecretaria, RespostaFormulario } from '../SecretariaConfiguracoes';
import { showToast } from '../../hooks/useFeedback';

interface CasaAcolhida {
  id: string;
  nome: string;
  tipo?: string;
  cidade?: string;
  localidade?: string;
  uf?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  site?: string;
}

export const PortalReligioso: React.FC = () => {
  const { user, logout, refreshUserProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Authentication State for Member Portal
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Active View inside Member Area: 'inicio' | 'perfil' | 'inscricao' | 'ficha-pdf' | 'calendario' | 'documentos' | 'anuario' | 'hospedagem'
  const [activeSection, setActiveSection] = useState<'inicio' | 'perfil' | 'inscricao' | 'ficha-pdf' | 'calendario' | 'documentos' | 'anuario' | 'hospedagem'>('inicio');

  // Casas e Obras da Província BRM para Hospedagem
  const [casasAcolhida, setCasasAcolhida] = useState<CasaAcolhida[]>([]);
  const [loadingCasas, setLoadingCasas] = useState(false);

  // Documentos Oficiais da Província BRM
  const [documentos, setDocumentos] = useState<DocumentoProvincial[]>([]);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [documentosError, setDocumentosError] = useState(false);
  const [docSearch, setDocSearch] = useState('');
  const [docCategoria, setDocCategoria] = useState<string>('Todas');
  const [documentoLeitura, setDocumentoLeitura] = useState<DocumentoProvincial | null>(null);

  // Agenda & Eventos da Província BRM
  const [eventos, setEventos] = useState<EventoProvincial[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [eventosError, setEventosError] = useState(false);
  const [eventoFiltroTipo, setEventoFiltroTipo] = useState<string>('Todos');
  const [eventoSearch, setEventoSearch] = useState('');

  // Formulários & Inscrições Canônicas da Secretaria
  const [formulariosSecretaria, setFormulariosSecretaria] = useState<FormularioSecretaria[]>([]);
  const [formulariosError, setFormulariosError] = useState(false);
  const [respostasInscricoes, setRespostasInscricoes] = useState<RespostaFormulario[]>([]);
  const [eventoInscricaoModal, setEventoInscricaoModal] = useState<EventoProvincial | null>(null);
  const [formularioInscricaoAtivo, setFormularioInscricaoAtivo] = useState<FormularioSecretaria | null>(null);
  const [salvandoInscricao, setSalvandoInscricao] = useState(false);

  // Registration State
  const [regNomeCivil, setRegNomeCivil] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regDataNascimento, setRegDataNascimento] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regConfirmarSenha, setRegConfirmarSenha] = useState('');

  // Dropdown de Persona / Perfil SaaS
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Religious Profile Data
  const [religiosoData, setReligiosoData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // E2E Preview Mode for Member Portal
  const isE2E = import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem('brm_e2e_preview') === 'true';

  // Helper CPF
  const formatCpf = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  // Carregar perfil do religioso conectado
  const loadMemberData = async () => {
    if (!user && !isE2E) return;
    setLoadingProfile(true);
    setProfileError(null);

    try {
      if (isE2E) {
        setReligiosoData({
          nome_religioso: 'Pe. Carlos Eduardo, SCJ',
          nome_civil: 'Carlos Eduardo da Silva',
          grau: 'Padre',
          status_cadastro: 'Em revisão',
          comunidade_atual_nome: 'Sede Provincial BRM, Curitiba/PR',
          email_institucional: 'pe.carlos@brm.org.br',
        });
        setLoadingProfile(false);
        return;
      }

      const { data: linkedId, error: linkError } = await supabase.rpc('ensure_religious_portal_profile');
      if (linkError) throw linkError;

      const { data, error } = await supabase
        .from('religiosos')
        .select('*')
        .eq('id', linkedId)
        .eq('auth_user_id', user?.id)
        .single();
      if (error) throw error;

      if (data) {
        let fotoUrl = '';
        if (data.foto_path) {
          const { data: signedPhoto, error: photoError } = await supabase.storage
            .from('religiosos-perfil')
            .createSignedUrl(data.foto_path, 60 * 60);
          if (photoError) throw photoError;
          fotoUrl = signedPhoto.signedUrl;
        }
        setReligiosoData({ ...data, foto_url: fotoUrl });
        await refreshUserProfile?.(user!.id);
      }
    } catch (err) {
      console.error(err);
      setReligiosoData(null);
      setProfileError(err instanceof Error
        ? err.message
        : 'Não foi possível localizar seu cadastro. Entre em contato com a Secretaria Provincial.');
    } finally {
      setLoadingProfile(false);
    }
  };

  // Carregar Casas e Obras oficiais da Província BRM para Hospedagem
  useEffect(() => {
    const fetchCasas = async () => {
      setLoadingCasas(true);
      try {
        const { data } = await supabase
          .from('religiosos_obras_referencia')
          .select('id, nome, tipo, cidade, localidade, uf, endereco, telefone, email, site')
          .in('tipo', ['Casa', 'Obra'])
          .eq('status', 'Ativa')
          .order('nome');

        if (data && data.length > 0) {
          setCasasAcolhida(data);
        } else {
          // Fallback gracioso se tipo estiver vazio
          const { data: allData } = await supabase
            .from('religiosos_obras_referencia')
            .select('id, nome, tipo, cidade, localidade, uf, endereco, telefone, email, site')
            .eq('status', 'Ativa')
            .order('nome')
            .limit(8);
          if (allData) setCasasAcolhida(allData);
        }
      } catch (err) {
        console.error('Erro ao carregar casas de hospedagem:', err);
      } finally {
        setLoadingCasas(false);
      }
    };

    fetchCasas();
  }, []);

  // Carregar Documentos Oficiais e Agenda da Província BRM
  useEffect(() => {
    const fetchDocumentos = async () => {
      setLoadingDocumentos(true);
      try {
        const { data, error } = await supabase
          .from('documentos_provinciais')
          .select('*')
          .eq('status', 'Ativo')
          .order('data_documento', { ascending: false });

        if (error) throw error;
        setDocumentos((data || []) as DocumentoProvincial[]);
        setDocumentosError(false);
      } catch (err) {
        console.warn('Erro ao carregar documentos:', err);
        setDocumentos([]);
        setDocumentosError(true);
      } finally {
        setLoadingDocumentos(false);
      }
    };

    const fetchEventos = async () => {
      setLoadingEventos(true);
      try {
        const { data, error } = await supabase
          .from('eventos_provinciais')
          .select('*')
          .neq('status', 'Cancelado')
          .order('data_inicio', { ascending: true });

        if (error) throw error;
        setEventos((data || []) as EventoProvincial[]);
        setEventosError(false);
      } catch (err) {
        console.warn('Erro ao carregar eventos:', err);
        setEventos([]);
        setEventosError(true);
      } finally {
        setLoadingEventos(false);
      }
    };

    const fetchFormulariosERespostas = async () => {
      try {
        const { data: forms, error: formsQueryError } = await supabase.from('secretaria_formularios').select('*');
        if (formsQueryError) throw formsQueryError;
        setFormulariosSecretaria((forms || []) as FormularioSecretaria[]);
        setFormulariosError(false);
      } catch (error) {
        console.error('Erro ao carregar formulários de inscrição:', error);
        setFormulariosSecretaria([]);
        setFormulariosError(true);
      }

      try {
        const { data: responses, error: responsesError } = await supabase.from('secretaria_respostas_formulario').select('*');
        if (responsesError) throw responsesError;
        setRespostasInscricoes((responses || []) as RespostaFormulario[]);
      } catch (error) {
        console.error('Erro ao carregar inscrições do portal:', error);
        setRespostasInscricoes([]);
      }
    };

    fetchDocumentos();
    fetchEventos();
    fetchFormulariosERespostas();
  }, []);

  useEffect(() => {
    if (user || isE2E) {
      loadMemberData();
    }
  }, [user?.id]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Verificar se já possui dados cadastrais completos ou primeiro acesso
  const hasCompletedRegistration = Boolean(religiosoData?.id || isE2E);
  const registrationMenuLabel = hasCompletedRegistration ? 'Atualizar Dados' : 'Cadastro BRM';

  const CATEGORIAS_OFICIAIS: CategoriaDocumento[] = [
    'Transferências',
    'Diretórios',
    'Comunicados',
    'Protocolos',
    'Decretos',
    'Formação & Subsídios',
    'Outros'
  ];

  const getCategoriaCor = (_cat: CategoriaDocumento) => {
    return 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  const getTipoCor = (_tipo: string) => {
    return 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatData = (iso: string) => {
    try {
      const [ano, mes, dia] = iso.split('-');
      return `${dia}/${mes}/${ano}`;
    } catch {
      return iso;
    }
  };

  const formatPeriodo = (inicio: string, fim?: string | null) => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    try {
      const [anoI, mesI, diaI] = inicio.split('-');
      const mesNome = meses[parseInt(mesI, 10) - 1];

      if (!fim || fim === inicio) {
        return `${diaI} de ${mesNome}, ${anoI}`;
      }

      const [anoF, mesF, diaF] = fim.split('-');
      if (mesI === mesF) {
        return `${diaI} a ${diaF} de ${mesNome}, ${anoI}`;
      }

      const mesFNome = meses[parseInt(mesF, 10) - 1];
      return `${diaI} de ${mesNome} a ${diaF} de ${mesFNome}, ${anoI}`;
    } catch {
      return inicio;
    }
  };

  const documentosFiltrados = documentos.filter(doc => {
    const matchCat = docCategoria === 'Todas' || doc.categoria === docCategoria;
    const q = docSearch.toLowerCase();
    const matchSearch = !docSearch ||
      doc.titulo.toLowerCase().includes(q) ||
      (doc.numero_referencia && doc.numero_referencia.toLowerCase().includes(q)) ||
      (doc.descricao && doc.descricao.toLowerCase().includes(q)) ||
      doc.categoria.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const eventosFiltrados = eventos.filter((evt) => {
    const matchTipo = eventoFiltroTipo === 'Todos' || evt.tipo === eventoFiltroTipo;
    const q = eventoSearch.toLowerCase();
    const matchSearch =
      !eventoSearch ||
      evt.titulo.toLowerCase().includes(q) ||
      (evt.descricao && evt.descricao.toLowerCase().includes(q)) ||
      (evt.local && evt.local.toLowerCase().includes(q)) ||
      (evt.cidade && evt.cidade.toLowerCase().includes(q)) ||
      (evt.publico_alvo && evt.publico_alvo.toLowerCase().includes(q));
    return matchTipo && matchSearch;
  });

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const targetEmail = identificador.trim().toLowerCase();
      if (!targetEmail.includes('@')) {
        setAuthError('Use o e-mail confirmado da sua conta para entrar. O CPF não é usado como identificador de login.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: senha,
      });

      if (error) {
        setAuthError(error.message === 'Invalid login credentials' 
          ? 'Credenciais inválidas. Verifique seu e-mail e senha.'
          : error.message);
      } else if (data.session) {
        await refreshUserProfile(data.session.user.id);
        setActiveSection('inicio');
      }
    } catch (err) {
      console.error(err);
      setAuthError(err instanceof Error ? err.message : 'Erro ao conectar com o servidor.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    const cleanCpf = regCpf.replace(/\D/g, '');
    if (!validateCpf(cleanCpf)) {
      setAuthError('CPF inválido. Confira os 11 dígitos verificadores.');
      setAuthLoading(false);
      return;
    }

    if (!consentAccepted) {
      setAuthError('Confirme a autorização para uso dos dados do cadastro conforme a Política de Privacidade.');
      setAuthLoading(false);
      return;
    }

    if (!regDataNascimento || regDataNascimento >= new Date().toISOString().slice(0, 10)) {
      setAuthError('Informe uma data de nascimento válida.');
      setAuthLoading(false);
      return;
    }

    if (regSenha.length < 6) {
      setAuthError('A senha deve possuir no mínimo 6 caracteres.');
      setAuthLoading(false);
      return;
    }

    if (regSenha !== regConfirmarSenha) {
      setAuthError('As senhas digitadas não coincidem.');
      setAuthLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: regEmail.trim().toLowerCase(),
        password: regSenha,
        options: {
          emailRedirectTo: `${window.location.origin}/portal-religioso`,
          data: {
            nome: regNomeCivil.trim(),
            cpf: cleanCpf,
            data_nascimento: regDataNascimento,
            consentimento_dados: 'true',
          }
        }
      });

      if (authError) {
        setAuthError(authError.message.includes('already registered')
          ? 'Este e-mail já possui cadastro. Faça login ou recupere sua senha.'
          : authError.message);
        setAuthLoading(false);
        return;
      }

      if (authData.session && authData.user) {
        const { error: linkError } = await supabase.rpc('ensure_religious_portal_profile');
        if (linkError) throw linkError;
        await refreshUserProfile(authData.user.id);
        setAuthSuccess('Conta criada e cadastro vinculado. Você já pode acessar o portal.');
      } else {
        setAuthSuccess('Conta criada. Enviamos um link de confirmação para seu e-mail. Confirme-o e depois entre com seu e-mail e senha. A ficha ficará sujeita à validação da Secretaria Provincial.');
      }
      setAuthMode('login');
      setIdentificador(regEmail.trim().toLowerCase());
      setSenha('');
    } catch (err: any) {
      console.error(err);
      setAuthError(err instanceof Error ? err.message : 'Falha ao registrar conta de religioso.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordRecovery = async () => {
    const email = identificador.trim().toLowerCase();
    if (!email.includes('@')) {
      setAuthError('Informe o e-mail da sua conta para receber o link de recuperação.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/portal-religioso`,
      });
      if (error) throw error;
      setAuthSuccess('Se houver uma conta para este e-mail, enviaremos as instruções de recuperação.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível solicitar a recuperação da senha.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (recoveryPassword.length < 6) {
      setAuthError('A senha deve possuir no mínimo 6 caracteres.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: recoveryPassword });
      if (error) throw error;
      setRecoveryMode(false);
      setRecoveryPassword('');
      setAuthSuccess('Senha atualizada. Você já pode acessar o portal com a nova senha.');
      showToast.success('Senha atualizada com sucesso.');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível atualizar a senha.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Se o usuário NÃO estiver autenticado (e não em preview): Tela Apple de Entrada do Confrade
  if (!user && !isE2E) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] px-4 transition-colors duration-500 font-sans select-none">
        
        {/* Top spacing */}
        <div className="h-6 md:h-10" />

        {/* Apple Showcase Card */}
        <div className="flex-grow flex items-center justify-center py-6">
          <div className="w-full max-w-[500px] bg-white dark:bg-[#161617] rounded-[28px] p-8 sm:p-11 border border-[#d6d6d6]/60 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none transition-all duration-300">
            
            {/* Header & Brand */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-4">
                <img 
                  src="/logo-sistema.png" 
                  alt="Província BRM" 
                  className="h-16 w-auto object-contain select-none pointer-events-none dark:hidden"
                />
                <img 
                  src="/logo-branco.png" 
                  alt="Província BRM" 
                  className="h-16 w-auto object-contain select-none pointer-events-none hidden dark:block"
                />
              </div>
              
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block">
                Província Brasil Meridional • Área do Confrade
              </span>
              <h1 className="text-3xl sm:text-[32px] font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7] mt-1">
                Portal do Religioso
              </h1>
              <p className="text-sm text-[#707070] dark:text-[#86868b] font-normal mt-1 leading-relaxed">
                Comunhão fraterna, diretório & vida provincial
              </p>
            </div>

            {/* Apple Segmented Control */}
            <div className="flex bg-[#f5f5f7] dark:bg-[#262628] p-1 rounded-full mb-6 border border-[#d6d6d6]/40 dark:border-white/5">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(null); }}
                className={`flex-1 py-2 text-[13px] font-medium rounded-full transition-all duration-200 cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-[#323236] text-[#1d1d1f] dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                    : 'text-[#707070] dark:text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(null); }}
                className={`flex-1 py-2 text-[13px] font-medium rounded-full transition-all duration-200 cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-white dark:bg-[#323236] text-[#1d1d1f] dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                    : 'text-[#707070] dark:text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                }`}
              >
                Criar Conta
              </button>
            </div>

            {/* Alertas */}
            {authError && (
              <div className="flex items-start gap-3 p-3.5 rounded-[14px] bg-[#fff2f2] dark:bg-[#321417] text-[#c92a2a] dark:text-[#ff8787] text-xs mb-5 border border-[#ffc9c9] dark:border-[#5c1c24] animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="flex items-start gap-3 p-3.5 rounded-[14px] bg-[#e8f5e9] dark:bg-[#152a1b] text-[#2e7d32] dark:text-[#81c784] text-xs mb-5 border border-[#c8e6c9] dark:border-[#2e5e39]">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#2e7d32]" />
                <span className="leading-relaxed">{authSuccess}</span>
              </div>
            )}

            {/* FORM LOGIN */}
            {recoveryMode ? (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <label className="block text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                  Nova senha
                  <input
                    type="password"
                    minLength={6}
                    required
                    value={recoveryPassword}
                    onChange={event => setRecoveryPassword(event.target.value)}
                    className="mt-2 w-full px-4 py-3 bg-[#f5f5f7] dark:bg-[#262628] rounded-[14px] border border-transparent focus:border-[#0071e3] outline-none"
                  />
                </label>
                <button type="submit" disabled={authLoading} className="w-full py-3 rounded-full bg-[#0071e3] text-white font-medium disabled:opacity-50">
                  Atualizar senha
                </button>
              </form>
            ) : authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] block">
                    E-mail da conta
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#707070] dark:text-[#86868b] pointer-events-none">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={identificador}
                      onChange={(e) => setIdentificador(e.target.value)}
                      placeholder="confrade@brm.org.br"
                      className="w-full pl-10 pr-4 py-3 bg-[#f5f5f7] dark:bg-[#262628] hover:bg-[#efeff2] dark:hover:bg-[#2d2d30] text-[14px] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] rounded-[14px] border border-transparent focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#1d1d1f] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] block">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => void handlePasswordRecovery()}
                      className="text-[13px] text-[#0066cc] dark:text-[#2997ff] hover:underline font-normal transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#707070] dark:text-[#86868b] pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Digite sua senha"
                      className="w-full pl-10 pr-11 py-3 bg-[#f5f5f7] dark:bg-[#262628] hover:bg-[#efeff2] dark:hover:bg-[#2d2d30] text-[14px] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] rounded-[14px] border border-transparent focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#1d1d1f] outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#707070] hover:text-[#1d1d1f] dark:text-[#86868b] dark:hover:text-[#f5f5f7] transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 px-6 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[15px] font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Conectando...</span>
                      </>
                    ) : (
                      <span>Acessar Área do Confrade</span>
                    )}
                  </button>

                  {import.meta.env.DEV && (
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('brm_e2e_preview', 'true');
                        localStorage.setItem('brm_e2e_role', 'religioso');
                        window.location.reload();
                      }}
                      className="w-full mt-2.5 py-2.5 px-4 rounded-full bg-[#f5f5f7] dark:bg-[#262628] hover:bg-[#ebebed] dark:hover:bg-[#303033] text-[#0071e3] dark:text-[#2997ff] text-xs font-semibold transition-all cursor-pointer border border-[#0071e3]/30 flex items-center justify-center gap-2"
                    >
                      <span>Acesso Rápido de Confrade (Demonstração)</span>
                    </button>
                  )}
                </div>
              </form>
            ) : (
              /* FORM REGISTRO */
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] block mb-1">
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={regNomeCivil}
                    onChange={(e) => setRegNomeCivil(e.target.value)}
                    autoComplete="name"
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-2.5 bg-[#f5f5f7] dark:bg-[#262628] text-[14px] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] rounded-[14px] border border-transparent focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#1d1d1f] outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] block mb-1">
                      CPF *
                    </label>
                    <input
                      type="text"
                      required
                      value={regCpf}
                      onChange={(e) => setRegCpf(formatCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="w-full px-4 py-2.5 bg-[#f5f5f7] dark:bg-[#262628] text-[14px] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] rounded-[14px] border border-transparent focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#1d1d1f] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] block mb-1">
                      Data de nascimento *
                    </label>
                    <input
                      type="date"
                      required
                      max={new Date().toISOString().slice(0, 10)}
                      value={regDataNascimento}
                      onChange={(e) => setRegDataNascimento(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#f5f5f7] dark:bg-[#262628] text-[14px] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] rounded-[14px] border border-transparent focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#1d1d1f] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] block mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="seu@email.com"
                    className="w-full px-4 py-2.5 bg-[#f5f5f7] dark:bg-[#262628] text-[14px] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] rounded-[14px] border border-transparent focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#1d1d1f] outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] block mb-1">
                      Senha *
                    </label>
                    <input
                      type="password"
                      required
                        minLength={6}
                        autoComplete="new-password"
                        value={regSenha}
                      onChange={(e) => setRegSenha(e.target.value)}
                      placeholder="Mínimo 6 dígitos"
                      className="w-full px-4 py-2.5 bg-[#f5f5f7] dark:bg-[#262628] text-[14px] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] rounded-[14px] border border-transparent focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#1d1d1f] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] block mb-1">
                      Confirmar Senha *
                    </label>
                    <input
                      type="password"
                      required
                        minLength={6}
                        autoComplete="new-password"
                        value={regConfirmarSenha}
                      onChange={(e) => setRegConfirmarSenha(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full px-4 py-2.5 bg-[#f5f5f7] dark:bg-[#262628] text-[14px] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] rounded-[14px] border border-transparent focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#1d1d1f] outline-none transition-all"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[#707070] dark:text-[#a1a1a6]">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={event => setConsentAccepted(event.target.checked)}
                    className="mt-0.5 accent-[#226380]"
                  />
                  <span>Autorizo o uso destes dados para localizar e manter minha ficha institucional, conforme a Política de Privacidade e a LGPD. O CPF não é prova de identidade.</span>
                </label>

                <p className="text-xs leading-relaxed text-[#707070] dark:text-[#86868b]">
                  Enviaremos um link para confirmar seu e-mail. Depois da confirmação, você poderá entrar com sua senha. A Secretaria confere os dados antes de validar sua ficha.
                </p>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 px-6 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[15px] font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Criando acesso...</span>
                      </>
                    ) : (
                      <span>Criar Acesso e Conectar</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Link para Ficha Pública Avulsa */}
            <div className="mt-8 pt-6 border-t border-[#e5e5ea] dark:border-white/10 text-center">
              <a
                href="/cadastro-religiosos"
                className="text-[13px] text-[#0066cc] dark:text-[#2997ff] hover:underline font-normal inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Apenas preencher a ficha cadastral pública avulsa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </div>

        {/* Centralized Footer */}
        <footer className="w-full max-w-[980px] mx-auto py-6 border-t border-[#d6d6d6]/60 dark:border-white/10 text-center text-xs text-[#707070] dark:text-[#86868b] select-none print:hidden">
          <p className="tracking-wide">
            sistema.brm.org - todos os direitos reservados-2026
          </p>
        </footer>

      </div>
    );
  }

  // USUÁRIO AUTENTICADO: RENDERIZA O SITE DA ÁREA DE MEMBROS (APPLE FORMAT)
  const displayName = religiosoData?.nome_religioso || religiosoData?.nome_civil || user?.nome || 'Confrade Dehoniano';
  const displayGrau = religiosoData?.grau || 'Religioso SCJ';

  // Se o confrade estiver preenchendo a ficha oficial de inscrição de um evento (Página Completa - Sem Modal)
  if (eventoInscricaoModal && formularioInscricaoAtivo) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#090d16] text-[#1d1d1f] dark:text-[#f5f5f7] py-6 sm:py-8 px-3 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Barra Superior de Navegação */}
          <div className="bg-white dark:bg-[#161617] p-4 rounded-[12px] border border-[#d6d6d6]/60 dark:border-white/10 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setEventoInscricaoModal(null);
                  setFormularioInscricaoAtivo(null);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-mono uppercase font-semibold text-slate-700 dark:text-slate-300 hover:text-[#0071e3] dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[6px] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Portal do Confrade</span>
              </button>
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-[#0071e3] tracking-wider block">
                  Ficha Oficial de Inscrição Canônica
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-sans font-medium">
                  {eventoInscricaoModal.titulo} • {formatPeriodo(eventoInscricaoModal.data_inicio, eventoInscricaoModal.data_fim)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir Ficha</span>
            </button>
          </div>

          {/* Documento Timbrado em Página Completa */}
          <FormularioTimbrado
            titulo={formularioInscricaoAtivo.titulo}
            subtitulo={formularioInscricaoAtivo.codigo}
            descricao={formularioInscricaoAtivo.descricao}
            nomeEvento={eventoInscricaoModal.titulo}
            dataEvento={formatPeriodo(eventoInscricaoModal.data_inicio, eventoInscricaoModal.data_fim)}
            localEvento={eventoInscricaoModal.local}
            campos={formularioInscricaoAtivo.campos}
            valoresIniciais={{
              nome_completo: religiosoData?.nome_civil || religiosoData?.nome_religioso || '',
              nome_religioso: religiosoData?.nome_religioso || '',
              grau_ordem: religiosoData?.grau || 'Presbítero',
              comunidade_atual: religiosoData?.comunidade_atual_nome || '',
              cargo_funcao: religiosoData?.cargo_funcao || '',
              email: religiosoData?.email_institucional || user?.email || '',
              telefone_whatsapp: religiosoData?.telefone_whatsapp || religiosoData?.telefone_celular || '',
              cpf: religiosoData?.cpf || '',
              data_nascimento: religiosoData?.data_nascimento || '',
              necessita_hospedagem: 'Sim'
            }}
            carregando={salvandoInscricao}
            onSubmit={async (respostas) => {
              setSalvandoInscricao(true);
              try {
                const { data, error } = await supabase.rpc('secretaria_enviar_resposta', {
                  p_formulario_id: formularioInscricaoAtivo.id,
                  p_dados: respostas
                });
                if (error) throw error;
                const savedResponse = Array.isArray(data) ? data[0] : null;
                if (!savedResponse?.id || !savedResponse?.protocolo) {
                  throw new Error('O servidor não confirmou o recebimento da inscrição.');
                }

                const novaResp: RespostaFormulario = {
                  id: savedResponse.id,
                  formulario_id: formularioInscricaoAtivo.id,
                  evento_id: savedResponse.evento_id || null,
                  dados: respostas,
                  protocolo: savedResponse.protocolo,
                  status: 'Confirmada',
                  created_at: savedResponse.created_at
                };

                setRespostasInscricoes(prev => [novaResp, ...prev]);
                setEventoInscricaoModal(null);
                setFormularioInscricaoAtivo(null);
              } catch (error) {
                console.error('Erro ao enviar inscrição:', error);
                showToast.error(error instanceof Error ? error.message : 'Não foi possível enviar a inscrição.');
              } finally {
                setSalvandoInscricao(false);
              }
            }}
            onVoltar={() => {
              setEventoInscricaoModal(null);
              setFormularioInscricaoAtivo(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] flex flex-col font-sans transition-colors duration-300">
      
      {/* 1. BARRA SUPERIOR (HEADER APPLE FROSTED GLASS) */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#161617]/80 backdrop-blur-xl border-b border-[#d6d6d6]/60 dark:border-white/10 px-4 sm:px-8 py-3 flex items-center justify-between transition-colors">
        
        {/* Lado Esquerdo: Identidade do Portal */}
        <div className="flex items-center gap-3">
          <div className="flex items-center shrink-0">
            <img src="/logo-sistema.png" alt="Província BRM" className="h-8 w-auto object-contain select-none pointer-events-none dark:hidden" />
            <img src="/logo-branco.png" alt="Província BRM" className="h-8 w-auto object-contain select-none pointer-events-none hidden dark:block" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                Província BRM
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f5f5f7] dark:bg-[#262628] text-[#707070] dark:text-[#86868b]">
                Área de Membros
              </span>
            </div>
            <span className="text-[11px] text-[#707070] dark:text-[#86868b] block font-normal">
              Portal do Confrade • Padres Dehonianos
            </span>
          </div>
        </div>

        {/* Lado Direito: Botão de Persona / Avatar Dropdown (SaaS Profissional) */}
        <div className="flex items-center gap-3">
          
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              data-testid="persona-menu-button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="motion-press flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-white dark:bg-[#262628] border border-[#d6d6d6]/60 dark:border-white/10 hover:border-[#226380]/40 shadow-sm transition-all cursor-pointer group"
            >
              {/* Avatar do Confrade */}
              <div className="w-8 h-8 rounded-full bg-[#226380]/10 dark:bg-[#226380]/20 text-[#226380] font-semibold text-xs flex items-center justify-center overflow-hidden border border-[#226380]/20">
                {religiosoData?.foto_url ? (
                  <img src={religiosoData.foto_url} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <span>{displayName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] leading-tight">
                  {displayName}
                </span>
                <span className="text-[10px] text-[#707070] dark:text-[#86868b] leading-tight font-normal">
                  {displayGrau}
                </span>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-[#707070] dark:text-[#86868b] transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu Dropdown Flutuante Apple/SaaS */}
            {userMenuOpen && (
              <div 
                data-testid="persona-dropdown-menu"
                className="motion-dropdown absolute right-0 mt-2 w-72 rounded-[22px] bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl border border-[#d6d6d6]/60 dark:border-white/10 shadow-[0_16px_40px_rgba(17,50,64,0.12)] p-2 z-50"
              >
                
                {/* Cabeçalho do Confrade no Menu */}
                <div className="p-3 pb-2.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#226380]/10 text-[#226380] font-bold text-sm flex items-center justify-center overflow-hidden shrink-0 border border-[#226380]/20">
                    {religiosoData?.foto_url ? (
                      <img src={religiosoData.foto_url} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <span>{displayName.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold text-[#1d1d1f] dark:text-[#f5f5f7] block truncate">
                      {displayName}
                    </span>
                    <span className="text-[11px] text-[#707070] dark:text-[#86868b] block truncate">
                      {religiosoData?.email_institucional || user?.email}
                    </span>
                    <span className="inline-block px-2 py-0.5 mt-1 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-[#0071e3]/10 text-[#0071e3]">
                      {religiosoData?.status_cadastro || 'Cadastrado'}
                    </span>
                  </div>
                </div>

                <div className="my-1.5 border-t border-[#d6d6d6]/40 dark:border-white/5" />

                {/* Itens do Menu */}
                <div className="space-y-0.5">
                  
                  {/* 1. Meu Perfil */}
                  <button
                    type="button"
                    data-testid="menu-item-perfil"
                    onClick={() => {
                      setActiveSection('perfil');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-[14px] text-left text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] transition-colors cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-[10px] bg-[#f5f5f7] dark:bg-[#2c2c2e] group-hover:bg-[#0071e3]/10 flex items-center justify-center text-[#707070] group-hover:text-[#0071e3] transition-colors shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold block">Perfil</span>
                      <span className="text-[10px] text-[#707070] dark:text-[#86868b] block font-normal">
                        Informações básicas e foto de perfil
                      </span>
                    </div>
                  </button>

                  {/* 2. Cadastro BRM / Atualizar Dados */}
                  <button
                    type="button"
                    data-testid="menu-item-inscricao"
                    onClick={() => {
                      setActiveSection('inscricao');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-[14px] text-left text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] transition-colors cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-[10px] bg-[#f5f5f7] dark:bg-[#2c2c2e] group-hover:bg-[#0071e3]/10 flex items-center justify-center text-[#707070] group-hover:text-[#0071e3] transition-colors shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold block">{registrationMenuLabel}</span>
                      <span className="text-[10px] text-[#707070] dark:text-[#86868b] block font-normal">
                        Ficha oficial de 13 etapas da Província
                      </span>
                    </div>
                  </button>

                  {/* 3. Minha Ficha Completa (PDF) */}
                  <button
                    type="button"
                    data-testid="menu-item-ficha-pdf"
                    onClick={() => {
                      setActiveSection('ficha-pdf');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-[14px] text-left text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] transition-colors cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-[10px] bg-[#f5f5f7] dark:bg-[#2c2c2e] group-hover:bg-[#0071e3]/10 flex items-center justify-center text-[#707070] group-hover:text-[#0071e3] transition-colors shrink-0">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold block">Minha Ficha Completa</span>
                      <span className="text-[10px] text-[#707070] dark:text-[#86868b] block font-normal">
                        Estilo folha PDF para imprimir e compartilhar
                      </span>
                    </div>
                  </button>

                </div>

                <div className="my-1.5 border-t border-[#d6d6d6]/40 dark:border-white/5" />

                {/* Sair da Conta */}
                <button
                  type="button"
                  data-testid="menu-item-logout"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-[14px] text-left text-xs font-medium text-[#c92a2a] hover:bg-[#fff2f2] dark:hover:bg-[#321417] transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-[10px] bg-[#fff2f2] dark:bg-[#321417] flex items-center justify-center text-[#c92a2a] shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="font-semibold">Sair da Conta</span>
                </button>

              </div>
            )}
          </div>

        </div>

      </header>

      {/* 2. CORPO DO SITE: SIDEBAR + CONTEÚDO PRINCIPAL (APPLE FORMAT) */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 gap-6">
        <nav aria-label="Navegação do portal" className="md:hidden flex gap-2 overflow-x-auto pb-1">
          {([
            ['inicio', 'Início'],
            ['perfil', 'Perfil'],
            ['inscricao', 'Ficha'],
            ['ficha-pdf', 'Ficha PDF'],
            ['calendario', 'Agenda'],
            ['documentos', 'Documentos'],
            ['anuario', 'Anuário'],
            ['hospedagem', 'Hospedagem'],
          ] as const).map(([section, label]) => (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                activeSection === section
                  ? 'border-[#226380] bg-[#226380] text-white'
                  : 'border-[#d6d6d6] bg-white text-[#1d1d1f] dark:border-white/10 dark:bg-[#161617] dark:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        
        {/* SIDEBAR APPLE */}
        <aside className="w-64 shrink-0 hidden md:block space-y-6">
          
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#707070] dark:text-[#86868b] px-3 mb-2 block">
              Navegação do Membro
            </span>

            <button
              type="button"
              onClick={() => setActiveSection('inicio')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-all duration-200 text-left cursor-pointer ${
                activeSection === 'inicio'
                  ? 'bg-white dark:bg-[#161617] text-[#0071e3] dark:text-[#2997ff] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#d6d6d6]/40 dark:border-white/5 font-semibold'
                  : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-white/60 dark:hover:bg-[#161617]/60'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Painel do Confrade</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('calendario')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-all duration-200 text-left cursor-pointer ${
                activeSection === 'calendario'
                  ? 'bg-white dark:bg-[#161617] text-[#0071e3] dark:text-[#2997ff] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#d6d6d6]/40 dark:border-white/5 font-semibold'
                  : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-white/60 dark:hover:bg-[#161617]/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendário & Agenda</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('documentos')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-all duration-200 text-left cursor-pointer ${
                activeSection === 'documentos'
                  ? 'bg-white dark:bg-[#161617] text-[#0071e3] dark:text-[#2997ff] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#d6d6d6]/40 dark:border-white/5 font-semibold'
                  : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-white/60 dark:hover:bg-[#161617]/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Documentos Oficiais</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('anuario')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-all duration-200 text-left cursor-pointer ${
                activeSection === 'anuario'
                  ? 'bg-white dark:bg-[#161617] text-[#0071e3] dark:text-[#2997ff] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#d6d6d6]/40 dark:border-white/5 font-semibold'
                  : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-white/60 dark:hover:bg-[#161617]/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Anuário dos Confrades</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('hospedagem')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-all duration-200 text-left cursor-pointer ${
                activeSection === 'hospedagem'
                  ? 'bg-white dark:bg-[#161617] text-[#0071e3] dark:text-[#2997ff] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#d6d6d6]/40 dark:border-white/5 font-semibold'
                  : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-white/60 dark:hover:bg-[#161617]/60'
              }`}
            >
              <Hotel className="w-4 h-4" />
              <span>Pedir Hospedagem</span>
            </button>
          </div>

          <div className="pt-2">
            <div className="p-4 rounded-[20px] bg-white dark:bg-[#161617] border border-[#d6d6d6]/60 dark:border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <span className="text-[11px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] block mb-1">
                Secretaria Provincial
              </span>
              <p className="text-xs text-[#707070] dark:text-[#86868b] leading-relaxed">
                Dúvidas documentais: secretaria@brm.org.br
              </p>
            </div>
          </div>

        </aside>

        {/* 3. CONTEÚDO PRINCIPAL (PÁGINA NORMAL) */}
        <main className="flex-1 min-w-0 space-y-6">
          {recoveryMode && (
            <form onSubmit={handlePasswordUpdate} className="rounded-[6px] border border-[#226380]/30 bg-white p-5 dark:bg-[#161617]">
              <label className="block text-sm font-medium text-[#1d1d1f] dark:text-white">
                Defina sua nova senha
                <input
                  type="password"
                  minLength={6}
                  required
                  value={recoveryPassword}
                  onChange={event => setRecoveryPassword(event.target.value)}
                  className="mt-2 w-full rounded-[6px] border border-slate-300 bg-transparent px-3 py-2"
                />
              </label>
              <button type="submit" disabled={authLoading} className="mt-3 rounded-[6px] bg-[#226380] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                Atualizar senha
              </button>
            </form>
          )}
          {profileError && (
            <div role="alert" className="rounded-[6px] border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-semibold">Não foi possível vincular uma ficha à sua conta.</p>
              <p className="mt-1">{profileError}</p>
              <p className="mt-1">O CPF serve apenas para conferir a ficha e não comprova identidade. Se o e-mail ou os dados estiverem diferentes, solicite a validação da Secretaria Provincial.</p>
            </div>
          )}
          
          {/* SEÇÃO: INÍCIO / PAINEL DO CONFRADE */}
          {activeSection === 'inicio' && (
            <div className="space-y-6">
              
              {/* Masthead Arquitetural do Confrade (Apple Showcase Card) */}
              <div className="bg-white dark:bg-[#161617] rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-7 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block mb-1">
                      Sint Unum • Padres Dehonianos
                    </span>
                    <h2 className="text-2xl sm:text-[30px] font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
                      Saudação fraterna, {displayName}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#707070] dark:text-[#86868b] font-normal mt-1">
                      Bem-vindo ao espaço digital de comunhão, serviços e acompanhamento canônico da Província BRM.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#f5f5f7] dark:bg-[#262628] text-[#1d1d1f] dark:text-[#f5f5f7] border border-[#d6d6d6]/60 dark:border-white/10">
                      Status: {religiosoData?.status_cadastro || 'Vínculo pendente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5 Cards de Acesso Rápido (Apple Showcase Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* 01 / Meu Perfil */}
                <div 
                  onClick={() => setActiveSection('perfil')}
                  style={staggerStyle(0)}
                  className="rounded-[24px] bg-white dark:bg-[#161617] p-5 border border-[#d6d6d6]/60 dark:border-white/10 hover:border-[#0071e3]/40 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] cursor-pointer group flex flex-col justify-between motion-lift motion-press motion-stagger-item"
                >
                  <div>
                    <div className="w-10 h-10 rounded-[14px] bg-[#f5f5f7] dark:bg-[#262628] flex items-center justify-center text-[#0071e3] mb-3 group-hover:scale-105 transition-transform">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider text-[#707070] dark:text-[#86868b] block mb-1">
                      01 / CONTA SAAS
                    </span>
                    <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                      Meu Perfil
                    </h3>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#d6d6d6]/40 dark:border-white/5 flex items-center justify-between text-xs font-medium text-[#0066cc] dark:text-[#2997ff]">
                    <span>Foto e contatos</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

                {/* 02 / Cadastro BRM ou Atualizar Dados */}
                <div 
                  onClick={() => setActiveSection('inscricao')}
                  style={staggerStyle(1)}
                  className="rounded-[24px] bg-white dark:bg-[#161617] p-5 border border-[#d6d6d6]/60 dark:border-white/10 hover:border-[#0071e3]/40 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] cursor-pointer group flex flex-col justify-between motion-lift motion-press motion-stagger-item"
                >
                  <div>
                    <div className="w-10 h-10 rounded-[14px] bg-[#f5f5f7] dark:bg-[#262628] flex items-center justify-center text-[#0071e3] mb-3 group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider text-[#707070] dark:text-[#86868b] block mb-1">
                      02 / CANÔNICO
                    </span>
                    <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                      {registrationMenuLabel}
                    </h3>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#d6d6d6]/40 dark:border-white/5 flex items-center justify-between text-xs font-medium text-[#0066cc] dark:text-[#2997ff]">
                    <span>13 etapas oficiais</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

                {/* 03 / Documentos Oficiais */}
                <div 
                  onClick={() => setActiveSection('documentos')}
                  style={staggerStyle(2)}
                  className="rounded-[24px] bg-white dark:bg-[#161617] p-5 border border-[#d6d6d6]/60 dark:border-white/10 hover:border-[#0071e3]/40 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] cursor-pointer group flex flex-col justify-between motion-lift motion-press motion-stagger-item"
                >
                  <div>
                    <div className="w-10 h-10 rounded-[14px] bg-[#f5f5f7] dark:bg-[#262628] flex items-center justify-center text-[#0071e3] mb-3 group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider text-[#707070] dark:text-[#86868b] block mb-1">
                      03 / DOCUMENTOS
                    </span>
                    <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                      Documentos Oficiais
                    </h3>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#d6d6d6]/40 dark:border-white/5 flex items-center justify-between text-xs font-medium text-[#0066cc] dark:text-[#2997ff]">
                    <span>{documentos.length} disponíveis</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

                {/* 04 / Minha Ficha Completa (PDF) */}
                <div 
                  onClick={() => setActiveSection('ficha-pdf')}
                  style={staggerStyle(3)}
                  className="rounded-[24px] bg-white dark:bg-[#161617] p-5 border border-[#d6d6d6]/60 dark:border-white/10 hover:border-[#0071e3]/40 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] cursor-pointer group flex flex-col justify-between motion-lift motion-press motion-stagger-item"
                >
                  <div>
                    <div className="w-10 h-10 rounded-[14px] bg-[#f5f5f7] dark:bg-[#262628] flex items-center justify-center text-[#0071e3] mb-3 group-hover:scale-105 transition-transform">
                      <Printer className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider text-[#707070] dark:text-[#86868b] block mb-1">
                      04 / IMPRESSÃO
                    </span>
                    <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                      Minha Ficha
                    </h3>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#d6d6d6]/40 dark:border-white/5 flex items-center justify-between text-xs font-medium text-[#0066cc] dark:text-[#2997ff]">
                    <span>PDF e cópia</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

                {/* 05 / Anuário dos Confrades */}
                <div 
                  onClick={() => setActiveSection('anuario')}
                  style={staggerStyle(4)}
                  className="rounded-[24px] bg-white dark:bg-[#161617] p-5 border border-[#d6d6d6]/60 dark:border-white/10 hover:border-[#0071e3]/40 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] cursor-pointer group flex flex-col justify-between motion-lift motion-press motion-stagger-item"
                >
                  <div>
                    <div className="w-10 h-10 rounded-[14px] bg-[#f5f5f7] dark:bg-[#262628] flex items-center justify-center text-[#0071e3] mb-3 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider text-[#707070] dark:text-[#86868b] block mb-1">
                      05 / DIRETÓRIO
                    </span>
                    <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                      Anuário BRM
                    </h3>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#d6d6d6]/40 dark:border-white/5 flex items-center justify-between text-xs font-medium text-[#0066cc] dark:text-[#2997ff]">
                    <span>Diretório</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>

              </div>

              {/* Informações Canônicas & Destaques da Província */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Minha Situação Canônica */}
                <div className="bg-white dark:bg-[#161617] rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                  <div className="mb-5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block mb-1">
                      Registro Diocesano & Provincial
                    </span>
                    <h3 className="text-[18px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                      Minha Situação Canônica
                    </h3>
                  </div>

                  <div className="divide-y divide-[#d6d6d6]/40 dark:divide-white/5 text-[13px]">
                    <div className="flex justify-between py-3">
                      <span className="text-[#707070] dark:text-[#86868b]">Grau Eclesiástico</span>
                      <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{displayGrau}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-[#707070] dark:text-[#86868b]">Comunidade Atual</span>
                      <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{religiosoData?.comunidade_atual_nome || 'A definir'}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-[#707070] dark:text-[#86868b]">E-mail Institucional</span>
                      <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">{religiosoData?.email_institucional || user?.email}</span>
                    </div>
                    <div className="flex justify-between py-3 items-center">
                      <span className="text-[#707070] dark:text-[#86868b]">Validação da Secretaria</span>
                      <span className={`rounded-full px-3 py-0.5 text-[11px] font-medium ${
                        religiosoData?.status_cadastro === 'Aprovado'
                          ? 'bg-[#e8f5e9] text-[#2e7d32] dark:bg-[#152a1b] dark:text-[#81c784]'
                          : 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
                      }`}>
                        {religiosoData?.status_cadastro || 'Aguardando vínculo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Publicações & Comunicados Recentes */}
                <div className="bg-white dark:bg-[#161617] rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block mb-1">
                          Secretaria Provincial
                        </span>
                        <h3 className="text-[18px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                          Documentos Recentes
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSection('documentos')}
                        className="text-xs font-medium text-[#0066cc] dark:text-[#2997ff] hover:underline cursor-pointer"
                      >
                        Ver todos ({documentos.length})
                      </button>
                    </div>

                    <div className="divide-y divide-[#d6d6d6]/40 dark:divide-white/5 text-[13px]">
                      {documentos.slice(0, 3).map((doc, idx) => (
                        <div key={doc.id} style={staggerStyle(idx)} className="py-3 flex items-start justify-between gap-3 motion-stagger-item">
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${getCategoriaCor(doc.categoria)}`}>
                                {doc.categoria}
                              </span>
                              {doc.numero_referencia && (
                                <span className="font-mono text-[9px] text-[#707070] dark:text-[#86868b]">
                                  {doc.numero_referencia}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setDocumentoLeitura(doc)}
                              className="text-left w-full group/title cursor-pointer"
                              title="Clique para ler este documento"
                            >
                              <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7] block line-clamp-1 group-hover/title:text-[#226380] dark:group-hover/title:text-[#64b5f6] transition-colors">
                                {doc.titulo}
                              </span>
                            </button>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setDocumentoLeitura(doc)}
                              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#226380] dark:text-[#64b5f6] transition-colors motion-press cursor-pointer"
                              title="Ler documento na tela"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadArquivo(doc.arquivo_url, doc.arquivo_nome);
                              }}
                              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#707070] hover:text-[#113240] dark:hover:text-white transition-colors motion-press cursor-pointer"
                              title="Baixar arquivo"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSection('documentos')}
                    className="mt-4 pt-3 border-t border-[#d6d6d6]/40 dark:border-white/5 flex items-center justify-between text-xs text-[#0066cc] dark:text-[#2997ff] font-medium cursor-pointer motion-press"
                  >
                    <span>Consultar acervo de documentos oficiais</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              {/* Próximos Eventos da Agenda Provincial */}
              <div className="bg-white dark:bg-[#161617] rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block mb-1">
                      Comunhão & Agenda
                    </span>
                    <h3 className="text-[18px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                      Próximos Eventos da Província BRM
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('calendario')}
                    className="text-xs font-medium text-[#0066cc] dark:text-[#2997ff] hover:underline self-start sm:self-auto cursor-pointer"
                  >
                    Ver calendário completo ({eventos.length})
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {eventos.slice(0, 3).map((evt, idx) => (
                    <div
                      key={evt.id}
                      style={staggerStyle(idx)}
                      className="p-4 rounded-[20px] bg-[#fbfbfd] dark:bg-[#1f1f21] border border-[#d6d6d6]/60 dark:border-white/10 flex flex-col justify-between gap-3 motion-lift motion-press motion-stagger-item"
                    >
                      <div className="space-y-1.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getTipoCor(evt.tipo)}`}>
                          {evt.tipo}
                        </span>
                        <h4 className="text-[14px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] leading-snug">
                          {evt.titulo}
                        </h4>
                        <span className="text-xs text-[#707070] dark:text-[#86868b] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                          <span className="truncate">{evt.local}</span>
                        </span>
                      </div>
                      <div className="pt-2 border-t border-[#d6d6d6]/40 dark:border-white/5 text-[11px] font-medium text-[#0071e3] dark:text-[#2997ff]">
                        {formatPeriodo(evt.data_inicio, evt.data_fim)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* SEÇÃO: MEU PERFIL */}
          {activeSection === 'perfil' && (
            <div className="space-y-4">
              <div>
                <button
                  type="button"
                  onClick={() => setActiveSection('inicio')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#161617] border border-[#d6d6d6]/60 dark:border-white/10 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#262628] transition-all cursor-pointer shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao Painel do Confrade</span>
                </button>
              </div>
              <MeuPerfilReligioso isPortal={true} />
            </div>
          )}

          {/* SEÇÃO: INSCRIÇÃO BRM (FICHA COMPLETA) */}
          {activeSection === 'inscricao' && (
            <div className="space-y-4">
              <div>
                <button
                  type="button"
                  onClick={() => setActiveSection('inicio')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#161617] border border-[#d6d6d6]/60 dark:border-white/10 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#262628] transition-all cursor-pointer shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao Painel do Confrade</span>
                </button>
              </div>
              <div className="bg-white dark:bg-[#161617] rounded-[24px] border border-[#d6d6d6]/60 dark:border-white/10 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block mb-1">
                  Secretaria Provincial BRM
                </span>
                <h3 className="text-[18px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                  {hasCompletedRegistration ? 'Atualizar Dados Canônicos (Ficha Oficial)' : 'Ficha Cadastral Oficial da Província (13 Etapas)'}
                </h3>
                <p className="text-xs sm:text-sm text-[#707070] dark:text-[#86868b] font-normal mt-1 leading-relaxed">
                  Preencha ou revise a qualquer momento todos os dados canônicos, histórico de comunidades e anexos comprobatórios.
                </p>
              </div>
              {religiosoData?.id ? (
                <CadastroReligiosoPublico
                  memberMode
                  religiosoId={religiosoData.id}
                  onSaved={() => {
                    setActiveSection('inicio');
                    void loadMemberData();
                  }}
                />
              ) : (
                <div className="rounded-[6px] border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  Para preencher ou atualizar a ficha pelo portal, primeiro é necessário validar o vínculo com a Secretaria Provincial.
                </div>
              )}
            </div>
          )}

          {/* SEÇÃO: MINHA FICHA COMPLETA (PDF ESTILO OFICIAL) */}
          {activeSection === 'ficha-pdf' && (
            <FichaCanonicaPDF onBack={() => setActiveSection('inicio')} />
          )}

          {/* SEÇÃO: ANUÁRIO DOS CONFRADES */}
          {activeSection === 'anuario' && (
            <div className="space-y-4">
              <div>
                <button
                  type="button"
                  onClick={() => setActiveSection('inicio')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#161617] border border-[#d6d6d6]/60 dark:border-white/10 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#262628] transition-all cursor-pointer shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao Painel do Confrade</span>
                </button>
              </div>
              <AnuarioBRM />
            </div>
          )}

          {/* SEÇÃO: CALENDÁRIO & AGENDA */}
          {activeSection === 'calendario' && (
            <div className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() => setActiveSection('inicio')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#161617] border border-[#d6d6d6]/60 dark:border-white/10 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#262628] transition-all cursor-pointer shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao Painel do Confrade</span>
                </button>
              </div>

              <div className="bg-white dark:bg-[#161617] rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-7 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block mb-1">
                      Província BRM • Calendário Litúrgico e Provincial
                    </span>
                    <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
                      Agenda Provincial 2026
                    </h2>
                    <p className="text-xs sm:text-sm text-[#707070] dark:text-[#86868b] font-normal mt-1 leading-relaxed max-w-2xl">
                      Acompanhe os retiros, assembleias, celebrações patronais e encontros oficiais da Província Brasil Meridional.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#707070] dark:text-[#86868b] bg-[#f5f5f7] dark:bg-[#262628] px-4 py-2 rounded-full border border-[#d6d6d6]/40 dark:border-white/5 self-start md:self-auto">
                    <Calendar className="w-4 h-4 text-[#0071e3]" />
                    <span>{eventos.length} evento{eventos.length === 1 ? '' : 's'} na agenda</span>
                  </div>
                </div>

                {/* Filtros por Tipo de Evento */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-[#d6d6d6]/40 dark:border-white/5 mb-4">
                  {['Todos', 'Assembleia', 'Retiro', 'Reunião', 'Encontro', 'Celebração / Solenidade', 'Visita Canônica', 'Outro'].map((tipo) => {
                    const count = tipo === 'Todos' ? eventos.length : eventos.filter(e => e.tipo === tipo).length;
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setEventoFiltroTipo(tipo)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                          eventoFiltroTipo === tipo
                            ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f]'
                            : 'bg-[#f5f5f7] dark:bg-[#262628] text-[#707070] dark:text-[#86868b] hover:bg-[#e8e8ed] dark:hover:bg-[#333336]'
                        }`}
                      >
                        {tipo} {count > 0 && `(${count})`}
                      </button>
                    );
                  })}
                </div>

                {/* Barra de Busca de Eventos */}
                <div className="relative mb-6">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707070] dark:text-[#86868b]" />
                  <input
                    type="text"
                    value={eventoSearch}
                    onChange={(e) => setEventoSearch(e.target.value)}
                    placeholder="Filtrar eventos por título, localidade, cidade ou público..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] dark:bg-[#262628] border border-transparent focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#161617] rounded-full text-xs sm:text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#707070] dark:placeholder-[#86868b] transition-all outline-none"
                  />
                  {eventoSearch && (
                    <button
                      type="button"
                      onClick={() => setEventoSearch('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#707070] hover:text-[#1d1d1f] dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Lista de Eventos */}
                {loadingEventos ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0071e3] mb-2" />
                    <span className="text-xs text-[#707070] dark:text-[#86868b]">Carregando agenda provincial...</span>
                  </div>
                ) : eventosFiltrados.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#707070] dark:text-[#86868b] bg-[#f5f5f7]/60 dark:bg-[#262628]/40 rounded-[20px] p-6">
                    {eventosError
                      ? 'Não foi possível carregar a agenda provincial. Tente novamente mais tarde.'
                      : 'Nenhum evento encontrado para o filtro selecionado.'}
                  </div>
                ) : (
                  <div className="divide-y divide-[#d6d6d6]/40 dark:divide-white/5">
                    {eventosFiltrados.map((evt, idx) => (
                      <div key={evt.id} style={staggerStyle(idx)} className="py-5 px-3 rounded-[18px] flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-[#f5f5f7] dark:hover:bg-[#262628] transition-colors motion-stagger-item">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getTipoCor(evt.tipo)}`}>
                              {evt.tipo}
                            </span>
                            {evt.publico_alvo && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#f5f5f7] dark:bg-[#1d1d1f] text-[#707070] dark:text-[#86868b] border border-[#d6d6d6]/50 dark:border-white/10">
                                {evt.publico_alvo}
                              </span>
                            )}
                            {evt.exige_inscricao && (
                              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-[4px] bg-[#113240]/10 text-[#113240] dark:text-[#A3C3C7] border border-[#113240]/20 flex items-center gap-1">
                                <FileText className="w-2.5 h-2.5" />
                                Inscrição Aberta
                              </span>
                            )}
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-[4px] ${
                              evt.status === 'Confirmado'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                            }`}>
                              {evt.status}
                            </span>
                          </div>

                          <h3 className="text-[16px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                            {evt.titulo}
                          </h3>

                          {evt.descricao && (
                            <p className="text-xs text-[#707070] dark:text-[#86868b] leading-relaxed max-w-2xl">
                              {evt.descricao}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#707070] dark:text-[#86868b] pt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#226380]" />
                              <span>{evt.local}{evt.cidade ? ` • ${evt.cidade}/${evt.uf}` : ''}</span>
                            </span>
                            {evt.horario && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-[#707070]" />
                                <span>{evt.horario}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="self-start md:self-auto shrink-0 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-[6px] px-3.5 py-1.5 text-xs font-semibold bg-[#f5f5f7] dark:bg-[#1d1d1f] text-[#1d1d1f] dark:text-[#f5f5f7] border border-[#d6d6d6]/60 dark:border-white/10 whitespace-nowrap shadow-sm">
                            <Calendar className="w-3.5 h-3.5 text-[#226380]" />
                            {formatPeriodo(evt.data_inicio, evt.data_fim)}
                          </span>

                          {evt.exige_inscricao && (() => {
                            const jaInscrito = respostasInscricoes.find(
                              r => (r.evento_id === evt.id || (evt.formulario_id && r.formulario_id === evt.formulario_id)) &&
                                   (r.dados?.email === (religiosoData?.email_institucional || user?.email) || 
                                    r.dados?.nome_religioso === religiosoData?.nome_religioso || 
                                    r.dados?.nome_completo === religiosoData?.nome_civil)
                            );

                            const formVinculado = formulariosSecretaria.find(f => f.id === evt.formulario_id);

                            if (jaInscrito) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (formVinculado) {
                                      setEventoInscricaoModal(evt);
                                      setFormularioInscricaoAtivo(formVinculado);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-[6px] px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-[#113240] dark:text-white border border-slate-300 dark:border-slate-700 whitespace-nowrap cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#226380]" />
                                  <span>Inscrição ({jaInscrito.protocolo})</span>
                                </button>
                              );
                            }

                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  if (formVinculado) {
                                    setEventoInscricaoModal(evt);
                                    setFormularioInscricaoAtivo(formVinculado);
                                  } else {
                                    if (formulariosError) {
                                      showToast.error('Não foi possível carregar os formulários de inscrição. Tente novamente mais tarde.');
                                    } else {
                                      showToast.info('O formulário para este evento ainda não foi publicado pela Secretaria.');
                                    }
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 rounded-[6px] px-4 py-2 text-xs font-semibold bg-[#113240] text-white hover:bg-[#226380] whitespace-nowrap shadow-sm cursor-pointer transition-all active:scale-95"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Inscrever-se no Evento</span>
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEÇÃO: DOCUMENTOS OFICIAIS */}
          {activeSection === 'documentos' && (
            <div className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() => setActiveSection('inicio')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#161617] border border-[#d6d6d6]/60 dark:border-white/10 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#262628] transition-all cursor-pointer shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao Painel do Confrade</span>
                </button>
              </div>

              {/* Header Apple Style */}
              <div className="bg-white dark:bg-[#161617] rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-7 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block mb-1">
                      Secretaria Provincial • Atos Oficiais & Decretos
                    </span>
                    <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
                      Documentos Oficiais da Província BRM
                    </h2>
                    <p className="text-xs sm:text-sm text-[#707070] dark:text-[#86868b] font-normal mt-1 leading-relaxed max-w-2xl">
                      Consulte e baixe comunicados, diretórios, decretos de transferências, protocolos e subsídios emitidos pela Secretaria Provincial.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#707070] dark:text-[#86868b] bg-[#f5f5f7] dark:bg-[#262628] px-4 py-2 rounded-full border border-[#d6d6d6]/40 dark:border-white/5 self-start md:self-auto">
                    <FileText className="w-4 h-4 text-[#0071e3]" />
                    <span>{documentos.length} documento{documentos.length === 1 ? '' : 's'} disponível{documentos.length === 1 ? '' : 'is'}</span>
                  </div>
                </div>

                {/* Categorias Pills Filter */}
                <div className="flex flex-wrap gap-2 pt-6 mt-6 border-t border-[#d6d6d6]/40 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setDocCategoria('Todas')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      docCategoria === 'Todas'
                        ? 'bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f]'
                        : 'bg-[#f5f5f7] dark:bg-[#262628] text-[#707070] dark:text-[#86868b] hover:bg-[#e8e8ed] dark:hover:bg-[#333336]'
                    }`}
                  >
                    Todas ({documentos.length})
                  </button>
                  {CATEGORIAS_OFICIAIS.map((cat) => {
                    const count = documentos.filter((d) => d.categoria === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setDocCategoria(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                          docCategoria === cat
                            ? 'bg-[#0071e3] text-white shadow-sm'
                            : 'bg-[#f5f5f7] dark:bg-[#262628] text-[#707070] dark:text-[#86868b] hover:bg-[#e8e8ed] dark:hover:bg-[#333336]'
                        }`}
                      >
                        {cat} {count > 0 && `(${count})`}
                      </button>
                    );
                  })}
                </div>

                {/* Barra de Busca de Documentos */}
                <div className="mt-4 relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707070] dark:text-[#86868b]" />
                  <input
                    type="text"
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    placeholder="Buscar por título, assunto, número de protocolo ou referência..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] dark:bg-[#262628] border border-transparent focus:border-[#0071e3] focus:bg-white dark:focus:bg-[#161617] rounded-full text-xs sm:text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#707070] dark:placeholder-[#86868b] transition-all outline-none"
                  />
                  {docSearch && (
                    <button
                      type="button"
                      onClick={() => setDocSearch('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#707070] hover:text-[#1d1d1f] dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Grid / Lista de Documentos */}
              {loadingDocumentos ? (
                <div className="py-16 text-center bg-white dark:bg-[#161617] rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0071e3] mx-auto mb-2" />
                  <span className="text-xs text-[#707070] dark:text-[#86868b]">Carregando documentos oficiais...</span>
                </div>
              ) : documentosFiltrados.length === 0 ? (
                <div className="py-16 text-center bg-white dark:bg-[#161617] rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-8">
                  <FileText className="w-10 h-10 text-[#707070]/40 mx-auto mb-3" />
                  <h4 className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-1">
                    {documentosError ? 'Documentos indisponíveis' : 'Nenhum documento encontrado'}
                  </h4>
                  <p className="text-xs text-[#707070] dark:text-[#86868b] max-w-sm mx-auto mb-4">
                    {documentosError
                      ? 'Não foi possível carregar os documentos oficiais. Tente novamente mais tarde.'
                      : 'Não encontramos nenhum documento oficial correspondente à categoria ou termo de busca selecionado.'}
                  </p>
                  {(docSearch || docCategoria !== 'Todas') && (
                    <button
                      type="button"
                      onClick={() => {
                        setDocCategoria('Todas');
                        setDocSearch('');
                      }}
                      className="px-4 py-2 rounded-full bg-[#f5f5f7] dark:bg-[#262628] text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e8e8ed] dark:hover:bg-[#333336] transition-all cursor-pointer"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentosFiltrados.map((doc, idx) => (
                    <div
                      key={doc.id}
                      style={staggerStyle(idx)}
                      className="bg-white dark:bg-[#161617] rounded-[24px] border border-[#d6d6d6]/60 dark:border-white/10 p-6 flex flex-col justify-between hover:border-[#0071e3]/40 dark:hover:border-[#2997ff]/40 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.02)] motion-stagger-item motion-lift"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getCategoriaCor(doc.categoria)}`}>
                            {doc.categoria}
                          </span>
                          <span className="text-[11px] text-[#707070] dark:text-[#86868b] font-medium">
                            {formatData(doc.data_documento)}
                          </span>
                        </div>

                        <div 
                          className="cursor-pointer group/title"
                          onClick={() => setDocumentoLeitura(doc)}
                        >
                          {doc.numero_referencia && (
                            <span className="text-[11px] font-mono text-[#226380] dark:text-[#64b5f6] block mb-1">
                              {doc.numero_referencia}
                            </span>
                          )}
                          <h3 className="text-[16px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] group-hover/title:text-[#226380] dark:group-hover/title:text-[#64b5f6] transition-colors leading-snug font-cinzel">
                            {doc.titulo}
                          </h3>
                        </div>

                        {doc.descricao && (
                          <p className="text-xs text-[#707070] dark:text-[#86868b] leading-relaxed line-clamp-2">
                            {doc.descricao}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-[#707070] dark:text-[#86868b] pt-1">
                          <span className="truncate max-w-[220px]" title={doc.arquivo_nome}>
                            📄 {doc.arquivo_nome}
                          </span>
                          <span>•</span>
                          <span>{formatFileSize(doc.arquivo_tamanho_bytes)}</span>
                        </div>
                      </div>

                      <div className="pt-5 mt-4 border-t border-[#d6d6d6]/40 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[11px] text-[#707070] dark:text-[#86868b] font-mono">
                          {doc.publicado_por || 'Secretaria Provincial'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDocumentoLeitura(doc)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#113240] hover:bg-[#1a4a5e] dark:bg-[#226380] dark:hover:bg-[#1b526b] text-white text-xs font-medium transition-all shadow-sm active:scale-[0.99] cursor-pointer motion-press"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Ler Documento</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadArquivo(doc.arquivo_url, doc.arquivo_nome)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#161617] hover:bg-slate-50 dark:hover:bg-[#262628] text-slate-700 dark:text-slate-300 text-xs font-medium transition-all shadow-xs cursor-pointer motion-press"
                            title="Baixar arquivo original"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Baixar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEÇÃO: PEDIR HOSPEDAGEM */}
          {activeSection === 'hospedagem' && (
            <div className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() => setActiveSection('inicio')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#161617] border border-[#d6d6d6]/60 dark:border-white/10 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#262628] transition-all cursor-pointer shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao Painel do Confrade</span>
                </button>
              </div>

              <div className="bg-white dark:bg-[#161617] rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block mb-1">
                    Acolhida Fraterna • Província BRM
                  </span>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
                    Hospedagem & Acolhida Fraterna
                  </h2>
                  <p className="text-xs sm:text-sm text-[#707070] dark:text-[#86868b] font-normal mt-1 leading-relaxed max-w-2xl">
                    Solicite estadia para períodos de descanso, estudos, retiros ou passagem pastoral nas Casas e Obras oficiais da Província BRM.
                  </p>
                </div>

                <a
                  href="/inscricao"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[14px] font-medium transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0 shadow-sm active:scale-[0.99]"
                >
                  <span>Ficha Geral de Inscrição</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Grid das Casas e Obras da Província BRM para Hospedagem */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
                      Casas e Obras de Acolhida da Província BRM
                    </h3>
                    <p className="text-xs text-[#707070] dark:text-[#86868b] mt-0.5">
                      Selecione uma das casas da província abaixo para abrir a solicitação de estadia com o destino pré-definido.
                    </p>
                  </div>
                  {loadingCasas && <Loader2 className="w-4 h-4 animate-spin text-[#0071e3]" />}
                </div>

                {casasAcolhida.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {casasAcolhida.map((casa, idx) => {
                      const loc = `${casa.cidade || casa.localidade || ''}${casa.uf ? `/${casa.uf}` : ''}`;
                      return (
                        <div
                          key={casa.id}
                          style={staggerStyle(idx)}
                          className="bg-white dark:bg-[#161617] rounded-[24px] border border-[#d6d6d6]/60 dark:border-white/10 p-6 flex flex-col justify-between hover:border-[#0071e3]/40 dark:hover:border-[#2997ff]/40 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.02)] motion-stagger-item motion-lift"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#f5f5f7] dark:bg-[#262628] text-[#1d1d1f] dark:text-[#f5f5f7] border border-[#d6d6d6]/60 dark:border-white/10">
                                {casa.tipo || 'Casa / Obra'}
                              </span>
                              <span className="text-xs text-[#707070] dark:text-[#86868b] font-medium flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#0071e3]" />
                                {loc}
                              </span>
                            </div>

                            <h4 className="text-[16px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight mb-2">
                              {casa.nome}
                            </h4>

                            {casa.endereco && (
                              <p className="text-[12px] text-[#707070] dark:text-[#86868b] line-clamp-2 mb-3 leading-relaxed">
                                {casa.endereco}
                              </p>
                            )}

                            <div className="space-y-1 text-[11px] text-[#707070] dark:text-[#86868b]">
                              {casa.telefone && (
                                <div className="flex items-center gap-1.5">
                                  <Phone className="w-3 h-3 text-[#707070]" />
                                  <span>{casa.telefone}</span>
                                </div>
                              )}
                              {casa.email && (
                                <div className="flex items-center gap-1.5 truncate">
                                  <Mail className="w-3 h-3 text-[#707070] shrink-0" />
                                  <span className="truncate">{casa.email}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pt-5 mt-4 border-t border-[#d6d6d6]/40 dark:border-white/5">
                            <a
                              href={`/inscricao?casa=${encodeURIComponent(casa.nome)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 px-4 rounded-full bg-[#f5f5f7] dark:bg-[#262628] hover:bg-[#0071e3] hover:text-white dark:hover:bg-[#0071e3] text-[#1d1d1f] dark:text-[#f5f5f7] text-[13px] font-medium transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#d6d6d6]/60 dark:border-white/10 group"
                            >
                              <span>Solicitar Estadia Nesta Casa</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#707070] dark:text-[#86868b] bg-white dark:bg-[#161617] rounded-[24px] border border-[#d6d6d6]/60 dark:border-white/10 p-6">
                    {loadingCasas ? 'Carregando casas da Província BRM...' : 'Nenhuma casa ou obra listada no momento.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Leitor Oficial de Documentos Provinciais */}
      {documentoLeitura && (
        <LeitorDocumentoModal
          documento={documentoLeitura}
          onClose={() => setDocumentoLeitura(null)}
        />
      )}

    </div>
  );
};

export default PortalReligioso;

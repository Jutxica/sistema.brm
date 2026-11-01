import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, Lock, Mail, Phone, Calendar, BookOpen, FileText,
  Hotel, LogOut, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff,
  Home, Clock, ExternalLink, ArrowRight, ArrowLeft,
  ChevronDown, Printer, MapPin, Download, Search, X, Menu
} from 'lucide-react';
import MeuPerfilReligioso from '../MeuPerfilReligioso';
import AnuarioBRM from '../AnuarioBRM';
import CadastroReligiosoPublico from '../CadastroReligiosoPublico';
import { validateCpf } from '../../lib/cpf';
import FichaCanonicaPDF from './FichaCanonicaPDF';
import type { DocumentoProvincial, CategoriaDocumento, EventoProvincial, FormularioSecretaria, RespostaFormulario } from '../../types/secretaria';
import type { CasaAcolhida } from '../../types/obra';
import type { ReligiosoPortalData } from '../../types/religioso';
import { staggerStyle } from '../../hooks/useMotion';
import { FormularioTimbrado } from '../../components/FormularioTimbrado';
import { LeitorDocumentoModal } from '../../components/LeitorDocumentoModal';
import { downloadArquivo } from '../../lib/downloadHelper';
import { showToast } from '../../hooks/useFeedback';
import { getPortalRedirectUrl, getPasswordResetRedirectUrl } from '../../lib/portalUrls';
import { AgendaVisualizacao } from '../../components/AgendaVisualizacao';
import { PortalInicioTab } from './tabs/PortalInicioTab';
import { PortalCalendarioTab } from './tabs/PortalCalendarioTab';
import { PortalDocumentosTab } from './tabs/PortalDocumentosTab';
import { PortalHospedagemTab } from './tabs/PortalHospedagemTab';
import { PortalLogin } from './PortalLogin';
import { PortalPrimeiroAcessoSenha } from './PortalPrimeiroAcessoSenha';
import { atribuirNomeReligioso } from '../../lib/religiosoNome';

export type PortalSection = 'inicio' | 'perfil' | 'inscricao' | 'ficha-pdf' | 'calendario' | 'documentos' | 'anuario' | 'hospedagem';


const getRegistrationErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Não foi possível iniciar o Cadastro BRM. Tente novamente ou contate a Secretaria Provincial.';
};

const dataElencoHoje = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });

export const PortalReligioso: React.FC = () => {
  const { user, loading: authLoadingProfile, logout, refreshUserProfile } = useAuth();


  const [profileError, setProfileError] = useState<string | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (recoveryPassword.length < 6) {
      showToast.error('A senha deve possuir no mínimo 6 caracteres.');
      return;
    }
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: recoveryPassword });
      if (error) throw error;
      setRecoveryMode(false);
      setRecoveryPassword('');
      showToast.success('Senha atualizada com sucesso.');
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : 'Não foi possível atualizar a senha.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Active View inside Member Area: 'inicio' | 'perfil' | 'inscricao' | 'ficha-pdf' | 'calendario' | 'documentos' | 'anuario' | 'hospedagem'
  const [activeSection, setActiveSection] = useState<PortalSection>('inicio');

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
  const [eventoVisualizacao, setEventoVisualizacao] = useState<'lista' | 'calendario' | 'quadro'>('lista');

  // Formulários & Inscrições Canônicas da Secretaria
  const [formulariosSecretaria, setFormulariosSecretaria] = useState<FormularioSecretaria[]>([]);
  const [formulariosError, setFormulariosError] = useState(false);
  const [respostasInscricoes, setRespostasInscricoes] = useState<RespostaFormulario[]>([]);
  const [eventoInscricaoModal, setEventoInscricaoModal] = useState<EventoProvincial | null>(null);
  const [formularioInscricaoAtivo, setFormularioInscricaoAtivo] = useState<FormularioSecretaria | null>(null);
  const [salvandoInscricao, setSalvandoInscricao] = useState(false);



  // Dropdown de Persona / Perfil SaaS
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const mobileMoreCloseRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Religious Profile Data
  const [religiosoData, setReligiosoData] = useState<ReligiosoPortalData | null>(null);
  const [registrationOpening, setRegistrationOpening] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // E2E Preview Mode for Member Portal
  const isE2E = import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem('brm_e2e_preview') === 'true';
  const canAccessPortal = Boolean(
    isE2E || (user?.status === 'Ativo' && (user.isAdmin || user.religiosoStatusCadastro === 'Aprovado')),
  );



  // Carregar perfil do religioso conectado
  const loadMemberData = React.useCallback(async () => {
    if (!user && !isE2E) return;
    await Promise.resolve();
    setProfileError(null);

    try {
      if (isE2E) {
        setReligiosoData({
          nome_religioso: 'Pe. Carlos Eduardo, SCJ',
          nome_civil: 'Carlos Eduardo da Silva',
          grau: 'Padre',
          status_cadastro: 'Em revisão',
          comunidade_atual_nome: 'Sede Provincial – Seminário Sagrado Coração de Jesus, Corupá/SC',
          email_institucional: 'pe.carlos@brm.org.br',
        });
        return;
      }

      const [officialResult, profileResult] = await Promise.all([
        supabase
          .from('religiosos')
          .select('*')
          .eq('auth_user_id', user!.id)
          .maybeSingle(),
        supabase
          .from('portal_perfis_religiosos')
          .select('*')
          .eq('auth_user_id', user!.id)
          .maybeSingle(),
      ]);
      if (officialResult.error) throw officialResult.error;
      if (profileResult.error) throw profileResult.error;

      const officialData = officialResult.data;
      const profile = profileResult.data;
      const profileData = profile ? {
        nome_civil: profile.nome_civil,
        nome_religioso: profile.nome_religioso,
        grau: profile.grau,
        foto_path: profile.foto_path,
        comunidade_atual_nome: profile.comunidade_atual_nome,
        email_institucional: profile.email_institucional,
        whatsapp: profile.whatsapp,
        telefone_celular: profile.telefone_celular,
      } : {};
      const data = officialData || profile ? { ...(officialData || {}), ...profileData } : null;
      if (data) {
        let comunidadeAtual = data.comunidade_atual_nome || '';
        if (officialData?.situacao_elenco === 'Ausente') {
          comunidadeAtual = 'Ausente da Congregação';
        } else if (officialData?.id) {
          const { data: designacoes, error: designacoesError } = await supabase
            .from('religiosos_designacoes')
            .select('tipo_vinculo,vigencia_inicio,vigencia_fim,comunidades(nome),religiosos_obras_referencia(nome)')
            .eq('religioso_id', officialData.id);
          if (designacoesError) {
            console.error('Não foi possível carregar as designações atuais do Elenco:', designacoesError);
          } else if (designacoes?.length) {
            const hoje = dataElencoHoje();
            const atuais = designacoes.filter(item =>
              (!item.vigencia_inicio || item.vigencia_inicio <= hoje)
              && (!item.vigencia_fim || item.vigencia_fim >= hoje)
            );
            const designacao = ['residencia', 'estudos', 'juridico']
              .map(tipo => atuais.find(item => item.tipo_vinculo === tipo))
              .find(Boolean) || atuais[0];
            comunidadeAtual = designacao
              ? designacao.comunidades?.[0]?.nome || designacao.religiosos_obras_referencia?.[0]?.nome || ''
              : '';
          } else {
            comunidadeAtual = '';
          }
        }
        let fotoUrl = '';
        if (data.foto_path) {
          const { data: signedPhoto, error: photoError } = await supabase.storage
            .from('religiosos-perfil')
            .createSignedUrl(data.foto_path, 60 * 60);
          if (photoError) throw photoError;
          fotoUrl = signedPhoto.signedUrl;
        }
        setReligiosoData({ ...data, comunidade_atual_nome: comunidadeAtual, foto_url: fotoUrl });
        if (officialData?.id && user?.id) {
          const { data: savedDraft, error: draftError } = await supabase
            .from('religiosos_rascunhos')
            .select('id')
            .eq('usuario_id', user.id)
            .eq('chave', `member:${officialData.id}`)
            .maybeSingle();
          if (draftError) {
            console.error('Não foi possível verificar o rascunho da ficha do Portal do Confrade:', draftError);
            setRegistrationError('Não foi possível verificar se há um rascunho da ficha. Você ainda pode abrir o Cadastro BRM pelo menu.');
          } else if (savedDraft) {
            setActiveSection('inscricao');
          }
        }
      } else {
        setReligiosoData(null);
      }
      setProfileError(null);
    } catch (err) {
      console.error(err);
      setReligiosoData(null);
      setProfileError(err instanceof Error
        ? err.message
        : 'Não foi possível localizar seu cadastro. Entre em contato com a Secretaria Provincial.');
    }
  }, [isE2E, user]);

  const openRegistration = async () => {
    setActiveSection('inscricao');
    setRegistrationError(null);

    if (isE2E) return;
    if (!user?.id) {
      setRegistrationError('Entre novamente no portal para iniciar o Cadastro BRM.');
      return;
    }

    setRegistrationOpening(true);
    try {
      if (!religiosoData?.id) {
        const { data: religiosoId, error: linkError } = await supabase.rpc('ensure_religious_portal_profile');
        if (linkError) throw linkError;
        if (typeof religiosoId !== 'string' || !religiosoId) {
          throw new Error('Não foi possível localizar ou iniciar sua ficha. Contate a Secretaria Provincial.');
        }

        const { data: officialData, error: officialError } = await supabase
          .from('religiosos')
          .select('*')
          .eq('id', religiosoId)
          .single();
        if (officialError) throw officialError;
        setReligiosoData(officialData);
      }
      await refreshUserProfile(user.id);
    } catch (err) {
      console.error('Erro ao iniciar Cadastro BRM:', err);
      setRegistrationError(getRegistrationErrorMessage(err));
    } finally {
      setRegistrationOpening(false);
    }
  };

  // Carregar Casas e Obras oficiais da Província BRM para Hospedagem
  useEffect(() => {
    if (!canAccessPortal) return;

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
  }, [canAccessPortal]);

  // Carregar Documentos Oficiais e Agenda da Província BRM
  useEffect(() => {
    if (!canAccessPortal) return;

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
          .eq('publicado_portal', true)
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
  }, [canAccessPortal]);

  useEffect(() => {
    if (user || isE2E) {
      void Promise.resolve().then(loadMemberData);
    }
  }, [isE2E, loadMemberData, user]);

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

  const getCategoriaCor = () => {
    return 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  const getTipoCor = () => {
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

      const [, mesF, diaF] = fim.split('-');
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
  const hoje = dataElencoHoje();
  const proximoEvento = eventos
    .filter(evt => !['Concluído', 'Cancelado'].includes(evt.status) && (evt.data_fim || evt.data_inicio) >= hoje)
    .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio))[0];
  const documentoRecente = [...documentos].sort((a, b) => b.data_documento.localeCompare(a.data_documento))[0];

  const navigateToSection = (section: PortalSection) => {
    if (section === 'inscricao') {
      void openRegistration();
    } else {
      setActiveSection(section);
    }
    setMobileMoreOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!mobileMoreOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    mobileMoreCloseRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMoreOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMoreOpen]);



  if (user && authLoadingProfile && !isE2E) {
    return (
      <div className="religious-portal flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#707070] dark:text-[#a1a1a6]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Verificando autorização do portal...</span>
        </div>
      </div>
    );
  }

  // Se o usuário NÃO estiver autenticado (e não em preview): Tela Institucional de Entrada do Confrade
  if (!user && !isE2E) {
    return (
      <PortalLogin
        onSuccess={async (userId) => {
          await refreshUserProfile(userId);
          setActiveSection('inicio');
        }}
      />
    );
  }

  // SE O USUÁRIO PRECISA DEFINIR A SENHA DEFINITIVA NO 1º ACESSO:
  if (user?.precisaTrocarSenha) {
    return (
      <PortalPrimeiroAcessoSenha
        confradeNome={religiosoData?.nome_religioso || religiosoData?.nome_civil || user.nome}
        onSuccess={async () => {
          await refreshUserProfile(user.id);
        }}
        onLogout={logout}
      />
    );
  }

  // USUÁRIO AUTENTICADO: RENDERIZA O SITE DA ÁREA DE MEMBROS (APPLE FORMAT)
  const displayName = religiosoData?.nome_civil || user?.nome || 'Religioso Dehoniano';
  const displayGrau = religiosoData?.grau || 'Religioso SCJ';
  const displayReligiousName = atribuirNomeReligioso(displayGrau, displayName) || religiosoData?.nome_religioso || '';
  const registrationStatus = religiosoData?.status_cadastro || user?.religiosoStatusCadastro;
  const canContinueRegistration = [
    'Em revisão',
    'Em verificação',
    'Aguardando complementação',
  ].includes(registrationStatus || '');

  if (user && !canAccessPortal) {
    const refreshPortalAccess = async () => {
      setRegistrationOpening(true);
      setRegistrationError(null);
      try {
        await loadMemberData();
        await refreshUserProfile(user.id);
      } finally {
        setRegistrationOpening(false);
      }
    };

    if (
      activeSection === 'inscricao'
      && religiosoData?.id
      && canContinueRegistration
    ) {
      return (
        <div className="religious-portal min-h-screen px-3 py-6 sm:px-6 sm:py-8">
          <main className="mx-auto max-w-5xl space-y-4">
            <button
              type="button"
              onClick={() => setActiveSection('inicio')}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d6d6d6] bg-white px-4 text-sm font-medium text-[#203136] transition-colors hover:bg-[#f5f5f7] dark:border-white/10 dark:bg-[#161617] dark:text-[#edf2f1] dark:hover:bg-[#262628]"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao status do cadastro
            </button>
            <CadastroReligiosoPublico
              memberMode
              religiosoId={religiosoData.id}
              onSaved={async () => {
                await Promise.all([
                  loadMemberData(),
                  refreshUserProfile(user.id),
                ]);
                setActiveSection('inicio');
              }}
            />
          </main>
        </div>
      );
    }

    return (
      <div className="religious-portal flex min-h-screen flex-col font-sans text-[#203136] dark:text-[#edf2f1]">
        <header className="portal-header flex items-center justify-between border-b px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <img src="/logo-sistema.png" alt="Província BRM" className="h-10 w-auto dark:hidden" />
            <img src="/logo-branco.png" alt="Província BRM" className="hidden h-10 w-auto dark:block" />
            <div>
              <p className="text-sm font-semibold">Portal do Religioso</p>
              <p className="text-xs text-[#707070] dark:text-[#a1a1a6]">{displayName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d6d6d6] px-4 text-sm font-medium text-[#203136] transition-colors hover:bg-[#f5f5f7] dark:border-white/10 dark:text-[#edf2f1] dark:hover:bg-[#262628]"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </header>

        <main className="mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-10">
          <section className="w-full rounded-xl border border-[#d6d6d6]/70 bg-white p-6 shadow-[0_16px_48px_rgba(17,50,64,0.08)] dark:border-white/10 dark:bg-[#161617] sm:p-9">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f5f5f7] px-3 py-1.5 text-xs font-semibold text-[#226380] dark:bg-[#262628] dark:text-[#a3c3c7]">
              {registrationStatus === 'Aprovado' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              {registrationStatus || 'Vínculo não localizado'}
            </span>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
              {registrationStatus === 'Aprovado'
                ? 'Seu cadastro foi aprovado'
                : 'Acesso reservado aos religiosos aprovados'}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#62666a] dark:text-[#a1a1a6]">
              {canContinueRegistration
                ? 'Enquanto a Secretaria confere sua ficha, você pode completar ou corrigir o Cadastro BRM. As demais áreas do portal serão liberadas após a aprovação.'
                : registrationStatus === 'Aprovado'
                  ? 'Atualize a autorização da sua conta para carregar as áreas liberadas do portal.'
                  : registrationStatus
                    ? 'Para esclarecer ou regularizar o status da ficha, entre em contato com a Secretaria Provincial.'
                    : 'Sua conta foi autenticada, mas ainda não há uma ficha religiosa vinculada. Inicie o Cadastro BRM para que a Secretaria possa conferir seu vínculo.'}
            </p>

            {(profileError || registrationError) && (
              <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-[#ffc9c9] bg-[#fff2f2] p-3 text-sm text-[#c92a2a] dark:border-[#5c1c24] dark:bg-[#321417] dark:text-[#ff8787]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{registrationError || profileError}</span>
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {canContinueRegistration || !registrationStatus ? (
                <button
                  type="button"
                  disabled={registrationOpening}
                  onClick={() => {
                    if (religiosoData?.id && canContinueRegistration) {
                      setActiveSection('inscricao');
                    } else {
                      void openRegistration();
                    }
                  }}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#113240] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#174657] disabled:cursor-wait disabled:opacity-60 dark:bg-[#226380] dark:hover:bg-[#2b7897]"
                >
                  {registrationOpening
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <FileText className="h-4 w-4" />}
                  {religiosoData?.id ? 'Continuar Cadastro BRM' : 'Iniciar Cadastro BRM'}
                </button>
              ) : null}
              <button
                type="button"
                disabled={registrationOpening}
                onClick={() => void refreshPortalAccess()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#d6d6d6] px-5 text-sm font-semibold text-[#203136] transition-colors hover:bg-[#f5f5f7] disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:text-[#edf2f1] dark:hover:bg-[#262628]"
              >
                {registrationOpening && <Loader2 className="h-4 w-4 animate-spin" />}
                Verificar status novamente
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // Se o confrade estiver preenchendo a ficha oficial de inscrição de um evento (Página Completa - Sem Modal)
  if (eventoInscricaoModal && formularioInscricaoAtivo) {
    return (
      <div className="religious-portal min-h-screen py-6 sm:py-8 px-3 sm:px-6">
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
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-mono uppercase font-semibold text-slate-700 dark:text-slate-300 hover:text-[#226380] dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[6px] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Painel do Religioso</span>
              </button>
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-[#226380] tracking-wider block">
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
                return { protocolo: savedResponse.protocolo };
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
    <div className="religious-portal min-h-screen flex flex-col font-sans transition-colors duration-200">
      
      {/* 1. BARRA SUPERIOR (HEADER APPLE FROSTED GLASS) */}
      <header className="portal-header sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 sm:px-8">
        
        {/* Lado Esquerdo: Identidade do Portal */}
        <div className="portal-header-brand flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex shrink-0 items-center justify-center">
            <img src="/logo-sistema.png" alt="Província BRM" className="h-10 w-auto select-none object-contain dark:hidden sm:h-12" />
            <img src="/logo-branco.png" alt="Província BRM" className="hidden h-10 w-auto select-none object-contain dark:block sm:h-12" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center">
              <span className="portal-brand-title font-cinzel text-base sm:text-lg md:text-xl font-bold tracking-[0.08em] uppercase text-[#113240] dark:text-white">
                Província BRM
              </span>
            </div>
            <span className="portal-brand-caption font-cinzel mt-0.5 block truncate text-[9px] sm:text-[10px] tracking-[0.14em] uppercase text-[#61767e] dark:text-[#a0aeaf]">
              Portal do Religioso
            </span>
          </div>
        </div>

        {/* Lado Direito: Botão de Persona / Avatar Dropdown (SaaS Profissional) */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              data-testid="persona-menu-button"
              aria-label={`Menu da conta de ${displayName}`}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="portal-persona-trigger motion-press flex items-center gap-2.5 rounded-full pl-1.5 pr-3 py-1.5 transition-all cursor-pointer group"
            >
              {/* Avatar do Confrade */}
              <div className="portal-persona-avatar flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-xs font-semibold">
                {religiosoData?.foto_url ? (
                  <img src={religiosoData.foto_url} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <span>{displayName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              
              <div className="hidden max-w-48 flex-col text-left sm:flex">
                <span className="portal-persona-name truncate text-xs font-semibold leading-tight">
                  {displayName}
                </span>
                <span className="portal-persona-detail mt-0.5 max-w-48 truncate text-[10px] leading-tight font-normal">
                  {[displayReligiousName, displayGrau].filter(Boolean).join(' · ')}
                </span>
              </div>

              <ChevronDown className={`portal-persona-chevron h-3.5 w-3.5 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu Dropdown Flutuante Apple/SaaS */}
            {userMenuOpen && (
              <div 
                data-testid="persona-dropdown-menu"
                className="motion-dropdown absolute right-0 mt-2 w-72 rounded-xl bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl border border-[#d6d6d6]/60 dark:border-white/10 shadow-[0_16px_40px_rgba(17,50,64,0.12)] p-2 z-50"
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
                    {displayReligiousName && <span className="text-[11px] text-[#707070] dark:text-[#86868b] block truncate">
                      {displayReligiousName} · {displayGrau}
                    </span>}
                    <span className="text-[11px] text-[#707070] dark:text-[#86868b] block truncate">
                      {religiosoData?.email_institucional || user?.email}
                    </span>
                    <span className="inline-block px-2 py-0.5 mt-1 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-[#226380]/10 text-[#226380]">
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
                    <div className="w-7 h-7 rounded-[10px] bg-[#f5f5f7] dark:bg-[#2c2c2e] group-hover:bg-[#226380]/10 flex items-center justify-center text-[#707070] group-hover:text-[#226380] transition-colors shrink-0">
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
                     setUserMenuOpen(false);
                     void openRegistration();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-[14px] text-left text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] transition-colors cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-[10px] bg-[#f5f5f7] dark:bg-[#2c2c2e] group-hover:bg-[#226380]/10 flex items-center justify-center text-[#707070] group-hover:text-[#226380] transition-colors shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold block">{registrationMenuLabel}</span>
                      <span className="text-[10px] text-[#707070] dark:text-[#86868b] block font-normal">
                        Ficha oficial em 6 etapas
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
                    <div className="w-7 h-7 rounded-[10px] bg-[#f5f5f7] dark:bg-[#2c2c2e] group-hover:bg-[#226380]/10 flex items-center justify-center text-[#707070] group-hover:text-[#226380] transition-colors shrink-0">
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

                {user?.acessos && user.acessos.some(a => ['secretaria', 'religiosos', 'obras', 'patrimonio', 'configuracoes'].includes(a)) && (
                  <>
                    <div className="my-1.5 border-t border-[#d6d6d6]/40 dark:border-white/5" />
                    <a
                      href="https://sistema.brm.org.br"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-[14px] text-left text-xs font-medium text-[#226380] dark:text-[#A3C3C7] hover:bg-[#226380]/10 transition-colors cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-[10px] bg-[#226380]/10 flex items-center justify-center text-[#226380] dark:text-[#A3C3C7] shrink-0">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold block">Painel da Secretaria</span>
                        <span className="text-[10px] text-[#707070] dark:text-[#86868b] block font-normal">
                          Acessar sistema.brm.org.br
                        </span>
                      </div>
                    </a>
                  </>
                )}

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
      <div className="flex-1 flex flex-col md:flex-row max-w-[1400px] w-full mx-auto px-3 sm:px-6 pt-3 pb-28 md:py-6 gap-6 items-stretch md:items-start">
        {/* SIDEBAR APPLE (DESKTOP) */}
        <aside className="portal-navigation w-64 shrink-0 hidden md:block space-y-8 rounded-2xl p-4 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">
          
          <div className="space-y-2">
            <span className="font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#61767e] dark:text-[#a0aeaf] px-3 mb-2 block">
              Navegação do Membro
            </span>

            <button
              type="button"
              onClick={() => setActiveSection('inicio')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg font-cinzel text-xs font-semibold tracking-wider uppercase transition-all duration-200 text-left cursor-pointer ${
                activeSection === 'inicio'
                  ? 'bg-white dark:bg-[#161617] text-[#226380] dark:text-[#A3C3C7] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#d6d6d6]/40 dark:border-white/5 font-semibold'
                  : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-white/60 dark:hover:bg-[#161617]/60'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Painel do Religioso</span>
            </button>

            <button
              type="button"
              data-testid="nav-item-inscricao"
              onClick={() => void openRegistration()}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg font-cinzel text-xs font-semibold tracking-wider uppercase transition-all duration-200 text-left cursor-pointer ${
                activeSection === 'inscricao'
                  ? 'bg-white dark:bg-[#161617] text-[#226380] dark:text-[#A3C3C7] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#d6d6d6]/40 dark:border-white/5 font-semibold'
                  : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-white/60 dark:hover:bg-[#161617]/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Cadastro BRM</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('calendario')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg font-cinzel text-xs font-semibold tracking-wider uppercase transition-all duration-200 text-left cursor-pointer ${
                activeSection === 'calendario'
                  ? 'bg-white dark:bg-[#161617] text-[#226380] dark:text-[#A3C3C7] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#d6d6d6]/40 dark:border-white/5 font-semibold'
                  : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-white/60 dark:hover:bg-[#161617]/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendário & Agenda</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('documentos')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg font-cinzel text-xs font-semibold tracking-wider uppercase transition-all duration-200 text-left cursor-pointer ${
                activeSection === 'documentos'
                  ? 'bg-white dark:bg-[#161617] text-[#226380] dark:text-[#A3C3C7] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#d6d6d6]/40 dark:border-white/5 font-semibold'
                  : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-white/60 dark:hover:bg-[#161617]/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Documentos Oficiais</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('anuario')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg font-cinzel text-xs font-semibold tracking-wider uppercase transition-all duration-200 text-left cursor-pointer ${
                activeSection === 'anuario'
                  ? 'bg-white dark:bg-[#161617] text-[#226380] dark:text-[#A3C3C7] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#d6d6d6]/40 dark:border-white/5 font-semibold'
                  : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-white/60 dark:hover:bg-[#161617]/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Elenco BRM</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('hospedagem')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg font-cinzel text-xs font-semibold tracking-wider uppercase transition-all duration-200 text-left cursor-pointer ${
                activeSection === 'hospedagem'
                  ? 'bg-white dark:bg-[#161617] text-[#226380] dark:text-[#A3C3C7] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#d6d6d6]/40 dark:border-white/5 font-semibold'
                  : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-white/60 dark:hover:bg-[#161617]/60'
              }`}
            >
              <Hotel className="w-4 h-4" />
              <span>Pedir Hospedagem</span>
            </button>
          </div>

          <div>
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
        <main className="w-full flex-1 min-w-0 space-y-6">
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
              <p className="font-semibold">Não foi possível carregar os dados da sua conta.</p>
              <p className="mt-1">{profileError}</p>
            </div>
          )}
          
          {/* SEÇÃO: INÍCIO / PAINEL DO CONFRADE */}
          {activeSection === 'inicio' && (
            <PortalInicioTab
              religiosoData={religiosoData}
              displayName={displayName}
              hasCompletedRegistration={hasCompletedRegistration}
              registrationMenuLabel={registrationMenuLabel}
              displayGrau={displayGrau}
              userEmail={user?.email}
              proximoEvento={proximoEvento}
              documentoRecente={documentoRecente}
              documentos={documentos}
              eventos={eventos}
              navigateToSection={navigateToSection}
              openRegistration={openRegistration}
              formatPeriodo={formatPeriodo}
              getCategoriaCor={getCategoriaCor}
              getTipoCor={getTipoCor}
              onLerDocumento={(doc) => setDocumentoLeitura(doc)}
            />
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
                  <span>Voltar ao Painel do Religioso</span>
                </button>
              </div>
              <MeuPerfilReligioso isPortal={true} onSaved={loadMemberData} />
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
                  <span>Voltar ao Painel do Religioso</span>
                </button>
              </div>
              <div className="bg-white dark:bg-[#161617] rounded-xl border border-[#d6d6d6]/60 dark:border-white/10 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#707070] dark:text-[#86868b] block mb-1">
                  Secretaria Provincial BRM
                </span>
                <h3 className="text-[18px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                  {hasCompletedRegistration ? 'Atualizar Dados Canônicos (Ficha Oficial)' : 'Ficha Cadastral Oficial da Província (6 Etapas)'}
                </h3>
                <p className="text-xs sm:text-sm text-[#707070] dark:text-[#86868b] font-normal mt-1 leading-relaxed">
                  Preencha ou revise a qualquer momento todos os dados canônicos, histórico de comunidades e anexos comprobatórios.
                </p>
              </div>
              {registrationOpening ? (
                <div role="status" className="flex items-center gap-3 rounded-[6px] border border-[#226380]/20 bg-white p-5 text-sm text-[#40565e] dark:bg-[#161617] dark:text-[#c5c5c7]">
                  <Loader2 className="h-5 w-5 animate-spin text-[#226380]" />
                  Preparando sua Ficha Cadastral Oficial...
                </div>
              ) : registrationError ? (
                <div role="alert" className="rounded-[6px] border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  <p>{registrationError}</p>
                  <button
                    type="button"
                    onClick={() => void openRegistration()}
                    className="mt-3 rounded-[6px] border border-amber-500/40 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  >
                    Tentar novamente
                  </button>
                  <p className="mt-3 text-xs">
                    Se o problema continuar, contate a Secretaria Provincial pelo e-mail{' '}
                    <a className="underline" href="mailto:secretaria@brm.org.br">secretaria@brm.org.br</a>.
                  </p>
                </div>
              ) : religiosoData?.id ? (
                <CadastroReligiosoPublico
                  memberMode
                  religiosoId={religiosoData.id}
                  onSaved={() => {
                    setActiveSection('inicio');
                    void loadMemberData();
                  }}
                />
              ) : (
                <div role="status" className="rounded-[6px] border border-[#d6d6d6]/60 bg-white p-5 text-sm text-[#40565e] dark:bg-[#161617] dark:text-[#c5c5c7] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span>Inicie o Cadastro BRM pelo menu do usuário ou pelo botão ao lado.</span>
                  <button
                    type="button"
                    onClick={() => void openRegistration()}
                    disabled={registrationOpening}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#226380] text-white text-xs font-semibold rounded-lg hover:bg-[#1a4b60] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {registrationOpening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                    <span>Iniciar Cadastro BRM</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SEÇÃO: MINHA FICHA COMPLETA (PDF ESTILO OFICIAL) */}
          {activeSection === 'ficha-pdf' && (
            <FichaCanonicaPDF onBack={() => setActiveSection('inicio')} />
          )}

          {/* SEÇÃO: ELENCO BRM */}
          {activeSection === 'anuario' && (
            <div className="space-y-4">
              <div>
                <button
                  type="button"
                  onClick={() => setActiveSection('inicio')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#161617] border border-[#d6d6d6]/60 dark:border-white/10 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#262628] transition-all cursor-pointer shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao Painel do Religioso</span>
                </button>
              </div>
              <AnuarioBRM />
            </div>
          )}

          {/* SEÇÃO: CALENDÁRIO & AGENDA */}
          {activeSection === 'calendario' && (
            <PortalCalendarioTab
              eventos={eventos}
              eventosFiltrados={eventosFiltrados}
              loadingEventos={loadingEventos}
              eventosError={eventosError}
              eventoVisualizacao={eventoVisualizacao}
              setEventoVisualizacao={setEventoVisualizacao}
              eventoFiltroTipo={eventoFiltroTipo}
              setEventoFiltroTipo={setEventoFiltroTipo}
              eventoSearch={eventoSearch}
              setEventoSearch={setEventoSearch}
              onVoltar={() => setActiveSection('inicio')}
              formatPeriodo={formatPeriodo}
              getTipoCor={getTipoCor}
              respostasInscricoes={respostasInscricoes}
              formulariosSecretaria={formulariosSecretaria}
              formulariosError={formulariosError}
              religiosoData={religiosoData}
              userEmail={user?.email}
              onAbrirInscricao={(evt, form) => {
                setEventoInscricaoModal(evt);
                setFormularioInscricaoAtivo(form);
              }}
            />
          )}

          {/* SEÇÃO: DOCUMENTOS OFICIAIS */}
          {activeSection === 'documentos' && (
            <PortalDocumentosTab
              documentos={documentos}
              documentosFiltrados={documentosFiltrados}
              loadingDocumentos={loadingDocumentos}
              documentosError={documentosError}
              docSearch={docSearch}
              setDocSearch={setDocSearch}
              docCategoria={docCategoria}
              setDocCategoria={setDocCategoria}
              categoriasOficiais={CATEGORIAS_OFICIAIS}
              onVoltar={() => setActiveSection('inicio')}
              onLerDocumento={(doc) => setDocumentoLeitura(doc)}
              formatData={formatData}
              formatFileSize={formatFileSize}
              getCategoriaCor={getCategoriaCor}
            />
          )}

          {/* SEÇÃO: PEDIR HOSPEDAGEM */}
          {activeSection === 'hospedagem' && (
            <PortalHospedagemTab
              casasAcolhida={casasAcolhida}
              loadingCasas={loadingCasas}
              onVoltar={() => setActiveSection('inicio')}
            />
          )}
        </main>
      </div>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d6d6d6]/70 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-[#161617]/95 md:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {([
            { id: 'inicio', label: 'Início', icon: Home },
            { id: 'inscricao', label: 'Cadastro BRM', icon: FileText },
            { id: 'calendario', label: 'Agenda', icon: Calendar },
          ] as const).map(item => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => navigateToSection(item.id)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#226380] ${
                  active ? 'text-[#226380] dark:text-[#A3C3C7]' : 'text-[#707070] dark:text-[#a1a1a6]'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            aria-expanded={mobileMoreOpen}
            aria-haspopup="dialog"
            aria-label="Abrir mais opções do portal"
            onClick={() => setMobileMoreOpen(true)}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#226380] ${
              mobileMoreOpen || ['perfil', 'ficha-pdf', 'documentos', 'anuario', 'hospedagem'].includes(activeSection)
                ? 'text-[#226380] dark:text-[#A3C3C7]'
                : 'text-[#707070] dark:text-[#a1a1a6]'
            }`}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span>Mais</span>
          </button>
        </div>
      </nav>

      {mobileMoreOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/35 md:hidden"
          onClick={() => setMobileMoreOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
            className="max-h-[85dvh] w-full overflow-y-auto overscroll-contain rounded-t-[28px] border border-[#d6d6d6]/70 bg-[#f5f5f7] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl dark:border-white/10 dark:bg-[#1c1c1e]"
            onClick={event => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#c7c7cc] dark:bg-white/20" />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 id="mobile-more-title" className="text-base font-semibold text-[#1d1d1f] dark:text-white">Mais opções</h2>
                <p className="mt-0.5 text-xs text-[#707070] dark:text-[#a1a1a6]">Serviços e informações da Província</p>
              </div>
              <button
                type="button"
                aria-label="Fechar menu"
                ref={mobileMoreCloseRef}
                onClick={() => setMobileMoreOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#707070] hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#226380] dark:text-[#a1a1a6] dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'perfil', label: 'Meu perfil', icon: User },
                { id: 'documentos', label: 'Documentos', icon: FileText },
                { id: 'ficha-pdf', label: 'Minha ficha', icon: Printer },
                { id: 'anuario', label: 'Elenco BRM', icon: BookOpen },
                { id: 'hospedagem', label: 'Hospedagem', icon: Hotel },
              ] as const).map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateToSection(item.id)}
                    className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#d6d6d6]/60 bg-white px-3 text-left text-sm font-medium text-[#1d1d1f] transition-colors hover:border-[#226380]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#226380] dark:border-white/10 dark:bg-[#262628] dark:text-white"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#226380] dark:text-[#A3C3C7]" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileMoreOpen(false);
                logout();
              }}
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-600 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair da conta
            </button>
          </section>
        </div>
      )}

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

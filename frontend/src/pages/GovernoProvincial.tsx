import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Church,
  CircleAlert,
  Copy,
  Crown,
  Edit3,
  ExternalLink,
  FileText,
  Filter,
  History,
  Info,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { confirmAction, showToast } from '../hooks/useFeedback';
import { atribuirNomeReligioso, formatarComunidadeReligiosa } from '../lib/religiosoNome';
import { formatarDataBR } from '../utils/dateUtils';
import {
  CARGOS_GOVERNO_PADRAO,
  type CargoGoverno,
  type MembroGovernoProvincial,
  type ReligiosoFichaGov,
  type StatusMembroGoverno,
} from '../types/governoProvincial';

const PASTAS_SUGERIDAS = [
  'Formação Inicial & Seminários',
  'Pastoral Vocacional & Juventude',
  'Paróquias, Santuários & Obras',
  'Educação, Colégios & Faculdades',
  'Administração, Finanças & Patrimônio',
  'Vida Religiosa, Espiritualidade & Saúde',
  'Comunicação, Cultura & Dehonianidade',
  'Apostolado Social & Missões',
];

const TRIENIOS_PADRAO = ['2024 - 2027', '2027 - 2030', '2021 - 2024', '2018 - 2021'];

export const GovernoProvincial: React.FC = () => {
  const [tabAtiva, setTabAtiva] = useState<'vigente' | 'cadastro' | 'historico'>('vigente');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [tabelaExiste, setTabelaExiste] = useState(true);

  // Dados do banco
  const [membros, setMembros] = useState<MembroGovernoProvincial[]>([]);
  const [religiosos, setReligiosos] = useState<ReligiosoFichaGov[]>([]);

  // Filtros
  const [trienioSelecionado, setTrienioSelecionado] = useState<string>('2024 - 2027');
  const [buscaReligioso, setBuscaReligioso] = useState('');
  const [buscaHistorico, setBuscaHistorico] = useState('');

  // Formulário de Cadastro / Edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cargoSelecionado, setCargoSelecionado] = useState<CargoGoverno>('Superior Provincial');
  const [religiosoSelecionadoId, setReligiosoSelecionadoId] = useState<string>('');
  const [trienioForm, setTrienioForm] = useState<string>('2024 - 2027');
  const [dataPosse, setDataPosse] = useState<string>('');
  const [dataTermino, setDataTermino] = useState<string>('');
  const [statusMandato, setStatusMandato] = useState<StatusMembroGoverno>('Vigente');
  const [tipoAto, setTipoAto] = useState<string>('Capítulo Provincial');
  const [numeroAtoDecreto, setNumeroAtoDecreto] = useState<string>('');
  const [dataAtoDecreto, setDataAtoDecreto] = useState<string>('');
  const [areasResponsabilidade, setAreasResponsabilidade] = useState<string>('');
  const [emailInstitucionalGov, setEmailInstitucionalGov] = useState<string>('');
  const [telefoneInstitucionalGov, setTelefoneInstitucionalGov] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [sincronizarElenco, setSincronizarElenco] = useState<boolean>(true);

  // Confrade Selecionado (dados puxados do banco)
  const religiosoSelecionado = useMemo(() => {
    return religiosos.find(r => r.id === religiosoSelecionadoId) || null;
  }, [religiosos, religiosoSelecionadoId]);

  // Carregar dados
  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Carregar religiosos do banco
      const { data: relData, error: relErr } = await supabase
        .from('religiosos')
        .select(`
          id,
          numero_cadastro,
          grau,
          nome_civil,
          nome_religioso,
          nome_elenco,
          cpf,
          data_nascimento,
          comunidade_atual_nome,
          obra_atual_nome,
          email_institucional,
          email_pessoal,
          telefone_celular,
          whatsapp,
          foto_path,
          status,
          status_cadastro,
          situacao_elenco
        `)
        .order('nome_civil', { ascending: true });

      if (relErr) {
        console.warn('Erro ao carregar religiosos:', relErr.message);
      } else if (relData) {
        setReligiosos(relData as ReligiosoFichaGov[]);
      }

      // 2. Carregar membros do Governo Provincial
      const { data: govData, error: govErr } = await supabase
        .from('governo_provincial')
        .select(`
          *,
          religiosos (
            id,
            numero_cadastro,
            grau,
            nome_civil,
            nome_religioso,
            nome_elenco,
            cpf,
            data_nascimento,
            comunidade_atual_nome,
            obra_atual_nome,
            email_institucional,
            email_pessoal,
            telefone_celular,
            whatsapp,
            foto_path
          )
        `)
        .order('ordem_precedencia', { ascending: true })
        .order('created_at', { ascending: false });

      if (govErr) {
        if (govErr.code === '42P01' || govErr.message.includes('does not exist')) {
          setTabelaExiste(false);
          console.warn('Tabela governo_provincial não encontrada no banco. Exibindo banner de ativação.');
        } else {
          showToast.error(`Não foi possível carregar o Governo Provincial: ${govErr.message}`);
        }
      } else if (govData) {
        setTabelaExiste(true);
        const formatados: MembroGovernoProvincial[] = govData.map((item: any) => ({
          ...item,
          religioso: item.religiosos || null,
        }));
        setMembros(formatados);
      }
    } catch (err: any) {
      console.error('Falha geral ao carregar governo:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  // Lista de Triênios presentes nos dados
  const trieniosDisponiveis = useMemo(() => {
    const set = new Set<string>(TRIENIOS_PADRAO);
    membros.forEach(m => {
      if (m.trienio) set.add(m.trienio);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [membros]);

  // Membros filtrados para o Triênio Selecionado (Vigentes ou Mandato em foco)
  const membrosDoTrienio = useMemo(() => {
    return membros.filter(m => m.trienio === trienioSelecionado);
  }, [membros, trienioSelecionado]);

  // Mapa de cargos preenchidos no triênio
  const mapaMembrosPorCargo = useMemo(() => {
    const mapa = new Map<CargoGoverno, MembroGovernoProvincial>();
    membrosDoTrienio.forEach(m => {
      if (!mapa.has(m.cargo) || m.status === 'Vigente') {
        mapa.set(m.cargo, m);
      }
    });
    return mapa;
  }, [membrosDoTrienio]);

  // Religiosos filtrados para seleção no formulário
  const religiososFiltrados = useMemo(() => {
    const termo = buscaReligioso.toLowerCase().trim();
    if (!termo) return religiosos.slice(0, 50);
    return religiosos.filter(r => {
      const civil = (r.nome_civil || '').toLowerCase();
      const rel = (r.nome_religioso || '').toLowerCase();
      const com = (r.comunidade_atual_nome || '').toLowerCase();
      const grau = (r.grau || '').toLowerCase();
      return civil.includes(termo) || rel.includes(termo) || com.includes(termo) || grau.includes(termo);
    }).slice(0, 40);
  }, [religiosos, buscaReligioso]);

  // Histórico de Mandatos Filtrado
  const historicoFiltrado = useMemo(() => {
    let lista = membros;
    if (buscaHistorico.trim()) {
      const termo = buscaHistorico.toLowerCase().trim();
      lista = lista.filter(m => {
        const nomeCivil = (m.religioso?.nome_civil || '').toLowerCase();
        const nomeRel = (m.religioso?.nome_religioso || '').toLowerCase();
        const cargo = (m.cargo || '').toLowerCase();
        const trienio = (m.trienio || '').toLowerCase();
        const dec = (m.numero_ato_decreto || '').toLowerCase();
        return nomeCivil.includes(termo) || nomeRel.includes(termo) || cargo.includes(termo) || trienio.includes(termo) || dec.includes(termo);
      });
    }
    return lista;
  }, [membros, buscaHistorico]);

  // Preencher formulário para editar
  const handleEditar = (membro: MembroGovernoProvincial) => {
    setEditingId(membro.id);
    setCargoSelecionado(membro.cargo);
    setReligiosoSelecionadoId(membro.religioso_id);
    setTrienioForm(membro.trienio);
    setDataPosse(membro.data_posse || '');
    setDataTermino(membro.data_termino || '');
    setStatusMandato(membro.status);
    setTipoAto(membro.tipo_ato || 'Capítulo Provincial');
    setNumeroAtoDecreto(membro.numero_ato_decreto || '');
    setDataAtoDecreto(membro.data_ato_decreto || '');
    setAreasResponsabilidade(membro.areas_responsabilidade || '');
    setEmailInstitucionalGov(membro.email_institucional_governo || '');
    setTelefoneInstitucionalGov(membro.telefone_institucional_governo || '');
    setObservacoes(membro.observacoes || '');
    setSincronizarElenco(membro.sincronizar_elenco !== false);
    setTabAtiva('cadastro');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Limpar formulário
  const handleLimparFormulario = () => {
    setEditingId(null);
    setCargoSelecionado('Superior Provincial');
    setReligiosoSelecionadoId('');
    setTrienioForm(trienioSelecionado || '2024 - 2027');
    setDataPosse('');
    setDataTermino('');
    setStatusMandato('Vigente');
    setTipoAto('Capítulo Provincial');
    setNumeroAtoDecreto('');
    setDataAtoDecreto('');
    setAreasResponsabilidade('');
    setEmailInstitucionalGov('');
    setTelefoneInstitucionalGov('');
    setObservacoes('');
    setSincronizarElenco(true);
    setBuscaReligioso('');
  };

  // Iniciar cadastro direto para um cargo específico
  const handleIniciarDesignacaoCargo = (cargo: CargoGoverno) => {
    handleLimparFormulario();
    setCargoSelecionado(cargo);
    setTrienioForm(trienioSelecionado);
    setTabAtiva('cadastro');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Salvar membro do governo
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!religiosoSelecionadoId) {
      showToast.error('Selecione o religioso cadastrado no banco.');
      return;
    }
    if (!cargoSelecionado) {
      showToast.error('Selecione o cargo no Governo Provincial.');
      return;
    }
    if (!trienioForm.trim()) {
      showToast.error('Informe o triênio do mandato.');
      return;
    }

    const ordem = CARGOS_GOVERNO_PADRAO.find(c => c.cargo === cargoSelecionado)?.ordem || 10;

    const payload = {
      religioso_id: religiosoSelecionadoId,
      cargo: cargoSelecionado,
      ordem_precedencia: ordem,
      trienio: trienioForm.trim(),
      data_posse: dataPosse || null,
      data_termino: dataTermino || null,
      status: statusMandato,
      tipo_ato: tipoAto || null,
      numero_ato_decreto: numeroAtoDecreto.trim() || null,
      data_ato_decreto: dataAtoDecreto || null,
      areas_responsabilidade: areasResponsabilidade.trim() || null,
      email_institucional_governo: emailInstitucionalGov.trim() || null,
      telefone_institucional_governo: telefoneInstitucionalGov.trim() || null,
      observacoes: observacoes.trim() || null,
      sincronizar_elenco: sincronizarElenco,
      updated_at: new Date().toISOString(),
    };

    setSalvando(true);
    try {
      if (editingId) {
        // Atualizar
        const { error } = await supabase
          .from('governo_provincial')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        showToast.success(`Membro do Governo Provincial (${cargoSelecionado}) atualizado com sucesso!`);
      } else {
        // Inserir
        const { error } = await supabase
          .from('governo_provincial')
          .insert(payload);

        if (error) throw error;
        showToast.success(`Membro do Governo Provincial (${cargoSelecionado}) cadastrado com sucesso!`);
      }

      // Sincronizar designação canônica no elenco se solicitado e se vigente
      if (sincronizarElenco && statusMandato === 'Vigente') {
        try {
          const anoVigencia = dataPosse ? new Date(dataPosse).getFullYear() : new Date().getFullYear();
          await supabase.from('religiosos_designacoes').insert({
            religioso_id: religiosoSelecionadoId,
            funcao: cargoSelecionado,
            tipo_vinculo: 'governo',
            vigencia_inicio: dataPosse || new Date().toISOString().slice(0, 10),
            ano_referencia: anoVigencia,
            numero_decreto: numeroAtoDecreto.trim() || null,
            data_decreto: dataAtoDecreto || null,
            observacoes: `Designação canônica automática: Governo Provincial (${trienioForm.trim()})`,
          });
        } catch (syncErr) {
          console.warn('Designação canônica secundária não inserida (opcional):', syncErr);
        }
      }

      await carregarDados();
      handleLimparFormulario();
      setTabAtiva('vigente');
    } catch (err: any) {
      console.error('Erro ao salvar membro do governo:', err);
      showToast.error(`Não foi possível salvar o membro do governo: ${err.message || 'Erro inesperado'}`);
    } finally {
      setSalvando(false);
    }
  };

  // Excluir membro
  const handleExcluir = async (id: string, cargo: string, nome: string) => {
    const confirmou = await confirmAction({
      title: 'Excluir Membro do Governo',
      message: `Deseja realmente remover ${nome} da função de ${cargo}?`,
      confirmLabel: 'Sim, excluir',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    });

    if (!confirmou) return;

    try {
      const { error } = await supabase
        .from('governo_provincial')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast.success(`Registro de ${cargo} removido com sucesso.`);
      await carregarDados();
    } catch (err: any) {
      showToast.error(`Erro ao excluir: ${err.message}`);
    }
  };

  // Alternar tag de pasta sugerida
  const handleTogglePasta = (pasta: string) => {
    const current = areasResponsabilidade ? areasResponsabilidade.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (current.includes(pasta)) {
      setAreasResponsabilidade(current.filter(p => p !== pasta).join(', '));
    } else {
      setAreasResponsabilidade([...current, pasta].join(', '));
    }
  };

  // Copiar script SQL
  const handleCopiarSql = () => {
    const sql = `CREATE TABLE IF NOT EXISTS public.governo_provincial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  religioso_id UUID NOT NULL REFERENCES public.religiosos(id) ON DELETE RESTRICT,
  cargo TEXT NOT NULL,
  ordem_precedencia INTEGER NOT NULL DEFAULT 1,
  trienio TEXT NOT NULL DEFAULT '2024 - 2027',
  data_posse DATE,
  data_termino DATE,
  status TEXT NOT NULL DEFAULT 'Vigente',
  tipo_ato TEXT DEFAULT 'Capítulo Provincial',
  numero_ato_decreto TEXT,
  data_ato_decreto DATE,
  areas_responsabilidade TEXT,
  email_institucional_governo TEXT,
  telefone_institucional_governo TEXT,
  documento_ato_url TEXT,
  observacoes TEXT,
  sincronizar_elenco BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.governo_provincial ENABLE ROW LEVEL SECURITY;
CREATE POLICY governo_provincial_all ON public.governo_provincial FOR ALL USING (true);`;
    navigator.clipboard.writeText(sql);
    showToast.success('Script SQL copiado para a área de transferência!');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* CABEÇALHO INSTITUCIONAL */}
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[11px] font-cinzel font-semibold uppercase tracking-[0.16em] text-[#226380] dark:text-[#A3C3C7]">
              Secretaria Provincial • Cúria BRM
            </p>
          </div>
          <h1 className="font-cinzel text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
            Governo Provincial
          </h1>
          <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Superior Provincial, Conselho Provincial e Oficiais de Cúria da Província São Paulo Apóstolo (Dehonianos).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor do Triênio */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm dark:border-slate-700 dark:bg-[#161b22]">
            <span className="text-[10px] font-cinzel uppercase tracking-wider text-slate-400 mr-2 font-semibold">
              Triênio:
            </span>
            <select
              value={trienioSelecionado}
              onChange={e => setTrienioSelecionado(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#113240] dark:text-white focus:outline-none cursor-pointer"
            >
              {trieniosDisponiveis.map(t => (
                <option key={t} value={t} className="text-slate-800 dark:text-slate-200 dark:bg-slate-900">
                  {t}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#161b22] dark:text-slate-200 cursor-pointer"
            title="Imprimir quadro solene do Governo"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Imprimir Quadro</span>
          </button>

          <button
            type="button"
            onClick={carregarDados}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#161b22] dark:text-slate-200 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              handleLimparFormulario();
              setTabAtiva('cadastro');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#113240] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1a4a5e] dark:bg-sky-600 dark:hover:bg-sky-500 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Cadastrar Membro</span>
          </button>
        </div>
      </header>

      {/* ALERTA CASO A TABELA NÃO EXISTA NO SUPABASE */}
      {!tabelaExiste && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <CircleAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Tabela do Governo Provincial pendente de criação
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  Execute o script <code className="font-mono bg-amber-100 px-1 py-0.5 rounded dark:bg-amber-900/50">CRIAR_TABELA_GOVERNO_PROVINCIAL.sql</code> no SQL Editor do Supabase para persistência direta.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopiarSql}
              className="inline-flex items-center gap-1.5 rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-amber-700 cursor-pointer shrink-0"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copiar Script SQL</span>
            </button>
          </div>
        </div>
      )}

      {/* ABAS DA PÁGINA */}
      <nav className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setTabAtiva('vigente')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-cinzel font-semibold uppercase tracking-wider transition cursor-pointer shrink-0 ${
            tabAtiva === 'vigente'
              ? 'bg-[#113240] text-white shadow dark:bg-white dark:text-slate-900'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Governo Vigente ({trienioSelecionado})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabAtiva('cadastro')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-cinzel font-semibold uppercase tracking-wider transition cursor-pointer shrink-0 ${
            tabAtiva === 'cadastro'
              ? 'bg-[#113240] text-white shadow dark:bg-white dark:text-slate-900'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Plus className="h-4 w-4" />
          <span>{editingId ? 'Editar Membro do Governo' : 'Cadastrar / Designar Membro'}</span>
        </button>

        <button
          type="button"
          onClick={() => setTabAtiva('historico')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-cinzel font-semibold uppercase tracking-wider transition cursor-pointer shrink-0 ${
            tabAtiva === 'historico'
              ? 'bg-[#113240] text-white shadow dark:bg-white dark:text-slate-900'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Histórico de Triênios & Mandatos</span>
          <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {membros.length}
          </span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* ABA 1: GOVERNO PROVINCIAL VIGENTE (ORGANOGRAMA E CARDS OFICIAIS)         */}
      {/* ========================================================================= */}
      {tabAtiva === 'vigente' && (
        <section className="space-y-6">
          {/* Card Resumo do Triênio */}
          <div className="rounded-xl border border-sky-200/80 bg-gradient-to-r from-sky-50 via-white to-sky-50/50 p-4 sm:p-5 shadow-sm dark:border-sky-900/40 dark:bg-gradient-to-r dark:from-sky-950/20 dark:via-[#161b22] dark:to-sky-950/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-cinzel text-base font-bold text-slate-900 dark:text-white">
                    Composição Oficial do Triênio {trienioSelecionado}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Província São Paulo Apóstolo • Congregação dos Padres do Sagrado Coração de Jesus
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  {mapaMembrosPorCargo.size} de 7 cargos definidos
                </span>
              </div>
            </div>
          </div>

          {/* 1. SUPERIOR PROVINCIAL (DESTAQUE MÁXIMO) */}
          {(() => {
            const superior = mapaMembrosPorCargo.get('Superior Provincial');
            return (
              <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300/80 bg-gradient-to-b from-amber-50/40 to-white p-5 sm:p-7 shadow-sm dark:border-amber-700/50 dark:bg-gradient-to-b dark:from-amber-950/20 dark:to-[#161b22]">
                <div className="absolute top-0 right-0 rounded-bl-xl bg-amber-400/90 px-3 py-1 text-[10px] font-cinzel font-bold uppercase tracking-wider text-amber-950 shadow-sm">
                  Liderança Provincial
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-5">
                  {/* Foto ou Brasão */}
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-400 bg-amber-100/70 text-amber-900 shadow-md dark:border-amber-600 dark:bg-amber-950/60 dark:text-amber-200">
                    {superior?.religioso?.foto_path ? (
                      <img
                        src={superior.religioso.foto_path}
                        alt="Foto Superior"
                        className="h-full w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <Landmark className="h-10 w-10 text-amber-800 dark:text-amber-300" />
                    )}
                  </div>

                  {/* Dados do Superior */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-cinzel font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                        Superior Provincial
                      </span>
                      {superior?.status && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {superior.status}
                        </span>
                      )}
                    </div>

                    {superior ? (
                      <>
                        <h2 className="font-cinzel text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                          {atribuirNomeReligioso(superior.religioso?.grau, superior.religioso?.nome_civil) || superior.religioso?.nome_civil}
                        </h2>
                        {superior.religioso?.nome_civil && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Nome civil: <span className="font-medium text-slate-700 dark:text-slate-300">{superior.religioso.nome_civil}</span>
                            {superior.religioso?.comunidade_atual_nome && (
                              <span> · Residência: {formatarComunidadeReligiosa(superior.religioso.comunidade_atual_nome)}</span>
                            )}
                          </p>
                        )}

                        <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                          {superior.numero_ato_decreto && (
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              <FileText className="h-3.5 w-3.5 text-amber-600" />
                              {superior.numero_ato_decreto}
                            </span>
                          )}
                          {superior.data_posse && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              Posse: {formatarDataBR(superior.data_posse)}
                            </span>
                          )}
                          {superior.email_institucional_governo && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Mail className="h-3.5 w-3.5 text-sky-600" />
                              {superior.email_institucional_governo}
                            </span>
                          )}
                        </div>

                        {superior.observacoes && (
                          <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">
                            "{superior.observacoes}"
                          </p>
                        )}
                      </>
                    ) : (
                      <div>
                        <h3 className="font-cinzel text-lg font-semibold text-slate-400">
                          Superior Provincial não designado para este triênio
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Clique abaixo para cadastrar a ata de eleição ou decreto canônico.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex md:flex-col items-center gap-2 shrink-0">
                    {superior ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEditar(superior)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#161b22] dark:text-slate-200 cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>
                        {superior.religioso_id && (
                          <Link
                            to={`/religiosos/${superior.religioso_id}/dossie`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#113240] shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#161b22] dark:text-sky-300"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Ver Dossiê</span>
                          </Link>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleIniciarDesignacaoCargo('Superior Provincial')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow transition hover:bg-amber-700 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Designar Superior</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 2. CONSELHO PROVINCIAL (4 CONSELHEIROS) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
              <h3 className="font-cinzel text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-[#226380] dark:text-sky-400" />
                <span>Conselho Provincial</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                4 Conselheiros Canônicos
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(['1º Conselheiro', '2º Conselheiro', '3º Conselheiro', '4º Conselheiro'] as CargoGoverno[]).map(cargo => {
                const conselheiro = mapaMembrosPorCargo.get(cargo);
                const isVigario = cargo === '1º Conselheiro';

                return (
                  <div
                    key={cargo}
                    className={`flex flex-col justify-between rounded-xl border p-4 shadow-sm transition ${
                      conselheiro
                        ? 'border-slate-200 bg-white hover:border-[#226380]/60 dark:border-slate-800 dark:bg-[#161b22]'
                        : 'border-dashed border-slate-300 bg-slate-50/60 dark:border-slate-800 dark:bg-[#161b22]/40'
                    }`}
                  >
                    <div>
                      {/* Topo do card com cargo */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="font-cinzel text-xs font-bold text-[#113240] dark:text-sky-300">
                          {cargo}
                        </span>
                        {isVigario && (
                          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                            Vigário Prov.
                          </span>
                        )}
                      </div>

                      {conselheiro ? (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2.5">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-semibold dark:bg-slate-800 dark:text-slate-300">
                              <User className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                                {atribuirNomeReligioso(conselheiro.religioso?.grau, conselheiro.religioso?.nome_civil) || conselheiro.religioso?.nome_civil}
                              </h4>
                              {conselheiro.religioso?.nome_civil && (
                                <p className="text-[11px] text-slate-400 truncate">
                                  {conselheiro.religioso.nome_civil}
                                </p>
                              )}
                            </div>
                          </div>

                          {conselheiro.religioso?.comunidade_atual_nome && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              <span className="truncate">{formatarComunidadeReligiosa(conselheiro.religioso.comunidade_atual_nome)}</span>
                            </p>
                          )}

                          {conselheiro.areas_responsabilidade && (
                            <div className="mt-2 rounded bg-sky-50/80 p-2 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
                              <span className="text-[10px] font-semibold uppercase text-sky-800 dark:text-sky-300 block mb-0.5">
                                Pastas / Setores:
                              </span>
                              <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-2">
                                {conselheiro.areas_responsabilidade}
                              </p>
                            </div>
                          )}

                          {conselheiro.email_institucional_governo && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                              <span className="truncate">{conselheiro.email_institucional_governo}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-400">
                          <Users className="mx-auto h-8 w-8 opacity-40 mb-1" />
                          <p className="text-xs font-medium">Cargo Vago no Triênio</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      {conselheiro ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEditar(conselheiro)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#17485b] hover:underline dark:text-sky-300 cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Editar</span>
                          </button>
                          {conselheiro.religioso_id && (
                            <Link
                              to={`/religiosos/${conselheiro.religioso_id}/dossie`}
                              target="_blank"
                              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                              title="Ver dossiê do confrade"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleIniciarDesignacaoCargo(cargo)}
                          className="w-full inline-flex items-center justify-center gap-1 rounded bg-slate-100 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Designar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. OFICIAIS DE CÚRIA (SECRETÁRIO E ECÔNOMO PROVINCIAL) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
              <h3 className="font-cinzel text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#226380] dark:text-sky-400" />
                <span>Oficiais de Cúria Provincial</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                Chancelaria & Economato
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {(['Secretário Provincial', 'Ecônomo Provincial'] as CargoGoverno[]).map(cargo => {
                const oficial = mapaMembrosPorCargo.get(cargo);
                const isSec = cargo === 'Secretário Provincial';

                return (
                  <div
                    key={cargo}
                    className={`flex flex-col justify-between rounded-xl border p-5 shadow-sm transition ${
                      oficial
                        ? 'border-slate-200 bg-white hover:border-[#226380]/60 dark:border-slate-800 dark:bg-[#161b22]'
                        : 'border-dashed border-slate-300 bg-slate-50/60 dark:border-slate-800 dark:bg-[#161b22]/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-3">
                        <span className="font-cinzel text-sm font-bold text-[#113240] dark:text-sky-300">
                          {cargo}
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {isSec ? 'Chancelaria & Atos' : 'Economato & Patrimônio'}
                        </span>
                      </div>

                      {oficial ? (
                        <div className="space-y-2.5">
                          <div className="flex items-start gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-semibold dark:bg-slate-800 dark:text-slate-300">
                              {isSec ? <FileText className="h-5 w-5 text-[#226380]" /> : <Landmark className="h-5 w-5 text-emerald-700" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-slate-900 dark:text-white text-base truncate">
                                {atribuirNomeReligioso(oficial.religioso?.grau, oficial.religioso?.nome_civil) || oficial.religioso?.nome_civil}
                              </h4>
                              {oficial.religioso?.nome_civil && (
                                <p className="text-xs text-slate-400 truncate">
                                  {oficial.religioso.nome_civil}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-1 text-xs text-slate-600 dark:text-slate-300 pt-1">
                            {oficial.religioso?.comunidade_atual_nome && (
                              <p className="text-slate-500 dark:text-slate-400">
                                <span>{formatarComunidadeReligiosa(oficial.religioso.comunidade_atual_nome)}</span>
                              </p>
                            )}
                            {oficial.email_institucional_governo && (
                              <p className="flex items-center gap-1.5 font-mono text-[11px]">
                                <Mail className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                                <span>{oficial.email_institucional_governo}</span>
                              </p>
                            )}
                            {oficial.telefone_institucional_governo && (
                              <p className="flex items-center gap-1.5 text-[11px]">
                                <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span>{oficial.telefone_institucional_governo}</span>
                              </p>
                            )}
                            {oficial.numero_ato_decreto && (
                              <p className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                                <FileText className="h-3.5 w-3.5 shrink-0" />
                                <span>Provisão: {oficial.numero_ato_decreto}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-400">
                          <User className="mx-auto h-8 w-8 opacity-40 mb-1" />
                          <p className="text-xs font-medium">Oficial não designado para este triênio</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      {oficial ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEditar(oficial)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#17485b] hover:underline dark:text-sky-300 cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Editar</span>
                          </button>
                          {oficial.religioso_id && (
                            <Link
                              to={`/religiosos/${oficial.religioso_id}/dossie`}
                              target="_blank"
                              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                              title="Ver dossiê do confrade"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleIniciarDesignacaoCargo(cargo)}
                          className="w-full inline-flex items-center justify-center gap-1 rounded bg-slate-100 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Designar {cargo}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: FORMULÁRIO DE CADASTRO / DESIGNAÇÃO DO GOVERNO                     */}
      {/* ========================================================================= */}
      {tabAtiva === 'cadastro' && (
        <form onSubmit={handleSalvar} className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800 gap-2 mb-6">
              <div>
                <h3 className="font-cinzel text-lg font-bold text-slate-900 dark:text-white">
                  {editingId ? 'Editar Membro do Governo Provincial' : 'Designar Confrade para o Governo Provincial'}
                </h3>
                <p className="text-xs text-slate-500">
                  Selecione o confrade cadastrado no banco. Os dados individuais já existentes serão puxados automaticamente.
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={handleLimparFormulario}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Cancelar edição</span>
                </button>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* COLUNA ESQUERDA: CARGO & BUSCA DO CONFRADE CADASTRADO */}
              <div className="space-y-5">
                {/* 1. SELEÇÃO DO CARGO */}
                <div>
                  <label className="block text-xs font-cinzel font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    1. Cargo Canônico no Governo Provincial *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CARGOS_GOVERNO_PADRAO.map(item => {
                      const selecionado = cargoSelecionado === item.cargo;
                      return (
                        <button
                          key={item.cargo}
                          type="button"
                          onClick={() => setCargoSelecionado(item.cargo)}
                          className={`flex items-center justify-between p-3 rounded-lg border text-left text-xs transition cursor-pointer ${
                            selecionado
                              ? 'border-[#113240] bg-[#113240] text-white shadow dark:border-white dark:bg-white dark:text-slate-900'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-[#12161f] dark:text-slate-300'
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{item.cargo}</p>
                            <p className="text-[10px] opacity-75">{item.categoria}</p>
                          </div>
                          {selecionado && <Check className="h-4 w-4 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. SELEÇÃO DO CONFRADE CADASTRADO NO BANCO */}
                <div>
                  <label className="block text-xs font-cinzel font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    2. Confrade (Religioso Cadastrado) *
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Digite para filtrar confrades por nome civil, nome religioso, grau ou comunidade:
                  </p>

                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar confrade cadastrado..."
                      value={buscaReligioso}
                      onChange={e => setBuscaReligioso(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 shadow-sm focus:border-[#226380] focus:ring-1 focus:ring-[#226380] dark:border-slate-700 dark:bg-[#12161f] dark:text-white"
                    />
                    {buscaReligioso && (
                      <button
                        type="button"
                        onClick={() => setBuscaReligioso('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100 dark:border-slate-800 dark:divide-slate-800/80 bg-white dark:bg-[#12161f]">
                    {religiososFiltrados.map(rel => {
                      const isSelected = religiosoSelecionadoId === rel.id;
                      const nomeRel = atribuirNomeReligioso(rel.grau, rel.nome_civil) || rel.nome_civil;

                      return (
                        <button
                          key={rel.id}
                          type="button"
                          onClick={() => setReligiosoSelecionadoId(rel.id)}
                          className={`w-full flex items-center justify-between p-2.5 text-left text-xs transition cursor-pointer ${
                            isSelected
                              ? 'bg-sky-50 dark:bg-sky-950/40 text-[#113240] dark:text-white font-semibold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="truncate font-semibold">{nomeRel}</p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {rel.nome_civil} · {rel.grau} {rel.comunidade_atual_nome ? `· ${formatarComunidadeReligiosa(rel.comunidade_atual_nome)}` : ''}
                            </p>
                          </div>
                          {isSelected ? (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#113240] text-white text-[10px]">
                              ✓
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Selecionar</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. CARD DOS DADOS PUXADOS DO BANCO (SEM REPETIÇÃO) */}
                {religiosoSelecionado ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Dados Verificados na Ficha Individual
                      </span>
                      <Link
                        to={`/religiosos/${religiosoSelecionado.id}/dossie`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 underline dark:text-emerald-400"
                      >
                        <span>Abrir Dossiê</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold dark:bg-emerald-900/60 dark:text-emerald-200">
                        <UserCheck className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {atribuirNomeReligioso(religiosoSelecionado.grau, religiosoSelecionado.nome_civil) || religiosoSelecionado.nome_civil}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {religiosoSelecionado.nome_civil} · {religiosoSelecionado.grau}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-emerald-200/60 dark:border-emerald-900/40">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Comunidade Atual:</span>
                        <span className="font-medium">{formatarComunidadeReligiosa(religiosoSelecionado.comunidade_atual_nome) || 'Não informada'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Obra / Atuação:</span>
                        <span className="font-medium">{religiosoSelecionado.obra_atual_nome || 'Comunidade Provincial'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Contato Pessoal:</span>
                        <span className="font-medium">{religiosoSelecionado.telefone_celular || religiosoSelecionado.whatsapp || 'Pendente'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">E-mail:</span>
                        <span className="font-medium truncate block">{religiosoSelecionado.email_institucional || religiosoSelecionado.email_pessoal || 'Pendente'}</span>
                      </div>
                    </div>

                    <p className="text-[10px] italic text-emerald-800/80 dark:text-emerald-300/80">
                      ✓ Nenhuma destas informações pessoais precisará ser redigitada.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-slate-400 text-xs dark:border-slate-800">
                    <Info className="mx-auto h-5 w-5 mb-1 opacity-50" />
                    <span>Selecione um confrade acima para carregar os dados cadastrais.</span>
                  </div>
                )}
              </div>

              {/* COLUNA DIREITA: DADOS ESPECÍFICOS DO GOVERNO PROVINCIAL */}
              <div className="space-y-4">
                <h4 className="text-xs font-cinzel font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
                  3. Informações Canônicas do Mandato
                </h4>

                {/* Triênio & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Triênio do Mandato *
                    </label>
                    <input
                      type="text"
                      value={trienioForm}
                      onChange={e => setTrienioForm(e.target.value)}
                      placeholder="Ex: 2024 - 2027"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-[#226380] focus:ring-1 focus:ring-[#226380] dark:border-slate-700 dark:bg-[#12161f] dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Situação do Mandato *
                    </label>
                    <select
                      value={statusMandato}
                      onChange={e => setStatusMandato(e.target.value as StatusMembroGoverno)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-[#226380] focus:ring-1 focus:ring-[#226380] dark:border-slate-700 dark:bg-[#12161f] dark:text-white cursor-pointer"
                    >
                      <option value="Vigente">Vigente (Em Exercício)</option>
                      <option value="Concluído">Mandato Concluído / Emérito</option>
                      <option value="Renúncia">Renúncia / Término Antecipado</option>
                      <option value="Interino">Interino / Provedor</option>
                    </select>
                  </div>
                </div>

                {/* Datas de Posse e Término */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Data da Posse Canônica
                    </label>
                    <input
                      type="date"
                      value={dataPosse}
                      onChange={e => setDataPosse(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-[#226380] focus:ring-1 focus:ring-[#226380] dark:border-slate-700 dark:bg-[#12161f] dark:text-white cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Término Previsto / Efetivo
                    </label>
                    <input
                      type="date"
                      value={dataTermino}
                      onChange={e => setDataTermino(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-[#226380] focus:ring-1 focus:ring-[#226380] dark:border-slate-700 dark:bg-[#12161f] dark:text-white cursor-pointer"
                    />
                  </div>
                </div>

                {/* Ato Canônico de Eleição / Nomeação */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-[#12161f]/50 space-y-3">
                  <span className="text-[11px] font-semibold text-[#113240] dark:text-sky-300 uppercase tracking-wider block">
                    Ato de Eleição ou Nomeação Canônica
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Origem do Ato</label>
                      <select
                        value={tipoAto}
                        onChange={e => setTipoAto(e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="Capítulo Provincial">Capítulo Provincial</option>
                        <option value="Governo Geral Roma">Governo Geral (Roma)</option>
                        <option value="Decreto Provincial">Decreto Provincial</option>
                        <option value="Provisão Canônica">Provisão Canônica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Ata / Decreto / Nº</label>
                      <input
                        type="text"
                        value={numeroAtoDecreto}
                        onChange={e => setNumeroAtoDecreto(e.target.value)}
                        placeholder="Ex: Ata Cap. Prov. nº 01"
                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Data do Ato</label>
                      <input
                        type="date"
                        value={dataAtoDecreto}
                        onChange={e => setDataAtoDecreto(e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Pastas e Áreas de Responsabilidade */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Pastas e Áreas de Responsabilidade na Província
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PASTAS_SUGERIDAS.map(pasta => {
                      const ativa = areasResponsabilidade.includes(pasta);
                      return (
                        <button
                          key={pasta}
                          type="button"
                          onClick={() => handleTogglePasta(pasta)}
                          className={`rounded px-2 py-0.5 text-[10px] font-medium transition cursor-pointer border ${
                            ativa
                              ? 'border-[#113240] bg-[#113240] text-white dark:border-white dark:bg-white dark:text-slate-900'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {ativa ? `✓ ${pasta}` : `+ ${pasta}`}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={areasResponsabilidade}
                    onChange={e => setAreasResponsabilidade(e.target.value)}
                    placeholder="Ex: Formação Inicial & Seminários, Juventude Dehoniana"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-[#226380] focus:ring-1 focus:ring-[#226380] dark:border-slate-700 dark:bg-[#12161f] dark:text-white"
                  />
                </div>

                {/* Contatos Institucionais do Cargo na Cúria */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      E-mail Institucional do Cargo (Cúria)
                    </label>
                    <input
                      type="email"
                      value={emailInstitucionalGov}
                      onChange={e => setEmailInstitucionalGov(e.target.value)}
                      placeholder="Ex: provincial@dehonianos.org.br"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-[#226380] focus:ring-1 focus:ring-[#226380] dark:border-slate-700 dark:bg-[#12161f] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Telefone / Ramal da Cúria Provincial
                    </label>
                    <input
                      type="text"
                      value={telefoneInstitucionalGov}
                      onChange={e => setTelefoneInstitucionalGov(e.target.value)}
                      placeholder="Ex: (47) 3375-1194 Ramal 201"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-[#226380] focus:ring-1 focus:ring-[#226380] dark:border-slate-700 dark:bg-[#12161f] dark:text-white"
                    />
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Observações Canônicas e Notas de Governo
                  </label>
                  <textarea
                    rows={2}
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    placeholder="Ex: Eleito para o 2º triênio consecutivo pelo Capítulo Provincial..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-[#226380] focus:ring-1 focus:ring-[#226380] dark:border-slate-700 dark:bg-[#12161f] dark:text-white"
                  />
                </div>

                {/* Checkbox de Sincronização */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="sincronizar_elenco"
                    checked={sincronizarElenco}
                    onChange={e => setSincronizarElenco(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#113240] focus:ring-[#113240] cursor-pointer"
                  />
                  <label htmlFor="sincronizar_elenco" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    Atualizar automaticamente esta função canônica no <strong>Elenco Provincial</strong> e Dossiê.
                  </label>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleLimparFormulario}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Limpar
                  </button>

                  <button
                    type="submit"
                    disabled={salvando}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#113240] px-5 py-2 text-xs font-cinzel font-semibold uppercase tracking-wider text-white shadow transition hover:bg-[#1b4b5f] disabled:opacity-50 cursor-pointer dark:bg-sky-600 dark:hover:bg-sky-500"
                  >
                    {salvando ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>{editingId ? 'Salvar Alterações' : 'Salvar no Governo'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: HISTÓRICO DE MANDATOS & TRIÊNIOS ANTERIORES                        */}
      {/* ========================================================================= */}
      {tabAtiva === 'historico' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-[#161b22]">
            <div>
              <h3 className="font-cinzel text-base font-bold text-slate-900 dark:text-white">
                Histórico Geral de Membros do Governo Provincial
              </h3>
              <p className="text-xs text-slate-500">
                Consulta canônica de mandatos, atas de posse e triênios registrados na Província BRM.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar no histórico..."
                value={buscaHistorico}
                onChange={e => setBuscaHistorico(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-[#12161f] dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-cinzel font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:bg-[#12161f] dark:border-slate-800">
                  <th className="py-3 px-3">Triênio</th>
                  <th className="py-3 px-3">Cargo no Governo</th>
                  <th className="py-3 px-3">Confrade (Nome Religioso & Civil)</th>
                  <th className="py-3 px-3">Período / Posse</th>
                  <th className="py-3 px-3">Ato Canônico</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {historicoFiltrado.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Nenhum registro de mandato encontrado.
                    </td>
                  </tr>
                ) : (
                  historicoFiltrado.map(item => {
                    const nomeRel = atribuirNomeReligioso(item.religioso?.grau, item.religioso?.nome_civil) || item.religioso?.nome_civil || 'Confrade';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                        <td className="py-3 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {item.trienio}
                        </td>

                        <td className="py-3 px-3 font-semibold text-[#113240] dark:text-sky-300">
                          {item.cargo}
                        </td>

                        <td className="py-3 px-3">
                          <strong className="block text-slate-900 dark:text-white">{nomeRel}</strong>
                          {item.religioso?.nome_civil && (
                            <span className="text-[11px] text-slate-400 block">{item.religioso.nome_civil}</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                          {item.data_posse ? formatarDataBR(item.data_posse) : 'Posse inicial'}
                          {item.data_termino ? ` até ${formatarDataBR(item.data_termino)}` : ''}
                        </td>

                        <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-300">
                          <span className="block font-medium">{item.tipo_ato || 'Capítulo'}</span>
                          {item.numero_ato_decreto && (
                            <span className="font-mono text-[10px] text-slate-400">{item.numero_ato_decreto}</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              item.status === 'Vigente'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : item.status === 'Concluído'
                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditar(item)}
                              className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExcluir(item.id, item.cargo, nomeRel)}
                              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default GovernoProvincial;

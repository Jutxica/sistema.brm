import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft, Building2, CalendarDays, Check, ChevronDown, CircleAlert,
  Loader2, Link2, MapPin, Plus, Search, UserRound, Users, X,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { confirmAction, showToast } from '../hooks/useFeedback';

type SituacaoElenco = 'Ativo' | 'Ausente';
type TipoVinculo = 'residencia' | 'juridico' | 'pastoral' | 'funcao' | 'estudos' | 'missao' | 'outro';
type Destino = 'comunidade' | 'obra';

interface Religioso {
  id: string;
  nome_civil: string | null;
  nome_religioso: string | null;
  nome_elenco: string | null;
  cadastro_elenco_provisorio: boolean;
  auth_user_id: string | null;
  grau: string;
  status: string;
  situacao_elenco: SituacaoElenco;
}

interface Comunidade {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
  regiao: string | null;
  status: string;
}

interface Obra {
  id: string;
  nome: string;
  tipo: string;
  cidade: string | null;
  estado: string | null;
  uf: string | null;
  localidade: string | null;
  pais: string;
  pertencimento_elenco: string;
  comunidade_id: string | null;
  status: string;
}

interface Designacao {
  id: string;
  religioso_id: string;
  comunidade_id: string | null;
  obra_id: string | null;
  tipo_vinculo: TipoVinculo;
  funcao: string;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  ano_referencia: number;
}

interface FormularioDesignacao {
  religioso_id: string;
  destino: Destino;
  destino_id: string;
  tipo_vinculo: TipoVinculo;
  funcao: string;
  vigencia_inicio: string;
  encerrar_id: string;
  observacoes: string;
}

const formularioInicial: FormularioDesignacao = {
  religioso_id: '',
  destino: 'obra',
  destino_id: '',
  tipo_vinculo: 'pastoral',
  funcao: '',
  vigencia_inicio: '',
  encerrar_id: '',
  observacoes: '',
};

const tiposVinculo: { value: TipoVinculo; label: string }[] = [
  { value: 'residencia', label: 'Residência' },
  { value: 'juridico', label: 'Vínculo jurídico' },
  { value: 'pastoral', label: 'Função pastoral' },
  { value: 'funcao', label: 'Função institucional' },
  { value: 'estudos', label: 'Estudos / formação' },
  { value: 'missao', label: 'Missão' },
  { value: 'outro', label: 'Outro vínculo' },
];

const dataHoje = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });

const consultarElenco = async () => Promise.all([
  supabase.from('religiosos')
    .select('id,nome_civil,nome_religioso,nome_elenco,cadastro_elenco_provisorio,auth_user_id,grau,status,situacao_elenco')
    .order('nome_elenco')
    .order('nome_civil'),
  supabase.from('comunidades')
    .select('id,nome,cidade,estado,regiao,status')
    .order('nome'),
  supabase.from('religiosos_obras_referencia')
    .select('id,nome,tipo,cidade,estado,uf,localidade,pais,pertencimento_elenco,comunidade_id,status')
    .order('nome'),
  supabase.from('religiosos_designacoes')
    .select('id,religioso_id,comunidade_id,obra_id,tipo_vinculo,funcao,vigencia_inicio,vigencia_fim,ano_referencia'),
]);

type ResultadoElenco = Awaited<ReturnType<typeof consultarElenco>>;

export const ElencoSecretaria: React.FC = () => {
  const [religiosos, setReligiosos] = useState<Religioso[]>([]);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [designacoes, setDesignacoes] = useState<Designacao[]>([]);
  const [query, setQuery] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState<'todos' | SituacaoElenco>('todos');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [religiosoParaVincular, setReligiosoParaVincular] = useState<Religioso | null>(null);
  const [authUserId, setAuthUserId] = useState('');
  const [linking, setLinking] = useState(false);

  const aplicarResultados = useCallback((resultados: ResultadoElenco) => {
    const [religiososResult, comunidadesResult, obrasResult, designacoesResult] = resultados;
    const error = religiososResult.error || comunidadesResult.error || obrasResult.error || designacoesResult.error;
    if (error) {
      showToast.error(`Não foi possível carregar o Elenco: ${error.message}`);
    } else {
      setReligiosos((religiososResult.data || []) as Religioso[]);
      setComunidades((comunidadesResult.data || []) as Comunidade[]);
      setObras((obrasResult.data || []) as Obra[]);
      setDesignacoes((designacoesResult.data || []) as Designacao[]);
    }
  }, []);

  const carregar = useCallback(async () => {
    try {
      const resultados = await consultarElenco();
      aplicarResultados(resultados);
    } catch (error) {
      showToast.error(`Não foi possível carregar o Elenco: ${error instanceof Error ? error.message : 'erro inesperado'}`);
    } finally {
      setLoading(false);
    }
  }, [aplicarResultados]);

  useEffect(() => {
    let cancelado = false;
    const carregarInicial = async () => {
      try {
        const resultados = await consultarElenco();
        if (cancelado) return;
        aplicarResultados(resultados);
      } catch (error) {
        if (!cancelado) showToast.error(`Não foi possível carregar o Elenco: ${error instanceof Error ? error.message : 'erro inesperado'}`);
      } finally {
        if (!cancelado) setLoading(false);
      }
    };
    void carregarInicial();
    return () => { cancelado = true; };
  }, [aplicarResultados]);

  const mapaComunidades = useMemo(() => new Map(comunidades.map(item => [item.id, item])), [comunidades]);
  const mapaObras = useMemo(() => new Map(obras.map(item => [item.id, item])), [obras]);
  const nomeExibido = (religioso: Religioso) => religioso.nome_elenco || religioso.nome_religioso || religioso.nome_civil || 'Nome pendente';
  const hoje = dataHoje();

  const vigentes = useMemo(
    () => designacoes.filter(item =>
      (!item.vigencia_inicio || item.vigencia_inicio <= hoje)
      && (!item.vigencia_fim || item.vigencia_fim >= hoje)
    ),
    [designacoes, hoje],
  );

  const designacoesPorReligioso = useMemo(() => {
    const agrupadas = new Map<string, Designacao[]>();
    for (const item of vigentes) {
      const atuais = agrupadas.get(item.religioso_id) || [];
      atuais.push(item);
      agrupadas.set(item.religioso_id, atuais);
    }
    return agrupadas;
  }, [vigentes]);

  const filtrados = useMemo(() => {
    const termo = query.trim().toLocaleLowerCase('pt-BR');
    return religiosos.filter(religioso => {
      if (filtroSituacao !== 'todos' && religioso.situacao_elenco !== filtroSituacao) return false;
      if (!termo) return true;
      const nomes = [religioso.nome_elenco || '', religioso.nome_civil || '', religioso.nome_religioso || '', religioso.grau];
      const relacoes = designacoesPorReligioso.get(religioso.id) || [];
      const lugares = relacoes.flatMap(item => [
        item.funcao,
        mapaComunidades.get(item.comunidade_id || '')?.nome || '',
        mapaObras.get(item.obra_id || '')?.nome || '',
      ]);
      return [...nomes, ...lugares].join(' ').toLocaleLowerCase('pt-BR').includes(termo);
    });
  }, [religiosos, query, filtroSituacao, designacoesPorReligioso, mapaComunidades, mapaObras]);

  const mudarSituacao = async (religioso: Religioso) => {
    const novaSituacao: SituacaoElenco = religioso.situacao_elenco === 'Ativo' ? 'Ausente' : 'Ativo';
    const confirmado = await confirmAction({
      title: novaSituacao === 'Ausente' ? 'Marcar como ausente' : 'Reativar no Elenco',
      badge: 'Secretaria • Elenco',
      message: novaSituacao === 'Ausente'
        ? `Marcar ${nomeExibido(religioso)} como ausente?`
        : `Reativar ${nomeExibido(religioso)}?`,
      detail: novaSituacao === 'Ausente'
        ? 'As designações não jurídicas vigentes serão encerradas hoje. O vínculo jurídico será preservado.'
        : 'A reativação não cria designações; a Secretaria deverá registrar os novos vínculos.',
      confirmLabel: novaSituacao === 'Ausente' ? 'Marcar ausente' : 'Reativar',
      cancelLabel: 'Cancelar',
      tone: novaSituacao === 'Ausente' ? 'danger' : 'primary',
      icon: 'alert',
    });
    if (!confirmado) return;

    const { error } = await supabase.rpc('atualizar_situacao_elenco', {
      p_religioso_id: religioso.id,
      p_situacao: novaSituacao,
    });
    if (error) {
      showToast.error(`Não foi possível atualizar a situação: ${error.message}`);
      return;
    }
    showToast.success(`${nomeExibido(religioso)} agora consta como ${novaSituacao.toLocaleLowerCase('pt-BR')}.`);
    await carregar();
  };

  const abrirDesignacao = (religiosoId = '') => {
    setFormulario({ ...formularioInicial, religioso_id: religiosoId, vigencia_inicio: dataHoje() });
    setModalAberto(true);
  };

  const salvarDesignacao = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formulario.religioso_id || !formulario.destino_id || !formulario.funcao.trim() || !formulario.vigencia_inicio) {
      showToast.error('Preencha o religioso, o destino, a função e a data de início.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.rpc('registrar_transferencia_elenco', {
      p_religioso_id: formulario.religioso_id,
      p_comunidade_id: formulario.destino === 'comunidade' ? formulario.destino_id : null,
      p_obra_id: formulario.destino === 'obra' ? formulario.destino_id : null,
      p_tipo_vinculo: formulario.tipo_vinculo,
      p_funcao: formulario.funcao,
      p_vigencia_inicio: formulario.vigencia_inicio,
      p_designacao_encerrar: formulario.encerrar_id || null,
      p_observacoes: formulario.observacoes || null,
    });
    setSaving(false);

    if (error) {
      showToast.error(`Não foi possível registrar a designação: ${error.message}`);
      return;
    }
    showToast.success('Designação registrada e histórico atualizado.');
    setModalAberto(false);
    await carregar();
  };

  const vincularConta = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!religiosoParaVincular) return;
    const uuid = authUserId.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
      showToast.error('Informe um UUID válido da conta no Supabase Auth.');
      return;
    }

    setLinking(true);
    const { error } = await supabase.rpc('vincular_religioso_usuario_elenco', {
      p_religioso_id: religiosoParaVincular.id,
      p_auth_user_id: uuid,
    });
    setLinking(false);

    if (error) {
      showToast.error(`Não foi possível vincular a conta: ${error.message}`);
      return;
    }

    showToast.success(`Conta vinculada a ${nomeExibido(religiosoParaVincular)}.`);
    setReligiosoParaVincular(null);
    setAuthUserId('');
    await carregar();
  };

  const designacoesDoFormulario = designacoes.filter(item =>
    item.religioso_id === formulario.religioso_id
    && item.vigencia_fim === null
    && (!item.vigencia_inicio || item.vigencia_inicio <= (formulario.vigencia_inicio || hoje))
  );

  const situacoes = useMemo(() => ({
    ativos: religiosos.filter(item => item.situacao_elenco === 'Ativo').length,
    ausentes: religiosos.filter(item => item.situacao_elenco === 'Ausente').length,
    designacoes: vigentes.length,
  }), [religiosos, vigentes]);

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#226380]" /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Secretaria Provincial • Elenco 2026</span>
          <h1 className="mt-1 font-cinzel text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Elenco dos Religiosos</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Consulte comunidades e designações, registre transferências e mantenha a situação canônica atualizada.</p>
        </div>
        <button
          type="button"
          onClick={() => abrirDesignacao()}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#113240] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#19495b]"
        >
          <Plus className="h-4 w-4" /> Nova designação
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <ResumoCard label="Religiosos ativos" valor={situacoes.ativos} icon={<Users className="h-4 w-4" />} />
        <ResumoCard label="Ausentes" valor={situacoes.ausentes} icon={<CircleAlert className="h-4 w-4" />} />
        <ResumoCard label="Designações vigentes" valor={situacoes.designacoes} icon={<Building2 className="h-4 w-4" />} />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Pesquisar religioso, comunidade, obra ou função..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          <label className="relative flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-500">Situação</span>
            <select value={filtroSituacao} onChange={event => setFiltroSituacao(event.target.value as typeof filtroSituacao)} className="appearance-none bg-transparent pr-5 text-sm outline-none">
              <option value="todos">Todas</option>
              <option value="Ativo">Ativos</option>
              <option value="Ausente">Ausentes</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-slate-400" />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 font-semibold">Religioso</th>
                <th className="px-4 py-3 font-semibold">Comunidades e designações vigentes</th>
                <th className="px-4 py-3 font-semibold">Situação</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtrados.map(religioso => {
                const atualizadas = designacoesPorReligioso.get(religioso.id) || [];
                const ativo = religioso.situacao_elenco === 'Ativo';
                return (
                  <tr key={religioso.id} className="align-top hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300"><UserRound className="h-4 w-4" /></span>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{nomeExibido(religioso)}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {religioso.grau}
                            {religioso.cadastro_elenco_provisorio && <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">Cadastro básico</span>}
                            {religioso.nome_civil && ` · ${religioso.nome_civil}`}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {religioso.auth_user_id ? 'Conta do Portal vinculada' : 'Sem conta do Portal vinculada'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xl px-4 py-4">
                      {atualizadas.length ? (
                        <div className="flex flex-wrap gap-2">
                          {atualizadas.map(item => {
                            const comunidade = item.comunidade_id ? mapaComunidades.get(item.comunidade_id) : null;
                            const obra = item.obra_id ? mapaObras.get(item.obra_id) : null;
                            const lugar = comunidade?.nome || obra?.nome || 'Destino indisponível';
                            const local = comunidade
                              ? [comunidade.cidade, comunidade.estado].filter(Boolean).join('/')
                              : [obra?.localidade, obra?.cidade, obra?.uf || obra?.estado].filter(Boolean).join(' · ');
                            return (
                              <span key={item.id} className="inline-flex max-w-full flex-col rounded-lg border border-slate-200 px-2.5 py-1.5 dark:border-slate-700">
                                <span className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">{lugar} · {item.funcao}</span>
                                <span className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500">
                                  <MapPin className="h-3 w-3" /> {local || 'Localidade pendente'} · {tiposVinculo.find(type => type.value === item.tipo_vinculo)?.label || item.tipo_vinculo}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      ) : <span className="text-xs text-slate-400">{ativo ? 'Sem designação vigente' : 'Sem designação ativa; vínculo jurídico pode permanecer'}</span>}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${ativo ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300'}`}>
                        {religioso.situacao_elenco}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {!religioso.auth_user_id && <button type="button" onClick={() => { setReligiosoParaVincular(religioso); setAuthUserId(''); }} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-white/5"><Link2 className="h-3.5 w-3.5" /> Vincular conta</button>}
                        {ativo && <button type="button" onClick={() => abrirDesignacao(religioso.id)} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-white/5"><ArrowRightLeft className="h-3.5 w-3.5" /> Transferir</button>}
                        <button type="button" onClick={() => void mudarSituacao(religioso)} className={`rounded-md border px-2.5 py-1.5 text-xs font-medium ${ativo ? 'border-amber-200 text-amber-800 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300' : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300'}`}>
                          {ativo ? 'Marcar ausente' : 'Reativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtrados.length && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">Nenhum religioso encontrado com esses filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800">
          {filtrados.length} de {religiosos.length} religiosos · vínculos jurídicos, residenciais e funções são mantidos separadamente.
        </div>
      </section>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setModalAberto(false); }}>
          <form onSubmit={salvarDesignacao} className="my-auto w-full max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#161b22] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Secretaria • Histórico de designações</span>
                <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Nova transferência ou função</h2>
                <p className="mt-1 text-xs text-slate-500">A designação anterior só será encerrada se você a selecionar abaixo.</p>
              </div>
              <button type="button" onClick={() => setModalAberto(false)} aria-label="Fechar" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Religioso">
                <select required value={formulario.religioso_id} onChange={event => setFormulario(previous => ({ ...previous, religioso_id: event.target.value, encerrar_id: '' }))} className={inputClass}>
                  <option value="">Selecione</option>
                  {religiosos.filter(person => person.situacao_elenco === 'Ativo').map(person => <option key={person.id} value={person.id}>{nomeExibido(person)}</option>)}
                </select>
              </Campo>
              <Campo label="Tipo de vínculo">
                <select required value={formulario.tipo_vinculo} onChange={event => setFormulario(previous => ({ ...previous, tipo_vinculo: event.target.value as TipoVinculo, destino: event.target.value === 'juridico' ? 'comunidade' : previous.destino, destino_id: '' }))} className={inputClass}>
                  {tiposVinculo.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </Campo>
              <Campo label="Destino">
                <select value={formulario.destino} disabled={formulario.tipo_vinculo === 'juridico'} onChange={event => setFormulario(previous => ({ ...previous, destino: event.target.value as Destino, destino_id: '' }))} className={inputClass}>
                  <option value="obra">Obra / instituição</option>
                  <option value="comunidade">Comunidade religiosa</option>
                </select>
              </Campo>
              <Campo label={formulario.destino === 'comunidade' ? 'Comunidade' : 'Obra ou instituição'}>
                <select required value={formulario.destino_id} onChange={event => setFormulario(previous => ({ ...previous, destino_id: event.target.value }))} className={inputClass}>
                  <option value="">Selecione o destino</option>
                  {formulario.destino === 'comunidade'
                    ? comunidades.filter(item => item.status !== 'Inativo').map(item => <option key={item.id} value={item.id}>{item.nome}{item.regiao ? ` — ${item.regiao}` : ''}</option>)
                    : obras.filter(item => item.status !== 'Inativa').map(item => <option key={item.id} value={item.id}>{item.nome} — {[item.localidade, item.cidade, item.uf || item.estado].filter(Boolean).join('/')}{item.pertencimento_elenco !== 'brm' ? ` (${item.pertencimento_elenco})` : ''}</option>)}
                </select>
              </Campo>
              <Campo label="Função">
                <input required maxLength={160} value={formulario.funcao} onChange={event => setFormulario(previous => ({ ...previous, funcao: event.target.value }))} placeholder="Ex.: Pároco, Residente, Ecônomo..." className={inputClass} />
              </Campo>
              <Campo label="Início da vigência">
                <span className="relative block">
                  <CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input required type="date" value={formulario.vigencia_inicio} onChange={event => setFormulario(previous => ({ ...previous, vigencia_inicio: event.target.value }))} className={`${inputClass} pl-9`} />
                </span>
              </Campo>
            </div>

            <Campo label="Encerrar vínculo anterior (opcional)">
              <select value={formulario.encerrar_id} onChange={event => setFormulario(previous => ({ ...previous, encerrar_id: event.target.value }))} className={inputClass}>
                <option value="">Não encerrar outro vínculo</option>
                {designacoesDoFormulario.map(item => <option key={item.id} value={item.id}>{localDaDesignacao(item, mapaComunidades, mapaObras)} · {item.funcao}</option>)}
              </select>
            </Campo>
            <Campo label="Observações">
              <textarea rows={2} maxLength={1000} value={formulario.observacoes} onChange={event => setFormulario(previous => ({ ...previous, observacoes: event.target.value }))} className={inputClass} />
            </Campo>
            <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              A data inicial é obrigatória para novas designações. O elenco importado de 2026 poderá permanecer sem dia exato, identificado pelo ano de referência.
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="button" onClick={() => setModalAberto(false)} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700">Cancelar</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-[#113240] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />} Registrar
              </button>
            </div>
          </form>
        </div>
      )}

      {religiosoParaVincular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !linking) setReligiosoParaVincular(null); }}>
          <form onSubmit={vincularConta} className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#161b22] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Secretaria • Acesso ao Portal</span>
                <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Vincular conta autenticada</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{nomeExibido(religiosoParaVincular)}</p>
              </div>
              <button type="button" disabled={linking} onClick={() => setReligiosoParaVincular(null)} aria-label="Fechar" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-white/5"><X className="h-4 w-4" /></button>
            </div>
            <Campo label="UUID da conta no Supabase Auth">
              <input
                required
                type="text"
                inputMode="text"
                autoComplete="off"
                value={authUserId}
                onChange={event => setAuthUserId(event.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                className={inputClass}
              />
            </Campo>
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-white/[0.04] dark:text-slate-300">
              Use o UUID de uma conta já criada no Supabase Auth. A validação impede vincular uma conta inexistente ou já associada a outro religioso.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" disabled={linking} onClick={() => setReligiosoParaVincular(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300">Cancelar</button>
              <button type="submit" disabled={linking} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-slate-900">
                {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Vincular
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#226380] focus:ring-2 focus:ring-[#226380]/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#0d1117] dark:text-white';

const localDaDesignacao = (item: Designacao, comunidades: Map<string, Comunidade>, obras: Map<string, Obra>) => {
  if (item.comunidade_id) return comunidades.get(item.comunidade_id)?.nome || 'Comunidade';
  if (item.obra_id) return obras.get(item.obra_id)?.nome || 'Obra';
  return 'Destino';
};

const Campo: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
    {children}
  </label>
);

const ResumoCard: React.FC<{ label: string; valor: number; icon: React.ReactNode }> = ({ label, valor, icon }) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#161b22]">
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#113240]/[0.07] text-[#113240] dark:bg-[#226380]/20 dark:text-[#a3c3c7]">{icon}</span>
    <div><p className="text-2xl font-semibold leading-none text-slate-900 dark:text-white">{valor}</p><p className="mt-1.5 text-xs text-slate-500">{label}</p></div>
  </div>
);

export default ElencoSecretaria;

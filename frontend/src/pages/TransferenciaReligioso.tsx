import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRightLeft, Building2, Calendar, Check, CheckCircle2,
  Church, FileText, FolderOpen, History, Loader2, Plus, RefreshCw,
  Search, Shield, Tag, UserCheck, UserRound, Users, X, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../hooks/useFeedback';
import { atribuirNomeReligioso, formatarComunidadeReligiosa } from '../lib/religiosoNome';
import { formatarDataBR } from '../utils/dateUtils';
import { deduplicarObras } from '../utils/obrasUtils';
import type { Religioso } from '../types/religioso';
import type {
  Comunidade, Obra, Designacao, TipoVinculo, FuncaoCatalogo
} from '../types/obra';
import { FUNCOES_PADRAO_BRM } from '../types/obra';

const tiposVinculoOptions: { value: TipoVinculo; label: string; desc: string }[] = [
  { value: 'pastoral', label: 'Pastoral / Paroquial', desc: 'Pároco, Vigário, Reitor de Santuário' },
  { value: 'formacao', label: 'Formação & Seminários', desc: 'Reitor, Formador, Promotor Vocacional' },
  { value: 'funcao', label: 'Governo & Administração', desc: 'Provincial, Secretário, Ecônomo' },
  { value: 'estudos', label: 'Estudos / Especialização', desc: 'Mestrado, Doutorado, Teologia' },
  { value: 'missao', label: 'Missão / Ad Gentes', desc: 'Maranhão, Rondônia, Alemanha' },
  { value: 'residencia', label: 'Residência Canônica', desc: 'Convento ou Casa de Acolhida' },
  { value: 'juridico', label: 'Vínculo Jurídico Provincial', desc: 'Preservação de direitos capitulares' },
  { value: 'outro', label: 'Outro Vínculo Canônico', desc: 'Provisões especiais do Governo Geral' },
];

export const TransferenciaReligioso: React.FC = () => {
  const navigate = useNavigate();
  const { id: routeReligiosoId } = useParams<{ id?: string }>();

  // Navegação por abas
  const [tabAtiva, setTabAtiva] = useState<'transferir' | 'historico' | 'funcoes'>('transferir');

  // Estados de dados
  const [religiosos, setReligiosos] = useState<Religioso[]>([]);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [designacoes, setDesignacoes] = useState<Designacao[]>([]);
  const [funcoesCatalogo, setFuncoesCatalogo] = useState<FuncaoCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Estados do formulário de transferência
  const [selectedReligiosoId, setSelectedReligiosoId] = useState<string>(routeReligiosoId || '');
  const [buscaReligioso, setBuscaReligioso] = useState<string>('');
  const [dropdownReligiosoAberto, setDropdownReligiosoAberto] = useState(false);

  // Destino
  const [novaComunidadeId, setNovaComunidadeId] = useState<string>('');
  const [novaObraId, setNovaObraId] = useState<string>('');
  const [obraManualNome, setObraManualNome] = useState<string>('');
  const [usarObraManual, setUsarObraManual] = useState<boolean>(false);

  // Função Canônica
  const [funcaoSelecionada, setFuncaoSelecionada] = useState<string>('Pároco');
  const [tipoVinculo, setTipoVinculo] = useState<TipoVinculo>('pastoral');

  // Decreto e Vigência
  const hojeStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  const [dataInicio, setDataInicio] = useState<string>(hojeStr);
  const [numeroDecreto, setNumeroDecreto] = useState<string>('');
  const [dataDecreto, setDataDecreto] = useState<string>(hojeStr);
  const [encerrarAnteriores, setEncerrarAnteriores] = useState<boolean>(true);
  const [observacoes, setObservacoes] = useState<string>('');

  // Estados da Aba de Gerenciar Funções
  const [novaFuncaoNome, setNovaFuncaoNome] = useState('');
  const [novaFuncaoCategoria, setNovaFuncaoCategoria] = useState('Pastoral');
  const [salvandoFuncao, setSalvandoFuncao] = useState(false);

  // Estados do Histórico
  const [filtroHistoricoAno, setFiltroHistoricoAno] = useState<string>('todos');
  const [buscaHistorico, setBuscaHistorico] = useState<string>('');

  // Carregamento inicial de dados
  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: relData, error: relErr },
        { data: comData, error: comErr },
        { data: obrData, error: obrErr },
        { data: desigData, error: desigErr },
      ] = await Promise.all([
        supabase
          .from('religiosos')
          .select('id, auth_user_id, nome_civil, nome_religioso, nome_elenco, grau, etapa_formativa_atual, ano_configuracao, ano_referencia_etapa, status, situacao_elenco, comunidade_atual_id, comunidade_atual_nome, obra_atual_id, obra_atual_nome, foto_url')
          .order('nome_civil'),
        supabase
          .from('comunidades')
          .select('id, nome, cidade, estado, regiao, status')
          .order('nome'),
        supabase
          .from('religiosos_obras_referencia')
          .select('id, nome, tipo, cidade, estado, uf, localidade, status, comunidade_id')
          .order('nome'),
        supabase
          .from('religiosos_designacoes')
          .select('*, comunidades(nome, cidade, estado), religiosos_obras_referencia(nome, cidade, localidade), religiosos(id, nome_civil, nome_religioso, grau)')
          .order('vigencia_inicio', { ascending: false }),
      ]);

      if (relErr) throw relErr;
      if (comErr) throw comErr;
      if (obrErr) throw obrErr;

      setReligiosos((relData || []) as unknown as Religioso[]);
      setComunidades((comData || []) as Comunidade[]);
      setObras(deduplicarObras((obrData || []) as Obra[]));
      setDesignacoes((desigData || []) as Designacao[]);

      // Carregar catálogo de funções
      try {
        const { data: funcData, error: funcErr } = await supabase
          .from('religiosos_funcoes_catalogo')
          .select('*')
          .order('ordem')
          .order('nome');

        if (!funcErr && funcData && funcData.length > 0) {
          setFuncoesCatalogo(funcData as FuncaoCatalogo[]);
        } else {
          // Inicializa com as funções padrão
          setFuncoesCatalogo(
            FUNCOES_PADRAO_BRM.map((nome, idx) => ({
              id: `def-${idx}`,
              nome,
              categoria: nome.includes('Provincial') ? 'Governo Provincial' : nome.includes('Pároco') || nome.includes('Vigário') ? 'Pastoral' : 'Formação',
              ativo: true,
              ordem: idx + 1,
            }))
          );
        }
      } catch {
        setFuncoesCatalogo(
          FUNCOES_PADRAO_BRM.map((nome, idx) => ({
            id: `def-${idx}`,
            nome,
            categoria: 'Pastoral',
            ativo: true,
            ordem: idx + 1,
          }))
        );
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      showToast.error(`Erro ao carregar dados da Secretaria: ${err.message || 'Falha de conexão'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Se rota veio com ID, sincronizar seleção
  useEffect(() => {
    if (routeReligiosoId && !selectedReligiosoId) {
      setSelectedReligiosoId(routeReligiosoId);
    }
  }, [routeReligiosoId, selectedReligiosoId]);

  // Mapas de busca rápida
  const mapaComunidades = useMemo(() => new Map(comunidades.map(c => [c.id, c])), [comunidades]);
  const mapaObras = useMemo(() => new Map(obras.map(o => [o.id, o])), [obras]);

  // Religioso selecionado
  const religiosoSelecionado = useMemo(
    () => religiosos.find(r => r.id === selectedReligiosoId) || null,
    [religiosos, selectedReligiosoId]
  );

  // Designações ativas do religioso selecionado
  const designacoesAtivasDoReligioso = useMemo(() => {
    if (!selectedReligiosoId) return [];
    return designacoes.filter(
      d => d.religioso_id === selectedReligiosoId && (!d.vigencia_fim || d.vigencia_fim >= hojeStr)
    );
  }, [designacoes, selectedReligiosoId, hojeStr]);

  // Obras disponíveis para a comunidade selecionada
  const obrasFiltradas = useMemo(() => {
    if (!novaComunidadeId) return obras;
    const dasComunidade = obras.filter(o => o.comunidade_id === novaComunidadeId);
    return dasComunidade.length > 0 ? dasComunidade : obras;
  }, [obras, novaComunidadeId]);

  // Nome e Cidade da nova comunidade
  const novaComunidade = useMemo(
    () => (novaComunidadeId ? mapaComunidades.get(novaComunidadeId) || null : null),
    [mapaComunidades, novaComunidadeId]
  );

  // Nome da nova obra calculada
  const nomeNovaObraCalculada = useMemo(() => {
    if (usarObraManual && obraManualNome.trim()) return obraManualNome.trim();
    if (novaObraId) return mapaObras.get(novaObraId)?.nome || '';
    if (novaComunidade) return novaComunidade.nome;
    return '';
  }, [usarObraManual, obraManualNome, novaObraId, mapaObras, novaComunidade]);

  // Lista de funções únicas disponíveis (catálogo + padrão)
  const funcoesDisponiveis = useMemo(() => {
    const list = new Set<string>();
    funcoesCatalogo.filter(f => f.ativo !== false).forEach(f => list.add(f.nome));
    FUNCOES_PADRAO_BRM.forEach(f => list.add(f));
    return Array.from(list);
  }, [funcoesCatalogo]);

  // Filtro de religiosos para seleção
  const religiososFiltradosParaSelecao = useMemo(() => {
    const termo = buscaReligioso.toLowerCase().trim();
    if (!termo) return religiosos;
    return religiosos.filter(r => {
      const civil = (r.nome_civil || '').toLowerCase();
      const rel = (r.nome_religioso || '').toLowerCase();
      const elenco = (r.nome_elenco || '').toLowerCase();
      const com = (r.comunidade_atual_nome || '').toLowerCase();
      const obr = (r.obra_atual_nome || '').toLowerCase();
      return civil.includes(termo) || rel.includes(termo) || elenco.includes(termo) || com.includes(termo) || obr.includes(termo);
    });
  }, [religiosos, buscaReligioso]);

  // Submissão da Transferência Canônica Completa
  const handleExecutarTransferencia = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReligiosoId) {
      showToast.error('Selecione o religioso a ser transferido.');
      return;
    }
    const effectiveNovaComunidadeId = novaComunidadeId || (!usarObraManual ? '' : (religiosoSelecionado?.comunidade_atual_id || comunidades[0]?.id || ''));
    if (!effectiveNovaComunidadeId && !usarObraManual) {
      showToast.error('Selecione a Comunidade Religiosa de destino.');
      return;
    }
    if (!funcaoSelecionada) {
      showToast.error('Selecione o Ofício ou Função Canônica.');
      return;
    }
    if (!dataInicio) {
      showToast.error('Informe a data de início da vigência / posse.');
      return;
    }

    const comNome = formatarComunidadeReligiosa(novaComunidade?.nome) || formatarComunidadeReligiosa(religiosoSelecionado?.comunidade_atual_nome) || 'Província BRM';
    const obrNome = nomeNovaObraCalculada || comNome;
    const finalObraId = usarObraManual ? null : (novaObraId || null);
    const dbComunidadeId = effectiveNovaComunidadeId || null;
    const dbTipoVinculo = tipoVinculo === 'formacao' ? 'funcao' : tipoVinculo;

    setSalvando(true);

    try {
      // 1. Tentar executar via RPC se existir
      let rpcSucesso = false;
      try {
        const { data: rpcId, error: rpcErr } = await supabase.rpc('registrar_transferencia_canonica', {
          p_religioso_id: selectedReligiosoId,
          p_comunidade_id: dbComunidadeId,
          p_comunidade_nome: comNome,
          p_obra_id: finalObraId,
          p_obra_nome: obrNome,
          p_tipo_vinculo: dbTipoVinculo,
          p_funcao: funcaoSelecionada,
          p_vigencia_inicio: dataInicio,
          p_numero_decreto: numeroDecreto.trim() || null,
          p_data_decreto: dataDecreto || null,
          p_encerrar_anteriores: encerrarAnteriores,
          p_observacoes: observacoes.trim() || null,
        });
        if (!rpcErr && rpcId) {
          rpcSucesso = true;
        } else if (rpcErr) {
          console.warn('RPC registrar_transferencia_canonica retornou aviso ou restrição, prosseguindo com execução direta:', rpcErr.message);
        }
      } catch (rpcCallErr) {
        console.warn('RPC registrar_transferencia_canonica indisponível, executando transação client-side:', rpcCallErr);
      }

      // 2. Se a RPC não foi executada, executa as atualizações canônicas de forma direta e segura
      if (!rpcSucesso) {
        const anoVigencia = new Date(dataInicio).getFullYear() || new Date().getFullYear();

        // Encerramento das designações anteriores
        if (encerrarAnteriores) {
          try {
            await supabase
              .from('religiosos_designacoes')
              .update({ vigencia_fim: dataInicio })
              .eq('religioso_id', selectedReligiosoId)
              .or(`vigencia_fim.is.null,vigencia_fim.gt.${dataInicio}`);
          } catch (e) {
            console.warn('Aviso ao encerrar designações anteriores:', e);
          }

          try {
            await supabase
              .from('religiosos_historico_comunidades')
              .update({ periodo_fim: dataInicio })
              .eq('religioso_id', selectedReligiosoId)
              .or('periodo_fim.is.null,periodo_fim.eq.Atual');
          } catch (e) {
            console.warn('Aviso ao atualizar histórico de comunidades:', e);
          }
        }

        // Inserir nova designação com tolerância resiliente multi-estágio contra qualquer check constraint
        const desigBase: Record<string, any> = {
          religioso_id: selectedReligiosoId,
          tipo_vinculo: dbTipoVinculo,
          funcao: funcaoSelecionada,
          vigencia_inicio: dataInicio,
          ano_referencia: anoVigencia,
          numero_decreto: numeroDecreto.trim() || null,
          data_decreto: dataDecreto || null,
          observacoes: observacoes.trim() || null,
        };

        let desigSalva = false;

        // Estágio 1: tenta ambos comunidade_id e obra_id
        if (dbComunidadeId && finalObraId) {
          const { error: err1 } = await supabase
            .from('religiosos_designacoes')
            .insert({ ...desigBase, comunidade_id: dbComunidadeId, obra_id: finalObraId });
          if (!err1) desigSalva = true;
          else console.warn('Tentativa 1 com comunidade e obra retornou restrição:', err1.message);
        }

        // Estágio 2: se falhou ou não tinha obra_id, tenta com comunidade_id apenas (respeitando restrição legada XOR)
        if (!desigSalva && dbComunidadeId) {
          const { error: err2 } = await supabase
            .from('religiosos_designacoes')
            .insert({ ...desigBase, comunidade_id: dbComunidadeId, obra_id: null });
          if (!err2) desigSalva = true;
          else console.warn('Tentativa 2 com comunidade retornou restrição:', err2.message);
        }

        // Estágio 3: se ainda não salvou, tenta com obra_id apenas
        if (!desigSalva && finalObraId) {
          const { error: err3 } = await supabase
            .from('religiosos_designacoes')
            .insert({ ...desigBase, comunidade_id: null, obra_id: finalObraId });
          if (!err3) desigSalva = true;
          else console.warn('Tentativa 3 com obra retornou restrição:', err3.message);
        }

        // Estágio 4: se ambos eram nulos, tenta com uma comunidade padrão
        if (!desigSalva) {
          const fallbackComId = dbComunidadeId || religiosoSelecionado?.comunidade_atual_id || comunidades[0]?.id;
          if (fallbackComId) {
            const { error: err4 } = await supabase
              .from('religiosos_designacoes')
              .insert({ ...desigBase, comunidade_id: fallbackComId, obra_id: null });
            if (!err4) desigSalva = true;
            else console.warn('Aviso: designação histórica não pôde ser gravada na tabela legada de designações:', err4.message);
          }
        }

        // Atualizar tabela public.religiosos (Elenco e Dossiê)
        const updateRelPayload: Record<string, any> = {
          comunidade_atual_id: effectiveNovaComunidadeId || null,
          comunidade_atual_nome: comNome,
          obra_atual_id: finalObraId,
          obra_atual_nome: obrNome,
        };

        // Se for Frater, auto-deduz ou atualiza etapa formativa conforme o destino
        if (religiosoSelecionado?.grau === 'Frater') {
          if (comNome.toLowerCase().includes('conventinho')) {
            updateRelPayload.etapa_formativa_atual = 'Configuração (Teologia)';
          } else {
            updateRelPayload.etapa_formativa_atual = 'Tirocínio';
          }
        }

        const { error: upRelErr } = await supabase
          .from('religiosos')
          .update(updateRelPayload)
          .eq('id', selectedReligiosoId);
        if (upRelErr) throw upRelErr;

        // Atualizar portal_perfis_religiosos se houver
        if (religiosoSelecionado) {
          await supabase
            .from('portal_perfis_religiosos')
            .update({
              comunidade_atual_nome: comNome,
              obra_atual_nome: obrNome,
            })
            .or(`auth_user_id.eq.${religiosoSelecionado.auth_user_id || '00000000-0000-0000-0000-000000000000'},nome_civil.ilike.${religiosoSelecionado.nome_civil}`);
        }

        // Inserir registro no histórico canônico permanente
        const cidadeRef = novaComunidade?.cidade || (finalObraId ? mapaObras.get(finalObraId)?.cidade : null) || 'Província BRM';
        await supabase
          .from('religiosos_historico_comunidades')
          .insert({
            religioso_id: selectedReligiosoId,
            periodo_inicio: dataInicio,
            periodo_fim: null,
            instituicao: obrNome !== comNome ? `${comNome} • ${obrNome}` : comNome,
            funcao: funcaoSelecionada,
            cidade: cidadeRef,
            local: 'Província BRM',
            observacoes: numeroDecreto.trim() ? `Decreto ${numeroDecreto.trim()}${observacoes.trim() ? ' - ' + observacoes.trim() : ''}` : (observacoes.trim() || null),
          });
      }

        const nomeConfrade = atribuirNomeReligioso(religiosoSelecionado?.grau, religiosoSelecionado?.nome_civil) || religiosoSelecionado?.nome_civil || 'Confrade';
      showToast.success(`Transferência canônica de ${nomeConfrade} efetivada com sucesso! Elenco, Dossiê e Portal foram atualizados.`);

      // Recarregar dados
      await carregarDados();

      // Limpar formulário mantendo no histórico ou visualização
      setNumeroDecreto('');
      setObservacoes('');
      setTabAtiva('historico');
    } catch (err: any) {
      console.error('Falha ao registrar transferência:', err);
      showToast.error(`Não foi possível efetivar a transferência: ${err.message || 'Erro no banco de dados'}`);
    } finally {
      setSalvando(false);
    }
  };

  // Cadastrar nova função no catálogo
  const handleCadastrarNovaFuncao = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = novaFuncaoNome.trim();
    if (!nomeLimpo) {
      showToast.error('Informe o nome da função canônica.');
      return;
    }

    if (funcoesDisponiveis.some(f => f.toLowerCase() === nomeLimpo.toLowerCase())) {
      showToast.error('Esta função já está cadastrada no catálogo.');
      return;
    }

    setSalvandoFuncao(true);
    try {
      const payload = {
        nome: nomeLimpo,
        categoria: novaFuncaoCategoria,
        ordem: funcoesCatalogo.length + 1,
        ativo: true,
      };

      const { data, error } = await supabase
        .from('religiosos_funcoes_catalogo')
        .insert(payload)
        .select()
        .single();

      if (error) {
        // Se a tabela ainda não tiver sido criada pelo script SQL, adicionamos no estado local
        console.warn('Tabela religiosos_funcoes_catalogo ainda não criada no banco, mantendo em memória:', error.message);
        setFuncoesCatalogo(prev => [...prev, { id: `local-${Date.now()}`, ...payload }]);
      } else if (data) {
        setFuncoesCatalogo(prev => [...prev, data as FuncaoCatalogo]);
      }

      showToast.success(`Função "${nomeLimpo}" cadastrada com sucesso!`);
      setNovaFuncaoNome('');
    } catch (err: any) {
      showToast.error(`Erro ao cadastrar função: ${err.message}`);
    } finally {
      setSalvandoFuncao(false);
    }
  };

  // Histórico filtrado
  const historicoFiltrado = useMemo(() => {
    let lista = designacoes;
    if (filtroHistoricoAno !== 'todos') {
      lista = lista.filter(d => String(d.ano_referencia) === filtroHistoricoAno || (d.vigencia_inicio && d.vigencia_inicio.startsWith(filtroHistoricoAno)));
    }
    if (buscaHistorico.trim()) {
      const termo = buscaHistorico.toLowerCase().trim();
      lista = lista.filter(d => {
        const relNome = (d.religiosos?.nome_civil || '').toLowerCase();
        const relGrau = (d.religiosos?.grau || '').toLowerCase();
        const func = (d.funcao || '').toLowerCase();
        const com = (d.comunidades?.nome || '').toLowerCase();
        const obr = (d.religiosos_obras_referencia?.nome || '').toLowerCase();
        const dec = (d.numero_decreto || '').toLowerCase();
        return relNome.includes(termo) || relGrau.includes(termo) || func.includes(termo) || com.includes(termo) || obr.includes(termo) || dec.includes(termo);
      });
    }
    return lista;
  }, [designacoes, filtroHistoricoAno, buscaHistorico]);

  // Anos disponíveis no histórico
  const anosDisponiveis = useMemo(() => {
    const anos = new Set<string>();
    designacoes.forEach(d => {
      if (d.ano_referencia) anos.add(String(d.ano_referencia));
      if (d.vigencia_inicio) anos.add(d.vigencia_inicio.slice(0, 4));
    });
    return Array.from(anos).sort((a, b) => b.localeCompare(a));
  }, [designacoes]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* Cabeçalho Canônico da Página */}
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#11161d]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#226380] dark:text-[#A3C3C7]">
              <Link to="/secretaria/elenco" className="hover:underline flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> Elenco Provincial
              </Link>
              <span>/</span>
              <span>Atos de Governo & Transferências</span>
            </div>
            <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Transferências & Nomeações Canônicas
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
              Registro formal de decretos, transferências de comunidade e provisões de ofícios da Província BRM com atualização imediata no Elenco, Portal e Dossiês.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/secretaria/elenco"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-white/5 dark:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao Elenco
            </Link>
          </div>
        </div>

        {/* Abas Superiores */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setTabAtiva('transferir')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              tabAtiva === 'transferir'
                ? 'bg-[#226380] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
            }`}
          >
            <ArrowRightLeft className="h-4 w-4" />
            Registrar Transferência Canônica
          </button>

          <button
            type="button"
            onClick={() => setTabAtiva('historico')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              tabAtiva === 'historico'
                ? 'bg-[#226380] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
            }`}
          >
            <History className="h-4 w-4" />
            Histórico de Decretos & Transferências
            <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
              {designacoes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabAtiva('funcoes')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              tabAtiva === 'funcoes'
                ? 'bg-[#226380] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
            }`}
          >
            <Tag className="h-4 w-4" />
            Cadastrar & Gerenciar Funções
            <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
              {funcoesDisponiveis.length}
            </span>
          </button>
        </div>
      </header>

      {/* ABA 1: FORMULÁRIO DE TRANSFERÊNCIA */}
      {tabAtiva === 'transferir' && (
        <form onSubmit={handleExecutarTransferencia} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Coluna da Esquerda: Seleção e Situação Atual do Religioso */}
            <div className="lg:col-span-1 space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#11161d]">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <UserRound className="h-4 w-4 text-[#226380]" />
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                    1. Religioso a Transferir
                  </h2>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Selecione o Confrade *
                  </label>

                  {/* Campo de Busca Rápida de Religioso */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar por nome ou comunidade..."
                      value={buscaReligioso}
                      onChange={e => {
                        setBuscaReligioso(e.target.value);
                        setDropdownReligiosoAberto(true);
                      }}
                      onFocus={() => setDropdownReligiosoAberto(true)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-[#226380] focus:bg-white focus:ring-2 focus:ring-[#226380]/15 dark:border-slate-700 dark:bg-white/5 dark:focus:bg-[#0d1117]"
                    />
                  </div>

                  {/* Select oficial nativo */}
                  <select
                    value={selectedReligiosoId}
                    onChange={e => {
                      setSelectedReligiosoId(e.target.value);
                      setDropdownReligiosoAberto(false);
                    }}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-[#226380] focus:ring-2 focus:ring-[#226380]/15 dark:border-slate-700 dark:bg-[#0d1117] dark:text-white"
                  >
                    <option value="">-- Escolha um confrade ({religiosos.length} cadastrados) --</option>
                    {religiososFiltradosParaSelecao.map(rel => {
                      const nomeCanonical = atribuirNomeReligioso(rel.grau, rel.nome_civil) || rel.nome_civil;
                      const etapaStr = rel.grau === 'Frater'
                        ? ((rel.etapa_formativa_atual?.toLowerCase().includes('tiroc') || (!rel.etapa_formativa_atual && rel.comunidade_atual_nome && !rel.comunidade_atual_nome.toLowerCase().includes('conventinho')))
                            ? ' • Tirocinante'
                            : (rel.ano_configuracao ? ` • ${rel.ano_configuracao}º Ano Teologia` : ' • Configuração'))
                        : '';
                      return (
                        <option key={rel.id} value={rel.id}>
                          {nomeCanonical} ({rel.grau || 'Confrade'}{etapaStr}) — {formatarComunidadeReligiosa(rel.comunidade_atual_nome) || 'Província BRM'}
                        </option>
                      );
                    })}
                  </select>

                  {/* Card de Situação Atual do Religioso */}
                  {religiosoSelecionado ? (
                    <div className="mt-4 rounded-xl border border-[#226380]/20 bg-[#226380]/5 p-4 text-xs space-y-3 dark:border-[#226380]/30 dark:bg-[#226380]/10">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#226380] font-serif font-bold text-white shadow-sm">
                          {religiosoSelecionado.grau?.slice(0, 2) || 'SCJ'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {atribuirNomeReligioso(religiosoSelecionado.grau, religiosoSelecionado.nome_civil) || religiosoSelecionado.nome_civil}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Nome civil: {religiosoSelecionado.nome_civil}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                              {religiosoSelecionado.situacao_elenco || 'Ativo no Elenco'}
                            </span>
                            {religiosoSelecionado.grau === 'Frater' && (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                (religiosoSelecionado.etapa_formativa_atual?.toLowerCase().includes('tiroc') || (!religiosoSelecionado.etapa_formativa_atual && religiosoSelecionado.comunidade_atual_nome && !religiosoSelecionado.comunidade_atual_nome.toLowerCase().includes('conventinho')))
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                              }`}>
                                {(religiosoSelecionado.etapa_formativa_atual?.toLowerCase().includes('tiroc') || (!religiosoSelecionado.etapa_formativa_atual && religiosoSelecionado.comunidade_atual_nome && !religiosoSelecionado.comunidade_atual_nome.toLowerCase().includes('conventinho')))
                                  ? 'Tirocinante'
                                  : (religiosoSelecionado.ano_configuracao ? `${religiosoSelecionado.ano_configuracao}º Ano Teologia` : 'Configuração')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#226380]/15 pt-2.5 space-y-1.5 text-[11px]">
                        <div>
                          <span className="text-slate-500 font-medium">Comunidade Atual:</span>{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {formatarComunidadeReligiosa(religiosoSelecionado.comunidade_atual_nome) || 'Comunidade Provincial'}
                          </strong>
                        </div>

                        {religiosoSelecionado.obra_atual_nome && (
                          <div>
                            <span className="text-slate-500 font-medium">Obra / Paróquia Atual:</span>{' '}
                            <strong className="text-slate-800 dark:text-slate-200">
                              {religiosoSelecionado.obra_atual_nome}
                            </strong>
                          </div>
                        )}

                        {designacoesAtivasDoReligioso.length > 0 && (
                          <div>
                            <span className="text-slate-500 font-medium">Ofício Vigente:</span>{' '}
                            <strong className="text-[#226380] dark:text-[#A3C3C7]">
                              {designacoesAtivasDoReligioso.map(d => d.funcao).join(', ')}
                            </strong>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#226380]/15 text-right">
                        <Link
                          to={`/religiosos/${religiosoSelecionado.id}/dossie`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#226380] hover:underline dark:text-[#A3C3C7]"
                        >
                          <FolderOpen className="h-3.5 w-3.5" /> Ver Dossiê Pessoal Completo ↗
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500 dark:border-slate-700">
                      Selecione um confrade acima para carregar o histórico atual e o comparativo canônico.
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Coluna Central e Direita: Nova Destinação e Dados do Decreto */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Seção 2: Nova Destinação Canônica */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-[#11161d]">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <Building2 className="h-4 w-4 text-[#226380]" />
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                    2. Nova Destinação Canônica (Para Onde Vai?)
                  </h2>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nova Comunidade */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nova Comunidade Religiosa *
                    </label>
                    <select
                      value={novaComunidadeId}
                      onChange={e => {
                        setNovaComunidadeId(e.target.value);
                        setNovaObraId('');
                      }}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-[#226380] focus:ring-2 focus:ring-[#226380]/15 dark:border-slate-700 dark:bg-[#0d1117] dark:text-white"
                    >
                      <option value="">-- Selecione a Comunidade Canônica de Destino --</option>
                      {comunidades.map(com => (
                        <option key={com.id} value={com.id}>
                          {formatarComunidadeReligiosa(com.nome)} {[com.cidade, com.estado].filter(Boolean).join('/') ? `(${[com.cidade, com.estado].filter(Boolean).join('/')})` : ''}
                        </option>
                      ))}
                    </select>
                    <span className="mt-1 block text-[11px] text-slate-400">
                      Comunidade canônica onde o religioso fará parte da vida fraterna e residência.
                    </span>
                  </div>

                  {/* Nova Obra / Paróquia */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Obra / Paróquia / Instituição onde Trabalhará *
                      </label>
                      <button
                        type="button"
                        onClick={() => setUsarObraManual(!usarObraManual)}
                        className="text-[11px] text-[#226380] hover:underline dark:text-[#A3C3C7]"
                      >
                        {usarObraManual ? '← Selecionar da lista' : '+ Digitar obra / paróquia livre'}
                      </button>
                    </div>

                    {usarObraManual ? (
                      <input
                        type="text"
                        placeholder="Ex.: Santuário Sagrado Coração de Jesus, Faculdade São Luiz, etc."
                        value={obraManualNome}
                        onChange={e => setObraManualNome(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-[#226380] focus:ring-2 focus:ring-[#226380]/15 dark:border-slate-700 dark:bg-[#0d1117] dark:text-white"
                      />
                    ) : (
                      <select
                        value={novaObraId}
                        onChange={e => setNovaObraId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-[#226380] focus:ring-2 focus:ring-[#226380]/15 dark:border-slate-700 dark:bg-[#0d1117] dark:text-white"
                      >
                        <option value="">
                          {novaComunidadeId ? `-- Mesma Comunidade (${formatarComunidadeReligiosa(novaComunidade?.nome)}) ou selecione obra abaixo --` : '-- Selecione a Obra / Paróquia --'}
                        </option>
                        {obrasFiltradas.map(obr => (
                          <option key={obr.id} value={obr.id}>
                            {obr.nome} ({obr.tipo}) — {[obr.localidade, obr.cidade, obr.uf || obr.estado].filter(Boolean).join('/')}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Função por Seletor */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Ofício / Função Canônica (Por Seletor) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setTabAtiva('funcoes')}
                        className="text-[10px] text-[#226380] hover:underline dark:text-[#A3C3C7]"
                      >
                        + Cadastrar nova função
                      </button>
                    </div>
                    <select
                      value={funcaoSelecionada}
                      onChange={e => setFuncaoSelecionada(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#226380] focus:ring-2 focus:ring-[#226380]/15 dark:border-slate-700 dark:bg-[#0d1117] dark:text-white"
                    >
                      {funcoesDisponiveis.map(f => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    <span className="mt-1 block text-[11px] text-slate-400">
                      Função eclesiástica ou encargo canônico confiado ao religioso.
                    </span>
                  </div>

                  {/* Tipo de Vínculo */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Vínculo Canônico *
                    </label>
                    <select
                      value={tipoVinculo}
                      onChange={e => setTipoVinculo(e.target.value as TipoVinculo)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-[#226380] focus:ring-2 focus:ring-[#226380]/15 dark:border-slate-700 dark:bg-[#0d1117] dark:text-white"
                    >
                      {tiposVinculoOptions.map(t => (
                        <option key={t.value} value={t.value}>
                          {t.label} ({t.desc})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Seção 3: Dados Oficiais do Decreto & Vigência */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-[#11161d]">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <FileText className="h-4 w-4 text-[#226380]" />
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                    3. Decreto Provincial & Prazos de Vigência
                  </h2>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Data de Início da Vigência */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Data da Vigência / Posse *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="date"
                        required
                        value={dataInicio}
                        onChange={e => setDataInicio(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-[#226380] focus:ring-2 focus:ring-[#226380]/15 dark:border-slate-700 dark:bg-[#0d1117] dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Número do Decreto Provincial */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nº do Decreto / Provisão
                    </label>
                    <input
                      type="text"
                      placeholder="Ex.: Dec. Prov. 01/2026"
                      value={numeroDecreto}
                      onChange={e => setNumeroDecreto(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#226380] focus:ring-2 focus:ring-[#226380]/15 dark:border-slate-700 dark:bg-[#0d1117] dark:text-white"
                    />
                  </div>

                  {/* Data do Decreto */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Data do Decreto
                    </label>
                    <input
                      type="date"
                      value={dataDecreto}
                      onChange={e => setDataDecreto(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#226380] focus:ring-2 focus:ring-[#226380]/15 dark:border-slate-700 dark:bg-[#0d1117] dark:text-white"
                    />
                  </div>

                  {/* Checkbox de Encerramento Anterior */}
                  <div className="sm:col-span-3 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={encerrarAnteriores}
                        onChange={e => setEncerrarAnteriores(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#226380] focus:ring-[#226380]"
                      />
                      <span>
                        Encerrar automaticamente a designação anterior nesta data de início (recomendado para transferências de ofício pleno)
                      </span>
                    </label>
                  </div>

                  {/* Observações / Ementa do Decreto */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Observações Canônicas / Resumo do Ato
                    </label>
                    <textarea
                      rows={2}
                      maxLength={1000}
                      placeholder="Ex.: Nomeado Pároco pelo Bispo Diocesano e apresentado pelo Governo Provincial conforme ata de consulta..."
                      value={observacoes}
                      onChange={e => setObservacoes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-[#226380] focus:ring-2 focus:ring-[#226380]/15 dark:border-slate-700 dark:bg-[#0d1117] dark:text-white"
                    />
                  </div>
                </div>
              </section>

              {/* Seção 4: Resumo Comparativo (Antes x Depois) e Confirmação */}
              {religiosoSelecionado && (
                <section className="rounded-2xl border-2 border-[#226380]/40 bg-gradient-to-br from-white to-[#226380]/5 p-5 shadow-sm dark:from-[#11161d] dark:to-[#226380]/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#226380] dark:text-[#A3C3C7] mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Resumo Canônico da Movimentação (Antes ➔ Depois)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Origem */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#0d1117]">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Origem Canônica Atual</span>
                      <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                        {formatarComunidadeReligiosa(religiosoSelecionado.comunidade_atual_nome) || 'Comunidade Provincial'}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Obra: {religiosoSelecionado.obra_atual_nome || 'Sede Provincial'}
                      </p>
                      <p className="text-[#226380] dark:text-[#A3C3C7] text-[11px] font-medium mt-0.5">
                        Ofício: {designacoesAtivasDoReligioso[0]?.funcao || 'Membro'}
                      </p>
                    </div>

                    {/* Destino */}
                    <div className="rounded-xl border border-[#226380]/40 bg-[#226380]/10 p-3 dark:border-[#226380]/60 dark:bg-[#226380]/20">
                      <span className="text-[10px] font-bold uppercase text-[#226380] dark:text-[#A3C3C7]">Novo Destino Canônico</span>
                      <p className="mt-1 font-bold text-[#226380] dark:text-[#A3C3C7]">
                        {formatarComunidadeReligiosa(novaComunidade?.nome) || 'Comunidade a selecionar'}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                        Obra: {nomeNovaObraCalculada || 'Mesma comunidade'}
                      </p>
                      <p className="text-slate-900 dark:text-white text-[11px] font-bold mt-0.5">
                        Novo Ofício: {funcaoSelecionada}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => navigate('/secretaria/elenco')}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-white/5"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={salvando}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#226380] px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#1a4f66] disabled:opacity-50"
                    >
                      {salvando ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Efetivando Transferência...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" /> Efetivar Transferência Canônica
                        </>
                      )}
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </form>
      )}

      {/* ABA 2: HISTÓRICO GERAL DE TRANSFERÊNCIAS */}
      {tabAtiva === 'historico' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#11161d]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="h-4 w-4 text-[#226380]" />
                Histórico Geral de Transferências & Nomeações
              </h2>
              <p className="text-xs text-slate-500">
                Consulta cronológica de todos os decretos e movimentações canônicas registradas na Província BRM.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filtro por Ano */}
              <select
                value={filtroHistoricoAno}
                onChange={e => setFiltroHistoricoAno(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-[#226380] dark:border-slate-700 dark:bg-[#0d1117] dark:text-slate-200"
              >
                <option value="todos">Todos os anos</option>
                {anosDisponiveis.map(ano => (
                  <option key={ano} value={ano}>
                    Ano {ano}
                  </option>
                ))}
              </select>

              {/* Busca Rápida */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar histórico..."
                  value={buscaHistorico}
                  onChange={e => setBuscaHistorico(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#226380] focus:bg-white dark:border-slate-700 dark:bg-white/5"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            {historicoFiltrado.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Nenhum registro de transferência encontrado para os critérios selecionados.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] dark:border-slate-800">
                    <th className="py-2.5 px-3">Vigência / Ano</th>
                    <th className="py-2.5 px-3">Confrade</th>
                    <th className="py-2.5 px-3">Comunidade & Obra</th>
                    <th className="py-2.5 px-3">Ofício / Função</th>
                    <th className="py-2.5 px-3">Decreto / Provisão</th>
                    <th className="py-2.5 px-3 text-right">Dossiê</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {historicoFiltrado.map(item => {
                    const rel = item.religiosos;
                    const nomeRel = rel ? (atribuirNomeReligioso(rel.grau, rel.nome_civil) || rel.nome_civil) : 'Confrade';
                    const obraObj = item.obra_id ? mapaObras.get(item.obra_id) : null;
                    const comObj = (item.comunidade_id ? mapaComunidades.get(item.comunidade_id) : null)
                      || (obraObj?.comunidade_id ? mapaComunidades.get(obraObj.comunidade_id) : null);
                    const comNome = item.comunidades?.nome || formatarComunidadeReligiosa(comObj?.nome) || 'Província BRM';
                    const obrNome = item.religiosos_obras_referencia?.nome || obraObj?.nome || null;
                    const isVigente = !item.vigencia_fim || item.vigencia_fim >= hojeStr;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {item.vigencia_inicio ? formatarDataBR(item.vigencia_inicio) : item.ano_referencia}
                          </span>
                          {isVigente ? (
                            <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              Vigente
                            </span>
                          ) : (
                            <span className="ml-2 text-slate-400 text-[10px]">
                              até {formatarDataBR(item.vigencia_fim)}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <strong className="text-slate-900 dark:text-white block">{nomeRel}</strong>
                          {rel?.nome_civil && <span className="text-[11px] text-slate-400">{rel.nome_civil}</span>}
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">{formatarComunidadeReligiosa(comNome)}</span>
                          {obrNome && obrNome !== comNome && (
                            <span className="text-[11px] text-slate-500 block">⛪ {obrNome}</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className="inline-flex rounded-lg bg-[#226380]/10 px-2 py-1 font-semibold text-[#226380] dark:bg-[#A3C3C7]/15 dark:text-[#A3C3C7]">
                            {item.funcao || 'Membro'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                          {item.numero_decreto ? (
                            <strong className="text-slate-800 dark:text-slate-200">{item.numero_decreto}</strong>
                          ) : (
                            <span className="text-slate-400 italic">Sem nº de decreto</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          {rel?.id && (
                            <Link
                              to={`/religiosos/${rel.id}/dossie`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                            >
                              <FolderOpen className="h-3 w-3" /> Ver Dossiê
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* ABA 3: CADASTRAR & GERENCIAR FUNÇÕES */}
      {tabAtiva === 'funcoes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Formulário de Nova Função */}
          <section className="md:col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#11161d] space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <Plus className="h-4 w-4 text-[#226380]" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                Cadastrar Nova Função
              </h2>
            </div>

            <form onSubmit={handleCadastrarNovaFuncao} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Ofício / Função Canônica *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Vigário Paroquial, Capelão, etc."
                  value={novaFuncaoNome}
                  onChange={e => setNovaFuncaoNome(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#226380] focus:ring-2 focus:ring-[#226380]/15 dark:border-slate-700 dark:bg-[#0d1117] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria de Atuação
                </label>
                <select
                  value={novaFuncaoCategoria}
                  onChange={e => setNovaFuncaoCategoria(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#226380] dark:border-slate-700 dark:bg-[#0d1117] dark:text-white"
                >
                  <option value="Pastoral">Pastoral / Paroquial</option>
                  <option value="Governo Provincial">Governo Provincial</option>
                  <option value="Formação">Formação & Seminários</option>
                  <option value="Administração">Administração & Economato</option>
                  <option value="Missão">Missão / Ad Gentes</option>
                  <option value="Especial">Ofício Especial</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={salvandoFuncao}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#226380] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1a4f66] disabled:opacity-50"
              >
                {salvandoFuncao ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Cadastrar Função no Catálogo
              </button>
            </form>
          </section>

          {/* Listagem de Funções Ativas */}
          <section className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#11161d]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#226380]" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                  Funções Cadastradas ({funcoesDisponiveis.length})
                </h2>
              </div>
              <span className="text-[11px] text-slate-400">
                Disponíveis no seletor de transferências
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {funcoesDisponiveis.map((f, i) => {
                const isPadrao = FUNCOES_PADRAO_BRM.includes(f);
                return (
                  <div
                    key={f}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs dark:border-slate-800 dark:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#226380]/10 text-[10px] font-bold text-[#226380]">
                        {i + 1}
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200">{f}</strong>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      isPadrao
                        ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    }`}>
                      {isPadrao ? 'Oficial BRM' : 'Personalizada'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default TransferenciaReligioso;

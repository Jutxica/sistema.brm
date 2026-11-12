import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Send, CheckCircle2, AlertCircle, AlertTriangle, RefreshCw, 
  Users, Search, ExternalLink, Square, Filter
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { showToast, confirmAction } from '../hooks/useFeedback';
import { atribuirNomeReligioso } from '../lib/religiosoNome';
import type { Religioso } from '../types/religioso';

type ViewModo = 'elenco' | 'teste' | 'modelo';

interface ItemLog {
  id: string;
  nome: string;
  email: string;
  status: 'pendente' | 'enviando' | 'sucesso' | 'erro';
  mensagem?: string;
  resendId?: string;
}

export const DispararCredenciaisPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('religioso');

  const [religiosos, setReligiosos] = useState<Religioso[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewModo, setViewModo] = useState<ViewModo>('elenco');

  // Estados de Disparo para o Elenco
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendentes' | 'enviados'>('pendentes');
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  
  // Execução do lote
  const [disparandoLote, setDisparandoLote] = useState(false);
  const [progressoLote, setProgressoLote] = useState({
    total: 0,
    atual: 0,
    sucessos: 0,
    falhas: 0,
    atualNome: '',
  });
  const [logsLote, setLogsLote] = useState<ItemLog[]>([]);
  const abortBatchRef = useRef(false);

  // Estados do Envio de Teste (1 ou 2 destinatários)
  const [emailTeste1, setEmailTeste1] = useState('');
  const [emailTeste2, setEmailTeste2] = useState('');
  const [nomeTeste, setNomeTeste] = useState('Pe. João da Silva, SCJ');
  const [senhaTeste, setSenhaTeste] = useState('brm@15081978');
  const [enviandoTeste, setEnviandoTeste] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<{
    executado: boolean;
    itens: { email: string; ok: boolean; id?: string; error?: string }[];
  } | null>(null);
  const [erroPublicacaoEdgeFunction, setErroPublicacaoEdgeFunction] = useState<boolean>(false);

  // Carregar lista de religiosos da base
  const carregarReligiosos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('religiosos')
        .select('id,nome_civil,nome_religioso,nome_elenco,grau,status,situacao_elenco,comunidade_atual_nome,email_institucional,email_pessoal,data_nascimento,credenciais_enviadas_em,credenciais_enviadas_por')
        .order('nome_elenco')
        .order('nome_civil');

      if (error) throw error;
      const lista = (data || []) as Religioso[];
      setReligiosos(lista);

      if (preselectedId) {
        setSelecionados(new Set([preselectedId]));
        setFiltroStatus('todos');
      }
    } catch (err: any) {
      console.error('Erro ao carregar religiosos:', err);
      showToast.error(`Não foi possível carregar os religiosos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [preselectedId]);

  useEffect(() => {
    void carregarReligiosos();
  }, [carregarReligiosos]);

  // Estatísticas da base
  const stats = useMemo(() => {
    let total = religiosos.length;
    let aptos = 0;
    let semEmail = 0;
    let jaEnviados = 0;

    for (const r of religiosos) {
      const email = (r.email_institucional || r.email_pessoal || '').trim();
      if (!email || !email.includes('@')) {
        semEmail++;
      } else {
        aptos++;
      }
      if (r.credenciais_enviadas_em) {
        jaEnviados++;
      }
    }

    return { total, aptos, semEmail, jaEnviados };
  }, [religiosos]);

  // Filtro de religiosos na tabela
  const religiososFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return religiosos.filter(r => {
      const email = (r.email_institucional || r.email_pessoal || '').trim().toLowerCase();
      const nome = (r.nome_elenco || r.nome_religioso || r.nome_civil || '').toLowerCase();
      const comunidade = (r.comunidade_atual_nome || '').toLowerCase();

      if (filtroStatus === 'pendentes' && r.credenciais_enviadas_em) return false;
      if (filtroStatus === 'enviados' && !r.credenciais_enviadas_em) return false;

      if (!q) return true;
      return nome.includes(q) || email.includes(q) || comunidade.includes(q);
    });
  }, [religiosos, busca, filtroStatus]);

  const handleSelecionarTodos = () => {
    const novos = new Set<string>();
    for (const r of religiososFiltrados) {
      const email = (r.email_institucional || r.email_pessoal || '').trim();
      if (email && email.includes('@')) {
        novos.add(r.id);
      }
    }
    setSelecionados(novos);
  };

  const handleDesmarcarTodos = () => {
    setSelecionados(new Set());
  };

  const toggleSelecionado = (id: string) => {
    setSelecionados(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  // Disparo de Teste
  const handleEnviarTeste = async (e: React.FormEvent) => {
    e.preventDefault();
    const destinatarios = [emailTeste1.trim(), emailTeste2.trim()].filter(em => em && em.includes('@'));

    if (!destinatarios.length) {
      showToast.error('Informe ao menos um e-mail válido para o teste.');
      return;
    }

    setEnviandoTeste(true);
    setResultadoTeste(null);

    try {
      setErroPublicacaoEdgeFunction(false);
      const res = await supabase.functions.invoke('disparar-credenciais-religioso', {
        body: {
          modo: 'teste',
          destinatarios,
          nome_teste: nomeTeste.trim() || 'Pe. João da Silva, SCJ',
          senha_teste: senhaTeste.trim() || 'brm@15081978',
          operador_nome: 'Secretaria Provincial',
        },
      });

      if (res.error) throw res.error;

      const data = res.data;
      if (data && data.resultados) {
        setResultadoTeste({
          executado: true,
          itens: data.resultados,
        });

        const erros = data.resultados.filter((it: any) => !it.ok);
        if (erros.length === 0) {
          showToast.success(`E-mail de teste enviado com sucesso para ${destinatarios.length} destinatário(s)!`);
        } else {
          showToast.warning('O teste foi disparado, mas houve aviso em um dos endereços.');
        }
      }
    } catch (err: any) {
      console.error('Falha no envio de teste:', err);
      const msg = err?.message || String(err || '');
      const isNotFound = msg.includes('Failed to send a request') || msg.includes('FunctionsFetchError') || msg.includes('NOT_FOUND') || msg.includes('404');
      if (isNotFound) {
        setErroPublicacaoEdgeFunction(true);
        showToast.error('A Edge Function "disparar-credenciais-religioso" ainda não foi publicada no projeto Supabase em produção (ukhxcwzifugxdkdhobsi).');
      } else {
        showToast.error(`Erro ao disparar teste: ${msg || 'Falha na Edge Function'}`);
      }
    } finally {
      setEnviandoTeste(false);
    }
  };

  // Iniciar Disparo em Lote
  const handleIniciarDisparoLote = async () => {
    if (selecionados.size === 0) {
      showToast.error('Selecione ao menos um confrade para o disparo.');
      return;
    }

    const confirmou = await confirmAction({
      title: 'Disparo de Credenciais do Portal',
      badge: 'Secretaria Provincial · Envio em Lote',
      message: `Deseja realmente disparar os e-mails com as credenciais iniciais para ${selecionados.size} confrade(s) selecionado(s)?`,
      detail: 'Os e-mails serão enviados via Resend a partir de secretaria@brm.org.br com intervalo de segurança.',
      confirmLabel: 'Iniciar Disparo',
      cancelLabel: 'Cancelar',
    });

    if (!confirmou) return;

    setDisparandoLote(true);
    abortBatchRef.current = false;

    const listaParaEnviar = religiosos.filter(r => selecionados.has(r.id));
    setProgressoLote({
      total: listaParaEnviar.length,
      atual: 0,
      sucessos: 0,
      falhas: 0,
      atualNome: '',
    });

    const logsIniciais: ItemLog[] = listaParaEnviar.map(r => ({
      id: r.id,
      nome: atribuirNomeReligioso(r.grau, r.nome_elenco || r.nome_religioso || r.nome_civil),
      email: (r.email_institucional || r.email_pessoal || '').trim(),
      status: 'pendente',
    }));
    setLogsLote(logsIniciais);

    let sucessosCount = 0;
    let falhasCount = 0;

    for (let i = 0; i < listaParaEnviar.length; i++) {
      if (abortBatchRef.current) {
        showToast.warning('O disparo em lote foi interrompido.');
        break;
      }

      const rel = listaParaEnviar[i];
      const nomeTratamento = atribuirNomeReligioso(rel.grau, rel.nome_elenco || rel.nome_religioso || rel.nome_civil);
      const email = (rel.email_institucional || rel.email_pessoal || '').trim();

      setProgressoLote(prev => ({
        ...prev,
        atual: i + 1,
        atualNome: nomeTratamento,
      }));

      setLogsLote(prev => prev.map(item => 
        item.id === rel.id ? { ...item, status: 'enviando' } : item
      ));

      if (!email || !email.includes('@')) {
        falhasCount++;
        setLogsLote(prev => prev.map(item => 
          item.id === rel.id ? { ...item, status: 'erro', mensagem: 'Sem e-mail cadastrado' } : item
        ));
        setProgressoLote(prev => ({ ...prev, falhas: falhasCount }));
        continue;
      }

      try {
        const res = await supabase.functions.invoke('disparar-credenciais-religioso', {
          body: {
            modo: 'individual',
            religioso_id: rel.id,
            operador_nome: 'Secretaria Provincial',
          },
        });

        if (res.error) throw res.error;

        const data = res.data;
        if (data && data.enviados > 0) {
          sucessosCount++;
          const envioInfo = data.relatorio?.[0];
          setLogsLote(prev => prev.map(item => 
            item.id === rel.id ? { 
              ...item, 
              status: 'sucesso', 
              resendId: envioInfo?.resendId || 'OK',
              mensagem: 'Enviado com sucesso' 
            } : item
          ));
        } else {
          falhasCount++;
          const erroInfo = data.relatorio?.[0];
          setLogsLote(prev => prev.map(item => 
            item.id === rel.id ? { 
              ...item, 
              status: 'erro', 
              mensagem: erroInfo?.motivo || 'Falha no envio via Resend' 
            } : item
          ));
        }
      } catch (err: any) {
        falhasCount++;
        const msg = err?.message || String(err || '');
        const isNotFound = msg.includes('Failed to send a request') || msg.includes('FunctionsFetchError') || msg.includes('NOT_FOUND') || msg.includes('404');

        setLogsLote(prev => prev.map(item => 
          item.id === rel.id ? { 
            ...item, 
            status: 'erro', 
            mensagem: isNotFound ? 'Edge Function não publicada no Supabase' : (err.message || 'Erro de conexão')
          } : item
        ));

        if (isNotFound) {
          setErroPublicacaoEdgeFunction(true);
          showToast.error('Disparo interrompido: a Edge Function "disparar-credenciais-religioso" não está implantada no Supabase.');
          break;
        }
      }

      setProgressoLote(prev => ({
        ...prev,
        sucessos: sucessosCount,
        falhas: falhasCount,
      }));

      await new Promise(r => setTimeout(r, 700));
    }

    setDisparandoLote(false);
    showToast.success(`Disparo concluído: ${sucessosCount} enviados com sucesso, ${falhasCount} falhas.`);
    await carregarReligiosos();
  };

  const handleInterromperLote = () => {
    abortBatchRef.current = true;
    setDisparandoLote(false);
  };

  // Disparo individual direto na linha
  const handleDispararIndividual = async (rel: Religioso) => {
    const nomeTratamento = atribuirNomeReligioso(rel.grau, rel.nome_elenco || rel.nome_religioso || rel.nome_civil);
    const email = (rel.email_institucional || rel.email_pessoal || '').trim();

    if (!email || !email.includes('@')) {
      showToast.error(`O confrade ${nomeTratamento} não possui e-mail cadastrado.`);
      return;
    }

    const confirmou = await confirmAction({
      title: 'Disparo de Credenciais',
      badge: 'Secretaria Provincial',
      message: `Enviar e-mail com as credenciais de acesso para ${nomeTratamento}?`,
      detail: `Destinatário: ${email}`,
      confirmLabel: 'Enviar Agora',
      cancelLabel: 'Cancelar',
    });

    if (!confirmou) return;

    try {
      const res = await supabase.functions.invoke('disparar-credenciais-religioso', {
        body: {
          modo: 'individual',
          religioso_id: rel.id,
          operador_nome: 'Secretaria Provincial',
        },
      });

      if (res.error) throw res.error;

      showToast.success(`Credenciais enviadas para ${nomeTratamento} (${email})!`);
      await carregarReligiosos();
    } catch (err: any) {
      console.error('Erro no envio individual:', err);
      showToast.error(`Não foi possível enviar: ${err.message || 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Cabeçalho da Página */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/secretaria/elenco')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Elenco</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.18em] text-[#226380] dark:text-[#A3C3C7]">
              Secretaria Provincial · Portal do Religioso
            </span>
          </div>

          <h1 className="font-cinzel text-2xl font-bold tracking-tight text-[#113240] dark:text-white sm:text-3xl pt-1">
            Disparo de Credenciais
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
            Gestão e envio oficial de credenciais de primeiro acesso para os confrades da Província Brasileira Meridional.
          </p>
        </div>

        {/* Botão de Atualizar Base */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={carregarReligiosos}
            disabled={loading || disparandoLote}
            className="inline-flex items-center gap-2 rounded-[6px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar Base</span>
          </button>
        </div>
      </header>

      {/* Barra de Indicadores Oficiais */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#161b22]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total do Elenco</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{stats.total}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#161b22]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Aptos (com e-mail)</p>
          <p className="mt-1 text-2xl font-bold text-[#113240] dark:text-[#A3C3C7] tabular-nums">{stats.aptos}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#161b22]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Já Notificados</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{stats.jaEnviados}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#161b22]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pendente de E-mail</p>
          <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">{stats.semEmail}</p>
        </div>
      </section>

      {/* Navegação de Abas da Página */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setViewModo('elenco')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            viewModo === 'elenco'
              ? 'border-[#113240] text-[#113240] dark:border-white dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Disparo para o Elenco</span>
        </button>

        <button
          type="button"
          onClick={() => setViewModo('teste')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            viewModo === 'teste'
              ? 'border-[#113240] text-[#113240] dark:border-white dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Envio de Teste (Homologação)</span>
        </button>

        <button
          type="button"
          onClick={() => setViewModo('modelo')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            viewModo === 'modelo'
              ? 'border-[#113240] text-[#113240] dark:border-white dark:text-white'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Modelo Oficial do E-mail</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* SEÇÃO 1: DISPARO PARA O ELENCO */}
      {/* ===================================================================== */}
      {viewModo === 'elenco' && (
        <div className="space-y-4">
          
          {/* Painel de Progresso durante Disparo em Lote */}
          {disparandoLote && (
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#161b22] border border-slate-300 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-[#113240] dark:text-white">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#226380]" />
                  Processando envio: {progressoLote.atual} de {progressoLote.total} — {progressoLote.atualNome}
                </span>
                <button
                  type="button"
                  onClick={handleInterromperLote}
                  className="px-3 py-1.5 rounded bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Interromper Disparo</span>
                </button>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#113240] dark:bg-[#226380] h-full transition-all duration-300"
                  style={{ width: `${(progressoLote.atual / (progressoLote.total || 1)) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Sucessos: <strong className="text-emerald-700 dark:text-emerald-400">{progressoLote.sucessos}</strong></span>
                <span>Falhas: <strong className="text-rose-700 dark:text-rose-400">{progressoLote.falhas}</strong></span>
                <span>Restantes: <strong>{progressoLote.total - progressoLote.atual}</strong></span>
              </div>
            </div>
          )}

          {/* Barra de Filtros e Seleção */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar por nome do confrade, e-mail ou comunidade..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#226380]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-[#10171B]">
                <button
                  type="button"
                  onClick={() => setFiltroStatus('pendentes')}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    filtroStatus === 'pendentes'
                      ? 'bg-[#113240] text-white dark:bg-[#226380]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Apenas Pendentes
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStatus('enviados')}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    filtroStatus === 'enviados'
                      ? 'bg-[#113240] text-white dark:bg-[#226380]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Já Notificados
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStatus('todos')}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    filtroStatus === 'todos'
                      ? 'bg-[#113240] text-white dark:bg-[#226380]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Todos
                </button>
              </div>

              <span className="text-slate-300 dark:text-slate-700">|</span>

              <button
                type="button"
                onClick={handleSelecionarTodos}
                className="text-xs font-semibold text-[#226380] dark:text-[#A3C3C7] hover:underline"
              >
                Selecionar Exibidos ({religiososFiltrados.length})
              </button>

              <button
                type="button"
                onClick={handleDesmarcarTodos}
                className="text-xs text-slate-500 hover:underline"
              >
                Limpar Seleção
              </button>
            </div>
          </div>

          {/* Tabela do Elenco */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#10171B] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selecionados.size > 0 && selecionados.size === religiososFiltrados.length}
                        onChange={e => e.target.checked ? handleSelecionarTodos() : handleDesmarcarTodos()}
                        className="rounded text-[#113240]"
                      />
                    </th>
                    <th className="p-3 font-semibold uppercase tracking-wider">Confrade</th>
                    <th className="p-3 font-semibold uppercase tracking-wider">E-mail de Acesso</th>
                    <th className="p-3 font-semibold uppercase tracking-wider">Comunidade Atual</th>
                    <th className="p-3 font-semibold uppercase tracking-wider">Status do Envio</th>
                    <th className="p-3 font-semibold uppercase tracking-wider text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-inter">
                  {religiososFiltrados.map(rel => {
                    const email = (rel.email_institucional || rel.email_pessoal || '').trim();
                    const semEmail = !email || !email.includes('@');
                    const selecionado = selecionados.has(rel.id);
                    const nomeTratamento = atribuirNomeReligioso(rel.grau, rel.nome_elenco || rel.nome_religioso || rel.nome_civil);

                    return (
                      <tr 
                        key={rel.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          selecionado ? 'bg-sky-50/40 dark:bg-[#142630]' : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            disabled={semEmail || disparandoLote}
                            checked={selecionado}
                            onChange={() => toggleSelecionado(rel.id)}
                            className="rounded text-[#113240] disabled:opacity-30"
                          />
                        </td>
                        <td className="p-3 font-medium text-slate-900 dark:text-white">
                          {nomeTratamento}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {semEmail ? (
                            <span className="text-amber-700 dark:text-amber-400 font-medium">Pendente de e-mail</span>
                          ) : (
                            email
                          )}
                        </td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">
                          {rel.comunidade_atual_nome || '—'}
                        </td>
                        <td className="p-3">
                          {rel.credenciais_enviadas_em ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Enviado em {new Date(rel.credenciais_enviadas_em).toLocaleDateString('pt-BR')}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">Ainda não enviado</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            disabled={semEmail || disparandoLote}
                            onClick={() => void handleDispararIndividual(rel)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                          >
                            <Mail className="w-3.5 h-3.5 text-[#226380]" />
                            <span>{rel.credenciais_enviadas_em ? 'Reenviar' : 'Enviar'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {religiososFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Nenhum confrade corresponde aos filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Barra de Ação Inferior */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#10171B]">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-white font-semibold">{selecionados.size}</strong> confrade(s) selecionado(s) para o disparo.
              </div>

              <button
                type="button"
                disabled={disparandoLote || selecionados.size === 0}
                onClick={handleIniciarDisparoLote}
                className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-[#113240] hover:bg-[#1A4355] text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Disparar Credenciais para os Selecionados ({selecionados.size})</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* SEÇÃO 2: ENVIO DE TESTE (HOMOLOGAÇÃO) */}
      {/* ===================================================================== */}
      {viewModo === 'teste' && (
        <div className="max-w-3xl space-y-6">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Homologação de Envio
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Dispare uma mensagem de teste para um ou dois e-mails sob seu controle para inspecionar a entrega na caixa de entrada e a formatação no cliente de e-mail.
              </p>
            </div>

            <form onSubmit={handleEnviarTeste} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail de Teste 1 <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="seu.email@dominio.com"
                    value={emailTeste1}
                    onChange={e => setEmailTeste1(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-900 dark:text-white focus:outline-none focus:border-[#226380]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail de Teste 2 <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="outro.email@dominio.com"
                    value={emailTeste2}
                    onChange={e => setEmailTeste2(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-900 dark:text-white focus:outline-none focus:border-[#226380]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome / Tratamento Simulado
                  </label>
                  <input
                    type="text"
                    value={nomeTeste}
                    onChange={e => setNomeTeste(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-900 dark:text-white focus:outline-none focus:border-[#226380]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Senha Provisória Simulada
                  </label>
                  <input
                    type="text"
                    value={senhaTeste}
                    onChange={e => setSenhaTeste(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#226380]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={enviandoTeste}
                  className="px-5 py-2.5 rounded-md bg-[#113240] hover:bg-[#1A4355] text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {enviandoTeste ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando pelo Resend...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Disparar E-mail(s) de Teste</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Painel de Resultados do Teste */}
            {resultadoTeste && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-md p-4 bg-slate-50 dark:bg-[#10171B] space-y-3">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Retorno do Envio de Teste
                </h3>
                <div className="space-y-2">
                  {resultadoTeste.itens.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded border text-xs ${
                        item.ok
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                        <span className="font-semibold">{item.email}</span>
                      </div>
                      <div className="text-[11px] font-mono">
                        {item.ok ? `Resend ID: ${item.id}` : `Erro: ${item.error}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Alerta Institucional de Publicação da Edge Function */}
            {erroPublicacaoEdgeFunction && (
              <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/60 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Edge Function pendente de publicação no Supabase</span>
                </div>
                <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                  A função <code className="font-mono font-semibold px-1 py-0.5 rounded bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900">disparar-credenciais-religioso</code> ainda não foi implantada no seu projeto Supabase em produção (<strong>ukhxcwzifugxdkdhobsi</strong>). Para ativá-la:
                </p>
                <div className="space-y-2 pt-1">
                  <p className="font-semibold text-slate-900 dark:text-white">Opção 1 — Via Supabase CLI (Terminal):</p>
                  <div className="bg-slate-900 text-slate-100 p-2.5 rounded font-mono text-[11px] select-all overflow-x-auto">
                    npx supabase functions deploy disparar-credenciais-religioso --project-ref ukhxcwzifugxdkdhobsi --no-verify-jwt
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white pt-1">Opção 2 — Via Painel Web do Supabase:</p>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed pl-2 border-l-2 border-amber-300 dark:border-amber-700 space-y-1">
                    <p>1. Acesse <strong>Edge Functions</strong> no painel do Supabase e crie uma função com o nome <code className="font-mono">disparar-credenciais-religioso</code>.</p>
                    <p>2. Cole o código de <code className="font-mono">supabase/functions/disparar-credenciais-religioso/index.ts</code> e clique em <strong>Deploy</strong>.</p>
                    <p>3. Em <strong>Project Settings &gt; Edge Functions &gt; Secrets</strong>, certifique-se de configurar a chave <code className="font-mono">RESEND_API_KEY</code>.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SEÇÃO 3: MODELO OFICIAL DO E-MAIL */}
      {/* ===================================================================== */}
      {viewModo === 'modelo' && (
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Visualização fiel do e-mail com a identidade timbrada e cabeçalho oficial:</span>
            <a
              href="/templates/preview-credenciais-exemplo.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[#226380] hover:underline font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Modelo em Nova Janela</span>
            </a>
          </div>

          <div className="rounded-lg border border-slate-300 dark:border-slate-800 overflow-hidden bg-[#F3F6F8]">
            <iframe
              title="Prévia do E-mail Oficial de Credenciais"
              src="/templates/preview-credenciais-exemplo.html"
              className="w-full h-[620px] border-none bg-[#F3F6F8]"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default DispararCredenciaisPage;

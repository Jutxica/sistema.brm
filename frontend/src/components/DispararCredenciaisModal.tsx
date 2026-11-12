import React, { useState, useMemo, useRef } from 'react';
import { 
  X, Mail, Send, CheckCircle2, AlertCircle, RefreshCw, 
  Users, Search, ShieldCheck, Eye, Check, AlertTriangle, 
  ExternalLink, Pause, Play, Square, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { showToast, confirmAction } from '../hooks/useFeedback';
import { atribuirNomeReligioso } from '../lib/religiosoNome';
import type { Religioso } from '../types/religioso';

interface DispararCredenciaisModalProps {
  aberto: boolean;
  onClose: () => void;
  religiosos: Religioso[];
  onReligiososAtualizados?: () => void;
  operadorNome?: string;
  religiosoPreselecionado?: Religioso | null;
}

type TabTipo = 'teste' | 'lote' | 'previa';

interface ItemLog {
  id: string;
  nome: string;
  email: string;
  status: 'pendente' | 'enviando' | 'sucesso' | 'erro';
  mensagem?: string;
  resendId?: string;
}

export const DispararCredenciaisModal: React.FC<DispararCredenciaisModalProps> = ({
  aberto,
  onClose,
  religiosos,
  onReligiososAtualizados,
  operadorNome = 'Secretaria Provincial',
  religiosoPreselecionado,
}) => {
  const [tabAtiva, setTabAtiva] = useState<TabTipo>(religiosoPreselecionado ? 'lote' : 'teste');

  // Estados da Aba de Teste (1 a 2 destinatários)
  const [emailTeste1, setEmailTeste1] = useState('');
  const [emailTeste2, setEmailTeste2] = useState('');
  const [nomeTratamentoTeste, setNomeTratamentoTeste] = useState('Pe. João da Silva, SCJ');
  const [senhaProvisoriaTeste, setSenhaProvisoriaTeste] = useState('brm@15081978');
  const [enviandoTeste, setEnviandoTeste] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<{
    executado: boolean;
    itens: { email: string; ok: boolean; id?: string; error?: string }[];
  } | null>(null);

  // Estados da Aba de Disparo em Lote
  const [buscaLote, setBuscaLote] = useState('');
  const [filtroApenasNaoEnviados, setFiltroApenasNaoEnviados] = useState(true);
  const [selecionados, setSelecionados] = useState<Set<string>>(
    () => new Set(religiosoPreselecionado ? [religiosoPreselecionado.id] : [])
  );
  const [disparandoLote, setDisparandoLote] = useState(false);
  const [lotePausado, setLotePausado] = useState(false);
  const [progressoLote, setProgressoLote] = useState({
    total: 0,
    atual: 0,
    sucessos: 0,
    falhas: 0,
    atualNome: '',
  });
  const [logsLote, setLogsLote] = useState<ItemLog[]>([]);
  const abortBatchRef = useRef(false);

  // Estatísticas do Elenco
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

  // Lista filtrada para disparo
  const religiososFiltrados = useMemo(() => {
    const q = buscaLote.trim().toLowerCase();
    return religiosos.filter(r => {
      const email = (r.email_institucional || r.email_pessoal || '').trim().toLowerCase();
      const nome = (r.nome_elenco || r.nome_religioso || r.nome_civil || '').toLowerCase();
      const comunidade = (r.comunidade_atual_nome || '').toLowerCase();

      // Filtro de enviados
      if (filtroApenasNaoEnviados && r.credenciais_enviadas_em) {
        return false;
      }

      if (!q) return true;
      return nome.includes(q) || email.includes(q) || comunidade.includes(q);
    });
  }, [religiosos, buscaLote, filtroApenasNaoEnviados]);

  // Selecionar todos os filtrados aptos
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
      if (copy.has(id)) {
        copy.delete(id);
      } else {
        copy.add(id);
      }
      return copy;
    });
  };

  // Disparo de Teste (1 ou 2 destinatários)
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
      const res = await supabase.functions.invoke('disparar-credenciais-religioso', {
        body: {
          modo: 'teste',
          destinatarios,
          nome_teste: nomeTratamentoTeste.trim() || 'Pe. João da Silva, SCJ',
          senha_teste: senhaProvisoriaTeste.trim() || 'brm@15081978',
          operador_nome: operadorNome,
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
          showToast.warning('O teste foi disparado, mas um ou mais envios retornaram aviso.');
        }
      }
    } catch (err: any) {
      console.error('Falha no envio de teste:', err);
      showToast.error(`Erro ao disparar teste: ${err.message || 'Falha na Edge Function'}`);
    } finally {
      setEnviandoTeste(false);
    }
  };

  // Disparo em Lote
  const handleIniciarDisparoLote = async () => {
    if (selecionados.size === 0) {
      showToast.error('Nenhum confrade selecionado para o disparo.');
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
    setLotePausado(false);
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
        showToast.warning('O disparo em lote foi interrompido pelo operador.');
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
            operador_nome: operadorNome,
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
        setLogsLote(prev => prev.map(item => 
          item.id === rel.id ? { 
            ...item, 
            status: 'erro', 
            mensagem: err.message || 'Erro de conexão' 
          } : item
        ));
      }

      setProgressoLote(prev => ({
        ...prev,
        sucessos: sucessosCount,
        falhas: falhasCount,
      }));

      // Intervalo de segurança de 700ms entre chamadas
      await new Promise(r => setTimeout(r, 700));
    }

    setDisparandoLote(false);
    showToast.success(`Disparo concluído: ${sucessosCount} enviados com sucesso, ${falhasCount} falhas.`);
    if (onReligiososAtualizados) {
      onReligiososAtualizados();
    }
  };

  const handleCancelarLote = () => {
    abortBatchRef.current = true;
    setDisparandoLote(false);
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5">
      <div className="flex flex-col w-full max-w-4xl max-h-[92vh] bg-white dark:bg-[#131E24] border border-[#DCE4E2] dark:border-[#203038] rounded-xl shadow-2xl overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCE4E2] dark:border-[#203038] bg-[#FAFBFB] dark:bg-[#111A20]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#113240] text-white flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-[#88B8C9]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#113240] dark:text-white flex items-center gap-2">
                Disparo de Credenciais · Portal do Religioso
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Secretaria Provincial · Envio oficial de credenciais de primeiro acesso
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={disparandoLote}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex items-center border-b border-[#DCE4E2] dark:border-[#203038] bg-white dark:bg-[#131E24] px-6">
          <button
            type="button"
            onClick={() => setTabAtiva('teste')}
            disabled={disparandoLote}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              tabAtiva === 'teste'
                ? 'border-[#226380] text-[#226380] dark:text-[#A3C3C7] dark:border-[#A3C3C7]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>1. Teste de Homologação (1 ou 2 pessoas)</span>
          </button>

          <button
            type="button"
            onClick={() => setTabAtiva('lote')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              tabAtiva === 'lote'
                ? 'border-[#226380] text-[#226380] dark:text-[#A3C3C7] dark:border-[#A3C3C7]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Disparo do Elenco ({religiosos.length} Confrades)</span>
          </button>

          <button
            type="button"
            onClick={() => setTabAtiva('previa')}
            disabled={disparandoLote}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              tabAtiva === 'previa'
                ? 'border-[#226380] text-[#226380] dark:text-[#A3C3C7] dark:border-[#A3C3C7]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>3. Modelo do E-mail Aprovado</span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-700 dark:text-slate-300">
          
          {/* ================================================================= */}
          {/* ABA 1: TESTE DE HOMOLOGAÇÃO */}
          {/* ================================================================= */}
          {tabAtiva === 'teste' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="p-4 rounded-lg bg-[#F4F8FA] dark:bg-[#16242C] border border-[#D5E2E6] dark:border-[#203642] text-xs leading-relaxed text-[#203642] dark:text-[#C5D7DF]">
                <strong className="font-semibold text-[#113240] dark:text-white">Envio de Validação Prévia:</strong><br />
                Dispare uma mensagem real de teste para o seu e-mail e/ou da equipe da Secretaria antes de enviar ao elenco. Verifique como a mensagem chega na sua Caixa de Entrada, o visual no celular e o link de acesso.
              </div>

              <form onSubmit={handleEnviarTeste} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      E-mail de Teste 1 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="seu.email@dominio.com"
                      value={emailTeste1}
                      onChange={e => setEmailTeste1(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#226380]"
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
                      className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#226380]"
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
                      value={nomeTratamentoTeste}
                      onChange={e => setNomeTratamentoTeste(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#226380]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Senha Provisória Simulada
                    </label>
                    <input
                      type="text"
                      value={senhaProvisoriaTeste}
                      onChange={e => setSenhaProvisoriaTeste(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-[#226380]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={enviandoTeste}
                    className="px-5 py-2.5 rounded-lg bg-[#113240] hover:bg-[#1A4355] text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
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

              {/* Resultado do Teste */}
              {resultadoTeste && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-[#10171B] space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    Retorno do Servidor de E-mail (Resend)
                  </h4>
                  <div className="space-y-2">
                    {resultadoTeste.itens.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded border text-xs ${
                          item.ok
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {item.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                          <span className="font-medium">{item.email}</span>
                        </div>
                        <div className="text-[11px] font-mono">
                          {item.ok ? `ID: ${item.id}` : `Erro: ${item.error}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* ABA 2: DISPARO PARA O ELENCO */}
          {/* ================================================================= */}
          {tabAtiva === 'lote' && (
            <div className="space-y-5">
              
              {/* Cards de Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-[#FAFBFB] dark:bg-[#10171B]">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total do Elenco</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.total}</div>
                </div>

                <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Aptos (com e-mail)</div>
                  <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">{stats.aptos}</div>
                </div>

                <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="text-[11px] font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider">Já Notificados</div>
                  <div className="text-xl font-bold text-blue-800 dark:text-blue-300 mt-0.5">{stats.jaEnviados}</div>
                </div>

                <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">Sem E-mail Cadastrado</div>
                  <div className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-0.5">{stats.semEmail}</div>
                </div>
              </div>

              {/* Barra de Progresso durante Disparo */}
              {disparandoLote && (
                <div className="p-4 rounded-lg bg-[#FAFBFB] dark:bg-[#10171B] border border-[#226380]/30 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2 text-[#226380] dark:text-[#A3C3C7]">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Processando envio: {progressoLote.atual} de {progressoLote.total} ({progressoLote.atualNome})
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelarLote}
                      className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-medium flex items-center gap-1"
                    >
                      <Square className="w-3 h-3" />
                      Interromper Disparo
                    </button>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#226380] h-full transition-all duration-300"
                      style={{ width: `${(progressoLote.atual / (progressoLote.total || 1)) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Sucessos: <strong className="text-emerald-600">{progressoLote.sucessos}</strong></span>
                    <span>Falhas: <strong className="text-rose-600">{progressoLote.falhas}</strong></span>
                    <span>Restantes: <strong>{progressoLote.total - progressoLote.atual}</strong></span>
                  </div>
                </div>
              )}

              {/* Filtros e Seleção */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar confrade, e-mail ou comunidade..."
                      value={buscaLote}
                      onChange={e => setBuscaLote(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#10171B] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#226380]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={filtroApenasNaoEnviados}
                      onChange={e => setFiltroApenasNaoEnviados(e.target.checked)}
                      className="rounded text-[#226380] focus:ring-0"
                    />
                    <span>Ocultar já notificados</span>
                  </label>

                  <span className="text-slate-300 dark:text-slate-700">|</span>

                  <button
                    type="button"
                    onClick={handleSelecionarTodos}
                    className="text-[#226380] dark:text-[#A3C3C7] hover:underline font-medium"
                  >
                    Selecionar Todos ({religiososFiltrados.length})
                  </button>

                  <button
                    type="button"
                    onClick={handleDesmarcarTodos}
                    className="text-slate-500 hover:underline"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              {/* Tabela do Elenco */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-[360px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#10171B] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selecionados.size > 0 && selecionados.size === religiososFiltrados.length}
                          onChange={e => e.target.checked ? handleSelecionarTodos() : handleDesmarcarTodos()}
                          className="rounded text-[#226380]"
                        />
                      </th>
                      <th className="p-2.5">Confrade</th>
                      <th className="p-2.5">E-mail Cadastrado</th>
                      <th className="p-2.5">Comunidade Atual</th>
                      <th className="p-2.5 text-right">Status de Disparo</th>
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
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              disabled={semEmail || disparandoLote}
                              checked={selecionado}
                              onChange={() => toggleSelecionado(rel.id)}
                              className="rounded text-[#226380] disabled:opacity-30"
                            />
                          </td>
                          <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                            {nomeTratamento}
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400">
                            {semEmail ? (
                              <span className="text-amber-600 dark:text-amber-400 text-[11px] font-medium">Pendente de e-mail</span>
                            ) : (
                              email
                            )}
                          </td>
                          <td className="p-2.5 text-slate-500 dark:text-slate-400">
                            {rel.comunidade_atual_nome || '—'}
                          </td>
                          <td className="p-2.5 text-right">
                            {rel.credenciais_enviadas_em ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Enviado em {new Date(rel.credenciais_enviadas_em).toLocaleDateString('pt-BR')}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Ainda não enviado</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {religiososFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          Nenhum confrade corresponde aos filtros atuais.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Botão de Ação do Disparo */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500">
                  <strong className="text-slate-800 dark:text-white">{selecionados.size}</strong> confrade(s) selecionado(s) para receber as credenciais.
                </div>

                <button
                  type="button"
                  disabled={disparandoLote || selecionados.size === 0}
                  onClick={handleIniciarDisparoLote}
                  className="px-5 py-2.5 rounded-lg bg-[#113240] hover:bg-[#1A4355] text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Disparar Credenciais para os Selecionados ({selecionados.size})</span>
                </button>
              </div>

            </div>
          )}

          {/* ================================================================= */}
          {/* ABA 3: MODELO DO E-MAIL APROVADO */}
          {/* ================================================================= */}
          {tabAtiva === 'previa' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Visualização fiel do e-mail oficial timbrado:</span>
                <a
                  href="/templates/preview-credenciais-exemplo.html"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#226380] hover:underline font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir em nova janela
                </a>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-[#F3F6F8]">
                <iframe
                  title="Prévia do E-mail Oficial de Credenciais"
                  srcDoc={`
                    <div style="font-family: -apple-system, sans-serif; padding: 20px; text-align: center;">
                      <a href="https://sistema.brm.org.br" target="_blank" style="text-decoration:none;">
                        <img src="https://sistema.brm.org.br/logo-sistema.png" width="160" style="margin-bottom: 10px;" />
                      </a>
                      <div style="color: #113240; font-size: 18px; font-weight: bold; margin-bottom: 15px;">Portal do Religioso · Credenciais de Primeiro Acesso</div>
                      <div style="background: white; border: 1px solid #dce5e8; border-radius: 8px; max-width: 520px; margin: 0 auto; padding: 24px; text-align: left; font-size: 13px; color: #203136; line-height: 1.6;">
                        <p><strong>Prezado Pe. João da Silva, SCJ,</strong></p>
                        <p>A Secretaria Provincial disponibiliza o seu acesso ao <strong>Portal do Religioso</strong> da Província Brasileira Meridional...</p>
                        <div style="background: #f7fafb; border: 1px solid #d5e2e6; border-left: 4px solid #226380; padding: 12px; margin: 15px 0; border-radius: 4px;">
                          <div><strong>E-mail:</strong> joao.silva@brm.org.br</div>
                          <div><strong>Senha Provisória:</strong> <code style="background:#e6eef1; padding: 2px 6px; border-radius: 3px;">brm@15081978</code></div>
                        </div>
                        <p style="border-left: 3px solid #cad8dc; padding-left: 10px; color: #526b75; font-size: 12px; margin-bottom: 14px;">
                          <strong>Observação:</strong> no primeiro acesso com a senha provisória, o sistema solicitará o cadastro de uma nova senha pessoal definitiva.
                        </p>
                        <p style="font-size: 12px; color: #374f59; margin-bottom: 18px;">
                          Concluída a alteração, o acesso ao Portal estará liberado para que você realize seu cadastro, anexe documentos e consulte a agenda provincial.
                        </p>
                        <div style="text-align: center; margin-top: 15px;">
                          <span style="background: #113240; color: white; padding: 10px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Acessar o Portal do Religioso &rarr;</span>
                        </div>
                      </div>
                      <div style="font-size: 11px; color: #627b85; margin-top: 15px; line-height: 1.5;">
                        <strong>Província Brasileira Meridional · Congregação dos Sacerdotes do Sagrado Coração de Jesus</strong><br>
                        Cúria Provincial · Rua Padre Gabriel Lux, 900 – Caixa Postal 21 · Corupá - SC · CEP 89278-000<br>
                        <em>Aviso: este e-mail contém credenciais temporárias de uso individual e intransferível.</em>
                      </div>
                    </div>
                  `}
                  className="w-full h-[460px] border-none bg-[#F3F6F8]"
                />
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

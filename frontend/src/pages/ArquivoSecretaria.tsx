import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, Check, Clock3, Download, FileLock2, FileUp, History, Loader2, LockKeyhole, RotateCcw, Send, ShieldCheck, Upload, X } from 'lucide-react';
import { showToast } from '../hooks/useFeedback';
import {
  arquivoSecretariaService,
  type DadosArquivamento,
  type EventoArquivo,
  type ProtocoloArquivo,
  type ReligiosoArquivo,
  type TipoDocumentoArquivo,
  type VersaoArquivo,
} from '../services/arquivoSecretariaService';

type ModoArquivo = 'patrimonio' | 'secretaria';

const TIPO_DOCUMENTO: Array<{ value: TipoDocumentoArquivo; label: string }> = [
  { value: 'testamento', label: 'Testamento' },
  { value: 'documento_pessoal', label: 'Documento pessoal' },
  { value: 'documento_canonico', label: 'Documento canônico' },
  { value: 'outro', label: 'Outro documento' },
];

const CLASSIFICACOES = [
  'Testamento',
  'Documento pessoal',
  'Documento canônico',
  'Documento patrimonial',
  'Correspondência',
  'Outro',
];

const STATUS: Record<ProtocoloArquivo['status'], string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado à Secretaria',
  em_conferencia: 'Em conferência',
  complementacao_solicitada: 'Complementação solicitada',
  recebido: 'Recebido pela Secretaria',
  classificado: 'Classificado',
  arquivado: 'Arquivado',
};

const DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const formatDate = (value: string) => DATE_FORMAT.format(new Date(value));
const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
    {children}
  </label>
);

const inputClass = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#226380] focus:ring-2 focus:ring-[#226380]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-md bg-[#113240] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#194b5d] disabled:cursor-not-allowed disabled:opacity-50';
const subtleButtonClass = 'inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';

export const ArquivoSecretaria: React.FC<{ modo: ModoArquivo }> = ({ modo }) => {
  const [protocolos, setProtocolos] = useState<ProtocoloArquivo[]>([]);
  const [religiosos, setReligiosos] = useState<ReligiosoArquivo[]>([]);
  const [details, setDetails] = useState<{
    protocolId: string;
    status: ProtocoloArquivo['status'] | undefined;
    versions: VersaoArquivo[];
    events: EventoArquivo[];
    archiveData: DadosArquivamento | null;
  } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [religiosoId, setReligiosoId] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoArquivo>('testamento');
  const [descricao, setDescricao] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submissionTarget, setSubmissionTarget] = useState<ProtocoloArquivo | null>(null);
  const [requestNote, setRequestNote] = useState('');
  const [classification, setClassification] = useState(CLASSIFICACOES[0]);
  const [reference, setReference] = useState('');
  const [locator, setLocator] = useState('');

  const isSecretaria = modo === 'secretaria';
  const selectedProtocol = useMemo(
    () => protocolos.find(protocol => protocol.id === selected) || null,
    [protocolos, selected],
  );
  const selectedDetails = details?.protocolId === selected && details.status === selectedProtocol?.status
    ? details
    : null;
  const versoes = selectedDetails?.versions || [];
  const eventos = selectedDetails?.events || [];
  const dadosArquivo = selectedDetails?.archiveData || null;

  const fetchLists = useCallback(() => Promise.all([
        arquivoSecretariaService.listarProtocolos(),
        isSecretaria ? Promise.resolve([]) : arquivoSecretariaService.listarReligiosos(),
      ]), [isSecretaria]);

  const applyLists = useCallback((
    [protocolList, religiousList]: Awaited<ReturnType<typeof fetchLists>>,
  ) => {
      setProtocolos(protocolList);
      setReligiosos(religiousList);
      setSelected(current => current && protocolList.some(item => item.id === current)
        ? current
        : isSecretaria
          ? protocolList.find(item => item.status !== 'arquivado')?.id || protocolList[0]?.id || null
          : null);
  }, [isSecretaria]);

  const load = useCallback(async () => {
    try {
      applyLists(await fetchLists());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro inesperado ao carregar os protocolos.';
      showToast.error(`Não foi possível carregar o arquivo: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [applyLists, fetchLists]);

  useEffect(() => {
    let cancelled = false;
    fetchLists()
      .then(result => {
        if (!cancelled) applyLists(result);
      })
      .catch(error => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Erro inesperado ao carregar os protocolos.';
        showToast.error(`Não foi possível carregar o arquivo: ${message}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [applyLists, fetchLists]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    Promise.all([
      arquivoSecretariaService.listarVersoes(selected),
      isSecretaria ? arquivoSecretariaService.listarEventos(selected) : Promise.resolve([]),
      isSecretaria ? arquivoSecretariaService.obterDadosArquivamento(selected) : Promise.resolve(null),
    ])
      .then(([versionList, eventList, archiveData]) => {
        if (cancelled) return;
        setDetails({
          protocolId: selected,
          status: selectedProtocol?.status,
          versions: versionList,
          events: eventList,
          archiveData,
        });
      })
      .catch(error => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Erro inesperado ao carregar os documentos.';
        showToast.error(`Não foi possível abrir o protocolo: ${message}`);
      });
    return () => { cancelled = true; };
  }, [selected, selectedProtocol?.status, isSecretaria]);

  const refresh = () => {
    setLoading(true);
    void load();
  };

  const resetSubmission = () => {
    setSubmissionTarget(null);
    setFile(null);
    setDescricao('');
    setReligiosoId('');
    setTipoDocumento('testamento');
  };

  const beginSubmission = (protocol: ProtocoloArquivo) => {
    setSubmissionTarget(protocol);
    setSelected(protocol.id);
    setFile(null);
  };

  const handleSubmitDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!submissionTarget && !religiosoId) {
      showToast.warning('Selecione o religioso a que pertence o documento.');
      return;
    }
    if (!file && !submissionTarget) {
      showToast.warning('Selecione o arquivo digitalizado para iniciar o protocolo.');
      return;
    }
    if (submissionTarget?.status === 'complementacao_solicitada' && !file) {
      showToast.warning('Selecione o arquivo complementar solicitado pela Secretaria.');
      return;
    }

    setSaving(true);
    let protocolId = submissionTarget?.id;
    let protocolNumber = submissionTarget?.numero_protocolo;
    try {
      if (!protocolId) {
        const created = await arquivoSecretariaService.criarProtocolo(religiosoId, tipoDocumento, descricao.trim());
        protocolId = created.id;
        protocolNumber = created.numero_protocolo;
      }

      const existingVersions = await arquivoSecretariaService.listarVersoes(protocolId);
      if (file && (submissionTarget?.status === 'complementacao_solicitada' || existingVersions.length === 0)) {
        await arquivoSecretariaService.anexarVersao(protocolId, file);
      }

      if (submissionTarget?.status === 'rascunho' && existingVersions.length === 0 && !file) {
        showToast.warning('Selecione o arquivo digitalizado para concluir o protocolo.');
        return;
      }
      await arquivoSecretariaService.enviarProtocolo(protocolId);
      showToast.success(`Documento enviado à Secretaria. Protocolo ${protocolNumber || ''}.`);
      resetSubmission();
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro inesperado ao enviar o documento.';
      showToast.error(`Não foi possível concluir o envio: ${message}`);
      if (protocolId && !submissionTarget) {
        setSelected(protocolId);
        const createdProtocol = protocolos.find(item => item.id === protocolId);
        setSubmissionTarget(createdProtocol || {
          id: protocolId,
          numero_protocolo: 'em criação',
          religioso_nome: null,
          tipo_documento: null,
          descricao: null,
          status: 'rascunho',
          enviado_por_nome: null,
          ultima_observacao: null,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        });
      }
      await load();
    } finally {
      setSaving(false);
    }
  };

  const advance = async (
    protocol: ProtocoloArquivo,
    action: string,
    extra?: { note?: string; className?: string; ref?: string; loc?: string },
  ) => {
    setSaving(true);
    try {
      await arquivoSecretariaService.avancarProtocolo(
        protocol.id,
        action,
        extra?.note,
        extra?.className,
        extra?.ref,
        extra?.loc,
      );
      showToast.success('Protocolo atualizado.');
      setRequestNote('');
      setReference('');
      setLocator('');
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro inesperado ao atualizar o protocolo.';
      showToast.error(`Não foi possível atualizar o protocolo: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const downloadVersion = async (version: VersaoArquivo) => {
    try {
      await arquivoSecretariaService.baixarVersao(version.caminho_storage, version.nome_original);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro inesperado ao abrir o arquivo.';
      showToast.error(message);
    }
  };

  const visibleProtocols = protocolos;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {isSecretaria ? 'Secretaria • Custódia documental' : 'Patrimônio • Remessa documental'}
          </p>
          <h1 className="font-cinzel text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {isSecretaria ? 'Arquivo confidencial' : 'Enviar documentos à Secretaria'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {isSecretaria
              ? 'Confira a remessa, confirme a transferência de custódia, classifique e registre o localizador do documento.'
              : 'Envie documentos digitalizados com protocolo. Após a confirmação de recebimento, o arquivo fica sob custódia da Secretaria.'}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200 sm:self-auto">
          <LockKeyhole className="h-4 w-4" />
          Armazenamento privado • Acesso auditado
        </div>
      </header>

      {!isSecretaria && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-4 flex items-start gap-3">
            <div className="rounded-md bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {submissionTarget?.status === 'complementacao_solicitada'
                ? <RotateCcw className="h-4 w-4" />
                : <FileUp className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                {submissionTarget
                  ? submissionTarget.status === 'complementacao_solicitada'
                    ? `Complementar ${submissionTarget.numero_protocolo}`
                    : `Concluir ${submissionTarget.numero_protocolo}`
                  : 'Nova remessa'}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {submissionTarget?.status === 'complementacao_solicitada'
                  ? submissionTarget.ultima_observacao || 'Anexe a versão corrigida ou complementar.'
                  : 'São aceitos PDF, JPEG, PNG e TIFF até 50 MB. O arquivo recebe uma assinatura SHA-256 para verificação de integridade.'}
              </p>
            </div>
            {submissionTarget && (
              <button type="button" onClick={resetSubmission} className={subtleButtonClass} aria-label="Cancelar edição do protocolo">
                <X className="h-4 w-4" />
                Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitDocument} className="space-y-4">
            {!submissionTarget && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Religioso">
                    <select required className={inputClass} value={religiosoId} onChange={event => setReligiosoId(event.target.value)}>
                      <option value="">Selecione...</option>
                      {religiosos.map(religioso => (
                        <option key={religioso.id} value={religioso.id}>
                          {religioso.nome_religioso || religioso.nome_civil}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Tipo de documento">
                    <select className={inputClass} value={tipoDocumento} onChange={event => setTipoDocumento(event.target.value as TipoDocumentoArquivo)}>
                      {TIPO_DOCUMENTO.map(tipo => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Observação para conferência (opcional)">
                  <textarea
                    className={`${inputClass} min-h-20 resize-y`}
                    maxLength={1000}
                    value={descricao}
                    onChange={event => setDescricao(event.target.value)}
                    placeholder="Informe apenas o necessário para identificar ou conferir a remessa."
                  />
                </Field>
              </>
            )}
            <Field label="Arquivo digitalizado">
              <input
                required={!submissionTarget || submissionTarget.status === 'complementacao_solicitada'}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff,application/pdf,image/jpeg,image/png,image/tiff"
                className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium dark:file:bg-slate-800`}
                onChange={event => setFile(event.target.files?.[0] || null)}
              />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                O documento original não é substituído; cada reenvio é guardado como nova versão.
              </p>
              <button type="submit" disabled={saving} className={buttonClass}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {saving ? 'Enviando...' : submissionTarget?.status === 'complementacao_solicitada' ? 'Enviar complemento' : 'Protocolar e enviar'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                {isSecretaria ? 'Fila de protocolos' : 'Minhas remessas'}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {visibleProtocols.length} {visibleProtocols.length === 1 ? 'protocolo' : 'protocolos'}
              </p>
            </div>
            <button type="button" onClick={refresh} className={subtleButtonClass} disabled={loading}>
              <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando protocolos...
            </div>
          ) : visibleProtocols.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <FileLock2 className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">Nenhuma remessa registrada</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {isSecretaria ? 'Novos documentos enviados aparecerão nesta fila.' : 'Os protocolos enviados aparecerão aqui para acompanhamento.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleProtocols.map(protocol => (
                <li key={protocol.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(protocol.id)}
                    className={`w-full px-5 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selected === protocol.id ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">{protocol.numero_protocolo}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${protocol.status === 'arquivado' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' : protocol.status === 'complementacao_solicitada' ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                        {STATUS[protocol.status]}
                      </span>
                    </div>
                    {(isSecretaria || protocol.status === 'rascunho' || protocol.status === 'enviado' || protocol.status === 'em_conferencia' || protocol.status === 'complementacao_solicitada') && (
                      <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                        {protocol.religioso_nome || 'Documento'}
                        {protocol.tipo_documento && <span className="font-normal text-slate-500 dark:text-slate-400"> · {TIPO_DOCUMENTO.find(item => item.value === protocol.tipo_documento)?.label || 'Outro documento'}</span>}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatDate(protocol.atualizado_em)}</span>
                      {!isSecretaria && protocol.status === 'rascunho' && (
                        <span onClick={event => event.stopPropagation()}>
                          <span
                            role="button"
                            tabIndex={0}
                            className="font-medium text-[#17485b] hover:underline dark:text-sky-300"
                            onClick={() => beginSubmission(protocol)}
                            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') beginSubmission(protocol); }}
                          >
                            Concluir envio
                          </span>
                        </span>
                      )}
                      {!isSecretaria && protocol.status === 'complementacao_solicitada' && (
                        <span onClick={event => event.stopPropagation()}>
                          <span
                            role="button"
                            tabIndex={0}
                            className="font-medium text-amber-800 hover:underline dark:text-amber-300"
                            onClick={() => beginSubmission(protocol)}
                            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') beginSubmission(protocol); }}
                          >
                            Enviar complemento
                          </span>
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-h-64 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          {!selectedProtocol ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center px-5 text-center">
              <ShieldCheck className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">Acompanhamento protegido</p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Selecione um protocolo. Após o recebimento, o remetente acompanha apenas o número e o status.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{selectedProtocol.numero_protocolo}</p>
                    <h2 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                      {isSecretaria ? selectedProtocol.religioso_nome || 'Documento recebido' : 'Situação do protocolo'}
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {STATUS[selectedProtocol.status]}
                  </span>
                </div>

                {isSecretaria ? (
                  <>
                    <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-xs">
                      <div><dt className="text-slate-500 dark:text-slate-400">Tipo</dt><dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">{TIPO_DOCUMENTO.find(item => item.value === selectedProtocol.tipo_documento)?.label || 'Outro documento'}</dd></div>
                      <div><dt className="text-slate-500 dark:text-slate-400">Remetente</dt><dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">{selectedProtocol.enviado_por_nome || '—'}</dd></div>
                      <div className="col-span-2"><dt className="text-slate-500 dark:text-slate-400">Enviado em</dt><dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">{formatDate(selectedProtocol.criado_em)}</dd></div>
                    </dl>
                    {selectedProtocol.descricao && (
                      <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                        {selectedProtocol.descricao}
                      </p>
                    )}
                    {selectedProtocol.status === 'em_conferencia' && (
                      <Field label="Motivo da complementação (se necessária)">
                        <textarea className={`${inputClass} mt-1 min-h-16 resize-y`} maxLength={1000} value={requestNote} onChange={event => setRequestNote(event.target.value)} placeholder="Descreva o que precisa ser corrigido ou complementado." />
                      </Field>
                    )}
                    {selectedProtocol.status === 'recebido' && (
                      <div className="mt-4 space-y-3">
                        <Field label="Classificação documental">
                          <select className={inputClass} value={classification} onChange={event => setClassification(event.target.value)}>
                            {CLASSIFICACOES.map(item => <option key={item}>{item}</option>)}
                          </select>
                        </Field>
                        <Field label="Referência de classificação (opcional)">
                          <input className={inputClass} maxLength={255} value={reference} onChange={event => setReference(event.target.value)} placeholder="Ex.: série, classe ou código institucional" />
                        </Field>
                      </div>
                    )}
                    {selectedProtocol.status === 'classificado' && (
                      <div className="mt-4 space-y-3">
                        <Field label="Localizador físico ou digital">
                          <input className={inputClass} required maxLength={255} value={locator} onChange={event => setLocator(event.target.value)} placeholder="Ex.: caixa, pasta, estante ou referência de guarda" />
                        </Field>
                        <Field label="Referência de classificação (opcional)">
                          <input className={inputClass} maxLength={255} value={reference} onChange={event => setReference(event.target.value)} placeholder="Código de arquivo" />
                        </Field>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {selectedProtocol.status === 'complementacao_solicitada'
                        ? selectedProtocol.ultima_observacao || 'A Secretaria solicitou uma complementação.'
                        : selectedProtocol.status === 'recebido' || selectedProtocol.status === 'classificado' || selectedProtocol.status === 'arquivado'
                          ? 'A custódia foi transferida à Secretaria. O arquivo e seus detalhes de guarda não ficam mais disponíveis ao remetente.'
                          : 'A remessa ainda está sob seu acompanhamento até a confirmação de recebimento pela Secretaria.'}
                    </p>
                    {selectedProtocol.status === 'complementacao_solicitada' && (
                      <button type="button" className={`${buttonClass} mt-4`} onClick={() => beginSubmission(selectedProtocol)}>
                        <Upload className="h-4 w-4" /> Enviar complementação
                      </button>
                    )}
                  </>
                )}

                {isSecretaria && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedProtocol.status === 'enviado' && (
                      <button type="button" disabled={saving} className={buttonClass} onClick={() => void advance(selectedProtocol, 'iniciar_conferencia')}>
                        <Check className="h-4 w-4" /> Iniciar conferência
                      </button>
                    )}
                    {selectedProtocol.status === 'em_conferencia' && (
                      <>
                        <button type="button" disabled={saving || !requestNote.trim()} className={subtleButtonClass} onClick={() => void advance(selectedProtocol, 'solicitar_complementacao', { note: requestNote })}>
                          Solicitar complementação
                        </button>
                        <button type="button" disabled={saving} className={buttonClass} onClick={() => void advance(selectedProtocol, 'confirmar_recebimento')}>
                          <ShieldCheck className="h-4 w-4" /> Confirmar recebimento
                        </button>
                      </>
                    )}
                    {selectedProtocol.status === 'recebido' && (
                      <button type="button" disabled={saving || !classification.trim()} className={buttonClass} onClick={() => void advance(selectedProtocol, 'classificar', { className: classification, ref: reference })}>
                        <Archive className="h-4 w-4" /> Classificar
                      </button>
                    )}
                    {selectedProtocol.status === 'classificado' && (
                      <button type="button" disabled={saving || !locator.trim()} className={buttonClass} onClick={() => void advance(selectedProtocol, 'arquivar', { ref: reference, loc: locator })}>
                        <Archive className="h-4 w-4" /> Registrar arquivamento
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isSecretaria && (
                <>
                  <div className="p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      <FileLock2 className="h-4 w-4" /> Versões digitais
                    </h3>
                    {versoes.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Nenhum arquivo associado ao protocolo.</p>
                    ) : (
                      <ul className="space-y-2">
                        {versoes.map(version => (
                          <li key={version.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-100">v{version.numero_versao} · {version.nome_original}</p>
                              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{formatSize(version.tamanho_bytes)} · {formatDate(version.criado_em)}</p>
                            </div>
                            <button type="button" className={subtleButtonClass} onClick={() => void downloadVersion(version)} aria-label={`Baixar ${version.nome_original}`}>
                              <Download className="h-4 w-4" /> Baixar
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      <History className="h-4 w-4" /> Trilha de auditoria
                    </h3>
                    {eventos.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Sem eventos registrados.</p>
                    ) : (
                      <ol className="space-y-3">
                        {eventos.map(item => (
                          <li key={item.id} className="relative border-l border-slate-200 pl-3 dark:border-slate-700">
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-100">
                              {item.evento.replaceAll('_', ' ')} · {item.ator_nome}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{formatDate(item.criado_em)}</p>
                            {item.observacao && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.observacao}</p>}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                {dadosArquivo && (
                  <dl className="mx-5 mb-5 grid grid-cols-2 gap-x-3 gap-y-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/50">
                    {dadosArquivo.classificacao && <div><dt className="text-slate-500 dark:text-slate-400">Classificação</dt><dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">{dadosArquivo.classificacao}</dd></div>}
                    {dadosArquivo.referencia_arquivamento && <div><dt className="text-slate-500 dark:text-slate-400">Referência</dt><dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">{dadosArquivo.referencia_arquivamento}</dd></div>}
                    {dadosArquivo.localizador && <div className="col-span-2"><dt className="text-slate-500 dark:text-slate-400">Localizador de guarda</dt><dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">{dadosArquivo.localizador}</dd></div>}
                    {dadosArquivo.arquivado_em && <div className="col-span-2"><dt className="text-slate-500 dark:text-slate-400">Arquivado em</dt><dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-100">{formatDate(dadosArquivo.arquivado_em)}</dd></div>}
                  </dl>
                )}
                </>
              )}

              {!isSecretaria && selectedProtocol.status !== 'recebido' && selectedProtocol.status !== 'classificado' && selectedProtocol.status !== 'arquivado' && (
                <div className="p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    <FileLock2 className="h-4 w-4" /> Arquivos ainda sob sua remessa
                  </h3>
                  {versoes.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Nenhuma versão enviada.</p>
                  ) : (
                    <ul className="space-y-2">
                      {versoes.map(version => (
                        <li key={version.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-100">v{version.numero_versao} · {version.nome_original}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{formatDate(version.criado_em)}</p>
                          </div>
                          <button type="button" className={subtleButtonClass} onClick={() => void downloadVersion(version)}>
                            <Download className="h-4 w-4" /> Baixar
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <aside className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
        <p>
          A confirmação da Secretaria transfere a custódia: o remetente deixa de acessar os arquivos e acompanha somente o protocolo. O acesso ao acervo é limitado à Secretaria e ao substituto formalmente designado. O sistema não elimina documentos automaticamente; a temporalidade deverá seguir política institucional aprovada.
        </p>
      </aside>
    </main>
  );
};

export default ArquivoSecretaria;

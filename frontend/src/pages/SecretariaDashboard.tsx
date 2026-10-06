import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  ArrowRight,
  CalendarDays,
  Clock3,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { hasModuleAccess, useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../hooks/useFeedback';
import { arquivoSecretariaService, type ProtocoloArquivo } from '../services/arquivoSecretariaService';

interface DocumentoRecente {
  id: string;
  titulo: string;
  categoria: string;
  data_documento: string;
  status: string;
}

interface EventoProximo {
  id: string;
  titulo: string;
  tipo: string;
  data_inicio: string;
  horario: string | null;
  local: string;
  status: string;
}

const DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });
const formatDate = (value: string) => DATE_FORMAT.format(new Date(`${value}T12:00:00`));

const Card: React.FC<{
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  label: string;
  count?: number;
}> = ({ title, description, href, icon: Icon, label, count }) => (
  <Link
    to={href}
    className="group flex min-h-44 flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#226380]/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60"
  >
    <div className="flex items-start justify-between gap-4">
      <span className="rounded-md bg-slate-100 p-2.5 text-[#17485b] dark:bg-slate-800 dark:text-sky-200">
        <Icon className="h-5 w-5" />
      </span>
      {count !== undefined && (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {count}
        </span>
      )}
    </div>
    <div className="mt-5">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#17485b] dark:text-sky-300">
        {label}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </div>
  </Link>
);

const Section: React.FC<{
  title: string;
  icon: React.ElementType;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}> = ({ title, icon: Icon, href, linkLabel, children }) => (
  <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <Icon className="h-4 w-4 text-[#17485b] dark:text-sky-300" />
        {title}
      </h2>
      <Link to={href} className="text-xs font-medium text-[#17485b] hover:underline dark:text-sky-300">
        {linkLabel}
      </Link>
    </div>
    {children}
  </section>
);

export const SecretariaDashboard: React.FC = () => {
  const { user } = useAuth();
  const canAccessSecretaria = hasModuleAccess(user, 'secretaria');
  const canAccessArquivo = Boolean(
    user?.acessos.some(access => access === 'arquivo_secretaria' || access === 'arquivo_substituto'),
  );
  const [loading, setLoading] = useState(true);
  const [documentos, setDocumentos] = useState<DocumentoRecente[]>([]);
  const [eventos, setEventos] = useState<EventoProximo[]>([]);
  const [documentosAtivos, setDocumentosAtivos] = useState<number | null>(null);
  const [eventosFuturos, setEventosFuturos] = useState<number | null>(null);
  const [filaArquivo, setFilaArquivo] = useState<ProtocoloArquivo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [archiveResult, docsResult, docsCountResult, eventsResult, eventsCountResult] = await Promise.all([
        canAccessArquivo
          ? arquivoSecretariaService.listarProtocolos()
          : Promise.resolve(null),
        canAccessSecretaria
          ? supabase.from('documentos_provinciais')
              .select('id, titulo, categoria, data_documento, status')
              .eq('status', 'Ativo')
              .order('data_documento', { ascending: false })
              .limit(4)
          : Promise.resolve(null),
        canAccessSecretaria
          ? supabase.from('documentos_provinciais')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'Ativo')
          : Promise.resolve(null),
        canAccessSecretaria
          ? supabase.from('eventos_provinciais')
              .select('id, titulo, tipo, data_inicio, horario, local, status')
              .gte('data_inicio', today)
              .neq('status', 'Cancelado')
              .order('data_inicio', { ascending: true })
              .limit(4)
          : Promise.resolve(null),
        canAccessSecretaria
          ? supabase.from('eventos_provinciais')
              .select('id', { count: 'exact', head: true })
              .gte('data_inicio', today)
              .neq('status', 'Cancelado')
          : Promise.resolve(null),
      ]);

      const errors = [
        docsResult && 'error' in docsResult ? docsResult.error : null,
        docsCountResult && 'error' in docsCountResult ? docsCountResult.error : null,
        eventsResult && 'error' in eventsResult ? eventsResult.error : null,
        eventsCountResult && 'error' in eventsCountResult ? eventsCountResult.error : null,
      ].filter((item): item is NonNullable<typeof item> => Boolean(item));
      if (errors.length > 0) {
        throw new Error(errors.map(item => item.message).join(' · '));
      }

      return {
        filaArquivo: canAccessArquivo && archiveResult
          ? archiveResult.filter(protocol =>
              ['enviado', 'em_conferencia', 'complementacao_solicitada'].includes(protocol.status),
            )
          : [],
        documentos: docsResult && 'data' in docsResult ? (docsResult.data || []) as DocumentoRecente[] : [],
        documentosAtivos: docsCountResult && 'count' in docsCountResult ? docsCountResult.count || 0 : null,
        eventos: eventsResult && 'data' in eventsResult ? (eventsResult.data || []) as EventoProximo[] : [],
        eventosFuturos: eventsCountResult && 'count' in eventsCountResult ? eventsCountResult.count || 0 : null,
      };
  }, [canAccessArquivo, canAccessSecretaria]);

  const applyDashboard = useCallback((data: Awaited<ReturnType<typeof fetchDashboard>>) => {
    setFilaArquivo(data.filaArquivo);
    setDocumentos(data.documentos);
    setDocumentosAtivos(data.documentosAtivos);
    setEventos(data.eventos);
    setEventosFuturos(data.eventosFuturos);
    setError(null);
  }, []);

  const handleLoadError = useCallback((loadError: unknown) => {
    const message = loadError instanceof Error ? loadError.message : 'Erro inesperado ao carregar o painel.';
    setError(message);
    showToast.error(`Não foi possível carregar o painel da Secretaria: ${message}`);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchDashboard()
      .then(data => { if (!cancelled) applyDashboard(data); })
      .catch(loadError => { if (!cancelled) handleLoadError(loadError); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [applyDashboard, fetchDashboard, handleLoadError]);

  const load = () => {
    setLoading(true);
    fetchDashboard()
      .then(applyDashboard)
      .catch(handleLoadError)
      .finally(() => setLoading(false));
  };

  const archiveDescription = canAccessArquivo
    ? filaArquivo.length > 0
      ? `${filaArquivo.length} protocolo(s) aguardam conferência, recebimento ou retorno.`
      : 'A fila está em dia. Novos envios aparecerão aqui.'
    : 'Acesso reservado ao secretário e ao substituto formalmente designado.';

  return (
    <main className="mx-auto max-w-6xl space-y-7 px-4 py-6 md:px-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Secretaria Provincial • Província BRM
          </p>
          <h1 className="font-cinzel text-2xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-3xl">
            Painel da Secretaria
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Acompanhe o arquivo confidencial, os documentos oficiais e a agenda provincial em um único lugar.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar painel
        </button>
      </header>

      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between">
          <p>Alguns dados não puderam ser carregados: {error}</p>
          <button type="button" onClick={load} className="font-semibold underline underline-offset-2">
            Tentar novamente
          </button>
        </div>
      )}

      <section className={`grid gap-4 ${canAccessSecretaria ? 'md:grid-cols-3' : 'md:grid-cols-1'}`}>
        {canAccessArquivo && (
          <Card
            title="Arquivo confidencial"
            description={archiveDescription}
            href="/secretaria/arquivo"
            icon={ShieldCheck}
            label="Abrir fila protegida"
            count={loading ? undefined : filaArquivo.length}
          />
        )}
        {canAccessSecretaria && (
          <>
            <Card
              title="Documentos oficiais"
              description="Publicar, consultar e arquivar atos e documentos da Província."
              href="/documentos"
              icon={FileText}
              label="Acessar documentos"
              count={loading ? undefined : documentosAtivos ?? undefined}
            />
            <Card
              title="Agenda & eventos"
              description="Organizar encontros, inscrições e compromissos provinciais."
              href="/agenda"
              icon={CalendarDays}
              label="Acessar agenda"
              count={loading ? undefined : eventosFuturos ?? undefined}
            />
          </>
        )}
      </section>

      {canAccessSecretaria && (
        <section className="grid gap-5 lg:grid-cols-2">
          <Section title="Documentos oficiais recentes" icon={FileText} href="/documentos" linkLabel="Ver todos">
            {loading ? (
              <div className="flex items-center gap-2 px-5 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Carregando documentos...</div>
            ) : documentos.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">Nenhum documento oficial ativo cadastrado.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {documentos.map(documento => (
                  <li key={documento.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{documento.titulo}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{documento.categoria} · {formatDate(documento.data_documento)}</p>
                    </div>
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Próximos eventos" icon={CalendarDays} href="/agenda" linkLabel="Abrir agenda">
            {loading ? (
              <div className="flex items-center gap-2 px-5 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Carregando agenda...</div>
            ) : eventos.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">Não há eventos futuros cadastrados.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {eventos.map(evento => (
                  <li key={evento.id} className="flex items-start gap-3 px-5 py-3.5">
                    <span className="mt-0.5 rounded-md bg-slate-100 p-2 text-[#17485b] dark:bg-slate-800 dark:text-sky-200"><CalendarDays className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{evento.titulo}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>{formatDate(evento.data_inicio)}</span>
                        {evento.horario && <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{evento.horario}</span>}
                        <span>{evento.local}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </section>
      )}

      {canAccessArquivo && (
        <Section title="Protocolos que exigem acompanhamento" icon={Archive} href="/secretaria/arquivo" linkLabel="Ver fila completa">
          {loading ? (
            <div className="flex items-center gap-2 px-5 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Carregando fila...</div>
          ) : filaArquivo.length === 0 ? (
            <div className="flex items-center gap-3 px-5 py-8 text-sm text-slate-600 dark:text-slate-300">
              <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              Nenhum protocolo pendente de ação.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {filaArquivo.slice(0, 5).map(protocol => (
                <li key={protocol.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{protocol.numero_protocolo} · {protocol.religioso_nome || 'Documento'}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{protocol.status.replaceAll('_', ' ')} · {protocol.enviado_por_nome || 'Remetente'}</p>
                  </div>
                  <Link to="/secretaria/arquivo" className="inline-flex items-center gap-1 text-xs font-semibold text-[#17485b] dark:text-sky-300">
                    Acompanhar <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {!canAccessSecretaria && canAccessArquivo && (
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
          <Send className="mt-0.5 h-4 w-4 shrink-0" />
          Seu perfil tem acesso somente ao arquivo confidencial. Documentos oficiais e agenda exigem a permissão geral da Secretaria.
        </div>
      )}
    </main>
  );
};

export default SecretariaDashboard;

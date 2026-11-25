/**
 * Utilitários de data à prova de problemas de fuso horário UTC (ex.: UTC-3 no Brasil).
 */

export const formatarDataBR = (value?: string | Date | null): string => {
  if (!value) return '—';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '—';
    return value.toLocaleDateString('pt-BR');
  }
  const str = String(value).trim();
  if (!str) return '—';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;

  // Formato YYYY-MM-DD (com ou sem sufixos de tempo UTC / ISO)
  // Preserva dia/mês/ano exatos para eliminar desvios de fuso horário (ex.: UTC-3 no Brasil)
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, ano, mes, dia] = match;
    return `${dia}/${mes}/${ano}`;
  }

  // Fallback para timestamps com horários específicos
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return str;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

export const extrairAno = (value?: string | Date | null): string => {
  if (!value) return '—';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '—';
    return String(value.getFullYear());
  }
  const str = String(value).trim();
  if (!str) return '—';
  const match = str.match(/\b(19\d\d|20\d\d)\b/);
  if (match) return match[1];
  if (/^\d{4}$/.test(str)) return str;
  if (str.length >= 4) {
    const possivelAno = str.slice(-4);
    if (/^\d{4}$/.test(possivelAno)) return possivelAno;
  }
  return str;
};

export const PORTAL_EVENTO_MAX_DIAS_APOS_TERMINO = 1;

export const dataHojeSaoPaulo = (now: Date = new Date()): string =>
  now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });

export const subtrairDiasISO = (isoDate: string, dias: number): string => {
  const [ano, mes, dia] = isoDate.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(ano, mes - 1, dia - dias));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Determina se um evento provincial ainda deve permanecer visível no Portal dos Confrades.
 * Eventos permanecem visíveis por no máximo `maxDiasApos` dia(s) após a data de término
 * (ou data de início, quando não houver data de término); depois ficam reservados à Secretaria.
 */
export const eventoVisivelNoPortal = (
  evento: {
    data_inicio: string;
    data_fim?: string | null;
    status?: string | null;
    publicado_portal?: boolean;
  },
  maxDiasApos: number = PORTAL_EVENTO_MAX_DIAS_APOS_TERMINO,
  hojeIso: string = dataHojeSaoPaulo(),
): boolean => {
  if (evento.publicado_portal === false) return false;
  if (evento.status === 'Cancelado') return false;
  const inicio = evento.data_inicio?.slice(0, 10) || '';
  const fim = evento.data_fim?.slice(0, 10) || '';
  const dataReferencia = fim && fim >= inicio ? fim : inicio;
  if (!dataReferencia) return false;
  const dataLimite = subtrairDiasISO(hojeIso, maxDiasApos);
  return dataReferencia >= dataLimite;
};



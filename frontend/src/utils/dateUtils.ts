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


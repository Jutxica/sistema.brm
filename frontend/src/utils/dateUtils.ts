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

  // Formato YYYY-MM-DD (com ou sem sufixos de tempo UTC)
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, ano, mes, dia] = match;
    // Se for data pura (ex: "1992-05-12") ou meia-noite UTC (ex: "1992-05-12T00:00:00.000Z"),
    // preserva o dia civil exato para evitar que fusos como UTC-3 no Brasil retrocedam 1 dia
    if (!str.includes('T') || str.includes('T00:00:00')) {
      return `${dia}/${mes}/${ano}`;
    }
  }

  // Fallback para timestamps com horários específicos
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

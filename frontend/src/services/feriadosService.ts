/**
 * feriadosService.ts
 * Serviço de consulta de feriados nacionais via BrasilAPI.
 * Usado pela Secretaria Provincial e pela Agenda de Eventos para evitar marcações de reuniões em datas sem expediente.
 */

export interface FeriadoNacional {
  date: string;
  name: string;
  type: string;
}

export const feriadosService = {
  /**
   * Obtém os feriados nacionais de um determinado ano (padrão ano atual).
   */
  async listarFeriados(ano: number = new Date().getFullYear()): Promise<FeriadoNacional[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) return [];

      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('Erro ao carregar feriados da BrasilAPI:', err);
      return [];
    }
  },

  /**
   * Verifica se uma data específica cai em um feriado nacional.
   */
  async verificarSeFeriado(dataIso: string): Promise<FeriadoNacional | null> {
    if (!dataIso) return null;
    const ano = parseInt(dataIso.split('-')[0], 10);
    const feriados = await this.listarFeriados(ano);
    return feriados.find(f => f.date === dataIso) || null;
  }
};

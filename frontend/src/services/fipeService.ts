/**
 * fipeService.ts
 * Serviço de integração com a Tabela FIPE via BrasilAPI (gratuita, sem chave).
 * Usado no módulo de Patrimônio (Veículos da Frota Provincial) para estimativa de valor venal e seguro.
 */

export interface DadosFipePreco {
  valor: string;
  marca: string;
  modelo: string;
  anoModelo: number;
  combustivel: string;
  codigoFipe: string;
  mesReferencia: string;
}

export const fipeService = {
  /**
   * Consulta a cotação de um veículo na Tabela FIPE pelo código FIPE.
   * Exemplo de código FIPE: 004278-1
   */
  async consultarPorCodigoFipe(codigoFipe: string): Promise<DadosFipePreco | null> {
    const limpo = (codigoFipe || '').trim();
    if (!limpo) return null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(`https://brasilapi.com.br/api/fipe/preco/v1/${limpo}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        return {
          valor: item.valor,
          marca: item.marca,
          modelo: item.modelo,
          anoModelo: item.anoModelo,
          combustivel: item.combustivel,
          codigoFipe: item.codigoFipe,
          mesReferencia: item.mesReferencia
        };
      }
      return null;
    } catch (err) {
      console.warn('Erro ao consultar FIPE na BrasilAPI:', err);
      return null;
    }
  },

  /**
   * Converte valor monetário em texto (ex: "R$ 45.000,00") para formato numérico.
   */
  parseValorNumerico(valorFipe: string): number {
    if (!valorFipe) return 0;
    const limpo = valorFipe.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(limpo) || 0;
  }
};

/**
 * cambioService.ts
 * Serviço de cotações em tempo real via AwesomeAPI (gratuita, sem chave).
 * Usado para conversão de moedas (EUR, USD para BRL) em viagens capitulares e missões.
 */

export interface CotacaoMoeda {
  code: string;
  name: string;
  bid: number; // Compra
  ask: number; // Venda
  varBid: string;
  pctChange: string;
  create_date: string;
}

export const cambioService = {
  /**
   * Obtém a cotação atual de EUR e USD em relação ao Real (BRL).
   */
  async obterCotacoesPrincipais(): Promise<{ euro: CotacaoMoeda | null; dolar: CotacaoMoeda | null }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('https://economia.awesomeapi.com.br/last/EUR-BRL,USD-BRL', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) return { euro: null, dolar: null };

      const data = await res.json();
      const euro = data.EURBRL ? {
        code: data.EURBRL.code,
        name: data.EURBRL.name,
        bid: parseFloat(data.EURBRL.bid),
        ask: parseFloat(data.EURBRL.ask),
        varBid: data.EURBRL.varBid,
        pctChange: data.EURBRL.pctChange,
        create_date: data.EURBRL.create_date
      } : null;

      const dolar = data.USDBRL ? {
        code: data.USDBRL.code,
        name: data.USDBRL.name,
        bid: parseFloat(data.USDBRL.bid),
        ask: parseFloat(data.USDBRL.ask),
        varBid: data.USDBRL.varBid,
        pctChange: data.USDBRL.pctChange,
        create_date: data.USDBRL.create_date
      } : null;

      return { euro, dolar };
    } catch (err) {
      console.warn('Erro ao consultar cotações cambiais:', err);
      return { euro: null, dolar: null };
    }
  }
};

/**
 * climaService.ts
 * Serviço de previsão do tempo via Open-Meteo API (100% gratuita, sem API Key).
 * Ideal para o módulo de Hospedaria, Casas de Retiro e Encontros Provinciais.
 */

export interface PrevisaoClima {
  cidade: string;
  temperaturaAtual: number;
  temperaturaMin: number;
  temperaturaMax: number;
  sensacaoTermica: number;
  umidade: number;
  probabilidadeChuva: number;
  descricaoCondicao: string;
  icone: 'sol' | 'sol-nuvem' | 'nuvem' | 'chuva' | 'trovoada';
}

// Coordenadas das principais cidades com presença das Casas e Obras da Província BRM
const COORDENADAS_BRM: Record<string, { lat: number; lon: number; nome: string }> = {
  'corupa': { lat: -26.4253, lon: -49.2439, nome: 'Corupá, SC' },
  'brusque': { lat: -27.0978, lon: -48.9108, nome: 'Brusque, SC' },
  'jaragua do sul': { lat: -26.4855, lon: -49.0689, nome: 'Jaraguá do Sul, SC' },
  'joinville': { lat: -26.3045, lon: -48.8487, nome: 'Joinville, SC' },
  'curitiba': { lat: -25.4284, lon: -49.2733, nome: 'Curitiba, PR' },
  'rio negrinho': { lat: -26.2536, lon: -49.5167, nome: 'Rio Negrinho, SC' },
  'armazem': { lat: -28.2617, lon: -49.0189, nome: 'Armazém, SC' },
  'botuvera': { lat: -27.2003, lon: -49.0744, nome: 'Botuverá, SC' },
  'sao paulo': { lat: -23.5505, lon: -46.6333, nome: 'São Paulo, SP' }
};

export const climaService = {
  /**
   * Identifica as coordenadas a partir do nome de uma cidade da Província BRM.
   */
  resolverCoordenadas(cidadeNome?: string): { lat: number; lon: number; nome: string } {
    if (!cidadeNome) {
      return COORDENADAS_BRM['corupa']; // Sede Provincial como padrão
    }
    const limpo = cidadeNome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    for (const [chave, dados] of Object.entries(COORDENADAS_BRM)) {
      if (limpo.includes(chave) || chave.includes(limpo)) {
        return dados;
      }
    }
    return COORDENADAS_BRM['corupa'];
  },

  /**
   * Consulta a previsão meteorológica no Open-Meteo.
   */
  async obterPrevisaoPorCidade(cidadeNome?: string): Promise<PrevisaoClima | null> {
    const local = this.resolverCoordenadas(cidadeNome);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${local.lat}&longitude=${local.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FSao_Paulo`;

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const current = data.current;
      const daily = data.daily;

      const code = current?.weather_code ?? 0;
      let descricao = 'Tempo aberto';
      let icone: PrevisaoClima['icone'] = 'sol';

      if (code === 0) {
        descricao = 'Céu limpo';
        icone = 'sol';
      } else if (code <= 3) {
        descricao = 'Parcialmente nublado';
        icone = 'sol-nuvem';
      } else if (code <= 48) {
        descricao = 'Nublado / Neblina';
        icone = 'nuvem';
      } else if (code <= 67 || (code >= 80 && code <= 82)) {
        descricao = 'Chuva';
        icone = 'chuva';
      } else if (code >= 95) {
        descricao = 'Pancadas de chuva / Trovoada';
        icone = 'trovoada';
      }

      return {
        cidade: local.nome,
        temperaturaAtual: Math.round(current?.temperature_2m ?? 22),
        temperaturaMin: Math.round(daily?.temperature_2m_min?.[0] ?? 18),
        temperaturaMax: Math.round(daily?.temperature_2m_max?.[0] ?? 26),
        sensacaoTermica: Math.round(current?.apparent_temperature ?? 22),
        umidade: current?.relative_humidity_2m ?? 70,
        probabilidadeChuva: daily?.precipitation_probability_max?.[0] ?? 10,
        descricaoCondicao: descricao,
        icone
      };
    } catch (err) {
      console.warn('Open-Meteo indisponível ou fora do ar:', err);
      return null;
    }
  }
};

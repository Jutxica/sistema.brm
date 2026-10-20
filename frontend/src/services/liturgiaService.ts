/**
 * liturgiaService.ts
 * Serviço de dados litúrgicos para o Painel do Religioso da Província BRM.
 * Fornece cor litúrgica do dia, tempo litúrgico, santos/solenidades e versículo evangélico diário.
 */

export interface InfoLiturgica {
  data: string;
  tempoLiturgico: string;
  corLiturgica: 'verde' | 'branco' | 'vermelho' | 'roxo' | 'rosa';
  corLiturgicaNome: string;
  corHex: string;
  corBadgeClara: string;
  santoDoDia: string;
  tituloCelebracao: string;
  grauCelebracao: 'Solenidade' | 'Festa' | 'Memória' | 'Memória Facultativa' | 'Féria';
  versiculoTexto: string;
  versiculoReferencia: string;
}

// Mapa de cores litúrgicas da Igreja Católica
export const CORES_LITURGICAS = {
  verde: {
    nome: 'Verde (Tempo Comum)',
    hex: '#1b873f',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
  },
  branco: {
    nome: 'Branco (Páscoa / Natal / Solenidades)',
    hex: '#d97706',
    badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
  },
  roxo: {
    nome: 'Roxo (Advento / Quaresma)',
    hex: '#7c3aed',
    badge: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40'
  },
  vermelho: {
    nome: 'Vermelho (Mártires / Pentecostes)',
    hex: '#dc2626',
    badge: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40'
  },
  rosa: {
    nome: 'Rosa (Gaudete / Laetare)',
    hex: '#db2777',
    badge: 'bg-pink-50 text-pink-800 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/40'
  }
};

// Santoral e destaques por mês/dia para fallback resiliente de alta fidelidade
const SANTORAL_FIXO: Record<string, { santo: string; grau: InfoLiturgica['grauCelebracao']; cor: InfoLiturgica['corLiturgica'] }> = {
  '01-01': { santo: 'Santa Maria, Mãe de Deus', grau: 'Solenidade', cor: 'branco' },
  '03-14': { santo: 'Pe. Leão Dehon (Fundador SCJ)', grau: 'Memória', cor: 'branco' },
  '03-19': { santo: 'São José, Esposo da Virgem Maria', grau: 'Solenidade', cor: 'branco' },
  '03-25': { santo: 'Anunciação do Senhor', grau: 'Solenidade', cor: 'branco' },
  '06-24': { santo: 'Natividade de São João Batista', grau: 'Solenidade', cor: 'branco' },
  '06-29': { santo: 'São Pedro e São Paulo, Apóstolos', grau: 'Solenidade', cor: 'vermelho' },
  '08-12': { santo: 'Transitus do Pe. Leão Dehon', grau: 'Memória', cor: 'branco' },
  '08-15': { santo: 'Assunção de Nossa Senhora', grau: 'Solenidade', cor: 'branco' },
  '10-04': { santo: 'São Francisco de Assis', grau: 'Memória', cor: 'branco' },
  '10-12': { santo: 'Nossa Senhora Aparecida, Padroeira do Brasil', grau: 'Solenidade', cor: 'branco' },
  '10-20': { santo: 'São Pedro de Alcântara, Padroeiro do Brasil', grau: 'Festa', cor: 'branco' },
  '11-01': { santo: 'Todos os Santos', grau: 'Solenidade', cor: 'branco' },
  '11-02': { santo: 'Comemoração dos Fiéis Defuntos', grau: 'Memória', cor: 'roxo' },
  '12-08': { santo: 'Imaculada Conceição da Virgem Maria', grau: 'Solenidade', cor: 'branco' },
  '12-25': { santo: 'Natal de Nosso Senhor Jesus Cristo', grau: 'Solenidade', cor: 'branco' }
};

const VERSICULOS_INSPIRADORES = [
  { texto: '“Vinde a mim todos vós que estais cansados e fatigados sob o peso dos vossos fardos, e eu vos darei descanso.”', ref: 'Mt 11, 28' },
  { texto: '“Aprendei de mim, porque sou manso e humilde de coração, e encontrareis descanso para as vossas almas.”', ref: 'Mt 11, 29' },
  { texto: '“Eis o Coração que tanto amou os homens.”', ref: 'Espiritualidade Dehoniana' },
  { texto: '“O Senhor é o meu pastor, nada me faltará. Em verdes prados ele me faz repousar.”', ref: 'Sl 23, 1-2' },
  { texto: '“Eu sou o caminho, a verdade e a vida. Ninguém vem ao Pai a não ser por mim.”', ref: 'Jo 14, 6' },
  { texto: '“Amarás o Senhor teu Deus de todo o teu coração, e o teu próximo como a ti mesmo.”', ref: 'Mc 12, 30-31' },
  { texto: '“O que fizerdes ao menor dos meus irmãos, a mim o fizestes.”', ref: 'Mt 25, 40' }
];

export const liturgiaService = {
  /**
   * Obtém as informações litúrgicas do dia corrente ou de uma data específica.
   */
  async getLiturgiaDoDia(dataRef: Date = new Date()): Promise<InfoLiturgica> {
    const mes = String(dataRef.getMonth() + 1).padStart(2, '0');
    const dia = String(dataRef.getDate()).padStart(2, '0');
    const chaveMesDia = `${mes}-${dia}`;
    const dataFormatada = dataRef.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Determina o tempo litúrgico aproximado
    const m = dataRef.getMonth() + 1;
    let tempo = 'Tempo Comum';
    let cor: InfoLiturgica['corLiturgica'] = 'verde';

    if (m === 12 && dataRef.getDate() >= 1 && dataRef.getDate() <= 24) {
      tempo = 'Tempo do Advento';
      cor = 'roxo';
    } else if (m === 12 && dataRef.getDate() >= 25 || (m === 1 && dataRef.getDate() <= 12)) {
      tempo = 'Tempo do Natal';
      cor = 'branco';
    } else if ((m === 2 && dataRef.getDate() >= 14) || m === 3 || (m === 4 && dataRef.getDate() <= 10)) {
      tempo = 'Tempo da Quaresma';
      cor = 'roxo';
    } else if (m === 4 || m === 5) {
      tempo = 'Tempo Pascal';
      cor = 'branco';
    }

    // Verifica santoral fixo ou festas dehonianas
    let santo = 'Santos e Beatos da Igreja de Cristo';
    let grau: InfoLiturgica['grauCelebracao'] = 'Féria';

    if (SANTORAL_FIXO[chaveMesDia]) {
      const fixo = SANTORAL_FIXO[chaveMesDia];
      santo = fixo.santo;
      grau = fixo.grau;
      cor = fixo.cor;
    } else {
      // Celebração da féria ou memória corrente
      santo = `Féria do ${tempo}`;
    }

    // Tenta enriquecer via API pública da Liturgia se disponível
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`https://liturgia.up.railway.app/${dia}-${mes}`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.cor) {
          const corApi = json.cor.toLowerCase();
          if (corApi.includes('verd')) cor = 'verde';
          else if (corApi.includes('branc')) cor = 'branco';
          else if (corApi.includes('rox')) cor = 'roxo';
          else if (corApi.includes('verm')) cor = 'vermelho';
          else if (corApi.includes('ros')) cor = 'rosa';
        }
        if (json.liturgia) {
          santo = json.liturgia;
        }
      }
    } catch {
      // Fallback gracioso ativo
    }

    const versiculo = VERSICULOS_INSPIRADORES[dataRef.getDate() % VERSICULOS_INSPIRADORES.length];
    const corConfig = CORES_LITURGICAS[cor];

    return {
      data: dataFormatada,
      tempoLiturgico: tempo,
      corLiturgica: cor,
      corLiturgicaNome: corConfig.nome,
      corHex: corConfig.hex,
      corBadgeClara: corConfig.badge,
      santoDoDia: santo,
      tituloCelebracao: santo,
      grauCelebracao: grau,
      versiculoTexto: versiculo.texto,
      versiculoReferencia: versiculo.ref
    };
  }
};

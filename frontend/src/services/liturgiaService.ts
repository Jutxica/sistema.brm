/**
 * liturgiaService.ts
 * Serviço de dados litúrgicos para o Painel do Religioso da Província BRM.
 * Fornece cor litúrgica do dia, tempo litúrgico, santos/solenidades e o Evangelho do dia.
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
  evangelhoReferencia: string;
  evangelhoTitulo: string;
  evangelhoTexto: string;
  evangelhoTrecho: string;
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

const EVANGELHOS_FALLBACK = [
  {
    ref: 'Lc 12, 54-59',
    titulo: 'Evangelho segundo Lucas',
    texto: 'Naquele tempo, Jesus dizia às multidões: “Quando vedes uma nuvem vinda do ocidente, logo dizeis que vem chuva. E assim acontece. Quando sentis soprar o vento do sul, logo dizeis que vai fazer calor. E assim acontece. Hipócritas! Vós sabeis interpretar o aspecto da terra e do céu. Como é que não sabeis interpretar o tempo presente? Por que não julgais por vós mesmos o que é justo?”.'
  },
  {
    ref: 'Mt 11, 28-30',
    titulo: 'Evangelho segundo Mateus',
    texto: 'Naquele tempo, tomou Jesus a palavra e disse: “Vinde a mim todos vós que estais cansados e fatigados sob o peso dos vossos fardos, e eu vos darei descanso. Tomai sobre vós o meu jugo e aprendei de mim, porque sou manso e humilde de coração, e encontrareis descanso para as vossas almas. Pois o meu jugo é suave e o meu fardo é leve”.'
  },
  {
    ref: 'Jo 15, 9-12',
    titulo: 'Evangelho segundo João',
    texto: 'Naquele tempo, disse Jesus aos seus discípulos: “Como o Pai me amou, assim também eu vos amei. Permanecei no meu amor. Se guardardes os meus mandamentos, permanecereis no meu amor, assim como eu guardei os mandamentos do meu Pai e permaneço no seu amor. Eu vos disse isso para que a minha alegria esteja em vós e a vossa alegria seja plena”.'
  },
  {
    ref: 'Mc 10, 42-45',
    titulo: 'Evangelho segundo Marcos',
    texto: 'Naquele tempo, Jesus chamou os doze e disse-lhes: “Sabeis que os chefes das nações as subjugam e os seus grandes as tiranizam. Entre vós, porém, não deve ser assim: quem quiser ser grande entre vós seja aquele que vos serve; e quem quiser ser o primeiro entre vós seja o servo de todos. Pois o Filho do Homem não veio para ser servido, mas para servir e dar a sua vida em resgate por muitos”.'
  },
  {
    ref: 'Jo 14, 1-6',
    titulo: 'Evangelho segundo João',
    texto: 'Naquele tempo, disse Jesus aos seus discípulos: “Não se perturbe o vosso coração. Tendes fé em Deus, tende fé também em mim. Na casa de meu Pai há muitas moradas. Eu sou o caminho, a verdade e a vida. Ninguém vem ao Pai a não ser por mim”.'
  },
  {
    ref: 'Mt 5, 1-12',
    titulo: 'Evangelho segundo Mateus',
    texto: 'Vendo Jesus as multidões, subiu à montanha e sentou-se. Seus discípulos aproximaram-se, e ele começou a ensiná-los: “Bem-aventurados os pobres em espírito, porque deles é o Reino dos Céus. Bem-aventurados os aflitos, porque serão consolados. Bem-aventurados os mansos, porque possuirão a terra”.'
  },
  {
    ref: 'Lc 10, 25-37',
    titulo: 'Evangelho segundo Lucas',
    texto: 'Naquele tempo, um mestre da Lei levantou-se para pôr Jesus à prova. Perguntou: “Mestre, o que devo fazer para herdar a vida eterna?”. Jesus lhe disse: “Amarás o Senhor teu Deus de todo o teu coração, de toda a tua alma, de todas as tuas forças e de todo o teu entendimento; e ao teu próximo como a ti mesmo”.'
  }
];

function extrairTrechoEvangelho(textoCompleto: string): string {
  // Limpa números de versículos inline como "54Jesus" -> "Jesus"
  const limpo = textoCompleto
    .replace(/\b\d{1,3}(?=[A-Za-zÀ-ÖØ-öø-ÿ“])/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Seleciona as primeiras sentenças até aprox 220 caracteres com quebra natural de pontuação
  const sentencas = limpo.match(/[^.!?]+[.!?]+/g);
  if (!sentencas || sentencas.length === 0) {
    return limpo.length > 220 ? limpo.slice(0, 217).trim() + '...' : limpo;
  }

  let trecho = '';
  for (const s of sentencas) {
    if ((trecho + s).length > 260 && trecho.length > 80) {
      break;
    }
    trecho += (trecho ? ' ' : '') + s.trim();
  }

  return trecho || limpo;
}

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

    // Santoral fixo ou féria
    let santo = 'Santos e Beatos da Igreja de Cristo';
    let grau: InfoLiturgica['grauCelebracao'] = 'Féria';

    if (SANTORAL_FIXO[chaveMesDia]) {
      const fixo = SANTORAL_FIXO[chaveMesDia];
      santo = fixo.santo;
      grau = fixo.grau;
      cor = fixo.cor;
    } else {
      santo = `Féria do ${tempo}`;
    }

    const fallbackIndex = (dataRef.getDate() + dataRef.getMonth()) % EVANGELHOS_FALLBACK.length;
    const fallbackEvangelho = EVANGELHOS_FALLBACK[fallbackIndex];

    let evRef = fallbackEvangelho.ref;
    let evTit = fallbackEvangelho.titulo;
    let evTexto = fallbackEvangelho.texto;

    // Tenta enriquecer via API pública da Liturgia da Igreja no Brasil
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`https://liturgia.up.railway.app/${dia}-${mes}`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.cor) {
          const corApi = String(json.cor).toLowerCase();
          if (corApi.includes('verd')) cor = 'verde';
          else if (corApi.includes('branc')) cor = 'branco';
          else if (corApi.includes('rox')) cor = 'roxo';
          else if (corApi.includes('verm')) cor = 'vermelho';
          else if (corApi.includes('ros')) cor = 'rosa';
        }
        if (json.liturgia) {
          santo = json.liturgia;
        }
        if (json.evangelho) {
          if (json.evangelho.referencia) evRef = json.evangelho.referencia;
          if (json.evangelho.titulo) evTit = json.evangelho.titulo;
          if (json.evangelho.texto) evTexto = json.evangelho.texto;
        }
      }
    } catch {
      // Fallback gracioso ativo
    }

    const trechoFormatado = extrairTrechoEvangelho(evTexto);
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
      versiculoTexto: trechoFormatado,
      versiculoReferencia: evRef,
      evangelhoReferencia: evRef,
      evangelhoTitulo: evTit,
      evangelhoTexto: evTexto,
      evangelhoTrecho: trechoFormatado
    };
  }
};

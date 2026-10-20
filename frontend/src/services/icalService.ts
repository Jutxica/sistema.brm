/**
 * icalService.ts
 * Gerador de Calendário iCalendar / WebCal (RFC 5545) unificado com o Romcal (Calendário Litúrgico Católico & Próprio Dehoniano).
 * Permite que confrades e secretários sincronizem no iPhone, Android, Google Calendar e Outlook
 * todas as atividades da Província BRM em conjunto com as Solenidades e Festas da Igreja.
 */

import type { EventoProvincial } from '../types/secretaria';

export interface EventoLiturgicoRomcal {
  titulo: string;
  data: string; // YYYY-MM-DD
  tipo: 'Solenidade' | 'Festa' | 'Memória Dehoniana' | 'Tempo Forte';
  corLiturgica: string;
  descricao: string;
}

export const icalService = {
  /**
   * Calcula o Domingo da Páscoa para qualquer ano utilizando o algoritmo canônico de Butcher/Meeus.
   */
  calcularPascoa(ano: number): Date {
    const a = ano % 19;
    const b = Math.floor(ano / 100);
    const c = ano % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31); // 3 = Março, 4 = Abril
    const dia = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(ano, mes - 1, dia);
  },

  /**
   * Adiciona ou subtrai dias de uma data de referência.
   */
  adicionarDias(data: Date, dias: number): Date {
    const res = new Date(data);
    res.setDate(res.getDate() + dias);
    return res;
  },

  /**
   * Formata Date para YYYY-MM-DD.
   */
  formatarDataIso(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  },

  /**
   * Gera todas as festas móveis e fixas do calendário da Igreja Católica e do Próprio Dehoniano (SCJ)
   * para um determinado ano.
   */
  gerarFestasLiturgicasIgreja(ano: number): EventoLiturgicoRomcal[] {
    const pascoa = this.calcularPascoa(ano);
    const eventos: EventoLiturgicoRomcal[] = [];

    // --- CICLO PASCAL & DATAS MÓVEIS (Romcal) ---
    const cinzas = this.adicionarDias(pascoa, -46);
    const ramos = this.adicionarDias(pascoa, -7);
    const quintaSanta = this.adicionarDias(pascoa, -3);
    const sextaPaixao = this.adicionarDias(pascoa, -2);
    const sabadoSanto = this.adicionarDias(pascoa, -1);
    const pentecostes = this.adicionarDias(pascoa, 49);
    const santissimaTrindade = this.adicionarDias(pascoa, 56);
    const corpusChristi = this.adicionarDias(pascoa, 60);

    // SOLENIDADE DO SAGRADO CORAÇÃO DE JESUS (Padroeiro Principal dos Dehonianos / SCJ)
    // Sexta-feira após o segundo domingo depois de Pentecostes (Páscoa + 68 dias)
    const sagradoCoracaoJesus = this.adicionarDias(pascoa, 68);
    const imaculadoCoracaoMaria = this.adicionarDias(pascoa, 69);

    // Cristo Rei (último domingo antes do Advento) e 1º Domingo do Advento
    const natal = new Date(ano, 11, 25);
    const diaSemanaNatal = natal.getDay(); // 0 = Domingo
    const quartoDomingoAdvento = new Date(ano, 11, 25 - (diaSemanaNatal === 0 ? 7 : diaSemanaNatal));
    const primeiroDomingoAdvento = this.adicionarDias(quartoDomingoAdvento, -21);
    const cristoRei = this.adicionarDias(primeiroDomingoAdvento, -7);

    eventos.push(
      {
        titulo: 'Quarta-feira de Cinzas • Início da Quaresma',
        data: this.formatarDataIso(cinzas),
        tipo: 'Tempo Forte',
        corLiturgica: 'Roxo',
        descricao: 'Dia de jejum e abstinência de carne na Igreja universal.'
      },
      {
        titulo: 'Domingo de Ramos e da Paixão do Senhor',
        data: this.formatarDataIso(ramos),
        tipo: 'Solenidade',
        corLiturgica: 'Vermelho',
        descricao: 'Abertura solene da Semana Santa.'
      },
      {
        titulo: 'Quinta-feira Santa • Ceia do Senhor e Instituição da Eucaristia',
        data: this.formatarDataIso(quintaSanta),
        tipo: 'Solenidade',
        corLiturgica: 'Branco',
        descricao: 'Instituição do Sacerdócio Ministerial e da Santíssima Eucaristia. Lava-pés.'
      },
      {
        titulo: 'Sexta-feira da Paixão e Morte do Senhor',
        data: this.formatarDataIso(sextaPaixao),
        tipo: 'Solenidade',
        corLiturgica: 'Vermelho',
        descricao: 'Celebração da Paixão e Adoração da Santa Cruz. Dia de jejum e recolhimento.'
      },
      {
        titulo: 'Sábado Santo • Solene Vigília Pascal',
        data: this.formatarDataIso(sabadoSanto),
        tipo: 'Solenidade',
        corLiturgica: 'Branco',
        descricao: 'Mãe de todas as santas vigílias da Igreja.'
      },
      {
        titulo: 'Domingo da Ressurreição do Senhor • Páscoa',
        data: this.formatarDataIso(pascoa),
        tipo: 'Solenidade',
        corLiturgica: 'Branco',
        descricao: 'Ressurreição de Nosso Senhor Jesus Cristo. Aleluia!'
      },
      {
        titulo: 'Domingo de Pentecostes',
        data: this.formatarDataIso(pentecostes),
        tipo: 'Solenidade',
        corLiturgica: 'Vermelho',
        descricao: 'Descida do Espírito Santo sobre os Apóstolos e a Virgem Maria.'
      },
      {
        titulo: 'Santíssima Trindade',
        data: this.formatarDataIso(santissimaTrindade),
        tipo: 'Solenidade',
        corLiturgica: 'Branco',
        descricao: 'Solenidade de Deus Uno e Trino: Pai, Filho e Espírito Santo.'
      },
      {
        titulo: 'Corpus Christi • Santíssimo Corpo e Sangue de Cristo',
        data: this.formatarDataIso(corpusChristi),
        tipo: 'Solenidade',
        corLiturgica: 'Branco',
        descricao: 'Procissões eucarísticas e manifestação pública da fé católica.'
      },
      {
        titulo: 'SOLENIDADE DO SAGRADO CORAÇÃO DE JESUS (Festa Titular Dehoniana)',
        data: this.formatarDataIso(sagradoCoracaoJesus),
        tipo: 'Solenidade',
        corLiturgica: 'Branco',
        descricao: 'Festa Magna da Congregação dos Padres do Sagrado Coração de Jesus (Dehonianos) e Dia Mundial de Oração pela Santificação dos Sacerdotes.'
      },
      {
        titulo: 'Imaculado Coração da Bem-Aventurada Virgem Maria',
        data: this.formatarDataIso(imaculadoCoracaoMaria),
        tipo: 'Festa',
        corLiturgica: 'Branco',
        descricao: 'Memória mariana imediatamente ligada ao Coração de Jesus.'
      },
      {
        titulo: 'Nosso Senhor Jesus Cristo, Rei do Universo',
        data: this.formatarDataIso(cristoRei),
        tipo: 'Solenidade',
        corLiturgica: 'Branco',
        descricao: 'Encerramento do Ano Litúrgico.'
      },
      {
        titulo: '1º Domingo do Advento • Novo Ano Litúrgico',
        data: this.formatarDataIso(primeiroDomingoAdvento),
        tipo: 'Tempo Forte',
        corLiturgica: 'Roxo',
        descricao: 'Início do tempo de preparação para a vinda do Salvador.'
      }
    );

    // --- FESTAS LITÚRGICAS FIXAS & PRÓPRIO DEHONIANO ---
    const fixas: Array<{ diaMes: string; titulo: string; tipo: EventoLiturgicoRomcal['tipo']; cor: string; desc: string }> = [
      { diaMes: '01-01', titulo: 'Santa Maria, Mãe de Deus', tipo: 'Solenidade', cor: 'Branco', desc: 'Oitava do Natal e Dia Mundial da Paz.' },
      { diaMes: '03-14', titulo: 'Natalício do Venerável Pe. Leão Dehon (1843)', tipo: 'Memória Dehoniana', cor: 'Branco', desc: 'Nascimento do Fundador dos Padres do Sagrado Coração de Jesus em La Capelle (França).' },
      { diaMes: '03-19', titulo: 'São José, Esposo da Virgem Maria e Patrono Universal', tipo: 'Solenidade', cor: 'Branco', desc: 'Guardião do Redentor e padroeiro dos trabalhadores e das famílias.' },
      { diaMes: '03-25', titulo: 'Anunciação do Senhor', tipo: 'Solenidade', cor: 'Branco', desc: 'Encarnação do Verbo no seio puríssimo de Maria Santíssima.' },
      { diaMes: '06-24', titulo: 'Natividade de São João Batista', tipo: 'Solenidade', cor: 'Branco', desc: 'Precursor do Messias.' },
      { diaMes: '06-29', titulo: 'São Pedro e São Paulo, Apóstolos', tipo: 'Solenidade', cor: 'Vermelho', desc: 'Colunas da Igreja de Cristo e comunhão com a Sé de Pedro.' },
      { diaMes: '08-12', titulo: 'Transitus do Pe. Leão Dehon ao Pai (1925)', tipo: 'Memória Dehoniana', cor: 'Branco', desc: 'Páscoa definitiva do Fundador: "Por Ele vivi, por Ele morro".' },
      { diaMes: '08-15', titulo: 'Assunção de Nossa Senhora ao Céu', tipo: 'Solenidade', cor: 'Branco', desc: 'Glória de Maria elevada em corpo e alma aos céus.' },
      { diaMes: '10-12', titulo: 'Nossa Senhora da Conceição Aparecida • Padroeira do Brasil', tipo: 'Solenidade', cor: 'Branco', desc: 'Padroeira principal da Nação Brasileira e dia de prece pela pátria.' },
      { diaMes: '11-01', titulo: 'Todos os Santos', tipo: 'Solenidade', cor: 'Branco', desc: 'Celebração de todos os eleitos na glória de Deus.' },
      { diaMes: '11-02', titulo: 'Comemoração de Todos os Fiéis Defuntos', tipo: 'Tempo Forte', cor: 'Roxo', desc: 'Sufrágio pelas almas e oração pelos confrades falecidos.' },
      { diaMes: '12-08', titulo: 'Imaculada Conceição da Bem-Aventurada Virgem Maria', tipo: 'Solenidade', cor: 'Branco', desc: 'Concebida sem mácula original.' },
      { diaMes: '12-25', titulo: 'Natal de Nosso Senhor Jesus Cristo', tipo: 'Solenidade', cor: 'Branco', desc: 'Nascimento de Jesus em Belém. Glória a Deus nas alturas!' }
    ];

    fixas.forEach(f => {
      eventos.push({
        titulo: f.titulo,
        data: `${ano}-${f.diaMes}`,
        tipo: f.tipo,
        corLiturgica: f.cor,
        descricao: f.desc
      });
    });

    return eventos.sort((a, b) => a.data.localeCompare(b.data));
  },

  /**
   * Converte data ISO (YYYY-MM-DD) para formato iCal (YYYYMMDD).
   */
  isoParaIcalData(isoDate: string): string {
    return isoDate.replace(/\D/g, '').slice(0, 8);
  },

  /**
   * Converte data ISO e hora para DTSTART / DTEND formato UTC ou Local.
   */
  formatarDataIcal(isoDate: string, horario?: string | null): string {
    const limpo = this.isoParaIcalData(isoDate);
    if (!horario || !horario.includes(':')) {
      return `VALUE=DATE:${limpo}`;
    }
    const [h, m] = horario.split(':');
    const hora = h.padStart(2, '0');
    const min = m.padStart(2, '0');
    return `${limpo}T${hora}${min}00`;
  },

  /**
   * Escapa caracteres reservados do padrão iCalendar (RFC 5545).
   */
  escaparIcalTexto(texto?: string | null): string {
    if (!texto) return '';
    return texto
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r\n|\n|\r/g, '\\n');
  },

  /**
   * Gera o conteúdo completo em formato iCalendar (RFC 5545) unificando:
   * 1. Eventos cadastrados da Província BRM (tabela do Supabase)
   * 2. Festas Litúrgicas Canônicas da Igreja & Próprio Dehoniano (Romcal)
   */
  gerarFeedIcs(
    eventosProvinciais: EventoProvincial[],
    anoReferencia: number = new Date().getFullYear()
  ): string {
    const agoraIso = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const festasLiturgicas = this.gerarFestasLiturgicasIgreja(anoReferencia);

    const linhas: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Provincia BRM//Sistema BRM e Liturgia//PT-BR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Província BRM • Calendário Provincial e Litúrgico',
      'X-WR-CALDESC:Eventos Oficiais da Província BRM (Retiros, Assembleias, Visitas) e Festas Litúrgicas da Igreja Católica e Família Dehoniana.',
      'X-WR-TIMEZONE:America/Sao_Paulo',
      'X-PUBLISHED-TTL:PT12H'
    ];

    // 1. Inserir Eventos Oficiais da Província BRM
    eventosProvinciais.forEach(evt => {
      const uid = `brm-evt-${evt.id || Math.random().toString(36).slice(2)}@sistema.brm`;
      const inicio = this.formatarDataIcal(evt.data_inicio, evt.horario);
      const fimData = evt.data_fim || evt.data_inicio;
      const fim = this.formatarDataIcal(fimData, evt.horario);
      const local = [evt.local, evt.cidade, evt.uf].filter(Boolean).join(' - ');

      linhas.push('BEGIN:VEVENT');
      linhas.push(`UID:${uid}`);
      linhas.push(`DTSTAMP:${agoraIso}`);
      linhas.push(`DTSTART;${inicio}`);
      linhas.push(`DTEND;${fim}`);
      linhas.push(`SUMMARY:[Província BRM] ${this.escaparIcalTexto(evt.titulo)}`);
      linhas.push(`DESCRIPTION:${this.escaparIcalTexto(evt.descricao || `Tipo: ${evt.tipo} • Público: ${evt.publico_alvo || 'Geral'}`)}`);
      if (local) {
        linhas.push(`LOCATION:${this.escaparIcalTexto(local)}`);
      }
      linhas.push(`CATEGORIES:Província BRM,${evt.tipo}`);
      linhas.push('STATUS:CONFIRMED');
      linhas.push('END:VEVENT');
    });

    // 2. Inserir Solenidades e Festas da Igreja (Romcal + SCJ)
    festasLiturgicas.forEach(festa => {
      const uid = `liturgia-${festa.data}-${festa.tipo.replace(/\s+/g, '')}@sistema.brm`;
      const inicio = `VALUE=DATE:${this.isoParaIcalData(festa.data)}`;
      // Data fim para evento de dia inteiro no iCal é o dia seguinte
      const dtObj = new Date(`${festa.data}T00:00:00`);
      const dtAmanha = this.adicionarDias(dtObj, 1);
      const fim = `VALUE=DATE:${this.isoParaIcalData(this.formatarDataIso(dtAmanha))}`;

      linhas.push('BEGIN:VEVENT');
      linhas.push(`UID:${uid}`);
      linhas.push(`DTSTAMP:${agoraIso}`);
      linhas.push(`DTSTART;${inicio}`);
      linhas.push(`DTEND;${fim}`);
      linhas.push(`SUMMARY:⛪ ${this.escaparIcalTexto(festa.titulo)}`);
      linhas.push(`DESCRIPTION:${this.escaparIcalTexto(`${festa.descricao} (Cor litúrgica: ${festa.corLiturgica} • Grau: ${festa.tipo})`)}`);
      linhas.push('LOCATION:Igreja Católica / Província BRM');
      linhas.push(`CATEGORIES:Liturgia Católica,${festa.tipo}`);
      linhas.push('STATUS:CONFIRMED');
      linhas.push('TRANSP:TRANSPARENT'); // Não bloqueia agenda como ocupado
      linhas.push('END:VEVENT');
    });

    linhas.push('END:VCALENDAR');
    return linhas.join('\r\n');
  },

  /**
   * Dispara o download direto do arquivo .ics no navegador.
   */
  baixarArquivoIcs(eventosProvinciais: EventoProvincial[], nomeArquivo: string = 'agenda_provincia_brm.ics') {
    const conteudo = this.gerarFeedIcs(eventosProvinciais);
    const blob = new Blob([conteudo], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nomeArquivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Gera um link de adicionar evento direto ao Google Agenda na Web.
   */
  gerarLinkGoogleCalendar(evento: EventoProvincial): string {
    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const text = encodeURIComponent(`[Província BRM] ${evento.titulo}`);
    const details = encodeURIComponent(evento.descricao || `Tipo: ${evento.tipo} • Província BRM`);
    const location = encodeURIComponent([evento.local, evento.cidade, evento.uf].filter(Boolean).join(', '));
    const dtStart = this.isoParaIcalData(evento.data_inicio);
    const dtEnd = this.isoParaIcalData(evento.data_fim || evento.data_inicio);
    const dates = `${dtStart}/${dtEnd}`;

    return `${baseUrl}&text=${text}&dates=${dates}&details=${details}&location=${location}`;
  }
};

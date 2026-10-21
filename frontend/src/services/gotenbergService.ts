/**
 * gotenbergService.ts
 * Cliente completo para o microserviço Gotenberg (instalado via Template no Easypanel).
 * Gera PDFs de alta fidelidade para Decretos, Portarias, Celebret (Idoneidade),
 * Certidões Sacramentais, Votos Religiosos e Ofícios Canônicos no Papel Timbrado Oficial BRM.
 */

/**
 * gotenbergService.ts
 * Cliente completo para o microserviço Gotenberg (instalado via Template no Easypanel).
 * Gera PDFs de alta fidelidade para Decretos, Portarias, Celebret (Idoneidade),
 * Certidões Sacramentais, Votos Religiosos, Circulares e Ficha Cadastral do Religioso (Dossiê Canônico)
 * no Papel Timbrado Oficial BRM com Brasão Dehoniano.
 */

import { LOGO_TIMBRADO_DATA_URI } from '../assets/logoTimbradoBase64';
import { registrarDocumentoOficial } from '../lib/autenticacaoDocumental';

export interface OpcoesDocumentoGotenberg {
  titulo: string;
  subtitulo?: string;
  protocolo?: string;
  dataEmissao?: string;
  corpoHtml: string;
  orientacao?: 'portrait' | 'landscape';
  codigoAutenticidade?: string;
  formatoPdfA?: boolean;
  omitirTituloPadrao?: boolean;
  cabecalhoCompacto?: boolean;
}

export interface TrabalhoTrajetoria {
  periodo: string; // Ex: '2015 - 2020' ou '2023 - Atual'
  instituicao: string; // Ex: 'Paróquia São Luiz Gonzaga', 'Seminário São José'
  funcao: string; // Ex: 'Pároco', 'Vigário Paroquial', 'Reitor', 'Formador', 'Ecônomo'
  local?: string; // Ex: 'Brusque / SC', 'Corupá / SC'
  observacoes?: string;
}

export interface MissaoServicoTrajetoria {
  tipo?: string; // Missão, Comissão Provincial, Assessoria
  instituicao?: string;
  funcao?: string;
  periodo?: string;
  local?: string;
}

export interface FormacaoAcademicaFicha {
  curso: string;
  instituicao: string;
  anoOuPeriodo?: string;
}

export interface DadosFichaReligioso {
  nomeCivil: string;
  nomeReligioso?: string;
  grau?: string; // Padre, Diácono, Frater, Irmão, Bispo
  numeroCadastro?: string | number;
  statusCadastro?: string;
  dataNascimento?: string;
  naturalidade?: string;
  nacionalidade?: string;
  cpf?: string;
  rg?: string;
  rgOrgao?: string;
  tituloEleitor?: string;
  pis?: string;
  cnh?: string;
  cnhCategoria?: string;
  filiacaoPai?: string;
  filiacaoMae?: string;
  fotoUrl?: string | null;

  // Contatos e Residência
  comunidadeAtualNome?: string;
  oficioAtual?: string;
  enderecoResidencial?: string;
  telefoneCelular?: string;
  whatsapp?: string;
  emailInstitucional?: string;
  emailPessoal?: string;
  tipoSanguineo?: string;
  planoSaude?: string;
  contatoEmergencia?: string;

  // Trajetória Canônica / Linha do Tempo
  dataBatismo?: string;
  paroquiaBatismo?: string;
  dataPrimeiraEucaristia?: string;
  dataCrisma?: string;
  dataIngresso?: string;
  dataPrimeirosVotos?: string;
  localPrimeirosVotos?: string;
  dataVotosPerpetuos?: string;
  localVotosPerpetuos?: string;
  dataDiaconato?: string;
  localDiaconato?: string;
  dataPresbiterato?: string;
  localPresbiterato?: string;
  bispoOrdenante?: string;
  ministeriosInstituidos?: Array<{ tipo: string; data?: string; local?: string }>;

  // Onde já trabalhou, com o que trabalhou (Trajetória & Obras)
  historicoTrabalhos: TrabalhoTrajetoria[];
  missoesServicos?: MissaoServicoTrajetoria[];
  formacoesAcademicas?: FormacaoAcademicaFicha[];
  idiomas?: string[];
  dataEmissao?: string;
}

export interface DadosDecretoProvincial {
  numeroDecreto: string; // Ex: DEC-BRM-014/2026
  ano: number;
  assunto: string;
  religiosoNome: string;
  religiosoOficio: string;
  destinoComunidade: string;
  cidadeUf: string;
  textoProvisao: string;
  dataEmissao: string;
  provincialNome: string;
  secretarioNome: string;
}

export interface DadosPortariaProvincial {
  numeroPortaria: string; // Ex: PORT-BRM-008/2026
  assunto: string;
  destinatarios: string;
  finalidade: string;
  textoPortaria: string;
  dataEmissao: string;
  provincialNome: string;
  secretarioNome: string;
}

export interface DadosCelebretCanonica {
  numeroCertidao: string; // Ex: CEL-BRM-2026/045
  religiosoNome: string;
  grauMinisterial: string; // Ex: Presbítero, Diácono
  dataOrdenacao: string;
  bispoOrdenante: string;
  validadeAte: string;
  observacoes: string;
  dataEmissao: string;
  provincialNome: string;
}

export interface DadosCertidaoVotos {
  numeroRegistro: string;
  religiosoNome: string;
  tipoVotos: 'Temporários' | 'Perpétuos';
  dataProfissao: string;
  localProfissao: string;
  superiorRecebedor: string;
  livroRegistro: string;
  folhaRegistro: string;
  termoRegistro: string;
  dataEmissao: string;
  secretarioNome: string;
}

export interface DadosCircularProvincial {
  numeroCircular: string; // Ex: CIRC-BRM-005/2026
  assunto: string;
  saudacao: string;
  corpoTexto: string;
  dataEmissao: string;
  provincialNome: string;
}

export const gotenbergService = {
  /**
   * Obtém a URL do Gotenberg configurada no ambiente (Vite) ou no localStorage.
   */
  obterUrlBase(): string {
    const envUrl = import.meta.env.VITE_GOTENBERG_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
      return envUrl.replace(/\/$/, '');
    }
    const local = localStorage.getItem('brm_gotenberg_url');
    if (local && local.trim() !== '') {
      return local.replace(/\/$/, '');
    }
    return 'https://sitebrm-gotenberg.ryk9yi.easypanel.host';
  },

  /**
   * Resolve a URL para requisição, utilizando o proxy do Vite/Nginx quando necessário para contornar restrições de CORS.
   */
  resolverUrlEndpoint(caminho: string): string[] {
    const base = this.obterUrlBase();
    const limpo = caminho.startsWith('/') ? caminho : `/${caminho}`;
    const urlProxy = `/gotenberg-api${limpo}`;
    const urlDireta = `${base}${limpo}`;

    // Retorna ordem de tentativa: proxy primeiro para evitar CORS no browser, depois direta
    return [urlProxy, urlDireta];
  },

  /**
   * Salva uma URL personalizada do Gotenberg localmente.
   */
  definirUrlBase(url: string) {
    localStorage.setItem('brm_gotenberg_url', url.trim());
  },

  /**
   * Testa a conectividade com o container do Gotenberg no Easypanel.
   */
  async testarConexao(): Promise<{ online: boolean; mensagem: string }> {
    const base = this.obterUrlBase();
    const urlsTentativa = this.resolverUrlEndpoint('/health');

    for (const url of urlsTentativa) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const dados = await res.json().catch(() => null);
          return {
            online: true,
            mensagem: `Gotenberg conectado com sucesso! (Status: ${dados?.status || 'up'})`
          };
        }
      } catch (_) {
        // Tenta próxima URL da lista (proxy ou direta)
      }
    }

    return {
      online: false,
      mensagem: `Não foi possível conectar ao Gotenberg (${base}). Verifique se o template está rodando no Easypanel.`
    };
  },

  /**
   * Constrói o HTML do Cabeçalho Oficial do Papel Timbrado BRM com Brasão Dehoniano.
   */
  gerarCabecalhoHtml(tituloDoc?: string, protocolo?: string, dataEmissao?: string, compacto: boolean = false): string {
    if (compacto) {
      return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 100%;
    padding: 0 0.5in;
    font-family: Georgia, 'Times New Roman', serif;
    -webkit-print-color-adjust: exact;
  }
  .header-compacto {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 0.8pt solid #113240;
    padding-bottom: 4px;
    font-size: 7pt;
    color: #475569;
    font-family: monospace;
    width: 100%;
  }
  .header-compacto strong {
    color: #113240;
  }
</style>
</head>
<body>
  <div class="header-compacto">
    <span>CONGREGAÇÃO SCJ • PROVÍNCIA BRM</span>
    <span>${tituloDoc ? tituloDoc + ' • ' : ''}${protocolo ? protocolo + ' • ' : ''}Emissão: ${dataEmissao || ''}</span>
  </div>
</body>
</html>`;
    }

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 100%;
    padding: 0 0.5in;
    font-family: Georgia, 'Times New Roman', serif;
    -webkit-print-color-adjust: exact;
  }
  .header-container {
    text-align: center;
    border-bottom: 1.2pt solid #113240;
    padding-bottom: 5px;
    position: relative;
    width: 100%;
  }
  .system-label {
    position: absolute;
    top: 0;
    right: 0;
    font-size: 6.5pt;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-family: monospace;
  }
  .emblem {
    height: 48px;
    width: auto;
    margin: 0 auto 3px auto;
    display: block;
    object-fit: contain;
  }
  .congregacao {
    font-size: 10.5pt;
    font-weight: normal;
    color: #113240;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
    line-height: 1.2;
  }
  .provincia {
    font-size: 12pt;
    font-weight: bold;
    color: #113240;
    margin: 2px 0 0 0;
    line-height: 1.2;
  }
  .meta {
    margin-top: 5px;
    display: flex;
    justify-content: space-between;
    font-size: 7.5pt;
    color: #475569;
    font-family: monospace;
  }
</style>
</head>
<body>
  <div class="header-container">
    <span class="system-label">Secretaria Provincial</span>
    <img src="${LOGO_TIMBRADO_DATA_URI}" class="emblem" alt="Brasão Dehoniano" />
    <h1 class="congregacao">CONGREGAÇÃO DOS SACERDOTES DO SAGRADO CORAÇÃO DE JESUS</h1>
    <h2 class="provincia">Província Brasileira Meridional</h2>
    ${(protocolo || dataEmissao || tituloDoc) ? `
    <div class="meta">
      <span>Província BRM • Chancelaria</span>
      <span>${protocolo ? 'Protocolo: ' + protocolo : ''} ${dataEmissao ? '• Emissão: ' + dataEmissao : ''}</span>
    </div>` : ''}
  </div>
</body>
</html>`;
  },

  /**
   * Constrói o HTML do Rodapé Oficial do Papel Timbrado BRM.
   */
  gerarRodapeHtml(): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 100%;
    padding: 0 0.5in;
    font-family: Georgia, 'Times New Roman', serif;
    -webkit-print-color-adjust: exact;
  }
  .footer-container {
    border-top: 1px solid #94a3b8;
    padding-top: 5px;
    font-size: 7.5pt;
    color: #475569;
    line-height: 1.35;
    position: relative;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-left {
    text-align: left;
  }
  .page-number {
    font-size: 7.5pt;
    color: #64748b;
    font-family: monospace;
    white-space: nowrap;
    margin-left: 10px;
  }
</style>
</head>
<body>
  <div class="footer-container">
    <div class="footer-left">
      <div>Rua Padre Gabriel Lux, 900 – Caixa Postal 21 – Corupá/SC | CEP 89278-000</div>
      <div>Telefone: +55 (47) 3375-1194 • E-mail: secretaria@brm.org.br • Site: scj.org.br</div>
    </div>
    <div class="page-number">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>
  </div>
</body>
</html>`;
  },

  /**
   * Converte HTML em PDF através do Gotenberg.
   */
  async gerarPdfDocumento(opcoes: OpcoesDocumentoGotenberg): Promise<Blob> {
    const indexHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${opcoes.titulo}</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #1e293b;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      position: relative;
    }
    h1, h2, h3 { color: #113240; }
    .doc-titulo {
      font-size: 15pt;
      font-weight: bold;
      text-align: center;
      margin: 15px 0 6px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .doc-subtitulo {
      font-size: 11pt;
      text-align: center;
      color: #64748b;
      margin-bottom: 25px;
      font-style: italic;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.035;
      pointer-events: none;
      z-index: 0;
      width: 320px;
      height: 320px;
    }
    .watermark img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: grayscale(100%);
    }
    .doc-conteudo {
      position: relative;
      z-index: 1;
    }
    .selo-autenticidade {
      margin-top: 35px;
      padding: 12px 16px;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      background-color: #f8fafc;
      font-size: 8.5pt;
      color: #475569;
      display: flex;
      justify-content: space-between;
      align-items: center;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      page-break-inside: auto;
    }
    tr { page-break-inside: avoid; }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
      text-align: left;
      font-size: 9.5pt;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: #0f172a;
      text-transform: uppercase;
      font-size: 8.5pt;
    }
  </style>
</head>
<body>
  <div class="watermark">
    <img src="${LOGO_TIMBRADO_DATA_URI}" alt="" />
  </div>

  <div class="doc-conteudo">
    ${!opcoes.omitirTituloPadrao && opcoes.titulo ? `<div class="doc-titulo">${opcoes.titulo}</div>` : ''}
    ${!opcoes.omitirTituloPadrao && opcoes.subtitulo ? `<div class="doc-subtitulo">${opcoes.subtitulo}</div>` : ''}

    ${opcoes.corpoHtml}

    ${opcoes.codigoAutenticidade ? `
    <div class="selo-autenticidade">
      <div>
        <strong>Documento Canônico Autenticado Digitalmente</strong><br>
        Código de Validação: <code>${opcoes.codigoAutenticidade}</code><br>
        Conferência de Fé Pública Notarial: <em>sistema.brm.org.br/validar</em>
      </div>
    </div>` : ''}
  </div>
</body>
</html>`;

    const headerHtml = this.gerarCabecalhoHtml(
      opcoes.titulo,
      opcoes.protocolo,
      opcoes.dataEmissao,
      opcoes.cabecalhoCompacto
    );
    const footerHtml = this.gerarRodapeHtml();

    const formData = new FormData();
    formData.append('files', new Blob([indexHtml], { type: 'text/html' }), 'index.html');
    formData.append('files', new Blob([headerHtml], { type: 'text/html' }), 'header.html');
    formData.append('files', new Blob([footerHtml], { type: 'text/html' }), 'footer.html');

    // Margens e configurações do Chromium
    const marginTop = opcoes.cabecalhoCompacto ? '0.45' : '1.35';
    formData.append('marginTop', marginTop);
    formData.append('marginBottom', '0.65');
    formData.append('marginLeft', '0.5');
    formData.append('marginRight', '0.5');
    formData.append('paperWidth', '8.27'); // A4
    formData.append('paperHeight', '11.69');
    if (opcoes.orientacao === 'landscape') {
      formData.append('landscape', 'true');
    }
    if (opcoes.formatoPdfA) {
      formData.append('pdfFormat', 'PDF/A-1b');
    }

    const urlsTentativa = this.resolverUrlEndpoint('/forms/chromium/convert/html');
    let ultimoErro = '';

    for (const endpoint of urlsTentativa) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          return await response.blob();
        }
        ultimoErro = await response.text().catch(() => response.statusText);
      } catch (err: any) {
        ultimoErro = err?.message || 'Falha na conexão';
      }
    }

    throw new Error(`Erro Gotenberg: ${ultimoErro || 'Não foi possível conectar ao serviço de PDF.'}`);
  },

  /**
   * 1. Gera Decreto Canônico Provincial (DEC-BRM)
   */
  async gerarDecretoPdf(dados: DadosDecretoProvincial): Promise<Blob> {
    const corpo = `
      <div style="text-align: justify; margin: 25px 0; font-size: 11pt; line-height: 1.8;">
        <p>O <strong>SUPERIOR PROVINCIAL DA PROVÍNCIA BRASILEIRA MERIDIONAL DA CONGREGAÇÃO DOS SACERDOTES DO SAGRADO CORAÇÃO DE JESUS</strong>, no uso das atribuições canônicas que lhe são conferidas pela Regra de Vida e pelas normas do Direito Canônico Universal,</p>
        
        <p style="text-align: center; font-size: 13pt; font-weight: bold; margin: 25px 0; letter-spacing: 0.1em; color: #113240;">
          D E C R E T A:
        </p>
        
        <p>A nomeação e provisão do reverendo <strong>${dados.religiosoNome}</strong> para exercer o ofício de <strong>${dados.religiosoOficio}</strong> junto à comunidade de <strong>${dados.destinoComunidade}</strong>, situada em ${dados.cidadeUf}.</p>
        
        <p>${dados.textoProvisao || 'O presbítero empossado exercerá seu múnus pastoral em estrita observância das constituições da Congregação e das diretrizes pastorais da Diocese local, promovendo a caridade fraterna e a vida sacramental do povo de Deus.'}</p>
        
        <p>Este decreto entra em vigor a partir da data de sua publicação, revogadas as disposições em contrário.</p>
        
        <p style="margin-top: 30px;">Dado e passado na Sede Provincial da Província BRM, aos ${dados.dataEmissao}.</p>
      </div>

      <div style="margin-top: 70px; display: flex; justify-content: space-around; text-align: center; font-size: 10pt; page-break-inside: avoid;">
        <div style="width: 40%; border-top: 1px solid #1e293b; padding-top: 8px;">
          <strong>${dados.provincialNome || 'Pe. Superior Provincial, scj'}</strong><br>
          Superior Provincial • Província BRM
        </div>
        <div style="width: 40%; border-top: 1px solid #1e293b; padding-top: 8px;">
          <strong>${dados.secretarioNome || 'Pe. Secretário Provincial, scj'}</strong><br>
          Secretário Provincial • Chancelaria
        </div>
      </div>
    `;

    const codigoAutenticidade = `BRM-DEC-${Date.now().toString(36).toUpperCase()}`;
    void registrarDocumentoOficial({
      codigo: codigoAutenticidade,
      tipo: 'Decreto Canônico Provincial',
      titulo: `Decreto Provincial Nº ${dados.numeroDecreto} • ${dados.assunto}`,
      identificador_oficial: dados.numeroDecreto,
      comunidade_obra: dados.destinoComunidade,
      religioso_nome: dados.religiosoNome,
      situacao: 'Em Vigor / Assento Canônico Válido com Fé Pública'
    });

    return await this.gerarPdfDocumento({
      titulo: `DECRETO PROVINCIAL Nº ${dados.numeroDecreto}`,
      subtitulo: `Provisão Canônica • ${dados.assunto}`,
      protocolo: dados.numeroDecreto,
      dataEmissao: dados.dataEmissao,
      corpoHtml: corpo,
      codigoAutenticidade,
      formatoPdfA: true
    });
  },

  /**
   * 2. Gera Portaria Provincial (PORT-BRM)
   */
  async gerarPortariaPdf(dados: DadosPortariaProvincial): Promise<Blob> {
    const corpo = `
      <div style="text-align: justify; margin: 25px 0; font-size: 11pt; line-height: 1.8;">
        <p>O <strong>SUPERIOR PROVINCIAL DA PROVÍNCIA BRASILEIRA MERIDIONAL DOS PADRES DO SAGRADO CORAÇÃO DE JESUS</strong>, no exercício de seu múnus administrativo,</p>
        
        <p style="text-align: center; font-size: 13pt; font-weight: bold; margin: 25px 0; letter-spacing: 0.1em; color: #113240;">
          R E S O L V E:
        </p>
        
        <p><strong>Artigo 1º</strong> — ${dados.textoPortaria}</p>
        <p><strong>Artigo 2º</strong> — Ficam designados para a presente finalidade os seguintes confrades: <strong>${dados.destinatarios}</strong>.</p>
        <p><strong>Artigo 3º</strong> — Esta portaria passa a vigorar a partir desta data, mantendo sua eficácia até ulterior disposição do Governo Provincial.</p>
        
        <p style="margin-top: 30px;">Sede Provincial, Corupá/SC, ${dados.dataEmissao}.</p>
      </div>

      <div style="margin-top: 70px; display: flex; justify-content: space-around; text-align: center; font-size: 10pt; page-break-inside: avoid;">
        <div style="width: 40%; border-top: 1px solid #1e293b; padding-top: 8px;">
          <strong>${dados.provincialNome || 'Pe. Superior Provincial, scj'}</strong><br>
          Superior Provincial
        </div>
        <div style="width: 40%; border-top: 1px solid #1e293b; padding-top: 8px;">
          <strong>${dados.secretarioNome || 'Pe. Secretário Provincial, scj'}</strong><br>
          Secretário Provincial
        </div>
      </div>
    `;

    const codigoAutenticidade = `BRM-PORT-${Date.now().toString(36).toUpperCase()}`;
    void registrarDocumentoOficial({
      codigo: codigoAutenticidade,
      tipo: 'Portaria Provincial',
      titulo: `Portaria Provincial Nº ${dados.numeroPortaria} • ${dados.assunto}`,
      identificador_oficial: dados.numeroPortaria,
      comunidade_obra: 'Província BRM',
      situacao: 'Em Vigor / Instrumento Administrativo Válido'
    });

    return await this.gerarPdfDocumento({
      titulo: `PORTARIA PROVINCIAL Nº ${dados.numeroPortaria}`,
      subtitulo: dados.assunto,
      protocolo: dados.numeroPortaria,
      dataEmissao: dados.dataEmissao,
      corpoHtml: corpo,
      codigoAutenticidade,
      formatoPdfA: true
    });
  },

  /**
   * 3. Gera Declaração Canônica / Celebret (Idoneidade para Celebração e Viagens)
   */
  async gerarCelebretPdf(dados: DadosCelebretCanonica): Promise<Blob> {
    const corpo = `
      <div style="text-align: justify; margin: 25px 0; font-size: 11pt; line-height: 1.8;">
        <p style="text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 25px; color: #113240;">
          DECLARAÇÃO DE IDONEIDADE CANÔNICA (CELEBRET)
        </p>

        <p>Atestamos e certificamos, a quem couber, que o Revmo. <strong>${dados.religiosoNome}</strong> é sacerdote presbítero validamente ordenado, pertencente em votos perpétuos à Congregação dos Padres do Sagrado Coração de Jesus (Província Brasileira Meridional).</p>
        
        <table style="margin: 20px 0;">
          <tr><td><strong>Sacerdote:</strong></td><td>${dados.religiosoNome}</td></tr>
          <tr><td><strong>Grau Ministerial:</strong></td><td>${dados.grauMinisterial || 'Presbítero'}</td></tr>
          <tr><td><strong>Ordenação:</strong></td><td>${dados.dataOrdenacao || 'Válida'}</td></tr>
          <tr><td><strong>Bispo Ordenante:</strong></td><td>${dados.bispoOrdenante || 'Igreja Católica Apostólica Romana'}</td></tr>
          <tr><td><strong>Validade do Celebret:</strong></td><td>${dados.validadeAte || '12 meses a contar da data de emissão'}</td></tr>
        </table>

        <p>Declara-se que contra o referido sacerdote nada obsta nem vigora qualquer impedimento, censura canônica ou penalidade que restrinja o lícito e válido exercício do Sagrado Ministério da Eucaristia, da Reconciliação e da pregação da Palavra de Deus.</p>
        
        <p>Recomenda-se fraternalmente este ministro de Deus a todos os Ordinários locais, Párocos e Reitores de Santuários para que seja acolhido na celebração dos divinos mistérios.</p>

        <p style="margin-top: 30px;">Corupá/SC, ${dados.dataEmissao}.</p>
      </div>

      <div style="margin-top: 60px; display: flex; justify-content: center; text-align: center; font-size: 10pt; page-break-inside: avoid;">
        <div style="width: 50%; border-top: 1px solid #1e293b; padding-top: 8px;">
          <strong>${dados.provincialNome || 'Pe. Superior Provincial, scj'}</strong><br>
          Superior Provincial • Província BRM
        </div>
      </div>
    `;

    const codigoAutenticidade = `BRM-CEL-${Date.now().toString(36).toUpperCase()}`;
    void registrarDocumentoOficial({
      codigo: codigoAutenticidade,
      tipo: 'Celebret (Certidão de Idoneidade Canônica)',
      titulo: `Declaração Canônica de Uso Legítimo de Ordens Sagradas (Celebret) • ${dados.religiosoNome}`,
      identificador_oficial: dados.numeroCertidao,
      religioso_nome: dados.religiosoNome,
      situacao: `Regular / Válido até ${dados.validadeAte}`
    });

    return await this.gerarPdfDocumento({
      titulo: 'CERTIDÃO DE USO DE ORDENS SAGRADAS',
      subtitulo: 'Celebret Canônico • Província Brasil Meridional',
      protocolo: dados.numeroCertidao,
      dataEmissao: dados.dataEmissao,
      corpoHtml: corpo,
      codigoAutenticidade,
      formatoPdfA: true
    });
  },

  /**
   * 4. Gera Certidão Oficial de Profissão de Votos Religiosos (SCJ)
   */
  async gerarCertidaoVotosPdf(dados: DadosCertidaoVotos): Promise<Blob> {
    const corpo = `
      <div style="text-align: justify; margin: 25px 0; font-size: 11pt; line-height: 1.8;">
        <p style="text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 25px; color: #113240;">
          CERTIDÃO DE PROFISSÃO DE VOTOS RELIGIOSOS
        </p>

        <p>Certifico, para os devidos fins de direito canônico, que revendo os livros de registros das Profissões Religiosas desta Província Brasil Meridional da Congregação dos Sacerdotes do Sagrado Coração de Jesus, consta o seguinte assento:</p>

        <table>
          <tr><td><strong>Professo:</strong></td><td>${dados.religiosoNome}</td></tr>
          <tr><td><strong>Natureza dos Votos:</strong></td><td>Votos ${dados.tipoVotos} (Castidade, Pobreza e Obediência)</td></tr>
          <tr><td><strong>Data da Profissão:</strong></td><td>${dados.dataProfissao}</td></tr>
          <tr><td><strong>Local da Celebração:</strong></td><td>${dados.localProfissao}</td></tr>
          <tr><td><strong>Superior que acolheu os votos:</strong></td><td>${dados.superiorRecebedor}</td></tr>
          <tr><td><strong>Registro Canônico:</strong></td><td>Livro: ${dados.livroRegistro} | Folha: ${dados.folhaRegistro} | Termo: ${dados.termoRegistro}</td></tr>
        </table>

        <p>O referido assento foi lavrado em conformidade com as Constituições dehonianas e a Regra de Vida da Congregação.</p>
        <p>Por ser verdade, dato e assino a presente certidão.</p>

        <p style="margin-top: 30px;">Chancelaria Provincial, Corupá/SC, ${dados.dataEmissao}.</p>
      </div>

      <div style="margin-top: 60px; display: flex; justify-content: center; text-align: center; font-size: 10pt; page-break-inside: avoid;">
        <div style="width: 50%; border-top: 1px solid #1e293b; padding-top: 8px;">
          <strong>${dados.secretarioNome || 'Pe. Secretário Provincial, scj'}</strong><br>
          Chanceler / Secretário Provincial
        </div>
      </div>
    `;

    const codigoAutenticidade = `BRM-VOT-${Date.now().toString(36).toUpperCase()}`;
    void registrarDocumentoOficial({
      codigo: codigoAutenticidade,
      tipo: 'Certidão de Votos Religiosos',
      titulo: `Certidão de Votos ${dados.tipoVotos} • ${dados.religiosoNome}`,
      identificador_oficial: dados.numeroRegistro,
      religioso_nome: dados.religiosoNome,
      comunidade_obra: dados.localProfissao,
      situacao: 'Regular / Assento Notarial Válido com Fé Pública'
    });

    return await this.gerarPdfDocumento({
      titulo: `CERTIDÃO DE VOTOS RELIGIOSOS ${dados.tipoVotos.toUpperCase()}`,
      subtitulo: 'Registro nos Arquivos Provinciais BRM',
      protocolo: dados.numeroRegistro,
      dataEmissao: dados.dataEmissao,
      corpoHtml: corpo,
      codigoAutenticidade,
      formatoPdfA: true
    });
  },

  /**
   * 5. Gera Carta Circular Oficial do Provincial
   */
  async gerarCircularPdf(dados: DadosCircularProvincial): Promise<Blob> {
    const corpo = `
      <div style="text-align: justify; margin: 25px 0; font-size: 11pt; line-height: 1.8;">
        <p style="font-weight: 600; margin-bottom: 20px; color: #113240;">
          ${dados.saudacao || 'Caríssimos Confrades, Paz e Bem no Coração de Jesus!'}
        </p>

        <div>${dados.corpoTexto}</div>

        <p style="margin-top: 35px;">Em comunhão de orações e no Coração de Jesus,</p>
        <p>Sede Provincial, Corupá/SC, ${dados.dataEmissao}.</p>
      </div>

      <div style="margin-top: 70px; display: flex; justify-content: center; text-align: center; font-size: 10pt; page-break-inside: avoid;">
        <div style="width: 50%; border-top: 1px solid #1e293b; padding-top: 8px;">
          <strong>${dados.provincialNome || 'Pe. Superior Provincial, scj'}</strong><br>
          Superior Provincial • Província BRM
        </div>
      </div>
    `;

    const codigoAutenticidade = `BRM-CIRC-${Date.now().toString(36).toUpperCase()}`;
    void registrarDocumentoOficial({
      codigo: codigoAutenticidade,
      tipo: 'Circular Provincial Oficial',
      titulo: `Circular Provincial Nº ${dados.numeroCircular} • ${dados.assunto}`,
      identificador_oficial: dados.numeroCircular,
      comunidade_obra: 'Província BRM',
      situacao: 'Publicação Oficial Autêntica'
    });

    return await this.gerarPdfDocumento({
      titulo: `CIRCULAR PROVINCIAL Nº ${dados.numeroCircular}`,
      subtitulo: dados.assunto,
      protocolo: dados.numeroCircular,
      dataEmissao: dados.dataEmissao,
      corpoHtml: corpo,
      codigoAutenticidade,
      formatoPdfA: true
    });
  },

  /**
   * 6. Gera a Ficha Cadastral Canônica Completa do Religioso (Dossiê com Trajetória e Trabalhos)
   */
  async gerarFichaReligiosoPdf(dados: DadosFichaReligioso): Promise<Blob> {
    const dataEmissao = dados.dataEmissao || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const nomeExibido = dados.nomeReligioso || dados.nomeCivil;
    const filiacaoTexto = [dados.filiacaoPai, dados.filiacaoMae].filter(Boolean).join(' e ') || '—';

    // Monta tabela de Onde já trabalhou e Funções
    const linhasTrabalhos = dados.historicoTrabalhos && dados.historicoTrabalhos.length > 0
      ? dados.historicoTrabalhos.map(t => `
        <tr>
          <td style="font-family: monospace; font-weight: bold; white-space: nowrap;">${t.periodo || '—'}</td>
          <td><strong>${t.instituicao}</strong></td>
          <td style="color: #113240; font-weight: 600;">${t.funcao || '—'}</td>
          <td>${t.local || '—'}</td>
          <td style="font-size: 8.5pt; color: #555;">${t.observacoes || '—'}</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td colspan="5" style="text-align: center; font-style: italic; color: #64748b; padding: 12px;">
            Nenhum histórico anterior registrado nos livros digitais da Província até o momento.
          </td>
        </tr>
      `;

    // Monta missões e serviços provinciais
    const linhasMissoes = dados.missoesServicos && dados.missoesServicos.length > 0
      ? `
        <div style="margin-top: 20px;">
          <p style="font-family: monospace; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.12em; font-weight: bold; color: #113240; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px;">
            05. Missões, Encargos & Serviços Confiados
          </p>
          <table>
            <thead>
              <tr>
                <th style="width: 18%;">Tipo</th>
                <th style="width: 32%;">Instituição / Comissão</th>
                <th style="width: 25%;">Função</th>
                <th style="width: 25%;">Período / Local</th>
              </tr>
            </thead>
            <tbody>
              ${dados.missoesServicos.map(m => `
                <tr>
                  <td><strong>${m.tipo || 'Missão'}</strong></td>
                  <td>${m.instituicao || '—'}</td>
                  <td>${m.funcao || '—'}</td>
                  <td>${[m.periodo, m.local].filter(Boolean).join(' • ') || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `
      : '';

    // Monta formação acadêmica
    const listaFormacoes = dados.formacoesAcademicas && dados.formacoesAcademicas.length > 0
      ? dados.formacoesAcademicas.map(f => `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 4px 0; font-size: 9pt;">
          <span><strong>${f.curso}</strong> — ${f.instituicao}</span>
          <span style="font-family: monospace; color: #64748b;">${f.anoOuPeriodo || ''}</span>
        </div>
      `).join('')
      : '<p style="font-style: italic; color: #64748b; font-size: 9pt;">Filosofia e Teologia nos centros formativos da Congregação.</p>';

    const corpo = `
      <!-- Cabeçalho Oficial no topo da Página 1 -->
      <div style="text-align: center; border-bottom: 1.5pt solid #113240; padding-bottom: 6px; margin-bottom: 12px; position: relative;">
        <span style="position: absolute; top: 0; right: 0; font-size: 6.5pt; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; font-family: monospace;">Secretaria Provincial</span>
        <img src="${LOGO_TIMBRADO_DATA_URI}" style="height: 44px; width: auto; margin: 0 auto 3px auto; display: block; object-fit: contain;" alt="Brasão Dehoniano" />
        <h1 style="font-size: 9.5pt; font-weight: normal; color: #113240; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; line-height: 1.2;">CONGREGAÇÃO DOS SACERDOTES DO SAGRADO CORAÇÃO DE JESUS</h1>
        <h2 style="font-size: 11pt; font-weight: bold; color: #113240; margin: 1px 0 0 0; line-height: 1.2;">Província Brasileira Meridional</h2>
        <div style="font-size: 11.5pt; font-weight: bold; color: #113240; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.05em;">FICHA CADASTRAL CANÔNICA DO RELIGIOSO</div>
        <div style="font-size: 7.5pt; color: #64748b; font-family: monospace; margin-top: 1px;">Dossiê Canônico Completo • ${nomeExibido}</div>
      </div>

      <!-- Identificação Principal & Foto Oficial -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5pt solid #113240; padding-bottom: 12px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          ${dados.fotoUrl ? `
            <div style="width: 75px; height: 95px; border: 1.5pt solid #113240; overflow: hidden; background: #f8fafc; flex-shrink: 0;">
              <img src="${dados.fotoUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="Foto Oficial" />
            </div>
          ` : `
            <div style="width: 75px; height: 95px; border: 1.5pt dashed #94a3b8; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc; font-family: monospace; font-size: 7pt; color: #64748b; text-align: center; flex-shrink: 0;">
              <span>FOTO OFICIAL</span>
              <strong style="color: #113240; font-size: 8pt;">4x4</strong>
            </div>
          `}
          <div>
            <div style="font-family: monospace; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.15em; color: #226380; font-weight: bold;">
              ${dados.grau || 'Confrade'} Dehoniano • Província BRM
            </div>
            <h2 style="font-size: 17pt; font-weight: bold; margin: 2px 0; color: #113240; letter-spacing: -0.01em;">
              ${nomeExibido}
            </h2>
            <div style="font-size: 9pt; color: #475569;">
              Nome Civil: <strong>${dados.nomeCivil}</strong>
            </div>
            <div style="font-size: 8.5pt; color: #475569; margin-top: 2px;">
              Comunidade Atual: <strong style="color: #113240;">${dados.comunidadeAtualNome || 'Província BRM'}</strong>
              ${dados.oficioAtual ? ` • Ofício: <em>${dados.oficioAtual}</em>` : ''}
            </div>
          </div>
        </div>

        <div style="text-align: right;">
          <div style="display: inline-block; border: 1.5pt solid #113240; padding: 4px 10px; font-family: monospace; font-size: 8pt; font-weight: bold; text-transform: uppercase; background: #f8fafc;">
            CADASTRO ${dados.statusCadastro || 'APROVADO'}
          </div>
          <div style="font-family: monospace; font-size: 8.5pt; color: #64748b; margin-top: 4px;">
            Nº Registro: <strong>${dados.numeroCadastro ? 'BRM-' + String(dados.numeroCadastro).padStart(4, '0') : 'BRM-2026'}</strong>
          </div>
        </div>
      </div>

      <!-- Grid de Indicadores Canônicos Rápidos -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); border: 1pt solid #cbd5e1; background: #f8fafc; text-align: center; margin-bottom: 16px;">
        <div style="padding: 6px 8px; border-right: 1pt solid #cbd5e1;">
          <div style="font-family: monospace; font-size: 6.5pt; text-transform: uppercase; color: #64748b;">Grau Canônico</div>
          <div style="font-size: 9.5pt; font-weight: bold; color: #113240; margin-top: 2px;">${dados.grau || 'Padre'}</div>
        </div>
        <div style="padding: 6px 8px; border-right: 1pt solid #cbd5e1;">
          <div style="font-family: monospace; font-size: 6.5pt; text-transform: uppercase; color: #64748b;">Ingresso na SCJ</div>
          <div style="font-size: 9.5pt; font-weight: bold; color: #113240; margin-top: 2px;">${dados.dataIngresso ? dados.dataIngresso.slice(0, 4) : '—'}</div>
        </div>
        <div style="padding: 6px 8px; border-right: 1pt solid #cbd5e1;">
          <div style="font-family: monospace; font-size: 6.5pt; text-transform: uppercase; color: #64748b;">Votos Perpétuos</div>
          <div style="font-size: 9.5pt; font-weight: bold; color: #113240; margin-top: 2px;">${dados.dataVotosPerpetuos || '—'}</div>
        </div>
        <div style="padding: 6px 8px;">
          <div style="font-family: monospace; font-size: 6.5pt; text-transform: uppercase; color: #64748b;">Ordenação</div>
          <div style="font-size: 9.5pt; font-weight: bold; color: #113240; margin-top: 2px;">${dados.dataPresbiterato || dados.dataDiaconato || '—'}</div>
        </div>
      </div>

      <!-- 01. Dados Pessoais & Documentação Civil -->
      <div style="margin-bottom: 14px;">
        <p style="font-family: monospace; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.12em; font-weight: bold; color: #113240; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px;">
          01. Dados Pessoais & Documentação Civil
        </p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 14px; font-size: 8.5pt;">
          <div><span style="font-family: monospace; font-size: 6.5pt; text-transform: uppercase; color: #64748b; display: block;">Data de Nascimento</span><strong>${dados.dataNascimento || '—'}</strong></div>
          <div><span style="font-family: monospace; font-size: 6.5pt; text-transform: uppercase; color: #64748b; display: block;">Naturalidade</span><strong>${dados.naturalidade || '—'}</strong></div>
          <div><span style="font-family: monospace; font-size: 6.5pt; text-transform: uppercase; color: #64748b; display: block;">Nacionalidade</span><strong>${dados.nacionalidade || 'Brasileira'}</strong></div>
          <div><span style="font-family: monospace; font-size: 6.5pt; text-transform: uppercase; color: #64748b; display: block;">CPF</span><strong style="font-family: monospace;">${dados.cpf || '—'}</strong></div>
          <div><span style="font-family: monospace; font-size: 6.5pt; text-transform: uppercase; color: #64748b; display: block;">RG / Órgão</span><strong style="font-family: monospace;">${dados.rg || '—'} ${dados.rgOrgao ? `(${dados.rgOrgao})` : ''}</strong></div>
          <div><span style="font-family: monospace; font-size: 6.5pt; text-transform: uppercase; color: #64748b; display: block;">Título de Eleitor / PIS</span><strong style="font-family: monospace;">${[dados.tituloEleitor, dados.pis].filter(Boolean).join(' • ') || '—'}</strong></div>
          <div style="grid-column: span 3;"><span style="font-family: monospace; font-size: 6.5pt; text-transform: uppercase; color: #64748b; display: block;">Filiação (Pai e Mãe)</span><strong>${filiacaoTexto}</strong></div>
        </div>
      </div>

      <!-- 02. Contatos, Residência & Saúde -->
      <div style="margin-bottom: 14px;">
        <p style="font-family: monospace; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.12em; font-weight: bold; color: #113240; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px;">
          02. Contatos, Residência Canônica & Saúde
        </p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 14px; font-size: 8.5pt;">
          <div><span style="font-family: monospace; font-size: 6.5pt; text-transform: uppercase; color: #64748b; display: block;">Telefones</span><strong>${[dados.telefoneCelular, dados.whatsapp && dados.whatsapp !== dados.telefoneCelular ? `Zap: ${dados.whatsapp}` : null].filter(Boolean).join(' • ') || '—'}</strong></div>
          <div><span style="font-family: monospace; font-size: 6.5pt; text-transform: uppercase; color: #64748b; display: block;">E-mail Institucional</span><strong style="font-family: monospace;">${dados.emailInstitucional || '—'}</strong></div>
          <div><span style="font-family: monospace; font-size: 6.5pt; text-transform: uppercase; color: #64748b; display: block;">Tipo Sanguíneo / Plano</span><strong>${[dados.tipoSanguineo, dados.planoSaude].filter(Boolean).join(' • ') || '—'}</strong></div>
          <div style="grid-column: span 2;"><span style="font-family: monospace; font-size: 6.5pt; text-transform: uppercase; color: #64748b; display: block;">Endereço Residencial</span><strong>${dados.enderecoResidencial || dados.comunidadeAtualNome || 'Sede Provincial BRM'}</strong></div>
          <div><span style="font-family: monospace; font-size: 6.5pt; text-transform: uppercase; color: #64748b; display: block;">Contato de Emergência</span><strong>${dados.contatoEmergencia || '—'}</strong></div>
        </div>
      </div>

      <!-- 03. Trajetória Canônica (Linha do Tempo) -->
      <div style="margin-bottom: 16px;">
        <p style="font-family: monospace; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.12em; font-weight: bold; color: #113240; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 8px;">
          03. Trajetória Canônica & Sacramentos
        </p>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; text-align: center;">
          <div style="border: 1pt solid #cbd5e1; padding: 6px; background: #fff;">
            <div style="font-family: monospace; font-size: 6.5pt; font-weight: bold; text-transform: uppercase; color: #64748b;">Batismo</div>
            <div style="font-size: 8pt; font-weight: bold; margin-top: 2px;">${dados.dataBatismo || '—'}</div>
            <div style="font-size: 6.5pt; color: #64748b; margin-top: 1px;">${dados.paroquiaBatismo || '—'}</div>
          </div>
          <div style="border: 1pt solid #cbd5e1; padding: 6px; background: #fff;">
            <div style="font-family: monospace; font-size: 6.5pt; font-weight: bold; text-transform: uppercase; color: #64748b;">Primeira Profissão</div>
            <div style="font-size: 8pt; font-weight: bold; margin-top: 2px;">${dados.dataPrimeirosVotos || '—'}</div>
            <div style="font-size: 6.5pt; color: #64748b; margin-top: 1px;">${dados.localPrimeirosVotos || '—'}</div>
          </div>
          <div style="border: 1pt solid #cbd5e1; padding: 6px; background: #fff;">
            <div style="font-family: monospace; font-size: 6.5pt; font-weight: bold; text-transform: uppercase; color: #64748b;">Profissão Perpétua</div>
            <div style="font-size: 8pt; font-weight: bold; margin-top: 2px;">${dados.dataVotosPerpetuos || '—'}</div>
            <div style="font-size: 6.5pt; color: #64748b; margin-top: 1px;">${dados.localVotosPerpetuos || '—'}</div>
          </div>
          <div style="border: 1pt solid #cbd5e1; padding: 6px; background: #fff;">
            <div style="font-family: monospace; font-size: 6.5pt; font-weight: bold; text-transform: uppercase; color: #64748b;">Ordenação Presbiteral</div>
            <div style="font-size: 8pt; font-weight: bold; margin-top: 2px;">${dados.dataPresbiterato || dados.dataDiaconato || '—'}</div>
            <div style="font-size: 6.5pt; color: #64748b; margin-top: 1px;">${dados.bispoOrdenante || dados.localPresbiterato || '—'}</div>
          </div>
        </div>
      </div>

      <!-- 04. Trajetória de Comunidades e Trabalhos (Onde já trabalhou e Funções) -->
      <div style="margin-bottom: 16px; page-break-inside: auto;">
        <p style="font-family: monospace; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.12em; font-weight: bold; color: #113240; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px;">
          04. Trajetória de Comunidades e Trabalhos (Onde Trabalhou • Ofícios e Cargos)
        </p>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Período</th>
              <th style="width: 30%;">Comunidade / Paróquia / Casa</th>
              <th style="width: 25%;">Ofício / Função</th>
              <th style="width: 15%;">Localidade</th>
              <th style="width: 15%;">Notas</th>
            </tr>
          </thead>
          <tbody>
            ${linhasTrabalhos}
          </tbody>
        </table>
      </div>

      ${linhasMissoes}

      <!-- 05/06. Formação Acadêmica & Idiomas -->
      <div style="margin-top: 14px; margin-bottom: 24px; display: grid; grid-template-columns: 2fr 1fr; gap: 14px;">
        <div>
          <p style="font-family: monospace; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.12em; font-weight: bold; color: #113240; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px;">
            Formação Acadêmica & Graus
          </p>
          ${listaFormacoes}
        </div>
        <div>
          <p style="font-family: monospace; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.12em; font-weight: bold; color: #113240; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px;">
            Idiomas
          </p>
          <div style="font-size: 8.5pt; color: #334155; line-height: 1.6;">
            ${dados.idiomas && dados.idiomas.length > 0 ? dados.idiomas.map(i => `<span style="display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 6px; margin: 2px; border-radius: 3px;">${i}</span>`).join('') : 'Português (nativo)'}
          </div>
        </div>
      </div>

      <!-- Assinaturas Canônicas -->
      <div style="margin-top: 45px; display: flex; justify-content: space-around; text-align: center; font-size: 9pt; page-break-inside: avoid;">
        <div style="width: 42%; border-top: 1px solid #113240; padding-top: 6px;">
          <strong>${nomeExibido}</strong><br>
          <span style="font-size: 7.5pt; color: #64748b;">Assinatura do Religioso</span>
        </div>
        <div style="width: 42%; border-top: 1px solid #113240; padding-top: 6px;">
          <strong>Chancelaria Provincial • Província BRM</strong><br>
          <span style="font-size: 7.5pt; color: #64748b;">Arquivo Canônico & Secretaria</span>
        </div>
      </div>
    `;

    const codigoAutenticidade = `BRM-FICH-${Date.now().toString(36).toUpperCase()}`;

    // Registra no sistema central de conferência pública e fé pública notarial
    void registrarDocumentoOficial({
      codigo: codigoAutenticidade,
      tipo: 'Ficha Cadastral Canônica do Religioso',
      titulo: `Ficha Cadastral Canônica • ${nomeExibido}`,
      identificador_oficial: dados.numeroCadastro ? `BRM-${String(dados.numeroCadastro).padStart(4, '0')}` : undefined,
      comunidade_obra: dados.comunidadeAtualNome || 'Província BRM',
      religioso_nome: nomeExibido,
      situacao: `Regular / Cadastro ${dados.statusCadastro || 'Aprovado'}`
    });

    return await this.gerarPdfDocumento({
      titulo: 'FICHA CADASTRAL CANÔNICA DO RELIGIOSO',
      subtitulo: `Dossiê Canônico Completo • ${nomeExibido}`,
      protocolo: dados.numeroCadastro ? `BRM-${String(dados.numeroCadastro).padStart(4, '0')}` : undefined,
      dataEmissao,
      corpoHtml: corpo,
      codigoAutenticidade,
      formatoPdfA: true,
      omitirTituloPadrao: true,
      cabecalhoCompacto: true
    });
  },

  /**
   * Baixa qualquer Blob de PDF no navegador.
   */
  baixarBlob(blob: Blob, nomeArquivo: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
};

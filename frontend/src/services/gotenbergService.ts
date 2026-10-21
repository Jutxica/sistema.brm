/**
 * gotenbergService.ts
 * Cliente completo para o microserviço Gotenberg (instalado via Template no Easypanel).
 * Gera PDFs de alta fidelidade para Decretos, Portarias, Celebret (Idoneidade),
 * Certidões Sacramentais, Votos Religiosos e Ofícios Canônicos no Papel Timbrado Oficial BRM.
 */

export interface OpcoesDocumentoGotenberg {
  titulo: string;
  subtitulo?: string;
  protocolo?: string;
  dataEmissao?: string;
  corpoHtml: string;
  orientacao?: 'portrait' | 'landscape';
  codigoAutenticidade?: string;
  formatoPdfA?: boolean;
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
   * Constrói o HTML do Cabeçalho Oficial do Papel Timbrado BRM.
   */
  gerarCabecalhoHtml(tituloDoc?: string, protocolo?: string, dataEmissao?: string): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0;
    padding: 0 40px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-print-color-adjust: exact;
  }
  .header-container {
    text-align: center;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 12px;
    position: relative;
  }
  .system-label {
    position: absolute;
    top: 0;
    right: 0;
    font-size: 7pt;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .congregacao {
    font-size: 11pt;
    font-weight: 500;
    color: #113240;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }
  .provincia {
    font-size: 13pt;
    font-weight: 700;
    color: #113240;
    margin: 3px 0 0 0;
  }
  .meta {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: #64748b;
    font-family: monospace;
  }
</style>
</head>
<body>
  <div class="header-container">
    <span class="system-label">Secretaria Provincial</span>
    <h1 class="congregacao">CONGREGAÇÃO DOS SACERDOTES DO SAGRADO CORAÇÃO DE JESUS</h1>
    <h2 class="provincia">Província Brasileira Meridional</h2>
    ${protocolo || dataEmissao ? `
    <div class="meta">
      <span>${tituloDoc ? '<strong>' + tituloDoc + '</strong>' : ''}</span>
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
  body {
    margin: 0;
    padding: 0 40px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-print-color-adjust: exact;
  }
  .footer-container {
    text-align: center;
    border-top: 1px solid #94a3b8;
    padding-top: 8px;
    font-size: 8pt;
    color: #475569;
    line-height: 1.4;
    position: relative;
  }
  .page-number {
    position: absolute;
    right: 0;
    top: 8px;
    font-size: 7.5pt;
    color: #94a3b8;
    font-family: monospace;
  }
</style>
</head>
<body>
  <div class="footer-container">
    <div>Rua Padre Gabriel Lux, 900 – Caixa Postal 21 – Corupá/SC | CEP 89278-000</div>
    <div>Telefone: +55 (47) 3375-1194 | E-mail: secretaria@brm.org.br | Site: scj.org.br</div>
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
    @page {
      margin: 110px 40px 80px 40px;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #1e293b;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
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
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: left;
      font-size: 10pt;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: #0f172a;
    }
  </style>
</head>
<body>
  ${opcoes.titulo ? `<div class="doc-titulo">${opcoes.titulo}</div>` : ''}
  ${opcoes.subtitulo ? `<div class="doc-subtitulo">${opcoes.subtitulo}</div>` : ''}

  <div class="doc-conteudo">
    ${opcoes.corpoHtml}
  </div>

  ${opcoes.codigoAutenticidade ? `
  <div class="selo-autenticidade">
    <div>
      <strong>Documento Canônico Autenticado Digitalmente</strong><br>
      Código de Validação: <code>${opcoes.codigoAutenticidade}</code><br>
      Verificação disponível no Portal BRM: <em>https://sistema.brm.org.br/validar/${opcoes.codigoAutenticidade}</em>
    </div>
  </div>` : ''}
</body>
</html>`;

    const headerHtml = this.gerarCabecalhoHtml(opcoes.titulo, opcoes.protocolo, opcoes.dataEmissao);
    const footerHtml = this.gerarRodapeHtml();

    const formData = new FormData();
    formData.append('files', new Blob([indexHtml], { type: 'text/html' }), 'index.html');
    formData.append('files', new Blob([headerHtml], { type: 'text/html' }), 'header.html');
    formData.append('files', new Blob([footerHtml], { type: 'text/html' }), 'footer.html');

    // Margens e configurações do Chromium
    formData.append('marginTop', '1.4');
    formData.append('marginBottom', '1.1');
    formData.append('marginLeft', '0.8');
    formData.append('marginRight', '0.8');
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

      <div style="margin-top: 70px; display: flex; justify-content: space-around; text-align: center; font-size: 10pt;">
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

    return await this.gerarPdfDocumento({
      titulo: `DECRETO PROVINCIAL Nº ${dados.numeroDecreto}`,
      subtitulo: `Provisão Canônica • ${dados.assunto}`,
      protocolo: dados.numeroDecreto,
      dataEmissao: dados.dataEmissao,
      corpoHtml: corpo,
      codigoAutenticidade: `BRM-DEC-${Date.now().toString(36).toUpperCase()}`,
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

      <div style="margin-top: 70px; display: flex; justify-content: space-around; text-align: center; font-size: 10pt;">
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

    return await this.gerarPdfDocumento({
      titulo: `PORTARIA PROVINCIAL Nº ${dados.numeroPortaria}`,
      subtitulo: dados.assunto,
      protocolo: dados.numeroPortaria,
      dataEmissao: dados.dataEmissao,
      corpoHtml: corpo,
      codigoAutenticidade: `BRM-PORT-${Date.now().toString(36).toUpperCase()}`,
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

      <div style="margin-top: 60px; display: flex; justify-content: center; text-align: center; font-size: 10pt;">
        <div style="width: 50%; border-top: 1px solid #1e293b; padding-top: 8px;">
          <strong>${dados.provincialNome || 'Pe. Superior Provincial, scj'}</strong><br>
          Superior Provincial • Província BRM
        </div>
      </div>
    `;

    return await this.gerarPdfDocumento({
      titulo: 'CERTIDÃO DE USO DE ORDENS SAGRADAS',
      subtitulo: 'Celebret Canônico • Província Brasil Meridional',
      protocolo: dados.numeroCertidao,
      dataEmissao: dados.dataEmissao,
      corpoHtml: corpo,
      codigoAutenticidade: `BRM-CEL-${Date.now().toString(36).toUpperCase()}`,
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

      <div style="margin-top: 60px; display: flex; justify-content: center; text-align: center; font-size: 10pt;">
        <div style="width: 50%; border-top: 1px solid #1e293b; padding-top: 8px;">
          <strong>${dados.secretarioNome || 'Pe. Secretário Provincial, scj'}</strong><br>
          Chanceler / Secretário Provincial
        </div>
      </div>
    `;

    return await this.gerarPdfDocumento({
      titulo: `CERTIDÃO DE VOTOS RELIGIOSOS ${dados.tipoVotos.toUpperCase()}`,
      subtitulo: 'Registro nos Arquivos Provinciais BRM',
      protocolo: dados.numeroRegistro,
      dataEmissao: dados.dataEmissao,
      corpoHtml: corpo,
      codigoAutenticidade: `BRM-VOT-${Date.now().toString(36).toUpperCase()}`,
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

      <div style="margin-top: 70px; display: flex; justify-content: center; text-align: center; font-size: 10pt;">
        <div style="width: 50%; border-top: 1px solid #1e293b; padding-top: 8px;">
          <strong>${dados.provincialNome || 'Pe. Superior Provincial, scj'}</strong><br>
          Superior Provincial • Província BRM
        </div>
      </div>
    `;

    return await this.gerarPdfDocumento({
      titulo: `CIRCULAR PROVINCIAL Nº ${dados.numeroCircular}`,
      subtitulo: dados.assunto,
      protocolo: dados.numeroCircular,
      dataEmissao: dados.dataEmissao,
      corpoHtml: corpo,
      codigoAutenticidade: `BRM-CIRC-${Date.now().toString(36).toUpperCase()}`,
      formatoPdfA: true
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

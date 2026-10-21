/**
 * gotenbergService.ts
 * Cliente para o microserviço Gotenberg (instalado via Template no Easypanel).
 * Gera PDFs de alta fidelidade para Decretos, Certidões Sacramentais,
 * Dossiês de Religiosos e Fichas de Inscrição com Papel Timbrado Oficial da Província BRM.
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
  numeroDecreto: string; // Ex: DEC-BRM 014/2026
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
    // URL padrão sugerida no Easypanel
    return 'https://pdf.brm.org.br';
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
    const url = this.obterUrlBase();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${url}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        return { online: true, mensagem: `Gotenberg conectado com sucesso em ${url}` };
      }
      return { online: false, mensagem: `Gotenberg respondeu com status ${res.status}` };
    } catch (err) {
      return {
        online: false,
        mensagem: `Não foi possível conectar ao Gotenberg (${url}). Verifique se o template está rodando no Easypanel.`
      };
    }
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
    const url = this.obterUrlBase();
    const endpoint = `${url}/forms/chromium/convert/html`;

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
      line-height: 1.6;
      color: #1e293b;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
    }
    h1, h2, h3 { color: #113240; }
    .doc-titulo {
      font-size: 16pt;
      font-weight: bold;
      text-align: center;
      margin: 20px 0 10px 0;
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
      margin-top: 30px;
      padding: 12px;
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
      padding: 8px;
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
      Verificação disponível em: <em>https://sistema.brm.org.br/validar/${opcoes.codigoAutenticidade}</em>
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

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const erroTexto = await response.text().catch(() => '');
      throw new Error(`Erro Gotenberg (${response.status}): ${erroTexto || response.statusText}`);
    }

    return await response.blob();
  },

  /**
   * Gera o PDF oficial de um Decreto Canônico da Província BRM.
   */
  async gerarDecretoPdf(dados: DadosDecretoProvincial): Promise<Blob> {
    const corpoDecreto = `
      <div style="text-align: justify; margin: 30px 0; font-size: 11pt; line-height: 1.8;">
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
      corpoHtml: corpoDecreto,
      codigoAutenticidade: `BRM-DEC-${Date.now().toString(36).toUpperCase()}`,
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

export interface DadosCnpj {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  situacaoCadastral?: string;
  telefone?: string;
  email?: string;
  municipio?: string;
  uf?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
}

export const cnpjService = {
  /**
   * Remove caracteres não numéricos do CNPJ.
   */
  sanitizarCnpj(cnpj: string): string {
    return (cnpj || '').replace(/\D/g, '');
  },

  /**
   * Formata CNPJ (00.000.000/0000-00).
   */
  formatarCnpj(cnpj: string): string {
    const limpo = this.sanitizarCnpj(cnpj);
    if (limpo.length !== 14) return cnpj;
    return limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  },

  /**
   * Consulta dados do CNPJ via BrasilAPI com fallback.
   */
  async consultarCnpj(cnpj: string): Promise<DadosCnpj | null> {
    const limpo = this.sanitizarCnpj(cnpj);
    if (limpo.length !== 14) {
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      // 1. Tenta BrasilAPI
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${limpo}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          cnpj: this.formatarCnpj(limpo),
          razaoSocial: data.razao_social || data.nome_fantasia || '',
          nomeFantasia: data.nome_fantasia || '',
          situacaoCadastral: data.descricao_situacao_cadastral || 'Ativa',
          telefone: data.ddd_telefone_1 || '',
          email: data.email || '',
          municipio: data.municipio || '',
          uf: data.uf || '',
          logradouro: data.logradouro || '',
          numero: data.numero || '',
          bairro: data.bairro || '',
          cep: data.cep || ''
        };
      }
    } catch (err) {
      console.warn('BrasilAPI CNPJ indisponível; preenchimento manual liberado:', err);
    }

    return null;
  }
};

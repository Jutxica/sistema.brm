export interface EnderecoViaCep {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  ddd?: string;
}

export const cepService = {
  /**
   * Sanitiza a string de CEP removendo caracteres não numéricos.
   */
  sanitizarCep(cep: string): string {
    return (cep || '').replace(/\D/g, '');
  },

  /**
   * Formata CEP no padrão brasileiro (00000-000).
   */
  formatarCep(cep: string): string {
    const limpo = this.sanitizarCep(cep);
    if (limpo.length <= 5) return limpo;
    return `${limpo.slice(0, 5)}-${limpo.slice(5, 8)}`;
  },

  /**
   * Consulta o CEP no ViaCEP com timeout resiliente.
   * Não trava o formulário em caso de erro; retorna null para preenchimento manual.
   */
  async consultarCep(cep: string): Promise<EnderecoViaCep | null> {
    const limpo = this.sanitizarCep(cep);
    if (limpo.length !== 8) {
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    try {
      const response = await fetch(`https://viacep.com.br/ws/${limpo}/json/`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.erro) {
        return null;
      }

      return {
        cep: data.cep || this.formatarCep(limpo),
        logradouro: data.logradouro || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        localidade: data.localidade || '',
        uf: data.uf || '',
        ibge: data.ibge,
        ddd: data.ddd
      };
    } catch (err) {
      console.warn('ViaCEP indisponível ou tempo esgotado; liberando preenchimento manual:', err);
      return null;
    }
  }
};

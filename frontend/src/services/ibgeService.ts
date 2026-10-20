/**
 * ibgeService.ts
 * Serviço de consulta de localidades (Estados e Municípios) da API do IBGE.
 * Padroniza os campos de naturalidade e diocese nos cadastros dos religiosos.
 */

export interface EstadoIBGE {
  id: number;
  sigla: string;
  nome: string;
}

export interface MunicipioIBGE {
  id: number;
  nome: string;
}

export const ibgeService = {
  /**
   * Obtém a lista de estados brasileiros.
   */
  async listarEstados(): Promise<EstadoIBGE[]> {
    try {
      const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.warn('Erro ao listar estados no IBGE:', err);
      return [];
    }
  },

  /**
   * Obtém os municípios de um determinado estado (UF, ex: "SC", "PR", "SP").
   */
  async listarMunicipiosPorUF(uf: string): Promise<MunicipioIBGE[]> {
    if (!uf) return [];
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.warn(`Erro ao listar municípios de ${uf} no IBGE:`, err);
      return [];
    }
  }
};

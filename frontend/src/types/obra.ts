// Tipos Centralizados do Módulo de Obras, Paróquias e Comunidades da Província BRM

export type TipoVinculo = 'residencia' | 'juridico' | 'pastoral' | 'funcao' | 'estudos' | 'missao' | 'outro';
export type Destino = 'comunidade' | 'obra';

export interface Comunidade {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
  regiao: string | null;
  status: string;
}

export interface Obra {
  id: string;
  nome: string;
  tipo: string;
  localidade: string | null;
  cidade?: string | null;
  estado?: string | null;
  uf: string | null;
  pais?: string;
  endereco: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  diocese: string | null;
  fundacao: string | null;
  assumida_pelos_dehonianos: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  site: string | null;
  status: string;
  pertencimento_elenco?: string;
  comunidade_id?: string | null;
  token_edicao?: string | null;
  historia?: string | null;
  resumo_historico?: string | null;
  fotos?: any[] | null;
  status_historia?: string | null;
  data_envio_historia?: string | null;
}

export interface CasaAcolhida {
  id: string;
  nome: string;
  tipo?: string;
  cidade?: string;
  localidade?: string;
  uf?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  site?: string;
}

export interface Designacao {
  id: string;
  religioso_id: string;
  comunidade_id: string | null;
  obra_id: string | null;
  tipo_vinculo: TipoVinculo;
  funcao: string;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  ano_referencia: number;
}

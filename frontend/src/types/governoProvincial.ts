// Tipos do Governo Provincial da Província BRM (Dehonianos)

export type CargoGoverno =
  | 'Superior Provincial'
  | 'Secretário Provincial'
  | 'Ecônomo Provincial'
  | '1º Conselheiro'
  | '2º Conselheiro'
  | '3º Conselheiro'
  | '4º Conselheiro'
  | 'Vice-Provincial'
  | 'Vice-Ecônomo Provincial'
  | 'Conselheiro Provincial';

export type StatusMembroGoverno = 'Vigente' | 'Concluído' | 'Renúncia' | 'Interino';

export interface ReligiosoFichaGov {
  id: string;
  numero_cadastro?: number;
  nome_civil: string | null;
  nome_religioso: string | null;
  nome_elenco?: string | null;
  grau: string;
  cpf?: string | null;
  data_nascimento?: string | null;
  comunidade_atual_id?: string | null;
  comunidade_atual_nome?: string | null;
  obra_atual_id?: string | null;
  obra_atual_nome?: string | null;
  email_institucional?: string | null;
  email_pessoal?: string | null;
  telefone_celular?: string | null;
  whatsapp?: string | null;
  foto_path?: string | null;
  foto_url?: string | null;
}

export interface MembroGovernoProvincial {
  id: string;
  religioso_id: string;
  cargo: CargoGoverno;
  ordem_precedencia: number;
  trienio: string;
  data_posse?: string | null;
  data_termino?: string | null;
  status: StatusMembroGoverno;
  tipo_ato?: string | null;
  numero_ato_decreto?: string | null;
  data_ato_decreto?: string | null;
  areas_responsabilidade?: string | null;
  email_institucional_governo?: string | null;
  telefone_institucional_governo?: string | null;
  documento_ato_url?: string | null;
  observacoes?: string | null;
  sincronizar_elenco?: boolean;
  criado_por?: string | null;
  created_at?: string;
  updated_at?: string;

  // Objeto do religioso carregado da ficha
  religioso?: ReligiosoFichaGov | null;
}

export const CARGOS_GOVERNO_PADRAO: Array<{
  cargo: CargoGoverno;
  ordem: number;
  descricao: string;
  categoria: 'Liderança' | 'Conselho' | 'Cúria';
}> = [
  { cargo: 'Superior Provincial', ordem: 1, descricao: 'Superior Maior e Ordinário da Província', categoria: 'Liderança' },
  { cargo: '1º Conselheiro', ordem: 2, descricao: '1º Conselheiro Provincial (Vigário Provincial)', categoria: 'Conselho' },
  { cargo: '2º Conselheiro', ordem: 3, descricao: '2º Conselheiro Provincial', categoria: 'Conselho' },
  { cargo: '3º Conselheiro', ordem: 4, descricao: '3º Conselheiro Provincial', categoria: 'Conselho' },
  { cargo: '4º Conselheiro', ordem: 5, descricao: '4º Conselheiro Provincial', categoria: 'Conselho' },
  { cargo: 'Secretário Provincial', ordem: 6, descricao: 'Chancelaria, Atos Oficiais e Comunicações', categoria: 'Cúria' },
  { cargo: 'Ecônomo Provincial', ordem: 7, descricao: 'Administração Financeira e Patrimonial', categoria: 'Cúria' },
];

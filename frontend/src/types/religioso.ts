// Tipos Centralizados do Módulo de Religiosos e Cadastro Canônico da Província BRM

export type SituacaoElenco = 
  | 'ativo' 
  | 'estudos' 
  | 'missao' 
  | 'saude' 
  | 'ano_sabatico' 
  | 'afastado' 
  | 'exclaustrado' 
  | 'falecido' 
  | 'transferido'
  | 'em_formacao'
  | string;

export interface Religioso {
  id: string;
  nome_civil: string | null;
  nome_religioso: string | null;
  nome_elenco: string | null;
  cadastro_elenco_provisorio?: boolean;
  auth_user_id: string | null;
  grau: string;
  status: string;
  situacao_elenco?: SituacaoElenco;
}

export interface RawReligioso {
  id: string;
  grau: string;
  nome_civil: string;
  nome_religioso: string | null;
  data_nascimento: string | null;
  comunidade_atual_nome: string | null;
  obra_atual_id: string | null;
  status: string;
  status_cadastro: string;
  estado_nascimento: string | null;
  municipio_nascimento: string | null;
  created_at: string;
}

export interface ReligiosoResumo {
  id: string;
  numero_cadastro: number;
  nome_civil: string | null;
  nome_religioso: string | null;
  nome_elenco: string | null;
  cadastro_elenco_provisorio: boolean;
  grau: string | null;
  status: string;
  status_cadastro: string;
  origem_cadastro: string;
  email_institucional: string | null;
  telefone_celular: string | null;
  foto_path?: string | null;
  publicado_site_em?: string | null;
  publicado_site_id?: string | null;
  has_documents?: boolean;
  created_at: string;
  auth_user_id: string | null;
}

export interface ReligiosoPortalData {
  id?: string;
  nome_civil?: string | null;
  nome_religioso?: string | null;
  grau?: string | null;
  status_cadastro?: string | null;
  situacao_elenco?: string | null;
  comunidade_atual_nome?: string | null;
  email_institucional?: string | null;
  telefone_whatsapp?: string | null;
  telefone_celular?: string | null;
  cpf?: string | null;
  data_nascimento?: string | null;
  cargo_funcao?: string | null;
  foto_path?: string | null;
  foto_url?: string | null;
}

export interface ReligiosoDossieData {
  id: string;
  numero_cadastro: number;
  nome_civil: string;
  nome_religioso: string | null;
  grau: string | null;
  data_nascimento: string | null;
  cpf: string | null;
  email_institucional: string | null;
  telefone_celular: string | null;
  status: string;
  status_cadastro: string;
  origem_cadastro: string | null;
  municipio_nascimento?: string | null;
  estado_nascimento?: string | null;
  pais_nascimento?: string | null;
  nacionalidade?: string | null;
  comunidade_atual_nome?: string | null;
  obra_atual_id?: string | null;
  familiares_pai?: string | null;
  familiares_mae?: string | null;
  pai_nome?: string | null;
  mae_nome?: string | null;
  rg?: string | null;
  rg_orgao_expedidor?: string | null;
  rg_data_emissao?: string | null;
  titulo_eleitor?: string | null;
  pis?: string | null;
  cnh?: string | null;
  cnh_categoria?: string | null;
  passaporte?: string | null;
  whatsapp?: string | null;
  email_pessoal?: string | null;
  foto_path?: string | null;
  publicado_site_em?: string | null;
  publicado_site_id?: string | null;
  publicado_site_status?: string | null;
  auth_user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface RawOrdem {
  id: string;
  religioso_id: string;
  tipo?: string;
  ministerio?: string;
  data: string | null;
}

export interface RawVoto {
  id: string;
  religioso_id: string;
  tipo?: string;
  voto_tipo?: string;
  data: string | null;
}

export interface ContaAcesso {
  id: string;
  email: string | null;
  created_at?: string | null;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  banned_until: string | null;
  linked_religioso_id?: string | null;
  linked_religioso_nome?: string | null;
  ledger?: {
    origin: string | null;
    created_by?: string | null;
    created_by_name: string | null;
    created_at: string | null;
    state?: string | null;
  } | null;
}

export interface EventoFicha {
  id: string;
  religioso_id: string;
  religioso_nome: string;
  status_anterior: string | null;
  status_novo: string;
  ator_nome: string;
  observacao: string | null;
  criado_em: string;
}

export interface DocumentoFicha {
  id: string;
  categoria: string;
  titulo?: string;
  nome_arquivo: string;
  caminho_storage: string;
  mime_type: string | null;
  tamanho_bytes: number | null;
  data_cadastro: string | null;
  quem_cadastrou: string | null;
  criado_em?: string | null;
  enviado_por_nome?: string | null;
  storage_bucket: 'religiosos-documentos' | 'arquivo-religiosos-confidencial';
}

export interface ReligiososConfig {
  id?: string;
  ativo: boolean;
  titulo: string;
  mensagem_abertura: string;
  mensagem_fechamento: string;
  mensagem_confirmacao: string;
  termos: string;
  exigir_documentos: boolean;
  instrucoes_documentos: string;
}

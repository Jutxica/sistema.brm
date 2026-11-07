// Tipos Centralizados do Módulo de Comunicação, Redes Sociais e Mídia BRM

export interface ArquivoArte {
  id: string;
  url: string;
  nome: string;
  tipo: 'imagem' | 'video' | 'psd' | 'vetor';
  ordem: number;
  psd_url?: string;
  svg_url?: string;
  largura?: number;
  altura?: number;
}

export type AreaPauta = 
  | 'Institucional'
  | 'Vocacional'
  | 'Paróquias'
  | 'Formação'
  | 'Espiritualidade'
  | 'Obras Sociais';

export type FormatoConteudo = 
  | 'Carrossel'
  | 'Reels'
  | 'Post'
  | 'Site'
  | 'Vídeo Longo'
  | 'Story';

export type StatusPauta = 
  | 'ideia'
  | 'em_producao'
  | 'aprovacao'
  | 'aprovado'
  | 'programado'
  | 'postado'
  | 'arquivado';

export interface ComunicacaoPauta {
  id: string;
  titulo: string;
  descricao?: string | null;
  area: AreaPauta;
  formato: FormatoConteudo;
  status: StatusPauta;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  data_prevista?: string | null;
  canais: string[];
  obra_id?: string | null;
  obra_nome?: string | null;
  religioso_id?: string | null;
  religioso_nome?: string | null;
  responsavel_texto_id?: string | null;
  responsavel_texto_nome?: string | null;
  responsavel_arte_id?: string | null;
  responsavel_arte_nome?: string | null;
  responsaveis_equipe?: string[];
  criado_por_nome?: string | null;
  origem_data_comemorativa?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ComunicacaoPost {
  id: string;
  pauta_id?: string | null;
  titulo: string;
  legenda?: string | null;
  hashtags?: string | null;
  area: AreaPauta;
  formato: FormatoConteudo;
  canais: string[];
  status: 'em_producao' | 'aprovacao' | 'aprovado' | 'programado' | 'postado';
  arquivos_arte: ArquivoArte[];
  arte_entregue: boolean;
  texto_entregue: boolean;
  data_cronograma?: string | null;
  horario_agendado?: string | null;
  melhor_horario_sugerido?: string | null;
  obra_id?: string | null;
  obra_nome?: string | null;
  religioso_id?: string | null;
  religioso_nome?: string | null;
  responsaveis_equipe?: string[];
  aprovado_por_nome?: string | null;
  aprovado_em?: string | null;
  ordem_feed?: number | null;
  estatisticas?: {
    curtidas?: number;
    comentarios?: number;
    alcance?: number;
    visualizacoes?: number;
  };
  created_at: string;
  updated_at?: string;
}

export interface ComunicacaoComentario {
  id: string;
  post_id: string;
  autor_nome: string;
  escopo: string; // 'post_todo' ou 'slide_1', 'slide_2', etc.
  slide_numero?: number | null;
  mensagem: string;
  resolvido: boolean;
  created_at: string;
}

export interface ComunicacaoTarefa {
  id: string;
  titulo: string;
  concluida: boolean;
  tipo: 'fazer' | 'ideia' | 'anotacao';
  responsavel_nome?: string | null;
  data_limite?: string | null;
  pauta_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ChecklistEquipamento {
  item: string;
  checado: boolean;
}

export interface ComentarioCaptacao {
  id: string;
  autor_nome: string;
  mensagem: string;
  created_at: string;
}

export interface ComunicacaoCaptacao {
  id: string;
  titulo: string;
  entrevistado_nome: string;
  religioso_id?: string | null;
  roteiro_id?: string | null;
  data_gravacao: string;
  duracao: string;
  local: string;
  area: AreaPauta;
  situacao: 'agendada' | 'gravada' | 'cancelada';
  roteiro?: string | null;
  tags?: string[];
  mencoes?: string[];
  comentarios?: ComentarioCaptacao[];
  checklist_equipamentos: ChecklistEquipamento[];
  conteudos_previstos: Array<{ formato: string; titulo: string }>;
  participantes: Array<{ nome: string; email: string }>;
  created_at: string;
  updated_at?: string;
}

export interface ComunicacaoRoteiro {
  id: string;
  titulo: string;
  captacao_id?: string | null;
  religioso_id?: string | null;
  religioso_nome?: string | null;
  conteudo: string;
  tags: string[];
  mencoes: string[];
  comentarios: ComentarioCaptacao[];
  created_at: string;
  updated_at?: string;
}

export interface ReligiosoConteudo {
  id: string;
  nome_religioso: string;
  nome_civil: string;
  grau: string;
  data_nascimento?: string | null;
  naturalidade_cidade?: string | null;
  naturalidade_uf?: string | null;
  pais_nascimento?: string | null;

  // Datas Canônicas
  primeira_profissao_data?: string | null;
  profissao_perpetua_data?: string | null;
  ordenacao_diaconal_data?: string | null;
  ordenacao_presbiteral_data?: string | null;
  ordenacao_episcopal_data?: string | null;
  ordenacao_data?: string | null;

  // Locais e Celebrantes
  ordenacao_local?: string | null;
  ordenacao_bispo?: string | null;
  profissao_local?: string | null;

  // Lema e Espiritualidade
  lema_destacado?: string | null;
  lema_destacado_fase?: string | null;

  // Origem Vocacional
  paroquia_origem?: string | null;
  diocese_origem?: string | null;

  // Comunidade, Obra e Cargo
  comunidade_atual_nome?: string | null;
  obra_atual_nome?: string | null;
  diocese_atual?: string | null;
  cargo_funcao?: string | null;

  // Foto
  foto_path?: string | null;
  foto_url?: string | null;

  // Contatos
  email_institucional?: string | null;
  email_pessoal?: string | null;
  telefone_celular?: string | null;
  telefone_whatsapp?: string | null;

  // Redes Sociais & Presença Digital
  redes_sociais?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  youtube?: string | null;

  // Biografia
  biografia?: string | null;
  total_conteudos?: number;
  ultimo_conteudo_em?: string | null;
}

export interface HistoricoConteudoItem {
  id: string;
  tipo: 'post' | 'pauta' | 'captacao';
  titulo: string;
  formato: string;
  data: string;
  status: string;
  url?: string;
  imagem_url?: string;
}

export interface ObraResumoComunicacao {
  id: string;
  nome: string;
  tipo: string;
  cidade?: string | null;
  uf?: string | null;
  comunidade_nome?: string | null;
}

export interface AniversarianteProvincia {
  id: string;
  religioso_id: string;
  nome: string;
  dia: number;
  mes: number;
  tipo: 'natalicio' | 'ordenacao' | 'votos';
  anos?: number;
  comunidade?: string;
  obra?: string;
  foto_url?: string;
  data_completa?: string;
}

export interface ComunicacaoEmailEquipe {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  telefone?: string | null;
  papel: 'coordenador' | 'operador' | 'externo';
  ativo: boolean;
  created_at: string;
}

export interface ComunicacaoBrandAsset {
  id: string;
  tipo: 'cor' | 'tipografia' | 'logo' | 'template' | 'textura' | 'psd' | 'vetor' | 'foto';
  nome: string;
  valor: string;
  categoria?: string | null;
  descricao?: string | null;
  arquivo_url?: string | null;
  psd_ou_vetor_url?: string | null;
  extensao?: string | null;
  tamanho?: string | null;
  created_at: string;
}

export interface ComunicacaoBenchmarking {
  id: string;
  perfil_nome: string;
  perfil_handle?: string | null;
  canal: string;
  url?: string | null;
  pontos_fortes?: string | null;
  ideias_inspiracao?: string | null;
  created_at: string;
}

export interface ComunicacaoMetrica {
  id: string;
  canal: string;
  data_referencia: string;
  seguidores_total: number;
  seguidores_novos: number;
  seguidores_deixaram: number;
  contas_alcancadas: number;
  alcance_variacao_pct: number;
  engajamento_pct: number;
  interacoes_total: number;
  visualizacoes_total: number;
  posts_por_horario: Record<string, { media: number; total: number }>;
  dias_mais_ativos: Record<string, number>;
  horarios_pico_meta: Array<{ dia: string; horario: string; descricao: string }>;
  created_at: string;
}

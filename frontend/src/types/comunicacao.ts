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
  responsavel_texto_id?: string | null;
  responsavel_texto_nome?: string | null;
  responsavel_arte_id?: string | null;
  responsavel_arte_nome?: string | null;
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

export interface ComunicacaoCaptacao {
  id: string;
  titulo: string;
  entrevistado_nome: string;
  religioso_id?: string | null;
  data_gravacao: string;
  duracao: string;
  local: string;
  area: AreaPauta;
  situacao: 'agendada' | 'gravada' | 'cancelada';
  roteiro?: string | null;
  checklist_equipamentos: ChecklistEquipamento[];
  conteudos_previstos: Array<{ formato: string; titulo: string }>;
  participantes: Array<{ nome: string; email: string }>;
  created_at: string;
  updated_at?: string;
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

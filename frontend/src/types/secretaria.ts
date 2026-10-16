// Tipos Centralizados do Módulo de Secretaria, Atos Oficiais e Agenda Provincial BRM

import type { VariavelCampo } from '../components/FormularioTimbrado';

export type { VariavelCampo };

export interface FormularioSecretaria {
  id: string;
  titulo: string;
  codigo?: string;
  descricao?: string;
  evento_id?: string | null;
  campos: VariavelCampo[];
  ativo: boolean;
  limite_vagas?: number | null;
  prazo_encerramento?: string | null;
  mensagem_sucesso?: string | null;
  total_respostas?: number;
  created_at: string;
  updated_at?: string;
}

export interface RespostaFormulario {
  id: string;
  formulario_id: string;
  evento_id?: string | null;
  dados: Record<string, any>;
  protocolo: string;
  status: 'Confirmada' | 'Pendente' | 'Cancelada';
  created_at: string;
}

export interface ConfiguracaoSecretaria {
  id?: string;
  prefixo_decretos: string;
  numero_atual_decretos: number;
  prefixo_portarias: string;
  numero_atual_portarias: number;
  prefixo_circulares: string;
  numero_atual_circulares: number;
  prefixo_formularios: string;
  numero_atual_formularios: number;
  cabecalho_institucional: string;
  subtitulo_provincia: string;
  orgao_emissor: string;
  lema_oficial: string;
  email_secretaria: string;
  telefone_secretaria: string;
  notificar_confrade_email: boolean;
  notificar_secretario_nova_resposta: boolean;
  rodape_personalizado?: string;
}

export type CategoriaDocumento = 
  | 'Transferências'
  | 'Diretórios'
  | 'Comunicados'
  | 'Protocolos'
  | 'Decretos'
  | 'Formação & Subsídios'
  | 'Outros';

export interface DocumentoProvincial {
  id: string;
  titulo: string;
  categoria: CategoriaDocumento;
  subtitulo?: string;
  numero_referencia?: string;
  data_documento: string;
  arquivo_nome: string;
  arquivo_url: string;
  arquivo_path?: string;
  arquivo_tamanho_bytes?: number;
  mime_type?: string;
  descricao?: string;
  publicado_por: string;
  status: 'Ativo' | 'Arquivado';
  created_at: string;
}

export type TipoEvento = 
  | 'Assembleia'
  | 'Retiro'
  | 'Reunião'
  | 'Encontro'
  | 'Celebração / Solenidade'
  | 'Visita Canônica'
  | 'Formação'
  | 'Outro';

export type StatusEvento = 'Confirmado' | 'Previsto' | 'Concluído' | 'Cancelado';

export interface EventoProvincial {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  data_inicio: string;
  data_fim?: string | null;
  horario?: string | null;
  local: string;
  cidade?: string | null;
  uf?: string | null;
  descricao?: string | null;
  publico_alvo?: string | null;
  status: StatusEvento;
  exige_inscricao?: boolean;
  formulario_id?: string | null;
  limite_vagas?: number | null;
  prazo_inscricao?: string | null;
  publicado_portal?: boolean;
  created_at: string;
}

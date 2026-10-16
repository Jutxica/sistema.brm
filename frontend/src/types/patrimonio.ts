// Definições de Tipos e Modelo de Dados do Módulo de Patrimônio Provincial BRM

export type AbaPatrimonio = 'visao-geral' | 'imoveis' | 'veiculos' | 'inventario' | 'contratos' | 'manutencoes' | 'auditoria';
export type TipoPatrimonio = 'imovel' | 'veiculo' | 'bem' | 'contrato' | 'vistoria';

export type TipoDocumentoPatrimonio =
  | 'Escritura Pública'
  | 'Matrícula RGI'
  | 'Certidão de Ônus / Negativa'
  | 'Habite-se / Alvará'
  | 'AVCB Bombeiros'
  | 'CRLV / Documento do Veículo'
  | 'Apólice de Seguro'
  | 'Nota Fiscal / Recibo'
  | 'Foto do Bem / Fachada'
  | 'Foto Interna / Detalhe'
  | 'Termo de Tombamento / Certificado'
  | 'Laudo de Vistoria / Laudo Técnico'
  | 'Contrato / Termo Aditivo'
  | 'Comprovante IPVA / Taxa'
  | 'Planta / Projeto Arquitetônico'
  | 'Outro Documento';

export interface PatrimonioAnexo {
  id: string;
  nome: string;
  tipo: TipoDocumentoPatrimonio;
  arquivo_url: string;
  arquivo_nome?: string;
  tamanho_bytes?: number;
  formato?: string;
  created_at?: string;
  enviado_por?: string;
}

export interface ImovelPatrimonio {
  id: string;
  nome: string;
  tipo: string;
  comunidade_obra?: string;
  cidade: string;
  uf: string;
  endereco?: string;
  bairro?: string;
  cep?: string;
  complemento?: string;
  destinacao?: string;
  area_terreno_m2?: number;
  area_construida_m2?: number;
  numero_matricula?: string;
  cartorio_registro?: string;
  livro_folha?: string;
  inscricao_municipal?: string;
  tem_escritura: boolean;
  tem_habite_se: boolean;
  avcb_numero?: string;
  avcb_emissao?: string;
  avcb_vencimento?: string;
  seguro_predial_seguradora?: string;
  seguro_predial_apolice?: string;
  seguro_predial_vencimento?: string;
  valor_venal?: number;
  status: 'Ativo' | 'Alugado' | 'Em Reforma' | 'Cedido / Comodato' | 'Inativo';
  observacoes?: string;
  foto_url?: string;
  fotos?: string[];
  anexos?: PatrimonioAnexo[];
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
}

export interface VeiculoPatrimonio {
  id: string;
  marca_modelo: string;
  placa: string;
  ano_fabricacao?: number;
  ano_modelo?: number;
  cor?: string;
  chassi?: string;
  renavam?: string;
  tipo: 'Carro' | 'Van / Micro-ônibus' | 'Caminhonete / Utilitário' | 'Moto' | 'Outro';
  comunidade_obra: string;
  responsavel_nome?: string;
  combustivel?: string;
  quilometragem_atual: number;
  proxima_revisao_km?: number;
  proxima_revisao_data?: string;
  ipva_pago: boolean;
  ipva_vencimento?: string;
  seguro_seguradora?: string;
  seguro_apolice?: string;
  seguro_vencimento?: string;
  seguro_contato_emergencia?: string;
  crlv_url?: string;
  status: 'Em Uso' | 'Em Manutenção' | 'Reserva Provincial' | 'Disponível para Venda' | 'Baixado';
  observacoes?: string;
  foto_url?: string;
  fotos?: string[];
  anexos?: PatrimonioAnexo[];
  created_at?: string;
  updated_at?: string;
}

export interface BemPatrimonio {
  id: string;
  codigo_tombamento: string;
  titulo: string;
  categoria: 'Arte Sacra & Liturgia' | 'Equipamento & Tecnologia' | 'Maquinário & Geradores' | 'Mobiliário Histórico' | 'Instrumento Musical' | 'Outro';
  comunidade_obra: string;
  localizacao_especifica?: string;
  estado_conservacao: 'Excelente' | 'Bom' | 'Regular' | 'Necessita Restauração / Reparo' | 'Danificado';
  ano_aquisicao?: number;
  origem_procedencia?: string;
  autor_escola?: string;
  valor_estimado?: number;
  tombamento_historico: boolean;
  descricao_detalhada?: string;
  foto_url?: string;
  fotos?: string[];
  anexos?: PatrimonioAnexo[];
  status: 'Ativo' | 'Em Restauração' | 'Emprestado' | 'Baixado';
  created_at?: string;
  updated_at?: string;
}

export interface ContratoPatrimonio {
  id: string;
  titulo: string;
  tipo: string;
  fornecedor_prestador: string;
  cnpj_cpf?: string;
  contato_telefone?: string;
  contato_email?: string;
  imovel_vinculado?: string;
  data_inicio: string;
  data_fim: string;
  valor_mensal?: number;
  valor_anual?: number;
  renovacao_automatica?: boolean;
  arquivo_url?: string;
  status: 'Vigente' | 'A Vencer (60 dias)' | 'Vencido' | 'Cancelado / Rescindido';
  observacoes?: string;
  anexos?: PatrimonioAnexo[];
  created_at?: string;
  updated_at?: string;
}

export interface ManutencaoPatrimonio {
  id: string;
  titulo: string;
  tipo: 'Vistoria Técnica Periódica' | 'Manutenção Preventiva' | 'Manutenção Corretiva / Emergencial' | 'Reforma / Ampliação' | 'Chamado da Comunidade';
  comunidade_obra: string;
  imovel_nome?: string;
  data_solicitacao: string;
  data_conclusao?: string;
  responsavel_vistoria?: string;
  prestador_executante?: string;
  custo_estimado?: number;
  custo_realizado?: number;
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  status: 'Pendente' | 'Em Análise pelo Ecônomo' | 'Aprovado / Em Execução' | 'Concluído' | 'Cancelado';
  descricao: string;
  laudo_observacoes?: string;
  fotos?: string[];
  anexos?: PatrimonioAnexo[];
  created_at?: string;
  updated_at?: string;
}

// Modelagem Relacional para Documentos e Certidões Notariais
export interface PatrimonioDocumento {
  id: string;
  entidade_tipo: 'imovel' | 'veiculo' | 'bem' | 'contrato' | 'manutencao';
  entidade_id: string;
  nome: string;
  tipo_documento: TipoDocumentoPatrimonio;
  arquivo_url: string;
  storage_path?: string;
  tamanho_bytes?: number;
  formato?: string;
  enviado_por?: string;
  data_vencimento?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// Trilha de Auditoria Append-Only Institucional
export interface AuditLogEntry {
  id: string;
  user_id?: string;
  user_email?: string;
  user_nome?: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'VIEW' | 'DOWNLOAD';
  entity: 'imoveis' | 'veiculos' | 'bens' | 'contratos' | 'manutencoes' | 'documentos';
  entity_id: string;
  entity_nome?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  created_at: string;
}

// Fila de Sincronização Offline-First
export interface SyncQueueItem {
  id: string;
  timestamp: string;
  acao: 'insert' | 'update' | 'delete';
  entidade: 'imoveis' | 'veiculos' | 'bens' | 'contratos' | 'manutencoes' | 'documentos';
  entidade_id: string;
  payload: any;
  tentativas: number;
  status: 'pendente' | 'sincronizando' | 'concluido' | 'conflito';
  erro?: string;
}

// Conformidade e Central de Prazos
export type NivelConformidade = 'critico' | 'urgente' | 'atencao' | 'regular';

export interface ConformidadeItem {
  id: string;
  tipo: 'seguro_predial' | 'avcb' | 'ipva' | 'seguro_veiculo' | 'revisao_veiculo' | 'contrato' | string;
  titulo: string;
  entidade_tipo: 'imovel' | 'veiculo' | 'contrato' | TipoPatrimonio;
  entidade_id: string;
  entidade_nome: string;
  comunidade_obra?: string;
  data_vencimento: string;
  data_limite?: string;
  dias_restantes: number;
  nivel: NivelConformidade;
  descricao: string;
  categoria?: string;
  item_id?: string;
  item_nome?: string;
  titulo_pendencia?: string;
  descricao_detalhada?: string;
}

// Métricas Agregadas do Dashboard
export interface PatrimonioDashboardMetrics {
  totalImoveis: number;
  valorTotalImoveis: number;
  areaTotalConstruida: number;
  totalVeiculos: number;
  veiculosEmUso: number;
  veiculosManutencao: number;
  totalBens: number;
  valorTotalBens: number;
  bensRestauracao: number;
  bensTombados: number;
  totalContratos: number;
  contratosVigentes: number;
  contratosAVencer: number;
  valorTotalMensalContratos: number;
  totalManutencoes: number;
  manutencoesPendentes: number;
  manutencoesEmExecucao: number;
  custoTotalManutencoes: number;
  valorTotalPatrimonial: number;
  alertasCriticos: number;
  alertasAtencao: number;
  distribuicaoComunidades: { comunidade: string; count: number; valor: number }[];
}

// Linha do Tempo e Memória Institucional
export interface PatrimonioTimelineEvent {
  id: string;
  data: string;
  tipo: 'aquisicao' | 'vistoria' | 'manutencao' | 'contrato' | 'documento' | 'auditoria';
  titulo: string;
  descricao: string;
  autor?: string;
  link?: string;
}

// Re-exportação de dados semente e operações de storage local
export * from '../services/mockPatrimonioData';

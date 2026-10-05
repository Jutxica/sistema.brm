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

export const STORAGE_KEY_PATRIMONIO = 'brm_patrimonio_v3';

// Dados-semente Oficiais da Província BRM
export const SEED_IMOVEIS: ImovelPatrimonio[] = [
  {
    id: 'imovel-1',
    nome: 'Sede Provincial BRM (Corupá)',
    tipo: 'Sede Provincial / Convento Central',
    comunidade_obra: 'Sede Provincial BRM - Corupá',
    cidade: 'Corupá',
    uf: 'SC',
    endereco: 'Rua Padre Gabriel Lux, 900 - Centro',
    bairro: 'Centro',
    cep: '89278-000',
    destinacao: 'Administração da Sede Provincial, Secretaria Provincial, residência e arquivo histórico',
    area_terreno_m2: 18500,
    area_construida_m2: 4200,
    numero_matricula: '14.892 - 1º Ofício',
    cartorio_registro: 'Cartório de Registro de Imóveis de Corupá/SC',
    tem_escritura: true,
    tem_habite_se: true,
    avcb_numero: 'AVCB-SC-2025-9981',
    avcb_vencimento: '2026-11-30',
    seguro_predial_seguradora: 'Porto Seguro',
    seguro_predial_apolice: 'PORTO-PRED-99812',
    seguro_predial_vencimento: '2026-12-15',
    valor_venal: 14500000,
    status: 'Ativo',
    observacoes: 'Sede jurídica e canônica da Província SCJ Brasil Meridional.',
    anexos: [
      {
        id: 'anexo-imov-1',
        nome: 'Escritura Pública de Compra e Venda',
        tipo: 'Escritura Pública',
        arquivo_url: '/logo-sistema.png',
        arquivo_nome: 'Escritura_Casa_Padre_Dehon_14892.pdf',
        tamanho_bytes: 2450000,
        formato: 'pdf',
        created_at: '2026-01-10T10:00:00Z',
        enviado_por: 'Secretaria Provincial'
      },
      {
        id: 'anexo-imov-2',
        nome: 'Certidão de Inteiro Teor e Matrícula RGI',
        tipo: 'Matrícula RGI',
        arquivo_url: '/logo-sistema.png',
        arquivo_nome: 'Matricula_RGI_14892_Atualizada.pdf',
        tamanho_bytes: 1280000,
        formato: 'pdf',
        created_at: '2026-02-15T14:30:00Z',
        enviado_por: 'Assessoria Jurídica'
      },
      {
        id: 'anexo-imov-3',
        nome: 'Auto de Vistoria do Corpo de Bombeiros (AVCB)',
        tipo: 'AVCB Bombeiros',
        arquivo_url: '/logo-sistema.png',
        arquivo_nome: 'AVCB_SC_2025_9981.pdf',
        tamanho_bytes: 850000,
        formato: 'pdf',
        created_at: '2025-11-30T09:15:00Z',
        enviado_por: 'Setor de Engenharia'
      }
    ]
  },
  {
    id: 'imovel-2',
    nome: 'Seminário Sagrado Coração de Jesus (Corupá)',
    tipo: 'Seminário / Casa de Formação / Museu',
    comunidade_obra: 'Seminário SCJ - Corupá',
    cidade: 'Corupá',
    uf: 'SC',
    endereco: 'Rua Padre Gabriel Lux, 900 - Seminário',
    bairro: 'Seminário',
    cep: '89278-000',
    destinacao: 'Seminário Menor Dehoniano, Museu de História Natural e Casa de Retiros da Província BRM',
    area_terreno_m2: 248000,
    area_construida_m2: 12500,
    numero_matricula: '14.280 - Registro de Imóveis',
    cartorio_registro: 'Cartório de Registro de Imóveis de Corupá/SC',
    tem_escritura: true,
    tem_habite_se: true,
    avcb_numero: 'SC-BOMB-4412-24',
    avcb_vencimento: '2026-10-25',
    seguro_predial_seguradora: 'Allianz Seguros',
    seguro_predial_apolice: 'ALLI-SEM-COR-7740',
    seguro_predial_vencimento: '2026-10-28',
    valor_venal: 32000000,
    status: 'Ativo',
    observacoes: 'Marco de fundação e patrimônio histórico dehoniano em Santa Catarina. Complexo arquitetônico e museológico.',
    anexos: [
      {
        id: 'anexo-imov-4',
        nome: 'Registro Geral de Imóveis (RGI) Corupá',
        tipo: 'Matrícula RGI',
        arquivo_url: '/logo-timbrado-brm.png',
        arquivo_nome: 'RGI_Seminario_Corupa_14280.pdf',
        tamanho_bytes: 3120000,
        formato: 'pdf',
        created_at: '2026-03-01T11:00:00Z',
        enviado_por: 'Ecônomo Local'
      },
      {
        id: 'anexo-imov-5',
        nome: 'Apólice do Seguro Predial Allianz 2025/2026',
        tipo: 'Apólice de Seguro',
        arquivo_url: '/logo-timbrado-brm.png',
        arquivo_nome: 'Apolice_Allianz_Seminario_Corupa.pdf',
        tamanho_bytes: 1450000,
        formato: 'pdf',
        created_at: '2025-10-28T16:00:00Z',
        enviado_por: 'Corretora Provincial'
      }
    ]
  },
  {
    id: 'imovel-3',
    nome: 'Seminário São José',
    tipo: 'Seminário / Casa de Formação',
    comunidade_obra: 'Seminário São José - Rio Negrinho',
    cidade: 'Rio Negrinho',
    uf: 'SC',
    endereco: 'Rua do Seminário, 450 - Vista Alegre',
    bairro: 'Vista Alegre',
    cep: '89295-000',
    destinacao: 'Etapa inicial da formação vocacional, retiros diocesanos e encontros de juventude',
    area_terreno_m2: 95000,
    area_construida_m2: 4100,
    numero_matricula: '7.129 - Livro 2-A',
    cartorio_registro: 'Registro de Imóveis de Rio Negrinho/SC',
    tem_escritura: true,
    tem_habite_se: true,
    avcb_numero: 'AVCB-SC-8812',
    avcb_vencimento: '2027-05-15',
    seguro_predial_seguradora: 'Bradesco Seguros',
    seguro_predial_apolice: 'BRAD-RIO-3391',
    seguro_predial_vencimento: '2027-06-01',
    valor_venal: 11200000,
    status: 'Ativo',
    observacoes: 'Área com vasta mata nativa preservada e lago.'
  }
];

export const SEED_VEICULOS: VeiculoPatrimonio[] = [
  {
    id: 'veic-1',
    marca_modelo: 'Toyota Corolla Cross XRE 2.0 Flex',
    placa: 'RXP-4E21',
    ano_fabricacao: 2023,
    ano_modelo: 2024,
    cor: 'Prata Metálico',
    tipo: 'Carro',
    comunidade_obra: 'Sede Provincial BRM - Corupá',
    responsavel_nome: 'Governo Provincial / Superior Provincial',
    combustivel: 'Flex',
    quilometragem_atual: 38450,
    proxima_revisao_km: 40000,
    ipva_pago: true,
    seguro_seguradora: 'Porto Seguro Auto',
    seguro_apolice: 'AUTO-PORTO-98213',
    seguro_vencimento: '2026-10-20',
    seguro_contato_emergencia: '0800 727 0727',
    status: 'Em Uso',
    anexos: [
      {
        id: 'anexo-veic-1',
        nome: 'Certificado de Registro e Licenciamento (CRLV 2026)',
        tipo: 'CRLV / Documento do Veículo',
        arquivo_url: '/logo-sistema.png',
        arquivo_nome: 'CRLV_2026_Toyota_RXP4E21.pdf',
        tamanho_bytes: 420000,
        formato: 'pdf',
        created_at: '2026-01-20T08:00:00Z',
        enviado_por: 'Secretaria Provincial'
      },
      {
        id: 'anexo-veic-2',
        nome: 'Apólice Completa Porto Seguro Auto',
        tipo: 'Apólice de Seguro',
        arquivo_url: '/logo-sistema.png',
        arquivo_nome: 'Apolice_Porto_Corolla_RXP4E21.pdf',
        tamanho_bytes: 1100000,
        formato: 'pdf',
        created_at: '2025-10-20T10:00:00Z',
        enviado_por: 'Corretora Provincial'
      }
    ]
  },
  {
    id: 'veic-2',
    marca_modelo: 'Mercedes-Benz Sprinter 416 CDI Van (16 Lugares)',
    placa: 'BCJ-8H90',
    ano_fabricacao: 2022,
    ano_modelo: 2022,
    cor: 'Branco',
    tipo: 'Van / Micro-ônibus',
    comunidade_obra: 'Seminário SCJ - Corupá',
    responsavel_nome: 'Pe. Formador / Ecônomo Local',
    combustivel: 'Diesel S10',
    quilometragem_atual: 89300,
    proxima_revisao_km: 90000,
    ipva_pago: true,
    seguro_seguradora: 'Allianz Auto',
    seguro_apolice: 'ALLI-VAN-12904',
    seguro_vencimento: '2026-11-05',
    seguro_contato_emergencia: '0800 130 700',
    status: 'Em Uso',
    anexos: [
      {
        id: 'anexo-veic-3',
        nome: 'CRLV Digital 2026 - Sprinter Corupá',
        tipo: 'CRLV / Documento do Veículo',
        arquivo_url: '/logo-timbrado-brm.png',
        arquivo_nome: 'CRLV_Sprinter_BCJ8H90.pdf',
        tamanho_bytes: 430000,
        formato: 'pdf',
        created_at: '2026-02-10T10:00:00Z',
        enviado_por: 'Ecônomo Local'
      }
    ]
  },
  {
    id: 'veic-3',
    marca_modelo: 'Chevrolet Spin Premier 1.8 7 Lugares',
    placa: 'RHM-2A15',
    ano_fabricacao: 2021,
    ano_modelo: 2022,
    cor: 'Cinza Grafite',
    tipo: 'Carro',
    comunidade_obra: 'Seminário São José - Rio Negrinho',
    responsavel_nome: 'Formadores e Seminaristas',
    combustivel: 'Flex',
    quilometragem_atual: 72100,
    proxima_revisao_km: 80000,
    ipva_pago: true,
    seguro_seguradora: 'Bradesco Seguros',
    seguro_apolice: 'BRAD-AUTO-5510',
    seguro_vencimento: '2027-02-10',
    seguro_contato_emergencia: '0800 701 2757',
    status: 'Em Uso',
    anexos: [
      {
        id: 'anexo-veic-4',
        nome: 'CRLV Digital e Seguro Bradesco Spin',
        tipo: 'CRLV / Documento do Veículo',
        arquivo_url: '/logo-sistema.png',
        arquivo_nome: 'Documento_Spin_RHM2A15.pdf',
        tamanho_bytes: 510000,
        formato: 'pdf',
        created_at: '2026-02-10T09:00:00Z',
        enviado_por: 'Administração Rio Negrinho'
      }
    ]
  }
];

export const SEED_BENS: BemPatrimonio[] = [
  {
    id: 'bem-1',
    codigo_tombamento: 'PAT-BRM-001',
    titulo: 'Imagem Histórica do Sagrado Coração de Jesus (Madeira Policromada)',
    categoria: 'Arte Sacra & Liturgia',
    comunidade_obra: 'Seminário SCJ - Corupá',
    localizacao_especifica: 'Capela Maior do Seminário de Corupá - Retábulo Central',
    estado_conservacao: 'Excelente',
    ano_aquisicao: 1932,
    origem_procedencia: 'Alemanha (Escola de Baviera)',
    autor_escola: 'Entalhe artesanal bávaro trazido pelos fundadores',
    valor_estimado: 95000,
    tombamento_historico: true,
    descricao_detalhada: 'Imagem original entalhada em madeira nobre, policromia em folhas de ouro, acervo histórico do Seminário de Corupá.',
    status: 'Ativo',
    anexos: [
      {
        id: 'anexo-bem-1',
        nome: 'Certificado Canônico de Tombamento Histórico',
        tipo: 'Termo de Tombamento / Certificado',
        arquivo_url: '/logo-sistema.png',
        arquivo_nome: 'Termo_Tombamento_Imagem_SCJ_1932.pdf',
        tamanho_bytes: 1850000,
        formato: 'pdf',
        created_at: '2026-01-15T15:00:00Z',
        enviado_por: 'Comissão de Bens Culturais SCJ'
      },
      {
        id: 'anexo-bem-2',
        nome: 'Laudo Pericial de Conservação e Restauro',
        tipo: 'Laudo de Vistoria / Laudo Técnico',
        arquivo_url: '/logo-sistema.png',
        arquivo_nome: 'Laudo_Conservacao_Arte_Sacra.pdf',
        tamanho_bytes: 2600000,
        formato: 'pdf',
        created_at: '2025-11-20T11:00:00Z',
        enviado_por: 'Restaurador Responsável'
      }
    ]
  },
  {
    id: 'bem-2',
    codigo_tombamento: 'PAT-BRM-002',
    titulo: 'Gerador a Diesel Carenado Stemac 75 kVA com QTA Automático',
    categoria: 'Maquinário & Geradores',
    comunidade_obra: 'Casa Padre Dehon - Brusque',
    localizacao_especifica: 'Subestação Externa / Casa de Máquinas',
    estado_conservacao: 'Bom',
    ano_aquisicao: 2021,
    origem_procedencia: 'Stemac Brasil',
    valor_estimado: 78000,
    tombamento_historico: false,
    descricao_detalhada: 'Gerador automático com QTA para suporte da Sede Provincial e dependências em queda de energia.',
    status: 'Ativo',
    anexos: [
      {
        id: 'anexo-bem-3',
        nome: 'Nota Fiscal e Manual de Operação Técnica Stemac',
        tipo: 'Nota Fiscal / Recibo',
        arquivo_url: '/logo-sistema.png',
        arquivo_nome: 'NF_Stemac_75kVA_Casa_Dehon.pdf',
        tamanho_bytes: 1980000,
        formato: 'pdf',
        created_at: '2021-08-15T14:00:00Z',
        enviado_por: 'Setor de Compras'
      }
    ]
  },
  {
    id: 'bem-3',
    codigo_tombamento: 'PAT-BRM-003',
    titulo: 'Conjunto de Cálices e Ostensório em Prata Dourada (Jubilar)',
    categoria: 'Arte Sacra & Liturgia',
    comunidade_obra: 'Sede Provincial - Corupá',
    localizacao_especifica: 'Cofre Sacro da Secretaria Provincial',
    estado_conservacao: 'Bom',
    ano_aquisicao: 1950,
    origem_procedencia: 'Itália (Ourivesaria Sacra Romana)',
    valor_estimado: 45000,
    tombamento_historico: true,
    descricao_detalhada: 'Peças comemorativas das bodas de ouro da primeira geração de padres no Brasil.',
    status: 'Ativo'
  }
];

export const SEED_CONTRATOS: ContratoPatrimonio[] = [
  {
    id: 'cont-1',
    titulo: 'Apólice Multirrisco Patrimonial Predial (Sede Provincial Corupá & Obras)',
    tipo: 'Seguro Predial Multirrisco',
    fornecedor_prestador: 'Porto Seguro Companhia de Seguros',
    cnpj_cpf: '61.198.164/0001-60',
    contato_telefone: '(47) 3375-1194',
    contato_email: 'secretaria@brm.org.br',
    imovel_vinculado: 'Sede Provincial BRM (Corupá)',
    data_inicio: '2025-12-15',
    data_fim: '2026-12-15',
    valor_mensal: 2850,
    valor_anual: 34200,
    renovacao_automatica: true,
    status: 'Vigente',
    observacoes: 'Cobertura ampla contra incêndio, vendaval, danos elétricos e responsabilidade civil.',
    anexos: [
      {
        id: 'anexo-cont-1',
        nome: 'Contrato Assinado de Seguro Predial Multirrisco',
        tipo: 'Contrato / Termo Aditivo',
        arquivo_url: '/logo-sistema.png',
        arquivo_nome: 'Contrato_Porto_Seguro_Predial_2026.pdf',
        tamanho_bytes: 2300000,
        formato: 'pdf',
        created_at: '2025-12-15T10:00:00Z',
        enviado_por: 'Economato Provincial'
      }
    ]
  },
  {
    id: 'cont-2',
    titulo: 'Apólice Multirrisco do Seminário SCJ de Corupá',
    tipo: 'Seguro Predial Multirrisco',
    fornecedor_prestador: 'Allianz Seguros S.A.',
    cnpj_cpf: '61.573.796/0001-66',
    contato_telefone: '(47) 3375-1194',
    contato_email: 'secretaria@brm.org.br',
    imovel_vinculado: 'Seminário Sagrado Coração de Jesus (Corupá)',
    data_inicio: '2025-10-28',
    data_fim: '2026-10-28',
    valor_mensal: 3600,
    valor_anual: 43200,
    renovacao_automatica: false,
    status: 'A Vencer (60 dias)',
    observacoes: 'Vigência expira em menos de 30 dias. Solicitar cotação de renovação junto à corretora provincial.',
    anexos: [
      {
        id: 'anexo-cont-2',
        nome: 'Apólice Allianz Seminário Corupá',
        tipo: 'Apólice de Seguro',
        arquivo_url: '/logo-timbrado-brm.png',
        arquivo_nome: 'Apolice_Allianz_Seminario_Corupa.pdf',
        tamanho_bytes: 1800000,
        formato: 'pdf',
        created_at: '2025-10-28T09:00:00Z',
        enviado_por: 'Economato Provincial'
      }
    ]
  }
];

export const SEED_MANUTENCOES: ManutencaoPatrimonio[] = [
  {
    id: 'manu-1',
    titulo: 'Recarga Anual de Extintores e Laudo de Pressurização de Hidrantes',
    tipo: 'Vistoria Técnica Periódica',
    comunidade_obra: 'Sede Provincial BRM - Corupá',
    imovel_nome: 'Sede Provincial BRM (Corupá)',
    data_solicitacao: '2026-09-20',
    data_conclusao: '2026-10-15',
    responsavel_vistoria: 'Engenharia de Segurança Contratada',
    prestador_executante: 'Extintores Vale do Itapocu Ltda',
    custo_estimado: 3200,
    prioridade: 'Alta',
    status: 'Pendente',
    descricao: 'Vistoria e recarga anual dos extintores e emissão de laudo técnico para o Corpo de Bombeiros de SC.',
    anexos: [
      {
        id: 'anexo-manu-1',
        nome: 'Orçamento Técnico e Cronograma de Manutenção',
        tipo: 'Laudo de Vistoria / Laudo Técnico',
        arquivo_url: '/logo-sistema.png',
        arquivo_nome: 'Orcamento_Extintores_Vale_Itapocu.pdf',
        tamanho_bytes: 890000,
        formato: 'pdf',
        created_at: '2026-09-20T11:00:00Z',
        enviado_por: 'Secretaria Provincial'
      }
    ]
  },
  {
    id: 'manu-2',
    titulo: 'Revisão Elétrica e Manutenção Preventiva do Gerador de Corupá',
    tipo: 'Manutenção Preventiva',
    comunidade_obra: 'Seminário SCJ - Corupá',
    imovel_nome: 'Seminário Sagrado Coração de Jesus (Corupá)',
    data_solicitacao: '2026-09-28',
    responsavel_vistoria: 'Equipe de Manutenção Predial',
    prestador_executante: 'Eletrotécnica Norte Catarinense',
    custo_estimado: 4800,
    prioridade: 'Média',
    status: 'Aprovado / Em Execução',
    descricao: 'Troca de filtros de óleo e diesel do gerador Stemac e verificação dos painéis de transferência.'
  }
];

export interface PatrimonioLocalData {
  imoveis: ImovelPatrimonio[];
  veiculos: VeiculoPatrimonio[];
  bens: BemPatrimonio[];
  contratos: ContratoPatrimonio[];
  manutencoes: ManutencaoPatrimonio[];
}

export function getPatrimonioLocal(): PatrimonioLocalData {
  if (typeof window !== 'undefined') {
    // Purga chaves legadas e caches com dados desatualizados
    ['brm_patrimonio_v1', 'brm_patrimonio_v2'].forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
  }
  const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_PATRIMONIO) : null;
  if (!saved || saved.toLowerCase().includes('conventinho') || saved.toLowerCase().includes('taubat') || saved.toLowerCase().includes('curia')) {
    const freshData = {
      imoveis: SEED_IMOVEIS,
      veiculos: SEED_VEICULOS,
      bens: SEED_BENS,
      contratos: SEED_CONTRATOS,
      manutencoes: SEED_MANUTENCOES
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_PATRIMONIO, JSON.stringify({ ...freshData, updated_at: new Date().toISOString() }));
      } catch (_) {}
    }
    return freshData;
  }
  try {
    const parsed = JSON.parse(saved);
    
    // Mescla resiliente garantindo integridade de anexos e dados
    const mergeAnexos = <T extends { id: string; anexos?: PatrimonioAnexo[] }>(
      items: T[], 
      seedItems: T[]
    ): T[] => {
      return (items || []).map(item => {
        const seed = seedItems.find(s => s.id === item.id);
        const anexos = (item.anexos && item.anexos.length > 0)
          ? item.anexos
          : (seed?.anexos || []);
        return {
          ...item,
          anexos
        };
      });
    };

    return {
      imoveis: mergeAnexos(parsed.imoveis || SEED_IMOVEIS, SEED_IMOVEIS),
      veiculos: mergeAnexos(parsed.veiculos || SEED_VEICULOS, SEED_VEICULOS),
      bens: mergeAnexos(parsed.bens || SEED_BENS, SEED_BENS),
      contratos: mergeAnexos(parsed.contratos || SEED_CONTRATOS, SEED_CONTRATOS),
      manutencoes: mergeAnexos(parsed.manutencoes || SEED_MANUTENCOES, SEED_MANUTENCOES)
    };
  } catch (_) {
    return {
      imoveis: SEED_IMOVEIS,
      veiculos: SEED_VEICULOS,
      bens: SEED_BENS,
      contratos: SEED_CONTRATOS,
      manutencoes: SEED_MANUTENCOES
    };
  }
}

export function savePatrimonioLocal(data: {
  imoveis: ImovelPatrimonio[];
  veiculos: VeiculoPatrimonio[];
  bens: BemPatrimonio[];
  contratos: ContratoPatrimonio[];
  manutencoes: ManutencaoPatrimonio[];
}) {
  localStorage.setItem(STORAGE_KEY_PATRIMONIO, JSON.stringify({
    ...data,
    updated_at: new Date().toISOString()
  }));
}

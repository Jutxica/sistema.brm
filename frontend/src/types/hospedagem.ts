// Tipos Centralizados do Módulo de Hospedagens e Acolhida da Província BRM

export interface Hospedagem {
  idhospedagens: string;
  hos_categoria: string;
  hos_nome: string;
  hos_nascimento: string;
  hos_cpfrg: string;
  hos_email: string;
  hos_telefone: string;
  hos_telefoneemergencia: string;
  hos_logradouro: string;
  hos_numero: string;
  hos_cep: string;
  hos_bairro: string;
  hos_cidade: string;
  hos_estado: string;
  hos_alergico: string;
  hos_especifiquealergia: string;
  hos_restricaoalimentar: string;
  hos_especifiquerestricao: string;
  hos_lavanderia: string;
  hos_casa_acolhida?: string;
  hos_estadiamotivo: string;
  hos_modulo: string;
  hos_previsaochegada: string;
  hos_previsaosaida: string;
  hos_recibo: string;
  hos_recnome: string;
  hos_reccpfcnpj: string;
  hos_reclogradouro: string;
  hos_recnumero: string;
  hos_reccep: string;
  hos_recbairro: string;
  hos_reccidade: string;
  hos_recestado: string;
  hos_termo: string;
  hos_status: string;
  hos_checkin: string;
  hos_checkout: string;
  hos_quarto: string;
  hos_inscricao: string;
  hos_recibo_token?: string;
}

export interface Estadia {
  idmainhospedagem: string;
  main_motivo: string;
  main_ativo?: boolean;
}

export interface Quarto {
  idhos_quartos: string;
  hos_qua_nome: string;
  hos_qua_ativo?: boolean;
}

export interface MetaData {
  motivos: Array<{ idmainhospedagem: string; main_motivo: string }>;
  modulos: Array<{ idmodulos: string; mod_nome: string }>;
  status: Array<{ idstatushospedagem: string; sta_nome: string }>;
  quartos: Array<{ idhos_quartos: string; hos_qua_nome: string }>;
  lavanderias: Array<{ idlavanderia: string; lav_servico: string }>;
  colunasVisiveis: string[];
  colunasInvisiveis: string[];
}

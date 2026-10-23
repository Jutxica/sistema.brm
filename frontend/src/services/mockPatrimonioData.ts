// Dados-semente e Persistência Local do Módulo de Patrimônio Provincial BRM
import type {
  ImovelPatrimonio,
  VeiculoPatrimonio,
  BemPatrimonio,
  ContratoPatrimonio,
  ManutencaoPatrimonio
} from '../types/patrimonio';

export const STORAGE_KEY_PATRIMONIO = 'brm_patrimonio_v4';

// Sem dados mocks fictícios para Imóveis, Veículos, Bens e Contratos.
// O sistema inicia limpo e reflete unicamente os ativos reais cadastrados.
export const SEED_IMOVEIS: ImovelPatrimonio[] = [];
export const SEED_VEICULOS: VeiculoPatrimonio[] = [];
export const SEED_BENS: BemPatrimonio[] = [];
export const SEED_CONTRATOS: ContratoPatrimonio[] = [];

// Preservado: Agenda de Manutenções & Vistorias do Patrimônio
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
    // Purga chaves legadas e caches com dados desatualizados/mocks
    ['brm_patrimonio_v1', 'brm_patrimonio_v2', 'brm_patrimonio_v3'].forEach(k => {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    });
  }

  const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_PATRIMONIO) : null;
  if (!saved) {
    const freshData: PatrimonioLocalData = {
      imoveis: [],
      veiculos: [],
      bens: [],
      contratos: [],
      manutencoes: SEED_MANUTENCOES
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_PATRIMONIO, JSON.stringify({ ...freshData, updated_at: new Date().toISOString() }));
      } catch (e) {
        console.warn('Erro ao salvar patrimônio inicial:', e);
      }
    }
    return freshData;
  }

  try {
    const parsed = JSON.parse(saved);
    // Remove qualquer dado mock legado que comece com 'imovel-', 'veic-', 'bem-', 'cont-'
    const isMock = (id: string) => /^(imovel|veic|bem|cont)-\d+$/.test(id);

    return {
      imoveis: (parsed.imoveis || []).filter((i: ImovelPatrimonio) => !isMock(i.id)),
      veiculos: (parsed.veiculos || []).filter((v: VeiculoPatrimonio) => !isMock(v.id)),
      bens: (parsed.bens || []).filter((b: BemPatrimonio) => !isMock(b.id)),
      contratos: (parsed.contratos || []).filter((c: ContratoPatrimonio) => !isMock(c.id)),
      manutencoes: (parsed.manutencoes && parsed.manutencoes.length > 0) ? parsed.manutencoes : SEED_MANUTENCOES
    };
  } catch (e) {
    console.warn('Erro ao analisar patrimônio local:', e);
    return {
      imoveis: [],
      veiculos: [],
      bens: [],
      contratos: [],
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
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PATRIMONIO, JSON.stringify({
        ...data,
        updated_at: new Date().toISOString()
      }));
    }
  } catch (e) {
    console.warn('Falha ao salvar patrimônio no localStorage:', e);
  }
}

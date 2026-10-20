import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, FileUp, Info, Loader2, Plus, Trash2, Printer, Camera, Star, Check, Upload } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { confirmAction, showToast } from '../hooks/useFeedback';
import { useAuth } from '../contexts/AuthContext';
import { formatCep, lookupCep } from '../lib/cep';
import { validateCpf } from '../lib/cpf';

interface FotoReligiosoItem {
  id: string;
  arquivo?: File;
  previewUrl: string;
  caminho_storage?: string;
  isPerfil: boolean;
  nome_arquivo?: string;
}

interface ObraReferencia {
  id: string;
  nome: string;
  localidade: string | null;
  cidade: string | null;
  uf: string | null;
  diocese?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  estado?: string | null;
  pais?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
}
interface Familiar extends Record<string, string> { tipo: 'Pai' | 'Mãe' | 'Irmão'; nome: string; data_nascimento: string; local_nascimento: string; estado_civil: string; data_evento: string }
interface ContatoFamiliar extends Record<string, string> { nome: string; parentesco: string; contato_1: string; contato_2: string }
interface Sacrament extends Record<string, string> { tipo: string; data: string; paroquia: string; diocese: string; cidade: string; uf: string; livro: string; folha: string; numero_registro: string; celebrante: string; observacoes: string }
interface DocumentoSelecionado { categoria: string; arquivo: File }
interface DocumentoExistente { id: string; categoria: string; nome_arquivo: string; caminho_storage: string; data_cadastro: string }
interface ReligiososConfigPublica { ativo: boolean; titulo: string; mensagem_abertura: string; mensagem_fechamento: string; mensagem_confirmacao: string; termos: string; exigir_documentos: boolean; instrucoes_documentos: string }
interface CadastroReligiosoPublicoProps {
  adminMode?: boolean;
  memberMode?: boolean;
  religiosoId?: string;
  profileReligiosoId?: string;
  onSaved?: () => void | Promise<void>;
}

interface DesignacaoPortal {
  id: string;
  tipo_vinculo: string;
  funcao: string;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  ano_referencia: number;
  comunidades: { nome: string }[] | null;
  religiosos_obras_referencia: { nome: string }[] | null;
}

interface RegistrationDraft {
  base: Record<string, string>;
  familiares: Familiar[];
  contatosFamiliares?: ContatoFamiliar[];
  sacramentos: Sacrament[];
  rows: Record<string, string>[];
  step: number;
  draftVersion?: number;
  savedAt?: string;
  saved_at?: string;
}

const DRAFT_KEY = 'brm_rascunho_cadastro_religioso_v1';

const etapas = [
  'Identificação', 'Família e sacramentos', 'Vocação e formação', 'Ministérios, estudos e idiomas',
  'Histórico e endereço', 'Saúde, documentos e envio',
];
const OTHER_LOCATION_VALUE = '__outro__';
const brazilianStates = [
  { value: 'AC', label: 'Acre' }, { value: 'AL', label: 'Alagoas' }, { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' }, { value: 'BA', label: 'Bahia' }, { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' }, { value: 'ES', label: 'Espírito Santo' }, { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' }, { value: 'MT', label: 'Mato Grosso' }, { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' }, { value: 'PA', label: 'Pará' }, { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' }, { value: 'PE', label: 'Pernambuco' }, { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' }, { value: 'RN', label: 'Rio Grande do Norte' }, { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' }, { value: 'RR', label: 'Roraima' }, { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' }, { value: 'SE', label: 'Sergipe' }, { value: 'TO', label: 'Tocantins' },
];
const degreeOptions = ['Frater', 'Irmão', 'Diácono', 'Padre', 'Bispo'];
const ministryOptions = [
  'Ministério da Palavra', 'Ministério do Altar', 'Acolitado', 'Leitorado',
  'Diaconato', 'Presbiterado', 'Episcopado',
];
const formationOptions = ['Seminário Menor', 'Propedêutico', 'Discipulado', 'Postulantado', 'Noviciado', 'Tirocínio', 'Configuração'];
const votoOptions = ['Primeira Profissão Religiosa', 'Renovação de Votos', 'Profissão Perpétua'];
const votoTypeToDatabase: Record<string, string> = {
  'Primeira Profissão Religiosa': 'Primeira profissão',
  'Renovação de Votos': 'Voto temporário',
  'Profissão Perpétua': 'Voto perpétuo',
};
const votoTypeFromDatabase: Record<string, string> = Object.fromEntries(
  Object.entries(votoTypeToDatabase).map(([formValue, databaseValue]) => [databaseValue, formValue])
);
const ministryTypeToDatabase: Record<string, string> = {
  'Ministério da Palavra': 'Leitorado',
  'Ministério do Leitorado': 'Leitorado',
  'Ministério do Altar': 'Acolitado',
  'Leitorado': 'Leitorado',
  'Acolitado': 'Acolitado',
  'Diaconato': 'Diaconado',
  'Diaconado': 'Diaconado',
  'Presbiterado': 'Presbiterado',
  'Episcopado': 'Episcopado',
};
const ministryTypeFromDatabase: Record<string, string> = {
  'Leitorado': 'Leitorado',
  'Acolitado': 'Acolitado',
  'Diaconado': 'Diaconato',
  'Diaconato': 'Diaconato',
  'Presbiterado': 'Presbiterado',
  'Episcopado': 'Episcopado',
};
const renewalOptions = Array.from({ length: 9 }, (_, index) => String(index + 1));
const orderOptions = ['Diaconato', 'Presbiterado', 'Episcopado'];
const academicOptions = ['Filosofia', 'Teologia', 'Bacharelado', 'Mestrado', 'Doutorado', 'Graduação', 'Pós-graduação', 'Especialização', 'Cursos livres', 'Formação permanente', 'Ensino médio'];
const languageLevels = ['A1 - Iniciante', 'A2 - Básico', 'B1 - Intermediário', 'B2 - Intermediário avançado', 'C1 - Avançado', 'C2 - Proficiente'];
const relationshipOptions = ['Pai', 'Mãe', 'Irmão(ã)', 'Tio(a)', 'Sobrinho(a)', 'Primo(a)', 'Amigo(a)'];
const maritalStatusOptions: Record<Familiar['tipo'], string[]> = {
  Pai: ['Solteiro', 'Casado', 'Divorciado', 'Viúvo', 'Falecido', 'Outro'],
  Mãe: ['Solteira', 'Casada', 'Divorciada', 'Viúva', 'Falecida', 'Outro'],
  Irmão: ['Casado', 'Divorciado', 'Viúvo', 'Falecido'],
};
const normalizeMaritalStatus = (tipo: Familiar['tipo'], status: string) => {
  if (tipo === 'Irmão') return status;
  const feminine = tipo === 'Mãe';
  const forms: Record<string, [string, string]> = {
    Solteiro: ['Solteiro', 'Solteira'],
    Casado: ['Casado', 'Casada'],
    Divorciado: ['Divorciado', 'Divorciada'],
    Viúvo: ['Viúvo', 'Viúva'],
    Falecido: ['Falecido', 'Falecida'],
  };
  const matchingForm = Object.values(forms).find(([masculine, feminineForm]) =>
    status === masculine || status === feminineForm
  );
  return matchingForm ? matchingForm[feminine ? 1 : 0] : status;
};
const dynamicRequiredFields: Record<string, string> = {
  vocacional: 'titulo',
  formacao: 'etapa',
  voto: 'voto_tipo',
  ministerio: 'ministerio',
  academica: 'categoria',
  idioma: 'idioma',
  competencia: 'competencia',
  historico: 'instituicao',
  servico: 'servico_tipo',
};
const inputClass = 'w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-[#161b22] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] shadow-none outline-none transition-all duration-200 focus:border-slate-900 dark:focus:border-white font-mono';
const fieldLabels: Record<string, string> = {
  grau: 'Grau', nome_civil: 'Nome completo', nome_religioso: 'Nome religioso', data_nascimento: 'Data de nascimento',
  local_nascimento: 'Local de nascimento', municipio_nascimento: 'Município', estado_nascimento: 'Estado', pais_nascimento: 'País',
  nacionalidade: 'Nacionalidade', cpf: 'CPF', rg: 'RG', rg_orgao_expedidor: 'Órgão expedidor', rg_data_emissao: 'Data de emissão do RG',
  cep: 'CEP', logradouro: 'Logradouro', numero: 'Número', complemento: 'Complemento', bairro: 'Bairro',
  titulo_eleitor: 'Título de eleitor', pis: 'PIS', cnh: 'CNH', cnh_categoria: 'Categoria da CNH', passaporte: 'Passaporte',
  contato_nome: 'Nome do contato', contato_parentesco: 'Parentesco', contato_1: 'Telefone / WhatsApp', contato_2: 'Contato adicional',
  paroquia_origem: 'Paróquia de origem', diocese_origem: 'Diocese', grupo_movimento_pastoral: 'Grupo ou movimento pastoral', promotor_vocacional: 'Promotor vocacional',
  obra_atual_id: 'Obra atual', comunidade_atual_nome: 'Comunidade atual', email_institucional: 'E-mail institucional', email_pessoal: 'E-mail pessoal',
  telefone_celular: 'Celular', whatsapp: 'WhatsApp', redes_sociais: 'Redes sociais', plano_saude: 'Plano de saúde', numero_plano_saude: 'Número do plano',
  local_plano_saude: 'Local do plano', sus: 'SUS', tipo_sanguineo: 'Tipo sanguíneo', fator_rh: 'Fator Rh', alergias: 'Alergias',
  medicamentos_continuos: 'Medicamentos de uso contínuo', medico_responsavel: 'Médico responsável', contato_emergencia: 'Contato de emergência',
  informacoes_clinicas: 'Informações clínicas', cirurgias: 'Cirurgias', proteses: 'Próteses', observacoes_saude: 'Observações',
  nome: 'Nome', data: 'Data', data_evento: 'Data de falecimento', paroquia: 'Paróquia', diocese: 'Diocese', cidade: 'Cidade', uf: 'Estado / UF', livro: 'Livro', folha: 'Folha',
  numero_registro: 'Número do registro', celebrante: 'Celebrante', observacoes: 'Observações', ano: 'Ano', titulo: 'Título', descricao: 'Descrição',
  local: 'Cidade', responsavel: 'Responsável', etapa: 'Etapa', instituicao: 'Instituição', inicio: 'Data de ingresso', fim: 'Data de conclusão',
  formador: 'Formador responsável', voto_tipo: 'Tipo de voto', renovacao: 'Número da renovação', ministerio: 'Ministério ou ordem', bispo_ordenante: 'Bispo ordenante',
  categoria: 'Categoria', periodo: 'Período', pais: 'País', estado: 'Estado', idioma: 'Idioma', nivel: 'Nível de conhecimento', fala: 'Fala', audicao: 'Compreensão oral', leitura: 'Leitura', escrita: 'Escrita',
  competencia: 'Competência', funcao: 'Função', servico_tipo: 'Tipo de serviço', documento: 'Documento', observacao: 'Observação',
};
const getFieldLabel = (field: string) => fieldLabels[field] || field.replaceAll('_', ' ').replace(/^./, character => character.toUpperCase());
const rowHasValue = (row: Record<string, string>, fields: string[]) => fields.some(field => row[field]?.trim());
const hasAnyValues = (row: Record<string, string>, fields: string[]) => fields.some(field => row[field]?.trim());
const canonicalDegree = (value: string) => {
  if (/diácono|diacono/i.test(value)) return 'Diácono';
  if (/frater/i.test(value)) return 'Frater';
  if (/bispo/i.test(value)) return 'Bispo';
  if (/padre|presbítero|presbitero/i.test(value)) return 'Padre';
  if (/irmão|irmao/i.test(value)) return 'Irmão';
  return degreeOptions.includes(value) ? value : '';
};
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const asText = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const toTextRecord = (value: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(value).map(([key, item]) => [key, asText(item)]));
const isValidUuid = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
const extractErrorMessage = (error: unknown, fallback = 'Não foi possível enviar o cadastro.'): string => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;
    const msg = typeof err.message === 'string' && err.message ? err.message : '';
    const details = typeof err.details === 'string' && err.details ? err.details : '';
    const hint = typeof err.hint === 'string' && err.hint ? err.hint : '';
    if (msg && details) return `${msg} (${details})`;
    if (msg && hint) return `${msg} (${hint})`;
    if (msg) return msg;
    if (details) return details;
    if (typeof err.error_description === 'string' && err.error_description) return err.error_description;
  }
  return fallback;
};
const parseRegistrationDraft = (value: unknown): RegistrationDraft | null => {
  if (!isObject(value) || !isObject(value.base)
    || !Array.isArray(value.familiares)
    || !Array.isArray(value.sacramentos)
    || !Array.isArray(value.rows)
    || !value.familiares.every(row => isObject(row) && typeof row.tipo === 'string')
    || (value.contatosFamiliares !== undefined && (!Array.isArray(value.contatosFamiliares) || !value.contatosFamiliares.every(isObject)))
    || !value.sacramentos.every(row => isObject(row) && typeof row.tipo === 'string')
    || !value.rows.every(isObject)
    || typeof value.step !== 'number'
    || !Number.isInteger(value.step)
    || value.step < 1
    || value.step > 13
    || (value.draftVersion !== undefined && (typeof value.draftVersion !== 'number' || !Number.isInteger(value.draftVersion) || value.draftVersion < 1))
    || !Object.values(value.base).every(item => typeof item === 'string')
    || (value.savedAt !== undefined && typeof value.savedAt !== 'string')
    || (value.saved_at !== undefined && typeof value.saved_at !== 'string')) {
    return null;
  }

  const familiares: Familiar[] = value.familiares.map(row => {
    const fields = toTextRecord(row);
    const tipo: Familiar['tipo'] = row.tipo === 'Pai' || row.tipo === 'Mãe' || row.tipo === 'Irmão'
      ? row.tipo
      : 'Irmão';
    return {
      tipo,
      nome: fields.nome || '',
      data_nascimento: fields.data_nascimento || '',
      local_nascimento: fields.local_nascimento || '',
      estado_civil: fields.estado_civil || '',
      data_evento: fields.data_evento || '',
    };
  });
  const sacramentos: Sacrament[] = value.sacramentos.map(row => {
    const fields = toTextRecord(row);
    return {
      tipo: fields.tipo || 'Sacramento',
      data: fields.data || '',
      paroquia: fields.paroquia || '',
      diocese: fields.diocese || '',
      cidade: fields.cidade || '',
      uf: fields.uf || '',
      livro: fields.livro || '',
      folha: fields.folha || '',
      numero_registro: fields.numero_registro || '',
      celebrante: fields.celebrante || '',
      observacoes: fields.observacoes || '',
    };
  });
  const rows = value.rows.map(row => toTextRecord(row));
  const contatosFamiliares: ContatoFamiliar[] = Array.isArray(value.contatosFamiliares)
    ? value.contatosFamiliares.map(row => {
      const fields = toTextRecord(row);
      return {
        nome: fields.nome || '',
        parentesco: fields.parentesco || '',
        contato_1: fields.contato_1 || '',
        contato_2: fields.contato_2 || '',
      };
    })
    : [];
  return {
    base: toTextRecord(value.base),
    familiares,
    contatosFamiliares,
    sacramentos,
    rows,
    step: value.step,
    draftVersion: typeof value.draftVersion === 'number' ? value.draftVersion : undefined,
    savedAt: typeof value.savedAt === 'string' ? value.savedAt : undefined,
    saved_at: typeof value.saved_at === 'string' ? value.saved_at : undefined,
  };
};
const emptySacrament = (tipo: string): Sacrament => ({ tipo, data: '', paroquia: '', diocese: '', cidade: '', uf: '', livro: '', folha: '', numero_registro: '', celebrante: '', observacoes: '' });
const emptyFamiliar = (tipo: Familiar['tipo'] = 'Irmão'): Familiar => ({ tipo, nome: '', data_nascimento: '', local_nascimento: '', estado_civil: '', data_evento: '' });
const emptyContact = (): ContatoFamiliar => ({ nome: '', parentesco: '', contato_1: '', contato_2: '' });
const oldStepToNewStep = (oldStep: number): number => {
  if (oldStep <= 1) return 1;
  if (oldStep <= 3) return 2;
  if (oldStep <= 5) return 3;
  if (oldStep <= 8) return 4;
  if (oldStep <= 11) return 5;
  return 6;
};
const defaultPublicConfig: ReligiososConfigPublica = { ativo: true, titulo: 'Atualização de Dados dos Religiosos', mensagem_abertura: '', mensagem_fechamento: 'As inscrições estão temporariamente fechadas.', mensagem_confirmacao: 'Recebemos seus dados e documentos. A secretaria fará a conferência.', termos: 'Declaro a veracidade das informações e autorizo expressamente a Província BRM a realizar o tratamento dos meus dados pessoais e dados pessoais sensíveis (incluindo dados de saúde, emergência médica e histórico canônico), com a finalidade exclusiva de gestão eclesiástica, assistência à saúde e contato institucional, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).', exigir_documentos: true, instrucoes_documentos: '' };

const requiredStep1 = [
  'grau', 'nome_civil', 'data_nascimento', 'local_nascimento',
  'municipio_nascimento', 'estado_nascimento', 'pais_nascimento',
  'nacionalidade', 'cpf'
];

const formatCpf = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const CadastroReligiosoPublico: React.FC<CadastroReligiosoPublicoProps> = ({
  adminMode = false,
  memberMode = false,
  religiosoId: religiosoIdProp,
  profileReligiosoId,
  onSaved,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id: routeReligiosoId } = useParams<{ id: string }>();
  const religiosoId = religiosoIdProp || profileReligiosoId || routeReligiosoId;
  const serverDraftKey = memberMode && religiosoId
    ? `member:${religiosoId}`
    : adminMode && religiosoId ? `admin:edit:${religiosoId}` : 'admin:new';
  const [step, setStep] = useState(1);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [obras, setObras] = useState<ObraReferencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const cepRequest = useRef<AbortController | null>(null);
  const pendingDraftRef = useRef<RegistrationDraft | null>(null);
  const draftSaveInProgressRef = useRef(false);
  const draftSavePromiseRef = useRef<Promise<void>>(Promise.resolve());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profileUnavailable, setProfileUnavailable] = useState(false);
  const [documentos, setDocumentos] = useState<DocumentoSelecionado[]>([]);
  const [documentosExistentes, setDocumentosExistentes] = useState<DocumentoExistente[]>([]);
  const [fotosReligioso, setFotosReligioso] = useState<FotoReligiosoItem[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [publicConfig, setPublicConfig] = useState(defaultPublicConfig);
  const [designacoesElenco, setDesignacoesElenco] = useState<DesignacaoPortal[]>([]);
  const [erroDesignacoesElenco, setErroDesignacoesElenco] = useState<string | null>(null);
  const [familiares, setFamiliares] = useState<Familiar[]>([emptyFamiliar('Pai'), emptyFamiliar('Mãe')]);
  const [contatosFamiliares, setContatosFamiliares] = useState<ContatoFamiliar[]>([]);
  const [sacramentos, setSacramentos] = useState<Sacrament[]>([emptySacrament('Batismo'), emptySacrament('Primeira Eucaristia'), emptySacrament('Crisma')]);
  const [base, setBase] = useState<Record<string, string>>({
    grau: 'Padre', nome_civil: '', nome_religioso: '', nome_elenco: '', situacao_elenco: 'Ativo', data_nascimento: '', local_nascimento: '', municipio_nascimento: '', estado_nascimento: '', estado_nascimento_outro: '', pais_nascimento: 'Brasil', nacionalidade: 'Brasileira', cpf: '', rg: '', rg_orgao_expedidor: '', rg_data_emissao: '', titulo_eleitor: '', pis: '', cnh: '', cnh_categoria: '', passaporte: '', obra_atual_id: '', comunidade_atual_nome: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', estado_outro: '', email_institucional: '', email_pessoal: '', telefone_celular: '', whatsapp: '', redes_sociais: '', status: 'Ativo', status_cadastro: 'Aprovado',
    contato_nome: '', contato_parentesco: '', contato_1: '', contato_2: '', paroquia_origem: '', diocese_origem: '', grupo_movimento_pastoral: '', promotor_vocacional: '', plano_saude: '', numero_plano_saude: '', local_plano_saude: '', sus: '', tipo_sanguineo: '', fator_rh: '', alergias: '', medicamentos_continuos: '', medico_responsavel: '', contato_emergencia: '', informacoes_clinicas: '', cirurgias: '', proteses: '', observacoes_saude: '', consentimento_dados: '', consentimento_em: '',
  });
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaveError, setDraftSaveError] = useState<string | null>(null);
  const hojeElenco = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  const designacoesAtuais = designacoesElenco.filter(item =>
    (!item.vigencia_inicio || item.vigencia_inicio <= hojeElenco)
    && (!item.vigencia_fim || item.vigencia_fim >= hojeElenco)
  );

  const restoreDraft = useCallback((draft: RegistrationDraft, savedAt?: string) => {
    const restoredDegree = canonicalDegree(draft.base.grau || '');
    setBase(previous => ({ ...previous, ...draft.base, grau: restoredDegree }));
    setFamiliares(draft.familiares.map(row => ({
      ...row,
      estado_civil: normalizeMaritalStatus(row.tipo, row.estado_civil || ''),
    })));
    setContatosFamiliares(draft.contatosFamiliares?.length ? draft.contatosFamiliares : (
      hasAnyValues(draft.base, ['contato_nome', 'contato_parentesco', 'contato_1', 'contato_2'])
        ? [{
          nome: draft.base.contato_nome || '',
          parentesco: draft.base.contato_parentesco || '',
          contato_1: draft.base.contato_1 || '',
          contato_2: draft.base.contato_2 || '',
        }]
        : []
    ));
    setSacramentos(draft.sacramentos);
    setRows(draft.rows);
    const restoredStep = draft.draftVersion === 2
      ? Math.min(Math.max(1, draft.step), etapas.length)
      : oldStepToNewStep(draft.step);
    setStep(restoredStep);
    const savedDate = savedAt ? new Date(savedAt) : null;
    setDraftSavedAt(savedDate && !Number.isNaN(savedDate.getTime())
      ? savedDate.toLocaleString('pt-BR')
      : draft.savedAt || savedAt || null);
    setDraftRestored(true);
    setDraftSaveError(null);
  }, []);

  useEffect(() => {
    const load = async () => {
      const [{ data: obrasData }, { data: religiosoData }, { data: configData }] = await Promise.all([
        supabase.from('religiosos_obras_referencia').select('id,nome,localidade,cidade,uf,diocese,cep,logradouro,endereco,numero,complemento,bairro,estado,pais,telefone,whatsapp,email').eq('status', 'Ativa').order('nome'),
        religiosoId && (adminMode || memberMode || profileReligiosoId) ? supabase.from('religiosos').select('*').eq('id', religiosoId).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from('religiosos_configuracoes').select('ativo,titulo,mensagem_abertura,mensagem_fechamento,mensagem_confirmacao,termos,exigir_documentos,instrucoes_documentos').limit(1).maybeSingle(),
      ]);
      setObras((obrasData || []) as ObraReferencia[]);
      if (configData) setPublicConfig({ ...defaultPublicConfig, ...configData });
      if (religiosoId && (adminMode || memberMode || profileReligiosoId) && !religiosoData) {
        setProfileUnavailable(true);
        setErrorMessage('Não foi possível localizar o cadastro vinculado a esta conta. Procure a Secretaria.');
        setLoading(false);
        return;
      }
      if (religiosoData) {
        setBase(previous => ({ ...previous, ...Object.fromEntries(Object.entries(religiosoData).filter(([key]) => key in previous).map(([key, value]) => [key, value == null ? '' : String(value)])), consentimento_dados: religiosoData.consentimento_dados ? 'true' : '' }));
        if ((profileReligiosoId || memberMode) && religiosoData.status_cadastro === 'Aprovado') {
          const { data: designacoes, error: designacoesError } = await supabase
            .from('religiosos_designacoes')
            .select('id,tipo_vinculo,funcao,vigencia_inicio,vigencia_fim,ano_referencia,comunidades(nome),religiosos_obras_referencia(nome)')
            .eq('religioso_id', religiosoId);
          if (designacoesError) {
            setErroDesignacoesElenco(designacoesError.message);
            showToast.error(`Não foi possível carregar os vínculos atuais do Elenco: ${designacoesError.message}`);
          } else {
            setErroDesignacoesElenco(null);
            setDesignacoesElenco((designacoes || []) as DesignacaoPortal[]);
          }
        }
        const [familiaData, contatoData, sacramentoData, saudeData, enderecoData, origemData, vocacaoData, formacaoData, votosData, ministeriosData, academicaData, idiomasData, competenciasData, historicoData, servicosData, documentosData] = await Promise.all([
          supabase.from('religiosos_familiares').select('*').eq('religioso_id', religiosoId),
          supabase.from('religiosos_contatos_familiares').select('*').eq('religioso_id', religiosoId),
          supabase.from('religiosos_sacramentos').select('*').eq('religioso_id', religiosoId),
          supabase.from('religiosos_saude').select('*').eq('religioso_id', religiosoId).maybeSingle(),
          supabase.from('religiosos_enderecos_contatos').select('*').eq('religioso_id', religiosoId).limit(1).maybeSingle(),
          supabase.from('religiosos_origem_vocacional').select('*').eq('religioso_id', religiosoId).limit(1).maybeSingle(),
          supabase.from('religiosos_historico_vocacional').select('*').eq('religioso_id', religiosoId),
          supabase.from('religiosos_formacao_religiosa').select('*').eq('religioso_id', religiosoId),
          supabase.from('religiosos_profissoes_votos').select('*').eq('religioso_id', religiosoId),
          supabase.from('religiosos_ministerios_ordens').select('*').eq('religioso_id', religiosoId),
          supabase.from('religiosos_formacao_academica').select('*').eq('religioso_id', religiosoId),
          supabase.from('religiosos_idiomas').select('*').eq('religioso_id', religiosoId),
          supabase.from('religiosos_competencias').select('*').eq('religioso_id', religiosoId),
          supabase.from('religiosos_historico_comunidades').select('*').eq('religioso_id', religiosoId),
          supabase.from('religiosos_missoes_servicos').select('*').eq('religioso_id', religiosoId),
          supabase.from('religiosos_documentos').select('id,categoria,nome_arquivo,caminho_storage,data_cadastro').eq('religioso_id', religiosoId).eq('status', 'Ativo'),
        ]);
        if (familiaData.data?.length) setFamiliares((familiaData.data as Familiar[]).map(row => ({
          ...row,
          estado_civil: normalizeMaritalStatus(row.tipo, row.estado_civil || ''),
        })));
        if (contatoData.data?.length) setContatosFamiliares(contatoData.data.map(row => ({
          nome: row.nome || '',
          parentesco: row.parentesco || '',
          contato_1: row.contato_1 || '',
          contato_2: row.contato_2 || '',
        })));
        if (sacramentoData.data?.length) setSacramentos(sacramentoData.data as Sacrament[]);
        const origem = origemData.data;
        if (origem) setBase(previous => ({ ...previous, paroquia_origem: origem.paroquia_origem || '', diocese_origem: origem.diocese || '', grupo_movimento_pastoral: origem.grupo_movimento_pastoral || '', promotor_vocacional: origem.promotor_vocacional || '' }));
        setRows([
          ...(vocacaoData.data || []).map(row => ({ ...row, tipo: 'vocacional' })),
          ...(formacaoData.data || []).map(row => ({
            ...row,
            cidade: row.cidade || row.local || '',
            tipo: 'formacao',
            inicio: row.data_ingresso || '',
            fim: row.data_conclusao || '',
          })),
          ...(votosData.data || []).map(row => ({
            ...row,
            tipo: 'voto',
            voto_tipo: votoTypeFromDatabase[row.tipo] || row.tipo,
            renovacao: row.renovacao ? String(row.renovacao) : '',
          })),
          ...(ministeriosData.data || []).map(row => ({
            ...row,
            tipo: ['Diaconato', 'Diaconado', 'Presbiterado', 'Episcopado'].includes(row.tipo) ? 'ordem' : 'ministerio',
            ministerio: ministryTypeFromDatabase[row.tipo] || row.tipo,
          })),
          ...(academicaData.data || []).map(row => ({ ...row, tipo: 'academica' })),
          ...(idiomasData.data || []).map(row => ({ ...row, tipo: 'idioma' })),
          ...(competenciasData.data || []).map(row => ({ ...row, tipo: 'competencia' })),
          ...(historicoData.data || []).map(row => ({ ...row, tipo: 'historico', inicio: row.periodo_inicio || '', fim: row.periodo_fim || '' })),
          ...(servicosData.data || []).map(row => ({ ...row, tipo: 'servico', servico_tipo: row.tipo })),
        ]);
        const docsList = (documentosData.data || []) as DocumentoExistente[];
        setDocumentosExistentes(docsList);

        // Carregar fotos pré-existentes do religioso
        const photoDocs = docsList.filter(d => d.categoria?.toLowerCase().includes('foto') || d.categoria?.toLowerCase().includes('fotografia'));
        const loadedFotos: FotoReligiosoItem[] = [];

        for (const pDoc of photoDocs) {
          try {
            const { data: signedData } = await supabase.storage
              .from('religiosos-documentos')
              .createSignedUrl(pDoc.caminho_storage, 3600);
            if (signedData?.signedUrl) {
              const isProfile = Boolean(
                (religiosoData?.foto_path && pDoc.caminho_storage === religiosoData.foto_path) ||
                pDoc.categoria.includes('Perfil')
              );
              loadedFotos.push({
                id: pDoc.id,
                previewUrl: signedData.signedUrl,
                caminho_storage: pDoc.caminho_storage,
                isPerfil: isProfile,
                nome_arquivo: pDoc.nome_arquivo
              });
            }
          } catch (pErr) {
            console.warn('Erro ao carregar preview de foto salva:', pErr);
          }
        }

        if (religiosoData?.foto_path && !loadedFotos.some(f => f.caminho_storage === religiosoData.foto_path)) {
          try {
            const { data: signedDoc } = await supabase.storage
              .from('religiosos-documentos')
              .createSignedUrl(religiosoData.foto_path, 3600);
            if (signedDoc?.signedUrl) {
              loadedFotos.unshift({
                id: 'perfil-doc',
                previewUrl: signedDoc.signedUrl,
                caminho_storage: religiosoData.foto_path,
                isPerfil: true,
                nome_arquivo: 'foto_perfil.jpg'
              });
            } else {
              const { data: signedPerfil } = await supabase.storage
                .from('religiosos-perfil')
                .createSignedUrl(religiosoData.foto_path, 3600);
              if (signedPerfil?.signedUrl) {
                loadedFotos.unshift({
                  id: 'perfil-storage',
                  previewUrl: signedPerfil.signedUrl,
                  caminho_storage: religiosoData.foto_path,
                  isPerfil: true,
                  nome_arquivo: 'foto_perfil.jpg'
                });
              }
            }
          } catch (pErr) {
            console.warn('Erro ao carregar foto_path principal:', pErr);
          }
        }

        if (loadedFotos.length > 0) {
          if (!loadedFotos.some(f => f.isPerfil)) {
            loadedFotos[0].isPerfil = true;
          }
          setFotosReligioso(loadedFotos.slice(0, 4));
        }
        const saude = saudeData.data;
        const endereco = enderecoData.data;
        setBase(previous => ({ ...previous, ...(saude ? Object.fromEntries(Object.entries(saude).filter(([key]) => key in previous).map(([key, value]) => [key, value == null ? '' : String(value)])) : {}), ...(endereco ? { obra_atual_id: endereco.obra_id || previous.obra_atual_id, telefone_celular: endereco.celular || previous.telefone_celular, email_institucional: endereco.email || previous.email_institucional, whatsapp: endereco.whatsapp || previous.whatsapp, redes_sociais: endereco.redes_sociais || previous.redes_sociais } : {}) }));
      } else if (!adminMode && !religiosoId) {
        try {
          const savedStr = localStorage.getItem(DRAFT_KEY);
          if (savedStr) {
            const parsed = parseRegistrationDraft(JSON.parse(savedStr));
            if (parsed) restoreDraft(parsed, parsed.saved_at || parsed.savedAt);
          }
        } catch (e) {
          console.warn('Erro ao restaurar rascunho de cadastro:', e);
          setDraftSaveError('Não foi possível recuperar o rascunho salvo neste navegador.');
        }
      }

      if ((adminMode || memberMode) && user?.id) {
        let restoredFromLocal = false;
        try {
          const syncLocal = localStorage.getItem(`brm_rascunho_sync_${serverDraftKey}`);
          if (syncLocal) {
            const parsedLocal = parseRegistrationDraft(JSON.parse(syncLocal));
            if (parsedLocal) {
              restoreDraft(parsedLocal, parsedLocal.saved_at || parsedLocal.savedAt);
              restoredFromLocal = true;
            }
          }
        } catch (_) {}

        const { data: savedDraft, error: draftError } = await supabase
          .from('religiosos_rascunhos')
          .select('draft_data, updated_at')
          .eq('usuario_id', user.id)
          .eq('chave', serverDraftKey)
          .maybeSingle();
        if (draftError) {
          console.error('Falha ao recuperar rascunho do cadastro religioso:', draftError);
          if (!restoredFromLocal) {
            setDraftSaveError('Não foi possível recuperar o rascunho do sistema. Seus dados atuais não foram substituídos.');
          }
        } else if (savedDraft) {
          const parsed = parseRegistrationDraft(savedDraft.draft_data);
          if (parsed) {
            // Se o rascunho do servidor for igual ou mais recente, ou se não restaurou local
            restoreDraft(parsed, savedDraft.updated_at);
          } else if (!restoredFromLocal) {
            console.error('O rascunho do cadastro religioso está em formato inválido.');
            setDraftSaveError('O rascunho salvo está inválido. Seus dados atuais foram preservados.');
          }
        }
      }
      setLoading(false);
    };
    load().catch(error => { console.error('Erro ao carregar cadastro religioso:', error); setLoading(false); });
  }, [adminMode, memberMode, profileReligiosoId, religiosoId, restoreDraft, serverDraftKey, user?.id]);

  // Save authenticated drafts privately in Supabase and anonymous public drafts in this browser.
  useEffect(() => {
    if (loading || submitting || success) return;

    const hasContent = Boolean(
      Object.entries(base).some(([key, val]) => val?.trim() && key !== 'grau' && key !== 'pais_nascimento' && key !== 'nacionalidade' && key !== 'situacao_elenco' && key !== 'status' && key !== 'status_cadastro') ||
      contatosFamiliares.some(row => hasAnyValues(row, ['nome', 'parentesco', 'contato_1', 'contato_2'])) ||
      familiares.some(row => hasAnyValues(row, ['nome', 'data_nascimento', 'local_nascimento', 'estado_civil', 'data_evento'])) ||
      sacramentos.some(row => hasAnyValues(row, ['data', 'paroquia', 'diocese', 'cidade', 'uf', 'livro', 'folha', 'numero_registro', 'celebrante', 'observacoes'])) ||
      rows.some(row => hasAnyValues(row, Object.keys(row).filter(key => key !== 'tipo')))
    );
    if (!hasContent) return;

    // Salvar imediatamente no localStorage como proteção síncrona contra hibernação / refresh da página
    try {
      const immediateDraft: RegistrationDraft = {
        base,
        familiares,
        contatosFamiliares,
        sacramentos,
        rows,
        step,
        draftVersion: 2,
        saved_at: new Date().toISOString(),
      };
      if (adminMode || memberMode) {
        localStorage.setItem(`brm_rascunho_sync_${serverDraftKey}`, JSON.stringify(immediateDraft));
      } else {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(immediateDraft));
      }
    } catch (e) {
      // Ignora erro de cota local
    }

    const timer = setTimeout(() => {
      pendingDraftRef.current = {
        base,
        familiares,
        contatosFamiliares,
        sacramentos,
        rows,
        step,
        draftVersion: 2,
        saved_at: new Date().toISOString(),
      };

      const persistPendingDraft = async () => {
        if (draftSaveInProgressRef.current) {
          await draftSavePromiseRef.current;
          return;
        }
        draftSaveInProgressRef.current = true;
        setDraftSaving(true);
        try {
          while (pendingDraftRef.current) {
            const draft = pendingDraftRef.current;
            pendingDraftRef.current = null;
            if (adminMode || memberMode) {
              if (!user?.id) throw new Error('Sua sessão expirou. Entre novamente para salvar este rascunho com segurança.');
              const { error } = await supabase
                .from('religiosos_rascunhos')
                .upsert({
                  usuario_id: user.id,
                  chave: serverDraftKey,
                  draft_data: draft,
                  updated_at: draft.saved_at,
                }, { onConflict: 'usuario_id,chave' });
              if (error) throw error;
            } else {
              localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
            }
            setDraftSavedAt(new Date(draft.saved_at || Date.now()).toLocaleString('pt-BR'));
            setDraftSaveError(null);
          }
        } catch (error) {
          console.error('Falha ao salvar rascunho do cadastro religioso:', error);
          setDraftSaveError(
            (adminMode || memberMode)
              ? error instanceof Error && error.message.includes('sessão expirou')
                ? error.message
                : 'Não foi possível salvar no sistema. Verifique a conexão; o último autosave pode não estar atualizado.'
              : 'Não foi possível salvar neste navegador. Verifique o espaço disponível.',
          );
        } finally {
          draftSaveInProgressRef.current = false;
          setDraftSaving(false);
          if (pendingDraftRef.current) {
            draftSavePromiseRef.current = draftSavePromiseRef.current.then(() => persistPendingDraft());
          }
        }
      }
      draftSavePromiseRef.current = persistPendingDraft();
    }, 600);

    return () => clearTimeout(timer);
  }, [adminMode, base, contatosFamiliares, familiares, memberMode, religiosoId, rows, sacramentos, serverDraftKey, step, submitting, success, user?.id, loading]);

  const handleClearDraft = async () => {
    const confirmed = await confirmAction({
      title: 'Limpar Rascunho',
      badge: 'Ficha Cadastral • Formulário',
      message: 'Deseja realmente limpar o rascunho salvo e reiniciar o preenchimento?',
      detail: 'Todas as informações digitadas e ainda não enviadas serão perdidas.',
      confirmLabel: 'Limpar Formulário',
      cancelLabel: 'Cancelar',
      tone: 'warning',
      icon: 'alert'
    });
    if (!confirmed) return;

    pendingDraftRef.current = null;
    await draftSavePromiseRef.current;
    if ((adminMode || memberMode) && user?.id) {
      try {
        localStorage.removeItem(`brm_rascunho_sync_${serverDraftKey}`);
      } catch (_) {}
      const { error } = await supabase
        .from('religiosos_rascunhos')
        .delete()
        .eq('usuario_id', user.id)
        .eq('chave', serverDraftKey);
      if (error) {
        console.error('Falha ao remover rascunho do cadastro religioso:', error);
        setDraftSaveError('Não foi possível apagar o rascunho do sistema. Tente novamente.');
        return;
      }
    } else {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (error) {
        console.error('Falha ao remover rascunho local:', error);
        setDraftSaveError('Não foi possível apagar o rascunho deste navegador.');
        return;
      }
    }
    pendingDraftRef.current = null;
    setDraftSavedAt(null);
    setDraftRestored(false);
    setDraftSaveError(null);
    if (religiosoId) {
      window.location.reload();
      return;
    }
    setStep(1);
    setBase({
      grau: 'Padre', nome_civil: '', nome_religioso: '', nome_elenco: '', situacao_elenco: 'Ativo', data_nascimento: '', local_nascimento: '', municipio_nascimento: '', estado_nascimento: '', pais_nascimento: 'Brasil', nacionalidade: 'Brasileira', cpf: '', rg: '', rg_orgao_expedidor: '', rg_data_emissao: '', titulo_eleitor: '', pis: '', cnh: '', cnh_categoria: '', passaporte: '', obra_atual_id: '', comunidade_atual_nome: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', email_institucional: '', email_pessoal: '', telefone_celular: '', whatsapp: '', redes_sociais: '', status: 'Ativo', status_cadastro: 'Aprovado',
      contato_nome: '', contato_parentesco: '', contato_1: '', contato_2: '', paroquia_origem: '', diocese_origem: '', grupo_movimento_pastoral: '', promotor_vocacional: '', plano_saude: '', numero_plano_saude: '', local_plano_saude: '', sus: '', tipo_sanguineo: '', fator_rh: '', alergias: '', medicamentos_continuos: '', medico_responsavel: '', contato_emergencia: '', informacoes_clinicas: '', cirurgias: '', proteses: '', observacoes_saude: '', consentimento_dados: '', consentimento_em: '',
    });
    setFamiliares([emptyFamiliar('Pai'), emptyFamiliar('Mãe')]);
    setContatosFamiliares([]);
    setSacramentos([emptySacrament('Batismo'), emptySacrament('Primeira Eucaristia'), emptySacrament('Crisma')]);
    setRows([]);
    showToast.info('Rascunho reiniciado.');
  };

  const updateBase = (field: string, value: string) => {
    if (field === 'cep') {
      cepRequest.current?.abort();
      cepRequest.current = null;
      setCepLoading(false);
    }
    setBase(previous => ({ ...previous, [field]: value }));
    if (field === 'cep') setCepError(null);
    if (invalidFields.includes(field)) {
      setInvalidFields(previous => previous.filter(f => f !== field));
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };
  const lookupAddress = async () => {
    if (!base.cep.trim()) return;
    cepRequest.current?.abort();
    const controller = new AbortController();
    cepRequest.current = controller;
    setCepLoading(true);
    setCepError(null);
    try {
      const address = await lookupCep(base.cep, controller.signal);
      if (base.cep.replace(/\D/g, '') !== address.cep.replace(/\D/g, '')) return;
      setBase(previous => ({
        ...previous,
        cep: formatCep(address.cep),
        logradouro: address.logradouro,
        complemento: address.complemento || previous.complemento,
        bairro: address.bairro,
        cidade: address.localidade,
        estado: address.uf,
      }));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setCepError(error instanceof Error ? error.message : 'Não foi possível consultar o CEP.');
    } finally {
      if (cepRequest.current === controller) {
        cepRequest.current = null;
        setCepLoading(false);
      }
    }
  };
  const updateRow = (index: number, field: string, value: string) => setRows(previous => previous.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  const addRow = (values: Record<string, string> = {}) => setRows(previous => [...previous, values]);
  const removeRow = (index: number) => setRows(previous => previous.filter((_, rowIndex) => rowIndex !== index));
  const updateFamiliar = (index: number, field: keyof Familiar, value: string) => setFamiliares(previous => previous.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  const updateContact = (index: number, field: keyof ContatoFamiliar, value: string) => setContatosFamiliares(previous => previous.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  const updateSacrament = (index: number, field: keyof Sacrament, value: string) => setSacramentos(previous => previous.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  const handleAddPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files || []);
    if (!selected.length) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const newItems: FotoReligiosoItem[] = [];

    for (const file of selected) {
      if (fotosReligioso.length + newItems.length >= 4) {
        showToast.info('O limite máximo é de 4 fotos.', 'Limite atingido');
        break;
      }
      if (!validTypes.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
        showToast.error(`O arquivo "${file.name}" não é uma imagem aceita (use JPG, PNG ou WebP).`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast.error(`A foto "${file.name}" ultrapassa o limite de 5 MB.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        arquivo: file,
        previewUrl,
        isPerfil: false,
        nome_arquivo: file.name
      });
    }

    setFotosReligioso(previous => {
      const combined = [...previous, ...newItems].slice(0, 4);
      if (!combined.some(item => item.isPerfil) && combined.length > 0) {
        combined[0].isPerfil = true;
      }
      return combined;
    });

    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleSelectProfilePhoto = (id: string) => {
    setFotosReligioso(previous =>
      previous.map(item => ({
        ...item,
        isPerfil: item.id === id
      }))
    );
    showToast.success('Foto definida como perfil oficial da Ficha (4x4).');
  };

  const handleRemovePhoto = (id: string) => {
    setFotosReligioso(previous => {
      const target = previous.find(item => item.id === id);
      if (target?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const filtered = previous.filter(item => item.id !== id);
      if (target?.isPerfil && filtered.length > 0) {
        filtered[0].isPerfil = true;
      }
      return filtered;
    });
  };

  const handleDocumentSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files || []);
    const accepted = selected.filter(file =>
      /\.(pdf|png|jpe?g)$/i.test(file.name)
      && file.size <= 10 * 1024 * 1024
      && (!file.type || ['application/pdf', 'image/png', 'image/jpeg'].includes(file.type))
    );
    if (accepted.length !== selected.length) {
      const message = 'Selecione arquivos PDF, PNG ou JPG de até 10 MB.';
      setErrorMessage(message);
      showToast.error(message);
    }
    if (accepted.length) {
      setDocumentos(previous => [...previous, ...accepted.map(arquivo => ({ arquivo, categoria: 'Outros' }))]);
    }
    event.currentTarget.value = '';
  };
  const removeExistingDocument = async (documento: DocumentoExistente) => {
    const confirmed = await confirmAction({
      title: 'Excluir Anexo Oficial',
      badge: 'Documentação • Anexos',
      message: `Deseja realmente excluir o documento "${documento.nome_arquivo}"?`,
      detail: 'O arquivo será apagado do armazenamento seguro.',
      confirmLabel: 'Excluir Arquivo',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      icon: 'trash'
    });
    if (!confirmed) return;

    const storageResult = await supabase.storage.from('religiosos-documentos').remove([documento.caminho_storage]);
    if (storageResult.error) { 
      setErrorMessage(storageResult.error.message); 
      showToast.error(`Erro ao remover arquivo: ${storageResult.error.message}`);
      return; 
    }
    const { error } = await supabase.from('religiosos_documentos').delete().eq('id', documento.id);
    if (error) { 
      setErrorMessage(error.message); 
      showToast.error(`Erro ao excluir registro: ${error.message}`);
      return; 
    }
    setDocumentosExistentes(previous => previous.filter(item => item.id !== documento.id));
    showToast.success(`Documento "${documento.nome_arquivo}" excluído.`);
  };

  const validateStep = (targetStep = step) => {
    if (targetStep === 1) {
      const missing = requiredStep1.filter(field => !base[field]?.trim());
      if (missing.length > 0) {
        setInvalidFields(missing);
        const missingLabels = missing.map(f => f === 'estado_nascimento_outro' ? 'Outro estado de nascimento' : getFieldLabel(f)).join(', ');
        return `Por favor, preencha os campos obrigatórios da identificação: ${missingLabels}.`;
      }
      if (base.estado_nascimento === OTHER_LOCATION_VALUE && !base.estado_nascimento_outro?.trim()) {
        setInvalidFields(['estado_nascimento_outro']);
        return 'Informe o estado de nascimento selecionado como “Outro”.';
      }
      if (!validateCpf(base.cpf)) {
        setInvalidFields(['cpf']);
        return 'CPF inválido. Por favor, confira os 11 dígitos do CPF.';
      }
      setInvalidFields([]);
      const invalidEmail = [base.email_institucional, base.email_pessoal].find(email => email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      if (invalidEmail) return 'Confira o formato do endereço de e-mail informado.';
    }
    if (targetStep === 2) {
      if (familiares.some(row => hasAnyValues(row, ['nome', 'data_nascimento', 'local_nascimento', 'estado_civil', 'data_evento']) && !row.nome.trim())) {
        return 'Informe o nome de cada familiar que começou a preencher.';
      }
      if (contatosFamiliares.some(row => hasAnyValues(row, ['nome', 'parentesco', 'contato_1', 'contato_2']) && !row.nome.trim())) {
        return 'Informe o nome de cada contato familiar adicionado.';
      }
    }
    if (targetStep === 3) {
      if (rows.some(row => row.tipo === 'vocacional' && hasAnyValues(row, ['ano', 'data', 'titulo', 'descricao', 'local', 'responsavel']) && !row.titulo?.trim())) {
        return 'Informe o título de cada evento vocacional iniciado.';
      }
      if (rows.some(row => row.tipo === 'formacao' && hasAnyValues(row, ['etapa', 'instituicao', 'cidade', 'local', 'inicio', 'fim', 'formador']) && !row.etapa?.trim())) {
        return 'Selecione a etapa de cada formação iniciada.';
      }
      if (rows.some(row => row.tipo === 'voto' && hasAnyValues(row, ['voto_tipo', 'renovacao', 'data', 'local', 'celebrante']) && !row.voto_tipo?.trim())) {
        return 'Selecione o tipo de cada profissão ou voto iniciado.';
      }
      if (rows.some(row => row.tipo === 'voto' && row.voto_tipo === 'Renovação de Votos' && !row.renovacao?.trim())) {
        return 'Selecione o número da renovação de votos.';
      }
    }
    if (targetStep === 4) {
      if (rows.some(row => ['ministerio', 'ordem'].includes(row.tipo) && hasAnyValues(row, ['ministerio', 'data', 'local', 'celebrante', 'bispo_ordenante']) && !row.ministerio?.trim())) {
        return 'Selecione o ministério ou grau da ordem para cada registro iniciado.';
      }
      if (rows.some(row => row.tipo === 'academica' && hasAnyValues(row, ['categoria', 'instituicao', 'periodo', 'pais', 'cidade', 'estado', 'observacoes']) && !row.categoria?.trim())) {
        return 'Selecione a categoria de cada formação acadêmica iniciada.';
      }
      if (rows.some(row => row.tipo === 'idioma' && hasAnyValues(row, ['idioma', 'nivel', 'fala', 'audicao', 'leitura', 'escrita', 'observacoes']) && !row.idioma?.trim())) {
        return 'Informe o idioma de cada registro iniciado.';
      }
      if (rows.some(row => row.tipo === 'competencia' && hasAnyValues(row, ['competencia', 'nivel', 'observacoes']) && !row.competencia?.trim())) {
        return 'Informe a competência de cada registro iniciado.';
      }
      if (rows.some(row => row.tipo === 'academica' && row.estado === OTHER_LOCATION_VALUE && !row.estado_outro?.trim())) {
        return 'Informe o estado da formação acadêmica selecionado como “Outro”.';
      }
    }
    if (targetStep === 5) {
      if (rows.some(row => row.tipo === 'historico' && hasAnyValues(row, ['instituicao', 'funcao', 'inicio', 'fim', 'local', 'observacoes']) && !row.instituicao?.trim())) {
        return 'Informe a instituição de cada registro do histórico iniciado.';
      }
      if (rows.some(row => row.tipo === 'servico' && hasAnyValues(row, ['servico_tipo', 'instituicao', 'funcao', 'periodo', 'local', 'documento', 'observacao']) && !row.servico_tipo?.trim())) {
        return 'Selecione o tipo de cada missão ou serviço iniciado.';
      }
      if (base.estado === OTHER_LOCATION_VALUE && !base.estado_outro?.trim()) {
        return 'Informe o estado do endereço atual selecionado como “Outro”.';
      }
    }
    if (targetStep === 6 && ((publicConfig.exigir_documentos && !documentos.length && !documentosExistentes.length) || !base.consentimento_dados)) {
      return `${publicConfig.exigir_documentos ? 'Anexe pelo menos um documento e ' : ''}confirme a autorização.`;
    }
    return null;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (profileUnavailable) {
      setErrorMessage('A ficha vinculada não foi carregada; não é possível enviar alterações com segurança.');
      return;
    }
    for (let stepIndex = 1; stepIndex <= etapas.length; stepIndex += 1) {
      const validation = validateStep(stepIndex);
      if (validation) {
        setStep(stepIndex);
        setErrorMessage(validation);
        return;
      }
    }
    setSubmitting(true); setErrorMessage(null);
    try {
      const isEditing = Boolean(religiosoId);
      const obraIdSanitized = isValidUuid(base.obra_atual_id) ? base.obra_atual_id.trim() : null;

      const religiosoPayload: Record<string, unknown> = {
        grau: base.grau, nome_civil: base.nome_civil, nome_religioso: base.nome_religioso || null,
        ...(adminMode || (memberMode && !religiosoId) ? {
          nome_elenco: base.nome_elenco || base.nome_religioso || base.nome_civil || null,
          cadastro_elenco_provisorio: !adminMode,
        } : {}),
        data_nascimento: base.data_nascimento?.trim() ? base.data_nascimento.trim() : null,
        local_nascimento: base.local_nascimento || null,
        municipio_nascimento: base.municipio_nascimento || null,
        estado_nascimento: base.estado_nascimento === OTHER_LOCATION_VALUE ? base.estado_nascimento_outro || null : base.estado_nascimento || null,
        pais_nascimento: base.pais_nascimento || null, nacionalidade: base.nacionalidade || null,
        cpf: base.cpf || null, rg: base.rg || null, rg_orgao_expedidor: base.rg_orgao_expedidor || null,
        rg_data_emissao: base.rg_data_emissao?.trim() ? base.rg_data_emissao.trim() : null,
        titulo_eleitor: base.titulo_eleitor || null,
        pis: base.pis || null, cnh: base.cnh || null, cnh_categoria: base.cnh_categoria || null,
        passaporte: base.passaporte || null,
        comunidade_atual_nome: base.comunidade_atual_nome || null,
        obra_atual_id: obraIdSanitized,
        email_institucional: base.email_institucional || null,
        email_pessoal: base.email_pessoal || null, telefone_celular: base.telefone_celular || null,
        whatsapp: base.whatsapp || null,
        ...(!memberMode ? {
          ...(isEditing ? {} : { origem_cadastro: adminMode ? 'admin' : 'publico' }),
          ...(isEditing ? (base.status_cadastro ? { status_cadastro: base.status_cadastro } : {}) : { status_cadastro: adminMode ? 'Aprovado' : 'Em revisão' }),
          status: adminMode ? (base.status || 'Ativo') : 'Ativo',
          consentimento_dados: true,
          consentimento_em: base.consentimento_em || new Date().toISOString(),
        } : {}),
      };

      const familiaresPayload = familiares.filter(row => row.nome.trim()).map(row => ({
        tipo: row.tipo,
        nome: row.nome,
        data_nascimento: row.data_nascimento || null,
        local_nascimento: row.local_nascimento || null,
        estado_civil: row.estado_civil || null,
        data_evento: row.estado_civil?.startsWith('Falecid') ? row.data_evento || null : null,
      }));

      const contatosFamiliaresPayload = contatosFamiliares.filter(row => row.nome.trim()).map(row => ({
        nome: row.nome,
        parentesco: row.parentesco || null,
        contato_1: row.contato_1 || null,
        contato_2: row.contato_2 || null,
      }));

      const sacramentosPayload = sacramentos.filter(row => Object.values(row).some(value => value && value !== row.tipo)).map(row => ({
        tipo: row.tipo,
        data: row.data || null,
        paroquia: row.paroquia || null,
        diocese: row.diocese || null,
        cidade: row.cidade || null,
        uf: row.uf || null,
        livro: row.livro || null,
        folha: row.folha || null,
        numero_registro: row.numero_registro || null,
        celebrante: row.celebrante || null,
        observacoes: row.observacoes || null,
      }));

      const origemVocacionalPayload = {
        paroquia_origem: base.paroquia_origem || null,
        diocese: base.diocese_origem || null,
        grupo_movimento_pastoral: base.grupo_movimento_pastoral || null,
        promotor_vocacional: base.promotor_vocacional || null,
      };

      const historicoVocacionalPayload = rows.filter(row => row.tipo === 'vocacional').map(row => ({
        data_evento: row.data || null,
        ano: row.ano ? Number(row.ano) : null,
        titulo: row.titulo,
        descricao: row.descricao,
        local: row.local,
        responsavel: row.responsavel,
      }));

      const formacaoReligiosaPayload = rows.filter(row => row.tipo === 'formacao').map(row => ({
        etapa: row.etapa,
        instituicao: row.instituicao,
        cidade: row.cidade || row.local,
        local: row.local || row.cidade,
        data_ingresso: row.inicio || null,
        data_conclusao: row.fim || null,
        formador: row.formador,
      }));

      const profissoesVotosPayload = rows.filter(row => row.tipo === 'voto').map(row => ({
        tipo: votoTypeToDatabase[row.voto_tipo] || row.voto_tipo,
        renovacao: (row.voto_tipo === 'Renovação de Votos' || row.voto_tipo === 'Voto temporário') && row.renovacao ? Number(row.renovacao) : null,
        data: row.data || null,
        local: row.local || null,
        celebrante: row.celebrante || null,
      }));

      const ministeriosOrdensPayload = rows.filter(row => row.tipo === 'ministerio' || row.tipo === 'ordem').map(row => ({
        tipo: ministryTypeToDatabase[row.ministerio] || row.ministerio,
        data: row.data || null,
        local: row.local || null,
        celebrante: row.celebrante || null,
        bispo_ordenante: row.bispo_ordenante || null,
      }));

      const formacaoAcademicaPayload = rows.filter(row => row.tipo === 'academica').map(row => ({
        categoria: row.categoria,
        instituicao: row.instituicao,
        periodo: row.periodo,
        pais: row.pais || null,
        cidade: row.cidade,
        estado: row.estado,
        observacoes: row.observacoes,
      }));

      const idiomasPayload = rows.filter(row => row.tipo === 'idioma').map(row => ({
        idioma: row.idioma,
        nivel: row.nivel,
        fala: row.fala,
        audicao: row.audicao,
        leitura: row.leitura,
        escrita: row.escrita,
        observacoes: row.observacoes,
      }));

      const competenciasPayload = rows.filter(row => row.tipo === 'competencia').map(row => ({
        competencia: row.competencia,
        observacoes: row.observacoes,
      }));

      const historicoComunidadesPayload = rows.filter(row => row.tipo === 'historico').map(row => ({
        periodo_inicio: row.inicio || null,
        periodo_fim: row.fim || null,
        instituicao: row.instituicao,
        funcao: row.funcao,
        local: row.local,
        observacoes: row.observacoes,
      }));

      const missoesServicosPayload = rows.filter(row => row.tipo === 'servico').map(row => ({
        tipo: row.servico_tipo,
        instituicao: row.instituicao,
        funcao: row.funcao,
        periodo: row.periodo,
        local: row.local,
        documento: row.documento,
        observacao: row.observacao,
      }));

      const enderecosContatosPayload = {
        obra_id: obraIdSanitized,
        cep: base.cep?.trim() || null,
        logradouro: base.logradouro?.trim() || null,
        numero: base.numero?.trim() || null,
        complemento: base.complemento?.trim() || null,
        bairro: base.bairro?.trim() || null,
        cidade: base.cidade?.trim() || null,
        estado: (base.estado === OTHER_LOCATION_VALUE ? base.estado_outro : base.estado)?.trim() || null,
        pais: base.pais_nascimento?.trim() || 'Brasil',
        celular: base.telefone_celular?.trim() || null,
        telefone: base.telefone_celular?.trim() || null,
        email: (base.email_institucional || base.email_pessoal)?.trim() || null,
        whatsapp: base.whatsapp?.trim() || null,
        redes_sociais: base.redes_sociais?.trim() || null,
      };

      const saudePayload = {
        plano_saude: base.plano_saude?.trim() || null,
        numero_plano_saude: base.numero_plano_saude?.trim() || null,
        local_plano_saude: base.local_plano_saude?.trim() || null,
        sus: base.sus?.trim() || null,
        tipo_sanguineo: base.tipo_sanguineo?.trim() || null,
        fator_rh: ['Positivo', 'Negativo', '+', '-', 'Não informado'].includes(base.fator_rh?.trim()) ? base.fator_rh.trim() : null,
        alergias: base.alergias?.trim() || null,
        medicamentos_continuos: base.medicamentos_continuos?.trim() || null,
        medico_responsavel: base.medico_responsavel?.trim() || null,
        contato_emergencia: base.contato_emergencia?.trim() || null,
        informacoes_clinicas: base.informacoes_clinicas?.trim() || null,
        cirurgias: base.cirurgias?.trim() || null,
        proteses: base.proteses?.trim() || null,
        observacoes: base.observacoes_saude?.trim() || null,
      };

      let id: string;
      const { data: rpcData, error: rpcError } = await supabase.rpc('salvar_ficha_religioso', {
        p_payload: {
          religioso_id: religiosoId || null,
          base: religiosoPayload,
          familiares: familiaresPayload,
          contatos_familiares: contatosFamiliaresPayload,
          sacramentos: sacramentosPayload,
          origem_vocacional: origemVocacionalPayload,
          historico_vocacional: historicoVocacionalPayload,
          formacao_religiosa: formacaoReligiosaPayload,
          profissoes_votos: profissoesVotosPayload,
          ministerios_ordens: ministeriosOrdensPayload,
          formacao_academica: formacaoAcademicaPayload,
          idiomas: idiomasPayload,
          competencias: competenciasPayload,
          historico_comunidades: historicoComunidadesPayload,
          missoes_servicos: missoesServicosPayload,
          enderecos_contatos: enderecosContatosPayload,
          saude: saudePayload,
        }
      });

      if (!rpcError && rpcData && typeof rpcData === 'object' && 'id' in rpcData) {
        id = String((rpcData as { id: string }).id);
      } else {
        if (rpcError) {
          console.warn('RPC salvar_ficha_religioso não respondeu com sucesso; acionando fallback direto:', rpcError);
        }
        // Fallback direto caso a RPC ainda não esteja instalada no banco
        const payloadToUpdate = { ...religiosoPayload };
        let parentRequest = religiosoId
          ? await supabase.from('religiosos').update(payloadToUpdate).eq('id', religiosoId).select('id').single()
          : await supabase.from('religiosos').insert(payloadToUpdate).select('id').single();

        // Se falhar devido a colunas ausentes no cache ou foreign key legada (ex: obra_atual_id apontando para tabela antiga 'obras')
        let retryCount = 0;
        while (parentRequest.error && typeof parentRequest.error.message === 'string' && retryCount < 10) {
          const errMsg = parentRequest.error.message;
          const matchCol = errMsg.match(/Could not find the '([^']+)' column of 'religiosos'/i);
          if (matchCol && matchCol[1] && matchCol[1] in payloadToUpdate) {
            console.warn(`Coluna '${matchCol[1]}' não existe em 'religiosos'. Tentando novamente sem ela...`);
            delete payloadToUpdate[matchCol[1]];
            parentRequest = religiosoId
              ? await supabase.from('religiosos').update(payloadToUpdate).eq('id', religiosoId).select('id').single()
              : await supabase.from('religiosos').insert(payloadToUpdate).select('id').single();
            retryCount++;
          } else if (errMsg.includes('religiosos_obra_atual_id_fkey') || (errMsg.includes('obra_atual_id') && errMsg.includes('obras'))) {
            console.warn("obra_atual_id violou foreign key legada com a tabela 'obras'. Tentando novamente com obra_atual_id nulo...");
            delete payloadToUpdate.obra_atual_id;
            parentRequest = religiosoId
              ? await supabase.from('religiosos').update(payloadToUpdate).eq('id', religiosoId).select('id').single()
              : await supabase.from('religiosos').insert(payloadToUpdate).select('id').single();
            retryCount++;
          } else {
            break;
          }
        }

        const { data: religioso, error: religiosoError } = parentRequest;
        if (religiosoError || !religioso) {
          console.error('Erro ao atualizar ou inserir registro em religiosos:', religiosoError);
          throw religiosoError || rpcError || new Error('Não foi possível salvar os dados do religioso.');
        }
        id = religioso.id;
        const insertMany = async (table: string, values: Record<string, unknown>[]) => {
          const filtered = values.filter(value => Object.values(value).some(item => item !== '' && item !== null && item !== undefined));
          if (!filtered.length) return;
          let insertPayload: Record<string, unknown>[] = filtered.map(value => ({ ...value, religioso_id: id }));

          let subRetry = 0;
          while (subRetry < 10) {
            const { error } = await supabase.from(table).insert(insertPayload);
            if (!error) break;

            const errMsg = typeof error?.message === 'string' ? error.message : '';
            const matchCol = errMsg.match(/Could not find the '([^']+)' column of '([^']+)'/i);
            if (matchCol && matchCol[1]) {
              const missingCol = matchCol[1];
              console.warn(`Coluna '${missingCol}' não existe na tabela '${table}'. Removendo do payload e tentando novamente...`);
              insertPayload = insertPayload.map(item => {
                const copy = { ...item };
                delete copy[missingCol];
                return copy;
              });
              subRetry++;
              continue;
            }

            if (errMsg.includes('obra_id') || errMsg.includes('fkey')) {
              console.warn(`Tentando reinserir em ${table} sem obra_id devido a foreign key legada:`, errMsg);
              insertPayload = insertPayload.map(item => {
                const copy = { ...item };
                delete copy.obra_id;
                return copy;
              });
              subRetry++;
              continue;
            }

            // Se a tabela inteira não existir no banco, apenas registra aviso e segue para não travar o cadastro principal
            if (errMsg.includes('relation') || errMsg.includes('does not exist') || errMsg.includes('schema cache')) {
              console.warn(`Aviso: tabela '${table}' indisponível no banco (${errMsg}). Prosseguindo com os demais registros.`);
              break;
            }

            console.error(`Erro ao inserir em ${table}:`, error);
            throw error;
          }
        };
        if (religiosoId) {
          for (const table of ['religiosos_familiares', 'religiosos_contatos_familiares', 'religiosos_sacramentos', 'religiosos_historico_vocacional', 'religiosos_origem_vocacional', 'religiosos_formacao_religiosa', 'religiosos_profissoes_votos', 'religiosos_ministerios_ordens', 'religiosos_formacao_academica', 'religiosos_idiomas', 'religiosos_competencias', 'religiosos_historico_comunidades', 'religiosos_missoes_servicos', 'religiosos_enderecos_contatos', 'religiosos_saude']) {
            try {
              const { error } = await supabase.from(table).delete().eq('religioso_id', id);
              if (error) {
                console.warn(`Aviso ao limpar ${table}:`, error.message);
              }
            } catch (delErr) {
              console.warn(`Não foi possível limpar a tabela ${table}:`, delErr);
            }
          }
        }
        await insertMany('religiosos_familiares', familiaresPayload);
        await insertMany('religiosos_contatos_familiares', contatosFamiliaresPayload);
        await insertMany('religiosos_sacramentos', sacramentosPayload);
        await insertMany('religiosos_origem_vocacional', [origemVocacionalPayload]);
        await insertMany('religiosos_historico_vocacional', historicoVocacionalPayload);
        await insertMany('religiosos_formacao_religiosa', formacaoReligiosaPayload);
        await insertMany('religiosos_profissoes_votos', profissoesVotosPayload);
        await insertMany('religiosos_ministerios_ordens', ministeriosOrdensPayload);
        await insertMany('religiosos_formacao_academica', formacaoAcademicaPayload);
        await insertMany('religiosos_idiomas', idiomasPayload);
        await insertMany('religiosos_competencias', competenciasPayload);
        await insertMany('religiosos_historico_comunidades', historicoComunidadesPayload);
        await insertMany('religiosos_missoes_servicos', missoesServicosPayload);
        await insertMany('religiosos_enderecos_contatos', [enderecosContatosPayload]);
        await insertMany('religiosos_saude', [saudePayload]);
      }
      for (const documento of documentos) {
        const safeName = documento.arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const path = `${id}/${uniqueId}-${safeName}`;
        const upload = await supabase.storage.from('religiosos-documentos').upload(path, documento.arquivo);
        if (upload.error) {
          console.error('Falha ao enviar arquivo para o Storage:', upload.error);
          throw new Error(`Falha no upload do documento "${documento.arquivo.name}": ${upload.error.message}`);
        }
        const { error } = await supabase.from('religiosos_documentos').insert({
          religioso_id: id,
          categoria: documento.categoria,
          nome_arquivo: documento.arquivo.name,
          caminho_storage: path,
          mime_type: documento.arquivo.type,
          tamanho_bytes: documento.arquivo.size,
          quem_cadastrou: adminMode ? 'Administrador' : memberMode ? 'Confrade - Portal' : 'Religioso - cadastro público',
        });
        if (error) {
          console.error('Falha ao registrar documento no banco:', error);
          throw new Error(`Não foi possível salvar o registro do documento "${documento.arquivo.name}": ${error.message}`);
        }
      }

      // Processamento e persistência das fotografias oficiais
      let chosenProfileStoragePath: string | null = fotosReligioso.find(f => f.isPerfil && f.caminho_storage)?.caminho_storage || base.foto_path || null;

      for (const foto of fotosReligioso) {
        if (foto.arquivo) {
          const safeName = foto.arquivo.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const uniqueId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          const path = `${id}/fotos/${uniqueId}-${safeName}`;

          const upload = await supabase.storage.from('religiosos-documentos').upload(path, foto.arquivo, { upsert: true });
          if (!upload.error) {
            await supabase.from('religiosos_documentos').insert({
              religioso_id: id,
              categoria: foto.isPerfil ? 'Fotografia (Perfil Oficial 4x4)' : 'Fotografia',
              nome_arquivo: foto.arquivo.name,
              caminho_storage: path,
              mime_type: foto.arquivo.type,
              tamanho_bytes: foto.arquivo.size,
              status: 'Ativo',
              quem_cadastrou: adminMode ? 'Administrador' : memberMode ? 'Confrade - Portal' : 'Religioso - cadastro público',
            });
            if (foto.isPerfil) {
              chosenProfileStoragePath = path;
            }
          } else {
            console.warn('Erro ao enviar foto oficial:', upload.error);
          }
        } else if (foto.caminho_storage && foto.isPerfil) {
          chosenProfileStoragePath = foto.caminho_storage;
        }
      }

      if (chosenProfileStoragePath) {
        await supabase.from('religiosos').update({ foto_path: chosenProfileStoragePath }).eq('id', id);
        if (user?.id) {
          await supabase.from('portal_perfis_religiosos').update({ foto_path: chosenProfileStoragePath }).eq('auth_user_id', user.id);
        }
      }

      pendingDraftRef.current = null;
      await draftSavePromiseRef.current;
      if ((adminMode || memberMode) && user?.id) {
        const { error: draftDeleteError } = await supabase
          .from('religiosos_rascunhos')
          .delete()
          .eq('usuario_id', user.id)
          .eq('chave', serverDraftKey);
        if (draftDeleteError) {
          console.error('Cadastro foi enviado, mas o rascunho não pôde ser removido:', draftDeleteError);
          showToast.warning('Cadastro enviado. Não foi possível remover o rascunho salvo; use “Limpar rascunho” depois.', 'Rascunho preservado');
        }
      } else {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch (error) {
          console.error('Cadastro foi enviado, mas o rascunho local não pôde ser removido:', error);
          showToast.warning('Cadastro enviado, mas o rascunho não pôde ser removido deste navegador.', 'Rascunho preservado');
        }
      }
      setDraftSavedAt(null);
      setDraftRestored(false);
      if (adminMode) navigate('/religiosos');
      else if (memberMode) onSaved?.();
      else setSuccess(true);
    } catch (error) {
      console.error('Erro detalhado ao enviar cadastro de religioso:', error);
      const message = extractErrorMessage(error);
      setErrorMessage(message);
      showToast.error(message);
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <PublicShell>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#226380]" />
          <span className="text-sm font-medium text-[#707070]">Carregando formulário...</span>
        </div>
      </PublicShell>
    );
  }

  if (!adminMode && !memberMode && !publicConfig.ativo) {
    return (
      <PublicShell>
        <div className="max-w-xl mx-auto rounded-[6px] bg-white dark:bg-[#161b22] p-10 text-center border border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-white font-serif">Inscrições fechadas</h1>
          <p className="mt-3 text-sm text-[#707070] dark:text-[#86868b] leading-relaxed">{publicConfig.mensagem_fechamento}</p>
        </div>
      </PublicShell>
    );
  }

  if (success) {
    return (
      <PublicShell>
        <div className="max-w-xl mx-auto rounded-[6px] bg-white dark:bg-[#161b22] p-10 text-center border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-center w-16 h-16 rounded-[6px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-white font-serif">Cadastro enviado com sucesso</h1>
          <p className="mt-3 text-sm text-[#707070] dark:text-[#86868b] leading-relaxed">{publicConfig.mensagem_confirmacao}</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/portal-religioso"
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
            >
              Acessar Área do Religioso
            </Link>
          </div>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <form onSubmit={submit} className="w-full max-w-6xl mx-auto rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-4 sm:p-10 transition-colors">
        {/* Apple Cathedral Header */}
        <header className="mb-8 pb-6 border-b border-[#e5e5ea] dark:border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center shrink-0">
                <img src="/logo-sistema.png" alt="BRM" className="h-10 w-auto object-contain dark:hidden" />
                <img src="/logo-branco.png" alt="BRM" className="h-10 w-auto object-contain hidden dark:block" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#226380]">Província BRM</p>
                <p className="text-xs text-[#707070] dark:text-[#86868b]">Ficha Cadastral Oficial</p>
              </div>
            </div>

            <div className="flex items-center gap-2 no-print">
              {!adminMode && (
                <Link
                  to="/portal-religioso"
                  className="px-3.5 py-2 text-xs font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <span>Área do Religioso</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-medium bg-slate-50 dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 text-[#1d1d1f] dark:text-white flex items-center gap-2 cursor-pointer transition-colors border border-slate-200 dark:border-slate-800 rounded-[6px]"
                title="Imprimir ou Salvar Ficha em PDF"
              >
                <Printer className="w-3.5 h-3.5 text-[#707070] dark:text-[#86868b]" />
                <span>Imprimir Ficha</span>
              </button>
            </div>
          </div>

          <div className="text-center mt-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-white font-serif">
              {adminMode ? (religiosoId ? 'Editar Religioso' : 'Novo Religioso') : publicConfig.titulo}
            </h1>
            {!adminMode && publicConfig.mensagem_abertura && (
              <p className="mx-auto mt-2 max-w-2xl text-sm text-[#707070] dark:text-[#86868b] leading-relaxed">
                {publicConfig.mensagem_abertura}
              </p>
            )}
          </div>
        </header>

        {(draftSavedAt || draftRestored || draftSaving || draftSaveError) && (
          <div className={`mb-6 flex flex-col gap-3 rounded-[6px] border px-4 py-3 text-xs no-print sm:flex-row sm:items-center sm:justify-between ${
            draftSaveError
              ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
              : 'border-[#226380]/20 bg-[#226380]/5 text-[#226380] dark:text-[#A3C3C7]'
          }`}>
            <div className="flex items-center gap-2">
              {draftSaveError
                ? <AlertCircle className="h-4 w-4 shrink-0" />
                : draftSaving
                  ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  : <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
              <div>
                <p className="font-semibold">
                  {draftSaveError || (draftSaving
                    ? 'Salvando rascunho…'
                    : `${draftRestored ? 'Rascunho recuperado. ' : ''}Salvo automaticamente${draftSavedAt ? ` em ${draftSavedAt}` : ''}.`)}
                </p>
                {!adminMode && !memberMode && (
                  <p className="mt-1 text-[11px] opacity-80">
                    Este rascunho fica apenas neste navegador. Por segurança, use um dispositivo confiável.
                  </p>
                )}
                {draftRestored && (
                  <p className="mt-1 text-[11px] opacity-80">
                    Os dados do formulário foram recuperados; os arquivos novos não fazem parte do rascunho e precisam ser selecionados novamente.
                  </p>
                )}
              </div>
            </div>
            {(draftSavedAt || draftRestored) && (
              <button
                type="button"
                onClick={handleClearDraft}
                className="self-start text-[11px] font-semibold underline transition-colors hover:opacity-75 sm:self-center"
              >
                {religiosoId ? 'Descartar rascunho e recarregar ficha' : 'Limpar rascunho'}
              </button>
            )}
          </div>
        )}

        <div className="mb-6 rounded-[6px] border border-[#226380]/15 bg-[#226380]/[0.04] p-4 sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#707070] dark:text-[#a1a1a6]">
                Etapa {step} de {etapas.length}
              </span>
              <p className="mt-0.5 text-sm font-semibold text-[#1d1d1f] dark:text-white">
                {etapas[step - 1]}
              </p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-[#226380] dark:text-[#A3C3C7]">
              {Math.round((step / etapas.length) * 100)}%
            </span>
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#226380]/10"
            role="progressbar"
            aria-label="Progresso do cadastro"
            aria-valuemin={1}
            aria-valuemax={etapas.length}
            aria-valuenow={step}
          >
            <div
              className="h-full rounded-full bg-[#226380] transition-[width] duration-300"
              style={{ width: `${(step / etapas.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Stepper detalhado para telas maiores */}
        <div className="mb-8 hidden overflow-x-auto pb-2 -mx-2 px-2 sm:block">
          <div className="flex items-center gap-2 min-w-max">
            {etapas.map((label, index) => ({ label, stepIndex: index + 1 }))
              .map(({ label, stepIndex }) => {
              const complete = step > stepIndex;
              const active = step === stepIndex;
              const isPast = stepIndex < step;
              return (
                <button
                  type="button"
                  key={label}
                  disabled={!isPast && !active}
                  onClick={() => {
                    if (isPast) {
                      setErrorMessage(null);
                      setStep(stepIndex);
                    }
                  }}
                  className={`inline-flex items-center gap-2 rounded-[6px] px-3.5 py-1.5 text-xs font-medium transition-all border ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                      : complete
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-500/30 cursor-pointer hover:bg-emerald-100'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-slate-800 text-[#707070] dark:text-[#86868b] opacity-40 cursor-not-allowed'}`}
                >
                  <span className={`flex h-4 w-4 items-center justify-center rounded-[4px] text-[10px] font-bold ${active ? 'bg-white/20 text-white' : complete ? 'text-emerald-600' : 'text-[#707070]'}`}>
                    {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : stepIndex}
                  </span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 flex items-center gap-2.5 rounded-[6px] bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 p-4 text-xs font-medium text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {(profileReligiosoId || memberMode) && (
          <section className="mb-7 rounded-[6px] border border-[#226380]/20 bg-[#226380]/[0.04] p-4 dark:border-[#A3C3C7]/20 dark:bg-[#A3C3C7]/[0.04]">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Elenco BRM vinculado à sua conta</h2>
                <p className="mt-1 text-xs text-[#707070] dark:text-[#a1a1a6]">
                  {base.nome_elenco || base.nome_religioso || base.nome_civil || 'Cadastro do Elenco'}
                  {base.situacao_elenco === 'Ausente' ? ' · Ausente' : ''}
                </p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-[#226380] dark:bg-white/10 dark:text-[#A3C3C7]">Dados mantidos pela Secretaria</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {erroDesignacoesElenco ? (
                <p className="text-xs text-rose-600 dark:text-rose-400">Não foi possível carregar as designações do Elenco: {erroDesignacoesElenco}</p>
              ) : designacoesAtuais.map(item => {
                  const destino = item.comunidades?.[0]?.nome || item.religiosos_obras_referencia?.[0]?.nome || 'Destino pendente';
                  return (
                    <div key={item.id} className="rounded-[6px] border border-[#226380]/10 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
                      <p className="text-xs font-semibold text-[#1d1d1f] dark:text-white">{destino}</p>
                      <p className="mt-1 text-[11px] text-[#707070] dark:text-[#a1a1a6]">{item.funcao} · {item.tipo_vinculo} · {item.ano_referencia}</p>
                    </div>
                  );
                })}
              {!erroDesignacoesElenco && !designacoesAtuais.length && (
                  <p className="text-xs text-[#707070] dark:text-[#a1a1a6]">
                    {base.status_cadastro === 'Aprovado'
                      ? 'A Secretaria ainda não registrou uma designação vigente para este cadastro.'
                      : 'As designações do Elenco serão exibidas após a aprovação do Cadastro BRM.'}
                  </p>
                )}
            </div>
          </section>
        )}

        {/* Step Contents */}
        {step === 1 && (
          <Section title="1. Identificação e Contatos">
            {/* Bloco de Fotografias Oficiais do Religioso (Até 4 fotos com seleção 4x4) */}
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#161b22]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#226380]/10 text-[#226380] dark:bg-[#68a9c7]/15 dark:text-[#68a9c7]">
                    <Camera className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Fotografias Oficiais do Religioso
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Envie até 4 fotos e escolha qual será a foto oficial da sua ficha cadastral (formato 4x4)
                    </p>
                  </div>
                </div>
                <div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAddPhotos}
                    className="hidden"
                    disabled={fotosReligioso.length >= 4}
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={fotosReligioso.length >= 4}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition ${
                      fotosReligioso.length >= 4
                        ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                        : 'bg-[#226380] text-white hover:bg-[#1b4f66] dark:bg-[#68a9c7] dark:text-slate-900 dark:hover:bg-[#528ea8]'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{fotosReligioso.length >= 4 ? 'Limite de 4 fotos atingido' : `Enviar fotos (${fotosReligioso.length}/4)`}</span>
                  </button>
                </div>
              </div>

              {/* Instruções aos Religiosos */}
              <div className="mt-4 rounded-lg border border-amber-200/70 bg-amber-50/70 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Orientações para o envio de fotografias:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11.5px] leading-relaxed text-amber-800 dark:text-amber-300">
                  <li>Por favor, envie <strong>4 fotografias</strong> recentes com boa nitidez (preferencialmente com clergyman ou hábito religioso).</li>
                  <li>Dentre as fotos enviadas, <strong>clique para escolher qual delas será a sua foto de perfil</strong>.</li>
                  <li>A foto escolhida será utilizada no <strong>formato oficial 4x4</strong> na sua Ficha Cadastral Oficial da Província e no Portal do Religioso.</li>
                </ul>
              </div>

              {/* Galeria de Fotos */}
              {fotosReligioso.length === 0 ? (
                <div
                  onClick={() => photoInputRef.current?.click()}
                  className="mt-4 flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-lg hover:border-[#226380] dark:hover:border-[#68a9c7] transition cursor-pointer text-center group"
                >
                  <Upload className="h-8 w-8 text-slate-400 group-hover:text-[#226380] dark:group-hover:text-[#68a9c7] transition mb-2" />
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    Nenhuma foto adicionada ainda. Clique para selecionar até 4 fotos.
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Formatos aceitos: JPG, PNG ou WebP (máx. 5MB cada)
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {fotosReligioso.map((foto, index) => (
                      <div
                        key={foto.id}
                        className={`relative group rounded-lg overflow-hidden border-2 transition ${
                          foto.isPerfil
                            ? 'border-[#226380] ring-2 ring-[#226380]/30 shadow-md bg-[#226380]/5'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]'
                        }`}
                      >
                        <div className="aspect-square w-full overflow-hidden bg-slate-100 dark:bg-black/20">
                          <img
                            src={foto.previewUrl}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {foto.isPerfil && (
                          <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 bg-[#226380] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                            <Star className="h-2.5 w-2.5 fill-current" /> Perfil 4x4
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(foto.id);
                          }}
                          title="Remover esta foto"
                          className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded opacity-0 group-hover:opacity-100 transition shadow"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>

                        <div className="p-2 text-center">
                          {foto.isPerfil ? (
                            <span className="text-[11px] font-semibold text-[#226380] dark:text-[#68a9c7] flex items-center justify-center gap-1">
                              <Check className="h-3 w-3" /> Foto do Perfil
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectProfilePhoto(foto.id)}
                              className="w-full text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:text-[#226380] dark:hover:text-[#68a9c7] py-0.5 border border-slate-200 dark:border-white/10 rounded hover:border-[#226380] dark:hover:border-[#68a9c7] transition"
                            >
                              Definir como Perfil
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Destaque da Foto Escolhida para o formato 4x4 da Ficha */}
                  {fotosReligioso.some(f => f.isPerfil) && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-[#226380]/30 bg-gradient-to-r from-[#226380]/5 to-transparent dark:border-[#68a9c7]/30 dark:from-[#68a9c7]/5">
                      <div className="relative w-28 h-28 aspect-square rounded-lg overflow-hidden border-2 border-[#226380] dark:border-[#68a9c7] shadow shrink-0 bg-slate-100">
                        <img
                          src={fotosReligioso.find(f => f.isPerfil)?.previewUrl}
                          alt="Foto 4x4 da Ficha"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-[#226380] dark:bg-[#113240] text-white text-[9px] font-bold text-center py-0.5 tracking-wider uppercase">
                          Formato 4x4
                        </span>
                      </div>
                      <div className="space-y-1 text-center sm:text-left">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#226380] dark:text-[#68a9c7] uppercase tracking-wide">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>Foto Selecionada para a Ficha Cadastral Oficial</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Esta fotografia será utilizada no formato 4x4 no cabeçalho do seu Dossiê Provincial Oficial e no Portal do Religioso.
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          Para escolher outra foto, basta clicar em "Definir como Perfil" na foto desejada acima.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Fields
              fields={['grau', 'nome_civil', 'nome_religioso', 'data_nascimento', 'local_nascimento', 'municipio_nascimento', 'estado_nascimento', 'pais_nascimento', 'nacionalidade', 'cpf', 'rg', 'rg_orgao_expedidor', 'rg_data_emissao', 'titulo_eleitor', 'pis', 'cnh', 'cnh_categoria', 'passaporte', 'email_institucional', 'email_pessoal', 'telefone_celular', 'whatsapp', 'redes_sociais']}
              base={base}
              update={updateBase}
              invalidFields={invalidFields}
              requiredFields={memberMode ? requiredStep1.filter(field => field !== 'grau') : requiredStep1}
              readOnlyFields={memberMode ? ['cpf'] : []}
              afterField={{
                grau: (
                  <label className="block space-y-1.5" htmlFor="input-obra_atual_id">
                    <span className="flex items-center justify-between text-[12px] font-medium text-[#707070] dark:text-[#86868b]">
                      <span>Comunidade / Obra atual</span>
                      <span className="text-[10px] font-normal lowercase text-[#86868b]">(opcional)</span>
                    </span>
                    <select
                      id="input-obra_atual_id"
                      className={inputClass}
                      value={base.obra_atual_id || ''}
                      onChange={event => {
                        const selectedObra = obras.find(obra => obra.id === event.target.value);
                        setBase(previous => ({
                          ...previous,
                          obra_atual_id: selectedObra?.id || '',
                          comunidade_atual_nome: selectedObra?.nome || '',
                          cep: selectedObra?.cep || previous.cep,
                          logradouro: selectedObra?.logradouro || selectedObra?.endereco || previous.logradouro,
                          numero: selectedObra?.numero || previous.numero,
                          complemento: selectedObra?.complemento || previous.complemento,
                          bairro: selectedObra?.bairro || previous.bairro,
                          cidade: selectedObra?.localidade || selectedObra?.cidade || previous.cidade,
                          estado: selectedObra?.uf || selectedObra?.estado || previous.estado,
                          estado_outro: '',
                          telefone_celular: previous.telefone_celular || selectedObra?.telefone || '',
                          whatsapp: previous.whatsapp || selectedObra?.whatsapp || selectedObra?.telefone || '',
                          email_institucional: previous.email_institucional || selectedObra?.email || '',
                        }));
                        setErrorMessage(null);
                      }}
                    >
                      <option value="">Selecione a comunidade...</option>
                      {obras.map(obra => <option key={obra.id} value={obra.id}>{obra.nome}</option>)}
                    </select>
                    <span className="block text-[11px] text-[#707070] dark:text-[#a1a1aa]">
                      Ao selecionar, o endereço e dados da comunidade são preenchidos automaticamente.
                    </span>
                  </label>
                ),
              }}
              selects={{
                grau: degreeOptions,
                estado_nascimento: [
                  ...brazilianStates,
                  ...(base.estado_nascimento && !brazilianStates.some(state => state.value === base.estado_nascimento) && base.estado_nascimento !== OTHER_LOCATION_VALUE
                    ? [{ value: base.estado_nascimento, label: base.estado_nascimento }]
                    : []),
                  { value: OTHER_LOCATION_VALUE, label: 'Outro estado (informar)' },
                ],
              }}
              otherFields={{ estado_nascimento: 'estado_nascimento_outro' }}
            />
            {adminMode && (
              <div className="mt-6 pt-6 border-t border-[#e5e5ea] dark:border-white/10 grid gap-4 md:grid-cols-2">
                <Fields fields={['status_cadastro', 'status']} base={base} update={updateBase} selects={{ status_cadastro: ['Em revisão', 'Aprovado', 'Arquivado'], status: ['Ativo', 'Em missão externa', 'Em estudos', 'Emérito (Casa São João)', 'Emérito', 'Falecido', 'Exclaustrado'] }} />
              </div>
            )}
          </Section>
        )}

        {step === 2 && (
          <Section title="2. Família e Iniciação Cristã">
            <p className="mb-6 text-sm leading-relaxed text-[#707070] dark:text-[#a1a1aa]">
              Informe os dados de seus familiares e pessoas de referência. Os campos dos sacramentos são opcionais; diocese, cidade e estado podem ser digitados livremente.
            </p>
            <div className="space-y-6">
              {familiares.map((row, index) => (
                <div className="rounded-[6px] border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-[#161b22] space-y-4" key={`${row.tipo}-${index}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-sm font-semibold text-[#1d1d1f] dark:text-white font-serif">{row.tipo}</span>
                    {row.tipo === 'Irmão' && (
                      <button type="button" onClick={() => setFamiliares(previous => previous.filter((_, rowIndex) => rowIndex !== index))} className="text-rose-500 hover:text-rose-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Fields
                    fields={['nome', 'data_nascimento', 'local_nascimento', 'estado_civil']}
                    base={row}
                    update={(field, value) => updateFamiliar(index, field as keyof Familiar, value)}
                    selects={{ estado_civil: maritalStatusOptions[row.tipo] }}
                    idPrefix={`familiar-${index}-`}
                  />
                  {row.estado_civil?.startsWith('Falecid') && (
                    <div className="max-w-sm">
                      <Fields fields={['data_evento']} base={row} update={(field, value) => updateFamiliar(index, field as keyof Familiar, value)} idPrefix={`familiar-${index}-`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setFamiliares(previous => [...previous, emptyFamiliar()])} className="mt-5 inline-flex items-center gap-2 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-[#f5f5f7] dark:bg-white/10 hover:bg-black/5 dark:hover:bg-white/15 px-5 py-2.5 text-xs font-semibold text-[#1d1d1f] dark:text-white transition-all cursor-pointer">
              <Plus className="h-4 w-4" />Adicionar irmão
            </button>
            <div className="mt-8 pt-6 border-t border-[#e5e5ea] dark:border-white/10">
              <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-white mb-4 font-serif">Contatos de referência</h3>
              <div className="space-y-3">
                {contatosFamiliares.map((row, index) => (
                  <div key={`contato-${index}`} className="flex items-start gap-3 rounded-[6px] border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex-1">
                      <Fields fields={['nome', 'parentesco', 'contato_1']} base={row} update={(field, value) => updateContact(index, field as keyof ContatoFamiliar, value)} selects={{ parentesco: relationshipOptions }} idPrefix={`contato-${index}-`} />
                    </div>
                    <button type="button" aria-label="Remover contato" onClick={() => setContatosFamiliares(previous => previous.filter((_, rowIndex) => rowIndex !== index))} className="mt-1 p-2 text-rose-500 hover:text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setContatosFamiliares(previous => [...previous, emptyContact()])} className="mt-4 inline-flex items-center gap-2 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-[#f5f5f7] dark:bg-white/10 px-5 py-2.5 text-xs font-semibold text-[#1d1d1f] dark:text-white">
                <Plus className="h-4 w-4" />Adicionar contato
              </button>
            </div>
            <div className="mt-8 border-t border-[#e5e5ea] pt-6 dark:border-white/10">
              <h3 className="mb-4 text-sm font-semibold text-[#1d1d1f] dark:text-white font-serif">Iniciação Cristã</h3>
              <div className="space-y-6">
                {sacramentos.map((row, index) => (
                  <div className="rounded-[6px] border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-[#161b22] space-y-4" key={row.tipo}>
                    <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
                      <h4 className="text-sm font-semibold text-[#1d1d1f] dark:text-white font-serif">{row.tipo}</h4>
                    </div>
                    <Fields fields={['data', 'paroquia', 'diocese', 'cidade', 'uf', 'livro', 'folha', 'numero_registro', 'celebrante', 'observacoes']} base={row} update={(field, value) => updateSacrament(index, field as keyof Sacrament, value)} />
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}

        {step === 3 && (
          <Section title="3. Vocação, Formação e Votos">
            <div className="mb-6 pb-6 border-b border-[#e5e5ea] dark:border-white/10">
              <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-white mb-4">Origem Vocacional</h3>
              <Fields fields={['paroquia_origem', 'diocese_origem', 'grupo_movimento_pastoral', 'promotor_vocacional']} base={base} update={updateBase} />
            </div>
            <DynamicSection title="Histórico Vocacional" type="vocacional" fields={['ano', 'data', 'titulo', 'descricao', 'local', 'responsavel']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} />
            <div className="mt-8 border-t border-[#e5e5ea] pt-6 dark:border-white/10">
              <p className="mb-4 text-sm text-[#707070] dark:text-[#a1a1aa]">Adicione somente as etapas que realizou, na ordem que corresponde à sua trajetória.</p>
              <DynamicSection title="Etapas da Formação" type="formacao" fields={['etapa', 'instituicao', 'cidade', 'inicio', 'fim', 'formador']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} selects={{ etapa: formationOptions }} />
            </div>
            <div className="mt-8 pt-6 border-t border-[#e5e5ea] dark:border-white/10">
              <DynamicSection
                title="Profissões e Votos"
                type="voto"
                fields={['voto_tipo', 'renovacao', 'data', 'local', 'celebrante']}
                rows={rows}
                addRow={addRow}
                updateRow={updateRow}
                removeRow={removeRow}
                selects={{ voto_tipo: base.grau === 'Frater' ? votoOptions.slice(0, 2) : votoOptions, renovacao: renewalOptions.map(value => ({ value, label: `${value}ª Renovação` })) }}
                visibleFields={row => {
                  if (base.grau === 'Frater' && row.voto_tipo === 'Profissão Perpétua') return [];
                  return row.voto_tipo === 'Renovação de Votos' ? ['voto_tipo', 'renovacao', 'data', 'local', 'celebrante'] : ['voto_tipo', 'data', 'local', 'celebrante'];
                }}
              />
            </div>
          </Section>
        )}

        {step === 4 && (
          <Section title="4. Ministérios e Ordens, Formação Acadêmica e Idiomas">
            <DynamicSection
              title="Ministérios e Ordens"
              type="ministerio"
              rowTypes={base.grau === 'Frater' ? ['ministerio'] : ['ministerio', 'ordem']}
              fields={['ministerio', 'data', 'local', 'celebrante']}
              rows={rows}
              addRow={addRow}
              updateRow={updateRow}
              removeRow={removeRow}
              selects={{ ministerio: base.grau === 'Frater' ? ministryOptions.slice(0, 2) : ministryOptions }}
              visibleFields={row => ['Diaconato', 'Diaconado', 'Presbiterado', 'Episcopado'].includes(row.ministerio)
                ? ['ministerio', 'data', 'local', 'celebrante', 'bispo_ordenante']
                : ['ministerio', 'data', 'local', 'celebrante']}
            />
            <div className="mt-8 border-t border-[#e5e5ea] pt-6 dark:border-white/10">
              <p className="mb-4 text-sm text-[#707070] dark:text-[#a1a1aa]">Inclua Filosofia, Teologia e outras formações anteriores ou posteriores ao seminário.</p>
              <DynamicSection title="Formação Acadêmica" type="academica" fields={['categoria', 'instituicao', 'periodo', 'pais', 'estado', 'cidade', 'observacoes']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} selects={{ categoria: academicOptions }} />
            </div>
            <div className="mt-8 border-t border-[#e5e5ea] pt-6 dark:border-white/10">
              <DynamicSection title="Idiomas" type="idioma" fields={['idioma', 'audicao', 'fala', 'leitura', 'escrita']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} selects={{ audicao: languageLevels, fala: languageLevels, leitura: languageLevels, escrita: languageLevels }}>
                <details className="mb-5 rounded-[6px] border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-white/[0.03]">
                  <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-[#1d1d1f] dark:text-white">
                    <Info className="h-4 w-4" aria-hidden="true" />Como escolher seu nível de conhecimento
                  </summary>
                  <p className="mt-3 text-xs leading-relaxed text-[#707070] dark:text-[#a1a1aa]">
                    Selecione o nível que melhor representa sua capacidade atual em cada habilidade, sem ajuda de tradutores. Se possuir certificado, poderá anexá-lo na etapa final.
                  </p>
                  <ul className="mt-3 grid gap-2 text-xs text-[#707070] dark:text-[#a1a1aa] sm:grid-cols-2">
                    <li><strong>A1 - Iniciante:</strong> conhece algumas palavras e expressões simples, mas tem dificuldade para conversar.</li>
                    <li><strong>A2 - Básico:</strong> entende e fala frases simples em situações do dia a dia.</li>
                    <li><strong>B1 - Intermediário:</strong> mantém conversas conhecidas, lê textos simples e escreve mensagens.</li>
                    <li><strong>B2 - Intermediário avançado:</strong> conversa com autonomia, compreende textos complexos e expressa ideias com clareza.</li>
                    <li><strong>C1 - Avançado:</strong> fala com fluência e usa o idioma em estudos, reuniões e atividades pastorais.</li>
                    <li><strong>C2 - Proficiente:</strong> compreende praticamente tudo e se expressa com naturalidade, precisão e segurança.</li>
                  </ul>
                </details>
              </DynamicSection>
            </div>
            <div className="mt-8 border-t border-[#e5e5ea] pt-6 dark:border-white/10">
              <DynamicSection title="Competências Especiais" type="competencia" fields={['competencia', 'observacoes']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} />
            </div>
          </Section>
        )}

        {step === 5 && (
          <Section title="5. Histórico, Missões e Endereço Atual">
            <p className="mb-5 text-sm leading-relaxed text-[#707070] dark:text-[#a1a1aa]">
              Registre comunidades, transferências, nomeações, missões e serviços em ordem cronológica, informando período, cidade, instituição e função.
            </p>
            <DynamicSection title="Transferências, Nomeações e Histórico de Comunidades" type="historico" fields={['inicio', 'fim', 'instituicao', 'funcao', 'local', 'observacoes']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} />
            <div className="mt-8 border-t border-[#e5e5ea] pt-6 dark:border-white/10">
              <DynamicSection title="Missões e Serviços" type="servico" fields={['servico_tipo', 'instituicao', 'funcao', 'periodo', 'local', 'documento', 'observacao']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} selects={{ servico_tipo: ['Missão', 'Serviço à Congregação', 'Serviço à Igreja', 'CNBB', 'Diocese', 'Organismo', 'Assessoria', 'Cargo externo'] }} />
            </div>
            <div className="mt-8 border-t border-[#e5e5ea] pt-6 dark:border-white/10">
              <h3 className="mb-4 text-sm font-semibold text-[#1d1d1f] dark:text-white font-serif">Obra / Comunidade atual</h3>
              {profileReligiosoId || memberMode ? (
                <p className="text-sm text-[#707070] dark:text-[#a1a1aa]">A Secretaria mantém atualizados a obra, a comunidade e o endereço do Elenco.</p>
              ) : (
                <div className="rounded-[6px] border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-white/[0.03]">
                  <p className="font-semibold text-[#1d1d1f] dark:text-white">
                    {base.comunidade_atual_nome || 'Nenhuma obra ou comunidade selecionada'}
                  </p>
                  <p className="mt-1 text-[#707070] dark:text-[#a1a1aa]">
                    O endereço abaixo foi preenchido a partir da seleção feita no passo 1 e pode ser conferido ou ajustado.
                  </p>
                </div>
              )}
              <div className="mt-6 border-t border-[#e5e5ea] pt-6 dark:border-white/10">
                <h3 className="mb-4 text-sm font-semibold text-[#1d1d1f] dark:text-white font-serif">Endereço da residência atual</h3>
                <Fields
                  fields={['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado']}
                  base={base}
                  update={updateBase}
                  onBlur={field => { if (field === 'cep') void lookupAddress(); }}
                  selects={{
                    estado: [
                      ...brazilianStates,
                      ...(base.estado && !brazilianStates.some(state => state.value === base.estado) && base.estado !== OTHER_LOCATION_VALUE
                        ? [{ value: base.estado, label: base.estado }]
                        : []),
                      { value: OTHER_LOCATION_VALUE, label: 'Outro estado (informar)' },
                    ],
                  }}
                  otherFields={{ estado: 'estado_outro' }}
                />
                {!memberMode && !profileReligiosoId && cepLoading && <p className="mt-2 text-xs text-slate-500">Consultando CEP...</p>}
                {!memberMode && !profileReligiosoId && cepError && <p role="alert" className="mt-2 text-xs text-rose-600">{cepError}</p>}
              </div>
            </div>
          </Section>
        )}

        {step === 6 && (
          <>
          <Section title="6. Saúde, Documentos, Revisão e Envio">
            <div className="mb-8 rounded-[6px] border border-[#226380]/20 bg-[#226380]/[0.04] p-5 dark:border-[#A3C3C7]/20 dark:bg-[#A3C3C7]/[0.04]">
              <h3 className="mb-4 text-sm font-semibold text-[#1d1d1f] dark:text-white">Revise os principais dados antes de enviar</h3>
              <dl className="grid gap-3 text-xs sm:grid-cols-2">
                <div><dt className="text-[#707070] dark:text-[#a1a1aa]">Nome</dt><dd className="font-medium">{base.nome_civil || '—'}</dd></div>
                <div><dt className="text-[#707070] dark:text-[#a1a1aa]">Grau</dt><dd className="font-medium">{base.grau || '—'}</dd></div>
                <div><dt className="text-[#707070] dark:text-[#a1a1aa]">E-mail</dt><dd className="font-medium">{base.email_institucional || base.email_pessoal || '—'}</dd></div>
                <div><dt className="text-[#707070] dark:text-[#a1a1aa]">Obra atual</dt><dd className="font-medium">{obras.find(item => item.id === base.obra_atual_id)?.nome || base.comunidade_atual_nome || 'Não informada'}</dd></div>
                <div><dt className="text-[#707070] dark:text-[#a1a1aa]">Familiares / contatos</dt><dd className="font-medium">{familiares.filter(row => row.nome.trim()).length} / {contatosFamiliares.filter(row => row.nome.trim()).length}</dd></div>
                <div><dt className="text-[#707070] dark:text-[#a1a1aa]">Registros formativos e vocacionais</dt><dd className="font-medium">{rows.filter(row => ['vocacional', 'formacao', 'voto'].includes(row.tipo) && hasAnyValues(row, ['ano', 'data', 'titulo', 'descricao', 'local', 'responsavel', 'etapa', 'instituicao', 'inicio', 'fim', 'formador', 'voto_tipo', 'renovacao', 'celebrante'])).length}</dd></div>
                <div><dt className="text-[#707070] dark:text-[#a1a1aa]">Ministérios, estudos e idiomas</dt><dd className="font-medium">{rows.filter(row => ['ministerio', 'ordem', 'academica', 'idioma'].includes(row.tipo) && hasAnyValues(row, ['ministerio', 'data', 'local', 'celebrante', 'categoria', 'instituicao', 'periodo', 'pais', 'cidade', 'estado', 'idioma', 'nivel', 'fala', 'audicao', 'leitura', 'escrita'])).length}</dd></div>
                <div><dt className="text-[#707070] dark:text-[#a1a1aa]">Histórico e missões</dt><dd className="font-medium">{rows.filter(row => ['historico', 'servico'].includes(row.tipo) && hasAnyValues(row, ['inicio', 'fim', 'instituicao', 'funcao', 'local', 'observacoes', 'servico_tipo', 'periodo', 'documento', 'observacao'])).length}</dd></div>
              </dl>
              <button type="button" onClick={() => { setErrorMessage(null); setStep(1); }} className="mt-4 text-xs font-semibold text-[#226380] underline dark:text-[#A3C3C7]">Voltar ao início para revisar ou corrigir os dados</button>
            </div>
            <h3 className="mb-4 text-sm font-semibold text-[#1d1d1f] dark:text-white font-serif">Informações de Saúde</h3>
            <Fields fields={['plano_saude', 'numero_plano_saude', 'local_plano_saude', 'sus', 'tipo_sanguineo', 'fator_rh', 'alergias', 'medicamentos_continuos', 'medico_responsavel', 'contato_emergencia', 'informacoes_clinicas', 'cirurgias', 'proteses', 'observacoes_saude']} base={base} update={updateBase} selects={{ fator_rh: ['Positivo', 'Negativo', 'Não informado'] }} />
          </Section>
          <Section title="Documentos e Consentimento">
            <p className="mb-6 text-sm text-[#707070] dark:text-[#86868b] leading-relaxed">
              {publicConfig.instrucoes_documentos || 'Anexe documentos pessoais (RG, CPF, CNH, Passaporte), certidões, sacramentos, registros canônicos e acadêmicos.'}
            </p>
            {(adminMode || profileReligiosoId || memberMode) && documentosExistentes.length > 0 && (
              <div className="mb-6 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#707070]">Documentos já anexados</h3>
                <div className="grid gap-2">
                  {documentosExistentes.map(documento => (
                    <div className="flex items-center justify-between rounded-[6px] bg-slate-50 dark:bg-white/5 p-3.5 text-xs border border-slate-200 dark:border-slate-800" key={documento.id}>
                      <span className="font-medium text-[#1d1d1f] dark:text-white">
                        <strong className="text-slate-900 dark:text-white">{documento.categoria}</strong> · {documento.nome_arquivo}
                      </span>
                      {adminMode && (
                        <button type="button" onClick={() => removeExistingDocument(documento)} className="text-rose-500 hover:text-rose-600 transition-colors cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col items-center justify-center gap-3 rounded-[6px] border-2 border-dashed border-slate-300 dark:border-white/20 p-8 text-center hover:border-slate-900 dark:hover:border-white transition-colors cursor-pointer bg-slate-50/50 dark:bg-white/[0.02]">
                <FileUp className="h-7 w-7 text-slate-700 dark:text-slate-300" />
                <div>
                  <span className="text-sm font-semibold text-[#1d1d1f] dark:text-white block font-serif">Selecionar arquivos</span>
                  <span className="text-xs text-[#707070] dark:text-[#86868b] mt-0.5 block">Formatos PDF, PNG, JPG até 10MB</span>
                </div>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" multiple className="hidden" onChange={handleDocumentSelection} />
              </label>
              <div className="space-y-2">
                {documentos.map((documento, index) => (
                  <div className="flex items-center gap-2 rounded-[6px] bg-slate-50 dark:bg-white/5 p-3 text-xs border border-slate-200 dark:border-slate-800" key={`${documento.arquivo.name}-${index}`}>
                    <select className="px-3 py-1.5 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] text-xs outline-none" value={documento.categoria} onChange={event => setDocumentos(previous => previous.map((item, itemIndex) => itemIndex === index ? { ...item, categoria: event.target.value } : item))}>
                      {['RG', 'CPF', 'CNH', 'Passaporte', 'Título de eleitor', 'Certidão de nascimento', 'Batismo', 'Primeira Eucaristia', 'Crisma', 'Admissão ao Postulantado', 'Admissão ao Noviciado', 'Primeira Profissão Religiosa', 'Renovações', 'Votos perpétuos', 'Diaconado', 'Presbiterado', 'Episcopado', 'Histórico escolar', 'Diplomas', 'Certificados', 'Decretos', 'Licenças', 'Dispensas', 'Indultos', 'Contratos', 'Procurações', 'Outros'].map(option => <option key={option}>{option}</option>)}
                    </select>
                    <span className="flex-1 truncate text-[#1d1d1f] dark:text-white font-medium">{documento.arquivo.name}</span>
                    <button type="button" onClick={() => setDocumentos(previous => previous.filter((_, itemIndex) => itemIndex !== index))} className="text-rose-500 hover:text-rose-600 transition-colors cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <label className="flex items-start gap-3 rounded-[6px] bg-slate-50 dark:bg-white/5 p-5 text-xs text-[#1d1d1f] dark:text-white cursor-pointer leading-relaxed border border-slate-200 dark:border-slate-800">
                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded-[4px] accent-slate-900 shrink-0" checked={!!base.consentimento_dados} onChange={event => updateBase('consentimento_dados', event.target.checked ? 'true' : '')} />
                <div className="space-y-1">
                  <span>{adminMode ? 'Confirmo a conferência e exatidão dos dados deste cadastro religioso.' : publicConfig.termos}</span>
                  {!adminMode && (
                    <div className="pt-1">
                      <Link to="/privacidade" target="_blank" className="text-[11px] font-medium text-slate-900 dark:text-white underline">
                        Consultar Política de Privacidade e Direitos do Titular (LGPD)
                      </Link>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </Section>
          </>
        )}

        {/* Footer Navigation Buttons */}
        <footer className="mt-8 flex items-center justify-between gap-3 border-t border-[#e5e5ea] dark:border-white/10 pt-5 sm:mt-10 sm:pt-6">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(previous => Math.max(1, previous - 1))}
            className="inline-flex items-center gap-2 rounded-[6px] border border-slate-200 dark:border-slate-800 px-5 py-2.5 text-xs font-semibold text-[#707070] hover:text-[#1d1d1f] hover:bg-black/5 dark:hover:bg-white/5 transition-all disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>

          {step < etapas.length ? (
            <button
              type="button"
              onClick={() => {
                const validation = validateStep();
                if (validation) setErrorMessage(validation);
                else {
                  setErrorMessage(null);
                  setStep(previous => Math.min(etapas.length, previous + 1));
                }
              }}
              className="inline-flex min-h-12 flex-1 sm:flex-none items-center justify-center gap-2 rounded-[6px] bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 text-white px-5 sm:px-7 py-3 text-sm sm:text-xs font-semibold transition-all cursor-pointer shadow-none active:scale-[0.98]"
            >
              <span>Avançar</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting || profileUnavailable}
              className="inline-flex min-h-12 flex-1 sm:flex-none items-center justify-center gap-2 rounded-[6px] bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 text-white px-5 sm:px-8 py-3 text-sm sm:text-xs font-semibold transition-all cursor-pointer shadow-none active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>Enviar cadastro</span>
            </button>
          )}
        </footer>
      </form>
    </PublicShell>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mx-auto max-w-5xl py-2">
    <h2 className="mb-6 border-b border-[#e5e5ea] dark:border-white/10 pb-3 text-lg font-bold tracking-tight text-[#1d1d1f] dark:text-white">
      {title}
    </h2>
    {children}
  </section>
);

const Fields: React.FC<{
  fields: string[];
  base: Record<string, string>;
  update: (field: string, value: string) => void;
  selects?: Record<string, (string | { value: string; label: string })[]>;
  invalidFields?: string[];
  readOnlyFields?: string[];
  requiredFields?: string[];
  otherFields?: Record<string, string>;
  onBlur?: (field: string) => void;
  idPrefix?: string;
  afterField?: Record<string, React.ReactNode>;
}> = ({ fields, base, update, selects = {}, invalidFields = [], readOnlyFields = [], requiredFields = [], otherFields = {}, onBlur, idPrefix = '', afterField = {} }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {fields.map(field => {
      const isRequired = requiredFields.includes(field);
      const isInvalid = invalidFields.includes(field) || Boolean(otherFields[field] && invalidFields.includes(otherFields[field]));
      const isReadOnly = readOnlyFields.includes(field);
      const fieldId = `${idPrefix}input-${field}`;
      return (
        <React.Fragment key={field}>
          <label className="space-y-1.5 block" htmlFor={fieldId}>
            <span className="text-[12px] font-medium text-[#707070] dark:text-[#86868b] flex items-center justify-between">
              <span>
                {getFieldLabel(field)}
                {isRequired && <span className="text-rose-500 ml-1 font-bold">*</span>}
              </span>
              {!isRequired && <span className="text-[10px] text-[#86868b] font-normal lowercase">(opcional)</span>}
            </span>
            {selects[field] ? (
              <select
                id={fieldId}
                required={isRequired}
                className={`${inputClass} ${isInvalid ? '!border-rose-500 !ring-rose-500/20 ring-4 focus:!border-rose-500' : ''}`}
                value={base[field] || ''}
                disabled={isReadOnly}
                onChange={event => update(field, event.target.value)}
              >
                <option value="">Selecione...</option>
                {base[field] && !selects[field].some(option => typeof option === 'string' ? option === base[field] : option.value === base[field]) && (
                  <option value={base[field]}>{base[field]} (atual)</option>
                )}
                {selects[field]?.map(option =>
                  typeof option === 'string' ? (
                    <option key={option} value={option}>{option}</option>
                  ) : (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  )
                )}
              </select>
            ) : (
              <input
                id={fieldId}
                required={isRequired}
                className={`${inputClass} ${isInvalid ? '!border-rose-500 !ring-rose-500/20 ring-4 focus:!border-rose-500' : ''}`}
                type={field.includes('data') || field === 'inicio' || field === 'fim'
                  ? 'date'
                  : field.includes('email') ? 'email' : field === 'ano' || field === 'renovacao' ? 'number' : 'text'}
                min={field === 'renovacao' ? 1 : undefined}
                step={field === 'renovacao' || field === 'ano' ? 1 : undefined}
                value={base[field] || ''}
                disabled={isReadOnly}
                placeholder={field === 'cpf' ? '000.000.000-00' : field === 'cep' ? '00000-000' : isRequired ? '' : 'Opcional'}
                onChange={event => update(field, field === 'cpf' ? formatCpf(event.target.value) : field === 'cep' ? formatCep(event.target.value) : event.target.value)}
                onBlur={() => onBlur?.(field)}
              />
            )}
            {otherFields[field] && base[field] === OTHER_LOCATION_VALUE && (
              <input
                id={`input-${otherFields[field]}`}
                className={inputClass}
                type="text"
                value={base[otherFields[field]] || ''}
                placeholder={`Informe ${getFieldLabel(field).toLowerCase()}`}
                aria-label={`Informe ${getFieldLabel(field).toLowerCase()} não listado`}
                onChange={event => update(otherFields[field], event.target.value)}
              />
            )}
          </label>
          {afterField[field]}
        </React.Fragment>
      );
    })}
  </div>
);

const DynamicSection: React.FC<{
  title: string;
  type: string;
  rowTypes?: string[];
  fields: string[];
  rows: Record<string, string>[];
  addRow: (values?: Record<string, string>) => void;
  updateRow: (index: number, field: string, value: string) => void;
  removeRow: (index: number) => void;
  selects?: Record<string, string[] | { value: string; label: string }[]>;
  visibleFields?: (row: Record<string, string>) => string[];
  children?: React.ReactNode;
}> = ({ title, type, rowTypes = [type], fields, rows, addRow, updateRow, removeRow, selects = {}, visibleFields, children }) => (
  <Section title={title}>
    {children}
    <div className="space-y-4">
      {rows.map((row, index) => rowTypes.includes(row.tipo) && (
        <div className="rounded-[6px] border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-[#161b22] space-y-3" key={`${type}-${index}`}>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="text-rose-500 hover:text-rose-600 transition-colors p-1 cursor-pointer"
              title="Remover registro"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <Fields
            fields={visibleFields ? visibleFields(row) : fields}
            base={row}
            update={(field, value) => updateRow(index, field, value)}
            selects={selects}
            idPrefix={`${type}-${index}-`}
            requiredFields={[
              ...(rowHasValue(row, fields) && dynamicRequiredFields[type] ? [dynamicRequiredFields[type]] : []),
              ...(rowHasValue(row, fields) && type === 'voto' && (row.voto_tipo === 'Voto temporário' || row.voto_tipo === 'Renovação de Votos') ? ['renovacao'] : []),
            ]}
          />
        </div>
      ))}
    </div>
    <button
      type="button"
      onClick={() => addRow({ tipo: type })}
      className="mt-4 inline-flex items-center gap-2 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-[#f5f5f7] dark:bg-white/10 hover:bg-black/5 dark:hover:bg-white/15 px-5 py-2.5 text-xs font-semibold text-[#1d1d1f] dark:text-white transition-all cursor-pointer"
    >
      <Plus className="h-4 w-4" />
      <span>Adicionar registro</span>
    </button>
  </Section>
);

const PublicShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#0d1117] text-[#1d1d1f] dark:text-[#f5f5f7] px-4 py-8 md:py-12 transition-colors">
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 pb-8">
      <div className="flex items-center gap-3">
        <div className="flex items-center shrink-0">
          <img src="/logo-sistema.png" alt="BRM" className="h-8 w-auto object-contain dark:hidden" />
          <img src="/logo-branco.png" alt="BRM" className="h-8 w-auto object-contain hidden dark:block" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-[#1d1d1f] dark:text-white font-serif">Província BRM</p>
        </div>
      </div>
      <div className="rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] px-3.5 py-1 text-[11px] font-medium text-[#707070] dark:text-[#86868b]">
        Formulário Oficial
      </div>
    </div>
    <main className="mx-auto max-w-6xl">{children}</main>
    <div className="mx-auto max-w-6xl text-center pt-8 border-t border-[#e5e5ea] dark:border-white/10 mt-12 print:hidden space-y-2">
      <p className="text-xs text-slate-500 dark:text-slate-400 font-sans tracking-wide">
        sistema.brm.org - todos os direitos reservados-2026
      </p>
      <div>
        <Link to="/privacidade" target="_blank" className="text-[11px] text-[#707070] dark:text-[#86868b] hover:text-[#226380] transition-colors">
          Política de Privacidade & Termos LGPD
        </Link>
      </div>
    </div>
  </div>
);
export default CadastroReligiosoPublico;

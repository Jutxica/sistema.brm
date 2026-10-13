import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, FileUp, Info, Loader2, Plus, Trash2, Printer } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { confirmAction, showToast } from '../hooks/useFeedback';

interface ObraReferencia {
  id: string;
  nome: string;
  localidade: string | null;
  cidade: string | null;
  uf: string | null;
  diocese?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  estado?: string | null;
  pais?: string | null;
}
interface Familiar extends Record<string, string> { tipo: 'Pai' | 'Mãe' | 'Irmão'; nome: string; data_nascimento: string; local_nascimento: string; estado_civil: string; data_evento: string }
interface ContatoFamiliar extends Record<string, string> { nome: string; parentesco: string; contato_1: string; contato_2: string }
interface Sacrament extends Record<string, string> { tipo: string; data: string; paroquia: string; diocese: string; cidade: string; uf: string; livro: string; folha: string; numero_registro: string; celebrante: string; observacoes: string }
interface DocumentoSelecionado { categoria: string; arquivo: File }
interface DocumentoExistente { id: string; categoria: string; nome_arquivo: string; caminho_storage: string; data_cadastro: string }
interface ReligiososConfigPublica { ativo: boolean; titulo: string; mensagem_abertura: string; mensagem_fechamento: string; mensagem_confirmacao: string; termos: string; exigir_documentos: boolean; instrucoes_documentos: string }
interface CadastroReligiosoPublicoProps { adminMode?: boolean; profileReligiosoId?: string }
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

const DRAFT_KEY = 'brm_rascunho_cadastro_religioso_v1';

const etapas = [
  'Identificação', 'Família e sacramentos', 'Vocação e formação', 'Ministérios, estudos e idiomas',
  'Histórico e endereço', 'Saúde, documentos e envio',
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
const renewalOptions = Array.from({ length: 9 }, (_, index) => String(index + 1));
const ministryOptions = ['Leitorado', 'Acolitado'];
const orderOptions = ['Diaconato', 'Presbiterado', 'Episcopado'];
const academicOptions = ['Filosofia', 'Teologia', 'Bacharelado', 'Mestrado', 'Doutorado', 'Graduação', 'Pós-graduação', 'Especialização', 'Cursos livres', 'Formação permanente', 'Ensino médio'];
const languageLevels = ['A1 - Iniciante', 'A2 - Básico', 'B1 - Intermediário', 'B2 - Intermediário avançado', 'C1 - Avançado', 'C2 - Proficiente'];
const relationshipOptions = ['Pai', 'Mãe', 'Irmão(ã)', 'Tio(a)', 'Sobrinho(a)', 'Primo(a)', 'Amigo(a)'];
const maritalStatusOptions = ['Casado', 'Divorciado', 'Viúvo', 'Falecido'];
const inputClass = 'w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-[#161b22] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] shadow-none outline-none transition-all duration-200 focus:border-slate-900 dark:focus:border-white font-mono';
const fieldLabels: Record<string, string> = {
  grau: 'Grau', nome_civil: 'Nome completo', nome_religioso: 'Nome religioso', data_nascimento: 'Data de nascimento',
  local_nascimento: 'Local de nascimento', municipio_nascimento: 'Município', estado_nascimento: 'Estado', pais_nascimento: 'País',
  nacionalidade: 'Nacionalidade', cpf: 'CPF', rg: 'RG', rg_orgao_expedidor: 'Órgão expedidor', rg_data_emissao: 'Data de emissão do RG',
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
const hasAnyValues = (record: Record<string, string>, fields: string[]) => fields.some(field => record[field]?.trim());
const hasAnyNonEmpty = (values: Array<string | null | undefined>) => values.some(value => (value ?? '').trim().length > 0);
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
  'nacionalidade', 'cpf', 'rg', 'rg_orgao_expedidor', 'rg_data_emissao'
];

const validateCpf = (cpf: string): boolean => {
  const cleaned = (cpf || '').replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned.charAt(i), 10) * (10 - i);
  let rev = 11 - (sum % 11);
  const d1 = (rev === 10 || rev === 11) ? 0 : rev;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned.charAt(i), 10) * (11 - i);
  rev = 11 - (sum % 11);
  const d2 = (rev === 10 || rev === 11) ? 0 : rev;

  return cleaned.endsWith(`${d1}${d2}`);
};

const formatCpf = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const CadastroReligiosoPublico: React.FC<CadastroReligiosoPublicoProps> = ({ adminMode = false, profileReligiosoId }) => {
  const navigate = useNavigate();
  const { id: routeReligiosoId } = useParams<{ id: string }>();
  const religiosoId = profileReligiosoId || routeReligiosoId;
  const [step, setStep] = useState(1);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [obras, setObras] = useState<ObraReferencia[]>([]);
  const [loading, setLoading] = useState(true);
  const ufFallback = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profileUnavailable, setProfileUnavailable] = useState(false);
  const [documentos, setDocumentos] = useState<DocumentoSelecionado[]>([]);
  const [documentosExistentes, setDocumentosExistentes] = useState<DocumentoExistente[]>([]);
  const [publicConfig, setPublicConfig] = useState(defaultPublicConfig);
  const [designacoesElenco, setDesignacoesElenco] = useState<DesignacaoPortal[]>([]);
  const [erroDesignacoesElenco, setErroDesignacoesElenco] = useState<string | null>(null);
  const [familiares, setFamiliares] = useState<Familiar[]>([emptyFamiliar('Pai'), emptyFamiliar('Mãe')]);
  const [contatosFamiliares, setContatosFamiliares] = useState<ContatoFamiliar[]>([]);
  const [sacramentos, setSacramentos] = useState<Sacrament[]>([emptySacrament('Batismo'), emptySacrament('Primeira Eucaristia'), emptySacrament('Crisma')]);
  const [base, setBase] = useState<Record<string, string>>({
    grau: 'Padre', nome_civil: '', nome_religioso: '', nome_elenco: '', data_nascimento: '', local_nascimento: '', municipio_nascimento: '', estado_nascimento: '', pais_nascimento: 'Brasil', nacionalidade: 'Brasileira', cpf: '', rg: '', rg_orgao_expedidor: '', rg_data_emissao: '', titulo_eleitor: '', pis: '', cnh: '', cnh_categoria: '', passaporte: '', obra_atual_id: '', comunidade_atual_nome: '', email_institucional: '', email_pessoal: '', telefone_celular: '', whatsapp: '', redes_sociais: '', status: 'Ativo', status_cadastro: 'Aprovado',
    contato_nome: '', contato_parentesco: '', contato_1: '', contato_2: '', paroquia_origem: '', diocese_origem: '', grupo_movimento_pastoral: '', promotor_vocacional: '', plano_saude: '', numero_plano_saude: '', local_plano_saude: '', sus: '', tipo_sanguineo: '', fator_rh: '', alergias: '', medicamentos_continuos: '', medico_responsavel: '', contato_emergencia: '', informacoes_clinicas: '', cirurgias: '', proteses: '', observacoes_saude: '', consentimento_dados: '',
  });
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const hojeElenco = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  const designacoesAtuais = designacoesElenco.filter(item =>
    (!item.vigencia_inicio || item.vigencia_inicio <= hojeElenco)
    && (!item.vigencia_fim || item.vigencia_fim >= hojeElenco)
  );

  useEffect(() => {
    const load = async () => {
      const [{ data: obrasData }, { data: religiosoData }, { data: configData }] = await Promise.all([
        supabase.from('religiosos_obras_referencia').select('id,nome,localidade,cidade,uf,diocese,cep,logradouro,numero,complemento,bairro,estado,pais').eq('status', 'Ativa').order('nome'),
        religiosoId && (adminMode || profileReligiosoId) ? supabase.from('religiosos').select('*').eq('id', religiosoId).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from('religiosos_configuracoes').select('ativo,titulo,mensagem_abertura,mensagem_fechamento,mensagem_confirmacao,termos,exigir_documentos,instrucoes_documentos').limit(1).maybeSingle(),
      ]);
      setObras((obrasData || []) as ObraReferencia[]);
      if (configData) setPublicConfig({ ...defaultPublicConfig, ...configData });
      if (religiosoId && (adminMode || profileReligiosoId) && !religiosoData) {
        setProfileUnavailable(true);
        setErrorMessage('Não foi possível localizar o cadastro vinculado a esta conta. Procure a Secretaria.');
        setLoading(false);
        return;
      }
      if (religiosoData) {
        setBase(previous => ({ ...previous, ...Object.fromEntries(Object.entries(religiosoData).filter(([key]) => key in previous).map(([key, value]) => [key, value == null ? '' : String(value)])), consentimento_dados: religiosoData.consentimento_dados ? 'true' : '' }));
        if (profileReligiosoId) {
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
        if (familiaData.data?.length) setFamiliares(familiaData.data as Familiar[]);
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
          ...(formacaoData.data || []).map(row => ({ ...row, tipo: 'formacao', inicio: row.data_ingresso || '', fim: row.data_conclusao || '' })),
          ...(votosData.data || []).map(row => ({
            ...row,
            tipo: 'voto',
            voto_tipo: votoTypeFromDatabase[row.tipo] || row.tipo,
            renovacao: row.renovacao ? String(row.renovacao) : '',
          })),
          ...(ministeriosData.data || []).map(row => ({ ...row, tipo: orderOptions.includes(row.tipo) ? 'ordem' : 'ministerio', ministerio: row.tipo })),
          ...(academicaData.data || []).map(row => ({ ...row, tipo: 'academica' })),
          ...(idiomasData.data || []).map(row => ({ ...row, tipo: 'idioma' })),
          ...(competenciasData.data || []).map(row => ({ ...row, tipo: 'competencia' })),
          ...(historicoData.data || []).map(row => ({ ...row, tipo: 'historico', inicio: row.periodo_inicio || '', fim: row.periodo_fim || '' })),
          ...(servicosData.data || []).map(row => ({ ...row, tipo: 'servico', servico_tipo: row.tipo })),
        ]);
        setDocumentosExistentes((documentosData.data || []) as DocumentoExistente[]);
        const saude = saudeData.data;
        const endereco = enderecoData.data;
        setBase(previous => ({ ...previous, ...(saude ? Object.fromEntries(Object.entries(saude).filter(([key]) => key in previous).map(([key, value]) => [key, value == null ? '' : String(value)])) : {}), ...(endereco ? { obra_atual_id: endereco.obra_id || previous.obra_atual_id, telefone_celular: endereco.celular || previous.telefone_celular, email_institucional: endereco.email || previous.email_institucional, whatsapp: endereco.whatsapp || previous.whatsapp, redes_sociais: endereco.redes_sociais || previous.redes_sociais } : {}) }));
      } else if (!adminMode && !religiosoId) {
        // Restaurar rascunho salvo localmente
        try {
          const savedStr = localStorage.getItem(DRAFT_KEY);
          if (savedStr) {
            const saved = JSON.parse(savedStr);
            if (saved && typeof saved === 'object') {
              if (saved.base) setBase(previous => ({ ...previous, ...saved.base }));
              if (saved.familiares?.length) setFamiliares(saved.familiares);
              if (saved.contatosFamiliares?.length) {
                setContatosFamiliares(saved.contatosFamiliares);
              } else if (saved.base && hasAnyNonEmpty([saved.base.contato_nome, saved.base.contato_parentesco, saved.base.contato_1, saved.base.contato_2])) {
                setContatosFamiliares([{
                  nome: saved.base.contato_nome || '',
                  parentesco: saved.base.contato_parentesco || '',
                  contato_1: saved.base.contato_1 || '',
                  contato_2: saved.base.contato_2 || '',
                }]);
              }
              if (saved.sacramentos?.length) setSacramentos(saved.sacramentos);
              if (saved.rows?.length) setRows(saved.rows);
              if (saved.step && typeof saved.step === 'number' && saved.step > 1) {
                const b = saved.base || {};
                const isStep1Valid = requiredStep1.every(f => Boolean(b[f]?.trim())) && validateCpf(b.cpf || '');
                const restoredStep = saved.draftVersion === 2 ? Math.min(saved.step, etapas.length) : oldStepToNewStep(saved.step);
                setStep(isStep1Valid ? restoredStep : 1);
              } else {
                setStep(1);
              }
              if (saved.savedAt) setDraftSavedAt(saved.savedAt);
              setDraftRestored(true);
            }
          }
        } catch (e) {
          console.warn('Erro ao restaurar rascunho de cadastro:', e);
        }
      }
      setLoading(false);
    };
    load().catch(error => {
      console.error('Erro ao carregar cadastro religioso:', error);
      if (profileReligiosoId) {
        setProfileUnavailable(true);
        setErrorMessage('Não foi possível carregar sua ficha vinculada. Tente novamente ou procure a Secretaria.');
      }
      setLoading(false);
    });
  }, [adminMode, profileReligiosoId, religiosoId]);

  // Auto-save no localStorage com debounce para não sobrecarregar
  useEffect(() => {
    if (adminMode || religiosoId || loading) return;

    const hasContent = Boolean(
      base.nome_civil?.trim() ||
      base.cpf?.trim() ||
      base.rg?.trim() ||
      contatosFamiliares.some(row => hasAnyValues(row, ['nome', 'parentesco', 'contato_1', 'contato_2'])) ||
      familiares.some(row => hasAnyValues(row, ['nome', 'data_nascimento', 'local_nascimento', 'estado_civil', 'data_evento'])) ||
      sacramentos.some(row => hasAnyValues(row, ['data', 'paroquia', 'diocese', 'cidade', 'uf', 'livro', 'folha', 'numero_registro', 'celebrante', 'observacoes'])) ||
      rows.some(row => hasAnyValues(row, Object.keys(row).filter(key => key !== 'tipo')))
    );
    if (!hasContent) return;

    const timer = setTimeout(() => {
      try {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const payload = {
          draftVersion: 2,
          base,
          familiares,
          contatosFamiliares,
          sacramentos,
          rows,
          step,
          savedAt: now,
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        setDraftSavedAt(now);
      } catch (e) {
        console.warn('Erro ao salvar rascunho de cadastro:', e);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [base, familiares, contatosFamiliares, sacramentos, rows, step, adminMode, religiosoId, loading]);

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

    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      console.warn('Erro ao remover rascunho:', e);
    }
    setDraftSavedAt(null);
    setDraftRestored(false);
    setStep(1);
    setBase({
      grau: 'Padre', nome_civil: '', nome_religioso: '', nome_elenco: '', data_nascimento: '', local_nascimento: '', municipio_nascimento: '', estado_nascimento: '', pais_nascimento: 'Brasil', nacionalidade: 'Brasileira', cpf: '', rg: '', rg_orgao_expedidor: '', rg_data_emissao: '', titulo_eleitor: '', pis: '', cnh: '', cnh_categoria: '', passaporte: '', obra_atual_id: '', comunidade_atual_nome: '', email_institucional: '', email_pessoal: '', telefone_celular: '', whatsapp: '', redes_sociais: '', status: 'Ativo', status_cadastro: 'Aprovado',
      contato_nome: '', contato_parentesco: '', contato_1: '', contato_2: '', paroquia_origem: '', diocese_origem: '', grupo_movimento_pastoral: '', promotor_vocacional: '', plano_saude: '', numero_plano_saude: '', local_plano_saude: '', sus: '', tipo_sanguineo: '', fator_rh: '', alergias: '', medicamentos_continuos: '', medico_responsavel: '', contato_emergencia: '', informacoes_clinicas: '', cirurgias: '', proteses: '', observacoes_saude: '', consentimento_dados: '',
    });
    setFamiliares([emptyFamiliar('Pai'), emptyFamiliar('Mãe')]);
    setContatosFamiliares([]);
    setSacramentos([emptySacrament('Batismo'), emptySacrament('Primeira Eucaristia'), emptySacrament('Crisma')]);
    setRows([]);
    showToast.info('Rascunho reiniciado.');
  };

  const updateBase = (field: string, value: string) => {
    setBase(previous => ({ ...previous, [field]: value }));
    if (invalidFields.includes(field)) {
      setInvalidFields(previous => previous.filter(f => f !== field));
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };
  const updateRow = (index: number, field: string, value: string) => setRows(previous => previous.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  const addRow = (values: Record<string, string> = {}) => setRows(previous => [...previous, values]);
  const removeRow = (index: number) => setRows(previous => previous.filter((_, rowIndex) => rowIndex !== index));
  const updateFamiliar = (index: number, field: keyof Familiar, value: string) => setFamiliares(previous => previous.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  const updateContact = (index: number, field: keyof ContatoFamiliar, value: string) => setContatosFamiliares(previous => previous.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  const updateSacrament = (index: number, field: keyof Sacrament, value: string) => setSacramentos(previous => previous.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
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
        const missingLabels = missing.map(f => getFieldLabel(f)).join(', ');
        return `Por favor, preencha os campos obrigatórios da identificação: ${missingLabels}.`;
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
    }
    if (targetStep === 5 && rows.some(row => row.tipo === 'servico' && hasAnyValues(row, ['servico_tipo', 'instituicao', 'funcao', 'periodo', 'local', 'documento', 'observacao']) && !row.servico_tipo?.trim())) {
      return 'Selecione o tipo de cada missão ou serviço iniciado.';
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
      const religiosoPayload = {
        grau: base.grau, nome_civil: base.nome_civil, nome_religioso: base.nome_religioso || null,
        ...(adminMode ? {
          nome_elenco: base.nome_elenco || base.nome_religioso || base.nome_civil || null,
          cadastro_elenco_provisorio: false,
        } : {}),
        data_nascimento: base.data_nascimento || null, local_nascimento: base.local_nascimento || null,
        municipio_nascimento: base.municipio_nascimento || null, estado_nascimento: base.estado_nascimento || null,
        pais_nascimento: base.pais_nascimento || null, nacionalidade: base.nacionalidade || null,
        cpf: base.cpf || null, rg: base.rg || null, rg_orgao_expedidor: base.rg_orgao_expedidor || null,
        rg_data_emissao: base.rg_data_emissao || null, titulo_eleitor: base.titulo_eleitor || null,
        pis: base.pis || null, cnh: base.cnh || null, cnh_categoria: base.cnh_categoria || null,
        passaporte: base.passaporte || null,
        comunidade_atual_nome: base.comunidade_atual_nome || null,
        obra_atual_id: base.obra_atual_id || null,
        email_institucional: base.email_institucional || null,
        email_pessoal: base.email_pessoal || null, telefone_celular: base.telefone_celular || null,
        whatsapp: base.whatsapp || null, redes_sociais: base.redes_sociais || null,
        origem_cadastro: adminMode ? 'admin' : 'publico', status_cadastro: adminMode ? (base.status_cadastro || 'Aprovado') : 'Em revisão', status: adminMode ? (base.status || 'Ativo') : 'Ativo',
        consentimento_dados: true, consentimento_em: new Date().toISOString(),
        ...(religiosoId ? { cadastro_elenco_provisorio: false } : {}),
      };
      const parentRequest = religiosoId
        ? await supabase.from('religiosos').update(religiosoPayload).eq('id', religiosoId).select('id').single()
        : await supabase.from('religiosos').insert(religiosoPayload).select('id').single();
      const { data: religioso, error: religiosoError } = parentRequest;
      if (religiosoError || !religioso) throw religiosoError || new Error('Não foi possível criar o cadastro.');
      const id = religioso.id;
      const insertMany = async (table: string, values: Record<string, unknown>[]) => {
        const filtered = values.filter(value => Object.values(value).some(item => item !== '' && item !== null && item !== undefined));
        if (!filtered.length) return;
        const { error } = await supabase.from(table).insert(filtered.map(value => ({ ...value, religioso_id: id })));
        if (error) throw error;
      };
      if (religiosoId) {
        for (const table of ['religiosos_familiares', 'religiosos_contatos_familiares', 'religiosos_sacramentos', 'religiosos_historico_vocacional', 'religiosos_origem_vocacional', 'religiosos_formacao_religiosa', 'religiosos_profissoes_votos', 'religiosos_ministerios_ordens', 'religiosos_formacao_academica', 'religiosos_idiomas', 'religiosos_competencias', 'religiosos_historico_comunidades', 'religiosos_missoes_servicos', 'religiosos_enderecos_contatos', 'religiosos_saude']) {
          const { error } = await supabase.from(table).delete().eq('religioso_id', id);
          if (error) throw error;
        }
      }
      await insertMany('religiosos_familiares', familiares.filter(row => row.nome.trim()).map(row => ({
        tipo: row.tipo,
        nome: row.nome,
        data_nascimento: row.data_nascimento || null,
        local_nascimento: row.local_nascimento || null,
        estado_civil: row.estado_civil || null,
        data_evento: row.estado_civil?.startsWith('Falecid') ? row.data_evento || null : null,
      })));
      await insertMany('religiosos_contatos_familiares', contatosFamiliares.filter(row => row.nome.trim()).map(row => ({
        nome: row.nome,
        parentesco: row.parentesco || null,
        contato_1: row.contato_1 || null,
        contato_2: row.contato_2 || null,
      })));
      await insertMany('religiosos_sacramentos', sacramentos.filter(row => Object.values(row).some(value => value && value !== row.tipo)).map(row => ({
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
      })));
      await insertMany('religiosos_origem_vocacional', [{ paroquia_origem: base.paroquia_origem, diocese: base.diocese_origem, grupo_movimento_pastoral: base.grupo_movimento_pastoral, promotor_vocacional: base.promotor_vocacional }]);
      await insertMany('religiosos_historico_vocacional', rows.filter(row => row.tipo === 'vocacional').map(row => ({ data_evento: row.data, ano: row.ano ? Number(row.ano) : null, titulo: row.titulo, descricao: row.descricao, local: row.local, responsavel: row.responsavel })));
      await insertMany('religiosos_formacao_religiosa', rows.filter(row => row.tipo === 'formacao').map(row => ({ etapa: row.etapa, instituicao: row.instituicao, cidade: row.cidade, local: row.local, data_ingresso: row.inicio || null, data_conclusao: row.fim || null, formador: row.formador })));
      await insertMany('religiosos_profissoes_votos', rows.filter(row => row.tipo === 'voto').map(row => ({
        tipo: votoTypeToDatabase[row.voto_tipo] || row.voto_tipo,
        renovacao: row.voto_tipo === 'Renovação de Votos' && row.renovacao ? Number(row.renovacao) : null,
        data: row.data || null,
        local: row.local || null,
        celebrante: row.celebrante || null,
      })));
      await insertMany('religiosos_ministerios_ordens', rows.filter(row => row.tipo === 'ministerio' || row.tipo === 'ordem').map(row => ({
        tipo: row.ministerio,
        data: row.data || null,
        local: row.local || null,
        celebrante: row.celebrante || null,
        bispo_ordenante: row.bispo_ordenante || null,
      })));
      await insertMany('religiosos_formacao_academica', rows.filter(row => row.tipo === 'academica').map(row => ({ categoria: row.categoria, instituicao: row.instituicao, periodo: row.periodo, pais: row.pais || null, cidade: row.cidade, estado: row.estado, observacoes: row.observacoes })));
      await insertMany('religiosos_idiomas', rows.filter(row => row.tipo === 'idioma').map(row => ({ idioma: row.idioma, nivel: row.nivel, fala: row.fala, audicao: row.audicao, leitura: row.leitura, escrita: row.escrita, observacoes: row.observacoes })));
      await insertMany('religiosos_competencias', rows.filter(row => row.tipo === 'competencia').map(row => ({ competencia: row.competencia, observacoes: row.observacoes })));
      await insertMany('religiosos_historico_comunidades', rows.filter(row => row.tipo === 'historico').map(row => ({ periodo_inicio: row.inicio || null, periodo_fim: row.fim || null, instituicao: row.instituicao, funcao: row.funcao, local: row.local, observacoes: row.observacoes })));
      await insertMany('religiosos_missoes_servicos', rows.filter(row => row.tipo === 'servico').map(row => ({ tipo: row.servico_tipo, instituicao: row.instituicao, funcao: row.funcao, periodo: row.periodo, local: row.local, documento: row.documento, observacao: row.observacao })));
      await insertMany('religiosos_enderecos_contatos', [{ obra_id: base.obra_atual_id || null, celular: base.telefone_celular, email: base.email_institucional || base.email_pessoal, whatsapp: base.whatsapp, redes_sociais: base.redes_sociais }]);
      await insertMany('religiosos_saude', [{ plano_saude: base.plano_saude, numero_plano_saude: base.numero_plano_saude, local_plano_saude: base.local_plano_saude, sus: base.sus, tipo_sanguineo: base.tipo_sanguineo, fator_rh: base.fator_rh, alergias: base.alergias, medicamentos_continuos: base.medicamentos_continuos, medico_responsavel: base.medico_responsavel, contato_emergencia: base.contato_emergencia, informacoes_clinicas: base.informacoes_clinicas, cirurgias: base.cirurgias, proteses: base.proteses, observacoes: base.observacoes_saude }]);
      for (const documento of documentos) {
        const path = `${id}/${crypto.randomUUID()}-${documento.arquivo.name}`;
        const upload = await supabase.storage.from('religiosos-documentos').upload(path, documento.arquivo);
        if (upload.error) throw upload.error;
        const { error } = await supabase.from('religiosos_documentos').insert({ religioso_id: id, categoria: documento.categoria, nome_arquivo: documento.arquivo.name, caminho_storage: path, mime_type: documento.arquivo.type, tamanho_bytes: documento.arquivo.size, quem_cadastrou: 'Religioso - cadastro público' });
        if (error) throw error;
      }
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (e) {
        console.warn('Erro ao limpar rascunho:', e);
      }
      if (adminMode) navigate('/religiosos');
      else setSuccess(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível enviar o cadastro.');
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

  if (!adminMode && !publicConfig.ativo) {
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
      <form onSubmit={submit} className="w-full max-w-6xl mx-auto rounded-[6px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 sm:p-10 transition-colors">
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

        {/* Auto-save Status Pill for Public Form */}
        {!adminMode && !religiosoId && draftSavedAt && (
          <div className="mb-6 flex items-center justify-between px-4 py-2.5 rounded-[6px] bg-[#226380]/5 border border-[#226380]/20 text-xs text-[#226380] dark:text-[#A3C3C7] no-print">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>
                {draftRestored ? 'Rascunho recuperado. ' : ''}Salvo automaticamente às {draftSavedAt}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearDraft}
              className="text-[11px] underline hover:text-[#226380]/80 transition-colors cursor-pointer shrink-0"
            >
              Limpar rascunho
            </button>
          </div>
        )}

        {/* Apple Horizontal Stepper Pill Bar */}
        <div className="mb-8 overflow-x-auto pb-2 -mx-2 px-2">
          <div className="flex items-center gap-2 min-w-max">
            {etapas.map((label, index) => {
              const stepIndex = index + 1;
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

        {profileReligiosoId && (
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
                <p className="text-xs text-[#707070] dark:text-[#a1a1a6]">A Secretaria ainda não registrou uma designação vigente para este cadastro.</p>
              )}
            </div>
          </section>
        )}

        {/* Step Contents */}
        {step === 1 && (
          <Section title="1. Identificação e Contatos">
            <Fields fields={['grau', 'nome_civil', 'nome_religioso', 'data_nascimento', 'local_nascimento', 'municipio_nascimento', 'estado_nascimento', 'pais_nascimento', 'nacionalidade', 'cpf', 'rg', 'rg_orgao_expedidor', 'rg_data_emissao', 'titulo_eleitor', 'pis', 'cnh', 'cnh_categoria', 'passaporte', 'email_institucional', 'email_pessoal', 'telefone_celular', 'whatsapp', 'redes_sociais']} base={base} update={updateBase} invalidFields={invalidFields} requiredFields={requiredStep1} selects={{ grau: ['Padre', 'Diácono', 'Frater', 'Irmão', 'Bispo'], estado_nascimento: ufFallback }} />
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
                  <Fields fields={['nome', 'data_nascimento', 'local_nascimento', 'estado_civil']} base={row} update={(field, value) => updateFamiliar(index, field as keyof Familiar, value)} selects={{ estado_civil: maritalStatusOptions }} idPrefix={`familiar-${index}-`} />
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
              <DynamicSection title="Etapas da Formação" type="formacao" fields={['etapa', 'instituicao', 'cidade', 'local', 'inicio', 'fim', 'formador']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} selects={{ etapa: formationOptions }} />
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
            <DynamicSection title="Ministérios" type="ministerio" fields={['ministerio', 'data', 'local', 'celebrante']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} selects={{ ministerio: ministryOptions }} />
            {base.grau !== 'Frater' && (
              <div className="mt-8 border-t border-[#e5e5ea] pt-6 dark:border-white/10">
                <DynamicSection title="Sacramento da Ordem" type="ordem" fields={['ministerio', 'data', 'local', 'celebrante', 'bispo_ordenante']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} selects={{ ministerio: orderOptions }} />
              </div>
            )}
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
              {profileReligiosoId ? (
                <p className="text-sm text-[#707070] dark:text-[#a1a1aa]">A Secretaria mantém atualizados a obra, a comunidade e o endereço do Elenco.</p>
              ) : (
                <>
                  <p className="mb-4 text-sm text-[#707070] dark:text-[#a1a1aa]">Selecione a obra da Província à qual está vinculado. Os dados de localização serão exibidos a partir do cadastro da obra.</p>
                  <Fields
                    fields={['obra_atual_id']}
                    base={base}
                    update={(_, value) => {
                      const obra = obras.find(item => item.id === value);
                      setBase(previous => ({ ...previous, obra_atual_id: value, comunidade_atual_nome: obra?.nome || '' }));
                      setErrorMessage(null);
                    }}
                    selects={{ obra_atual_id: obras.map(obra => ({ value: obra.id, label: obra.nome })) }}
                  />
                  {(() => {
                    const obra = obras.find(item => item.id === base.obra_atual_id);
                    if (!obra) return null;
                    const endereco = [obra.logradouro, obra.numero, obra.complemento, obra.bairro].filter(Boolean).join(', ');
                    const localidade = [obra.localidade || obra.cidade, obra.uf || obra.estado].filter(Boolean).join(' - ');
                    return (
                      <div className="mt-4 rounded-[6px] border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-white/[0.03]">
                        <p className="font-semibold text-[#1d1d1f] dark:text-white">{obra.nome}</p>
                        {endereco && <p className="mt-1 text-[#707070] dark:text-[#a1a1aa]">{endereco}</p>}
                        {localidade && <p className="mt-1 text-[#707070] dark:text-[#a1a1aa]">{localidade}{obra.cep ? ` · CEP ${obra.cep}` : ''}</p>}
                      </div>
                    );
                  })()}
                </>
              )}
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
            {(adminMode || profileReligiosoId) && documentosExistentes.length > 0 && (
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
                      {['RG', 'CPF', 'CNH', 'Passaporte', 'Título de eleitor', 'Certidão de nascimento', 'Batismo', 'Primeira Eucaristia', 'Crisma', 'Admissão ao Postulantado', 'Admissão ao Noviciado', 'Primeira Profissão Religiosa', 'Renovações', 'Votos perpétuos', 'Diaconato', 'Presbiterado', 'Episcopado', 'Histórico escolar', 'Diplomas', 'Certificados', 'Decretos', 'Licenças', 'Dispensas', 'Indultos', 'Contratos', 'Procurações', 'Outros'].map(option => <option key={option}>{option}</option>)}
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
        <footer className="mt-10 flex items-center justify-between border-t border-[#e5e5ea] dark:border-white/10 pt-6">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(previous => previous - 1)}
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
                  setStep(previous => previous + 1);
                }
              }}
              className="inline-flex items-center gap-2 rounded-[6px] bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 text-white px-7 py-3 text-xs font-semibold transition-all cursor-pointer shadow-none active:scale-[0.98]"
            >
              <span>Avançar</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting || profileUnavailable}
              className="inline-flex items-center gap-2 rounded-[6px] bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 text-white px-8 py-3 text-xs font-semibold transition-all cursor-pointer shadow-none active:scale-[0.98] disabled:opacity-50"
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
  selects?: Record<string, string[] | { value: string; label: string }[]>;
  invalidFields?: string[];
  requiredFields?: string[];
  idPrefix?: string;
}> = ({ fields, base, update, selects = {}, invalidFields = [], requiredFields = [], idPrefix = '' }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {fields.map(field => {
      const isRequired = requiredFields.includes(field);
      const isOptional = !isRequired;
      const isInvalid = invalidFields.includes(field);
      const fieldId = `${idPrefix}input-${field}`;
      return (
        <label className="space-y-1.5 block" key={field} htmlFor={fieldId}>
          <span className="text-[12px] font-medium text-[#707070] dark:text-[#86868b] flex items-center justify-between">
            <span>
              {getFieldLabel(field)}
              {!isOptional && <span className="text-rose-500 ml-1 font-bold">*</span>}
            </span>
            {isOptional && <span className="text-[10px] text-[#86868b] font-normal lowercase">(opcional)</span>}
          </span>
          {selects[field] ? (
            <select
              id={fieldId}
              required={isRequired}
              className={`${inputClass} ${isInvalid ? '!border-rose-500 !ring-rose-500/20 ring-4 focus:!border-rose-500' : ''}`}
              value={base[field] || ''}
              onChange={event => update(field, event.target.value)}
            >
              <option value="">Selecione...</option>
              {base[field] && !selects[field].some(option => typeof option === 'string' ? option === base[field] : option.value === base[field]) && (
                <option value={base[field]}>{base[field]} (atual)</option>
              )}
              {selects[field].map(option =>
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
              type={field.includes('data') || field === 'inicio' || field === 'fim' ? 'date' : field.includes('email') ? 'email' : 'text'}
              value={base[field] || ''}
              placeholder={field === 'cpf' ? '000.000.000-00' : isOptional ? 'Opcional' : ''}
              onChange={event => update(field, field === 'cpf' ? formatCpf(event.target.value) : event.target.value)}
            />
          )}
        </label>
      );
    })}
  </div>
);

const DynamicSection: React.FC<{
  title: string;
  type: string;
  fields: string[];
  rows: Record<string, string>[];
  addRow: (values?: Record<string, string>) => void;
  updateRow: (index: number, field: string, value: string) => void;
  removeRow: (index: number) => void;
  selects?: Record<string, string[] | { value: string; label: string }[]>;
  visibleFields?: (row: Record<string, string>) => string[];
  children?: React.ReactNode;
}> = ({ title, type, fields, rows, addRow, updateRow, removeRow, selects = {}, visibleFields, children }) => (
  <Section title={title}>
    {children}
    <div className="space-y-4">
      {rows.map((row, index) => row.tipo === type && (
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
          <Fields fields={visibleFields ? visibleFields(row) : fields} base={row} update={(field, value) => updateRow(index, field, value)} selects={selects} idPrefix={`${type}-${index}-`} />
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
    {children}
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

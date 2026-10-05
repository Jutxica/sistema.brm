import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, FileUp, Loader2, Plus, Trash2, Printer } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { confirmAction, showToast } from '../hooks/useFeedback';

interface ObraReferencia { id: string; nome: string; localidade: string | null; cidade?: string | null; uf: string | null; diocese?: string | null }
interface Familiar extends Record<string, string> { tipo: 'Pai' | 'Mãe' | 'Irmão'; nome: string; data_nascimento: string; local_nascimento: string; estado_civil: string; data_evento: string }
interface Sacrament extends Record<string, string> { tipo: string; data: string; paroquia: string; diocese: string; cidade: string; uf: string; livro: string; folha: string; numero_registro: string; celebrante: string; observacoes: string }
interface DocumentoSelecionado { categoria: string; arquivo: File }
interface DocumentoExistente { id: string; categoria: string; nome_arquivo: string; caminho_storage: string; data_cadastro: string }
interface ReligiososConfigPublica { ativo: boolean; titulo: string; mensagem_abertura: string; mensagem_fechamento: string; mensagem_confirmacao: string; termos: string; exigir_documentos: boolean; instrucoes_documentos: string }
interface CadastroReligiosoPublicoProps { adminMode?: boolean }

const DRAFT_KEY = 'brm_rascunho_cadastro_religioso_v1';

const etapas = [
  'Identificação', 'Família', 'Sacramentos', 'Vocação', 'Formação', 'Ministérios',
  'Acadêmica', 'Idiomas', 'Histórico', 'Missões', 'Endereço', 'Saúde', 'Documentos',
];
const inputClass = 'w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-[6px] bg-white dark:bg-[#161b22] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] shadow-none outline-none transition-all duration-200 focus:border-slate-900 dark:focus:border-white font-mono';
const fieldLabels: Record<string, string> = {
  grau: 'Grau', nome_civil: 'Nome completo', nome_religioso: 'Nome religioso', data_nascimento: 'Data de nascimento',
  local_nascimento: 'Local de nascimento', municipio_nascimento: 'Município', estado_nascimento: 'Estado', pais_nascimento: 'País',
  nacionalidade: 'Nacionalidade', cpf: 'CPF', rg: 'RG', rg_orgao_expedidor: 'Órgão expedidor', rg_data_emissao: 'Data de emissão do RG',
  titulo_eleitor: 'Título de eleitor', pis: 'PIS', cnh: 'CNH', cnh_categoria: 'Categoria da CNH', passaporte: 'Passaporte',
  contato_nome: 'Nome do contato', contato_parentesco: 'Parentesco', contato_1: 'Contato 1', contato_2: 'Contato 2',
  paroquia_origem: 'Paróquia de origem', diocese_origem: 'Diocese', grupo_movimento_pastoral: 'Grupo ou movimento pastoral', promotor_vocacional: 'Promotor vocacional',
  obra_atual_id: 'Obra atual', comunidade_atual_nome: 'Comunidade atual', email_institucional: 'E-mail institucional', email_pessoal: 'E-mail pessoal',
  telefone_celular: 'Celular', whatsapp: 'WhatsApp', redes_sociais: 'Redes sociais', plano_saude: 'Plano de saúde', numero_plano_saude: 'Número do plano',
  local_plano_saude: 'Local do plano', sus: 'SUS', tipo_sanguineo: 'Tipo sanguíneo', fator_rh: 'Fator Rh', alergias: 'Alergias',
  medicamentos_continuos: 'Medicamentos de uso contínuo', medico_responsavel: 'Médico responsável', contato_emergencia: 'Contato de emergência',
  informacoes_clinicas: 'Informações clínicas', cirurgias: 'Cirurgias', proteses: 'Próteses', observacoes_saude: 'Observações',
  nome: 'Nome', data: 'Data', paroquia: 'Paróquia', diocese: 'Diocese', cidade: 'Cidade', uf: 'UF', livro: 'Livro', folha: 'Folha',
  numero_registro: 'Número do registro', celebrante: 'Celebrante', observacoes: 'Observações', ano: 'Ano', titulo: 'Título', descricao: 'Descrição',
  local: 'Local', responsavel: 'Responsável', etapa: 'Etapa', instituicao: 'Instituição', inicio: 'Data de ingresso', fim: 'Data de conclusão',
  formador: 'Formador responsável', voto_tipo: 'Tipo de voto', renovacao: 'Número da renovação', ministerio: 'Ministério ou ordem', bispo_ordenante: 'Bispo ordenante',
  categoria: 'Categoria', periodo: 'Período', estado: 'Estado', idioma: 'Idioma', nivel: 'Nível', fala: 'Fala', audicao: 'Audição', leitura: 'Leitura', escrita: 'Escrita',
  competencia: 'Competência', funcao: 'Função', servico_tipo: 'Tipo de serviço', documento: 'Documento', observacao: 'Observação',
};
const getFieldLabel = (field: string) => fieldLabels[field] || field.replaceAll('_', ' ').replace(/^./, character => character.toUpperCase());
const hasValues = (record: Record<string, string>, fields: string[]) => fields.every(field => record[field]?.trim());
const requiredRecord = (record: Record<string, string>, fields: string[]) => record && hasValues(record, fields);
const emptySacrament = (tipo: string): Sacrament => ({ tipo, data: '', paroquia: '', diocese: '', cidade: '', uf: '', livro: '', folha: '', numero_registro: '', celebrante: '', observacoes: '' });
const emptyFamiliar = (tipo: Familiar['tipo'] = 'Irmão'): Familiar => ({ tipo, nome: '', data_nascimento: '', local_nascimento: '', estado_civil: '', data_evento: '' });
const defaultPublicConfig: ReligiososConfigPublica = { ativo: true, titulo: 'Atualização de Dados dos Religiosos', mensagem_abertura: '', mensagem_fechamento: 'As inscrições estão temporariamente fechadas.', mensagem_confirmacao: 'Recebemos seus dados e documentos. A secretaria fará a conferência.', termos: 'Declaro a veracidade das informações e autorizo expressamente a Província BRM a realizar o tratamento dos meus dados pessoais e dados pessoais sensíveis (incluindo dados de saúde, emergência médica e histórico canônico), com a finalidade exclusiva de gestão eclesiástica, assistência à saúde e contato institucional, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).', exigir_documentos: true, instrucoes_documentos: '' };

export const requiredStep1 = [
  'grau', 'nome_civil', 'data_nascimento', 'local_nascimento',
  'municipio_nascimento', 'estado_nascimento', 'pais_nascimento',
  'nacionalidade', 'cpf', 'rg', 'rg_orgao_expedidor', 'rg_data_emissao'
];

export const optionalFields = new Set([
  'nome_religioso', 'titulo_eleitor', 'pis', 'cnh', 'cnh_categoria', 'passaporte',
  'redes_sociais', 'alergias', 'medicamentos_continuos', 'cirurgias', 'proteses',
  'observacoes_saude', 'observacoes', 'observacao', 'documento', 'contato_2'
]);

export const validateCpf = (cpf: string): boolean => {
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

export const formatCpf = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const CadastroReligiosoPublico: React.FC<CadastroReligiosoPublicoProps> = ({ adminMode = false }) => {
  const navigate = useNavigate();
  const { id: religiosoId } = useParams<{ id: string }>();
  const [step, setStep] = useState(1);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [obras, setObras] = useState<ObraReferencia[]>([]);
  const [loading, setLoading] = useState(true);
  const ufOptions = Array.from(new Set(obras.map(item => item.uf).filter((value): value is string => Boolean(value)))).sort();
  const localidadeOptions = Array.from(new Set(obras.map(item => item.localidade || item.cidade).filter((value): value is string => Boolean(value)))).sort();
  const dioceseOptions = Array.from(new Set(obras.map(item => item.diocese).filter((value): value is string => Boolean(value)))).sort();
  const ufFallback = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoSelecionado[]>([]);
  const [documentosExistentes, setDocumentosExistentes] = useState<DocumentoExistente[]>([]);
  const [publicConfig, setPublicConfig] = useState(defaultPublicConfig);
  const [familiares, setFamiliares] = useState<Familiar[]>([emptyFamiliar('Pai'), emptyFamiliar('Mãe')]);
  const [sacramentos, setSacramentos] = useState<Sacrament[]>([emptySacrament('Batismo'), emptySacrament('Primeira Eucaristia'), emptySacrament('Crisma')]);
  const [base, setBase] = useState<Record<string, string>>({
    grau: 'Padre', nome_civil: '', nome_religioso: '', data_nascimento: '', local_nascimento: '', municipio_nascimento: '', estado_nascimento: '', pais_nascimento: 'Brasil', nacionalidade: 'Brasileira', cpf: '', rg: '', rg_orgao_expedidor: '', rg_data_emissao: '', titulo_eleitor: '', pis: '', cnh: '', cnh_categoria: '', passaporte: '', obra_atual_id: '', comunidade_atual_nome: '', email_institucional: '', email_pessoal: '', telefone_celular: '', whatsapp: '', redes_sociais: '', status: 'Ativo', status_cadastro: 'Aprovado',
    contato_nome: '', contato_parentesco: '', contato_1: '', contato_2: '', paroquia_origem: '', diocese_origem: '', grupo_movimento_pastoral: '', promotor_vocacional: '', plano_saude: '', numero_plano_saude: '', local_plano_saude: '', sus: '', tipo_sanguineo: '', fator_rh: '', alergias: '', medicamentos_continuos: '', medico_responsavel: '', contato_emergencia: '', informacoes_clinicas: '', cirurgias: '', proteses: '', observacoes_saude: '', consentimento_dados: '',
  });
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: obrasData }, { data: religiosoData }, { data: configData }] = await Promise.all([
        supabase.from('religiosos_obras_referencia').select('id,nome,localidade,cidade,uf,diocese').eq('status', 'Ativa').order('nome'),
        adminMode && religiosoId ? supabase.from('religiosos').select('*').eq('id', religiosoId).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from('religiosos_configuracoes').select('ativo,titulo,mensagem_abertura,mensagem_fechamento,mensagem_confirmacao,termos,exigir_documentos,instrucoes_documentos').limit(1).maybeSingle(),
      ]);
      setObras((obrasData || []) as ObraReferencia[]);
      if (configData) setPublicConfig({ ...defaultPublicConfig, ...configData });
      if (religiosoData) {
        setBase(previous => ({ ...previous, ...Object.fromEntries(Object.entries(religiosoData).filter(([key]) => key in previous).map(([key, value]) => [key, value == null ? '' : String(value)])), consentimento_dados: religiosoData.consentimento_dados ? 'true' : '' }));
        const [familiaData, contatoData, sacramentoData, saudeData, enderecoData, origemData, vocacaoData, formacaoData, votosData, ministeriosData, academicaData, idiomasData, competenciasData, historicoData, servicosData, documentosData] = await Promise.all([
          supabase.from('religiosos_familiares').select('*').eq('religioso_id', religiosoId),
          supabase.from('religiosos_contatos_familiares').select('*').eq('religioso_id', religiosoId).limit(1).maybeSingle(),
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
        if (sacramentoData.data?.length) setSacramentos(sacramentoData.data as Sacrament[]);
        const origem = origemData.data;
        if (origem) setBase(previous => ({ ...previous, paroquia_origem: origem.paroquia_origem || '', diocese_origem: origem.diocese || '', grupo_movimento_pastoral: origem.grupo_movimento_pastoral || '', promotor_vocacional: origem.promotor_vocacional || '' }));
        setRows([
          ...(vocacaoData.data || []).map(row => ({ ...row, tipo: 'vocacional' })),
          ...(formacaoData.data || []).map(row => ({ ...row, tipo: 'formacao', inicio: row.data_ingresso || '', fim: row.data_conclusao || '' })),
          ...(votosData.data || []).map(row => ({ ...row, tipo: 'voto', voto_tipo: row.tipo, renovacao: row.renovacao ? String(row.renovacao) : '' })),
          ...(ministeriosData.data || []).map(row => ({ ...row, tipo: 'ministerio', ministerio: row.tipo })),
          ...(academicaData.data || []).map(row => ({ ...row, tipo: 'academica' })),
          ...(idiomasData.data || []).map(row => ({ ...row, tipo: 'idioma' })),
          ...(competenciasData.data || []).map(row => ({ ...row, tipo: 'competencia' })),
          ...(historicoData.data || []).map(row => ({ ...row, tipo: 'historico', inicio: row.periodo_inicio || '', fim: row.periodo_fim || '' })),
          ...(servicosData.data || []).map(row => ({ ...row, tipo: 'servico', servico_tipo: row.tipo })),
        ]);
        setDocumentosExistentes((documentosData.data || []) as DocumentoExistente[]);
        const contato = contatoData.data;
        const saude = saudeData.data;
        const endereco = enderecoData.data;
        setBase(previous => ({ ...previous, ...(contato ? { contato_nome: contato.nome || '', contato_parentesco: contato.parentesco || '', contato_1: contato.contato_1 || '', contato_2: contato.contato_2 || '' } : {}), ...(saude ? Object.fromEntries(Object.entries(saude).filter(([key]) => key in previous).map(([key, value]) => [key, value == null ? '' : String(value)])) : {}), ...(endereco ? { obra_atual_id: endereco.obra_id || previous.obra_atual_id, telefone_celular: endereco.celular || previous.telefone_celular, email_institucional: endereco.email || previous.email_institucional, whatsapp: endereco.whatsapp || previous.whatsapp, redes_sociais: endereco.redes_sociais || previous.redes_sociais } : {}) }));
      } else if (!adminMode && !religiosoId) {
        // Restaurar rascunho salvo localmente
        try {
          const savedStr = localStorage.getItem(DRAFT_KEY);
          if (savedStr) {
            const saved = JSON.parse(savedStr);
            if (saved && typeof saved === 'object') {
              if (saved.base) setBase(previous => ({ ...previous, ...saved.base }));
              if (saved.familiares?.length) setFamiliares(saved.familiares);
              if (saved.sacramentos?.length) setSacramentos(saved.sacramentos);
              if (saved.rows?.length) setRows(saved.rows);
              if (saved.step && typeof saved.step === 'number' && saved.step > 1) {
                const b = saved.base || {};
                const isStep1Valid = requiredStep1.every(f => Boolean(b[f]?.trim())) && validateCpf(b.cpf || '');
                setStep(isStep1Valid ? saved.step : 1);
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
    load().catch(error => { console.error('Erro ao carregar cadastro religioso:', error); setLoading(false); });
  }, [adminMode, religiosoId]);

  // Auto-save no localStorage com debounce para não sobrecarregar
  useEffect(() => {
    if (adminMode || religiosoId || loading) return;

    const hasContent = Boolean(
      base.nome_civil?.trim() ||
      base.cpf?.trim() ||
      base.rg?.trim() ||
      (rows && rows.length > 0)
    );
    if (!hasContent) return;

    const timer = setTimeout(() => {
      try {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const payload = {
          base,
          familiares,
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
  }, [base, familiares, sacramentos, rows, step, adminMode, religiosoId, loading]);

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
      grau: 'Padre', nome_civil: '', nome_religioso: '', data_nascimento: '', local_nascimento: '', municipio_nascimento: '', estado_nascimento: '', pais_nascimento: 'Brasil', nacionalidade: 'Brasileira', cpf: '', rg: '', rg_orgao_expedidor: '', rg_data_emissao: '', titulo_eleitor: '', pis: '', cnh: '', cnh_categoria: '', passaporte: '', obra_atual_id: '', comunidade_atual_nome: '', email_institucional: '', email_pessoal: '', telefone_celular: '', whatsapp: '', redes_sociais: '', status: 'Ativo', status_cadastro: 'Aprovado',
      contato_nome: '', contato_parentesco: '', contato_1: '', contato_2: '', paroquia_origem: '', diocese_origem: '', grupo_movimento_pastoral: '', promotor_vocacional: '', plano_saude: '', numero_plano_saude: '', local_plano_saude: '', sus: '', tipo_sanguineo: '', fator_rh: '', alergias: '', medicamentos_continuos: '', medico_responsavel: '', contato_emergencia: '', informacoes_clinicas: '', cirurgias: '', proteses: '', observacoes_saude: '', consentimento_dados: '',
    });
    setFamiliares([emptyFamiliar('Pai'), emptyFamiliar('Mãe')]);
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
  const updateSacrament = (index: number, field: keyof Sacrament, value: string) => setSacramentos(previous => previous.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
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

  const validateStep = () => {
    const family = ['nome', 'data_nascimento', 'local_nascimento', 'estado_civil', 'data_evento'];
    const sacrament = ['data', 'paroquia', 'diocese', 'cidade', 'uf', 'livro', 'folha', 'numero_registro', 'celebrante', 'observacoes'];
    if (step === 1) {
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
    }
    if (step === 2 && (!familiares.every(row => requiredRecord(row, family)) || !hasValues(base, ['contato_nome', 'contato_parentesco', 'contato_1', 'contato_2']))) return 'Preencha todos os dados familiares e o contato responsável.';
    if (step === 3 && !sacramentos.every(row => requiredRecord(row, sacrament))) return 'Preencha todos os dados dos três sacramentos.';
    if (step === 4 && (!hasValues(base, ['paroquia_origem', 'diocese_origem', 'grupo_movimento_pastoral', 'promotor_vocacional']) || !rows.some(row => row.tipo === 'vocacional' && hasValues(row, ['ano', 'data', 'titulo', 'descricao', 'local', 'responsavel'])))) return 'Preencha a origem vocacional e adicione um evento completo ao histórico.';
    if (step === 5 && (!rows.some(row => row.tipo === 'formacao' && hasValues(row, ['etapa', 'instituicao', 'cidade', 'local', 'inicio', 'fim', 'formador'])) || !rows.some(row => row.tipo === 'voto' && hasValues(row, ['voto_tipo', 'renovacao', 'data', 'local', 'celebrante'])))) return 'Adicione pelo menos uma formação completa e um registro de profissão ou voto.';
    if (step === 6 && !rows.some(row => row.tipo === 'ministerio' && hasValues(row, ['ministerio', 'data', 'local', 'celebrante', 'bispo_ordenante']))) return 'Adicione pelo menos um ministério ou ordem com todos os dados.';
    if (step === 7 && !rows.some(row => row.tipo === 'academica' && hasValues(row, ['categoria', 'instituicao', 'periodo', 'cidade', 'estado', 'observacoes']))) return 'Adicione pelo menos uma formação acadêmica completa.';
    if (step === 8 && (!rows.some(row => row.tipo === 'idioma' && hasValues(row, ['idioma', 'nivel', 'fala', 'audicao', 'leitura', 'escrita', 'observacoes'])) || !rows.some(row => row.tipo === 'competencia' && hasValues(row, ['competencia', 'observacoes'])))) return 'Adicione pelo menos um idioma e uma competência completos.';
    if (step === 9 && !rows.some(row => row.tipo === 'historico' && hasValues(row, ['inicio', 'fim', 'instituicao', 'funcao', 'local', 'observacoes']))) return 'Adicione pelo menos um histórico de comunidade completo.';
    if (step === 10 && !rows.some(row => row.tipo === 'servico' && hasValues(row, ['servico_tipo', 'instituicao', 'funcao', 'periodo', 'local', 'documento', 'observacao']))) return 'Adicione pelo menos uma missão ou serviço completo.';
    if (step === 11 && !hasValues(base, ['obra_atual_id', 'comunidade_atual_nome', 'email_institucional', 'email_pessoal', 'telefone_celular', 'whatsapp', 'redes_sociais'])) return 'Preencha todos os dados do endereço e dos contatos.';
    if (step === 12 && !hasValues(base, ['plano_saude', 'numero_plano_saude', 'local_plano_saude', 'sus', 'tipo_sanguineo', 'fator_rh', 'alergias', 'medicamentos_continuos', 'medico_responsavel', 'contato_emergencia', 'informacoes_clinicas', 'cirurgias', 'proteses', 'observacoes_saude'])) return 'Preencha todos os dados de saúde.';
    if (step === 13 && ((publicConfig.exigir_documentos && !documentos.length) || !base.consentimento_dados)) return `${publicConfig.exigir_documentos ? 'Anexe pelo menos um documento e ' : ''}confirme a autorização.`;
    return null;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateStep();
    if (validation) { setErrorMessage(validation); return; }
    setSubmitting(true); setErrorMessage(null);
    try {
      const religiosoPayload = {
        grau: base.grau, nome_civil: base.nome_civil, nome_religioso: base.nome_religioso || null,
        data_nascimento: base.data_nascimento || null, local_nascimento: base.local_nascimento || null,
        municipio_nascimento: base.municipio_nascimento || null, estado_nascimento: base.estado_nascimento || null,
        pais_nascimento: base.pais_nascimento || null, nacionalidade: base.nacionalidade || null,
        cpf: base.cpf || null, rg: base.rg || null, rg_orgao_expedidor: base.rg_orgao_expedidor || null,
        rg_data_emissao: base.rg_data_emissao || null, titulo_eleitor: base.titulo_eleitor || null,
        pis: base.pis || null, cnh: base.cnh || null, cnh_categoria: base.cnh_categoria || null,
        passaporte: base.passaporte || null, obra_atual_id: base.obra_atual_id || null,
        comunidade_atual_nome: base.comunidade_atual_nome || null, email_institucional: base.email_institucional || null,
        email_pessoal: base.email_pessoal || null, telefone_celular: base.telefone_celular || null,
        whatsapp: base.whatsapp || null, redes_sociais: base.redes_sociais || null,
        origem_cadastro: adminMode ? 'admin' : 'publico', status_cadastro: adminMode ? (base.status_cadastro || 'Aprovado') : 'Em revisão', status: adminMode ? (base.status || 'Ativo') : 'Ativo',
        consentimento_dados: true, consentimento_em: new Date().toISOString(),
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
      await insertMany('religiosos_familiares', familiares.filter(row => row.nome).map(row => row));
      await insertMany('religiosos_contatos_familiares', [{ nome: base.contato_nome, parentesco: base.contato_parentesco, contato_1: base.contato_1, contato_2: base.contato_2 }]);
      await insertMany('religiosos_sacramentos', sacramentos.filter(row => Object.values(row).some(value => value && value !== row.tipo)).map(row => row));
      await insertMany('religiosos_origem_vocacional', [{ paroquia_origem: base.paroquia_origem, diocese: base.diocese_origem, grupo_movimento_pastoral: base.grupo_movimento_pastoral, promotor_vocacional: base.promotor_vocacional }]);
      await insertMany('religiosos_historico_vocacional', rows.filter(row => row.tipo === 'vocacional').map(row => ({ data_evento: row.data, ano: row.ano ? Number(row.ano) : null, titulo: row.titulo, descricao: row.descricao, local: row.local, responsavel: row.responsavel })));
      await insertMany('religiosos_formacao_religiosa', rows.filter(row => row.tipo === 'formacao').map(row => ({ etapa: row.etapa, instituicao: row.instituicao, cidade: row.cidade, local: row.local, data_ingresso: row.inicio || null, data_conclusao: row.fim || null, formador: row.formador })));
      await insertMany('religiosos_profissoes_votos', rows.filter(row => row.tipo === 'voto').map(row => ({ tipo: row.voto_tipo, renovacao: row.renovacao ? Number(row.renovacao) : null, data: row.data || null, local: row.local, celebrante: row.celebrante })));
      await insertMany('religiosos_ministerios_ordens', rows.filter(row => row.tipo === 'ministerio').map(row => ({ tipo: row.ministerio, data: row.data || null, local: row.local, celebrante: row.celebrante, bispo_ordenante: row.bispo_ordenante })));
      await insertMany('religiosos_formacao_academica', rows.filter(row => row.tipo === 'academica').map(row => ({ categoria: row.categoria, instituicao: row.instituicao, periodo: row.periodo, cidade: row.cidade, estado: row.estado, observacoes: row.observacoes })));
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

        {/* Step Contents */}
        {step === 1 && (
          <Section title="1. Identificação Civil e Religiosa">
            <Fields fields={['grau', 'nome_civil', 'nome_religioso', 'data_nascimento', 'local_nascimento', 'municipio_nascimento', 'estado_nascimento', 'pais_nascimento', 'nacionalidade', 'cpf', 'rg', 'rg_orgao_expedidor', 'rg_data_emissao', 'titulo_eleitor', 'pis', 'cnh', 'cnh_categoria', 'passaporte']} base={base} update={updateBase} invalidFields={invalidFields} selects={{ grau: ['Padre', 'Diácono Transitório', 'Frater (Configuração)', 'Frater (Tirocinante)', 'Irmão', 'Bispo'], estado_nascimento: ufFallback }} />
            {adminMode && (
              <div className="mt-6 pt-6 border-t border-[#e5e5ea] dark:border-white/10 grid gap-4 md:grid-cols-2">
                <Fields fields={['status_cadastro', 'status']} base={base} update={updateBase} selects={{ status_cadastro: ['Em revisão', 'Aprovado', 'Arquivado'], status: ['Ativo', 'Em missão externa', 'Em estudos', 'Emérito (Casa São João)', 'Emérito', 'Falecido', 'Exclaustrado'] }} />
              </div>
            )}
          </Section>
        )}

        {step === 2 && (
          <Section title="2. Dados Familiares">
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
                  <Fields fields={['nome', 'data_nascimento', 'local_nascimento', 'estado_civil', 'data_evento']} base={row} update={(field, value) => updateFamiliar(index, field as keyof Familiar, value)} />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setFamiliares(previous => [...previous, emptyFamiliar()])} className="mt-5 inline-flex items-center gap-2 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-[#f5f5f7] dark:bg-white/10 hover:bg-black/5 dark:hover:bg-white/15 px-5 py-2.5 text-xs font-semibold text-[#1d1d1f] dark:text-white transition-all cursor-pointer">
              <Plus className="h-4 w-4" />Adicionar irmão
            </button>
            <div className="mt-8 pt-6 border-t border-[#e5e5ea] dark:border-white/10">
              <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-white mb-4 font-serif">Contato Responsável / Familiar</h3>
              <Fields fields={['contato_nome', 'contato_parentesco', 'contato_1', 'contato_2']} base={base} update={updateBase} />
            </div>
          </Section>
        )}

        {step === 3 && (
          <Section title="3. Sacramentos e Iniciação Cristã">
            <div className="space-y-6">
              {sacramentos.map((row, index) => (
                <div className="rounded-[6px] border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-[#161b22] space-y-4" key={row.tipo}>
                  <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-white font-serif">{row.tipo}</h3>
                  </div>
                  <Fields fields={['data', 'paroquia', 'diocese', 'cidade', 'uf', 'livro', 'folha', 'numero_registro', 'celebrante', 'observacoes']} base={row} update={(field, value) => updateSacrament(index, field as keyof Sacrament, value)} selects={{ diocese: dioceseOptions.length ? dioceseOptions : ['Diocese de Joinville', 'Diocese de Rio do Sul', 'Diocese de Tubarão', 'Arquidiocese de Florianópolis', 'Arquidiocese de Joinville', 'Arquidiocese de Porto Velho'], cidade: localidadeOptions.length ? localidadeOptions : ['Curitiba', 'Joinville', 'Jaraguá do Sul', 'Rio do Sul', 'Brusque', 'Porto Velho'], uf: ufOptions.length ? ufOptions : ufFallback }} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {step === 4 && (
          <DynamicSection title="4. Histórico Vocacional" type="vocacional" fields={['ano', 'data', 'titulo', 'descricao', 'local', 'responsavel']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow}>
            <div className="mb-6 pb-6 border-b border-[#e5e5ea] dark:border-white/10">
              <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-white mb-4">Origem Vocacional</h3>
              <Fields fields={['paroquia_origem', 'diocese_origem', 'grupo_movimento_pastoral', 'promotor_vocacional']} base={base} update={updateBase} selects={{ diocese_origem: dioceseOptions.length ? dioceseOptions : ['Diocese de Joinville', 'Diocese de Rio do Sul', 'Diocese de Tubarão', 'Arquidiocese de Florianópolis', 'Arquidiocese de Joinville', 'Arquidiocese de Porto Velho'] }} />
            </div>
          </DynamicSection>
        )}

        {step === 5 && (
          <DynamicSection title="5. Etapas de Formação, Profissões e Votos" type="formacao" fields={['etapa', 'instituicao', 'cidade', 'local', 'inicio', 'fim', 'formador']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow}>
            <div className="mt-8 pt-6 border-t border-[#e5e5ea] dark:border-white/10">
              <DynamicSection title="Profissões e Votos" type="voto" fields={['voto_tipo', 'renovacao', 'data', 'local', 'celebrante']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} />
            </div>
          </DynamicSection>
        )}

        {step === 6 && (
          <DynamicSection title="6. Ministérios e Ordens" type="ministerio" fields={['ministerio', 'data', 'local', 'celebrante', 'bispo_ordenante']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} />
        )}

        {step === 7 && (
          <DynamicSection title="7. Formação Acadêmica" type="academica" fields={['categoria', 'instituicao', 'periodo', 'cidade', 'estado', 'observacoes']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} />
        )}

        {step === 8 && (
          <DynamicSection title="8. Idiomas e Competências" type="idioma" fields={['idioma', 'nivel', 'fala', 'audicao', 'leitura', 'escrita', 'observacoes']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow}>
            <div className="mt-8 pt-6 border-t border-[#e5e5ea] dark:border-white/10">
              <DynamicSection title="Competências Especiais" type="competencia" fields={['competencia', 'observacoes']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} />
            </div>
          </DynamicSection>
        )}

        {step === 9 && (
          <DynamicSection title="9. Histórico de Comunidades e Nomeações" type="historico" fields={['inicio', 'fim', 'instituicao', 'funcao', 'local', 'observacoes']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} />
        )}

        {step === 10 && (
          <DynamicSection title="10. Missões e Serviços" type="servico" fields={['servico_tipo', 'instituicao', 'funcao', 'periodo', 'local', 'documento', 'observacao']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} />
        )}

        {step === 11 && (
          <Section title="11. Endereço Atual e Contatos">
            <Fields fields={['obra_atual_id', 'comunidade_atual_nome', 'email_institucional', 'email_pessoal', 'telefone_celular', 'whatsapp', 'redes_sociais']} base={base} update={updateBase} selects={{ obra_atual_id: obras.map(obra => ({ value: obra.id, label: `${obra.nome}${obra.localidade ? ` - ${obra.localidade}/${obra.uf || ''}` : ''}` })), comunidade_atual_nome: localidadeOptions.length ? localidadeOptions : ['Curitiba', 'Joinville', 'Jaraguá do Sul', 'Rio do Sul', 'Brusque', 'Porto Velho'] }} />
            <p className="mt-4 text-xs text-[#707070] dark:text-[#86868b] leading-relaxed">A obra selecionada será associada ao endereço atual e seus dados poderão ser completados pela secretaria provincial.</p>
          </Section>
        )}

        {step === 12 && (
          <Section title="12. Informações de Saúde">
            <Fields fields={['plano_saude', 'numero_plano_saude', 'local_plano_saude', 'sus', 'tipo_sanguineo', 'fator_rh', 'alergias', 'medicamentos_continuos', 'medico_responsavel', 'contato_emergencia', 'informacoes_clinicas', 'cirurgias', 'proteses', 'observacoes_saude']} base={base} update={updateBase} selects={{ fator_rh: ['Positivo', 'Negativo', 'Não informado'] }} />
          </Section>
        )}

        {step === 13 && (
          <Section title="13. Documentos e Anexos">
            <p className="mb-6 text-sm text-[#707070] dark:text-[#86868b] leading-relaxed">
              {publicConfig.instrucoes_documentos || 'Anexe documentos pessoais (RG, CPF, CNH, Passaporte), certidões, sacramentos, registros canônicos e acadêmicos.'}
            </p>
            {adminMode && documentosExistentes.length > 0 && (
              <div className="mb-6 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#707070]">Documentos já anexados</h3>
                <div className="grid gap-2">
                  {documentosExistentes.map(documento => (
                    <div className="flex items-center justify-between rounded-[6px] bg-slate-50 dark:bg-white/5 p-3.5 text-xs border border-slate-200 dark:border-slate-800" key={documento.id}>
                      <span className="font-medium text-[#1d1d1f] dark:text-white">
                        <strong className="text-slate-900 dark:text-white">{documento.categoria}</strong> · {documento.nome_arquivo}
                      </span>
                      <button type="button" onClick={() => removeExistingDocument(documento)} className="text-rose-500 hover:text-rose-600 transition-colors cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                      </button>
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
                <input type="file" multiple className="hidden" onChange={event => setDocumentos(previous => [...previous, ...Array.from(event.target.files || []).map(arquivo => ({ arquivo, categoria: 'Outros' }))])} />
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
              disabled={submitting}
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
}> = ({ fields, base, update, selects = {}, invalidFields = [] }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {fields.map(field => {
      const isOptional = optionalFields.has(field);
      const isInvalid = invalidFields.includes(field);
      return (
        <label className="space-y-1.5 block" key={field} htmlFor={`input-${field}`}>
          <span className="text-[12px] font-medium text-[#707070] dark:text-[#86868b] flex items-center justify-between">
            <span>
              {getFieldLabel(field)}
              {!isOptional && <span className="text-rose-500 ml-1 font-bold">*</span>}
            </span>
            {isOptional && <span className="text-[10px] text-[#86868b] font-normal lowercase">(opcional)</span>}
          </span>
          {selects[field] ? (
            <select
              id={`input-${field}`}
              required={!isOptional}
              className={`${inputClass} ${isInvalid ? '!border-rose-500 !ring-rose-500/20 ring-4 focus:!border-rose-500' : ''}`}
              value={base[field] || ''}
              onChange={event => update(field, event.target.value)}
            >
              <option value="">Selecione...</option>
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
              id={`input-${field}`}
              required={!isOptional}
              className={`${inputClass} ${isInvalid ? '!border-rose-500 !ring-rose-500/20 ring-4 focus:!border-rose-500' : ''}`}
              type={field.includes('data') || field === 'inicio' || field === 'fim' ? 'date' : field === 'email' ? 'email' : 'text'}
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
  children?: React.ReactNode;
}> = ({ title, type, fields, rows, addRow, updateRow, removeRow, children }) => (
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
          <Fields fields={fields} base={row} update={(field, value) => updateRow(index, field, value)} />
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

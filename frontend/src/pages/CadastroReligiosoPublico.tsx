import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AlertCircle, Building, CheckCircle2, ChevronLeft, ChevronRight, FileUp, Loader2, Plus, Trash2 } from 'lucide-react';

interface ObraReferencia { id: string; nome: string; cidade: string | null; estado: string | null }
interface Familiar extends Record<string, string> { tipo: 'Pai' | 'Mãe' | 'Irmão'; nome: string; data_nascimento: string; local_nascimento: string; estado_civil: string; data_evento: string }
interface Sacrament extends Record<string, string> { tipo: string; data: string; paroquia: string; diocese: string; cidade: string; uf: string; livro: string; folha: string; numero_registro: string; celebrante: string; observacoes: string }
interface DocumentoSelecionado { categoria: string; arquivo: File }

const etapas = [
  'Identificação', 'Família', 'Sacramentos', 'Vocação', 'Formação', 'Ministérios',
  'Acadêmica', 'Idiomas', 'Histórico', 'Missões', 'Endereço', 'Saúde', 'Documentos',
];
const inputClass = 'w-full px-3 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white/70 dark:bg-slate-900/50 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/25';
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
const emptySacrament = (tipo: string): Sacrament => ({ tipo, data: '', paroquia: '', diocese: '', cidade: '', uf: '', livro: '', folha: '', numero_registro: '', celebrante: '', observacoes: '' });
const emptyFamiliar = (tipo: Familiar['tipo'] = 'Irmão'): Familiar => ({ tipo, nome: '', data_nascimento: '', local_nascimento: '', estado_civil: '', data_evento: '' });

export const CadastroReligiosoPublico: React.FC = () => {
  const [step, setStep] = useState(1);
  const [obras, setObras] = useState<ObraReferencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoSelecionado[]>([]);
  const [familiares, setFamiliares] = useState<Familiar[]>([emptyFamiliar('Pai'), emptyFamiliar('Mãe')]);
  const [sacramentos, setSacramentos] = useState<Sacrament[]>([emptySacrament('Batismo'), emptySacrament('Primeira Eucaristia'), emptySacrament('Crisma')]);
  const [base, setBase] = useState<Record<string, string>>({
    grau: 'Padre', nome_civil: '', nome_religioso: '', data_nascimento: '', local_nascimento: '', municipio_nascimento: '', estado_nascimento: '', pais_nascimento: 'Brasil', nacionalidade: 'Brasileira', cpf: '', rg: '', rg_orgao_expedidor: '', rg_data_emissao: '', titulo_eleitor: '', pis: '', cnh: '', cnh_categoria: '', passaporte: '', obra_atual_id: '', comunidade_atual_nome: '', email_institucional: '', email_pessoal: '', telefone_celular: '', whatsapp: '', redes_sociais: '',
    contato_nome: '', contato_parentesco: '', contato_1: '', contato_2: '', paroquia_origem: '', diocese_origem: '', grupo_movimento_pastoral: '', promotor_vocacional: '', plano_saude: '', numero_plano_saude: '', local_plano_saude: '', sus: '', tipo_sanguineo: '', fator_rh: '', alergias: '', medicamentos_continuos: '', medico_responsavel: '', contato_emergencia: '', informacoes_clinicas: '', cirurgias: '', proteses: '', observacoes_saude: '', consentimento_dados: '',
  });
  const [rows, setRows] = useState<Record<string, string>[]>([]);

  useEffect(() => {
    supabase.from('religiosos_obras_referencia').select('id,nome,cidade,estado').eq('status', 'Ativa').order('nome').then(({ data }) => {
      setObras((data || []) as ObraReferencia[]);
      setLoading(false);
    });
  }, []);

  const updateBase = (field: string, value: string) => setBase(previous => ({ ...previous, [field]: value }));
  const updateRow = (index: number, field: string, value: string) => setRows(previous => previous.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  const addRow = (values: Record<string, string> = {}) => setRows(previous => [...previous, values]);
  const removeRow = (index: number) => setRows(previous => previous.filter((_, rowIndex) => rowIndex !== index));
  const updateFamiliar = (index: number, field: keyof Familiar, value: string) => setFamiliares(previous => previous.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  const updateSacrament = (index: number, field: keyof Sacrament, value: string) => setSacramentos(previous => previous.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));

  const validateStep = () => {
    if (step === 1 && (!base.nome_civil || !base.cpf)) return 'Nome completo e CPF são obrigatórios.';
    if (step === 13 && !base.consentimento_dados) return 'É necessário autorizar o uso dos dados para enviar o cadastro.';
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
        origem_cadastro: 'publico', status_cadastro: 'Em revisão', status: 'Ativo',
        consentimento_dados: true, consentimento_em: new Date().toISOString(),
      };
      const { data: religioso, error: religiosoError } = await supabase.from('religiosos').insert(religiosoPayload).select('id').single();
      if (religiosoError || !religioso) throw religiosoError || new Error('Não foi possível criar o cadastro.');
      const id = religioso.id;
      const insertMany = async (table: string, values: Record<string, unknown>[]) => {
        const filtered = values.filter(value => Object.values(value).some(item => item !== '' && item !== null && item !== undefined));
        if (!filtered.length) return;
        const { error } = await supabase.from(table).insert(filtered.map(value => ({ ...value, religioso_id: id })));
        if (error) throw error;
      };
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
      setSuccess(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível enviar o cadastro.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <PublicShell><Loader2 className="w-8 h-8 animate-spin text-secondary" /></PublicShell>;
  if (success) return <PublicShell><div className="max-w-xl rounded-2xl bg-white p-10 text-center shadow-premium"><CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-500" /><h1 className="font-serif text-2xl font-bold">Cadastro enviado</h1><p className="mt-3 text-sm text-slate-500">Os dados e documentos foram recebidos para conferência da secretaria.</p></div></PublicShell>;

  return <PublicShell><form onSubmit={submit} className="w-full max-w-6xl rounded-2xl bg-white/95 p-6 shadow-premium sm:p-9">
    <header className="mb-8 text-center"><h1 className="font-serif text-3xl font-bold text-primary">Atualização de Dados dos Religiosos</h1><p className="mt-1 text-xs uppercase tracking-widest text-slate-400">Província BRM</p></header>
    <div className="mb-8 overflow-x-auto pb-2"><div className="flex min-w-[760px] items-start justify-between"><div className="relative flex w-full items-start justify-between">{etapas.map((label, index) => { const stepIndex = index + 1; const complete = step > stepIndex; const active = step === stepIndex; return <React.Fragment key={label}><button type="button" onClick={() => setStep(stepIndex)} title={label} className="relative z-10 flex w-20 shrink-0 flex-col items-center gap-2 text-center"><span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${complete ? 'bg-teal-500 text-white' : active ? 'bg-primary text-white ring-4 ring-primary/15' : 'bg-slate-100 text-slate-400'}`}>{complete ? <CheckCircle2 className="h-4 w-4" /> : stepIndex}</span><span className={`text-[10px] font-semibold leading-tight ${active ? 'text-primary' : complete ? 'text-teal-600' : 'text-slate-400'}`}>{label}</span></button>{index < etapas.length - 1 && <span className={`mt-4 h-px min-w-2 flex-1 ${complete ? 'bg-teal-500' : 'bg-slate-200'}`} />}</React.Fragment> })}</div></div></div>
    {errorMessage && <div className="mb-5 flex gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-600"><AlertCircle className="h-4 w-4 shrink-0" />{errorMessage}</div>}
    {step === 1 && <Section title="1. Identificação"><Fields fields={['grau', 'nome_civil', 'nome_religioso', 'data_nascimento', 'local_nascimento', 'municipio_nascimento', 'estado_nascimento', 'pais_nascimento', 'nacionalidade', 'cpf', 'rg', 'rg_orgao_expedidor', 'rg_data_emissao', 'titulo_eleitor', 'pis', 'cnh', 'cnh_categoria', 'passaporte']} base={base} update={updateBase} selects={{ grau: ['Frater', 'Irmão', 'Diácono', 'Padre', 'Bispo'] }} /></Section>}
    {step === 2 && <Section title="2. Dados familiares"><div className="grid gap-4 md:grid-cols-2">{familiares.map((row, index) => <div className="rounded-xl border border-slate-200 p-4" key={`${row.tipo}-${index}`}><div className="mb-3 flex justify-between font-bold text-xs">{row.tipo}{row.tipo === 'Irmão' && <button type="button" onClick={() => setFamiliares(previous => previous.filter((_, rowIndex) => rowIndex !== index))}><Trash2 className="h-4 w-4 text-red-500" /></button>}</div><Fields fields={['nome', 'data_nascimento', 'local_nascimento', 'estado_civil', 'data_evento']} base={row} update={(field, value) => updateFamiliar(index, field as keyof Familiar, value)} /></div>)}</div><button type="button" onClick={() => setFamiliares(previous => [...previous, emptyFamiliar()])} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" />Adicionar irmão</button><div className="mt-6 grid gap-4 md:grid-cols-2"><Fields fields={['contato_nome', 'contato_parentesco', 'contato_1', 'contato_2']} base={base} update={updateBase} /></div></Section>}
    {step === 3 && <Section title="3. Sacramentos e iniciação cristã"><div className="grid gap-5 lg:grid-cols-3">{sacramentos.map((row, index) => <div className="rounded-xl border border-slate-200 p-4" key={row.tipo}><h3 className="mb-3 font-bold text-xs">{row.tipo}</h3><Fields fields={['data', 'paroquia', 'diocese', 'cidade', 'uf', 'livro', 'folha', 'numero_registro', 'celebrante', 'observacoes']} base={row} update={(field, value) => updateSacrament(index, field as keyof Sacrament, value)} /></div>)}</div></Section>}
    {step === 4 && <DynamicSection title="4. Histórico vocacional" type="vocacional" fields={['ano', 'data', 'titulo', 'descricao', 'local', 'responsavel']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow}><Fields fields={['paroquia_origem', 'diocese_origem', 'grupo_movimento_pastoral', 'promotor_vocacional']} base={base} update={updateBase} /></DynamicSection>}
    {step === 5 && <DynamicSection title="5. Etapas de formação, profissões e votos" type="formacao" fields={['etapa', 'instituicao', 'cidade', 'local', 'inicio', 'fim', 'formador']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow}><div className="mt-5"><DynamicSection title="Profissões e votos" type="voto" fields={['voto_tipo', 'renovacao', 'data', 'local', 'celebrante']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} /></div></DynamicSection>}
    {step === 6 && <DynamicSection title="6. Ministérios e ordens" type="ministerio" fields={['ministerio', 'data', 'local', 'celebrante', 'bispo_ordenante']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} />}
    {step === 7 && <DynamicSection title="7. Formação acadêmica" type="academica" fields={['categoria', 'instituicao', 'periodo', 'cidade', 'estado', 'observacoes']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} />}
    {step === 8 && <DynamicSection title="8. Idiomas e competências" type="idioma" fields={['idioma', 'nivel', 'fala', 'audicao', 'leitura', 'escrita', 'observacoes']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow}><div className="mt-5"><DynamicSection title="Competências" type="competencia" fields={['competencia', 'observacoes']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} /></div></DynamicSection>}
    {step === 9 && <DynamicSection title="9. Histórico de comunidades e nomeações" type="historico" fields={['inicio', 'fim', 'instituicao', 'funcao', 'local', 'observacoes']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} />}
    {step === 10 && <DynamicSection title="10. Missões e serviços" type="servico" fields={['servico_tipo', 'instituicao', 'funcao', 'periodo', 'local', 'documento', 'observacao']} rows={rows} addRow={addRow} updateRow={updateRow} removeRow={removeRow} />}
    {step === 11 && <Section title="11. Endereço atual e contatos"><Fields fields={['obra_atual_id', 'comunidade_atual_nome', 'email_institucional', 'email_pessoal', 'telefone_celular', 'whatsapp', 'redes_sociais']} base={base} update={updateBase} selects={{ obra_atual_id: obras.map(obra => ({ value: obra.id, label: `${obra.nome}${obra.cidade ? ` - ${obra.cidade}/${obra.estado || ''}` : ''}` })) }} /><p className="mt-4 text-xs text-slate-400">A obra selecionada será associada ao endereço atual e seus dados poderão ser completados pela secretaria.</p></Section>}
    {step === 12 && <Section title="12. Saúde"><Fields fields={['plano_saude', 'numero_plano_saude', 'local_plano_saude', 'sus', 'tipo_sanguineo', 'fator_rh', 'alergias', 'medicamentos_continuos', 'medico_responsavel', 'contato_emergencia', 'informacoes_clinicas', 'cirurgias', 'proteses', 'observacoes_saude']} base={base} update={updateBase} selects={{ fator_rh: ['Positivo', 'Negativo', 'Não informado'] }} /></Section>}
    {step === 13 && <Section title="13. Documentos e anexos"><p className="mb-4 text-xs text-slate-500">Anexe RG, CPF, sacramentos, documentos da vida religiosa, formação, documentos canônicos e administrativos.</p><div className="grid gap-4 md:grid-cols-2"><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-secondary p-5 text-xs font-bold text-secondary"><FileUp className="h-5 w-5" />Selecionar arquivos<input type="file" multiple className="hidden" onChange={event => setDocumentos(previous => [...previous, ...Array.from(event.target.files || []).map(arquivo => ({ arquivo, categoria: 'Outros' }))])} /></label>{documentos.map((documento, index) => <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs" key={`${documento.arquivo.name}-${index}`}><select className={inputClass} value={documento.categoria} onChange={event => setDocumentos(previous => previous.map((item, itemIndex) => itemIndex === index ? { ...item, categoria: event.target.value } : item))}>{['RG', 'CPF', 'CNH', 'Passaporte', 'Título de eleitor', 'Certidão de nascimento', 'Batismo', 'Primeira Eucaristia', 'Crisma', 'Admissão ao Postulantado', 'Admissão ao Noviciado', 'Primeira Profissão Religiosa', 'Renovações', 'Votos perpétuos', 'Diaconato', 'Presbiterado', 'Episcopado', 'Histórico escolar', 'Diplomas', 'Certificados', 'Decretos', 'Licenças', 'Dispensas', 'Indultos', 'Contratos', 'Procurações', 'Outros'].map(option => <option key={option}>{option}</option>)}</select><span className="max-w-40 truncate">{documento.arquivo.name}</span><button type="button" onClick={() => setDocumentos(previous => previous.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4 text-red-500" /></button></div>)}</div><label className="mt-6 flex gap-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-600"><input type="checkbox" checked={!!base.consentimento_dados} onChange={event => updateBase('consentimento_dados', event.target.checked ? 'true' : '')} />Autorizo o uso dos dados pela Província BRM para atualização cadastral, gestão institucional e contato pastoral/administrativo.</label></Section>}
    <footer className="mt-8 flex justify-between border-t border-slate-100 pt-6"><button type="button" disabled={step === 1} onClick={() => setStep(previous => previous - 1)} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 disabled:opacity-30"><ChevronLeft className="h-4 w-4" />Voltar</button>{step < etapas.length ? <button type="button" onClick={() => { const validation = validateStep(); if (validation) setErrorMessage(validation); else { setErrorMessage(null); setStep(previous => previous + 1); } }} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white">Avançar<ChevronRight className="h-4 w-4" /></button> : <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Enviar cadastro</button>}</footer>
  </form></PublicShell>;
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => <section><h2 className="mb-5 font-serif text-xl font-bold text-primary">{title}</h2>{children}</section>;
const Fields: React.FC<{ fields: string[]; base: Record<string, string>; update: (field: string, value: string) => void; selects?: Record<string, string[] | { value: string; label: string }[]> }> = ({ fields, base, update, selects = {} }) => <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{fields.map(field => <label className="space-y-1.5" key={field}><span className="text-xs font-semibold text-slate-500">{getFieldLabel(field)}</span>{selects[field] ? <select className={inputClass} value={base[field] || ''} onChange={event => update(field, event.target.value)}><option value="">Selecione</option>{selects[field].map(option => typeof option === 'string' ? <option key={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input className={inputClass} type={field.includes('data') || field === 'inicio' || field === 'fim' ? 'date' : field === 'email' ? 'email' : 'text'} value={base[field] || ''} onChange={event => update(field, event.target.value)} />}</label>)}</div>;
const DynamicSection: React.FC<{ title: string; type: string; fields: string[]; rows: Record<string, string>[]; addRow: (values?: Record<string, string>) => void; updateRow: (index: number, field: string, value: string) => void; removeRow: (index: number) => void; children?: React.ReactNode }> = ({ title, type, fields, rows, addRow, updateRow, removeRow, children }) => <Section title={title}>{children}<div className="space-y-3">{rows.map((row, index) => row.tipo === type && <div className="rounded-xl border border-slate-200 p-4" key={`${type}-${index}`}><div className="mb-3 flex justify-end"><button type="button" onClick={() => removeRow(index)}><Trash2 className="h-4 w-4 text-red-500" /></button></div><Fields fields={fields} base={row} update={(field, value) => updateRow(index, field, value)} /></div>)}</div><button type="button" onClick={() => addRow({ tipo: type })} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" />Adicionar registro</button></Section>;
const PublicShell: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="min-h-screen bg-slate-50/70 px-4 py-10 dark:bg-[#061320]"><div className="mx-auto flex max-w-7xl items-center gap-3 pb-6 text-primary dark:text-secondary"><Building className="h-7 w-7" /><div><p className="font-serif font-bold">BRM</p><p className="text-[10px] uppercase tracking-widest text-slate-400">Sistema</p></div></div>{children}</div>;
export default CadastroReligiosoPublico;

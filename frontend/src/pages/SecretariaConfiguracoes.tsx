import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Edit3, Trash2, CheckCircle2, AlertCircle, 
  X, Eye, Copy, Download, Hash, 
  Mail, Check, SlidersHorizontal, 
  Shield, BookOpen, Users, Printer, ArrowLeft, Filter, Calendar, Home
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { FormularioTimbrado } from '../components/FormularioTimbrado';
import type { VariavelCampo } from '../components/FormularioTimbrado';
import { RelatorioInscricoesPrint } from '../components/RelatorioInscricoesPrint';
import { FichaInscricaoIndividualPrint } from '../components/FichaInscricaoIndividualPrint';
import { staggerStyle } from '../hooks/useMotion';
import { confirmAction, showAlertModal, showToast } from '../hooks/useFeedback';

// Definições de Tipos
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
  exibir_marca_dagua: boolean;
}

// Catálogo Global de Variáveis Disponíveis (para o construtor igual ao print de referência)
export const CATALOGO_VARIAVEIS_PADRAO: VariavelCampo[] = [
  // 1. Identificação
  { id: 'nome_completo', label: 'Nome Civil Completo', categoria: 'Identificação', obrigatorio: true, tipo: 'text', placeholder: 'Nome civil de registro' },
  { id: 'nome_religioso', label: 'Nome Religioso / Tratamento', categoria: 'Identificação', obrigatorio: true, tipo: 'text', placeholder: 'Pe. João dehoniano, Fr. Antônio...' },
  { id: 'grau_ordem', label: 'Grau / Vínculo Canônico', categoria: 'Identificação', obrigatorio: true, tipo: 'select', opcoes: ['Bispo', 'Presbítero', 'Diácono', 'Frater (Votos Temporários)', 'Frater (Votos Perpétuos)', 'Irmão Religioso', 'Noviço', 'Postulante', 'Outro'] },
  { id: 'comunidade_atual', label: 'Comunidade Atual / Residência', categoria: 'Identificação', obrigatorio: true, tipo: 'text', placeholder: 'Ex: Seminário SCJ de Corupá ou Casa Padre Dehon' },
  { id: 'cargo_funcao', label: 'Cargo ou Ofício Atual', categoria: 'Identificação', obrigatorio: false, tipo: 'text', placeholder: 'Ex: Pároco, Vigário, Formador, Ecônomo, Superior Local' },
  { id: 'cpf', label: 'CPF do Religioso', categoria: 'Identificação', obrigatorio: false, tipo: 'text', placeholder: '000.000.000-00' },
  { id: 'rg', label: 'Documento de Identidade (RG)', categoria: 'Identificação', obrigatorio: false, tipo: 'text', placeholder: 'Número do RG e órgão emissor' },
  { id: 'data_nascimento', label: 'Data de Nascimento', categoria: 'Identificação', obrigatorio: false, tipo: 'date' },

  // 2. Contato & Emergência
  { id: 'email', label: 'E-mail Principal', categoria: 'Contato', obrigatorio: true, tipo: 'email', placeholder: 'confrade@dehonianos.org.br' },
  { id: 'telefone_whatsapp', label: 'Telefone Celular / WhatsApp', categoria: 'Contato', obrigatorio: true, tipo: 'tel', placeholder: '(00) 00000-0000' },
  { id: 'contato_emergencia', label: 'Nome do Contato de Emergência', categoria: 'Contato', obrigatorio: false, tipo: 'text', placeholder: 'Familiar ou confrade responsável' },
  { id: 'telefone_emergencia', label: 'Telefone de Emergência', categoria: 'Contato', obrigatorio: false, tipo: 'tel', placeholder: '(00) 00000-0000' },

  // 3. Acolhida & Hospedagem
  { id: 'necessita_hospedagem', label: 'Necessita de Hospedagem / Quarto', categoria: 'Acolhida & Hospedagem', obrigatorio: true, tipo: 'boolean', ajuda: 'Marque Sim se você pernoitará na casa do encontro.' },
  { id: 'tipo_quarto', label: 'Preferência de Acomodação', categoria: 'Acolhida & Hospedagem', obrigatorio: false, tipo: 'select', opcoes: ['Quarto Individual (se disponível)', 'Quarto Duplo / Compartilhado', 'Sem preferência'] },
  { id: 'data_chegada', label: 'Data Prevista de Chegada', categoria: 'Acolhida & Hospedagem', obrigatorio: false, tipo: 'date' },
  { id: 'horario_chegada', label: 'Horário Previsto de Chegada', categoria: 'Acolhida & Hospedagem', obrigatorio: false, tipo: 'text', placeholder: 'Ex: 14:30 ou Manhã' },
  { id: 'data_saida', label: 'Data Prevista de Partida', categoria: 'Acolhida & Hospedagem', obrigatorio: false, tipo: 'date' },
  { id: 'meio_transporte', label: 'Meio de Transporte Utilizado', categoria: 'Acolhida & Hospedagem', obrigatorio: false, tipo: 'select', opcoes: ['Carro próprio da paróquia/obra', 'Carona com outros confrades', 'Ônibus rodoviário', 'Transporte Aéreo (necessita traslado)', 'Outro'] },

  // 4. Saúde & Alimentação
  { id: 'restricao_alimentar', label: 'Restrição Alimentar ou Alergia', categoria: 'Saúde & Alimentação', obrigatorio: false, tipo: 'text', placeholder: 'Ex: Intolerante a lactose, celíaco, vegetariano, diabético...' },
  { id: 'necessidade_acessibilidade', label: 'Necessidade Especial de Acessibilidade', categoria: 'Saúde & Alimentação', obrigatorio: false, tipo: 'text', placeholder: 'Ex: Dificuldade de locomoção em escadas, quarto térreo...' },
  { id: 'observacoes_medicas', label: 'Observações Médicas Relevantes', categoria: 'Saúde & Alimentação', obrigatorio: false, tipo: 'textarea', placeholder: 'Uso contínuo de medicação ou cuidados especiais' },

  // 5. Liturgia & Participação
  { id: 'tamanho_paramento', label: 'Tamanho de Paramento / Túnica', categoria: 'Liturgia & Geral', obrigatorio: false, tipo: 'select', opcoes: ['P', 'M', 'G', 'GG', 'Tamanho Especial'] },
  { id: 'intencao_celebracao', label: 'Intenção Particular de Missa', categoria: 'Liturgia & Geral', obrigatorio: false, tipo: 'text', placeholder: 'Intenção comemorativa ou súplica' },
  { id: 'disponibilidade_servico', label: 'Disponibilidade para Serviços Litúrgicos', categoria: 'Liturgia & Geral', obrigatorio: false, tipo: 'select', opcoes: ['Canto / Animação', 'Leituras / Salmo', 'Serviço do Altar', 'Acolhida e Credenciamento', 'O que for necessário'] },
  { id: 'observacoes_gerais', label: 'Observações Finais / Mensagem', categoria: 'Liturgia & Geral', obrigatorio: false, tipo: 'textarea', placeholder: 'Espaço aberto para esclarecimentos à Secretaria Provincial' }
];

const LOCAL_STORAGE_FORMULARIOS = 'brm_secretaria_formularios_v1';
const LOCAL_STORAGE_CONFIG = 'brm_secretaria_configuracoes_v1';
const LOCAL_STORAGE_RESPOSTAS = 'brm_secretaria_respostas_v1';

export const SEED_FORMULARIOS: FormularioSecretaria[] = [
  {
    id: 'form-retiro-presbiteros-2026',
    codigo: 'FORM-2026/001',
    titulo: 'Inscrição para o Retiro Provincial dos Presbíteros 2026 (Turma I)',
    descricao: 'Formulário canônico de inscrição para hospedagem, paramentação e logística do Retiro Anual na Casa Padre Dehon (Brusque/SC).',
    evento_id: 'evt-1',
    ativo: true,
    limite_vagas: 60,
    prazo_encerramento: '2026-03-05',
    mensagem_sucesso: 'Inscrição recebida pela Secretaria Provincial. A hospedaria já foi comunicada de sua chegada.',
    total_respostas: 18,
    created_at: '2026-01-15T10:00:00Z',
    campos: CATALOGO_VARIAVEIS_PADRAO.filter(c => [
      'nome_completo', 'nome_religioso', 'grau_ordem', 'comunidade_atual', 
      'email', 'telefone_whatsapp', 'necessita_hospedagem', 'tipo_quarto', 
      'data_chegada', 'data_saida', 'meio_transporte', 'restricao_alimentar', 
      'tamanho_paramento', 'observacoes_gerais'
    ].includes(c.id)).map(c => ({
      ...c,
      obrigatorio: ['nome_completo', 'nome_religioso', 'comunidade_atual', 'email', 'telefone_whatsapp', 'necessita_hospedagem'].includes(c.id)
    }))
  },
  {
    id: 'form-assembleia-provincial-2026',
    codigo: 'FORM-2026/002',
    titulo: 'Confirmação de Presença na Assembleia Provincial Ordinária 2026',
    descricao: 'Confirmação obrigatória de participação com definição de transporte e alojamento no Seminário São José (Rio Negrinho/SC).',
    evento_id: 'evt-6',
    ativo: true,
    limite_vagas: 120,
    prazo_encerramento: '2026-09-20',
    mensagem_sucesso: 'Sua confirmação para a Assembleia Provincial 2026 foi registrada na Secretaria dos Atos.',
    total_respostas: 42,
    created_at: '2026-01-20T14:30:00Z',
    campos: CATALOGO_VARIAVEIS_PADRAO.filter(c => [
      'nome_completo', 'nome_religioso', 'grau_ordem', 'comunidade_atual', 'cargo_funcao',
      'email', 'telefone_whatsapp', 'necessita_hospedagem', 'tipo_quarto', 'meio_transporte',
      'restricao_alimentar', 'necessidade_acessibilidade', 'disponibilidade_servico', 'observacoes_gerais'
    ].includes(c.id)).map(c => ({
      ...c,
      obrigatorio: ['nome_completo', 'nome_religioso', 'comunidade_atual', 'email', 'telefone_whatsapp'].includes(c.id)
    }))
  },
  {
    id: 'form-encontro-fratres-2026',
    codigo: 'FORM-2026/003',
    titulo: 'Ficha de Inscrição - Encontro dos Fratres da Configuração',
    descricao: 'Encontro provincial de formação e partilha fraterna no Seminário Sagrado Coração de Jesus (Corupá/SC).',
    evento_id: 'evt-3',
    ativo: true,
    limite_vagas: 30,
    prazo_encerramento: '2026-05-10',
    mensagem_sucesso: 'Ficha de inscrição enviada com sucesso à equipe de coordenação formativa da BRM.',
    total_respostas: 12,
    created_at: '2026-02-01T09:00:00Z',
    campos: CATALOGO_VARIAVEIS_PADRAO.filter(c => [
      'nome_completo', 'nome_religioso', 'comunidade_atual', 'email', 'telefone_whatsapp',
      'data_chegada', 'data_saida', 'meio_transporte', 'restricao_alimentar', 'observacoes_gerais'
    ].includes(c.id)).map(c => ({
      ...c,
      obrigatorio: ['nome_completo', 'nome_religioso', 'comunidade_atual', 'email', 'telefone_whatsapp'].includes(c.id)
    }))
  }
];

const SEED_RESPOSTAS: RespostaFormulario[] = [
  {
    id: 'resp-1',
    formulario_id: 'form-retiro-presbiteros-2026',
    evento_id: 'evt-1',
    protocolo: 'FORM-2026-9812',
    status: 'Confirmada',
    created_at: '2026-02-10T11:20:00Z',
    dados: {
      nome_completo: 'Pe. Carlos Eduardo Silva, SCJ',
      nome_religioso: 'Pe. Carlos Silva',
      grau_ordem: 'Presbítero',
      comunidade_atual: 'Paróquia São Sebastião - Jaraguá do Sul/SC',
      email: 'pe.carlos@dehonianos.org.br',
      telefone_whatsapp: '(47) 99876-5432',
      necessita_hospedagem: 'Sim',
      tipo_quarto: 'Quarto Individual (se disponível)',
      data_chegada: '2026-03-14',
      meio_transporte: 'Carro próprio da paróquia/obra',
      restricao_alimentar: 'Nenhuma',
      tamanho_paramento: 'G',
      observacoes_gerais: 'Prevejo chegada por volta das 16h para a oração inicial.'
    }
  },
  {
    id: 'resp-2',
    formulario_id: 'form-retiro-presbiteros-2026',
    evento_id: 'evt-1',
    protocolo: 'FORM-2026-9815',
    status: 'Confirmada',
    created_at: '2026-02-12T15:45:00Z',
    dados: {
      nome_completo: 'Pe. Marcos Aurélio de Souza, SCJ',
      nome_religioso: 'Pe. Marcos SCJ',
      grau_ordem: 'Presbítero',
      comunidade_atual: 'Seminário São José - Rio Negrinho/SC',
      email: 'pe.marcos@dehonianos.org.br',
      telefone_whatsapp: '(47) 99123-4567',
      necessita_hospedagem: 'Sim',
      tipo_quarto: 'Quarto Duplo / Compartilhado',
      data_chegada: '2026-03-14',
      meio_transporte: 'Carona com outros confrades',
      restricao_alimentar: 'Intolerância moderada a lactose',
      tamanho_paramento: 'M',
      observacoes_gerais: 'Viajarei junto com o Pe. André.'
    }
  }
];

const CONFIG_PADRAO: ConfiguracaoSecretaria = {
  prefixo_decretos: 'DEC-BRM',
  numero_atual_decretos: 14,
  prefixo_portarias: 'PORT-BRM',
  numero_atual_portarias: 28,
  prefixo_circulares: 'CIRC-BRM',
  numero_atual_circulares: 9,
  prefixo_formularios: 'FORM-BRM',
  numero_atual_formularios: 4,
  cabecalho_institucional: 'CONGREGAÇÃO DOS SACERDOTES DO SAGRADO CORAÇÃO DE JESUS',
  subtitulo_provincia: 'Província Brasileira Meridional',
  orgao_emissor: 'SECRETARIA PROVINCIAL & ATOS CANÔNICOS',
  lema_oficial: '«COR JESU, IN TE CONFIDO • SINT UNUM»',
  email_secretaria: 'secretaria@brm.org.br',
  telefone_secretaria: '+55 (47) 3375-1194',
  notificar_confrade_email: true,
  notificar_secretario_nova_resposta: true,
  exibir_marca_dagua: true
};

export const SecretariaConfiguracoes: React.FC = () => {
  const [tabAtiva, setTabAtiva] = useState<'formularios' | 'inscricoes' | 'atos' | 'timbrado' | 'notificacoes'>('formularios');
  const [formularios, setFormularios] = useState<FormularioSecretaria[]>([]);
  const [respostas, setRespostas] = useState<RespostaFormulario[]>([]);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoSecretaria>(CONFIG_PADRAO);
  const [_loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Estados da Central de Inscrições & Impressão
  const [filtroInscricaoFormId, setFiltroInscricaoFormId] = useState<string>('todos');
  const [filtroInscricaoStatus, setFiltroInscricaoStatus] = useState<string>('todos');
  const [buscaInscricao, setBuscaInscricao] = useState<string>('');
  const [relatorioPrintForm, setRelatorioPrintForm] = useState<FormularioSecretaria | 'todos' | null>(null);
  const [fichaPrintResposta, setFichaPrintResposta] = useState<RespostaFormulario | null>(null);

  // Estados do Modal Construtor de Variáveis (Igual à foto de referência)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formLimiteVagas, setFormLimiteVagas] = useState<number | ''>('');
  const [formPrazo, setFormPrazo] = useState('');
  const [formMensagemSucesso, setFormMensagemSucesso] = useState('');
  const [formAtivo, setFormAtivo] = useState(true);

  // Variáveis selecionadas no Construtor
  const [camposSelecionados, setCamposSelecionados] = useState<Record<string, { selecionado: boolean; obrigatorio: boolean }>>({});
  const [catalogoVariaveis, setCatalogoVariaveis] = useState<VariavelCampo[]>(CATALOGO_VARIAVEIS_PADRAO);
  const [buscaVariavel, setBuscaVariavel] = useState('');
  const [filtroCategoriaVariavel, setFiltroCategoriaVariavel] = useState<string>('Todas');

  // Modal de Nova Variável Customizada
  const [isNovaVariavelModalOpen, setIsNovaVariavelModalOpen] = useState(false);
  const [novaVarNome, setNovaVarNome] = useState('');
  const [novaVarCategoria, setNovaVarCategoria] = useState('Geral');
  const [novaVarTipo, setNovaVarTipo] = useState<VariavelCampo['tipo']>('text');
  const [novaVarObrigatoria, setNovaVarObrigatoria] = useState(false);
  const [novaVarPlaceholder, setNovaVarPlaceholder] = useState('');
  const [novaVarOpcoes, setNovaVarOpcoes] = useState('');

  // Exibição em Página Completa (Substitui Modais)
  const [previewForm, setPreviewForm] = useState<FormularioSecretaria | null>(null);

  // Link copiado feedback
  const [linkCopiadoId, setLinkCopiadoId] = useState<string | null>(null);

  // Atualizar status de uma inscrição
  const handleAtualizarStatusResposta = async (id: string, novoStatus: 'Confirmada' | 'Pendente' | 'Cancelada') => {
    try {
      const { error } = await supabase
        .from('secretaria_respostas_formulario')
        .update({ status: novoStatus })
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Erro ao atualizar status no supabase:', e);
      setFeedbackMsg({ tipo: 'erro', texto: 'Não foi possível atualizar a inscrição no servidor.' });
      return;
    }
    setRespostas(prev => prev.map(r => r.id === id ? { ...r, status: novoStatus } : r));
    const saved = localStorage.getItem(LOCAL_STORAGE_RESPOSTAS);
    if (saved) {
      const list: RespostaFormulario[] = JSON.parse(saved);
      const updated = list.map(r => r.id === id ? { ...r, status: novoStatus } : r);
      localStorage.setItem(LOCAL_STORAGE_RESPOSTAS, JSON.stringify(updated));
    }
    if (fichaPrintResposta?.id === id) {
      setFichaPrintResposta(prev => prev ? { ...prev, status: novoStatus } : null);
    }
    setFeedbackMsg({ tipo: 'sucesso', texto: `Status da inscrição atualizado para ${novoStatus}.` });
  };

  // Carregar dados (com resiliência Supabase + localStorage)
  const carregarDados = async () => {
    setLoading(true);
    try {
      // 1. Carregar Configurações
      const { data: configData } = await supabase
        .from('secretaria_configuracoes')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (configData) {
        setConfiguracao(prev => ({ ...prev, ...configData }));
      } else {
        const savedCfg = localStorage.getItem(LOCAL_STORAGE_CONFIG);
        if (savedCfg) setConfiguracao(JSON.parse(savedCfg));
      }

      // 2. Carregar Formulários
      const { data: formsData, error: formsErr } = await supabase
        .from('secretaria_formularios')
        .select('*')
        .order('created_at', { ascending: false });

      if (formsErr || !formsData) {
        const saved = localStorage.getItem(LOCAL_STORAGE_FORMULARIOS);
        if (saved) {
          setFormularios(JSON.parse(saved));
        } else {
          setFormularios(SEED_FORMULARIOS);
          localStorage.setItem(LOCAL_STORAGE_FORMULARIOS, JSON.stringify(SEED_FORMULARIOS));
        }
      } else {
        setFormularios(formsData as FormularioSecretaria[]);
        localStorage.setItem(LOCAL_STORAGE_FORMULARIOS, JSON.stringify(formsData));
      }

      // 3. Carregar Respostas
      const { data: respData, error: respErr } = await supabase
        .from('secretaria_respostas_formulario')
        .select('*')
        .order('created_at', { ascending: false });

      if (respErr || !respData) {
        const saved = localStorage.getItem(LOCAL_STORAGE_RESPOSTAS);
        if (saved) {
          setRespostas(JSON.parse(saved));
        } else {
          setRespostas(SEED_RESPOSTAS);
          localStorage.setItem(LOCAL_STORAGE_RESPOSTAS, JSON.stringify(SEED_RESPOSTAS));
        }
      } else {
        setRespostas(respData as RespostaFormulario[]);
        localStorage.setItem(LOCAL_STORAGE_RESPOSTAS, JSON.stringify(respData));
      }
    } catch (e) {
      console.warn('Usando armazenamento local resiliente para Secretaria & Formulários:', e);
      const savedForms = localStorage.getItem(LOCAL_STORAGE_FORMULARIOS);
      setFormularios(savedForms ? JSON.parse(savedForms) : SEED_FORMULARIOS);
      const savedResp = localStorage.getItem(LOCAL_STORAGE_RESPOSTAS);
      setRespostas(savedResp ? JSON.parse(savedResp) : SEED_RESPOSTAS);
      const savedCfg = localStorage.getItem(LOCAL_STORAGE_CONFIG);
      if (savedCfg) setConfiguracao(JSON.parse(savedCfg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const mostrarAlerta = (tipo: 'sucesso' | 'erro', texto: string) => {
    setFeedbackMsg({ tipo, texto });
    if (tipo === 'sucesso') {
      showToast.success(texto);
    } else {
      showToast.error(texto);
    }
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const persistirFormularios = (novos: FormularioSecretaria[]) => {
    setFormularios(novos);
    localStorage.setItem(LOCAL_STORAGE_FORMULARIOS, JSON.stringify(novos));
  };

  const persistirConfiguracao = (nova: ConfiguracaoSecretaria) => {
    setConfiguracao(nova);
    localStorage.setItem(LOCAL_STORAGE_CONFIG, JSON.stringify(nova));
  };

  // Abrir Construtor para Novo Formulário
  const handleOpenCreateForm = () => {
    setEditingFormId(null);
    setFormTitulo('');
    setFormCodigo(`FORM-${new Date().getFullYear()}/${String(formularios.length + 1).padStart(3, '0')}`);
    setFormDescricao('');
    setFormLimiteVagas('');
    setFormPrazo('');
    setFormMensagemSucesso('Sua inscrição foi confirmada e protocolada com sucesso pela Secretaria Provincial.');
    setFormAtivo(true);

    const mapaInicial: Record<string, { selecionado: boolean; obrigatorio: boolean }> = {};
    catalogoVariaveis.forEach(c => {
      const estaNoPadrao = ['nome_completo', 'nome_religioso', 'comunidade_atual', 'email', 'telefone_whatsapp'].includes(c.id);
      mapaInicial[c.id] = {
        selecionado: estaNoPadrao,
        obrigatorio: c.obrigatorio || false
      };
    });
    setCamposSelecionados(mapaInicial);
    setBuscaVariavel('');
    setFiltroCategoriaVariavel('Todas');
    setIsBuilderOpen(true);
  };

  // Abrir Construtor para Editar Formulário Existente
  const handleOpenEditForm = (form: FormularioSecretaria) => {
    setEditingFormId(form.id);
    setFormTitulo(form.titulo);
    setFormCodigo(form.codigo || '');
    setFormDescricao(form.descricao || '');
    setFormLimiteVagas(form.limite_vagas || '');
    setFormPrazo(form.prazo_encerramento || '');
    setFormMensagemSucesso(form.mensagem_sucesso || '');
    setFormAtivo(form.ativo);

    const mapa: Record<string, { selecionado: boolean; obrigatorio: boolean }> = {};
    catalogoVariaveis.forEach(c => {
      mapa[c.id] = { selecionado: false, obrigatorio: c.obrigatorio };
    });
    form.campos.forEach(c => {
      mapa[c.id] = { selecionado: true, obrigatorio: c.obrigatorio };
    });
    setCamposSelecionados(mapa);
    setBuscaVariavel('');
    setFiltroCategoriaVariavel('Todas');
    setIsBuilderOpen(true);
  };

  // Alternar Seleção de uma Variável (Grid do Construtor)
  const toggleVariavel = (varId: string) => {
    setCamposSelecionados(prev => {
      const atual = prev[varId] || { selecionado: false, obrigatorio: false };
      return {
        ...prev,
        [varId]: {
          ...atual,
          selecionado: !atual.selecionado
        }
      };
    });
  };

  // Alternar Obrigatoriedade de uma Variável
  const toggleObrigatorio = (varId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCamposSelecionados(prev => {
      const atual = prev[varId] || { selecionado: true, obrigatorio: false };
      return {
        ...prev,
        [varId]: {
          selecionado: true,
          obrigatorio: !atual.obrigatorio
        }
      };
    });
  };

  // Aplicar Presets Rápidos
  const aplicarPreset = (tipo: 'retiro' | 'assembleia' | 'todos' | 'nenhum') => {
    const novoMapa: Record<string, { selecionado: boolean; obrigatorio: boolean }> = {};

    catalogoVariaveis.forEach(c => {
      if (tipo === 'todos') {
        novoMapa[c.id] = { selecionado: true, obrigatorio: c.obrigatorio };
      } else if (tipo === 'nenhum') {
        novoMapa[c.id] = { selecionado: false, obrigatorio: false };
      } else if (tipo === 'retiro') {
        const retiroIds = ['nome_completo', 'nome_religioso', 'grau_ordem', 'comunidade_atual', 'email', 'telefone_whatsapp', 'necessita_hospedagem', 'tipo_quarto', 'data_chegada', 'meio_transporte', 'restricao_alimentar', 'tamanho_paramento'];
        novoMapa[c.id] = {
          selecionado: retiroIds.includes(c.id),
          obrigatorio: ['nome_completo', 'nome_religioso', 'comunidade_atual', 'email', 'telefone_whatsapp'].includes(c.id)
        };
      } else if (tipo === 'assembleia') {
        const assembleiaIds = ['nome_completo', 'nome_religioso', 'grau_ordem', 'comunidade_atual', 'cargo_funcao', 'email', 'telefone_whatsapp', 'necessita_hospedagem', 'meio_transporte', 'restricao_alimentar', 'disponibilidade_servico'];
        novoMapa[c.id] = {
          selecionado: assembleiaIds.includes(c.id),
          obrigatorio: ['nome_completo', 'nome_religioso', 'comunidade_atual', 'email', 'telefone_whatsapp'].includes(c.id)
        };
      }
    });

    setCamposSelecionados(novoMapa);
  };

  // Criar Nova Variável Customizada
  const handleCriarNovaVariavel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaVarNome.trim()) return;

    const idGerado = 'custom_' + novaVarNome.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    const opcoesArr = novaVarOpcoes ? novaVarOpcoes.split(',').map(s => s.trim()).filter(Boolean) : undefined;

    const novaVar: VariavelCampo = {
      id: idGerado,
      label: novaVarNome.trim(),
      categoria: novaVarCategoria,
      tipo: novaVarTipo,
      obrigatorio: novaVarObrigatoria,
      placeholder: novaVarPlaceholder || undefined,
      opcoes: opcoesArr
    };

    setCatalogoVariaveis(prev => [...prev, novaVar]);
    setCamposSelecionados(prev => ({
      ...prev,
      [idGerado]: { selecionado: true, obrigatorio: novaVarObrigatoria }
    }));

    setIsNovaVariavelModalOpen(false);
    setNovaVarNome('');
    setNovaVarPlaceholder('');
    setNovaVarOpcoes('');
    mostrarAlerta('sucesso', `Variável "${novaVar.label}" criada e adicionada ao construtor.`);
  };

  // Salvar Formulário Montado
  const handleSaveFormulario = async () => {
    if (!formTitulo.trim()) {
      mostrarAlerta('erro', 'Defina um título para o formulário.');
      return;
    }

    const camposFinais: VariavelCampo[] = [];
    catalogoVariaveis.forEach(c => {
      const cfg = camposSelecionados[c.id];
      if (cfg && cfg.selecionado) {
        camposFinais.push({
          ...c,
          obrigatorio: cfg.obrigatorio
        });
      }
    });

    if (camposFinais.length === 0) {
      mostrarAlerta('erro', 'Selecione ao menos 1 variável para compor o formulário.');
      return;
    }

    const agora = new Date().toISOString();

    if (editingFormId) {
      const formExistente = formularios.find(f => f.id === editingFormId);
      const atualizado: FormularioSecretaria = {
        id: editingFormId,
        titulo: formTitulo.trim(),
        codigo: formCodigo.trim() || undefined,
        descricao: formDescricao.trim() || undefined,
        evento_id: formExistente?.evento_id || null,
        campos: camposFinais,
        ativo: formAtivo,
        limite_vagas: formLimiteVagas ? Number(formLimiteVagas) : null,
        prazo_encerramento: formPrazo || null,
        mensagem_sucesso: formMensagemSucesso.trim() || null,
        total_respostas: formExistente?.total_respostas || 0,
        created_at: formExistente?.created_at || agora,
        updated_at: agora
      };

      try {
        const { error } = await supabase
          .from('secretaria_formularios')
          .update(atualizado)
          .eq('id', editingFormId);
        if (error) throw error;
      } catch (e) {
        console.error('Erro ao atualizar formulário:', e);
        mostrarAlerta('erro', 'Não foi possível atualizar o formulário no servidor.');
        return;
      }

      const lista = formularios.map(f => f.id === editingFormId ? atualizado : f);
      persistirFormularios(lista);
      mostrarAlerta('sucesso', 'Formulário atualizado com sucesso!');
    } else {
      const novoId = 'form-' + Date.now().toString(36);
      const novoForm: FormularioSecretaria = {
        id: novoId,
        titulo: formTitulo.trim(),
        codigo: formCodigo.trim() || `FORM-${new Date().getFullYear()}/${String(formularios.length + 1).padStart(3, '0')}`,
        descricao: formDescricao.trim() || undefined,
        evento_id: null,
        campos: camposFinais,
        ativo: formAtivo,
        limite_vagas: formLimiteVagas ? Number(formLimiteVagas) : null,
        prazo_encerramento: formPrazo || null,
        mensagem_sucesso: formMensagemSucesso.trim() || null,
        total_respostas: 0,
        created_at: agora
      };

      try {
        const { error } = await supabase
          .from('secretaria_formularios')
          .insert([novoForm]);
        if (error) throw error;
      } catch (e) {
        console.error('Erro ao criar formulário:', e);
        mostrarAlerta('erro', 'Não foi possível criar o formulário no servidor.');
        return;
      }

      const lista = [novoForm, ...formularios];
      persistirFormularios(lista);
      mostrarAlerta('sucesso', 'Novo formulário criado e pronto para uso!');
    }

    setIsBuilderOpen(false);
  };

  // Excluir Formulário
  const handleDeleteForm = async (f: FormularioSecretaria) => {
    const confirmed = await confirmAction({
      title: 'Excluir Formulário Oficial',
      badge: 'Secretaria Provincial • Exclusão',
      message: `Deseja realmente excluir o formulário "${f.titulo}"?`,
      detail: 'Esta ação removerá a estrutura e as definições deste formulário da Secretaria Provincial.',
      confirmLabel: 'Excluir Formulário',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      icon: 'trash'
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('secretaria_formularios').delete().eq('id', f.id);
      if (error) throw error;
    } catch (e) {
      console.error('Erro ao excluir formulário:', e);
      mostrarAlerta('erro', 'Não foi possível excluir o formulário no servidor.');
      return;
    }

    const lista = formularios.filter(item => item.id !== f.id);
    persistirFormularios(lista);
    mostrarAlerta('sucesso', 'Formulário removido.');
  };

  // Copiar Link Público
  const handleCopiarLink = (formId: string) => {
    const url = `${window.location.origin}/formularios/${formId}`;
    navigator.clipboard.writeText(url);
    setLinkCopiadoId(formId);
    setTimeout(() => setLinkCopiadoId(null), 3000);
    mostrarAlerta('sucesso', 'Link oficial do formulário copiado para a área de transferência!');
  };

  // Salvar Configurações de Atos / Timbrado
  const handleSalvarConfiguracoes = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('secretaria_configuracoes')
        .upsert([{ id: configuracao.id || 'default-secretaria-cfg', ...configuracao }]);
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao salvar configurações institucionais:', err);
      mostrarAlerta('erro', 'Não foi possível salvar as configurações no servidor.');
      return;
    }

    persistirConfiguracao(configuracao);
    mostrarAlerta('sucesso', 'Configurações institucionais salvas com sucesso!');
  };

  // Exportar Respostas em CSV (Geral ou por Formulário)
  const exportarCSVGeral = (form?: FormularioSecretaria | null) => {
    const lista = form 
      ? respostas.filter(r => r.formulario_id === form.id) 
      : (filtroInscricaoFormId === 'todos' 
          ? respostas 
          : respostas.filter(r => r.formulario_id === filtroInscricaoFormId));
    
    if (lista.length === 0) {
      showToast.info('Não há inscrições registradas para exportar.');
      return;
    }

    const cabecalhos = [
      'Ordem',
      'Protocolo',
      'Data Submissão',
      'Formulário',
      'Nome Confrade',
      'Nome Civil',
      'Grau de Ordem',
      'Comunidade',
      'Hospedagem',
      'Tipo de Quarto',
      'Data Chegada',
      'Meio Transporte',
      'Restrições Alimentares',
      'Tamanho Paramento',
      'Telefone/WhatsApp',
      'E-mail',
      'Status',
      'Observações'
    ];

    const linhas = lista.map((r, idx) => {
      const fVinculado = formularios.find(f => f.id === r.formulario_id);
      return [
        idx + 1,
        `"${r.protocolo}"`,
        `"${new Date(r.created_at).toLocaleString('pt-BR')}"`,
        `"${fVinculado?.titulo || r.formulario_id}"`,
        `"${r.dados?.nome_religioso || r.dados?.nome_completo || ''}"`,
        `"${r.dados?.nome_completo || ''}"`,
        `"${r.dados?.grau_ordem || ''}"`,
        `"${r.dados?.comunidade_atual || ''}"`,
        `"${r.dados?.necessita_hospedagem ? 'Sim' : 'Não'}"`,
        `"${r.dados?.tipo_quarto || ''}"`,
        `"${r.dados?.data_chegada || ''}"`,
        `"${r.dados?.meio_transporte || ''}"`,
        `"${r.dados?.restricao_alimentar || ''}"`,
        `"${r.dados?.tamanho_paramento || ''}"`,
        `"${r.dados?.telefone_whatsapp || ''}"`,
        `"${r.dados?.email || ''}"`,
        `"${r.status}"`,
        `"${(r.dados?.observacoes_gerais || '').replace(/\n/g, ' ')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [cabecalhos.join(','), ...linhas].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_inscricoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const categoriasDisponiveis = ['Todas', ...Array.from(new Set(catalogoVariaveis.map(c => c.categoria)))];

  const variaveisFiltradas = catalogoVariaveis.filter(c => {
    const matchBusca = !buscaVariavel || 
      c.label.toLowerCase().includes(buscaVariavel.toLowerCase()) || 
      c.categoria.toLowerCase().includes(buscaVariavel.toLowerCase());
    const matchCat = filtroCategoriaVariavel === 'Todas' || c.categoria === filtroCategoriaVariavel;
    return matchBusca && matchCat;
  });

  const totalSelecionadas = Object.values(camposSelecionados).filter(v => v.selecionado).length;

  // Se estiver gerando Relatório Completo para Impressão (Página Completa)
  if (relatorioPrintForm) {
    const formRef = relatorioPrintForm === 'todos' ? null : relatorioPrintForm;
    const listaResp = relatorioPrintForm === 'todos' 
      ? (filtroInscricaoFormId === 'todos' ? respostas : respostas.filter(r => r.formulario_id === filtroInscricaoFormId))
      : respostas.filter(r => r.formulario_id === relatorioPrintForm.id);
    
    return (
      <RelatorioInscricoesPrint
        formulario={formRef}
        tituloDocumento={formRef ? formRef.titulo : 'Relatório Geral de Inscrições Provinciais'}
        subtitulo={formRef ? formRef.codigo : 'Geral - Todos os Formulários'}
        nomeEvento={formRef?.titulo}
        respostas={listaResp}
        onVoltar={() => setRelatorioPrintForm(null)}
        cabecalho={{
          congregacao: configuracao.cabecalho_institucional,
          provincia: configuracao.subtitulo_provincia,
          orgao: configuracao.orgao_emissor,
          lema: configuracao.lema_oficial
        }}
      />
    );
  }

  // Se estiver visualizando a Ficha Individual de Inscrição para Impressão (Página Completa)
  if (fichaPrintResposta) {
    const formVinculado = formularios.find(f => f.id === fichaPrintResposta.formulario_id);
    return (
      <FichaInscricaoIndividualPrint
        resposta={fichaPrintResposta}
        formulario={formVinculado}
        onVoltar={() => setFichaPrintResposta(null)}
        onAtualizarStatus={handleAtualizarStatusResposta}
        cabecalho={{
          congregacao: configuracao.cabecalho_institucional,
          provincia: configuracao.subtitulo_provincia,
          orgao: configuracao.orgao_emissor,
          lema: configuracao.lema_oficial
        }}
      />
    );
  }

  // Se estiver em Pré-visualização Timbrada (Página Completa, sem modal)
  if (previewForm) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] dark:bg-[#090d16] py-6 px-3 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-[#12161f] p-3 px-4 rounded-[6px] border border-[#113240]/10 dark:border-white/10 shadow-xs print:hidden">
            <button
              type="button"
              onClick={() => setPreviewForm(null)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase font-semibold text-slate-700 dark:text-slate-300 hover:text-[#113240] dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-[6px] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar às Configurações</span>
            </button>
            <span className="font-mono text-[11px] uppercase font-bold text-[#226380] dark:text-[#A3C3C7]">
              Visualização Timbrada em Página Completa
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase font-semibold text-white bg-[#113240] hover:bg-[#226380] rounded-[6px] transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir Ficha</span>
            </button>
          </div>

          <FormularioTimbrado
            titulo={previewForm.titulo}
            subtitulo={previewForm.codigo}
            descricao={previewForm.descricao}
            campos={previewForm.campos}
            modo="preview"
            onVoltar={() => setPreviewForm(null)}
            cabecalhoPersonalizado={{
              congregacao: configuracao.cabecalho_institucional,
              provincia: configuracao.subtitulo_provincia,
              orgao: configuracao.orgao_emissor,
              lema: configuracao.lema_oficial,
              emailContato: configuracao.email_secretaria
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Institucional */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#e5e5ea] dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#226380] dark:text-[#A3C3C7]">
              Sede Provincial BRM • Secretaria Provincial & Atos
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-cinzel font-bold text-[#113240] dark:text-white tracking-tight">
            Configurações & Construtor de Formulários
          </h1>
          <p className="text-xs md:text-sm text-[#474747] dark:text-[#86868b] mt-1 font-sans">
            Gerenciamento de fichas de inscrição oficiais, modelos timbrados, numeração sequencial de atos canônicos e notificações provinciais.
          </p>
        </div>

        {/* Botão Novo Formulário */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold border border-[#113240] bg-[#113240] text-white hover:bg-[#226380] hover:border-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Formulário Timbrado</span>
          </button>
        </div>
      </header>

      {/* Mensagem de Feedback Flutuante / Topo */}
      {feedbackMsg && (
        <div 
          className={`p-3.5 rounded-[6px] text-xs font-mono flex items-center justify-between border ${
            feedbackMsg.tipo === 'sucesso' 
              ? 'bg-[#113240]/10 border-[#113240]/30 text-[#113240] dark:text-[#A3C3C7]' 
              : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.tipo === 'sucesso' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedbackMsg.texto}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navegação por Abas Lapidadas (UTXICA Segmented Architectural Control) */}
      <div className="bg-[#e8ebed]/70 dark:bg-[#12161f] p-1.5 rounded-[8px] border border-[#113240]/10 dark:border-white/10 flex items-center gap-1.5 overflow-x-auto shadow-xs">
        <button
          onClick={() => setTabAtiva('formularios')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer shrink-0 motion-press ${
            tabAtiva === 'formularios'
              ? 'bg-white dark:bg-[#1e2535] text-[#113240] dark:text-white shadow-sm border border-[#113240]/15 dark:border-white/15'
              : 'text-[#474747] dark:text-[#86868b] hover:text-[#113240] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7]" />
          <span>Construtor de Formulários</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] font-bold ${
            tabAtiva === 'formularios'
              ? 'bg-[#226380]/15 text-[#226380] dark:text-[#A3C3C7]'
              : 'bg-black/5 dark:bg-white/10 text-slate-500'
          }`}>
            {formularios.length}
          </span>
        </button>

        <button
          onClick={() => setTabAtiva('inscricoes')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer shrink-0 motion-press ${
            tabAtiva === 'inscricoes'
              ? 'bg-white dark:bg-[#1e2535] text-[#113240] dark:text-white shadow-sm border border-[#113240]/15 dark:border-white/15'
              : 'text-[#474747] dark:text-[#86868b] hover:text-[#113240] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7]" />
          <span>Inscrições & Protocolos</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] font-bold ${
            tabAtiva === 'inscricoes'
              ? 'bg-[#226380]/15 text-[#226380] dark:text-[#A3C3C7]'
              : 'bg-black/5 dark:bg-white/10 text-slate-500'
          }`}>
            {respostas.length}
          </span>
        </button>

        <button
          onClick={() => setTabAtiva('atos')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer shrink-0 motion-press ${
            tabAtiva === 'atos'
              ? 'bg-white dark:bg-[#1e2535] text-[#113240] dark:text-white shadow-sm border border-[#113240]/15 dark:border-white/15'
              : 'text-[#474747] dark:text-[#86868b] hover:text-[#113240] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <Hash className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7]" />
          <span>Numeração de Atos & Prefixos</span>
        </button>

        <button
          onClick={() => setTabAtiva('timbrado')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer shrink-0 motion-press ${
            tabAtiva === 'timbrado'
              ? 'bg-white dark:bg-[#1e2535] text-[#113240] dark:text-white shadow-sm border border-[#113240]/15 dark:border-white/15'
              : 'text-[#474747] dark:text-[#86868b] hover:text-[#113240] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7]" />
          <span>Papel Timbrado Oficial</span>
        </button>

        <button
          onClick={() => setTabAtiva('notificacoes')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer shrink-0 motion-press ${
            tabAtiva === 'notificacoes'
              ? 'bg-white dark:bg-[#1e2535] text-[#113240] dark:text-white shadow-sm border border-[#113240]/15 dark:border-white/15'
              : 'text-[#474747] dark:text-[#86868b] hover:text-[#113240] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <Mail className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7]" />
          <span>Notificações & E-mails</span>
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}

      {/* ABA 1: CONSTRUTOR & LISTA DE FORMULÁRIOS */}
      {tabAtiva === 'formularios' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-[#161b22] p-4 rounded-[6px] border border-[#113240]/10 dark:border-white/10 shadow-sm border-l-4 border-l-[#226380]">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7]" />
                <span className="font-mono text-xs uppercase font-bold text-[#113240] dark:text-white tracking-wider">
                  Modelos Oficiais de Inscrição Canônica
                </span>
              </div>
              <p className="text-xs text-[#474747] dark:text-[#86868b] mt-0.5 font-sans">
                Fichas timbradas com variáveis canônicas configuráveis. Podem ser vinculadas a eventos da Agenda ou preenchidas via link público.
              </p>
            </div>
            <button
              onClick={handleOpenCreateForm}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-mono uppercase font-semibold text-white bg-[#113240] hover:bg-[#226380] rounded-[6px] border border-[#113240] hover:border-[#226380] transition-all cursor-pointer shadow-xs shrink-0 motion-press"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Modelo de Ficha</span>
            </button>
          </div>

          {formularios.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#161b22] rounded-[6px] border border-[#113240]/10 dark:border-white/10 shadow-sm">
              <FileText className="w-10 h-10 mx-auto text-[#226380]/40 dark:text-[#A3C3C7]/40 mb-3" />
              <h3 className="font-cinzel text-base font-bold text-[#113240] dark:text-white">Nenhum formulário cadastrado</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-sans">
                Crie um modelo de inscrição usando o construtor de variáveis para conectar a eventos e assembleias provinciais.
              </p>
              <button
                onClick={handleOpenCreateForm}
                className="mt-4 px-4 py-2 text-xs font-mono uppercase font-semibold text-white bg-[#113240] hover:bg-[#226380] rounded-[6px] transition-all cursor-pointer shadow-sm motion-press"
              >
                Abrir Construtor de Variáveis
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {formularios.map((form, idx) => {
                const respostasCont = respostas.filter(r => r.formulario_id === form.id).length;
                return (
                  <div
                    key={form.id}
                    style={staggerStyle(idx)}
                    className="p-5 bg-white dark:bg-[#161b22] rounded-[6px] border border-[#113240]/10 dark:border-white/10 hover:border-[#226380]/60 transition-all shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-l-4 border-l-[#226380] hover-lift"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {form.codigo && (
                          <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-[4px] bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] border border-[#226380]/30 shadow-2xs">
                            {form.codigo}
                          </span>
                        )}
                        <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-[4px] border ${
                          form.ativo 
                            ? 'bg-[#113240]/10 text-[#113240] dark:text-[#A3C3C7] border-[#113240]/20' 
                            : 'bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}>
                          {form.ativo ? 'Ativo • Recebendo Inscrições' : 'Inativo / Encerrado'}
                        </span>
                        {form.limite_vagas && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-[4px] border border-slate-200 dark:border-slate-700">
                            Limite: {form.limite_vagas} vagas
                          </span>
                        )}
                      </div>

                      <h3 className="font-cinzel text-base font-bold text-[#113240] dark:text-white tracking-tight">
                        {form.titulo}
                      </h3>

                      {form.descricao && (
                        <p className="text-xs text-[#474747] dark:text-[#86868b] line-clamp-2 font-sans">
                          {form.descricao}
                        </p>
                      )}

                      {/* Lista resumida de variáveis com badges lapidados */}
                      <div className="pt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Variáveis ({form.campos.length}):</span>
                        {form.campos.slice(0, 5).map(campo => (
                          <span 
                            key={campo.id} 
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-[4px] border ${
                              campo.obrigatorio 
                                ? 'bg-[#F2C894]/20 text-[#854d0e] dark:text-[#F2C894] border-[#F2C894]/50' 
                                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {campo.label} {campo.obrigatorio && '★'}
                          </span>
                        ))}
                        {form.campos.length > 5 && (
                          <span className="text-[10px] font-mono font-semibold text-[#226380] dark:text-[#A3C3C7] bg-[#226380]/5 px-1.5 py-0.5 rounded-[4px]">
                            +{form.campos.length - 5} campos adicionais
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações do Formulário */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#113240]/10 dark:border-white/10 shrink-0">
                      {/* Respostas / Inscrições */}
                      <button
                        onClick={() => {
                          setFiltroInscricaoFormId(form.id);
                          setTabAtiva('inscricoes');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-[6px] border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer motion-press"
                        title="Visualizar inscrições e respostas deste formulário"
                      >
                        <Users className="w-3.5 h-3.5 text-[#226380] dark:text-[#A3C3C7]" />
                        <span>Inscrições ({respostasCont})</span>
                      </button>

                      {/* Pré-visualizar no Papel Timbrado */}
                      <button
                        onClick={() => setPreviewForm(form)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-[6px] border border-[#226380]/30 bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] hover:bg-[#226380]/20 transition-colors cursor-pointer motion-press"
                        title="Pré-visualizar como documento timbrado"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Timbrado</span>
                      </button>

                      {/* Copiar Link */}
                      <button
                        onClick={() => handleCopiarLink(form.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-semibold rounded-[6px] border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer motion-press"
                        title="Copiar link público para divulgar aos confrades"
                      >
                        {linkCopiadoId === form.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{linkCopiadoId === form.id ? 'Copiado' : 'Link'}</span>
                      </button>

                      {/* Editar Campos */}
                      <button
                        onClick={() => handleOpenEditForm(form)}
                        className="p-1.5 rounded-[6px] border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-[#113240] dark:hover:text-white transition-colors cursor-pointer motion-press"
                        title="Editar formulário e variáveis"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Excluir */}
                      <button
                        onClick={() => handleDeleteForm(form)}
                        className="p-1.5 rounded-[6px] border border-red-200 dark:border-red-900/40 hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors cursor-pointer motion-press"
                        title="Excluir formulário"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ABA 2: INSCRIÇÕES & PROTOCOLOS (CENTRAL COMPLETA) */}
      {tabAtiva === 'inscricoes' && (
        <section className="space-y-6">
          {/* Cabeçalho da Central com Ações de Impressão e Filtros */}
          <div className="bg-white dark:bg-[#161b22] p-5 sm:p-6 rounded-[8px] border border-[#113240]/10 dark:border-white/10 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-[#226380] dark:text-[#A3C3C7] tracking-wider block">
                  Gestão Canônica & Administrativa
                </span>
                <h2 className="font-cinzel text-xl font-bold text-[#113240] dark:text-white">
                  Central de Inscrições & Protocolos
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                  Consulte os dados completos de cada confrade, filtre por formulário ou status e imprima a lista completa ou fichas individuais timbradas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => exportarCSVGeral(filtroInscricaoFormId === 'todos' ? null : formularios.find(f => f.id === filtroInscricaoFormId))}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono uppercase font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-[6px] transition-colors cursor-pointer shadow-2xs motion-press"
                  title="Exportar arquivo CSV com todos os campos e opções"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Exportar CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const formSelecionado = filtroInscricaoFormId === 'todos' ? 'todos' : (formularios.find(f => f.id === filtroInscricaoFormId) || 'todos');
                    setRelatorioPrintForm(formSelecionado);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase font-semibold text-white bg-[#113240] hover:bg-[#226380] rounded-[6px] transition-colors cursor-pointer shadow-sm motion-press"
                  title="Abrir tela de impressão oficial da lista completa de inscritos"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Lista Completa</span>
                </button>
              </div>
            </div>

            {/* Painel de Filtros e Busca */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Filtro por Formulário */}
              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                  Filtrar por Formulário:
                </label>
                <select
                  value={filtroInscricaoFormId}
                  onChange={(e) => setFiltroInscricaoFormId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-sans rounded-[6px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#226380]"
                >
                  <option value="todos">Todos os Formulários ({respostas.length})</option>
                  {formularios.map(f => {
                    const c = respostas.filter(r => r.formulario_id === f.id).length;
                    return (
                      <option key={f.id} value={f.id}>
                        {f.titulo} ({c})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Filtro por Status */}
              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                  Filtrar por Status:
                </label>
                <select
                  value={filtroInscricaoStatus}
                  onChange={(e) => setFiltroInscricaoStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-sans rounded-[6px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#226380]"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="Confirmada">Confirmadas</option>
                  <option value="Pendente">Pendentes</option>
                  <option value="Cancelada">Canceladas</option>
                </select>
              </div>

              {/* Busca Textual */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                  Buscar Confrade ou Dados:
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nome, protocolo, comunidade, telefone ou opção..."
                    value={buscaInscricao}
                    onChange={(e) => setBuscaInscricao(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-sans rounded-[6px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-[#226380]"
                  />
                  {buscaInscricao && (
                    <button
                      type="button"
                      onClick={() => setBuscaInscricao('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quadro de Resumo Rápido de Métricas */}
            {(() => {
              const inscricoesFiltradas = respostas.filter(r => {
                const matchForm = filtroInscricaoFormId === 'todos' || r.formulario_id === filtroInscricaoFormId;
                const matchStatus = filtroInscricaoStatus === 'todos' || r.status === filtroInscricaoStatus;
                const buscaLower = buscaInscricao.toLowerCase();
                const matchBusca = !buscaInscricao || 
                  (r.protocolo && r.protocolo.toLowerCase().includes(buscaLower)) ||
                  (r.dados?.nome_religioso && r.dados.nome_religioso.toLowerCase().includes(buscaLower)) ||
                  (r.dados?.nome_completo && r.dados.nome_completo.toLowerCase().includes(buscaLower)) ||
                  (r.dados?.comunidade_atual && r.dados.comunidade_atual.toLowerCase().includes(buscaLower)) ||
                  (r.dados?.telefone_whatsapp && r.dados.telefone_whatsapp.toLowerCase().includes(buscaLower));
                return matchForm && matchStatus && matchBusca;
              });

              const total = inscricoesFiltradas.length;
              const confirmadas = inscricoesFiltradas.filter(r => r.status === 'Confirmada').length;
              const pendentes = inscricoesFiltradas.filter(r => r.status === 'Pendente').length;
              const hospedagem = inscricoesFiltradas.filter(r => r.dados?.necessita_hospedagem === true || r.dados?.necessita_hospedagem === 'Sim').length;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-[6px] border border-slate-200 dark:border-slate-800">
                    <span className="font-mono text-[10px] uppercase text-slate-400 block font-semibold">Total Filtrado</span>
                    <span className="font-mono text-xl font-bold text-[#113240] dark:text-white">{total}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-[6px] border border-slate-200 dark:border-slate-800">
                    <span className="font-mono text-[10px] uppercase text-emerald-600 block font-semibold">Confirmadas</span>
                    <span className="font-mono text-xl font-bold text-emerald-600">{confirmadas}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-[6px] border border-slate-200 dark:border-slate-800">
                    <span className="font-mono text-[10px] uppercase text-amber-600 block font-semibold">Pendentes</span>
                    <span className="font-mono text-xl font-bold text-amber-600">{pendentes}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-[6px] border border-slate-200 dark:border-slate-800">
                    <span className="font-mono text-[10px] uppercase text-[#226380] block font-semibold">Com Hospedagem</span>
                    <span className="font-mono text-xl font-bold text-[#226380]">{hospedagem}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Tabela de Inscrições com Opções Detalhadas */}
          {(() => {
            const inscricoesFiltradas = respostas.filter(r => {
              const matchForm = filtroInscricaoFormId === 'todos' || r.formulario_id === filtroInscricaoFormId;
              const matchStatus = filtroInscricaoStatus === 'todos' || r.status === filtroInscricaoStatus;
              const buscaLower = buscaInscricao.toLowerCase();
              const matchBusca = !buscaInscricao || 
                (r.protocolo && r.protocolo.toLowerCase().includes(buscaLower)) ||
                (r.dados?.nome_religioso && r.dados.nome_religioso.toLowerCase().includes(buscaLower)) ||
                (r.dados?.nome_completo && r.dados.nome_completo.toLowerCase().includes(buscaLower)) ||
                (r.dados?.comunidade_atual && r.dados.comunidade_atual.toLowerCase().includes(buscaLower)) ||
                (r.dados?.telefone_whatsapp && r.dados.telefone_whatsapp.toLowerCase().includes(buscaLower));
              return matchForm && matchStatus && matchBusca;
            });

            if (inscricoesFiltradas.length === 0) {
              return (
                <div className="bg-white dark:bg-[#161b22] p-12 text-center rounded-[8px] border border-slate-200 dark:border-slate-800 space-y-3">
                  <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <h3 className="font-cinzel text-base font-bold text-[#113240] dark:text-white">
                    Nenhuma Inscrição Encontrada
                  </h3>
                  <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto">
                    Não há registros com os filtros atuais. Tente selecionar outro formulário ou limpar a busca.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroInscricaoFormId('todos');
                      setFiltroInscricaoStatus('todos');
                      setBuscaInscricao('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono uppercase font-semibold text-[#226380] bg-[#226380]/10 hover:bg-[#226380]/20 rounded-[6px] transition-colors cursor-pointer"
                  >
                    <span>Limpar Filtros</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="bg-white dark:bg-[#161b22] rounded-[8px] border border-[#113240]/10 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase text-[#113240] dark:text-white">
                    Confrades Inscritos ({inscricoesFiltradas.length})
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    Clique em &quot;Ver Ficha Completa&quot; para inspecionar todas as respostas
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#113240]/5 dark:bg-[#12161f] border-b border-[#113240]/10 dark:border-white/10 text-[11px] font-mono uppercase text-[#226380] dark:text-[#A3C3C7] font-semibold">
                        <th className="p-3">Protocolo</th>
                        <th className="p-3">Confrade & Grau</th>
                        <th className="p-3">Formulário</th>
                        <th className="p-3">Comunidade</th>
                        <th className="p-3">Hospedagem & Chegada</th>
                        <th className="p-3">Opções & Restrições</th>
                        <th className="p-3">Contato</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {inscricoesFiltradas.map(r => {
                        const formVinculado = formularios.find(f => f.id === r.formulario_id);
                        return (
                          <tr key={r.id} className="hover:bg-[#226380]/5 transition-colors font-sans">
                            <td className="p-3 font-mono text-[11px] font-bold text-[#226380] dark:text-[#A3C3C7] whitespace-nowrap">
                              {r.protocolo}
                              <span className="block text-[9px] text-slate-400 font-normal">
                                {new Date(r.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </td>
                            <td className="p-3">
                              <strong className="block text-slate-900 dark:text-white font-medium">
                                {r.dados?.nome_religioso || r.dados?.nome_completo || 'Sem identificação'}
                              </strong>
                              {r.dados?.nome_completo && r.dados?.nome_completo !== r.dados?.nome_religioso && (
                                <span className="block text-[10px] text-slate-500">
                                  {r.dados?.nome_completo}
                                </span>
                              )}
                              {r.dados?.grau_ordem && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded font-mono text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                  {r.dados?.grau_ordem}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-[11px] text-slate-700 dark:text-slate-300 max-w-[180px] truncate" title={formVinculado?.titulo || r.formulario_id}>
                              {formVinculado?.titulo || r.formulario_id}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400 text-[11px]">
                              {r.dados?.comunidade_atual || '-'}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                              {r.dados?.necessita_hospedagem ? (
                                <div>
                                  <span className="font-bold text-[#226380] dark:text-[#A3C3C7]">Sim</span>
                                  {r.dados?.tipo_quarto && (
                                    <span className="block text-[9px] text-slate-500">{r.dados?.tipo_quarto}</span>
                                  )}
                                  {r.dados?.data_chegada && (
                                    <span className="block text-[9px] text-slate-500">Chegada: {r.dados?.data_chegada}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">Não</span>
                              )}
                            </td>
                            <td className="p-3 text-[10px] text-slate-600 dark:text-slate-400 max-w-[180px]">
                              {r.dados?.restricao_alimentar && (
                                <div className="truncate" title={r.dados?.restricao_alimentar}>
                                  <strong className="text-amber-700 dark:text-amber-400">Alimentação: </strong>
                                  <span>{r.dados?.restricao_alimentar}</span>
                                </div>
                              )}
                              {r.dados?.tamanho_paramento && (
                                <div>
                                  <strong>Paramento: </strong>{r.dados?.tamanho_paramento}
                                </div>
                              )}
                              {r.dados?.meio_transporte && (
                                <div className="truncate" title={r.dados?.meio_transporte}>
                                  <strong>Transp: </strong>{r.dados?.meio_transporte}
                                </div>
                              )}
                              {!r.dados?.restricao_alimentar && !r.dados?.tamanho_paramento && !r.dados?.meio_transporte && (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                              <div>{r.dados?.telefone_whatsapp || '-'}</div>
                              {r.dados?.email && (
                                <div className="text-[9px] text-slate-400 truncate max-w-[120px]" title={r.dados?.email}>
                                  {r.dados?.email}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`inline-block font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                                r.status === 'Confirmada'
                                  ? 'bg-[#113240]/10 text-[#113240] dark:text-[#A3C3C7] border-[#113240]/20'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setFichaPrintResposta(r)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold text-[#226380] dark:text-[#A3C3C7] bg-[#226380]/10 hover:bg-[#226380]/20 border border-[#226380]/30 rounded-[4px] transition-colors cursor-pointer"
                                  title="Ver ficha completa de respostas e imprimir"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Ver Ficha</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFichaPrintResposta(r)}
                                  className="p-1 rounded-[4px] text-slate-500 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Imprimir ficha individual"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* ABA 2: NUMERAÇÃO & PREFIXOS DE ATOS */}
      {tabAtiva === 'atos' && (
        <form onSubmit={handleSalvarConfiguracoes} className="bg-white dark:bg-[#161b22] p-6 rounded-[8px] border border-[#113240]/10 dark:border-white/10 shadow-sm space-y-6">
          <div className="border-b border-[#113240]/10 dark:border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#226380] dark:text-[#A3C3C7]" />
                <h2 className="font-cinzel text-lg font-bold text-[#113240] dark:text-white">
                  Livros Canônicos & Protocolo Sequencial de Atos
                </h2>
              </div>
              <p className="text-xs text-[#474747] dark:text-[#86868b] mt-0.5 font-sans">
                Configure as regras de chancela, indexação e numeração automática de decretos, portarias, circulares e formulários emitidos pela Secretaria Provincial.
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase font-bold text-[#226380] dark:text-[#A3C3C7] bg-[#226380]/10 px-2.5 py-1 rounded-[4px] border border-[#226380]/20 self-start sm:self-auto">
              Chancelas Oficiais BRM
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Decretos Provinciais */}
            <div className="p-4 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/10 dark:border-white/10 space-y-3.5 border-l-4 border-l-[#226380]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#226380] dark:text-[#A3C3C7] font-bold block">
                    Livro Canônico I
                  </span>
                  <span className="font-cinzel text-sm font-bold text-[#113240] dark:text-white">
                    Decretos Provinciais
                  </span>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] font-bold border border-[#226380]/20">
                  {configuracao.prefixo_decretos}
                </span>
              </div>

              {/* Preview de Chancela */}
              <div className="p-2.5 rounded-[4px] bg-[#113240]/5 dark:bg-white/5 border border-[#113240]/10 dark:border-white/10 flex items-center justify-between font-mono">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Exemplo da Chancela:</span>
                <span className="text-xs font-bold text-[#113240] dark:text-[#A3C3C7] tracking-wider">
                  {configuracao.prefixo_decretos}-{new Date().getFullYear()}/{String(configuracao.numero_atual_decretos).padStart(3, '0')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400 mb-1">Prefixo Oficial</label>
                  <input
                    type="text"
                    value={configuracao.prefixo_decretos}
                    onChange={(e) => setConfiguracao(prev => ({ ...prev, prefixo_decretos: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-[#1a2230] border border-[#113240]/20 dark:border-white/15 focus:border-[#226380] outline-none font-mono text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400 mb-1">Último Número Emitido</label>
                  <input
                    type="number"
                    value={configuracao.numero_atual_decretos}
                    onChange={(e) => setConfiguracao(prev => ({ ...prev, numero_atual_decretos: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-[#1a2230] border border-[#113240]/20 dark:border-white/15 focus:border-[#226380] outline-none font-mono text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Portarias & Nomeações */}
            <div className="p-4 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/10 dark:border-white/10 space-y-3.5 border-l-4 border-l-[#226380]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#226380] dark:text-[#A3C3C7] font-bold block">
                    Livro Canônico II
                  </span>
                  <span className="font-cinzel text-sm font-bold text-[#113240] dark:text-white">
                    Portarias & Provisões
                  </span>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] font-bold border border-[#226380]/20">
                  {configuracao.prefixo_portarias}
                </span>
              </div>

              {/* Preview de Chancela */}
              <div className="p-2.5 rounded-[4px] bg-[#113240]/5 dark:bg-white/5 border border-[#113240]/10 dark:border-white/10 flex items-center justify-between font-mono">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Exemplo da Chancela:</span>
                <span className="text-xs font-bold text-[#113240] dark:text-[#A3C3C7] tracking-wider">
                  {configuracao.prefixo_portarias}-{new Date().getFullYear()}/{String(configuracao.numero_atual_portarias).padStart(3, '0')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400 mb-1">Prefixo Oficial</label>
                  <input
                    type="text"
                    value={configuracao.prefixo_portarias}
                    onChange={(e) => setConfiguracao(prev => ({ ...prev, prefixo_portarias: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-[#1a2230] border border-[#113240]/20 dark:border-white/15 focus:border-[#226380] outline-none font-mono text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400 mb-1">Último Número Emitido</label>
                  <input
                    type="number"
                    value={configuracao.numero_atual_portarias}
                    onChange={(e) => setConfiguracao(prev => ({ ...prev, numero_atual_portarias: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-[#1a2230] border border-[#113240]/20 dark:border-white/15 focus:border-[#226380] outline-none font-mono text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Circulares Provinciais */}
            <div className="p-4 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/10 dark:border-white/10 space-y-3.5 border-l-4 border-l-[#226380]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#226380] dark:text-[#A3C3C7] font-bold block">
                    Livro Canônico III
                  </span>
                  <span className="font-cinzel text-sm font-bold text-[#113240] dark:text-white">
                    Cartas Circulares
                  </span>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] font-bold border border-[#226380]/20">
                  {configuracao.prefixo_circulares}
                </span>
              </div>

              {/* Preview de Chancela */}
              <div className="p-2.5 rounded-[4px] bg-[#113240]/5 dark:bg-white/5 border border-[#113240]/10 dark:border-white/10 flex items-center justify-between font-mono">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Exemplo da Chancela:</span>
                <span className="text-xs font-bold text-[#113240] dark:text-[#A3C3C7] tracking-wider">
                  {configuracao.prefixo_circulares}-{new Date().getFullYear()}/{String(configuracao.numero_atual_circulares).padStart(3, '0')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400 mb-1">Prefixo Oficial</label>
                  <input
                    type="text"
                    value={configuracao.prefixo_circulares}
                    onChange={(e) => setConfiguracao(prev => ({ ...prev, prefixo_circulares: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-[#1a2230] border border-[#113240]/20 dark:border-white/15 focus:border-[#226380] outline-none font-mono text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400 mb-1">Último Número Emitido</label>
                  <input
                    type="number"
                    value={configuracao.numero_atual_circulares}
                    onChange={(e) => setConfiguracao(prev => ({ ...prev, numero_atual_circulares: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-[#1a2230] border border-[#113240]/20 dark:border-white/15 focus:border-[#226380] outline-none font-mono text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Fichas & Formulários */}
            <div className="p-4 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/10 dark:border-white/10 space-y-3.5 border-l-4 border-l-[#226380]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#226380] dark:text-[#A3C3C7] font-bold block">
                    Livro Canônico IV
                  </span>
                  <span className="font-cinzel text-sm font-bold text-[#113240] dark:text-white">
                    Formulários & Fichas Oficiais
                  </span>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] font-bold border border-[#226380]/20">
                  {configuracao.prefixo_formularios}
                </span>
              </div>

              {/* Preview de Chancela */}
              <div className="p-2.5 rounded-[4px] bg-[#113240]/5 dark:bg-white/5 border border-[#113240]/10 dark:border-white/10 flex items-center justify-between font-mono">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Exemplo da Chancela:</span>
                <span className="text-xs font-bold text-[#113240] dark:text-[#A3C3C7] tracking-wider">
                  {configuracao.prefixo_formularios}-{new Date().getFullYear()}/{String(configuracao.numero_atual_formularios).padStart(3, '0')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400 mb-1">Prefixo Oficial</label>
                  <input
                    type="text"
                    value={configuracao.prefixo_formularios}
                    onChange={(e) => setConfiguracao(prev => ({ ...prev, prefixo_formularios: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-[#1a2230] border border-[#113240]/20 dark:border-white/15 focus:border-[#226380] outline-none font-mono text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400 mb-1">Último Número Emitido</label>
                  <input
                    type="number"
                    value={configuracao.numero_atual_formularios}
                    onChange={(e) => setConfiguracao(prev => ({ ...prev, numero_atual_formularios: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-[#1a2230] border border-[#113240]/20 dark:border-white/15 focus:border-[#226380] outline-none font-mono text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#113240]/10 dark:border-white/10 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border border-[#113240] bg-[#113240] text-white hover:bg-[#226380] hover:border-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Salvar Regras de Numeração Canônica</span>
            </button>
          </div>
        </form>
      )}

      {/* ABA 3: PAPEL TIMBRADO OFICIAL */}
      {tabAtiva === 'timbrado' && (
        <form onSubmit={handleSalvarConfiguracoes} className="bg-white dark:bg-[#161b22] p-6 rounded-[8px] border border-[#113240]/10 dark:border-white/10 shadow-sm space-y-6">
          <div className="border-b border-[#113240]/10 dark:border-white/10 pb-4">
            <h2 className="font-cinzel text-lg font-bold text-[#113240] dark:text-white">
              Identidade Visual & Textos do Papel Timbrado Canônico
            </h2>
            <p className="text-xs text-[#474747] dark:text-[#86868b] mt-0.5 font-sans">
              Personalize o cabeçalho canônico oficial, o lema congregacional em latim e os dados de expediente que figuram em todos os formulários e certidões emitidas pela Província.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                Cabeçalho Institucional Principal (1ª Linha)
              </label>
              <input
                type="text"
                value={configuracao.cabecalho_institucional}
                onChange={(e) => setConfiguracao(prev => ({ ...prev, cabecalho_institucional: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/20 dark:border-white/15 outline-none font-cinzel text-sm focus:border-[#226380]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                Subtítulo Provincial (2ª Linha)
              </label>
              <input
                type="text"
                value={configuracao.subtitulo_provincia}
                onChange={(e) => setConfiguracao(prev => ({ ...prev, subtitulo_provincia: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/20 dark:border-white/15 outline-none font-sans focus:border-[#226380]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                Órgão Emissor / Secretaria (3ª Linha)
              </label>
              <input
                type="text"
                value={configuracao.orgao_emissor}
                onChange={(e) => setConfiguracao(prev => ({ ...prev, orgao_emissor: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/20 dark:border-white/15 outline-none font-sans focus:border-[#226380]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                Lema Oficial no Rodapé (Latim)
              </label>
              <input
                type="text"
                value={configuracao.lema_oficial}
                onChange={(e) => setConfiguracao(prev => ({ ...prev, lema_oficial: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/20 dark:border-white/15 outline-none font-cinzel text-sm focus:border-[#226380]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                E-mail Oficial de Contato da Secretaria
              </label>
              <input
                type="email"
                value={configuracao.email_secretaria}
                onChange={(e) => setConfiguracao(prev => ({ ...prev, email_secretaria: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/20 dark:border-white/15 outline-none font-mono focus:border-[#226380]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                Telefone da Secretaria / Sede Provincial
              </label>
              <input
                type="text"
                value={configuracao.telefone_secretaria}
                onChange={(e) => setConfiguracao(prev => ({ ...prev, telefone_secretaria: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/20 dark:border-white/15 outline-none font-mono focus:border-[#226380]"
              />
            </div>

            <div className="flex items-center gap-3 pt-4 md:col-span-2">
              <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/10 dark:border-white/10 w-full hover:border-[#226380]/40 transition-colors">
                <input
                  type="checkbox"
                  checked={configuracao.exibir_marca_dagua}
                  onChange={(e) => setConfiguracao(prev => ({ ...prev, exibir_marca_dagua: e.target.checked }))}
                  className="accent-[#226380] w-4 h-4 rounded-[4px] cursor-pointer"
                />
                <div>
                  <span className="text-xs font-mono font-semibold text-[#113240] dark:text-white block">
                    Exibir marca d'água com brasão dehoniano em impressões
                  </span>
                  <span className="text-[11px] text-slate-500 font-sans block">
                    Insere sutilmente a cruz dehoniana em 3% de opacidade no centro geométrico de todas as páginas timbradas.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[#113240]/10 dark:border-white/10 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border border-[#113240] bg-[#113240] text-white hover:bg-[#226380] hover:border-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Salvar Papel Timbrado Canônico</span>
            </button>
          </div>
        </form>
      )}

      {/* ABA 4: NOTIFICAÇÕES & E-MAILS */}
      {tabAtiva === 'notificacoes' && (
        <form onSubmit={handleSalvarConfiguracoes} className="bg-white dark:bg-[#161b22] p-6 rounded-[8px] border border-[#113240]/10 dark:border-white/10 shadow-sm space-y-6">
          <div className="border-b border-[#113240]/10 dark:border-white/10 pb-4">
            <h2 className="font-cinzel text-lg font-bold text-[#113240] dark:text-white">
              Notificações Automáticas & E-mails de Confirmação
            </h2>
            <p className="text-xs text-[#474747] dark:text-[#86868b] mt-0.5 font-sans">
              Comportamento de comunicação automática com confrades e secretários provinciais após o preenchimento de inscrições.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-[6px] border border-[#113240]/10 dark:border-white/10 flex items-start gap-3.5 bg-[#fafafa] dark:bg-[#12161f] hover:border-[#226380]/40 transition-colors">
              <input
                type="checkbox"
                id="notif_confrade"
                checked={configuracao.notificar_confrade_email}
                onChange={(e) => setConfiguracao(prev => ({ ...prev, notificar_confrade_email: e.target.checked }))}
                className="accent-[#226380] w-4 h-4 rounded-[4px] mt-0.5 cursor-pointer"
              />
              <label htmlFor="notif_confrade" className="cursor-pointer space-y-1">
                <span className="text-xs font-bold text-[#113240] dark:text-white block font-sans">
                  Enviar comprovante por e-mail ao confrade inscrito
                </span>
                <p className="text-[11px] text-[#474747] dark:text-[#86868b] font-sans">
                  Dispara automaticamente um e-mail com a ficha timbrada em PDF e o número de protocolo canônico para o e-mail informado na inscrição.
                </p>
              </label>
            </div>

            <div className="p-4 rounded-[6px] border border-[#113240]/10 dark:border-white/10 flex items-start gap-3.5 bg-[#fafafa] dark:bg-[#12161f] hover:border-[#226380]/40 transition-colors">
              <input
                type="checkbox"
                id="notif_sec"
                checked={configuracao.notificar_secretario_nova_resposta}
                onChange={(e) => setConfiguracao(prev => ({ ...prev, notificar_secretario_nova_resposta: e.target.checked }))}
                className="accent-[#226380] w-4 h-4 rounded-[4px] mt-0.5 cursor-pointer"
              />
              <label htmlFor="notif_sec" className="cursor-pointer space-y-1">
                <span className="text-xs font-bold text-[#113240] dark:text-white block font-sans">
                  Avisar Secretaria Provincial a cada nova inscrição
                </span>
                <p className="text-[11px] text-[#474747] dark:text-[#86868b] font-sans">
                  Envia um alerta para <span className="font-mono text-[#226380] font-semibold">{configuracao.email_secretaria}</span> sempre que um religioso confirmar presença em evento com vagas limitadas.
                </p>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[#113240]/10 dark:border-white/10 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border border-[#113240] bg-[#113240] text-white hover:bg-[#226380] hover:border-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Salvar Preferências de Notificação</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODAL CONSTRUTOR DE VARIÁVEIS (PADRÃO 3 COLUNAS - IDÊNTICO À FOTO DO USUÁRIO) */}
      {/* ========================================================================= */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#113240]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161b22] w-full max-w-5xl max-h-[92vh] rounded-[8px] border border-[#113240]/20 dark:border-white/15 shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header do Construtor */}
            <div className="p-4 sm:p-5 border-b border-[#113240]/10 dark:border-white/10 flex items-start justify-between gap-3 bg-[#fafafa] dark:bg-[#12161f]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-[4px] bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] border border-[#226380]/30 shadow-2xs">
                    {formCodigo || 'NOVO FORMULÁRIO'}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-[4px]">
                    {totalSelecionadas} variáveis selecionadas
                  </span>
                </div>
                <h2 className="font-cinzel text-lg sm:text-xl font-bold text-[#113240] dark:text-white tracking-tight">
                  Construtor de Variáveis & Campos da Ficha
                </h2>
                <p className="text-xs text-[#474747] dark:text-[#86868b] font-sans">
                  Marque as caixas de seleção abaixo para incluir as variáveis no formulário timbrado oficial.
                </p>
              </div>

              <button
                onClick={() => setIsBuilderOpen(false)}
                className="p-1.5 rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Metadados Básicos do Formulário */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/10 dark:border-white/10">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                    Título Oficial do Formulário *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitulo}
                    onChange={(e) => setFormTitulo(e.target.value)}
                    placeholder="Ex: Ficha de Inscrição - Retiro Anual dos Presbíteros 2026"
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-[#1a2230] border border-[#113240]/20 dark:border-white/15 focus:border-[#226380] outline-none text-xs text-slate-900 dark:text-white font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                    Código de Protocolo
                  </label>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    placeholder="FORM-2026/001"
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-[#1a2230] border border-[#113240]/20 dark:border-white/15 focus:border-[#226380] outline-none text-xs font-mono font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                    Orientações e Instruções (exibidas no cabeçalho do timbrado)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescricao}
                    onChange={(e) => setFormDescricao(e.target.value)}
                    placeholder="Orientações aos confrades sobre prazos, documentos e acolhida..."
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-[#1a2230] border border-[#113240]/20 dark:border-white/15 focus:border-[#226380] outline-none text-xs text-slate-900 dark:text-white resize-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                    Limite de Vagas (opcional)
                  </label>
                  <input
                    type="number"
                    value={formLimiteVagas}
                    onChange={(e) => setFormLimiteVagas(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex: 50"
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-[#1a2230] border border-[#113240]/20 dark:border-white/15 focus:border-[#226380] outline-none text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                    Prazo Limite para Inscrição
                  </label>
                  <input
                    type="date"
                    value={formPrazo}
                    onChange={(e) => setFormPrazo(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-[#1a2230] border border-[#113240]/20 dark:border-white/15 focus:border-[#226380] outline-none text-xs font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAtivo}
                      onChange={(e) => setFormAtivo(e.target.checked)}
                      className="accent-[#226380] w-4 h-4 rounded-[4px] cursor-pointer"
                    />
                    <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                      Formulário Ativo para Receber Inscrições
                    </span>
                  </label>
                </div>
              </div>

              {/* Barra de Presets & Filtro de Variáveis */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-mono text-slate-400 text-[11px] uppercase mr-1 font-semibold">Predefinições Rápidas:</span>
                    <button
                      type="button"
                      onClick={() => aplicarPreset('retiro')}
                      className="px-2.5 py-1 rounded-[4px] bg-[#226380]/10 hover:bg-[#226380]/20 text-[#226380] dark:text-[#A3C3C7] border border-[#226380]/30 font-mono text-[11px] font-semibold transition-colors cursor-pointer motion-press"
                    >
                      Preset Retiro Espiritual
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarPreset('assembleia')}
                      className="px-2.5 py-1 rounded-[4px] bg-[#226380]/10 hover:bg-[#226380]/20 text-[#226380] dark:text-[#A3C3C7] border border-[#226380]/30 font-mono text-[11px] font-semibold transition-colors cursor-pointer motion-press"
                    >
                      Preset Assembleia Provincial
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarPreset('todos')}
                      className="px-2.5 py-1 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-mono text-[11px] transition-colors cursor-pointer motion-press"
                    >
                      Selecionar Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarPreset('nenhum')}
                      className="px-2.5 py-1 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700 font-mono text-[11px] transition-colors cursor-pointer motion-press"
                    >
                      Limpar
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsNovaVariavelModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-[#226380] dark:text-[#A3C3C7] hover:underline font-semibold cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Criar Variável Personalizada</span>
                  </button>
                </div>

                {/* Filtro de Busca e Categoria */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={buscaVariavel}
                      onChange={(e) => setBuscaVariavel(e.target.value)}
                      placeholder="Filtrar variáveis por nome ou finalidade..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-[6px] bg-white dark:bg-[#12161f] border border-[#113240]/20 dark:border-white/15 text-xs outline-none focus:border-[#226380]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    {categoriasDisponiveis.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFiltroCategoriaVariavel(cat)}
                        className={`px-2.5 py-1 rounded-[4px] text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer border ${
                          filtroCategoriaVariavel === cat
                            ? 'bg-[#113240] text-white border-[#113240] dark:bg-[#226380] dark:border-[#226380] font-semibold'
                            : 'bg-white dark:bg-[#12161f] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* GRID DE VARIÁVEIS EM 3 COLUNAS (IDÊNTICO AO LAYOUT DA FOTO DE REFERÊNCIA) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {variaveisFiltradas.map((campo) => {
                  const estado = camposSelecionados[campo.id] || { selecionado: false, obrigatorio: false };
                  const isChecked = estado.selecionado;

                  return (
                    <div
                      key={campo.id}
                      onClick={() => toggleVariavel(campo.id)}
                      className={`relative p-3.5 rounded-[6px] transition-all cursor-pointer select-none flex flex-col justify-between gap-2.5 ${
                        isChecked
                          ? 'border-2 border-[#226380] bg-[#226380]/8 dark:bg-[#226380]/20 shadow-xs'
                          : 'border border-black/10 dark:border-white/10 bg-[#fafafa] dark:bg-[#12161f] hover:border-[#226380]/50 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="accent-[#226380] w-4 h-4 rounded-[4px] mt-0.5 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className={`text-xs font-semibold block truncate leading-tight ${
                            isChecked ? 'text-[#113240] dark:text-white' : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {campo.label}
                          </span>
                          <span className="text-[10px] font-mono text-[#226380] dark:text-[#A3C3C7] block mt-0.5 uppercase tracking-wider font-medium">
                            {campo.categoria} • {campo.tipo}
                          </span>
                        </div>
                      </div>

                      {/* Controle de Obrigatório vs Opcional (quando marcado) */}
                      {isChecked && (
                        <div className="pt-2 border-t border-[#226380]/20 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-500 font-medium">Regra de validação:</span>
                          <button
                            type="button"
                            onClick={(e) => toggleObrigatorio(campo.id, e)}
                            className={`px-2 py-0.5 rounded-[4px] font-bold uppercase transition-colors cursor-pointer border ${
                              estado.obrigatorio
                                ? 'bg-[#F2C894]/30 text-[#854d0e] dark:bg-[#F2C894]/25 dark:text-[#F2C894] border-[#F2C894]/80 shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                            }`}
                            title="Clique para alternar entre Obrigatório e Opcional"
                          >
                            {estado.obrigatorio ? '★ Obrigatório' : 'Opcional'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {variaveisFiltradas.length === 0 && (
                <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-[6px]">
                  <p className="text-xs text-slate-500 font-mono">Nenhuma variável encontrada com os filtros selecionados.</p>
                </div>
              )}
            </div>

            {/* Footer do Construtor (Botões Cancelar e Salvar - como na foto) */}
            <div className="p-4 sm:p-5 border-t border-[#113240]/10 dark:border-white/10 bg-[#fafafa] dark:bg-[#12161f] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs font-mono text-slate-500">
                <span className="text-[#113240] dark:text-white font-bold">{totalSelecionadas}</span> variáveis comporão a ficha timbrada.
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-4 py-2 rounded-[6px] text-xs font-mono uppercase font-semibold text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer border border-slate-300 dark:border-slate-700 motion-press"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveFormulario}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border border-[#113240] bg-[#113240] text-white hover:bg-[#226380] hover:border-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Salvar & Concluir Formulário</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CRIAR VARIÁVEL PERSONALIZADA */}
      {/* ========================================================================= */}
      {isNovaVariavelModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#113240]/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#161b22] w-full max-w-md rounded-[8px] border border-[#113240]/20 dark:border-white/15 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#113240]/10 dark:border-white/10 pb-3">
              <h3 className="font-cinzel text-base font-bold text-[#113240] dark:text-white">
                Nova Variável Canônica Personalizada
              </h3>
              <button 
                onClick={() => setIsNovaVariavelModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCriarNovaVariavel} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome / Rótulo da Variável *
                </label>
                <input
                  type="text"
                  required
                  value={novaVarNome}
                  onChange={(e) => setNovaVarNome(e.target.value)}
                  placeholder="Ex: Número do Quarto no Seminário"
                  className="w-full px-3 py-1.5 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/20 dark:border-white/15 outline-none font-sans focus:border-[#226380]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={novaVarCategoria}
                    onChange={(e) => setNovaVarCategoria(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/20 dark:border-white/15 outline-none font-mono focus:border-[#226380]"
                  >
                    <option value="Identificação">Identificação</option>
                    <option value="Contato">Contato</option>
                    <option value="Acolhida & Hospedagem">Acolhida & Hospedagem</option>
                    <option value="Saúde & Alimentação">Saúde & Alimentação</option>
                    <option value="Liturgia & Geral">Liturgia & Geral</option>
                    <option value="Específico">Específico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo do Campo
                  </label>
                  <select
                    value={novaVarTipo}
                    onChange={(e) => setNovaVarTipo(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/20 dark:border-white/15 outline-none font-mono focus:border-[#226380]"
                  >
                    <option value="text">Texto Curto</option>
                    <option value="textarea">Texto Longo (Área)</option>
                    <option value="date">Data</option>
                    <option value="select">Seleção (Dropdown)</option>
                    <option value="boolean">Sim / Não</option>
                    <option value="tel">Telefone</option>
                    <option value="email">E-mail</option>
                  </select>
                </div>
              </div>

              {novaVarTipo === 'select' && (
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">
                    Opções (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={novaVarOpcoes}
                    onChange={(e) => setNovaVarOpcoes(e.target.value)}
                    placeholder="Opção 1, Opção 2, Opção 3"
                    className="w-full px-3 py-1.5 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/20 dark:border-white/15 outline-none font-sans focus:border-[#226380]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-slate-500 mb-1">
                  Texto de Ajuda / Placeholder
                </label>
                <input
                  type="text"
                  value={novaVarPlaceholder}
                  onChange={(e) => setNovaVarPlaceholder(e.target.value)}
                  placeholder="Ex: Instrução de preenchimento para o confrade..."
                  className="w-full px-3 py-1.5 rounded-[6px] bg-[#fafafa] dark:bg-[#12161f] border border-[#113240]/20 dark:border-white/15 outline-none font-sans focus:border-[#226380]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="nova_obr"
                  checked={novaVarObrigatoria}
                  onChange={(e) => setNovaVarObrigatoria(e.target.checked)}
                  className="accent-[#226380] w-4 h-4 rounded-[4px] cursor-pointer"
                />
                <label htmlFor="nova_obr" className="text-xs font-mono cursor-pointer text-slate-700 dark:text-slate-300">
                  Campo de preenchimento obrigatório por padrão
                </label>
              </div>

              <div className="pt-3 border-t border-[#113240]/10 dark:border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNovaVariavelModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[6px] text-xs font-mono uppercase font-semibold text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer border border-slate-300 dark:border-slate-700 motion-press"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[6px] text-xs font-mono uppercase font-semibold text-white bg-[#113240] hover:bg-[#226380] transition-all cursor-pointer shadow-sm motion-press"
                >
                  Adicionar ao Construtor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SecretariaConfiguracoes;

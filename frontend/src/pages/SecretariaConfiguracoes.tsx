import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Edit3, Trash2, CheckCircle2, AlertCircle, 
  X, Eye, Copy, Download, Share2, Layers, Settings, Hash, 
  Mail, BookmarkCheck, Check, Sparkles, SlidersHorizontal, 
  HelpCircle, ArrowRight, Printer, Users, ExternalLink, ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { FormularioTimbrado } from '../components/FormularioTimbrado';
import type { VariavelCampo } from '../components/FormularioTimbrado';
import { staggerStyle } from '../hooks/useMotion';

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
  { id: 'comunidade_atual', label: 'Comunidade Atual / Residência', categoria: 'Identificação', obrigatorio: true, tipo: 'text', placeholder: 'Ex: Convento SCJ de Taubaté ou Casa Padre Dehon' },
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
  cabecalho_institucional: 'CONGREGAÇÃO DOS PADRES DO SAGRADO CORAÇÃO DE JESUS',
  subtitulo_provincia: 'PROVÍNCIA BRASIL MERIDIONAL • CURIA PROVINCIAL',
  orgao_emissor: 'SECRETARIA PROVINCIAL & ATOS CANÔNICOS',
  lema_oficial: '«COR JESU, IN TE CONFIDO • SINT UNUM»',
  email_secretaria: 'secretaria@dehonianosbrm.org.br',
  telefone_secretaria: '(47) 3351-1244',
  notificar_confrade_email: true,
  notificar_secretario_nova_resposta: true,
  exibir_marca_dagua: true
};

export const SecretariaConfiguracoes: React.FC = () => {
  const [tabAtiva, setTabAtiva] = useState<'formularios' | 'atos' | 'timbrado' | 'notificacoes'>('formularios');
  const [formularios, setFormularios] = useState<FormularioSecretaria[]>([]);
  const [respostas, setRespostas] = useState<RespostaFormulario[]>([]);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoSecretaria>(CONFIG_PADRAO);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

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

  // Modal de Pré-Visualização Timbrada
  const [previewForm, setPreviewForm] = useState<FormularioSecretaria | null>(null);

  // Modal de Respostas de um Formulário
  const [verRespostasForm, setVerRespostasForm] = useState<FormularioSecretaria | null>(null);

  // Link copiado feedback
  const [linkCopiadoId, setLinkCopiadoId] = useState<string | null>(null);

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
        await supabase
          .from('secretaria_formularios')
          .update(atualizado)
          .eq('id', editingFormId);
      } catch (e) {
        console.warn('Atualizando formulário localmente:', e);
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
        await supabase
          .from('secretaria_formularios')
          .insert([novoForm]);
      } catch (e) {
        console.warn('Inserindo formulário localmente:', e);
      }

      const lista = [novoForm, ...formularios];
      persistirFormularios(lista);
      mostrarAlerta('sucesso', 'Novo formulário criado e pronto para uso!');
    }

    setIsBuilderOpen(false);
  };

  // Excluir Formulário
  const handleDeleteForm = async (f: FormularioSecretaria) => {
    if (!window.confirm(`Deseja realmente excluir o formulário "${f.titulo}"? Esta ação removerá a estrutura do formulário.`)) return;

    try {
      await supabase.from('secretaria_formularios').delete().eq('id', f.id);
    } catch (e) {
      console.warn('Excluindo formulário localmente:', e);
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
      await supabase
        .from('secretaria_configuracoes')
        .upsert([{ id: configuracao.id || 'default-secretaria-cfg', ...configuracao }]);
    } catch (err) {
      console.warn('Salvando configurações localmente:', err);
    }

    persistirConfiguracao(configuracao);
    mostrarAlerta('sucesso', 'Configurações institucionais salvas com sucesso!');
  };

  // Exportar Respostas em CSV
  const exportarCSV = (form: FormularioSecretaria) => {
    const respDoForm = respostas.filter(r => r.formulario_id === form.id);
    if (respDoForm.length === 0) {
      alert('Não há respostas registradas para este formulário ainda.');
      return;
    }

    const cabecalhos = ['Protocolo', 'Data Submissão', 'Status', ...form.campos.map(c => c.label)];
    const linhas = respDoForm.map(r => {
      const vals = form.campos.map(c => {
        const v = r.dados[c.id];
        if (v === undefined || v === null) return '""';
        return `"${String(v).replace(/"/g, '""')}"`;
      });
      return [`"${r.protocolo}"`, `"${new Date(r.created_at).toLocaleDateString('pt-BR')}"`, `"${r.status}"`, ...vals].join(',');
    });

    const csvContent = '\uFEFF' + [cabecalhos.join(','), ...linhas].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inscricoes_${form.id}_${new Date().toISOString().split('T')[0]}.csv`;
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

  return (
    <div className="space-y-6">
      {/* Header Institucional */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#e5e5ea] dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#226380] dark:text-[#A3C3C7]">
              Curia Provincial BRM • Secretaria & Atos
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
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
              : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
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

      {/* Navegação por Abas Lapidadas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        <button
          onClick={() => setTabAtiva('formularios')}
          className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            tabAtiva === 'formularios'
              ? 'border-[#226380] text-[#113240] dark:text-[#A3C3C7]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Construtor de Formulários ({formularios.length})</span>
        </button>

        <button
          onClick={() => setTabAtiva('atos')}
          className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            tabAtiva === 'atos'
              ? 'border-[#226380] text-[#113240] dark:text-[#A3C3C7]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>Numeração de Atos & Prefixos</span>
        </button>

        <button
          onClick={() => setTabAtiva('timbrado')}
          className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            tabAtiva === 'timbrado'
              ? 'border-[#226380] text-[#113240] dark:text-[#A3C3C7]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Papel Timbrado Oficial</span>
        </button>

        <button
          onClick={() => setTabAtiva('notificacoes')}
          className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            tabAtiva === 'notificacoes'
              ? 'border-[#226380] text-[#113240] dark:text-[#A3C3C7]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Notificações & E-mails</span>
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}

      {/* ABA 1: CONSTRUTOR & LISTA DE FORMULÁRIOS */}
      {tabAtiva === 'formularios' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-[#161b22] p-4 rounded-[6px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-[#113240] dark:text-white">Formulários de Inscrição Canônica Ativos:</span>
              <p className="mt-0.5">Estes modelos são associáveis a eventos da Agenda Provincial ou utilizáveis individualmente via link público timbrado.</p>
            </div>
            <button
              onClick={handleOpenCreateForm}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase font-semibold text-[#226380] dark:text-[#A3C3C7] bg-[#226380]/10 hover:bg-[#226380]/20 rounded-[6px] border border-[#226380]/30 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Novo Modelo</span>
            </button>
          </div>

          {formularios.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#161b22] rounded-[6px] border border-slate-200 dark:border-slate-800">
              <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="font-cinzel text-base font-bold text-slate-700 dark:text-slate-300">Nenhum formulário cadastrado</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Crie um modelo de inscrição usando o construtor de variáveis para conectar a eventos e assembleias provinciais.
              </p>
              <button
                onClick={handleOpenCreateForm}
                className="mt-4 px-4 py-2 text-xs font-mono uppercase font-semibold text-white bg-[#113240] hover:bg-[#226380] rounded-[6px] transition-all cursor-pointer"
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
                    className="p-5 bg-white dark:bg-[#161b22] rounded-[6px] border border-slate-200 dark:border-slate-800 hover:border-[#226380]/60 transition-all shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {form.codigo && (
                          <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-[4px] bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] border border-[#226380]/20">
                            {form.codigo}
                          </span>
                        )}
                        <span className={`text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-[4px] border ${
                          form.ativo 
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' 
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}>
                          {form.ativo ? 'Ativo / Recebendo Inscrições' : 'Inativo / Encerrado'}
                        </span>
                        {form.limite_vagas && (
                          <span className="text-[10px] font-mono text-slate-500">
                            Limite: {form.limite_vagas} vagas
                          </span>
                        )}
                      </div>

                      <h3 className="font-cinzel text-base font-bold text-[#113240] dark:text-white">
                        {form.titulo}
                      </h3>

                      {form.descricao && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 font-sans">
                          {form.descricao}
                        </p>
                      )}

                      {/* Lista resumida de variáveis */}
                      <div className="pt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase text-slate-400">Variáveis ({form.campos.length}):</span>
                        {form.campos.slice(0, 5).map(campo => (
                          <span key={campo.id} className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {campo.label} {campo.obrigatorio && '*'}
                          </span>
                        ))}
                        {form.campos.length > 5 && (
                          <span className="text-[10px] font-mono text-[#226380] dark:text-[#A3C3C7]">
                            +{form.campos.length - 5} campos
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações do Formulário */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                      {/* Respostas / Inscrições */}
                      <button
                        onClick={() => setVerRespostasForm(form)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-[6px] border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Visualizar inscrições efetuadas"
                      >
                        <Users className="w-3.5 h-3.5 text-[#226380]" />
                        <span>Inscrições ({respostasCont})</span>
                      </button>

                      {/* Pré-visualizar no Papel Timbrado */}
                      <button
                        onClick={() => setPreviewForm(form)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-[6px] border border-[#226380]/30 bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] hover:bg-[#226380]/20 transition-colors cursor-pointer"
                        title="Pré-visualizar como documento timbrado"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Timbrado</span>
                      </button>

                      {/* Copiar Link */}
                      <button
                        onClick={() => handleCopiarLink(form.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded-[6px] border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Copiar link público para divulgar aos confrades"
                      >
                        {linkCopiadoId === form.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{linkCopiadoId === form.id ? 'Copiado' : 'Link'}</span>
                      </button>

                      {/* Editar Campos */}
                      <button
                        onClick={() => handleOpenEditForm(form)}
                        className="p-1.5 rounded-[6px] border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-[#113240] dark:hover:text-white transition-colors cursor-pointer"
                        title="Editar formulário e variáveis"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Excluir */}
                      <button
                        onClick={() => handleDeleteForm(form)}
                        className="p-1.5 rounded-[6px] border border-red-200 dark:border-red-900/40 hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
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

      {/* ABA 2: NUMERAÇÃO & PREFIXOS DE ATOS */}
      {tabAtiva === 'atos' && (
        <form onSubmit={handleSalvarConfiguracoes} className="bg-white dark:bg-[#161b22] p-6 rounded-[6px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="font-cinzel text-lg font-bold text-[#113240] dark:text-white">
              Sistemas de Numeração Canônica & Prefixos de Atos
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Configure as regras de indexação e sequenciamento automático de decretos, portarias, circulares e formulários emitidos pela Secretaria Provincial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Decretos Provinciais */}
            <div className="p-4 rounded-[6px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-cinzel text-sm font-bold text-[#113240] dark:text-white">Decretos Provinciais</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7]">
                  Ex: {configuracao.prefixo_decretos}-{new Date().getFullYear()}/{String(configuracao.numero_atual_decretos).padStart(3, '0')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">Prefixo Oficial</label>
                  <input
                    type="text"
                    value={configuracao.prefixo_decretos}
                    onChange={(e) => setConfiguracao(prev => ({ ...prev, prefixo_decretos: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">Último Número Emitido</label>
                  <input
                    type="number"
                    value={configuracao.numero_atual_decretos}
                    onChange={(e) => setConfiguracao(prev => ({ ...prev, numero_atual_decretos: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Portarias & Nomeações */}
            <div className="p-4 rounded-[6px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-cinzel text-sm font-bold text-[#113240] dark:text-white">Portarias & Provisões</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7]">
                  Ex: {configuracao.prefixo_portarias}-{new Date().getFullYear()}/{String(configuracao.numero_atual_portarias).padStart(3, '0')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">Prefixo Oficial</label>
                  <input
                    type="text"
                    value={configuracao.prefixo_portarias}
                    onChange={(e) => setConfiguracao(prev => ({ ...prev, prefixo_portarias: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">Último Número Emitido</label>
                  <input
                    type="number"
                    value={configuracao.numero_atual_portarias}
                    onChange={(e) => setConfiguracao(prev => ({ ...prev, numero_atual_portarias: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Circulares Provinciais */}
            <div className="p-4 rounded-[6px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-cinzel text-sm font-bold text-[#113240] dark:text-white">Cartas Circulares</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7]">
                  Ex: {configuracao.prefixo_circulares}-{new Date().getFullYear()}/{String(configuracao.numero_atual_circulares).padStart(3, '0')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">Prefixo Oficial</label>
                  <input
                    type="text"
                    value={configuracao.prefixo_circulares}
                    onChange={(e) => setConfiguracao(prev => ({ ...prev, prefixo_circulares: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">Último Número Emitido</label>
                  <input
                    type="number"
                    value={configuracao.numero_atual_circulares}
                    onChange={(e) => setConfiguracao(prev => ({ ...prev, numero_atual_circulares: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Fichas & Formulários */}
            <div className="p-4 rounded-[6px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-cinzel text-sm font-bold text-[#113240] dark:text-white">Formulários & Fichas</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7]">
                  Ex: {configuracao.prefixo_formularios}-{new Date().getFullYear()}/{String(configuracao.numero_atual_formularios).padStart(3, '0')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">Prefixo Oficial</label>
                  <input
                    type="text"
                    value={configuracao.prefixo_formularios}
                    onChange={(e) => setConfiguracao(prev => ({ ...prev, prefixo_formularios: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">Último Número Emitido</label>
                  <input
                    type="number"
                    value={configuracao.numero_atual_formularios}
                    onChange={(e) => setConfiguracao(prev => ({ ...prev, numero_atual_formularios: Number(e.target.value) }))}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono uppercase tracking-wider font-semibold border border-[#113240] bg-[#113240] text-white hover:bg-[#226380] hover:border-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Salvar Regras de Numeração</span>
            </button>
          </div>
        </form>
      )}

      {/* ABA 3: PAPEL TIMBRADO OFICIAL */}
      {tabAtiva === 'timbrado' && (
        <form onSubmit={handleSalvarConfiguracoes} className="bg-white dark:bg-[#161b22] p-6 rounded-[6px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="font-cinzel text-lg font-bold text-[#113240] dark:text-white">
              Identidade Visual & Textos do Papel Timbrado Canônico
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Personalize o cabeçalho canônico, o lema congregacional em latim e os dados de expediente que figuram em todos os formulários e certidões emitidas.
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
                className="w-full px-3.5 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none font-cinzel text-sm"
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
                className="w-full px-3.5 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none"
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
                className="w-full px-3.5 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                Lema Oficial no Rodapé
              </label>
              <input
                type="text"
                value={configuracao.lema_oficial}
                onChange={(e) => setConfiguracao(prev => ({ ...prev, lema_oficial: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none font-cinzel text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                E-mail de Contato da Secretaria
              </label>
              <input
                type="email"
                value={configuracao.email_secretaria}
                onChange={(e) => setConfiguracao(prev => ({ ...prev, email_secretaria: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1">
                Telefone da Curia Provincial
              </label>
              <input
                type="text"
                value={configuracao.telefone_secretaria}
                onChange={(e) => setConfiguracao(prev => ({ ...prev, telefone_secretaria: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configuracao.exibir_marca_dagua}
                  onChange={(e) => setConfiguracao(prev => ({ ...prev, exibir_marca_dagua: e.target.checked }))}
                  className="accent-[#226380] w-4 h-4 rounded-[4px] cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                  Exibir marca d'água com brasão dehoniano em impressões
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono uppercase tracking-wider font-semibold border border-[#113240] bg-[#113240] text-white hover:bg-[#226380] hover:border-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Salvar Papel Timbrado</span>
            </button>
          </div>
        </form>
      )}

      {/* ABA 4: NOTIFICAÇÕES & E-MAILS */}
      {tabAtiva === 'notificacoes' && (
        <form onSubmit={handleSalvarConfiguracoes} className="bg-white dark:bg-[#161b22] p-6 rounded-[6px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="font-cinzel text-lg font-bold text-[#113240] dark:text-white">
              Notificações Automáticas & E-mails de Confirmação
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Comportamento de comunicação automática com confrades e secretários provinciais após o preenchimento de inscrições.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-[6px] border border-slate-200 dark:border-slate-800 flex items-start gap-3 bg-slate-50 dark:bg-slate-900/40">
              <input
                type="checkbox"
                id="notif_confrade"
                checked={configuracao.notificar_confrade_email}
                onChange={(e) => setConfiguracao(prev => ({ ...prev, notificar_confrade_email: e.target.checked }))}
                className="accent-[#226380] w-4 h-4 rounded-[4px] mt-0.5 cursor-pointer"
              />
              <label htmlFor="notif_confrade" className="cursor-pointer space-y-1">
                <span className="text-xs font-bold text-[#113240] dark:text-white block">
                  Enviar comprovante por e-mail ao confrade
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Dispara automaticamente um e-mail com a ficha timbrada em PDF e o número de protocolo canônico para o e-mail informado na inscrição.
                </p>
              </label>
            </div>

            <div className="p-4 rounded-[6px] border border-slate-200 dark:border-slate-800 flex items-start gap-3 bg-slate-50 dark:bg-slate-900/40">
              <input
                type="checkbox"
                id="notif_sec"
                checked={configuracao.notificar_secretario_nova_resposta}
                onChange={(e) => setConfiguracao(prev => ({ ...prev, notificar_secretario_nova_resposta: e.target.checked }))}
                className="accent-[#226380] w-4 h-4 rounded-[4px] mt-0.5 cursor-pointer"
              />
              <label htmlFor="notif_sec" className="cursor-pointer space-y-1">
                <span className="text-xs font-bold text-[#113240] dark:text-white block">
                  Avisar Secretaria Provincial a cada nova inscrição
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Envia um alerta para <span className="font-mono text-[#226380]">{configuracao.email_secretaria}</span> sempre que um religioso confirmar presença em evento com vagas limitadas.
                </p>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono uppercase tracking-wider font-semibold border border-[#113240] bg-[#113240] text-white hover:bg-[#226380] hover:border-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161b22] w-full max-w-5xl max-h-[92vh] rounded-[6px] border border-slate-300 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header do Construtor */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#226380]/10 text-[#226380] dark:text-[#A3C3C7] border border-[#226380]/20">
                    {formCodigo || 'NOVO FORMULÁRIO'}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {totalSelecionadas} variáveis selecionadas
                  </span>
                </div>
                <h2 className="font-cinzel text-lg sm:text-xl font-bold text-[#113240] dark:text-white">
                  Construtor de Variáveis & Campos da Ficha
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  Marque as caixas de seleção abaixo para incluir as variáveis no formulário timbrado oficial.
                </p>
              </div>

              <button
                onClick={() => setIsBuilderOpen(false)}
                className="p-1.5 rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Metadados Básicos do Formulário */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-[6px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
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
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none text-xs text-slate-900 dark:text-white font-sans"
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
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none text-xs font-mono text-slate-900 dark:text-white"
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
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none text-xs text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">
                    Limite de Vagas (opcional)
                  </label>
                  <input
                    type="number"
                    value={formLimiteVagas}
                    onChange={(e) => setFormLimiteVagas(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex: 50"
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-500 mb-1">
                    Prazo Limite para Inscrição
                  </label>
                  <input
                    type="date"
                    value={formPrazo}
                    onChange={(e) => setFormPrazo(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none text-xs font-mono"
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
                    <span className="font-mono text-slate-400 text-[11px] uppercase mr-1">Predefinições Rápidas:</span>
                    <button
                      type="button"
                      onClick={() => aplicarPreset('retiro')}
                      className="px-2.5 py-1 rounded-[4px] bg-[#226380]/10 hover:bg-[#226380]/20 text-[#226380] dark:text-[#A3C3C7] border border-[#226380]/30 font-mono text-[11px] transition-colors cursor-pointer"
                    >
                      Preset Retiro Espiritual
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarPreset('assembleia')}
                      className="px-2.5 py-1 rounded-[4px] bg-[#226380]/10 hover:bg-[#226380]/20 text-[#226380] dark:text-[#A3C3C7] border border-[#226380]/30 font-mono text-[11px] transition-colors cursor-pointer"
                    >
                      Preset Assembleia Provincial
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarPreset('todos')}
                      className="px-2.5 py-1 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-mono text-[11px] transition-colors cursor-pointer"
                    >
                      Selecionar Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarPreset('nenhum')}
                      className="px-2.5 py-1 rounded-[4px] bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700 font-mono text-[11px] transition-colors cursor-pointer"
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
                      className="w-full pl-9 pr-3 py-1.5 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs outline-none focus:border-[#226380]"
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
                            ? 'bg-[#113240] text-white border-[#113240] dark:bg-[#226380] dark:border-[#226380]'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* GRID DE VARIÁVEIS EM 3 COLUNAS (IDÊNTICO AO LAYOUT DA FOTO) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {variaveisFiltradas.map((campo) => {
                  const estado = camposSelecionados[campo.id] || { selecionado: false, obrigatorio: false };
                  const isChecked = estado.selecionado;

                  return (
                    <div
                      key={campo.id}
                      onClick={() => toggleVariavel(campo.id)}
                      className={`relative p-3.5 rounded-[6px] border transition-all cursor-pointer select-none flex flex-col justify-between gap-2.5 ${
                        isChecked
                          ? 'border-[#226380] bg-[#226380]/5 dark:bg-[#226380]/15 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#1a202c]/50 hover:border-slate-300 dark:hover:border-slate-700'
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
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block mt-0.5">
                            {campo.categoria} • {campo.tipo}
                          </span>
                        </div>
                      </div>

                      {/* Controle de Obrigatório vs Opcional (quando marcado) */}
                      {isChecked && (
                        <div className="pt-2 border-t border-[#226380]/15 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-500">Regra de validação:</span>
                          <button
                            type="button"
                            onClick={(e) => toggleObrigatorio(campo.id, e)}
                            className={`px-2 py-0.5 rounded-[4px] font-bold uppercase transition-colors cursor-pointer border ${
                              estado.obrigatorio
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
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
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs font-mono text-slate-500">
                <span className="text-[#113240] dark:text-white font-bold">{totalSelecionadas}</span> variáveis comporão a ficha timbrada.
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-4 py-2 rounded-[6px] text-xs font-mono uppercase font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-300 dark:border-slate-700 motion-press"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveFormulario}
                  className="inline-flex items-center gap-2 px-6 py-2 text-xs font-mono uppercase tracking-wider font-semibold border border-[#113240] bg-[#113240] text-white hover:bg-[#226380] hover:border-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm motion-press"
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
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#161b22] w-full max-w-md rounded-[6px] border border-slate-300 dark:border-slate-700 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-cinzel text-base font-bold text-[#113240] dark:text-white">
                Nova Variável Personalizada
              </h3>
              <button onClick={() => setIsNovaVariavelModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCriarNovaVariavel} className="space-y-3 text-xs">
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
                  className="w-full px-3 py-1.5 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none"
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
                    className="w-full px-3 py-1.5 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none font-mono"
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
                    className="w-full px-3 py-1.5 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none font-mono"
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
                    className="w-full px-3 py-1.5 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none"
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
                  className="w-full px-3 py-1.5 rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
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

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNovaVariavelModalOpen(false)}
                  className="px-3 py-1.5 rounded-[6px] text-xs font-mono uppercase text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[6px] text-xs font-mono uppercase font-semibold text-white bg-[#113240] hover:bg-[#226380]"
                >
                  Adicionar ao Construtor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PRÉ-VISUALIZAÇÃO DE DOCUMENTO TIMBRADO */}
      {/* ========================================================================= */}
      {previewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0d1117] w-full max-w-4xl max-h-[94vh] rounded-[6px] border border-slate-300 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden">
            
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase font-bold text-[#226380] dark:text-[#A3C3C7]">
                  Pré-visualização Oficial no Padrão Timbrado BRM
                </span>
              </div>
              <button
                onClick={() => setPreviewForm(null)}
                className="p-1 rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-[#090d16]">
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

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
              <button
                onClick={() => setPreviewForm(null)}
                className="px-4 py-1.5 text-xs font-mono uppercase font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-[6px] hover:bg-slate-200"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL RESPOSTAS / INSCRIÇÕES RECEBIDAS */}
      {/* ========================================================================= */}
      {verRespostasForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161b22] w-full max-w-5xl max-h-[92vh] rounded-[6px] border border-slate-300 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden">
            
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50 dark:bg-slate-900/50">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-[#226380] dark:text-[#A3C3C7]">
                  Protocolos & Inscrições Recebidas
                </span>
                <h2 className="font-cinzel text-lg font-bold text-[#113240] dark:text-white">
                  {verRespostasForm.titulo}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportarCSV(verRespostasForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-[6px] transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
                <button
                  onClick={() => setVerRespostasForm(null)}
                  className="p-1.5 rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {(() => {
                const lista = respostas.filter(r => r.formulario_id === verRespostasForm.id);
                if (lista.length === 0) {
                  return (
                    <div className="p-12 text-center text-slate-400 font-mono text-xs">
                      Nenhuma inscrição protocolada para este formulário até o momento.
                    </div>
                  );
                }

                return (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-[6px] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono uppercase text-slate-500">
                            <th className="p-3">Protocolo</th>
                            <th className="p-3">Data / Hora</th>
                            <th className="p-3">Nome / Confrade</th>
                            <th className="p-3">Comunidade</th>
                            <th className="p-3">Hospedagem</th>
                            <th className="p-3">Contato</th>
                            <th className="p-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {lista.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors font-sans">
                              <td className="p-3 font-mono text-[11px] font-bold text-[#226380] dark:text-[#A3C3C7]">
                                {r.protocolo}
                              </td>
                              <td className="p-3 font-mono text-[11px] text-slate-500">
                                {new Date(r.created_at).toLocaleString('pt-BR')}
                              </td>
                              <td className="p-3 font-medium text-[#113240] dark:text-white">
                                {r.dados.nome_religioso || r.dados.nome_completo || 'Sem identificação'}
                                {r.dados.grau_ordem && (
                                  <span className="block text-[10px] text-slate-400 font-mono">
                                    {r.dados.grau_ordem}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400">
                                {r.dados.comunidade_atual || '-'}
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                                {r.dados.necessita_hospedagem ? `Sim (${r.dados.tipo_quarto || 'Quarto'})` : 'Não'}
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                                {r.dados.telefone_whatsapp || r.dados.email || '-'}
                              </td>
                              <td className="p-3 text-right">
                                <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                  {r.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <button
                onClick={() => setVerRespostasForm(null)}
                className="px-4 py-1.5 text-xs font-mono uppercase font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[6px] hover:bg-slate-100"
              >
                Fechar Inscrições
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SecretariaConfiguracoes;
